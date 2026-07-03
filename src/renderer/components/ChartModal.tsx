// ChartModal — the app's centerpiece. Webull-style candlestick chart with
// volume, auto-detected pivots, projected support/resistance, and an async
// right-hand panel that fetches news around each pivot AFTER the chart has
// rendered. Remounted per symbol via key={symbol} in App.tsx.

import '../styles/chart-modal.css';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CHART_RANGES } from '../../shared/types';
import type {
  ChartRange,
  EarningsEvent,
  MacroOverlayKey,
  ValuationSnapshot,
} from '../../shared/types';
import { evaluateSignal } from '../../shared/quant';
import { api } from '../api';
import { useApp } from '../store';
import { ChartCanvas } from './chart/ChartCanvas';
import type { ChartCanvasHandle } from './chart/ChartCanvas';
import { PivotNewsPanel } from './chart/PivotNewsPanel';
import { QuantAgentPanel } from './chart/QuantAgentPanel';
import { QuantDecisionPanel } from './chart/QuantDecisionPanel';
import { computeTrendLines, findPivots } from './chart/analysis';
import type { TrendLines } from './chart/analysis';
import { useChartData } from './chart/useChartData';
import {
  DEFAULT_OVERLAYS,
  OverlaySelection,
  useMacroOverlays,
} from './chart/useMacroOverlays';
import { usePivotNews } from './chart/usePivotNews';
import { useSoundCues } from './chart/useSoundCues';
import {
  formatPrice,
  formatSigned,
  formatSignedPercent,
  isIntradayRange,
} from './chart/format';

const DEFAULT_RANGE: ChartRange = '1y';
const EMPTY_LINES: TrendLines = { support: [], resistance: [] };
const SETTINGS_KEY = 'quant.chart.settings.v1';

type RailTab = 'signal' | 'ai' | 'news';

interface ChartModalSettings {
  showRiskOverlay: boolean;
  overlays: OverlaySelection;
  soundEnabled: boolean;
  activeRailTab: RailTab;
}

const DEFAULT_SETTINGS: ChartModalSettings = {
  showRiskOverlay: true,
  overlays: DEFAULT_OVERLAYS,
  soundEnabled: true,
  activeRailTab: 'signal',
};

function loadSettings(): ChartModalSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<ChartModalSettings>;
    return {
      showRiskOverlay:
        typeof parsed.showRiskOverlay === 'boolean'
          ? parsed.showRiskOverlay
          : DEFAULT_SETTINGS.showRiskOverlay,
      overlays: {
        jobs: parsed.overlays?.jobs === true,
        unemployment: parsed.overlays?.unemployment === true,
        inflation: parsed.overlays?.inflation === true,
        treasury10y: parsed.overlays?.treasury10y === true,
        oil: parsed.overlays?.oil === true,
        vix: parsed.overlays?.vix === true,
      },
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
      activeRailTab:
        parsed.activeRailTab === 'news' || parsed.activeRailTab === 'ai'
          ? parsed.activeRailTab
          : 'signal',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: ChartModalSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* localStorage can be unavailable in unusual profiles */
  }
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2.5l6 10.5H2L8 2.5z" />
      <path d="M8 7v3M8 12.2v.01" />
    </svg>
  );
}

function overlayLabel(key: MacroOverlayKey): string {
  switch (key) {
    case 'jobs':
      return 'Jobs';
    case 'unemployment':
      return 'Unemp';
    case 'inflation':
      return 'CPI';
    case 'treasury10y':
      return '10Y';
    case 'oil':
      return 'Oil';
    case 'vix':
      return 'VIX';
  }
}

