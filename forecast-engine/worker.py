#!/usr/bin/env python3
import json
import multiprocessing
import os
import sys
import threading
import time

from kronos_adapter import KronosAdapter, KronosAdapterError
from engine import PathRunnerError, run_forecast_paths
from metrics import (
    MetricsError,
    build_aggregate,
    calculate_metrics,
    validate_forecast_data,
)
from protocol import PROTOCOL_VERSION, ProtocolError, parse_request_line


OUTPUT_LOCK = threading.Lock()
ACTIVE_LOCK = threading.Lock()
ACTIVE_JOB_ID = None
ACTIVE_CANCEL = None
KRONOS_ADAPTER = None
TEST_MODE = os.environ.get("QUANT_FORECAST_WORKER_TEST_MODE") == "1"


class ProtocolTestAdapter:
    def __init__(self, delay_ms):
        self.delay_seconds = delay_ms / 1000.0
        self.seed = 0

    def set_seed(self, seed):
        self.seed = seed

    def generate_path(self, prepared, payload):
        time.sleep(self.delay_seconds)
        rows = []
        for index in range(payload["predLen"]):
            close = 100 + (self.seed % 1000) / 1000 + index / 10
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
        return rows


def log(message):
    print("[forecast-worker] %s" % message, file=sys.stderr, flush=True)


def emit(event):
    with OUTPUT_LOCK:
        sys.stdout.write(json.dumps(event, separators=(",", ":")) + "\n")
        sys.stdout.flush()


def python_version():
    return "%d.%d.%d" % (
        sys.version_info.major,
        sys.version_info.minor,
        sys.version_info.micro,
    )


def finish_job(job_id):
    global ACTIVE_JOB_ID, ACTIVE_CANCEL
    with ACTIVE_LOCK:
        if ACTIVE_JOB_ID == job_id:
            ACTIVE_JOB_ID = None
            ACTIVE_CANCEL = None


def emit_terminal(job_id, event):
    global ACTIVE_JOB_ID, ACTIVE_CANCEL
    with ACTIVE_LOCK:
        if ACTIVE_JOB_ID == job_id:
            ACTIVE_JOB_ID = None
            ACTIVE_CANCEL = None
        emit(event)


def get_kronos_adapter():
    global KRONOS_ADAPTER
    if KRONOS_ADAPTER is None:
        is_frozen = bool(getattr(sys, "frozen", False))
        KRONOS_ADAPTER = KronosAdapter(
            kronos_root=(
                None if is_frozen else os.environ.get("QUANT_KRONOS_ROOT")
            ),
            commit_path=(
                None
                if is_frozen
                else os.environ.get("QUANT_KRONOS_COMMIT_PATH")
            ),
        )
    return KRONOS_ADAPTER


def emit_preparation_progress(job_id, percent, message, phase):
    emit(
        {
            "type": "progress",
            "jobId": job_id,
            "stage": "preparing-engine",
            "completedPaths": 0,
            "totalPaths": 30,
            "percent": percent,
            "message": message,
            "preparationPhase": phase,
        }
    )


def emit_post_processing_progress(job_id, percent, message):
    emit(
        {
            "type": "progress",
            "jobId": job_id,
            "stage": "post-processing",
            "completedPaths": 30,
            "totalPaths": 30,
            "percent": percent,
            "message": message,
        }
    )


