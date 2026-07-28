# Quant + Kronos Manual Probabilistic Forecast

## Architectural Specification for Codex

**Status:** Implementation-ready v1 specification
**Primary application:** Quant desktop market terminal
**Forecast engine:** Kronos
**Primary target assets:** U.S. stocks and ETFs
**Execution model:** Manual, local, on-demand forecast only

---

## 1. Source Repositories

Codex must inspect both repositories before making architectural changes.

### Working application repository

- Quant: https://github.com/eisenjimmy/Quant

Clone this repository as the project that will be modified:

```bash
git clone https://github.com/eisenjimmy/Quant.git
cd Quant
npm install
npm run typecheck
```

### Forecast-model repository

- Kronos: https://github.com/shiyu-coder/Kronos

Bring Kronos into the project as a pinned dependency, preferably as a Git submodule during development:

```bash
git submodule add https://github.com/shiyu-coder/Kronos.git vendor/Kronos
git submodule update --init --recursive
```

Record the exact Kronos commit used in `vendor/KRONOS_COMMIT.txt` or retain the pinned submodule commit. Do not track a floating branch in production builds.

### Behavioral reference only

- Kronos demo: https://github.com/shiyu-coder/Kronos-demo

The demo is useful for understanding the 30-path upside-frequency and volatility-amplification calculations. It is **not** a runtime dependency. Reimplement the required behavior against the official MIT-licensed Kronos repository rather than copying the demo wholesale.

---

## 2. Product Goal

Add an optional **Forecast** feature to Quant's existing stock/ETF chart workspace.

Opening or selecting a ticker must remain lightweight. Quant must **not** automatically load Kronos, download model weights, start Python, fetch forecast-specific history, or run inference when the user opens a chart.

The user explicitly starts the process by pressing:

> **Run Forecast**

The app then:

1. Validates the selected symbol and live candle data.
2. Lazily starts the local Python/Kronos worker.
3. Loads Kronos only when required.
4. Generates 30 distinct probabilistic forecast paths.
5. Updates a real progress percentage after each completed path.
6. Aggregates the paths into probabilities and percentile bands.
7. Overlays the forecast on Quant's existing price chart.
8. Saves the completed forecast locally.
9. Restores it when the app or chart window is reopened.
10. Expires and removes the saved forecast after seven days.
11. Allows the user to compare an older forecast with the actual price movement that followed.

This feature is informational and experimental. It must not produce orders, trading automation, guaranteed outcomes, or language implying certainty.

---

## 3. Required User Experience

## 3.1 Forecast panel location

Add a dedicated inspector tab or panel within `ChartModal.tsx`:

```text
Signal | Forecast | Quant AI | Journal/News
```

Match the existing Quant design system, spacing, typography, motion tokens, loading behavior, and reduced-motion support.

## 3.2 Controls

The Forecast panel must include:

- Primary action button.
- Progress spinner/ring with a numeric percentage.
- Forecast overlay on/off toggle.
- Forecast summary metrics.
- Generated timestamp and expiration timestamp.
- Saved-forecast selector/history.
- Error/retry state.
- Experimental disclaimer.

### Button states

| State | Button label | Behavior |
|---|---|---|
| No forecast | `Run Forecast` | Starts a manual job |
| Running | `Running 12/30 · 41%` | Disabled; spinner visible |
| Post-processing | `Calculating forecast · 97%` | Disabled |
| Completed | `Rerun Forecast` | Starts a new immutable forecast record |
| Failed | `Retry Forecast` | Restarts after showing the error |
| Unsupported/stale/sample data | `Forecast unavailable` | Disabled with reason |

### Overlay toggle

Label:

> **Show forecast on chart**

Rules:

- Toggle changes visibility only.
- Turning it off must not delete the saved result.
- Default to on immediately after a successful run.
- Restore the user's last toggle state when the chart window reopens.
- The toggle is disabled when no completed forecast exists.

## 3.3 Progress behavior

Progress must reflect real work. Do not use a timer that fakes progress.

Recommended mapping:

```text
0%       Job accepted
1–2%     Candle validation and normalization
3–5%     Worker/model preparation
5–95%    Thirty completed forecast paths
96%      Validate and repair path structure
97%      Calculate probability metrics
98%      Build percentile/mean/median series
99%      Persist forecast and prepare chart payload
100%     Forecast visible and complete
```

