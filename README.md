# Quant

Quant is an open-source desktop market terminal for tracking ETFs and stocks. It combines a watchlist, holdings-driven news, earnings context, annotated charts, macro overlays, evidence-backed signal scoring, a decision journal, and an optional verified Quant AI harness.

The core promise is simple: useful market context without paid API lock-in. Quant can run with public market data sources and deterministic signal analysis, use a private llama.cpp server, or connect to an optional OpenAI, Gemini, Grok, or Claude account. No cloud LLM API key is required for the default experience.

<p align="center">
  <img src="./docs/assets/showcase/quant-hero.png" alt="Quant desktop market terminal hero image" width="100%">
</p>

<p align="center">
  <a href="https://github.com/eisenjimmy/Quant"><img src="https://img.shields.io/badge/repo-eisenjimmy%2FQuant-4d7ef7" alt="Repository"></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-1b2438" alt="Supported platforms">
  <img src="https://img.shields.io/badge/local%20AI-optional-1fbf75" alt="Optional local AI">
  <img src="https://img.shields.io/badge/cloud%20LLM-optional-1fbf75" alt="Optional cloud LLM providers">
  <img src="https://img.shields.io/badge/license-MIT-6d95ff" alt="MIT license">
</p>

## What Quant Does

Quant is built for quick market scanning:

- Track ETFs and stocks in a desktop watchlist.
- Expand ETF holdings into a broader market universe.
- Read holdings-driven news and upcoming earnings.
- Read a cross-asset Market Pulse with a transparent regime score, 90-session correlations, and deterministic shock analysis.
- Open a full candlestick chart with pivots, support, resistance, and risk levels.
- Screen the bundled U.S. stock universe for end-of-day technical signals such as cup bases, moving-average alignment, near-high setups, VCP, volume surges, MACD, and RS strength.
- Inspect news at each detected swing so price action can be read with the surrounding headline context.
- Toggle macro overlays directly on the chart: jobs, unemployment, CPI, 10Y yield, oil, and VIX.
- Review a deterministic Signal Desk before asking an AI agent.
- Inspect numbered evidence with source and quality status before acting on a signal.
- Save a decision journal entry with the thesis, catalyst, invalidation, and exact signal snapshot.
- Use Quant AI in deterministic mode, through local llama.cpp, or with an optional OpenAI, Gemini, Grok, or Claude API key.

