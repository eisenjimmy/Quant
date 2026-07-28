import {
  FORECAST_V1,
  forecastPercentForCompletedPaths,
  isActiveForecastStage,
  validateForecastProgressUpdate,
} from '../../shared/forecast';
import type {
  ForecastCancelResult,
  ForecastErrorCode,
  ForecastHistoryData,
  ForecastJobStage,
  ForecastPreparationPhase,
  ForecastProgressEvent,
  ForecastRecord,
  ForecastRunRequest,
  ForecastRunResult,
} from '../../shared/forecast';
import {
  ForecastCalendarFailure,
  nextUsMarketBarTimestamps,
  type ForecastCalendarResult,
} from './forecastCalendar';
import { ForecastDataFailure } from './forecastData';
import { normalizeSymbol } from './util';

export interface ForecastRunnerUpdate {
  stage: ForecastJobStage;
  percent: number;
  completedPaths: number;
  message: string;
  preparationPhase?: ForecastPreparationPhase;
}

export interface ForecastRunnerContext {
  jobId: string;
  request: ForecastRunRequest;
  history: ForecastHistoryData | null;
  calendar: ForecastCalendarResult;
  report(update: ForecastRunnerUpdate): boolean;
  isCancelled(): boolean;
  registerCancellation(handler: () => void | Promise<void>): void;
}

export type ForecastRunner = (
  context: ForecastRunnerContext,
) => Promise<ForecastRecord | null>;
export type ForecastJobListener = (event: ForecastProgressEvent) => void;

interface ForecastJobRegistryOptions {
  runner?: ForecastRunner;
  loadHistory?: (request: ForecastRunRequest) => Promise<ForecastHistoryData>;
  saveRecord?: (record: ForecastRecord) => ForecastRecord;
  now?: () => string;
  createJobId?: () => string;
  onDiagnostic?: (message: string) => void;
}

let jobCounter = 0;

function defaultJobId(): string {
  jobCounter += 1;
  return `fc_${Date.now().toString(36)}_${jobCounter.toString(36)}`;
}

function copyEvent(event: ForecastProgressEvent): ForecastProgressEvent {
  return { ...event };
}

export class ForecastJobFailure extends Error {
  constructor(
    readonly code: ForecastErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ForecastJobFailure';
  }
}

function isForecastJobFailure(error: unknown): error is ForecastJobFailure {
  return (
    error instanceof ForecastJobFailure ||
    (error instanceof Error &&
      error.name === 'ForecastJobFailure' &&
      typeof (error as Partial<ForecastJobFailure>).code === 'string')
  );
}

export function cleanForecastRunRequest(raw: unknown): ForecastRunRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<ForecastRunRequest>;
  const symbol = normalizeSymbol(value.symbol);
  if (!symbol) return null;
  if (value.assetType !== 'stock' && value.assetType !== 'etf') return null;
  if (
    value.paths !== FORECAST_V1.pathCount ||
    value.horizonBars !== FORECAST_V1.predictionBars ||
    value.interval !== FORECAST_V1.interval
  ) {
    return null;
  }
  if (
    typeof value.requestedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.requestedAt))
  ) {
    return null;
  }
  return {
    symbol,
    assetType: value.assetType,
    requestedAt: value.requestedAt,
    paths: FORECAST_V1.pathCount,
    horizonBars: FORECAST_V1.predictionBars,
    interval: FORECAST_V1.interval,
  };
}

export class ForecastJobRegistry {
  private readonly runner: ForecastRunner;
  private readonly loadHistory?: (
    request: ForecastRunRequest,
  ) => Promise<ForecastHistoryData>;
  private saveRecord?: (record: ForecastRecord) => ForecastRecord;
  private readonly now: () => string;
  private readonly createJobId: () => string;
  private readonly onDiagnostic: (message: string) => void;
  private readonly jobsById = new Map<string, ForecastProgressEvent>();
  private readonly latestJobBySymbol = new Map<string, string>();
  private readonly listeners = new Set<ForecastJobListener>();
  private readonly cancellationHandlers = new Map<
    string,
    () => void | Promise<void>
  >();
  private activeJobId: string | null = null;

