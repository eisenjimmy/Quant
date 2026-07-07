import type {
  DataSource,
  DetectedSignal,
  SignalKind,
  SignalScanRequest,
  SignalScanResult,
  SignalScanRow,
  SymbolSuggestion,
} from '../../shared/types';
import { detectStockSignals } from '../../shared/signals';
import { TtlCache } from './cache';
import { getChart } from './chart';
import { getSymbolDirectory } from './dataFiles';
import { clampInt, cleanSymbolList, normalizeSymbol, pLimit, toYmd } from './util';

const SCAN_TTL_MS = 30 * 60_000;
const MAX_SCAN_SYMBOLS = 500;
const DEFAULT_SCAN_SYMBOLS = 120;
const SIGNAL_SCAN_CONCURRENCY = 7;

const scanCache = new TtlCache<SignalScanResult>(20);

function ymdFromUnix(seconds: number | undefined): string {
  if (!seconds) return toYmd(new Date());
  return toYmd(new Date(seconds * 1000));
}

function compactSparkline(values: number[], points = 34): number[] {
  if (values.length <= points) return values.map((v) => Math.round(v * 100) / 100);
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const index = Math.round((i / (points - 1)) * (values.length - 1));
    out.push(Math.round(values[index] * 100) / 100);
  }
  return out;
}

function cleanSignalKinds(raw: unknown): SignalKind[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<SignalKind>([
    'cup-forming',
    'cup-handle',
    'ma-alignment',
    'near-52w-high',
    'new-52w-high',
    'vcp',
    'volume-surge',
    'golden-cross',
    'macd-bullish',
    'rs-strong',
    'momentum',
    'rebound',
    'mean-reversion',
  ]);
  const out: SignalKind[] = [];
  for (const value of raw) {
    if (allowed.has(value as SignalKind) && !out.includes(value as SignalKind)) {
      out.push(value as SignalKind);
    }
  }
  return out;
}

export function cleanSignalScanRequest(raw: unknown): SignalScanRequest {
  const r = raw && typeof raw === 'object' ? (raw as Partial<SignalScanRequest>) : {};
  return {
    universe: r.universe === 'watchlist' ? 'watchlist' : 'us-stocks',
    symbols: cleanSymbolList(r.symbols, MAX_SCAN_SYMBOLS),
    includeEtfs: r.includeEtfs === true,
    limit: clampInt(r.limit, 1, MAX_SCAN_SYMBOLS, DEFAULT_SCAN_SYMBOLS),
    signalKinds: cleanSignalKinds(r.signalKinds),
  };
}

function directoryUniverse(request: SignalScanRequest): SymbolSuggestion[] {
  const directory = getSymbolDirectory();
  if (request.universe === 'watchlist') {
    const symbols = (request.symbols ?? []).map((s) => normalizeSymbol(s)).filter((s): s is string => Boolean(s));
    const bySymbol = new Map(directory.map((entry) => [entry.symbol, entry]));
    return symbols.map((symbol) => {
      const entry = bySymbol.get(symbol);
      return {
        symbol,
        name: entry?.name ?? symbol,
        type: entry?.type ?? 'stock',
        exchange: entry?.exchange ?? 'US',
      };
    });
  }
  return directory
    .filter((entry) => request.includeEtfs || entry.type === 'stock')
    .filter((entry) => entry.exchange === 'NASDAQ' || entry.exchange === 'NYSE' || entry.exchange === 'NYSEArca')
    .map((entry) => ({
      symbol: entry.symbol,
      name: entry.name,
      type: entry.type,
      exchange: entry.exchange,
    }));
}

function addRsSignals(rows: SignalScanRow[], returns: Map<string, number | null>): void {
  const ranked = [...rows]
    .map((row) => ({ row, value: returns.get(row.symbol) }))
    .filter((entry): entry is { row: SignalScanRow; value: number } => typeof entry.value === 'number')
    .sort((a, b) => a.value - b.value);
  if (ranked.length < 5) return;
  ranked.forEach((entry, index) => {
    const percentile = Math.round((index / Math.max(1, ranked.length - 1)) * 100);
    entry.row.rsRank = percentile;
    if (percentile < 80) return;
    const topBucket = Math.max(1, 100 - percentile);
    const signal: DetectedSignal = {
      kind: 'rs-strong',
      label: 'RS strong',
      score: 12,
      detail: `Six-month return ranks in the top ${topBucket}% of the scanned universe.`,
      tone: 'bullish',
    };
    if (!entry.row.signals.some((s) => s.kind === signal.kind)) entry.row.signals.push(signal);
  });
}

