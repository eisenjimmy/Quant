// lightweight-charts (v4 API) wrapper: candlesticks + volume histogram,
// dashed support/resistance rays, pivot arrow markers, and a crosshair OHLC
// legend. The chart instance is created once per mount; data/markers/lines
// are pushed through effects so range switches reuse the same canvas.
//
// Canvas colours cannot read CSS variables, so the hexes below are hardcoded
// mirrors of src/renderer/styles/tokens.css — KEEP THEM IN SYNC:
//   text #9aa6bd (--text-2)   grid rgba(32,43,66,0.5) (--border @50%)
//   up   #1fbf75 (--up)       down #f0435c (--down)
//   accent #4d7ef7 (--accent) warn #e8a33d (--warn)
//   crosshair label #1b2438 (--surface-3)

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  createChart,
} from 'lightweight-charts';
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  LineData,
  MouseEventParams,
  SeriesMarker,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type { ChartData, PivotPoint } from '../../../shared/types';
import type { MacroOverlaySeries } from '../../../shared/types';
import type { RiskRewardPlan } from '../../../shared/quant';
import type { TrendLines } from './analysis';
import {
  formatCandleTime,
  formatPrice,
  formatSigned,
  formatSignedPercent,
  formatVolume,
  isIntradayRange,
} from './format';

const C = {
  text: '#9aa6bd',
  grid: 'rgba(32, 43, 66, 0.5)',
  up: '#1fbf75',
  down: '#f0435c',
  upDim: '#1fbf7566', // --up at ~40% alpha for volume bars
  downDim: '#f0435c66', // --down at ~40% alpha for volume bars
  accent: '#4d7ef7',
  warn: '#e8a33d',
  jobs: '#e8a33d',
  unemployment: '#9aa6bd',
  inflation: '#ff6f91',
  treasury10y: '#54c6eb',
  oil: '#d6b36a',
  vix: '#a875ff',
  ma20: '#54c6eb',
  ma50: '#e8a33d',
  ma200: '#a875ff',
  crosshair: 'rgba(154, 166, 189, 0.45)',
  crosshairLabel: '#1b2438',
} as const;

export interface ChartCanvasHandle {
  /** Best-effort: centre the visible range on the given pivot (by index). */
  scrollToPivot(index: number): void;
  fitContent(): void;
  scrollToLatest(): void;
}

export interface ChartStudySelection {
  ma20: boolean;
  ma50: boolean;
  ma200: boolean;
}

interface ChartCanvasProps {
  data: ChartData;
  pivots: PivotPoint[];
  trendLines: TrendLines;
  /** pivot index → true once its news arrived non-empty; marker gets the
   *  1-based number as a text label so it matches the panel badge. */
  numbered: boolean[];
  /** pivot index currently hovered in the news panel (accent marker). */
  highlight: number | null;
  macroOverlays: MacroOverlaySeries[];
  riskPlan: RiskRewardPlan | null;
  showRiskOverlay: boolean;
  studies: ChartStudySelection;
  logScale: boolean;
  onNeedMoreHistory?: () => void;
}