  constructor(options: ForecastJobRegistryOptions = {}) {
    this.runner = options.runner ?? createDeterministicMockForecastRunner();
    this.loadHistory = options.loadHistory;
    this.saveRecord = options.saveRecord;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createJobId = options.createJobId ?? defaultJobId;
    this.onDiagnostic = options.onDiagnostic ?? (() => {});
  }

  configureRecordSaver(saveRecord: (record: ForecastRecord) => ForecastRecord): void {
    if (this.activeJobId) {
      throw new Error('Cannot configure forecast storage while a job is active');
    }
    this.saveRecord = saveRecord;
  }

  start(rawRequest: unknown): ForecastRunResult {
    const request = cleanForecastRunRequest(rawRequest);
    if (!request) {
      return {
        ok: false,
        code: 'INVALID_FORECAST_REQUEST',
        message: 'Forecast request is invalid.',
      };
    }

    const active = this.activeJobId ? this.jobsById.get(this.activeJobId) : undefined;
    if (active) {
      return {
        ok: false,
        code: 'FORECAST_ALREADY_RUNNING',
        message:
          active.stage === 'cancelled'
            ? `The cancelled forecast for ${active.symbol} is still shutting down.`
            : `A forecast is already running for ${active.symbol}.`,
        activeSymbol: active.symbol,
      };
    }

    const jobId = this.createJobId();
    const initial: ForecastProgressEvent = {
      jobId,
      symbol: request.symbol,
      stage: 'validating',
      sequence: 1,
      percent: 1,
      completedPaths: 0,
      totalPaths: FORECAST_V1.pathCount,
      message: 'Fetching completed one-hour forecast history',
      updatedAt: this.now(),
    };
    this.jobsById.set(jobId, initial);
    this.latestJobBySymbol.set(request.symbol, jobId);
    this.activeJobId = jobId;
    this.notify(initial);

    void Promise.resolve()
      .then(async () => {
        const history = this.loadHistory
          ? await this.loadHistory(request)
          : null;
        if (
          !this.report(jobId, {
            stage: 'validating',
            percent: 2,
            completedPaths: 0,
            message: 'Validating market history and trading calendar',
          })
        ) {
          return null;
        }
        const calendar = nextUsMarketBarTimestamps({
          afterTimestamp:
            history?.candles.at(-1)?.timestamp ?? request.requestedAt,
          count: FORECAST_V1.predictionBars,
          exchange: history?.exchange,
          timezone: history?.timezone,
        });
        return this.runner({
          jobId,
          request,
          history,
          calendar,
          report: (update) => this.report(jobId, update),
          isCancelled: () => this.jobsById.get(jobId)?.stage === 'cancelled',
          registerCancellation: (handler) =>
            this.registerCancellation(jobId, handler),
        });
      })
      .then((record) => {
        const current = this.jobsById.get(jobId);
        if (!current || !isActiveForecastStage(current.stage)) return;
        if (!record) {
          this.fail(
            jobId,
            'ENGINE_SETUP_FAILED',
            'Forecast runner stopped before producing a saved result.',
          );
          return;
        }
        if (current.stage !== 'persisting' || current.percent !== 99) {
          this.fail(
            jobId,
            'OUTPUT_VALIDATION_FAILED',
            'Forecast runner returned a result before reaching persistence.',
          );
          return;
        }
        if (!this.saveRecord) {
          this.fail(
            jobId,
            'PERSISTENCE_FAILED',
            'Durable forecast storage is not configured.',
          );
          return;
        }
        let saved: ForecastRecord;
        try {
          saved = this.saveRecord(record);
        } catch (error) {
          throw new ForecastJobFailure(
            'PERSISTENCE_FAILED',
            error instanceof Error ? error.message : 'Could not save forecast.',
          );
        }
        this.complete(jobId, saved.id);
      })
      .catch((error: unknown) => {
        if (error instanceof ForecastCalendarFailure) {
          this.fail(jobId, error.code, error.message);
          return;
        }
        if (error instanceof ForecastDataFailure) {
          this.fail(jobId, error.code, error.message);
          return;
        }
        if (isForecastJobFailure(error)) {
          this.fail(jobId, error.code, error.message);
          return;
        }
        this.fail(
          jobId,
          'ENGINE_SETUP_FAILED',
          error instanceof Error ? error.message : 'Forecast runner failed.',
        );
      })
      .finally(() => {
        this.cancellationHandlers.delete(jobId);
        if (this.activeJobId === jobId) this.activeJobId = null;
      });

    return { ok: true, job: copyEvent(initial) };
  }

