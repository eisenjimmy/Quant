import fs from 'node:fs';
import path from 'node:path';
import { FORECAST_V1 } from '../../shared/forecast';
import type {
  ForecastEvaluation,
  ForecastPoint,
  ForecastRecord,
  ForecastSavedSummary,
} from '../../shared/forecast';
import {
  nextUsMarketBarTimestamps,
  validateUsMarketBarTimestamps,
} from './forecastCalendar';
import { normalizeSymbol } from './util';

const INDEX_SCHEMA_VERSION = 1;
const OVERLAY_SCHEMA_VERSION = 1;
const DEFAULT_MAX_RECORDS_PER_SYMBOL = 20;
const DEFAULT_MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_RECORD_FILE_BYTES = 25 * 1024 * 1024;
const FORECAST_ID_RE = /^fc_[A-Za-z0-9_-]{1,160}$/;

interface ForecastIndex {
  schemaVersion: typeof INDEX_SCHEMA_VERSION;
  updatedAt: string;
  records: ForecastSavedSummary[];
}

interface OverlaySettings {
  schemaVersion: typeof OVERLAY_SCHEMA_VERSION;
  symbols: Record<string, boolean>;
}

export interface ForecastStoreOptions {
  now?: () => string;
  maxRecordsPerSymbol?: number;
  maxTotalBytes?: number;
  onWarning?: (message: string) => void;
}

let tempCounter = 0;

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isForecastPoint(value: unknown): value is ForecastPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<ForecastPoint>;
  return (
    isIsoTimestamp(point.timestamp) &&
    isFiniteNumber(point.mean) &&
    isFiniteNumber(point.p10) &&
    isFiniteNumber(point.p25) &&
    isFiniteNumber(point.p50) &&
    isFiniteNumber(point.p75) &&
    isFiniteNumber(point.p90) &&
    isFiniteNumber(point.min) &&
    isFiniteNumber(point.max) &&
    point.min > 0 &&
    point.min <= point.p10 &&
    point.p10 <= point.p25 &&
    point.p25 <= point.p50 &&
    point.p50 <= point.p75 &&
    point.p75 <= point.p90 &&
    point.p90 <= point.max &&
    point.mean >= point.min &&
    point.mean <= point.max
  );
}

