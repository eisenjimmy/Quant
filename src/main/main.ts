// Electron main process: window lifecycle, security policy, IPC wiring for
// every channel in src/shared/ipc.ts, and the automated smoke-screenshot
// mode. Data handlers never reject — they validate inputs and fall back to
// deterministic sample payloads so the renderer never sees a rejected
// promise (addToWatchlist signals failure via { ok: false } instead).

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { IPC } from '../shared/ipc';
import type {
  AddWatchlistResult,
  ChartRange,
  HoldingsResult,
  LlmSettings,
  MacroOverlayKey,
  PivotPoint,
  QuantInsightRequest,
} from '../shared/types';
import { CHART_RANGES } from '../shared/types';
import { getChart } from './services/chart';
import { getEarnings } from './services/earnings';
import { getHoldings } from './services/holdings';
import { getLlmSettings, saveLlmSettings } from './services/llmSettings';
import { getMacroOverlay } from './services/macro';
import { getQuantInsights, saveQuantInsight } from './services/insightStore';
import { getNews } from './services/news';
import { getPivotNews } from './services/pivotNews';
import { analyzeQuant } from './services/quantAi';
import { getQuotes } from './services/quotes';
import { getValuation } from './services/valuation';
import { sampleChart, sampleEarnings, sampleNews, sampleQuote } from './services/sample';
import { searchSymbols } from './services/symbols';
import { clampInt, cleanSymbolList, normalizeSymbol, todayYmd } from './services/util';
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from './services/watchlistStore';

const MAX_QUOTE_SYMBOLS = 60;
const MAX_NEWS_SYMBOLS = 40;
const MAX_EARNINGS_SYMBOLS = 60;
const MAX_PIVOTS = 12;

// ---------------------------------------------------------------------------
// CLI flags (smoke mode)
// ---------------------------------------------------------------------------

const isSmoke = process.argv.includes('--smoke');
const forceOnboarding =
  process.argv.includes('--onboarding') || process.argv.includes('--smoke-onboarding');
const smokeModalArg = process.argv.find((arg) => arg.startsWith('--smoke-modal='));
const smokeModalSymbol = smokeModalArg
  ? normalizeSymbol(smokeModalArg.slice('--smoke-modal='.length))
  : null;

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

function cleanPivots(raw: unknown): PivotPoint[] {
  if (!Array.isArray(raw)) return [];
  const out: PivotPoint[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const p = entry as Partial<PivotPoint>;
    if (typeof p.time !== 'number' || !Number.isFinite(p.time)) continue;
    if (typeof p.price !== 'number' || !Number.isFinite(p.price)) continue;
    if (p.kind !== 'high' && p.kind !== 'low') continue;
    out.push({ time: p.time, price: p.price, kind: p.kind });
    if (out.length >= MAX_PIVOTS) break;
  }
  return out;
}

function cleanRange(raw: unknown): ChartRange {
  return CHART_RANGES.includes(raw as ChartRange) ? (raw as ChartRange) : '6m';
}

function cleanMacroOverlayKey(raw: unknown): MacroOverlayKey {
  return raw === 'jobs' ||
    raw === 'unemployment' ||
    raw === 'inflation' ||
    raw === 'treasury10y' ||
    raw === 'oil' ||
    raw === 'vix'
    ? raw
    : 'jobs';
}

function cleanQuantInsightRequest(raw: unknown): QuantInsightRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<QuantInsightRequest>;
  const symbol = normalizeSymbol(r.symbol);
  if (!symbol) return null;
  if (!r.evaluation || typeof r.evaluation !== 'object') return null;
  return {
    symbol,
    range: cleanRange(r.range),
    evaluation: r.evaluation as QuantInsightRequest['evaluation'],
    news: Array.isArray(r.news) ? r.news.slice(0, 12) : [],
    earnings: r.earnings && typeof r.earnings === 'object' ? r.earnings : null,
    valuation: r.valuation && typeof r.valuation === 'object' ? r.valuation : null,
    macroOverlays: Array.isArray(r.macroOverlays)
      ? r.macroOverlays.slice(0, 8).map((series) => ({
          ...series,
          points: Array.isArray(series.points) ? series.points.slice(-60) : [],
        }))
      : [],
    snapshotDataUrl: typeof r.snapshotDataUrl === 'string' ? r.snapshotDataUrl.slice(0, 1_000_000) : undefined,
    question: typeof r.question === 'string' ? r.question.slice(0, 1200) : undefined,
    thinkingMode: r.thinkingMode === true,
  };
}

