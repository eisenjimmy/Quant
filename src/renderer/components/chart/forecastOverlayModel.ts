import { FORECAST_V1 } from '../../../shared/forecast';
import type {
  ForecastActualPoint,
  ForecastRecord,
} from '../../../shared/forecast';
import type { LineData, UTCTimestamp } from 'lightweight-charts';

export interface ForecastBandPoint {
  time: UTCTimestamp;
  lower: number;
  upper: number;
}

export interface ForecastOverlayModel {
  median: LineData<UTCTimestamp>[];
  band: ForecastBandPoint[];
  forecastStart: UTCTimestamp;
  minimum: number;
  maximum: number;
}

function timestampSeconds(value: string): UTCTimestamp | null {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  return Math.floor(milliseconds / 1000) as UTCTimestamp;
}

export function buildObservedCloseLine(
  actual: readonly ForecastActualPoint[],
): LineData<UTCTimestamp>[] | null {
  const line: LineData<UTCTimestamp>[] = [];
  let previousTime = -Infinity;
  for (const point of actual) {
    const time = timestampSeconds(point.timestamp);
    if (
      time === null ||
      time <= previousTime ||
      !Number.isFinite(point.close) ||
      point.close <= 0
    ) {
      return null;
    }
    line.push({ time, value: point.close });
    previousTime = time;
  }
  return line;
}

/**
 * Converts a persisted record into the only three chart layers used by default:
 * median, p10-p90 band, and forecast-start divider.
 */
export function buildForecastOverlayModel(
  record: ForecastRecord,
): ForecastOverlayModel | null {
  if (record.aggregate.length !== FORECAST_V1.predictionBars) return null;

  const anchorTime = timestampSeconds(record.provenance.latestCompletedCandleAt);
  if (
    anchorTime === null ||
    !Number.isFinite(record.lastHistoricalClose) ||
    record.lastHistoricalClose <= 0
  ) {
    return null;
  }

  const median: LineData<UTCTimestamp>[] = [
    { time: anchorTime, value: record.lastHistoricalClose },
  ];
  const band: ForecastBandPoint[] = [];
  let previousTime = anchorTime;
  let minimum = record.lastHistoricalClose;
  let maximum = record.lastHistoricalClose;

  for (const point of record.aggregate) {
    const time = timestampSeconds(point.timestamp);
    if (
      time === null ||
      time <= previousTime ||
      !Number.isFinite(point.p10) ||
      !Number.isFinite(point.p50) ||
      !Number.isFinite(point.p90) ||
      point.p10 <= 0 ||
      point.p10 > point.p50 ||
      point.p50 > point.p90
    ) {
      return null;
    }
    median.push({ time, value: point.p50 });
    band.push({ time, lower: point.p10, upper: point.p90 });
    minimum = Math.min(minimum, point.p10);
    maximum = Math.max(maximum, point.p90);
    previousTime = time;
  }

  const forecastStart = band[0]?.time;
  const declaredStart = timestampSeconds(record.forecastStartAt);
  if (forecastStart === undefined || declaredStart !== forecastStart) return null;

  return { median, band, forecastStart, minimum, maximum };
}
