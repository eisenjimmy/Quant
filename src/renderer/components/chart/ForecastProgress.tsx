import React, { useEffect, useRef, useState } from 'react';
import type { ForecastProgressEvent } from '../../../shared/forecast';
import {
  createForecastEtaState,
  describeForecastEta,
  describeForecastProgress,
  updateForecastEta,
} from './forecastViewModel';

export function ForecastProgress({
  job,
  percent,
  statusText,
}: {
  job: ForecastProgressEvent | null;
  percent: number;
  statusText: string;
}) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const ringStyle = {
    '--forecast-progress': `${safePercent * 3.6}deg`,
  } as React.CSSProperties;
  const presentation = describeForecastProgress(job, statusText);
  const etaState = useRef(createForecastEtaState());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const eventTimestamp = job ? Date.parse(job.updatedAt) : Number.NaN;

  useEffect(() => {
    etaState.current = updateForecastEta(
      etaState.current,
      job,
      Number.isFinite(eventTimestamp) ? eventTimestamp : Date.now(),
    );
    setNowMs(Date.now());
  }, [eventTimestamp, job]);

  const etaText = describeForecastEta(etaState.current, job, nowMs);
  const shouldTick =
    job?.stage === 'running-paths' &&
    etaState.current.estimatedCompletionAtMs !== null;

  useEffect(() => {
    if (!shouldTick) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [job?.jobId, shouldTick]);

  return (
    <div className="forecast-progress">
      <div
        className="forecast-progress-ring"
        style={ringStyle}
        role="progressbar"
        aria-label="Overall forecast progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
        aria-valuetext={`${safePercent}% of the full forecast workflow`}
      >
        <span className="num">{safePercent}%</span>
      </div>
      <div
        role="status"
        aria-live={job?.stage === 'running-paths' ? 'off' : 'polite'}
        aria-atomic="true"
      >
        <strong>{presentation.headline}</strong>
        <span>{presentation.detail}</span>
        {etaText && (
          <span
            className="forecast-eta"
            aria-live="off"
            title="Estimate based on completed forecast path timing"
          >
            <b>ETA</b>
            {etaText}
          </span>
        )}
      </div>
    </div>
  );
}
