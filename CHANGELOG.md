# Changelog

All notable changes to Quant are documented here.

## [2.0.0] - 2026-07-28

### Added

- Added right-click watchlist actions with a focused one-item Delete menu for stocks and ETFs.
- Added click-and-hold drag reordering within the ETF and stock sections, persisted across app restarts, plus Alt+Arrow keyboard reordering and screen-reader announcements.
- Added `KRONOS_QUANT_FORECAST_ARCHITECTURE.md` as the implementation specification for the planned manual Kronos probabilistic forecast feature.
- Added the Kronos repository as a pinned development submodule at `vendor/Kronos`.
- Added `KRONOS_QUANT_BUILD_PLAN.md` with six phases and small, independently verifiable implementation chunks.
- Added shared forecast v1 contracts, fixed Kronos-mini configuration, stable error codes, legal job-stage transitions, and truthful progress validation.
- Added a narrow typed forecast IPC/preload API for run, cancel, job recovery, saved-history placeholders, overlay settings, and progress/completion/failure subscriptions.
- Added a main-process forecast job registry with strict request validation, one-job global locking, cancellation, symbol-based progress recovery, and validated event broadcasting.
- Added a deterministic development runner that performs 30 mock path calculations and pauses honestly at 99% for persistence.
- Added an atomic main-process forecast store under Electron user data with seven-day expiry, immutable record IDs, startup/list/save pruning, index rebuilding, persistent overlay settings, a 20-record per-symbol cap, and a 100 MB global cap.
- Connected the development runner to durable storage so completion reaches 100% only after the record is flushed, renamed, indexed, and readable; unavailable storage still fails safely at 99%.
- Added a chart-inspector Forecast tab with explicit idle, running, completed, unavailable, and retry states; saved forecast selection; persisted overlay preference; and a clearly labeled development-mock summary.
- Added an accessible forecast progress treatment with numeric percentages, semantic status and alert messaging, visible keyboard focus, stable loading geometry, 40 px minimum controls, and reduced-motion support.
- Added a browser-only built-renderer Forecast preview harness for safe visual smoke checks without launching Electron.
- Added a forecast-only Yahoo history service that lazily requests three months of 60-minute data, removes the active partial bar, and retains the latest 360 completed candles.
- Added typed forecast-history payloads carrying symbol and asset type, exchange/time zone, OHLCV, calculated traded-amount proxy, live source provenance, and explicit adjustment status.
- Added fail-closed forecast candle normalization for unique ascending timestamps, finite positive OHLC, valid candle shape, non-negative volume and amount, minimum history, partial bars, and stale market data.
- Added consistent split adjustment using Yahoo adjusted-close factors across open, high, low, and close.
- Added a versioned U.S. equities calendar that produces 24 full one-hour regular-session bars while skipping overnight periods, weekends, full-day NYSE holidays, and 1:00 p.m. early closes.
- Added exchange, canonical Eastern time zone, market-calendar version, and regular-session assumptions to saved forecast provenance.
- Added a versioned typed NDJSON protocol and lazy Python worker shell with health checks, real progress events, cancellation, activity timeouts, stderr logging, and graceful shutdown.
- Added a main-process worker client that launches a fixed packaged script without a shell, maps Python/startup/crash/timeout failures to stable forecast errors, and stops idle or app-owned workers cleanly.
- Added eight pinned forecast-engine dependencies and `npm run setup:forecast`, which selects Python 3.10–3.12, creates an ignored local virtual environment, verifies the pinned Kronos source/imports, and checks worker health.
- Added a lazy Kronos-mini adapter that loads and caches the exact model/tokenizer only after a run, selects CUDA/MPS/CPU, prepares normalized input once for path reuse, and exposes immutable model, tokenizer, device, and commit provenance.
- Added the real forecast path engine with exactly 30 independent `sample_count=1` generations, one unique saved seed per path, same-seed single retries, cancellation between paths, and progress only after validated completion.
- Added fail-closed path validation and bounded repair for OHLC shape, negative volume, and negative amount; more than 24 repaired scalar values rejects and retries the path.
- Added deterministic forecast metrics for strict upside/downside frequency, median and mean return, historical and per-path log-return volatility, volatility amplification frequency, and median forecast volatility.
- Added 24-point close-price aggregation with diagnostic min/max, mean, median, and linearly interpolated p10/p25/p75/p90 bands while retaining all 30 raw close paths.
- Added a production forecast orchestrator that converts validated Python worker output into immutable records, propagates cancellation to the active sidecar job, and rejects inconsistent output before persistence.
- Added explicit preparing, downloading, and loading phases based on the local Hugging Face cache state, plus keyboard-accessible cancellation during active forecast work.
- Added concise error-code-specific Forecast recovery cards for setup, model download/load, market data, validation, persistence, timeout, and worker failures.
- Added the main-chart forecast overlay with a high-contrast median series, restrained p10–p90 band primitive, forecast-start divider, and non-color legend.
- Added a saved-forecast history card with immutable snapshot counts, generated and expiration times, latest-record labeling, and accessible snapshot loading state.
- Added saved-forecast historical comparison with exact-timestamp observed-close alignment, partial and matured states, final-direction comparison, median-line absolute percentage error, and p10–p90 coverage.
- Added a test-only fast Forecast UI driver with three paths, two prediction bars, real staged events, cancellation, crash/retry, persistence, exact expiration, and active-job reload reattachment.
- Added one `check:forecast` release-readiness command for type checking, Quant integration tests, fast UI resilience tests, Python engine tests, native sidecar health, production build, and a real headless-Chrome renderer flow.
- Added immutable Kronos model/tokenizer manifests with exact revisions, file sizes, and SHA-256 verification before local snapshot loading.
- Added PyInstaller build and health-check tooling for native macOS arm64 and Windows x64 forecast sidecars without bundled model weights.
- Added Kronos MIT attribution, `THIRD_PARTY_NOTICES.md`, an exact generated 40-package frozen-runtime license inventory, copied release licenses, and packaging-path tests for both supported platforms.
- Added a visible forecast ETA that begins with measured path timing, uses a rolling median of recent completed paths, counts down between updates, and disappears as soon as results or another terminal state arrives.
- Added a cross-platform one-command startup that lets `npm start` or `npm start quant` install changed Node dependencies, initialize Kronos, prepare compatible local forecast support, build, and launch Quant.
- Added an optional persisted Project MA20 toggle for compatible 60-minute and daily charts, continuing the visible MA20 through forecast-median closes without changing model inputs.

