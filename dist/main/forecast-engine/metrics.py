import math
import re
from datetime import datetime


PATH_COUNT = 30
PREDICTION_BARS = 24
ISO_TIMESTAMP_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$"
)


class MetricsError(RuntimeError):
    def __init__(self, message, detail=None):
        super().__init__(message)
        self.code = "OUTPUT_VALIDATION_FAILED"
        self.public_message = message
        self.detail = detail


class ValidatedForecastData:
    def __init__(
        self,
        historical_closes,
        close_paths,
        future_timestamps,
    ):
        self.historical_closes = historical_closes
        self.last_historical_close = historical_closes[-1]
        self.close_paths = close_paths
        self.future_timestamps = future_timestamps


def validate_forecast_data(history_candles, close_paths, future_timestamps):
    if not isinstance(history_candles, list) or len(history_candles) < 24:
        raise MetricsError(
            "Forecast metrics require at least 24 historical candles.",
        )
    historical_closes = [
        _positive_finite(candle.get("close") if isinstance(candle, dict) else None)
        for candle in history_candles[-24:]
    ]
    if not isinstance(close_paths, list) or len(close_paths) != PATH_COUNT:
        raise MetricsError(
            "Forecast metrics require exactly 30 close paths.",
        )
    validated_paths = []
    for path_index, close_path in enumerate(close_paths):
        if not isinstance(close_path, list) or len(close_path) != PREDICTION_BARS:
            raise MetricsError(
                "Each forecast close path must contain exactly 24 values.",
                "Invalid close path %d" % (path_index + 1),
            )
        validated_paths.append(
            [
                _positive_finite(value)
                for value in close_path
            ]
        )
    if (
        not isinstance(future_timestamps, list)
        or len(future_timestamps) != PREDICTION_BARS
        or not _strictly_increasing_timestamps(future_timestamps)
    ):
        raise MetricsError(
            "Forecast aggregation requires exactly 24 timestamps.",
        )
    return ValidatedForecastData(
        historical_closes,
        validated_paths,
        list(future_timestamps),
    )


def calculate_metrics(data):
    last_close = data.last_historical_close
    final_returns = [
        _finite(path[-1] / last_close - 1.0)
        for path in data.close_paths
    ]
    upside_count = sum(value > 0 for value in final_returns)
    downside_count = sum(value < 0 for value in final_returns)
    historical_volatility = log_return_volatility(data.historical_closes)
    path_volatilities = [
        log_return_volatility([last_close] + path)
        for path in data.close_paths
    ]
    metrics = {
        "sampledUpsideFrequency": upside_count / PATH_COUNT,
        "sampledDownsideFrequency": downside_count / PATH_COUNT,
        "volatilityAmplificationFrequency": (
            sum(
                value > historical_volatility
                for value in path_volatilities
            )
            / PATH_COUNT
        ),
        "medianPredictedReturn": percentile(final_returns, 0.5),
        "meanPredictedReturn": mean(final_returns),
        "historicalVolatility": historical_volatility,
        "medianForecastVolatility": percentile(path_volatilities, 0.5),
    }
    _validate_finite_tree(metrics)
    return metrics


def build_aggregate(data):
    aggregate = []
    for bar_index, timestamp in enumerate(data.future_timestamps):
        values = [
            path[bar_index]
            for path in data.close_paths
        ]
        sorted_values = sorted(values)
        point = {
            "timestamp": timestamp,
            "mean": mean(values),
            "p10": percentile(sorted_values, 0.10),
            "p25": percentile(sorted_values, 0.25),
            "p50": percentile(sorted_values, 0.50),
            "p75": percentile(sorted_values, 0.75),
            "p90": percentile(sorted_values, 0.90),
            "min": sorted_values[0],
            "max": sorted_values[-1],
        }
        _validate_finite_tree(point)
        aggregate.append(point)
    return aggregate


def mean(values):
    if not values:
        raise MetricsError("Cannot calculate the mean of an empty sequence.")
    try:
        result = math.fsum(values) / len(values)
    except (OverflowError, ValueError) as error:
        raise MetricsError(
            "Forecast calculation exceeded numeric limits.",
        ) from error
    return _finite(result)


def percentile(values, quantile):
    if not values:
        raise MetricsError("Cannot calculate a percentile of an empty sequence.")
    if not isinstance(quantile, (int, float)) or not 0 <= quantile <= 1:
        raise MetricsError("Forecast percentile is invalid.")
    sorted_values = sorted(_finite(value) for value in values)
    position = (len(sorted_values) - 1) * quantile
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return sorted_values[lower]
    weight = position - lower
    return _finite(
        sorted_values[lower] * (1 - weight)
        + sorted_values[upper] * weight
    )


def log_return_volatility(closes):
    if len(closes) < 2:
        return 0.0
    validated = [_positive_finite(value) for value in closes]
    returns = [
        _finite(math.log(validated[index]) - math.log(validated[index - 1]))
        for index in range(1, len(validated))
    ]
    center = mean(returns)
    variance = mean([(value - center) ** 2 for value in returns])
    return _finite(math.sqrt(max(variance, 0.0)))


def _positive_finite(value):
    number = _finite(value)
    if number <= 0:
        raise MetricsError(
            "Forecast metrics require positive close values.",
        )
    return number


def _strictly_increasing_timestamps(values):
    for timestamp in values:
        if (
            not isinstance(timestamp, str)
            or not ISO_TIMESTAMP_RE.fullmatch(timestamp)
        ):
            return False
        try:
            datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
        except ValueError:
            return False
    return all(
        values[index] < values[index + 1]
        for index in range(len(values) - 1)
    )


def _finite(value):
    if (
        not isinstance(value, (int, float))
        or isinstance(value, bool)
        or not math.isfinite(value)
    ):
        raise MetricsError(
            "Forecast calculation contains a non-finite value.",
        )
    return float(value)


def _validate_finite_tree(value):
    if isinstance(value, dict):
        for child in value.values():
            _validate_finite_tree(child)
    elif isinstance(value, list):
        for child in value:
            _validate_finite_tree(child)
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        _finite(value)
