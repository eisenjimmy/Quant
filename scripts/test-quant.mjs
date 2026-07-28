import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
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
const forecastOutfile = path.join(tmp, 'forecast.mjs');
const forecastCalendarOutfile = path.join(tmp, 'forecast-calendar.mjs');
const forecastDataOutfile = path.join(tmp, 'forecast-data.mjs');
const forecastEvaluatorOutfile = path.join(tmp, 'forecast-evaluator.mjs');
const forecastRegistryOutfile = path.join(tmp, 'forecast-registry.mjs');
const forecastOrchestratorOutfile = path.join(tmp, 'forecast-orchestrator.mjs');
const forecastStoreOutfile = path.join(tmp, 'forecast-store.mjs');
const forecastWorkerOutfile = path.join(tmp, 'forecast-worker.mjs');
const kronosWorkerOutfile = path.join(tmp, 'kronos-worker.mjs');
const forecastRuntimeOutfile = path.join(tmp, 'forecast-runtime.mjs');
const forecastViewModelOutfile = path.join(tmp, 'forecast-view-model.mjs');
const forecastOverlayModelOutfile = path.join(tmp, 'forecast-overlay-model.mjs');
const forecastBandPrimitiveOutfile = path.join(tmp, 'forecast-band-primitive.mjs');
const forecastHistoryModelOutfile = path.join(tmp, 'forecast-history-model.mjs');
const watchlistOutfile = path.join(tmp, 'watchlist.mjs');
const ipcOutfile = path.join(tmp, 'ipc.mjs');

