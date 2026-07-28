import os
import sys
import threading
import unittest


sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from kronos_adapter import KronosAdapterError
from engine import (
    MAX_REPAIRED_VALUES_PER_PATH,
    PathRunnerError,
    forecast_percent,
    run_forecast_paths,
    validate_and_repair_path,
)


def valid_payload(paths=30):
    return {
        "paths": paths,
        "predLen": 24,
        "temperature": 1.0,
        "topP": 0.95,
        "topK": 0,
        "futureTimestamps": [
            "2026-08-%02dT13:30:00.000Z" % (index + 1)
            for index in range(24)
        ],
    }


class FakeAdapter:
    def __init__(self, failures=None, invalid_seed=None):
        self.failures = dict(failures or {})
        self.invalid_seed = invalid_seed
        self.current_seed = None
        self.seed_calls = []
        self.generation_calls = []

    def set_seed(self, seed):
        self.current_seed = seed
        self.seed_calls.append(seed)

    def generate_path(self, prepared, payload):
        seed = self.current_seed
        self.generation_calls.append(seed)
        remaining = self.failures.get(seed, 0)
        if remaining:
            self.failures[seed] = remaining - 1
            raise KronosAdapterError(
                "PATH_GENERATION_FAILED",
                "mock generation failure",
            )
        rows = []
        for index in range(payload["predLen"]):
            close = 100 + (seed % 1000) / 1000 + index / 10
            rows.append(
                [
                    close - 0.05,
                    close + 0.2,
                    close - 0.2,
                    close,
                    1000 + index,
                    (1000 + index) * close,
                ]
            )
        if seed == self.invalid_seed:
            rows[0][0] = float("nan")
        return rows


