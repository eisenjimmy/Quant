// Deterministic offline fallbacks. Everything here is generated from a
// mulberry32 PRNG seeded by a stable hash of symbol(+range) — no
// Math.random, no date-seeded randomness — so repeated calls produce the
// same data. All payloads are flagged source: 'sample' where the shape
// allows it; sample news is marked via sourceName 'Sample Data' and a
// 'sample-' id prefix since NewsItem has no source field.

import type {
  Candle,
  ChartData,
  ChartRange,
  EarningsEvent,
  NewsItem,
  Quote,
} from '../../shared/types';
import { lookupName } from './dataFiles';
import { mulberry32, round2, stableHash, toYmd } from './util';

// Plausible mid-2026 price levels for well-known tickers; default 100.
const BASE_PRICES: Record<string, number> = {
  SPY: 620, VOO: 570, IVV: 623, VTI: 305, QQQ: 560, DIA: 445, IWM: 225,
  XLK: 265, XLF: 53, XLE: 92, XLV: 135, SMH: 290, SOXX: 245, ARKK: 75,
  SCHD: 27, JEPI: 56, VGT: 700, VUG: 460, VTV: 175, RSP: 185,
  AAPL: 230, MSFT: 500, NVDA: 170, AMZN: 220, GOOGL: 185, GOOG: 187,
  META: 720, TSLA: 320, AVGO: 270, 'BRK-B': 490, JPM: 290, V: 355,
  MA: 560, UNH: 310, XOM: 115, LLY: 780, JNJ: 155, PG: 160, HD: 365,
  COST: 985, WMT: 98, NFLX: 1250, CRM: 270, ORCL: 210, AMD: 140,
  ADBE: 390, PEP: 132, KO: 70, CSCO: 66, INTC: 22, TSM: 230, ASML: 790,
  QCOM: 155, TXN: 195, MU: 120, AMAT: 185, LRCX: 95, KLAC: 880,
  PLTR: 140, COIN: 350, HOOD: 80, SHOP: 110, DIS: 120, BA: 210,
  CAT: 390, GS: 700, MS: 140, BAC: 47, WFC: 80, IBM: 290, GE: 250,
  MCD: 300, NKE: 72, T: 28, VZ: 43, PFE: 25, MRK: 82, ABBV: 190,
  TMO: 490, CVX: 155, COP: 95, UBER: 90, NOW: 1000, ISRG: 530, INTU: 760,
  AMGN: 290, HON: 220, GILD: 110, BMY: 55, SBUX: 95, PYPL: 75,
};

export function basePriceFor(symbol: string): number {
  return BASE_PRICES[symbol.toUpperCase()] ?? 100;
}

// ---------------------------------------------------------------------------
// Candles
// ---------------------------------------------------------------------------

type SessionKind = 'intraday' | 'daily' | 'weekly' | 'monthly';

interface SampleRangeSpec {
  interval: string;
  count: number;
  kind: SessionKind;
  stepSec: number; // bar spacing for intraday kinds
  vol: number;     // per-bar volatility (fractional)
  baseVolume: number;
}

const SAMPLE_RANGE: Record<ChartRange, SampleRangeSpec> = {
  '1d': { interval: '5m', count: 78, kind: 'intraday', stepSec: 300, vol: 0.0012, baseVolume: 900_000 },
  '1w': { interval: '15m', count: 130, kind: 'intraday', stepSec: 900, vol: 0.002, baseVolume: 2_600_000 },
  '1m': { interval: '60m', count: 154, kind: 'intraday', stepSec: 3600, vol: 0.004, baseVolume: 9_000_000 },
  '6m': { interval: '1d', count: 126, kind: 'daily', stepSec: 86_400, vol: 0.012, baseVolume: 55_000_000 },
  '1y': { interval: '1d', count: 252, kind: 'daily', stepSec: 86_400, vol: 0.012, baseVolume: 55_000_000 },
  '5y': { interval: '1wk', count: 260, kind: 'weekly', stepSec: 7 * 86_400, vol: 0.028, baseVolume: 260_000_000 },
  max: { interval: '1mo', count: 240, kind: 'monthly', stepSec: 30 * 86_400, vol: 0.05, baseVolume: 1_100_000_000 },
};

const SESSION_OPEN_SEC = 13.5 * 3600; // 13:30 UTC ~ US market open
const SESSION_CLOSE_SEC = 20 * 3600;  // 20:00 UTC ~ US market close

/** Most recent weekday (UTC midnight epoch seconds) on/before the given day. */
function lastWeekdayUtc(fromMs: number): number {
  const d = new Date(fromMs);
  d.setUTCHours(0, 0, 0, 0);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return Math.floor(d.getTime() / 1000);
}

