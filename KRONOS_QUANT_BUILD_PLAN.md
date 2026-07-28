# Quant + Kronos Build Plan

This plan converts `KRONOS_QUANT_FORECAST_ARCHITECTURE.md` into small, ordered
chunks that an AI agent can implement and verify independently.

## Working rules

- Forecasts run only after the user presses **Run Forecast**.
- Kronos, Python, model weights, and forecast history stay lazy.
- Production runs use exactly 30 independent paths and 24 valid one-hour
  trading bars.
- Progress represents completed work. Never animate a fake percentage.
- The Electron main process owns jobs, persistence, Python, and market-data
  validation. The renderer receives a narrow typed API.
- Every chunk updates `CHANGELOG.md` and runs its listed checks.
- UI chunks require keyboard access, visible focus, semantic status/error
  messaging, reduced-motion support, stable layout, and no color-only meaning.
- Do not advance to a later phase while the current phase has failing checks.

## Progress checklist

- [x] Chunk 1.1 — Shared contracts and truthful progress rules
- [x] Chunk 1.2 — IPC surface and main-process mock job registry
- [x] Chunk 1.3 — Atomic forecast store
- [x] Chunk 1.4 — Forecast panel using the mock runner
- [x] Chunk 2.1 — Dedicated one-hour history fetch
- [x] Chunk 2.2 — Candle normalization and validation
- [x] Chunk 2.3 — Exchange-aware future timestamps
- [x] Chunk 3.1 — Python NDJSON worker shell
- [x] Chunk 3.2 — Kronos-mini adapter
- [x] Chunk 3.3 — Thirty-path stochastic runner
- [x] Chunk 3.4 — Metrics and aggregation
- [x] Chunk 4.1 — Real worker orchestration
- [x] Chunk 4.2 — Setup and diagnostics UX
- [x] Chunk 5.1 — Median and uncertainty overlay
- [x] Chunk 5.2 — Saved forecast history
- [x] Chunk 5.3 — Historical comparison
- [x] Chunk 6.1 — Full integration and resilience suite
- [x] Chunk 6.2 — Packaging and notices
- [x] Post-release improvement — Measured forecast ETA with terminal-state cleanup
- [x] Post-release fix — Packaged Forecast runtime selection and path-21 validation
- [x] Post-release fix — Cross-ticker repair bounds and global Escape closing

## Phase 1 — Product foundation

### Chunk 1.1 — Shared contracts and truthful progress rules

Scope:

- Add fixed v1 model/configuration constants.
- Add versioned request, progress, result, provenance, evaluation, and record
  contracts.
- Add stable forecast error codes.
- Add legal job-stage transitions.
- Add pure guards for path progress, monotonic updates, and persisted completion.

Files:

- `src/shared/forecast.ts`
- `scripts/test-quant.mjs`

Required checks:

- Path 1/10/20/30 maps to 8/35/65/95 percent.
- Invalid path counts are rejected.
- Stage, sequence, percentage, and completed-path regressions are rejected.
- Running-path progress cannot exceed 95 percent.
- Completion cannot reach 100 percent without 30 paths and a persisted record ID.

### Chunk 1.2 — IPC surface and main-process mock job registry

Scope:

- Add forecast IPC names to `src/shared/ipc.ts`.
- Extend `QuantApi` and preload with run, cancel, current-job, saved-history,
  overlay-setting, and event-subscription methods.
- Add a main-process in-memory registry with one active job globally.
- Use a deterministic mock runner; no Python or Kronos import.
- Keep the mock at 99 percent with `PERSISTENCE_FAILED` whenever durable storage
  is unavailable.
- Validate every renderer request in main.

Required checks:

- Invalid symbols and request shapes fail with stable codes.
- A second concurrent job is rejected with the active symbol.
- Renderer reload can recover current progress.
- Subscription methods return working unsubscribe callbacks.

### Chunk 1.3 — Atomic forecast store

Scope:

- Store records below Electron `userData/forecasts/v1`.
- Add atomic writes, symbol-safe paths, index recovery, seven-day expiration,
  20-record per-symbol cap, and 100 MB global cap.
- Persist overlay visibility separately from forecast records.
- Keep reruns immutable.

Required checks:

- TTL is exactly seven days.
- Expired records are removed on startup, list, and save.
- Reruns create distinct records.
- Interrupted/temp writes do not corrupt the last valid record.
- Malformed records are ignored and reported safely.

### Chunk 1.4 — Forecast panel using the mock runner

Scope:

- Add a **Forecast** tab to the chart inspector.
- Add `ForecastPanel`, progress, summary, history, and state hook components.
- Show honest empty, running, calculating, completed, unavailable, and retry
  states.
- Add persistent **Show forecast on chart** control, initially without chart
  drawing.

UI requirements:

- Keep one clear primary action.
- Use `role="status"` for progress and `role="alert"` for failures.
- Expose numeric progress in text, not only in a ring.
- Preserve panel geometry while loading.
- Explain disabled actions next to the control.
- Keep tap targets at least 40 px and retain visible keyboard focus.
- Honor `prefers-reduced-motion`.

Required checks:

- Keyboard and screen-reader state is understandable.
- Progress labels match the contract.
- Overlay control is disabled without a completed record.
- Panel survives tab switches and chart reopen.
- Add a forecast-panel smoke screenshot.

## Phase 2 — Forecast market data

### Chunk 2.1 — Dedicated one-hour history fetch

Scope:

- Add a dedicated request for roughly 360 completed one-hour candles.
- Include symbol, type, exchange/time zone, OHLCV, amount/proxy, adjustment, and
  source provenance.
- Do not reuse the visible chart range as forecast input.

Required checks:

