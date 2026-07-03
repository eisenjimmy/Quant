# Quant

Quant is an open-source desktop market terminal for tracking ETFs and stocks. It combines a watchlist, holdings-driven news, earnings context, annotated charts, macro overlays, signal scoring, and an optional local Quant AI agent.

The app is built with Electron, React, TypeScript, esbuild, and lightweight-charts. It runs as a local desktop application on macOS and Windows.

## Status

Quant is usable as a local desktop app, but it depends on free and unofficial public data endpoints. Treat all market data as informational, delayed, incomplete, or unavailable. This project is not investment advice.

## Features

- ETF and stock watchlist with live or fallback quote data
- Symbol search with offline seed data fallback
- Holdings-driven news feed for ETF top holdings and watched stocks
- Upcoming earnings calendar for the active market universe
- Candlestick chart modal with range controls
- Auto-detected pivots, support and resistance lines, and risk overlays
- Macro overlays for jobs, unemployment, inflation, 10Y yield, oil, and VIX
- Signal Desk with deterministic setup, regime, risk, and blocker analysis
- Quant AI agent chat as a separate tab
- First-run onboarding wizard with starter watchlist presets and LLM setup
- Optional OpenAI-compatible local LLM integration
- Deterministic fallback memo when no LLM is enabled
- Smoke-test mode for release verification
- Runnable release folder generation for macOS and Windows

## Screens

The main layout has three primary areas:

- Left: watchlist and daily movers
- Center: market news for the selected universe
- Right: earnings calendar

Click a watchlist symbol or earnings row to open the chart modal. The modal has three right-rail tabs:

- Signal Desk: deterministic signal, risk, valuation, and earnings context
- Quant AI: agentic chat over the active chart and context
- News: headlines grouped around detected swing points

## Architecture

Quant uses the standard Electron split:

| Layer | Path | Responsibility |
| --- | --- | --- |
| Main process | `src/main` | Fetches remote data, owns persistent stores, handles IPC |
| Preload bridge | `src/main/preload.ts` | Exposes a typed `window.quant` API to the renderer |
| Shared types | `src/shared` | IPC contracts, market data types, signal engine |
| Renderer | `src/renderer` | React UI, chart rendering, app state |
| Build scripts | `scripts` | esbuild bundle, tests, release packaging |

The renderer does not call remote market endpoints directly. It asks the Electron main process through the preload bridge. This keeps network access, filesystem writes, and external link opening in the main process.

## Data Sources

Quant uses free public endpoints and bundled fallback data:

- Yahoo Finance chart, quote, search, valuation, and earnings endpoints
- Yahoo Finance RSS feeds
- Google News RSS
- FRED CSV endpoints for some macro overlays
- Bundled sample chart, holdings, quote, news, and earnings data

No API key is required for the default experience.

Important limitations:

- Public endpoints can change, throttle, or fail.
- Data can be delayed or approximate.
- Free endpoints should not be treated as trading infrastructure.
- SAMPLE badges indicate bundled fallback data, not live data.

## Requirements

- Node.js 20 or newer
- npm
- macOS or Windows for desktop use
- Internet access for live public data

Optional:

- An OpenAI-compatible local LLM server for Quant AI model responses

## Quick Start

### macOS or Linux shell

```bash
git clone https://github.com/your-org/quant.git
cd quant
npm install
npm run typecheck
npm start
```

### Windows PowerShell

```powershell
git clone https://github.com/your-org/quant.git
cd quant
npm install
npm run typecheck
npm start
```

`npm start` builds the app and launches Electron.

On first launch, Quant opens an onboarding wizard. It can add a starter watchlist preset, save optional Quant AI local model settings, and explain the main reading workflow. Skipping onboarding keeps the app in deterministic non-LLM mode.

## Running Without Local LLM

Local LLM support is optional and disabled by default.

If no LLM is enabled, the Quant AI tab still works. It returns a deterministic memo generated from the signal engine, risk plan, blockers, and context. This keeps the app usable for all contributors without requiring a model server, private path, GPU, or provider account.

