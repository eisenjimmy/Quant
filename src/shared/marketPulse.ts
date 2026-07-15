import type { ChartData, DataSource, MacroOverlaySeries } from './types';
import {
  dataHealthFromSources,
  verifyStrategyEnvelope,
} from './strategy';
import type {
  StrategyDefinition,
  StrategyEnvelope,
  StrategyEvidence,
} from './strategy';

export const MARKET_PULSE_ASSETS = [
  { symbol: 'SPY', label: 'S&P 500', role: 'Broad equities' },
  { symbol: 'QQQ', label: 'Nasdaq 100', role: 'Growth' },
  { symbol: 'IWM', label: 'Russell 2000', role: 'Breadth' },
  { symbol: 'TLT', label: 'Long Treasuries', role: 'Duration' },
  { symbol: 'GLD', label: 'Gold', role: 'Defensive' },
  { symbol: 'USO', label: 'Oil', role: 'Inflation' },
] as const;

export const MARKET_REGIME_STRATEGY: StrategyDefinition = {
  id: 'quant-market-regime',
  version: '2.0.0',
  name: 'Quant Market Regime v2',
  objective: 'Classify the market environment without allowing one noisy session to flip the committed state.',
  minimumHistory: 200,
  requiredInputs: [
    'SPY, QQQ, IWM, TLT, GLD, and USO daily history',
    'US payrolls, unemployment, 10Y Treasury yield, and VIX',
  ],
  methodology: [
    'Price trend, drawdown, breadth, volatility, defensive demand, and macro stress',
    'Five deterministic states with separate raw and committed decisions',
    'Two-session hysteresis before a state transition is committed',
    'Evidence, provenance, data health, and verification attached to every result',
  ],
  attribution: 'Conceptually informed by ARDS-X in gameworkerkim/vibe-investing; independently implemented for Quant.',
};

export type MarketPulseSymbol = (typeof MARKET_PULSE_ASSETS)[number]['symbol'];
export type PulseRegimeState =
  | 'uptrend-healthy'
  | 'correction'
  | 'oversold-bounce'
  | 'downtrend-distribution'
  | 'recession-defense';
export type PulseDeclineType = 'none' | 'rate-driven' | 'recession-driven' | 'valuation-driven' | 'broad-risk';

export interface PulseRegimeMemory {
  committedState: PulseRegimeState;
  pendingState: PulseRegimeState | null;
  pendingSessions: number;
  lastObservedAt: string | null;
  lastRawState: PulseRegimeState;
}

export interface PulseAssetSnapshot {
  symbol: MarketPulseSymbol;
  label: string;
  role: string;
  last: number | null;
  return20d: number | null;
  return63d: number | null;
  drawdown252d: number | null;
  annualVolatility: number | null;
  aboveSma20: boolean | null;
  aboveSma50: boolean | null;
  aboveSma200: boolean | null;
  observations: number;
  source: DataSource;
  asOf: number | null;
}

export interface PulseRegimeComponent {
  id: 'trend' | 'breadth' | 'stability' | 'defensive' | 'macro';
  label: string;
  score: number;
  explanation: string;
  source: string;
}

export interface PulseRegime {
  score: number;
  label: 'risk-on' | 'constructive' | 'neutral' | 'defensive' | 'risk-off';
  state: PulseRegimeState;
  stateLabel: string;
  rawState: PulseRegimeState;
  rawStateLabel: string;
  pendingState: PulseRegimeState | null;
  pendingStateLabel: string | null;
  pendingSessions: number;
  requiredSessions: number;
  declineType: PulseDeclineType;
  declineLabel: string;
  summary: string;
  components: PulseRegimeComponent[];
  strategy: StrategyEnvelope<PulseRegimeState>;
  memory: PulseRegimeMemory;
}

export interface CorrelationCell {
  row: MarketPulseSymbol;
  column: MarketPulseSymbol;
  value: number | null;
  observations: number;
}

export interface MarketPulseSnapshot {
  generatedAt: string;
  assets: PulseAssetSnapshot[];
  regime: PulseRegime;
  correlations: CorrelationCell[];
  liveAssets: number;
  totalAssets: number;
}

