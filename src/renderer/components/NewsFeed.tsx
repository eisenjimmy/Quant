// Center panel: market news driven by the top-20 holdings of each watched
// ETF plus watched stocks directly. Filter chips narrow the universe via
// the global newsFilter; data flows exclusively through api.getNews.

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { NewsItem } from '../../shared/types';
import { api } from '../api';
import { useApp, useFocusSymbols } from '../store';
import { NewsPreview } from './NewsPreview';
import {
  PanelHeader,
  PanelState,
  ResolvingNote,
  SampleChip,
  SkeletonList,
  ViaChips,
  daysFromToday,
  relativeTime,
  safeTime,
  shortDayLabel,
  useNow,
  usePolledData,
} from './center/shared';
import { IconAlert, IconNews } from './center/icons';
import '../styles/news.css';

const NEWS_REFRESH_MS = 5 * 60_000; // auto-refresh every 5 minutes
const MAX_QUERY_SYMBOLS = 40;
const MAX_DISPLAY_ITEMS = 80;

interface DayGroup {
  label: string;
  items: NewsItem[];
}

function dayLabelFor(item: NewsItem, now: Date): string {
  const published = new Date(safeTime(item.publishedAt));
  const diff = daysFromToday(published, now);
  if (diff >= 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  return shortDayLabel(published);
}

function FilterChips() {
  const { state, actions } = useApp();
  return (
    <div className="nf-chips" role="group" aria-label="Filter news by symbol">
      <button
        type="button"
        className={state.newsFilter === 'all' ? 'nf-chip is-active' : 'nf-chip'}
        aria-pressed={state.newsFilter === 'all'}
        onClick={() => actions.setNewsFilter('all')}
      >
        All
      </button>
      {state.watchlist.map((item) => {
        const active = state.newsFilter === item.symbol;
        return (
          <button
            key={item.symbol}
            type="button"
            className={active ? 'nf-chip is-active' : 'nf-chip'}
            aria-pressed={active}
            title={item.name}
            onClick={() => actions.setNewsFilter(item.symbol)}
          >
            <span className="num">{item.symbol}</span>
            {item.type === 'etf' && <span className="nf-chip-tag">ETF</span>}
          </button>
        );
      })}
    </div>
  );
}

function NewsRow({
  item,
  parents,
  now,
}: {
  item: NewsItem;
  parents: Record<string, string[]>;
  now: Date;
}) {
  return (
    <article className="nf-item">
      <div className="nf-meta">
        <span className="nf-pub">{item.sourceName}</span>
        <span className="nf-time num">
          {relativeTime(item.publishedAt, now)}
        </span>
      </div>
      <NewsPreview
        url={item.url}
        title={item.title}
        summary={item.summary}
        meta={`${item.sourceName} · ${relativeTime(item.publishedAt, now)}`}
      >
        <button
          type="button"
          className="nf-title"
          title={item.summary ?? item.title}
          onClick={() => {
            api.openExternal(item.url).catch(() => undefined);
          }}
        >
          {item.title}
        </button>
      </NewsPreview>
      <div className="nf-foot">
        <span className="cp-tag num">{item.relatedSymbol}</span>
        <ViaChips symbol={item.relatedSymbol} parents={parents} />
        {item.sourceName === 'Sample Data' && <SampleChip />}
      </div>
    </article>
  );
}

export function NewsFeed() {
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
    usePolledData<NewsItem[]>(symbolKey, enabled, NEWS_REFRESH_MS, () =>
      api.getNews(querySymbols, 6),
    );

  const groups = useMemo<DayGroup[]>(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const sorted = data
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => safeTime(b.publishedAt) - safeTime(a.publishedAt))
      .slice(0, MAX_DISPLAY_ITEMS);
    const out: DayGroup[] = [];
    for (const item of sorted) {
      const label = dayLabelFor(item, now);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }, [data, now]);

  let body: ReactNode;
  if (!ready) {
    body = (
      <>
        {state.watchlistLoaded && <ResolvingNote />}
        <SkeletonList variant="news" rows={6} />
      </>
    );
  } else if (querySymbols.length === 0) {
    body = (
      <PanelState
        icon={<IconNews />}
        title="No symbols tracked"
        hint="Add ETFs or stocks to your watchlist to build a news universe from their holdings."
      />
    );
  } else if (loading) {
    body = <SkeletonList variant="news" rows={6} />;
  } else if (error && !data) {
    body = (
      <PanelState
        kind="error"
        icon={<IconAlert />}
        title="Couldn't load news"
        hint="Something went wrong fetching headlines. Check your connection and try again."
        onRetry={refresh}
      />
    );
  } else if (groups.length === 0) {
    body = (
      <PanelState
        icon={<IconNews />}
        title="No recent news for this selection"
        hint="Try the All filter or check back shortly — headlines refresh every few minutes."
      />
    );
  } else {
    body = groups.map((group) => (
      <section key={group.label} className="nf-group" aria-label={group.label}>
        <h3 className="cp-day">
          <span>{group.label}</span>
          <span className="cp-day-count num">
            {group.items.length}{' '}
            {group.items.length === 1 ? 'story' : 'stories'}
          </span>
        </h3>
        {group.items.map((item) => (
          <NewsRow key={item.id} item={item} parents={parents} now={now} />
        ))}
      </section>
    ));
  }

  return (
    <div className="cp-panel">
      <div className="cp-chrome">
        <PanelHeader
          title="Market News"
          caption="Top-20 holdings across your ETFs & watched stocks"
          updatedAt={updatedAt}
          busy={loading || refreshing}
          onRefresh={refresh}
          refreshLabel="Refresh news"
        />
        <FilterChips />
      </div>
      <div className="cp-body" aria-busy={loading || !ready}>
        {body}
      </div>
    </div>
  );
}
