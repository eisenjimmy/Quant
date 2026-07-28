import { FORECAST_V1 } from '../../shared/forecast';
import type { ForecastRecord } from '../../shared/forecast';
import type {
  ForecastWorkerEvent,
  ForecastWorkerRunPayload,
} from '../../shared/forecastWorker';
import {
  ForecastJobFailure,
  type ForecastRunner,
} from './forecastJobRegistry';
import { isForecastRecord } from './forecastStore';
import { WorkerClientFailure } from './kronosWorker';

type CompletedWorkerEvent = Extract<
  ForecastWorkerEvent,
  { type: 'completed' }
>;
type WorkerProgressEvent = Extract<
  ForecastWorkerEvent,
  { type: 'progress' }
>;

export interface ForecastWorkerClient {
  run(
    jobId: string,
    payload: ForecastWorkerRunPayload,
    onProgress?: (event: WorkerProgressEvent) => void,
  ): Promise<CompletedWorkerEvent>;
  cancel(jobId: string): Promise<void>;
}

export interface KronosForecastRunnerOptions {
  now?: () => string;
  onDiagnostic?: (message: string) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isWorkerClientFailure(error: unknown): error is WorkerClientFailure {
  return (
    error instanceof WorkerClientFailure ||
    (error instanceof Error &&
      error.name === 'WorkerClientFailure' &&
      typeof (error as Partial<WorkerClientFailure>).code === 'string')
  );
}

function sameIntegerArray(left: unknown, right: unknown): boolean {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every(
      (value, index) =>
        Number.isInteger(value) && value === right[index],
    )
  );
}

function publicWorkerFailureMessage(code: WorkerClientFailure['code']): string {
  switch (code) {
    case 'PYTHON_NOT_AVAILABLE':
      return 'The local Python forecast environment is unavailable.';
    case 'ENGINE_SETUP_FAILED':
      return 'The local forecast engine is not set up.';
    case 'MODEL_DOWNLOAD_FAILED':
      return 'Kronos-mini could not be downloaded.';
    case 'MODEL_LOAD_FAILED':
      return 'Kronos-mini could not be loaded.';
    case 'FORECAST_TIMEOUT':
      return 'The local forecast worker stopped responding.';
    case 'WORKER_CRASHED':
      return 'The local forecast worker stopped unexpectedly.';
    default:
      return 'The local forecast worker could not complete the request.';
  }
}

function buildForecastRecord(
  jobId: string,
  result: Record<string, unknown>,
  context: Parameters<ForecastRunner>[0],
  generatedAt: string,
): ForecastRecord {
  const { request, history, calendar } = context;
  if (!history) {
    throw new ForecastJobFailure(
      'MARKET_DATA_UNAVAILABLE',
      'Live forecast history is unavailable. Refresh market data and retry.',
    );
  }
  const provenance = isObject(result.provenance)
    ? result.provenance
    : null;
  const repairs = isObject(result.repairs) ? result.repairs : null;
  if (
    result.testMode !== false ||
    result.pathCount !== FORECAST_V1.pathCount ||
    result.completedPaths !== FORECAST_V1.pathCount ||
    result.predictionBars !== FORECAST_V1.predictionBars ||
    result.lastHistoricalClose !== history.candles.at(-1)?.close ||
    !provenance ||
    provenance.modelId !== FORECAST_V1.modelId ||
    provenance.tokenizerId !== FORECAST_V1.tokenizerId ||
    provenance.kronosCommit !== FORECAST_V1.kronosCommit ||
    provenance.pathCount !== FORECAST_V1.pathCount ||
    provenance.baseSeed !== result.baseSeed ||
    !sameIntegerArray(provenance.pathSeeds, result.pathSeeds) ||
    !repairs
  ) {
    throw new ForecastJobFailure(
      'OUTPUT_VALIDATION_FAILED',
      'Forecast worker returned inconsistent output.',
    );
  }

  const generatedDate = new Date(generatedAt);
  if (!Number.isFinite(generatedDate.getTime())) {
    throw new ForecastJobFailure(
      'OUTPUT_VALIDATION_FAILED',
      'Forecast completion time is invalid.',
    );
  }
  const normalizedGeneratedAt = generatedDate.toISOString();
  const repairedValueCount = repairs.valueCount;
  const candidate: unknown = {
    schemaVersion: FORECAST_V1.schemaVersion,
    id: jobId,
    symbol: request.symbol,
    assetType: request.assetType,
    generatedAt: normalizedGeneratedAt,
    expiresAt: new Date(
      generatedDate.getTime() + FORECAST_V1.recordTtlMs,
    ).toISOString(),
    forecastStartAt: calendar.timestamps[0],
    forecastEndAt: calendar.timestamps.at(-1),
    lastHistoricalClose: result.lastHistoricalClose,
    horizonLabel: '24-trading-hours',
    metrics: result.metrics,
    aggregate: result.aggregate,
    closePaths: result.closePaths,
    provenance: {
      mode: 'production',
      marketDataSource: history.source.provider,
      marketDataIsSample: false,
      latestCompletedCandleAt: history.candles.at(-1)?.timestamp,
      historyBars: history.candles.length,
      adjusted: history.adjusted,
      adjustmentMethod: history.adjustmentMethod,
      exchange: calendar.assumptions.exchange,
      exchangeTimezone: calendar.assumptions.timezone,
      marketCalendar: calendar.assumptions.calendar,
      regularSession: calendar.assumptions.regularSession,
      modelId: provenance.modelId,
      tokenizerId: provenance.tokenizerId,
      kronosCommit: provenance.kronosCommit,
      device: provenance.device,
      temperature: provenance.temperature,
      topP: provenance.topP,
      topK: provenance.topK,
      pathCount: provenance.pathCount,
      baseSeed: provenance.baseSeed,
      pathSeeds: provenance.pathSeeds,
      repairsApplied: repairs.applied,
      repairedValueCount,
    },
    evaluation: {
      status: 'not-started',
      actualPointsAvailable: 0,
      expectedPoints: FORECAST_V1.predictionBars,
    },
    warnings:
      typeof repairedValueCount === 'number' && repairedValueCount > 0
        ? [
            `${repairedValueCount} generated candle values were repaired within the validation limit.`,
          ]
        : [],
  };
  if (!isForecastRecord(candidate)) {
    throw new ForecastJobFailure(
      'OUTPUT_VALIDATION_FAILED',
      'Forecast worker returned an invalid completed record.',
    );
  }
  return candidate;
}