function isFrequency(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function isForecastEvaluation(value: unknown): value is ForecastEvaluation {
  if (!value || typeof value !== 'object') return false;
  const evaluation = value as Partial<ForecastEvaluation>;
  if (
    (evaluation.status !== 'not-started' &&
      evaluation.status !== 'partial' &&
      evaluation.status !== 'matured' &&
      evaluation.status !== 'unavailable') ||
    !Number.isInteger(evaluation.actualPointsAvailable) ||
    evaluation.actualPointsAvailable! < 0 ||
    evaluation.actualPointsAvailable! > FORECAST_V1.predictionBars ||
    evaluation.expectedPoints !== FORECAST_V1.predictionBars
  ) {
    return false;
  }
  if (
    evaluation.evaluatedAt !== undefined &&
    !isIsoTimestamp(evaluation.evaluatedAt)
  ) {
    return false;
  }
  if (
    evaluation.actualFinalClose !== undefined &&
    (!isFiniteNumber(evaluation.actualFinalClose) ||
      evaluation.actualFinalClose <= 0)
  ) {
    return false;
  }
  if (
    evaluation.directionCorrect !== undefined &&
    typeof evaluation.directionCorrect !== 'boolean'
  ) {
    return false;
  }
  if (
    evaluation.medianAbsolutePercentageError !== undefined &&
    (!isFiniteNumber(evaluation.medianAbsolutePercentageError) ||
      evaluation.medianAbsolutePercentageError < 0)
  ) {
    return false;
  }
  if (
    evaluation.p10P90Coverage !== undefined &&
    !isFrequency(evaluation.p10P90Coverage)
  ) {
    return false;
  }
  if (evaluation.status === 'not-started') {
    return (
      evaluation.actualPointsAvailable === 0 &&
      evaluation.evaluatedAt === undefined &&
      evaluation.actualFinalClose === undefined &&
      evaluation.directionCorrect === undefined &&
      evaluation.medianAbsolutePercentageError === undefined &&
      evaluation.p10P90Coverage === undefined
    );
  }
  if (evaluation.status === 'unavailable') {
    return (
      evaluation.actualPointsAvailable === 0 &&
      isIsoTimestamp(evaluation.evaluatedAt) &&
      evaluation.actualFinalClose === undefined &&
      evaluation.directionCorrect === undefined &&
      evaluation.medianAbsolutePercentageError === undefined &&
      evaluation.p10P90Coverage === undefined
    );
  }
  if (
    !isIsoTimestamp(evaluation.evaluatedAt) ||
    evaluation.actualPointsAvailable === 0 ||
    !isFiniteNumber(evaluation.medianAbsolutePercentageError) ||
    !isFrequency(evaluation.p10P90Coverage)
  ) {
    return false;
  }
  if (evaluation.status === 'partial') {
    return (
      evaluation.actualPointsAvailable! < FORECAST_V1.predictionBars &&
      evaluation.actualFinalClose === undefined &&
      evaluation.directionCorrect === undefined
    );
  }
  return (
    isFiniteNumber(evaluation.actualFinalClose) &&
    evaluation.actualFinalClose > 0 &&
    typeof evaluation.directionCorrect === 'boolean'
  );
}

function evaluationRank(evaluation: ForecastEvaluation): number {
  if (evaluation.status === 'matured') return 2;
  if (evaluation.status === 'partial') return 1;
  return 0;
}

function shouldReplaceEvaluation(
  current: ForecastEvaluation,
  next: ForecastEvaluation,
): boolean {
  const currentRank = evaluationRank(current);
  const nextRank = evaluationRank(next);
  if (next.actualPointsAvailable < current.actualPointsAvailable) {
    return false;
  }
  if (nextRank < currentRank) return false;
  if (nextRank > currentRank) return true;
  const currentAt = Date.parse(current.evaluatedAt ?? '');
  const nextAt = Date.parse(next.evaluatedAt ?? '');
  if (
    Number.isFinite(currentAt) &&
    Number.isFinite(nextAt) &&
    nextAt < currentAt
  ) {
    return false;
  }
  if (
    next.actualPointsAvailable === current.actualPointsAvailable &&
    (!Number.isFinite(nextAt) ||
      (Number.isFinite(currentAt) && nextAt <= currentAt))
  ) {
    return false;
  }
  return true;
}

export function isForecastRecord(value: unknown): value is ForecastRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ForecastRecord>;
  const symbol = normalizeSymbol(record.symbol);
  if (
    record.schemaVersion !== FORECAST_V1.schemaVersion ||
    typeof record.id !== 'string' ||
    !FORECAST_ID_RE.test(record.id) ||
    !symbol ||
    symbol !== record.symbol ||
    (record.assetType !== 'stock' && record.assetType !== 'etf') ||
    !isIsoTimestamp(record.generatedAt) ||
    !isIsoTimestamp(record.expiresAt) ||
    !isIsoTimestamp(record.forecastStartAt) ||
    !isIsoTimestamp(record.forecastEndAt) ||
    record.expiresAt !== forecastExpiryFromGeneratedAt(record.generatedAt) ||
    Date.parse(record.forecastEndAt) < Date.parse(record.forecastStartAt) ||
    !isFiniteNumber(record.lastHistoricalClose) ||
    record.lastHistoricalClose <= 0 ||
    record.horizonLabel !== '24-trading-hours'
  ) {
    return false;
  }

  const metrics = record.metrics;
  if (
    !metrics ||
    !isFrequency(metrics.sampledUpsideFrequency) ||
    !isFrequency(metrics.sampledDownsideFrequency) ||
    metrics.sampledUpsideFrequency + metrics.sampledDownsideFrequency > 1 ||
    !isFrequency(metrics.volatilityAmplificationFrequency) ||
    !isFiniteNumber(metrics.medianPredictedReturn) ||
    metrics.medianPredictedReturn <= -1 ||
    !isFiniteNumber(metrics.meanPredictedReturn) ||
    metrics.meanPredictedReturn <= -1 ||
    !isFiniteNumber(metrics.historicalVolatility) ||
    metrics.historicalVolatility < 0 ||
    !isFiniteNumber(metrics.medianForecastVolatility) ||
    metrics.medianForecastVolatility < 0
  ) {
    return false;
  }

  if (
    !Array.isArray(record.aggregate) ||
    record.aggregate.length !== FORECAST_V1.predictionBars ||
    !record.aggregate.every(isForecastPoint) ||
    !Array.isArray(record.closePaths) ||
    record.closePaths.length !== FORECAST_V1.pathCount ||
    !record.closePaths.every(
      (closePath) =>
        Array.isArray(closePath) &&
        closePath.length === FORECAST_V1.predictionBars &&
        closePath.every((close) => isFiniteNumber(close) && close > 0),
    )
  ) {
    return false;
  }

  const provenance = record.provenance;
  if (
    !provenance ||
    (provenance.mode !== 'production' && provenance.mode !== 'development-mock') ||
    typeof provenance.marketDataSource !== 'string' ||
    provenance.marketDataIsSample !== false ||
    !isIsoTimestamp(provenance.latestCompletedCandleAt) ||
    !Number.isInteger(provenance.historyBars) ||
    provenance.historyBars < 0 ||
    typeof provenance.adjusted !== 'boolean' ||
    typeof provenance.exchange !== 'string' ||
    !provenance.exchange ||
    provenance.exchangeTimezone !== 'America/New_York' ||
    provenance.marketCalendar !== 'US-equities-v1' ||
    provenance.regularSession !== '09:30-16:00' ||
    typeof provenance.modelId !== 'string' ||
    typeof provenance.tokenizerId !== 'string' ||
    typeof provenance.kronosCommit !== 'string' ||
    (provenance.device !== 'cuda' &&
      provenance.device !== 'mps' &&
      provenance.device !== 'cpu') ||
    !isFiniteNumber(provenance.temperature) ||
    !isFiniteNumber(provenance.topP) ||
    !isFiniteNumber(provenance.topK) ||
    provenance.pathCount !== FORECAST_V1.pathCount ||
    !Number.isInteger(provenance.baseSeed) ||
    !Array.isArray(provenance.pathSeeds) ||
    provenance.pathSeeds.length !== FORECAST_V1.pathCount ||
    !provenance.pathSeeds.every(Number.isInteger) ||
    new Set(provenance.pathSeeds).size !== FORECAST_V1.pathCount ||
    provenance.pathSeeds[0] !== provenance.baseSeed ||
    typeof provenance.repairsApplied !== 'boolean' ||
    !Number.isInteger(provenance.repairedValueCount) ||
    provenance.repairedValueCount < 0 ||
    provenance.repairsApplied !== (provenance.repairedValueCount > 0)
  ) {
    return false;
  }

  const aggregateTimestamps = record.aggregate.map((point) => point.timestamp);
  let expectedTimestamps: string[];
  try {
    expectedTimestamps = nextUsMarketBarTimestamps({
      afterTimestamp: provenance.latestCompletedCandleAt,
      count: FORECAST_V1.predictionBars,
      exchange: provenance.exchange,
      timezone: provenance.exchangeTimezone,
    }).timestamps;
  } catch {
    return false;
  }
  if (
    record.forecastStartAt !== aggregateTimestamps[0] ||
    record.forecastEndAt !== aggregateTimestamps.at(-1) ||
    !aggregateTimestamps.every(
      (timestamp, index) => timestamp === expectedTimestamps[index],
    ) ||
    !validateUsMarketBarTimestamps(
      aggregateTimestamps,
      provenance.exchangeTimezone,
    )
  ) {
    return false;
  }

  if (
    !isForecastEvaluation(record.evaluation) ||
    !Array.isArray(record.warnings) ||
    !record.warnings.every((warning) => typeof warning === 'string')
  ) {
    return false;
  }
  return true;
}

