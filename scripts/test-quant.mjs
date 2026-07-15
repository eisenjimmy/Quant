import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(os.tmpdir(), `quant-test-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const outfile = path.join(tmp, 'quant.mjs');
const signalsOutfile = path.join(tmp, 'signals.mjs');
const harnessOutfile = path.join(tmp, 'harness.mjs');
const llmOutfile = path.join(tmp, 'llm.mjs');
const marketPulseOutfile = path.join(tmp, 'market-pulse.mjs');

await build({
  entryPoints: [path.join(root, 'src/shared/marketPulse.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: marketPulseOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/quant.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/llm.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: llmOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/harness.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: harnessOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/signals.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: signalsOutfile,
  logLevel: 'silent',
});

const quant = await import(pathToFileURL(outfile).href);
const signals = await import(pathToFileURL(signalsOutfile).href);
const harness = await import(pathToFileURL(harnessOutfile).href);
const llm = await import(pathToFileURL(llmOutfile).href);
const marketPulse = await import(pathToFileURL(marketPulseOutfile).href);

function candles(count = 90) {
  const out = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    const jump = i === count - 2 ? 4 : 0;
    const open = price;
    price += 0.18 + jump;
    const close = price;
    out.push({
      time: 1_700_000_000 + i * 86_400,
      open,
      high: close + 0.8,
      low: open - 0.6,
      close,
      volume: i > count - 5 ? 2_000_000 : 1_000_000,
    });
  }
  return out;
}

const series = candles();
const pivots = [
  { time: series[30].time, price: series[30].low, kind: 'low' },
  { time: series[55].time, price: series[55].high, kind: 'high' },
  { time: series[70].time, price: series[70].low, kind: 'low' },
];

const evaluation = quant.evaluateSignal('TST', series, pivots);
assert.equal(evaluation.symbol, 'TST');
assert.ok(evaluation.confidence >= 0 && evaluation.confidence <= 100);
assert.ok(evaluation.components.length >= 5);
assert.ok(evaluation.risk.entry > 0);
assert.ok(evaluation.risk.positionSize >= 0);
assert.equal(evaluation.strategyVersion, 'QuantDeskSignal_v1');

const backtest = quant.runBacktest(series);
assert.ok(backtest.totalTrades >= 0);
assert.ok(Number.isFinite(backtest.expectancy));
assert.ok(Number.isFinite(backtest.profitFactor));

const evidence = harness.buildQuantEvidence({
  symbol: 'TST',
  range: '1y',
  evaluation,
  news: [{
    id: 'news-1',
    title: 'Untrusted headline text',
    url: 'https://example.com',
    sourceName: 'Example',
    publishedAt: '2026-01-01T00:00:00.000Z',
    relatedSymbol: 'TST',
  }],
});
assert.ok(evidence.length >= 6);
assert.deepEqual(evidence.map((item) => item.id), evidence.map((_, index) => `E${index + 1}`));
assert.equal(evidence.find((item) => item.category === 'news')?.quality, 'warning');

const signalScan = signals.detectStockSignals(candles(160));
assert.ok(signalScan.metrics.lastClose > 0);
assert.ok(Array.isArray(signalScan.signals));
assert.ok(signalScan.signals.some((s) => s.kind === 'ma-alignment'));

assert.equal(llm.providerDefinition('local').baseUrl, 'http://127.0.0.1:8080/v1');
assert.equal(llm.providerDefinition('claude').requiresApiKey, true);
assert.equal(llm.normalizeApiBaseUrl('https://api.openai.com/v1///'), 'https://api.openai.com/v1');

const pulseCharts = marketPulse.MARKET_PULSE_ASSETS.map((asset, assetIndex) => ({
  symbol: asset.symbol,
  range: '1y',
  candles: candles(260).map((candle, candleIndex) => {
    const cycle = Math.sin((candleIndex + assetIndex * 3) / (7 + assetIndex));
    const drift = assetIndex < 3 ? candleIndex * (0.06 - assetIndex * 0.01) : candleIndex * 0.015;
    const close = candle.close + cycle * (assetIndex + 1) * 0.25 + drift;
    return { ...candle, open: close - 0.2, high: close + 0.7, low: close - 0.6, close };
  }),
  source: assetIndex === 5 ? 'sample' : 'live',
}));
const macroPoints = (count, base, step = 0) => Array.from({ length: count }, (_, index) => ({
  time: 1_700_000_000 + index * 86_400,
  value: base + index * step,
}));
const pulseMacro = [
  { key: 'jobs', label: 'Jobs', unit: 'thousands', sourceName: 'FRED', source: 'live', points: macroPoints(24, 180, 1) },
  { key: 'unemployment', label: 'Unemployment', unit: 'percent', sourceName: 'FRED', source: 'live', points: macroPoints(24, 4.1, -0.002) },
  { key: 'inflation', label: 'Inflation', unit: 'percent', sourceName: 'FRED', source: 'live', points: macroPoints(24, 2.8, -0.004) },
  { key: 'treasury10y', label: '10Y', unit: 'percent', sourceName: 'FRED', source: 'live', points: macroPoints(260, 4.1, -0.001) },
  { key: 'vix', label: 'VIX', unit: 'index', sourceName: 'Yahoo Finance', source: 'live', points: macroPoints(260, 16, 0.002) },
];
const pulse = marketPulse.buildMarketPulse(pulseCharts, pulseMacro);
assert.equal(pulse.assets.length, 6);
assert.equal(pulse.correlations.length, 36);
assert.ok(pulse.regime.score >= 0 && pulse.regime.score <= 100);
assert.equal(pulse.correlations.find((cell) => cell.row === 'SPY' && cell.column === 'SPY')?.value, 1);
assert.equal(pulse.liveAssets, 5);
assert.equal(pulse.regime.strategy.definition.version, '2.0.0');
assert.equal(pulse.regime.strategy.dataHealth, 'mixed');
assert.equal(pulse.regime.strategy.evidence.length, 5);
assert.equal(pulse.regime.strategy.verification.checks.every((check) => check.passed), true);
assert.equal(pulse.regime.state, pulse.regime.rawState);

const initialRegime = {
  committedState: 'uptrend-healthy',
  pendingState: null,
  pendingSessions: 0,
  lastObservedAt: '2026-07-10T20:00:00.000Z',
  lastRawState: 'uptrend-healthy',
};
const pendingRegime = marketPulse.advanceRegimeMemory(
  'correction',
  initialRegime,
  '2026-07-11T20:00:00.000Z',
);
assert.equal(pendingRegime.committedState, 'uptrend-healthy');
assert.equal(pendingRegime.pendingState, 'correction');
assert.equal(pendingRegime.pendingSessions, 1);
const sameSessionRegime = marketPulse.advanceRegimeMemory(
  'correction',
  pendingRegime,
  '2026-07-11T20:00:00.000Z',
);
assert.equal(sameSessionRegime.pendingSessions, 1);
const committedRegime = marketPulse.advanceRegimeMemory(
  'correction',
  pendingRegime,
  '2026-07-12T20:00:00.000Z',
);
assert.equal(committedRegime.committedState, 'correction');
assert.equal(committedRegime.pendingState, null);
const insufficientPulse = marketPulse.buildMarketPulse(
  pulseCharts.map((chart) => ({ ...chart, candles: chart.candles.slice(-120) })),
  pulseMacro,
  pendingRegime,
);
assert.equal(insufficientPulse.regime.strategy.dataHealth, 'insufficient');
assert.deepEqual(insufficientPulse.regime.memory, pendingRegime);

const scenario = marketPulse.analyzeScenario({ ratesBps: 50, oilPercent: 10, volatilityPoints: 5 });
assert.equal(scenario.length, 5);
assert.ok(scenario.find((item) => item.id === 'growth').score < 0);
assert.ok(scenario.find((item) => item.id === 'energy').score > 0);

rmSync(tmp, { recursive: true, force: true });
console.log('quant tests ok');
