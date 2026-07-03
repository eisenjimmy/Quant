// Google News RSS search — used by pivotNews for date-bounded queries like
// "NVDA stock after:2026-01-05 before:2026-01-12". Item titles usually end
// with " - Publisher"; the <source> tag holds the publisher name.

import type { NewsItem } from '../../shared/types';
import { fetchText } from './http';
import { parseRssItems } from './rss';
import { hashId, parseDateMs } from './util';

/** Strip a trailing " - Publisher" suffix when it matches the source tag. */
function cleanTitle(title: string, publisher: string | undefined): string {
  const idx = title.lastIndexOf(' - ');
  if (idx <= 0) return title;
  const suffix = title.slice(idx + 3).trim();
  if (publisher && suffix.toLowerCase() === publisher.toLowerCase()) {
    return title.slice(0, idx).trim();
  }
  // No source tag: still strip a short trailing publisher-looking suffix.
  if (!publisher && suffix.length <= 40 && !suffix.includes(' - ')) {
    return title.slice(0, idx).trim();
  }
  return title;
}

/**
 * Search Google News for a symbol within a UTC date window (inclusive-ish;
 * Google treats after:/before: as day bounds). Cached by URL, which encodes
 * symbol + window, so repeat pivot lookups within ttlMs are free.
 */
export async function searchGoogleNews(
  symbol: string,
  afterYmd: string,
  beforeYmd: string,
  ttlMs: number,
): Promise<NewsItem[]> {
  const query = `${symbol} stock after:${afterYmd} before:${beforeYmd}`;
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}` +
    `&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url, { ttlMs });
  const items = parseRssItems(xml);

  const out: NewsItem[] = [];
  for (const item of items) {
    const publishedMs = parseDateMs(item.pubDate);
    if (publishedMs === null) continue; // undated items are useless near pivots
    const publisher = item.sourceName;
    out.push({
      id: `g-${hashId(`${item.link}|${item.title}`)}`,
      title: cleanTitle(item.title, publisher),
      url: item.link,
      sourceName: publisher || 'Google News',
      publishedAt: new Date(publishedMs).toISOString(),
      relatedSymbol: symbol,
    });
  }
  return out;
}

export async function searchKoreanFinanceNews(
  symbol: string,
  ttlMs: number,
  afterYmd?: string,
  beforeYmd?: string,
): Promise<NewsItem[]> {
  const dateClause = afterYmd && beforeYmd ? ` after:${afterYmd} before:${beforeYmd}` : '';
  const query = `site:finance.naver.com ${symbol} 주식 OR 증권${dateClause}`;
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}` +
    `&hl=ko&gl=KR&ceid=KR:ko`;
  const xml = await fetchText(url, { ttlMs });
  const items = parseRssItems(xml);

  const out: NewsItem[] = [];
  for (const item of items) {
    const publishedMs = parseDateMs(item.pubDate);
    if (publishedMs === null) continue;
    const publisher = item.sourceName;
    out.push({
      id: `kr-${hashId(`${item.link}|${item.title}`)}`,
      title: cleanTitle(item.title, publisher),
      url: item.link,
      sourceName: publisher ? `KR · ${publisher}` : 'KR · Naver Finance',
      publishedAt: new Date(publishedMs).toISOString(),
      relatedSymbol: symbol,
    });
  }
  return out;
}
