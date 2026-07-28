// Persistent watchlist: JSON file in userData, seeded on first run.
// A corrupt file is replaced with the seed rather than crashing.

import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AddWatchlistResult,
  InstrumentType,
  WatchlistItem,
} from '../../shared/types';
import { directoryLookup } from './dataFiles';
import { searchSymbols } from './symbols';
import { normalizeSymbol } from './util';
import { applyWatchlistOrder } from '../../shared/watchlist';

const SEED: Array<{ symbol: string; name: string; type: InstrumentType }> = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf' },
  { symbol: 'SMH', name: 'VanEck Semiconductor ETF', type: 'etf' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock' },
];

let items: WatchlistItem[] | null = null;

function storePath(): string {
  return path.join(app.getPath('userData'), 'watchlist.json');
}

function seedItems(): WatchlistItem[] {
  const addedAt = new Date().toISOString();
  return SEED.map((s) => ({ ...s, addedAt }));
}

function isValidItem(value: unknown): value is WatchlistItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<WatchlistItem>;
  return (
    typeof item.symbol === 'string' &&
    normalizeSymbol(item.symbol) !== null &&
    typeof item.name === 'string' &&
    item.name.length > 0 &&
    (item.type === 'etf' || item.type === 'stock') &&
    typeof item.addedAt === 'string'
  );
}

function save(list: WatchlistItem[]): void {
  try {
    const file = storePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[watchlist] failed to persist:', err);
  }
}

function load(): WatchlistItem[] {
  if (items) return items;
  try {
    const raw = fs.readFileSync(storePath(), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isValidItem).map((item) => ({
        ...item,
        symbol: item.symbol.toUpperCase(),
      }));
      if (valid.length > 0 || parsed.length === 0) {
        items = valid;
        return items;
      }
    }
    throw new Error('unrecognized watchlist file shape');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') console.error('[watchlist] reseeding after load error:', err);
    items = seedItems();
    save(items);
    return items;
  }
}

export function getWatchlist(): WatchlistItem[] {
  return [...load()];
}

export function removeFromWatchlist(symbol: string): WatchlistItem[] {
  const sym = symbol.toUpperCase();
  const list = load().filter((item) => item.symbol !== sym);
  items = list;
  save(list);
  return [...list];
}

export function reorderWatchlist(rawOrder: unknown): WatchlistItem[] {
  const current = load();
  const reordered = applyWatchlistOrder(current, rawOrder);
  if (!reordered) return [...current];
  items = reordered;
  save(reordered);
  return [...reordered];
}

async function resolveSymbol(
  symbol: string,
): Promise<{ name: string; type: InstrumentType } | null> {
  try {
    const suggestions = await searchSymbols(symbol);
    const exact = suggestions.find((s) => s.symbol.toUpperCase() === symbol);
    if (exact) return { name: exact.name, type: exact.type };
  } catch {
    /* fall through to the offline directory */
  }
  const entry = directoryLookup(symbol);
  if (entry) return { name: entry.name, type: entry.type };
  return null;
}

export async function addToWatchlist(rawSymbol: string): Promise<AddWatchlistResult> {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return { ok: false, error: 'Invalid symbol' };

  const list = load();
  if (list.some((item) => item.symbol === symbol)) {
    return { ok: false, error: 'Already in watchlist' };
  }

  const resolved = await resolveSymbol(symbol);
  if (!resolved) return { ok: false, error: 'Symbol not found' };

  const item: WatchlistItem = {
    symbol,
    name: resolved.name,
    type: resolved.type,
    addedAt: new Date().toISOString(),
  };
  const next = [...list, item];
  items = next;
  save(next);
  return { ok: true, item, watchlist: [...next] };
}