  cancel(rawJobId: unknown): ForecastCancelResult {
    if (typeof rawJobId !== 'string' || !rawJobId.trim()) {
      return {
        ok: false,
        code: 'JOB_CANCELLED',
        message: 'A valid forecast job ID is required.',
      };
    }
    const current = this.jobsById.get(rawJobId);
    if (!current || !isActiveForecastStage(current.stage)) {
      return {
        ok: false,
        code: 'JOB_CANCELLED',
        message: 'No active forecast job was found.',
      };
    }
    const cancelled: ForecastProgressEvent = {
      ...current,
      stage: 'cancelled',
      sequence: current.sequence + 1,
      message: 'Forecast cancelled',
      updatedAt: this.now(),
      errorCode: 'JOB_CANCELLED',
      preparationPhase: undefined,
    };
    this.jobsById.set(rawJobId, cancelled);
    this.notify(cancelled);
    const handler = this.cancellationHandlers.get(rawJobId);
    if (handler) this.invokeCancellation(handler);
    return { ok: true, job: copyEvent(cancelled) };
  }

  getJob(rawSymbol: unknown): ForecastProgressEvent | null {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return null;
    const jobId = this.latestJobBySymbol.get(symbol);
    const job = jobId ? this.jobsById.get(jobId) : undefined;
    return job ? copyEvent(job) : null;
  }

  subscribe(listener: ForecastJobListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private report(jobId: string, update: ForecastRunnerUpdate): boolean {
    const current = this.jobsById.get(jobId);
    if (!current || !isActiveForecastStage(current.stage)) return false;
    const next: ForecastProgressEvent = {
      ...current,
      ...update,
      sequence: current.sequence + 1,
      updatedAt: this.now(),
      errorCode: undefined,
      preparationPhase:
        update.stage === 'preparing-engine'
          ? update.preparationPhase ?? 'preparing'
          : undefined,
    };
    const validation = validateForecastProgressUpdate(current, next);
    if (!validation.ok) {
      this.fail(
        jobId,
        'OUTPUT_VALIDATION_FAILED',
        validation.reason ?? 'Invalid forecast progress update.',
      );
      return false;
    }
    this.jobsById.set(jobId, next);
    this.notify(next);
    return true;
  }

  private registerCancellation(
    jobId: string,
    handler: () => void | Promise<void>,
  ): void {
    const current = this.jobsById.get(jobId);
    if (!current || current.stage === 'cancelled') {
      this.invokeCancellation(handler);
      return;
    }
    if (isActiveForecastStage(current.stage)) {
      this.cancellationHandlers.set(jobId, handler);
    }
  }

  private invokeCancellation(handler: () => void | Promise<void>): void {
    void Promise.resolve()
      .then(handler)
      .catch(() => {
        // The active runner reports worker cancellation/crash through its
        // own completion promise. Do not leak detailed sidecar errors to IPC.
      });
  }

  private fail(jobId: string, code: ForecastErrorCode, message: string): void {
    const current = this.jobsById.get(jobId);
    if (!current || !isActiveForecastStage(current.stage)) return;
    this.onDiagnostic(
      `[${code}] ${current.symbol} ${current.stage}: ${message}`,
    );
    const failed: ForecastProgressEvent = {
      ...current,
      stage: 'failed',
      sequence: current.sequence + 1,
      message,
      updatedAt: this.now(),
      errorCode: code,
      preparationPhase: undefined,
    };
    this.jobsById.set(jobId, failed);
    this.notify(failed);
  }

  private complete(jobId: string, forecastId: string): void {
    const current = this.jobsById.get(jobId);
    if (!current || !isActiveForecastStage(current.stage)) return;
    const completed: ForecastProgressEvent = {
      ...current,
      stage: 'completed',
      sequence: current.sequence + 1,
      percent: 100,
      message: 'Forecast saved and complete',
      updatedAt: this.now(),
      forecastId,
      errorCode: undefined,
      preparationPhase: undefined,
    };
    const validation = validateForecastProgressUpdate(current, completed);
    if (!validation.ok) {
      this.fail(
        jobId,
        'OUTPUT_VALIDATION_FAILED',
        validation.reason ?? 'Invalid completed forecast state.',
      );
      return;
    }
    this.jobsById.set(jobId, completed);
    this.notify(completed);
  }

  private notify(event: ForecastProgressEvent): void {
    const snapshot = copyEvent(event);
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // A renderer reload or destroyed webContents must not interrupt the
        // job chain or strand the one-job global lock.
      }
    }
  }
}