/** Build ascending bar timestamps ending near "now" for the given spec. */
function buildTimes(spec: SampleRangeSpec, count: number): number[] {
  const times: number[] = [];
  if (spec.kind === 'intraday') {
    let day = lastWeekdayUtc(Date.now());
    while (times.length < count) {
      const dayBars: number[] = [];
      for (let t = SESSION_OPEN_SEC; t < SESSION_CLOSE_SEC; t += spec.stepSec) {
        dayBars.push(day + t);
      }
      times.unshift(...dayBars);
      // step back to the previous weekday
      day = lastWeekdayUtc((day - 86_400) * 1000);
    }
    return times.slice(times.length - count);
  }
  if (spec.kind === 'daily') {
    let day = lastWeekdayUtc(Date.now());
    while (times.length < count) {
      times.unshift(day + SESSION_OPEN_SEC);
      day = lastWeekdayUtc((day - 86_400) * 1000);
    }
    return times;
  }
  if (spec.kind === 'weekly') {
    const anchor = lastWeekdayUtc(Date.now());
    for (let i = count - 1; i >= 0; i--) {
      times.push(anchor - i * 7 * 86_400 + SESSION_OPEN_SEC);
    }
    return times;
  }
  // monthly: first-of-month steps
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(1);
  for (let i = 0; i < count; i++) {
    times.unshift(Math.floor(d.getTime() / 1000) + SESSION_OPEN_SEC);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return times;
}

/** Deterministic random-walk candles for a symbol+range. */
export function sampleChart(symbol: string, range: ChartRange): ChartData {
  const sym = symbol.toUpperCase();
  const spec = SAMPLE_RANGE[range];
  const rng = mulberry32(stableHash(`${sym}|${range}`));
  const base = basePriceFor(sym);
  const times = buildTimes(spec, spec.count);
  const n = times.length;

  // Random walk anchored so the final close lands on the base price.
  const closes = new Array<number>(n);
  closes[n - 1] = base;
  for (let i = n - 2; i >= 0; i--) {
    const drift = (rng() - 0.495) * 2 * spec.vol;
    closes[i] = closes[i + 1] / (1 + drift);
  }

  const candles: Candle[] = [];
  let prevClose = closes[0] * (1 + (rng() - 0.5) * spec.vol);
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    const close = closes[i];
    const wick = Math.max(Math.abs(close - open), close * spec.vol * 0.5);
    const high = Math.max(open, close) + rng() * wick * 0.6;
    const low = Math.min(open, close) - rng() * wick * 0.6;
    candles.push({
      time: times[i],
      open: round2(open),
      high: round2(high),
      low: round2(Math.max(low, 0.01)),
      close: round2(close),
      volume: Math.round(spec.baseVolume * (0.4 + rng() * 1.2)),
    });
    prevClose = close;
  }

  const previousClose =
    range === '1d' ? round2(candles[0].open) : round2(candles[Math.max(0, n - 2)].close);

  return {
    symbol: sym,
    range,
    interval: spec.interval,
    candles,
    currency: 'USD',
    exchangeName: undefined,
    regularMarketPrice: round2(candles[n - 1].close),
    previousClose,
    source: 'sample',
  };
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

export function sampleQuote(symbol: string): Quote {
  const sym = symbol.toUpperCase();
  const chart = sampleChart(sym, '1d');
  const last = chart.candles[chart.candles.length - 1];
  const price = last.close;
  const previousClose = chart.previousClose ?? null;
  const change =
    previousClose !== null ? round2(price - previousClose) : null;
  const changePercent =
    previousClose !== null && previousClose !== 0 && change !== null
      ? round2((change / previousClose) * 100)
      : null;
  return {
    symbol: sym,
    price,
    change,
    changePercent,
    previousClose,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    source: 'sample',
  };
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

const NEWS_TEMPLATES: Array<(name: string, sym: string) => string> = [
  (name) => `${name} in focus as investors weigh the sector outlook`,
  (name, sym) => `Analysts revisit ${name} (${sym}) price targets after recent moves`,
  (name, sym) => `What the latest market swings mean for ${sym} holders`,
  (name) => `${name}: three things to watch this quarter`,
];

/** Deterministic placeholder news for the given symbols (offline mode). */
export function sampleNews(symbols: string[], perSymbol = 3): NewsItem[] {
  const items: NewsItem[] = [];
  const nowHour = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  for (const symbol of symbols.slice(0, 12)) {
    const sym = symbol.toUpperCase();
    const rng = mulberry32(stableHash(`news|${sym}`));
    const name = lookupName(sym) ?? sym;
    for (let i = 0; i < Math.min(perSymbol, NEWS_TEMPLATES.length); i++) {
      const ageHours = 2 + Math.floor(rng() * 20) + i * 24;
      items.push({
        id: `sample-${sym.toLowerCase()}-${i}`,
        title: NEWS_TEMPLATES[i](name, sym),
        url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`,
        sourceName: 'Sample Data',
        publishedAt: new Date(nowHour - ageHours * 3_600_000).toISOString(),
        relatedSymbol: sym,
        summary:
          'Offline sample headline — live news was unavailable when this was generated.',
      });
    }
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items;
}

// ---------------------------------------------------------------------------
// Earnings
// ---------------------------------------------------------------------------

export function sampleEarnings(symbol: string): EarningsEvent {
  const sym = symbol.toUpperCase();
  const hash = stableHash(sym);
  const daysOut = (hash % 28) + 2;
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysOut);
  return {
    symbol: sym,
    companyName: lookupName(sym) ?? sym,
    date: toYmd(date),
    time: hash % 2 === 0 ? 'bmo' : 'amc',
    epsEstimate: Math.round((((hash % 450) / 100) + 0.4) * 100) / 100,
    epsActual: Math.round((((hash % 470) / 100) + 0.35) * 100) / 100,
    epsSurprisePercent: Math.round((((hash % 21) - 8) / 100) * 1000) / 10,
    latestReportedDate: toYmd(new Date(Date.now() - 90 * 86_400_000)),
    source: 'sample',
  };
}