After path `n` completes:

```ts
const percent = 5 + Math.floor((n / 30) * 90);
```

Expected examples:

```text
Path 1/30   -> 8%
Path 10/30  -> 35%
Path 20/30  -> 65%
Path 30/30  -> 95%
```

At 100%, replace `Run Forecast` with `Rerun Forecast`.

First-use model download or setup can take longer than ordinary runs. During that stage, display honest status text such as `Downloading Kronos-mini`, `Loading model`, or `Preparing forecast engine`. If byte-level download progress is available, show it as a secondary progress value; do not pretend that paths are being generated before inference begins.

Preparation events carry an explicit `preparing`, `downloading`, or `loading`
phase. The 3–5% value remains overall forecast-workflow progress, not model
download progress. Quant does not display downloaded bytes unless both a real
downloaded-byte count and a positive total-byte count are available.

Active setup, download, loading, and path-generation states provide a
keyboard-accessible **Cancel Forecast** action. Failed states show one
error-code-specific recovery path; detailed Python and native dependency errors
remain in main-process stderr rather than renderer messages.

---

## 4. Forecast Definition

## 4.1 Version-one model configuration

Use these fixed defaults initially:

```yaml
model: NeoQuasar/Kronos-mini
tokenizer: NeoQuasar/Kronos-Tokenizer-2k
paths: 30
lookback_bars: 360
input_interval: 1h
prediction_bars: 24
temperature: 1.0
top_p: 0.95
top_k: 0
volume_window: 24
```

Use Kronos-mini first because it is substantially lighter than Kronos-small/base and is the most appropriate default for a local desktop feature.

Do not expose advanced sampling parameters in the first UI. Store them in the forecast record so future versions can add expert settings without changing the schema.

## 4.2 What “next 24 hours” means for stocks and ETFs

Stocks and ETFs do not trade continuously. The engine must never invent overnight, weekend, or holiday candles as ordinary tradable periods.

For U.S. stocks and ETFs, define the v1 horizon as:

> **The next 24 valid one-hour market bars, using exchange-aware timestamps.**

UI heading:

> **24 Trading-Hour Probabilistic Forecast**

Do not label it simply `next 24 clock hours` for equities. Twenty-four one-hour market bars will span multiple regular trading sessions.

When Quant later supports continuously traded crypto assets, the same 24 one-hour bars can be labeled `Next 24 Hours`.

Future enhancement: add a `Next Trading Session` mode using 15-minute bars and approximately 26 regular-session steps.

## 4.3 Thirty independent paths

The official Kronos implementation averages `sample_count` internally. For the v1 manual progress requirement, do not call one `sample_count=30` job and pretend that individual paths completed.

Instead:

1. Normalize and validate the input once in the worker adapter where practical.
2. Run thirty real stochastic predictions with `sample_count=1`.
3. Use a different saved seed for each path.
4. Append each completed path to the in-memory job result.
5. Emit one progress event after each path completes.
6. Aggregate only after all thirty paths succeed.

Example seed strategy:

```python
base_seed = secrets.randbelow(2**31 - 1000)
path_seed = base_seed + path_index

random.seed(path_seed)
np.random.seed(path_seed)
torch.manual_seed(path_seed)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(path_seed)
```

Save `baseSeed` and every path seed in the forecast record for reproducibility and diagnostics.

If a path fails, retry that path once. If it fails again, fail the entire job rather than quietly calculating a probability from fewer than 30 paths.

## 4.4 Metrics

Calculate and display:

### Sampled upside frequency

```text
number of paths whose final close > last historical close / 30
```

UI label:

> **Sampled upside frequency**

Do not call this `model confidence` or a calibrated probability.

### Sampled downside frequency

```text
number of paths whose final close < last historical close / 30
```

### Median predicted return

```text
median((final path close / last historical close) - 1)
```

### Mean predicted return

Keep in the record; displaying it is optional.

### Volatility amplification frequency

1. Calculate historical log-return volatility using the final 24 completed historical bars.
2. For each forecast path, prepend the last historical close.
3. Calculate the path's forecast log-return volatility.
4. Count how many paths exceed historical volatility.
5. Divide by 30.

For v1, use population standard deviation (`ddof=0`). The final 24 historical
closes produce 23 historical log returns; prepending the last historical close
to each 24-bar forecast path produces 24 forecast log returns.

