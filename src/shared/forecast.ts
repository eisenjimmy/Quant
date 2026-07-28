/**
 * Shared forecast domain contracts and progress invariants.
 *
 * This module is runtime-safe in Electron main, preload, and renderer code.
 * It must not import Python, Kronos, Electron, filesystem, or network modules.
 */

export const FORECAST_V1 = {
  schemaVersion: 1,
  modelId: 'NeoQuasar/Kronos-mini',
  tokenizerId: 'NeoQuasar/Kronos-Tokenizer-2k',
  kronosCommit: '67b630e67f6a18c9e9be918d9b4337c960db1e9a',
  pathCount: 30,
  lookbackBars: 360,
  minimumHistoryBars: 300,
  interval: '1h',
  predictionBars: 24,
  temperature: 1,
  topP: 0.95,
  topK: 0,
  volumeWindow: 24,
  recordTtlMs: 7 * 24 * 60 * 60 * 1000,
} as const;

export type ForecastAssetType = 'stock' | 'etf';

export type ForecastJobStage =
  | 'idle'
  | 'validating'
  | 'preparing-engine'
  | 'running-paths'
  | 'post-processing'
  | 'persisting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ForecastPreparationPhase =
  | 'preparing'
  | 'downloading'
  | 'loading';

export type ForecastErrorCode =
  | 'INVALID_FORECAST_REQUEST'
  | 'FORECAST_ALREADY_RUNNING'
  | 'PYTHON_NOT_AVAILABLE'
  | 'ENGINE_SETUP_FAILED'
  | 'MODEL_DOWNLOAD_FAILED'
  | 'MODEL_LOAD_FAILED'
  | 'MARKET_DATA_UNAVAILABLE'
  | 'SAMPLE_DATA_NOT_ALLOWED'
  | 'STALE_MARKET_DATA'
  | 'INSUFFICIENT_HISTORY'
  | 'INVALID_CANDLES'
  | 'MARKET_CALENDAR_FAILED'
  | 'PATH_GENERATION_FAILED'
  | 'OUTPUT_VALIDATION_FAILED'
  | 'PERSISTENCE_FAILED'
  | 'JOB_CANCELLED'
  | 'WORKER_CRASHED'
  | 'FORECAST_TIMEOUT';

export interface ForecastRunRequest {
  symbol: string;
  assetType: ForecastAssetType;
  requestedAt: string;
  paths: typeof FORECAST_V1.pathCount;
  horizonBars: typeof FORECAST_V1.predictionBars;
  interval: typeof FORECAST_V1.interval;
}

export interface ForecastHistoryCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

export interface ForecastHistoryData {
  symbol: string;
  assetType: ForecastAssetType;
  interval: typeof FORECAST_V1.interval;
  exchange?: string;
  timezone?: string;
  candles: ForecastHistoryCandle[];
  source: {
    provider: string;
    isSample: false;
    fetchedAt: string;
  };
  adjusted: boolean;
  adjustmentMethod?: string;
  amountMethod: 'volume-times-typical-price';
}

export interface ForecastProgressEvent {
  jobId: string;
  symbol: string;
  stage: ForecastJobStage;
  sequence: number;
  percent: number;
  completedPaths: number;
  totalPaths: typeof FORECAST_V1.pathCount;
  message: string;
  updatedAt: string;
  preparationPhase?: ForecastPreparationPhase;
  /** Present only after the main process has persisted the completed record. */
  forecastId?: string;
  errorCode?: ForecastErrorCode;
}

export interface ForecastPoint {
  timestamp: string;
  mean: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
}

export interface ForecastMetrics {
  sampledUpsideFrequency: number;
  sampledDownsideFrequency: number;
  volatilityAmplificationFrequency: number;
  medianPredictedReturn: number;
  meanPredictedReturn: number;
  historicalVolatility: number;
  medianForecastVolatility: number;
}

export interface ForecastProvenance {
  mode: 'production' | 'development-mock';
  marketDataSource: string;
  marketDataIsSample: false;
  latestCompletedCandleAt: string;
  historyBars: number;
  adjusted: boolean;
  adjustmentMethod?: string;
  exchange: string;
  exchangeTimezone: string;
  marketCalendar: 'US-equities-v1';
  regularSession: '09:30-16:00';
  modelId: string;
  tokenizerId: string;
  kronosCommit: string;
  device: 'cuda' | 'mps' | 'cpu';
  temperature: number;
  topP: number;
  topK: number;
  pathCount: typeof FORECAST_V1.pathCount;
  baseSeed: number;
  pathSeeds: number[];
  repairsApplied: boolean;
  repairedValueCount: number;
}

export interface ForecastEvaluation {
  status: 'not-started' | 'partial' | 'matured' | 'unavailable';
  evaluatedAt?: string;
  actualFinalClose?: number;
  directionCorrect?: boolean;
  medianAbsolutePercentageError?: number;
  p10P90Coverage?: number;
  actualPointsAvailable: number;
  expectedPoints: number;
}

export interface ForecastActualPoint {
  timestamp: string;
  close: number;
}

export interface ForecastHistoricalComparison {
  evaluation: ForecastEvaluation;
  actual: ForecastActualPoint[];
}

export interface ForecastRecord {
  schemaVersion: typeof FORECAST_V1.schemaVersion;
  id: string;
  symbol: string;
  assetType: ForecastAssetType;
  generatedAt: string;
  expiresAt: string;
  forecastStartAt: string;
  forecastEndAt: string;
  lastHistoricalClose: number;
  horizonLabel: '24-trading-hours';
  metrics: ForecastMetrics;
  aggregate: ForecastPoint[];
  closePaths: number[][];
  provenance: ForecastProvenance;
  evaluation: ForecastEvaluation;
  warnings: string[];
}

