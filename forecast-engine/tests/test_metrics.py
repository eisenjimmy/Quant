import math
import os
import sys
import unittest


sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from metrics import (
    MetricsError,
    build_aggregate,
    calculate_metrics,
    log_return_volatility,
    percentile,
    validate_forecast_data,
)


def timestamps():
    return [
        "2026-09-%02dT13:30:00.000Z" % (index + 1)
        for index in range(24)
    ]


def history(close=100.0):
    return [{"close": close} for _ in range(24)]


def constant_paths(close=100.0):
    return [[close for _ in range(24)] for _ in range(30)]


def path_to(final_close):
    return [
        100 + (final_close - 100) * (index + 1) / 24
        for index in range(24)
    ]


class MetricsTests(unittest.TestCase):
    def test_known_direction_return_and_volatility_fixture(self):
        close_paths = (
            [path_to(110) for _ in range(15)]
            + [path_to(90) for _ in range(10)]
            + [path_to(100) for _ in range(5)]
        )
        data = validate_forecast_data(history(), close_paths, timestamps())
        metrics = calculate_metrics(data)
        self.assertAlmostEqual(metrics["sampledUpsideFrequency"], 0.5)
        self.assertAlmostEqual(metrics["sampledDownsideFrequency"], 1 / 3)
        self.assertAlmostEqual(metrics["medianPredictedReturn"], 0.05)
        self.assertAlmostEqual(metrics["meanPredictedReturn"], 1 / 60)
        self.assertAlmostEqual(
            metrics["volatilityAmplificationFrequency"],
            25 / 30,
        )
        self.assertEqual(metrics["historicalVolatility"], 0)
        self.assertGreater(metrics["medianForecastVolatility"], 0)
        self.assertNotIn("confidence", " ".join(metrics).lower())

    def test_ties_and_flat_history_remain_zero(self):
        data = validate_forecast_data(
            history(),
            constant_paths(),
            timestamps(),
        )
        metrics = calculate_metrics(data)
        self.assertEqual(metrics["sampledUpsideFrequency"], 0)
        self.assertEqual(metrics["sampledDownsideFrequency"], 0)
        self.assertEqual(metrics["medianPredictedReturn"], 0)
        self.assertEqual(metrics["meanPredictedReturn"], 0)
        self.assertEqual(metrics["volatilityAmplificationFrequency"], 0)
        self.assertEqual(metrics["historicalVolatility"], 0)
        self.assertEqual(metrics["medianForecastVolatility"], 0)

    def test_percentiles_use_linear_interpolation(self):
        values = list(range(1, 31))
        self.assertAlmostEqual(percentile(values, 0.10), 3.9)
        self.assertAlmostEqual(percentile(values, 0.25), 8.25)
        self.assertAlmostEqual(percentile(values, 0.50), 15.5)
        self.assertAlmostEqual(percentile(values, 0.75), 22.75)
        self.assertAlmostEqual(percentile(values, 0.90), 27.1)

    def test_aggregate_has_ordered_bands_and_known_values(self):
        close_paths = [
            [float(path_index + 1) for _ in range(24)]
            for path_index in range(30)
        ]
        data = validate_forecast_data(history(), close_paths, timestamps())
        aggregate = build_aggregate(data)
        self.assertEqual(len(aggregate), 24)
        point = aggregate[0]
        self.assertEqual(point["timestamp"], timestamps()[0])
        self.assertEqual(point["min"], 1)
        self.assertAlmostEqual(point["p10"], 3.9)
        self.assertAlmostEqual(point["p25"], 8.25)
        self.assertAlmostEqual(point["p50"], 15.5)
        self.assertAlmostEqual(point["mean"], 15.5)
        self.assertAlmostEqual(point["p75"], 22.75)
        self.assertAlmostEqual(point["p90"], 27.1)
        self.assertEqual(point["max"], 30)
        self.assertLessEqual(point["min"], point["p10"])
        self.assertLessEqual(point["p10"], point["p25"])
        self.assertLessEqual(point["p25"], point["p50"])
        self.assertLessEqual(point["p50"], point["p75"])
        self.assertLessEqual(point["p75"], point["p90"])
        self.assertLessEqual(point["p90"], point["max"])

    def test_population_log_return_volatility(self):
        self.assertAlmostEqual(
            log_return_volatility([1.0, 1.0, math.exp(2)]),
            1.0,
        )

    def test_non_finite_and_invalid_shapes_fail_closed(self):
        bad_paths = constant_paths()
        bad_paths[0][4] = float("nan")
        with self.assertRaises(MetricsError):
            validate_forecast_data(history(), bad_paths, timestamps())
        with self.assertRaises(MetricsError):
            validate_forecast_data(
                history(),
                constant_paths()[:29],
                timestamps(),
            )
        with self.assertRaises(MetricsError):
            validate_forecast_data(
                history(),
                constant_paths(),
                timestamps()[:23],
            )
        duplicate_timestamps = timestamps()
        duplicate_timestamps[1] = duplicate_timestamps[0]
        with self.assertRaises(MetricsError):
            validate_forecast_data(
                history(),
                constant_paths(),
                duplicate_timestamps,
            )
        malformed_timestamps = timestamps()
        malformed_timestamps[0] = "not-a-date"
        with self.assertRaises(MetricsError):
            validate_forecast_data(
                history(),
                constant_paths(),
                malformed_timestamps,
            )

    def test_large_finite_prices_remain_finite(self):
        base = 1e300
        close_paths = (
            [[base * 1.01 for _ in range(24)] for _ in range(15)]
            + [[base * 0.99 for _ in range(24)] for _ in range(15)]
        )
        data = validate_forecast_data(
            history(base),
            close_paths,
            timestamps(),
        )
        metrics = calculate_metrics(data)
        aggregate = build_aggregate(data)
        for value in metrics.values():
            self.assertTrue(math.isfinite(value))
        for point in aggregate:
            for key, value in point.items():
                if key != "timestamp":
                    self.assertTrue(math.isfinite(value))


if __name__ == "__main__":
    unittest.main()