### Changed

- Added keyboard navigation across the chart inspector tabs and preserved mounted Forecast state while switching panels.
- Forecast jobs now request dedicated history only after **Run Forecast**, pass that history to the runner, use its latest close and provenance in development records, and reject bundled sample history.
- Forecast data failures now return stable actionable codes for unavailable, sample, stale, insufficient, and invalid candle inputs.
- Forecast jobs now complete calendar preflight before runner startup and use DST-aware market timestamps instead of consecutive clock hours.
- Forecast persistence now rejects unordered, duplicate, overnight, weekend, holiday, early-close, mismatched-boundary, or non-canonical-time-zone aggregate timestamps.
- Production builds now copy the Python forecast-engine runtime beside the Electron main bundle; constructing the app-owned client still does not launch Python.
- Quant now prefers the local `.forecast-venv` Python created by forecast setup while retaining the explicit `QUANT_FORECAST_PYTHON` override.
- The Python worker test mode now exercises the production thirty-path runner with a deterministic predictor substitute, keeping lifecycle tests fast without downloading model weights.
- Forecast worker requests now enforce the fixed v1 sampling parameters: temperature 1.0, top-p 0.95, and top-k 0.
- The worker now reports real post-processing at 96% validation, 97% metric calculation, and 98% percentile aggregation before returning JSON-safe output.
- Forecast requests now use the real lazy Kronos worker instead of the development mock while preserving the existing renderer API, global job lock, reload recovery, retry path, ten-minute idle lifecycle, and persistence-before-100 boundary.
- Forecast reload recovery now subscribes to live worker events before requesting the current-job snapshot, closing the navigation/reload event gap.
- Forecast history fetching and calendar validation now have distinct truthful progress copy before Python/model preparation begins.
- Worker failure details now stay in main-process diagnostics while renderer events receive stable public messages and preserve synchronous error codes.
- Forecast progress now uses an accessible overall progressbar, stage-specific polite status text, wrapped diagnostics, and no implied model-byte percentage.
- Forecast overlays now use persisted exchange-aware timestamps on the symbol price scale, reject malformed records, fit future bars into view, detach cleanly when disabled or replaced, preserve chart navigation on teardown, and stop affecting autoscale when off-screen.
- Saved forecast restoration now independently sorts and filters unexpired summaries, selects the latest valid snapshot on reopen, rejects stale async selection responses, and atomically switches chart/summary data.
- Chart dialogs now close on Escape at the window level, including when focus has moved outside the modal panel.
- Overlay preference changes now update immediately, persist per symbol, survive chart reopen, serialize writes while saving, lock against active forecast completion, and default on from the main-process record save even when no chart is mounted.
- Forecast persistence now stages the new record, default-on preference, and rebuilt index before enforcing caps; failed commits roll back only the new record, preserve older snapshots, and successful saves leave physical record counts within configured limits.
- Historical evaluation now updates only mutable evaluation metadata; original aggregate bands, sampled paths, metrics, and provenance remain unchanged.
- Historical evaluation persistence is monotonic under concurrent requests, rejects incompatible adjusted/unadjusted price bases, restores prior comparison state after failed selection, and overlays timestamp-aligned observed closes with a labeled dashed chart series.
- Production forecast workers now strip inherited test controls, reject test-mode output, load only verified immutable model snapshots, and verify packaged Kronos source files against the pinned source manifest.
- Production builds now copy an allowlisted forecast runtime without tests or bytecode caches, while packaged apps launch the frozen sidecar from Electron resources instead of depending on system Python.
- Release packaging now requires the matching native sidecar, includes third-party notices, supports native Windows archive creation, and keeps model weights as verified on-demand downloads.
- Historical comparisons now verify the saved final-history anchor against freshly adjusted history, and evaluation persistence rejects updates with fewer observed points even when they claim a higher maturity state.
- Frozen forecast workers now initialize multiprocessing support before serving requests, keep third-party model-loader output off the NDJSON protocol channel, and bundle the dynamically detected `safetensors` modules and package metadata required for first-use model loading.
- Forecast workers now emit an explicit zero-completed-path start event so ETA measurement excludes model download and loading time.
- Packaged forecast startup now selects the bundled sidecar by verified executable presence instead of Electron's packaging flag, and main-process job failures now retain local diagnostic logging.
- Source startup now fingerprints committed dependency inputs, skips repeat installs when current, continues into the core terminal when optional Python setup is unavailable, and supports explicit refresh or forecast-skip flags.
- Forecast median and sampled-range styling now uses the accent blue, while projected MA20 keeps the chart’s cyan study color and switches to a dashed line beyond the forecast boundary.

