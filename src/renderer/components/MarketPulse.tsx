import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ChartData } from '../../shared/types';
import {
  MARKET_PULSE_ASSETS,
  analyzeScenario,
  buildMarketPulse,
} from '../../shared/marketPulse';
import type { MarketPulseSymbol, ScenarioInput } from '../../shared/marketPulse';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [scenario, setScenario] = useState<ScenarioInput>(DEFAULT_SCENARIO);

  const load = useCallback(async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        MARKET_PULSE_ASSETS.map((asset) => api.getChart(asset.symbol, '6m')),
      );
      setCharts(results);
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

  const pulse = useMemo(() => (charts.length ? buildMarketPulse(charts) : null), [charts]);
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
        <div className="mp-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Building cross-asset view…
        </div>
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
              <div className="mp-section-kicker">Current regime</div>
              <div className="mp-score-line">
                <strong>{pulse.regime.score}</strong>
                <span>/100</span>
                <em className={`is-${pulse.regime.label}`}>{pulse.regime.label}</em>
              </div>
              <progress aria-label="Market regime score" max={100} value={pulse.regime.score} />
              <p>{pulse.regime.summary}</p>
            </div>
            <div className="mp-components">
              {pulse.regime.components.map((component) => (
                <div className="mp-component" key={component.id} title={component.explanation}>
                  <div><span>{component.label}</span><strong>{component.score}</strong></div>
                  <progress aria-label={`${component.label} score`} max={100} value={component.score} />
                  <small>{component.explanation}</small>
                </div>
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
              {pulse.assets.map((asset) => (
                <article className="mp-asset" key={asset.symbol}>
                  <header>
                    <div><strong>{asset.symbol}</strong><span>{asset.label}</span></div>
                    {asset.source === 'sample' && <SampleChip />}
                  </header>
                  <div className="mp-asset-price">{price(asset.last)}</div>
                  <dl>
                    <div><dt>20D</dt><dd className={tone(asset.return20d)}>{signed(asset.return20d)}</dd></div>
                    <div><dt>Ann. vol</dt><dd>{asset.annualVolatility === null ? '—' : `${asset.annualVolatility.toFixed(1)}%`}</dd></div>
                    <div><dt>SMA20</dt><dd className={asset.aboveSma20 === null ? 'is-flat' : asset.aboveSma20 ? 'is-positive' : 'is-negative'}>{asset.aboveSma20 === null ? '—' : asset.aboveSma20 ? 'Above' : 'Below'}</dd></div>
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
