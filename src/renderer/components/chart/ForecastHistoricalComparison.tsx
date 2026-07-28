import React from 'react';
import type {
  ForecastHistoricalComparison as HistoricalComparison,
} from '../../../shared/forecast';
import { formatForecastRatio } from './forecastViewModel';

function statusLabel(
  comparison: HistoricalComparison | null,
  loading: boolean,
): string {
  if (loading) return 'Checking';
  if (!comparison) return 'Unavailable';
  if (comparison.evaluation.status === 'not-started') return 'Not started';
  if (comparison.evaluation.status === 'partial') return 'Partial';
  if (comparison.evaluation.status === 'matured') return 'Matured';
  return 'Unavailable';
}

export function ForecastHistoricalComparison({
  comparison,
  loading,
  error,
}: {
  comparison: HistoricalComparison | null;
  loading: boolean;
  error: string | null;
}) {
  const evaluation = comparison?.evaluation;
  const hasMetrics =
    evaluation?.status === 'partial' || evaluation?.status === 'matured';

  return (
    <section
      className="forecast-comparison"
      aria-labelledby="forecast-comparison-title"
      aria-busy={loading}
      aria-live="polite"
      aria-atomic="true"
    >
      <header>
        <div>
          <h4 id="forecast-comparison-title">Historical comparison</h4>
          <p>Observed closes aligned to forecast timestamps.</p>
        </div>
        <span
          data-status={evaluation?.status ?? 'unavailable'}
          role="status"
        >
          {statusLabel(comparison, loading)}
        </span>
      </header>

      {loading && <p>Checking completed one-hour bars…</p>}
      {!loading && error && <p role="alert">{error}</p>}
      {!loading && !error && evaluation?.status === 'not-started' && (
        <p>Comparison begins after the first forecast bar completes.</p>
      )}
      {!loading && !error && evaluation?.status === 'unavailable' && (
        <p>Completed market bars are not available for comparison right now.</p>
      )}
      {!loading && !error && hasMetrics && (
        <>
          <p>
            <strong className="num">{evaluation.actualPointsAvailable}</strong>
            {' '}of{' '}
            <strong className="num">{evaluation.expectedPoints}</strong>
            {' '}forecast bars observed.
          </p>
          <dl>
            <div>
              <dt>Final direction</dt>
              <dd>
                {evaluation.status === 'matured'
                  ? evaluation.directionCorrect
                    ? 'Matched'
                    : 'Did not match'
                  : 'Pending'}
              </dd>
            </div>
            <div>
              <dt>Median-line abs. % error</dt>
              <dd className="num">
                {formatForecastRatio(
                  evaluation.medianAbsolutePercentageError ?? 0,
                )}
              </dd>
            </div>
            <div>
              <dt>P10–P90 coverage</dt>
              <dd className="num">
                {formatForecastRatio(evaluation.p10P90Coverage ?? 0)}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