### Forecast bands

At every forecast timestamp calculate:

- Minimum, retained for diagnostics only.
- 10th percentile.
- 25th percentile.
- Median/50th percentile.
- Mean.
- 75th percentile.
- 90th percentile.
- Maximum, retained for diagnostics only.

Use linear percentile interpolation at position `(n - 1) × quantile`, matching
Quant's deterministic development runner.

Default chart display:

- Median forecast line.
- 10th–90th percentile shaded band.
- Forecast-start divider.

Do not use min-to-max as the primary uncertainty band because one extreme path can distort it.

---

## 5. Data Requirements

## 5.1 Dedicated forecast data request

Do not assume the currently displayed chart range contains enough bars. Add a dedicated forecast-history method that retrieves approximately 360 completed one-hour bars for the selected symbol.

The forecast request must include:

- Symbol.
- Asset type.
- Exchange/time zone when known.
- OHLC.
- Volume.
- Amount or calculated proxy.
- Timestamp.
- Source provenance.
- Adjustment status.

Kronos requires OHLC. Volume and amount are optional, but Quant should supply them when the upstream data supports them.

## 5.2 Validation rules

Reject the run when any of these are true:

- Quant is displaying bundled `SAMPLE` data.
- Fewer than the configured minimum history bars are available.
- Latest candle is stale beyond the expected market schedule.
- Timestamps are duplicated or non-monotonic.
- Required OHLC fields are missing.
- Any required values contain `NaN` or infinity.
- Prices are non-positive.
- The symbol is unsupported or malformed.
- The market calendar cannot produce valid future timestamps.

Drop the current partially formed candle. Use completed bars only.

## 5.3 Adjustments

Use one consistent historical series. Prefer split-adjusted OHLC so historical discontinuities do not dominate the model.

If an adjusted close is available, derive an adjustment factor and apply it consistently to open, high, low, and close. Store the adjustment method in data provenance.

## 5.4 Amount field

When the feed does not provide traded amount:

```text
amount = volume × typical price

typical price = (high + low + close) / 3
```

## 5.5 Output repair

After each path is denormalized, enforce basic candle validity:

```python
high = max(high, open, close)
low = min(low, open, close)
volume = max(volume, 0)
amount = max(amount, 0)
```

Record whether repairs were applied and how many values were repaired. Excessive repairs should fail validation rather than silently producing a chart.

Fail and retry a path when more than 24 scalar values require repair. This
permits at most one deterministic envelope/activity correction per forecast
candle while still rejecting broadly malformed output.
If the retry also exceeds that ceiling, fail the full forecast with
`OUTPUT_VALIDATION_FAILED`.

---

## 6. System Architecture

Quant already uses an Electron main/preload/React renderer split. Preserve it.

```text
┌──────────────────────────────────────────────────────────────┐
│ React Renderer                                               │
│ ForecastPanel + Chart forecast overlay + saved history       │
└─────────────────────────────┬────────────────────────────────┘
                              │ typed window.quant API
┌─────────────────────────────▼────────────────────────────────┐
│ Electron Preload Bridge                                      │
│ Narrow IPC methods and progress subscriptions                │
└─────────────────────────────┬────────────────────────────────┘
                              │ Electron IPC
┌─────────────────────────────▼────────────────────────────────┐
│ Electron Main Process                                        │
│ ForecastOrchestrator, candle fetch, worker lifecycle, store   │
└─────────────────────────────┬────────────────────────────────┘
                              │ NDJSON over stdin/stdout
┌─────────────────────────────▼────────────────────────────────┐
│ Local Python Sidecar                                         │
│ Kronos model, 30 path loop, real progress, aggregation        │
└──────────────────────────────────────────────────────────────┘
```

## 6.1 Why a Python sidecar

Quant is Electron/TypeScript. Kronos is Python/PyTorch. Keep PyTorch out of the renderer and communicate through the Electron main process.

Use a child process with newline-delimited JSON over standard input/output rather than opening a local HTTP port. Benefits:

- No port collisions.
- No local server exposure.
- Easy process ownership and cancellation.
- Natural streaming progress events.
- Compatible with Quant's existing security boundary.

Rules:

