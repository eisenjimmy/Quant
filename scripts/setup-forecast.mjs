import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');
const MIN_PYTHON = [3, 10];
const MAX_PYTHON = [3, 12];

function compareVersion(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function isSupportedPythonVersion(version) {
  const majorMinor = version.slice(0, 2);
  return (
    compareVersion(majorMinor, MIN_PYTHON) >= 0 &&
    compareVersion(majorMinor, MAX_PYTHON) <= 0
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: 'utf8',
    input: options.input,
    maxBuffer: 20 * 1024 * 1024,
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = options.capture
      ? (result.stderr || result.stdout || '').trim()
      : '';
    throw new Error(
      `${options.label ?? command} failed${detail ? `: ${detail}` : ''}`,
    );
  }
  return result;
}

function probePython(candidate) {
  const result = spawnSync(
    candidate.command,
    [
      ...candidate.prefixArgs,
      '-c',
      'import json,sys;print(json.dumps(list(sys.version_info[:3])))',
    ],
    { encoding: 'utf8', stdio: 'pipe' },
  );
  if (result.error || result.status !== 0) return null;
  try {
    const version = JSON.parse(result.stdout.trim());
    if (!Array.isArray(version) || version.some((part) => !Number.isInteger(part))) {
      return null;
    }
    return { ...candidate, version };
  } catch {
    return null;
  }
}

export function findForecastPython(explicitExecutable) {
  const candidates = explicitExecutable
    ? [{ command: explicitExecutable, prefixArgs: [] }]
    : process.platform === 'win32'
      ? [
          { command: 'py', prefixArgs: ['-3.12'] },
          { command: 'py', prefixArgs: ['-3.11'] },
          { command: 'py', prefixArgs: ['-3.10'] },
          { command: 'python', prefixArgs: [] },
        ]
      : [
          { command: 'python3.12', prefixArgs: [] },
          { command: 'python3.11', prefixArgs: [] },
          { command: 'python3.10', prefixArgs: [] },
          { command: 'python3', prefixArgs: [] },
        ];
  for (const candidate of candidates) {
    const detected = probePython(candidate);
    if (detected && isSupportedPythonVersion(detected.version)) return detected;
  }
  throw new Error(
    'Forecast setup requires Python 3.10 through 3.12. Install a supported Python or pass --python <path>.',
  );
}

export function inspectForecastSources(root = defaultRoot) {
  const requirementsPath = path.join(root, 'forecast-engine', 'requirements.txt');
  const commitPath = path.join(root, 'vendor', 'KRONOS_COMMIT.txt');
  const kronosRoot = path.join(root, 'vendor', 'Kronos');
  const modelInit = path.join(kronosRoot, 'model', '__init__.py');
  for (const requiredPath of [requirementsPath, commitPath, modelInit]) {
    if (!existsSync(requiredPath)) {
      throw new Error(
        `Missing ${path.relative(root, requiredPath)}. Run git submodule update --init --recursive.`,
      );
    }
  }
  const requirementLines = readFileSync(requirementsPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (
    requirementLines.length === 0 ||
    requirementLines.some(
      (line) => !/^[A-Za-z0-9_.-]+==[A-Za-z0-9_.+-]+$/.test(line),
    )
  ) {
    throw new Error('Forecast requirements must pin every direct dependency.');
  }
  const expectedCommit = readFileSync(commitPath, 'utf8').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(expectedCommit)) {
    throw new Error('vendor/KRONOS_COMMIT.txt is invalid.');
  }
  const actualCommit = run('git', ['-C', kronosRoot, 'rev-parse', 'HEAD'], {
    capture: true,
    label: 'Kronos commit check',
  }).stdout.trim().toLowerCase();
  if (actualCommit !== expectedCommit) {
    throw new Error(
      `Kronos submodule is ${actualCommit}; expected ${expectedCommit}. Run git submodule update --init --recursive.`,
    );
  }
  return {
    requirementsPath,
    requirementCount: requirementLines.length,
    commitPath,
    kronosRoot,
    kronosCommit: expectedCommit,
  };
}

function venvPythonPath(root) {
  return process.platform === 'win32'
    ? path.join(root, '.forecast-venv', 'Scripts', 'python.exe')
    : path.join(root, '.forecast-venv', 'bin', 'python');
}

function verifyWorkerHealth(pythonExecutable, root, sources) {
  const workerPath = path.join(root, 'forecast-engine', 'worker.py');
  const healthRequest = `${JSON.stringify({
    type: 'health',
    requestId: 'setup_health',
  })}\n${JSON.stringify({
    type: 'shutdown',
    requestId: 'setup_shutdown',
  })}\n`;
  const result = run(pythonExecutable, [workerPath], {
    cwd: path.dirname(workerPath),
    env: {
      ...process.env,
      QUANT_KRONOS_ROOT: sources.kronosRoot,
      QUANT_KRONOS_COMMIT_PATH: sources.commitPath,
    },
    input: healthRequest,
    capture: true,
    label: 'Forecast worker health check',
  });
  const events = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const health = events.find(
    (event) => event.type === 'health' && event.requestId === 'setup_health',
  );
  if (!health?.ok) {
    throw new Error('Forecast worker health check did not report ready.');
  }
}

export function setupForecast({
  root = defaultRoot,
  pythonExecutable,
  checkOnly = false,
} = {}) {
  const sources = inspectForecastSources(root);
  const python = findForecastPython(
    pythonExecutable || process.env.QUANT_FORECAST_BOOTSTRAP_PYTHON,
  );
  const versionText = python.version.join('.');
  console.log(`forecast setup: Python ${versionText}`);
  console.log(`forecast setup: Kronos ${sources.kronosCommit}`);
  console.log(`forecast setup: ${sources.requirementCount} pinned dependencies`);
  if (checkOnly) return;

  const venvRoot = path.join(root, '.forecast-venv');
  const venvPython = venvPythonPath(root);
  if (!existsSync(venvPython)) {
    run(
      python.command,
      [...python.prefixArgs, '-m', 'venv', venvRoot],
      { cwd: root, label: 'Virtual environment creation' },
    );
  }
  run(
    venvPython,
    ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', sources.requirementsPath],
    { cwd: root, label: 'Forecast dependency installation' },
  );
  run(
    venvPython,
    [path.join(root, 'forecast-engine', 'verify_setup.py')],
    {
      cwd: path.join(root, 'forecast-engine'),
      env: {
        ...process.env,
        QUANT_KRONOS_ROOT: sources.kronosRoot,
        QUANT_KRONOS_COMMIT_PATH: sources.commitPath,
      },
      label: 'Kronos import verification',
    },
  );
  verifyWorkerHealth(venvPython, root, sources);
  console.log(`forecast setup complete: ${venvPython}`);
}

function parseArguments(argv) {
  let pythonExecutable;
  let checkOnly = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      checkOnly = true;
    } else if (argument === '--python') {
      pythonExecutable = argv[index + 1];
      if (!pythonExecutable) throw new Error('--python requires an executable path.');
      index += 1;
    } else {
      throw new Error(`Unknown setup argument: ${argument}`);
    }
  }
  return { pythonExecutable, checkOnly };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    setupForecast(parseArguments(process.argv.slice(2)));
  } catch (error) {
    console.error(
      `forecast setup failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
  }
}