### Fixed

- Fixed the watchlist Delete context menu appearing far from the right-clicked ticker by rendering the viewport-positioned menu outside the animated sidebar transform.

### Code change summary

- Portaled the watchlist context menu to the document body so fixed client coordinates remain aligned with the pointer regardless of shell entrance transforms.
- Added validated watchlist-order IPC and persistence, removed forced alphabetical sorting and the hover-only remove control, preserved normal click-to-open behavior, and suppressed chart opening after a completed drag.
- Completed build-plan Chunk 3.1 by adding the shared worker contract, Python protocol/parser and shell, lazy Electron main-process lifecycle client, packaged runtime copy, and application shutdown ownership. The shell intentionally returns `ENGINE_SETUP_FAILED` for production runs until the Kronos-mini adapter is implemented in Chunk 3.2.
- Completed build-plan Chunk 3.2 by adding pinned developer setup, lazy official Kronos integration, one-time input normalization, hardware selection, verified pinned provenance, and stable setup/download/load failures. App-level worker orchestration remains scheduled for Chunk 4.1.
- Completed build-plan Chunk 3.3 by adding seeded single-sample generation, bounded validation/repair, exact per-path progress through 95%, retry-once failure handling, cancellation boundaries, raw path output, close-path output, repair diagnostics, and sampling provenance. Metrics and percentile aggregation remain in Chunk 3.4.
- Completed build-plan Chunk 3.4 by adding finite-only probability metrics, population log-return volatility, linear percentile bands, compact aggregate points, and raw close-path retention. Real app orchestration and persistence remain in Phase 4.
- Completed build-plan Chunk 4.1 by wiring live history and exchange-aware timestamps into the real worker, validating and shaping production records, forwarding cancellation, retaining one-job global locking and live-state recovery, isolating renderer-listener failures, serializing restarts after idle shutdown, and persisting records before 100% completion. Setup and diagnostics UX remains in Chunk 4.2.
- Completed build-plan Chunk 4.2 by adding cache-aware preparation phases, truthful first-use download/loading copy, sanitized diagnostics, error-family recovery actions, active cancellation, and accessible progress semantics. Chart overlay work begins in Phase 5.
- Completed build-plan Chunk 5.1 by adding a validated overlay model, median line, p10–p90 canvas primitive, forecast-start divider, accessible legend, persisted toggle integration, reduced-motion-safe rendering, and idempotent chart cleanup. Saved forecast history enhancements remain in Chunk 5.2.
- Completed build-plan Chunk 5.2 by adding deterministic latest-unexpired restoration, race-safe immutable snapshot switching, generated/expiration history metadata, serialized per-symbol overlay restoration, and main-owned default-on completion behavior. Historical comparison remains in Chunk 5.3.
- Completed build-plan Chunk 5.3 by adding lazy observed-bar evaluation on saved-record selection, exact timestamp matching that skips missing bars, partial/matured metrics, metadata-only persistence, and an accessible Historical comparison card. Full integration and resilience work begins in Phase 6.
- Completed build-plan Chunk 6.1 by adding the isolated 3-path/2-bar UI state machine, automated restart/persistence/expiration/cancellation/crash/progress coverage, browser smoke flows, and a single non-Electron release gate. Packaging and notices remain in Chunk 6.2.
- Completed build-plan Chunk 6.2 by adding immutable model/source verification, native PyInstaller sidecar builds for macOS arm64 and Windows x64, packaged-runtime resolution, allowlisted release payloads, Kronos MIT notices, platform packaging tests, and documented CPU/MPS/CUDA and signing limitations. All forecast build-plan chunks are complete.
- Fixed the packaged Forecast setup failure by adding frozen-process startup handling, protocol-safe loader diagnostics, explicit `safetensors` PyInstaller imports and metadata, and regression coverage for stdout isolation.
- Added the post-release measured-ETA improvement with robust recent-path timing, accessible non-chattering countdown presentation, and immediate terminal-state removal.
- Fixed the end-to-end packaged Retry flow, which previously selected the development Python worker despite the native sidecar being present.
- Fixed path-21 progress validation by replacing floating-point percentage scaling with the worker's exact integer mapping; 21 completed paths now consistently maps to 68%.
- Expanded the bounded repair ceiling to one scalar correction per forecast candle so valid high/low envelopes complete across normalized ticker scales while malformed, non-finite, non-positive, or more heavily repaired paths still fail closed.
- Prepared the v2.0.0 release metadata and condensed the README into scannable feature and forecast-summary bullets with a linked visual demo.
- Replaced the chained npm start command with an idempotent Node bootstrap that validates Node 20+, performs atomic local setup-state updates, strips inherited Electron Node mode, and preserves app arguments.
- Added interval-aware projected-MA20 aggregation: hourly charts use each forecast median, daily charts use the final exchange-local median per trading day, and unsupported cadences fail closed.

