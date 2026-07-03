import { useEffect, useState } from 'react';
import type { ChartRange, MacroOverlayKey, MacroOverlaySeries } from '../../../shared/types';
import { api } from '../../api';

export type OverlaySelection = Record<MacroOverlayKey, boolean>;

export const DEFAULT_OVERLAYS: OverlaySelection = {
  jobs: false,
  unemployment: false,
  inflation: false,
  treasury10y: false,
  oil: false,
  vix: false,
};

export function useMacroOverlays(range: ChartRange, selected: OverlaySelection) {
  const [series, setSeries] = useState<MacroOverlaySeries[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keys = (Object.keys(selected) as MacroOverlayKey[]).filter((k) => selected[k]);
    if (keys.length === 0) {
      setSeries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(keys.map((key) => api.getMacroOverlay(key, range).catch(() => null))).then((results) => {
      if (cancelled) return;
      setSeries(results.filter((item): item is MacroOverlaySeries => item !== null));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    range,
    selected.jobs,
    selected.unemployment,
    selected.inflation,
    selected.treasury10y,
    selected.oil,
    selected.vix,
  ]);

  return { series, loading };
}
