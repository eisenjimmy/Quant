import { isActiveForecastStage } from '../../../shared/forecast';
import type {
  ForecastErrorCode,
  ForecastProgressEvent,
  ForecastRecord,
} from '../../../shared/forecast';

export interface ForecastPanelView {
  buttonLabel: string;
  buttonDisabled: boolean;
  showProgress: boolean;
  statusText: string;
  percent: number;
}

export interface ForecastFailurePresentation {
  title: string;
  message: string;
  recovery: string;
  buttonLabel: string;
  command?: string;
}

export interface ForecastProgressPresentation {
  headline: string;
  detail: string;
}

export interface ForecastEtaState {
  jobId: string | null;
  lastSequence: number;
  lastCompletedPaths: number;
  lastObservedAtMs: number | null;
  pathDurationsMs: number[];
  estimatedCompletionAtMs: number | null;
}

export function createForecastEtaState(): ForecastEtaState {
  return {
    jobId: null,
    lastSequence: 0,
    lastCompletedPaths: 0,
    lastObservedAtMs: null,
    pathDurationsMs: [],
    estimatedCompletionAtMs: null,
  };
}

function median(values: number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

export function updateForecastEta(
  current: ForecastEtaState,
  job: ForecastProgressEvent | null,
  observedAtMs: number,
): ForecastEtaState {
  if (!job || !Number.isFinite(observedAtMs)) {
    return createForecastEtaState();
  }
  const next =
    current.jobId === job.jobId
      ? { ...current, pathDurationsMs: [...current.pathDurationsMs] }
      : { ...createForecastEtaState(), jobId: job.jobId };
  if (job.sequence <= next.lastSequence) return next;
  next.lastSequence = job.sequence;

  if (job.stage !== 'running-paths') {
    return next;
  }
  if (
    next.lastObservedAtMs !== null &&
    job.completedPaths > next.lastCompletedPaths
  ) {
    const completedDelta = job.completedPaths - next.lastCompletedPaths;
    const durationPerPath =
      (observedAtMs - next.lastObservedAtMs) / completedDelta;
    if (
      Number.isFinite(durationPerPath) &&
      durationPerPath >= 250 &&
      durationPerPath <= 30 * 60 * 1000
    ) {
      next.pathDurationsMs = [
        ...next.pathDurationsMs,
        durationPerPath,
      ].slice(-8);
      const medianPathMs = median(next.pathDurationsMs);
      const remainingPaths = Math.max(
        0,
        job.totalPaths - job.completedPaths,
      );
      const finalizationBufferMs = Math.min(
        15_000,
        Math.max(3_000, medianPathMs * 0.25),
      );
      next.estimatedCompletionAtMs =
        observedAtMs +
        remainingPaths * medianPathMs +
        finalizationBufferMs;
    }
  }
  if (job.completedPaths >= next.lastCompletedPaths) {
    next.lastCompletedPaths = job.completedPaths;
    next.lastObservedAtMs = observedAtMs;
  }
  return next;
}

function formatRemainingTime(remainingMs: number): string {
  if (remainingMs < 10_000) return 'Less than 10 sec remaining';
  if (remainingMs < 60_000) {
    const seconds = Math.max(10, Math.round(remainingMs / 5_000) * 5);
    return `About ${seconds} sec remaining`;
  }
  const minutes = Math.max(1, Math.round(remainingMs / 60_000));
  if (minutes < 60) return `About ${minutes} min remaining`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder
    ? `About ${hours} hr ${remainder} min remaining`
    : `About ${hours} hr remaining`;
}

export function describeForecastEta(
  state: ForecastEtaState,
  job: ForecastProgressEvent | null,
  nowMs: number,
): string | null {
  if (job && !isActiveForecastStage(job.stage)) return null;
  if (!job || job.stage === 'validating' || job.stage === 'preparing-engine') {
    return 'Estimating after path generation begins';
  }
  if (job.stage === 'post-processing' || job.stage === 'persisting') {
    return 'Less than 1 min remaining';
  }
  if (
    job.stage === 'running-paths' &&
    state.estimatedCompletionAtMs !== null &&
    Number.isFinite(nowMs)
  ) {
    return formatRemainingTime(
      Math.max(0, state.estimatedCompletionAtMs - nowMs),
    );
  }
  if (job.stage === 'running-paths') {
    return job.completedPaths === 0
      ? 'Measuring the first path'
      : 'Refining the time estimate';
  }
  return null;
}

export function isForecastOverlayControlLocked({
  overlaySaving,
  starting,
  job,
}: {
  overlaySaving: boolean;
  starting: boolean;
  job: ForecastProgressEvent | null;
}): boolean {
  return (
    overlaySaving ||
    starting ||
    (job !== null && isActiveForecastStage(job.stage))
  );
}

export function describeForecastFailure(
  code: ForecastErrorCode | undefined,
  fallback = 'The forecast could not complete safely.',
): ForecastFailurePresentation {
  switch (code) {
    case 'PYTHON_NOT_AVAILABLE':
    case 'ENGINE_SETUP_FAILED':
      return {
        title: 'Forecast setup required',
        message: 'The local Python forecast environment is not ready.',
        recovery: 'Run the setup command in the Quant project, then retry.',
        buttonLabel: 'Retry After Setup',
        command: 'npm run setup:forecast',
      };
    case 'MODEL_DOWNLOAD_FAILED':
      return {
        title: 'Model download interrupted',
        message: 'Kronos-mini could not be downloaded for local use.',
        recovery: 'Check the internet connection, then retry the download.',
        buttonLabel: 'Retry Download',
      };
    case 'MODEL_LOAD_FAILED':
      return {
        title: 'Model could not load',
        message: 'Kronos-mini could not be initialized safely.',
        recovery: 'Retry model loading with a clean worker.',
        buttonLabel: 'Retry Model Load',
      };
    case 'MARKET_DATA_UNAVAILABLE':
    case 'STALE_MARKET_DATA':
    case 'INSUFFICIENT_HISTORY':
    case 'INVALID_CANDLES':
      return {
        title: 'Market history is not ready',
        message: 'Valid completed one-hour candles are unavailable.',
        recovery: 'Refresh market data, then retry the forecast.',
        buttonLabel: 'Retry Market Data',
      };
    case 'SAMPLE_DATA_NOT_ALLOWED':
      return {
        title: 'Live market data required',
        message: 'Sample candles cannot be used for a Kronos forecast.',
        recovery: 'Restore a live data connection, then retry.',
        buttonLabel: 'Retry Live Data',
      };
    case 'MARKET_CALENDAR_FAILED':
      return {
        title: 'Trading calendar unavailable',
        message: 'Future regular-session timestamps could not be verified.',
        recovery: 'Refresh the symbol and retry the forecast.',
        buttonLabel: 'Retry Forecast',
      };
    case 'PATH_GENERATION_FAILED':
    case 'OUTPUT_VALIDATION_FAILED':
      return {
        title: 'Forecast output rejected',
        message: 'The sampled paths did not pass validation.',
        recovery: 'Retry the forecast to create a new set of paths.',
        buttonLabel: 'Retry Forecast',
      };
    case 'PERSISTENCE_FAILED':
      return {
        title: 'Forecast could not be saved',
        message: 'The completed forecast was not written to local storage.',
        recovery: 'Check available disk space, then rerun the forecast.',
        buttonLabel: 'Rerun Forecast',
      };
    case 'WORKER_CRASHED':
    case 'FORECAST_TIMEOUT':
      return {
        title: 'Forecast engine stopped',
        message: 'The local forecast worker did not complete.',
        recovery: 'Restart the forecast with a clean worker.',
        buttonLabel: 'Restart Forecast',
      };
    case 'FORECAST_ALREADY_RUNNING':
      return {
        title: 'Another forecast is running',
        message: fallback,
        recovery: 'Wait for the active forecast to finish, then retry.',
        buttonLabel: 'Forecast In Progress',
      };
    case 'INVALID_FORECAST_REQUEST':
      return {
        title: 'Forecast request is invalid',
        message: 'The forecast request could not be verified.',
        recovery: 'Reopen the symbol chart, then run the forecast again.',
        buttonLabel: 'Retry Forecast',
      };
    default:
      return {
        title: 'Forecast could not complete',
        message: fallback,
        recovery: 'Review the message, then retry the forecast.',
        buttonLabel: 'Retry Forecast',
      };
  }
}

export function describeForecastProgress(
  job: ForecastProgressEvent | null,
  statusText: string,
): ForecastProgressPresentation {
  if (job?.stage === 'preparing-engine') {
    if (job.preparationPhase === 'downloading') {
      return {
        headline: statusText,
        detail: 'First-use download in progress. Forecast paths have not started.',
      };
    }
    if (job.preparationPhase === 'loading') {
      return {
        headline: statusText,
        detail: 'Loading the local model into memory. Forecast paths have not started.',
      };
    }
    return {
      headline: statusText,
      detail: 'Checking the local engine and model cache.',
    };
  }
  if (job?.stage === 'validating') {
    return {
      headline: statusText,
      detail:
        job.percent <= 1
          ? 'Loading completed one-hour candles.'
          : 'Checking candles and the regular-session trading calendar.',
    };
  }
  if (job?.stage === 'running-paths') {
    return {
      headline: `Running path ${job.completedPaths} of ${job.totalPaths}`,
      detail: statusText,
    };
  }
  if (job?.stage === 'post-processing') {
    return {
      headline: statusText,
      detail: 'Calculating the distribution from 30 completed paths.',
    };
  }
  if (job?.stage === 'persisting') {
    return {
      headline: statusText,
      detail: 'Writing the validated forecast to local storage.',
    };
  }
  return {
    headline: statusText,
    detail: 'Real completed work only.',
  };
}

export function deriveForecastPanelView({
  loading,
  starting,
  unavailableReason,
  job,
  record,
}: {
  loading: boolean;
  starting: boolean;
  unavailableReason: string | null;
  job: ForecastProgressEvent | null;
  record: ForecastRecord | null;
}): ForecastPanelView {
  if (loading) {
    return {
      buttonLabel: 'Restoring saved forecasts',
      buttonDisabled: true,
      showProgress: false,
      statusText: 'Restoring saved forecast state.',
      percent: 0,
    };
  }
  if (unavailableReason) {
    return {
      buttonLabel: 'Forecast unavailable',
      buttonDisabled: true,
      showProgress: false,
      statusText: unavailableReason,
      percent: 0,
    };
  }
  if (starting) {
    return {
      buttonLabel: 'Starting forecast',
      buttonDisabled: true,
      showProgress: true,
      statusText: 'Submitting the forecast job.',
      percent: 0,
    };
  }
  if (job && isActiveForecastStage(job.stage)) {
    let buttonLabel: string;
    if (job.stage === 'running-paths') {
      buttonLabel = `Running ${job.completedPaths}/${job.totalPaths} · ${job.percent}%`;
    } else if (
      job.stage === 'preparing-engine' &&
      job.preparationPhase === 'downloading'
    ) {
      buttonLabel = job.message.toLowerCase().includes('tokenizer')
        ? 'Downloading Kronos tokenizer'
        : 'Downloading Kronos-mini';
    } else if (
      job.stage === 'preparing-engine' &&
      job.preparationPhase === 'loading'
    ) {
      buttonLabel = job.message.toLowerCase().includes('tokenizer')
        ? 'Loading Kronos tokenizer'
        : 'Loading Kronos-mini';
    } else if (job.stage === 'validating' && job.percent <= 1) {
      buttonLabel = 'Fetching market history';
    } else if (job.stage === 'validating') {
      buttonLabel = 'Validating market history';
    } else if (job.stage === 'post-processing') {
      buttonLabel = `Calculating forecast · ${job.percent}%`;
    } else if (job.stage === 'persisting') {
      buttonLabel = `Saving forecast · ${job.percent}%`;
    } else {
      buttonLabel = `Preparing forecast · ${job.percent}%`;
    }
    return {
      buttonLabel,
      buttonDisabled: true,
      showProgress: true,
      statusText: job.message,
      percent: job.percent,
    };
  }
  if (job?.stage === 'failed') {
    const failure = describeForecastFailure(job.errorCode, job.message);
    return {
      buttonLabel: failure.buttonLabel,
      buttonDisabled: false,
      showProgress: false,
      statusText: failure.message,
      percent: job.percent,
    };
  }
  if (job?.stage === 'cancelled') {
    return {
      buttonLabel: 'Run Forecast',
      buttonDisabled: false,
      showProgress: false,
      statusText: 'The previous forecast was cancelled.',
      percent: job.percent,
    };
  }
  return {
    buttonLabel: record ? 'Rerun Forecast' : 'Run Forecast',
    buttonDisabled: false,
    showProgress: false,
    statusText: record
      ? 'A saved forecast is ready to review.'
      : 'Runs only when you press the button.',
    percent: job?.stage === 'completed' ? 100 : 0,
  };
}

export function shouldAcceptForecastEvent(
  current: ForecastProgressEvent | null,
  next: ForecastProgressEvent,
  symbol: string,
): boolean {
  if (next.symbol !== symbol) return false;
  if (!current || current.jobId !== next.jobId) return true;
  return next.sequence > current.sequence;
}

export function formatForecastRatio(value: number, signed = false): string {
  if (!Number.isFinite(value)) return 'n/a';
  const percentage = value * 100;
  const prefix = signed && percentage > 0 ? '+' : '';
  return `${prefix}${percentage.toFixed(1)}%`;
}

export function formatForecastPrice(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    : 'n/a';
}
