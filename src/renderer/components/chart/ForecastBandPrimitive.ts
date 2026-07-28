import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type {
  AutoscaleInfo,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  Logical,
  SeriesAttachedParameter,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type {
  ForecastBandPoint,
  ForecastOverlayModel,
} from './forecastOverlayModel';

interface ScreenPoint {
  x: number;
  lower: number;
  upper: number;
}

class ForecastBandRenderer implements ISeriesPrimitivePaneRenderer {
  constructor(private readonly source: ForecastBandPrimitive) {}

  draw(target: CanvasRenderingTarget2D): void {
    const points = this.source.screenPoints();
    const dividerX = this.source.dividerCoordinate();
    if (points.length < 2 && dividerX === null) return;

    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      if (points.length >= 2) {
        context.save();
        context.beginPath();
        context.moveTo(points[0].x, points[0].upper);
        for (let index = 1; index < points.length; index++) {
          context.lineTo(points[index].x, points[index].upper);
        }
        for (let index = points.length - 1; index >= 0; index--) {
          context.lineTo(points[index].x, points[index].lower);
        }
        context.closePath();
        context.fillStyle = 'rgba(77, 126, 247, 0.14)';
        context.fill();
        context.restore();
      }

      if (dividerX !== null) {
        context.save();
        context.beginPath();
        context.setLineDash([5, 5]);
        context.moveTo(dividerX, 0);
        context.lineTo(dividerX, mediaSize.height);
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(232, 163, 61, 0.78)';
        context.stroke();
        context.restore();
      }
    });
  }
}

class ForecastBandPaneView implements ISeriesPrimitivePaneView {
  private readonly paneRenderer: ForecastBandRenderer;

  constructor(source: ForecastBandPrimitive) {
    this.paneRenderer = new ForecastBandRenderer(source);
  }

  zOrder(): 'bottom' {
    return 'bottom';
  }

  renderer(): ISeriesPrimitivePaneRenderer {
    return this.paneRenderer;
  }
}

/** Background primitive for the p10-p90 polygon and forecast-start divider. */
export class ForecastBandPrimitive implements ISeriesPrimitive<Time> {
  private chart: IChartApi | null = null;
  private series: ISeriesApi<'Line'> | null = null;
  private requestUpdate: (() => void) | null = null;
  private readonly paneView = new ForecastBandPaneView(this);

  constructor(private readonly model: ForecastOverlayModel) {}

  attached(param: SeriesAttachedParameter<Time>): void {
    this.chart = param.chart;
    this.series = param.series as ISeriesApi<'Line'>;
    this.requestUpdate = param.requestUpdate;
    this.requestUpdate();
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  updateAllViews(): void {
    // Coordinates are resolved during draw, so viewport updates do not need
    // another requestUpdate. Calling it here would create a redraw loop.
  }

  paneViews(): readonly ISeriesPrimitivePaneView[] {
    return [this.paneView];
  }

  autoscaleInfo(startTimePoint: Logical, endTimePoint: Logical): AutoscaleInfo | null {
    if (this.chart) {
      const timeScale = this.chart.timeScale();
      const startX = timeScale.timeToCoordinate(this.model.forecastStart);
      const endX = timeScale.timeToCoordinate(
        this.model.band[this.model.band.length - 1].time,
      );
      const forecastStartLogical =
        startX === null ? null : timeScale.coordinateToLogical(startX);
      const forecastEndLogical =
        endX === null ? null : timeScale.coordinateToLogical(endX);
      if (
        forecastStartLogical !== null &&
        forecastEndLogical !== null &&
        (forecastEndLogical < startTimePoint ||
          forecastStartLogical > endTimePoint)
      ) {
        return null;
      }
    }
    return {
      priceRange: {
        minValue: this.model.minimum,
        maxValue: this.model.maximum,
      },
    };
  }

  screenPoints(): ScreenPoint[] {
    if (!this.chart || !this.series) return [];
    return this.model.band.flatMap((point: ForecastBandPoint) => {
      const x = this.chart?.timeScale().timeToCoordinate(point.time);
      const lower = this.series?.priceToCoordinate(point.lower);
      const upper = this.series?.priceToCoordinate(point.upper);
      return x === null ||
        x === undefined ||
        lower === null ||
        lower === undefined ||
        upper === null ||
        upper === undefined
        ? []
        : [{ x, lower, upper }];
    });
  }

  dividerCoordinate(): number | null {
    return (
      this.chart?.timeScale().timeToCoordinate(this.model.forecastStart) ?? null
    );
  }
}

export function createForecastOverlayDisposer(
  chart: IChartApi,
  series: ISeriesApi<'Line'>,
  primitive: ForecastBandPrimitive,
  isCurrent: () => boolean,
): () => void {
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    if (!isCurrent()) return;
    series.detachPrimitive(primitive);
    chart.removeSeries(series);
  };
}
