# Quant

Quant is an open-source desktop market terminal for tracking ETFs and stocks. It combines a reorderable watchlist, holdings-driven news, earnings context, annotated charts, macro overlays, evidence-backed signal scoring, local probabilistic forecasts, a decision journal, and an optional verified Quant AI harness.

The core promise is simple: useful market context without paid API lock-in. Quant can run with public market data sources and deterministic signal analysis, use a private llama.cpp server, or connect to an optional OpenAI, Gemini, Grok, or Claude account. No cloud LLM API key is required for the default experience.

<p align="center">
  <img src="./docs/assets/showcase/quant-hero.png" alt="Quant desktop market terminal hero image" width="100%">
</p>

<p align="center">
  <a href="https://github.com/eisenjimmy/Quant"><img src="https://img.shields.io/badge/repo-eisenjimmy%2FQuant-4d7ef7" alt="Repository"></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-1b2438" alt="Supported platforms">
  <img src="https://img.shields.io/badge/local%20AI-optional-1fbf75" alt="Optional local AI">
  <img src="https://img.shields.io/badge/cloud%20LLM-optional-1fbf75" alt="Optional cloud LLM providers">
  <img src="https://img.shields.io/badge/release-v2.0.0-4d7ef7" alt="Quant v2.0.0">
  <img src="https://img.shields.io/badge/license-MIT-6d95ff" alt="MIT license">
</p>

## What Quant Does

Quant is built for quick market scanning:

- Track, reorder, and remove ETFs and stocks in a persistent desktop watchlist.
- Expand ETF holdings into a broader market universe.
- Read holdings-driven news and upcoming earnings.
- Read a cross-asset Market Pulse with a committed five-state regime, evidence provenance, 90-session correlations, and deterministic shock analysis.
- Open a full candlestick chart with pivots, support, resistance, and risk levels.
- Screen the bundled U.S. stock universe for end-of-day technical signals such as cup bases, moving-average alignment, near-high setups, VCP, volume surges, MACD, and RS strength.
- Inspect news at each detected swing so price action can be read with the surrounding headline context.
- Toggle macro overlays directly on the chart: jobs, unemployment, CPI, 10Y yield, oil, and VIX.
- Review a deterministic Signal Desk before asking an AI agent.
- Inspect numbered evidence with source and quality status before acting on a signal.
- Save a decision journal entry with the thesis, catalyst, invalidation, and exact signal snapshot.
- Run an on-demand local Kronos forecast with 30 sampled paths across 24 future trading-hour bars.
- Reopen immutable forecast snapshots and compare them with timestamp-aligned observed closes.
- Use Quant AI in deterministic mode, through local llama.cpp, or with an optional OpenAI, Gemini, Grok, or Claude API key.

## What's New in v2.0.0

New:

- **Forecast any ticker:** Run a local 24-trading-hour probabilistic forecast.
- **Clear progress:** See a measured ETA while forecasting, or cancel the run.
- **Chart overlay:** Toggle the median path and P10–P90 sampled range.
- **Projected MA20:** Optionally continue the chart’s MA20 through forecast-median closes.
- **Saved forecasts:** Reopen each run for seven days and compare it with observed closes.
- **Right-click and delete:** Remove a stock or ETF directly from the watchlist.
- **Drag and reorder:** Click, hold, and move watchlist entries; their order is saved.
- **Keyboard friendly:** Press Escape to close charts and Alt + Arrow to reorder entries.
- **Native packaging:** Forecast support ships inside the macOS ARM64 and Windows x64 apps.

### Forecast Demo

Click the preview to watch the 12-second demo:

[![Watch the Quant v2.0 forecast demo](./docs/assets/demos/quant-v2-forecast-demo.png)](./docs/assets/demos/quant-v2-forecast-demo.mp4)

### How the Forecast Works

- **Input:** Up to 360 completed hourly price and volume bars.
- **Model:** The local Kronos-mini time-series model generates 30 independent paths.
- **Result:** Quant shows the median path, sampled P10–P90 range, upside frequency, and volatility diagnostics.
- **MA20 option:** A dashed continuation derives from chart closes plus forecast medians; it does not change Kronos inputs.
- **Horizon:** 24 future trading-hour bars, usually about four U.S. market sessions.
- **History:** Every successful run is saved as an immutable snapshot for seven days.
- **Limits:** It is not a chat LLM and does not use news, earnings, macro releases, or unexpected events.

