import json
import math
import re
from datetime import datetime


PROTOCOL_VERSION = 1
JOB_ID_RE = re.compile(r"^fc_[A-Za-z0-9_-]{1,160}$")
ISO_TIMESTAMP_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$"
)


class ProtocolError(ValueError):
    pass


def _non_empty_string(value):
    return isinstance(value, str) and bool(value.strip())


def _finite_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def _iso_timestamp(value):
    if not isinstance(value, str) or not ISO_TIMESTAMP_RE.fullmatch(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        return False
    return True


def _valid_candle(value):
    if not isinstance(value, dict) or not _iso_timestamp(value.get("timestamp")):
        return False
    return all(
        _finite_number(value.get(key))
        for key in ("open", "high", "low", "close", "volume", "amount")
    )


def _strictly_increasing_timestamps(values):
    return all(_iso_timestamp(value) for value in values) and all(
        values[index] < values[index + 1]
        for index in range(len(values) - 1)
    )


def _valid_run_payload(payload):
    return (
        isinstance(payload, dict)
        and _non_empty_string(payload.get("symbol"))
        and payload.get("paths") == 30
        and payload.get("predLen") == 24
        and payload.get("interval") == "1h"
        and payload.get("temperature") == 1.0
        and payload.get("topP") == 0.95
        and payload.get("topK") == 0
        and isinstance(payload.get("futureTimestamps"), list)
        and len(payload["futureTimestamps"]) == 24
        and _strictly_increasing_timestamps(payload["futureTimestamps"])
        and isinstance(payload.get("candles"), list)
        and len(payload["candles"]) >= 300
        and all(_valid_candle(value) for value in payload["candles"])
        and _strictly_increasing_timestamps(
            [value["timestamp"] for value in payload["candles"]]
        )
    )


def parse_request_line(line):
    try:
        value = json.loads(line)
    except json.JSONDecodeError as error:
        raise ProtocolError("Worker request is not valid JSON.") from error
    if not isinstance(value, dict):
        raise ProtocolError("Worker request must be a JSON object.")

    request_type = value.get("type")
    if request_type in ("health", "shutdown"):
        if not _non_empty_string(value.get("requestId")):
            raise ProtocolError("%s request requires requestId." % request_type)
        return value
    if request_type == "cancel":
        if not JOB_ID_RE.fullmatch(str(value.get("jobId", ""))):
            raise ProtocolError("Cancel request requires a valid jobId.")
        return value
    if request_type == "run":
        if not JOB_ID_RE.fullmatch(str(value.get("jobId", ""))):
            raise ProtocolError("Run request requires a valid jobId.")
        if not _valid_run_payload(value.get("payload")):
            raise ProtocolError("Run request payload is invalid.")
        return value
    raise ProtocolError("Unknown worker request type.")