- Worker stdout contains NDJSON protocol messages only.
- Worker logs go to stderr.
- Electron validates every worker message.
- Never interpolate a ticker into a shell command.
- Spawn a fixed executable/script path with an argument array.

## 6.2 Lazy lifecycle

The Python process and model must be lazy.

1. User opens a stock chart: no forecast process starts.
2. User presses `Run Forecast`: Electron performs data preflight.
3. Electron starts the worker if it is not already running.
4. Worker loads the model once.
5. Worker handles the requested job.
6. Worker stays warm for a configurable idle period, recommended 10 minutes.
7. After the idle timeout, Electron shuts down the worker to release RAM/VRAM.
8. Model weights remain cached on disk for future runs.

Only one forecast job may run at a time in v1. If another symbol requests a run, show that a forecast is already running and provide the active symbol. Do not launch concurrent model jobs by default.

A job may continue if the user switches to another Quant tab. Returning to the original symbol must restore live progress from the main-process job registry.

---

## 7. Proposed Repository Changes

```text
Quant/
├── vendor/
│   ├── Kronos/                         # pinned Git submodule
│   └── KRONOS_COMMIT.txt
├── forecast-engine/
│   ├── worker.py                       # NDJSON protocol entrypoint
│   ├── engine.py                       # model lifecycle and 30-path runner
│   ├── kronos_adapter.py               # official Kronos integration
│   ├── metrics.py                      # probabilities and percentile bands
│   ├── validation.py                   # input/output validation
│   ├── market_time.py                  # future timestamp validation helpers
│   ├── protocol.py                     # typed request/event objects
│   ├── requirements.txt
│   └── tests/
├── src/
│   ├── main/
│   │   ├── services/
│   │   │   ├── forecastData.ts         # dedicated OHLCV history request
│   │   │   ├── forecastOrchestrator.ts # job state and worker communication
│   │   │   ├── forecastStore.ts        # atomic seven-day persistence
│   │   │   ├── forecastEvaluator.ts    # actual-vs-forecast evaluation
│   │   │   └── kronosWorker.ts         # child process lifecycle
│   │   ├── main.ts                     # register forecast IPC handlers
│   │   └── preload.ts                  # expose typed forecast bridge
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── ChartModal.tsx          # add Forecast inspector tab
│   │   │   └── chart/
│   │   │       ├── ForecastPanel.tsx
│   │   │       ├── ForecastProgress.tsx
│   │   │       ├── ForecastSummary.tsx
│   │   │       ├── ForecastHistory.tsx
│   │   │       ├── ForecastBandPrimitive.ts
│   │   │       └── useForecast.ts
│   │   └── styles/
│   │       └── forecast.css
│   └── shared/
│       ├── forecast.ts                 # shared forecast contracts
│       ├── ipc.ts                      # forecast IPC channel names
│       └── types.ts                    # window.quant API additions
├── scripts/
│   ├── setup-kronos.mjs                # developer environment setup
│   └── package-release.mjs             # later sidecar packaging support
└── THIRD_PARTY_NOTICES.md
```

Codex must adapt names to the actual current repository instead of duplicating existing abstractions.

---

## 8. Shared TypeScript Contracts

Suggested contracts:

```ts
export type ForecastJobStage =
  | "idle"
  | "validating"
  | "preparing-engine"
  | "running-paths"
  | "post-processing"
  | "persisting"
  | "completed"
  | "failed"
  | "cancelled";

export interface ForecastRunRequest {
  symbol: string;
  assetType: "stock" | "etf";
  requestedAt: string;
  paths: 30;
  horizonBars: 24;
  interval: "1h";
}

export interface ForecastProgressEvent {
  jobId: string;
  symbol: string;
  stage: ForecastJobStage;
  percent: number;
  completedPaths: number;
  totalPaths: 30;
  message: string;
  updatedAt: string;
}

export interface ForecastPoint {
  timestamp: string;
  mean: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
}

export interface ForecastMetrics {
  sampledUpsideFrequency: number;
  sampledDownsideFrequency: number;
  volatilityAmplificationFrequency: number;
  medianPredictedReturn: number;
  meanPredictedReturn: number;
  historicalVolatility: number;
  medianForecastVolatility: number;
}

export interface ForecastProvenance {
  marketDataSource: string;
  marketDataIsSample: false;
  latestCompletedCandleAt: string;
  historyBars: number;
  adjusted: boolean;
  adjustmentMethod?: string;
  modelId: string;
  tokenizerId: string;
  kronosCommit: string;
  device: "cuda" | "mps" | "cpu";
  temperature: number;
  topP: number;
  topK: number;
  pathCount: 30;
  baseSeed: number;
  pathSeeds: number[];
}

export interface ForecastEvaluation {
  status: "not-started" | "partial" | "matured" | "unavailable";
  evaluatedAt?: string;
  actualFinalClose?: number;
  directionCorrect?: boolean;
  medianAbsolutePercentageError?: number;
  p10P90Coverage?: number;
  actualPointsAvailable: number;
  expectedPoints: number;
}

export interface ForecastRecord {
  schemaVersion: 1;
  id: string;
  symbol: string;
  assetType: "stock" | "etf";
  generatedAt: string;
  expiresAt: string;
  forecastStartAt: string;
  forecastEndAt: string;
  lastHistoricalClose: number;
  horizonLabel: "24-trading-hours";
  metrics: ForecastMetrics;
  aggregate: ForecastPoint[];
  closePaths: number[][];
  provenance: ForecastProvenance;
  evaluation: ForecastEvaluation;
  warnings: string[];
}
```