def run_job(job_id, payload, cancel_event):
    try:
        if os.environ.get("QUANT_FORECAST_WORKER_CRASH_ON_RUN") == "1":
            log("test crash requested")
            os._exit(17)

        if not TEST_MODE and not ((3, 10) <= sys.version_info[:2] <= (3, 12)):
            emit_terminal(
                job_id,
                {
                    "type": "failed",
                    "jobId": job_id,
                    "code": "ENGINE_SETUP_FAILED",
                    "message": (
                        "Forecast engine requires Python 3.10 through 3.12. "
                        "Run `npm run setup:forecast`."
                    ),
                },
            )
            return

        base_seed = None
        if TEST_MODE:
            emit_preparation_progress(
                job_id,
                3,
                "Checking deterministic test engine",
                "preparing",
            )
            emit_preparation_progress(
                job_id,
                4,
                "Loading deterministic test engine",
                "loading",
            )
            emit_preparation_progress(
                job_id,
                4,
                "Deterministic test engine ready",
                "loading",
            )
            delay_ms = min(
                max(
                    int(
                        os.environ.get(
                            "QUANT_FORECAST_WORKER_TEST_DELAY_MS",
                            "5",
                        )
                    ),
                    0,
                ),
                1000,
            )
            adapter = ProtocolTestAdapter(delay_ms)
            prepared = None
            metadata = {
                "modelId": "protocol-test",
                "tokenizerId": "protocol-test",
                "device": "cpu",
                "kronosCommit": "protocol-test",
            }
            base_seed = int(
                os.environ.get(
                    "QUANT_FORECAST_WORKER_TEST_BASE_SEED",
                    "7000",
                )
            )
        else:
            emit_preparation_progress(
                job_id,
                3,
                "Checking forecast engine and local model cache",
                "preparing",
            )
            progress_percent = [3]

            def report_status(phase, message):
                progress_percent[0] = min(progress_percent[0] + 1, 5)
                emit_preparation_progress(
                    job_id,
                    progress_percent[0],
                    message,
                    phase,
                )

            try:
                adapter = get_kronos_adapter()
                metadata = adapter.prepare(
                    on_status=report_status,
                    is_cancelled=cancel_event.is_set,
                )
                if cancel_event.is_set():
                    raise KronosAdapterError(
                        "JOB_CANCELLED",
                        "Forecast cancelled during model preparation.",
                    )
                prepared = adapter.prepare_input(payload)
            except KronosAdapterError as error:
                if error.detail:
                    log("%s: %s" % (error.code, error.detail))
                event_type = (
                    "cancelled" if error.code == "JOB_CANCELLED" else "failed"
                )
                event = {
                    "type": event_type,
                    "jobId": job_id,
                    "message": error.public_message,
                }
                if event_type == "failed":
                    event["code"] = error.code
                emit_terminal(job_id, event)
                return
        emit(
            {
                "type": "progress",
                "jobId": job_id,
                "stage": "running-paths",
                "completedPaths": 0,
                "totalPaths": 30,
                "percent": 5,
                "message": "Starting forecast path 1 of 30",
            }
        )

        def report_path_progress(progress):
            progress_event = {
                "type": "progress",
                "jobId": job_id,
                "stage": "running-paths",
                "completedPaths": progress["completedPaths"],
                "totalPaths": progress["totalPaths"],
                "percent": progress["percent"],
                "message": "Completed forecast path %d of %d"
                % (
                    progress["completedPaths"],
                    progress["totalPaths"],
                ),
            }
            emit(progress_event)
            if (
                TEST_MODE
                and progress["completedPaths"] == 1
                and os.environ.get(
                    "QUANT_FORECAST_WORKER_TEST_STALL_AFTER_PATH"
                )
                == "1"
            ):
                while not cancel_event.wait(max(adapter.delay_seconds, 0.001)):
                    emit(progress_event)

        try:
            path_result = run_forecast_paths(
                payload,
                adapter,
                prepared,
                cancel_event,
                on_progress=report_path_progress,
                base_seed=base_seed,
            )
        except PathRunnerError as error:
            if error.detail:
                log("%s: %s" % (error.code, error.detail))
            event_type = (
                "cancelled" if error.code == "JOB_CANCELLED" else "failed"
            )
            event = {
                "type": event_type,
                "jobId": job_id,
                "message": error.public_message,
            }
            if event_type == "failed":
                event["code"] = error.code
            emit_terminal(job_id, event)
            return
        if cancel_event.is_set():
            emit_terminal(
                job_id,
                {
                    "type": "cancelled",
                    "jobId": job_id,
                    "message": "Forecast cancelled after path generation.",
                },
            )
            return
        try:
            emit_post_processing_progress(
                job_id,
                96,
                "Validating completed forecast paths",
            )
            validated = validate_forecast_data(
                payload["candles"],
                path_result["closePaths"],
                payload["futureTimestamps"],
            )
            if cancel_event.is_set():
                raise MetricsError("Forecast cancelled during post-processing.")
            emit_post_processing_progress(
                job_id,
                97,
                "Calculating sampled forecast metrics",
            )
            metrics = calculate_metrics(validated)
            if cancel_event.is_set():
                raise MetricsError("Forecast cancelled during post-processing.")
            emit_post_processing_progress(
                job_id,
                98,
                "Building percentile forecast bands",
            )
            aggregate = build_aggregate(validated)
            if cancel_event.is_set():
                raise MetricsError("Forecast cancelled during post-processing.")
        except MetricsError as error:
            if cancel_event.is_set():
                emit_terminal(
                    job_id,
                    {
                        "type": "cancelled",
                        "jobId": job_id,
                        "message": "Forecast cancelled during post-processing.",
                    },
                )
            else:
                if error.detail:
                    log("%s: %s" % (error.code, error.detail))
                emit_terminal(
                    job_id,
                    {
                        "type": "failed",
                        "jobId": job_id,
                        "code": error.code,
                        "message": error.public_message,
                    },
                )
            return
        log(
            "Kronos adapter ready: %s"
            % json.dumps(metadata, separators=(",", ":"), sort_keys=True)
        )
        emit_terminal(
            job_id,
            {
                "type": "completed",
                "jobId": job_id,
                "result": {
                    "protocolVersion": PROTOCOL_VERSION,
                    "testMode": TEST_MODE,
                    **path_result,
                    "lastHistoricalClose": validated.last_historical_close,
                    "metrics": metrics,
                    "aggregate": aggregate,
                    "provenance": {
                        **metadata,
                        "temperature": payload["temperature"],
                        "topP": payload["topP"],
                        "topK": payload["topK"],
                        "pathCount": payload["paths"],
                        "baseSeed": path_result["baseSeed"],
                        "pathSeeds": path_result["pathSeeds"],
                    },
                },
            },
        )
    except Exception as error:
        log("run failed: %s" % error)
        emit_terminal(
            job_id,
            {
                "type": "failed",
                "jobId": job_id,
                "code": "WORKER_CRASHED",
                "message": "Forecast worker run failed.",
            },
        )
    finally:
        finish_job(job_id)


