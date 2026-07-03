import type { EarningsEvent, ValuationSnapshot } from '../../../shared/types';
import type { SignalEvaluation } from '../../../shared/quant';

function label(value: string): string {
  return value.replaceAll('-', ' ');
}

function fmt(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

function fmtMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  const abs = Math.abs(value).toFixed(2);
  return value < 0 ? `-$${abs}` : `$${abs}`;
}

export function QuantDecisionPanel({
  evaluation,
  earnings,
  valuation,
}: {
  evaluation: SignalEvaluation | null;
  earnings: EarningsEvent | null;
  valuation: ValuationSnapshot | null;
}) {
  if (!evaluation) {
    return (
      <aside className="cm-quant" aria-label="Quant signal">
        <div className="cm-quant-head">
          <h3>Signal Desk</h3>
          <p>Waiting for candles.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="cm-quant" aria-label="Quant signal">
      <div className="cm-quant-head">
        <div>
          <h3>Signal Desk</h3>
          <p>{evaluation.strategyVersion}</p>
        </div>
        <span className={`cm-decision ${evaluation.decision}`}>{label(evaluation.decision)}</span>
      </div>

      <div
        className="cm-score-row"
        title="Signal score is an explainable 0-100 quality score. Higher means more explicit rule evidence supports the trade setup. It is not a probability of profit. Penalties come from blockers such as weak volume, poor reward/risk, choppy regime, or price too close to support/resistance."
      >
        <div>
          <span className="cm-score num">{evaluation.confidence}</span>
          <span className="cm-score-max">/100</span>
        </div>
        <div className="cm-score-meta">
          <span>{label(evaluation.setupType)}</span>
          <span>{label(evaluation.regime)}</span>
        </div>
      </div>

      <p className="cm-signal-reason">{evaluation.reason}</p>

      <div className="cm-risk-grid">
        <div><span>Entry</span><b className="num">{fmt(evaluation.risk.entry)}</b></div>
        <div><span>Stop</span><b className="num">{fmt(evaluation.risk.stop)}</b></div>
        <div><span>Target 1</span><b className="num">{fmt(evaluation.risk.target1)}</b></div>
        <div><span>Target 2</span><b className="num">{fmt(evaluation.risk.target2)}</b></div>
        <div><span>R/R</span><b className="num">{fmt(evaluation.risk.rewardRisk1)}R</b></div>
        <div><span>Size</span><b className="num">{evaluation.risk.positionSize}</b></div>
      </div>

      {evaluation.noTradeReasons.length > 0 && (
        <div className="cm-blockers">
          <span>No-trade blockers</span>
          <ul>
            {evaluation.noTradeReasons.slice(0, 4).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="cm-components">
        {evaluation.components.map((component) => (
          <div key={component.name} className={`cm-component ${component.status}`}>
            <div>
              <span>{component.name}</span>
              <p>{component.explanation}</p>
            </div>
            <b className="num">{component.score >= 0 ? '+' : ''}{component.score}</b>
          </div>
        ))}
      </div>

      <div className="cm-analytics">
        <span>Analytics</span>
        <div>
          <b>ATR</b><em className="num">{evaluation.analytics.atr14 ?? 'n/a'}</em>
          <b>Vol</b><em className="num">{evaluation.analytics.volumeRatio ?? 'n/a'}x</em>
          <b>BT win</b><em className="num">{evaluation.backtest.winRate}%</em>
          <b>Exp</b><em className="num">{evaluation.backtest.expectancy}R</em>
        </div>
      </div>

      {valuation && (
        <div className="cm-valuation">
          <span>Valuation</span>
          <div className="cm-valuation-grid">
            <b>P/E</b><em className="num">{valuation.trailingPe ?? 'n/a'}</em>
            <b>P/S</b><em className="num">{valuation.priceToSales ?? 'n/a'}</em>
            <b>Margin</b>
            <em className="num">
              {valuation.profitMargin !== null ? `${(valuation.profitMargin * 100).toFixed(1)}%` : 'n/a'}
            </em>
            <b>Rev growth</b>
            <em className="num">
              {valuation.revenueGrowth !== null ? `${(valuation.revenueGrowth * 100).toFixed(1)}%` : 'n/a'}
            </em>
          </div>
          <ul>
            {valuation.estimates.slice(0, 3).map((estimate) => (
              <li key={estimate.label}>
                <strong>{estimate.label}</strong>
                <span className="num">
                  {estimate.fairValue !== null ? `$${estimate.fairValue.toFixed(2)}` : 'n/a'}
                  {estimate.upsidePercent !== null ? ` (${estimate.upsidePercent > 0 ? '+' : ''}${estimate.upsidePercent.toFixed(1)}%)` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {earnings && (
        <div className="cm-earnings-context">
          <span>Earnings factor</span>
          <p>
            Expected EPS <b className="num">{fmtMoney(earnings.epsEstimate)}</b>
            {earnings.epsActual !== null && earnings.epsActual !== undefined && (
              <>
                {' '}vs latest actual <b className="num">{fmtMoney(earnings.epsActual)}</b>
              </>
            )}
            {earnings.epsSurprisePercent !== null && earnings.epsSurprisePercent !== undefined && (
              <>
                {' '}(<b className={earnings.epsSurprisePercent >= 0 ? 'up num' : 'down num'}>
                  {earnings.epsSurprisePercent > 0 ? '+' : ''}
                  {earnings.epsSurprisePercent.toFixed(1)}%
                </b> surprise)
              </>
            )}
            .
          </p>
          <em>
            Earnings beats can support multiple expansion; misses can invalidate a chart setup even before price breaks the stop.
          </em>
        </div>
      )}
    </aside>
  );
}