- Opening a ticker does not issue this request.
- The request runs only after **Run Forecast**.
- SAMPLE fallback is never accepted for forecasting.

### Chunk 2.2 — Candle normalization and validation

Scope:

- Drop partial candles.
- Enforce monotonic unique timestamps, finite positive OHLC, valid OHLC shape,
  sufficient history, consistent adjustment, and amount fallback.
- Return stable, actionable error codes.

Required checks:

- Reject stale, sample, duplicate, unordered, non-finite, non-positive, malformed,
  and insufficient history.
- Verify split adjustment applies consistently to all OHLC fields.

### Chunk 2.3 — Exchange-aware future timestamps

Scope:

- Produce the next 24 valid one-hour U.S. market bars.
- Skip closures, overnight periods, weekends, and holidays.
- Save exchange/time-zone assumptions in provenance.

Required checks:

- Friday forecasts continue on valid Monday bars.
- Holiday closures are skipped.
- DST transitions retain correct exchange-local sessions.

## Phase 3 — Local forecast engine

### Chunk 3.1 — Python NDJSON worker shell

Scope:

- Add typed NDJSON request/event protocol, health check, stderr logging,
  cancellation, timeout, and clean shutdown.
- Spawn a fixed script with argument arrays and `shell: false`.
- Keep the worker lazy and main-process-owned.

Required checks:

- Malformed messages are rejected.
- Worker crashes and timeouts become stable errors.
- Cancellation occurs between paths.
- Ordinary app startup does not launch Python.

### Chunk 3.2 — Kronos-mini adapter

Scope:

- Add pinned Python requirements and developer setup script.
- Lazy-load `NeoQuasar/Kronos-mini` and its tokenizer.
- Normalize input once where practical.
- Record model, tokenizer, device, and pinned Kronos commit.

Required checks:

- Setup verifies Python and Kronos import.
- Model loading starts only after manual invocation.
- Setup/model errors are actionable.

### Chunk 3.3 — Thirty-path stochastic runner

Scope:

- Run 30 independent `sample_count=1` predictions with saved unique seeds.
- Retry a failed path once, then fail the job.
- Emit progress after each real completed path.
- Enforce output candle validity and repair limits.
- Fail a path that requires more than 24 repaired scalar values.

Required checks:

- Exactly 30 paths are required.
- Fixed seeds reproduce mocked outputs.
- One event is emitted per completed path.
- Path 30 ends at 95 percent.
- Two failures on one path fail the full job.

### Chunk 3.4 — Metrics and aggregation

Scope:

- Calculate upside/downside frequency, median/mean return, historical and path
  volatility, volatility amplification, and per-timestamp percentile bands.
- Keep raw close paths in the record.
- Use population standard deviation for log-return volatility and linear
  interpolation for percentiles.

Required checks:

- Cover ties, flat history, extremes, NaN rejection, percentiles, and known
  deterministic fixtures.
- Never label sampled frequency as confidence.

## Phase 4 — Production orchestration

### Chunk 4.1 — Real worker orchestration

Scope:

- Replace the mock runner behind the existing API.
- Add lazy start, ten-minute idle shutdown, activity timeout, retry, cancellation,
  and one-job global lock.
- Persist before emitting 100 percent.

Required checks:

- A warm worker is reused.
- An idle worker exits.
- Worker restart after crash is clean.
- Renderer reload restores live job state.

### Chunk 4.2 — Setup and diagnostics UX

Scope:

- Surface preparing, downloading, loading, and actionable setup states.
- Show byte progress only when real byte totals exist.
- Keep detailed logs out of renderer messages.

UI requirements:

- Avoid indeterminate UI when a more specific status is available.
- Do not imply path generation during model download.
- Errors include one clear recovery action.

## Phase 5 — Chart overlay and history

### Chunk 5.1 — Median and uncertainty overlay

Scope:

- Add median series, p10–p90 band primitive, and forecast-start divider.
- Use the price chart scale and exchange-aware future timestamps.
- Remove primitives cleanly on symbol/toggle changes.

UI requirements:

- Use a restrained translucent band with sufficient line contrast.
- Keep historical candles dominant.
- Avoid rendering all 30 paths by default.
- Provide non-color labels/legend and reduced-motion behavior.

### Chunk 5.2 — Saved forecast history

Scope:

- Add saved-record selector, generated/expiration times, immutable reruns, and
  restored overlay preference.
- Default the overlay on after a successful run.

Required checks:

- Reopening a chart restores the latest unexpired forecast.
- Switching records never mutates original forecast values.

### Chunk 5.3 — Historical comparison

Scope:

- Align actual completed candles by timestamp.
- Support partial and matured evaluations.
- Calculate final direction, median-line absolute percentage error, and p10–p90
  coverage.

Required checks:

- Missing bars do not shift array alignment.
- Partial forecasts remain partial.
- UI says **Historical comparison**, never verified accuracy.

## Phase 6 — Release readiness

### Chunk 6.1 — Full integration and resilience suite

Scope:

- Add fake-worker integration tests and fast UI mode.
- Cover restart, persistence, expiration, cancellation, crash, stale data, and
  progress invariants.
- Run typecheck, unit tests, production build, and smoke flows.

### Chunk 6.2 — Packaging and notices

Scope:

- Add Kronos MIT attribution and third-party notices.
- Package platform-specific sidecar/runtime for macOS arm64 and Windows x64.
- Keep model weights on-demand with identity/checksum verification.
- Document remaining CPU/MPS/CUDA limitations.

## Per-chunk handoff template

Each completed chunk must report:

1. Scope completed.
2. Files changed.
3. Commands and checks run.
4. Manual UI checks, when applicable.
5. Known limitations.
6. Exact next chunk.
