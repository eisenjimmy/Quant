import type { Candle, PivotPoint } from './types';

export type SignalStatus = 'pass' | 'fail' | 'warning' | 'neutral';
export type TradeDecision =
  | 'buy-candidate'
  | 'short-candidate'
  | 'wait'
  | 'no-trade'
  | 'invalidated';
export type SetupType =
  | 'breakout'
  | 'failed-breakout'
  | 'pullback-continuation'
  | 'vwap-reclaim'
  | 'lower-high-rejection'
  | 'higher-low-continuation'
  | 'capitulation-reversal'
  | 'range-compression'
  | 'trendline-break'
  | 'retest-entry'
  | 'exhaustion-move'
  | 'no-clear-setup';
export type MarketRegime =
  | 'trending-up'
  | 'trending-down'
  | 'range-bound'
  | 'high-volatility'
  | 'low-volatility'
  | 'breakout-compression'
  | 'mean-reversion'
  | 'choppy';
export type StopMethod = 'swing' | 'atr' | 'fixed-percent';
export type TradeDirection = 'long' | 'short' | 'none';

export interface SignalComponent {
  name: string;
  status: SignalStatus;
  score: number;
  explanation: string;
}

export interface RiskSettings {
  accountSize: number;
  maxRiskPerTradePercent: number;
  maxDailyLossPercent: number;
  minimumRewardRisk: number;
  atrStopMultiplier: number;
  fixedStopPercent: number;
  stopMethod: StopMethod;
}

export interface RiskRewardPlan {
  direction: TradeDirection;
  entry: number;
  stop: number;
  target1: number;
  target2: number;
  riskPerUnit: number;
  rewardPerUnit1: number;
  rewardPerUnit2: number;
  rewardRisk1: number;
  rewardRisk2: number;
  maxDollarRisk: number;
  positionSize: number;
  maxDollarLoss: number;
  estimatedGain1: number;
  estimatedGain2: number;
  invalidation: number;
}

export interface AnalyticsSummary {
  lastClose: number;
  changePercent: number;
  sma20: number | null;
  sma50: number | null;
  atr14: number | null;
  atrPercent: number | null;
  avgVolume20: number | null;
  volumeRatio: number | null;
  support: number | null;
  resistance: number | null;
  distanceToSupportPercent: number | null;
  distanceToResistancePercent: number | null;
}