def start_run(request):
    global ACTIVE_JOB_ID, ACTIVE_CANCEL
    job_id = request["jobId"]
    with ACTIVE_LOCK:
        if ACTIVE_JOB_ID is not None:
            emit(
                {
                    "type": "failed",
                    "jobId": job_id,
                    "code": "FORECAST_ALREADY_RUNNING",
                    "message": "Forecast worker is already running %s."
                    % ACTIVE_JOB_ID,
                }
            )
            return
        ACTIVE_JOB_ID = job_id
        ACTIVE_CANCEL = threading.Event()
        cancel_event = ACTIVE_CANCEL
    thread = threading.Thread(
        target=run_job,
        args=(job_id, request["payload"], cancel_event),
        daemon=True,
    )
    thread.start()


def cancel_job(job_id):
    with ACTIVE_LOCK:
        if ACTIVE_JOB_ID == job_id and ACTIVE_CANCEL is not None:
            ACTIVE_CANCEL.set()


def handle_request(request):
    request_type = request["type"]
    if request_type == "health":
        if os.environ.get("QUANT_FORECAST_WORKER_MALFORMED_ON_HEALTH") == "1":
            with OUTPUT_LOCK:
                sys.stdout.write("not-json\n")
                sys.stdout.flush()
            return True
        emit(
            {
                "type": "health",
                "requestId": request["requestId"],
                "ok": (3, 10) <= sys.version_info[:2] <= (3, 12),
                "protocolVersion": PROTOCOL_VERSION,
                "pythonVersion": python_version(),
            }
        )
        return True
    if request_type == "run":
        start_run(request)
        return True
    if request_type == "cancel":
        cancel_job(request["jobId"])
        return True
    if request_type == "shutdown":
        with ACTIVE_LOCK:
            if ACTIVE_CANCEL is not None:
                ACTIVE_CANCEL.set()
        emit({"type": "shutdown", "requestId": request["requestId"]})
        return False
    return True


def main():
    log("worker shell starting")
    emit(
        {
            "type": "ready",
            "protocolVersion": PROTOCOL_VERSION,
            "pythonVersion": python_version(),
        }
    )
    keep_running = True
    while keep_running:
        line = sys.stdin.readline()
        if line == "":
            break
        if not line.strip():
            continue
        try:
            request = parse_request_line(line)
            keep_running = handle_request(request)
        except ProtocolError as error:
            log(str(error))
            emit(
                {
                    "type": "protocol-error",
                    "code": "OUTPUT_VALIDATION_FAILED",
                    "message": str(error),
                }
            )
    cancel_job(ACTIVE_JOB_ID)
    log("worker shell stopped")


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