Raw close paths are only 30 × 24 values and are small enough to save. Full OHLCV paths may be retained in a compressed/debug record if needed, but the renderer should receive only what it needs.

---

## 9. Renderer-to-Main API

Extend `window.quant` through the preload bridge. The renderer must not directly access the filesystem, Python, or Yahoo endpoints.

Suggested API:

```ts
window.quant.forecast.run(request)
window.quant.forecast.cancel(jobId)
window.quant.forecast.getJob(symbol)
window.quant.forecast.listSaved(symbol)
window.quant.forecast.getSaved(forecastId)
window.quant.forecast.setOverlayEnabled(symbol, enabled)
window.quant.forecast.getOverlayEnabled(symbol)
window.quant.forecast.onProgress(callback) // returns unsubscribe
window.quant.forecast.onCompleted(callback) // returns unsubscribe
window.quant.forecast.onFailed(callback) // returns unsubscribe
```

Suggested IPC channels:

```text
forecast:run
forecast:cancel
forecast:get-job
forecast:list-saved
forecast:get-saved
forecast:set-overlay-enabled
forecast:get-overlay-enabled
forecast:progress
forecast:completed
forecast:failed
```

Validate every request and response in the main process. A runtime schema library is optional; lightweight explicit validators are acceptable if Quant avoids adding dependencies.

---

## 10. Python Worker Protocol

Use one JSON object per line.

### Run request

```json
{
  "type": "run",
  "jobId": "fc_...",
  "payload": {
    "symbol": "SPY",
    "paths": 30,
    "predLen": 24,
    "interval": "1h",
    "temperature": 1.0,
    "topP": 0.95,
    "topK": 0,
    "futureTimestamps": [],
    "candles": []
  }
}
```

### Progress event

```json
{
  "type": "progress",
  "jobId": "fc_...",
  "stage": "running-paths",
  "completedPaths": 12,
  "totalPaths": 30,
  "percent": 41,
  "message": "Completed path 12 of 30"
}
```

### Completed event

```json
{
  "type": "completed",
  "jobId": "fc_...",
  "result": {
    "metrics": {},
    "aggregate": [],
    "closePaths": [],
    "provenance": {}
  }
}
```

### Failed event

```json
{
  "type": "failed",
  "jobId": "fc_...",
  "code": "INSUFFICIENT_HISTORY",
  "message": "At least 300 completed one-hour candles are required."
}
```

### Cancellation

```json
{
  "type": "cancel",
  "jobId": "fc_..."
}
```

The worker checks cancellation between paths. A running PyTorch forward pass does not need to be interrupted mid-path in v1.

---

## 11. Local Persistence and Seven-Day Expiration

Do not use renderer-only `localStorage` as the source of truth. Use an Electron main-process store under `app.getPath("userData")`.

Recommended layout:

```text
<userData>/forecasts/v1/
├── index.json
├── overlay-settings.json
└── symbols/
    ├── SPY/
    │   ├── fc_2026....json
    │   └── fc_2026....json
    └── QQQ/
        └── fc_2026....json
```

## 11.1 Expiration

For every completed record:

```ts
expiresAt = generatedAt + 7 * 24 hours;
```

Prune expired records:

- At application startup.
- Whenever a forecast is listed.
- After a new forecast is saved.
- Before release packaging smoke tests finish.

Use atomic writes:

1. Write to a temporary file.
2. Flush/close it.
3. Rename over the destination.

Recommended caps:

- Maximum 20 unexpired forecasts per symbol.
- Maximum 100 MB total forecast storage.
- Oldest records removed first when the cap is exceeded.

A rerun creates a new immutable record. Do not overwrite the prior forecast because the user wants to review whether it was correct.

---

## 12. Historical Forecast Review

Add a compact saved-forecast selector:

```text
Latest · Jul 25, 9:42 PM
Jul 24, 3:58 PM
Jul 22, 10:13 AM
```

Selecting a saved forecast:

- Loads its original percentile band and median path.
- Shows the original forecast start marker.
- Overlays subsequently observed actual candles when available.
- Displays whether the forecast has matured.
- Displays evaluation metrics without modifying the original forecast values.

### Evaluation logic

When the user opens a saved forecast:

1. Fetch actual completed bars that match the saved future timestamps.
2. Align by timestamp, never by array position alone.
3. If only some timestamps have occurred, mark evaluation `partial`.
4. Once the final forecast timestamp is available, mark it `matured`.
5. Calculate:
   - Final-direction correctness.
   - Median-line absolute percentage error.
   - Percentage of actual closes inside the p10–p90 band.
6. Save the evaluation as mutable metadata while leaving the original forecast immutable.

Do not describe one correct forecast as proof of model skill. The UI should say `Historical comparison`, not `Verified accuracy`.

---

## 13. Chart Overlay

Quant uses Lightweight Charts. Add forecast rendering to the main price pane without changing the existing historical candle data.

Required visual layers:

1. Existing historical candlestick series.
2. Vertical forecast-start divider.
3. Median forecast line.
4. P10–P90 translucent band.
5. Optional p10 and p90 boundary lines.
6. Optional actual-price comparison for a historical forecast.

Preferred implementation:

- Implement `ForecastBandPrimitive.ts` as a chart primitive/pane renderer that draws the polygon between p10 and p90.
- Keep the median as a normal line series.
- Keep forecast points on the same price scale as the underlying symbol.
- Use future exchange-aware timestamps.
- Remove all series/primitives cleanly when the toggle turns off or the symbol changes.
- Honor reduced-motion preferences.

Do not render all 30 paths by default. Add a future/debug option if individual paths are needed.

Summary cards should include:

```text
Sampled upside frequency       63.3%
Median predicted return        +0.42%
P10–P90 final-price range      $000.00–$000.00
Volatility amplification       70.0%
Paths                          30
Model                          Kronos-mini
Generated                      <local time>
Expires                        <local time>
```

Add a visible notice:

> Experimental sampled forecast. Path frequency is not calibrated certainty and does not include news, earnings results, macro releases, or unexpected events.

---

## 14. Job State Management

The Electron main process is the source of truth for active job state.

Suggested state machine:

```text
IDLE
  -> VALIDATING
  -> PREPARING_ENGINE
  -> RUNNING_PATHS
  -> POST_PROCESSING
  -> PERSISTING
  -> COMPLETED

Any active state
  -> FAILED
  -> CANCELLED
```

Rules:

- Ignore duplicate progress events with an older sequence number.
- Percent may never decrease.
- Completed paths may never decrease.
- Percent may not exceed 95 while paths are running.
- Only a successfully persisted record may emit 100%.
- Renderer reloads must be able to call `getJob(symbol)` and recover progress.
- App shutdown terminates the child process. Partial jobs are not saved as forecasts.

---

## 15. Error Handling

Define stable error codes:

```text
FORECAST_ALREADY_RUNNING
PYTHON_NOT_AVAILABLE
ENGINE_SETUP_FAILED
MODEL_DOWNLOAD_FAILED
MODEL_LOAD_FAILED
MARKET_DATA_UNAVAILABLE
SAMPLE_DATA_NOT_ALLOWED
STALE_MARKET_DATA
INSUFFICIENT_HISTORY
INVALID_CANDLES
MARKET_CALENDAR_FAILED
PATH_GENERATION_FAILED
OUTPUT_VALIDATION_FAILED
PERSISTENCE_FAILED
JOB_CANCELLED
WORKER_CRASHED
FORECAST_TIMEOUT
```