### Introduced in v1.5.0

- Market Regime Engine v2 classifies healthy uptrend, correction, oversold bounce, distribution/downtrend, and recession-defense conditions.
- Raw evidence must persist for two completed sessions before the committed regime changes; pending transitions remain visible in the interface.
- Every regime result carries a versioned methodology, data-health status, source-backed evidence ledger, decline attribution, warnings, and deterministic verification checks.
- The chart workspace includes MA20/50/200, log scale, Fit/Latest navigation, keyboard range shortcuts, and a collapsible state-preserving inspector.

### Introduced in v1.4.0

- New Market Pulse workspace for broad market state without copying the visual overload of institutional terminals.
- Transparent 0-100 regime score built from equity trend, breadth, volatility stability, and defensive demand.
- Six-asset monitor covering SPY, QQQ, IWM, TLT, GLD, and USO with momentum, realized volatility, and SMA20 state.
- 90-session cross-asset correlation matrix and adjustable rates, oil, and volatility scenario analyzer.
- Uses Quant's existing public Yahoo chart path and explicit `SAMPLE` fallback; no new API key is required.

### Introduced in v1.3.1

- Fixed a Settings-page crash when enabling local llama.cpp.
- Hardened the provider endpoint and model inputs against the same deferred React event-lifetime failure.

### Introduced in v1.3.0

- Dedicated Quant AI Settings tab with local llama.cpp, OpenAI, Gemini, Grok, and Claude provider profiles.
- Real connection testing for endpoint, authentication, and model configuration.
- OS-encrypted cloud API-key storage that never returns saved credentials to the renderer.
- The full provider setup is also available during first-run onboarding.
- Multi-chart 1M, 3M, and 1Y controls now reload and rebuild every pane with the correct candle series.

### Introduced in v1.2.1

- Market News and its symbol filter rail are now strictly contained within the center workspace and cannot paint over the Earnings pane.
- Long headlines and previews shrink and wrap within the owning grid column.

### Introduced in v1.2.0

- Evidence-Backed Signal Desk with explicit chart, strategy, backtest, earnings, and valuation provenance.
- Local Decision Journal with planned, active, invalidated, and closed states.
- Verified Quant AI harness: isolated analyst and verifier workers followed by bounded orchestration.
- Numbered evidence citations, output validation, worker timing, failure attribution, and deterministic fallback.
- Local model defaults aligned with the `gemma-4-e4b-it` llama.cpp runtime.

See [CHANGELOG.md](./CHANGELOG.md) for the full release notes.

## Try It

There are two practical ways to try Quant.

### Option 1: Download a Release Build