// ---------------------------------------------------------------------------
// IPC handlers — one per channel, signatures matching QuantApi
// ---------------------------------------------------------------------------

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.watchlistGet, () => {
    try {
      return getWatchlist();
    } catch {
      return [];
    }
  });

  ipcMain.handle(IPC.watchlistAdd, async (_e, rawSymbol: unknown): Promise<AddWatchlistResult> => {
    try {
      if (typeof rawSymbol !== 'string') return { ok: false, error: 'Invalid symbol' };
      return await addToWatchlist(rawSymbol);
    } catch {
      return { ok: false, error: 'Could not add symbol' };
    }
  });

  ipcMain.handle(IPC.watchlistRemove, (_e, rawSymbol: unknown) => {
    try {
      const symbol = normalizeSymbol(rawSymbol);
      return symbol ? removeFromWatchlist(symbol) : getWatchlist();
    } catch {
      return [];
    }
  });

  ipcMain.handle(IPC.symbolsSearch, async (_e, rawQuery: unknown) => {
    try {
      if (typeof rawQuery !== 'string') return [];
      return await searchSymbols(rawQuery);
    } catch {
      return [];
    }
  });

  ipcMain.handle(IPC.quotesGet, async (_e, rawSymbols: unknown) => {
    const symbols = cleanSymbolList(rawSymbols, MAX_QUOTE_SYMBOLS);
    try {
      return await getQuotes(symbols);
    } catch {
      return symbols.map((s) => sampleQuote(s));
    }
  });

  ipcMain.handle(IPC.holdingsGet, async (_e, rawSymbol: unknown): Promise<HoldingsResult> => {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) {
      return { etfSymbol: '', asOf: todayYmd(), holdings: [], source: 'sample' };
    }
    try {
      return await getHoldings(symbol);
    } catch {
      return { etfSymbol: symbol, asOf: todayYmd(), holdings: [], source: 'sample' };
    }
  });

  ipcMain.handle(IPC.newsGet, async (_e, rawSymbols: unknown, rawLimit: unknown) => {
    const symbols = cleanSymbolList(rawSymbols, MAX_NEWS_SYMBOLS);
    const limitPerSymbol = clampInt(rawLimit, 1, 20, 6);
    try {
      return await getNews(symbols, limitPerSymbol);
    } catch {
      return sampleNews(symbols);
    }
  });

  ipcMain.handle(IPC.earningsGet, async (_e, rawSymbols: unknown) => {
    const symbols = cleanSymbolList(rawSymbols, MAX_EARNINGS_SYMBOLS);
    try {
      return await getEarnings(symbols);
    } catch {
      return symbols.map((s) => sampleEarnings(s));
    }
  });

  ipcMain.handle(IPC.chartGet, async (_e, rawSymbol: unknown, rawRange: unknown) => {
    const symbol = normalizeSymbol(rawSymbol) ?? 'SPY';
    const range = cleanRange(rawRange);
    try {
      return await getChart(symbol, range);
    } catch {
      return sampleChart(symbol, range);
    }
  });

  ipcMain.handle(IPC.pivotNewsGet, async (_e, rawSymbol: unknown, rawPivots: unknown) => {
    const pivots = cleanPivots(rawPivots);
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return pivots.map((pivot) => ({ pivot, items: [] }));
    try {
      return await getPivotNews(symbol, pivots);
    } catch {
      return pivots.map((pivot) => ({ pivot, items: [] }));
    }
  });

  ipcMain.handle(IPC.macroOverlayGet, async (_e, rawKey: unknown, rawRange: unknown) => {
    const key = cleanMacroOverlayKey(rawKey);
    const range = cleanRange(rawRange);
    return getMacroOverlay(key, range);
  });

  ipcMain.handle(IPC.chartSnapshotCapture, async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    try {
      const image = await mainWindow.webContents.capturePage();
      return {
        dataUrl: image.toDataURL(),
        capturedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle(IPC.quantAnalyze, async (_e, rawRequest: unknown) => {
    const request = cleanQuantInsightRequest(rawRequest);
    if (!request) {
      return {
        ok: false,
        source: 'deterministic-fallback',
        answer: 'Quant analysis could not run because the request payload was invalid.',
        generatedAt: new Date().toISOString(),
        error: 'Invalid request',
      };
    }
    const response = await analyzeQuant(request);
    try {
      saveQuantInsight(request, response);
    } catch (err) {
      console.error('[quant] save insight failed:', err);
    }
    return response;
  });

  ipcMain.handle(IPC.quantInsightsGet, async (_e, rawSymbol: unknown, rawRange: unknown) => {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return [];
    return getQuantInsights(symbol, CHART_RANGES.includes(rawRange as ChartRange) ? (rawRange as ChartRange) : undefined);
  });

  ipcMain.handle(IPC.llmSettingsGet, () => getLlmSettings());

  ipcMain.handle(IPC.llmSettingsSave, (_e, rawSettings: unknown) => {
    const s =
      rawSettings && typeof rawSettings === 'object'
        ? (rawSettings as Partial<LlmSettings>)
        : {};
    return saveLlmSettings({
      enabled: s.enabled === true,
      baseUrl: typeof s.baseUrl === 'string' ? s.baseUrl : undefined,
      model: typeof s.model === 'string' ? s.model : undefined,
    });
  });

  ipcMain.handle(IPC.valuationGet, async (_e, rawSymbol: unknown) => {
    const symbol = normalizeSymbol(rawSymbol);
    return getValuation(symbol ?? 'SPY');
  });

  ipcMain.handle(IPC.openExternal, async (_e, rawUrl: unknown) => {
    if (typeof rawUrl !== 'string') return;
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;
    try {
      await shell.openExternal(parsed.toString());
    } catch (err) {
      console.error('[shell] openExternal failed:', err);
    }
  });
}

// ---------------------------------------------------------------------------
// Smoke mode: screenshot after load, then quit. Hard timeout at 45s.
// ---------------------------------------------------------------------------

function armSmokeMode(win: BrowserWindow): void {
  // Smoke runs execute on a live desktop: shield the window from stray user
  // clicks/keystrokes so accidental input can't mutate UI state (e.g. opening
  // or closing the chart modal) before the screenshot is captured.
  win.setIgnoreMouseEvents(true);
  win.setFocusable(false);

  win.webContents.on('console-message', (_event, _level, message) => {
    console.log('[renderer] ' + message);
  });
  // Surface renderer crashes/reloads in smoke logs — a mid-run reload resets
  // renderer state and can invalidate the screenshot.
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[renderer] process gone: ' + details.reason);
  });
  win.webContents.on('did-start-navigation', (_event, url, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) console.log('[smoke] main-frame navigation: ' + url);
  });

  const killer = setTimeout(() => {
    console.error('SMOKE_FAIL hard timeout after 45s');
    app.exit(1);
  }, 45_000);
  killer.unref();

  win.webContents.once('did-finish-load', () => {
    const envDelay = Number(process.env.QUANT_SMOKE_DELAY_MS);
    const delayMs =
      Number.isFinite(envDelay) && envDelay > 0
        ? Math.min(envDelay, 40_000)
        : smokeModalSymbol
          ? 16_000
          : 13_000;
    setTimeout(async () => {
      try {
        const image = await win.webContents.capturePage();
        const outPath =
          process.env.QUANT_SMOKE_OUT ||
          path.join(
            app.getAppPath(),
            smokeModalSymbol ? 'dist/smoke-modal.png' : 'dist/smoke.png',
          );
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, image.toPNG());
        clearTimeout(killer);
        console.log('SMOKE_OK ' + outPath);
        app.quit();
      } catch (err) {
        console.error('SMOKE_FAIL', err);
        process.exitCode = 1;
        app.quit();
      }
    }, delayMs);
  });
}

// ---------------------------------------------------------------------------
// Window + app lifecycle
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1560,
    height: 940,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#0a0e16',
    autoHideMenuBar: true,
    title: 'Quant',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  // Security: never open child windows, never navigate away.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());

  if (isSmoke) armSmokeMode(win);

  const indexPath = path.join(__dirname, '../renderer/index.html');
  const query: Record<string, string> = {};
  if (smokeModalSymbol) query.smokeModal = smokeModalSymbol;
  if (forceOnboarding) query.onboarding = '1';
  if (Object.keys(query).length) {
    void win.loadFile(indexPath, { query });
  } else {
    void win.loadFile(indexPath);
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[main] unhandled rejection:', reason);
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
