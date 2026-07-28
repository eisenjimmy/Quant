// Watchlist sidebar: AddSymbol search on top, then persisted, reorderable ETF
// and stock sections with live quotes, and a footer with tracked counts.
// Skeleton rows while the persisted watchlist loads; a helpful empty state
// when nothing is tracked yet.

import '../styles/watchlist.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { HoldingsResult, Quote, WatchlistItem } from '../../shared/types';
import {
  moveWatchlistItem,
  type WatchlistDropPosition,
} from '../../shared/watchlist';
import { useApp } from '../store';
import { AddSymbol } from './watchlist/AddSymbol';
import { WatchlistRow } from './watchlist/WatchlistRow';

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
  draggingSymbol: string | null;
  dropTarget: { symbol: string; position: WatchlistDropPosition } | null;
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

function Section({
  label,
  items,
  quotes,
  holdings,
  onOpen,
  draggingSymbol,
  dropTarget,
  onContextMenu,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onKeyboardMove,
}: SectionProps) {
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
            isDragging={draggingSymbol === item.symbol}
            dropPosition={
              dropTarget?.symbol === item.symbol ? dropTarget.position : null
            }
            onContextMenu={onContextMenu}
            onPointerDragStart={onPointerDragStart}
            onPointerDragMove={onPointerDragMove}
            onPointerDragEnd={onPointerDragEnd}
            onKeyboardMove={onKeyboardMove}
          />
        ))}
      </ul>
    </section>
  );
}

interface ContextMenuState {
  symbol: string;
  x: number;
  y: number;
  trigger: HTMLElement;
}