No setup is required for this mode. Leave local LLM calls disabled in onboarding, or do not set any LLM environment variables.

## Optional Local LLM Setup

Quant can call any local server that exposes an OpenAI-compatible chat completions endpoint.

Expected endpoints:

- `GET /health`
- `POST /v1/chat/completions`

Expected request shape:

- `model`
- `temperature`
- `max_tokens`
- `messages`

### Step 1: Start a compatible local model server

Start your preferred local LLM runtime. Examples include llama.cpp server, LM Studio local server, Ollama OpenAI-compatible mode, or a custom OpenAI-compatible proxy.

Confirm the health endpoint:

```bash
curl http://127.0.0.1:8080/health
```

If your server does not provide `/health`, add a small proxy or use a server mode that does. Quant checks health before sending chat requests.

### Step 2: Enable LLM calls

Use either the onboarding wizard or environment variables.

On first launch, enable local LLM calls in the onboarding wizard, enter the server URL, enter the model name, and save. Quant writes these preferences to Electron's local `userData` directory.

For shell-driven development, environment variables can provide the initial defaults:

macOS or Linux shell:

```bash
export QUANT_LLM_ENABLED=1
export QUANT_LLM_BASE_URL=http://127.0.0.1:8080
export QUANT_LLM_MODEL=your-model-name
npm start
```

Windows PowerShell:

```powershell
$env:QUANT_LLM_ENABLED="1"
$env:QUANT_LLM_BASE_URL="http://127.0.0.1:8080"
$env:QUANT_LLM_MODEL="your-model-name"
npm start
```

### Step 3: Use Quant AI

Open a chart, choose the `Quant AI` tab, and ask a question. The agent sends:

- Current symbol and chart range
- Deterministic signal evaluation
- Risk plan
- News near pivots
- Earnings context
- Valuation snapshot
- Active macro overlays
- Chart screenshot availability

If the model server is unavailable, Quant falls back to the deterministic memo.

### Environment Reference

Copy `.env.example` as a reference. Quant does not automatically load `.env`; set variables in your shell, process manager, or launcher.

The onboarding wizard stores runtime LLM settings in local app data. Environment variables remain useful for development, CI, or managed launchers, and act as defaults when no saved settings exist.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `QUANT_LLM_ENABLED` | No | disabled | Set to `1`, `true`, or `yes` to enable local LLM calls |
| `QUANT_LLM_BASE_URL` | No | `http://127.0.0.1:8080` | OpenAI-compatible server base URL |
| `QUANT_LLM_MODEL` | No | `gemma-4-e4b` | Model name sent to the local server |

