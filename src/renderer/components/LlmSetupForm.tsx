import { useEffect, useMemo, useState } from 'react';
import { LLM_PROVIDERS, providerDefinition } from '../../shared/llm';
import type { LlmConnectionResult, LlmProvider, LlmSettings, LlmSettingsInput } from '../../shared/types';
import { api } from '../api';
import '../styles/settings.css';

interface Props {
  compact?: boolean;
  onSaved?: (settings: LlmSettings) => void;
}

function initialInput(): LlmSettingsInput {
  const local = providerDefinition('local');
  return { enabled: false, provider: 'local', baseUrl: local.baseUrl, model: local.model };
}

export function LlmSetupForm({ compact = false, onSaved }: Props) {
  const [settings, setSettings] = useState<LlmSettingsInput>(initialInput);
  const [saved, setSaved] = useState<LlmSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [result, setResult] = useState<LlmConnectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLlmSettings().then((current) => {
      setSaved(current);
      setSettings({
        enabled: current.enabled,
        provider: current.provider,
        baseUrl: current.baseUrl,
        model: current.model,
      });
    }, () => undefined);
  }, []);

  const definition = useMemo(() => providerDefinition(settings.provider), [settings.provider]);
  const hasSavedKey = saved?.provider === settings.provider && saved.hasApiKey && !clearApiKey;

  const selectProvider = (provider: LlmProvider) => {
    const next = providerDefinition(provider);
    setSettings((current) => ({
      ...current,
      provider,
      baseUrl: saved?.provider === provider ? saved.baseUrl : next.baseUrl,
      model: saved?.provider === provider ? saved.model : next.model,
    }));
    setApiKey('');
    setClearApiKey(false);
    setResult(null);
    setError(null);
  };

  const payload = (): LlmSettingsInput => ({
    ...settings,
    apiKey: apiKey.trim() || undefined,
    clearApiKey,
  });

  const save = async () => {
    setBusy('save');
    setError(null);
    try {
      const next = await api.saveLlmSettings(payload());
      setSaved(next);
      setSettings({ enabled: next.enabled, provider: next.provider, baseUrl: next.baseUrl, model: next.model });
      setApiKey('');
      setClearApiKey(false);
      onSaved?.(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Settings could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setError(null);
    setResult(null);
    try {
      setResult(await api.testLlmConnection(payload()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connection test failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={compact ? 'ls-form is-compact' : 'ls-form'}>
      <div className="ls-provider-grid" role="radiogroup" aria-label="LLM provider">
        {LLM_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            role="radio"
            aria-checked={settings.provider === provider.id}
            className={settings.provider === provider.id ? 'ls-provider is-selected' : 'ls-provider'}
            onClick={() => selectProvider(provider.id)}
          >
            <strong>{provider.label}</strong>
            {!compact && <span>{provider.description}</span>}
          </button>
        ))}
      </div>

      <label className="ls-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => {
            const enabled = event.currentTarget.checked;
            setSettings((current) => ({ ...current, enabled }));
          }}
        />
        Enable Quant AI with {definition.label}
      </label>

      <div className="ls-fields">
        <label>
          <span>API endpoint</span>
          <input
            value={settings.baseUrl}
            onChange={(event) => {
              const baseUrl = event.currentTarget.value;
              setSettings((current) => ({ ...current, baseUrl }));
            }}
            spellCheck={false}
          />
        </label>
        <label>
          <span>Model name</span>
          <input
            value={settings.model}
            onChange={(event) => {
              const model = event.currentTarget.value;
              setSettings((current) => ({ ...current, model }));
            }}
            spellCheck={false}
          />
        </label>
        {definition.requiresApiKey && (
          <label className="ls-key-field">
            <span>API key {hasSavedKey ? '— encrypted key saved' : ''}</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => { setApiKey(event.currentTarget.value); setClearApiKey(false); }}
              placeholder={hasSavedKey ? 'Leave blank to keep saved key' : 'Paste API key'}
              autoComplete="off"
            />
          </label>
        )}
      </div>

      {definition.requiresApiKey && hasSavedKey && (
        <label className="ls-clear-key">
          <input type="checkbox" checked={clearApiKey} onChange={(event) => setClearApiKey(event.currentTarget.checked)} />
          Remove the saved API key
        </label>
      )}

      <div className="ls-note">
        {settings.provider === 'local' ? (
          <>
            <strong>llama.cpp setup</strong>
            <span>Start <code>llama-server -m /path/model.gguf --host 127.0.0.1 --port 8080</code>, then use the <code>/v1</code> endpoint above.</span>
          </>
        ) : (
          <>
            <strong>Credential handling</strong>
            <span>Keys are encrypted by macOS through Electron safeStorage. Quant never sends a key anywhere except the selected provider endpoint.</span>
          </>
        )}
      </div>

      {(result || error) && (
        <div className={`ls-result ${result?.ok ? 'is-ok' : 'is-error'}`} role="status">
          <strong>{result?.ok ? 'Connection verified' : 'Connection failed'}</strong>
          <span>{error ?? result?.message}</span>
          {result && <small className="num">{result.provider} / {result.model} / {result.latencyMs} ms</small>}
        </div>
      )}

      <div className="ls-actions">
        <button type="button" className="ls-test" disabled={busy !== null} onClick={test}>
          {busy === 'test' ? 'Testing...' : 'Test connection'}
        </button>
        <button type="button" className="ls-save" disabled={busy !== null} onClick={save}>
          {busy === 'save' ? 'Saving...' : 'Save configuration'}
        </button>
      </div>
    </div>
  );
}
