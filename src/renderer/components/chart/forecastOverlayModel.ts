import { FORECAST_V1 } from '../../../shared/forecast';
import type {
  ForecastActualPoint,
  ForecastRecord,
} from '../../../shared/forecast';
import type { Candle } from '../../../shared/types';
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

const PROJECTABLE_MA20_INTERVALS = new Set(['60m', '1h', '1d']);

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

export function supportsProjectedMa20Interval(interval: string): boolean {
  return PROJECTABLE_MA20_INTERVALS.has(interval.toLowerCase());
}

function zonedDateKey(timestamp: UTCTimestamp, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(Number(timestamp) * 1000));
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    return year && month && day ? `${year}-${month}-${day}` : null;
  } catch {
    return null;
  }
}

function zonedMinuteOfDay(timestamp: string, timeZone: string): number | null {
  const milliseconds = Date.parse(timestamp);
  if (!Number.isFinite(milliseconds)) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(milliseconds));
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    return Number.isInteger(hour) && Number.isInteger(minute)
      ? hour * 60 + minute
      : null;
  } catch {
    return null;
  }
}

/**
 * Continues the visible chart's MA20 through the forecast median.
 *
 * The projection is a derived visualization only: it does not add another
 * model feature. Hourly charts use every forecast bar; daily charts use the
 * final forecast median from each exchange-local trading day.
 */
export function buildProjectedMa20(
  candles: readonly Candle[],
  record: ForecastRecord,
  interval: string,
): LineData<UTCTimestamp>[] | null {
  if (!supportsProjectedMa20Interval(interval) || candles.length < 20) {
    return null;
  }
  if (!buildForecastOverlayModel(record)) return null;

  const anchorTime = timestampSeconds(record.provenance.latestCompletedCandleAt);
  if (anchorTime === null) return null;
  const timeZone = record.provenance.exchangeTimezone;
  const daily = interval.toLowerCase() === '1d';
  const anchorDay = daily ? zonedDateKey(anchorTime, timeZone) : null;
  const generatedDay = daily
    ? zonedDateKey(
        Math.floor(Date.parse(record.generatedAt) / 1000) as UTCTimestamp,
        timeZone,
      )
    : null;
  const generatedMinute = daily
    ? zonedMinuteOfDay(record.generatedAt, timeZone)
    : null;
  if (
    daily &&
    (!anchorDay || !generatedDay || generatedMinute === null)
  ) {
    return null;
  }

  const history: Candle[] = [];
  let previousTime = -Infinity;
  for (const candle of candles) {
    if (
      !Number.isFinite(candle.time) ||
      candle.time <= previousTime ||
      !Number.isFinite(candle.close) ||
      candle.close <= 0
    ) {
      return null;
    }
    previousTime = candle.time;
    if (daily) {
      const candleDay = zonedDateKey(
        candle.time as UTCTimestamp,
        timeZone,
      );
      if (!candleDay) return null;
      const generatedAfterAnchorDay = generatedDay! > anchorDay!;
      const includeAnchorDay =
        generatedAfterAnchorDay ||
        (generatedDay === anchorDay && generatedMinute! >= 16 * 60);
      if (
        candleDay < anchorDay! ||
        (candleDay === anchorDay && includeAnchorDay)
      ) {
        history.push(candle);
      }
    } else if (candle.time <= anchorTime) {
      history.push(candle);
    }
  }
  if (history.length < 20) return null;

  const projected = record.aggregate.map((point) => ({
    time: timestampSeconds(point.timestamp),
    value: point.p50,
  }));
  if (
    projected.some(
      (point) =>
        point.time === null ||
        !Number.isFinite(point.value) ||
        point.value <= 0,
    )
  ) {
    return null;
  }

  const projectedCloses: Array<{
    time: UTCTimestamp;
    value: number;
  }> = [];
  if (daily) {
    const byDay = new Map<string, { time: UTCTimestamp; value: number }>();
    for (const point of projected) {
      const time = point.time as UTCTimestamp;
      const day = zonedDateKey(time, timeZone);
      if (!day) return null;
      byDay.set(day, { time, value: point.value });
    }
    projectedCloses.push(...byDay.values());
  } else {
    projectedCloses.push(
      ...projected.map((point) => ({
        time: point.time as UTCTimestamp,
        value: point.value,
      })),
    );
  }

  const historyWindow = history.slice(-20).map((candle) => candle.close);
  const line: LineData<UTCTimestamp>[] = [
    {
      time: history[history.length - 1].time as UTCTimestamp,
      value:
        historyWindow.reduce((sum, value) => sum + value, 0) /
        historyWindow.length,
    },
  ];
  for (const point of projectedCloses) {
    historyWindow.shift();
    historyWindow.push(point.value);
    line.push({
      time: point.time,
      value:
        historyWindow.reduce((sum, value) => sum + value, 0) /
        historyWindow.length,
    });
  }
  return line.length >= 2 ? line : null;
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