function toSummary(record: ForecastRecord): ForecastSavedSummary {
  return {
    id: record.id,
    symbol: record.symbol,
    generatedAt: record.generatedAt,
    expiresAt: record.expiresAt,
    forecastStartAt: record.forecastStartAt,
    forecastEndAt: record.forecastEndAt,
  };
}

function isSavedSummary(value: unknown): value is ForecastSavedSummary {
  if (!value || typeof value !== 'object') return false;
  const summary = value as Partial<ForecastSavedSummary>;
  return (
    typeof summary.id === 'string' &&
    FORECAST_ID_RE.test(summary.id) &&
    typeof summary.symbol === 'string' &&
    normalizeSymbol(summary.symbol) === summary.symbol &&
    isIsoTimestamp(summary.generatedAt) &&
    isIsoTimestamp(summary.expiresAt) &&
    isIsoTimestamp(summary.forecastStartAt) &&
    isIsoTimestamp(summary.forecastEndAt)
  );
}

function isForecastIndex(value: unknown): value is ForecastIndex {
  if (!value || typeof value !== 'object') return false;
  const index = value as Partial<ForecastIndex>;
  return (
    index.schemaVersion === INDEX_SCHEMA_VERSION &&
    isIsoTimestamp(index.updatedAt) &&
    Array.isArray(index.records) &&
    index.records.every(isSavedSummary)
  );
}

