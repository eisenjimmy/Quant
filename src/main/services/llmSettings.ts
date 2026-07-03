import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { LlmSettings } from '../../shared/types';

const DEFAULT_BASE_URL = process.env.QUANT_LLM_BASE_URL ?? 'http://127.0.0.1:8080';
const DEFAULT_MODEL = process.env.QUANT_LLM_MODEL ?? 'gemma-4-e4b';

function envEnabled(): boolean {
  return /^(1|true|yes)$/i.test(process.env.QUANT_LLM_ENABLED ?? '') ||
    Boolean(process.env.QUANT_LLM_BASE_URL);
}

function storePath(): string {
  return path.join(app.getPath('userData'), 'llm-settings.json');
}

function normalizeSettings(raw: Partial<LlmSettings> | null | undefined): LlmSettings {
  return {
    enabled: raw?.enabled === true || (raw?.enabled === undefined && envEnabled()),
    baseUrl:
      typeof raw?.baseUrl === 'string' && raw.baseUrl.trim()
        ? raw.baseUrl.trim().replace(/\/+$/, '')
        : DEFAULT_BASE_URL,
    model:
      typeof raw?.model === 'string' && raw.model.trim()
        ? raw.model.trim()
        : DEFAULT_MODEL,
  };
}

export function getLlmSettings(): LlmSettings {
  try {
    const raw = fs.readFileSync(storePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<LlmSettings>;
    return normalizeSettings(parsed);
  } catch {
    return normalizeSettings(null);
  }
}

export function saveLlmSettings(raw: Partial<LlmSettings>): LlmSettings {
  const settings = normalizeSettings({
    enabled: raw.enabled === true,
    baseUrl: raw.baseUrl,
    model: raw.model,
  });
  const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf8');
  return settings;
}
