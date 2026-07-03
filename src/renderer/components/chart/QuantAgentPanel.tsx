import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChartRange,
  EarningsEvent,
  MacroOverlaySeries,
  NewsItem,
  PivotNewsResult,
  QuantInsightRecord,
  QuantInsightResponse,
  ValuationSnapshot,
} from '../../../shared/types';
import type { SignalEvaluation } from '../../../shared/quant';
import { api } from '../../api';
import type { SoundCue } from './useSoundCues';

interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
  source?: QuantInsightResponse['source'];
  saved?: boolean;
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(<ul key={`ul-${blocks.length}`}>{list}</ul>);
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(<h4 key={`h-${blocks.length}`}>{renderInline(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      flushList();
      blocks.push(<h4 key={`h-${blocks.length}`}>{renderInline(line.slice(3))}</h4>);
    } else if (line.startsWith('- ')) {
      list.push(<li key={`li-${blocks.length}-${list.length}`}>{renderInline(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      list.push(<li key={`li-${blocks.length}-${list.length}`}>{renderInline(line.replace(/^\d+\.\s/, ''))}</li>);
    } else {
      flushList();
      blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line)}</p>);
    }
  }
  flushList();
  return <div className="cm-markdown">{blocks}</div>;
}

function ThinkingProgress() {
  return (
    <div className="cm-thinking" role="status" aria-live="polite">
      <span>Quant is thinking</span>
      <span className="cm-thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function QuantAgentPanel({
  symbol,
  range,
  evaluation,
  pivotNews,
  earnings,
  valuation,
  macroOverlays,
  onPlay,
}: {
  symbol: string;
  range: ChartRange;
  evaluation: SignalEvaluation | null;
  pivotNews: PivotNewsResult[];
  earnings: EarningsEvent | null;
  valuation: ValuationSnapshot | null;
  macroOverlays: MacroOverlaySeries[];
  onPlay?: (cue: SoundCue) => void;
}) {
  const [thinkingMode, setThinkingMode] = useState(true);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastInsight, setLastInsight] = useState<QuantInsightResponse | null>(null);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const autoKeyRef = useRef<string | null>(null);
  const smokeMode = useMemo(
    () => new URLSearchParams(window.location.search).has('smokeModal'),
    [],
  );

  const news = useMemo<NewsItem[]>(
    () =>
      pivotNews
        .flatMap((g) => g.items)
        .filter((item, index, items) => items.findIndex((x) => x.id === item.id) === index)
        .slice(0, 12),
    [pivotNews],
  );

  const runAnalysis = useCallback(
    async (ask?: string, auto = false) => {
      if (!evaluation || busy) return;
      setBusy(true);
      try {
        const snapshot = await api.captureChartSnapshot(symbol).catch(() => null);
        const response = await api.analyzeQuant({
          symbol,
          range,
          evaluation,
          news,
          earnings,
          valuation,
          macroOverlays,
          snapshotDataUrl: snapshot?.dataUrl,
          question: ask,
          thinkingMode,
        });
        setLastInsight(response);
        setChat((items) => [
          ...items,
          ...(ask ? [{ role: 'user' as const, text: ask }] : []),
          { role: 'assistant' as const, text: response.answer, source: response.source },
        ].slice(-12));
        onPlay?.(response.ok ? 'notify' : 'down');
      } finally {
        setBusy(false);
        if (!auto) setQuestion('');
      }
    },
    [
      busy,
      earnings,
      evaluation,
      macroOverlays,
      news,
      onPlay,
      range,
      symbol,
      thinkingMode,
      valuation,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    setSavedLoaded(false);
    api.getQuantInsights(symbol, range).then(
      (records: QuantInsightRecord[]) => {
        if (cancelled) return;
        const restored: ChatEntry[] = records
          .slice(0, 4)
          .reverse()
          .map((record) => ({
            role: 'assistant',
            text: record.answer,
            source: record.source,
            saved: true,
          }));
        setChat(restored);
        setLastInsight(records[0] ?? null);
        setSavedLoaded(true);
      },
      () => {
        if (!cancelled) setSavedLoaded(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [range, symbol]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [busy, chat.length]);

  useEffect(() => {
    if (smokeMode) return;
    if (!evaluation) return;
    const key = `${symbol}|${range}|${evaluation.evaluatedAt}|${evaluation.decision}`;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    const id = window.setTimeout(() => {
      void runAnalysis(undefined, true);
    }, 2200);
    return () => window.clearTimeout(id);
  }, [evaluation, range, runAnalysis, smokeMode, symbol]);

  const context = [
    { label: 'Signal', value: evaluation ? `${evaluation.confidence}/100 ${evaluation.decision}` : 'waiting' },
    { label: 'News', value: `${news.length} headlines` },
    { label: 'Earnings', value: earnings ? earnings.date : 'none' },
    { label: 'Valuation', value: valuation ? 'loaded' : 'pending' },
    { label: 'Macro', value: `${macroOverlays.length} overlays` },
  ];

  return (
    <aside className="cm-agent" aria-label="Quant AI chat">
      <div className="cm-agent-head">
        <div>
          <h3>Quant AI</h3>
          <p>Agentic chart chat for {symbol}</p>
        </div>
        <label className="cm-think">
          <input
            type="checkbox"
            checked={thinkingMode}
            onChange={(e) => setThinkingMode(e.currentTarget.checked)}
          />
          Thinking
        </label>
      </div>

      <div className="cm-agent-context" aria-label="Agent context">
        {context.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <b className="num">{item.value}</b>
          </div>
        ))}
      </div>

      <div ref={logRef} className="cm-agent-log">
        {chat.length === 0 && lastInsight === null ? (
          <div className="cm-agent-empty">
            <h4>Ask for a decision memo, risk critique, or invalidation check.</h4>
            <p>
              The agent reads the chart signal, pivot headlines, earnings, valuation,
              macro overlays, and the current screenshot before answering.
            </p>
          </div>
        ) : (
          chat.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`cm-agent-msg ${item.role}`}>
              <span>
                {item.role === 'assistant'
                  ? `${item.source ?? 'assistant'}${item.saved ? ' · saved' : ''}`
                  : 'you'}
              </span>
              {item.role === 'assistant' ? (
                <MarkdownText text={item.text} />
              ) : (
                <p>{item.text}</p>
              )}
            </div>
          ))
        )}
        {busy && (
          <div className="cm-agent-run">
            <ThinkingProgress />
            <ol>
              <li>Capturing chart snapshot</li>
              <li>Hydrating signal, news, earnings, valuation, and macro context</li>
              <li>Composing the trading memo</li>
            </ol>
          </div>
        )}
        {!savedLoaded && !busy && (
          <p className="cm-agent-note">Loading saved local AI analysis...</p>
        )}
      </div>

      <div className="cm-agent-actions">
        <button type="button" className="cm-btn" disabled={!evaluation || busy} onClick={() => void runAnalysis()}>
          {busy ? 'Analyzing...' : 'Run analysis'}
        </button>
        <button
          type="button"
          className="cm-btn ghost"
          disabled={!evaluation || busy}
          onClick={() => void runAnalysis('What would invalidate this setup?')}
        >
          Invalidation
        </button>
        <button
          type="button"
          className="cm-btn ghost"
          disabled={!evaluation || busy}
          onClick={() => void runAnalysis('Critique the risk/reward and position sizing.')}
        >
          Risk check
        </button>
      </div>

      <form
        className="cm-agent-form"
        onSubmit={(e) => {
          e.preventDefault();
          const ask = question.trim();
          if (ask) void runAnalysis(ask);
        }}
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.currentTarget.value)}
          placeholder="Ask Quant AI about this setup..."
          aria-label="Ask Quant AI"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              const ask = question.trim();
              if (ask) void runAnalysis(ask);
            }
          }}
        />
        <button type="submit" disabled={busy || question.trim().length === 0}>
          Send
        </button>
      </form>
    </aside>
  );
}
