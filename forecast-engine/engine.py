import math
import secrets


PATH_COUNT = 30
PREDICTION_BARS = 24
MAX_REPAIRED_VALUES_PER_PATH = PREDICTION_BARS
MAX_BASE_SEED = (2**31 - 1) - PATH_COUNT
CANDLE_COLUMNS = ("open", "high", "low", "close", "volume", "amount")


class PathRunnerError(RuntimeError):
    def __init__(self, code, message, detail=None):
        super().__init__(message)
        self.code = code
        self.public_message = message
        self.detail = detail


def forecast_percent(completed_paths):
    if (
        not isinstance(completed_paths, int)
        or isinstance(completed_paths, bool)
        or completed_paths < 0
        or completed_paths > PATH_COUNT
    ):
        raise ValueError("Completed path count must be between 0 and 30.")
    return 5 + completed_paths * 3


def run_forecast_paths(
    payload,
    adapter,
    prepared,
    cancel_event,
    on_progress=None,
    base_seed=None,
):
    if payload.get("paths") != PATH_COUNT:
        raise PathRunnerError(
            "INVALID_FORECAST_REQUEST",
            "Forecast path count must be exactly 30.",
        )
    if payload.get("predLen") != PREDICTION_BARS:
        raise PathRunnerError(
            "INVALID_FORECAST_REQUEST",
            "Forecast horizon must be exactly 24 trading bars.",
        )
    if base_seed is None:
        base_seed = secrets.randbelow(MAX_BASE_SEED + 1)
    if (
        not isinstance(base_seed, int)
        or isinstance(base_seed, bool)
        or base_seed < 0
        or base_seed > MAX_BASE_SEED
    ):
        raise PathRunnerError(
            "INVALID_FORECAST_REQUEST",
            "Forecast base seed is invalid.",
        )

    path_seeds = [base_seed + index for index in range(PATH_COUNT)]
    paths = []
    close_paths = []
    repair_counts = []
    for path_index, path_seed in enumerate(path_seeds):
        if cancel_event.is_set():
            raise PathRunnerError(
                "JOB_CANCELLED",
                "Forecast cancelled between paths.",
        )
        for attempt in (1, 2):
            if cancel_event.is_set():
                raise PathRunnerError(
                    "JOB_CANCELLED",
                    "Forecast cancelled between path attempts.",
                )
            try:
                adapter.set_seed(path_seed)
                raw_path = adapter.generate_path(prepared, payload)
                candles, repair_count = validate_and_repair_path(
                    raw_path,
                    payload["futureTimestamps"],
                )
                break
            except Exception as error:
                if attempt == 2:
                    error_code = getattr(
                        error,
                        "code",
                        "PATH_GENERATION_FAILED",
                    )
                    if error_code not in (
                        "OUTPUT_VALIDATION_FAILED",
                        "PATH_GENERATION_FAILED",
                    ):
                        error_code = "PATH_GENERATION_FAILED"
                    raise PathRunnerError(
                        error_code,
                        "Forecast path %d failed twice." % (path_index + 1),
                        getattr(error, "detail", None) or str(error),
                    ) from error
        if cancel_event.is_set():
            raise PathRunnerError(
                "JOB_CANCELLED",
                "Forecast cancelled between paths.",
            )
        paths.append(candles)
        close_paths.append([candle["close"] for candle in candles])
        repair_counts.append(repair_count)
        if on_progress:
            on_progress(
                {
                    "completedPaths": path_index + 1,
                    "totalPaths": PATH_COUNT,
                    "percent": forecast_percent(path_index + 1),
                    "seed": path_seed,
                    "repairCount": repair_count,
                }
            )
        del candles

    return {
        "pathCount": PATH_COUNT,
        "completedPaths": PATH_COUNT,
        "predictionBars": PREDICTION_BARS,
        "baseSeed": base_seed,
        "pathSeeds": path_seeds,
        "paths": paths,
        "closePaths": close_paths,
        "repairs": {
            "applied": any(repair_counts),
            "valueCount": sum(repair_counts),
            "pathValueCounts": repair_counts,
            "maxValuesPerPath": MAX_REPAIRED_VALUES_PER_PATH,
        },
    }


def validate_and_repair_path(raw_path, future_timestamps):
    try:
        rows = list(raw_path)
    except TypeError as error:
        raise PathRunnerError(
            "OUTPUT_VALIDATION_FAILED",
            "Forecast path is not a sequence.",
        ) from error
    if len(rows) != PREDICTION_BARS or len(future_timestamps) != PREDICTION_BARS:
        raise PathRunnerError(
            "OUTPUT_VALIDATION_FAILED",
            "Forecast path must contain exactly 24 candles.",
        )

    candles = []
    repair_count = 0
    repair_categories = {
        "high": 0,
        "low": 0,
        "volume": 0,
        "amount": 0,
    }
    for index, row in enumerate(rows):
        try:
            values = [float(value) for value in row]
        except (TypeError, ValueError) as error:
            raise PathRunnerError(
                "OUTPUT_VALIDATION_FAILED",
                "Forecast path contains a non-numeric candle.",
                "Invalid candle at index %d" % index,
            ) from error
        if len(values) != len(CANDLE_COLUMNS) or not all(
            math.isfinite(value) for value in values
        ):
            raise PathRunnerError(
                "OUTPUT_VALIDATION_FAILED",
                "Forecast path contains invalid numeric values.",
                "Invalid candle at index %d" % index,
            )
        open_price, high, low, close, volume, amount = values
        repaired_high = max(high, open_price, close)
        repaired_low = min(low, open_price, close)
        repaired_volume = max(volume, 0.0)
        repaired_amount = max(amount, 0.0)
        repairs = {
            "high": int(repaired_high != high),
            "low": int(repaired_low != low),
            "volume": int(repaired_volume != volume),
            "amount": int(repaired_amount != amount),
        }
        for category, count in repairs.items():
            repair_categories[category] += count
            repair_count += count
        if min(open_price, repaired_high, repaired_low, close) <= 0:
            raise PathRunnerError(
                "OUTPUT_VALIDATION_FAILED",
                "Forecast path contains non-positive prices.",
                "Invalid candle at index %d" % index,
            )
        if repaired_high < max(open_price, close) or repaired_low > min(
            open_price,
            close,
        ):
            raise PathRunnerError(
                "OUTPUT_VALIDATION_FAILED",
                "Forecast path contains malformed candles.",
                "Invalid candle at index %d" % index,
            )
        candles.append(
            {
                "timestamp": future_timestamps[index],
                "open": open_price,
                "high": repaired_high,
                "low": repaired_low,
                "close": close,
                "volume": repaired_volume,
                "amount": repaired_amount,
            }
        )
    if repair_count > MAX_REPAIRED_VALUES_PER_PATH:
        raise PathRunnerError(
            "OUTPUT_VALIDATION_FAILED",
            "Forecast path required too many candle repairs.",
            (
                "Path required %d repaired values "
                "(limit=%d, high=%d, low=%d, volume=%d, amount=%d)."
            )
            % (
                repair_count,
                MAX_REPAIRED_VALUES_PER_PATH,
                repair_categories["high"],
                repair_categories["low"],
                repair_categories["volume"],
                repair_categories["amount"],
            ),
        )
    return candles, repair_count
