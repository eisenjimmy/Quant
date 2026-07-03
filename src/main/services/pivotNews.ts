// chart:pivot-news — for each detected pivot, find dated articles near the
// pivot: Google News RSS with a ±5 day window plus any Yahoo per-ticker RSS
// items that fall inside the window. Deduped by title, sorted by distance
// to the pivot, max 4 per pivot. One pivot failing never fails the batch,
// and input pivot order is preserved.

import type { NewsItem, PivotNewsResult, PivotPoint } from '../../shared/types';
import { searchGoogleNews, searchKoreanFinanceNews } from './googleNews';
import { fetchSymbolFeed } from './news';
import { normalizeTitle, pLimit, toYmd } from './util';

const WINDOW_DAYS = 5;
const DAY_MS = 86_400_000;
const GOOGLE_TTL_MS = 30 * 60_000; // per symbol+pivot-day window
const MAX_ITEMS_PER_PIVOT = 4;
const MAX_PIVOTS = 12;
const limit = pLimit(3);

async function newsForPivot(
  symbol: string,
  pivot: PivotPoint,
  yahooItems: NewsItem[],
): Promise<NewsItem[]> {
  const pivotMs = pivot.time * 1000;
  const startMs = pivotMs - WINDOW_DAYS * DAY_MS;
  let endMs = pivotMs + WINDOW_DAYS * DAY_MS;
  const nowMs = Date.now();
  if (endMs > nowMs) endMs = nowMs; // clamp 'before' to today
  const afterYmd = toYmd(new Date(Math.min(startMs, endMs - DAY_MS)));
  const beforeYmd = toYmd(new Date(endMs));

  const [google, korean] = await Promise.all([
    searchGoogleNews(symbol, afterYmd, beforeYmd, GOOGLE_TTL_MS).catch(() => [] as NewsItem[]),
    searchKoreanFinanceNews(symbol, GOOGLE_TTL_MS, afterYmd, beforeYmd).catch(
      () => [] as NewsItem[],
    ),
  ]);

  const inWindow = (item: NewsItem): boolean => {
    const ms = Date.parse(item.publishedAt);
    return !Number.isNaN(ms) && ms >= startMs - DAY_MS && ms <= endMs + DAY_MS;
  };

  const merged: NewsItem[] = [];
  const seen = new Set<string>();
  for (const item of [...google, ...korean, ...yahooItems.filter(inWindow)]) {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  merged.sort(
    (a, b) =>
      Math.abs(Date.parse(a.publishedAt) - pivotMs) -
      Math.abs(Date.parse(b.publishedAt) - pivotMs),
  );
  return merged.slice(0, MAX_ITEMS_PER_PIVOT);
}

export async function getPivotNews(
  symbol: string,
  pivots: PivotPoint[],
): Promise<PivotNewsResult[]> {
  const bounded = pivots.slice(0, MAX_PIVOTS);
  if (bounded.length === 0) return [];

  // Fetch the symbol's Yahoo feed once for the whole batch; a failure here
  // just means pivot windows rely on Google News alone.
  const yahooItems = await fetchSymbolFeed(symbol).catch(() => [] as NewsItem[]);

  const results = await Promise.all(
    bounded.map((pivot) =>
      limit(() => newsForPivot(symbol, pivot, yahooItems))
        .catch(() => [] as NewsItem[])
        .then((items): PivotNewsResult => ({ pivot, items })),
    ),
  );
  return results; // Promise.all preserves input order
}
