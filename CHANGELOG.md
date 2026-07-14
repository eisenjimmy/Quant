# Changelog

All notable changes to Quant are documented here.

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
