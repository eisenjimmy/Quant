import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertForecastSidecar } from './forecast-packaging.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (
  !(
    (process.platform === 'darwin' && process.arch === 'arm64') ||
    (process.platform === 'win32' && process.arch === 'x64')
  )
) {
  throw new Error(
    `Native forecast release checks are unsupported on ${process.platform}-${process.arch}.`,
  );
}
const built = assertForecastSidecar(
  root,
  process.platform,
  process.arch,
);

function findFiles(directory, filename, found = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      findFiles(candidate, filename, found);
    } else if (entry.name === filename) {
      found.push(candidate);
    }
  }
  return found;
}

assert.deepEqual(findFiles(built.bundle, 'model.safetensors'), []);
const licenseManifest = JSON.parse(
  readFileSync(path.join(built.licenses, 'manifest.json'), 'utf8'),
);
const licensedPackages = new Set(
  licenseManifest.packages.map((entry) => entry.name.toLowerCase()),
);
for (const required of [
  'numpy',
  'pandas',
  'torch',
  'einops',
  'huggingface-hub',
  'matplotlib',
  'tqdm',
  'safetensors',
  'pyinstaller',
]) {
  assert.equal(licensedPackages.has(required), true);
}
if (process.platform === 'darwin') {
  const inspected = spawnSync('file', [built.executable], {
    encoding: 'utf8',
    shell: false,
  });
  assert.equal(inspected.status, 0);
  assert.match(inspected.stdout, /Mach-O 64-bit executable arm64/);
}

await new Promise((resolve, reject) => {
  const child = spawn(built.executable, [], {
    cwd: path.dirname(built.executable),
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let settled = false;
  const timer = setTimeout(
    () => finish(new Error('Native forecast sidecar health timed out.')),
    30_000,
  );
  const finish = (error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (!child.killed) child.kill();
    error ? reject(error) : resolve();
  };
  child.on('error', finish);
  child.on('close', (code) => {
    if (!settled) {
      finish(
        new Error(
          `Native sidecar exited before shutdown (${code}): ${stderr}`,
        ),
      );
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    let newline = stdout.indexOf('\n');
    while (newline >= 0) {
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (line) {
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          finish(new Error(`Native sidecar emitted malformed NDJSON: ${line}`));
          return;
        }
        if (event.type === 'ready') {
          child.stdin.write(
            `${JSON.stringify({
              type: 'health',
              requestId: 'native-health',
            })}\n`,
          );
        } else if (
          event.type === 'health' &&
          event.requestId === 'native-health'
        ) {
          assert.equal(event.ok, true);
          assert.equal(event.protocolVersion, 1);
          child.stdin.write(
            `${JSON.stringify({
              type: 'shutdown',
              requestId: 'native-shutdown',
            })}\n`,
          );
        } else if (
          event.type === 'shutdown' &&
          event.requestId === 'native-shutdown'
        ) {
          finish();
        }
      }
      newline = stdout.indexOf('\n');
    }
  });
});

console.log(
  `native forecast sidecar tests ok (${process.platform}-${process.arch})`,
);
