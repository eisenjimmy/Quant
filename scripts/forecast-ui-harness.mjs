import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createFastForecastDriver } from './forecast-fast-ui-driver.mjs';

const host = '127.0.0.1';
const port = Number(process.env.QUANT_PREVIEW_PORT ?? 4178);
const rendererRoot = join(process.cwd(), 'dist', 'renderer');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function forecastStub() {
  return `
(() => {
  const now = Date.now();
  const day = 86_400_000;
  const previewState = new URLSearchParams(location.search).get('forecastState');
  const fastMode =
    previewState === 'fast' || previewState === 'fast-crash';
  const fastStorageKey = 'quant.preview.fastForecastState.v1';
  if (
    fastMode &&
    new URLSearchParams(location.search).get('resetFast') === '1'
  ) {
    localStorage.removeItem(fastStorageKey);
  }
  const fastDriver = fastMode
    ? (${createFastForecastDriver.toString()})({
        delayMs: 180,
        storage: localStorage,
        storageKey: fastStorageKey,
        crashOnce: previewState === 'fast-crash',
      })
    : null;
  const candles = Array.from({ length: 260 }, (_, index) => {
    const timestamp = now - (259 - index) * day;
    const close = 520 + index * 0.12 + Math.sin(index / 9) * 4;
    return {
      time: Math.floor(timestamp / 1000),
      open: close - 0.7,
      high: close + 1.8,
      low: close - 2.1,
      close,
      volume: 55_000_000 + index * 10_000,
    };
  });
  const aggregate = Array.from({ length: 24 }, (_, index) => {
    const step = index + 1;
    const median = 551 + step * 0.42;
    return {
      timestamp: new Date(now + step * day).toISOString(),
      mean: median + 0.15,
      p10: median - 4.8 - step * 0.04,
      p25: median - 2.5,
      p50: median,
      p75: median + 2.7,
      p90: median + 5.1 + step * 0.05,
      min: median - 7.2,
      max: median + 7.6,
    };
  });
  const savedForecast = {
    schemaVersion: 1,
    id: 'preview-forecast-spy',
    symbol: 'SPY',
    assetType: 'etf',
    generatedAt: new Date(now - 90_000).toISOString(),
    expiresAt: new Date(now - 90_000 + 7 * day).toISOString(),
    forecastStartAt: aggregate[0].timestamp,
    forecastEndAt: aggregate[aggregate.length - 1].timestamp,
    lastHistoricalClose: 551.64,
    horizonLabel: '24-trading-hours',
    aggregate,
    closePaths: Array.from({ length: 30 }, (_, pathIndex) =>
      aggregate.map((point, stepIndex) => point.p50 + Math.sin((pathIndex + stepIndex) / 3) * 3)
    ),
    metrics: {
      sampledUpsideFrequency: 0.667,
      sampledDownsideFrequency: 0.333,
      volatilityAmplificationFrequency: 0.267,
      medianPredictedReturn: 0.0183,
      meanPredictedReturn: 0.0191,
      historicalVolatility: 0.012,
      medianForecastVolatility: 0.013,
    },
    provenance: {
      mode: 'development-mock',
      marketDataSource: 'quant-local-preview',
      marketDataIsSample: false,
      latestCompletedCandleAt: new Date(now).toISOString(),
      historyBars: 360,
      adjusted: true,
      adjustmentMethod: 'preview',
      exchange: 'NYSEArca',
      exchangeTimezone: 'America/New_York',
      marketCalendar: 'US-equities-v1',
      regularSession: '09:30-16:00',
      modelId: 'NeoQuasar/Kronos-mini',
      tokenizerId: 'NeoQuasar/Kronos-Tokenizer-2k',
      kronosCommit: '67b630e67f6a18c9e9be918d9b4337c960db1e9a',
      device: 'cpu',
      temperature: 1,
      topP: 0.95,
      topK: 0,
      pathCount: 30,
      baseSeed: 20260725,
      pathSeeds: Array.from({ length: 30 }, (_, index) => 20260725 + index),
      repairsApplied: false,
      repairedValueCount: 0,
    },
    evaluation: {
      status: 'not-started',
      actualPointsAvailable: 0,
      expectedPoints: 24,
    },
    warnings: ['Browser-only UI preview record.'],
  };
  const olderAggregate = aggregate.map((point) => ({
    ...point,
    mean: point.mean - 6,
    p10: point.p10 - 6,
    p25: point.p25 - 6,
    p50: point.p50 - 6,
    p75: point.p75 - 6,
    p90: point.p90 - 6,
    min: point.min - 6,
    max: point.max - 6,
  }));
  const olderForecast = {
    ...savedForecast,
    id: 'preview-forecast-spy-older',
    generatedAt: new Date(now - day).toISOString(),
    expiresAt: new Date(now + 6 * day).toISOString(),
    aggregate: olderAggregate,
    closePaths: savedForecast.closePaths.map((path) =>
      path.map((price) => price - 6)
    ),
    metrics: {
      ...savedForecast.metrics,
      sampledUpsideFrequency: 0.433,
      sampledDownsideFrequency: 0.567,
      medianPredictedReturn: 0.0074,
      meanPredictedReturn: 0.0069,
    },
    warnings: ['Older immutable browser-preview snapshot.'],
  };
  const savedForecasts = [savedForecast, olderForecast];
  const previewDelay = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
  const previewJob =
    previewState === 'downloading'
      ? {
          jobId: 'fc_preview_download',
          symbol: 'SPY',
          stage: 'preparing-engine',
          sequence: 4,
          percent: 4,
          completedPaths: 0,
          totalPaths: 30,
          message: 'Downloading Kronos-mini for first use',
          updatedAt: new Date(now).toISOString(),
          preparationPhase: 'downloading',
        }
      : previewState === 'loading'
        ? {
            jobId: 'fc_preview_load',
            symbol: 'SPY',
            stage: 'preparing-engine',
            sequence: 5,
            percent: 5,
            completedPaths: 0,
            totalPaths: 30,
            message: 'Loading Kronos-mini into memory',
            updatedAt: new Date(now).toISOString(),
            preparationPhase: 'loading',
          }
        : previewState === 'setup'
          ? {
              jobId: 'fc_preview_setup',
              symbol: 'SPY',
              stage: 'failed',
              sequence: 4,
              percent: 3,
              completedPaths: 0,
              totalPaths: 30,
              message: 'Internal dependency detail hidden from the renderer.',
              updatedAt: new Date(now).toISOString(),
              errorCode: 'ENGINE_SETUP_FAILED',
            }
          : null;
  const overlayStorageKey = 'quant.preview.forecastOverlay';
  let overlayEnabled = localStorage.getItem(overlayStorageKey) !== 'false';
  const noop = () => {};
  let previewWatchlist = [
    {
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      type: 'etf',
      addedAt: new Date(now - day).toISOString(),
    },
    {
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      type: 'etf',
      addedAt: new Date(now - day / 2).toISOString(),
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'stock',
      addedAt: new Date(now).toISOString(),
    },
  ];
  const api = {
    getWatchlist: async () => previewWatchlist.map((item) => ({ ...item })),
    addToWatchlist: async () => ({ ok: true }),
    removeFromWatchlist: async (symbol) => {
      previewWatchlist = previewWatchlist.filter((item) => item.symbol !== symbol);
      return previewWatchlist.map((item) => ({ ...item }));
    },
    reorderWatchlist: async (symbols) => {
      const bySymbol = new Map(previewWatchlist.map((item) => [item.symbol, item]));
      if (
        symbols.length === previewWatchlist.length &&
        new Set(symbols).size === symbols.length &&
        symbols.every((symbol) => bySymbol.has(symbol))
      ) {
        previewWatchlist = symbols.map((symbol) => bySymbol.get(symbol));
      }
      return previewWatchlist.map((item) => ({ ...item }));
    },
    searchSymbols: async () => [{
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      type: 'etf',
    }],
    getQuotes: async (symbols) => symbols.map((symbol, index) => ({
      symbol,
      name: previewWatchlist.find((item) => item.symbol === symbol)?.name ?? symbol,
      price: 551.64 - index * 42.15,
      change: 2.31 - index,
      changePercent: 0.42 - index * 0.31,
      previousClose: 549.33 - index * 42.15,
      currency: 'USD',
      marketState: 'CLOSED',
      source: 'live',
      updatedAt: new Date(now).toISOString(),
    })),
    getHoldings: async (etfSymbol) => ({
      etfSymbol,
      holdings: [],
      source: 'live',
      asOf: new Date(now).toISOString().slice(0, 10),
    }),
    getNews: async () => [],
    getEarnings: async () => [],
    getChart: async (_symbol, range) => ({
      symbol: 'SPY',
      range,
      interval: '1d',
      candles,
      currency: 'USD',
      exchangeName: 'NYSEArca',
      regularMarketPrice: 551.64,
      previousClose: 549.33,
      source: 'live',
    }),
    getPivotNews: async () => [],
    getMacroOverlay: async () => ({ key: 'VIX', points: [], source: 'live', asOf: now }),
    captureChartSnapshot: async () => null,
    analyzeQuant: async () => ({ ok: false, error: 'Disabled in browser preview.' }),
    getQuantInsights: async () => [],
    getQuantJournal: async () => [],
    saveQuantJournal: async (entry) => ({ ...entry, id: 'preview-journal', createdAt: now }),
    getLlmSettings: async () => ({ provider: 'none', model: '' }),
    saveLlmSettings: async () => ({ ok: true }),
    testLlmConnection: async () => ({ ok: false, message: 'Disabled in browser preview.' }),
    getValuation: async () => ({
      symbol: 'SPY',
      companyName: 'SPDR S&P 500 ETF Trust',
      price: 551.64,
      marketCap: null,
      enterpriseValue: null,
      totalRevenue: null,
      grossProfit: null,
      ebitda: null,
      netIncomeToCommon: null,
      profitMargin: null,
      revenueGrowth: null,
      trailingPe: null,
      forwardPe: null,
      priceToSales: null,
      priceToBook: null,
      enterpriseToRevenue: null,
      enterpriseToEbitda: null,
      forwardEps: null,
      targetMeanPrice: null,
      sharesOutstanding: null,
      estimates: [],
      source: 'live',
    }),
    scanSignals: async () => ({ items: [], source: 'live', asOf: now }),
    openExternal: async () => ({ ok: true }),
    forecast: fastDriver?.api ?? {
      run: async () => ({
        ok: false,
        code: 'ENGINE_SETUP_FAILED',
        message: 'Forecast execution is disabled in the browser preview.',
      }),
      cancel: async (jobId) => ({
        ok: true,
        job: {
          ...(previewJob ?? {
            jobId,
            symbol: 'SPY',
            sequence: 1,
            percent: 1,
            completedPaths: 0,
            totalPaths: 30,
            message: 'Forecast accepted',
            updatedAt: new Date(now).toISOString(),
          }),
          stage: 'cancelled',
          sequence: (previewJob?.sequence ?? 1) + 1,
          message: 'Forecast cancelled',
          errorCode: 'JOB_CANCELLED',
          preparationPhase: undefined,
        },
      }),
      getJob: async () => previewJob,
      listSaved: async () => savedForecasts,
      getSaved: async (forecastId) => {
        await previewDelay(120);
        return savedForecasts.find((record) => record.id === forecastId) ?? null;
      },
      getHistoricalComparison: async (forecastId) => {
        await previewDelay(180);
        const record = savedForecasts.find((item) => item.id === forecastId);
        if (!record) return null;
        const matured = forecastId === olderForecast.id;
        const points = matured ? record.aggregate : record.aggregate.slice(0, 4);
        return {
          evaluation: {
            status: matured ? 'matured' : 'partial',
            evaluatedAt: new Date(now).toISOString(),
            actualFinalClose: matured ? points.at(-1).p50 + 0.8 : undefined,
            directionCorrect: matured ? true : undefined,
            medianAbsolutePercentageError: matured ? 0.0068 : 0.0091,
            p10P90Coverage: matured ? 0.875 : 0.75,
            actualPointsAvailable: points.length,
            expectedPoints: 24,
          },
          actual: points.map((point, index) => ({
            timestamp: point.timestamp,
            close: point.p50 + Math.sin(index) * 1.2,
          })),
        };
      },
      setOverlayEnabled: async (_symbol, enabled) => {
        await previewDelay(120);
        overlayEnabled = enabled;
        localStorage.setItem(overlayStorageKey, String(enabled));
        return overlayEnabled;
      },
      getOverlayEnabled: async () => overlayEnabled,
      onProgress: () => noop,
      onCompleted: () => noop,
      onFailed: () => noop,
    },
  };
  Object.defineProperty(window, 'quant', { value: api, configurable: false });
})();
`;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
    if (requestUrl.pathname === '/forecast-stub.js') {
      response.writeHead(200, { 'content-type': contentTypes['.js'] });
      response.end(forecastStub());
      return;
    }

    const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const relativePath = normalize(pathname).replace(/^[/\\]+/, '');
    const filePath = join(rendererRoot, relativePath);
    if (!filePath.startsWith(rendererRoot)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    let body = await readFile(filePath);
    if (pathname === '/index.html') {
      body = Buffer.from(
        body
          .toString('utf8')
          .replace('</head>', '<script src="/forecast-stub.js"></script></head>'),
      );
    }
    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.message : 'Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Forecast UI preview: http://${host}:${port}/?smokeModal=SPY&smokeRail=forecast`);
});
