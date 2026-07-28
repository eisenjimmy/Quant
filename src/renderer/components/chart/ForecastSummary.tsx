import React from 'react';
import type { ForecastRecord } from '../../../shared/forecast';
import {
  formatForecastPrice,
  formatForecastRatio,
} from './forecastViewModel';

function localDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ForecastSummary({ record }: { record: ForecastRecord }) {
  const finalPoint = record.aggregate[record.aggregate.length - 1];
  const modelLabel = record.provenance.modelId.split('/').at(-1) ?? record.provenance.modelId;
  return (
    <section className="forecast-summary" aria-label="Forecast summary">
      {record.provenance.mode === 'development-mock' && (
        <div className="forecast-mock-notice">
          <strong>Development mock</strong>
          <span>Synthetic paths for UI validation only. This is not a market forecast.</span>
        </div>
      )}
      <dl className="forecast-metrics">
        <div>
          <dt>Sampled upside frequency</dt>
          <dd className="num">
            {formatForecastRatio(record.metrics.sampledUpsideFrequency)}
          </dd>
        </div>
        <div>
          <dt>Median predicted return</dt>
          <dd className="num">
            {formatForecastRatio(record.metrics.medianPredictedReturn, true)}
          </dd>
        </div>
        <div>
          <dt>P10–P90 final range</dt>
          <dd className="num">
            {formatForecastPrice(finalPoint.p10)}–{formatForecastPrice(finalPoint.p90)}
          </dd>
        </div>
        <div>
          <dt>Volatility amplification</dt>
          <dd className="num">
            {formatForecastRatio(record.metrics.volatilityAmplificationFrequency)}
          </dd>
        </div>
      </dl>
      <dl className="forecast-meta">
        <div><dt>Paths</dt><dd className="num">{record.provenance.pathCount}</dd></div>
        <div><dt>Model</dt><dd>{modelLabel}</dd></div>
        <div><dt>Generated</dt><dd>{localDate(record.generatedAt)}</dd></div>
        <div><dt>Expires</dt><dd>{localDate(record.expiresAt)}</dd></div>
      </dl>
    </section>
  );
}