class PathRunnerTests(unittest.TestCase):
    def test_fixed_seed_reproduces_exactly_thirty_unique_paths(self):
        first = run_forecast_paths(
            valid_payload(),
            FakeAdapter(),
            object(),
            threading.Event(),
            base_seed=1200,
        )
        second = run_forecast_paths(
            valid_payload(),
            FakeAdapter(),
            object(),
            threading.Event(),
            base_seed=1200,
        )
        self.assertEqual(first, second)
        self.assertEqual(first["pathCount"], 30)
        self.assertEqual(len(first["paths"]), 30)
        self.assertEqual(len(first["closePaths"]), 30)
        self.assertEqual(len(first["pathSeeds"]), 30)
        self.assertEqual(len(set(first["pathSeeds"])), 30)
        self.assertEqual(first["pathSeeds"][0], 1200)
        self.assertEqual(first["pathSeeds"][-1], 1229)

    def test_progress_emits_once_per_completed_path_and_ends_at_95(self):
        progress = []
        run_forecast_paths(
            valid_payload(),
            FakeAdapter(),
            object(),
            threading.Event(),
            on_progress=progress.append,
            base_seed=500,
        )
        self.assertEqual(len(progress), 30)
        self.assertEqual(
            [event["completedPaths"] for event in progress],
            list(range(1, 31)),
        )
        self.assertEqual(progress[0]["percent"], 8)
        self.assertEqual(progress[-1]["percent"], 95)
        self.assertEqual(forecast_percent(30), 95)

    def test_requires_exactly_thirty_paths(self):
        with self.assertRaises(PathRunnerError) as caught:
            run_forecast_paths(
                valid_payload(paths=29),
                FakeAdapter(),
                object(),
                threading.Event(),
                base_seed=1,
            )
        self.assertEqual(caught.exception.code, "INVALID_FORECAST_REQUEST")

    def test_failed_path_retries_once_with_same_seed(self):
        adapter = FakeAdapter(failures={704: 1})
        result = run_forecast_paths(
            valid_payload(),
            adapter,
            object(),
            threading.Event(),
            base_seed=700,
        )
        self.assertEqual(result["pathCount"], 30)
        self.assertEqual(adapter.generation_calls.count(704), 2)
        self.assertEqual(adapter.seed_calls.count(704), 2)

    def test_second_failure_fails_full_job(self):
        adapter = FakeAdapter(failures={900: 2})
        progress = []
        with self.assertRaises(PathRunnerError) as caught:
            run_forecast_paths(
                valid_payload(),
                adapter,
                object(),
                threading.Event(),
                on_progress=progress.append,
                base_seed=900,
            )
        self.assertEqual(caught.exception.code, "PATH_GENERATION_FAILED")
        self.assertIn("failed twice", caught.exception.public_message)
        self.assertEqual(adapter.generation_calls, [900, 900])
        self.assertEqual(progress, [])

    def test_unexpected_predictor_failure_still_retries_once(self):
        class BrokenAdapter(FakeAdapter):
            def generate_path(self, prepared, payload):
                self.generation_calls.append(self.current_seed)
                raise RuntimeError("unexpected device failure")

        adapter = BrokenAdapter()
        with self.assertRaises(PathRunnerError) as caught:
            run_forecast_paths(
                valid_payload(),
                adapter,
                object(),
                threading.Event(),
                base_seed=950,
            )
        self.assertEqual(caught.exception.code, "PATH_GENERATION_FAILED")
        self.assertEqual(adapter.generation_calls, [950, 950])

    def test_cancellation_prevents_retry_attempt(self):
        cancel_event = threading.Event()

        class CancellingAdapter(FakeAdapter):
            def generate_path(self, prepared, payload):
                self.generation_calls.append(self.current_seed)
                cancel_event.set()
                raise RuntimeError("first attempt failed")

        adapter = CancellingAdapter()
        with self.assertRaises(PathRunnerError) as caught:
            run_forecast_paths(
                valid_payload(),
                adapter,
                object(),
                cancel_event,
                base_seed=975,
            )
        self.assertEqual(caught.exception.code, "JOB_CANCELLED")
        self.assertEqual(adapter.generation_calls, [975])

    def test_invalid_output_retries_then_fails_validation(self):
        adapter = FakeAdapter(invalid_seed=1000)
        with self.assertRaises(PathRunnerError) as caught:
            run_forecast_paths(
                valid_payload(),
                adapter,
                object(),
                threading.Event(),
                base_seed=1000,
            )
        self.assertEqual(caught.exception.code, "OUTPUT_VALIDATION_FAILED")
        self.assertEqual(adapter.generation_calls, [1000, 1000])

    def test_cancellation_is_observed_between_paths(self):
        cancel_event = threading.Event()
        progress = []

        def report(event):
            progress.append(event)
            cancel_event.set()

        with self.assertRaises(PathRunnerError) as caught:
            run_forecast_paths(
                valid_payload(),
                FakeAdapter(),
                object(),
                cancel_event,
                on_progress=report,
                base_seed=2000,
            )
        self.assertEqual(caught.exception.code, "JOB_CANCELLED")
        self.assertEqual(len(progress), 1)

    def test_repairs_candle_shape_and_negative_activity(self):
        payload = valid_payload()
        rows = [
            [100, 99, 102, 101, -1, -2],
            *[
                [100, 102, 99, 101, 10, 1000]
                for _ in range(23)
            ],
        ]
        candles, repair_count = validate_and_repair_path(
            rows,
            payload["futureTimestamps"],
        )
        self.assertEqual(repair_count, 4)
        self.assertEqual(candles[0]["high"], 101)
        self.assertEqual(candles[0]["low"], 100)
        self.assertEqual(candles[0]["volume"], 0)
        self.assertEqual(candles[0]["amount"], 0)

    def test_excessive_repairs_fail_closed(self):
        payload = valid_payload()
        bad = [100, 99, 102, 101, -1, -2]
        rows = [list(bad) for _ in range(24)]
        with self.assertRaises(PathRunnerError) as caught:
            validate_and_repair_path(rows, payload["futureTimestamps"])
        self.assertEqual(caught.exception.code, "OUTPUT_VALIDATION_FAILED")
        self.assertIn("too many", caught.exception.public_message)
        self.assertEqual(MAX_REPAIRED_VALUES_PER_PATH, 24)

    def test_accepts_one_envelope_repair_per_prediction_bar(self):
        payload = valid_payload()
        rows = [
            [100, 100, 99, 101, 10, 1000]
            for _ in range(24)
        ]
        candles, repair_count = validate_and_repair_path(
            rows,
            payload["futureTimestamps"],
        )
        self.assertEqual(repair_count, 24)
        self.assertTrue(all(candle["high"] == 101 for candle in candles))

    def test_rejects_more_than_one_repair_per_prediction_bar(self):
        payload = valid_payload()
        rows = [
            [100, 100, 99, 101, 10, 1000]
            for _ in range(24)
        ]
        rows[0][2] = 102
        with self.assertRaises(PathRunnerError) as caught:
            validate_and_repair_path(rows, payload["futureTimestamps"])
        self.assertIn("required 25 repaired values", caught.exception.detail)
        self.assertIn("high=24", caught.exception.detail)
        self.assertIn("low=1", caught.exception.detail)


if __name__ == "__main__":
    unittest.main()
