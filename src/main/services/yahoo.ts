// Yahoo Finance client. The v8 chart and v1 search endpoints work with just
// a browser UA. quoteSummary (v10) requires a cookie + crumb pair, which may
// fail at any time — callers must degrade gracefully when it throws.

import { BROWSER_UA, fetchJson, HttpError } from './http';

// ---------------------------------------------------------------------------
// Raw response shapes (typed at the JSON parse boundary; fields optional)
// ---------------------------------------------------------------------------

export interface YahooChartMeta {
  currency?: string | null;
  exchangeName?: string | null;
  regularMarketPrice?: number | null;
  chartPreviousClose?: number | null;
  previousClose?: number | null;
  marketState?: string | null;
}

export interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: Array<number | null>;
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
}

export interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchDisp?: string;
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
}

/** raw number | {raw: number} | formatted-string unions from quoteSummary */
export type YahooRawValue =
  | number
  | string
  | { raw?: number | null; fmt?: string | null }
  | null
  | undefined;

export interface YahooQuoteSummaryResult {
  price?: {
    longName?: string | null;
    shortName?: string | null;
    marketState?: string | null;
    regularMarketPrice?: YahooRawValue;
    marketCap?: YahooRawValue;
  };
  summaryDetail?: {
    trailingPE?: YahooRawValue;
    forwardPE?: YahooRawValue;
    priceToSalesTrailing12Months?: YahooRawValue;
    priceToBook?: YahooRawValue;
  };
  defaultKeyStatistics?: {
    enterpriseValue?: YahooRawValue;
    enterpriseToRevenue?: YahooRawValue;
    enterpriseToEbitda?: YahooRawValue;
    forwardEps?: YahooRawValue;
    sharesOutstanding?: YahooRawValue;
  };
  financialData?: {
    totalRevenue?: YahooRawValue;
    grossProfits?: YahooRawValue;
    ebitda?: YahooRawValue;
    netIncomeToCommon?: YahooRawValue;
    profitMargins?: YahooRawValue;
    revenueGrowth?: YahooRawValue;
    targetMeanPrice?: YahooRawValue;
  };
  earningsHistory?: {
    history?: Array<{
      quarter?: YahooRawValue;
      epsActual?: YahooRawValue;
      epsEstimate?: YahooRawValue;
      surprisePercent?: YahooRawValue;
    }>;
  };
  topHoldings?: {
    holdings?: Array<{
      symbol?: string;
      holdingName?: string;
      holdingPercent?: YahooRawValue;
    }>;
  };
  calendarEvents?: {
    earnings?: {
      earningsDate?: YahooRawValue[];
      earningsAverage?: YahooRawValue;
      earningsCallTime?: string | null;
      callTime?: string | null;
      isEarningsDateEstimate?: YahooRawValue | boolean;
    };
  };
}

interface YahooQuoteSummaryResponse {
  quoteSummary?: {
    result?: YahooQuoteSummaryResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
}

/** Coerce Yahoo's number | {raw} unions to a finite number or null. */
export function rawNumber(value: YahooRawValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object') {
    const raw = value.raw;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Chart + search (no auth)
// ---------------------------------------------------------------------------

export async function fetchYahooChart(
  symbol: string,
  yahooRange: string,
  interval: string,
  ttlMs: number,
): Promise<YahooChartResult> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=${encodeURIComponent(yahooRange)}&interval=${encodeURIComponent(interval)}&includePrePost=false`;
  const json = await fetchJson<YahooChartResponse>(url, { ttlMs });
  const result = json.chart?.result?.[0];
  if (!result || !result.meta) {
    const desc = json.chart?.error?.description ?? 'empty chart result';
    throw new Error(`Yahoo chart failed for ${symbol}: ${desc}`);
  }
  return result;
}

export async function searchYahoo(query: string): Promise<YahooSearchQuote[]> {
  const url =
    `https://query1.finance.yahoo.com/v1/finance/search` +
    `?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
  const json = await fetchJson<YahooSearchResponse>(url, { ttlMs: 10 * 60_000 });
  return Array.isArray(json.quotes) ? json.quotes : [];
}

// ---------------------------------------------------------------------------
// Cookie + crumb (needed for quoteSummary; unverified endpoint — may fail)
// ---------------------------------------------------------------------------

interface CrumbState {
  cookie: string;
  crumb: string;
  fetchedAt: number;
}

const CRUMB_TTL_MS = 30 * 60_000;
let crumbState: CrumbState | null = null;
let crumbPromise: Promise<CrumbState> | null = null;

function invalidateCrumb(): void {
  crumbState = null;
}

async function fetchCookie(): Promise<string> {
  // fc.yahoo.com typically 404s — we only want its Set-Cookie header.
  const res = await fetch('https://fc.yahoo.com/', {
    headers: { 'User-Agent': BROWSER_UA },
    redirect: 'manual',
    signal: AbortSignal.timeout(12_000),
  });
  let cookies: string[] = [];
  try {
    cookies = res.headers.getSetCookie();
  } catch {
    /* older runtimes */
  }
  if (cookies.length === 0) {
    const single = res.headers.get('set-cookie');
    if (single) cookies = [single];
  }
  const parts = cookies
    .map((c) => c.split(';')[0].trim())
    .filter((c) => c.includes('='));
  if (parts.length === 0) throw new Error('Yahoo returned no cookie');
  return parts.join('; ');
}

async function fetchCrumbState(): Promise<CrumbState> {
  const cookie = await fetchCookie();
  const res = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': BROWSER_UA, Cookie: cookie },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new HttpError(`getcrumb HTTP ${res.status}`, res.status);
  const crumb = (await res.text()).trim();
  if (!crumb || crumb.length > 64 || crumb.includes('<') || crumb.includes('{')) {
    throw new Error('Yahoo returned an invalid crumb');
  }
  return { cookie, crumb, fetchedAt: Date.now() };
}

async function getCrumb(force = false): Promise<CrumbState> {
  if (force) invalidateCrumb();
  if (crumbState && Date.now() - crumbState.fetchedAt < CRUMB_TTL_MS) {
    return crumbState;
  }
  if (!crumbPromise) {
    crumbPromise = fetchCrumbState()
      .then((state) => {
        crumbState = state;
        return state;
      })
      .finally(() => {
        crumbPromise = null;
      });
  }
  return crumbPromise;
}

/**
 * Fetch quoteSummary modules for a symbol. Throws on any failure — callers
 * fall back to bundled/sample data. Results are NOT cached here (services
 * keep their own longer-lived caches keyed by symbol).
 */
export async function quoteSummary(
  symbol: string,
  modules: string[],
): Promise<YahooQuoteSummaryResult> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { cookie, crumb } = await getCrumb(attempt > 0);
    const url =
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}` +
      `?modules=${encodeURIComponent(modules.join(','))}&crumb=${encodeURIComponent(crumb)}`;
    try {
      const json = await fetchJson<YahooQuoteSummaryResponse>(url, {
        ttlMs: 0,
        headers: { Cookie: cookie },
      });
      const result = json.quoteSummary?.result?.[0];
      if (!result) {
        const desc = json.quoteSummary?.error?.description ?? 'empty result';
        throw new Error(`quoteSummary failed for ${symbol}: ${desc}`);
      }
      return result;
    } catch (err) {
      lastErr = err;
      const status = err instanceof HttpError ? err.status : undefined;
      if ((status === 401 || status === 403) && attempt === 0) {
        invalidateCrumb();
        continue; // one retry with a fresh crumb
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`quoteSummary failed for ${symbol}`);
}