await build({
  entryPoints: [path.join(root, 'src/shared/ipc.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: ipcOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/watchlist.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: watchlistOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/forecastWorker.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastWorkerOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/kronosWorker.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: kronosWorkerOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastRuntime.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastRuntimeOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastCalendar.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastCalendarOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastData.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastDataOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastEvaluator.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastEvaluatorOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastJobRegistry.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastRegistryOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastOrchestrator.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastOrchestratorOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/main/services/forecastStore.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastStoreOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/renderer/components/chart/forecastViewModel.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastViewModelOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/renderer/components/chart/forecastOverlayModel.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastOverlayModelOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/renderer/components/chart/ForecastBandPrimitive.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastBandPrimitiveOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/renderer/components/chart/forecastHistoryModel.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastHistoryModelOutfile,
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(root, 'src/shared/forecast.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: forecastOutfile,
  logLevel: 'silent',
});

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
const forecast = await import(pathToFileURL(forecastOutfile).href);
const forecastCalendar = await import(pathToFileURL(forecastCalendarOutfile).href);
const forecastData = await import(pathToFileURL(forecastDataOutfile).href);
const forecastEvaluator = await import(
  pathToFileURL(forecastEvaluatorOutfile).href
);
const forecastRegistry = await import(pathToFileURL(forecastRegistryOutfile).href);
const forecastOrchestrator = await import(
  pathToFileURL(forecastOrchestratorOutfile).href
);
const forecastStore = await import(pathToFileURL(forecastStoreOutfile).href);
const forecastWorker = await import(pathToFileURL(forecastWorkerOutfile).href);
const kronosWorker = await import(pathToFileURL(kronosWorkerOutfile).href);
const forecastRuntime = await import(
  pathToFileURL(forecastRuntimeOutfile).href
);
const forecastViewModel = await import(pathToFileURL(forecastViewModelOutfile).href);
const forecastOverlayModel = await import(pathToFileURL(forecastOverlayModelOutfile).href);
const forecastBandPrimitive = await import(pathToFileURL(forecastBandPrimitiveOutfile).href);
const forecastHistoryModel = await import(pathToFileURL(forecastHistoryModelOutfile).href);
const watchlist = await import(pathToFileURL(watchlistOutfile).href);
const ipc = await import(pathToFileURL(ipcOutfile).href);
const setupForecast = await import(
  pathToFileURL(path.join(root, 'scripts', 'setup-forecast.mjs')).href
);

assert.equal(ipc.IPC.forecastRun, 'forecast:run');
assert.equal(ipc.IPC.forecastProgress, 'forecast:progress');
assert.equal(ipc.IPC.forecastCompleted, 'forecast:completed');
assert.equal(ipc.IPC.forecastFailed, 'forecast:failed');
assert.equal(ipc.IPC.watchlistReorder, 'watchlist:reorder');
assert.equal(
  ipc.IPC.forecastGetHistoricalComparison,
  'forecast:get-historical-comparison',
);
const watchlistItems = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', addedAt: '2026-01-01' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', addedAt: '2026-01-02' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', addedAt: '2026-01-03' },
];
assert.deepEqual(
  watchlist
    .moveWatchlistItem(watchlistItems, 'SPY', 'QQQ', 'after')
    .map((item) => item.symbol),
  ['QQQ', 'SPY', 'AAPL'],
);
assert.equal(
  watchlist.moveWatchlistItem(watchlistItems, 'AAPL', 'SPY', 'before'),
  null,
);
assert.deepEqual(
  watchlist
    .applyWatchlistOrder(watchlistItems, [' aapl ', 'qqq', 'spy'])
    .map((item) => item.symbol),
  ['AAPL', 'QQQ', 'SPY'],
);
assert.equal(
  watchlist.applyWatchlistOrder(watchlistItems, ['SPY', 'SPY', 'AAPL']),
  null,
);
assert.equal(
  watchlist.applyWatchlistOrder(watchlistItems, ['SPY', 'QQQ']),
  null,
);
const historicalComparisonUi = readFileSync(
  path.join(
    root,
    'src/renderer/components/chart/ForecastHistoricalComparison.tsx',
  ),
  'utf8',
);
assert.match(historicalComparisonUi, /Historical comparison/);
assert.doesNotMatch(historicalComparisonUi, /verified accuracy/i);
assert.equal(setupForecast.isSupportedPythonVersion([3, 9, 9]), false);
assert.equal(setupForecast.isSupportedPythonVersion([3, 10, 0]), true);
assert.equal(setupForecast.isSupportedPythonVersion([3, 12, 99]), true);
assert.equal(setupForecast.isSupportedPythonVersion([3, 13, 0]), false);
const forecastSources = setupForecast.inspectForecastSources(root);
assert.equal(forecastSources.requirementCount, 8);
assert.equal(
  forecastSources.kronosCommit,
  '67b630e67f6a18c9e9be918d9b4337c960db1e9a',
);
assert.equal(
  forecastWorker.isForecastWorkerRequest({
    type: 'health',
    requestId: 'health_test',
  }),
  true,
);
assert.equal(
  forecastWorker.isForecastWorkerRequest({
    type: 'run',
    jobId: 'fc_bad',
    payload: { paths: 29 },
  }),
  false,
);
assert.deepEqual(
  kronosWorker.sanitizedForecastWorkerEnvironment(
    {
      PATH: '/usr/bin',
      QUANT_FORECAST_WORKER_TEST_MODE: '1',
      QUANT_FORECAST_WORKER_CRASH_ON_RUN: '1',
      QUANT_KRONOS_ROOT: '/tmp/alternate-kronos',
      QUANT_KRONOS_COMMIT_PATH: '/tmp/alternate-commit',
    },
    {},
  ),
  {
    PATH: '/usr/bin',
    PYTHONUNBUFFERED: '1',
  },
);
assert.equal(
  kronosWorker.sanitizedForecastWorkerEnvironment(
    { QUANT_FORECAST_WORKER_TEST_MODE: 'leaked' },
    { QUANT_FORECAST_WORKER_TEST_MODE: '1' },
  ).QUANT_FORECAST_WORKER_TEST_MODE,
  '1',
);
assert.deepEqual(
  kronosWorker.resolveKronosWorkerLaunch({
    scriptPath: '/tmp/forecast/worker.py',
    pythonExecutable: '/tmp/python',
  }),
  {
    command: '/tmp/python',
    args: ['/tmp/forecast/worker.py'],
    cwd: '/tmp/forecast',
    bundled: false,
  },
);
assert.deepEqual(
  kronosWorker.resolveKronosWorkerLaunch({
    scriptPath: '/ignored/worker.py',
    workerExecutable: '/tmp/sidecar/quant-forecast-worker',
  }),
  {
    command: '/tmp/sidecar/quant-forecast-worker',
    args: [],
    cwd: '/tmp/sidecar',
    bundled: true,
  },
);
assert.throws(
  () => kronosWorker.resolveKronosWorkerLaunch({}),
  /script path is required/,
);
assert.equal(
  forecastRuntime.bundledForecastWorkerExecutable(
    '/tmp/resources',
    'darwin',
  ),
  '/tmp/resources/forecast-sidecar/quant-forecast-worker/quant-forecast-worker',
);
assert.equal(
  forecastRuntime.bundledForecastWorkerExecutable(
    'C:\\Quant\\resources',
    'win32',
  ).endsWith(
    path.join(
      'forecast-sidecar',
      'quant-forecast-worker',
      'quant-forecast-worker.exe',
    ),
  ),
  true,
);
assert.equal(
  forecastRuntime.bundledForecastWorkerAvailable(
    '/tmp/resources',
    'darwin',
    (candidate) =>
      candidate ===
      '/tmp/resources/forecast-sidecar/quant-forecast-worker/quant-forecast-worker',
  ),
  true,
);
assert.equal(
  forecastRuntime.bundledForecastWorkerAvailable(
    '/tmp/resources',
    'darwin',
    () => false,
  ),
  false,
);
assert.equal(
  forecastRuntime.bundledForecastWorkerAvailable(
    '/tmp/resources',
    'linux',
    () => true,
  ),
  false,
);
assert.throws(
  () =>
    forecastRuntime.bundledForecastWorkerExecutable(
      '/tmp/resources',
      'linux',
    ),
  /unavailable/,
);
assert.equal(
  forecastWorker.isForecastWorkerEvent({
    type: 'progress',
    jobId: 'fc_bad',
    stage: 'running-paths',
    completedPaths: 31,
    totalPaths: 30,
    percent: 95,
    message: 'bad',
  }),
  false,
);
assert.equal(
  forecastWorker.isForecastWorkerEvent({
    type: 'progress',
    jobId: 'fc_preparing',
    stage: 'preparing-engine',
    completedPaths: 0,
    totalPaths: 30,
    percent: 4,
    message: 'Downloading Kronos-mini for first use',
    preparationPhase: 'downloading',
  }),
  true,
);
assert.equal(
  forecastWorker.isForecastWorkerEvent({
    type: 'progress',
    jobId: 'fc_preparing',
    stage: 'preparing-engine',
    completedPaths: 0,
    totalPaths: 30,
    percent: 4,
    message: 'Missing preparation phase',
  }),
  false,
);

assert.equal(forecast.FORECAST_V1.pathCount, 30);
assert.equal(forecast.FORECAST_V1.predictionBars, 24);
assert.equal(forecast.FORECAST_V1.recordTtlMs, 7 * 24 * 60 * 60 * 1000);
assert.equal(forecast.forecastPercentForCompletedPaths(0), 5);
assert.equal(forecast.forecastPercentForCompletedPaths(1), 8);
assert.equal(forecast.forecastPercentForCompletedPaths(10), 35);
assert.equal(forecast.forecastPercentForCompletedPaths(20), 65);
assert.equal(forecast.forecastPercentForCompletedPaths(21), 68);
assert.equal(forecast.forecastPercentForCompletedPaths(30), 95);
assert.throws(() => forecast.forecastPercentForCompletedPaths(-1), RangeError);
assert.throws(() => forecast.forecastPercentForCompletedPaths(30.5), RangeError);
assert.throws(() => forecast.forecastPercentForCompletedPaths(31), RangeError);
assert.equal(forecast.canTransitionForecastStage('validating', 'preparing-engine'), true);
assert.equal(forecast.canTransitionForecastStage('running-paths', 'completed'), false);
assert.equal(forecast.canTransitionForecastStage('completed', 'validating'), false);
assert.equal(forecast.isActiveForecastStage('running-paths'), true);
assert.equal(forecast.isActiveForecastStage('failed'), false);

const baseForecastProgress = {
  jobId: 'fc_test',
  symbol: 'SPY',
  stage: 'preparing-engine',
  sequence: 3,
  percent: 5,
  completedPaths: 0,
  totalPaths: 30,
  message: 'Loading model',
  updatedAt: '2026-07-25T20:00:00.000Z',
};
const firstPathProgress = {
  ...baseForecastProgress,
  stage: 'running-paths',
  sequence: 4,
  percent: 8,
  completedPaths: 1,
  message: 'Completed path 1 of 30',
};
assert.equal(
  forecast.validateForecastProgressUpdate(baseForecastProgress, firstPathProgress).ok,
  true,
);
assert.equal(
  forecast.validateForecastProgressUpdate(
    { ...baseForecastProgress, stage: 'validating', preparationPhase: undefined },
    {
      ...baseForecastProgress,
      sequence: baseForecastProgress.sequence + 1,
      preparationPhase: 'loading',
    },
  ).ok,
  true,
);
assert.equal(
  forecast.validateForecastProgressUpdate(
    baseForecastProgress,
    {
      ...firstPathProgress,
      preparationPhase: 'loading',
    },
  ).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate(firstPathProgress, {
    ...firstPathProgress,
    sequence: 5,
    percent: 7,
  }).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate(firstPathProgress, {
    ...firstPathProgress,
    sequence: 5,
    percent: 41,
    completedPaths: 2,
  }).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate(firstPathProgress, {
    ...firstPathProgress,
    sequence: 4,
    percent: 8,
  }).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate(firstPathProgress, {
    ...firstPathProgress,
    stage: 'completed',
    sequence: 5,
    percent: 100,
    completedPaths: 30,
    forecastId: 'fc_skipped_stages',
  }).ok,
  false,
);
const finalPathProgress = {
  ...firstPathProgress,
  sequence: 33,
  percent: 95,
  completedPaths: 30,
  message: 'Completed path 30 of 30',
};
assert.equal(
  forecast.validateForecastProgressUpdate(firstPathProgress, finalPathProgress).ok,
  true,
);
assert.equal(
  forecast.validateForecastProgressUpdate(finalPathProgress, {
    ...finalPathProgress,
    sequence: 34,
    percent: 96,
  }).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate(finalPathProgress, {
    ...finalPathProgress,
    sequence: 34,
    percent: 92,
    completedPaths: 29,
  }).ok,
  false,
);
const postProcessingProgress = {
  ...finalPathProgress,
  stage: 'post-processing',
  sequence: 34,
  percent: 96,
  message: 'Validating forecast paths',
};
assert.equal(
  forecast.validateForecastProgressUpdate(finalPathProgress, postProcessingProgress).ok,
  true,
);
const persistingProgress = {
  ...postProcessingProgress,
  stage: 'persisting',
  sequence: 37,
  percent: 99,
  message: 'Saving forecast',
};
assert.equal(
  forecast.validateForecastProgressUpdate(postProcessingProgress, persistingProgress).ok,
  true,
);
assert.equal(
  forecast.validateForecastProgressUpdate(persistingProgress, {
    ...persistingProgress,
    stage: 'completed',
    sequence: 38,
    percent: 100,
    message: 'Forecast complete',
  }).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate({
    ...persistingProgress,
    completedPaths: 29,
  }, {
    ...persistingProgress,
    stage: 'completed',
    sequence: 38,
    percent: 100,
    completedPaths: 29,
    forecastId: 'fc_incomplete',
    message: 'Forecast complete',
  }).ok,
  false,
);
assert.equal(
  forecast.validateForecastProgressUpdate(persistingProgress, {
    ...persistingProgress,
    stage: 'completed',
    sequence: 38,
    percent: 100,
    forecastId: 'fc_saved',
    message: 'Forecast complete',
  }).ok,
  true,
);

const validForecastRequest = {
  symbol: 'spy',
  assetType: 'etf',
  requestedAt: '2026-07-25T20:00:00.000Z',
  paths: 30,
  horizonBars: 24,
  interval: '1h',
};

const fridayCalendar = forecastCalendar.nextUsMarketBarTimestamps({
  afterTimestamp: '2026-07-17T19:30:00.000Z',
  count: 24,
  exchange: 'NYSEArca',
  timezone: 'America/New_York',
});
assert.equal(fridayCalendar.timestamps.length, 24);
assert.equal(fridayCalendar.timestamps[0], '2026-07-20T13:30:00.000Z');
assert.equal(fridayCalendar.timestamps[5], '2026-07-20T18:30:00.000Z');
assert.equal(fridayCalendar.timestamps[6], '2026-07-21T13:30:00.000Z');
assert.equal(fridayCalendar.timestamps[23], '2026-07-23T18:30:00.000Z');
assert.equal(new Set(fridayCalendar.timestamps).size, 24);
assert.equal(fridayCalendar.assumptions.exchange, 'NYSEArca');
assert.equal(fridayCalendar.assumptions.timezone, 'America/New_York');
assert.equal(fridayCalendar.assumptions.calendar, 'US-equities-v1');
assert.equal(fridayCalendar.assumptions.regularSession, '09:30-16:00');
assert.equal(
  forecastCalendar.validateUsMarketBarTimestamps(
    fridayCalendar.timestamps,
    'America/New_York',
  ),
  true,
);
assert.equal(
  forecastCalendar.validateUsMarketBarTimestamps(
    ['2026-07-20T19:30:00.000Z'],
    'America/New_York',
  ),
  false,
);
assert.equal(
  forecastCalendar.validateUsMarketBarTimestamps(
    ['2026-11-27T17:30:00.000Z'],
    'America/New_York',
  ),
  false,
);

const weekendCalendar = forecastCalendar.nextUsMarketBarTimestamps({
  afterTimestamp: '2026-07-18T16:00:00.000Z',
  count: 1,
});
assert.deepEqual(weekendCalendar.timestamps, ['2026-07-20T13:30:00.000Z']);

const independenceDayCalendar =
  forecastCalendar.nextUsMarketBarTimestamps({
    afterTimestamp: '2026-07-02T19:30:00.000Z',
    count: 1,
  });
assert.deepEqual(
  independenceDayCalendar.timestamps,
  ['2026-07-06T13:30:00.000Z'],
);

const thanksgivingEarlyCloseCalendar =
  forecastCalendar.nextUsMarketBarTimestamps({
    afterTimestamp: '2026-11-25T19:30:00.000Z',
    count: 4,
  });
assert.deepEqual(thanksgivingEarlyCloseCalendar.timestamps, [
  '2026-11-27T14:30:00.000Z',
  '2026-11-27T15:30:00.000Z',
  '2026-11-27T16:30:00.000Z',
  '2026-11-30T14:30:00.000Z',
]);

const christmasEveEarlyCloseCalendar =
  forecastCalendar.nextUsMarketBarTimestamps({
    afterTimestamp: '2026-12-23T19:30:00.000Z',
    count: 4,
  });
assert.deepEqual(christmasEveEarlyCloseCalendar.timestamps, [
  '2026-12-24T14:30:00.000Z',
  '2026-12-24T15:30:00.000Z',
  '2026-12-24T16:30:00.000Z',
  '2026-12-28T14:30:00.000Z',
]);

const saturdayNewYearCalendar =
  forecastCalendar.nextUsMarketBarTimestamps({
    afterTimestamp: '2027-12-30T19:30:00.000Z',
    count: 1,
  });
assert.deepEqual(
  saturdayNewYearCalendar.timestamps,
  ['2027-12-31T14:30:00.000Z'],
);

const springDstCalendar = forecastCalendar.nextUsMarketBarTimestamps({
  afterTimestamp: '2026-03-06T20:30:00.000Z',
  count: 1,
});
assert.deepEqual(
  springDstCalendar.timestamps,
  ['2026-03-09T13:30:00.000Z'],
);

const fallDstCalendar = forecastCalendar.nextUsMarketBarTimestamps({
  afterTimestamp: '2026-10-30T19:30:00.000Z',
  count: 1,
});
assert.deepEqual(
  fallDstCalendar.timestamps,
  ['2026-11-02T14:30:00.000Z'],
);

assert.throws(
  () =>
    forecastCalendar.nextUsMarketBarTimestamps({
      afterTimestamp: '2026-07-17T19:30:00.000Z',
      count: 24,
      timezone: 'America/Chicago',
    }),
  (error) => error?.code === 'MARKET_CALENDAR_FAILED',
);

const forecastNowMs = Date.parse('2026-07-25T20:00:00.000Z');
const forecastNowSeconds = Math.floor(forecastNowMs / 1000);
const forecastHistoryTimes = Array.from(
  { length: 361 },
  (_, index) => forecastNowSeconds - (360 - index) * 60 * 60 - 30 * 60,
);
const forecastHistoryChart = {
  meta: {
    exchangeName: 'NYSEArca',
    exchangeTimezoneName: 'America/New_York',
    marketState: 'REGULAR',
  },
  timestamp: forecastHistoryTimes,
  indicators: {
    quote: [{
      open: forecastHistoryTimes.map((_, index) => 500 + index * 0.1),
      high: forecastHistoryTimes.map((_, index) => 502 + index * 0.1),
      low: forecastHistoryTimes.map((_, index) => 499 + index * 0.1),
      close: forecastHistoryTimes.map((_, index) => 501 + index * 0.1),
      volume: forecastHistoryTimes.map((_, index) => 1_000_000 + index),
    }],
  },
};
let forecastFetcherCalls = 0;
const forecastHistory = await forecastData.getForecastHistory(
  { ...validForecastRequest, symbol: 'SPY' },
  {
    now: () => forecastNowMs,
    fetchChart: async (symbol, range, interval, ttlMs) => {
      forecastFetcherCalls += 1;
      assert.equal(symbol, 'SPY');
      assert.equal(range, '3mo');
      assert.equal(interval, '60m');
      assert.equal(ttlMs, 60_000);
      return forecastHistoryChart;
    },
  },
);
assert.equal(forecastFetcherCalls, 1);
assert.equal(forecastHistory.candles.length, 360);
assert.equal(
  forecastHistory.candles.at(-1).timestamp,
  new Date(forecastHistoryTimes.at(-2) * 1000).toISOString(),
);
assert.equal(forecastHistory.interval, '1h');
assert.equal(forecastHistory.assetType, 'etf');
assert.equal(forecastHistory.exchange, 'NYSEArca');
assert.equal(forecastHistory.timezone, 'America/New_York');
assert.equal(forecastHistory.source.provider, 'yahoo-chart-v8');
assert.equal(forecastHistory.source.isSample, false);
assert.equal(forecastHistory.adjusted, false);
assert.equal(forecastHistory.adjustmentMethod, 'unadjusted-yahoo-chart');
const firstForecastCandle = forecastHistory.candles[0];
assert.equal(
  firstForecastCandle.amount,
  firstForecastCandle.volume *
    ((firstForecastCandle.high + firstForecastCandle.low + firstForecastCandle.close) / 3),
);

const missingMarketStateChart = structuredClone(forecastHistoryChart);
delete missingMarketStateChart.meta.marketState;
const missingMarketStateHistory = await forecastData.getForecastHistory(
  { ...validForecastRequest, symbol: 'SPY' },
  {
    now: () => forecastNowMs,
    provider: async () => ({
      source: 'live',
      provider: 'test-missing-market-state',
      chart: missingMarketStateChart,
    }),
  },
);
assert.equal(missingMarketStateHistory.candles.length, 360);
assert.equal(
  missingMarketStateHistory.candles.at(-1).timestamp,
  new Date(forecastHistoryTimes.at(-2) * 1000).toISOString(),
);

const sessionCloseChart = structuredClone(forecastHistoryChart);
sessionCloseChart.meta.currentTradingPeriod = {
  regular: {
    start: forecastNowSeconds - 6.5 * 60 * 60,
    end: forecastNowSeconds,
  },
};
const sessionCloseHistory = await forecastData.getForecastHistory(
  { ...validForecastRequest, symbol: 'SPY' },
  {
    now: () => forecastNowMs,
    provider: async () => ({
      source: 'live',
      provider: 'test-session-close',
      chart: sessionCloseChart,
    }),
  },
);
assert.equal(
  sessionCloseHistory.candles.at(-1).timestamp,
  new Date(forecastHistoryTimes.at(-1) * 1000).toISOString(),
);

async function expectForecastHistoryFailure(chart, code, now = forecastNowMs) {
  await assert.rejects(
    forecastData.getForecastHistory(
      { ...validForecastRequest, symbol: 'SPY' },
      {
        now: () => now,
        provider: async () => ({
          source: 'live',
          provider: 'test-live-provider',
          chart,
        }),
      },
    ),
    (error) => error?.code === code && error.message.length > 20,
  );
}

const duplicateForecastChart = structuredClone(forecastHistoryChart);
duplicateForecastChart.timestamp[120] = duplicateForecastChart.timestamp[119];
await expectForecastHistoryFailure(duplicateForecastChart, 'INVALID_CANDLES');

const unorderedForecastChart = structuredClone(forecastHistoryChart);
unorderedForecastChart.timestamp[120] = unorderedForecastChart.timestamp[119] - 60;
await expectForecastHistoryFailure(unorderedForecastChart, 'INVALID_CANDLES');

const nonFiniteForecastChart = structuredClone(forecastHistoryChart);
nonFiniteForecastChart.indicators.quote[0].open[100] = Number.NaN;
await expectForecastHistoryFailure(nonFiniteForecastChart, 'INVALID_CANDLES');

const nonPositiveForecastChart = structuredClone(forecastHistoryChart);
nonPositiveForecastChart.indicators.quote[0].close[100] = 0;
await expectForecastHistoryFailure(nonPositiveForecastChart, 'INVALID_CANDLES');

const malformedForecastChart = structuredClone(forecastHistoryChart);
malformedForecastChart.indicators.quote[0].high[100] =
  malformedForecastChart.indicators.quote[0].close[100] - 1;
await expectForecastHistoryFailure(malformedForecastChart, 'INVALID_CANDLES');

const negativeVolumeForecastChart = structuredClone(forecastHistoryChart);
negativeVolumeForecastChart.indicators.quote[0].volume[100] = -1;
await expectForecastHistoryFailure(negativeVolumeForecastChart, 'INVALID_CANDLES');

const insufficientForecastChart = structuredClone(forecastHistoryChart);
insufficientForecastChart.meta.marketState = 'CLOSED';
insufficientForecastChart.timestamp =
  insufficientForecastChart.timestamp.slice(-299);
for (const key of ['open', 'high', 'low', 'close', 'volume']) {
  insufficientForecastChart.indicators.quote[0][key] =
    insufficientForecastChart.indicators.quote[0][key].slice(-299);
}
await expectForecastHistoryFailure(
  insufficientForecastChart,
  'INSUFFICIENT_HISTORY',
);

const staleForecastChart = structuredClone(forecastHistoryChart);
staleForecastChart.meta.marketState = 'CLOSED';
staleForecastChart.timestamp = staleForecastChart.timestamp.map(
  (time) => time - 5 * 24 * 60 * 60,
);
await expectForecastHistoryFailure(staleForecastChart, 'STALE_MARKET_DATA');

const sessionStaleForecastChart = structuredClone(forecastHistoryChart);
sessionStaleForecastChart.timestamp =
  sessionStaleForecastChart.timestamp.map((time) => time - 2 * 24 * 60 * 60);
sessionStaleForecastChart.meta.currentTradingPeriod = {
  regular: {
    start: forecastNowSeconds - 6 * 60 * 60,
    end: forecastNowSeconds + 30 * 60,
  },
};
await expectForecastHistoryFailure(
  sessionStaleForecastChart,
  'STALE_MARKET_DATA',
);

const adjustedForecastChart = structuredClone(forecastHistoryChart);
adjustedForecastChart.indicators.adjclose = [{
  adjclose: adjustedForecastChart.indicators.quote[0].close.map(
    (close) => close * 0.5,
  ),
}];
const adjustedForecastHistory = await forecastData.getForecastHistory(
  { ...validForecastRequest, symbol: 'SPY' },
  {
    now: () => forecastNowMs,
    provider: async () => ({
      source: 'live',
      provider: 'test-adjusted-provider',
      chart: adjustedForecastChart,
    }),
  },
);
assert.equal(adjustedForecastHistory.adjusted, true);
assert.equal(
  adjustedForecastHistory.adjustmentMethod,
  'yahoo-adjusted-close-factor',
);
assert.equal(
  adjustedForecastHistory.candles[0].open,
  adjustedForecastChart.indicators.quote[0].open[0] * 0.5,
);
assert.equal(
  adjustedForecastHistory.candles[0].high,
  adjustedForecastChart.indicators.quote[0].high[0] * 0.5,
);
assert.equal(
  adjustedForecastHistory.candles[0].low,
  adjustedForecastChart.indicators.quote[0].low[0] * 0.5,
);
assert.equal(
  adjustedForecastHistory.candles[0].close,
  adjustedForecastChart.indicators.adjclose[0].adjclose[0],
);

const inconsistentAdjustmentChart = structuredClone(adjustedForecastChart);
inconsistentAdjustmentChart.indicators.adjclose[0].adjclose[100] = null;
await expectForecastHistoryFailure(
  inconsistentAdjustmentChart,
  'INVALID_CANDLES',
);

const missingVolumeForecastChart = structuredClone(forecastHistoryChart);
missingVolumeForecastChart.indicators.quote[0].volume[0] = null;
const missingVolumeHistory = await forecastData.getForecastHistory(
  { ...validForecastRequest, symbol: 'SPY' },
  {
    now: () => forecastNowMs,
    provider: async () => ({
      source: 'live',
      provider: 'test-volume-fallback',
      chart: missingVolumeForecastChart,
    }),
  },
);
assert.equal(missingVolumeHistory.candles[0].volume, 0);
assert.equal(missingVolumeHistory.candles[0].amount, 0);

await assert.rejects(
  forecastData.getForecastHistory({ ...validForecastRequest, symbol: 'SPY' }, {
    now: () => forecastNowMs,
    provider: async () => ({
      source: 'sample',
      provider: 'bundled-sample',
      chart: forecastHistoryChart,
    }),
  }),
  (error) =>
    error?.code === 'SAMPLE_DATA_NOT_ALLOWED' &&
    /SAMPLE data cannot be used/.test(error.message),
);
let failedForecastFetchCalls = 0;
await assert.rejects(
  forecastData.getForecastHistory(
    { ...validForecastRequest, symbol: 'SPY' },
    {
      now: () => forecastNowMs,
      fetchChart: async () => {
        failedForecastFetchCalls += 1;
        throw new Error('offline');
      },
    },
  ),
  (error) =>
    error?.code === 'MARKET_DATA_UNAVAILABLE' &&
    /offline/.test(error.message),
);
assert.equal(failedForecastFetchCalls, 1);

const pythonExecutable =
  process.env.QUANT_TEST_PYTHON ||
  process.env.QUANT_FORECAST_PYTHON ||
  'python3';
const workerScriptPath = path.join(root, 'forecast-engine', 'worker.py');
execFileSync(
  pythonExecutable,
  [
    '-m',
    'unittest',
    'discover',
    '-s',
    path.join(root, 'forecast-engine', 'tests'),
    '-p',
    'test_*.py',
  ],
  {
    cwd: root,
    stdio: 'pipe',
  },
);

const workerPayload = {
  symbol: 'SPY',
  paths: 30,
  predLen: 24,
  interval: '1h',
  temperature: 1,
  topP: 0.95,
  topK: 0,
  futureTimestamps: fridayCalendar.timestamps,
  candles: forecastHistory.candles,
};
assert.equal(
  forecastWorker.isForecastWorkerRequest({
    type: 'run',
    jobId: 'fc_worker_valid',
    payload: workerPayload,
  }),
  true,
);
assert.equal(
  forecastWorker.isForecastWorkerRequest({
    type: 'run',
    jobId: 'fc_worker_bad_timestamp',
    payload: {
      ...workerPayload,
      futureTimestamps: ['1', ...workerPayload.futureTimestamps.slice(1)],
    },
  }),
  false,
);
assert.equal(
  forecastWorker.isForecastWorkerRequest({
    type: 'run',
    jobId: 'fc_worker_bad_sampling',
    payload: {
      ...workerPayload,
      temperature: 0.5,
    },
  }),
  false,
);
assert.equal(
  forecastWorker.isForecastWorkerRequest({
    type: 'run',
    jobId: 'fc_worker_duplicate_future',
    payload: {
      ...workerPayload,
      futureTimestamps: [
        workerPayload.futureTimestamps[0],
        workerPayload.futureTimestamps[0],
        ...workerPayload.futureTimestamps.slice(2),
      ],
    },
  }),
  false,
);

const workerStderr = [];
const lazyWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  onStderr: (message) => workerStderr.push(message),
});
assert.equal(lazyWorker.isRunning, false);
const workerHealth = await lazyWorker.healthCheck();
assert.equal(workerHealth.type, 'health');
const workerPythonVersion = workerHealth.pythonVersion
  .split('.')
  .map((part) => Number.parseInt(part, 10));
