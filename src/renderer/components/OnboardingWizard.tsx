import React, { useEffect, useMemo, useState } from 'react';
import type { LlmSettings } from '../../shared/types';
import { api } from '../api';
import { useApp } from '../store';

const ONBOARDING_KEY = 'quant.onboarding.completed.v1';

interface Preset {
  id: string;
  title: string;
  description: string;
  symbols: string[];
  bestFor: string;
}

const PRESETS: Preset[] = [
  {
    id: 'core',
    title: 'Core market desk',
    description: 'Broad indexes, bonds, gold, and a few large liquid leaders.',
    symbols: ['SPY', 'QQQ', 'IWM', 'DIA', 'TLT', 'GLD', 'AAPL', 'MSFT', 'NVDA'],
    bestFor: 'A balanced first watchlist for market direction and risk appetite.',
  },
  {
    id: 'growth',
    title: 'AI and growth',
    description: 'Semiconductors, mega-cap tech, and high-beta growth names.',
    symbols: ['QQQ', 'SMH', 'NVDA', 'AMD', 'TSLA', 'META', 'GOOGL', 'MSFT', 'AAPL'],
    bestFor: 'Tracking momentum, earnings sensitivity, and valuation pressure.',
  },
  {
    id: 'macro',
    title: 'Macro and defensives',
    description: 'Rates, commodities, defensives, and cyclicals for regime shifts.',
    symbols: ['SPY', 'TLT', 'GLD', 'XLE', 'XLV', 'XLP', 'JPM', 'CAT', 'KO'],
    bestFor: 'Watching rotation when rates, inflation, oil, or fear move markets.',
  },
];

type Step = 'preset' | 'llm' | 'tips';

function shouldForceOnboarding(): boolean {
  return new URLSearchParams(window.location.search).get('onboarding') === '1';
}

function shouldHideForSmoke(): boolean {
  const params = new URLSearchParams(window.location.search);
  return (params.has('smokeModal') || params.has('smokeTab')) && !params.has('onboarding');
}

function readCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'done';
  } catch {
    return false;
  }
}

function markCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'done');
  } catch {
    /* localStorage can be unavailable in unusual profiles */
  }
}

function TipCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ob-tip">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function OnboardingWizard() {
  const { state, actions } = useApp();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('preset');
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [llm, setLlm] = useState<LlmSettings>({
    enabled: false,
    baseUrl: 'http://127.0.0.1:8080',
    model: 'gemma-4-e4b-it',
  });
  const [savingLlm, setSavingLlm] = useState(false);

  const selectedPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0],
    [presetId],
  );

  useEffect(() => {
    if (shouldHideForSmoke()) return;
    if (shouldForceOnboarding() || !readCompleted()) setOpen(true);
  }, []);

  useEffect(() => {
    api.getLlmSettings().then(setLlm, () => undefined);
  }, []);

  if (!open) return null;

  const finish = () => {
    markCompleted();
    setOpen(false);
  };

  const applyPreset = async () => {
    if (!state.watchlistLoaded) {
      setApplyError('Watchlist is still loading. Try again in a moment.');
      return;
    }
    setApplying(true);
    setApplyError(null);
    const already = new Set(state.watchlist.map((item) => item.symbol));
    const added: string[] = [];
    let failed = false;
    try {
      for (const symbol of selectedPreset.symbols) {
        if (already.has(symbol)) continue;
        const result = await actions.addSymbol(symbol);
        if (result.ok) {
          added.push(symbol);
          already.add(symbol);
        }
      }
    } catch {
      failed = true;
      setApplyError('Preset could not be applied. You can still continue and add symbols manually.');
    }
    setApplied(added);
    setApplying(false);
    if (added.length === 0 && !failed) {
      setApplyError('All symbols in this preset are already on your watchlist.');
    }
  };

  const saveLlm = async () => {
    setSavingLlm(true);
    const saved = await api.saveLlmSettings(llm).catch(() => llm);
    setLlm(saved);
    setSavingLlm(false);
    setStep('tips');
  };

  return (
    <div className="ob-backdrop" role="presentation">
      <section className="ob-modal" role="dialog" aria-modal="true" aria-label="Quant onboarding">
        <header className="ob-head">
          <div>
            <span className="ob-kicker">First run setup</span>
            <h2>Set up Quant in a few steps</h2>
            <p>
              Choose a starter universe, decide whether Quant AI should call a local model,
              and learn the core reading pattern before the first chart.
            </p>
          </div>
          <button type="button" className="ob-close" onClick={finish} aria-label="Skip onboarding">
            Skip
          </button>
        </header>

        <nav className="ob-steps" aria-label="Onboarding steps">
          {(['preset', 'llm', 'tips'] as Step[]).map((item, index) => (
            <button
              key={item}
              type="button"
              aria-current={step === item ? 'step' : undefined}
              onClick={() => setStep(item)}
            >
              <span className="num">{index + 1}</span>
              {item === 'preset' ? 'Preset' : item === 'llm' ? 'Quant AI' : 'Tips'}
            </button>
          ))}
        </nav>

        {step === 'preset' && (
          <div className="ob-body">
            <div className="ob-copy">
              <h3>Start with a useful watchlist</h3>
              <p>
                Presets are just a starting point. You can add or remove symbols later
                from the left sidebar. ETF holdings drive the news and earnings universe,
                so a few broad ETFs give the app immediate context.
              </p>
            </div>
            <div className="ob-presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={preset.id === presetId ? 'ob-preset is-selected' : 'ob-preset'}
                  onClick={() => setPresetId(preset.id)}
                >
                  <strong>{preset.title}</strong>
                  <span>{preset.description}</span>
                  <em>{preset.bestFor}</em>
                  <small className="num">{preset.symbols.join(' / ')}</small>
                </button>
              ))}
            </div>
            <div className="ob-actions">
              <button type="button" className="ob-secondary" onClick={() => setStep('llm')}>
                Do not add a preset
              </button>
              <button type="button" className="ob-primary" disabled={applying || !state.watchlistLoaded} onClick={applyPreset}>
                {applying
                  ? 'Adding preset...'
                  : state.watchlistLoaded
                    ? 'Add selected preset'
                    : 'Loading watchlist...'}
              </button>
              <button type="button" className="ob-primary" onClick={() => setStep('llm')}>
                Continue
              </button>
            </div>
            {(applied.length > 0 || applyError) && (
              <p className={applied.length > 0 ? 'ob-status' : 'ob-status warn'}>
                {applied.length > 0
                  ? `Added ${applied.join(', ')}.`
                  : applyError}
              </p>
            )}
          </div>
        )}

        {step === 'llm' && (
          <div className="ob-body">
            <div className="ob-copy">
              <h3>Configure Quant AI</h3>
              <p>
                Quant AI is optional. When disabled, the agent still returns a deterministic
                memo from the signal engine. When enabled, Quant calls an OpenAI-compatible
                local server for richer chart discussion.
              </p>
            </div>
            <label className="ob-toggle">
              <input
                type="checkbox"
                checked={llm.enabled}
                onChange={(event) => setLlm((current) => ({ ...current, enabled: event.currentTarget.checked }))}
              />
              Enable local LLM calls
            </label>
            <div className="ob-form-grid">
              <label>
                <span>Server URL</span>
                <input
                  value={llm.baseUrl}
                  onChange={(event) => setLlm((current) => ({ ...current, baseUrl: event.currentTarget.value }))}
                  placeholder="http://127.0.0.1:8080"
                />
              </label>
              <label>
                <span>Model name</span>
                <input
                  value={llm.model}
                  onChange={(event) => setLlm((current) => ({ ...current, model: event.currentTarget.value }))}
                  placeholder="gemma-4-e4b-it"
                />
              </label>
            </div>
            <div className="ob-note">
              <strong>Expected server shape</strong>
              <span>
                Quant checks <code>GET /health</code> and sends chat to{' '}
                <code>POST /v1/chat/completions</code>. LM Studio, llama.cpp server,
                Ollama OpenAI-compatible mode, or a small proxy can work if they expose
                those routes.
              </span>
            </div>
            <div className="ob-actions">
              <button type="button" className="ob-secondary" onClick={() => setStep('preset')}>
                Back
              </button>
              <button type="button" className="ob-primary" disabled={savingLlm} onClick={saveLlm}>
                {savingLlm ? 'Saving...' : 'Save Quant AI settings'}
              </button>
            </div>
          </div>
        )}

        {step === 'tips' && (
          <div className="ob-body">
            <div className="ob-copy">
              <h3>How to read the terminal</h3>
              <p>
                Quant is designed around context first: start with the watchlist, scan news
                and earnings, then open a chart when a symbol deserves attention.
              </p>
            </div>
            <div className="ob-tip-grid">
              <TipCard title="SAMPLE means fallback">
                SAMPLE labels are intentionally visible. They mean the app could not fetch
                live data and is showing bundled fallback data instead.
              </TipCard>
              <TipCard title="ETFs expand your universe">
                ETF holdings feed the news and earnings panels. Adding SPY, QQQ, or SMH
                gives Quant many underlying companies to monitor.
              </TipCard>
              <TipCard title="Signal Desk is rules-first">
                Signal Desk is deterministic. It shows setup, regime, risk, and blockers
                before Quant AI adds narrative judgment.
              </TipCard>
              <TipCard title="Use Quant AI for critique">
                Good prompts ask for invalidation, risk/reward critique, or what evidence
                would change the decision. Avoid treating it as certainty.
              </TipCard>
            </div>
            <div className="ob-actions">
              <button type="button" className="ob-secondary" onClick={() => setStep('llm')}>
                Back
              </button>
              <button type="button" className="ob-primary" onClick={finish}>
                Start using Quant
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
