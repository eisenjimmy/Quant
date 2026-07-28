import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupForecast } from './setup-forecast.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');
const START_STATE_VERSION = 1;
const MIN_NODE_MAJOR = 20;

const nodeDependencyFiles = [
  'package.json',
  'package-lock.json',
];
const requiredNodePackages = [
  'electron',
  'esbuild',
  'typescript',
  'react',
  'react-dom',
];
const forecastDependencyFiles = [
  'forecast-engine/requirements.txt',
  'forecast-engine/model-manifest.json',
  'vendor/KRONOS_COMMIT.txt',
  'vendor/KRONOS_SOURCE_MANIFEST.json',
];

function run(command, args, {
  cwd = defaultRoot,
  env = process.env,
  label = command,
} = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}.`);
  }
  return result;
}

export function parseStartArguments(argv) {
  let refresh = false;
  let skipForecast = false;
  let dryRun = false;
  const appArguments = [];

  for (const argument of argv) {
    if (argument.toLowerCase() === 'quant') continue;
    if (argument === '--refresh') {
      refresh = true;
    } else if (argument === '--skip-forecast') {
      skipForecast = true;
    } else if (argument === '--dry-run') {
      dryRun = true;
    } else {
      appArguments.push(argument);
    }
  }

  return {
    refresh,
    skipForecast,
    dryRun,
    appArguments,
  };
}

export function isSupportedNodeVersion(version) {
  const major = Number.parseInt(String(version).split('.')[0], 10);
  return Number.isInteger(major) && major >= MIN_NODE_MAJOR;
}

function fingerprintFiles(root, relativePaths) {
  const hash = createHash('sha256');
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath)) return null;
    hash.update(relativePath);
    hash.update('\0');
    hash.update(readFileSync(absolutePath));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function statePath(root) {
  return path.join(root, '.local-bin', 'start-state.json');
}

export function readStartState(root = defaultRoot) {
  try {
    const value = JSON.parse(readFileSync(statePath(root), 'utf8'));
    if (
      value?.version !== START_STATE_VERSION ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return {};
    }
    return value;
  } catch {
    return {};
  }
}

function writeStartState(root, state) {
  const target = statePath(root);
  const temp = `${target}.tmp`;
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    temp,
    `${JSON.stringify({
      version: START_STATE_VERSION,
      ...state,
    }, null, 2)}\n`,
    'utf8',
  );
  renameSync(temp, target);
}

export function inspectNodeDependencies(root = defaultRoot, state = readStartState(root)) {
  const fingerprint = fingerprintFiles(root, nodeDependencyFiles);
  const packagesPresent = requiredNodePackages.every((packageName) =>
    existsSync(path.join(root, 'node_modules', packageName, 'package.json')));
  return {
    fingerprint,
    packagesPresent,
    ready:
      Boolean(fingerprint) &&
      packagesPresent &&
      state.nodeDependenciesFingerprint === fingerprint,
  };
}

function forecastPythonPath(root) {
  return process.platform === 'win32'
    ? path.join(root, '.forecast-venv', 'Scripts', 'python.exe')
    : path.join(root, '.forecast-venv', 'bin', 'python');
}

export function inspectForecastEnvironment(
  root = defaultRoot,
  state = readStartState(root),
) {
  const fingerprint = fingerprintFiles(root, forecastDependencyFiles);
  const pythonPath = forecastPythonPath(root);
  return {
    fingerprint,
    pythonPath,
    ready:
      Boolean(fingerprint) &&
      existsSync(pythonPath) &&
      state.forecastDependenciesFingerprint === fingerprint,
  };
}

export function createStartupPlan({
  root = defaultRoot,
  refresh = false,
  skipForecast = false,
} = {}) {
  const state = readStartState(root);
  const node = inspectNodeDependencies(root, state);
  const forecast = inspectForecastEnvironment(root, state);
  return {
    installNodeDependencies: refresh || !node.ready,
    setupForecast: !skipForecast && (refresh || !forecast.ready),
    skipForecast,
    node,
    forecast,
  };
}

function npmInvocation() {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && existsSync(npmExecPath)) {
    return {
      command: process.execPath,
      prefixArgs: [npmExecPath],
    };
  }
  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    prefixArgs: [],
  };
}

function ensureForecastSubmodule(root) {
  const modelInit = path.join(root, 'vendor', 'Kronos', 'model', '__init__.py');
  if (existsSync(modelInit)) return;
  console.log('[2/4] Initializing the pinned Kronos source...');
  run('git', ['submodule', 'update', '--init', '--recursive'], {
    cwd: root,
    label: 'Kronos submodule initialization',
  });
}

function launchElectron(root, appArguments) {
  const electronCli = path.join(root, 'node_modules', 'electron', 'cli.js');
  if (!existsSync(electronCli)) {
    throw new Error('Electron is missing after dependency installation.');
  }
  const environment = { ...process.env };
  delete environment.ELECTRON_RUN_AS_NODE;
  run(process.execPath, [electronCli, '.', ...appArguments], {
    cwd: root,
    env: environment,
    label: 'Quant',
  });
}

export function startQuant({
  root = defaultRoot,
  refresh = false,
  skipForecast = false,
  dryRun = false,
  appArguments = [],
} = {}) {
  if (!isSupportedNodeVersion(process.versions.node)) {
    throw new Error(
      `Quant requires Node.js ${MIN_NODE_MAJOR} or newer; found ${process.versions.node}.`,
    );
  }

  console.log(`Quant startup: Node ${process.versions.node}`);
  const plan = createStartupPlan({ root, refresh, skipForecast });
  if (dryRun) return plan;

  let state = readStartState(root);
  if (plan.installNodeDependencies) {
    console.log('[1/4] Installing or updating pinned Node dependencies...');
    const npm = npmInvocation();
    run(
      npm.command,
      [
        ...npm.prefixArgs,
        'install',
        '--no-audit',
        '--no-fund',
      ],
      {
        cwd: root,
        label: 'Node dependency installation',
      },
    );
    const installed = inspectNodeDependencies(root, {
      ...state,
      nodeDependenciesFingerprint: plan.node.fingerprint,
    });
    if (!installed.packagesPresent || !installed.fingerprint) {
      throw new Error('Node dependencies are incomplete after installation.');
    }
    state = {
      ...state,
      nodeDependenciesFingerprint: installed.fingerprint,
    };
    writeStartState(root, state);
  } else {
    console.log('[1/4] Node dependencies are ready.');
  }

  if (skipForecast) {
    console.log('[2/4] Forecast setup skipped by request.');
  } else if (plan.setupForecast) {
    try {
      ensureForecastSubmodule(root);
      console.log('[2/4] Preparing local forecast support...');
      setupForecast({ root });
      const prepared = inspectForecastEnvironment(root, {
        ...state,
        forecastDependenciesFingerprint:
          fingerprintFiles(root, forecastDependencyFiles),
      });
      if (!prepared.ready) {
        throw new Error('Forecast environment is incomplete after setup.');
      }
      state = {
        ...state,
        forecastDependenciesFingerprint: prepared.fingerprint,
      };
      writeStartState(root, state);
    } catch (error) {
      console.warn(
        `Forecast setup warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      console.warn(
        'Quant will still launch. Install Python 3.10–3.12 and rerun npm start to enable forecasts.',
      );
    }
  } else {
    console.log('[2/4] Forecast environment is ready.');
  }

  console.log('[3/4] Building Quant...');
  run(process.execPath, [path.join(root, 'scripts', 'build.mjs')], {
    cwd: root,
    label: 'Quant build',
  });

  console.log('[4/4] Launching Quant...');
  launchElectron(root, appArguments);
  return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    startQuant(parseStartArguments(process.argv.slice(2)));
  } catch (error) {
    console.error(
      `Quant startup failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
  }
}
