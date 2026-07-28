import type { WatchlistItem } from './types';

export type WatchlistDropPosition = 'before' | 'after';

/**
 * Move one item beside another. Cross-section moves are rejected because
 * dragging a stock into the ETF section must not change its instrument type.
 */
export function moveWatchlistItem(
  items: readonly WatchlistItem[],
  sourceSymbol: string,
  targetSymbol: string,
  position: WatchlistDropPosition,
): WatchlistItem[] | null {
  const source = items.find((item) => item.symbol === sourceSymbol);
  const target = items.find((item) => item.symbol === targetSymbol);
  if (!source || !target || source.type !== target.type || source === target) return null;

  const next = items.filter((item) => item !== source);
  const targetIndex = next.indexOf(target);
  if (targetIndex < 0) return null;
  next.splice(targetIndex + (position === 'after' ? 1 : 0), 0, source);
  return next;
}

/**
 * Validate an untrusted IPC order before persisting it. A reorder must contain
 * every current symbol exactly once; malformed requests leave the list intact.
 */
export function applyWatchlistOrder(
  items: readonly WatchlistItem[],
  rawOrder: unknown,
): WatchlistItem[] | null {
  if (!Array.isArray(rawOrder) || rawOrder.length !== items.length) return null;
  if (!rawOrder.every((value) => typeof value === 'string')) return null;

  const bySymbol = new Map(items.map((item) => [item.symbol, item]));
  if (bySymbol.size !== items.length) return null;

  const seen = new Set<string>();
  const ordered: WatchlistItem[] = [];
  for (const rawSymbol of rawOrder) {
    const symbol = rawSymbol.trim().toUpperCase();
    const item = bySymbol.get(symbol);
    if (!item || seen.has(symbol)) return null;
    seen.add(symbol);
    ordered.push(item);
  }
  return ordered;
}
