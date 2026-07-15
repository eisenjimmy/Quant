import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ChartData, MacroOverlayKey, MacroOverlaySeries } from '../../shared/types';
import {
  MARKET_PULSE_ASSETS,
  analyzeScenario,
  buildMarketPulse,
} from '../../shared/marketPulse';
import type { MarketPulseSymbol, PulseRegimeMemory, ScenarioInput } from '../../shared/marketPulse';
import { api } from '../api';
import { PanelHeader, SampleChip } from './center/shared';
import '../styles/pulse.css';

const DEFAULT_SCENARIO: ScenarioInput = {
  ratesBps: 0,
  oilPercent: 0,
  volatilityPoints: 0,
};

const PRESETS: Array<{ label: string; value: ScenarioInput }> = [
  { label: 'Rates +50bp', value: { ratesBps: 50, oilPercent: 0, volatilityPoints: 0 } },
  { label: 'Oil +10%', value: { ratesBps: 0, oilPercent: 10, volatilityPoints: 0 } },
  { label: 'Risk shock', value: { ratesBps: 25, oilPercent: 8, volatilityPoints: 10 } },
  { label: 'Reset', value: DEFAULT_SCENARIO },
];

const REGIME_MEMORY_KEY = 'quant.market-regime.v2.memory';
const MACRO_INPUTS: MacroOverlayKey[] = ['jobs', 'unemployment', 'treasury10y', 'vix'];

function readRegimeMemory(): PulseRegimeMemory | undefined {
  try {
    const raw = window.localStorage.getItem(REGIME_MEMORY_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<PulseRegimeMemory>;
    const validStates = new Set(['uptrend-healthy', 'correction', 'oversold-bounce', 'downtrend-distribution', 'recession-defense']);
    if (
      typeof parsed.committedState !== 'string' ||
      !validStates.has(parsed.committedState) ||
      typeof parsed.lastRawState !== 'string' ||
      !validStates.has(parsed.lastRawState) ||
      typeof parsed.pendingSessions !== 'number'
    ) return undefined;
    if (parsed.pendingState !== null && (typeof parsed.pendingState !== 'string' || !validStates.has(parsed.pendingState))) {
      return undefined;
    }
    return parsed as PulseRegimeMemory;
  } catch {
    return undefined;
  }
}

function MarketPulseSkeleton() {
  return (
    <div className="mp-skeleton" role="status" aria-label="Building verified market regime">
      <div className="mp-skeleton-regime">
        <div className="skeleton mp-skel-kicker" />
        <div className="skeleton mp-skel-title" />
        <div className="skeleton mp-skel-score" />
        <div className="skeleton mp-skel-copy" />
      </div>
      <div className="mp-skeleton-components">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="mp-skel-card qn-stagger" key={index} style={{ '--motion-index': index } as CSSProperties}>
            <div className="skeleton mp-skel-line" />
            <div className="skeleton mp-skel-bar" />
            <div className="skeleton mp-skel-caption" />
          </div>
        ))}
      </div>
      <span className="mp-skeleton-label">Aligning price, breadth, macro, and volatility evidence…</span>
    </div>
  );
}

function signed(value: number | null, suffix = '%'): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;
}

function price(value: number | null): string {
  if (value === null) return '—';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function tone(value: number | null): string {
  if (value === null || Math.abs(value) < 0.05) return 'is-flat';
  return value > 0 ? 'is-positive' : 'is-negative';
}

function SliderField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mp-slider">
      <span className="mp-slider-head">
        <span>{props.label}</span>
        <output>{props.value > 0 ? '+' : ''}{props.value}{props.suffix}</output>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      />
      <span className="mp-slider-scale" aria-hidden="true">
        <span>{props.min}{props.suffix}</span>
        <span>{props.max > 0 ? '+' : ''}{props.max}{props.suffix}</span>
      </span>
    </label>
  );
}

