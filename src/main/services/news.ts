// news:get — Yahoo per-ticker RSS, fetched per symbol (concurrency 4,
// 10-minute TTL per feed), deduped across symbols by normalized title,
// sorted newest first, capped at 100. Total failure → deterministic
// sample items (sourceName 'Sample Data', ids prefixed 'sample-').

import type { NewsItem } from '../../shared/types';
import { searchKoreanFinanceNews } from './googleNews';
import { fetchText } from './http';
import { parseRssItems } from './rss';
import { sampleNews } from './sample';
import {
  hashId,
  normalizeTitle,
  parseDateMs,
  pLimit,
  stripHtml,
} from './util';

const FEED_TTL_MS = 10 * 60_000;
const MAX_SYMBOLS = 40;
const MAX_TOTAL = 100;
const limit = pLimit(4);

/**
 * Fetch and map the full Yahoo RSS feed for one symbol (uncapped).
 * Shared with pivotNews, which filters items into pivot windows.
 */
export async function fetchSymbolFeed(symbol: string): Promise<NewsItem[]> {
  const url =
    `https://feeds.finance.yahoo.com/rss/2.0/headline` +
    `?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  const xml = await fetchText(url, { ttlMs: FEED_TTL_MS });
  const items = parseRssItems(xml);

  const out: NewsItem[] = [];
  for (const item of items) {
    const publishedMs = parseDateMs(item.pubDate);
    const summary = item.description ? stripHtml(item.description).slice(0, 300) : undefined;
    out.push({
      id: `y-${hashId(`${item.link}|${item.title}`)}`,
      title: item.title,
      url: item.link,
      sourceName: item.sourceName || 'Yahoo Finance',
      publishedAt: new Date(publishedMs ?? Date.now()).toISOString(),
      relatedSymbol: symbol,
      summary: summary && summary !== item.title ? summary : undefined,
    });
  }
  return out;
}

export async function getNews(symbols: string[], limitPerSymbol = 6): Promise<NewsItem[]> {
  const requested = symbols.slice(0, MAX_SYMBOLS);
  if (requested.length === 0) return [];

  const perSymbol = await Promise.all(
    requested.map((symbol) =>
      limit(async () => {
        const [yahoo, korean] = await Promise.all([
          fetchSymbolFeed(symbol).catch(() => [] as NewsItem[]),
          searchKoreanFinanceNews(symbol, FEED_TTL_MS).catch(() => [] as NewsItem[]),
        ]);
        return [...yahoo.slice(0, limitPerSymbol), ...korean.slice(0, 2)];
      }).catch(() => null),
    ),
  );

  const allFailed = perSymbol.every((r) => r === null);
  if (allFailed) return sampleNews(requested);

  const seenTitles = new Set<string>();
  const merged: NewsItem[] = [];
  for (const feed of perSymbol) {
    if (!feed) continue;
    for (const item of feed.slice(0, limitPerSymbol + 2)) {
      const key = normalizeTitle(item.title);
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      merged.push(item);
    }
  }

  merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return merged.slice(0, MAX_TOTAL);
}
