// Shared contract between the Electron main process and the renderer.
// This file is the single source of truth for data shapes and the
// window.quant bridge API. Breaking changes here require coordinated
// updates to src/main/preload.ts, the IPC handlers in src/main, and
// every renderer caller.

export type InstrumentType = 'etf' | 'stock';

/** Where a payload came from. 'sample' means bundled/offline fallback data —
 *  the UI must surface this so the user is never misled by stale numbers. */
export type DataSource = 'live' | 'sample';

export interface WatchlistItem {
  symbol: string;
  name: string;
  type: InstrumentType;
  addedAt: string; // ISO timestamp
}

export interface SymbolSuggestion {
  symbol: string;
  name: string;
  type: InstrumentType;
  exchange?: string;
}

export interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;         // absolute change vs previous close
  changePercent: number | null;  // -1.23 means -1.23%
  previousClose: number | null;
  currency: string;
  marketState?: string;
  updatedAt: string; // ISO
  source: DataSource;
}

export interface Holding {
  symbol: string;
  name: string;
  weightPercent: number | null; // 0..100
}

export interface HoldingsResult {
  etfSymbol: string;
  asOf: string;        // date the holdings snapshot represents (YYYY-MM-DD or YYYY-MM)
  holdings: Holding[]; // up to top 20, sorted by weight desc
  source: DataSource;  // 'live' if fetched, 'sample' if from the bundled dataset
}

export interface NewsItem {
  id: string;            // stable id for dedupe + React keys
  title: string;
  url: string;
  sourceName: string;    // publisher, e.g. "Reuters"
  publishedAt: string;   // ISO
  relatedSymbol: string; // ticker this article was fetched for
  summary?: string;
}

export type EarningsTime = 'bmo' | 'amc' | 'unknown'; // before market open / after market close

export interface EarningsEvent {
  symbol: string;
  companyName: string;
  date: string;          // ISO date, YYYY-MM-DD
  time: EarningsTime;
  epsEstimate: number | null;
  epsActual?: number | null;
  epsSurprisePercent?: number | null;
  latestReportedDate?: string | null;
  source: DataSource;
}

export type ChartRange = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | '5y' | 'max';
export const CHART_RANGES: ChartRange[] = ['1d', '1w', '1m', '3m', '6m', '1y', '5y', 'max'];

export interface Candle {
  time: number; // unix seconds, UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  symbol: string;
  range: ChartRange;
  interval: string; // e.g. "5m", "1d", "1wk"
  candles: Candle[]; // ascending by time, no null closes
  currency: string;
  exchangeName?: string;
  regularMarketPrice?: number | null;
  previousClose?: number | null;
  source: DataSource;
}

export type SignalKind =
  | 'cup-forming'
  | 'cup-handle'
  | 'ma-alignment'
  | 'near-52w-high'
  | 'new-52w-high'
  | 'vcp'
  | 'volume-surge'
  | 'golden-cross'
  | 'macd-bullish'
  | 'rs-strong'
  | 'momentum'
  | 'rebound'
  | 'mean-reversion';

export interface DetectedSignal {
  kind: SignalKind;
  label: string;
  score: number;
  detail: string;
  tone: 'bullish' | 'watch' | 'hot' | 'neutral';
}

export interface SignalScanRequest {
  universe?: 'us-stocks' | 'watchlist';
  symbols?: string[];
  includeEtfs?: boolean;
  limit?: number;
  signalKinds?: SignalKind[];
}

export interface SignalScanRow {
  symbol: string;
  name: string;
  type: InstrumentType;
  exchange?: string;
  price: number | null;
  changePercent: number | null;
  asOf: string;
  score: number;
  rsRank: number | null;
  distanceToHighPercent: number | null;
  volumeRatio20: number | null;
  signals: DetectedSignal[];
  sparkline: number[];
  source: DataSource;
}

export interface SignalScanSummary {
  bullishPercent: number;
  hotCount: number;
  nearHighCount: number;
  cupCount: number;
  maAlignedCount: number;
  source: DataSource;
}

export interface SignalScanResult {
  asOf: string;
  generatedAt: string;
  universe: 'us-stocks' | 'watchlist';
  totalUniverse: number;
  totalScanned: number;
  rows: SignalScanRow[];
  summary: SignalScanSummary;
  source: DataSource;
}

/** A significant local high or low detected in the candle series. */
export interface PivotPoint {
  time: number;  // unix seconds — time of the pivot candle
  price: number; // the candle's high for 'high' pivots, low for 'low'
  kind: 'high' | 'low';
}

export interface PivotNewsResult {
  pivot: PivotPoint;
  items: NewsItem[]; // news published near the pivot date; may be empty
}

export type MacroOverlayKey =
  | 'jobs'
  | 'unemployment'
  | 'inflation'
  | 'treasury10y'
  | 'oil'
  | 'vix';

export interface MacroOverlayPoint {
  time: number; // unix seconds
  value: number;
}

export interface MacroOverlaySeries {
  key: MacroOverlayKey;
  label: string;
  unit: string;
  sourceName: string;
  points: MacroOverlayPoint[];
  source: DataSource;
}

export interface QuantInsightRequest {
  symbol: string;
  range: ChartRange;
  evaluation: import('./quant').SignalEvaluation;
  news: NewsItem[];
  earnings?: EarningsEvent | null;
  valuation?: ValuationSnapshot | null;
  macroOverlays?: MacroOverlaySeries[];
  snapshotDataUrl?: string;
  question?: string;
  thinkingMode?: boolean;
}

