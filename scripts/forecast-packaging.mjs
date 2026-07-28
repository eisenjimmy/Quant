import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

export function forecastSidecarTarget(platform, arch) {
  if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return 'win32-x64';
  throw new Error(
    `Unsupported forecast sidecar target: ${platform}-${arch}. ` +
      'Supported targets are darwin-arm64 and win32-x64.',
  );
}

export function forecastSidecarExecutableName(platform) {
  return platform === 'win32'
    ? 'quant-forecast-worker.exe'
    : 'quant-forecast-worker';
}

export function forecastSidecarBundle(projectRoot, platform, arch) {
  return path.join(
    projectRoot,
    'sidecars',
    forecastSidecarTarget(platform, arch),
    'quant-forecast-worker',
  );
}

export function assertForecastSidecar(projectRoot, platform, arch) {
  const bundle = forecastSidecarBundle(projectRoot, platform, arch);
  const targetRoot = path.dirname(bundle);
  const executable = path.join(
    bundle,
    forecastSidecarExecutableName(platform),
  );
  if (!existsSync(executable) || !statSync(executable).isFile()) {
    throw new Error(
      `Forecast sidecar is missing for ${platform}-${arch}: ${executable}. ` +
        `Build it natively with "npm run build:forecast-sidecar -- --platform=${platform} --arch=${arch}".`,
    );
  }
  const licenses = path.join(targetRoot, 'third-party-licenses');
  if (
    !existsSync(path.join(licenses, 'README.md')) ||
    !existsSync(path.join(licenses, 'manifest.json'))
  ) {
    throw new Error(
      `Forecast runtime licenses are missing for ${platform}-${arch}: ${licenses}. ` +
        'Rebuild the native sidecar before packaging.',
    );
  }
  return { bundle, executable, licenses };
}

export function copyForecastReleaseResources({
  projectRoot,
  resourcesDir,
  platform,
  arch,
}) {
  const source = assertForecastSidecar(projectRoot, platform, arch);
  const sidecarRoot = path.join(resourcesDir, 'forecast-sidecar');
  const destination = path.join(sidecarRoot, 'quant-forecast-worker');
  rmSync(sidecarRoot, { recursive: true, force: true });
  mkdirSync(sidecarRoot, { recursive: true });
  cpSync(source.bundle, destination, {
    recursive: true,
    verbatimSymlinks: true,
  });
  const packagedExecutable = path.join(
    destination,
    forecastSidecarExecutableName(platform),
  );
  if (platform === 'darwin') chmodSync(packagedExecutable, 0o755);

  const noticesDir = path.join(resourcesDir, 'third-party');
  mkdirSync(noticesDir, { recursive: true });
  copyFileSync(
    path.join(projectRoot, 'THIRD_PARTY_NOTICES.md'),
    path.join(noticesDir, 'THIRD_PARTY_NOTICES.md'),
  );
  copyFileSync(
    path.join(projectRoot, 'vendor', 'Kronos', 'LICENSE'),
    path.join(noticesDir, 'Kronos-LICENSE.txt'),
  );
  const runtimeLicenses = path.join(noticesDir, 'forecast-runtime');
  rmSync(runtimeLicenses, { recursive: true, force: true });
  cpSync(source.licenses, runtimeLicenses, { recursive: true });
  return { destination, executable: packagedExecutable, noticesDir };
}