function isOverlaySettings(value: unknown): value is OverlaySettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<OverlaySettings>;
  if (
    settings.schemaVersion !== OVERLAY_SCHEMA_VERSION ||
    !settings.symbols ||
    typeof settings.symbols !== 'object' ||
    Array.isArray(settings.symbols)
  ) {
    return false;
  }
  return Object.entries(settings.symbols).every(
    ([symbol, enabled]) => normalizeSymbol(symbol) === symbol && typeof enabled === 'boolean',
  );
}

export function forecastExpiryFromGeneratedAt(generatedAt: string): string {
  const generatedMs = Date.parse(generatedAt);
  if (!Number.isFinite(generatedMs)) throw new Error('Invalid forecast generatedAt timestamp');
  return new Date(generatedMs + FORECAST_V1.recordTtlMs).toISOString();
}

export class ForecastStore {
  private readonly rootDir: string;
  private readonly symbolsDir: string;
  private readonly indexPath: string;
  private readonly overlayPath: string;
  private readonly now: () => string;
  private readonly maxRecordsPerSymbol: number;
  private readonly maxTotalBytes: number;
  private readonly onWarning: (message: string) => void;

  constructor(rootDir: string, options: ForecastStoreOptions = {}) {
    if (!path.isAbsolute(rootDir)) throw new Error('Forecast store path must be absolute');
    this.rootDir = rootDir;
    this.symbolsDir = path.join(rootDir, 'symbols');
    this.indexPath = path.join(rootDir, 'index.json');
    this.overlayPath = path.join(rootDir, 'overlay-settings.json');
    this.now = options.now ?? (() => new Date().toISOString());
    this.maxRecordsPerSymbol = Math.max(
      1,
      Math.floor(options.maxRecordsPerSymbol ?? DEFAULT_MAX_RECORDS_PER_SYMBOL),
    );
    this.maxTotalBytes = Math.max(
      1,
      Math.floor(options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES),
    );
    this.onWarning = options.onWarning ?? (() => undefined);
    fs.mkdirSync(this.symbolsDir, { recursive: true });
    this.inspectExistingIndex();
    this.prune();
  }

  save(input: ForecastRecord): ForecastRecord {
    const record: ForecastRecord = {
      ...input,
      expiresAt: forecastExpiryFromGeneratedAt(input.generatedAt),
    };
    if (!isForecastRecord(record)) throw new Error('Forecast record failed validation');
    const serialized = JSON.stringify(record, null, 2);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_RECORD_FILE_BYTES) {
      throw new Error('Forecast record exceeds the maximum file size');
    }
    if (Buffer.byteLength(serialized, 'utf8') > this.maxTotalBytes) {
      throw new Error('Forecast record exceeds the total storage cap');
    }

    const existingRecords = this.prune();
    if (existingRecords.some((existing) => existing.id === record.id)) {
      throw new Error(`Forecast record ${record.id} already exists`);
    }
    const symbolDir = path.join(this.symbolsDir, record.symbol);
    const filePath = path.join(symbolDir, `${record.id}.json`);
    fs.mkdirSync(symbolDir, { recursive: true });
    if (fs.existsSync(filePath)) {
      throw new Error(`Forecast record ${record.id} already exists`);
    }
    const previousOverlayEnabled = this.getOverlayEnabled(record.symbol);
    try {
      this.atomicWrite(filePath, serialized);
      this.setOverlayEnabled(record.symbol, true);
      const indexedRecords = this.scanRecords().sort(
        (left, right) =>
          Date.parse(right.generatedAt) - Date.parse(left.generatedAt),
      );
      if (!indexedRecords.some((summary) => summary.id === record.id)) {
        throw new Error('Saved forecast could not be read back for indexing');
      }
      this.writeIndex(indexedRecords);
    } catch (error) {
      try {
        fs.unlinkSync(filePath);
      } catch (rollbackError) {
        if ((rollbackError as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.onWarning(
            `Could not roll back failed forecast save ${filePath}: ${String(rollbackError)}`,
          );
        }
      }
      try {
        this.setOverlayEnabled(record.symbol, previousOverlayEnabled);
      } catch (rollbackError) {
        this.onWarning(
          `Could not restore forecast overlay preference for ${record.symbol}: ${String(rollbackError)}`,
        );
      }
      try {
        this.writeIndex(existingRecords);
      } catch (rollbackError) {
        this.onWarning(
          `Could not restore forecast index after failed save: ${String(rollbackError)}`,
        );
      }
      throw error;
    }
    try {
      const retainedRecords = this.prune();
      if (!retainedRecords.some((summary) => summary.id === record.id)) {
        try {
          this.setOverlayEnabled(record.symbol, previousOverlayEnabled);
        } catch (rollbackError) {
          this.onWarning(
            `Could not restore forecast overlay preference for pruned record ${record.id}: ${String(rollbackError)}`,
          );
        }
        throw new Error('New forecast was removed by storage-cap enforcement');
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'New forecast was removed by storage-cap enforcement'
      ) {
        throw error;
      }
      // The committed record, preference, and pre-prune index are durable.
      // A later list/startup scan will rebuild the capped index if needed.
      this.onWarning(
        `Forecast cap index cleanup will retry later: ${String(error)}`,
      );
    }
    return record;
  }

