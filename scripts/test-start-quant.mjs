import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createStartupPlan,
  inspectForecastEnvironment,
  inspectNodeDependencies,
  isSupportedNodeVersion,
  parseStartArguments,
  startQuant,
} from './start-quant.mjs';

assert.equal(isSupportedNodeVersion('20.0.0'), true);
assert.equal(isSupportedNodeVersion('24.1.2'), true);
assert.equal(isSupportedNodeVersion('19.9.0'), false);
assert.equal(isSupportedNodeVersion('invalid'), false);

assert.deepEqual(parseStartArguments([]), {
  refresh: false,
  skipForecast: false,
  dryRun: false,
  appArguments: [],
});
assert.deepEqual(
  parseStartArguments([
    'quant',
    '--refresh',
    '--skip-forecast',
    '--smoke',
  ]),
  {
    refresh: true,
    skipForecast: true,
    dryRun: false,
    appArguments: ['--smoke'],
  },
);

const root = mkdtempSync(path.join(os.tmpdir(), 'quant-start-test-'));
try {
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'quant', version: '2.0.0' }),
  );
  writeFileSync(
    path.join(root, 'package-lock.json'),
    JSON.stringify({ name: 'quant', lockfileVersion: 3 }),
  );
  for (const packageName of [
    'electron',
    'esbuild',
    'typescript',
    'react',
    'react-dom',
  ]) {
    const packageRoot = path.join(root, 'node_modules', packageName);
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: packageName }),
    );
  }
  const forecastFiles = {
    'forecast-engine/requirements.txt': 'torch==2.3.1\n',
    'forecast-engine/model-manifest.json': '{"version":1}\n',
    'vendor/KRONOS_COMMIT.txt':
      '67b630e67f6a18c9e9be918d9b4337c960db1e9a\n',
    'vendor/KRONOS_SOURCE_MANIFEST.json': '{"version":1}\n',
  };
  for (const [relativePath, content] of Object.entries(forecastFiles)) {
    const absolutePath = path.join(root, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }
  const forecastPython = process.platform === 'win32'
    ? path.join(root, '.forecast-venv', 'Scripts', 'python.exe')
    : path.join(root, '.forecast-venv', 'bin', 'python');
  mkdirSync(path.dirname(forecastPython), { recursive: true });
  writeFileSync(forecastPython, '');

  const missingMarkerPlan = createStartupPlan({ root });
  assert.equal(missingMarkerPlan.installNodeDependencies, true);
  assert.equal(missingMarkerPlan.setupForecast, true);

  const nodeFingerprint = inspectNodeDependencies(root, {})
    .fingerprint;
  const forecastFingerprint = inspectForecastEnvironment(root, {})
    .fingerprint;
  mkdirSync(path.join(root, '.local-bin'), { recursive: true });
  writeFileSync(
    path.join(root, '.local-bin', 'start-state.json'),
    `${JSON.stringify({
      version: 1,
      nodeDependenciesFingerprint: nodeFingerprint,
      forecastDependenciesFingerprint: forecastFingerprint,
    })}\n`,
  );

  const readyPlan = createStartupPlan({ root });
  assert.equal(readyPlan.installNodeDependencies, false);
  assert.equal(readyPlan.setupForecast, false);
  assert.equal(readyPlan.node.ready, true);
  assert.equal(readyPlan.forecast.ready, true);

  const refreshedPlan = createStartupPlan({ root, refresh: true });
  assert.equal(refreshedPlan.installNodeDependencies, true);
  assert.equal(refreshedPlan.setupForecast, true);

  const skippedForecastPlan = createStartupPlan({
    root,
    skipForecast: true,
  });
  assert.equal(skippedForecastPlan.installNodeDependencies, false);
  assert.equal(skippedForecastPlan.setupForecast, false);
  assert.equal(skippedForecastPlan.skipForecast, true);

  writeFileSync(
    path.join(root, 'package-lock.json'),
    JSON.stringify({ name: 'quant', lockfileVersion: 3, changed: true }),
  );
  const changedLockPlan = createStartupPlan({ root });
  assert.equal(changedLockPlan.installNodeDependencies, true);
  assert.equal(changedLockPlan.setupForecast, false);

  const dryRunPlan = startQuant({
    root,
    dryRun: true,
    skipForecast: true,
  });
  assert.equal(dryRunPlan.installNodeDependencies, true);
  assert.equal(dryRunPlan.setupForecast, false);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log('Quant startup tests ok');
