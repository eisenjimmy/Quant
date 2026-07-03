// Right panel: upcoming earnings calls for the same focus universe as the
// news feed (watched stocks + top-20 ETF holdings). Grouped by date with
// BMO/AMC session chips; ticker click opens the chart modal.

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { EarningsEvent, EarningsTime } from '../../shared/types';
import { api } from '../api';
import { useApp, useFocusSymbols } from '../store';
import {
  PanelHeader,
  PanelState,
  ResolvingNote,
  SampleChip,
  SkeletonList,
  ViaChips,
  daysFromToday,
  parseISODateLocal,
  shortDayLabel,
  useNow,
  usePolledData,
} from './center/shared';
import {
  IconAlert,
  IconCalendar,
  IconMoon,
  IconSunrise,
} from './center/icons';
import '../styles/earnings.css';

const EARNINGS_REFRESH_MS = 60 * 60_000; // hourly auto-refresh
const MAX_QUERY_SYMBOLS = 40;

// Chronological within a day: pre-market first, post-market, then TBD.
const TIME_ORDER: Record<EarningsTime, number> = {
  bmo: 0,
  amc: 1,
  unknown: 2,
};

interface DateGroup {
  date: string;
  label: string;
  countdown: string | null;
  events: EarningsEvent[];
}

function formatEps(value: number): string {
  const abs = Math.abs(value).toFixed(2);
  return value < 0 ? `-$${abs}` : `$${abs}`;
}

function formatSurprise(value: number): string {
  const pct = Math.abs(value).toFixed(1);
  if (value > 0) return `+${pct}%`;
  if (value < 0) return `-${pct}%`;
  return '0.0%';
}

function SessionChip({ time }: { time: EarningsTime }) {
  if (time === 'unknown') return null;
  const bmo = time === 'bmo';
  return (
    <span
      className="ec-session"
      title={bmo ? 'Before market open' : 'After market close'}
    >
      {bmo ? <IconSunrise size={12} /> : <IconMoon size={12} />}
      {bmo ? 'BMO' : 'AMC'}
    </span>
  );
}

function EventRow({
  event,
  parents,
}: {
  event: EarningsEvent;
  parents: Record<string, string[]>;
}) {
  const { actions } = useApp();
  const hasSub =
    event.epsEstimate !== null ||
    event.epsActual !== null ||
    (parents[event.symbol] ?? []).length > 0 ||
    event.source === 'sample';
  return (
    <li className="ec-item">
      <div className="ec-row">
        <button
          type="button"
          className="ec-sym num"
          title={`Open ${event.symbol} chart`}
          onClick={() => actions.openChart(event.symbol)}
        >
          {event.symbol}
        </button>
        <span className="ec-name" title={event.companyName}>
          {event.companyName}
        </span>
        <SessionChip time={event.time} />
      </div>
      {hasSub && (
        <div className="ec-sub">
          {event.epsEstimate !== null && (
            <span className="ec-eps">
              expected <span className="num">{formatEps(event.epsEstimate)}</span>
            </span>
          )}
          {event.epsActual !== null && event.epsActual !== undefined && (
            <span
              className="ec-eps"
              title="Latest reported EPS. Positive surprises can support valuation multiple expansion; misses can pressure the setup even if the chart looks constructive."
            >
              actual <span className="num">{formatEps(event.epsActual)}</span>
            </span>
          )}
          {event.epsSurprisePercent !== null && event.epsSurprisePercent !== undefined && (
            <span className={`ec-surprise ${event.epsSurprisePercent >= 0 ? 'up' : 'down'} num`}>
              {formatSurprise(event.epsSurprisePercent)}
            </span>
          )}
          <ViaChips symbol={event.symbol} parents={parents} />
          {event.source === 'sample' && <SampleChip />}
        </div>
      )}
    </li>
  );
}

export function EarningsCalendar() {
  const { state } = useApp();
  const { symbols, parents, ready } = useFocusSymbols();
  const now = useNow(60_000);

  const querySymbols = useMemo(
    () => symbols.slice(0, MAX_QUERY_SYMBOLS),
    [symbols],
  );
  const symbolKey = querySymbols.join(',');
  const enabled = ready && querySymbols.length > 0;

  const { data, loading, refreshing, error, updatedAt, refresh } =
    usePolledData<EarningsEvent[]>(
      symbolKey,
      enabled,
      EARNINGS_REFRESH_MS,
      () => api.getEarnings(querySymbols),
    );

  const groups = useMemo<DateGroup[]>(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const sorted = data
      .filter((ev) => {
        const id = `${ev.symbol}|${ev.date}`;
        if (seen.has(id)) return false;
        seen.add(id);
        // Only "next calls": drop events already in the past.
        return daysFromToday(parseISODateLocal(ev.date), now) >= 0;
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          TIME_ORDER[a.time] - TIME_ORDER[b.time] ||
          a.symbol.localeCompare(b.symbol),
      );
    const out: DateGroup[] = [];
    for (const ev of sorted) {
      const last = out[out.length - 1];
      if (last && last.date === ev.date) {
        last.events.push(ev);
        continue;
      }
      const day = parseISODateLocal(ev.date);
      const daysAway = daysFromToday(day, now);
      const label =
        daysAway === 0
          ? 'Today'
          : daysAway === 1
            ? 'Tomorrow'
            : shortDayLabel(day);
      // "in 3d" countdown for near-term groups; Today/Tomorrow already say it.
      const countdown =
        daysAway >= 2 && daysAway <= 7 ? `in ${daysAway}d` : null;
      out.push({ date: ev.date, label, countdown, events: [ev] });
    }
    return out;
  }, [data, now]);

  let body: ReactNode;
  if (!ready) {
    body = (
      <>
        {state.watchlistLoaded && <ResolvingNote />}
        <SkeletonList variant="earnings" rows={7} />
      </>
    );
  } else if (querySymbols.length === 0) {
    body = (
      <PanelState
        icon={<IconCalendar />}
        title="No symbols tracked"
        hint="Add ETFs or stocks to your watchlist to see their upcoming earnings calls."
      />
    );
  } else if (loading) {
    body = <SkeletonList variant="earnings" rows={7} />;
  } else if (error && !data) {
    body = (
      <PanelState
        kind="error"
        icon={<IconAlert />}
        title="Couldn't load earnings"
        hint="Something went wrong fetching the calendar. Check your connection and try again."
        onRetry={refresh}
      />
    );
  } else if (groups.length === 0) {
    body = (
      <PanelState
        icon={<IconCalendar />}
        title="No upcoming earnings in the next few months"
        hint="Dates appear here as companies in your universe confirm their calls."
      />
    );
  } else {
    body = groups.map((group) => (
      <section key={group.date} className="ec-group" aria-label={group.label}>
        <h3 className="cp-day">
          <span>{group.label}</span>
          {group.countdown && (
            <span className="cp-day-count num">{group.countdown}</span>
          )}
        </h3>
        <ul className="ec-list">
          {group.events.map((ev) => (
            <EventRow
              key={`${ev.symbol}|${ev.date}`}
              event={ev}
              parents={parents}
            />
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <div className="cp-panel">
      <div className="cp-chrome">
        <PanelHeader
          title="Earnings"
          caption="Next calls for tracked holdings"
          updatedAt={updatedAt}
          busy={loading || refreshing}
          onRefresh={refresh}
          refreshLabel="Refresh earnings"
        />
      </div>
      <div className="cp-body" aria-busy={loading || !ready}>
        {body}
      </div>
    </div>
  );
}