Download the platform archive from the [GitHub Releases page](https://github.com/eisenjimmy/Quant/releases), then extract it.

macOS:

```bash
open Quant-v2.0.0-mac-arm64/Quant.app
```

Windows PowerShell:

```powershell
.\Quant-v2.0.0-win-x64\Quant.exe
```

The source repository contains no packaged binaries. Release ZIPs are published as GitHub Release assets, keeping ordinary clones small and avoiding Git LFS downloads.

If macOS blocks the unsigned app, open System Settings and allow the app after the first blocked launch. The app is ad-hoc signed for local use but not Apple-notarized.

### Option 2: Run From Source

Requirements:

- Node.js 20 or newer
- npm
- Git
- Python 3.10–3.12 to enable local forecasts from source
- macOS or Windows
- Internet access for live public market data

macOS or Linux shell:

```bash
git clone --recurse-submodules https://github.com/eisenjimmy/Quant.git
cd Quant
npm start quant
```

Windows PowerShell:

```powershell
git clone --recurse-submodules https://github.com/eisenjimmy/Quant.git
cd Quant
npm start quant
```

`npm start quant` and `npm start` run the same self-healing startup:

- Install locked Node dependencies when they are missing or the lockfile changes.
- Initialize the pinned Kronos submodule when needed.
- Prepare and verify the local forecast environment when Python 3.10–3.12 is available.
- Build Quant and launch the Electron app.
- Skip repeated installs after the environment is current.

The core terminal still launches if forecast setup is unavailable and prints
one actionable warning. Use `npm start -- --skip-forecast` to intentionally
skip Python setup, or `npm start -- --refresh` to recheck all dependencies.
Startup updates dependencies from the committed lockfiles; it never runs
`git pull` or changes the checked-out source branch.

## Screenshots

### First-Run Onboarding

The onboarding wizard helps a new user choose a starter watchlist, configure local llama.cpp or an optional cloud provider, test the connection, and understand the basic reading flow.

![Quant onboarding wizard](./docs/assets/screenshots/quant-onboarding.png)

### Market Dashboard

The main screen keeps the app dense and practical: watchlist on the left, holdings-driven news in the center, and earnings context on the right.

![Quant dashboard](./docs/assets/screenshots/quant-dashboard.png)

### Market Pulse

The Market Pulse tab turns the most useful ideas from dense institutional terminals into one ordered workflow: **committed market regime → source evidence → cross-asset relationships → shock sensitivity**. Its score is deterministic and decomposable, every asset preserves live/sample provenance, and the scenario output is labeled as relative sensitivity rather than a return forecast.

The current monitor uses SPY, QQQ, IWM, TLT, GLD, and USO alongside public FRED labor/rate series and Yahoo VIX data. The regime engine keeps separate raw and committed states, requiring two completed sessions of agreement before a transition. The correlation matrix aligns the latest 90 daily return observations, while the scenario analyzer lets users stress rates, oil, and volatility without implying broker execution or options-flow coverage that Quant does not possess.

The regime model is an independent Quant implementation conceptually informed by the ARDS-X methodology in Dennis Kim's [`vibe-investing`](https://github.com/gameworkerkim/vibe-investing) repository. Quant does not copy ARDS-X confidence claims, and its evidence-strength score is explicitly not a calibrated probability or return forecast.

### Signal Board

The Signal Board turns daily candles into a compact scanner view. Quant runs deterministic pattern rules across the selected universe, ranks matching symbols, and labels each row with signal tags such as `Cup`, `MA alignment`, `Near high`, `VCP`, `MACD`, and `RS strong`.

![Quant Signal Board feature banner](./docs/assets/showcase/quant-signal-board-banner.png)

Today the scanner covers the app's bundled U.S. stock directory plus optional watchlist/ETF modes. The API boundary is intentionally separated from the UI so a production bulk end-of-day feed can replace the bundled universe when full-market coverage is required.

### Chart Modal and Signal Desk

Opening a symbol brings up the full chart workspace: candlesticks, volume, pivots, risk levels, deterministic signal scoring, evidence provenance, valuation context, earnings context, and the local Decision Journal. The workspace keeps the current canvas visible while ranges load, preserves each inspector tab's state, and exposes Fit/Latest keyboard navigation for quick recovery after zooming or panning.

Price studies include MA20, MA50, MA200, and a proportional log scale. Macro context is deliberately presented as one selectable lens on an independent mini-scale so unlike units never distort the equity price axis. The inspector can collapse into a full-width chart without discarding an in-progress AI memo or journal entry.

![Quant chart modal](./docs/assets/screenshots/quant-chart-modal.png)

### Local Probabilistic Forecasts

Open any ticker, select **Forecast**, and choose **Run Forecast**. Quant runs
Kronos-mini locally, validates the 30 sampled paths, and displays the median
plus sampled P10–P90 range on the chart.

- The 24-bar horizon follows trading hours, skipping overnight periods, weekends, holidays, and early-close gaps.
- On 1M–1Y chart ranges, **Project MA20 through forecast** continues the visible MA20 as a dashed derived overlay.
- Each rerun creates a separate seven-day snapshot; earlier forecasts are never overwritten.
- **Historical comparison** aligns available observed closes with the original forecast timestamps.
- Forecasts are experimental sampled data, not calibrated certainty or investment advice.

### News at Each Swing

Quant detects swing highs and swing lows, numbers the key points, and groups headlines published around each swing. The goal is to make price movement explainable: a user can click through the swing list and compare chart pivots against the news available near that date.

![Quant news at each swing](./docs/assets/screenshots/quant-swing-news.png)

### Macro Overlay System

Quant can place one macro lens in an independent chart band. This is useful when a setup depends on rates, labor data, inflation, oil, volatility, or broad risk appetite. Restricting the chart to one macro unit at a time keeps the comparison legible without changing the equity price scale.

![Quant macro overlays](./docs/assets/screenshots/quant-macro-overlays.png)

Available chart overlays:

| Overlay | Why It Matters |
| --- | --- |
| Jobs | Frames economic momentum and sector rotation risk |
| Unemployment | Helps identify labor-cycle stress or late-cycle cooling |
| CPI | Connects inflation pressure to rates, margins, and multiples |
| 10Y yield | Acts as a discount-rate anchor for equity and ETF valuation |
| Oil | Affects energy, transport, inflation, and consumer-margin pressure |
| VIX | Shows market fear, expected volatility, and stop-width regime |
| Risk | Draws entry, stop, target, and position sizing context |

### Verified Quant AI Harness

Quant AI is a dedicated chart tab. It locks a numbered evidence ledger from the current symbol, signal evaluation, risk plan, pivot-linked news, earnings, valuation, and active macro overlays. A clean analyst context writes a provisional memo, an isolated verifier independently audits the same evidence, and a bounded orchestrator reconciles both into the final cited response. The UI exposes the stages, timing, evidence quality, validation checks, and fallbacks.

![Quant AI agent tab](./docs/assets/screenshots/quant-ai-agent.png)

## Quant AI Provider Setup

Quant AI does not require a paid cloud model provider. Open the **Settings** tab—or use the same setup during onboarding—to choose one active inference provider for the analyst, isolated verifier, and final orchestrator.

Available modes and providers:

| Provider | Default endpoint | Default model | Credential |
| --- | --- | --- | --- |
| Deterministic fallback | None | Rules engine | None |
| Local llama.cpp | `http://127.0.0.1:8080/v1` | `gemma-4-e4b-it` | None |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.4-mini` | OpenAI API key |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3.5-flash` | Gemini API key |
| xAI Grok | `https://api.x.ai/v1` | `grok-4.3` | xAI API key |
| Anthropic Claude | `https://api.anthropic.com/v1` | `claude-sonnet-4-6` | Anthropic API key |

### Local llama.cpp

Start a llama.cpp OpenAI-compatible server:

```bash
llama-server -m /path/to/model.gguf --host 127.0.0.1 --port 8080
```

Quant uses:

- `GET /health`
- `POST /v1/chat/completions`

Example local setup:

```bash
export QUANT_LLM_ENABLED=1
export QUANT_LLM_PROVIDER=local
export QUANT_LLM_BASE_URL=http://127.0.0.1:8080/v1
export QUANT_LLM_MODEL=gemma-4-e4b-it
npm start
```

Windows PowerShell:

```powershell
$env:QUANT_LLM_ENABLED="1"
$env:QUANT_LLM_PROVIDER="local"
$env:QUANT_LLM_BASE_URL="http://127.0.0.1:8080/v1"
$env:QUANT_LLM_MODEL="gemma-4-e4b-it"
npm start
```

### Cloud credentials

Cloud API keys are optional. Quant encrypts saved keys using Electron `safeStorage`, backed by the operating system's credential protection. Keys stay in the Electron main process, are never returned to the UI after saving, and are sent only to the configured provider endpoint. If secure encryption is unavailable, Quant refuses to save the key in plaintext.

The **Test connection** action sends a minimal completion to verify the current endpoint, key, and model before the configuration is used by the harness.

## Feature Map

| Area | Capability |
| --- | --- |
| Watchlist | Add ETFs or stocks, see prices and movers, right-click to delete, and drag or use Alt+Arrow to persist a custom order |
| ETF holdings | Expand ETF holdings so news and earnings cover underlying companies |
| News | Pull public finance headlines and group them by selected market universe |
| Swing news | Group headlines around each detected chart swing high or swing low |
| Earnings | Show upcoming earnings for watched names and ETF holdings |
| Market Pulse | Five-state regime with two-session hysteresis, evidence provenance, decline attribution, six-asset monitor, correlations, and scenarios |
| Charts | Candlesticks, volume, MA20/50/200, log scale, stable range transitions, Fit/Latest navigation, collapsible inspector, pivots, support/resistance, risk overlay |
| Macro overlays | Jobs, unemployment, CPI, 10Y yield, oil, VIX |
| Signal Board | End-of-day scan for cup bases, moving-average order, highs, VCP, volume, MACD, rebounds, and relative strength |
| Signal Desk | Deterministic setup classification, quality score, blockers, risk plan, numbered evidence provenance |
| Forecast | On-demand local Kronos-mini sampling, 24 trading-hour horizon, ETA/cancellation, chart ranges, immutable history, and observed-close comparison |
| Decision Journal | Local thesis, catalyst, invalidation, lifecycle state, and immutable signal snapshot |
| Quant AI | Local/cloud provider selection, verified analyst, isolated verifier, bounded orchestrator, citations, and deterministic fallback |
| Local persistence | Ordered watchlist, decision journal, saved forecasts, overlay preferences, Quant AI insights, LLM settings, OS-encrypted provider credentials |
| Release builds | macOS and Windows ZIPs published on GitHub Releases |

## Generated Showcase Visual

The image below is generated artwork for the README. It is not a literal app screenshot; the real screenshots above show the actual running UI.

![Generated Quant AI showcase](./docs/assets/showcase/quant-ai-showcase.png)

## Data Sources

Quant uses free public endpoints and bundled fallback data:

- Yahoo Finance chart, quote, search, valuation, and earnings endpoints
- Yahoo Finance RSS feeds
- Google News RSS
- FRED CSV endpoints for selected macro overlays
- Bundled sample chart, holdings, quote, news, and earnings data

No API key is required for the default experience.

Important limitations:

- Public endpoints can change, throttle, or fail.
- Data can be delayed, approximate, incomplete, or unavailable.
- Free endpoints should not be treated as trading infrastructure.
- `SAMPLE` badges mean bundled fallback data is being shown instead of live data.

## Repository Structure

```text
Quant/
  src/
    main/
      main.ts                 Electron lifecycle, window setup, IPC handlers
      preload.ts              Secure typed bridge exposed as window.quant
      services/
        chart.ts              Historical chart data loading
        earnings.ts           Earnings calendar data
        forecastData.ts       Dedicated hourly history validation and shaping
        forecastStore.ts      Immutable forecast records and overlay preferences
        forecastOrchestrator.ts Kronos worker orchestration and record creation
        kronosWorker.ts       Lazy local Python/native-sidecar lifecycle client
        holdings.ts           ETF holdings lookup
        insightStore.ts       Saved Quant AI insight records
        journalStore.ts       Transactional local Decision Journal persistence
        llmProvider.ts        OpenAI-compatible and Claude request adapters
        llmSettings.ts        Provider settings and encrypted credential persistence
        macro.ts              Jobs, unemployment, CPI, 10Y, oil, VIX overlays
        news.ts               Market news aggregation
        pivotNews.ts          News grouped around chart pivots
        quantAi.ts            Analyst, verifier, and orchestrator harness
        quotes.ts             Watchlist quote data
        signalScanner.ts      End-of-day technical signal scanner
        valuation.ts          Valuation snapshot and formula estimates
      data/
        etf-holdings.json     Offline holdings fallback
        symbol-directory.json Offline symbol search fallback
    renderer/
      App.tsx                 App shell
      store.tsx               Watchlist, quotes, holdings, modal state
      components/
        OnboardingWizard.tsx  First-run setup wizard
        ChartModal.tsx        Main chart workspace
        MarketPulse.tsx       Regime, cross-asset correlation, and scenario workspace
        SignalBoard.tsx       Multi-symbol end-of-day signal scanner
        NewsFeed.tsx          Holdings-driven news panel
        Watchlist.tsx         Watchlist and movers panel
        chart/
          ChartCanvas.tsx     Lightweight Charts rendering
          ForecastPanel.tsx   Forecast execution, history, comparison, and controls
          ForecastBandPrimitive.ts P10–P90 chart primitive
          QuantAgentPanel.tsx Verified Quant AI harness and evidence trace UI
          QuantDecisionPanel.tsx Evidence-Backed Signal Desk and Decision Journal
          useMacroOverlays.ts Macro overlay data hook
      styles/                 App, chart, watchlist, news, earnings, analysis CSS
    shared/
      harness.ts              Immutable numbered evidence-ledger builder
      ipc.ts                  IPC channel names
      forecast.ts             Forecast contracts, validation, and progress rules
      forecastWorker.ts       Versioned worker protocol
      marketPulse.ts          Deterministic regime, correlation, and scenario calculations
      types.ts                Shared API and market data contracts
      quant.ts                Deterministic signal engine
      signals.ts              Multi-symbol pattern detector
  forecast-engine/
    worker.py                 NDJSON sidecar entry point
    kronos_adapter.py         Pinned Kronos model/tokenizer adapter
    path_runner.py            Seeded path generation and bounded validation
    metrics.py                Percentile aggregation and forecast metrics
  scripts/
    build.mjs                 esbuild bundle script
    package-release.mjs       Runnable macOS/Windows release folder and archive builder
    check-forecast-release.mjs Unified forecast release gate
    setup-forecast.mjs        Pinned Python environment setup
    test-quant.mjs            Quant integration and regression tests
  docs/
    assets/
      screenshots/            Real app screenshots used in this README
      showcase/               Generated public repo visuals
```

## Architecture

Quant uses a standard Electron split:

| Layer | Path | Responsibility |
| --- | --- | --- |
| Main process | `src/main` | Fetches remote data, owns persistent stores, handles IPC, opens external URLs |
| Preload bridge | `src/main/preload.ts` | Exposes a typed, narrow `window.quant` API to the renderer |
| Shared types | `src/shared` | IPC contracts, market data models, deterministic signal engine |
| Renderer | `src/renderer` | React UI, chart rendering, app state, onboarding, agent UI |
| Forecast worker | `forecast-engine` | Local Kronos inference, path validation, aggregation, and protocol-safe progress |
| Build scripts | `scripts` | Build, tests, smoke screenshots, release packaging |

The renderer does not directly call remote market endpoints. It asks the Electron main process through the preload bridge. That keeps network access, filesystem writes, local LLM calls, and external link opening in the main process.

## Common Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Bundle Electron main, preload, renderer, and static data into `dist/` |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run test:quant` | Run deterministic signal-engine tests |
| `npm run test:start` | Test one-command startup planning without installing or launching |
| `npm run check:forecast` | Run forecast TypeScript, integration, resilience, Python, packaging, build, and browser-harness checks |
| `npm run setup:forecast` | Create the local Python environment and verify the pinned Kronos source |
| `npm run build:forecast-sidecar` | Build and health-check the native forecast sidecar for the current supported host |
| `npm start` or `npm start quant` | Install missing/changed dependencies, prepare forecasts, build, and launch Quant |
| `npm start -- --skip-forecast` | Launch the core terminal without preparing Python forecast support |
| `npm start -- --refresh` | Reinstall/recheck dependencies before launching |
| `npm run smoke` | Build, launch in smoke mode, and write `dist/smoke.png` |
| `npm run smoke:modal` | Build, launch with the SPY chart modal open |
| `npm run package:mac` | Build a runnable macOS app folder and ZIP locally in `release/` |
| `npm run package:win` | Build a runnable Windows app folder and ZIP locally in `release/` |
| `npm run package:all` | Build both local release folders and ZIP archives |

## Kronos Forecast Setup

Kronos Forecast is experimental and runs only after **Run Forecast** is
pressed. Opening Quant, selecting a ticker, or opening a chart does not start
Python, load Kronos, fetch forecast history, or download model files.

For development:

```bash
npm run setup:forecast
npm run typecheck
npm run test:quant
```

For the complete host release gate, install PyInstaller, run
`npm run build:forecast-sidecar` on a supported native host, then run
`npm run check:forecast`. The gate launches the real frozen worker for a health
exchange and drives the actual built renderer in headless Chrome. Set
`CHROME_PATH` if Chrome is not installed in its standard location.

The first real forecast downloads the immutable
`NeoQuasar/Kronos-mini` and `NeoQuasar/Kronos-Tokenizer-2k` snapshots. Their
safetensor weights total about 32 MB. Quant verifies the pinned revision, file
size, and SHA-256 before loading them; model weights are cached outside the app
and are not included in release ZIPs.

Runtime device behavior:

- CPU is supported and is the fallback, but a 30-path forecast can be slow and
  has no guaranteed completion-time benchmark.
- CUDA is selected automatically when PyTorch reports it available.
- Apple MPS is selected automatically when available.
- MPS and CUDA remain experimental and unbenchmarked. A device failure during a
  run does not silently retry on another device.
- Forecast output is experimental sampled data, not calibrated certainty or
  investment advice.

## Release Packaging

Quant includes a lightweight release packager at `scripts/package-release.mjs`. It does not require electron-builder.

The packager:

1. Requires the matching, previously built forecast sidecar.
2. Runs `scripts/build.mjs`.
3. Uses the installed Electron runtime, or downloads the matching official Electron runtime into `.release-cache/` if the local runtime is missing.
4. Creates a minimal Electron app payload under `resources/app`.
5. Copies the compiled `dist/` payload and native forecast sidecar.
6. Copies Quant and Kronos licenses plus `THIRD_PARTY_NOTICES.md`.
7. Produces runnable release folders and distributable ZIP archives under the locally ignored `release/` directory.

Build each sidecar on its native target host. PyInstaller does not
cross-compile:

```bash
# Apple Silicon macOS
.forecast-venv/bin/python -m pip install -r forecast-engine/requirements-packaging.txt
npm run build:forecast-sidecar -- --platform=darwin --arch=arm64
npm run package:mac

# 64-bit Windows
.\.forecast-venv\Scripts\python.exe -m pip install -r forecast-engine\requirements-packaging.txt
npm run build:forecast-sidecar -- --platform=win32 --arch=x64
npm run package:win
```

The generated sidecars live under ignored `sidecars/darwin-arm64` and
`sidecars/win32-x64` folders. A packaging job may consume a sidecar artifact
built on the other native host.

Build both release folders:

```bash
npm run package:all
```

Outputs:

```text
release/Quant-v2.0.0-mac-arm64/Quant.app
release/Quant-v2.0.0-mac-arm64.zip
release/Quant-v2.0.0-win-x64/Quant.exe
release/Quant-v2.0.0-win-x64.zip
```

The version is embedded in both the release folder and archive name so a new package never silently replaces the previous release.

Upload the ZIP archives as GitHub Release assets. Do not distribute `Quant.exe` alone because it depends on adjacent Electron runtime files.

Local macOS packages receive only ad-hoc signing. Public macOS distribution
still requires a Developer ID signature and notarization. Windows packages are
not code-signed by this script and require a separate signing step before
public distribution.

On machines where global `node`/`npm` is unavailable but a working Electron runtime exists, the scripts can be run through Electron's Node mode:

```bash
ELECTRON_RUN_AS_NODE=1 /path/to/Electron.app/Contents/MacOS/Electron scripts/package-release.mjs --platform=darwin,win32
```

## Troubleshooting

### `npm start` opens no window in VS Code on Windows

Some VS Code terminals set `ELECTRON_RUN_AS_NODE`, which can make Electron behave like Node instead of launching a window.

PowerShell:

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npm run build
& ".\node_modules\electron\dist\electron.exe" .
```

### Local LLM cannot connect

Check the local model server:

```bash
curl http://127.0.0.1:8080/health
```

Then confirm the environment variables are set in the same shell that launches Quant.

To reopen onboarding:

```bash
./node_modules/.bin/electron . --onboarding
```

To reset saved LLM preferences, remove `llm-settings.json` from Electron's `userData` directory and launch Quant again.

## Security Model

- Renderer loads local app files.
- Content Security Policy blocks arbitrary remote connections from the renderer.
- Main process validates external URLs before opening them.
- Market data and news are treated as untrusted remote content.
- Local LLM calls are disabled by default.
- No secrets are required for default operation.
- Treat market output as informational context, not execution advice.

## Credits

Original code by David Wong, username `DavidWProject`.

## Contributing

See `CONTRIBUTING.md`.

## Security

See `SECURITY.md`.

## License

MIT. See `LICENSE`.

## Disclaimer

Quant is for research, education, and personal market monitoring. It is not investment advice, a broker, an execution system, or a source of guaranteed real-time market data.