export interface ScenarioInput {
  ratesBps: number;
  oilPercent: number;
  volatilityPoints: number;
}

export interface ScenarioImpact {
  id: 'growth' | 'financials' | 'energy' | 'defensives' | 'broad';
  label: string;
  score: number;
  explanation: string;
}

const STATE_LABELS: Record<PulseRegimeState, string> = {
  'uptrend-healthy': 'Healthy uptrend',
  correction: 'Correction',
  'oversold-bounce': 'Oversold bounce',
  'downtrend-distribution': 'Downtrend / distribution',
  'recession-defense': 'Recession defense',
};

const DECLINE_LABELS: Record<PulseDeclineType, string> = {
  none: 'No active decline',
  'rate-driven': 'Rate-driven pressure',
  'recession-driven': 'Recession-driven pressure',
  'valuation-driven': 'Growth / valuation compression',
  'broad-risk': 'Broad risk reduction',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function closes(chart: ChartData): Array<{ time: number; close: number }> {
  return chart.candles
    .filter((candle) => Number.isFinite(candle.close) && candle.close > 0)
    .map((candle) => ({ time: candle.time, close: candle.close }));
}

function assetReturns(chart: ChartData): Map<number, number> {
  const values = closes(chart);
  const returns = new Map<number, number>();
  for (let index = 1; index < values.length; index++) {
    const previous = values[index - 1].close;
    const current = values[index];
    returns.set(current.time, current.close / previous - 1);
  }
  return returns;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function movingAverage(values: Array<{ close: number }>, sessions: number): number | null {
  if (values.length < sessions) return null;
  return mean(values.slice(-sessions).map((item) => item.close));
}

function sessionReturn(values: Array<{ close: number }>, sessions: number): number | null {
  const last = values.at(-1)?.close;
  const prior = values.at(-(sessions + 1))?.close;
  return last !== undefined && prior !== undefined ? round((last / prior - 1) * 100) : null;
}

function correlation(
  left: Map<number, number>,
  right: Map<number, number>,
): { value: number | null; observations: number } {
  const pairs: Array<[number, number]> = [];
  for (const [time, leftValue] of left) {
    const rightValue = right.get(time);
    if (rightValue !== undefined) pairs.push([leftValue, rightValue]);
  }
  const recent = pairs.slice(-90);
  if (recent.length < 12) return { value: null, observations: recent.length };
  const leftMean = mean(recent.map(([value]) => value));
  const rightMean = mean(recent.map(([, value]) => value));
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (const [leftValue, rightValue] of recent) {
    const leftDelta = leftValue - leftMean;
    const rightDelta = rightValue - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return {
    value: denominator > 0 ? round(clamp(numerator / denominator, -1, 1)) : null,
    observations: recent.length,
  };
}

function snapshotAsset(chart: ChartData, definition: (typeof MARKET_PULSE_ASSETS)[number]): PulseAssetSnapshot {
  const values = closes(chart);
  const last = values.at(-1)?.close ?? null;
  const high252 = values.length ? Math.max(...values.slice(-252).map((item) => item.close)) : null;
  const dailyReturns = [...assetReturns(chart).values()].slice(-20);
  const sma20 = movingAverage(values, 20);
  const sma50 = movingAverage(values, 50);
  const sma200 = movingAverage(values, 200);
  return {
    symbol: definition.symbol,
    label: definition.label,
    role: definition.role,
    last,
    return20d: sessionReturn(values, 20),
    return63d: sessionReturn(values, 63),
    drawdown252d: last !== null && high252 !== null && high252 > 0 ? round((last / high252 - 1) * 100, 1) : null,
    annualVolatility: dailyReturns.length >= 12 ? round(stdev(dailyReturns) * Math.sqrt(252) * 100, 1) : null,
    aboveSma20: last !== null && sma20 !== null ? last >= sma20 : null,
    aboveSma50: last !== null && sma50 !== null ? last >= sma50 : null,
    aboveSma200: last !== null && sma200 !== null ? last >= sma200 : null,
    observations: values.length,
    source: chart.source,
    asOf: values.at(-1)?.time ?? null,
  };
}

function macroSeriesByKey(series: MacroOverlaySeries[]): Map<MacroOverlaySeries['key'], MacroOverlaySeries> {
  return new Map(series.map((item) => [item.key, item]));
}

function latestMacro(series: MacroOverlaySeries | undefined): number | null {
  return series?.points.at(-1)?.value ?? null;
}

function macroChange(series: MacroOverlaySeries | undefined, observations: number): number | null {
  const latest = series?.points.at(-1)?.value;
  const prior = series?.points.at(-(observations + 1))?.value;
  return latest !== undefined && prior !== undefined ? latest - prior : null;
}

function macroRiskScore(series: MacroOverlaySeries[]): number {
  const byKey = macroSeriesByKey(series);
  const unemploymentChange = macroChange(byKey.get('unemployment'), 3);
  const jobs = latestMacro(byKey.get('jobs'));
  const vix = latestMacro(byKey.get('vix'));
  const unemploymentRisk = unemploymentChange === null ? 50 : clamp(35 + unemploymentChange * 110, 0, 100);
  const jobsRisk = jobs === null ? 50 : clamp(58 - jobs / 6, 0, 100);
  const volatilityRisk = vix === null ? 50 : clamp(20 + (vix - 14) * 4, 0, 100);
  return Math.round(unemploymentRisk * 0.4 + jobsRisk * 0.35 + volatilityRisk * 0.25);
}

function classifyRawState(
  assets: PulseAssetSnapshot[],
  macroRisk: number,
): PulseRegimeState {
  const bySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
  const spy = bySymbol.get('SPY');
  const qqq = bySymbol.get('QQQ');
  const broadBelow200 = [spy, qqq, bySymbol.get('IWM')].filter((asset) => asset?.aboveSma200 === false).length;
  const drawdown = spy?.drawdown252d ?? 0;
  const return20 = spy?.return20d ?? 0;
  const return63 = spy?.return63d ?? 0;
  if (macroRisk >= 62 && (drawdown <= -7 || broadBelow200 >= 2)) return 'recession-defense';
  if (drawdown <= -9 && return20 >= 2 && spy?.aboveSma20) return 'oversold-bounce';
  if (broadBelow200 >= 2 && return63 <= -4) return 'downtrend-distribution';
  if (drawdown <= -5 || return20 <= -4 || broadBelow200 >= 2) return 'correction';
  return 'uptrend-healthy';
}

export function advanceRegimeMemory(
  rawState: PulseRegimeState,
  previous: PulseRegimeMemory | undefined,
  asOf: string | null,
  requiredSessions = 2,
): PulseRegimeMemory {
  if (!previous) {
    return {
      committedState: rawState,
      pendingState: null,
      pendingSessions: 0,
      lastObservedAt: asOf,
      lastRawState: rawState,
    };
  }
  if (rawState === previous.committedState) {
    return {
      committedState: previous.committedState,
      pendingState: null,
      pendingSessions: 0,
      lastObservedAt: asOf ?? previous.lastObservedAt,
      lastRawState: rawState,
    };
  }
  if (asOf !== null && previous.lastObservedAt === asOf) {
    return previous.lastRawState === rawState
      ? previous
      : { ...previous, pendingState: rawState, pendingSessions: 1, lastRawState: rawState };
  }
  const pendingSessions = previous.pendingState === rawState ? previous.pendingSessions + 1 : 1;
  if (pendingSessions >= requiredSessions) {
    return {
      committedState: rawState,
      pendingState: null,
      pendingSessions: 0,
      lastObservedAt: asOf,
      lastRawState: rawState,
    };
  }
  return {
    committedState: previous.committedState,
    pendingState: rawState,
    pendingSessions,
    lastObservedAt: asOf,
    lastRawState: rawState,
  };
}

function declineType(
  state: PulseRegimeState,
  assets: PulseAssetSnapshot[],
  macroSeries: MacroOverlaySeries[],
  macroRisk: number,
): PulseDeclineType {
  if (state === 'uptrend-healthy') return 'none';
  const bySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
  const macro = macroSeriesByKey(macroSeries);
  const yieldChange = macroChange(macro.get('treasury10y'), 20);
  if (macroRisk >= 60) return 'recession-driven';
  if ((yieldChange ?? 0) >= 0.25 || (bySymbol.get('TLT')?.return20d ?? 0) <= -3) return 'rate-driven';
  const growthGap = (bySymbol.get('QQQ')?.return20d ?? 0) - (bySymbol.get('SPY')?.return20d ?? 0);
  if (growthGap <= -2) return 'valuation-driven';
  return 'broad-risk';
}

function sourceQuality(source: DataSource | undefined): StrategyEvidence['quality'] {
  return source === 'live' ? 'verified' : source === 'sample' ? 'warning' : 'unavailable';
}

function buildRegime(
  assets: PulseAssetSnapshot[],
  macroSeries: MacroOverlaySeries[],
  previousMemory?: PulseRegimeMemory,
): PulseRegime {
  const bySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
  const equities = ['SPY', 'QQQ', 'IWM'].map((symbol) => bySymbol.get(symbol as MarketPulseSymbol)).filter(Boolean) as PulseAssetSnapshot[];
  const defensives = ['TLT', 'GLD'].map((symbol) => bySymbol.get(symbol as MarketPulseSymbol)).filter(Boolean) as PulseAssetSnapshot[];
  const equityReturns = equities.map((asset) => asset.return20d).filter((value): value is number => value !== null);
  const trend = clamp(50 + mean(equityReturns) * 5, 0, 100);
  const breadthKnown = equities.filter((asset) => asset.aboveSma200 !== null);
  const breadth = breadthKnown.length
    ? (breadthKnown.filter((asset) => asset.aboveSma200).length / breadthKnown.length) * 100
    : 50;
  const spyVolatility = bySymbol.get('SPY')?.annualVolatility ?? 20;
  const stability = clamp(100 - Math.max(0, spyVolatility - 8) * 4.5, 0, 100);
  const defensiveReturns = defensives.map((asset) => asset.return20d).filter((value): value is number => value !== null);
  const defensive = clamp(50 - mean(defensiveReturns) * 5, 0, 100);
  const macroRisk = macroRiskScore(macroSeries);
  const macroHealth = 100 - macroRisk;
  const score = Math.round(trend * 0.28 + breadth * 0.24 + stability * 0.16 + defensive * 0.12 + macroHealth * 0.2);
  const rawState = classifyRawState(assets, macroRisk);
  const asOfSeconds = Math.max(...assets.map((asset) => asset.asOf ?? 0));
  const asOf = asOfSeconds > 0 ? new Date(asOfSeconds * 1000).toISOString() : null;
  const allSources = [...assets.map((asset) => asset.source), ...macroSeries.map((item) => item.source)];
  const hasMinimumHistory = equities.every((asset) => asset.observations >= MARKET_REGIME_STRATEGY.minimumHistory);
  const dataHealth = dataHealthFromSources(allSources, hasMinimumHistory);
  const memory = dataHealth === 'insufficient' && previousMemory
    ? previousMemory
    : advanceRegimeMemory(rawState, previousMemory, asOf);
  const state = memory.committedState;
  const type = declineType(state, assets, macroSeries, macroRisk);
  const label: PulseRegime['label'] =
    state === 'uptrend-healthy'
      ? 'risk-on'
      : state === 'oversold-bounce'
        ? 'constructive'
        : state === 'correction'
          ? 'defensive'
          : 'risk-off';
  const summary: Record<PulseRegimeState, string> = {
    'uptrend-healthy': 'Long-term trend and participation remain supportive; monitor evidence rather than chasing strength.',
    correction: 'Price stress has increased, but the long-term structure is not yet decisively broken.',
    'oversold-bounce': 'Price is rebounding from a material drawdown; confirmation is still required before treating it as a new trend.',
    'downtrend-distribution': 'Broad equities are below long-term trend with weak medium-term momentum; capital preservation takes priority.',
    'recession-defense': 'Macro deterioration and price stress agree; favor defensive exposure until both evidence sets improve.',
  };
  const macro = macroSeriesByKey(macroSeries);
  const vix = macro.get('vix');
  const unemployment = macro.get('unemployment');
  const jobs = macro.get('jobs');
  const treasury = macro.get('treasury10y');
  const spy = bySymbol.get('SPY');
  const evidence: StrategyEvidence[] = [
    {
      id: 'price-trend',
      label: 'SPY long-term trend',
      value: spy?.aboveSma200 === null || spy?.aboveSma200 === undefined ? 'Unavailable' : spy.aboveSma200 ? 'Above SMA200' : 'Below SMA200',
      source: `Yahoo Finance · ${spy?.source ?? 'unavailable'}`,
      observedAt: asOf ?? undefined,
      quality: sourceQuality(spy?.source),
      rationale: 'The 200-session trend is the primary structural risk gate.',
    },
    {
      id: 'drawdown',
      label: 'SPY drawdown',
      value: spy?.drawdown252d === null || spy?.drawdown252d === undefined ? 'Unavailable' : `${spy.drawdown252d.toFixed(1)}%`,
      source: `Yahoo Finance · ${spy?.source ?? 'unavailable'}`,
      observedAt: asOf ?? undefined,
      quality: sourceQuality(spy?.source),
      rationale: 'Drawdown separates ordinary noise from correction and oversold conditions.',
    },
    {
      id: 'breadth',
      label: 'Broad-market participation',
      value: `${Math.round(breadth)}% above SMA200`,
      source: 'SPY / QQQ / IWM',
      observedAt: asOf ?? undefined,
      quality: breadthKnown.length === 3 && breadthKnown.every((asset) => asset.source === 'live') ? 'verified' : 'warning',
      rationale: 'A healthy regime should be supported beyond a single capitalization segment.',
    },
    {
      id: 'macro-stress',
      label: 'Macro stress composite',
      value: `${macroRisk}/100`,
      source: 'FRED payrolls + unemployment · Yahoo VIX',
      quality: [jobs, unemployment, vix].every((item) => item?.source === 'live') ? 'verified' : 'warning',
      rationale: 'Labor deterioration and volatility confirm or reject recession-like price stress.',
    },
    {
      id: 'rate-stress',
      label: '20-session rate change',
      value: macroChange(treasury, 20) === null ? 'Unavailable' : `${macroChange(treasury, 20)! > 0 ? '+' : ''}${macroChange(treasury, 20)!.toFixed(2)}pt`,
      source: `${treasury?.sourceName ?? 'FRED'} · ${treasury?.source ?? 'unavailable'}`,
      quality: sourceQuality(treasury?.source),
      rationale: 'A sharp yield increase helps distinguish rate pressure from recession pressure.',
    },
  ];
  const warnings = [
    ...(dataHealth === 'sample' || dataHealth === 'mixed' ? ['At least one input uses deterministic sample fallback data.'] : []),
    ...(dataHealth === 'insufficient' ? [`At least ${MARKET_REGIME_STRATEGY.minimumHistory} daily observations are required for a verified structural regime.`] : []),
    ...(memory.pendingState ? [`Raw evidence must persist for ${2 - memory.pendingSessions} more completed session(s) before commitment.`] : []),
    'Regime strength is an evidence score, not a calibrated probability or return forecast.',
  ];
  const unverifiedEnvelope = {
    definition: MARKET_REGIME_STRATEGY,
    decision: state,
    generatedAt: new Date().toISOString(),
    asOf,
    dataHealth,
    evidence,
    warnings,
  };
  const strategy: StrategyEnvelope<PulseRegimeState> = {
    ...unverifiedEnvelope,
    verification: verifyStrategyEnvelope(unverifiedEnvelope),
  };
  return {
    score,
    label,
    state,
    stateLabel: STATE_LABELS[state],
    rawState,
    rawStateLabel: STATE_LABELS[rawState],
    pendingState: memory.pendingState,
    pendingStateLabel: memory.pendingState ? STATE_LABELS[memory.pendingState] : null,
    pendingSessions: memory.pendingSessions,
    requiredSessions: 2,
    declineType: type,
    declineLabel: DECLINE_LABELS[type],
    summary: summary[state],
    components: [
      { id: 'trend', label: 'Equity trend', score: Math.round(trend), explanation: 'Average 20-session return for SPY, QQQ, and IWM.', source: 'Yahoo · 20D' },
      { id: 'breadth', label: 'Breadth', score: Math.round(breadth), explanation: 'Share of equity proxies trading above their 200-session mean.', source: 'Yahoo · SMA200' },
      { id: 'stability', label: 'Stability', score: Math.round(stability), explanation: 'Inverse of SPY 20-session annualized realized volatility.', source: 'Yahoo · realized vol' },
      { id: 'defensive', label: 'Risk appetite', score: Math.round(defensive), explanation: 'Inverse defensive demand from long Treasuries and gold.', source: 'Yahoo · TLT / GLD' },
      { id: 'macro', label: 'Macro health', score: Math.round(macroHealth), explanation: 'Inverse stress from labor direction and VIX.', source: 'FRED + Yahoo' },
    ],
    strategy,
    memory,
  };
}

export function buildMarketPulse(
  charts: ChartData[],
  macroSeries: MacroOverlaySeries[] = [],
  previousMemory?: PulseRegimeMemory,
): MarketPulseSnapshot {
  const chartBySymbol = new Map(charts.map((chart) => [chart.symbol, chart]));
  const assets = MARKET_PULSE_ASSETS.flatMap((definition) => {
    const chart = chartBySymbol.get(definition.symbol);
    return chart ? [snapshotAsset(chart, definition)] : [];
  });
  const returnMaps = new Map(
    MARKET_PULSE_ASSETS.flatMap((definition) => {
      const chart = chartBySymbol.get(definition.symbol);
      return chart ? [[definition.symbol, assetReturns(chart)] as const] : [];
    }),
  );
  const correlations: CorrelationCell[] = [];
  for (const row of MARKET_PULSE_ASSETS) {
    for (const column of MARKET_PULSE_ASSETS) {
      if (row.symbol === column.symbol) {
        correlations.push({ row: row.symbol, column: column.symbol, value: 1, observations: Math.min(90, returnMaps.get(row.symbol)?.size ?? 0) });
        continue;
      }
      const left = returnMaps.get(row.symbol);
      const right = returnMaps.get(column.symbol);
      const result = left && right ? correlation(left, right) : { value: null, observations: 0 };
      correlations.push({ row: row.symbol, column: column.symbol, ...result });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    assets,
    regime: buildRegime(assets, macroSeries, previousMemory),
    correlations,
    liveAssets: assets.filter((asset) => asset.source === 'live').length,
    totalAssets: assets.length,
  };
}

export function analyzeScenario(input: ScenarioInput): ScenarioImpact[] {
  const rates = clamp(input.ratesBps, -100, 100);
  const oil = clamp(input.oilPercent, -20, 20);
  const volatility = clamp(input.volatilityPoints, -10, 20);
  const impact = (id: ScenarioImpact['id'], label: string, score: number, explanation: string): ScenarioImpact => ({
    id,
    label,
    score: round(clamp(score, -10, 10), 1),
    explanation,
  });
  return [
    impact('growth', 'Growth', -rates / 20 - volatility / 5, 'Most rate-duration and volatility sensitive.'),
    impact('financials', 'Financials', rates / 35 - volatility / 6, 'Higher rates can help margins; stress offsets that benefit.'),
    impact('energy', 'Energy', oil / 3 - volatility / 8, 'Most directly exposed to the oil shock.'),
    impact('defensives', 'Defensives', -rates / 60 + volatility / 6, 'Often gains relative support when volatility rises.'),
    impact('broad', 'Broad market', -rates / 35 - oil / 8 - volatility / 5, 'Blended sensitivity across discount rates, costs, and stress.'),
  ];
}