export type QuantHarnessStageName = 'evidence' | 'analyst' | 'verifier' | 'orchestrator';
export type QuantHarnessStageStatus = 'passed' | 'warning' | 'failed' | 'skipped';

export interface QuantEvidenceItem {
  id: string;
  category: 'signal' | 'risk' | 'market' | 'news' | 'earnings' | 'valuation' | 'macro';
  label: string;
  value: string;
  source: string;
  observedAt?: string;
  quality: 'verified' | 'warning' | 'unavailable';
}

export interface QuantHarnessStage {
  name: QuantHarnessStageName;
  status: QuantHarnessStageStatus;
  summary: string;
  durationMs: number;
}

export interface QuantHarnessTrace {
  runId: string;
  mode: 'orchestrated' | 'single-pass' | 'deterministic';
  stages: QuantHarnessStage[];
  evidence: QuantEvidenceItem[];
  verifierSummary?: string;
  finalChecks: string[];
}

export interface QuantInsightResponse {
  ok: boolean;
  source: 'local-llm' | 'deterministic-fallback';
  model?: string;
  answer: string;
  generatedAt: string;
  error?: string;
  harness?: QuantHarnessTrace;
}

export interface QuantInsightRecord extends QuantInsightResponse {
  id: string;
  symbol: string;
  range: ChartRange;
  question?: string;
  decision?: import('./quant').TradeDecision;
  setupType?: import('./quant').SetupType;
  confidence?: number;
}

export type QuantJournalStatus = 'planned' | 'active' | 'invalidated' | 'closed';

export interface QuantJournalEntryInput {
  id?: string;
  symbol: string;
  range: ChartRange;
  status: QuantJournalStatus;
  thesis: string;
  catalyst: string;
  invalidation: string;
  notes?: string;
  evaluation: import('./quant').SignalEvaluation;
}

export interface QuantJournalEntry {
  id: string;
  symbol: string;
  range: ChartRange;
  status: QuantJournalStatus;
  thesis: string;
  catalyst: string;
  invalidation: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  signalSnapshot: {
    decision: import('./quant').TradeDecision;
    setupType: import('./quant').SetupType;
    confidence: number;
    strategyVersion: string;
    evaluatedAt: string;
    entry: number;
    stop: number;
    target1: number;
    target2: number;
    rewardRisk1: number;
    blockers: string[];
  };
}

export type LlmProvider = 'local' | 'openai' | 'gemini' | 'grok' | 'claude';

export interface LlmSettings {
  enabled: boolean;
  provider: LlmProvider;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  credentialStorage: 'encrypted' | 'unavailable';
}

export interface LlmSettingsInput {
  enabled: boolean;
  provider: LlmProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
  clearApiKey?: boolean;
}

export interface LlmConnectionResult {
  ok: boolean;
  provider: LlmProvider;
  model: string;
  latencyMs: number;
  message: string;
}

export interface ValuationSnapshot {
  symbol: string;
  companyName: string;
  price: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  totalRevenue: number | null;
  grossProfit: number | null;
  ebitda: number | null;
  netIncomeToCommon: number | null;
  profitMargin: number | null;
  revenueGrowth: number | null;
  trailingPe: number | null;
  forwardPe: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  enterpriseToRevenue: number | null;
  enterpriseToEbitda: number | null;
  forwardEps: number | null;
  targetMeanPrice: number | null;
  sharesOutstanding: number | null;
  estimates: Array<{
    label: string;
    fairValue: number | null;
    upsidePercent: number | null;
    formula: string;
  }>;
  source: DataSource;
}

export type AddWatchlistResult =
  | { ok: true; item: WatchlistItem; watchlist: WatchlistItem[] }
  | { ok: false; error: string };

/** The API exposed on window.quant by src/main/preload.ts. */
export interface QuantApi {
  forecast: import('./forecast').ForecastApi;
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(symbol: string): Promise<AddWatchlistResult>;
  removeFromWatchlist(symbol: string): Promise<WatchlistItem[]>;
  reorderWatchlist(symbols: string[]): Promise<WatchlistItem[]>;
  searchSymbols(query: string): Promise<SymbolSuggestion[]>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getHoldings(etfSymbol: string): Promise<HoldingsResult>;
  getNews(symbols: string[], limitPerSymbol?: number): Promise<NewsItem[]>;
  getEarnings(symbols: string[]): Promise<EarningsEvent[]>;
  getChart(symbol: string, range: ChartRange): Promise<ChartData>;
  getPivotNews(symbol: string, pivots: PivotPoint[]): Promise<PivotNewsResult[]>;
  getMacroOverlay(key: MacroOverlayKey, range: ChartRange): Promise<MacroOverlaySeries>;
  captureChartSnapshot(symbol: string): Promise<{ dataUrl: string; capturedAt: string } | null>;
  analyzeQuant(request: QuantInsightRequest): Promise<QuantInsightResponse>;
  getQuantInsights(symbol: string, range?: ChartRange): Promise<QuantInsightRecord[]>;
  getQuantJournal(symbol: string): Promise<QuantJournalEntry[]>;
  saveQuantJournal(entry: QuantJournalEntryInput): Promise<QuantJournalEntry>;
  getLlmSettings(): Promise<LlmSettings>;
  saveLlmSettings(settings: LlmSettingsInput): Promise<LlmSettings>;
  testLlmConnection(settings: LlmSettingsInput): Promise<LlmConnectionResult>;
  getValuation(symbol: string): Promise<ValuationSnapshot>;
  scanSignals(request?: SignalScanRequest): Promise<SignalScanResult>;
  openExternal(url: string): Promise<void>;
}
