import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FORECAST_V1,
  isActiveForecastStage,
} from '../../../shared/forecast';
import type {
  ForecastAssetType,
  ForecastErrorCode,
  ForecastHistoricalComparison,
  ForecastProgressEvent,
  ForecastRecord,
  ForecastSavedSummary,
} from '../../../shared/forecast';
import { api } from '../../api';
import {
  chooseSavedForecastId,
  orderUnexpiredForecasts,
} from './forecastHistoryModel';
import { shouldAcceptForecastEvent } from './forecastViewModel';

export interface ForecastController {
  job: ForecastProgressEvent | null;
  records: ForecastSavedSummary[];
  selectedRecord: ForecastRecord | null;
  historicalComparison: ForecastHistoricalComparison | null;
  comparisonLoading: boolean;
  comparisonError: string | null;
  selectedId: string;
  overlayEnabled: boolean;
  overlaySaving: boolean;
  loading: boolean;
  selecting: boolean;
  starting: boolean;
  cancelling: boolean;
  error: string | null;
  errorCode: ForecastErrorCode | null;
  run(): Promise<void>;
  cancel(): Promise<void>;
  selectSaved(forecastId: string): Promise<void>;
  setOverlayEnabled(enabled: boolean): Promise<void>;
}

async function resolveAssetType(
  symbol: string,
  knownType: ForecastAssetType | undefined,
): Promise<ForecastAssetType> {
  if (knownType) return knownType;
  const suggestions = await api.searchSymbols(symbol);
  const exact = suggestions.find(
    (suggestion) => suggestion.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  if (!exact) throw new Error(`Could not verify ${symbol} as a supported stock or ETF.`);
  return exact.type;
}

export function useForecast(
  symbol: string,
  assetType?: ForecastAssetType,
): ForecastController {
  const [job, setJob] = useState<ForecastProgressEvent | null>(null);
  const [records, setRecords] = useState<ForecastSavedSummary[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ForecastRecord | null>(null);
  const [historicalComparison, setHistoricalComparison] =
    useState<ForecastHistoricalComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [overlayEnabled, setOverlayState] = useState(false);
  const [overlaySaving, setOverlaySaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ForecastErrorCode | null>(null);
  const mountedRef = useRef(true);
  const savedRequestRef = useRef(0);
  const comparisonRequestRef = useRef(0);
  const overlayRequestRef = useRef(0);
  const persistedOverlayRef = useRef(false);

  const loadHistoricalComparison = useCallback(async (forecastId: string) => {
    const requestId = ++comparisonRequestRef.current;
    setHistoricalComparison(null);
    setComparisonError(null);
    setComparisonLoading(true);
    try {
      const comparison =
        await api.forecast.getHistoricalComparison(forecastId);
      if (
        !mountedRef.current ||
        requestId !== comparisonRequestRef.current
      ) return;
      if (!comparison) {
        throw new Error('The saved forecast is no longer available.');
      }
      setHistoricalComparison(comparison);
    } catch (comparisonLoadError) {
      if (
        mountedRef.current &&
        requestId === comparisonRequestRef.current
      ) {
        setComparisonError(
          comparisonLoadError instanceof Error
            ? comparisonLoadError.message
            : 'Historical comparison is unavailable.',
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === comparisonRequestRef.current
      ) {
        setComparisonLoading(false);
      }
    }
  }, []);

  const loadSaved = useCallback(async (preferredId?: string) => {
    const requestId = ++savedRequestRef.current;
    comparisonRequestRef.current += 1;
    setHistoricalComparison(null);
    setComparisonError(null);
    setComparisonLoading(false);
    if (mountedRef.current) setSelecting(true);
    try {
      const summaries = await api.forecast.listSaved(symbol);
      if (
        !mountedRef.current ||
        requestId !== savedRequestRef.current
      ) return;
      const ordered = orderUnexpiredForecasts(summaries);
      setRecords(ordered);
      const nextId = chooseSavedForecastId(ordered, preferredId);
      setSelectedId(nextId);
      setSelectedRecord(null);
      if (!nextId) {
        return;
      }
      const record = await api.forecast.getSaved(nextId);
      if (
        !record ||
        !mountedRef.current ||
        requestId !== savedRequestRef.current
      ) {
        if (!record && requestId === savedRequestRef.current) {
          throw new Error('The saved forecast is no longer available.');
        }
        return;
      }
      setSelectedRecord(record);
      void loadHistoricalComparison(record.id);
    } catch (loadError) {
      if (
        mountedRef.current &&
        requestId === savedRequestRef.current
      ) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Saved forecasts could not be restored.',
          );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === savedRequestRef.current
      ) {
        setLoading(false);
        setSelecting(false);
      }
    }
  }, [loadHistoricalComparison, symbol]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    setLoading(true);
    setSelecting(false);
    setError(null);
    setErrorCode(null);
    setJob(null);
    setRecords([]);
    setSelectedId('');
    setSelectedRecord(null);
    setHistoricalComparison(null);
    setComparisonLoading(false);
    setComparisonError(null);
    setOverlaySaving(false);
    persistedOverlayRef.current = false;
    const savedRequestId = ++savedRequestRef.current;
    comparisonRequestRef.current += 1;
    const overlayRequestId = ++overlayRequestRef.current;

    const unsubscribeProgress = api.forecast.onProgress((event) => {
      if (cancelled) return;
      setJob((current) =>
        shouldAcceptForecastEvent(current, event, symbol) ? event : current,
      );
    });
    const unsubscribeCompleted = api.forecast.onCompleted((event) => {
      if (cancelled || event.symbol !== symbol) return;
      setError(null);
      setErrorCode(null);
      overlayRequestRef.current += 1;
      persistedOverlayRef.current = true;
      setOverlaySaving(false);
      setOverlayState(true);
      void loadSaved(event.forecastId);
    });
    const unsubscribeFailed = api.forecast.onFailed((event) => {
      if (cancelled || event.symbol !== symbol) return;
      setError(event.message);
      setErrorCode(event.errorCode ?? null);
    });

    void (async () => {
      try {
        const [currentJob, summaries, overlay] = await Promise.all([
          api.forecast.getJob(symbol),
          api.forecast.listSaved(symbol),
          api.forecast.getOverlayEnabled(symbol),
        ]);
        if (
          cancelled ||
          savedRequestId !== savedRequestRef.current
        ) return;
        setJob((current) =>
          currentJob &&
          shouldAcceptForecastEvent(current, currentJob, symbol)
            ? currentJob
            : current,
        );
        const ordered = orderUnexpiredForecasts(summaries);
        setRecords(ordered);
        if (overlayRequestId === overlayRequestRef.current) {
          persistedOverlayRef.current = overlay;
          setOverlayState(overlay);
        }
        const preferredId = chooseSavedForecastId(
          ordered,
          currentJob?.forecastId,
        );
        setSelectedId(preferredId);
        if (preferredId) {
          const record = await api.forecast.getSaved(preferredId);
          if (
            !cancelled &&
            savedRequestId === savedRequestRef.current
          ) {
            setSelectedRecord(record);
            if (record) void loadHistoricalComparison(record.id);
          }
        }
        if (!cancelled) setLoading(false);
      } catch (loadError) {
        if (
          cancelled ||
          savedRequestId !== savedRequestRef.current
        ) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Saved forecasts could not be restored.',
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      savedRequestRef.current += 1;
      comparisonRequestRef.current += 1;
      overlayRequestRef.current += 1;
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, [loadHistoricalComparison, loadSaved, symbol]);

  const run = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    setErrorCode(null);
    try {
      const resolvedType = await resolveAssetType(symbol, assetType);
      const result = await api.forecast.run({
        symbol,
        assetType: resolvedType,
        requestedAt: new Date().toISOString(),
        paths: FORECAST_V1.pathCount,
        horizonBars: FORECAST_V1.predictionBars,
        interval: FORECAST_V1.interval,
      });
      if (!result.ok) {
        setError(result.message);
        setErrorCode(result.code);
        return;
      }
      setJob((current) =>
        shouldAcceptForecastEvent(current, result.job, symbol)
          ? result.job
          : current,
      );
    } catch (runError) {
      setError('The forecast request could not be submitted.');
      setErrorCode(null);
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }, [assetType, starting, symbol]);

  const cancel = useCallback(async () => {
    if (
      cancelling ||
      !job ||
      !isActiveForecastStage(job.stage)
    ) {
      return;
    }
    setCancelling(true);
    setError(null);
    setErrorCode(null);
    try {
      const result = await api.forecast.cancel(job.jobId);
      if (!result.ok) {
        setError(result.message);
        setErrorCode(result.code);
        return;
      }
      setJob((current) =>
        shouldAcceptForecastEvent(current, result.job, symbol)
          ? result.job
          : current,
      );
    } catch {
      setError('The cancellation request could not be submitted.');
      setErrorCode(null);
    } finally {
      if (mountedRef.current) setCancelling(false);
    }
  }, [cancelling, job, symbol]);

  const selectSaved = useCallback(async (forecastId: string) => {
    if (
      forecastId === selectedId ||
      !records.some((record) => record.id === forecastId)
    ) {
      return;
    }
    const requestId = ++savedRequestRef.current;
    comparisonRequestRef.current += 1;
    const previousId = selectedId;
    const previousRecord = selectedRecord;
    const previousComparison = historicalComparison;
    const previousComparisonLoading = comparisonLoading;
    const previousComparisonError = comparisonError;
    setSelecting(true);
    setSelectedId(forecastId);
    setSelectedRecord(null);
    setHistoricalComparison(null);
    setComparisonLoading(false);
    setComparisonError(null);
    setError(null);
    setErrorCode(null);
    try {
      const record = await api.forecast.getSaved(forecastId);
      if (!record) throw new Error('The selected forecast is no longer available.');
      if (
        mountedRef.current &&
        requestId === savedRequestRef.current
      ) {
        setSelectedRecord(record);
        void loadHistoricalComparison(record.id);
      }
    } catch (selectionError) {
      if (
        mountedRef.current &&
        requestId === savedRequestRef.current
      ) {
        setSelectedId(previousId);
        setSelectedRecord(previousRecord);
        setHistoricalComparison(previousComparison);
        setComparisonLoading(previousComparisonLoading);
        setComparisonError(previousComparisonError);
        setError(
          selectionError instanceof Error
            ? selectionError.message
            : 'Saved forecast could not be loaded.',
          );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === savedRequestRef.current
      ) {
        setSelecting(false);
      }
    }
  }, [
    loadHistoricalComparison,
    comparisonError,
    comparisonLoading,
    historicalComparison,
    records,
    selectedId,
    selectedRecord,
  ]);

  const setOverlayEnabled = useCallback(async (enabled: boolean) => {
    if (overlaySaving) return;
    const requestId = ++overlayRequestRef.current;
    const previousState = persistedOverlayRef.current;
    setOverlaySaving(true);
    setOverlayState(enabled);
    setError(null);
    setErrorCode(null);
    try {
      const savedState = await api.forecast.setOverlayEnabled(symbol, enabled);
      if (
        mountedRef.current &&
        requestId === overlayRequestRef.current
      ) {
        persistedOverlayRef.current = savedState;
        setOverlayState(savedState);
      }
    } catch (overlayError) {
      if (
        mountedRef.current &&
        requestId === overlayRequestRef.current
      ) {
        setOverlayState(previousState);
        setError(
          overlayError instanceof Error
            ? overlayError.message
            : 'Overlay preference could not be saved.',
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === overlayRequestRef.current
      ) {
        setOverlaySaving(false);
      }
    }
  }, [overlaySaving, symbol]);

  return {
    job,
    records,
    selectedRecord,
    historicalComparison,
    comparisonLoading,
    comparisonError,
    selectedId,
    overlayEnabled,
    overlaySaving,
    loading,
    selecting,
    starting,
    cancelling,
    error,
    errorCode,
    run,
    cancel,
    selectSaved,
    setOverlayEnabled,
  };
}