## What's New in v1.4.0

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
open Quant-v1.4.0-mac-arm64/Quant.app
```

Windows PowerShell:

```powershell
.\Quant-v1.4.0-win-x64\Quant.exe
```

The source repository contains no packaged binaries. Release ZIPs are published as GitHub Release assets, keeping ordinary clones small and avoiding Git LFS downloads.

If macOS blocks the unsigned app, open System Settings and allow the app after the first blocked launch. The app is ad-hoc signed for local use but not Apple-notarized.

### Option 2: Run From Source

Requirements:

- Node.js 20 or newer
- npm
- macOS or Windows
- Internet access for live public market data

macOS or Linux shell:

```bash
git clone https://github.com/eisenjimmy/Quant.git
cd Quant
npm install
npm run typecheck
npm start
```

Windows PowerShell:

```powershell
git clone https://github.com/eisenjimmy/Quant.git
cd Quant
npm install
npm run typecheck
npm start
```

`npm start` builds the Electron app and launches the desktop window.

## Screenshots

### First-Run Onboarding

The onboarding wizard helps a new user choose a starter watchlist, configure local llama.cpp or an optional cloud provider, test the connection, and understand the basic reading flow.

![Quant onboarding wizard](./docs/assets/screenshots/quant-onboarding.png)

### Market Dashboard

The main screen keeps the app dense and practical: watchlist on the left, holdings-driven news in the center, and earnings context on the right.

![Quant dashboard](./docs/assets/screenshots/quant-dashboard.png)

### Market Pulse

The Market Pulse tab turns the most useful ideas from dense institutional terminals into one ordered workflow: **current market regime → cross-asset relationships → shock sensitivity**. Its score is deterministic and decomposable, every asset preserves live/sample provenance, and the scenario output is labeled as relative sensitivity rather than a return forecast.

The current monitor uses SPY, QQQ, IWM, TLT, GLD, and USO. The correlation matrix aligns the latest 90 daily return observations, while the scenario analyzer lets users stress rates, oil, and volatility without implying broker execution or options-flow coverage that Quant does not possess.

### Signal Board

The Signal Board turns daily candles into a compact scanner view. Quant runs deterministic pattern rules across the selected universe, ranks matching symbols, and labels each row with signal tags such as `Cup`, `MA alignment`, `Near high`, `VCP`, `MACD`, and `RS strong`.

![Quant Signal Board feature banner](./docs/assets/showcase/quant-signal-board-banner.png)

Today the scanner covers the app's bundled U.S. stock directory plus optional watchlist/ETF modes. The API boundary is intentionally separated from the UI so a production bulk end-of-day feed can replace the bundled universe when full-market coverage is required.

### Chart Modal and Signal Desk

Opening a symbol brings up the full chart workspace: candlesticks, volume, pivots, risk levels, deterministic signal scoring, evidence provenance, valuation context, earnings context, and the local Decision Journal.

![Quant chart modal](./docs/assets/screenshots/quant-chart-modal.png)

### News at Each Swing

Quant detects swing highs and swing lows, numbers the key points, and groups headlines published around each swing. The goal is to make price movement explainable: a user can click through the swing list and compare chart pivots against the news available near that date.

![Quant news at each swing](./docs/assets/screenshots/quant-swing-news.png)

### Macro Overlay System

Quant can layer multiple macro series directly over the active price chart. This is useful when a setup depends on rates, labor data, inflation, oil, volatility, or broad risk appetite.

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
| Watchlist | Add ETFs or stocks, see prices, daily movers, and grouped ETF/stock sections |
| ETF holdings | Expand ETF holdings so news and earnings cover underlying companies |
| News | Pull public finance headlines and group them by selected market universe |
| Swing news | Group headlines around each detected chart swing high or swing low |
| Earnings | Show upcoming earnings for watched names and ETF holdings |
| Market Pulse | Cross-asset regime score, six-asset monitor, 90-session correlation matrix, scenario analyzer |
| Charts | Candlesticks, volume, 1M/3M/1Y multi-chart ranges, pivots, support/resistance, risk overlay |
| Macro overlays | Jobs, unemployment, CPI, 10Y yield, oil, VIX |
| Signal Board | End-of-day scan for cup bases, moving-average order, highs, VCP, volume, MACD, rebounds, and relative strength |
| Signal Desk | Deterministic setup classification, confidence, blockers, risk plan, numbered evidence provenance |
| Decision Journal | Local thesis, catalyst, invalidation, lifecycle state, and immutable signal snapshot |
| Quant AI | Local/cloud provider selection, verified analyst, isolated verifier, bounded orchestrator, citations, and deterministic fallback |
| Local persistence | Watchlist, decision journal, saved Quant AI insights, LLM settings, OS-encrypted provider credentials |
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
          QuantAgentPanel.tsx Verified Quant AI harness and evidence trace UI
          QuantDecisionPanel.tsx Evidence-Backed Signal Desk and Decision Journal
          useMacroOverlays.ts Macro overlay data hook
      styles/                 App, chart, watchlist, news, earnings, analysis CSS
    shared/
      harness.ts              Immutable numbered evidence-ledger builder
      ipc.ts                  IPC channel names
      marketPulse.ts          Deterministic regime, correlation, and scenario calculations
      types.ts                Shared API and market data contracts
      quant.ts                Deterministic signal engine
      signals.ts              Multi-symbol pattern detector
  scripts/
    build.mjs                 esbuild bundle script
    package-release.mjs       Runnable macOS/Windows release folder and archive builder
    test-quant.mjs            Signal-engine tests
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
| Build scripts | `scripts` | Build, tests, smoke screenshots, release packaging |

The renderer does not directly call remote market endpoints. It asks the Electron main process through the preload bridge. That keeps network access, filesystem writes, local LLM calls, and external link opening in the main process.

## Common Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Bundle Electron main, preload, renderer, and static data into `dist/` |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run test:quant` | Run deterministic signal-engine tests |
| `npm start` | Build and launch the desktop app |
| `npm run smoke` | Build, launch in smoke mode, and write `dist/smoke.png` |
| `npm run smoke:modal` | Build, launch with the SPY chart modal open |
| `npm run package:mac` | Build a runnable macOS app folder and ZIP locally in `release/` |
| `npm run package:win` | Build a runnable Windows app folder and ZIP locally in `release/` |
| `npm run package:all` | Build both local release folders and ZIP archives |

## Release Packaging

Quant includes a lightweight release packager at `scripts/package-release.mjs`. It does not require electron-builder.

The packager:

1. Runs `scripts/build.mjs`.
2. Uses the installed Electron runtime, or downloads the matching official Electron runtime into `.release-cache/` if the local runtime is missing.
3. Creates a minimal Electron app payload under `resources/app`.
4. Copies the compiled `dist/` payload.
5. Writes a minimal runtime `package.json`.
6. Copies `LICENSE` and `AUTHORS.md` into the packaged app.
7. Produces runnable release folders and distributable ZIP archives under the locally ignored `release/` directory.

Build both release folders:

```bash
npm run package:all
```

Outputs:

```text
release/Quant-v1.4.0-mac-arm64/Quant.app
release/Quant-v1.4.0-mac-arm64.zip
release/Quant-v1.4.0-win-x64/Quant.exe
release/Quant-v1.4.0-win-x64.zip
```

The version is embedded in both the release folder and archive name so a new package never silently replaces the previous release.

Upload the ZIP archives as GitHub Release assets. Do not distribute `Quant.exe` alone because it depends on adjacent Electron runtime files.

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
