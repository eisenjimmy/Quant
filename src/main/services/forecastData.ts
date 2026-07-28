import {
  FORECAST_V1,
  type ForecastErrorCode,
  type ForecastHistoryCandle,
  type ForecastHistoryData,
  type ForecastRunRequest,
} from '../../shared/forecast';
import type { DataSource } from '../../shared/types';
import {
  fetchYahooChart,
  type YahooChartResult,
} from './yahoo';

const FORECAST_YAHOO_RANGE = '3mo';
const FORECAST_YAHOO_INTERVAL = '60m';
const FORECAST_HISTORY_TTL_MS = 60_000;
const ONE_HOUR_SECONDS = 60 * 60;
const ONE_HOUR_MS = ONE_HOUR_SECONDS * 1000;
/** Allows weekends and three-day market closures until Chunk 2.3 adds a calendar. */
export const FORECAST_MAX_STALENESS_MS = 4 * 24 * 60 * 60 * 1000;
const FORECAST_MAX_SESSION_LAG_MS = 2 * ONE_HOUR_MS;

export interface ForecastHistoryProviderResult {
  source: DataSource;
  provider: string;
  chart: YahooChartResult;
}

export type ForecastHistoryProvider = (
  symbol: string,
) => Promise<ForecastHistoryProviderResult>;

export type ForecastChartFetcher = typeof fetchYahooChart;

export interface ForecastHistoryOptions {
  provider?: ForecastHistoryProvider;
  fetchChart?: ForecastChartFetcher;
  now?: () => number;
}

export class ForecastDataFailure extends Error {
  constructor(
    readonly code: ForecastErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ForecastDataFailure';
  }
}

async function yahooForecastHistoryProvider(
  symbol: string,
  fetchChart: ForecastChartFetcher,
): Promise<ForecastHistoryProviderResult> {
  return {
    source: 'live',
    provider: 'yahoo-chart-v8',
    chart: await fetchChart(
      symbol,
      FORECAST_YAHOO_RANGE,
      FORECAST_YAHOO_INTERVAL,
      FORECAST_HISTORY_TTL_MS,
    ),
  };
}

function finite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function failInvalidCandles(message: string): never {
  throw new ForecastDataFailure('INVALID_CANDLES', message);
}

function regularSession(
  chart: YahooChartResult,
): { start: number; end: number } | null {
  const regular = chart.meta?.currentTradingPeriod?.regular;
  if (
    !finite(regular?.start) ||
    !finite(regular?.end) ||
    regular.end <= regular.start
  ) {
    return null;
  }
  return {
    start: Math.floor(regular.start),
    end: Math.floor(regular.end),
  };
}

function candleCompletionSeconds(
  candleStart: number,
  session: { start: number; end: number } | null,
): number {
  const nominalEnd = candleStart + ONE_HOUR_SECONDS;
  if (
    session &&
    candleStart >= session.start &&
    candleStart < session.end
  ) {
    return Math.min(nominalEnd, session.end);
  }
  return nominalEnd;
}

function expectedMarketReferenceSeconds(
  nowSeconds: number,
  session: { start: number; end: number } | null,
): number | null {
  if (!session || nowSeconds < session.start) return null;
  return Math.min(nowSeconds, session.end);
}

