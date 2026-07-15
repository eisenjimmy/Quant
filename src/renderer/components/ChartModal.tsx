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
import type { ChartCanvasHandle, ChartStudySelection } from './chart/ChartCanvas';
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
  studies: ChartStudySelection;
  logScale: boolean;
  railCollapsed: boolean;
  soundEnabled: boolean;
  activeRailTab: RailTab;
}

const DEFAULT_SETTINGS: ChartModalSettings = {
  showRiskOverlay: true,
  overlays: DEFAULT_OVERLAYS,
  studies: { ma20: true, ma50: true, ma200: false },
  logScale: false,
  railCollapsed: false,
  soundEnabled: true,
  activeRailTab: 'signal',
};

function settingsFromQuery(settings: ChartModalSettings): ChartModalSettings {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('smokeModal')) return settings;

  const next: ChartModalSettings = {
    ...settings,
    overlays: { ...settings.overlays },
    studies: { ...settings.studies },
  };
  const rail = params.get('smokeRail');
  if (rail === 'signal' || rail === 'ai' || rail === 'news') next.activeRailTab = rail;

  const overlayParam = params.get('smokeOverlays');
  if (overlayParam === 'all') {
    next.overlays = {
      jobs: true,
      unemployment: true,
      inflation: true,
      treasury10y: true,
      oil: true,
      vix: true,
    };
  } else if (overlayParam) {
    const selected = new Set(overlayParam.split(',').map((value) => value.trim()));
    next.overlays = {
      jobs: selected.has('jobs'),
      unemployment: selected.has('unemployment'),
      inflation: selected.has('inflation'),
      treasury10y: selected.has('treasury10y') || selected.has('10y'),
      oil: selected.has('oil'),
      vix: selected.has('vix'),
    };
  }

  return next;
}

function loadSettings(): ChartModalSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<ChartModalSettings>;
    const settings: ChartModalSettings = {
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
      studies: {
        ma20: parsed.studies?.ma20 !== false,
        ma50: parsed.studies?.ma50 !== false,
        ma200: parsed.studies?.ma200 === true,
      },
      logScale: parsed.logScale === true,
      railCollapsed: parsed.railCollapsed === true,
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
      activeRailTab:
        parsed.activeRailTab === 'news' || parsed.activeRailTab === 'ai'
          ? parsed.activeRailTab
          : 'signal',
    };
    const selectedMacros = (['vix', 'treasury10y', 'inflation', 'unemployment', 'jobs', 'oil'] as const)
      .filter((key) => settings.overlays[key]);
    if (selectedMacros.length > 1) {
      settings.overlays = { ...DEFAULT_OVERLAYS, [selectedMacros[0]]: true };
    }
    return settingsFromQuery(settings);
  } catch {
    return settingsFromQuery(DEFAULT_SETTINGS);
  }
}

const MACRO_KEYS: MacroOverlayKey[] = ['jobs', 'unemployment', 'inflation', 'treasury10y', 'oil', 'vix'];

function selectedMacroKeys(selection: OverlaySelection): MacroOverlayKey[] {
  return MACRO_KEYS.filter((key) => selection[key]);
}

