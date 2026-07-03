// Watchlist sidebar: AddSymbol search on top, then ETF and stock sections
// (alphabetical, with live quotes), and a footer with tracked counts.
// Skeleton rows while the persisted watchlist loads; a helpful empty state
// when nothing is tracked yet.

import '../styles/watchlist.css';
import React, { useCallback, useMemo } from 'react';
import type { HoldingsResult, Quote, WatchlistItem } from '../../shared/types';
import { useApp } from '../store';
import { AddSymbol } from './watchlist/AddSymbol';
import { WatchlistRow } from './watchlist/WatchlistRow';

function bySymbol(a: WatchlistItem, b: WatchlistItem): number {
  return a.symbol.localeCompare(b.symbol);
}

function EmptyIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h9" />
      <path d="M4 12h9" />
      <path d="M4 18h5" />
      <path d="M17 14v6" />
      <path d="M14 17h6" />
    </svg>
  );
}

interface SectionProps {
  label: string;
  items: WatchlistItem[];
  quotes: Record<string, Quote>;
  holdings: Record<string, HoldingsResult>;
  onOpen: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}

function Section({ label, items, quotes, holdings, onOpen, onRemove }: SectionProps) {
  if (items.length === 0) return null;
  return (
    <section className="wl-section">
      <h2 className="wl-section-h">
        {label}
        <span className="wl-count num">{items.length}</span>
      </h2>
      <ul className="wl-rows">
        {items.map((item) => (
          <WatchlistRow
            key={item.symbol}
            item={item}
            quote={quotes[item.symbol]}
            holdings={item.type === 'etf' ? holdings[item.symbol] : undefined}
            onOpen={onOpen}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
}

function SkeletonRows() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="wl-skel-row" key={i}>
          <div className="wl-skel-left">
            <span className="skeleton wl-skel-sym" />
            <span className="skeleton wl-skel-name" />
          </div>
          <div className="wl-skel-right">
            <span className="skeleton wl-skel-price" />
            <span className="skeleton wl-skel-chip" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Movers({
  items,
  quotes,
  onOpen,
}: {
  items: WatchlistItem[];
  quotes: Record<string, Quote>;
  onOpen: (symbol: string) => void;
}) {
  const movers = items
    .map((item) => ({ item, quote: quotes[item.symbol] }))
    .filter((row) => row.quote?.changePercent !== null && row.quote?.changePercent !== undefined)
    .sort((a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0));
  if (movers.length < 2) return null;
  const top = movers.slice(0, 3);
  const bottom = [...movers].reverse().slice(0, 3);
  const row = (entry: (typeof movers)[number], kind: 'up' | 'down') => (
    <button
      key={`${kind}-${entry.item.symbol}`}
      type="button"
      className={`wl-mover ${kind}`}
      onClick={() => onOpen(entry.item.symbol)}
      title={`Open ${entry.item.symbol} chart`}
    >
      <span className="num">{entry.item.symbol}</span>
      <b className="num">
        {(entry.quote?.changePercent ?? 0) >= 0 ? '+' : ''}
        {(entry.quote?.changePercent ?? 0).toFixed(2)}%
      </b>
    </button>
  );
  return (
    <section className="wl-movers" aria-label="Daily movers">
      <h2 className="wl-section-h">Daily movers</h2>
      <div className="wl-mover-grid">
        <div>
          <span className="wl-mover-label">Highest</span>
          {top.map((entry) => row(entry, 'up'))}
        </div>
        <div>
          <span className="wl-mover-label">Lowest</span>
          {bottom.map((entry) => row(entry, 'down'))}
        </div>
      </div>
    </section>
  );
}

export function Watchlist() {
  const { state, actions } = useApp();

  const etfs = useMemo(
    () => state.watchlist.filter((i) => i.type === 'etf').sort(bySymbol),
    [state.watchlist],
  );
  const stocks = useMemo(
    () => state.watchlist.filter((i) => i.type === 'stock').sort(bySymbol),
    [state.watchlist],
  );

  const onOpen = useCallback(
    (symbol: string) => actions.openChart(symbol),
    [actions],
  );
  const onRemove = useCallback(
    (symbol: string) => {
      void actions.removeSymbol(symbol);
    },
    [actions],
  );

  return (
    <div className="wl">
      <AddSymbol />

      <div className="wl-scroll">
        {!state.watchlistLoaded ? (
          <SkeletonRows />
        ) : state.watchlist.length === 0 ? (
          <div className="wl-empty">
            <EmptyIcon />
            <span className="wl-empty-title">Your watchlist is empty</span>
            <span className="wl-empty-sub">
              Search above to add ETFs or stocks.
            </span>
          </div>
        ) : (
          <>
            <Movers
              items={state.watchlist}
              quotes={state.quotes}
              onOpen={onOpen}
            />
            <Section
              label="ETFs"
              items={etfs}
              quotes={state.quotes}
              holdings={state.holdings}
              onOpen={onOpen}
              onRemove={onRemove}
            />
            <Section
              label="Stocks"
              items={stocks}
              quotes={state.quotes}
              holdings={state.holdings}
              onOpen={onOpen}
              onRemove={onRemove}
            />
          </>
        )}
      </div>

      <div className="wl-footer">
        {state.watchlistLoaded ? (
          <>
            <span className="num">{etfs.length}</span>{' '}
            {etfs.length === 1 ? 'ETF' : 'ETFs'} ·{' '}
            <span className="num">{stocks.length}</span>{' '}
            {stocks.length === 1 ? 'stock' : 'stocks'} tracked
          </>
        ) : (
          'Loading watchlist…'
        )}
      </div>
    </div>
  );
}