  list(rawSymbol: unknown): ForecastSavedSummary[] {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return [];
    return this.prune().filter((record) => record.symbol === symbol);
  }

  get(rawForecastId: unknown): ForecastRecord | null {
    if (typeof rawForecastId !== 'string' || !FORECAST_ID_RE.test(rawForecastId)) {
      return null;
    }
    const summary = this.prune().find((record) => record.id === rawForecastId);
    if (!summary) return null;
    return this.readRecordFile(
      path.join(this.symbolsDir, summary.symbol, `${summary.id}.json`),
    );
  }

  updateEvaluation(
    rawForecastId: unknown,
    evaluation: ForecastEvaluation,
  ): ForecastRecord | null {
    const record = this.get(rawForecastId);
    if (!record) return null;
    if (!isForecastEvaluation(evaluation)) {
      throw new Error('Forecast evaluation failed validation');
    }
    if (!shouldReplaceEvaluation(record.evaluation, evaluation)) {
      return record;
    }
    const updated: ForecastRecord = { ...record, evaluation: { ...evaluation } };
    if (!isForecastRecord(updated)) {
      throw new Error('Forecast evaluation failed validation');
    }
    const serialized = JSON.stringify(updated, null, 2);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_RECORD_FILE_BYTES) {
      throw new Error('Forecast record exceeds the maximum file size');
    }
    this.atomicWrite(
      path.join(this.symbolsDir, record.symbol, `${record.id}.json`),
      serialized,
    );
    return updated;
  }

  setOverlayEnabled(rawSymbol: unknown, rawEnabled: unknown): boolean {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol || typeof rawEnabled !== 'boolean') return false;
    const settings = this.readOverlaySettings();
    settings.symbols[symbol] = rawEnabled;
    this.atomicWrite(this.overlayPath, JSON.stringify(settings, null, 2));
    return rawEnabled;
  }

  getOverlayEnabled(rawSymbol: unknown): boolean {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return false;
    return this.readOverlaySettings().symbols[symbol] ?? false;
  }

  prune(): ForecastSavedSummary[] {
    const nowMs = Date.parse(this.now());
    if (!Number.isFinite(nowMs)) throw new Error('Forecast store clock returned an invalid timestamp');
    let records = this.scanRecords();
    const duplicateIds = new Set<string>();
    const seenIds = new Set<string>();
    records.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
    const duplicates = records.filter((record) => {
      if (seenIds.has(record.id)) {
        duplicateIds.add(`${record.symbol}:${record.id}`);
        return true;
      }
      seenIds.add(record.id);
      return false;
    });
    this.removeSummaries(duplicates);
    records = records.filter(
      (record) => !duplicateIds.has(`${record.symbol}:${record.id}`),
    );
    const expired = records.filter((record) => Date.parse(record.expiresAt) <= nowMs);
    this.removeSummaries(expired);
    const expiredIds = new Set(expired.map((record) => record.id));
    records = records.filter((record) => !expiredIds.has(record.id));

    const overPerSymbol: ForecastSavedSummary[] = [];
    const bySymbol = new Map<string, ForecastSavedSummary[]>();
    for (const record of records) {
      const group = bySymbol.get(record.symbol) ?? [];
      group.push(record);
      bySymbol.set(record.symbol, group);
    }
    for (const group of bySymbol.values()) {
      group.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
      overPerSymbol.push(...group.slice(this.maxRecordsPerSymbol));
    }
    this.removeSummaries(overPerSymbol);
    const cappedIds = new Set(overPerSymbol.map((record) => record.id));
    records = records.filter((record) => !cappedIds.has(record.id));

    let totalBytes = records.reduce((sum, record) => sum + this.recordSize(record), 0);
    const oldestFirst = [...records].sort(
      (a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt),
    );
    const overTotal: ForecastSavedSummary[] = [];
    for (const record of oldestFirst) {
      if (totalBytes <= this.maxTotalBytes) break;
      totalBytes -= this.recordSize(record);
      overTotal.push(record);
    }
    this.removeSummaries(overTotal);
    const totalIds = new Set(overTotal.map((record) => record.id));
    records = records
      .filter((record) => !totalIds.has(record.id))
      .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
    this.writeIndex(records);
    return records;
  }

  private scanRecords(): ForecastSavedSummary[] {
    const records: ForecastSavedSummary[] = [];
    let symbolEntries: fs.Dirent[];
    try {
      symbolEntries = fs.readdirSync(this.symbolsDir, { withFileTypes: true });
    } catch {
      return records;
    }
    for (const symbolEntry of symbolEntries) {
      if (!symbolEntry.isDirectory()) continue;
      const symbol = normalizeSymbol(symbolEntry.name);
      if (!symbol || symbol !== symbolEntry.name) continue;
      const symbolDir = path.join(this.symbolsDir, symbol);
      let files: fs.Dirent[];
      try {
        files = fs.readdirSync(symbolDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.json')) continue;
        const id = file.name.slice(0, -'.json'.length);
        if (!FORECAST_ID_RE.test(id)) continue;
        const record = this.readRecordFile(path.join(symbolDir, file.name));
        if (record && record.symbol === symbol && record.id === id) {
          records.push(toSummary(record));
        }
      }
    }
    return records;
  }

  private readRecordFile(filePath: string): ForecastRecord | null {
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile() || stat.size > MAX_RECORD_FILE_BYTES) {
        this.onWarning(`Ignored oversized forecast record: ${filePath}`);
        return null;
      }
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
      if (!isForecastRecord(parsed)) {
        this.onWarning(`Ignored malformed forecast record: ${filePath}`);
        return null;
      }
      return parsed;
    } catch (error) {
      this.onWarning(`Could not read forecast record ${filePath}: ${String(error)}`);
      return null;
    }
  }

  private writeIndex(records: ForecastSavedSummary[]): void {
    const index: ForecastIndex = {
      schemaVersion: INDEX_SCHEMA_VERSION,
      updatedAt: this.now(),
      records,
    };
    this.atomicWrite(this.indexPath, JSON.stringify(index, null, 2));
  }

  private inspectExistingIndex(): void {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.indexPath, 'utf8')) as unknown;
      if (!isForecastIndex(parsed)) {
        this.onWarning('Forecast index was malformed and will be rebuilt');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.onWarning(`Forecast index could not be read and will be rebuilt: ${String(error)}`);
      }
    }
  }

  private readOverlaySettings(): OverlaySettings {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.overlayPath, 'utf8')) as unknown;
      if (isOverlaySettings(parsed)) return parsed;
      this.onWarning('Ignored malformed forecast overlay settings');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.onWarning(`Could not read forecast overlay settings: ${String(error)}`);
      }
    }
    return { schemaVersion: OVERLAY_SCHEMA_VERSION, symbols: {} };
  }

  private removeSummaries(records: ForecastSavedSummary[]): void {
    for (const record of records) {
      const filePath = path.join(
        this.symbolsDir,
        record.symbol,
        `${record.id}.json`,
      );
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.onWarning(`Could not prune forecast record ${filePath}: ${String(error)}`);
        }
      }
    }
  }

  private recordSize(record: ForecastSavedSummary): number {
    try {
      return fs.statSync(
        path.join(this.symbolsDir, record.symbol, `${record.id}.json`),
      ).size;
    } catch {
      return 0;
    }
  }

  private atomicWrite(filePath: string, contents: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    tempCounter += 1;
    const tempPath = `${filePath}.tmp-${process.pid}-${tempCounter}`;
    let descriptor: number | null = null;
    try {
      descriptor = fs.openSync(tempPath, 'wx', 0o600);
      fs.writeFileSync(descriptor, contents, 'utf8');
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = null;
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      if (descriptor !== null) {
        try {
          fs.closeSync(descriptor);
        } catch {
          // Preserve the original write error.
        }
      }
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // The temp file may not have been created or may already be renamed.
      }
      throw error;
    }
  }
}