function normalizeForecastCandles(
  chart: YahooChartResult,
  nowMs: number,
): {
  candles: ForecastHistoryCandle[];
  adjusted: boolean;
  adjustmentMethod: string;
} {
  const timestamps = Array.isArray(chart.timestamp) ? chart.timestamp : [];
  const quote = chart.indicators?.quote?.[0] ?? {};
  const opens = quote.open ?? [];
  const highs = quote.high ?? [];
  const lows = quote.low ?? [];
  const closes = quote.close ?? [];
  const volumes = quote.volume ?? [];
  const adjustedCloses = chart.indicators?.adjclose?.[0]?.adjclose;
  const hasAdjustmentSeries = Array.isArray(adjustedCloses);
  const nowSeconds = Math.floor(nowMs / 1000);
  const session = regularSession(chart);

  if (timestamps.length === 0) {
    throw new ForecastDataFailure(
      'MARKET_DATA_UNAVAILABLE',
      'No one-hour candles are available for forecasting.',
    );
  }

  let completedEnd = timestamps.length;
  const lastTimestamp = timestamps.at(-1);
  if (
    finite(lastTimestamp) &&
    candleCompletionSeconds(Math.floor(lastTimestamp), session) > nowSeconds
  ) {
    completedEnd -= 1;
  }

  const completedCount = completedEnd;
  if (completedCount < FORECAST_V1.minimumHistoryBars) {
    throw new ForecastDataFailure(
      'INSUFFICIENT_HISTORY',
      `At least ${FORECAST_V1.minimumHistoryBars} completed one-hour candles are required; received ${completedCount}.`,
    );
  }

  const start = Math.max(0, completedEnd - FORECAST_V1.lookbackBars);
  const candles: ForecastHistoryCandle[] = [];
  let previousTime = -Infinity;

  for (let index = start; index < completedEnd; index += 1) {
    const rawTime = timestamps[index];
    const rawOpen = opens[index];
    const rawHigh = highs[index];
    const rawLow = lows[index];
    const rawClose = closes[index];
    if (!finite(rawTime)) {
      failInvalidCandles(`Candle ${index + 1} has an invalid timestamp.`);
    }
    const time = Math.floor(rawTime);
    if (time > nowSeconds) {
      failInvalidCandles(`Candle ${index + 1} has a future timestamp.`);
    }
    if (time === previousTime) {
      failInvalidCandles(`Candle ${index + 1} duplicates the previous timestamp.`);
    }
    if (time < previousTime) {
      failInvalidCandles(`Candle ${index + 1} is out of chronological order.`);
    }
    previousTime = time;

    if (
      !finite(rawOpen) ||
      !finite(rawHigh) ||
      !finite(rawLow) ||
      !finite(rawClose)
    ) {
      failInvalidCandles(`Candle ${index + 1} contains missing or non-finite OHLC values.`);
    }
    if (rawOpen <= 0 || rawHigh <= 0 || rawLow <= 0 || rawClose <= 0) {
      failInvalidCandles(`Candle ${index + 1} contains a non-positive OHLC value.`);
    }
    if (
      rawHigh < Math.max(rawOpen, rawClose) ||
      rawLow > Math.min(rawOpen, rawClose) ||
      rawLow > rawHigh
    ) {
      failInvalidCandles(`Candle ${index + 1} has an invalid OHLC shape.`);
    }

    let adjustmentFactor = 1;
    if (hasAdjustmentSeries) {
      const adjustedClose = adjustedCloses[index];
      if (!finite(adjustedClose) || adjustedClose <= 0) {
        failInvalidCandles(
          `Candle ${index + 1} is missing a valid adjusted close.`,
        );
      }
      adjustmentFactor = adjustedClose / rawClose;
      if (!Number.isFinite(adjustmentFactor) || adjustmentFactor <= 0) {
        failInvalidCandles(`Candle ${index + 1} has an invalid adjustment factor.`);
      }
    }

    const open = rawOpen * adjustmentFactor;
    const high = rawHigh * adjustmentFactor;
    const low = rawLow * adjustmentFactor;
    const close = rawClose * adjustmentFactor;
    const rawVolume = volumes[index];
    if (rawVolume !== null && rawVolume !== undefined && !finite(rawVolume)) {
      failInvalidCandles(`Candle ${index + 1} has non-finite volume.`);
    }
    if (finite(rawVolume) && rawVolume < 0) {
      failInvalidCandles(`Candle ${index + 1} has negative volume.`);
    }
    const volume = finite(rawVolume) ? rawVolume : 0;
    const amount = volume * ((high + low + close) / 3);
    if (!Number.isFinite(amount) || amount < 0) {
      failInvalidCandles(`Candle ${index + 1} has an invalid amount proxy.`);
    }
    candles.push({
      timestamp: new Date(time * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume,
      amount,
    });
  }

  const latestTimestamp = Date.parse(candles.at(-1)?.timestamp ?? '');
  const latestStartSeconds = Math.floor(latestTimestamp / 1000);
  const latestCompletedAt =
    candleCompletionSeconds(latestStartSeconds, session) * 1000;
  const expectedMarketReference = expectedMarketReferenceSeconds(
    nowSeconds,
    session,
  );
  if (
    !Number.isFinite(latestCompletedAt) ||
    nowMs - latestCompletedAt > FORECAST_MAX_STALENESS_MS ||
    (expectedMarketReference !== null &&
      expectedMarketReference * 1000 - latestCompletedAt >
        FORECAST_MAX_SESSION_LAG_MS)
  ) {
    throw new ForecastDataFailure(
      'STALE_MARKET_DATA',
      'The latest completed one-hour candle is stale. Refresh market data and retry.',
    );
  }

  return {
    candles,
    adjusted: hasAdjustmentSeries,
    adjustmentMethod: hasAdjustmentSeries
      ? 'yahoo-adjusted-close-factor'
      : 'unadjusted-yahoo-chart',
  };
}

/**
 * Lazy forecast-only history fetch. This path intentionally has no bundled
 * sample fallback and is called only after ForecastJobRegistry.start().
 */
export async function getForecastHistory(
  request: ForecastRunRequest,
  options: ForecastHistoryOptions = {},
): Promise<ForecastHistoryData> {
  const provider =
    options.provider ??
    ((symbol: string) =>
      yahooForecastHistoryProvider(symbol, options.fetchChart ?? fetchYahooChart));
  const now = options.now ?? Date.now;
  let payload: ForecastHistoryProviderResult;
  try {
    payload = await provider(request.symbol);
  } catch (error) {
    throw new ForecastDataFailure(
      'MARKET_DATA_UNAVAILABLE',
      error instanceof Error
        ? `Forecast history is unavailable: ${error.message}`
        : 'Forecast history is unavailable.',
    );
  }

  if (payload.source !== 'live') {
    throw new ForecastDataFailure(
      'SAMPLE_DATA_NOT_ALLOWED',
      'Bundled SAMPLE data cannot be used for a forecast.',
    );
  }

  const result = payload.chart;
  const meta = result.meta ?? {};
  const normalized = normalizeForecastCandles(result, now());

  return {
    symbol: request.symbol,
    assetType: request.assetType,
    interval: FORECAST_V1.interval,
    exchange:
      typeof meta.exchangeName === 'string' && meta.exchangeName
        ? meta.exchangeName
        : undefined,
    timezone:
      typeof meta.exchangeTimezoneName === 'string' && meta.exchangeTimezoneName
        ? meta.exchangeTimezoneName
        : undefined,
    candles: normalized.candles,
    source: {
      provider: payload.provider,
      isSample: false,
      fetchedAt: new Date(now()).toISOString(),
    },
    adjusted: normalized.adjusted,
    adjustmentMethod: normalized.adjustmentMethod,
    amountMethod: 'volume-times-typical-price',
  };
}
