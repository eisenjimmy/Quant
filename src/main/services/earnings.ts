// earnings:get — upcoming earnings per symbol via quoteSummary
// calendarEvents (+price for the company name). Cookie/crumb may fail at
// any time; each failed symbol degrades to a deterministic sample event.

import type { EarningsEvent, EarningsTime } from '../../shared/types';
import { TtlCache } from './cache';
import { lookupName } from './dataFiles';
import { sampleEarnings } from './sample';
import { pLimit, toYmd } from './util';
import { quoteSummary, rawNumber, YahooRawValue } from './yahoo';

const LIVE_TTL_MS = 6 * 60 * 60_000; // 6h
const SAMPLE_TTL_MS = 10 * 60_000; // retry live sooner after failures
const WINDOW_DAYS = 120;
const limit = pLimit(3);

// null = live said "no upcoming earnings" (cached so we don't refetch).
const cache = new TtlCache<EarningsEvent | null>(400);

function toEpochMs(value: YahooRawValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (value && typeof value === 'object') {
    const raw = value.raw;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw > 1e12 ? raw : raw * 1000;
    }
    const fmt = value.fmt;
    if (typeof fmt === 'string') {
      const ms = Date.parse(fmt);
      return Number.isNaN(ms) ? null : ms;
    }
  }
  return null;
}

function detectTime(candidates: Array<string | null | undefined>): EarningsTime {
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const v = c.toLowerCase();
    if (v.includes('bmo') || v.includes('before')) return 'bmo';
    if (v.includes('amc') || v.includes('after')) return 'amc';
  }
  return 'unknown';
}

async function fetchLiveEvent(symbol: string): Promise<EarningsEvent | null> {
  const summary = await quoteSummary(symbol, ['calendarEvents', 'earningsHistory', 'price']);
  const earnings = summary.calendarEvents?.earnings;
  const latestHistory = summary.earningsHistory?.history?.[0];
  const companyName =
    summary.price?.longName ||
    summary.price?.shortName ||
    lookupName(symbol) ||
    symbol;

  const dates = Array.isArray(earnings?.earningsDate) ? earnings.earningsDate : [];
  const startOfToday = Date.parse(`${toYmd(new Date())}T00:00:00Z`);
  const windowEnd = startOfToday + WINDOW_DAYS * 86_400_000;

  let nextMs: number | null = null;
  for (const d of dates) {
    const ms = toEpochMs(d);
    if (ms === null || ms < startOfToday || ms > windowEnd) continue;
    if (nextMs === null || ms < nextMs) nextMs = ms;
  }
  if (nextMs === null) return null; // live succeeded, nothing upcoming

  return {
    symbol,
    companyName,
    date: toYmd(new Date(nextMs)),
    time: detectTime([earnings?.earningsCallTime, earnings?.callTime]),
    epsEstimate: rawNumber(earnings?.earningsAverage),
    epsActual: rawNumber(latestHistory?.epsActual),
    epsSurprisePercent: rawNumber(latestHistory?.surprisePercent),
    latestReportedDate:
      latestHistory?.quarter === undefined
        ? null
        : (() => {
            const ms = toEpochMs(latestHistory.quarter);
            return ms === null ? null : toYmd(new Date(ms));
          })(),
    source: 'live',
  };
}

async function eventFor(symbol: string): Promise<EarningsEvent | null> {
  const cached = cache.get(symbol);
  if (cached !== undefined) return cached;
  try {
    const event = await limit(() => fetchLiveEvent(symbol));
    cache.set(symbol, event, LIVE_TTL_MS);
    return event;
  } catch {
    const event = sampleEarnings(symbol);
    cache.set(symbol, event, SAMPLE_TTL_MS);
    return event;
  }
}

export async function getEarnings(symbols: string[]): Promise<EarningsEvent[]> {
  const results = await Promise.all(symbols.map((s) => eventFor(s)));
  const events = results.filter((e): e is EarningsEvent => e !== null);
  events.sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol));
  return events;
}