UI errors must be actionable and concise. Preserve detailed logs in the main-process log file/stderr, not in the renderer.

Recommended timeout:

- Configurable, default 20 minutes for a 30-path CPU job.
- Reset/extend the activity timeout whenever real progress is received.

If the worker crashes, mark the job failed, terminate the process, and start a clean worker on retry.

---

## 16. Packaging Strategy

## Phase 1: Developer integration

Requirements:

- Node.js 20+ for Quant.
- Python 3.10+ for Kronos.
- Local virtual environment under a gitignored directory.
- Model weights downloaded only on first manual use.

Suggested command:

```bash
npm run setup:forecast
```

This command should:

1. Verify Python version.
2. Create `.forecast-venv`.
3. Install pinned requirements.
4. Verify Kronos import.
5. Run a tiny worker health check.

## Phase 2: Release packaging

After the feature works reliably:

- Bundle a platform-specific Python sidecar or frozen executable.
- Build separately for macOS arm64 and Windows x64.
- Keep model weights as an on-demand download to prevent release ZIP bloat.
- Verify checksum/model identity.
- Include the Kronos MIT license and third-party notices.
- Update `scripts/package-release.mjs` to copy the worker/runtime payload.

Do not block the first architectural implementation on fully bundling PyTorch into release ZIPs.

---

## 17. Performance Requirements

- No Kronos import or model load on ordinary Quant startup.
- No forecast-specific data fetch when merely opening a ticker.
- One forecast job at a time.
- Worker/model lazy-loaded on button press.
- Worker terminated after approximately 10 idle minutes.
- Completed forecast restored from disk without rerunning the model.
- UI remains responsive during inference.
- Renderer receives throttled progress events only when state changes.
- Rerunning the same symbol uses the warm model when available but always creates a new forecast record.

Potential later optimization:

- Cache tokenized historical context.
- Run small path batches.
- Return unaveraged samples from a maintained Kronos adapter.
- Add GPU/MPS selection and benchmarks.

Do not optimize by replacing real progress with simulated increments.

---

## 18. Security and Privacy

- Run inference locally by default.
- Do not send candles or forecasts to a new cloud service.
- Keep Python and filesystem access in the Electron main process.
- Validate symbols using a strict allowlist pattern and known Quant symbol metadata.
- Validate every worker message.
- Use fixed executable/script paths.
- Do not use `shell: true` when spawning the worker.
- Do not execute generated Python or user-provided code.
- Do not expose arbitrary local-file access through preload.
- Preserve Quant's existing CSP and renderer isolation.

---

## 19. Testing Plan

## TypeScript unit tests

- Progress mapping from paths 0–30.
- Percent never regresses.
- Job state transitions.
- Seven-day TTL calculation.
- Expired-record pruning.
- Atomic store behavior.
- Forecast metric formatting.
- Overlay toggle persistence.
- Timestamp alignment for historical evaluation.
- Rejection of sample/stale/invalid data.

## Python unit tests

- Protocol parsing.
- Deterministic path generation with fixed seed and mocked predictor.
- Exactly 30 paths required.
- Percent emitted after every completed path.
- Upside/downside calculations.
- Volatility amplification calculation.
- Percentile aggregation.
- Candle repair and excessive-repair failure.
- Cancellation between paths.

## Integration tests

- Electron main process starts a fake NDJSON worker.
- Progress reaches 95 only after path 30.
- Post-processing reaches 96–99.
- 100 occurs only after successful persistence.
- Worker crash produces a recoverable error.
- Renderer reload restores an active job.
- Completed forecast reopens after app restart.
- Expired forecast disappears after seven days.

## Smoke/E2E mode

Add a test-only fast mode:

```text
3 paths
2 prediction bars
mocked or fixture model output
```

Use this only for UI/smoke tests. Production mode remains fixed at 30 paths and 24 bars.

---

## 20. Acceptance Criteria

The feature is complete when all of the following are true:

