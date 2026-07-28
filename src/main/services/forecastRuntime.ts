import fs from 'node:fs';
import path from 'node:path';

export type ForecastSidecarPlatform = 'darwin' | 'win32';

export function bundledForecastWorkerExecutable(
  resourcesPath: string,
  platform: NodeJS.Platform = process.platform,
): string {
  if (platform !== 'darwin' && platform !== 'win32') {
    throw new Error(`Forecast sidecar is unavailable on ${platform}.`);
  }
  return path.join(
    resourcesPath,
    'forecast-sidecar',
    'quant-forecast-worker',
    platform === 'win32' ? 'quant-forecast-worker.exe' : 'quant-forecast-worker',
  );
}

export function bundledForecastWorkerAvailable(
  resourcesPath: string,
  platform: NodeJS.Platform = process.platform,
  fileExists: (candidate: string) => boolean = fs.existsSync,
): boolean {
  try {
    return fileExists(
      bundledForecastWorkerExecutable(resourcesPath, platform),
    );
  } catch {
    return false;
  }
}
