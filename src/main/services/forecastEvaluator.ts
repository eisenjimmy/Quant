import { FORECAST_V1 } from '../../shared/forecast';
import type {
  ForecastActualPoint,
  ForecastEvaluation,
  ForecastHistoricalComparison,
  ForecastRecord,
} from '../../shared/forecast';

export interface ActualClose {
  timestamp: string;
  close: number;
}

export interface AdjustmentBasis {
  adjusted: boolean;
  adjustmentMethod?: string;
  candles?: readonly ActualClose[];
}

export interface AdjustmentAnchor {
  timestamp: string;
  close: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

function direction(value: number): -1 | 0 | 1 {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function unavailable(evaluatedAt: string): ForecastHistoricalComparison {
  return {
    evaluation: {
      status: 'unavailable',
      evaluatedAt,
      actualPointsAvailable: 0,
      expectedPoints: FORECAST_V1.predictionBars,
    },
    actual: [],
  };
}

export function hasCompatibleAdjustmentBasis(
  forecast: AdjustmentBasis,
  actual: AdjustmentBasis,
  anchor?: AdjustmentAnchor,
): boolean {
  const sameMethod =
    forecast.adjusted === actual.adjusted &&
    (forecast.adjustmentMethod ?? '') ===
      (actual.adjustmentMethod ?? '');
  if (!sameMethod || !anchor) return sameMethod;
  const actualAnchor = actual.candles?.find(
    (candle) => candle.timestamp === anchor.timestamp,
  );
  if (!actualAnchor || !Number.isFinite(anchor.close) || anchor.close <= 0) {
    return false;
  }
  return (
    Math.abs(actualAnchor.close - anchor.close) /
      Math.max(Math.abs(anchor.close), Number.EPSILON) <=
    1e-8
  );
}

/**
 * Compares observed closes to a persisted forecast by exact timestamp.
 * Missing bars are skipped and can never shift a later close onto an earlier
 * forecast point.
 */
export function evaluateForecast(
  record: ForecastRecord,
  actualCloses: readonly ActualClose[],
  evaluatedAt = new Date().toISOString(),
): ForecastHistoricalComparison {
  const evaluatedMs = Date.parse(evaluatedAt);
  if (!Number.isFinite(evaluatedMs)) {
    throw new Error('Historical comparison timestamp is invalid');
  }

  const actualByTimestamp = new Map<string, number>();
  for (const point of actualCloses) {
    if (
      !Number.isFinite(Date.parse(point.timestamp)) ||
      !Number.isFinite(point.close) ||
      point.close <= 0
    ) {
      throw new Error('Historical comparison contains an invalid actual close');
    }
    if (actualByTimestamp.has(point.timestamp)) {
      throw new Error('Historical comparison contains a duplicate timestamp');
    }
    actualByTimestamp.set(point.timestamp, point.close);
  }

  const matched = record.aggregate.flatMap((forecastPoint) => {
    const close = actualByTimestamp.get(forecastPoint.timestamp);
    return close === undefined
      ? []
      : [{ forecastPoint, actual: { timestamp: forecastPoint.timestamp, close } }];
  });
  const actual: ForecastActualPoint[] = matched.map((point) => point.actual);

  if (matched.length === 0) {
    if (
      evaluatedMs <
      Date.parse(record.forecastStartAt) + ONE_HOUR_MS
    ) {
      return {
        evaluation: {
          status: 'not-started',
          actualPointsAvailable: 0,
          expectedPoints: FORECAST_V1.predictionBars,
        },
        actual,
      };
    }
    return unavailable(evaluatedAt);
  }

  const finalClose = actualByTimestamp.get(record.forecastEndAt);
  const matured = finalClose !== undefined;
  const medianAbsolutePercentageError =
    matched.reduce(
      (total, point) =>
        total +
        Math.abs(point.actual.close - point.forecastPoint.p50) /
          point.actual.close,
      0,
    ) / matched.length;
  const p10P90Coverage =
    matched.filter(
      (point) =>
        point.actual.close >= point.forecastPoint.p10 &&
        point.actual.close <= point.forecastPoint.p90,
    ).length / matched.length;

  const evaluation: ForecastEvaluation = {
    status: matured ? 'matured' : 'partial',
    evaluatedAt,
    actualPointsAvailable: matched.length,
    expectedPoints: FORECAST_V1.predictionBars,
    medianAbsolutePercentageError,
    p10P90Coverage,
  };
  if (matured) {
    const finalForecast = record.aggregate.at(-1);
    if (!finalForecast) return unavailable(evaluatedAt);
    evaluation.actualFinalClose = finalClose;
    evaluation.directionCorrect =
      direction(finalForecast.p50 - record.lastHistoricalClose) ===
      direction(finalClose - record.lastHistoricalClose);
  }

  return { evaluation, actual };
}

export function unavailableForecastComparison(
  evaluatedAt = new Date().toISOString(),
): ForecastHistoricalComparison {
  return unavailable(evaluatedAt);
}
