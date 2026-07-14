import type { ChartData, DataSource } from './types';

export const MARKET_PULSE_ASSETS = [
  { symbol: 'SPY', label: 'S&P 500', role: 'Broad equities' },
  { symbol: 'QQQ', label: 'Nasdaq 100', role: 'Growth' },
  { symbol: 'IWM', label: 'Russell 2000', role: 'Breadth' },
  { symbol: 'TLT', label: 'Long Treasuries', role: 'Duration' },
  { symbol: 'GLD', label: 'Gold', role: 'Defensive' },
  { symbol: 'USO', label: 'Oil', role: 'Inflation' },
] as const;

export type MarketPulseSymbol = (typeof MARKET_PULSE_ASSETS)[number]['symbol'];

export interface PulseAssetSnapshot {
  symbol: MarketPulseSymbol;
  label: string;
  role: string;
  last: number | null;
  return20d: number | null;
  annualVolatility: number | null;
  aboveSma20: boolean | null;
  source: DataSource;
  asOf: number | null;
}

export interface PulseRegimeComponent {
  id: 'trend' | 'breadth' | 'stability' | 'defensive';
  label: string;
  score: number;
  explanation: string;
}

export interface PulseRegime {
  score: number;
  label: 'risk-on' | 'constructive' | 'neutral' | 'defensive' | 'risk-off';
  summary: string;
  components: PulseRegimeComponent[];
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
  const prior = values.at(-21)?.close ?? null;
  const window = values.slice(-20);
  const dailyReturns = [...assetReturns(chart).values()].slice(-20);
  const sma20 = window.length >= 12 ? mean(window.map((item) => item.close)) : null;
  return {
    symbol: definition.symbol,
    label: definition.label,
    role: definition.role,
    last,
    return20d: last !== null && prior !== null ? round((last / prior - 1) * 100) : null,
    annualVolatility: dailyReturns.length >= 12 ? round(stdev(dailyReturns) * Math.sqrt(252) * 100, 1) : null,
    aboveSma20: last !== null && sma20 !== null ? last >= sma20 : null,
    source: chart.source,
    asOf: values.at(-1)?.time ?? null,
  };
}

function buildRegime(assets: PulseAssetSnapshot[]): PulseRegime {
  const bySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
  const equities = ['SPY', 'QQQ', 'IWM'].map((symbol) => bySymbol.get(symbol as MarketPulseSymbol)).filter(Boolean) as PulseAssetSnapshot[];
  const defensives = ['TLT', 'GLD'].map((symbol) => bySymbol.get(symbol as MarketPulseSymbol)).filter(Boolean) as PulseAssetSnapshot[];
  const equityReturns = equities.map((asset) => asset.return20d).filter((value): value is number => value !== null);
  const trend = clamp(50 + mean(equityReturns) * 5, 0, 100);
  const breadthKnown = equities.filter((asset) => asset.aboveSma20 !== null);
  const breadth = breadthKnown.length
    ? (breadthKnown.filter((asset) => asset.aboveSma20).length / breadthKnown.length) * 100
    : 50;
  const spyVolatility = bySymbol.get('SPY')?.annualVolatility ?? 20;
  const stability = clamp(100 - Math.max(0, spyVolatility - 8) * 4.5, 0, 100);
  const defensiveReturns = defensives.map((asset) => asset.return20d).filter((value): value is number => value !== null);
  const defensive = clamp(50 - mean(defensiveReturns) * 5, 0, 100);
  const score = Math.round(trend * 0.35 + breadth * 0.3 + stability * 0.2 + defensive * 0.15);
  const label: PulseRegime['label'] =
    score >= 68 ? 'risk-on' : score >= 56 ? 'constructive' : score >= 44 ? 'neutral' : score >= 30 ? 'defensive' : 'risk-off';
  const summary = {
    'risk-on': 'Equity trend, breadth, and realized volatility are broadly supportive.',
    constructive: 'Risk appetite is positive, but at least one confirming condition is mixed.',
    neutral: 'Cross-asset evidence is balanced; wait for trend or breadth to resolve.',
    defensive: 'Defensive demand or weak equity breadth is limiting risk appetite.',
    'risk-off': 'Weak equity trend and elevated stress favor capital preservation.',
  }[label];
  return {
    score,
    label,
    summary,
    components: [
      { id: 'trend', label: 'Equity trend', score: Math.round(trend), explanation: 'Average 20-session return for SPY, QQQ, and IWM.' },
      { id: 'breadth', label: 'Breadth', score: Math.round(breadth), explanation: 'Share of equity proxies trading above their 20-session mean.' },
      { id: 'stability', label: 'Stability', score: Math.round(stability), explanation: 'Inverse of SPY 20-session annualized realized volatility.' },
      { id: 'defensive', label: 'Risk appetite', score: Math.round(defensive), explanation: 'Inverse defensive demand from long Treasuries and gold.' },
    ],
  };
}

export function buildMarketPulse(charts: ChartData[]): MarketPulseSnapshot {
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
        correlations.push({ row: row.symbol, column: column.symbol, value: 1, observations: 90 });
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
    regime: buildRegime(assets),
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
