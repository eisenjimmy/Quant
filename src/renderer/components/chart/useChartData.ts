// Chart data loader for the modal: fetches candles for the active range,
// caches per range for the modal's lifetime (toggling back is instant), and
// exposes a monotonic `generation` counter. The generation bumps on every
// load (range switch or retry); any async consumer — most importantly the
// pivot-news pipeline — must throw away results that belong to an older
// generation so switching ranges mid-flight never shows stale data.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChartData, ChartRange } from '../../../shared/types';
import { api } from '../../api';

export interface ChartDataState {
  data: ChartData | null;
  loading: boolean;
  error: string | null;
  /** Bumps on every load; loading state and its resolved data share a value. */
  generation: number;
}

export function useChartData(
  symbol: string,
  range: ChartRange,
): ChartDataState & { retry: () => void; loadOlder: () => Promise<void>; loadingOlder: boolean } {
  const cacheRef = useRef<Map<ChartRange, ChartData>>(new Map());
  const historyRangeRef = useRef<ChartRange>(range);
  const genRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [state, setState] = useState<ChartDataState>({
    data: null,
    loading: true,
    error: null,
    generation: 0,
  });

  useEffect(() => {
    historyRangeRef.current = range;
    const gen = ++genRef.current;
    const cached = cacheRef.current.get(range);
    if (cached) {
      setState({ data: cached, loading: false, error: null, generation: gen });
      return;
    }
    setState({ data: null, loading: true, error: null, generation: gen });
    let cancelled = false;
    api
      .getChart(symbol, range)
      .then((data) => {
        if (cancelled || gen !== genRef.current) return; // stale response
        cacheRef.current.set(range, data);
        setState({ data, loading: false, error: null, generation: gen });
      })
      .catch((err: unknown) => {
        if (cancelled || gen !== genRef.current) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'The chart request failed.';
        setState({ data: null, loading: false, error: message, generation: gen });
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range, attempt]);

  useEffect(() => {
    if (range === 'max') return;
    const next = nextLongerRange(range);
    if (cacheRef.current.has(next)) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      api.getChart(symbol, next).then(
        (data) => {
          if (!cancelled) cacheRef.current.set(next, data);
        },
        () => undefined,
      );
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [symbol, range, state.generation]);

  useEffect(() => {
    if (range !== '1d' && range !== '1w' && range !== '1m') return;
    const id = window.setInterval(() => {
      api.getChart(symbol, range).then(
        (fresh) => {
          cacheRef.current.set(range, fresh);
          setState((s) =>
            s.data && s.data.range === range
              ? { data: mergeChartData(s.data, fresh), loading: false, error: null, generation: s.generation + 1 }
              : s,
          );
        },
        () => undefined,
      );
    }, 15_000);
    return () => window.clearInterval(id);
  }, [symbol, range]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || historyRangeRef.current === 'max') return;
    setLoadingOlder(true);
    try {
      const longer = nextLongerRange(historyRangeRef.current);
      if (longer === historyRangeRef.current) return;
      const cached = cacheRef.current.get(longer);
      const older = cached ?? (await api.getChart(symbol, longer));
      cacheRef.current.set(longer, older);
      setState((s) => {
        if (!s.data) return s;
        const merged = mergeChartData(older, s.data);
        if (merged.candles.length <= s.data.candles.length) return s;
        return {
          data: merged,
          loading: false,
          error: null,
          generation: s.generation + 1,
        };
      });
      historyRangeRef.current = longer;
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, symbol]);

  return { ...state, retry, loadOlder, loadingOlder };
}

function nextLongerRange(range: ChartRange): ChartRange {
  switch (range) {
    case '1d':
      return '1w';
    case '1w':
      return '1m';
    case '1m':
      return '6m';
    case '6m':
      return '1y';
    case '1y':
      return '5y';
    case '5y':
      return 'max';
    case 'max':
      return 'max';
  }
}

function mergeChartData(base: ChartData, incoming: ChartData): ChartData {
  const byTime = new Map<number, ChartData['candles'][number]>();
  for (const c of base.candles) byTime.set(c.time, c);
  for (const c of incoming.candles) byTime.set(c.time, c);
  return {
    ...incoming,
    range: incoming.range,
    interval: incoming.interval,
    candles: [...byTime.values()].sort((a, b) => a.time - b.time),
  };
}
