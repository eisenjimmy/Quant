import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type {
  ChartRange,
  QuantInsightRecord,
  QuantInsightRequest,
  QuantInsightResponse,
} from '../../shared/types';

const MAX_RECORDS = 200;

function storePath(): string {
  return path.join(app.getPath('userData'), 'quant-insights.json');
}

function readAll(): QuantInsightRecord[] {
  try {
    const raw = fs.readFileSync(storePath(), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
}

function writeAll(records: QuantInsightRecord[]): void {
  const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(records.slice(0, MAX_RECORDS), null, 2));
}

function isRecord(value: unknown): value is QuantInsightRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<QuantInsightRecord>;
  return (
    typeof r.id === 'string' &&
    typeof r.symbol === 'string' &&
    typeof r.range === 'string' &&
    typeof r.answer === 'string' &&
    typeof r.generatedAt === 'string'
  );
}

export function saveQuantInsight(
  request: QuantInsightRequest,
  response: QuantInsightResponse,
): QuantInsightRecord {
  const record: QuantInsightRecord = {
    ...response,
    id: `${request.symbol}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    symbol: request.symbol,
    range: request.range,
    question: request.question,
    decision: request.evaluation.decision,
    setupType: request.evaluation.setupType,
    confidence: request.evaluation.confidence,
  };
  const records = [record, ...readAll()].slice(0, MAX_RECORDS);
  writeAll(records);
  return record;
}

export function getQuantInsights(symbol: string, range?: ChartRange): QuantInsightRecord[] {
  const normalized = symbol.toUpperCase();
  return readAll()
    .filter((record) => record.symbol === normalized && (!range || record.range === range))
    .slice(0, 20);
}
