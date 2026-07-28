import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const port = 43000 + (process.pid % 1000);
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  ['scripts/forecast-ui-harness.mjs'],
  {
    cwd: process.cwd(),
    env: { ...process.env, QUANT_PREVIEW_PORT: String(port) },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Forecast harness did not start')),
      5_000,
    );
    server.once('error', reject);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('Forecast UI preview:')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.stderr.on('data', (chunk) => {
      const message = String(chunk).trim();
      if (message) reject(new Error(message));
    });
  });
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function runStub(source, search, storage) {
  const window = {};
  vm.runInNewContext(source, {
    window,
    location: { search },
    localStorage: storage,
    URLSearchParams,
    URL,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Promise,
    Map,
    Set,
    console,
    setTimeout,
    clearTimeout,
  });
  return window.quant;
}

function resolveChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    process.env.PROGRAMFILES
      ? path.join(
          process.env.PROGRAMFILES,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        )
      : null,
    process.env['PROGRAMFILES(X86)']
      ? path.join(
          process.env['PROGRAMFILES(X86)'],
          'Google',
          'Chrome',
          'Application',
          'chrome.exe',
        )
      : null,
  ].filter(Boolean);
  const chrome = candidates.find((candidate) => existsSync(candidate));
  if (!chrome) {
    throw new Error(
      'Chrome is required for the built-renderer forecast integration test. Set CHROME_PATH.',
    );
  }
  return chrome;
}

