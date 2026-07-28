import type {
  ForecastErrorCode,
  ForecastHistoryCandle,
  ForecastJobStage,
  ForecastPreparationPhase,
} from './forecast';

export const FORECAST_WORKER_PROTOCOL_VERSION = 1 as const;

export interface ForecastWorkerRunPayload {
  symbol: string;
  paths: 30;
  predLen: 24;
  interval: '1h';
  temperature: number;
  topP: number;
  topK: number;
  futureTimestamps: string[];
  candles: ForecastHistoryCandle[];
}

export type ForecastWorkerRequest =
  | { type: 'health'; requestId: string }
  | { type: 'run'; jobId: string; payload: ForecastWorkerRunPayload }
  | { type: 'cancel'; jobId: string }
  | { type: 'shutdown'; requestId: string };

export type ForecastWorkerEvent =
  | {
      type: 'ready';
      protocolVersion: typeof FORECAST_WORKER_PROTOCOL_VERSION;
      pythonVersion: string;
    }
  | {
      type: 'health';
      requestId: string;
      ok: boolean;
      protocolVersion: typeof FORECAST_WORKER_PROTOCOL_VERSION;
      pythonVersion: string;
    }
  | {
      type: 'progress';
      jobId: string;
      stage: ForecastJobStage;
      completedPaths: number;
      totalPaths: 30;
      percent: number;
      message: string;
      preparationPhase?: ForecastPreparationPhase;
    }
  | { type: 'completed'; jobId: string; result: Record<string, unknown> }
  | {
      type: 'failed';
      jobId: string;
      code: ForecastErrorCode;
      message: string;
    }
  | { type: 'cancelled'; jobId: string; message: string }
  | {
      type: 'protocol-error';
      code: 'OUTPUT_VALIDATION_FAILED';
      message: string;
    }
  | { type: 'shutdown'; requestId: string };

const FORECAST_ERROR_CODES = new Set<ForecastErrorCode>([
  'INVALID_FORECAST_REQUEST',
  'FORECAST_ALREADY_RUNNING',
  'PYTHON_NOT_AVAILABLE',
  'ENGINE_SETUP_FAILED',
  'MODEL_DOWNLOAD_FAILED',
  'MODEL_LOAD_FAILED',
  'MARKET_DATA_UNAVAILABLE',
  'SAMPLE_DATA_NOT_ALLOWED',
  'STALE_MARKET_DATA',
  'INSUFFICIENT_HISTORY',
  'INVALID_CANDLES',
  'MARKET_CALENDAR_FAILED',
  'PATH_GENERATION_FAILED',
  'OUTPUT_VALIDATION_FAILED',
  'PERSISTENCE_FAILED',
  'JOB_CANCELLED',
  'WORKER_CRASHED',
  'FORECAST_TIMEOUT',
]);

const WORKER_PROGRESS_STAGES = new Set<ForecastJobStage>([
  'preparing-engine',
  'running-paths',
  'post-processing',
]);
const WORKER_PREPARATION_PHASES = new Set<ForecastPreparationPhase>([
  'preparing',
  'downloading',
  'loading',
]);
const WORKER_JOB_ID_RE = /^fc_[A-Za-z0-9_-]{1,160}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isWorkerJobId(value: unknown): value is string {
  return typeof value === 'string' && WORKER_JOB_ID_RE.test(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    return false;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasStrictlyIncreasingTimestamps(values: string[]): boolean {
  return values.every(
    (timestamp, index) => index === 0 || values[index - 1] < timestamp,
  );
}

function isHistoryCandle(value: unknown): value is ForecastHistoryCandle {
  if (!isObject(value) || !isIsoTimestamp(value.timestamp)) return false;
  return ['open', 'high', 'low', 'close', 'volume', 'amount'].every((key) =>
    isFiniteNumber(value[key]),
  );
}

function isRunPayload(value: unknown): value is ForecastWorkerRunPayload {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.symbol) &&
    value.paths === 30 &&
    value.predLen === 24 &&
    value.interval === '1h' &&
    value.temperature === 1 &&
    value.topP === 0.95 &&
    value.topK === 0 &&
    Array.isArray(value.futureTimestamps) &&
    value.futureTimestamps.length === 24 &&
    value.futureTimestamps.every(isIsoTimestamp) &&
    hasStrictlyIncreasingTimestamps(value.futureTimestamps) &&
    Array.isArray(value.candles) &&
    value.candles.length >= 300 &&
    value.candles.every(isHistoryCandle) &&
    hasStrictlyIncreasingTimestamps(
      value.candles.map((candle) => candle.timestamp),
    )
  );
}

export function isForecastWorkerRequest(
  value: unknown,
): value is ForecastWorkerRequest {
  if (!isObject(value) || !isNonEmptyString(value.type)) return false;
  if (value.type === 'health' || value.type === 'shutdown') {
    return isNonEmptyString(value.requestId);
  }
  if (value.type === 'cancel') return isWorkerJobId(value.jobId);
  if (value.type === 'run') {
    return isWorkerJobId(value.jobId) && isRunPayload(value.payload);
  }
  return false;
}

export function isForecastWorkerEvent(
  value: unknown,
): value is ForecastWorkerEvent {
  if (!isObject(value) || !isNonEmptyString(value.type)) return false;
  switch (value.type) {
    case 'ready':
      return (
        value.protocolVersion === FORECAST_WORKER_PROTOCOL_VERSION &&
        isNonEmptyString(value.pythonVersion)
      );
    case 'health':
      return (
        isNonEmptyString(value.requestId) &&
        typeof value.ok === 'boolean' &&
        value.protocolVersion === FORECAST_WORKER_PROTOCOL_VERSION &&
        isNonEmptyString(value.pythonVersion)
      );
    case 'progress':
      return (
        isWorkerJobId(value.jobId) &&
        typeof value.stage === 'string' &&
        WORKER_PROGRESS_STAGES.has(value.stage as ForecastJobStage) &&
        typeof value.completedPaths === 'number' &&
        Number.isInteger(value.completedPaths) &&
        value.completedPaths >= 0 &&
        value.completedPaths <= 30 &&
        value.totalPaths === 30 &&
        isFiniteNumber(value.percent) &&
        value.percent >= 0 &&
        value.percent <= 99 &&
        isNonEmptyString(value.message) &&
        (value.stage === 'preparing-engine'
          ? typeof value.preparationPhase === 'string' &&
            WORKER_PREPARATION_PHASES.has(
              value.preparationPhase as ForecastPreparationPhase,
            )
          : value.preparationPhase === undefined)
      );
    case 'completed':
      return isWorkerJobId(value.jobId) && isObject(value.result);
    case 'failed':
      return (
        isWorkerJobId(value.jobId) &&
        typeof value.code === 'string' &&
        FORECAST_ERROR_CODES.has(value.code as ForecastErrorCode) &&
        isNonEmptyString(value.message)
      );
    case 'cancelled':
      return isWorkerJobId(value.jobId) && isNonEmptyString(value.message);
    case 'protocol-error':
      return (
        value.code === 'OUTPUT_VALIDATION_FAILED' &&
        isNonEmptyString(value.message)
      );
    case 'shutdown':
      return isNonEmptyString(value.requestId);
    default:
      return false;
  }
}

export function encodeForecastWorkerRequest(
  request: ForecastWorkerRequest,
): string {
  if (!isForecastWorkerRequest(request)) {
    throw new TypeError('Invalid forecast worker request.');
  }
  return `${JSON.stringify(request)}\n`;
}
