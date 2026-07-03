// Preload: exposes the QuantApi bridge on window.quant via contextBridge.
// Every method maps 1:1 to an ipcMain.handle registration in main.ts.

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc';
import type {
  AddWatchlistResult,
  ChartData,
  ChartRange,
  EarningsEvent,
  HoldingsResult,
  LlmSettings,
  MacroOverlayKey,
  MacroOverlaySeries,
  NewsItem,
  PivotNewsResult,
  PivotPoint,
  QuantApi,
  QuantInsightRecord,
  QuantInsightRequest,
  QuantInsightResponse,
  Quote,
  SymbolSuggestion,
  ValuationSnapshot,
  WatchlistItem,
} from '../shared/types';

const api: QuantApi = {
  getWatchlist: (): Promise<WatchlistItem[]> => ipcRenderer.invoke(IPC.watchlistGet),
  addToWatchlist: (symbol: string): Promise<AddWatchlistResult> =>
    ipcRenderer.invoke(IPC.watchlistAdd, symbol),
  removeFromWatchlist: (symbol: string): Promise<WatchlistItem[]> =>
    ipcRenderer.invoke(IPC.watchlistRemove, symbol),
  searchSymbols: (query: string): Promise<SymbolSuggestion[]> =>
    ipcRenderer.invoke(IPC.symbolsSearch, query),
  getQuotes: (symbols: string[]): Promise<Quote[]> =>
    ipcRenderer.invoke(IPC.quotesGet, symbols),
  getHoldings: (etfSymbol: string): Promise<HoldingsResult> =>
    ipcRenderer.invoke(IPC.holdingsGet, etfSymbol),
  getNews: (symbols: string[], limitPerSymbol?: number): Promise<NewsItem[]> =>
    ipcRenderer.invoke(IPC.newsGet, symbols, limitPerSymbol),
  getEarnings: (symbols: string[]): Promise<EarningsEvent[]> =>
    ipcRenderer.invoke(IPC.earningsGet, symbols),
  getChart: (symbol: string, range: ChartRange): Promise<ChartData> =>
    ipcRenderer.invoke(IPC.chartGet, symbol, range),
  getPivotNews: (symbol: string, pivots: PivotPoint[]): Promise<PivotNewsResult[]> =>
    ipcRenderer.invoke(IPC.pivotNewsGet, symbol, pivots),
  getMacroOverlay: (key: MacroOverlayKey, range: ChartRange): Promise<MacroOverlaySeries> =>
    ipcRenderer.invoke(IPC.macroOverlayGet, key, range),
  captureChartSnapshot: (symbol: string): Promise<{ dataUrl: string; capturedAt: string } | null> =>
    ipcRenderer.invoke(IPC.chartSnapshotCapture, symbol),
  analyzeQuant: (request: QuantInsightRequest): Promise<QuantInsightResponse> =>
    ipcRenderer.invoke(IPC.quantAnalyze, request),
  getQuantInsights: (symbol: string, range?: ChartRange): Promise<QuantInsightRecord[]> =>
    ipcRenderer.invoke(IPC.quantInsightsGet, symbol, range),
  getLlmSettings: (): Promise<LlmSettings> =>
    ipcRenderer.invoke(IPC.llmSettingsGet),
  saveLlmSettings: (settings: LlmSettings): Promise<LlmSettings> =>
    ipcRenderer.invoke(IPC.llmSettingsSave, settings),
  getValuation: (symbol: string): Promise<ValuationSnapshot> =>
    ipcRenderer.invoke(IPC.valuationGet, symbol),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke(IPC.openExternal, url),
};

contextBridge.exposeInMainWorld('quant', api);