export function createKronosForecastRunner(
  worker: ForecastWorkerClient,
  options: KronosForecastRunnerOptions = {},
): ForecastRunner {
  const now = options.now ?? (() => new Date().toISOString());
  const onDiagnostic = options.onDiagnostic ?? (() => {});

  return async (context) => {
    if (context.isCancelled()) return null;
    if (!context.history) {
      throw new ForecastJobFailure(
        'MARKET_DATA_UNAVAILABLE',
        'Live forecast history is unavailable. Refresh market data and retry.',
      );
    }
    if (
      !context.report({
        stage: 'preparing-engine',
        percent: 2,
        completedPaths: 0,
        message: 'Starting local forecast engine',
        preparationPhase: 'preparing',
      })
    ) {
      return null;
    }

    const payload: ForecastWorkerRunPayload = {
      symbol: context.request.symbol,
      paths: FORECAST_V1.pathCount,
      predLen: FORECAST_V1.predictionBars,
      interval: FORECAST_V1.interval,
      temperature: FORECAST_V1.temperature,
      topP: FORECAST_V1.topP,
      topK: FORECAST_V1.topK,
      futureTimestamps: [...context.calendar.timestamps],
      candles: context.history.candles.map((candle) => ({ ...candle })),
    };

    try {
      const completedPromise = worker.run(
        context.jobId,
        payload,
        (event) => {
          const accepted = context.report({
            stage: event.stage,
            percent: event.percent,
            completedPaths: event.completedPaths,
            message: event.message,
            preparationPhase: event.preparationPhase,
          });
          if (!accepted) {
            void worker.cancel(context.jobId).catch((error: unknown) => {
              onDiagnostic(
                `Could not stop rejected forecast progress: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            });
          }
        },
      );
      context.registerCancellation(() => worker.cancel(context.jobId));
      const completed = await completedPromise;
      if (context.isCancelled()) return null;
      const record = buildForecastRecord(
        context.jobId,
        completed.result,
        context,
        now(),
      );
      if (
        !context.report({
          stage: 'persisting',
          percent: 99,
          completedPaths: FORECAST_V1.pathCount,
          message: 'Saving forecast locally',
        })
      ) {
        return null;
      }
      return record;
    } catch (error) {
      if (error instanceof ForecastJobFailure) throw error;
      if (isWorkerClientFailure(error)) {
        onDiagnostic(`[${error.code}] ${error.message}`);
        throw new ForecastJobFailure(
          error.code,
          publicWorkerFailureMessage(error.code),
        );
      }
      onDiagnostic(
        `Unexpected worker orchestration failure: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new ForecastJobFailure(
        'WORKER_CRASHED',
        publicWorkerFailureMessage('WORKER_CRASHED'),
      );
    }
  };
}
