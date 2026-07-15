import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
  DetectedSignal,
  SignalKind,
  SignalScanRequest,
  SignalScanResult,
  SignalScanRow,
} from '../../shared/types';
import { api } from '../api';
import { useApp } from '../store';

const SIGNAL_FILTERS: Array<{ kind: SignalKind | 'all'; label: string }> = [
  { kind: 'all', label: 'All' },
  { kind: 'cup-forming', label: 'Cup' },
  { kind: 'cup-handle', label: 'Cup handle' },
  { kind: 'ma-alignment', label: 'MA alignment' },
  { kind: 'near-52w-high', label: 'Near high' },
  { kind: 'new-52w-high', label: '52W high' },
  { kind: 'vcp', label: 'VCP' },
  { kind: 'volume-surge', label: 'Volume' },
  { kind: 'golden-cross', label: 'Golden cross' },
  { kind: 'macd-bullish', label: 'MACD' },
  { kind: 'rs-strong', label: 'RS strong' },
  { kind: 'rebound', label: 'Rebound' },
];

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: value >= 100 ? 2 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function timeLabel(iso: string | undefined): string {
  if (!iso) return 'n/a';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'n/a';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const points = useMemo(() => {
    if (values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(0.01, max - min);
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 96;
        const y = 26 - ((value - min) / span) * 22;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values]);
  return (
    <svg className="sb-spark" viewBox="0 0 96 30" role="img" aria-label="Price sparkline">
      <polyline className={positive ? 'is-up' : 'is-down'} points={points} />
    </svg>
  );
}

function SignalBadge({ signal }: { signal: DetectedSignal }) {
  return (
    <span className={`sb-badge is-${signal.tone}`} title={signal.detail}>
      {signal.label}
    </span>
  );
}

function SummaryMeter({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'hot' | 'up';
}) {
  return (
    <div className={`sb-meter is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{detail}</em>
    </div>
  );
}

function SignalSkeleton() {
  return (
    <div className="sb-skeleton" role="status" aria-label="Scanning signal evidence">
      <div className="sb-skeleton-status">
        <span className="sb-scan-dot" aria-hidden="true" />
        <div><strong>Scanning end-of-day evidence</strong><span>Ranking deterministic signals across the selected universe</span></div>
      </div>
      {Array.from({ length: 7 }, (_, index) => (
        <div className="sb-skeleton-row qn-stagger" key={index} style={{ '--motion-index': index } as CSSProperties} aria-hidden="true">
          <div><span className="skeleton is-name" /><span className="skeleton is-meta" /></div>
          <span className="skeleton is-signals" />
          <span className="skeleton is-factors" />
          <span className="skeleton is-chart" />
          <span className="skeleton is-price" />
        </div>
      ))}
    </div>
  );
}

function filterRow(row: SignalScanRow, signalFilter: SignalKind | 'all', query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q && !row.symbol.toLowerCase().includes(q) && !row.name.toLowerCase().includes(q)) {
    return false;
  }
  if (signalFilter === 'all') return true;
  return row.signals.some((signal) => signal.kind === signalFilter);
}

function rowSignals(row: SignalScanRow, signalFilter: SignalKind | 'all'): DetectedSignal[] {
  if (signalFilter === 'all') return row.signals.slice(0, 7);
  return row.signals.filter((signal) => signal.kind === signalFilter);
}

export function SignalBoard() {
  const { state, actions } = useApp();
  const [result, setResult] = useState<SignalScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [signalFilter, setSignalFilter] = useState<SignalKind | 'all'>('all');
  const [mode, setMode] = useState<'us-stocks' | 'watchlist'>('us-stocks');
  const [includeEtfs, setIncludeEtfs] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const watchlistSymbols = useMemo(() => state.watchlist.map((item) => item.symbol), [state.watchlist]);
  const isSmoke = new URLSearchParams(window.location.search).get('smokeTab') === 'signals';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const request: SignalScanRequest = {
      universe: mode,
      symbols: mode === 'watchlist' ? watchlistSymbols : undefined,
      includeEtfs,
      limit: isSmoke ? 24 : 160,
    };
    try {
      const next = await api.scanSignals(request);
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signal scan failed.');
    } finally {
      setLoading(false);
    }
  }, [includeEtfs, isSmoke, mode, watchlistSymbols]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const rows = useMemo(() => {
    const source = result?.rows ?? [];
    return source.filter((row) => filterRow(row, signalFilter, query));
  }, [query, result, signalFilter]);

  const activeCount = rows.length;
  const coverageValue = result ? `${result.totalScanned}/${result.totalUniverse}` : loading ? '...' : '--';
  const coverageDetail = result
    ? `screened · ${result.source === 'sample' ? 'sample fallback' : 'live/cache'}`
    : 'screening';

  return (
    <section className="sb-panel" aria-label="Signal board">
      <header className="sb-head">
        <div>
          <h2>Today&apos;s Signals</h2>
          <p>Daily-candle technical scan for cup bases, moving-average alignment, highs, VCP, volume, and momentum.</p>
        </div>
        <div className="sb-head-actions">
          <span className="sb-asof">
            {result ? `${result.asOf} daily bar · ${timeLabel(result.generatedAt)}` : 'Preparing scan'}
          </span>
          <button type="button" className="sb-refresh" onClick={() => setReloadKey((n) => n + 1)}>
            Refresh
          </button>
        </div>
      </header>

      <div className="sb-toolbar">
        <div className="sb-segment" aria-label="Universe">
          <button
            type="button"
            className={mode === 'us-stocks' ? 'is-active' : ''}
            onClick={() => setMode('us-stocks')}
          >
            US stocks
          </button>
          <button
            type="button"
            className={mode === 'watchlist' ? 'is-active' : ''}
            onClick={() => setMode('watchlist')}
          >
            Watchlist
          </button>
        </div>
        <label className="sb-check">
          <input
            type="checkbox"
            checked={includeEtfs}
            onChange={(event) => setIncludeEtfs(event.currentTarget.checked)}
          />
          Include ETFs
        </label>
        <input
          className="sb-search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search symbol or company"
        />
      </div>

      <div className="sb-summary" aria-label="Signal scan summary">
        <div className="qn-stagger" style={{ '--motion-index': 0 } as CSSProperties}><SummaryMeter label="Coverage" value={coverageValue} detail={coverageDetail} tone="neutral" /></div>
        <div className="qn-stagger" style={{ '--motion-index': 1 } as CSSProperties}><SummaryMeter label="Signal breadth" value={result ? `${result.summary.bullishPercent}%` : '--'} detail={`${activeCount} visible matches`} tone="up" /></div>
        <div className="qn-stagger" style={{ '--motion-index': 2 } as CSSProperties}><SummaryMeter label="Heat" value={result ? String(result.summary.hotCount) : '--'} detail="hot signals" tone="hot" /></div>
        <div className="qn-stagger" style={{ '--motion-index': 3 } as CSSProperties}><SummaryMeter label="Near highs" value={result ? String(result.summary.nearHighCount) : '--'} detail="52W proximity" tone="up" /></div>
        <div className="qn-stagger" style={{ '--motion-index': 4 } as CSSProperties}><SummaryMeter label="Bases" value={result ? String(result.summary.cupCount) : '--'} detail="cup patterns" tone="neutral" /></div>
        <div className="qn-stagger" style={{ '--motion-index': 5 } as CSSProperties}><SummaryMeter label="MA order" value={result ? String(result.summary.maAlignedCount) : '--'} detail="bullish stacks" tone="up" /></div>
      </div>

      <div className="sb-filters" aria-label="Signal filters">
        {SIGNAL_FILTERS.map((filter) => (
          <button
            key={filter.kind}
            type="button"
            className={signalFilter === filter.kind ? 'is-active' : ''}
            onClick={() => setSignalFilter(filter.kind)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="sb-list" aria-busy={loading}>
        {loading && (
          <SignalSkeleton />
        )}
        {!loading && error && (
          <div className="sb-state is-error">
            <strong>Signal scan failed</strong>
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="sb-state">
            <strong>No matches for this filter</strong>
            <span>Clear the search or choose another signal family.</span>
          </div>
        )}
        {!loading &&
          !error &&
          rows.map((row, index) => {
            const changeUp = (row.changePercent ?? 0) >= 0;
            return (
              <button
                type="button"
                className="sb-row qn-stagger"
                key={row.symbol}
                style={{ '--motion-index': Math.min(index, 14) } as CSSProperties}
                onClick={() => actions.openChart(row.symbol)}
              >
                <span className="sb-company">
                  <strong>{row.name}</strong>
                  <em>
                    {row.symbol} · {row.exchange ?? 'US'} · score {row.score}
                  </em>
                </span>
                <span className="sb-row-signals">
                  {rowSignals(row, signalFilter).map((signal) => (
                    <SignalBadge key={`${row.symbol}-${signal.kind}`} signal={signal} />
                  ))}
                </span>
                <span className="sb-row-meta">
                  {row.rsRank !== null && <em>RS {row.rsRank}</em>}
                  {row.distanceToHighPercent !== null && <em>{row.distanceToHighPercent}% from high</em>}
                  {row.volumeRatio20 !== null && <em>Vol {row.volumeRatio20}x</em>}
                </span>
                <Sparkline values={row.sparkline} positive={changeUp} />
                <span className={changeUp ? 'sb-price is-up' : 'sb-price is-down'}>
                  <strong>{money(row.price)}</strong>
                  <em>{pct(row.changePercent)}</em>
                </span>
              </button>
            );
          })}
      </div>
    </section>
  );
}
