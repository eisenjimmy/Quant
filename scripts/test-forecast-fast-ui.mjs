import assert from 'node:assert/strict';
import { createFastForecastDriver } from './forecast-fast-ui-driver.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function waitFor(register, timeoutMs = 2_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Fast UI fixture timed out')),
      timeoutMs,
    );
    const unsubscribe = register((value) => {
      clearTimeout(timer);
      unsubscribe();
      resolve(value);
    });
  });
}

const storage = memoryStorage();
let clock = Date.parse('2026-07-26T20:00:00.000Z');
const driver = createFastForecastDriver({
  delayMs: 1,
  now: () => clock,
  storage,
});
assert.deepEqual(driver.constants, {
  pathCount: 3,
  predictionBars: 2,
});
const progress = [];
let persistedAt100 = false;
driver.api.onProgress((event) => {
  progress.push(event);
  if (event.stage === 'completed') {
    persistedAt100 = driver
      .snapshot()
      .records.some((record) => record.id === event.forecastId);
  }
});
const completed = waitFor(driver.api.onCompleted);
const start = await driver.api.run({ symbol: 'SPY' });
assert.equal(start.ok, true);
const completedEvent = await completed;
assert.equal(completedEvent.stage, 'completed');
assert.equal(completedEvent.percent, 100);
assert.equal(persistedAt100, true);
assert.equal(
  progress.findLast((event) => event.stage === 'running-paths')?.percent,
  95,
);
assert.deepEqual(
  progress
    .filter((event) => event.stage === 'running-paths')
    .map((event) => event.completedPaths),
  [0, 1, 2, 3],
);
assert.deepEqual(
  progress
    .filter((event) => event.stage === 'post-processing')
    .map((event) => event.percent),
  [98],
);
const saved = await driver.api.getSaved(completedEvent.forecastId);
assert.equal(saved.aggregate.length, 2);
assert.equal(saved.closePaths.length, 3);
assert.equal(saved.provenance.pathCount, 3);
assert.equal(
  driver.snapshot().records.some(
    (record) => record.id === completedEvent.forecastId,
  ),
  true,
);

const reopened = createFastForecastDriver({
  delayMs: 1,
  now: () => clock,
  storage,
});
assert.equal(
  (await reopened.api.getJob('SPY')).forecastId,
  completedEvent.forecastId,
);
assert.equal((await reopened.api.listSaved('SPY')).length, 1);
clock += 7 * 24 * 60 * 60 * 1000;
assert.deepEqual(await reopened.api.listSaved('SPY'), []);
assert.equal(await reopened.api.getSaved(completedEvent.forecastId), null);
assert.equal(
  await reopened.api.getHistoricalComparison(completedEvent.forecastId),
  null,
);
driver.dispose();
reopened.dispose();

const reloadStorage = memoryStorage();
const beforeReload = createFastForecastDriver({
  delayMs: 30,
  now: () => clock,
  storage: reloadStorage,
});
await beforeReload.api.run({ symbol: 'QQQ' });
await new Promise((resolve) => setTimeout(resolve, 40));
assert.notEqual((await beforeReload.api.getJob('QQQ')).stage, 'completed');
beforeReload.dispose();
const afterReload = createFastForecastDriver({
  delayMs: 1,
  now: () => clock,
  storage: reloadStorage,
});
const reattachedCompletion = waitFor(afterReload.api.onCompleted);
assert.equal((await afterReload.api.getJob('QQQ')).symbol, 'QQQ');
assert.equal((await reattachedCompletion).stage, 'completed');
assert.equal((await afterReload.api.listSaved('QQQ')).length, 1);
afterReload.dispose();

const cancellationDriver = createFastForecastDriver({
  delayMs: 20,
  storage: memoryStorage(),
});
const cancellationStart = await cancellationDriver.api.run({ symbol: 'IWM' });
const cancellation = await cancellationDriver.api.cancel(
  cancellationStart.job.jobId,
);
assert.equal(cancellation.ok, true);
assert.equal(cancellation.job.stage, 'cancelled');
await new Promise((resolve) => setTimeout(resolve, 200));
assert.equal((await cancellationDriver.api.getJob('IWM')).stage, 'cancelled');
assert.deepEqual(await cancellationDriver.api.listSaved('IWM'), []);
cancellationDriver.dispose();

const crashDriver = createFastForecastDriver({
  crashOnce: true,
  delayMs: 1,
  storage: memoryStorage(),
});
const failed = waitFor(crashDriver.api.onFailed);
await crashDriver.api.run({ symbol: 'DIA' });
assert.equal((await failed).errorCode, 'WORKER_CRASHED');
const recovered = waitFor(crashDriver.api.onCompleted);
await crashDriver.api.run({ symbol: 'DIA' });
assert.equal((await recovered).stage, 'completed');
assert.equal((await crashDriver.api.listSaved('DIA')).length, 1);
crashDriver.dispose();

console.log('forecast fast UI tests ok');