1. Opening a ticker does not start Python or load Kronos.
2. `Run Forecast` is the only normal trigger for inference.
3. The selected Quant stock/ETF is used automatically; no duplicate symbol input is required.
4. Quant retrieves and validates dedicated forecast candles.
5. Forecasts are blocked on sample or stale data.
6. Exactly 30 independent paths are produced.
7. The progress percentage advances after each real completed path.
8. Path 30 ends at 95%, followed by real post-processing stages.
9. A saved result reaches 100% and changes the button to `Rerun Forecast`.
10. The median forecast and p10–p90 band overlay the stock chart.
11. The overlay has a persistent on/off toggle.
12. Closing and reopening the chart restores the saved forecast.
13. Rerunning creates a second historical record rather than overwriting the first.
14. Saved records expire after seven days.
15. An older forecast can be compared with subsequently observed actual prices.
16. The UI says `sampled upside frequency`, not `confidence`.
17. The UI clearly labels equity output as 24 trading hours.
18. The renderer never directly launches Python, writes forecast files, or fetches remote forecast data.
19. Type checking and all new tests pass.
20. Existing Quant chart, Signal Desk, Quant AI, journal, packaging, and smoke behavior remain functional.

---

## 21. Recommended Implementation Order for Codex

### Milestone 1 — Types, IPC, store, and mock UI

- Inspect Quant's existing architecture and conventions.
- Add shared contracts and IPC channels.
- Add `forecastStore.ts` with seven-day TTL.
- Add Forecast tab and state machine using a fake worker.
- Add progress UI, toggle, and saved-history selector.
- Add tests.

### Milestone 2 — Market data and timestamps

- Add dedicated 360-bar one-hour data request.
- Add completed-candle filtering and provenance.
- Add exchange-aware future timestamps.
- Reject sample/stale/invalid inputs.
- Add tests.

### Milestone 3 — Local worker and Kronos

- Add pinned Kronos dependency.
- Add Python NDJSON worker.
- Lazy-load Kronos-mini.
- Run 30 `sample_count=1` paths with unique seeds.
- Stream real path progress.
- Aggregate metrics and bands.
- Add Python and integration tests.

### Milestone 4 — Chart overlay and evaluation

- Add median line, p10–p90 band, and forecast divider.
- Add saved forecast selection.
- Add actual-vs-forecast evaluation.
- Add persistence/restart smoke coverage.

### Milestone 5 — Distribution

- Add setup script.
- Add third-party notices.
- Benchmark CPU, MPS, and CUDA paths.
- Package platform sidecar after developer mode is stable.

---

## 22. Codex Execution Prompt

Paste the following into Codex after placing this specification in the Quant repository:

```text
Implement the manual Kronos probabilistic forecast feature described in
KRONOS_QUANT_FORECAST_ARCHITECTURE.md.

Repositories to inspect:
1. https://github.com/eisenjimmy/Quant
2. https://github.com/shiyu-coder/Kronos
Behavioral reference only:
3. https://github.com/shiyu-coder/Kronos-demo

Work in the Quant repository. Preserve its Electron main/preload/renderer security
boundary and adapt to its current abstractions rather than creating duplicate
systems. Do not run a forecast automatically when a ticker is opened. The user
must press Run Forecast.

Build the implementation milestone by milestone. Start with types, IPC, local
persistence, a mock worker, Forecast panel, truthful progress state machine, and
tests. Then integrate dedicated live candle validation, the local Python NDJSON
worker, Kronos-mini, exactly 30 independent sample_count=1 paths, per-path progress
to 95%, post-processing to 99%, persistence at 100%, chart overlay, seven-day
history, and actual-vs-forecast review.

Do not call sampled path frequency model confidence. Do not use bundled SAMPLE
data. Do not fake progress. Do not overwrite prior forecasts when rerunning. Do
not load Python/PyTorch/Kronos during normal application startup. Keep inference
local and lazy. Run npm type checking and all tests after each milestone. Summarize
changed files, architectural decisions, commands, tests, and remaining packaging
limitations at the end of each milestone.
```

---

## 23. Final Product Language

Use these exact or equivalent labels:

```text
Run Forecast
Running path 12 of 30
Calculating forecast
Rerun Forecast
Show forecast on chart
24 Trading-Hour Probabilistic Forecast
Sampled upside frequency
Volatility amplification frequency
Median predicted return
Historical comparison
Experimental sampled forecast
```

Avoid:

```text
Guaranteed forecast
AI knows the stock will rise
66.7% certain
Model confidence: 66.7%
Risk-free signal
Buy/Sell recommendation
```