### Documentation

- Recorded the pinned Kronos source commit in `vendor/KRONOS_COMMIT.txt`.
- Added a 12-second forecast walkthrough video and preview image under `docs/assets/demos`.
- Updated the README with concise v2.0 watchlist, forecast, history, keyboard, and packaging highlights.
- Reduced source setup to one documented command and explained first-run installs, automatic retries, refresh behavior, and the non-blocking Python fallback.

### Testing

- Added watchlist ordering tests for same-section moves, cross-section rejection, exact-list validation, normalization, duplicates, and missing symbols.
- Browser-verified the Delete menu remains adjacent to right-clicked rows at different sidebar positions.
- Browser-verified normal click-to-open, the one-action right-click menu, Delete removal, Escape dismissal, persisted reorder updates, and zero renderer warnings or errors.
- Added forecast foundation tests for the 30-path percentage mapping, invalid path counts, illegal stage changes, regressions, the 95% path ceiling, and persisted-record requirements at 100%.
- Added forecast registry tests for malformed requests, concurrent-job rejection, reload recovery, unsubscribe behavior, cancellation, overlay state, invalid runner output, 30 path events, and the pre-persistence 99% ceiling.
- Added temporary-directory storage tests for exact TTL boundaries, restart recovery, immutable reruns, atomic temp-file isolation, corrupt index rebuilding, malformed record reporting, overlay persistence, per-symbol/global caps, and persisted completion at 100%.
- Added Forecast panel view-model tests for empty, unavailable, running, failed, and saved states plus stale/out-of-order event rejection and value formatting.
- Verified the production renderer in the browser preview, including saved development-mock data, overlay state, the primary rerun action, and accessible failure feedback.
- Added forecast-history tests for the exact 60-minute request, 360-bar cap, partial-bar removal, amount proxy, exchange/time-zone metadata, lazy start behavior, provider failure, and sample-data rejection.
- Added candle-validation regressions for duplicate and unordered timestamps, partial bars without market-state metadata, stale session data, non-finite and non-positive values, malformed OHLC, negative or missing volume, insufficient history, and inconsistent split adjustments.
- Added market-calendar regressions for Friday/weekend continuation, observed Independence Day, Thanksgiving and Christmas Eve early closes, Saturday New Year handling, spring/fall DST changes, unsupported time zones, pre-run calendar failure, and persisted timestamp integrity.
- Added Python protocol and Node integration coverage for strict timestamps, malformed messages, lazy startup, health, 30-path progress, cancellation, duplicate-progress stalls, inactivity timeouts, crashes, malformed output, clean shutdown, and missing Python.
- Added adapter/setup coverage for supported Python and health versions, exact dependency pins, runtime submodule commit matching, import-only verification, lazy cached loading, exact model identities, MPS selection, reusable normalization, invalid commit metadata, broken or missing dependencies, and download failures.
- Verified the real Python 3.11 virtual environment installs all eight pins, imports the pinned Kronos classes without downloading model weights, passes worker health, and runs the complete Quant test harness.
- Added deterministic path-engine coverage for 30 unique seeds, fixed-seed reproduction, `sample_count=1`, exact 8–95% progress, same-seed retries, cancellation before retries and between paths, second-failure termination, unexpected predictor errors, ordered timestamps, non-finite output, full candle invariants, JSON round trips, bounded repairs, and the 24-value repair ceiling.
- Added metric fixtures covering ties, flat history and paths, known return frequencies, known population volatility, linearly interpolated percentiles, ordered bands, large finite prices, malformed dimensions, malformed or duplicate timestamps, NaN rejection, JSON serialization, 96–98% progress, and prohibited confidence labeling.
- Added production orchestration coverage for exact worker payloads, malformed bands/frequencies/seeds/repair metadata, output rejection, stable worker error mapping, cancellation during preflight and active work, one-job locking, live job recovery, listener isolation, persistence ordering, warm-process reuse, accelerated idle exit, start-during-shutdown serialization, and clean restart after a worker crash.
- Added overlay-model and primitive coverage for exact 24-point conversion, historical-close anchoring, exchange-aware forecast start, ordered p10/p50/p90 bands, malformed lengths, duplicate timestamps, no default raw-path rendering, redraw-loop prevention, visible-range autoscaling, and idempotent detach/removal.
- Browser-verified the overlay appearance and accessible labels, then toggled it off and on to confirm primitive/series removal and restoration without launching Electron.
- Added saved-history coverage for out-of-order summaries, expired preferred records, non-mutating sort/filter behavior, latest-unexpired reopen selection, durable record immutability after retrieved data is modified, default-on persistence without a mounted renderer, overlay-control locking, failed-preference rollback without older-snapshot loss, and immediate per-symbol/global cap enforcement.
- Browser-verified two-record switching, changed metrics and chart overlays, latest-record restoration after reload, persisted overlay off/on state, accessible history semantics, and zero console errors without launching Electron.
- Added setup/diagnostics coverage for cache-vs-download detection, preparation-phase protocol validation, same-percent status changes, sanitized worker details, error-family actions, truthful download/loading copy, and cancellation recovery.
- Verified the built Forecast panel in browser-only downloading, loading, setup-failure, and cancelled states, including progressbar semantics, non-truncated status text, keyboard-accessible cancellation, and stable card layout.
- Added historical-comparison regressions for out-of-order actual data, missing middle bars, missing final bars remaining partial, matured final-direction and range metrics, duplicate timestamps, pre-start state, and evaluation updates that preserve immutable forecast payloads.
- Browser-verified partial and matured Historical comparison states, saved-record switching, exact non-promotional wording, accessible semantics, production type checking/build, the Quant harness, and all 35 Python tests without launching Electron.
- Expanded historical-comparison coverage with nonzero percentage error, partial band coverage, incorrect and flat final direction, first-bar completion timing, adjustment-basis rejection, monotonic out-of-order metadata writes, full-record immutability, and observed-line validation.
- Added fast UI integration coverage for 3-path progress reaching 95 only after path three, 2-bar fixture output, persistence before completion, reload reattachment, seven-day expiration, cancellation without a saved record, one-time crash, and successful retry.
- Browser-verified fast Run → progress → completion → reopen, cancellation, crash recovery, and the matured observed-close chart legend without launching Electron.
- Added model-integrity regressions for mutable revisions, Hugging Face cache symlinks, missing required weights, altered snapshot files, incomplete packaged-source manifests, source tampering, runtime license coverage, and adjustment-anchor drift; the Python forecast suite now contains 41 passing tests.
- Added macOS and Windows sidecar copy-path tests, exact executable/commit selection tests, test and Kronos-override sanitization checks, lower-evidence evaluation rejection, packaged-resource notice checks, and real native-sidecar health to the unified forecast release gate.
- Replaced the string-only renderer check with a headless-Chrome flow that opens SPY, selects Forecast, observes real fast-mode progress, completes the built React UI, renders Historical comparison, and rejects runtime exceptions.
- Built and health-checked the real 374 MB macOS arm64 sidecar, verified it contains no model weights, packaged it with 40 runtime license inventories into an ad-hoc-signed 606 MB app and 225 MB ZIP, passed deep code-signature and ZIP integrity checks, and health-checked the worker from inside the packaged app without launching Electron.
- Added a model-loader regression proving third-party output is redirected to diagnostics instead of corrupting worker protocol messages; rebuilt packaged first-use loading is verified against the native sidecar.
- Added ETA model tests, zero-path worker progress coverage, fast-driver timing coverage, and a built-renderer assertion that ETA appears during work and is absent after completed results render.
- Added runtime-selection regressions for present, absent, and unsupported-platform sidecar paths.
- Added the previously uncovered path-21 percentage boundary regression.
- Added exact 24/25 repair-boundary coverage, category-level repair diagnostics, a live normalized ticker matrix covering DRAM, SPY, IWM, BRK-B, SOFI, TSLA, and NVDA, and a built-renderer Escape-close assertion.
- Added startup regressions for Node-version validation, the optional `quant` argument, dependency fingerprints, missing and current setup markers, refresh behavior, forecast skipping, changed lockfiles, and side-effect-free dry runs.
- Added projected-MA20 tests for hourly and daily continuity, unsupported intervals, insufficient history, malformed candles, toggle persistence, and built-renderer accessibility.