function nextTurn(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Development-only runner for building IPC and UI before the Python worker.
 * It performs deterministic local calculations and returns an explicitly
 * marked mock record. The registry emits 100% only after its saver succeeds.
 */
export function createDeterministicMockForecastRunner(): ForecastRunner {
  return async ({
    jobId,
    request,
    history,
    calendar,
    report,
    isCancelled,
  }) => {
    if (
      !report({
        stage: 'preparing-engine',
        percent: 5,
        completedPaths: 0,
        message: 'Preparing development forecast runner',
      })
    ) {
      return null;
    }

    let checksum = 0;
    const baseClose =
      history?.candles.at(-1)?.close ??
      (100 +
        [...request.symbol].reduce(
          (sum, character) => sum + character.charCodeAt(0),
          0,
        ) %
          100);
    const closePaths: number[][] = [];
    const pathSeeds = Array.from(
      { length: FORECAST_V1.pathCount },
      (_, index) => 10_000 + index,
    );
    for (let pathIndex = 1; pathIndex <= FORECAST_V1.pathCount; pathIndex += 1) {
      if (isCancelled()) return null;
      const closes: number[] = [];
      let close = baseClose;
      for (let barIndex = 0; barIndex < FORECAST_V1.predictionBars; barIndex += 1) {
        const move =
          Math.sin(pathSeeds[pathIndex - 1] * 0.013 + barIndex * 0.71) * 0.003 +
          (pathIndex - 15.5) * 0.00002;
        close = Math.max(0.01, close * (1 + move));
        checksum += close;
        closes.push(close);
      }
      closePaths.push(closes);
      await nextTurn();
      if (
        !report({
          stage: 'running-paths',
          percent: forecastPercentForCompletedPaths(pathIndex),
          completedPaths: pathIndex,
          message: `Development mock completed path ${pathIndex} of ${FORECAST_V1.pathCount}`,
        })
      ) {
        return null;
      }
    }

    if (isCancelled()) return null;
    report({
      stage: 'post-processing',
      percent: 96,
      completedPaths: FORECAST_V1.pathCount,
      message: 'Validating development forecast paths',
    });
    report({
      stage: 'post-processing',
      percent: 97,
      completedPaths: FORECAST_V1.pathCount,
      message: 'Calculating development forecast metrics',
    });
    report({
      stage: 'post-processing',
      percent: 98,
      completedPaths: FORECAST_V1.pathCount,
      message: `Preparing development result (${request.symbol}, ${checksum.toFixed(4)})`,
    });
    report({
      stage: 'persisting',
      percent: 99,
      completedPaths: FORECAST_V1.pathCount,
      message: 'Waiting for durable forecast storage',
    });
    const generatedMs = Date.parse(request.requestedAt);
    const aggregate = Array.from(
      { length: FORECAST_V1.predictionBars },
      (_, barIndex) => {
        const values = closePaths
          .map((closePath) => closePath[barIndex])
          .sort((a, b) => a - b);
        return {
          timestamp: calendar.timestamps[barIndex],
          mean: mean(values),
          p10: percentile(values, 0.1),
          p25: percentile(values, 0.25),
          p50: percentile(values, 0.5),
          p75: percentile(values, 0.75),
          p90: percentile(values, 0.9),
          min: values[0],
          max: values[values.length - 1],
        };
      },
    );
    const finalReturns = closePaths.map(
      (closePath) => closePath[closePath.length - 1] / baseClose - 1,
    );
    const upsidePaths = finalReturns.filter((value) => value > 0).length;
    const downsidePaths = finalReturns.filter((value) => value < 0).length;
    const generatedAt = new Date(generatedMs).toISOString();
    return {
      schemaVersion: FORECAST_V1.schemaVersion,
      id: jobId,
      symbol: request.symbol,
      assetType: request.assetType,
      generatedAt,
      expiresAt: new Date(generatedMs + FORECAST_V1.recordTtlMs).toISOString(),
      forecastStartAt: aggregate[0].timestamp,
      forecastEndAt: aggregate[aggregate.length - 1].timestamp,
      lastHistoricalClose: baseClose,
      horizonLabel: '24-trading-hours',
      metrics: {
        sampledUpsideFrequency: upsidePaths / FORECAST_V1.pathCount,
        sampledDownsideFrequency: downsidePaths / FORECAST_V1.pathCount,
        volatilityAmplificationFrequency: 0,
        medianPredictedReturn: percentile([...finalReturns].sort((a, b) => a - b), 0.5),
        meanPredictedReturn: mean(finalReturns),
        historicalVolatility: 0,
        medianForecastVolatility: 0,
      },
      aggregate,
      closePaths,
      provenance: {
        mode: 'development-mock',
        marketDataSource: history?.source.provider ?? 'development-mock',
        marketDataIsSample: false,
        latestCompletedCandleAt:
          history?.candles.at(-1)?.timestamp ?? generatedAt,
        historyBars: history?.candles.length ?? FORECAST_V1.lookbackBars,
        adjusted: history?.adjusted ?? false,
        adjustmentMethod: history?.adjustmentMethod,
        exchange: calendar.assumptions.exchange,
        exchangeTimezone: calendar.assumptions.timezone,
        marketCalendar: calendar.assumptions.calendar,
        regularSession: calendar.assumptions.regularSession,
        modelId: FORECAST_V1.modelId,
        tokenizerId: FORECAST_V1.tokenizerId,
        kronosCommit: 'development-mock',
        device: 'cpu',
        temperature: FORECAST_V1.temperature,
        topP: FORECAST_V1.topP,
        topK: FORECAST_V1.topK,
        pathCount: FORECAST_V1.pathCount,
        baseSeed: pathSeeds[0],
        pathSeeds,
        repairsApplied: false,
        repairedValueCount: 0,
      },
      evaluation: {
        status: 'not-started',
        actualPointsAvailable: 0,
        expectedPoints: FORECAST_V1.predictionBars,
      },
      warnings: [
        'Development mock only. This record is not a market forecast.',
        `Development checksum: ${checksum.toFixed(4)}`,
      ],
    };
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], quantile: number): number {
  const position = (sortedValues.length - 1) * quantile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}
