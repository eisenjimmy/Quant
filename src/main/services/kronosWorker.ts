import {
  spawn,
  type ChildProcessWithoutNullStreams,
} from 'node:child_process';
import path from 'node:path';
import type { ForecastErrorCode } from '../../shared/forecast';
import {
  encodeForecastWorkerRequest,
  isForecastWorkerEvent,
  type ForecastWorkerEvent,
  type ForecastWorkerRunPayload,
} from '../../shared/forecastWorker';

export function sanitizedForecastWorkerEnvironment(
  inherited: NodeJS.ProcessEnv,
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  const environment = { ...inherited };
  for (const key of Object.keys(environment)) {
    if (
      key.startsWith('QUANT_FORECAST_WORKER_') ||
      key.startsWith('QUANT_KRONOS_')
    ) {
      delete environment[key];
    }
  }
  return { ...environment, ...overrides, PYTHONUNBUFFERED: '1' };
}

const DEFAULT_ACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
const DEFAULT_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_STARTUP_TIMEOUT_MS = 10_000;
const MAX_STDOUT_BUFFER_BYTES = 8 * 1024 * 1024;

type HealthEvent = Extract<ForecastWorkerEvent, { type: 'health' }>;
type CompletedEvent = Extract<ForecastWorkerEvent, { type: 'completed' }>;
type ProgressEvent = Extract<ForecastWorkerEvent, { type: 'progress' }>;

export interface KronosWorkerOptions {
  scriptPath?: string;
  pythonExecutable?: string;
  workerExecutable?: string;
  activityTimeoutMs?: number;
  idleTimeoutMs?: number;
  startupTimeoutMs?: number;
  workerEnv?: Record<string, string>;
  onStderr?: (message: string) => void;
}

export interface KronosWorkerLaunch {
  command: string;
  args: string[];
  cwd: string;
  bundled: boolean;
}

export function resolveKronosWorkerLaunch(
  options: Pick<
    KronosWorkerOptions,
    'scriptPath' | 'pythonExecutable' | 'workerExecutable'
  >,
): KronosWorkerLaunch {
  const workerExecutable = options.workerExecutable?.trim();
  if (workerExecutable) {
    const command = path.resolve(workerExecutable);
    return {
      command,
      args: [],
      cwd: path.dirname(command),
      bundled: true,
    };
  }
  const scriptPath = options.scriptPath?.trim();
  if (!scriptPath) {
    throw new Error('Forecast worker script path is required in development.');
  }
  const resolvedScriptPath = path.resolve(scriptPath);
  return {
    command:
      options.pythonExecutable?.trim() ||
      process.env.QUANT_FORECAST_PYTHON?.trim() ||
      (process.platform === 'win32' ? 'python' : 'python3'),
    args: [resolvedScriptPath],
    cwd: path.dirname(resolvedScriptPath),
    bundled: false,
  };
}

interface PendingHealth {
  resolve: (event: HealthEvent) => void;
  reject: (error: WorkerClientFailure) => void;
  timer: NodeJS.Timeout;
}

interface ActiveRun {
  jobId: string;
  resolve: (event: CompletedEvent) => void;
  reject: (error: WorkerClientFailure) => void;
  onProgress?: (event: ProgressEvent) => void;
  timer: NodeJS.Timeout;
  lastStageRank: number;
  lastCompletedPaths: number;
  lastPercent: number;
  lastMessage: string;
  lastPreparationPhase?: ProgressEvent['preparationPhase'];
}

interface StartWaiter {
  resolve: () => void;
  reject: (error: WorkerClientFailure) => void;
  timer: NodeJS.Timeout;
}

interface ShutdownWaiter {
  resolve: () => void;
  timer: NodeJS.Timeout;
}

let requestCounter = 0;

