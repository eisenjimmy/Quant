export function createFastForecastDriver(options = {}) {
  const pathCount = 3;
  const predictionBars = 2;
  const delayMs = Math.max(0, Number(options.delayMs ?? 80));
  const now = typeof options.now === 'function' ? options.now : Date.now;
  const storage = options.storage ?? null;
  const storageKey =
    options.storageKey ?? 'quant.preview.fastForecastState.v1';
  const crashOnce = options.crashOnce === true;
  const progressListeners = new Set();
  const completedListeners = new Set();
  const failedListeners = new Set();
  const timers = new Set();

  function readState() {
    try {
      const parsed = JSON.parse(storage?.getItem(storageKey) ?? 'null');
      if (parsed && typeof parsed === 'object') {
        return {
          job: parsed.job ?? null,
          records: Array.isArray(parsed.records) ? parsed.records : [],
          hasCrashed: parsed.hasCrashed === true,
          overlayEnabled: parsed.overlayEnabled !== false,
          counter: Number.isInteger(parsed.counter) ? parsed.counter : 0,
        };
      }
    } catch {
      // A malformed smoke fixture must not block the UI.
    }
    return {
      job: null,
      records: [],
      hasCrashed: false,
      overlayEnabled: true,
      counter: 0,
    };
  }

  let state = readState();

  function writeState() {
    try {
      storage?.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Persistence is best-effort in the browser-only smoke harness.
    }
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function emit(listeners, event) {
    for (const listener of [...listeners]) {
      try {
        listener(clone(event));
      } catch {
        // Match Electron event isolation.
      }
    }
  }

  function createRecord(job) {
    const generatedAt = new Date(now()).toISOString();
    const firstTimestamp = new Date(now() + 60 * 60 * 1000).toISOString();
    const secondTimestamp = new Date(now() + 2 * 60 * 60 * 1000).toISOString();
    const aggregate = [
      {
        timestamp: firstTimestamp,
        mean: 552.1,
        p10: 549.2,
        p25: 550.5,
        p50: 552,
        p75: 553.6,
        p90: 555.1,
        min: 548.2,
        max: 556.3,
      },
      {
        timestamp: secondTimestamp,
        mean: 553,
        p10: 548.8,
        p25: 550.7,
        p50: 552.8,
        p75: 555.2,
        p90: 557,
        min: 547.5,
        max: 558.1,
      },
    ];
    return {
      schemaVersion: 1,
      id: job.jobId,
      symbol: job.symbol,
      assetType: 'etf',
      generatedAt,
      expiresAt: new Date(now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      forecastStartAt: firstTimestamp,
      forecastEndAt: secondTimestamp,
      lastHistoricalClose: 551.64,
      horizonLabel: '24-trading-hours',
      aggregate,
      closePaths: [
        [551.2, 552.1],
        [552, 552.8],
        [553.1, 553.5],
      ],
      metrics: {
        sampledUpsideFrequency: 2 / 3,
        sampledDownsideFrequency: 1 / 3,
        volatilityAmplificationFrequency: 1 / 3,
        medianPredictedReturn: 0.0021,
        meanPredictedReturn: 0.0024,
        historicalVolatility: 0.012,
        medianForecastVolatility: 0.013,
      },
      provenance: {
        mode: 'development-mock',
        marketDataSource: 'fast-ui-fixture',
        marketDataIsSample: false,
        latestCompletedCandleAt: generatedAt,
        historyBars: 360,
        adjusted: true,
        adjustmentMethod: 'fast-ui-fixture',
        exchange: 'NYSEArca',
        exchangeTimezone: 'America/New_York',
        marketCalendar: 'US-equities-v1',
        regularSession: '09:30-16:00',
        modelId: 'test-only/fast-fixture',
        tokenizerId: 'test-only/fast-fixture',
        kronosCommit: 'test-only',
        device: 'cpu',
        temperature: 1,
        topP: 0.95,
        topK: 0,
        pathCount,
        baseSeed: 7100,
        pathSeeds: [7100, 7101, 7102],
        repairsApplied: false,
        repairedValueCount: 0,
      },
      evaluation: {
        status: 'not-started',
        actualPointsAvailable: 0,
        expectedPoints: predictionBars,
      },
      warnings: ['Test-only 3-path, 2-bar UI fixture.'],
    };
  }

  function eventsFor(job) {
    const base = {
      jobId: job.jobId,
      symbol: job.symbol,
      totalPaths: pathCount,
    };
    if (crashOnce && !state.hasCrashed) {
      return [
        {
          ...base,
          stage: 'preparing-engine',
          sequence: 2,
          percent: 5,
          completedPaths: 0,
          message: 'Loading fast UI fixture',
          preparationPhase: 'loading',
        },
        {
          ...base,
          stage: 'failed',
          sequence: 3,
          percent: 5,
          completedPaths: 0,
          message: 'The local forecast worker stopped unexpectedly.',
          errorCode: 'WORKER_CRASHED',
        },
      ];
    }
    return [
      {
        ...base,
        stage: 'validating',
        sequence: 2,
        percent: 2,
        completedPaths: 0,
        message: 'Validated fast UI fixture',
      },
      {
        ...base,
        stage: 'preparing-engine',
        sequence: 3,
        percent: 5,
        completedPaths: 0,
        message: 'Fast UI fixture ready',
        preparationPhase: 'loading',
      },
      {
        ...base,
        stage: 'running-paths',
        sequence: 4,
        percent: 5,
        completedPaths: 0,
        message: 'Starting fixture path 1 of 3',
      },
      {
        ...base,
        stage: 'running-paths',
        sequence: 5,
        percent: 35,
        completedPaths: 1,
        message: 'Completed fixture path 1 of 3',
      },
      {
        ...base,
        stage: 'running-paths',
        sequence: 6,
        percent: 65,
        completedPaths: 2,
        message: 'Completed fixture path 2 of 3',
      },
      {
        ...base,
        stage: 'running-paths',
        sequence: 7,
        percent: 95,
        completedPaths: 3,
        message: 'Completed fixture path 3 of 3',
      },
      {
        ...base,
        stage: 'post-processing',
        sequence: 8,
        percent: 98,
        completedPaths: 3,
        message: 'Aggregated two fixture bars',
      },
      {
        ...base,
        stage: 'persisting',
        sequence: 9,
        percent: 99,
        completedPaths: 3,
        message: 'Saving fast UI forecast',
      },
      {
        ...base,
        stage: 'completed',
        sequence: 10,
        percent: 100,
        completedPaths: 3,
        message: 'Fast UI forecast saved',
        forecastId: job.jobId,
      },
    ];
  }

  function schedule(job, afterSequence = 1) {
    const events = eventsFor(job).filter(
      (event) => event.sequence > afterSequence,
    );
    events.forEach((event, index) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (
          state.job?.jobId !== job.jobId ||
          state.job.stage === 'cancelled' ||
          state.job.stage === 'failed'
        ) {
          return;
        }
        const stamped = {
          ...event,
          updatedAt: new Date(now()).toISOString(),
        };
        state.job = stamped;
        if (stamped.stage === 'failed') {
          state.hasCrashed = true;
          writeState();
          emit(progressListeners, stamped);
          emit(failedListeners, stamped);
          return;
        }
        if (stamped.stage === 'completed') {
          const record = createRecord(stamped);
          state.records = [
            record,
            ...state.records.filter((saved) => saved.id !== record.id),
          ];
          writeState();
          emit(progressListeners, stamped);
          emit(completedListeners, stamped);
          return;
        }
        writeState();
        emit(progressListeners, stamped);
      }, delayMs * (index + 1));
      timers.add(timer);
    });
  }

  if (
    state.job &&
    [
      'validating',
      'preparing-engine',
      'running-paths',
      'post-processing',
      'persisting',
    ].includes(state.job.stage)
  ) {
    schedule(state.job, state.job.sequence);
  }

  function pruneExpiredRecords() {
    const retained = state.records.filter(
      (record) => Date.parse(record.expiresAt) > now(),
    );
    if (retained.length !== state.records.length) {
      state.records = retained;
      writeState();
    }
  }

  const api = {
    run: async (request) => {
      if (
        state.job &&
        [
          'validating',
          'preparing-engine',
          'running-paths',
          'post-processing',
          'persisting',
        ].includes(state.job.stage)
      ) {
        return {
          ok: false,
          code: 'FORECAST_ALREADY_RUNNING',
          message: `A forecast is already running for ${state.job.symbol}.`,
          activeSymbol: state.job.symbol,
        };
      }
      state.counter += 1;
      const job = {
        jobId: `fc_fast_ui_${state.counter}`,
        symbol: String(request?.symbol ?? 'SPY').toUpperCase(),
        stage: 'validating',
        sequence: 1,
        percent: 1,
        completedPaths: 0,
        totalPaths: pathCount,
        message: 'Starting 3-path, 2-bar UI fixture',
        updatedAt: new Date(now()).toISOString(),
      };
      state.job = job;
      writeState();
      schedule(job);
      return { ok: true, job: clone(job) };
    },
    cancel: async (jobId) => {
      if (state.job?.jobId !== jobId) {
        return {
          ok: false,
          code: 'JOB_CANCELLED',
          message: 'No matching fast UI job is active.',
        };
      }
      const cancelled = {
        ...state.job,
        stage: 'cancelled',
        sequence: state.job.sequence + 1,
        message: 'Fast UI forecast cancelled',
        errorCode: 'JOB_CANCELLED',
        updatedAt: new Date(now()).toISOString(),
        preparationPhase: undefined,
      };
      state.job = cancelled;
      writeState();
      return { ok: true, job: clone(cancelled) };
    },
    getJob: async (symbol) =>
      state.job?.symbol === String(symbol).toUpperCase()
        ? clone(state.job)
        : null,
    listSaved: async (symbol) => {
      pruneExpiredRecords();
      return clone(
        state.records.filter(
          (record) => record.symbol === String(symbol).toUpperCase(),
        ),
      );
    },
    getSaved: async (forecastId) => {
      pruneExpiredRecords();
      return clone(
        state.records.find((record) => record.id === forecastId) ?? null,
      );
    },
    getHistoricalComparison: async (forecastId) => {
      pruneExpiredRecords();
      const record = state.records.find((saved) => saved.id === forecastId);
      if (!record) return null;
      return {
        evaluation: clone(record.evaluation),
        actual: [],
      };
    },
    setOverlayEnabled: async (_symbol, enabled) => {
      state.overlayEnabled = enabled === true;
      writeState();
      return state.overlayEnabled;
    },
    getOverlayEnabled: async () => state.overlayEnabled,
    onProgress: (listener) => {
      progressListeners.add(listener);
      return () => progressListeners.delete(listener);
    },
    onCompleted: (listener) => {
      completedListeners.add(listener);
      return () => completedListeners.delete(listener);
    },
    onFailed: (listener) => {
      failedListeners.add(listener);
      return () => failedListeners.delete(listener);
    },
  };

  return {
    api,
    constants: { pathCount, predictionBars },
    snapshot: () => clone(state),
    dispose: () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      progressListeners.clear();
      completedListeners.clear();
      failedListeners.clear();
    },
  };
}
