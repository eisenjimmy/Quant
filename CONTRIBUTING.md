# Contributing

Thank you for considering a contribution to Quant.

## Development Principles

- Keep changes scoped and reversible.
- Preserve the Electron main/preload/renderer boundary.
- Treat market data as untrusted and potentially delayed.
- Do not add paid data providers, secrets, or account-specific paths without making them optional.
- Keep local LLM support optional. The app must remain usable without a model server.
- Run typecheck and at least one smoke test before opening a pull request.

## Local Setup

```bash
npm install
npm run typecheck
npm start
```

On Windows PowerShell:

```powershell
npm install
npm run typecheck
npm start
```

## Pull Request Checklist

- Explain the user-facing change.
- Mention any data-source or network behavior changes.
- Include screenshots for UI changes.
- Include test output for `npm run typecheck` and relevant smoke tests.
- Update `README.md` if setup, release, environment, or user workflows changed.

## Data and Secrets

Do not commit API keys, local model paths, user watchlists, generated release folders, or private market data. Use environment variables for local configuration.