export interface ForecastSavedSummary {
  id: string;
  symbol: string;
  generatedAt: string;
  expiresAt: string;
  forecastStartAt: string;
  forecastEndAt: string;
}

export type ForecastRunResult =
  | { ok: true; job: ForecastProgressEvent }
  | {
      ok: false;
      code: ForecastErrorCode;
      message: string;
      activeSymbol?: string;
    };

export type ForecastCancelResult =
  | { ok: true; job: ForecastProgressEvent }
  | { ok: false; code: ForecastErrorCode; message: string };

export type ForecastProgressListener = (event: ForecastProgressEvent) => void;

/** Narrow renderer bridge. Filesystem, worker, and network access stay in main. */
export interface ForecastApi {
  run(request: ForecastRunRequest): Promise<ForecastRunResult>;
  cancel(jobId: string): Promise<ForecastCancelResult>;
  getJob(symbol: string): Promise<ForecastProgressEvent | null>;
  listSaved(symbol: string): Promise<ForecastSavedSummary[]>;
  getSaved(forecastId: string): Promise<ForecastRecord | null>;
  getHistoricalComparison(
    forecastId: string,
  ): Promise<ForecastHistoricalComparison | null>;
  setOverlayEnabled(symbol: string, enabled: boolean): Promise<boolean>;
  getOverlayEnabled(symbol: string): Promise<boolean>;
  onProgress(callback: ForecastProgressListener): () => void;
  onCompleted(callback: ForecastProgressListener): () => void;
  onFailed(callback: ForecastProgressListener): () => void;
}

export interface ForecastProgressValidation {
  ok: boolean;
  reason?: string;
}

const ALLOWED_STAGE_TRANSITIONS: Record<ForecastJobStage, readonly ForecastJobStage[]> = {
  idle: ['validating'],
  validating: ['preparing-engine', 'failed', 'cancelled'],
  'preparing-engine': ['running-paths', 'failed', 'cancelled'],
  'running-paths': ['post-processing', 'failed', 'cancelled'],
  'post-processing': ['persisting', 'failed', 'cancelled'],
  persisting: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
};

export function forecastPercentForCompletedPaths(completedPaths: number): number {
  if (
    !Number.isInteger(completedPaths) ||
    completedPaths < 0 ||
    completedPaths > FORECAST_V1.pathCount
  ) {
    throw new RangeError(`completedPaths must be an integer from 0 to ${FORECAST_V1.pathCount}`);
  }
  return 5 + completedPaths * 3;
}

export function canTransitionForecastStage(
  current: ForecastJobStage,
  next: ForecastJobStage,
): boolean {
  return current === next || ALLOWED_STAGE_TRANSITIONS[current].includes(next);
}

export function isActiveForecastStage(stage: ForecastJobStage): boolean {
  return (
    stage === 'validating' ||
    stage === 'preparing-engine' ||
    stage === 'running-paths' ||
    stage === 'post-processing' ||
    stage === 'persisting'
  );
}

/**
 * Validates main-process progress before it is accepted into the job registry
 * or forwarded to the renderer.
 */
export function validateForecastProgressUpdate(
  previous: ForecastProgressEvent,
  next: ForecastProgressEvent,
): ForecastProgressValidation {
  if (next.jobId !== previous.jobId || next.symbol !== previous.symbol) {
    return { ok: false, reason: 'Progress identity changed' };
  }
  if (!Number.isInteger(next.sequence) || next.sequence <= previous.sequence) {
    return { ok: false, reason: 'Progress sequence must increase' };
  }
  if (!canTransitionForecastStage(previous.stage, next.stage)) {
    return {
      ok: false,
      reason: `Illegal forecast stage transition: ${previous.stage} -> ${next.stage}`,
    };
  }
  if (
    (next.stage === 'preparing-engine' && !next.preparationPhase) ||
    (next.stage !== 'preparing-engine' &&
      next.preparationPhase !== undefined)
  ) {
    return {
      ok: false,
      reason:
        'Preparation phase is required only while preparing the engine',
    };
  }
  if (
    next.totalPaths !== FORECAST_V1.pathCount ||
    !Number.isInteger(next.completedPaths) ||
    next.completedPaths < 0 ||
    next.completedPaths > FORECAST_V1.pathCount
  ) {
    return { ok: false, reason: 'Invalid completed path count' };
  }
  if (
    !Number.isInteger(next.percent) ||
    next.percent < 0 ||
    next.percent > 100
  ) {
    return { ok: false, reason: 'Progress percent must be an integer from 0 to 100' };
  }
  if (next.completedPaths < previous.completedPaths) {
    return { ok: false, reason: 'Completed paths cannot decrease' };
  }
  if (next.percent < previous.percent) {
    return { ok: false, reason: 'Progress percent cannot decrease' };
  }
  if (next.stage === 'running-paths') {
    const expectedPercent = forecastPercentForCompletedPaths(next.completedPaths);
    if (next.percent !== expectedPercent) {
      return {
        ok: false,
        reason: `Running progress must match completed paths (${expectedPercent}%)`,
      };
    }
  }
  if (
    (next.stage === 'post-processing' ||
      next.stage === 'persisting' ||
      next.stage === 'completed') &&
    next.completedPaths !== FORECAST_V1.pathCount
  ) {
    return { ok: false, reason: 'All forecast paths must finish before post-processing' };
  }
  if (next.stage !== 'completed' && next.percent === 100) {
    return { ok: false, reason: 'Only a completed persisted forecast may reach 100%' };
  }
  if (
    next.stage === 'completed' &&
    (next.percent !== 100 || !next.forecastId?.trim())
  ) {
    return {
      ok: false,
      reason: 'Completed progress requires 100% and a persisted forecast ID',
    };
  }
  return { ok: true };
}
