# Security Policy

## Supported Versions

Security fixes are accepted against the current main branch.

## Reporting a Vulnerability

If this project is hosted publicly, report vulnerabilities through the repository security advisory feature when available. If that is not available, open a minimal issue that describes the affected area without posting exploit details.

Useful reports include:

- Affected version or commit
- Operating system
- Steps to reproduce
- Expected impact
- Whether the issue requires local access, network access, or a malicious data source

## Security Notes

- Quant uses unofficial free market-data and RSS endpoints. Treat all remote content as untrusted.
- External links are opened through Electron shell APIs after URL validation in the main process.
- The renderer is loaded from local files with a restrictive Content Security Policy.
- Local LLM support is disabled by default and must be explicitly enabled with environment variables.
- Do not run Quant with a local model endpoint you do not trust.