assert.equal(
  workerHealth.ok,
  workerPythonVersion[0] === 3 &&
    workerPythonVersion[1] >= 10 &&
    workerPythonVersion[1] <= 12,
);
assert.equal(workerHealth.protocolVersion, 1);
assert.match(workerHealth.pythonVersion, /^\d+\.\d+\.\d+$/);
assert.equal(lazyWorker.isRunning, true);
assert.ok(workerStderr.some((line) => line.includes('worker shell starting')));
await lazyWorker.shutdown();
assert.equal(lazyWorker.isRunning, false);

const completedWorkerStderr = [];
const completedWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  activityTimeoutMs: 100,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  workerEnv: {
    QUANT_FORECAST_WORKER_TEST_MODE: '1',
    QUANT_FORECAST_WORKER_TEST_DELAY_MS: '5',
  },
  onStderr: (message) => completedWorkerStderr.push(message),
});
const workerProgress = [];
const workerCompleted = await completedWorker.run(
  'fc_worker_complete',
  workerPayload,
  (event) => workerProgress.push(event),
);
assert.equal(workerCompleted.result.completedPaths, 30);
assert.equal(workerCompleted.result.pathCount, 30);
assert.equal(workerCompleted.result.predictionBars, 24);
assert.equal(workerCompleted.result.paths.length, 30);
assert.equal(workerCompleted.result.closePaths.length, 30);
assert.equal(workerCompleted.result.pathSeeds.length, 30);
assert.equal(new Set(workerCompleted.result.pathSeeds).size, 30);
assert.equal(workerCompleted.result.baseSeed, 7000);
assert.equal(workerCompleted.result.pathSeeds.at(-1), 7029);
assert.equal(workerCompleted.result.provenance.baseSeed, 7000);
assert.equal(workerCompleted.result.provenance.pathSeeds.length, 30);
assert.equal(
  workerCompleted.result.lastHistoricalClose,
  workerPayload.candles.at(-1).close,
);
assert.equal(workerCompleted.result.aggregate.length, 24);
assert.equal(
  workerCompleted.result.aggregate[0].timestamp,
  workerPayload.futureTimestamps[0],
);
assert.deepEqual(
  workerCompleted.result.closePaths,
  workerCompleted.result.paths.map((pathCandles) =>
    pathCandles.map((candle) => candle.close)),
);
for (const [name, value] of Object.entries(workerCompleted.result.metrics)) {
  assert.equal(Number.isFinite(value), true, `${name} must be finite`);
}
assert.ok(workerCompleted.result.metrics.sampledUpsideFrequency >= 0);
assert.ok(workerCompleted.result.metrics.sampledUpsideFrequency <= 1);
assert.ok(workerCompleted.result.metrics.sampledDownsideFrequency >= 0);
assert.ok(workerCompleted.result.metrics.sampledDownsideFrequency <= 1);
assert.equal(
  Object.keys(workerCompleted.result.metrics).some((key) =>
    key.toLowerCase().includes('confidence')),
  false,
);
for (const point of workerCompleted.result.aggregate) {
  assert.ok(point.min <= point.p10);
  assert.ok(point.p10 <= point.p25);
  assert.ok(point.p25 <= point.p50);
  assert.ok(point.p50 <= point.p75);
  assert.ok(point.p75 <= point.p90);
  assert.ok(point.p90 <= point.max);
}
for (const pathCandles of workerCompleted.result.paths) {
  assert.equal(pathCandles.length, 24);
  assert.deepEqual(
    pathCandles.map((candle) => candle.timestamp),
    workerPayload.futureTimestamps,
  );
  for (const candle of pathCandles) {
    for (const field of ['open', 'high', 'low', 'close', 'volume', 'amount']) {
      assert.equal(Number.isFinite(candle[field]), true);
    }
    assert.ok(candle.open > 0);
    assert.ok(candle.close > 0);
    assert.ok(candle.high >= Math.max(candle.open, candle.close));
    assert.ok(candle.low <= Math.min(candle.open, candle.close));
    assert.ok(candle.low > 0);
    assert.ok(candle.volume >= 0);
    assert.ok(candle.amount >= 0);
  }
}
assert.deepEqual(
  JSON.parse(JSON.stringify(workerCompleted.result)),
  workerCompleted.result,
);
const workerPathProgress = workerProgress.filter(
  (event) => event.stage === 'running-paths',
);
const workerPostProgress = workerProgress.filter(
  (event) => event.stage === 'post-processing',
);
const workerPreparationProgress = workerProgress.filter(
  (event) => event.stage === 'preparing-engine',
);
assert.deepEqual(
  workerPreparationProgress.map((event) => [
    event.percent,
    event.preparationPhase,
    event.message,
  ]),
  [
    [3, 'preparing', 'Checking deterministic test engine'],
    [4, 'loading', 'Loading deterministic test engine'],
    [4, 'loading', 'Deterministic test engine ready'],
  ],
);
assert.equal(workerPathProgress.length, 31);
assert.equal(workerPathProgress[0].completedPaths, 0);
assert.equal(workerPathProgress[0].percent, 5);
assert.equal(workerPathProgress.at(-1).completedPaths, 30);
assert.equal(workerPathProgress.at(-1).percent, 95);
assert.deepEqual(
  workerPostProgress.map((event) => event.percent),
  [96, 97, 98],
);
const warmWorkerCompleted = await completedWorker.run(
  'fc_worker_warm_reuse',
  workerPayload,
);
assert.equal(warmWorkerCompleted.result.completedPaths, 30);
assert.equal(
  completedWorkerStderr.filter((line) =>
    line.includes('worker shell starting')).length,
  1,
);
await completedWorker.shutdown();

const idleWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 25,
});
await idleWorker.healthCheck();
assert.equal(idleWorker.isRunning, true);
await new Promise((resolve) => setTimeout(resolve, 100));
assert.equal(idleWorker.isRunning, false);

const shutdownRaceWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
});
await shutdownRaceWorker.healthCheck();
const inFlightShutdown = shutdownRaceWorker.shutdown();
const healthAfterShutdown = shutdownRaceWorker.healthCheck();
await inFlightShutdown;
assert.equal((await healthAfterShutdown).ok, true);
assert.equal(shutdownRaceWorker.isRunning, true);
await shutdownRaceWorker.shutdown();

const cancellationWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  activityTimeoutMs: 2_000,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  workerEnv: {
    QUANT_FORECAST_WORKER_TEST_MODE: '1',
    QUANT_FORECAST_WORKER_TEST_DELAY_MS: '20',
  },
});
let cancellationRequested = false;
const cancelledRun = cancellationWorker.run(
  'fc_worker_cancel',
  workerPayload,
  (event) => {
    if (event.completedPaths === 1 && !cancellationRequested) {
      cancellationRequested = true;
      void cancellationWorker.cancel('fc_worker_cancel');
    }
  },
);
await assert.rejects(
  cancelledRun,
  (error) => error?.code === 'JOB_CANCELLED',
);
assert.equal(cancellationRequested, true);
await cancellationWorker.shutdown();

const timeoutWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  activityTimeoutMs: 30,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  workerEnv: {
    QUANT_FORECAST_WORKER_TEST_MODE: '1',
    QUANT_FORECAST_WORKER_TEST_DELAY_MS: '200',
  },
});
await assert.rejects(
  timeoutWorker.run('fc_worker_timeout', workerPayload),
  (error) => error?.code === 'FORECAST_TIMEOUT',
);
assert.equal(timeoutWorker.isRunning, false);

const duplicateProgressWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  activityTimeoutMs: 40,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  workerEnv: {
    QUANT_FORECAST_WORKER_TEST_MODE: '1',
    QUANT_FORECAST_WORKER_TEST_DELAY_MS: '5',
    QUANT_FORECAST_WORKER_TEST_STALL_AFTER_PATH: '1',
  },
});
const acceptedDuplicateProgress = [];
await assert.rejects(
  duplicateProgressWorker.run(
    'fc_worker_duplicate_progress',
    workerPayload,
    (event) => acceptedDuplicateProgress.push(event),
  ),
  (error) => error?.code === 'FORECAST_TIMEOUT',
);
assert.equal(
  acceptedDuplicateProgress.filter(
    (event) => event.stage === 'running-paths',
  ).length,
  2,
);
assert.deepEqual(
  acceptedDuplicateProgress
    .filter((event) => event.stage === 'running-paths')
    .map((event) => event.completedPaths),
  [0, 1],
);
assert.equal(duplicateProgressWorker.isRunning, false);

const crashWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  activityTimeoutMs: 2_000,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  workerEnv: {
    QUANT_FORECAST_WORKER_TEST_MODE: '1',
    QUANT_FORECAST_WORKER_CRASH_ON_RUN: '1',
  },
});
await assert.rejects(
  crashWorker.run('fc_worker_crash', workerPayload),
  (error) => error?.code === 'WORKER_CRASHED',
);
assert.equal(crashWorker.isRunning, false);
const restartedHealth = await crashWorker.healthCheck();
assert.equal(restartedHealth.ok, true);
assert.equal(crashWorker.isRunning, true);
await crashWorker.shutdown();

const malformedWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable,
  startupTimeoutMs: 5_000,
  idleTimeoutMs: 60_000,
  workerEnv: {
    QUANT_FORECAST_WORKER_MALFORMED_ON_HEALTH: '1',
  },
});
await assert.rejects(
  malformedWorker.healthCheck(),
  (error) =>
    error?.code === 'WORKER_CRASHED' &&
    /malformed NDJSON/.test(error.message),
);
assert.equal(malformedWorker.isRunning, false);

const missingPythonWorker = new kronosWorker.KronosWorker({
  scriptPath: workerScriptPath,
  pythonExecutable: '/definitely/missing/quant-python',
  startupTimeoutMs: 1_000,
});
await assert.rejects(
  missingPythonWorker.healthCheck(),
  (error) => error?.code === 'PYTHON_NOT_AVAILABLE',
);
assert.equal(missingPythonWorker.isRunning, false);

function emitCompleteWorkerProgress(jobId, onProgress) {
  onProgress?.({
    type: 'progress',
    jobId,
    stage: 'preparing-engine',
    completedPaths: 0,
    totalPaths: 30,
    percent: 3,
    message: 'Preparing test engine',
  });
  for (let completedPaths = 1; completedPaths <= 30; completedPaths += 1) {
    onProgress?.({
      type: 'progress',
      jobId,
      stage: 'running-paths',
      completedPaths,
      totalPaths: 30,
      percent: forecast.forecastPercentForCompletedPaths(completedPaths),
      message: `Completed test path ${completedPaths} of 30`,
    });
  }
  for (const percent of [96, 97, 98]) {
    onProgress?.({
      type: 'progress',
      jobId,
      stage: 'post-processing',
      completedPaths: 30,
      totalPaths: 30,
      percent,
      message: `Test post-processing ${percent}`,
    });
  }
}

let productionPayload = null;
let productionRecord = null;
const productionOrder = [];
const productionWorker = {
  async run(jobId, payload, onProgress) {
    productionPayload = payload;
    emitCompleteWorkerProgress(jobId, onProgress);
    const result = structuredClone(workerCompleted.result);
    result.testMode = false;
    result.provenance.modelId = forecast.FORECAST_V1.modelId;
    result.provenance.tokenizerId = forecast.FORECAST_V1.tokenizerId;
    result.provenance.kronosCommit =
      forecast.FORECAST_V1.kronosCommit;
    result.aggregate.forEach((point, index) => {
      point.timestamp = payload.futureTimestamps[index];
    });
    return { type: 'completed', jobId, result };
  },
  async cancel() {
    assert.fail('Completed production worker should not be cancelled');
  },
};
const productionRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_production_complete',
  now: () => '2026-07-26T20:00:00.000Z',
  loadHistory: async () => forecastHistory,
  runner: forecastOrchestrator.createKronosForecastRunner(productionWorker, {
    now: () => '2026-07-26T20:00:00.000Z',
  }),
  saveRecord: (record) => {
    productionOrder.push('saved');
    productionRecord = record;
    return record;
  },
});
const productionFinished = new Promise((resolve) => {
  productionRegistry.subscribe((event) => {
    productionOrder.push(`${event.stage}:${event.percent}`);
    if (event.stage === 'completed' || event.stage === 'failed') resolve(event);
  });
});
assert.equal(productionRegistry.start(validForecastRequest).ok, true);
const productionCompletion = await productionFinished;
assert.equal(productionCompletion.stage, 'completed');
assert.equal(productionCompletion.percent, 100);
assert.equal(productionRecord.provenance.mode, 'production');
assert.equal(productionRecord.provenance.marketDataSource, 'yahoo-chart-v8');
assert.equal(productionRecord.closePaths.length, 30);
assert.equal(productionPayload.paths, 30);
assert.equal(productionPayload.predLen, 24);
assert.deepEqual(
  productionPayload.futureTimestamps,
  productionRecord.aggregate.map((point) => point.timestamp),
);
assert.ok(
  productionOrder.indexOf('persisting:99') <
    productionOrder.indexOf('saved'),
);
assert.ok(
  productionOrder.indexOf('saved') <
    productionOrder.indexOf('completed:100'),
);

let leakedTestModeSaveCalls = 0;
const leakedTestModeWorker = {
  async run(jobId, payload, onProgress) {
    emitCompleteWorkerProgress(jobId, onProgress);
    const result = structuredClone(workerCompleted.result);
    result.aggregate.forEach((point, index) => {
      point.timestamp = payload.futureTimestamps[index];
    });
    return { type: 'completed', jobId, result };
  },
  async cancel() {},
};
const leakedTestModeRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_reject_test_mode',
  now: () => '2026-07-26T20:00:00.000Z',
  loadHistory: async () => forecastHistory,
  runner: forecastOrchestrator.createKronosForecastRunner(
    leakedTestModeWorker,
  ),
  saveRecord: (record) => {
    leakedTestModeSaveCalls += 1;
    return record;
  },
});
const leakedTestModeFinished = new Promise((resolve) => {
  leakedTestModeRegistry.subscribe((event) => {
    if (event.stage === 'failed') resolve(event);
  });
});
leakedTestModeRegistry.start(validForecastRequest);
assert.equal(
  (await leakedTestModeFinished).errorCode,
  'OUTPUT_VALIDATION_FAILED',
);
assert.equal(leakedTestModeSaveCalls, 0);

let rejectOrchestrationRun;
let orchestrationCancelCalls = 0;
const blockingProductionWorker = {
  run(jobId, _payload, onProgress) {
    onProgress?.({
      type: 'progress',
      jobId,
      stage: 'preparing-engine',
      completedPaths: 0,
      totalPaths: 30,
      percent: 3,
      message: 'Loading test worker',
    });
    return new Promise((_resolve, reject) => {
      rejectOrchestrationRun = reject;
    });
  },
  async cancel(jobId) {
    orchestrationCancelCalls += 1;
    rejectOrchestrationRun(new Error(`Cancelled ${jobId}`));
  },
};
const blockingProductionRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_production_blocking',
  now: () => '2026-07-26T20:00:00.000Z',
  loadHistory: async () => forecastHistory,
  runner: forecastOrchestrator.createKronosForecastRunner(
    blockingProductionWorker,
  ),
});
const blockingStart = blockingProductionRegistry.start(validForecastRequest);
assert.equal(blockingStart.ok, true);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(
  blockingProductionRegistry.getJob('SPY')?.stage,
  'preparing-engine',
);
const productionBlockedStart = blockingProductionRegistry.start({
  ...validForecastRequest,
  symbol: 'QQQ',
});
assert.equal(productionBlockedStart.ok, false);
assert.equal(productionBlockedStart.activeSymbol, 'SPY');
assert.equal(
  blockingProductionRegistry.cancel(blockingStart.job.jobId).ok,
  true,
);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(orchestrationCancelCalls, 1);
assert.equal(
  blockingProductionRegistry.getJob('SPY')?.stage,
  'cancelled',
);