## [1.5.0] - 2026-07-15

### Added

- Added Market Regime Engine v2 with five deterministic states: healthy uptrend, correction, oversold bounce, downtrend/distribution, and recession defense.
- Added a versioned strategy contract containing required inputs, methodology, evidence, data health, warnings, and deterministic verification checks.
- Added two-session hysteresis with separate raw, pending, and committed regime states persisted locally between refreshes.
- Added rate-driven, recession-driven, valuation-driven, and broad-risk decline attribution.
- Added source-backed price, drawdown, breadth, macro-stress, and rate-stress evidence to Market Pulse.
- Added shared motion tokens, staggered component entrances, richer loading states, tab transitions, and reduced-motion support.
- Added MA20, MA50, and MA200 studies, proportional log scale, Fit/Latest controls, keyboard shortcuts, and a collapsible chart inspector.

### Changed

- Market Pulse now loads one year of daily history and evaluates 63-session momentum, one-year drawdown, and SMA200 structure.
- Market Pulse now combines public FRED labor/rate inputs with Yahoo VIX and cross-asset price evidence.
- Signal Board loading now preserves the final table geometry, reducing visual reflow when scan results arrive.
- Chart range changes now keep the current canvas mounted until the requested series is ready, while inspector tabs preserve in-progress state when navigating.
- Replaced simultaneous mixed-unit macro overlays with a focused one-lens selector on an independent mini-scale, preventing macro values from distorting the equity price axis.

