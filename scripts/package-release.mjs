// Creates runnable Electron release folders without requiring electron-builder.
//
// Outputs:
//   release/Quant-mac-<arch>/Quant.app
//   release/Quant-win-x64/Quant.exe
//
// The script builds the app first, then packages the compiled dist/ payload into
// official Electron runtimes. macOS uses the local Electron runtime when the
// requested architecture matches the host install. Windows x64 is downloaded
// through @electron/get and extracted with extract-zip.

import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { downloadArtifact } from '@electron/get';
import extractZip from 'extract-zip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...parts) => path.join(root, ...parts);
const pkg = JSON.parse(readFileSync(r('package.json'), 'utf8'));
const electronPkg = JSON.parse(readFileSync(r('node_modules/electron/package.json'), 'utf8'));
const electronVersion = electronPkg.version;
const productName = pkg.productName ?? 'Quant';
const version = pkg.version ?? '0.0.0';

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value = 'true'] = arg.slice(2).split('=');
      return [key, value];
    }),
);

const requestedPlatforms = (args.get('platform') ?? 'darwin,win32')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const requestedArch = args.get('arch');

function log(message) {
  console.log(`[release] ${message}`);
}

function clearMacExtendedAttributes(targetPath) {
  if (process.platform !== 'darwin') return;
  try {
    execFileSync('xattr', ['-cr', targetPath], { stdio: 'ignore' });
  } catch {
    /* xattr is best effort; packaging can still succeed without it */
  }
}

function adHocSignMacApp(appPath) {
  if (process.platform !== 'darwin') return;
  try {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
      stdio: 'ignore',
    });
  } catch (err) {
    throw new Error(
      `macOS app was packaged but ad-hoc signing failed. Run codesign manually for ${appPath}.`,
      { cause: err },
    );
  }
}

function buildApp() {
  log('building dist payload');
  execFileSync(process.execPath, [r('scripts/build.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
}

function makeAppPayload(targetDir) {
  const appDir = path.join(targetDir, 'app');
  rmSync(appDir, { recursive: true, force: true });
  mkdirSync(appDir, { recursive: true });
  cpSync(r('dist'), path.join(appDir, 'dist'), { recursive: true });
  rmSync(path.join(appDir, 'dist', 'smoke.png'), { force: true });
  rmSync(path.join(appDir, 'dist', 'smoke-modal.png'), { force: true });
  writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify(
      {
        name: pkg.name,
        productName,
        version,
        description: pkg.description,
        main: pkg.main,
        author: pkg.author,
        license: pkg.license,
      },
      null,
      2,
    ) + '\n',
  );
  if (existsSync(r('LICENSE'))) copyFileSync(r('LICENSE'), path.join(appDir, 'LICENSE'));
  if (existsSync(r('AUTHORS.md'))) copyFileSync(r('AUTHORS.md'), path.join(appDir, 'AUTHORS.md'));
  return appDir;
}

function copyRuntimeNotice(targetDir) {
  const readme = [
    `${productName} ${version}`,
    '',
    'Run this folder in place. Do not move the executable without the adjacent resources folder.',
    '',
    'Local LLM support is optional. Without QUANT_LLM_ENABLED=1, Quant AI uses its deterministic fallback memo.',
    '',
    'Original code by David Wong, username DavidWProject.',
    '',
  ].join('\n');
  writeFileSync(path.join(targetDir, 'README.txt'), readme);
}

function createZipArchive(sourceDir, outPath) {
  rmSync(outPath, { force: true });
  execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', sourceDir, outPath], {
    cwd: path.dirname(sourceDir),
    stdio: 'inherit',
  });
  log(`archive written to ${path.relative(root, outPath)}`);
}

function updateMacPlist(appPath) {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  let plist = readFileSync(plistPath, 'utf8');
  plist = plist
    .replace(/<key>CFBundleName<\/key>\s*<string>[^<]+<\/string>/, `<key>CFBundleName</key>\n\t<string>${productName}</string>`)
    .replace(/<key>CFBundleDisplayName<\/key>\s*<string>[^<]+<\/string>/, `<key>CFBundleDisplayName</key>\n\t<string>${productName}</string>`)
    .replace(/<key>CFBundleIdentifier<\/key>\s*<string>[^<]+<\/string>/, '<key>CFBundleIdentifier</key>\n\t<string>com.quant.desktop</string>');
  if (!plist.includes('<key>CFBundleDisplayName</key>')) {
    plist = plist.replace(
      '</dict>',
      `\t<key>CFBundleDisplayName</key>\n\t<string>${productName}</string>\n</dict>`,
    );
  }
  writeFileSync(plistPath, plist);
}

