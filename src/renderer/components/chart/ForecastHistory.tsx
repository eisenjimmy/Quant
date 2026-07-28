import React, { useId } from 'react';
import type { ForecastSavedSummary } from '../../../shared/forecast';

function localDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ForecastHistory({
  records,
  selectedId,
  selecting,
  onSelect,
}: {
  records: ForecastSavedSummary[];
  selectedId: string;
  selecting: boolean;
  onSelect(forecastId: string): void;
}) {
  const selectId = useId();
  if (records.length === 0) return null;
  const selected =
    records.find((record) => record.id === selectedId) ?? records[0];
  return (
    <section
      className="forecast-history"
      aria-label="Saved forecast history"
      aria-busy={selecting}
    >
      <header>
        <div>
          <span>Saved forecasts</span>
          <small>
            {records.length} immutable {records.length === 1 ? 'snapshot' : 'snapshots'}
          </small>
        </div>
        {selecting && <em role="status">Loading snapshot…</em>}
      </header>
      <label htmlFor={selectId}>Forecast snapshot</label>
      <select
        id={selectId}
        value={selectedId}
        disabled={selecting}
        onChange={(event) => onSelect(event.currentTarget.value)}
      >
        {records.map((record, index) => (
          <option key={record.id} value={record.id}>
            {index === 0 ? 'Latest · ' : ''}
            {localDate(record.generatedAt)} · expires {localDate(record.expiresAt)}
          </option>
        ))}
      </select>
      <div className="forecast-history-dates">
        <span>
          Generated <time dateTime={selected.generatedAt}>{localDate(selected.generatedAt)}</time>
        </span>
        <span>
          Expires <time dateTime={selected.expiresAt}>{localDate(selected.expiresAt)}</time>
        </span>
      </div>
      <p>Reruns are saved as separate snapshots; earlier values are never overwritten.</p>
    </section>
  );
}