### Fixed

- Prevented the initial chart fit from silently preloading history beyond the selected date range.
- Throttled crosshair and resize updates to animation frames, reducing unnecessary React renders and chart layout work during interaction.

### Validation

- Added deterministic hysteresis checks that prevent same-session refreshes from advancing a pending transition.
- Added strategy-version, evidence-count, data-health, and verification assertions to the Quant test harness.

### Packaging

- Updated the release generator to retain older versioned archives instead of deleting the entire local release directory before every build.
- Stripped AppleDouble metadata before macOS signing and after archive creation so packaging remains reliable and clean on external volumes.
- Produced separate macOS ARM64 and Windows x64 release archives for v1.5.0.

### Attribution

- The independently implemented regime model is conceptually informed by ARDS-X in Dennis Kim's `vibe-investing` repository; no uncalibrated probability claims were imported.

## [1.4.0] - 2026-07-13

### Added

- Added a dedicated Market Pulse tab that compresses broad market state into a transparent 0-100 regime score.
- Added a six-asset monitor for SPY, QQQ, IWM, TLT, GLD, and USO with 20-session momentum, annualized realized volatility, SMA20 state, and explicit live/sample provenance.
- Added a 90-session cross-asset correlation matrix with aligned daily observations.
- Added a deterministic scenario analyzer for rate, oil, and volatility shocks with relative sensitivity views for growth, financials, energy, defensives, and the broad market.
- Added preset scenarios for a rate shock, oil shock, and combined risk shock.