function singleMacroSelection(current: OverlaySelection, key: MacroOverlayKey): OverlaySelection {
  const next = { ...DEFAULT_OVERLAYS };
  if (!current[key]) next[key] = true;
  return next;
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

export function ChartModal({ symbol }: { symbol: string }) {
  const { state, actions } = useApp();
  const initialSettings = useMemo(loadSettings, []);
  const [range, setRange] = useState<ChartRange>(DEFAULT_RANGE);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [showRiskOverlay, setShowRiskOverlay] = useState(initialSettings.showRiskOverlay);
  const [overlays, setOverlays] = useState<OverlaySelection>(initialSettings.overlays);
  const [studies, setStudies] = useState<ChartStudySelection>(initialSettings.studies);
  const [logScale, setLogScale] = useState(initialSettings.logScale);
  const [railCollapsed, setRailCollapsed] = useState(initialSettings.railCollapsed);
  const [openMenu, setOpenMenu] = useState<'macro' | 'studies' | null>(null);
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

  const settledData = data?.range === range ? data : null;
  const rangeTransitioning = loading && data !== null && data.range !== range;
  const activeMacroKeys = selectedMacroKeys(overlays);

  const pivots = useMemo(
    () => (settledData && settledData.candles.length > 0 ? findPivots(settledData.candles) : []),
    [settledData],
  );
  const trendLines = useMemo(
    () =>
      settledData && pivots.length > 0
        ? computeTrendLines(settledData.candles, pivots)
        : EMPTY_LINES,
    [settledData, pivots],
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
    () => (settledData && settledData.candles.length > 0 ? evaluateSignal(symbol, settledData.candles, pivots) : null),
    [settledData, pivots, symbol],
  );

  // A pivot's marker gains its number once its news arrived non-empty.
  const numbered = useMemo(
    () => groups.map((g) => g.status === 'done' && g.items.length > 0),
    [groups],
  );

  // New generation (range switch / retry) → any panel-hover highlight is stale.
  useEffect(() => setHighlight(null), [generation]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('smokeModal')) return;
    saveSettings({
      showRiskOverlay,
      overlays,
      studies,
      logScale,
      railCollapsed,
      soundEnabled,
      activeRailTab,
    });
  }, [activeRailTab, logScale, overlays, railCollapsed, showRiskOverlay, soundEnabled, studies]);
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

  // Close takes focus on mount; Escape is also supported for a conventional dialog exit.
  useEffect(() => closeRef.current?.focus(), []);

  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      actions.closeChart();
      return;
    }
    const target = e.target as HTMLElement;
    const editable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
    if (!editable && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        canvasRef.current?.fitContent();
        return;
      }
      if (key === 'l') {
        e.preventDefault();
        canvasRef.current?.scrollToLatest();
        return;
      }
      const rangeIndex = Number(e.key) - 1;
      if (Number.isInteger(rangeIndex) && rangeIndex >= 0 && rangeIndex < CHART_RANGES.length) {
        e.preventDefault();
        setRange(CHART_RANGES[rangeIndex]);
        return;
      }
    }
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
  }, [actions]);

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

  const empty = !loading && !error && settledData !== null && settledData.candles.length === 0;
  const studyCount = Number(studies.ma20) + Number(studies.ma50) + Number(studies.ma200);
  const macroLabel = activeMacroKeys.length === 1
    ? overlayLabel(activeMacroKeys[0])
    : activeMacroKeys.length > 1
      ? `${activeMacroKeys.length} macro`
      : 'Macro';

  return (
    <div className="cm-backdrop">
      <div
        ref={panelRef}
        className="cm-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${symbol} chart`}
        onKeyDown={handlePanelKeyDown}
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
          <div className="cm-header-controls" role="group" aria-label="Chart controls">
            <button
              type="button"
              className="cm-compact-control"
              aria-pressed={showRiskOverlay}
              onClick={() => setShowRiskOverlay((v) => !v)}
            >
              Risk
            </button>
            <div
              className="cm-menu-wrap"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
              }}
            >
              <button
                type="button"
                className="cm-compact-control"
                aria-expanded={openMenu === 'macro'}
                onClick={() => setOpenMenu((current) => current === 'macro' ? null : 'macro')}
              >
                {macroLabel}
                {activeMacroKeys.length > 0 && <span className="cm-control-count">{activeMacroKeys.length}</span>}
              </button>
              {openMenu === 'macro' && (
                <div className="cm-control-menu is-macro" role="menu" aria-label="Macro lens">
                  <header><strong>Macro lens</strong><span>One scale at a time keeps the chart truthful.</span></header>
                  {MACRO_KEYS.map((key) => (
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={overlays[key]}
                      key={key}
                      onClick={() => {
                        setOverlays((current) => singleMacroSelection(current, key));
                        setOpenMenu(null);
                      }}
                    >
                      <span className={`cm-layer-swatch is-${key}`} aria-hidden="true" />
                      <span><strong>{overlayLabel(key)}</strong><em>{key === 'jobs' ? 'Payroll momentum' : key === 'unemployment' ? 'Labor-cycle stress' : key === 'inflation' ? 'Price pressure' : key === 'treasury10y' ? 'Discount-rate pressure' : key === 'oil' ? 'Inflation and energy' : 'Market volatility'}</em></span>
                      <b>{overlays[key] ? 'ON' : ''}</b>
                    </button>
                  ))}
                  <button type="button" className="cm-menu-clear" onClick={() => { setOverlays(DEFAULT_OVERLAYS); setOpenMenu(null); }}>Clear macro lens</button>
                </div>
              )}
            </div>
            <div
              className="cm-menu-wrap"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
              }}
            >
              <button
                type="button"
                className="cm-compact-control"
                aria-expanded={openMenu === 'studies'}
                onClick={() => setOpenMenu((current) => current === 'studies' ? null : 'studies')}
              >
                Studies <span className="cm-control-count">{studyCount}</span>
              </button>
              {openMenu === 'studies' && (
                <div className="cm-control-menu is-studies" role="menu" aria-label="Chart studies">
                  <header><strong>Price studies</strong><span>Use structure, not indicator clutter.</span></header>
                  {([
                    ['ma20', 'MA 20', 'Short-term trend'],
                    ['ma50', 'MA 50', 'Intermediate trend'],
                    ['ma200', 'MA 200', 'Structural trend'],
                  ] as const).map(([key, label, detail]) => (
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={studies[key]}
                      key={key}
                      onClick={() => setStudies((current) => ({ ...current, [key]: !current[key] }))}
                    >
                      <span className={`cm-layer-swatch is-${key}`} aria-hidden="true" />
                      <span><strong>{label}</strong><em>{detail}</em></span>
                      <b>{studies[key] ? 'ON' : ''}</b>
                    </button>
                  ))}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={logScale}
                    onClick={() => setLogScale((current) => !current)}
                  >
                    <span className="cm-layer-swatch is-log" aria-hidden="true" />
                    <span><strong>Log scale</strong><em>Compare proportional price moves</em></span>
                    <b>{logScale ? 'ON' : ''}</b>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="cm-compact-control"
              aria-pressed={!railCollapsed}
              onClick={() => setRailCollapsed((current) => !current)}
              title="Toggle inspector panel"
            >
              Inspector
            </button>
            <button
              type="button"
              className="cm-compact-control"
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

        <div className={railCollapsed ? 'cm-body is-rail-collapsed' : 'cm-body'}>
          <div className={rangeTransitioning ? 'cm-chart-area is-transitioning' : 'cm-chart-area'}>
            {data && data.candles.length > 0 && (
              <ChartCanvas
                ref={canvasRef}
                data={data}
                pivots={pivots}
                trendLines={trendLines}
                numbered={numbered}
                highlight={highlight}
                macroOverlays={settledData ? macroSeries : []}
                riskPlan={evaluation?.risk ?? null}
                showRiskOverlay={showRiskOverlay}
                studies={studies}
                logScale={logScale}
                onNeedMoreHistory={loadOlder}
              />
            )}
            <div className="cm-chart-actions" role="toolbar" aria-label="Chart navigation">
              <button type="button" onClick={() => canvasRef.current?.fitContent()} title="Fit active range (F)">Fit <kbd>F</kbd></button>
              <button type="button" onClick={() => canvasRef.current?.scrollToLatest()} title="Scroll to latest candle (L)">Latest <kbd>L</kbd></button>
            </div>
            {studyCount > 0 && (
              <div className="cm-study-legend" aria-label="Active moving averages">
                {studies.ma20 && <span><i className="is-ma20" />MA20</span>}
                {studies.ma50 && <span><i className="is-ma50" />MA50</span>}
                {studies.ma200 && <span><i className="is-ma200" />MA200</span>}
                {logScale && <span className="is-log">LOG</span>}
              </div>
            )}
            {loading && !data && (
              <div className="cm-overlay">
                <div className="cm-chart-loading" role="status" aria-label={`Loading ${range.toUpperCase()} chart`}>
                  <span className="cm-loading-orbit" aria-hidden="true" />
                  <strong>Building {range.toUpperCase()} chart</strong>
                  <span>Aligning candles, pivots, and signal evidence</span>
                </div>
              </div>
            )}
            {rangeTransitioning && (
              <div className="cm-range-transition" role="status">
                <span aria-hidden="true" /> Loading {range.toUpperCase()} · keeping the current canvas stable
              </div>
            )}
            {!loading && error !== null && !data && (
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
            {!loading && error !== null && data && (
              <div className="cm-chart-error-toast" role="alert">
                <span>Couldn&apos;t load {range.toUpperCase()}; the previous chart remains visible.</span>
                <button type="button" onClick={retry}>Retry</button>
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
          <div className="cm-right-rail" aria-hidden={railCollapsed}>
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
              <div
                id="cm-tab-signal"
                role="tabpanel"
                aria-labelledby="cm-tab-signal-button"
                className="cm-rail-panel"
                hidden={activeRailTab !== 'signal'}
              >
                <QuantDecisionPanel
                  evaluation={evaluation}
                  earnings={earnings}
                  valuation={valuation}
                  range={range}
                  chartSource={settledData?.source}
                  chartAsOf={settledData?.candles.length ? new Date(settledData.candles[settledData.candles.length - 1].time * 1000).toISOString() : undefined}
                />
              </div>
              <div
                id="cm-tab-ai"
                role="tabpanel"
                aria-labelledby="cm-tab-ai-button"
                className="cm-rail-panel"
                hidden={activeRailTab !== 'ai'}
              >
                <QuantAgentPanel
                  symbol={symbol}
                  range={range}
                  evaluation={evaluation}
                  pivotNews={pivotNewsForAi}
                  earnings={earnings}
                  valuation={valuation}
                  macroOverlays={settledData ? macroSeries : []}
                  onPlay={play}
                />
              </div>
              <div
                id="cm-tab-news"
                role="tabpanel"
                aria-labelledby="cm-tab-news-button"
                className="cm-rail-panel"
                hidden={activeRailTab !== 'news'}
              >
                <PivotNewsPanel
                  groups={groups}
                  pending={pending}
                  chartLoading={loading || !settledData}
                  chartFailed={error !== null || empty}
                  pivotCount={pivots.length}
                  intraday={isIntradayRange(range)}
                  onHoverPivot={handleHoverPivot}
                  onSelectPivot={handleSelectPivot}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
