// One watchlist row: a normal click opens the chart, a completed drag reorders
// the row, and right-click delegates to the watchlist's one-action menu.

import '../../styles/watchlist.css';
import React, { memo, useEffect, useRef, useState } from 'react';
import type { HoldingsResult, Quote, WatchlistItem } from '../../../shared/types';

interface WatchlistRowProps {
  item: WatchlistItem;
  quote: Quote | undefined;
  holdings: HoldingsResult | undefined;
  onOpen: (symbol: string) => void;
  isDragging: boolean;
  dropPosition: 'before' | 'after' | null;
  onContextMenu: (
    symbol: string,
    x: number,
    y: number,
    trigger: HTMLElement,
  ) => void;
  onPointerDragStart: (symbol: string) => void;
  onPointerDragMove: (x: number, y: number) => void;
  onPointerDragEnd: () => void;
  onKeyboardMove: (symbol: string, direction: -1 | 1) => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Humanize a holdings snapshot date ("2026-07-02" → "Jul 2",
 *  "2026-07" → "Jul 2026"). Falls back to the raw string. */
function formatAsOf(asOf: string): string {
  const [y, m, d] = asOf.split('-').map(Number);
  if (!y || !m) return asOf;
  if (!d) {
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Signed percent text + chip variant. Sign is always explicit ("+"/"−") so
 *  the direction never relies on color alone. */
function changeChip(quote: Quote | undefined): { text: string; variant: string } {
  if (!quote || quote.changePercent == null) return { text: '—', variant: 'flat' };
  const pct = quote.changePercent;
  const abs = Math.abs(pct).toFixed(2);
  if (pct > 0) return { text: `+${abs}%`, variant: 'up' };
  if (pct < 0) return { text: `−${abs}%`, variant: 'down' };
  return { text: '0.00%', variant: 'flat' };
}

interface Flash {
  dir: 'up' | 'down';
  key: number;
}

export const WatchlistRow = memo(function WatchlistRow({
  item,
  quote,
  holdings,
  onOpen,
  isDragging,
  dropPosition,
  onContextMenu,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onKeyboardMove,
}: WatchlistRowProps) {
  const price = quote?.price ?? null;
  const suppressOpenRef = useRef(false);
  const pointerDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    started: boolean;
  } | null>(null);

  // Flash the price cell when the value moves between renders. The ref keeps
  // the previous price; the incrementing key remounts the span so the CSS
  // animation restarts even during an in-flight pulse.
  const prevPriceRef = useRef<number | null>(price);
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    const prev = prevPriceRef.current;
    prevPriceRef.current = price;
    if (price == null || prev == null || price === prev) return;
    const dir: Flash['dir'] = price > prev ? 'up' : 'down';
    setFlash((f) => ({ dir, key: (f?.key ?? 0) + 1 }));
  }, [price]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const chip = changeChip(quote);
  const isSample = quote?.source === 'sample';

  return (
    <li
      className={`wl-row-wrap${isDragging ? ' is-dragging' : ''}${
        dropPosition ? ` drop-${dropPosition}` : ''
      }`}
      data-testid={`watchlist-row-${item.symbol}`}
      data-watchlist-symbol={item.symbol}
    >
      <button
        type="button"
        className="wl-row"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          pointerDragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            started: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = pointerDragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          if (
            !drag.started &&
            Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 6
          ) {
            drag.started = true;
            suppressOpenRef.current = true;
            onPointerDragStart(item.symbol);
          }
          if (!drag.started) return;
          event.preventDefault();
          onPointerDragMove(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          const drag = pointerDragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          pointerDragRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          if (!drag.started) return;
          event.preventDefault();
          onPointerDragEnd();
          window.setTimeout(() => {
            suppressOpenRef.current = false;
          }, 0);
        }}
        onPointerCancel={(event) => {
          const drag = pointerDragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          pointerDragRef.current = null;
          if (drag.started) onPointerDragEnd();
          suppressOpenRef.current = false;
        }}
        onClick={() => {
          if (suppressOpenRef.current) return;
          onOpen(item.symbol);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          onContextMenu(
            item.symbol,
            event.clientX || rect.left + 24,
            event.clientY || rect.top + rect.height / 2,
            event.currentTarget,
          );
        }}
        onKeyDown={(event) => {
          if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
          event.preventDefault();
          onKeyboardMove(item.symbol, event.key === 'ArrowUp' ? -1 : 1);
        }}
        aria-describedby="wl-reorder-help"
        title={`Open ${item.symbol}. Drag to reorder or right-click to delete.`}
      >
        <span className="wl-row-main">
          <span className="wl-sym-line">
            <span className="wl-sym num">{item.symbol}</span>
            {isSample && (
              <span className="wl-sample-chip" title="Sample data">
                S
              </span>
            )}
          </span>
          <span className="wl-name">{item.name}</span>
          {item.type === 'etf' && holdings && (
            <span className="wl-meta">
              Top 20 holdings · as of {formatAsOf(holdings.asOf)}
            </span>
          )}
        </span>
        <span className="wl-row-quote">
          <span
            key={flash?.key ?? 0}
            className={`wl-price num${price == null ? ' wl-price-missing' : ''}${
              flash ? ` wl-flash-${flash.dir}` : ''
            }`}
          >
            {price != null ? formatPrice(price) : '—'}
          </span>
          <span className={`wl-chip num wl-chip-${chip.variant}`}>{chip.text}</span>
        </span>
      </button>
    </li>
  );
});