let resolvePendingHistory;
let pendingHistoryWorkerRuns = 0;
const pendingHistoryWorker = {
  async run() {
    pendingHistoryWorkerRuns += 1;
    throw new Error('Cancelled preflight must not start the worker');
  },
  async cancel() {},
};
const pendingHistoryRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_pending_history_cancel',
  now: () => '2026-07-26T20:00:00.000Z',
  loadHistory: () =>
    new Promise((resolve) => {
      resolvePendingHistory = resolve;
    }),
  runner: forecastOrchestrator.createKronosForecastRunner(
    pendingHistoryWorker,
  ),
});
const pendingHistoryStart = pendingHistoryRegistry.start(validForecastRequest);
assert.equal(pendingHistoryStart.ok, true);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(
  pendingHistoryRegistry.cancel(pendingHistoryStart.job.jobId).ok,
  true,
);
resolvePendingHistory(forecastHistory);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(pendingHistoryWorkerRuns, 0);
assert.equal(
  pendingHistoryRegistry.getJob('SPY')?.stage,
  'cancelled',
);

let invalidProductionSaveCalls = 0;
const invalidProductionWorker = {
  async run(jobId, payload, onProgress) {
    emitCompleteWorkerProgress(jobId, onProgress);
    const result = structuredClone(workerCompleted.result);
    result.testMode = false;
    result.provenance.modelId = forecast.FORECAST_V1.modelId;
    result.provenance.tokenizerId = forecast.FORECAST_V1.tokenizerId;
    result.provenance.kronosCommit =
      '0000000000000000000000000000000000000000';
    result.aggregate.forEach((point, index) => {
      point.timestamp = payload.futureTimestamps[index];
    });
    return { type: 'completed', jobId, result };
  },
  async cancel() {},
};
const invalidProductionRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_production_invalid',
  now: () => '2026-07-26T20:00:00.000Z',
  loadHistory: async () => forecastHistory,
  runner: forecastOrchestrator.createKronosForecastRunner(
    invalidProductionWorker,
    { now: () => '2026-07-26T20:00:00.000Z' },
  ),
  saveRecord: (record) => {
    invalidProductionSaveCalls += 1;
    return record;
  },
});
const invalidProductionFinished = new Promise((resolve) => {
  invalidProductionRegistry.subscribe((event) => {
    if (event.stage === 'failed') resolve(event);
  });
});
invalidProductionRegistry.start(validForecastRequest);
const invalidProductionFailure = await invalidProductionFinished;
assert.equal(invalidProductionFailure.errorCode, 'OUTPUT_VALIDATION_FAILED');
assert.equal(invalidProductionSaveCalls, 0);

const timedOutProductionWorker = {
  async run() {
    const error = new Error('Test worker activity timed out');
    error.name = 'WorkerClientFailure';
    error.code = 'FORECAST_TIMEOUT';
    throw error;
  },
  async cancel() {},
};
const timedOutDiagnostics = [];
const timedOutProductionRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_production_timeout',
  now: () => '2026-07-26T20:00:00.000Z',
  loadHistory: async () => forecastHistory,
  runner: forecastOrchestrator.createKronosForecastRunner(
    timedOutProductionWorker,
    {
      onDiagnostic: (message) => timedOutDiagnostics.push(message),
    },
  ),
});
const timedOutProductionFinished = new Promise((resolve) => {
  timedOutProductionRegistry.subscribe((event) => {
    if (event.stage === 'failed') resolve(event);
  });
});
timedOutProductionRegistry.start(validForecastRequest);
const timedOutProductionFailure = await timedOutProductionFinished;
assert.equal(timedOutProductionFailure.errorCode, 'FORECAST_TIMEOUT');
assert.equal(
  timedOutProductionFailure.message,
  'The local forecast worker stopped responding.',
);
assert.equal(
  timedOutProductionFailure.message.includes('Test worker activity'),
  false,
);
assert.match(timedOutDiagnostics[0], /Test worker activity timed out/);

assert.equal(
  forecastRegistry.cleanForecastRunRequest(validForecastRequest)?.symbol,
  'SPY',
);
assert.equal(
  forecastRegistry.cleanForecastRunRequest({
    ...validForecastRequest,
    symbol: '../SPY',
  }),
  null,
);
assert.equal(
  forecastRegistry.cleanForecastRunRequest({
    ...validForecastRequest,
    paths: 29,
  }),
  null,
);
assert.equal(
  forecastRegistry.cleanForecastRunRequest({
    ...validForecastRequest,
    requestedAt: 'not-a-date',
  }),
  null,
);

let lazyHistoryCalls = 0;
let lazyRunnerHistory = null;
let lazyRunnerCalendar = null;
let resolveLazyRunner;
const lazyRunnerCalled = new Promise((resolve) => {
  resolveLazyRunner = resolve;
});
const lazyHistoryRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_lazy_history',
  now: () => '2026-07-25T20:00:00.000Z',
  loadHistory: async () => {
    lazyHistoryCalls += 1;
    return forecastHistory;
  },
  runner: async (context) => {
    lazyRunnerHistory = context.history;
    lazyRunnerCalendar = context.calendar;
    context.report({
      stage: 'preparing-engine',
      percent: 5,
      completedPaths: 0,
      message: 'History received',
    });
    resolveLazyRunner();
    return null;
  },
});
assert.equal(lazyHistoryCalls, 0);
const lazyHistoryStart = lazyHistoryRegistry.start(validForecastRequest);
assert.equal(lazyHistoryStart.ok, true);
assert.equal(lazyHistoryCalls, 0);
await lazyRunnerCalled;
assert.equal(lazyHistoryCalls, 1);
assert.equal(lazyRunnerHistory.candles.length, 360);
assert.equal(lazyRunnerHistory.source.isSample, false);
assert.equal(lazyRunnerCalendar.timestamps.length, 24);
assert.equal(lazyRunnerCalendar.assumptions.timezone, 'America/New_York');

let calendarFailureRunnerCalls = 0;
let resolveCalendarFailure;
const calendarFailureFinished = new Promise((resolve) => {
  resolveCalendarFailure = resolve;
});
const calendarFailureRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_calendar_failure',
  now: () => '2026-07-25T20:00:00.000Z',
  loadHistory: async () => ({
    ...forecastHistory,
    timezone: 'America/Chicago',
  }),
  runner: async () => {
    calendarFailureRunnerCalls += 1;
    return null;
  },
});
calendarFailureRegistry.subscribe((event) => {
  if (event.stage === 'failed') resolveCalendarFailure(event);
});
calendarFailureRegistry.start(validForecastRequest);
const calendarFailure = await calendarFailureFinished;
assert.equal(calendarFailure.errorCode, 'MARKET_CALENDAR_FAILED');
assert.equal(calendarFailureRunnerCalls, 0);

let releaseControlledRunner;
let controlledReport;
const controlledRunnerGate = new Promise((resolve) => {
  releaseControlledRunner = resolve;
});
let controlledId = 0;
const controlledRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => `fc_controlled_${++controlledId}`,
  now: () => '2026-07-25T20:00:00.000Z',
  runner: async (context) => {
    controlledReport = context.report;
    context.report({
      stage: 'preparing-engine',
      percent: 5,
      completedPaths: 0,
      message: 'Controlled runner ready',
    });
    await controlledRunnerGate;
  },
});
const controlledEvents = [];
const unsubscribeControlled = controlledRegistry.subscribe((event) => {
  controlledEvents.push(event);
});
assert.deepEqual(controlledRegistry.start({ symbol: 'SPY' }), {
  ok: false,
  code: 'INVALID_FORECAST_REQUEST',
  message: 'Forecast request is invalid.',
});
const controlledStart = controlledRegistry.start(validForecastRequest);
assert.equal(controlledStart.ok, true);
assert.equal(controlledEvents.length, 1);
const blockedStart = controlledRegistry.start({
  ...validForecastRequest,
  symbol: 'QQQ',
});
assert.equal(blockedStart.ok, false);
assert.equal(blockedStart.code, 'FORECAST_ALREADY_RUNNING');
assert.equal(blockedStart.activeSymbol, 'SPY');
assert.equal(controlledRegistry.getJob('spy')?.jobId, controlledStart.job.jobId);
await Promise.resolve();
assert.equal(controlledRegistry.getJob('SPY')?.stage, 'preparing-engine');
const eventCountBeforeUnsubscribe = controlledEvents.length;
unsubscribeControlled();
controlledReport({
  stage: 'running-paths',
  percent: 8,
  completedPaths: 1,
  message: 'Controlled path 1',
});
assert.equal(controlledEvents.length, eventCountBeforeUnsubscribe);
const cancelled = controlledRegistry.cancel(controlledStart.job.jobId);
assert.equal(cancelled.ok, true);
assert.equal(cancelled.job.stage, 'cancelled');
assert.equal(controlledRegistry.getJob('SPY')?.stage, 'cancelled');
assert.equal(controlledRegistry.cancel(controlledStart.job.jobId).ok, false);
const blockedDuringCancellation = controlledRegistry.start({
  ...validForecastRequest,
  symbol: 'QQQ',
});
assert.equal(blockedDuringCancellation.ok, false);
assert.equal(blockedDuringCancellation.code, 'FORECAST_ALREADY_RUNNING');
releaseControlledRunner();
await new Promise((resolve) => setImmediate(resolve));
const startAfterCancellation = controlledRegistry.start({
  ...validForecastRequest,
  symbol: 'QQQ',
});
assert.equal(startAfterCancellation.ok, true);

const mockEvents = [];
let finishMock;
const mockFinished = new Promise((resolve) => {
  finishMock = resolve;
});
const mockRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_mock',
  now: () => '2026-07-25T20:00:00.000Z',
});
mockRegistry.subscribe((event) => {
  mockEvents.push(event);
  if (event.stage === 'failed') finishMock(event);
});
const mockStart = mockRegistry.start(validForecastRequest);
assert.equal(mockStart.ok, true);
const mockFailure = await mockFinished;
assert.equal(mockFailure.errorCode, 'PERSISTENCE_FAILED');
assert.equal(mockFailure.percent, 99);
assert.equal(mockFailure.completedPaths, 30);
assert.equal(mockEvents.some((event) => event.percent === 100), false);
assert.equal(
  mockEvents.filter((event) => event.stage === 'running-paths').length,
  30,
);

let finishInvalidProgress;
const invalidProgressFinished = new Promise((resolve) => {
  finishInvalidProgress = resolve;
});
const invalidProgressRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_invalid_progress',
  now: () => '2026-07-25T20:00:00.000Z',
  runner: async ({ report }) => {
    report({
      stage: 'preparing-engine',
      percent: 5,
      completedPaths: 0,
      message: 'Preparing invalid runner',
    });
    report({
      stage: 'running-paths',
      percent: 80,
      completedPaths: 1,
      message: 'Invalid progress',
    });
  },
});
invalidProgressRegistry.subscribe((event) => {
  if (event.stage === 'failed') finishInvalidProgress(event);
});
invalidProgressRegistry.start(validForecastRequest);
const invalidProgressFailure = await invalidProgressFinished;
assert.equal(invalidProgressFailure.errorCode, 'OUTPUT_VALIDATION_FAILED');
assert.match(invalidProgressFailure.message, /must match completed paths/);

let throwingListenerFinished;
const throwingListenerCompletion = new Promise((resolve) => {
  throwingListenerFinished = resolve;
});
const throwingListenerRegistry = new forecastRegistry.ForecastJobRegistry({
  createJobId: () => 'fc_throwing_listener',
  now: () => '2026-07-25T20:00:00.000Z',
});
throwingListenerRegistry.subscribe(() => {
  throw new Error('renderer reloaded');
});
throwingListenerRegistry.subscribe((event) => {
  if (event.stage === 'failed') throwingListenerFinished(event);
});
assert.doesNotThrow(() =>
  throwingListenerRegistry.start(validForecastRequest),
);
const throwingListenerFailure = await throwingListenerCompletion;
assert.equal(throwingListenerFailure.errorCode, 'PERSISTENCE_FAILED');
await new Promise((resolve) => setImmediate(resolve));
assert.equal(
  throwingListenerRegistry.start({
    ...validForecastRequest,
    symbol: 'QQQ',
  }).ok,
  true,
);