function WatchlistContextMenu({
  menu,
  onClose,
  onDelete,
}: {
  menu: ContextMenuState;
  onClose: (restoreFocus?: boolean) => void;
  onDelete: (symbol: string) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
    const closeFromPointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.wl-context-menu')) return;
      onClose();
    };
    const closeFromKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose(true);
    };
    const close = () => onClose();
    window.addEventListener('pointerdown', closeFromPointer, true);
    window.addEventListener('keydown', closeFromKey, true);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('pointerdown', closeFromPointer, true);
      window.removeEventListener('keydown', closeFromKey, true);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
    };
  }, [onClose]);

  return (
    <div
      className="wl-context-menu"
      role="menu"
      aria-label={`${menu.symbol} actions`}
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        ref={buttonRef}
        type="button"
        role="menuitem"
        className="wl-context-delete"
        onClick={() => onDelete(menu.symbol)}
      >
        Delete
      </button>
    </div>
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
  const [draggingSymbol, setDraggingSymbol] = useState<string | null>(null);
  const draggingSymbolRef = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    symbol: string;
    position: WatchlistDropPosition;
  } | null>(null);
  const dropTargetRef = useRef<{
    symbol: string;
    position: WatchlistDropPosition;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const etfs = useMemo(
    () => state.watchlist.filter((i) => i.type === 'etf'),
    [state.watchlist],
  );
  const stocks = useMemo(
    () => state.watchlist.filter((i) => i.type === 'stock'),
    [state.watchlist],
  );
  const displayedItems = useMemo(() => [...etfs, ...stocks], [etfs, stocks]);

  const onOpen = useCallback(
    (symbol: string) => actions.openChart(symbol),
    [actions],
  );
  const onRemove = useCallback(
    (symbol: string) => {
      setContextMenu(null);
      setAnnouncement(`${symbol} deleted from the watchlist.`);
      void actions.removeSymbol(symbol);
    },
    [actions],
  );
  const closeContextMenu = useCallback((restoreFocus = false) => {
    setContextMenu((current) => {
      if (restoreFocus) current?.trigger.focus();
      return null;
    });
  }, []);
  const openContextMenu = useCallback(
    (symbol: string, x: number, y: number, trigger: HTMLElement) => {
      const menuWidth = 148;
      const menuHeight = 44;
      setContextMenu({
        symbol,
        x: Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8)),
        y: Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8)),
        trigger,
      });
    },
    [],
  );
  const persistMove = useCallback(
    (
      sourceSymbol: string,
      targetSymbol: string,
      position: WatchlistDropPosition,
    ) => {
      const next = moveWatchlistItem(
        displayedItems,
        sourceSymbol,
        targetSymbol,
        position,
      );
      if (!next) return;
      setAnnouncement(`${sourceSymbol} moved ${position} ${targetSymbol}.`);
      void actions.reorderSymbols(next.map((item) => item.symbol));
    },
    [actions, displayedItems],
  );
  const onPointerDragStart = useCallback(
    (symbol: string) => {
      draggingSymbolRef.current = symbol;
      setDraggingSymbol(symbol);
      setContextMenu(null);
    },
    [],
  );
  const onPointerDragMove = useCallback(
    (x: number, y: number) => {
      const sourceSymbol = draggingSymbolRef.current;
      if (!sourceSymbol) return;
      const scrollArea = document.querySelector<HTMLElement>('.wl-scroll');
      if (scrollArea) {
        const scrollRect = scrollArea.getBoundingClientRect();
        if (y < scrollRect.top + 32) scrollArea.scrollTop -= 12;
        if (y > scrollRect.bottom - 32) scrollArea.scrollTop += 12;
      }
      const targetRow = document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>('[data-watchlist-symbol]');
      const targetSymbol = targetRow?.dataset.watchlistSymbol;
      if (!targetSymbol || sourceSymbol === targetSymbol) {
        dropTargetRef.current = null;
        setDropTarget(null);
        return;
      }
      const source = displayedItems.find((item) => item.symbol === sourceSymbol);
      const target = displayedItems.find((item) => item.symbol === targetSymbol);
      if (!source || !target || source.type !== target.type) {
        dropTargetRef.current = null;
        setDropTarget(null);
        return;
      }
      const rect = targetRow.getBoundingClientRect();
      const position: WatchlistDropPosition =
        y < rect.top + rect.height / 2 ? 'before' : 'after';
      const nextTarget = { symbol: targetSymbol, position };
      dropTargetRef.current = nextTarget;
      setDropTarget(nextTarget);
    },
    [displayedItems],
  );
  const resetDrag = useCallback(() => {
    draggingSymbolRef.current = null;
    dropTargetRef.current = null;
    setDraggingSymbol(null);
    setDropTarget(null);
  }, []);
  const onPointerDragEnd = useCallback(
    () => {
      const sourceSymbol = draggingSymbolRef.current;
      const currentTarget = dropTargetRef.current;
      if (sourceSymbol && currentTarget) {
        persistMove(sourceSymbol, currentTarget.symbol, currentTarget.position);
      }
      resetDrag();
    },
    [persistMove, resetDrag],
  );
  const onKeyboardMove = useCallback(
    (symbol: string, direction: -1 | 1) => {
      const item = displayedItems.find((candidate) => candidate.symbol === symbol);
      if (!item) return;
      const section = displayedItems.filter((candidate) => candidate.type === item.type);
      const index = section.findIndex((candidate) => candidate.symbol === symbol);
      const target = section[index + direction];
      if (!target) return;
      persistMove(symbol, target.symbol, direction < 0 ? 'before' : 'after');
    },
    [displayedItems, persistMove],
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
              draggingSymbol={draggingSymbol}
              dropTarget={dropTarget}
              onContextMenu={openContextMenu}
              onPointerDragStart={onPointerDragStart}
              onPointerDragMove={onPointerDragMove}
              onPointerDragEnd={onPointerDragEnd}
              onKeyboardMove={onKeyboardMove}
            />
            <Section
              label="Stocks"
              items={stocks}
              quotes={state.quotes}
              holdings={state.holdings}
              onOpen={onOpen}
              draggingSymbol={draggingSymbol}
              dropTarget={dropTarget}
              onContextMenu={openContextMenu}
              onPointerDragStart={onPointerDragStart}
              onPointerDragMove={onPointerDragMove}
              onPointerDragEnd={onPointerDragEnd}
              onKeyboardMove={onKeyboardMove}
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
      <span id="wl-reorder-help" className="sr-only">
        Drag to reorder. Right-click for actions. Press Alt plus Up or Down Arrow
        to reorder with the keyboard.
      </span>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      {contextMenu &&
        createPortal(
          <WatchlistContextMenu
            menu={contextMenu}
            onClose={closeContextMenu}
            onDelete={onRemove}
          />,
          document.body,
        )}
    </div>
  );
}