### Design and Scope

- Kept Market Pulse inside the existing center workspace so it cannot overlap the Earnings pane.
- Reused the existing Yahoo chart path and bundled sample fallback; no paid data provider or new API key is required.
- Excluded broker execution and options-flow imitation because Quant does not yet have licensed execution or options-flow data boundaries.

### Testing

- Added deterministic regime, correlation, source-provenance, and scenario-sensitivity coverage.
- Verified type checking, Quant tests, production build, and an actual Electron Market Pulse smoke render.

### Packaging

- Versioned release folder and archive names prevent a new build from silently replacing a prior local release.

## [1.3.1] - 2026-07-13

### Fixed

- Fixed the Quant AI enable checkbox crashing the Settings page with `Cannot read properties of null (reading 'checked')`.
- Captured checkbox and text-field values before entering React functional state updates so deferred rendering cannot read a cleared synthetic-event target.

### Testing

- Added a real built-renderer interaction regression covering the local llama.cpp checkbox, endpoint field, and model field.

## [1.3.0] - 2026-07-13

### Added

- Added a dedicated Quant AI Settings tab for local llama.cpp, OpenAI, Google Gemini, xAI Grok, and Anthropic Claude.
- Added editable provider endpoint and model settings plus a real connection test that verifies the selected endpoint, authentication, and model with a minimal completion.
- Added OS-backed encrypted cloud API-key storage through Electron `safeStorage`; saved credentials are never returned to the renderer.
- Reused the complete provider setup and connection-test interface in the first-run onboarding wizard.
- Added a native Claude Messages adapter alongside the shared OpenAI-compatible adapter used by llama.cpp, OpenAI, Gemini, and Grok.
- Added an explicit three-month chart range.

