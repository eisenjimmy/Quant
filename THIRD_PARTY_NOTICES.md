# Third-Party Notices

Quant includes and uses the following third-party components for its optional,
manually triggered forecast feature.

The frozen forecast sidecar also redistributes its pinned Python runtime
dependencies, including NumPy, pandas, PyTorch, einops, Hugging Face Hub,
Matplotlib, tqdm, safetensors, their installed dependencies, and the
PyInstaller bootloader. The release build generates an exact package/version
inventory and copies all available license, copyright, attribution, and notice
texts to `third-party/forecast-runtime/`. That generated inventory is the
authoritative notice set for the platform-specific binary.

## Kronos

- Project: Kronos — A Foundation Model for the Language of Financial Markets
- Source: https://github.com/shiyu-coder/Kronos
- Pinned source commit: `67b630e67f6a18c9e9be918d9b4337c960db1e9a`
- Copyright: Copyright (c) 2025 ShiYu
- License: MIT

The forecast model and tokenizer are downloaded only when the user runs a
forecast. Quant pins them to immutable Hugging Face revisions and verifies each
required file by size and SHA-256 before loading:

- `NeoQuasar/Kronos-mini` at
  `7fdcc628d87f325ccdbcae0a372622ca7e6813aa`
- `NeoQuasar/Kronos-Tokenizer-2k` at
  `b22fb9cb30a2de2f77e8b617169cd756ba964a08`

### MIT License

Copyright (c) 2025 ShiYu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