function OverlayTooltip({ overlayKey }: { overlayKey: MacroOverlayKey }) {
  if (overlayKey === 'vix') {
    return (
      <span className="cm-tool-tip vix" role="tooltip">
        <span className="cm-vix-art" aria-hidden="true" />
        <strong>VIX interpretation</strong>
        <span className="cm-vix-grid">
          <b>10-15</b><span>Calm market</span>
          <b>15-20</b><span>Normal / mildly active</span>
          <b>20-30</b><span>Elevated fear or uncertainty</span>
          <b>30+</b><span>Stress, panic, crash-risk pricing</span>
          <b>40+</b><span>Extreme market fear</span>
        </span>
        <span className="cm-vix-rules">
          <b>Low VIX</b>
          <span>Smaller expected moves; breakouts may be weaker; mean reversion can work better.</span>
          <b>High VIX</b>
          <span>Wider stops needed; reduce position size; false breakouts become more common; risk control matters more than entry precision.</span>
        </span>
        <em>Expected 30-day S&P 500 move ≈ VIX / √12</em>
        <span>Example: VIX 24 / √12 ≈ 6.9%</span>
      </span>
    );
  }
  const text =
    overlayKey === 'jobs'
      ? 'Job growth helps frame economic momentum and sector rotation risk.'
      : overlayKey === 'unemployment'
        ? 'Unemployment helps identify labor-cycle stress or late-cycle cooling.'
        : overlayKey === 'inflation'
          ? 'CPI inflation affects rates, margins, discount rates, and equity multiples.'
          : overlayKey === 'treasury10y'
            ? 'The 10Y yield is a discount-rate anchor for ETF valuation and duration risk.'
            : 'Oil prices affect inflation, energy ETFs, transport costs, and consumer margins.';
  return (
    <span className="cm-tool-tip" role="tooltip">
      {text}
    </span>
  );
}

