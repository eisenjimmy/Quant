// Right-hand panel of the chart modal: "News at key points". Renders after
// the chart is on screen — a spinner row stays pinned at the top while ANY
// pivot-news request is outstanding and resolved groups fill in beneath it,
// always in pivot (time) order. Hovering a group highlights its chart marker;
// clicking the group header centres the chart on that pivot.

import React from 'react';
import type { PivotNewsGroup } from './usePivotNews';
import { api } from '../../api';
import { NewsPreview } from '../NewsPreview';
import { formatCandleTime, formatNewsDate, formatPrice } from './format';

const ARTICLES_PER_PIVOT = 4;

interface PivotNewsPanelProps {
  groups: PivotNewsGroup[];
  pending: boolean;
  chartLoading: boolean;
  /** Chart errored or returned no candles — pivot analysis has nothing to chew. */
  chartFailed: boolean;
  pivotCount: number;
  intraday: boolean;
  onHoverPivot(index: number | null): void;
  onSelectPivot(index: number): void;
}

function NewspaperIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 3.5h9v9.5h-9a1 1 0 0 1-1-1v-8.5z" />
      <path d="M11.5 6h2v6a1 1 0 0 1-1 1h-1" />
      <path d="M4 6h5M4 8.5h5M4 11h3" />
    </svg>
  );
}

export function PivotNewsPanel({
  groups,
  pending,
  chartLoading,
  chartFailed,
  pivotCount,
  intraday,
  onHoverPivot,
  onSelectPivot,
}: PivotNewsPanelProps) {
  // Cover the one-commit gap between pivots resolving and groups initialising.
  const showSpinner = pending || (pivotCount > 0 && groups.length === 0);

  let body: React.ReactNode;
  if (chartLoading) {
    body = (
      <div className="cm-news-skeletons" aria-hidden="true">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  } else if (chartFailed) {
    body = (
      <p className="cm-news-note">
        Pivot headlines need chart data — retry the chart to analyse this
        range.
      </p>
    );
  } else if (pivotCount === 0) {
    body = (
      <div className="cm-news-empty">
        <NewspaperIcon />
        <p>No swing points detected in this range.</p>
        <p className="cm-news-hint">Try a longer range for more structure.</p>
      </div>
    );
  } else {
    body = (
      <>
        {showSpinner && (
          <div className="cm-news-pending">
            <span className="spinner" role="status" aria-label="Loading pivot news" />
            <span>Scanning headlines…</span>
          </div>
        )}
        {groups.map((group, index) =>
          group.status === 'pending' ? null : (
            <section
              key={`${group.pivot.kind}-${group.pivot.time}`}
              className="cm-group"
              onMouseEnter={() => onHoverPivot(index)}
              onMouseLeave={() => onHoverPivot(null)}
            >
              <button
                type="button"
                className="cm-group-head"
                onClick={() => onSelectPivot(index)}
                onFocus={() => onHoverPivot(index)}
                onBlur={() => onHoverPivot(null)}
                title="Center the chart on this swing"
              >
                <span className={`cm-badge ${group.pivot.kind} num`}>
                  {index + 1}
                </span>
                <span className="cm-group-kind">
                  {group.pivot.kind === 'high' ? 'Swing high' : 'Swing low'}
                </span>
                <span className="cm-group-date">
                  {formatCandleTime(group.pivot.time, intraday)}
                </span>
                <span className="cm-group-price num">
                  {formatPrice(group.pivot.price)}
                </span>
              </button>
              {group.status === 'error' ? (
                <p className="cm-group-empty">Couldn't load articles for this swing.</p>
              ) : group.items.length === 0 ? (
                <p className="cm-group-empty">No related articles found.</p>
              ) : (
                <ul className="cm-articles">
                  {group.items.slice(0, ARTICLES_PER_PIVOT).map((item) => (
                    <li key={item.id}>
                      <NewsPreview
                        url={item.url}
                        title={item.title}
                        summary={item.summary}
                        meta={`${item.sourceName} · ${formatNewsDate(item.publishedAt)}`}
                      >
                        <button
                          type="button"
                          className="cm-article"
                          onClick={() => void api.openExternal(item.url)}
                          title={item.title}
                        >
                          <span className="cm-article-title">{item.title}</span>
                          <span className="cm-article-meta">
                            {item.sourceName} · {formatNewsDate(item.publishedAt)}
                          </span>
                        </button>
                      </NewsPreview>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ),
        )}
      </>
    );
  }

  return (
    <aside className="cm-news" aria-label="News at key points">
      <div className="cm-news-head">
        <div className="cm-news-head-row">
          <h3>News at key points</h3>
          {!chartLoading && !chartFailed && pivotCount > 0 && (
            <span
              className="cm-news-count num"
              title={`${pivotCount} swing points detected in this range`}
            >
              {pivotCount} {pivotCount === 1 ? 'swing' : 'swings'}
            </span>
          )}
        </div>
        <p>Headlines published around each detected swing.</p>
      </div>
      <div className="cm-news-body">{body}</div>
    </aside>
  );
}