export function MarketPulse() {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [macroSeries, setMacroSeries] = useState<MacroOverlaySeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [scenario, setScenario] = useState<ScenarioInput>(DEFAULT_SCENARIO);
  const regimeMemoryRef = useRef<PulseRegimeMemory | undefined>(readRegimeMemory());

  const load = useCallback(async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [results, macro] = await Promise.all([
        Promise.all(MARKET_PULSE_ASSETS.map((asset) => api.getChart(asset.symbol, '1y'))),
        Promise.all(MACRO_INPUTS.map((key) => api.getMacroOverlay(key, '1y'))),
      ]);
      setCharts(results);
      setMacroSeries(macro);
      setUpdatedAt(new Date());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Market data request failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const pulse = useMemo(
    () => (charts.length ? buildMarketPulse(charts, macroSeries, regimeMemoryRef.current) : null),
    [charts, macroSeries],
  );
  useEffect(() => {
    if (!pulse) return;
    regimeMemoryRef.current = pulse.regime.memory;
    try {
      window.localStorage.setItem(REGIME_MEMORY_KEY, JSON.stringify(pulse.regime.memory));
    } catch {
      // Persistence is an enhancement; the deterministic snapshot remains usable without it.
    }
  }, [pulse]);
  const impacts = useMemo(() => analyzeScenario(scenario), [scenario]);
  const correlation = useCallback(
    (row: MarketPulseSymbol, column: MarketPulseSymbol) =>
      pulse?.correlations.find((cell) => cell.row === row && cell.column === column) ?? null,
    [pulse],
  );

  return (
    <section className="mp-panel" aria-label="Market Pulse">
      <PanelHeader
        title="Market Pulse"
        caption="Cross-asset regime, 90-session relationships, and deterministic shock sensitivity"
        updatedAt={updatedAt}
        busy={loading || refreshing}
        onRefresh={() => void load(true)}
        refreshLabel="Refresh market pulse"
      />

      {loading && !pulse ? (
        <MarketPulseSkeleton />
      ) : error && !pulse ? (
        <div className="mp-error" role="alert">
          <strong>Market Pulse unavailable</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void load(false)}>Retry</button>
        </div>
      ) : pulse ? (
        <div className="mp-scroll">
          {error && <div className="mp-stale" role="status">Refresh failed; showing the last completed snapshot.</div>}

          <section className="mp-regime" aria-labelledby="mp-regime-title">
            <div className="mp-regime-summary">
              <div className="mp-regime-meta">
                <span className="mp-section-kicker">Committed regime</span>
                <span className={`mp-health is-${pulse.regime.strategy.dataHealth}`}>{pulse.regime.strategy.dataHealth}</span>
              </div>
              <h3 id="mp-regime-title" className={`mp-state-title is-${pulse.regime.label}`}>{pulse.regime.stateLabel}</h3>
              <div className="mp-score-line">
                <strong>{pulse.regime.score}</strong>
                <span>/100 evidence strength</span>
              </div>
              <progress aria-label="Market regime score" max={100} value={pulse.regime.score} />
              <p>{pulse.regime.summary}</p>
              <div className={`mp-decline is-${pulse.regime.declineType}`}>
                <span>Pressure attribution</span>
                <strong>{pulse.regime.declineLabel}</strong>
              </div>
            </div>
            <div className="mp-components">
              {pulse.regime.components.map((component, index) => (
                <div
                  className="mp-component qn-stagger"
                  key={component.id}
                  title={component.explanation}
                  style={{ '--motion-index': index } as CSSProperties}
                >
                  <div><span>{component.label}</span><strong>{component.score}</strong></div>
                  <progress aria-label={`${component.label} score`} max={100} value={component.score} />
                  <small>{component.explanation}</small>
                  <em>{component.source}</em>
                </div>
              ))}
            </div>
            {pulse.regime.pendingState && (
              <div className="mp-pending" role="status">
                <span className="mp-pending-pulse" aria-hidden="true" />
                <div>
                  <strong>Pending: {pulse.regime.pendingStateLabel}</strong>
                  <span>{pulse.regime.pendingSessions}/{pulse.regime.requiredSessions} completed sessions · current regime remains committed</span>
                </div>
              </div>
            )}
          </section>

          <section className="mp-evidence" aria-labelledby="mp-evidence-title">
            <div className="mp-section-head">
              <div>
                <h3 id="mp-evidence-title">Decision evidence</h3>
                <p>{pulse.regime.strategy.definition.id}@{pulse.regime.strategy.definition.version} · {pulse.regime.strategy.verification.status}</p>
              </div>
              <span className="mp-method">RULE-BASED · 2D HYSTERESIS</span>
            </div>
            <div className="mp-evidence-grid">
              {pulse.regime.strategy.evidence.map((item, index) => (
                <article className="mp-evidence-item qn-stagger" key={item.id} style={{ '--motion-index': index } as CSSProperties} title={item.rationale}>
                  <div><span className={`mp-quality is-${item.quality}`} aria-hidden="true" /><strong>{item.label}</strong></div>
                  <em>{item.value}</em>
                  <small>{item.source}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="mp-assets" aria-labelledby="mp-assets-title">
            <div className="mp-section-head">
              <div>
                <h3 id="mp-assets-title">Cross-asset monitor</h3>
                <p>20-session momentum and realized volatility</p>
              </div>
              <span className="mp-live-count">{pulse.liveAssets}/{pulse.totalAssets} live</span>
            </div>
            <div className="mp-asset-grid">
              {pulse.assets.map((asset, index) => (
                <article className="mp-asset qn-stagger" key={asset.symbol} style={{ '--motion-index': index } as CSSProperties}>
                  <header>
                    <div><strong>{asset.symbol}</strong><span>{asset.label}</span></div>
                    {asset.source === 'sample' && <SampleChip />}
                  </header>
                  <div className="mp-asset-price">{price(asset.last)}</div>
                  <dl>
                    <div><dt>20D</dt><dd className={tone(asset.return20d)}>{signed(asset.return20d)}</dd></div>
                    <div><dt>63D</dt><dd className={tone(asset.return63d)}>{signed(asset.return63d)}</dd></div>
                    <div><dt>1Y DD</dt><dd className={tone(asset.drawdown252d)}>{signed(asset.drawdown252d)}</dd></div>
                    <div><dt>SMA200</dt><dd className={asset.aboveSma200 === null ? 'is-flat' : asset.aboveSma200 ? 'is-positive' : 'is-negative'}>{asset.aboveSma200 === null ? '—' : asset.aboveSma200 ? 'Above' : 'Below'}</dd></div>
                  </dl>
                  <small>{asset.role}</small>
                </article>
              ))}
            </div>
          </section>

          <div className="mp-lower-grid">
            <section className="mp-correlation" aria-labelledby="mp-correlation-title">
              <div className="mp-section-head">
                <div>
                  <h3 id="mp-correlation-title">Cross-asset correlation</h3>
                  <p>Daily returns · latest 90 aligned sessions</p>
                </div>
              </div>
              <div className="mp-table-wrap">
                <table>
                  <thead><tr><th scope="col">90D</th>{MARKET_PULSE_ASSETS.map((asset) => <th scope="col" key={asset.symbol}>{asset.symbol}</th>)}</tr></thead>
                  <tbody>
                    {MARKET_PULSE_ASSETS.map((row) => (
                      <tr key={row.symbol}>
                        <th scope="row">{row.symbol}</th>
                        {MARKET_PULSE_ASSETS.map((column) => {
                          const cell = correlation(row.symbol, column.symbol);
                          const value = cell?.value ?? null;
                          const style = { '--mp-heat': `${Math.round(Math.abs(value ?? 0) * 62)}%` } as CSSProperties;
                          return <td key={column.symbol} className={tone(value)} style={style} title={cell ? `${cell.observations} aligned observations` : 'Unavailable'}>{value === null ? '—' : value.toFixed(2)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mp-note">Correlation describes co-movement, not causation or a trading signal.</p>
            </section>

            <section className="mp-scenario" aria-labelledby="mp-scenario-title">
              <div className="mp-section-head">
                <div>
                  <h3 id="mp-scenario-title">Scenario analyzer</h3>
                  <p>Change assumptions to compare relative sector sensitivity</p>
                </div>
              </div>
              <div className="mp-presets" aria-label="Scenario presets">
                {PRESETS.map((preset) => <button type="button" key={preset.label} onClick={() => setScenario(preset.value)}>{preset.label}</button>)}
              </div>
              <div className="mp-sliders">
                <SliderField label="Rates" value={scenario.ratesBps} min={-100} max={100} step={5} suffix="bp" onChange={(ratesBps) => setScenario((current) => ({ ...current, ratesBps }))} />
                <SliderField label="Oil" value={scenario.oilPercent} min={-20} max={20} step={1} suffix="%" onChange={(oilPercent) => setScenario((current) => ({ ...current, oilPercent }))} />
                <SliderField label="Volatility" value={scenario.volatilityPoints} min={-10} max={20} step={1} suffix="pt" onChange={(volatilityPoints) => setScenario((current) => ({ ...current, volatilityPoints }))} />
              </div>
              <div className="mp-impacts">
                {impacts.map((impact) => (
                  <div className="mp-impact" key={impact.id} title={impact.explanation}>
                    <span>{impact.label}</span>
                    <div
                      className={`mp-impact-track ${tone(impact.score)}`}
                      role="meter"
                      aria-label={`${impact.label} relative sensitivity`}
                      aria-valuemin={-10}
                      aria-valuemax={10}
                      aria-valuenow={impact.score}
                    >
                      <span
                        className={impact.score < 0 ? 'is-left' : 'is-right'}
                        style={{ width: `${Math.abs(impact.score) * 5}%` }}
                      />
                    </div>
                    <strong className={tone(impact.score)}>{impact.score > 0 ? '+' : ''}{impact.score.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
              <p className="mp-note">Relative sensitivity score only; this is not a return forecast or investment advice.</p>
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}