const ttlStart = '2026-07-25T20:00:00.000Z';
assert.equal(
  forecastStore.forecastExpiryFromGeneratedAt(ttlStart),
  '2026-08-01T20:00:00.000Z',
);
assert.throws(
  () => forecastStore.forecastExpiryFromGeneratedAt('not-a-date'),
  /Invalid forecast generatedAt/,
);

let forecastStoreNow = ttlStart;
const forecastStoreRoot = path.join(tmp, 'forecast-store-data');
const storeWarnings = [];
const durableStore = new forecastStore.ForecastStore(forecastStoreRoot, {
  now: () => forecastStoreNow,
  onWarning: (message) => storeWarnings.push(message),
});
assert.equal(durableStore.getOverlayEnabled('SPY'), false);
assert.equal(durableStore.setOverlayEnabled('spy', false), false);
assert.equal(durableStore.getOverlayEnabled('SPY'), false);
assert.equal(durableStore.setOverlayEnabled('../SPY', true), false);

async function runPersistedMock(jobId, request) {
  const registry = new forecastRegistry.ForecastJobRegistry({
    createJobId: () => jobId,
    now: () => forecastStoreNow,
    saveRecord: (record) => durableStore.save(record),
  });
  const finished = new Promise((resolve) => {
    registry.subscribe((event) => {
      if (event.stage === 'completed' || event.stage === 'failed') resolve(event);
    });
  });
  const started = registry.start(request);
  assert.equal(started.ok, true);
  return finished;
}

const firstPersisted = await runPersistedMock('fc_saved_one', validForecastRequest);
assert.equal(firstPersisted.stage, 'completed');
assert.equal(firstPersisted.percent, 100);
assert.equal(firstPersisted.forecastId, 'fc_saved_one');
assert.equal(durableStore.getOverlayEnabled('SPY'), true);
const firstSavedRecord = durableStore.get('fc_saved_one');
assert.equal(firstSavedRecord?.id, 'fc_saved_one');
assert.equal(firstSavedRecord?.provenance.mode, 'development-mock');
assert.equal(firstSavedRecord?.provenance.exchange, 'US');
assert.equal(
  firstSavedRecord?.provenance.exchangeTimezone,
  'America/New_York',
);
assert.equal(firstSavedRecord?.provenance.marketCalendar, 'US-equities-v1');
assert.equal(firstSavedRecord?.provenance.regularSession, '09:30-16:00');
assert.equal(
  firstSavedRecord?.aggregate[0].timestamp,
  '2026-07-27T13:30:00.000Z',
);
assert.equal(firstSavedRecord?.expiresAt, '2026-08-01T20:00:00.000Z');
assert.equal(firstSavedRecord?.closePaths.length, 30);
assert.equal(firstSavedRecord?.aggregate.length, 24);
const partialActual = [
  {
    timestamp: firstSavedRecord.aggregate[2].timestamp,
    close: firstSavedRecord.aggregate[2].p50,
  },
  {
    timestamp: '2026-07-26T13:30:00.000Z',
    close: 999,
  },
  {
    timestamp: firstSavedRecord.aggregate[0].timestamp,
    close: firstSavedRecord.aggregate[0].p50,
  },
];
const partialComparison = forecastEvaluator.evaluateForecast(
  firstSavedRecord,
  partialActual,
  '2026-07-27T17:00:00.000Z',
);
assert.equal(partialComparison.evaluation.status, 'partial');
assert.equal(partialComparison.evaluation.actualPointsAvailable, 2);
assert.deepEqual(
  partialComparison.actual.map((point) => point.timestamp),
  [
    firstSavedRecord.aggregate[0].timestamp,
    firstSavedRecord.aggregate[2].timestamp,
  ],
);
assert.equal(
  partialComparison.evaluation.medianAbsolutePercentageError,
  0,
);
assert.equal(partialComparison.evaluation.p10P90Coverage, 1);
const missingFinalComparison = forecastEvaluator.evaluateForecast(
  firstSavedRecord,
  firstSavedRecord.aggregate.slice(0, -1).map((point) => ({
    timestamp: point.timestamp,
    close: point.p50,
  })),
  firstSavedRecord.forecastEndAt,
);
assert.equal(missingFinalComparison.evaluation.status, 'partial');
assert.equal(missingFinalComparison.evaluation.actualPointsAvailable, 23);
assert.equal(
  missingFinalComparison.evaluation.actualFinalClose,
  undefined,
);
const maturedComparison = forecastEvaluator.evaluateForecast(
  firstSavedRecord,
  [...firstSavedRecord.aggregate].reverse().map((point) => ({
    timestamp: point.timestamp,
    close: point.p50,
  })),
  firstSavedRecord.forecastEndAt,
);
assert.equal(maturedComparison.evaluation.status, 'matured');
assert.equal(maturedComparison.evaluation.actualPointsAvailable, 24);
assert.equal(maturedComparison.evaluation.directionCorrect, true);
assert.equal(
  maturedComparison.evaluation.actualFinalClose,
  firstSavedRecord.aggregate.at(-1).p50,
);
assert.equal(
  maturedComparison.evaluation.medianAbsolutePercentageError,
  0,
);
assert.equal(maturedComparison.evaluation.p10P90Coverage, 1);
const nonzeroMetricActual = firstSavedRecord.aggregate.map(
  (point, index) => ({
    timestamp: point.timestamp,
    close: index === 0 ? point.p50 * 2 : point.p50,
  }),
);
const nonzeroMetricComparison = forecastEvaluator.evaluateForecast(
  firstSavedRecord,
  nonzeroMetricActual,
  firstSavedRecord.forecastEndAt,
);
assert.ok(
  Math.abs(
    nonzeroMetricComparison.evaluation.medianAbsolutePercentageError -
      0.5 / 24,
  ) < 1e-12,
);
assert.equal(
  nonzeroMetricComparison.evaluation.p10P90Coverage,
  23 / 24,
);
const oppositeDirectionRecord = structuredClone(firstSavedRecord);
const oppositeFinal = oppositeDirectionRecord.aggregate.at(-1);
oppositeFinal.p10 = oppositeDirectionRecord.lastHistoricalClose + 5;
oppositeFinal.p50 = oppositeDirectionRecord.lastHistoricalClose + 10;
oppositeFinal.p90 = oppositeDirectionRecord.lastHistoricalClose + 15;
const oppositeDirectionActual = oppositeDirectionRecord.aggregate.map(
  (point, index) => ({
    timestamp: point.timestamp,
    close:
      index === oppositeDirectionRecord.aggregate.length - 1
        ? oppositeDirectionRecord.lastHistoricalClose - 1
        : point.p50,
  }),
);
assert.equal(
  forecastEvaluator.evaluateForecast(
    oppositeDirectionRecord,
    oppositeDirectionActual,
    oppositeDirectionRecord.forecastEndAt,
  ).evaluation.directionCorrect,
  false,
);
const flatDirectionRecord = structuredClone(firstSavedRecord);
const flatFinal = flatDirectionRecord.aggregate.at(-1);
flatFinal.p10 = flatDirectionRecord.lastHistoricalClose - 1;
flatFinal.p50 = flatDirectionRecord.lastHistoricalClose;
flatFinal.p90 = flatDirectionRecord.lastHistoricalClose + 1;
const flatDirectionActual = flatDirectionRecord.aggregate.map((point) => ({
  timestamp: point.timestamp,
  close: point.p50,
}));
assert.equal(
  forecastEvaluator.evaluateForecast(
    flatDirectionRecord,
    flatDirectionActual,
    flatDirectionRecord.forecastEndAt,
  ).evaluation.directionCorrect,
  true,
);
const notStartedComparison = forecastEvaluator.evaluateForecast(
  firstSavedRecord,
  [],
  '2026-07-26T20:00:00.000Z',
);
assert.equal(notStartedComparison.evaluation.status, 'not-started');
assert.equal(
  forecastEvaluator.evaluateForecast(
    firstSavedRecord,
    [],
    new Date(
      Date.parse(firstSavedRecord.forecastStartAt) + 30 * 60 * 1000,
    ).toISOString(),
  ).evaluation.status,
  'not-started',
);
assert.equal(
  forecastEvaluator.evaluateForecast(
    firstSavedRecord,
    [],
    new Date(
      Date.parse(firstSavedRecord.forecastStartAt) + 60 * 60 * 1000,
    ).toISOString(),
  ).evaluation.status,
  'unavailable',
);
assert.equal(
  forecastEvaluator.hasCompatibleAdjustmentBasis(
    firstSavedRecord.provenance,
    {
      adjusted: firstSavedRecord.provenance.adjusted,
      adjustmentMethod:
        firstSavedRecord.provenance.adjustmentMethod,
    },
  ),
  true,
);
assert.equal(
  forecastEvaluator.hasCompatibleAdjustmentBasis(
    firstSavedRecord.provenance,
    { adjusted: false, adjustmentMethod: 'unadjusted-yahoo-chart' },
  ),
  false,
);
const adjustmentAnchor = {
  timestamp: firstSavedRecord.provenance.latestCompletedCandleAt,
  close: firstSavedRecord.lastHistoricalClose,
};
assert.equal(
  forecastEvaluator.hasCompatibleAdjustmentBasis(
    firstSavedRecord.provenance,
    {
      adjusted: firstSavedRecord.provenance.adjusted,
      adjustmentMethod:
        firstSavedRecord.provenance.adjustmentMethod,
      candles: [adjustmentAnchor],
    },
    adjustmentAnchor,
  ),
  true,
);
assert.equal(
  forecastEvaluator.hasCompatibleAdjustmentBasis(
    firstSavedRecord.provenance,
    {
      adjusted: firstSavedRecord.provenance.adjusted,
      adjustmentMethod:
        firstSavedRecord.provenance.adjustmentMethod,
      candles: [
        {
          ...adjustmentAnchor,
          close: adjustmentAnchor.close * 0.5,
        },
      ],
    },
    adjustmentAnchor,
  ),
  false,
);
assert.throws(
  () =>
    forecastEvaluator.evaluateForecast(
      firstSavedRecord,
      [partialActual[0], partialActual[0]],
      '2026-07-27T17:00:00.000Z',
    ),
  /duplicate timestamp/,
);
function recordWithoutEvaluation(record) {
  const copy = structuredClone(record);
  delete copy.evaluation;
  return copy;
}
const originalForecastPayload = recordWithoutEvaluation(firstSavedRecord);
const evaluatedRecord = durableStore.updateEvaluation(
  firstSavedRecord.id,
  partialComparison.evaluation,
);
assert.equal(evaluatedRecord?.evaluation.status, 'partial');
assert.deepEqual(
  recordWithoutEvaluation(evaluatedRecord),
  originalForecastPayload,
);
assert.equal(
  durableStore.get(firstSavedRecord.id)?.evaluation.status,
  'partial',
);
const newerPartialEvaluation = {
  ...partialComparison.evaluation,
  evaluatedAt: firstSavedRecord.forecastEndAt,
};
assert.equal(
  durableStore.updateEvaluation(
    firstSavedRecord.id,
    newerPartialEvaluation,
  )?.evaluation.status,
  'partial',
);
const richerPartialRecord = durableStore.updateEvaluation(
  firstSavedRecord.id,
  missingFinalComparison.evaluation,
);
assert.equal(richerPartialRecord?.evaluation.actualPointsAvailable, 23);
const lowEvidenceMatured = {
  ...maturedComparison.evaluation,
  actualPointsAvailable: 1,
};
const rejectedLowEvidenceMatured = durableStore.updateEvaluation(
  firstSavedRecord.id,
  lowEvidenceMatured,
);
assert.equal(rejectedLowEvidenceMatured?.evaluation.status, 'partial');
assert.equal(
  rejectedLowEvidenceMatured?.evaluation.actualPointsAvailable,
  23,
);
const earlierMaturedEvaluation = {
  ...maturedComparison.evaluation,
  evaluatedAt: new Date(
    Date.parse(firstSavedRecord.forecastEndAt) - 1,
  ).toISOString(),
};
const maturedRecord = durableStore.updateEvaluation(
  firstSavedRecord.id,
  earlierMaturedEvaluation,
);
assert.equal(maturedRecord?.evaluation.status, 'matured');
const stalePartialRecord = durableStore.updateEvaluation(
  firstSavedRecord.id,
  partialComparison.evaluation,
);
assert.equal(stalePartialRecord?.evaluation.status, 'matured');
assert.deepEqual(
  recordWithoutEvaluation(stalePartialRecord),
  originalForecastPayload,
);
const rollbackStoreRoot = path.join(tmp, 'forecast-store-overlay-rollback');
const rollbackStore = new forecastStore.ForecastStore(rollbackStoreRoot, {
  now: () => forecastStoreNow,
  maxRecordsPerSymbol: 1,
});
rollbackStore.save({
  ...firstSavedRecord,
  id: 'fc_overlay_existing',
});
rollbackStore.setOverlayEnabled('SPY', false);
const rollbackExistingBefore = rollbackStore.get('fc_overlay_existing');
const rollbackAtomicWrite = rollbackStore.atomicWrite.bind(rollbackStore);
rollbackStore.atomicWrite = (filePath, contents) => {
  if (filePath.endsWith('overlay-settings.json')) {
    throw new Error('simulated overlay preference failure');
  }
  return rollbackAtomicWrite(filePath, contents);
};
assert.throws(
  () =>
    rollbackStore.save({
      ...firstSavedRecord,
      id: 'fc_overlay_rollback',
    }),
  /simulated overlay preference failure/,
);
assert.equal(rollbackStore.get('fc_overlay_rollback'), null);
assert.equal(rollbackStore.getOverlayEnabled('SPY'), false);
assert.deepEqual(
  rollbackStore.get('fc_overlay_existing'),
  rollbackExistingBefore,
);
assert.deepEqual(
  rollbackStore.list('SPY').map((record) => record.id),
  ['fc_overlay_existing'],
);
const savedOverlay = forecastOverlayModel.buildForecastOverlayModel(firstSavedRecord);
assert.equal(savedOverlay?.median.length, 25);
assert.equal(savedOverlay?.band.length, 24);
assert.equal(
  savedOverlay?.forecastStart,
  Date.parse(firstSavedRecord.forecastStartAt) / 1000,
);
assert.equal(savedOverlay?.median[0].value, firstSavedRecord.lastHistoricalClose);
assert.equal(savedOverlay?.median[1].value, firstSavedRecord.aggregate[0].p50);
assert.equal(savedOverlay?.band[23].lower, firstSavedRecord.aggregate[23].p10);
assert.equal(savedOverlay?.band[23].upper, firstSavedRecord.aggregate[23].p90);
assert.equal(
  forecastOverlayModel.supportsProjectedMa20Interval('60m'),
  true,
);
assert.equal(
  forecastOverlayModel.supportsProjectedMa20Interval('1d'),
  true,
);
assert.equal(
  forecastOverlayModel.supportsProjectedMa20Interval('5m'),
  false,
);
const ma20Anchor = Date.parse('2026-07-24T20:00:00.000Z') / 1000;
const ma20Record = {
  ...firstSavedRecord,
  generatedAt: '2026-07-25T12:00:00.000Z',
  provenance: {
    ...firstSavedRecord.provenance,
    latestCompletedCandleAt: '2026-07-24T20:00:00.000Z',
  },
};
const hourlyMa20Candles = Array.from({ length: 25 }, (_, index) => {
  const close = 100 + index;
  return {
    time: ma20Anchor - (24 - index) * 3600,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1_000_000,
  };
});
const projectedHourlyMa20 =
  forecastOverlayModel.buildProjectedMa20(
    hourlyMa20Candles,
    ma20Record,
    '60m',
  );