function filterSignals(row: SignalScanRow, kinds: SignalKind[] | undefined): SignalScanRow {
  if (!kinds?.length) return row;
  return {
    ...row,
    signals: row.signals.filter((signal) => kinds.includes(signal.kind)),
  };
}

export async function scanSignals(rawRequest?: unknown): Promise<SignalScanResult> {
  const request = cleanSignalScanRequest(rawRequest);
  const universe = directoryUniverse(request);
  const selected = universe.slice(0, request.limit);
  const cacheKey = JSON.stringify({
    universe: request.universe,
    symbols: selected.map((s) => s.symbol),
    includeEtfs: request.includeEtfs,
    kinds: request.signalKinds,
  });
  const cached = scanCache.get(cacheKey);
  if (cached) return cached;

  const limit = pLimit(SIGNAL_SCAN_CONCURRENCY);
  const returns126 = new Map<string, number | null>();
  const scanned = await Promise.all(
    selected.map((entry) =>
      limit(async (): Promise<SignalScanRow | null> => {
        const chart = await getChart(entry.symbol, '1y');
        const candles = chart.candles;
        const latest = candles[candles.length - 1];
        if (!latest) return null;
        const detection = detectStockSignals(candles);
        returns126.set(entry.symbol, detection.metrics.return126);
        return {
          symbol: entry.symbol,
          name: entry.name,
          type: entry.type,
          exchange: entry.exchange,
          price: chart.regularMarketPrice ?? latest.close ?? null,
          changePercent: detection.metrics.changePercent,
          asOf: ymdFromUnix(latest.time),
          score: detection.signals.reduce((sum, signal) => sum + signal.score, 0),
          rsRank: null,
          distanceToHighPercent: detection.metrics.distanceToHighPercent,
          volumeRatio20: detection.metrics.volumeRatio20,
          signals: detection.signals,
          sparkline: compactSparkline(candles.slice(-90).map((c) => c.close)),
          source: chart.source,
        };
      }),
    ),
  );

  const allRows = scanned.filter((row): row is SignalScanRow => row !== null);
  addRsSignals(allRows, returns126);

  const rows = allRows
    .map((row) => {
      const filtered = filterSignals(row, request.signalKinds);
      return {
        ...filtered,
        score: filtered.signals.reduce((sum, signal) => sum + signal.score, 0),
        signals: filtered.signals.sort((a, b) => b.score - a.score),
      };
    })
    .filter((row) => row.signals.length > 0)
    .sort((a, b) => b.score - a.score || (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity));

  const source: DataSource = allRows.some((row) => row.source === 'live') ? 'live' : 'sample';
  const summary = {
    bullishPercent: allRows.length
      ? Math.round((rows.length / allRows.length) * 100)
      : 0,
    hotCount: rows.filter((row) => row.signals.some((s) => s.tone === 'hot')).length,
    nearHighCount: rows.filter((row) =>
      row.signals.some((s) => s.kind === 'near-52w-high' || s.kind === 'new-52w-high'),
    ).length,
    cupCount: rows.filter((row) =>
      row.signals.some((s) => s.kind === 'cup-forming' || s.kind === 'cup-handle'),
    ).length,
    maAlignedCount: rows.filter((row) => row.signals.some((s) => s.kind === 'ma-alignment')).length,
    source,
  };

  const result: SignalScanResult = {
    asOf: rows[0]?.asOf ?? ymdFromUnix(undefined),
    generatedAt: new Date().toISOString(),
    universe: request.universe ?? 'us-stocks',
    totalUniverse: universe.length,
    totalScanned: allRows.length,
    rows,
    summary,
    source,
  };
  scanCache.set(cacheKey, result, SCAN_TTL_MS);
  return result;
}