export interface BacktestSummary {
  strategyName: string;
  strategyVersion: string;
  totalTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  averageR: number;
  bestTradeR: number;
  worstTradeR: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface SignalEvaluation {
  symbol: string;
  setupType: SetupType;
  decision: TradeDecision;
  direction: TradeDirection;
  regime: MarketRegime;
  confidence: number;
  components: SignalComponent[];
  noTradeReasons: string[];
  reason: string;
  risk: RiskRewardPlan;
  analytics: AnalyticsSummary;
  backtest: BacktestSummary;
  strategyVersion: string;
  evaluatedAt: string;
}

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  accountSize: 100_000,
  maxRiskPerTradePercent: 0.75,
  maxDailyLossPercent: 2,
  minimumRewardRisk: 1.8,
  atrStopMultiplier: 1.5,
  fixedStopPercent: 2,
  stopMethod: 'swing',
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function round(value: number, digits = 2): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function last<T>(items: T[]): T | null {
  return items.length ? items[items.length - 1] : null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sma(candles: Candle[], length: number): number | null {
  if (candles.length < length) return null;
  return mean(candles.slice(-length).map((c) => c.close));
}

function atr(candles: Candle[], length: number): number | null {
  if (candles.length < length + 1) return null;
  const ranges: number[] = [];
  for (let i = candles.length - length; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    ranges.push(
      Math.max(
        c.high - c.low,
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close),
      ),
    );
  }
  return mean(ranges);
}

function slope(values: number[]): number {
  if (values.length < 2) return 0;
  return (values[values.length - 1] - values[0]) / values.length;
}

function recentPivots(pivots: PivotPoint[], kind: PivotPoint['kind']): PivotPoint[] {
  return pivots.filter((p) => p.kind === kind).slice(-3);
}

function nearestSupport(candles: Candle[], pivots: PivotPoint[]): number | null {
  const close = last(candles)?.close;
  if (!isFiniteNumber(close)) return null;
  const supports = pivots
    .filter((p) => p.kind === 'low' && p.price < close)
    .map((p) => p.price)
    .sort((a, b) => b - a);
  return supports[0] ?? Math.min(...candles.slice(-20).map((c) => c.low));
}

function nearestResistance(candles: Candle[], pivots: PivotPoint[]): number | null {
  const close = last(candles)?.close;
  if (!isFiniteNumber(close)) return null;
  const resistances = pivots
    .filter((p) => p.kind === 'high' && p.price > close)
    .map((p) => p.price)
    .sort((a, b) => a - b);
  return resistances[0] ?? Math.max(...candles.slice(-20).map((c) => c.high));
}

export function analyticsFor(candles: Candle[], pivots: PivotPoint[]): AnalyticsSummary {
  const current = last(candles);
  const prev = candles.length > 1 ? candles[candles.length - 2] : null;
  const lastClose = current?.close ?? 0;
  const atr14 = atr(candles, 14);
  const avgVolume20 = mean(candles.slice(-20).map((c) => c.volume));
  const support = candles.length ? nearestSupport(candles, pivots) : null;
  const resistance = candles.length ? nearestResistance(candles, pivots) : null;
  return {
    lastClose: round(lastClose),
    changePercent: prev && prev.close !== 0 ? round(((lastClose - prev.close) / prev.close) * 100, 2) : 0,
    sma20: sma(candles, 20) === null ? null : round(sma(candles, 20) as number),
    sma50: sma(candles, 50) === null ? null : round(sma(candles, 50) as number),
    atr14: atr14 === null ? null : round(atr14),
    atrPercent: atr14 && lastClose ? round((atr14 / lastClose) * 100, 2) : null,
    avgVolume20: avgVolume20 === null ? null : Math.round(avgVolume20),
    volumeRatio:
      avgVolume20 && current && avgVolume20 > 0 ? round(current.volume / avgVolume20, 2) : null,
    support: support === null ? null : round(support),
    resistance: resistance === null ? null : round(resistance),
    distanceToSupportPercent:
      support && lastClose ? round(((lastClose - support) / lastClose) * 100, 2) : null,
    distanceToResistancePercent:
      resistance && lastClose ? round(((resistance - lastClose) / lastClose) * 100, 2) : null,
  };
}

export function classifyRegime(candles: Candle[]): MarketRegime {
  if (candles.length < 30) return 'range-bound';
  const current = last(candles);
  if (!current) return 'range-bound';
  const closes = candles.slice(-30).map((c) => c.close);
  const ma20 = sma(candles, 20);
  const ma50 = sma(candles, 50);
  const atr14 = atr(candles, 14);
  const atrBase = atr(candles.slice(0, -10), 14);
  const rangeHigh = Math.max(...candles.slice(-20).map((c) => c.high));
  const rangeLow = Math.min(...candles.slice(-20).map((c) => c.low));
  const compression = atr14 && current.close ? atr14 / current.close < 0.012 : false;
  const rangeWidth = current.close ? (rangeHigh - rangeLow) / current.close : 0;
  const maSlope = slope(closes.slice(-10));

  if (atr14 && atrBase && atr14 > atrBase * 1.45) return 'high-volatility';
  if (compression && rangeWidth < 0.055) return 'breakout-compression';
  if (atr14 && current.close && atr14 / current.close < 0.008) return 'low-volatility';
  if (ma20 && ma50 && current.close > ma20 && ma20 > ma50 && maSlope > 0) return 'trending-up';
  if (ma20 && ma50 && current.close < ma20 && ma20 < ma50 && maSlope < 0) return 'trending-down';
  if (rangeWidth < 0.06) return 'range-bound';
  if (Math.abs(maSlope) < current.close * 0.0008) return 'choppy';
  return 'mean-reversion';
}

export function classifySetup(
  candles: Candle[],
  pivots: PivotPoint[],
  regime: MarketRegime,
): SetupType {
  const current = last(candles);
  const prev = candles.length > 1 ? candles[candles.length - 2] : null;
  if (!current || !prev || candles.length < 30) return 'no-clear-setup';
  const support = nearestSupport(candles, pivots);
  const resistance = nearestResistance(candles, pivots);
  const atr14 = atr(candles, 14) ?? current.close * 0.02;
  const ma20 = sma(candles, 20);
  const lows = recentPivots(pivots, 'low');
  const highs = recentPivots(pivots, 'high');
  const volumeRatio = analyticsFor(candles, pivots).volumeRatio ?? 1;

  if (resistance && prev.close <= resistance && current.close > resistance && volumeRatio >= 1.2) {
    return 'breakout';
  }
  if (resistance && prev.high > resistance && current.close < resistance) {
    return 'failed-breakout';
  }
  if (regime === 'breakout-compression') return 'range-compression';
  if (ma20 && current.close > ma20 && current.low <= ma20 * 1.01 && current.close > current.open) {
    return 'pullback-continuation';
  }
  if (lows.length >= 2 && lows[lows.length - 1].price > lows[lows.length - 2].price) {
    return 'higher-low-continuation';
  }
  if (highs.length >= 2 && highs[highs.length - 1].price < highs[highs.length - 2].price) {
    return 'lower-high-rejection';
  }
  if (support && current.low < support - atr14 * 0.35 && current.close > support) {
    return 'capitulation-reversal';
  }
  if (resistance && Math.abs(current.close - resistance) < atr14 * 0.45) return 'retest-entry';
  if (current.high - current.low > atr14 * 2.5) return 'exhaustion-move';
  return 'no-clear-setup';
}

export function buildRiskPlan(
  candles: Candle[],
  pivots: PivotPoint[],
  direction: TradeDirection,
  settings: RiskSettings = DEFAULT_RISK_SETTINGS,
): RiskRewardPlan {
  const current = last(candles);
  const entry = current?.close ?? 0;
  const atr14 = atr(candles, 14) ?? entry * 0.02;
  const support = nearestSupport(candles, pivots) ?? entry - atr14 * 1.5;
  const resistance = nearestResistance(candles, pivots) ?? entry + atr14 * 2;
  const maxDollarRisk = settings.accountSize * (settings.maxRiskPerTradePercent / 100);

  let stop = entry;
  if (direction === 'long') {
    if (settings.stopMethod === 'fixed-percent') stop = entry * (1 - settings.fixedStopPercent / 100);
    else if (settings.stopMethod === 'atr') stop = entry - atr14 * settings.atrStopMultiplier;
    else stop = Math.min(support, entry - atr14 * 0.7);
  } else if (direction === 'short') {
    if (settings.stopMethod === 'fixed-percent') stop = entry * (1 + settings.fixedStopPercent / 100);
    else if (settings.stopMethod === 'atr') stop = entry + atr14 * settings.atrStopMultiplier;
    else stop = Math.max(resistance, entry + atr14 * 0.7);
  }

  const riskPerUnit = direction === 'none' ? 0 : Math.abs(entry - stop);
  const target1 =
    direction === 'long'
      ? Math.max(resistance, entry + riskPerUnit * 1.8)
      : direction === 'short'
        ? Math.min(support, entry - riskPerUnit * 1.8)
        : entry;
  const target2 =
    direction === 'long'
      ? entry + riskPerUnit * 3
      : direction === 'short'
        ? entry - riskPerUnit * 3
        : entry;
  const rewardPerUnit1 = Math.abs(target1 - entry);
  const rewardPerUnit2 = Math.abs(target2 - entry);
  const positionSize = riskPerUnit > 0 ? Math.floor(maxDollarRisk / riskPerUnit) : 0;

  return {
    direction,
    entry: round(entry),
    stop: round(stop),
    target1: round(target1),
    target2: round(target2),
    riskPerUnit: round(riskPerUnit),
    rewardPerUnit1: round(rewardPerUnit1),
    rewardPerUnit2: round(rewardPerUnit2),
    rewardRisk1: riskPerUnit > 0 ? round(rewardPerUnit1 / riskPerUnit, 2) : 0,
    rewardRisk2: riskPerUnit > 0 ? round(rewardPerUnit2 / riskPerUnit, 2) : 0,
    maxDollarRisk: round(maxDollarRisk),
    positionSize,
    maxDollarLoss: round(positionSize * riskPerUnit),
    estimatedGain1: round(positionSize * rewardPerUnit1),
    estimatedGain2: round(positionSize * rewardPerUnit2),
    invalidation: round(stop),
  };
}

function decisionFromSetup(setup: SetupType, regime: MarketRegime): TradeDirection {
  if (regime === 'trending-down' && setup === 'lower-high-rejection') return 'short';
  if (setup === 'failed-breakout' || setup === 'lower-high-rejection') return 'short';
  if (
    setup === 'breakout' ||
    setup === 'pullback-continuation' ||
    setup === 'higher-low-continuation' ||
    setup === 'vwap-reclaim' ||
    setup === 'retest-entry' ||
    setup === 'capitulation-reversal'
  ) {
    return 'long';
  }
  return 'none';
}

function statusScore(status: SignalStatus, pass: number, warn = -5): number {
  if (status === 'pass') return pass;
  if (status === 'warning') return warn;
  if (status === 'fail') return -Math.abs(warn);
  return 0;
}

export function evaluateSignal(
  symbol: string,
  candles: Candle[],
  pivots: PivotPoint[],
  settings: RiskSettings = DEFAULT_RISK_SETTINGS,
): SignalEvaluation {
  const current = last(candles);
  const analytics = analyticsFor(candles, pivots);
  const regime = classifyRegime(candles);
  const setupType = classifySetup(candles, pivots, regime);
  const direction = decisionFromSetup(setupType, regime);
  const risk = buildRiskPlan(candles, pivots, direction, settings);
  const components: SignalComponent[] = [];
  const add = (name: string, status: SignalStatus, score: number, explanation: string) => {
    components.push({ name, status, score, explanation });
  };

  const trendAligned =
    direction === 'long'
      ? regime === 'trending-up' || regime === 'breakout-compression' || regime === 'range-bound'
      : direction === 'short'
        ? regime === 'trending-down' || regime === 'choppy'
        : false;
  add(
    'Trend alignment',
    direction === 'none' ? 'neutral' : trendAligned ? 'pass' : 'warning',
    direction === 'none' ? 0 : statusScore(trendAligned ? 'pass' : 'warning', 20, -8),
    direction === 'none'
      ? 'No directional setup is strong enough to require trend confirmation.'
      : trendAligned
        ? `The current regime supports a ${direction} thesis.`
        : `The current regime does not cleanly support a ${direction} thesis.`,
  );

  const volumeOk = (analytics.volumeRatio ?? 0) >= 1.15;
  add(
    'Volume confirmation',
    volumeOk ? 'pass' : 'warning',
    statusScore(volumeOk ? 'pass' : 'warning', 15, -6),
    volumeOk
      ? `Current volume is ${analytics.volumeRatio}x the 20-bar average.`
      : 'Volume is not yet meaningfully above the 20-bar average.',
  );

  const closeOk = current ? current.close > Math.max(current.open, (current.high + current.low) / 2) : false;
  add(
    'Candle close confirmation',
    direction === 'short' ? (current && current.close < Math.min(current.open, (current.high + current.low) / 2) ? 'pass' : 'warning') : closeOk ? 'pass' : 'warning',
    statusScore(closeOk || direction === 'short' ? 'pass' : 'warning', 12, -5),
    closeOk
      ? 'The latest candle closed in the upper half of its range.'
      : 'The latest candle has not confirmed with a decisive close.',
  );

  const rrOk = risk.rewardRisk1 >= settings.minimumRewardRisk;
  add(
    'Reward/risk',
    direction === 'none' ? 'neutral' : rrOk ? 'pass' : 'fail',
    direction === 'none' ? 0 : statusScore(rrOk ? 'pass' : 'fail', 18, -18),
    direction === 'none'
      ? 'No trade plan is active.'
      : rrOk
        ? `Target 1 offers ${risk.rewardRisk1}R, above the ${settings.minimumRewardRisk}R minimum.`
        : `Target 1 offers only ${risk.rewardRisk1}R, below the ${settings.minimumRewardRisk}R minimum.`,
  );

  const nearResistance =
    direction === 'long' &&
    analytics.distanceToResistancePercent !== null &&
    analytics.distanceToResistancePercent < Math.max(0.35, (analytics.atrPercent ?? 1) * 0.55);
  const nearSupport =
    direction === 'short' &&
    analytics.distanceToSupportPercent !== null &&
    analytics.distanceToSupportPercent < Math.max(0.35, (analytics.atrPercent ?? 1) * 0.55);
  add(
    'Support/resistance location',
    nearResistance || nearSupport ? 'warning' : 'pass',
    statusScore(nearResistance || nearSupport ? 'warning' : 'pass', 12, -8),
    nearResistance
      ? 'Long entry is close to nearby resistance.'
      : nearSupport
        ? 'Short entry is close to nearby support.'
        : 'Price has enough room to the next nearby structure level.',
  );

  const extension =
    analytics.sma20 && analytics.atr14
      ? Math.abs(analytics.lastClose - analytics.sma20) / analytics.atr14
      : 0;
  const extended = extension > 2.7;
  add(
    'Extension from mean',
    extended ? 'warning' : 'pass',
    statusScore(extended ? 'warning' : 'pass', 8, -6),
    extended
      ? `Price is ${round(extension, 1)} ATR from the 20MA; chasing risk is elevated.`
      : 'Price is not excessively extended from its 20-period mean.',
  );

  const noTradeReasons: string[] = [];
  if (setupType === 'no-clear-setup') noTradeReasons.push('No clear setup is classified.');
  if (regime === 'choppy') noTradeReasons.push('Market regime is choppy/noisy.');
  if (!rrOk && direction !== 'none') noTradeReasons.push('Reward/risk is below the configured minimum.');
  if (nearResistance) noTradeReasons.push('Price is too close to resistance for a long trade.');
  if (nearSupport) noTradeReasons.push('Price is too close to support for a short trade.');
  if (!volumeOk) noTradeReasons.push('Volume confirmation is missing.');
  if (extended) noTradeReasons.push('Price is extended more than the configured ATR distance from mean.');
  if (risk.positionSize <= 0 && direction !== 'none') noTradeReasons.push('Position size resolves to zero under current risk settings.');

  const rawConfidence = components.reduce((sum, c) => sum + c.score, 35);
  const confidence = Math.max(0, Math.min(100, Math.round(rawConfidence)));
  let decision: TradeDecision = 'wait';
  if (setupType === 'failed-breakout' && confidence >= 55 && noTradeReasons.length === 0) decision = 'short-candidate';
  else if (direction === 'short' && confidence >= 55 && noTradeReasons.length === 0) decision = 'short-candidate';
  else if (direction === 'long' && confidence >= 55 && noTradeReasons.length === 0) decision = 'buy-candidate';
  else if (noTradeReasons.length > 0) decision = setupType === 'failed-breakout' ? 'invalidated' : 'no-trade';

  const reason =
    noTradeReasons.length > 0
      ? noTradeReasons[0]
      : decision === 'buy-candidate'
        ? 'A long candidate is forming with confirmed structure, acceptable reward/risk, and explainable support.'
        : decision === 'short-candidate'
          ? 'A short candidate is forming with bearish structure and acceptable risk controls.'
          : 'The setup is not mature enough; wait for confirmation.';

  return {
    symbol,
    setupType,
    decision,
    direction,
    regime,
    confidence,
    components,
    noTradeReasons,
    reason,
    risk,
    analytics,
    backtest: runBacktest(candles, settings),
    strategyVersion: 'QuantDeskSignal_v1',
    evaluatedAt: new Date().toISOString(),
  };
}

export function runBacktest(
  candles: Candle[],
  settings: RiskSettings = DEFAULT_RISK_SETTINGS,
): BacktestSummary {
  const trades: number[] = [];
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (let i = 55; i < candles.length - 5; i++) {
    const window = candles.slice(0, i + 1);
    const ma20 = sma(window, 20);
    const ma50 = sma(window, 50);
    const avgVol = mean(window.slice(-20).map((c) => c.volume));
    const c = candles[i];
    if (!ma20 || !ma50 || !avgVol) continue;
    const breakout = c.close > Math.max(...window.slice(-21, -1).map((x) => x.high));
    if (!breakout || c.close < ma20 || ma20 < ma50 || c.volume < avgVol * 1.1) continue;
    const risk = atr(window, 14) ?? c.close * 0.02;
    const stop = c.close - risk * settings.atrStopMultiplier;
    const target = c.close + risk * Math.max(settings.minimumRewardRisk, 1.8);
    let r = 0;
    for (let j = i + 1; j < Math.min(candles.length, i + 11); j++) {
      if (candles[j].low <= stop) {
        r = -1;
        break;
      }
      if (candles[j].high >= target) {
        r = (target - c.close) / (c.close - stop);
        break;
      }
    }
    if (r === 0) r = (candles[Math.min(candles.length - 1, i + 10)].close - c.close) / (c.close - stop);
    trades.push(round(r, 2));
    equity += r;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  const wins = trades.filter((r) => r > 0);
  const losses = trades.filter((r) => r < 0);
  let cw = 0;
  let cl = 0;
  let maxCw = 0;
  let maxCl = 0;
  for (const r of trades) {
    if (r > 0) {
      cw++;
      cl = 0;
    } else if (r < 0) {
      cl++;
      cw = 0;
    }
    maxCw = Math.max(maxCw, cw);
    maxCl = Math.max(maxCl, cl);
  }
  const averageWin = mean(wins) ?? 0;
  const averageLossAbs = Math.abs(mean(losses) ?? 0);
  const winRate = trades.length ? wins.length / trades.length : 0;
  const lossRate = trades.length ? losses.length / trades.length : 0;
  const grossWin = wins.reduce((sum, r) => sum + r, 0);
  const grossLoss = Math.abs(losses.reduce((sum, r) => sum + r, 0));
  return {
    strategyName: 'Breakout confirmation',
    strategyVersion: 'BreakoutStrategy_v1',
    totalTrades: trades.length,
    winRate: round(winRate * 100, 1),
    averageWin: round(averageWin, 2),
    averageLoss: round(averageLossAbs, 2),
    profitFactor: grossLoss > 0 ? round(grossWin / grossLoss, 2) : grossWin > 0 ? 99 : 0,
    expectancy: round(winRate * averageWin - lossRate * averageLossAbs, 2),
    maxDrawdown: round(maxDrawdown, 2),
    averageR: round(mean(trades) ?? 0, 2),
    bestTradeR: round(trades.length ? Math.max(...trades) : 0, 2),
    worstTradeR: round(trades.length ? Math.min(...trades) : 0, 2),
    consecutiveWins: maxCw,
    consecutiveLosses: maxCl,
  };
}