async function resolveMacRuntime(targetArch) {
  const localRuntime = r('node_modules/electron/dist/Electron.app');
  if (existsSync(localRuntime)) return localRuntime;

  const cacheDir = r('.release-cache');
  mkdirSync(cacheDir, { recursive: true });
  log(`downloading Electron ${electronVersion} darwin-${targetArch}`);
  const zipPath = await downloadArtifact({
    version: electronVersion,
    platform: 'darwin',
    arch: targetArch,
    artifactName: 'electron',
    cacheRoot: cacheDir,
  });
  const extractDir = path.join(tmpdir(), `quant-electron-${electronVersion}-${targetArch}`);
  rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });
  await extractZip(zipPath, { dir: extractDir });
  const downloadedRuntime = path.join(extractDir, 'Electron.app');
  if (!existsSync(downloadedRuntime)) {
    throw new Error(`Downloaded Electron runtime did not contain Electron.app: ${zipPath}`);
  }
  return downloadedRuntime;
}

async function packageMac(arch) {
  const targetArch = arch ?? os.arch();
  if (process.platform !== 'darwin' || targetArch !== process.arch) {
    throw new Error(
      `macOS packaging uses the installed Electron runtime and must run on matching darwin/${targetArch}. Current host is ${process.platform}/${process.arch}.`,
    );
  }

  const runtimeApp = await resolveMacRuntime(targetArch);
  const targetDir = r('release', `${productName}-mac-${targetArch}`);
  const appPath = path.join(targetDir, `${productName}.app`);
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(runtimeApp, appPath, {
    recursive: true,
    verbatimSymlinks: true,
  });
  chmodSync(path.join(appPath, 'Contents', 'MacOS', 'Electron'), 0o755);
  updateMacPlist(appPath);

  const resourcesDir = path.join(appPath, 'Contents', 'Resources');
  rmSync(path.join(resourcesDir, 'default_app.asar'), { force: true });
  makeAppPayload(resourcesDir);
  clearMacExtendedAttributes(appPath);
  adHocSignMacApp(appPath);
  copyRuntimeNotice(targetDir);
  log(`macOS app written to ${path.relative(root, appPath)}`);
  createZipArchive(targetDir, r('release', `${productName}-mac-${targetArch}.zip`));
}

async function packageWindows(arch) {
  const targetArch = arch ?? 'x64';
  const targetDir = r('release', `${productName}-win-${targetArch}`);
  const cacheDir = r('.release-cache');
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  log(`downloading Electron ${electronVersion} win32-${targetArch}`);
  const zipPath = await downloadArtifact({
    version: electronVersion,
    platform: 'win32',
    arch: targetArch,
    artifactName: 'electron',
    cacheRoot: cacheDir,
  });

  await extractZip(zipPath, { dir: targetDir });
  const oldExe = path.join(targetDir, 'electron.exe');
  const newExe = path.join(targetDir, `${productName}.exe`);
  if (existsSync(oldExe)) renameSync(oldExe, newExe);

  const resourcesDir = path.join(targetDir, 'resources');
  makeAppPayload(resourcesDir);
  copyRuntimeNotice(targetDir);
  log(`Windows app written to ${path.relative(root, newExe)}`);
  createZipArchive(targetDir, r('release', `${productName}-win-${targetArch}.zip`));
}

buildApp();
rmSync(r('release'), {
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 150,
});

for (const platform of requestedPlatforms) {
  if (platform === 'darwin' || platform === 'mac') {
    await packageMac(requestedArch);
  } else if (platform === 'win32' || platform === 'win') {
    await packageWindows(requestedArch ?? 'x64');
  } else {
    throw new Error(`Unsupported release platform: ${platform}`);
  }
}

log('done');
