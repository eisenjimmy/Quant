// Top bar: QUANT wordmark + caption on the left; on the right a live Eastern
// Time clock with a market open/closed indicator, a data-mode badge (LIVE when
// any quote is live, SAMPLE when all quotes are offline fallback, "—" before
// quotes arrive), and a manual quote-refresh button.
//
// Market hours are an approximation: Mon–Fri 9:30–16:00 ET. Exchange holidays
// and half days are intentionally ignored.

import '../styles/topbar.css';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';

const ET_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const ET_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

const MARKET_OPEN_MIN = 9 * 60 + 30; // 9:30 ET
const MARKET_CLOSE_MIN = 16 * 60; // 16:00 ET

/** Approximate regular session check: Mon–Fri 9:30–16:00 ET, no holidays. */
function isMarketOpen(now: Date): boolean {
  const parts = ET_PARTS.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return minutes >= MARKET_OPEN_MIN && minutes < MARKET_CLOSE_MIN;
}

function CandleGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="8" y1="3" x2="8" y2="7" />
      <rect x="5.5" y="7" width="5" height="8" rx="1" />
      <line x1="8" y1="15" x2="8" y2="21" />
      <line x1="16" y1="4" x2="16" y2="9" />
      <rect x="13.5" y="9" width="5" height="7" rx="1" />
      <line x1="16" y1="16" x2="16" y2="20" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={spinning ? 'spin' : undefined}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <polyline points="3 21 3 16 8 16" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </svg>
  );
}

type DataMode = 'live' | 'sample' | 'none';

const MODE_LABEL: Record<DataMode, string> = {
  live: 'LIVE',
  sample: 'SAMPLE',
  none: '—',
};

const MODE_TITLE: Record<DataMode, string> = {
  live: 'Streaming live quotes',
  sample: 'Offline fallback data - quotes are bundled samples',
  none: 'No quote data yet',
};

export function TopBar() {
  const { state, actions } = useApp();
  const [now, setNow] = useState(() => new Date());
  const [spinning, setSpinning] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      aliveRef.current = false;
      window.clearInterval(id);
    };
  }, []);

  const open = isMarketOpen(now);

  const quotes = Object.values(state.quotes);
  const mode: DataMode =
    quotes.length === 0
      ? 'none'
      : quotes.some((q) => q.source === 'live')
        ? 'live'
        : 'sample';

  const handleRefresh = () => {
    if (spinning) return;
    setSpinning(true);
    const started = Date.now();
    void actions.refreshQuotes().finally(() => {
      // Keep the spin visible for at least one revolution so the click
      // registers even when the IPC round trip is instant.
      const remaining = Math.max(0, 700 - (Date.now() - started));
      window.setTimeout(() => {
        if (aliveRef.current) setSpinning(false);
      }, remaining);
    });
  };

  return (
    <div className="tb">
      <div className="tb-brand">
        <span className="tb-glyph">
          <CandleGlyph />
        </span>
        <span className="tb-wordmark">QUANT</span>
      </div>
      <span className="tb-divider" aria-hidden="true" />
      <span className="tb-caption">ETF &amp; Equity Terminal</span>

      <div className="tb-right">
        <div className="tb-clock">
          <span className="tb-time num" title="Eastern Time (America/New_York)">
            {ET_TIME.format(now)} ET
          </span>
          <div
            className={`tb-market${open ? ' open' : ''}`}
            title="Approximate regular session: Mon-Fri 9:30-16:00 ET (holidays not observed)"
          >
            <span className="tb-market-dot" aria-hidden="true" />
            <span>{open ? 'Market open' : 'Market closed'}</span>
          </div>
        </div>

        <span
          className={`tb-badge ${mode}`}
          title={MODE_TITLE[mode]}
          aria-label={`Data mode: ${MODE_TITLE[mode]}`}
        >
          {MODE_LABEL[mode]}
        </span>

        <button
          type="button"
          className="tb-refresh"
          onClick={handleRefresh}
          aria-label="Refresh quotes"
          aria-busy={spinning}
          title="Refresh quotes"
        >
          <RefreshIcon spinning={spinning} />
        </button>
      </div>
    </div>
  );
}