export const ChartCanvas = forwardRef<ChartCanvasHandle, ChartCanvasProps>(
  function ChartCanvas(
    {
      data,
      pivots,
      trendLines,
      numbered,
      highlight,
      macroOverlays,
      riskPlan,
      showRiskOverlay,
      studies,
      logScale,
      onNeedMoreHistory,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const supportSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const resistSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const entrySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const stopSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const target1SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const target2SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const indexByTimeRef = useRef<Map<number, number>>(new Map());
    const needHistoryRef = useRef(onNeedMoreHistory);
    const historyRequestAtRef = useRef(0);
    const dataMetaRef = useRef<{
      range: ChartData['range'];
      first: number;
      last: number;
      count: number;
    } | null>(null);
    const hoverTimeRef = useRef<number | null>(null);
    const pendingHoverTimeRef = useRef<number | null>(null);
    const crosshairFrameRef = useRef<number | null>(null);
    const resizeFrameRef = useRef<number | null>(null);
    const userNavigatedRef = useRef(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);

    const indexByTime = useMemo(() => {
      const map = new Map<number, number>();
      for (let i = 0; i < data.candles.length; i++) map.set(data.candles[i].time, i);
      return map;
    }, [data]);

    // ---- Chart lifecycle: create once, tear down fully on unmount ----
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const chart = createChart(host, {
        width: Math.max(host.clientWidth, 1),
        height: Math.max(host.clientHeight, 1),
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: C.text,
          fontSize: 11,
          fontFamily: "'Cascadia Mono', Consolas, ui-monospace, monospace",
        },
        grid: {
          vertLines: { color: C.grid },
          horzLines: { color: C.grid },
        },
        rightPriceScale: { borderColor: C.grid },
        timeScale: {
          borderColor: C.grid,
          rightOffset: 4,
          timeVisible: isIntradayRange(data.range),
          secondsVisible: false,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: C.crosshair, labelBackgroundColor: C.crosshairLabel },
          horzLine: { color: C.crosshair, labelBackgroundColor: C.crosshairLabel },
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: C.up,
        downColor: C.down,
        wickUpColor: C.up,
        wickDownColor: C.down,
        borderVisible: false,
      });

      const volumeSeries = chart.addHistogramSeries({
        priceScaleId: '', // overlay scale pinned to the bottom fifth
        priceFormat: { type: 'volume' },
        priceLineVisible: false,
        lastValueVisible: false,
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      const trendOptions = (color: string) =>
        ({
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          // Projected rays must not stretch the price scale.
          autoscaleInfoProvider: () => null,
        }) as const;
      const supportSeries = chart.addLineSeries(trendOptions(C.up));
      const resistSeries = chart.addLineSeries(trendOptions(C.down));
      const levelOptions = (color: string) =>
        ({
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
          autoscaleInfoProvider: () => null,
        }) as const;
      const entrySeries = chart.addLineSeries(levelOptions(C.accent));
      const stopSeries = chart.addLineSeries(levelOptions(C.down));
      const target1Series = chart.addLineSeries(levelOptions(C.up));
      const target2Series = chart.addLineSeries({ ...levelOptions(C.up), lineStyle: LineStyle.Dashed });
      const studyOptions = (color: string, lineWidth: 1 | 2 = 1) => ({
        color,
        lineWidth,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      }) as const;
      const ma20Series = chart.addLineSeries(studyOptions(C.ma20));
      const ma50Series = chart.addLineSeries(studyOptions(C.ma50));
      const ma200Series = chart.addLineSeries(studyOptions(C.ma200, 2));

      const onCrosshairMove = (param: MouseEventParams<Time>) => {
        const t = typeof param.time === 'number' ? param.time : null;
        pendingHoverTimeRef.current = t;
        if (crosshairFrameRef.current !== null) return;
        crosshairFrameRef.current = window.requestAnimationFrame(() => {
          crosshairFrameRef.current = null;
          const next = pendingHoverTimeRef.current;
          if (next === hoverTimeRef.current) return;
          hoverTimeRef.current = next;
          setHoverTime(next);
        });
      };
      chart.subscribeCrosshairMove(onCrosshairMove);
      const onVisibleRange = () => {
        const visible = chart.timeScale().getVisibleLogicalRange();
        const now = Date.now();
        if (
          userNavigatedRef.current &&
          visible &&
          visible.from < -2 &&
          now - historyRequestAtRef.current > 1200
        ) {
          historyRequestAtRef.current = now;
          needHistoryRef.current?.();
        }
      };
      chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRange);
      const markNavigated = () => {
        userNavigatedRef.current = true;
      };
      host.addEventListener('wheel', markNavigated, { passive: true });
      host.addEventListener('pointerdown', markNavigated, { passive: true });

      const observer = new ResizeObserver((entries) => {
        const rect = entries[entries.length - 1].contentRect;
        if (rect.width > 0 && rect.height > 0) {
          if (resizeFrameRef.current !== null) window.cancelAnimationFrame(resizeFrameRef.current);
          resizeFrameRef.current = window.requestAnimationFrame(() => {
            resizeFrameRef.current = null;
            chart.applyOptions({
              width: Math.floor(rect.width),
              height: Math.floor(rect.height),
            });
          });
        }
      });
      observer.observe(host);

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      supportSeriesRef.current = supportSeries;
      resistSeriesRef.current = resistSeries;
      entrySeriesRef.current = entrySeries;
      stopSeriesRef.current = stopSeries;
      target1SeriesRef.current = target1Series;
      target2SeriesRef.current = target2Series;
      ma20SeriesRef.current = ma20Series;
      ma50SeriesRef.current = ma50Series;
      ma200SeriesRef.current = ma200Series;

      return () => {
        if (crosshairFrameRef.current !== null) window.cancelAnimationFrame(crosshairFrameRef.current);
        if (resizeFrameRef.current !== null) window.cancelAnimationFrame(resizeFrameRef.current);
        observer.disconnect();
        host.removeEventListener('wheel', markNavigated);
        host.removeEventListener('pointerdown', markNavigated);
        chart.unsubscribeCrosshairMove(onCrosshairMove);
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRange);
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        supportSeriesRef.current = null;
        resistSeriesRef.current = null;
        entrySeriesRef.current = null;
        stopSeriesRef.current = null;
        target1SeriesRef.current = null;
        target2SeriesRef.current = null;
        ma20SeriesRef.current = null;
        ma50SeriesRef.current = null;
        ma200SeriesRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      needHistoryRef.current = onNeedMoreHistory;
    }, [onNeedMoreHistory]);

    // ---- Candles + volume (order matters: before markers/trend effects) ----
    useEffect(() => {
      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      const volumeSeries = volumeSeriesRef.current;
      if (!chart || !candleSeries || !volumeSeries) return;

      indexByTimeRef.current = indexByTime;
      const visibleBefore = chart.timeScale().getVisibleLogicalRange();
      const previous = dataMetaRef.current;
      const first = data.candles[0]?.time ?? 0;
      const last = data.candles[data.candles.length - 1]?.time ?? 0;

      const candleData: CandlestickData<Time>[] = data.candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeries.setData(candleData);

      const volumeData: HistogramData<Time>[] = data.candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? C.upDim : C.downDim,
      }));
      volumeSeries.setData(volumeData);

      chart.applyOptions({
        timeScale: {
          timeVisible: isIntradayRange(data.range),
          secondsVisible: false,
        },
      });
      const prepended =
        previous !== null &&
        previous.range === data.range &&
        first < previous.first &&
        last === previous.last;
      const appendedOrRefreshed =
        previous !== null &&
        previous.range === data.range &&
        first === previous.first;

      if (prepended && visibleBefore) {
        const inserted = indexByTime.get(previous.first) ?? 0;
        chart.timeScale().setVisibleLogicalRange({
          from: visibleBefore.from + inserted,
          to: visibleBefore.to + inserted,
        });
      } else if (appendedOrRefreshed && visibleBefore) {
        chart.timeScale().setVisibleLogicalRange(visibleBefore);
      } else {
        chart.timeScale().fitContent();
      }
      dataMetaRef.current = { range: data.range, first, last, count: data.candles.length };

      hoverTimeRef.current = null;
      setHoverTime(null);
    }, [data, indexByTime]);

    useEffect(() => {
      const movingAverage = (period: number): LineData<Time>[] => {
        if (data.candles.length < period) return [];
        let sum = 0;
        const points: LineData<Time>[] = [];
        for (let index = 0; index < data.candles.length; index++) {
          sum += data.candles[index].close;
          if (index >= period) sum -= data.candles[index - period].close;
          if (index >= period - 1) {
            points.push({
              time: data.candles[index].time as UTCTimestamp,
              value: sum / period,
            });
          }
        }
        return points;
      };
      ma20SeriesRef.current?.setData(studies.ma20 ? movingAverage(20) : []);
      ma50SeriesRef.current?.setData(studies.ma50 ? movingAverage(50) : []);
      ma200SeriesRef.current?.setData(studies.ma200 ? movingAverage(200) : []);
    }, [data, studies.ma20, studies.ma50, studies.ma200]);

    useEffect(() => {
      chartRef.current?.applyOptions({
        rightPriceScale: {
          borderColor: C.grid,
          mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
        },
      });
    }, [logScale]);

    // ---- Support / resistance rays ----
    useEffect(() => {
      const toLine = (pts: TrendLines['support']): LineData<Time>[] =>
        pts.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }));
      supportSeriesRef.current?.setData(toLine(trendLines.support));
      resistSeriesRef.current?.setData(toLine(trendLines.resistance));
    }, [trendLines]);

    useEffect(() => {
      const start = data.candles[0]?.time;
      const end = data.candles[data.candles.length - 1]?.time;
      const setLevel = (series: ISeriesApi<'Line'> | null, value: number | null) => {
        if (!series || !start || !end || value === null || !showRiskOverlay) {
          series?.setData([]);
          return;
        }
        series.setData([
          { time: start as UTCTimestamp, value },
          { time: end as UTCTimestamp, value },
        ]);
      };
      setLevel(entrySeriesRef.current, riskPlan?.entry ?? null);
      setLevel(stopSeriesRef.current, riskPlan?.stop ?? null);
      setLevel(target1SeriesRef.current, riskPlan?.target1 ?? null);
      setLevel(target2SeriesRef.current, riskPlan?.target2 ?? null);
    }, [data, riskPlan, showRiskOverlay]);

    // ---- Pivot markers (numbered once news lands, accent on panel hover) ----
    useEffect(() => {
      const candleSeries = candleSeriesRef.current;
      if (!candleSeries) return;
      const markers: SeriesMarker<Time>[] = pivots.map((p, i) => ({
        time: p.time as UTCTimestamp,
        position: p.kind === 'high' ? 'aboveBar' : 'belowBar',
        shape: p.kind === 'high' ? 'arrowDown' : 'arrowUp',
        color: highlight === i ? C.accent : p.kind === 'high' ? C.warn : C.up,
        text: numbered[i] ? String(i + 1) : undefined,
        size: highlight === i ? 2 : 1,
        id: `pivot-${i}`,
      }));
      // setMarkers requires ascending time; pivots already are, but keep the
      // guarantee explicit against future callers.
      markers.sort((a, b) => (a.time as number) - (b.time as number));
      candleSeries.setMarkers(markers);
    }, [pivots, numbered, highlight]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToPivot(index: number) {
          const chart = chartRef.current;
          const pivot = pivots[index];
          if (!chart || !pivot) return;
          const candleIndex = indexByTimeRef.current.get(pivot.time);
          if (candleIndex === undefined) return;
          const timeScale = chart.timeScale();
          const visible = timeScale.getVisibleLogicalRange();
          if (!visible) return;
          const half = Math.max(2, (visible.to - visible.from) / 2);
          timeScale.setVisibleLogicalRange({
            from: candleIndex - half,
            to: candleIndex + half,
          });
        },
        fitContent() {
          chartRef.current?.timeScale().fitContent();
        },
        scrollToLatest() {
          chartRef.current?.timeScale().scrollToPosition(0, true);
        },
      }),
      [pivots],
    );

    // ---- Crosshair legend (falls back to the last candle when idle) ----
    const intraday = isIntradayRange(data.range);
    const legend = useMemo(() => {
      const candles = data.candles;
      if (candles.length === 0) return null;
      const hovered = hoverTime !== null ? indexByTime.get(hoverTime) : undefined;
      const i = hovered ?? candles.length - 1;
      const c = candles[i];
      const prevClose = i > 0 ? candles[i - 1].close : c.open;
      const change = c.close - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : null;
      return { c, change, changePercent };
    }, [data, hoverTime, indexByTime]);
    const macroContext = useMemo(() => {
      const overlay = macroOverlays[0];
      const points = overlay?.points.filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value)) ?? [];
      if (!overlay || points.length === 0) return null;
      const firstTime = points[0].time;
      const lastTime = points[points.length - 1].time;
      const values = points.map((point) => point.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const timeSpan = Math.max(1, lastTime - firstTime);
      const valueSpan = Math.max(0.0001, max - min);
      const polyline = points.map((point) => {
        const x = ((point.time - firstTime) / timeSpan) * 1000;
        const y = 86 - ((point.value - min) / valueSpan) * 72;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      const label = overlay.key === 'jobs'
        ? 'JOBS'
        : overlay.key === 'unemployment'
          ? 'UNEMP'
          : overlay.key === 'inflation'
            ? 'CPI'
            : overlay.key === 'treasury10y'
              ? '10Y'
              : overlay.key === 'oil'
                ? 'OIL'
                : 'VIX';
      return {
        key: overlay.key,
        label,
        value: points[points.length - 1].value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        min: min.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        max: max.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        polyline,
      };
    }, [macroOverlays]);

    return (
      <div className="cm-canvas">
        <div ref={hostRef} className="cm-canvas-host" />
        {legend && (
          <div className="cm-legend num">
            <span className="cm-legend-date">
              {formatCandleTime(legend.c.time, intraday)}
            </span>
            {(
              [
                ['O', legend.c.open],
                ['H', legend.c.high],
                ['L', legend.c.low],
                ['C', legend.c.close],
              ] as const
            ).map(([label, value]) => (
              <span
                key={label}
                className={legend.c.close >= legend.c.open ? 'up' : 'down'}
              >
                <span className="cm-legend-lbl">{label}</span>
                {formatPrice(value)}
              </span>
            ))}
            <span className={legend.change >= 0 ? 'up' : 'down'}>
              {formatSigned(legend.change)}
              {legend.changePercent !== null
                ? ` (${formatSignedPercent(legend.changePercent)})`
                : ''}
            </span>
            <span>
              <span className="cm-legend-lbl">Vol</span>
              {formatVolume(legend.c.volume)}
            </span>
          </div>
        )}
        {macroContext && (
          <div className={`cm-macro-context is-${macroContext.key}`} aria-label={`${macroContext.label} range context ${macroContext.value}`}>
            <div>
              <span aria-hidden="true" />
              <b>{macroContext.label}</b>
              <em>{macroContext.value}</em>
              <small>selected-range context · independent scale</small>
            </div>
            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="86" x2="1000" y2="86" />
              <polyline points={macroContext.polyline} />
            </svg>
            <span className="cm-macro-context-range"><i>{macroContext.max}</i><i>{macroContext.min}</i></span>
          </div>
        )}
      </div>
    );
  },
);