assert.equal(projectedHourlyMa20?.length, 25);
assert.equal(projectedHourlyMa20?.[0].time, ma20Anchor);
assert.equal(projectedHourlyMa20?.[0].value, 114.5);
assert.ok(
  projectedHourlyMa20[1].time > projectedHourlyMa20[0].time,
);
const dailyMa20Candles = Array.from({ length: 25 }, (_, index) => {
  const close = 200 + index;
  return {
    time: ma20Anchor - (24 - index) * 86_400,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1_000_000,
  };
});
const projectedDailyMa20 =
  forecastOverlayModel.buildProjectedMa20(
    dailyMa20Candles,
    ma20Record,
    '1d',
  );
assert.ok(projectedDailyMa20.length >= 2);
assert.ok(projectedDailyMa20.length <= 6);
assert.equal(
  projectedDailyMa20[0].time,
  dailyMa20Candles[dailyMa20Candles.length - 1].time,
);
assert.equal(
  forecastOverlayModel.buildProjectedMa20(
    hourlyMa20Candles.slice(-19),
    ma20Record,
    '60m',
  ),
  null,
);
assert.equal(
  forecastOverlayModel.buildProjectedMa20(
    hourlyMa20Candles,
    ma20Record,
    '5m',
  ),
  null,
);
assert.equal(
  forecastOverlayModel.buildProjectedMa20(
    [
      ...hourlyMa20Candles,
      hourlyMa20Candles[hourlyMa20Candles.length - 1],
    ],
    ma20Record,
    '60m',
  ),
  null,
);
const observedCloseLine = forecastOverlayModel.buildObservedCloseLine(
  maturedComparison.actual,
);
assert.equal(observedCloseLine?.length, 24);
assert.equal(
  observedCloseLine?.[0].time,
  Date.parse(firstSavedRecord.aggregate[0].timestamp) / 1000,
);
assert.equal(
  observedCloseLine?.[0].value,
  firstSavedRecord.aggregate[0].p50,
);
assert.equal(
  forecastOverlayModel.buildObservedCloseLine([
    maturedComparison.actual[1],
    maturedComparison.actual[0],
  ]),
  null,
);
assert.equal(
  Object.prototype.hasOwnProperty.call(savedOverlay ?? {}, 'paths'),
  false,
);
assert.equal(
  forecastOverlayModel.buildForecastOverlayModel({
    ...firstSavedRecord,
    aggregate: firstSavedRecord.aggregate.slice(0, 23),
  }),
  null,
);
assert.equal(
  forecastOverlayModel.buildForecastOverlayModel({
    ...firstSavedRecord,
    aggregate: firstSavedRecord.aggregate.map((point, index) =>
      index === 0 ? { ...point, p10: point.p50 + 1 } : point
    ),
  }),
  null,
);
assert.equal(
  forecastOverlayModel.buildForecastOverlayModel({
    ...firstSavedRecord,
    aggregate: firstSavedRecord.aggregate.map((point, index) =>
      index === 1
        ? { ...point, timestamp: firstSavedRecord.aggregate[0].timestamp }
        : point
    ),
  }),
  null,
);
let primitiveUpdates = 0;
let primitiveDetaches = 0;
let primitiveRemovals = 0;
const primitiveTimeScale = {
  timeToCoordinate: (time) => Number(time),
  coordinateToLogical: (coordinate) => coordinate,
};
const primitiveChart = {
  timeScale: () => primitiveTimeScale,
  removeSeries: () => {
    primitiveRemovals += 1;
  },
};
const primitiveSeries = {
  priceToCoordinate: (price) => price,
  detachPrimitive: () => {
    primitiveDetaches += 1;
  },
};
const bandPrimitive = new forecastBandPrimitive.ForecastBandPrimitive(savedOverlay);
bandPrimitive.attached({
  chart: primitiveChart,
  series: primitiveSeries,
  requestUpdate: () => {
    primitiveUpdates += 1;
  },
});
assert.equal(primitiveUpdates, 1);
bandPrimitive.updateAllViews();
assert.equal(primitiveUpdates, 1);
assert.equal(bandPrimitive.screenPoints().length, 24);
assert.deepEqual(
  bandPrimitive.autoscaleInfo(
    savedOverlay.forecastStart,
    savedOverlay.band[23].time,
  )?.priceRange,
  {
    minValue: savedOverlay.minimum,
    maxValue: savedOverlay.maximum,
  },
);
assert.equal(bandPrimitive.autoscaleInfo(0, 1), null);
const disposeBandPrimitive =
  forecastBandPrimitive.createForecastOverlayDisposer(
    primitiveChart,
    primitiveSeries,
    bandPrimitive,
    () => true,
  );
disposeBandPrimitive();
disposeBandPrimitive();
assert.equal(primitiveDetaches, 1);
assert.equal(primitiveRemovals, 1);
bandPrimitive.detached();
assert.equal(bandPrimitive.screenPoints().length, 0);
const unorderedBandsRecord = structuredClone(firstSavedRecord);
unorderedBandsRecord.aggregate[0].p10 =
  unorderedBandsRecord.aggregate[0].min - 1;
assert.equal(forecastStore.isForecastRecord(unorderedBandsRecord), false);
const impossibleFrequenciesRecord = structuredClone(firstSavedRecord);
impossibleFrequenciesRecord.metrics.sampledUpsideFrequency = 0.75;
impossibleFrequenciesRecord.metrics.sampledDownsideFrequency = 0.75;
assert.equal(
  forecastStore.isForecastRecord(impossibleFrequenciesRecord),
  false,
);
const duplicateSeedRecord = structuredClone(firstSavedRecord);
duplicateSeedRecord.provenance.pathSeeds[1] =
  duplicateSeedRecord.provenance.pathSeeds[0];
assert.equal(forecastStore.isForecastRecord(duplicateSeedRecord), false);
const inconsistentRepairRecord = structuredClone(firstSavedRecord);
inconsistentRepairRecord.provenance.repairsApplied = true;
inconsistentRepairRecord.provenance.repairedValueCount = 0;
assert.equal(forecastStore.isForecastRecord(inconsistentRepairRecord), false);
const duplicateForecastRecord = structuredClone(firstSavedRecord);
duplicateForecastRecord.aggregate[1].timestamp =
  duplicateForecastRecord.aggregate[0].timestamp;
assert.equal(forecastStore.isForecastRecord(duplicateForecastRecord), false);
const overnightForecastRecord = structuredClone(firstSavedRecord);
overnightForecastRecord.aggregate[0].timestamp =
  '2026-07-27T12:30:00.000Z';
overnightForecastRecord.forecastStartAt =
  overnightForecastRecord.aggregate[0].timestamp;
assert.equal(forecastStore.isForecastRecord(overnightForecastRecord), false);
assert.equal(
  forecastStore.isForecastRecord({
    ...firstSavedRecord,
    forecastStartAt: firstSavedRecord.aggregate[1].timestamp,
  }),
  false,
);
assert.equal(
  forecastStore.isForecastRecord({
    ...firstSavedRecord,
    provenance: {
      ...firstSavedRecord.provenance,
      exchangeTimezone: 'America/Chicago',
    },
  }),
  false,
);
assert.equal(
  forecastStore.isForecastRecord({
    ...firstSavedRecord,
    expiresAt: '2030-01-01T00:00:00.000Z',
  }),
  false,
);
assert.deepEqual(
  durableStore.list('SPY').map((record) => record.id),
  ['fc_saved_one'],
);
assert.throws(
  () => durableStore.save(firstSavedRecord),
  /already exists/,
);

forecastStoreNow = '2026-07-25T21:00:00.000Z';
assert.equal(durableStore.setOverlayEnabled('SPY', false), false);
const secondPersisted = await runPersistedMock('fc_saved_two', {
  ...validForecastRequest,
  requestedAt: forecastStoreNow,
});
assert.equal(secondPersisted.stage, 'completed');
assert.equal(durableStore.getOverlayEnabled('SPY'), true);
assert.deepEqual(
  durableStore.list('SPY').map((record) => record.id),
  ['fc_saved_two', 'fc_saved_one'],
);

