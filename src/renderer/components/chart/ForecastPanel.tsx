import React, { useMemo } from 'react';
import type {
  DataSource,
  InstrumentType,
} from '../../../shared/types';
import { isActiveForecastStage } from '../../../shared/forecast';
import {
  deriveForecastPanelView,
  describeForecastFailure,
  isForecastOverlayControlLocked,
} from './forecastViewModel';
import { ForecastHistory } from './ForecastHistory';
import { ForecastHistoricalComparison } from './ForecastHistoricalComparison';
import { ForecastProgress } from './ForecastProgress';
import { ForecastSummary } from './ForecastSummary';
import type { ForecastController } from './useForecast';
import '../../styles/forecast.css';

export function ForecastPanel({
  symbol,
  assetType,
  chartSource,
  chartReady,
  chartInterval,
  forecastMa20Enabled,
  forecastMa20Available,
  onForecastMa20Change,
  controller,
}: {
  symbol: string;
  assetType?: InstrumentType;
  chartSource?: DataSource;
  chartReady: boolean;
  chartInterval?: string;
  forecastMa20Enabled: boolean;
  forecastMa20Available: boolean;
  onForecastMa20Change(enabled: boolean): void;
  controller: ForecastController;
}) {
  const unavailableReason = useMemo(() => {
    if (!chartReady) return 'Waiting for completed chart candles.';
    if (chartSource === 'sample') {
      return 'Bundled SAMPLE data cannot be used for a forecast.';
    }
    return null;
  }, [chartReady, chartSource]);
  const view = deriveForecastPanelView({
    loading: controller.loading,
    starting: controller.starting,
    unavailableReason,
    job: controller.job,
    record: controller.selectedRecord,
  });
  const failure =
    controller.job?.stage === 'failed'
      ? describeForecastFailure(
          controller.job.errorCode,
          controller.job.message,
        )
      : controller.error
        ? describeForecastFailure(controller.errorCode ?? undefined, controller.error)
        : null;
  const overlayLocked = isForecastOverlayControlLocked({
    overlaySaving: controller.overlaySaving,
    starting: controller.starting,
    job: controller.job,
  });
  const forecastMa20Locked =
    overlayLocked ||
    !controller.selectedRecord ||
    !controller.overlayEnabled ||
    !forecastMa20Available;

  return (
    <aside
      className="forecast-panel"
      aria-label={`${symbol} forecast`}
    >
      <header className="forecast-head">
        <div>
          <span className="forecast-eyebrow">Experimental sampled forecast</span>
          <h3>24 Trading-Hour Probabilistic Forecast</h3>
          <p>Thirty independent local paths, generated only on request.</p>
        </div>
        <span className="forecast-path-chip num">30 paths</span>
      </header>

      <div className="forecast-action-card" aria-busy={view.showProgress}>
        <button
          type="button"
          className="forecast-primary"
          disabled={view.buttonDisabled || controller.overlaySaving}
          onClick={() => void controller.run()}
        >
          {view.buttonLabel}
        </button>
        {!view.showProgress && (
          <p className={unavailableReason ? 'is-unavailable' : ''}>{view.statusText}</p>
        )}
        {view.showProgress && (
          <>
            <ForecastProgress
              job={controller.job}
              percent={view.percent}
              statusText={view.statusText}
            />
            {controller.job &&
              isActiveForecastStage(controller.job.stage) && (
              <button
                type="button"
                className="forecast-cancel"
                disabled={controller.cancelling}
                aria-label={`Cancel forecast for ${symbol}`}
                onClick={() => void controller.cancel()}
              >
                {controller.cancelling ? 'Cancelling…' : 'Cancel Forecast'}
              </button>
            )}
          </>
        )}
      </div>

      {failure && (
        <div className="forecast-error" role="alert">
          <strong>{failure.title}</strong>
          <span>{failure.message}</span>
          {failure.command && <code>{failure.command}</code>}
          <p>
            <b>Next step</b>
            <span>{failure.recovery}</span>
          </p>
        </div>
      )}

      <ForecastHistory
        records={controller.records}
        selectedId={controller.selectedId}
        selecting={controller.selecting}
        onSelect={(forecastId) => void controller.selectSaved(forecastId)}
      />

      <label
        className={`forecast-overlay-toggle ${
          controller.selectedRecord && !overlayLocked
            ? ''
            : 'is-disabled'
        }`}
      >
        <span>
          <strong>Show forecast on chart</strong>
          <small>
            {controller.selectedRecord
              ? controller.overlaySaving
                ? 'Saving overlay preference…'
                : overlayLocked
                  ? 'Overlay controls unlock after the active forecast finishes.'
                : 'Median and p10–p90 sampled range use the main price scale.'
              : 'Run or select a completed forecast first.'}
          </small>
        </span>
        <input
          type="checkbox"
          checked={controller.overlayEnabled}
          disabled={!controller.selectedRecord || overlayLocked}
          onChange={(event) =>
            void controller.setOverlayEnabled(event.currentTarget.checked)
          }
        />
        <i aria-hidden="true" />
      </label>

      <label
        className={`forecast-overlay-toggle ${
          forecastMa20Locked ? 'is-disabled' : ''
        }`}
      >
        <span>
          <strong>Project MA20 through forecast</strong>
          <small>
            {!controller.selectedRecord
              ? 'Run or select a completed forecast first.'
              : !controller.overlayEnabled
                ? 'Turn on the forecast chart overlay first.'
                : !forecastMa20Available
                  ? `Available on 1M–1Y chart ranges${
                      chartInterval ? `; current interval is ${chartInterval}` : ''
                    }.`
                  : overlayLocked
                    ? 'Projection controls unlock after the active forecast finishes.'
                    : 'Extends MA20 with forecast median closes; visualization only, model inputs stay unchanged.'}
          </small>
        </span>
        <input
          type="checkbox"
          checked={forecastMa20Enabled}
          disabled={forecastMa20Locked}
          onChange={(event) =>
            onForecastMa20Change(event.currentTarget.checked)
          }
        />
        <i aria-hidden="true" />
      </label>

      {controller.selectedRecord && (
        <>
          <ForecastSummary record={controller.selectedRecord} />
          <ForecastHistoricalComparison
            comparison={controller.historicalComparison}
            loading={controller.comparisonLoading}
            error={controller.comparisonError}
          />
        </>
      )}

      <footer className="forecast-disclaimer">
        <strong>Experimental sampled forecast.</strong>
        <span>
          Path frequency is not calibrated certainty and does not include news,
          earnings, macro releases, or unexpected events.
        </span>
      </footer>
    </aside>
  );
}