function nextRequestId(prefix: string): string {
  requestCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${requestCounter.toString(36)}`;
}

export class WorkerClientFailure extends Error {
  constructor(
    readonly code: ForecastErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'WorkerClientFailure';
  }
}

export class KronosWorker {
  private readonly launch: KronosWorkerLaunch;
  private readonly activityTimeoutMs: number;
  private readonly idleTimeoutMs: number;
  private readonly startupTimeoutMs: number;
  private readonly workerEnv: Record<string, string>;
  private readonly onStderr: (message: string) => void;
  private child: ChildProcessWithoutNullStreams | null = null;
  private startPromise: Promise<void> | null = null;
  private startWaiter: StartWaiter | null = null;
  private shutdownWaiter: ShutdownWaiter | null = null;
  private shutdownPromise: Promise<void> | null = null;
  private expectedExit = false;
  private stdoutBuffer = '';
  private stderrBuffer = '';
  private readonly healthRequests = new Map<string, PendingHealth>();
  private activeRun: ActiveRun | null = null;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(options: KronosWorkerOptions) {
    this.launch = resolveKronosWorkerLaunch(options);
    this.activityTimeoutMs =
      options.activityTimeoutMs ?? DEFAULT_ACTIVITY_TIMEOUT_MS;
    this.idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    this.startupTimeoutMs =
      options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
    this.workerEnv = options.workerEnv ?? {};
    this.onStderr = options.onStderr ?? (() => {});
  }

  get isRunning(): boolean {
    return Boolean(
      this.child &&
        this.child.exitCode === null &&
        !this.child.killed,
    );
  }

  async healthCheck(): Promise<HealthEvent> {
    await this.ensureStarted();
    const requestId = nextRequestId('health');
    return new Promise<HealthEvent>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.healthRequests.delete(requestId);
        reject(
          new WorkerClientFailure(
            'FORECAST_TIMEOUT',
            'Forecast worker health check timed out.',
          ),
        );
        this.failWorker(
          new WorkerClientFailure(
            'FORECAST_TIMEOUT',
            'Forecast worker stopped responding during health check.',
          ),
          true,
        );
      }, this.startupTimeoutMs);
      this.healthRequests.set(requestId, { resolve, reject, timer });
      try {
        this.send({ type: 'health', requestId });
      } catch (error) {
        clearTimeout(timer);
        this.healthRequests.delete(requestId);
        reject(this.asWorkerFailure(error, 'WORKER_CRASHED'));
      }
    });
  }

  async run(
    jobId: string,
    payload: ForecastWorkerRunPayload,
    onProgress?: (event: ProgressEvent) => void,
  ): Promise<CompletedEvent> {
    await this.ensureStarted();
    if (this.activeRun) {
      throw new WorkerClientFailure(
        'FORECAST_ALREADY_RUNNING',
        `Forecast worker is already running ${this.activeRun.jobId}.`,
      );
    }
    this.clearIdleTimer();
    return new Promise<CompletedEvent>((resolve, reject) => {
      const run: ActiveRun = {
        jobId,
        resolve,
        reject,
        onProgress,
        timer: setTimeout(() => {}, 1),
        lastStageRank: -1,
        lastCompletedPaths: 0,
        lastPercent: 0,
        lastMessage: '',
        lastPreparationPhase: undefined,
      };
      clearTimeout(run.timer);
      run.timer = this.createRunTimer();
      this.activeRun = run;
      try {
        this.send({ type: 'run', jobId, payload });
      } catch (error) {
        this.finishRunFailure(this.asWorkerFailure(error, 'WORKER_CRASHED'));
      }
    });
  }

  async cancel(jobId: string): Promise<void> {
    await this.ensureStarted();
    if (!this.activeRun || this.activeRun.jobId !== jobId) {
      throw new WorkerClientFailure(
        'JOB_CANCELLED',
        'No matching worker job is active.',
      );
    }
    this.send({ type: 'cancel', jobId });
  }

  async shutdown(): Promise<void> {
    this.clearIdleTimer();
    const child = this.child;
    if (!child) return;
    if (this.shutdownPromise) return this.shutdownPromise;
    this.expectedExit = true;
    const requestId = nextRequestId('shutdown');
    this.shutdownPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill();
      }, Math.min(this.startupTimeoutMs, 5_000));
      this.shutdownWaiter = { resolve, timer };
      try {
        this.send({ type: 'shutdown', requestId });
      } catch {
        child.kill();
      }
    });
    return this.shutdownPromise;
  }

  terminate(): void {
    this.clearIdleTimer();
    const error = new WorkerClientFailure(
      'JOB_CANCELLED',
      'Forecast worker terminated during application shutdown.',
    );
    this.failWorker(error, true);
  }

  private async ensureStarted(): Promise<void> {
    if (this.shutdownPromise) {
      await this.shutdownPromise;
    }
    if (this.isRunning && !this.startPromise) return;
    if (this.startPromise) return this.startPromise;
    this.clearIdleTimer();
    this.expectedExit = false;
    this.stdoutBuffer = '';
    this.stderrBuffer = '';

    this.startPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new WorkerClientFailure(
          'FORECAST_TIMEOUT',
          'Forecast worker startup timed out.',
        );
        reject(error);
        this.failWorker(error, true);
      }, this.startupTimeoutMs);
      this.startWaiter = { resolve, reject, timer };
    });

    let child: ChildProcessWithoutNullStreams;
    try {
      const childEnvironment = sanitizedForecastWorkerEnvironment(
        process.env,
        this.workerEnv,
      );
      child = spawn(this.launch.command, this.launch.args, {
        cwd: this.launch.cwd,
        env: childEnvironment,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      const failure = this.workerSpawnFailure(error);
      this.failWorker(failure, false);
      throw failure;
    }
    this.child = child;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => this.handleStdout(chunk));
    child.stderr.on('data', (chunk: string) => this.handleStderr(chunk));
    child.on('error', (error) => {
      this.failWorker(this.workerSpawnFailure(error), true);
    });
    child.on('close', (code, signal) => {
      this.handleClose(child, code, signal);
    });
    return this.startPromise;
  }

  private handleStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    if (Buffer.byteLength(this.stdoutBuffer, 'utf8') > MAX_STDOUT_BUFFER_BYTES) {
      this.failWorker(
        new WorkerClientFailure(
          'WORKER_CRASHED',
          'Forecast worker emitted an oversized protocol message.',
        ),
        true,
      );
      return;
    }
    let newline = this.stdoutBuffer.indexOf('\n');
    while (newline >= 0) {
      const line = this.stdoutBuffer.slice(0, newline).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
      if (line) this.handleLine(line);
      newline = this.stdoutBuffer.indexOf('\n');
    }
  }

  private handleStderr(chunk: string): void {
    this.stderrBuffer += chunk;
    let newline = this.stderrBuffer.indexOf('\n');
    while (newline >= 0) {
      const line = this.stderrBuffer.slice(0, newline).trim();
      this.stderrBuffer = this.stderrBuffer.slice(newline + 1);
      if (line) this.onStderr(line);
      newline = this.stderrBuffer.indexOf('\n');
    }
  }

  private handleLine(line: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      this.failWorker(
        new WorkerClientFailure(
          'WORKER_CRASHED',
          'Forecast worker emitted malformed NDJSON.',
        ),
        true,
      );
      return;
    }
    if (!isForecastWorkerEvent(parsed)) {
      this.failWorker(
        new WorkerClientFailure(
          'WORKER_CRASHED',
          'Forecast worker emitted an invalid protocol event.',
        ),
        true,
      );
      return;
    }
    this.handleEvent(parsed);
  }

  private handleEvent(event: ForecastWorkerEvent): void {
    if (event.type === 'ready') {
      const waiter = this.startWaiter;
      if (waiter) {
        clearTimeout(waiter.timer);
        this.startWaiter = null;
        this.startPromise = null;
        waiter.resolve();
      }
      return;
    }
    if (event.type === 'health') {
      const pending = this.healthRequests.get(event.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.healthRequests.delete(event.requestId);
      pending.resolve(event);
      this.scheduleIdleShutdown();
      return;
    }
    if (event.type === 'progress') {
      if (!this.activeRun || this.activeRun.jobId !== event.jobId) return;
      const stageRank = progressStageRank(event.stage);
      if (
        stageRank < this.activeRun.lastStageRank ||
        event.completedPaths < this.activeRun.lastCompletedPaths ||
        event.percent < this.activeRun.lastPercent
      ) {
        this.failWorker(
          new WorkerClientFailure(
            'OUTPUT_VALIDATION_FAILED',
            'Forecast worker progress regressed.',
          ),
          true,
        );
        return;
      }
      const advanced =
        stageRank > this.activeRun.lastStageRank ||
        event.completedPaths > this.activeRun.lastCompletedPaths ||
        event.percent > this.activeRun.lastPercent ||
        event.message !== this.activeRun.lastMessage ||
        event.preparationPhase !== this.activeRun.lastPreparationPhase;
      if (!advanced) return;
      this.activeRun.lastStageRank = stageRank;
      this.activeRun.lastCompletedPaths = event.completedPaths;
      this.activeRun.lastPercent = event.percent;
      this.activeRun.lastMessage = event.message;
      this.activeRun.lastPreparationPhase = event.preparationPhase;
      clearTimeout(this.activeRun.timer);
      this.activeRun.timer = this.createRunTimer();
      try {
        this.activeRun.onProgress?.(event);
      } catch (error) {
        this.onStderr(
          `Forecast progress listener failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return;
    }
    if (event.type === 'completed') {
      if (!this.activeRun || this.activeRun.jobId !== event.jobId) return;
      const run = this.activeRun;
      clearTimeout(run.timer);
      this.activeRun = null;
      run.resolve(event);
      this.scheduleIdleShutdown();
      return;
    }
    if (event.type === 'failed') {
      if (!this.activeRun || this.activeRun.jobId !== event.jobId) return;
      this.finishRunFailure(new WorkerClientFailure(event.code, event.message));
      return;
    }
    if (event.type === 'cancelled') {
      if (!this.activeRun || this.activeRun.jobId !== event.jobId) return;
      this.finishRunFailure(
        new WorkerClientFailure('JOB_CANCELLED', event.message),
      );
      return;
    }
    if (event.type === 'protocol-error') {
      const error = new WorkerClientFailure(event.code, event.message);
      if (this.activeRun) {
        this.finishRunFailure(error);
      } else {
        this.failWorker(error, true);
      }
    }
  }

  private createRunTimer(): NodeJS.Timeout {
    return setTimeout(() => {
      this.failWorker(
        new WorkerClientFailure(
          'FORECAST_TIMEOUT',
          'Forecast worker timed out without progress.',
        ),
        true,
      );
    }, this.activityTimeoutMs);
  }

  private finishRunFailure(error: WorkerClientFailure): void {
    const run = this.activeRun;
    if (!run) return;
    clearTimeout(run.timer);
    this.activeRun = null;
    run.reject(error);
    this.scheduleIdleShutdown();
  }

  private send(request: Parameters<typeof encodeForecastWorkerRequest>[0]): void {
    const child = this.child;
    if (!child || child.stdin.destroyed || !child.stdin.writable) {
      throw new WorkerClientFailure(
        'WORKER_CRASHED',
        'Forecast worker input is unavailable.',
      );
    }
    child.stdin.write(encodeForecastWorkerRequest(request));
  }

  private handleClose(
    child: ChildProcessWithoutNullStreams,
    code: number | null,
    signal: NodeJS.Signals | null,
  ): void {
    if (this.child !== child) return;
    this.child = null;
    this.startPromise = null;
    this.stdoutBuffer = '';
    if (this.stderrBuffer.trim()) this.onStderr(this.stderrBuffer.trim());
    this.stderrBuffer = '';
    this.clearIdleTimer();
    if (this.shutdownWaiter) {
      clearTimeout(this.shutdownWaiter.timer);
      const resolve = this.shutdownWaiter.resolve;
      this.shutdownWaiter = null;
      this.shutdownPromise = null;
      this.expectedExit = false;
      this.rejectPendingForShutdown();
      resolve();
      return;
    }
    if (this.expectedExit) {
      this.expectedExit = false;
      return;
    }
    this.failWorker(
      new WorkerClientFailure(
        'WORKER_CRASHED',
        `Forecast worker exited unexpectedly${
          code !== null ? ` with code ${code}` : signal ? ` after ${signal}` : ''
        }.`,
      ),
      false,
    );
  }

  private failWorker(error: WorkerClientFailure, kill: boolean): void {
    const child = this.child;
    this.child = null;
    this.startPromise = null;
    this.stdoutBuffer = '';
    this.stderrBuffer = '';
    this.clearIdleTimer();
    if (this.startWaiter) {
      clearTimeout(this.startWaiter.timer);
      const reject = this.startWaiter.reject;
      this.startWaiter = null;
      reject(error);
    }
    for (const pending of this.healthRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.healthRequests.clear();
    if (this.activeRun) {
      const run = this.activeRun;
      clearTimeout(run.timer);
      this.activeRun = null;
      run.reject(error);
    }
    if (this.shutdownWaiter) {
      clearTimeout(this.shutdownWaiter.timer);
      const resolve = this.shutdownWaiter.resolve;
      this.shutdownWaiter = null;
      this.shutdownPromise = null;
      resolve();
    }
    if (kill && child && !child.killed) child.kill();
  }

  private rejectPendingForShutdown(): void {
    const error = new WorkerClientFailure(
      'JOB_CANCELLED',
      'Forecast worker shut down before the request completed.',
    );
    if (this.startWaiter) {
      clearTimeout(this.startWaiter.timer);
      const reject = this.startWaiter.reject;
      this.startWaiter = null;
      this.startPromise = null;
      reject(error);
    }
    for (const pending of this.healthRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.healthRequests.clear();
    if (this.activeRun) {
      const run = this.activeRun;
      clearTimeout(run.timer);
      this.activeRun = null;
      run.reject(error);
    }
  }

  private scheduleIdleShutdown(): void {
    this.clearIdleTimer();
    if (
      !this.child ||
      this.activeRun ||
      this.healthRequests.size > 0 ||
      this.idleTimeoutMs <= 0
    ) {
      return;
    }
    this.idleTimer = setTimeout(() => {
      void this.shutdown();
    }, this.idleTimeoutMs);
    this.idleTimer.unref();
  }

  private clearIdleTimer(): void {
    if (!this.idleTimer) return;
    clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private workerSpawnFailure(error: unknown): WorkerClientFailure {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      isNodeError(error) && error.code === 'ENOENT'
        ? this.launch.bundled
          ? 'ENGINE_SETUP_FAILED'
          : 'PYTHON_NOT_AVAILABLE'
        : 'WORKER_CRASHED';
    return new WorkerClientFailure(
      code,
      code === 'PYTHON_NOT_AVAILABLE'
        ? `Python executable was not found: ${this.launch.command}.`
        : code === 'ENGINE_SETUP_FAILED'
          ? `Packaged forecast runtime was not found: ${this.launch.command}.`
        : `Forecast worker could not start: ${message}`,
    );
  }

  private asWorkerFailure(
    error: unknown,
    fallbackCode: ForecastErrorCode,
  ): WorkerClientFailure {
    if (error instanceof WorkerClientFailure) return error;
    return new WorkerClientFailure(
      fallbackCode,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function progressStageRank(stage: ProgressEvent['stage']): number {
  if (stage === 'preparing-engine') return 0;
  if (stage === 'running-paths') return 1;
  return 2;
}