Setting `QUANT_LLM_BASE_URL` also enables local LLM calls, even if `QUANT_LLM_ENABLED` is not set.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Bundle Electron main, preload, renderer, and static data into `dist/` |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run test:quant` | Run signal-engine tests |
| `npm start` | Build and launch the desktop app |
| `npm run smoke` | Build, launch in smoke mode, and write `dist/smoke.png` |
| `npm run smoke:modal` | Build, launch with the SPY modal open, and write `dist/smoke-modal.png` |
| `npm run package:mac` | Build a runnable macOS app folder in `release/` |
| `npm run package:win` | Build a runnable Windows x64 app folder in `release/` |
| `npm run package:all` | Build macOS and Windows release folders |

## Release Packaging

Quant includes a lightweight release packager at `scripts/package-release.mjs`. It does not require electron-builder.

The packager:

1. Runs `scripts/build.mjs`
2. Creates a minimal Electron app payload under `resources/app`
3. Copies the compiled `dist/` payload
4. Writes a minimal runtime `package.json`
5. Copies `LICENSE` into the packaged app
6. Produces runnable release folders under `release/`

### macOS Release

On macOS:

```bash
npm run package:mac
```

Output:

```text
release/Quant-mac-arm64/Quant.app
```

The macOS package uses the locally installed Electron runtime. Build the macOS package on the same architecture as the installed Electron binary.

For Apple Silicon:

```bash
npm run package:mac
```

For Intel macOS, run the same command on an Intel Mac or an environment with an Intel Electron runtime.

This app is ad-hoc signed by the release script but not Apple-notarized. On another Mac, the user may need to allow it in System Settings.

### Windows Release

On macOS, Linux, or Windows:

```bash
npm run package:win
```

Output:

```text
release/Quant-win-x64/Quant.exe
```

The Windows packager downloads the official Electron Windows x64 runtime through `@electron/get`, extracts it, renames `electron.exe` to `Quant.exe`, and adds the app payload under `resources/app`.

Distribute the entire `release/Quant-win-x64` folder. Do not distribute `Quant.exe` alone.

### Build Both

On macOS:

```bash
npm run package:all
```

Output:

```text
release/Quant-mac-arm64/Quant.app
release/Quant-win-x64/Quant.exe
```

### Release Notes for Maintainers

Before publishing a release:

```bash
npm install
npm run typecheck
npm run test:quant
npm run smoke:modal
npm run package:all
```

Then inspect:

- `dist/smoke-modal.png`
- `release/Quant-mac-*/Quant.app`
- `release/Quant-win-x64/Quant.exe`

For public releases, replace placeholder repository URLs in `package.json` with the real repository URL.

## Windows Troubleshooting

### `npm start` opens no window in VS Code

Some VS Code terminals set `ELECTRON_RUN_AS_NODE`, which can make Electron behave like Node instead of launching a window.

PowerShell:

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npm run build
& ".\node_modules\electron\dist\electron.exe" .
```

### PowerShell blocks npm scripts

Use the explicit npm command from a normal PowerShell session, or adjust your execution policy according to your organization policy.

## macOS Troubleshooting

### Unsigned app warning

Release folders created by this repository are ad-hoc signed for local execution but not Apple-notarized. For personal use, open System Settings and allow the app after the first blocked launch if macOS blocks it.

### Local LLM cannot connect

Check:

```bash
curl http://127.0.0.1:8080/health
```

Then confirm the environment variables are set in the same shell that launches Quant.

If you configured the model through onboarding, reopen onboarding with:

```bash
./node_modules/.bin/electron . --onboarding
```

For normal use, you can also remove the saved `llm-settings.json` file from Electron's `userData` directory and launch Quant again to reset onboarding defaults.

## Project Structure

```text
src/
  main/
    main.ts                 Electron app lifecycle and IPC handlers
    preload.ts              Typed bridge exposed to renderer
    services/               Data fetching, cache, stores, analysis services
    data/                   Bundled offline data
  renderer/
    App.tsx                 App shell
    store.tsx               Global renderer state and actions
    components/             Watchlist, news, earnings, chart modal
    styles/                 CSS modules by surface
  shared/
    ipc.ts                  IPC channel names
    types.ts                Shared API/data contracts
    quant.ts                Deterministic signal engine
scripts/
  build.mjs                 esbuild bundle script
  test-quant.mjs            Signal-engine test script
  package-release.mjs       Runnable Windows/macOS release packager
```

## Data Storage

Quant stores local user data in Electron's `userData` directory:

- `watchlist.json`
- `llm-settings.json`
- saved Quant AI insight records

The exact directory depends on the operating system and Electron app name.

## Security Model

- Renderer loads local app files.
- Content Security Policy blocks arbitrary remote connections from the renderer.
- Main process validates external URLs before opening them.
- Market data and news are treated as untrusted remote content.
- Local LLM calls are disabled by default.
- No secrets are required for default operation.

## Contributing

See `CONTRIBUTING.md`.

## Security

See `SECURITY.md`.

## License

MIT. See `LICENSE`.

## Disclaimer

Quant is for research, education, and personal market monitoring. It is not investment advice, a broker, an execution system, or a source of guaranteed real-time market data.
