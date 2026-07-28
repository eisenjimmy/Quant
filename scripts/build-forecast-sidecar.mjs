import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertForecastSidecar,
  forecastSidecarTarget,
} from './forecast-packaging.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value = 'true'] = arg.slice(2).split('=');
      return [key, value];
    }),
);
const platform = args.get('platform') ?? process.platform;
const arch = args.get('arch') ?? process.arch;
const target = forecastSidecarTarget(platform, arch);
if (platform !== process.platform || arch !== process.arch) {
  throw new Error(
    `PyInstaller sidecars must be built on their target host. ` +
      `Requested ${platform}-${arch}; current host is ${process.platform}-${process.arch}.`,
  );
}

const defaultPython = path.join(
  root,
  '.forecast-venv',
  platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
);
const python = process.env.QUANT_FORECAST_PYTHON?.trim() || defaultPython;
if (!existsSync(python)) {
  throw new Error(
    `Forecast Python environment is missing: ${python}. Run "npm run setup:forecast" first.`,
  );
}
const runtime = JSON.parse(
  execFileSync(
    python,
    [
      '-c',
      [
        'import json, platform, struct, sys',
        'print(json.dumps({"platform":sys.platform,"machine":platform.machine().lower(),"bits":struct.calcsize("P")*8,"version":list(sys.version_info[:3])}))',
      ].join(';'),
    ],
    { encoding: 'utf8' },
  ),
);
const validMachine =
  (platform === 'darwin' && runtime.machine === 'arm64') ||
  (platform === 'win32' &&
    runtime.bits === 64 &&
    ['amd64', 'x86_64'].includes(runtime.machine));
if (
  runtime.platform !== platform ||
  !validMachine ||
  runtime.version[0] !== 3 ||
  runtime.version[1] < 10 ||
  runtime.version[1] > 12
) {
  throw new Error(
    `Forecast Python does not match ${target}: ${JSON.stringify(runtime)}.`,
  );
}
let pyinstallerVersion;
try {
  pyinstallerVersion = execFileSync(
    python,
    ['-m', 'PyInstaller', '--version'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
} catch {
  throw new Error(
    'PyInstaller is missing. Install it with ' +
      `"${python}" -m pip install -r forecast-engine/requirements-packaging.txt`,
  );
}
const expectedPyinstaller = readFileSync(
  path.join(root, 'forecast-engine', 'requirements-packaging.txt'),
  'utf8',
)
  .match(/^pyinstaller==([^\s]+)$/m)?.[1];
if (pyinstallerVersion !== expectedPyinstaller) {
  throw new Error(
    `PyInstaller ${expectedPyinstaller} is required; found ${pyinstallerVersion}.`,
  );
}

const outputRoot = path.join(root, 'sidecars', target);
const workRoot = path.join(root, 'build', 'quant-forecast-worker', target);
rmSync(outputRoot, { recursive: true, force: true });
rmSync(workRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
mkdirSync(workRoot, { recursive: true });
const data = (source, destination) =>
  `${path.join(root, source)}${path.delimiter}${destination}`;
const pyinstallerArgs = [
  '-m',
  'PyInstaller',
  '--noconfirm',
  '--clean',
  '--onedir',
  '--name',
  'quant-forecast-worker',
  '--distpath',
  outputRoot,
  '--workpath',
  path.join(workRoot, 'work'),
  '--specpath',
  path.join(workRoot, 'spec'),
  '--paths',
  path.join(root, 'vendor', 'Kronos'),
  '--hidden-import',
  'model',
  '--hidden-import',
  'model.kronos',
  '--hidden-import',
  'model.module',
  '--hidden-import',
  'safetensors',
  '--hidden-import',
  'safetensors.torch',
  '--copy-metadata',
  'safetensors',
  '--add-data',
  data('forecast-engine/model-manifest.json', '.'),
  '--add-data',
  data('vendor/KRONOS_COMMIT.txt', 'vendor'),
  '--add-data',
  data('vendor/KRONOS_SOURCE_MANIFEST.json', 'vendor'),
  '--add-data',
  data('vendor/Kronos/LICENSE', 'vendor/Kronos'),
  '--add-data',
  data('vendor/Kronos/model/__init__.py', 'vendor/Kronos/model'),
  '--add-data',
  data('vendor/Kronos/model/kronos.py', 'vendor/Kronos/model'),
  '--add-data',
  data('vendor/Kronos/model/module.py', 'vendor/Kronos/model'),
  path.join(root, 'forecast-engine', 'worker.py'),
];
console.log(`[forecast-sidecar] building ${target}`);
execFileSync(python, pyinstallerArgs, { cwd: root, stdio: 'inherit' });
execFileSync(
  python,
  [
    path.join(root, 'forecast-engine', 'collect_licenses.py'),
    path.join(outputRoot, 'third-party-licenses'),
  ],
  { cwd: root, stdio: 'inherit' },
);
const built = assertForecastSidecar(root, platform, arch);
if (platform === 'darwin') chmodSync(built.executable, 0o755);

async function healthCheck(executable) {
  await new Promise((resolve, reject) => {
    const child = spawn(executable, [], {
      cwd: path.dirname(executable),
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = '';
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Health check timed out.')), 30_000);
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!child.killed) child.kill();
      error ? reject(error) : resolve();
    };
    child.on('error', finish);
    child.on('close', (code) => {
      if (!settled) finish(new Error(`Sidecar exited during health check (${code}).`));
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      output += chunk;
      let newline = output.indexOf('\n');
      while (newline >= 0) {
        const line = output.slice(0, newline);
        output = output.slice(newline + 1);
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'ready') {
              child.stdin.write(
                `${JSON.stringify({ type: 'health', requestId: 'package-health' })}\n`,
              );
            }
            if (
              event.type === 'health' &&
              event.requestId === 'package-health' &&
              event.protocolVersion === 1
            ) {
              finish();
            }
          } catch {
            finish(new Error(`Sidecar emitted malformed NDJSON: ${line}`));
            return;
          }
        }
        newline = output.indexOf('\n');
      }
    });
  });
}

await healthCheck(built.executable);
console.log(`[forecast-sidecar] ready: ${path.relative(root, built.bundle)}`);