async function waitUntil(check, message, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `${message}${lastError ? `: ${String(lastError)}` : ''}`,
  );
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let requestId = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', (message) => {
    const payload = JSON.parse(String(message.data));
    if (payload.id) {
      const waiter = pending.get(payload.id);
      if (!waiter) return;
      pending.delete(payload.id);
      if (payload.error) {
        waiter.reject(new Error(payload.error.message));
      } else {
        waiter.resolve(payload.result);
      }
      return;
    }
    for (const listener of listeners.get(payload.method) ?? []) {
      listener(payload.params);
    }
  });
  return {
    on(method, listener) {
      const methodListeners = listeners.get(method) ?? [];
      methodListeners.push(listener);
      listeners.set(method, methodListeners);
    },
    command(method, params = {}) {
      requestId += 1;
      const id = requestId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}

async function runBuiltRendererFlow() {
  const chromePort = port + 1_000;
  const profile = mkdtempSync(
    path.join(os.tmpdir(), 'quant-forecast-chrome-'),
  );
  const chrome = spawn(
    resolveChrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-background-networking',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    {
      shell: false,
      stdio: ['ignore', 'ignore', 'ignore'],
    },
  );
  let cdp;
  try {
    await waitUntil(
      async () =>
        (await fetch(`http://127.0.0.1:${chromePort}/json/version`)).ok,
      'Headless Chrome did not start',
    );
    const tabResponse = await fetch(
      `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent(
        `${origin}/?forecastState=fast&resetFast=1`,
      )}`,
      { method: 'PUT' },
    );
    assert.equal(tabResponse.ok, true);
    const tab = await tabResponse.json();
    cdp = await connectCdp(tab.webSocketDebuggerUrl);
    const runtimeErrors = [];
    cdp.on('Runtime.exceptionThrown', (event) => {
      runtimeErrors.push(event.exceptionDetails?.text ?? 'runtime error');
    });
    await cdp.command('Runtime.enable');
    await cdp.command('Page.enable');
    const evaluate = async (expression) => {
      const result = await cdp.command('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text);
      }
      return result.result?.value;
    };
    await waitUntil(
      () => evaluate('document.readyState === "complete"'),
      'Built renderer did not load',
    );
    await evaluate(
      'localStorage.setItem("quant.onboarding.completed.v1", "done"); location.reload(); true',
    );
    await waitUntil(
      () =>
        evaluate(
          'Boolean(document.querySelector(\'button[title="Open SPY chart"]\'))',
        ),
      'SPY watchlist row did not render',
    );
    assert.equal(
      await evaluate(
        'document.querySelector(\'button[title="Open SPY chart"]\').click(); true',
      ),
      true,
    );
    await waitUntil(
      () =>
        evaluate(
          'Boolean([...document.querySelectorAll(\'[role="tab"]\')].find((node) => node.textContent.trim() === "Forecast"))',
        ),
      'Forecast tab did not render',
    );
    await evaluate(
      '[...document.querySelectorAll(\'[role="tab"]\')].find((node) => node.textContent.trim() === "Forecast").click(); true',
    );
    await waitUntil(
      () =>
        evaluate(
          'Boolean(document.querySelector(\'aside[aria-label="SPY forecast"] .forecast-primary\'))',
        ),
      'Forecast panel did not render',
    );
    assert.equal(
      await evaluate(
        'document.querySelector(\'aside[aria-label="SPY forecast"] .forecast-primary\').textContent.trim()',
      ),
      'Run Forecast',
    );
    await evaluate(
      'document.querySelector(\'aside[aria-label="SPY forecast"] .forecast-primary\').click(); true',
    );
    const observedProgress = await waitUntil(
      () =>
        evaluate(
          'Number(document.querySelector(\'[role="progressbar"][aria-label="Overall forecast progress"]\')?.getAttribute("aria-valuenow") || 0)',
        ),
      'Actual renderer never showed forecast progress',
    );
    assert.ok(observedProgress > 0 && observedProgress <= 95);
    await waitUntil(
      () =>
        evaluate(
          'document.querySelector(".forecast-eta")?.textContent.includes("ETA")',
        ),
      'Actual renderer never showed the forecast ETA',
    );
    await waitUntil(
      () =>
        evaluate(
          'document.body.innerText.includes("Sampled upside frequency") && document.body.innerText.includes("Historical comparison")',
        ),
      'Actual renderer did not complete the fast forecast',
    );
    assert.equal(
      await evaluate('document.querySelector(".forecast-eta") === null'),
      true,
    );
    const ma20ProjectionEnabled = await evaluate(`
      (() => {
        const label = [...document.querySelectorAll('.forecast-overlay-toggle')]
          .find((node) => node.textContent.includes('Project MA20 through forecast'));
        const input = label?.querySelector('input[type="checkbox"]');
        if (!input || input.disabled) return false;
        input.click();
        return input.checked;
      })()
    `);
    assert.equal(ma20ProjectionEnabled, true);
    await waitUntil(
      () =>
        evaluate(`
          JSON.parse(localStorage.getItem('quant.chart.settings.v1') || '{}')
            .showForecastMa20 === true
        `),
      'Projected MA20 preference was not persisted',
    );
    await evaluate(
      'window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); true',
    );
    await waitUntil(
      () =>
        evaluate(
          'document.querySelector(\'[role="dialog"][aria-label="SPY chart"]\') === null',
        ),
      'Escape did not close the chart dialog',
    );
    assert.equal(runtimeErrors.length, 0);
  } finally {
    cdp?.close();
    if (chrome.exitCode === null) {
      const closed = new Promise((resolve) => {
        chrome.once('close', resolve);
      });
      chrome.kill('SIGTERM');
      await Promise.race([
        closed,
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
    }
    rmSync(profile, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

try {
  await waitForServer();
  const [htmlResponse, stubResponse, rendererResponse] =
    await Promise.all([
      fetch(`${origin}/`),
      fetch(`${origin}/forecast-stub.js`),
      fetch(`${origin}/renderer.js`),
    ]);
  assert.equal(htmlResponse.ok, true);
  assert.equal(stubResponse.ok, true);
  assert.equal(rendererResponse.ok, true);
  const html = await htmlResponse.text();
  const stub = await stubResponse.text();
  const renderer = await rendererResponse.text();
  assert.match(html, /forecast-stub\.js/);
  assert.ok(
    html.indexOf('forecast-stub.js') < html.indexOf('renderer.js'),
  );
  assert.match(renderer, /getHistoricalComparison/);
  assert.match(renderer, /Historical comparison/);
  assert.match(renderer, /Project MA20 through forecast/);

  const storage = memoryStorage();
  const api = runStub(
    stub,
    '?forecastState=fast&resetFast=1',
    storage,
  );
  assert.equal(typeof api.forecast.run, 'function');
  assert.equal(typeof api.forecast.onCompleted, 'function');
  const completed = new Promise((resolve) => {
    api.forecast.onCompleted(resolve);
  });
  const started = await api.forecast.run({ symbol: 'SPY' });
  assert.equal(started.ok, true);
  assert.equal(started.job.totalPaths, 3);
  const completion = await completed;
  assert.equal(completion.percent, 100);
  const saved = await api.forecast.getSaved(completion.forecastId);
  assert.equal(saved.aggregate.length, 2);
  assert.equal(saved.closePaths.length, 3);

  const reopenedApi = runStub(stub, '?forecastState=fast', storage);
  assert.equal(
    (await reopenedApi.forecast.getJob('SPY')).forecastId,
    completion.forecastId,
  );
  assert.equal((await reopenedApi.forecast.listSaved('SPY')).length, 1);
  await runBuiltRendererFlow();
} finally {
  server.kill('SIGTERM');
}

console.log('forecast harness integration tests ok');
