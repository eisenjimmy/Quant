import type { QuantInsightRequest, QuantInsightResponse } from '../../shared/types';
import { getLlmSettings } from './llmSettings';

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function isReady(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

function compactRequest(req: QuantInsightRequest): string {
  const e = req.evaluation;
  const news = req.news
    .slice(0, 8)
    .map((item) => `- [${item.relatedSymbol}] ${item.title} (${item.sourceName}, ${item.publishedAt})`)
    .join('\n');
  const components = e.components
    .map((c) => `- ${c.name}: ${c.status}, ${c.score >= 0 ? '+' : ''}${c.score}. ${c.explanation}`)
    .join('\n');
  const earnings = req.earnings
    ? `- Upcoming date: ${req.earnings.date} ${req.earnings.time}
- Analyst expected EPS: ${req.earnings.epsEstimate ?? 'n/a'}
- Latest actual EPS: ${req.earnings.epsActual ?? 'n/a'}
- Latest surprise: ${req.earnings.epsSurprisePercent ?? 'n/a'}%
- Latest reported date: ${req.earnings.latestReportedDate ?? 'n/a'}`
    : '- none';
  const valuation = req.valuation
    ? `- Price: ${req.valuation.price ?? 'n/a'}
- Market cap: ${req.valuation.marketCap ?? 'n/a'}
- Revenue: ${req.valuation.totalRevenue ?? 'n/a'}
- Gross profit: ${req.valuation.grossProfit ?? 'n/a'}
- EBITDA: ${req.valuation.ebitda ?? 'n/a'}
- Net income: ${req.valuation.netIncomeToCommon ?? 'n/a'}
- Profit margin: ${req.valuation.profitMargin ?? 'n/a'}
- Revenue growth: ${req.valuation.revenueGrowth ?? 'n/a'}
- P/E: ${req.valuation.trailingPe ?? 'n/a'}
- Forward P/E: ${req.valuation.forwardPe ?? 'n/a'}
- P/S: ${req.valuation.priceToSales ?? 'n/a'}
- EV/Revenue: ${req.valuation.enterpriseToRevenue ?? 'n/a'}
- EV/EBITDA: ${req.valuation.enterpriseToEbitda ?? 'n/a'}
- Formula estimates:
${req.valuation.estimates.map((x) => `  - ${x.label}: fair value ${x.fairValue ?? 'n/a'}, upside ${x.upsidePercent ?? 'n/a'}%, formula: ${x.formula}`).join('\n')}`
    : '- none';
  const macro = req.macroOverlays?.length
    ? req.macroOverlays
        .map((series) => {
          const last = series.points[series.points.length - 1];
          return `- ${series.label}: ${last ? `${last.value} ${series.unit}` : 'n/a'} (${series.sourceName})`;
        })
        .join('\n')
    : '- no active macro overlays';
  return `
Symbol: ${req.symbol}
Range: ${req.range}
Question: ${req.question ?? 'Analyze the current setup and explain the best decision.'}
Snapshot captured: ${req.snapshotDataUrl ? 'yes' : 'no'}

Signal:
- Decision: ${e.decision}
- Setup: ${e.setupType}
- Regime: ${e.regime}
- Confidence: ${e.confidence}/100
- Reason: ${e.reason}
- No-trade reasons: ${e.noTradeReasons.join('; ') || 'none'}

Risk plan:
- Direction: ${e.risk.direction}
- Entry: ${e.risk.entry}
- Stop: ${e.risk.stop}
- Target 1: ${e.risk.target1}
- Target 2: ${e.risk.target2}
- R/R target 1: ${e.risk.rewardRisk1}
- Position size: ${e.risk.positionSize}
- Max loss: ${e.risk.maxDollarLoss}

Analytics:
- Last close: ${e.analytics.lastClose}
- Change: ${e.analytics.changePercent}%
- SMA20: ${e.analytics.sma20 ?? 'n/a'}
- SMA50: ${e.analytics.sma50 ?? 'n/a'}
- ATR14: ${e.analytics.atr14 ?? 'n/a'} (${e.analytics.atrPercent ?? 'n/a'}%)
- Volume ratio: ${e.analytics.volumeRatio ?? 'n/a'}
- Support: ${e.analytics.support ?? 'n/a'}
- Resistance: ${e.analytics.resistance ?? 'n/a'}

Backtest summary:
- Strategy: ${e.backtest.strategyName} ${e.backtest.strategyVersion}
- Trades: ${e.backtest.totalTrades}
- Win rate: ${e.backtest.winRate}%
- Expectancy: ${e.backtest.expectancy}R
- Profit factor: ${e.backtest.profitFactor}
- Max drawdown: ${e.backtest.maxDrawdown}R

Components:
${components}

Earnings context:
${earnings}

Valuation context:
${valuation}

Macro overlays active on chart:
${macro}

Recent scraped news:
${news || '- none'}
`.trim();
}

function deterministicFallback(req: QuantInsightRequest, error?: string): QuantInsightResponse {
  const e = req.evaluation;
  const lines = [
    `### Quant memo: ${e.decision.replaceAll('-', ' ')}`,
    ``,
    `- **Setup:** ${e.setupType.replaceAll('-', ' ')}`,
    `- **Regime:** ${e.regime.replaceAll('-', ' ')}`,
    `- **Confidence:** ${e.confidence}/100`,
    `- **Risk plan:** entry \`${e.risk.entry}\`, stop \`${e.risk.stop}\`, target 1 \`${e.risk.target1}\`, target 2 \`${e.risk.target2}\``,
    `- **Position:** ${e.risk.positionSize} units, max loss \`${e.risk.maxDollarLoss}\`, target 1 reward \`${e.risk.rewardRisk1}R\``,
  ];
  if (e.noTradeReasons.length) {
    lines.push(`- **Primary blocker:** ${e.noTradeReasons[0]}`);
  } else {
    lines.push(`- **Action:** ${e.reason}`);
  }
  const strongest = [...e.components].sort((a, b) => b.score - a.score)[0];
  const weakest = [...e.components].sort((a, b) => a.score - b.score)[0];
  if (strongest) lines.push(`- **Best evidence:** ${strongest.name} - ${strongest.explanation}`);
  if (weakest && weakest.score < 0) lines.push(`- **Risk evidence:** ${weakest.name} - ${weakest.explanation}`);
  if (error) lines.push(`\n_Local LLM note: ${error}_`);
  return {
    ok: false,
    source: 'deterministic-fallback',
    answer: lines.join('\n'),
    generatedAt: new Date().toISOString(),
    error,
  };
}

export async function analyzeQuant(req: QuantInsightRequest): Promise<QuantInsightResponse> {
  const settings = getLlmSettings();
  if (!settings.enabled) {
    return deterministicFallback(
      req,
      'Local LLM is disabled. Enable it in onboarding or set QUANT_LLM_ENABLED=1 and QUANT_LLM_BASE_URL to use an OpenAI-compatible local server.',
    );
  }

  try {
    if (!(await isReady(settings.baseUrl))) {
      return deterministicFallback(req, 'Local LLM server is not ready.');
    }

    const prompt = compactRequest(req);
    const res = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(28_000),
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content:
              'You are QuantDesk, a strict personal quant trading assistant for the Quant app. Think like a senior quant trader and risk manager. Explain signals in disciplined trading language. Separate setup, evidence, invalidation, risk, and action. Do not give certainty, do not hype, do not recommend oversized trades, and do not ignore no-trade blockers. Return concise GitHub-flavored Markdown with headings, bullets, bold labels, and inline code for exact prices.',
          },
          {
            role: 'user',
            content: req.thinkingMode
              ? `Use thinking mode internally, then provide only the concise final decision memo.\n\n${prompt}`
              : prompt,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const json = (await res.json()) as ChatResponse;
    const answer = json.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('LLM returned an empty answer');
    return {
      ok: true,
      source: 'local-llm',
      model: settings.model,
      answer,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Local LLM request failed.';
    return deterministicFallback(req, message);
  }
}
