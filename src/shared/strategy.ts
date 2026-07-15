import type { DataSource } from './types';

export type StrategyDataHealth = 'live' | 'mixed' | 'sample' | 'insufficient';
export type StrategyEvidenceQuality = 'verified' | 'warning' | 'unavailable';
export type StrategyVerificationStatus = 'passed' | 'warning' | 'failed';

export interface StrategyDefinition {
  id: string;
  version: string;
  name: string;
  objective: string;
  minimumHistory: number;
  requiredInputs: string[];
  methodology: string[];
  attribution?: string;
}

export interface StrategyEvidence {
  id: string;
  label: string;
  value: string;
  source: string;
  observedAt?: string;
  quality: StrategyEvidenceQuality;
  rationale: string;
}

export interface StrategyVerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface StrategyVerification {
  status: StrategyVerificationStatus;
  checks: StrategyVerificationCheck[];
}

export interface StrategyEnvelope<TDecision extends string> {
  definition: StrategyDefinition;
  decision: TDecision;
  generatedAt: string;
  asOf: string | null;
  dataHealth: StrategyDataHealth;
  evidence: StrategyEvidence[];
  warnings: string[];
  verification: StrategyVerification;
}

export function dataHealthFromSources(
  sources: DataSource[],
  hasMinimumHistory: boolean,
): StrategyDataHealth {
  if (!hasMinimumHistory || sources.length === 0) return 'insufficient';
  const live = sources.filter((source) => source === 'live').length;
  if (live === sources.length) return 'live';
  if (live === 0) return 'sample';
  return 'mixed';
}

export function verifyStrategyEnvelope<TDecision extends string>(
  envelope: Omit<StrategyEnvelope<TDecision>, 'verification'>,
): StrategyVerification {
  const checks: StrategyVerificationCheck[] = [
    {
      id: 'versioned-definition',
      label: 'Versioned method',
      passed: Boolean(envelope.definition.id && envelope.definition.version),
      detail: `${envelope.definition.id}@${envelope.definition.version}`,
    },
    {
      id: 'as-of',
      label: 'Observation timestamp',
      passed: envelope.asOf !== null,
      detail: envelope.asOf ?? 'No aligned market observation',
    },
    {
      id: 'evidence',
      label: 'Evidence attached',
      passed: envelope.evidence.length >= 4,
      detail: `${envelope.evidence.length} evidence records`,
    },
    {
      id: 'data-health',
      label: 'Usable data health',
      passed: envelope.dataHealth !== 'insufficient',
      detail: envelope.dataHealth,
    },
  ];
  const failed = checks.filter((check) => !check.passed).length;
  const warnings = envelope.warnings.length + envelope.evidence.filter((item) => item.quality !== 'verified').length;
  return {
    status: failed > 0 ? 'failed' : warnings > 0 ? 'warning' : 'passed',
    checks,
  };
}
