import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertForecastSidecar,
  copyForecastReleaseResources,
  forecastSidecarTarget,
} from './forecast-packaging.mjs';

const temp = mkdtempSync(path.join(os.tmpdir(), 'quant-packaging-'));
try {
  const sourceBundle = path.join(
    temp,
    'sidecars',
    'darwin-arm64',
    'quant-forecast-worker',
  );
  mkdirSync(path.join(sourceBundle, '_internal'), { recursive: true });
  writeFileSync(
    path.join(sourceBundle, 'quant-forecast-worker'),
    'sidecar',
  );
  writeFileSync(path.join(sourceBundle, '_internal', 'runtime'), 'runtime');
  const macLicenses = path.join(
    temp,
    'sidecars',
    'darwin-arm64',
    'third-party-licenses',
  );
  mkdirSync(macLicenses, { recursive: true });
  writeFileSync(path.join(macLicenses, 'README.md'), 'runtime notices');
  writeFileSync(path.join(macLicenses, 'manifest.json'), '{}');
  mkdirSync(path.join(temp, 'vendor', 'Kronos'), { recursive: true });
  writeFileSync(path.join(temp, 'THIRD_PARTY_NOTICES.md'), 'notices');
  writeFileSync(path.join(temp, 'vendor', 'Kronos', 'LICENSE'), 'license');

  assert.equal(forecastSidecarTarget('darwin', 'arm64'), 'darwin-arm64');
  assert.equal(forecastSidecarTarget('win32', 'x64'), 'win32-x64');
  assert.throws(
    () => forecastSidecarTarget('darwin', 'x64'),
    /Unsupported forecast sidecar target/,
  );
  assert.match(
    assertForecastSidecar(temp, 'darwin', 'arm64').executable,
    /quant-forecast-worker$/,
  );
  assert.throws(
    () => assertForecastSidecar(temp, 'win32', 'x64'),
    /Build it natively/,
  );

  const resourcesDir = path.join(temp, 'release', 'Resources');
  const copied = copyForecastReleaseResources({
    projectRoot: temp,
    resourcesDir,
    platform: 'darwin',
    arch: 'arm64',
  });
  assert.equal(readFileSync(copied.executable, 'utf8'), 'sidecar');
  assert.equal(
    readFileSync(path.join(copied.destination, '_internal', 'runtime'), 'utf8'),
    'runtime',
  );
  assert.equal(
    readFileSync(
      path.join(copied.noticesDir, 'THIRD_PARTY_NOTICES.md'),
      'utf8',
    ),
    'notices',
  );
  assert.equal(
    readFileSync(
      path.join(copied.noticesDir, 'Kronos-LICENSE.txt'),
      'utf8',
    ),
    'license',
  );
  assert.equal(
    readFileSync(
      path.join(
        copied.noticesDir,
        'forecast-runtime',
        'README.md',
      ),
      'utf8',
    ),
    'runtime notices',
  );
  assert.equal(
    existsSync(
      path.join(resourcesDir, 'forecast-sidecar', 'quant-forecast-worker'),
    ),
    true,
  );

  const windowsBundle = path.join(
    temp,
    'sidecars',
    'win32-x64',
    'quant-forecast-worker',
  );
  mkdirSync(windowsBundle, { recursive: true });
  writeFileSync(
    path.join(windowsBundle, 'quant-forecast-worker.exe'),
    'windows-sidecar',
  );
  const windowsLicenses = path.join(
    temp,
    'sidecars',
    'win32-x64',
    'third-party-licenses',
  );
  mkdirSync(windowsLicenses, { recursive: true });
  writeFileSync(
    path.join(windowsLicenses, 'README.md'),
    'windows runtime notices',
  );
  writeFileSync(path.join(windowsLicenses, 'manifest.json'), '{}');
  const windowsResources = path.join(temp, 'release', 'win-resources');
  const copiedWindows = copyForecastReleaseResources({
    projectRoot: temp,
    resourcesDir: windowsResources,
    platform: 'win32',
    arch: 'x64',
  });
  assert.equal(
    readFileSync(copiedWindows.executable, 'utf8'),
    'windows-sidecar',
  );
  assert.match(copiedWindows.executable, /quant-forecast-worker\.exe$/);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log('forecast packaging tests ok');