### Fixed

- Rebuilt each lightweight chart pane when the selected 1M, 3M, or 1Y period changes, preventing stale candlestick series from remaining visible across the multi-chart grid.
- Propagated the selected period through live Yahoo data, macro-series windows, bundled sample data, and chart-history preloading.

### Security

- Cloud keys remain in the Electron main process and are encrypted before they are written to local app storage.
- When secure OS credential encryption is unavailable, Quant refuses to persist a cloud API key in plaintext.

### Testing

- Added provider-default and URL-normalization coverage.
- Verified type checking, Quant tests, production builds, Settings and onboarding smoke views, distinct 1M/1Y multi-chart renders, and a live llama.cpp completion.

## [1.2.1] - 2026-07-12

### Fixed

- Contained the Market News tab, symbol filter rail, article rows, and headline previews within the center grid column so they cannot paint over the Earnings pane.
- Added explicit shrink and overflow boundaries to all three application columns and nested center-tab panels.
- Allowed unusually long headlines to wrap inside their owning panel instead of expanding the center content layer.

### Testing

- Center-tab smoke runs now suppress first-run onboarding, allowing the Market News and Earnings column boundary to be captured directly in an isolated test profile.

## [1.2.0] - 2026-07-12

### Added

- Evidence-Backed Signal Desk with numbered source and quality indicators for deterministic signals, chart data, historical strategy checks, earnings, and valuation.
- Local Decision Journal for saving thesis, catalyst, invalidation, lifecycle status, notes, and the exact signal and risk snapshot used for a decision.
- Transactional journal persistence in Electron local app data.
- Verified Quant AI harness with isolated analyst and verifier contexts followed by a bounded final orchestrator.
- Harness trace UI with worker outcomes, timing, evidence ledger, validation results, and failure attribution.
- Deterministic evidence-ledger tests.

### Changed

- Quant AI responses now use numbered evidence citations and exact Decision, Evidence, Invalidation, and Risk sections.
- Model responses are checked for structural completeness, valid evidence IDs, and prohibited certainty language, with at most one constrained repair.
- News headlines and pasted material are explicitly treated as untrusted evidence rather than model instructions.
- Multi-pass model analysis now runs only when requested instead of automatically when a chart opens.
- The default local model identifier is `gemma-4-e4b-it`, matching the supported llama.cpp runtime.
- Local AI copy now describes a verified decision memo instead of implying an unrestricted autonomous agent.

### Reliability

- Analyst failure falls back to a deterministic memo.
- Verifier failure is recorded without discarding a valid analyst result.
- Orchestrator failure returns the analyst draft with explicit failure metadata.
- Journal writes use a temporary file and atomic rename to reduce corruption risk.

## [1.1.0] - 2026-07-07

### Added

- Signal Board scanner for end-of-day technical setups across the bundled U.S. stock universe, watchlist, and ETF holdings.
- Deterministic signal scoring, setup classification, risk plans, and historical strategy summaries.
- macOS arm64 and Windows x64 release archives published as GitHub Release assets.