const reloadedStore = new forecastStore.ForecastStore(forecastStoreRoot, {
  now: () => forecastStoreNow,
});
assert.equal(reloadedStore.getOverlayEnabled('SPY'), true);
const reopenedSummaries = reloadedStore.list('SPY');
assert.deepEqual(
  reopenedSummaries.map((record) => record.id),
  ['fc_saved_two', 'fc_saved_one'],
);
assert.equal(
  forecastHistoryModel.chooseSavedForecastId(
    [...reopenedSummaries].reverse(),
    undefined,
    Date.parse(forecastStoreNow),
  ),
  'fc_saved_two',
);
assert.equal(
  forecastHistoryModel.chooseSavedForecastId(
    reopenedSummaries,
    'fc_saved_one',
    Date.parse(forecastStoreNow),
  ),
  'fc_saved_one',
);
const historyInput = [
  reopenedSummaries[1],
  {
    ...reopenedSummaries[0],
    id: 'fc_expired_history',
    expiresAt: forecastStoreNow,
  },
  reopenedSummaries[0],
];
const historyInputBefore = structuredClone(historyInput);
assert.deepEqual(
  forecastHistoryModel.orderUnexpiredForecasts(
    historyInput,
    Date.parse(forecastStoreNow),
  ).map((record) => record.id),
  ['fc_saved_two', 'fc_saved_one'],
);
assert.deepEqual(historyInput, historyInputBefore);
assert.equal(
  forecastHistoryModel.chooseSavedForecastId(
    historyInput,
    'fc_expired_history',
    Date.parse(forecastStoreNow),
  ),
  'fc_saved_two',
);
const immutableFirstSnapshot = reloadedStore.get('fc_saved_one');
const immutableFirstBefore = structuredClone(immutableFirstSnapshot);
immutableFirstSnapshot.aggregate[0].p50 += 100;
assert.deepEqual(
  reloadedStore.get('fc_saved_one'),
  immutableFirstBefore,
);
assert.equal(
  reloadedStore.get('fc_saved_two')?.id,
  'fc_saved_two',
);
const savedSymbolDir = path.join(forecastStoreRoot, 'symbols', 'SPY');
assert.equal(
  readdirSync(savedSymbolDir).some((file) => file.includes('.tmp-')),
  false,
);
writeFileSync(
  path.join(savedSymbolDir, 'fc_interrupted.json.tmp-interrupted'),
  '{"partial":',
);
assert.equal(reloadedStore.list('SPY').length, 2);

forecastStoreNow = '2026-08-01T20:00:00.000Z';
assert.equal(reloadedStore.get('fc_saved_one'), null);
assert.deepEqual(
  reloadedStore.list('SPY').map((record) => record.id),
  ['fc_saved_two'],
);

const capFixture = reloadedStore.get('fc_saved_two');
const capRoot = path.join(tmp, 'forecast-store-cap');
let capNow = '2026-07-25T23:00:00.000Z';
const cappedStore = new forecastStore.ForecastStore(capRoot, {
  now: () => capNow,
  maxRecordsPerSymbol: 2,
});
for (let index = 1; index <= 3; index += 1) {
  const generatedAt = `2026-07-25T2${index - 1}:00:00.000Z`;
  cappedStore.save({
    ...capFixture,
    id: `fc_cap_${index}`,
    generatedAt,
    expiresAt: forecastStore.forecastExpiryFromGeneratedAt(generatedAt),
  });
}
assert.equal(
  readdirSync(path.join(capRoot, 'symbols', 'SPY')).filter((file) =>
    file.endsWith('.json')
  ).length,
  2,
);
assert.deepEqual(
  cappedStore.list('SPY').map((record) => record.id),
  ['fc_cap_3', 'fc_cap_2'],
);

const serializedFixtureBytes = Buffer.byteLength(
  JSON.stringify({
    ...capFixture,
    id: 'fc_size_1',
  }, null, 2),
  'utf8',
);
const sizeCapRoot = path.join(tmp, 'forecast-store-size-cap');
const sizeCappedStore = new forecastStore.ForecastStore(sizeCapRoot, {
  now: () => capNow,
  maxTotalBytes: Math.floor(serializedFixtureBytes * 1.5),
});
sizeCappedStore.save({
  ...capFixture,
  id: 'fc_size_1',
  generatedAt: '2026-07-25T21:00:00.000Z',
});
sizeCappedStore.save({
  ...capFixture,
  id: 'fc_size_2',
  generatedAt: '2026-07-25T22:00:00.000Z',
});
assert.equal(
  readdirSync(path.join(sizeCapRoot, 'symbols', 'SPY')).filter((file) =>
    file.endsWith('.json')
  ).length,
  1,
);
assert.deepEqual(
  sizeCappedStore.list('SPY').map((record) => record.id),
  ['fc_size_2'],
);
const retainedSize = statSync(
  path.join(sizeCapRoot, 'symbols', 'SPY', 'fc_size_2.json'),
).size;
assert.ok(retainedSize <= Math.floor(serializedFixtureBytes * 1.5));

const corruptRoot = path.join(tmp, 'forecast-store-corrupt');
const corruptSymbolDir = path.join(corruptRoot, 'symbols', 'SPY');
mkdirSync(corruptSymbolDir, { recursive: true });
writeFileSync(path.join(corruptRoot, 'index.json'), '{"broken":');
writeFileSync(path.join(corruptSymbolDir, 'fc_bad.json'), '{"bad":true}');
const corruptionWarnings = [];
const recoveredStore = new forecastStore.ForecastStore(corruptRoot, {
  now: () => capNow,
  onWarning: (message) => corruptionWarnings.push(message),
});
assert.deepEqual(recoveredStore.list('SPY'), []);
assert.ok(corruptionWarnings.some((warning) => warning.includes('index')));
assert.ok(corruptionWarnings.some((warning) => warning.includes('malformed forecast record')));
assert.equal(
  JSON.parse(readFileSync(path.join(corruptRoot, 'index.json'), 'utf8')).schemaVersion,
  1,
);
assert.equal(storeWarnings.length, 0);

const emptyForecastView = forecastViewModel.deriveForecastPanelView({
  loading: false,
  starting: false,
  unavailableReason: null,
  job: null,
  record: null,
});
assert.equal(emptyForecastView.buttonLabel, 'Run Forecast');
assert.equal(emptyForecastView.buttonDisabled, false);
assert.equal(
  forecastViewModel.isForecastOverlayControlLocked({
    overlaySaving: true,
    starting: false,
    job: null,
  }),
  true,
);
assert.equal(
  forecastViewModel.isForecastOverlayControlLocked({
    overlaySaving: false,
    starting: false,
    job: firstPathProgress,
  }),
  true,
);
assert.equal(
  forecastViewModel.isForecastOverlayControlLocked({
    overlaySaving: false,
    starting: false,
    job: {
      ...finalPathProgress,
      stage: 'completed',
      sequence: 40,
      percent: 100,
      forecastId: 'fc_saved_one',
    },
  }),
  false,
);
const unavailableForecastView = forecastViewModel.deriveForecastPanelView({
  loading: false,
  starting: false,
  unavailableReason: 'Bundled SAMPLE data cannot be used for a forecast.',
  job: null,
  record: null,
});
assert.equal(unavailableForecastView.buttonLabel, 'Forecast unavailable');
assert.equal(unavailableForecastView.buttonDisabled, true);
const runningForecastView = forecastViewModel.deriveForecastPanelView({
  loading: false,
  starting: false,
  unavailableReason: null,
  job: {
    ...firstPathProgress,
    completedPaths: 12,
    percent: 41,
    sequence: 15,
  },
  record: null,
});
assert.equal(runningForecastView.buttonLabel, 'Running 12/30 · 41%');
assert.equal(runningForecastView.showProgress, true);
assert.equal(runningForecastView.buttonDisabled, true);
const failedForecastView = forecastViewModel.deriveForecastPanelView({
  loading: false,
  starting: false,
  unavailableReason: null,
  job: {
    ...persistingProgress,
    stage: 'failed',
    sequence: 38,
    errorCode: 'PERSISTENCE_FAILED',
    message: 'Could not save forecast.',
  },
  record: null,
});
assert.equal(failedForecastView.buttonLabel, 'Rerun Forecast');
assert.equal(failedForecastView.buttonDisabled, false);
const downloadingForecastView = forecastViewModel.deriveForecastPanelView({
  loading: false,
  starting: false,
  unavailableReason: null,
  job: {
    ...baseForecastProgress,
    preparationPhase: 'downloading',
    percent: 4,
    message: 'Downloading Kronos-mini for first use',
  },
  record: null,
});
assert.equal(
  downloadingForecastView.buttonLabel,
  'Downloading Kronos-mini',
);
const downloadingPresentation =
  forecastViewModel.describeForecastProgress(
    downloadingForecastView.showProgress
      ? {
          ...baseForecastProgress,
          preparationPhase: 'downloading',
          percent: 4,
          message: 'Downloading Kronos-mini for first use',
        }
      : null,
    'Downloading Kronos-mini for first use',
  );
assert.match(downloadingPresentation.detail, /paths have not started/);
const loadingPresentation = forecastViewModel.describeForecastProgress(
  {
    ...baseForecastProgress,
    preparationPhase: 'loading',
    percent: 5,
    message: 'Loading Kronos-mini into memory',
  },
  'Loading Kronos-mini into memory',
);
assert.match(loadingPresentation.detail, /Loading the local model/);
const etaPathStart = {
  ...baseForecastProgress,
  stage: 'running-paths',
  sequence: 2,
  percent: 5,
  completedPaths: 0,
  updatedAt: '2026-07-28T12:00:00.000Z',
};
let etaState = forecastViewModel.updateForecastEta(
  forecastViewModel.createForecastEtaState(),
  etaPathStart,
  Date.parse(etaPathStart.updatedAt),
);
assert.equal(
  forecastViewModel.describeForecastEta(
    etaState,
    etaPathStart,
    Date.parse(etaPathStart.updatedAt),
  ),
  'Measuring the first path',
);
const etaFirstPath = {
  ...etaPathStart,
  sequence: 3,
  percent: 8,
  completedPaths: 1,
  updatedAt: '2026-07-28T12:00:10.000Z',
};
etaState = forecastViewModel.updateForecastEta(
  etaState,
  etaFirstPath,
  Date.parse(etaFirstPath.updatedAt),
);
assert.equal(
  forecastViewModel.describeForecastEta(
    etaState,
    etaFirstPath,
    Date.parse(etaFirstPath.updatedAt),
  ),
  'About 5 min remaining',
);
assert.equal(
  forecastViewModel.describeForecastEta(
    etaState,
    {
      ...etaFirstPath,
      stage: 'completed',
      sequence: 4,
      percent: 100,
      completedPaths: 30,
      forecastId: 'fc_eta_complete',
    },
    Date.parse(etaFirstPath.updatedAt),
  ),
  null,
);
const setupFailurePresentation =
  forecastViewModel.describeForecastFailure('ENGINE_SETUP_FAILED');
assert.equal(setupFailurePresentation.buttonLabel, 'Retry After Setup');
assert.equal(
  setupFailurePresentation.command,
  'npm run setup:forecast',
);
assert.equal(
  forecastViewModel.describeForecastFailure('MODEL_DOWNLOAD_FAILED')
    .buttonLabel,
  'Retry Download',
);
assert.equal(
  forecastViewModel.describeForecastFailure('FORECAST_TIMEOUT').buttonLabel,
  'Restart Forecast',
);
assert.equal(
  forecastViewModel.describeForecastFailure('STALE_MARKET_DATA').buttonLabel,
  'Retry Market Data',
);
const savedForecastView = forecastViewModel.deriveForecastPanelView({
  loading: false,
  starting: false,
  unavailableReason: null,
  job: null,
  record: firstSavedRecord,
});
assert.equal(savedForecastView.buttonLabel, 'Rerun Forecast');
assert.equal(
  forecastViewModel.shouldAcceptForecastEvent(
    firstPathProgress,
    { ...firstPathProgress, sequence: firstPathProgress.sequence + 1 },
    'SPY',
  ),
  true,
);
assert.equal(
  forecastViewModel.shouldAcceptForecastEvent(
    firstPathProgress,
    { ...firstPathProgress, sequence: firstPathProgress.sequence },
    'SPY',
  ),
  false,
);
assert.equal(
  forecastViewModel.shouldAcceptForecastEvent(
    firstPathProgress,
    { ...firstPathProgress, symbol: 'QQQ', sequence: 99 },
    'SPY',
  ),
  false,
);
assert.equal(forecastViewModel.formatForecastRatio(0.633), '63.3%');
assert.equal(forecastViewModel.formatForecastRatio(0.0042, true), '+0.4%');

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