export function ChartModal({ symbol }: { symbol: string }) {
  const { state, actions } = useApp();
  const initialSettings = useMemo(loadSettings, []);
  const [range, setRange] = useState<ChartRange>(DEFAULT_RANGE);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [showRiskOverlay, setShowRiskOverlay] = useState(initialSettings.showRiskOverlay);
  const [overlays, setOverlays] = useState<OverlaySelection>(initialSettings.overlays);
  const [activeRailTab, setActiveRailTab] = useState<RailTab>(initialSettings.activeRailTab);
  const [valuation, setValuation] = useState<ValuationSnapshot | null>(null);
  const [earnings, setEarnings] = useState<EarningsEvent | null>(null);
  const canvasRef = useRef<ChartCanvasHandle | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastBarRef = useRef<number | null>(null);

  const { data, loading, error, generation, retry, loadOlder, loadingOlder } = useChartData(
    symbol,
    range,
  );
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, play } = useSoundCues(
    initialSettings.soundEnabled,
  );
  const { series: macroSeries, loading: macroLoading } = useMacroOverlays(range, overlays);

  const pivots = useMemo(
    () => (data && data.candles.length > 0 ? findPivots(data.candles) : []),
    [data],
  );
  const trendLines = useMemo(
    () =>
      data && pivots.length > 0
        ? computeTrendLines(data.candles, pivots)
        : EMPTY_LINES,
    [data, pivots],
  );
  const { groups, pending } = usePivotNews(symbol, range, pivots, generation);
  const pivotNewsForAi = useMemo(
    () =>
      groups
        .filter((group) => group.status === 'done')
        .map((group) => ({ pivot: group.pivot, items: group.items })),
    [groups],
  );
  const evaluation = useMemo(
    () => (data && data.candles.length > 0 ? evaluateSignal(symbol, data.candles, pivots) : null),
    [data, pivots, symbol],
  );

  // A pivot's marker gains its number once its news arrived non-empty.
  const numbered = useMemo(
    () => groups.map((g) => g.status === 'done' && g.items.length > 0),
    [groups],
  );

  // New generation (range switch / retry) → any panel-hover highlight is stale.
  useEffect(() => setHighlight(null), [generation]);
  useEffect(() => {
    saveSettings({ showRiskOverlay, overlays, soundEnabled, activeRailTab });
  }, [activeRailTab, overlays, showRiskOverlay, soundEnabled]);
  useEffect(() => play('open'), [play]);
  useEffect(() => {
    const lastBar = data?.candles[data.candles.length - 1]?.time ?? null;
    if (lastBarRef.current !== null && lastBar !== null && lastBar !== lastBarRef.current) {
      play('bar');
    }
    lastBarRef.current = lastBar;
  }, [data, play]);
  useEffect(() => {
    if (evaluation?.decision === 'buy-candidate') play('up');
    if (evaluation?.decision === 'short-candidate' || evaluation?.decision === 'invalidated') play('down');
  }, [evaluation?.decision, play]);
  useEffect(() => {
    let cancelled = false;
    setValuation(null);
    setEarnings(null);
    api.getValuation(symbol).then(
      (result) => {
        if (!cancelled) setValuation(result);
      },
      () => undefined,
    );
    api.getEarnings([symbol]).then(
      (items) => {
        if (!cancelled) setEarnings(items[0] ?? null);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  // ✕ takes focus on mount. The modal only closes through the explicit X.
  useEffect(() => closeRef.current?.focus(), []);

  // Minimal focus trap: Tab wraps within the dialog.
  const trapTab = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const handleHoverPivot = useCallback((i: number | null) => setHighlight(i), []);
  const handleSelectPivot = useCallback((i: number) => {
    canvasRef.current?.scrollToPivot(i);
  }, []);

  // ---- Header quote: live quote first, chart meta as fallback ----
  const watchItem = state.watchlist.find((w) => w.symbol === symbol);
  const isWatched = Boolean(watchItem);
  const quote = state.quotes[symbol];
  const price = quote?.price ?? data?.regularMarketPrice ?? null;
  let change = quote?.change ?? null;
  let changePercent = quote?.changePercent ?? null;
  if (change === null && price !== null) {
    const prev = quote?.previousClose ?? data?.previousClose ?? null;
    if (prev !== null) {
      change = price - prev;
      changePercent = prev !== 0 ? (change / prev) * 100 : null;
    }
  }
  const direction = change === null ? '' : change >= 0 ? 'up' : 'down';

  const empty = !loading && !error && data !== null && data.candles.length === 0;

  return (
    <div className="cm-backdrop">
      <div
        ref={panelRef}
        className="cm-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${symbol} chart`}
        onKeyDown={trapTab}
      >
        <header className="cm-header">
          <div className="cm-ident">
            <span className="cm-symbol num">{symbol}</span>
            {watchItem && (
              <span className="cm-name" title={watchItem.name}>
                {watchItem.name}
              </span>
            )}
          </div>
          {price !== null && (
            <div className="cm-quote">
              <span className="cm-price num">{formatPrice(price)}</span>
              {change !== null && (
                <span className={`cm-chip num ${direction}`}>
                  {formatSigned(change)}
                  {changePercent !== null
                    ? ` (${formatSignedPercent(changePercent)})`
                    : ''}
                </span>
              )}
            </div>
          )}
          {data &&
            (data.source === 'sample' ? (
              <span className="cm-src sample" title="Bundled offline fallback data">
                SAMPLE
              </span>
            ) : (
              <span className="cm-src live" title="Live market data">
                <span className="cm-live-dot" aria-hidden="true" />
                LIVE
              </span>
            ))}
          <button
            type="button"
            className={isWatched ? 'cm-watch-action remove' : 'cm-watch-action add'}
            onClick={() => {
              if (isWatched) void actions.removeSymbol(symbol);
              else void actions.addSymbol(symbol);
            }}
          >
            {isWatched ? 'Remove symbol' : 'Add symbol'}
          </button>
          <div className="cm-ranges" role="group" aria-label="Chart range">
            {CHART_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={r === range}
                onClick={() => setRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="cm-tools" role="group" aria-label="Chart overlays">
            <button
              type="button"
              aria-pressed={showRiskOverlay}
              onClick={() => setShowRiskOverlay((v) => !v)}
            >
              Risk
            </button>
            {(['jobs', 'unemployment', 'inflation', 'treasury10y', 'oil', 'vix'] as const).map((key) => (
              <span key={key} className="cm-tool-wrap">
                <button
                  type="button"
                  aria-pressed={overlays[key]}
                  onClick={() =>
                    setOverlays((current) => ({ ...current, [key]: !current[key] }))
                  }
                >
                  {overlayLabel(key)}
                </button>
                <OverlayTooltip overlayKey={key} />
              </span>
            ))}
            <button
              type="button"
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((v) => !v)}
              title="Toggle sound cues"
            >
              Sound
            </button>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="cm-close"
            onClick={() => actions.closeChart()}
            aria-label="Close chart"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="cm-body">
          <div className="cm-chart-area">
            {data && data.candles.length > 0 && (
              <ChartCanvas
                ref={canvasRef}
                data={data}
                pivots={pivots}
                trendLines={trendLines}
                numbered={numbered}
                highlight={highlight}
                macroOverlays={macroSeries}
                riskPlan={evaluation?.risk ?? null}
                showRiskOverlay={showRiskOverlay}
                onNeedMoreHistory={loadOlder}
              />
            )}
            {loading && (
              <div className="cm-overlay">
                <span
                  className="spinner"
                  role="status"
                  aria-label="Loading chart"
                />
              </div>
            )}
            {!loading && error !== null && (
              <div className="cm-overlay">
                <div className="cm-state" role="alert">
                  <AlertIcon />
                  <p>Couldn't load this chart.</p>
                  <p className="cm-state-detail">{error}</p>
                  <button type="button" className="cm-btn" onClick={retry}>
                    Retry
                  </button>
                </div>
              </div>
            )}
            {empty && (
              <div className="cm-overlay">
                <div className="cm-state">
                  <p>No data for this range.</p>
                  <p className="cm-state-detail">
                    Try a different range from the toggle above.
                  </p>
                </div>
              </div>
            )}
            {(loadingOlder || macroLoading) && !loading && (
              <div className="cm-corner-status">
                {loadingOlder ? 'Loading older history' : 'Loading overlay'}
              </div>
            )}
          </div>
          <div className="cm-right-rail">
            <div className="cm-rail-tabs" role="tablist" aria-label="Chart side panel">
              <button
                type="button"
                role="tab"
                aria-selected={activeRailTab === 'signal'}
                aria-controls="cm-tab-signal"
                id="cm-tab-signal-button"
                onClick={() => setActiveRailTab('signal')}
              >
                Signal Desk
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRailTab === 'ai'}
                aria-controls="cm-tab-ai"
                id="cm-tab-ai-button"
                onClick={() => setActiveRailTab('ai')}
              >
                Quant AI
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRailTab === 'news'}
                aria-controls="cm-tab-news"
                id="cm-tab-news-button"
                onClick={() => setActiveRailTab('news')}
              >
                News
                {!loading && !error && pivots.length > 0 && (
                  <span className="num">{pivots.length}</span>
                )}
              </button>
            </div>
            <div className="cm-rail-content">
              {activeRailTab === 'signal' ? (
                <div
                  id="cm-tab-signal"
                  role="tabpanel"
                  aria-labelledby="cm-tab-signal-button"
                  className="cm-rail-panel"
                >
                  <QuantDecisionPanel
                    evaluation={evaluation}
                    earnings={earnings}
                    valuation={valuation}
                  />
                </div>
              ) : activeRailTab === 'ai' ? (
                <div
                  id="cm-tab-ai"
                  role="tabpanel"
                  aria-labelledby="cm-tab-ai-button"
                  className="cm-rail-panel"
                >
                  <QuantAgentPanel
                    symbol={symbol}
                    range={range}
                    evaluation={evaluation}
                    pivotNews={pivotNewsForAi}
                    earnings={earnings}
                    valuation={valuation}
                    macroOverlays={macroSeries}
                    onPlay={play}
                  />
                </div>
              ) : (
                <div
                  id="cm-tab-news"
                  role="tabpanel"
                  aria-labelledby="cm-tab-news-button"
                  className="cm-rail-panel"
                >
                  <PivotNewsPanel
                    groups={groups}
                    pending={pending}
                    chartLoading={loading}
                    chartFailed={error !== null || empty}
                    pivotCount={pivots.length}
                    intraday={isIntradayRange(range)}
                    onHoverPivot={handleHoverPivot}
                    onSelectPivot={handleSelectPivot}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
