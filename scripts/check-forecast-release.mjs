import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const localPython = path.join(
  root,
  '.forecast-venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
);
const python =
  process.env.QUANT_TEST_PYTHON ||
  process.env.QUANT_FORECAST_PYTHON ||
  (existsSync(localPython)
    ? localPython
    : process.platform === 'win32'
      ? 'python'
      : 'python3');
const checks = [
  {
    name: 'TypeScript',
    command: process.execPath,
    args: ['node_modules/typescript/bin/tsc', '--noEmit'],
  },
  {
    name: 'Quant integration',
    command: process.execPath,
    args: ['scripts/test-quant.mjs'],
    env: { QUANT_TEST_PYTHON: python },
  },
  {
    name: 'Fast UI resilience',
    command: process.execPath,
    args: ['scripts/test-forecast-fast-ui.mjs'],
  },
  {
    name: 'One-command startup',
    command: process.execPath,
    args: ['scripts/test-start-quant.mjs'],
  },
  {
    name: 'Python forecast engine',
    command: python,
    args: [
      '-m',
      'unittest',
      'discover',
      '-s',
      'forecast-engine/tests',
      '-p',
      'test_*.py',
    ],
  },
  {
    name: 'Forecast packaging',
    command: process.execPath,
    args: ['scripts/test-forecast-packaging.mjs'],
  },
  {
    name: 'Native forecast sidecar',
    command: process.execPath,
    args: ['scripts/test-forecast-native-sidecar.mjs'],
  },
  {
    name: 'Production build',
    command: process.execPath,
    args: ['scripts/build.mjs'],
  },
  {
    name: 'Built renderer harness',
    command: process.execPath,
    args: ['scripts/test-forecast-harness.mjs'],
  },
];

for (const check of checks) {
  console.log(`\n[forecast-release] ${check.name}`);
  const result = spawnSync(check.command, check.args, {
    cwd: root,
    env: { ...process.env, ...check.env },
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nforecast release checks ok');
