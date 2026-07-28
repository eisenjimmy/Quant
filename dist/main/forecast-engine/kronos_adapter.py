import contextlib
import hashlib
import importlib
import json
import random
import re
import subprocess
import sys
import threading
from pathlib import Path


MODEL_ID = "NeoQuasar/Kronos-mini"
TOKENIZER_ID = "NeoQuasar/Kronos-Tokenizer-2k"
MAX_CONTEXT = 2048
KRONOS_COMMIT_RE = re.compile(r"^[0-9a-f]{40}$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
MODEL_MANIFEST_PATH = Path(__file__).with_name("model-manifest.json")


class KronosAdapterError(RuntimeError):
    def __init__(self, code, message, detail=None):
        super().__init__(message)
        self.code = code
        self.public_message = message
        self.detail = detail


class PreparedKronosInput:
    def __init__(
        self,
        normalized_values,
        history_time_features,
        future_time_features,
        value_mean,
        value_std,
        future_timestamps,
    ):
        self.normalized_values = normalized_values
        self.history_time_features = history_time_features
        self.future_time_features = future_time_features
        self.value_mean = value_mean
        self.value_std = value_std
        self.future_timestamps = future_timestamps


def _sha256_file(file_path):
    digest = hashlib.sha256()
    with Path(file_path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_model_manifest(manifest_path=None):
    source = Path(manifest_path or MODEL_MANIFEST_PATH).expanduser().resolve()
    try:
        manifest = json.loads(source.read_text(encoding="utf-8"))
    except Exception as error:
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos model metadata is unavailable.",
            "%s: %s" % (type(error).__name__, error),
        ) from error
    if (
        not isinstance(manifest, dict)
        or manifest.get("schemaVersion") != 1
        or not isinstance(manifest.get("artifacts"), dict)
    ):
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos model metadata is invalid.",
        )
    expected_ids = {
        "model": MODEL_ID,
        "tokenizer": TOKENIZER_ID,
    }
    for name, expected_id in expected_ids.items():
        artifact = manifest["artifacts"].get(name)
        if (
            not isinstance(artifact, dict)
            or artifact.get("repoId") != expected_id
            or not KRONOS_COMMIT_RE.fullmatch(
                str(artifact.get("revision", "")).lower()
            )
            or not isinstance(artifact.get("files"), list)
            or not artifact["files"]
        ):
            raise KronosAdapterError(
                "ENGINE_SETUP_FAILED",
                "Pinned Kronos model metadata is invalid.",
                "Invalid %s artifact in %s" % (name, source),
            )
        seen_paths = set()
        for file_entry in artifact["files"]:
            file_path = str(
                file_entry.get("path", "")
                if isinstance(file_entry, dict)
                else ""
            )
            if (
                not file_path
                or Path(file_path).is_absolute()
                or ".." in Path(file_path).parts
                or file_path in seen_paths
                or not isinstance(file_entry.get("size"), int)
                or file_entry["size"] <= 0
                or not SHA256_RE.fullmatch(
                    str(file_entry.get("sha256", "")).lower()
                )
            ):
                raise KronosAdapterError(
                    "ENGINE_SETUP_FAILED",
                    "Pinned Kronos model metadata is invalid.",
                    "Invalid file entry for %s in %s" % (name, source),
                )
            seen_paths.add(file_path)
        if not {"config.json", "model.safetensors"}.issubset(seen_paths):
            raise KronosAdapterError(
                "ENGINE_SETUP_FAILED",
                "Pinned Kronos model metadata is invalid.",
                "Missing required files for %s in %s" % (name, source),
            )
    return manifest


def verify_snapshot_files(snapshot_path, artifact):
    root = Path(snapshot_path).expanduser().resolve()
    for expected in artifact["files"]:
        candidate = root / expected["path"]
        if not candidate.is_file():
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "A pinned Kronos model file is missing. Clear the cached snapshot and retry.",
                "Missing %s from %s" % (expected["path"], root),
            )
        if candidate.stat().st_size != expected["size"]:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "A pinned Kronos model file failed verification. Clear the cached snapshot and retry.",
                "Unexpected size for %s" % candidate,
            )
        actual_hash = _sha256_file(candidate)
        if actual_hash != expected["sha256"]:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "A pinned Kronos model file failed verification. Clear the cached snapshot and retry.",
                "SHA-256 mismatch for %s" % candidate,
            )
    return root


def verify_kronos_source_manifest(kronos_root, expected_commit):
    root = Path(kronos_root).expanduser().resolve()
    manifest_path = root.parent / "KRONOS_SOURCE_MANIFEST.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as error:
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Packaged Kronos source metadata is unavailable.",
            "%s: %s" % (type(error).__name__, error),
        ) from error
    if (
        not isinstance(manifest, dict)
        or manifest.get("schemaVersion") != 1
        or manifest.get("commit") != expected_commit
        or not isinstance(manifest.get("files"), list)
        or not manifest["files"]
    ):
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Packaged Kronos source metadata is invalid.",
        )
    seen_paths = set()
    for expected in manifest["files"]:
        relative = str(
            expected.get("path", "") if isinstance(expected, dict) else ""
        )
        digest = str(
            expected.get("sha256", "") if isinstance(expected, dict) else ""
        )
        if relative in seen_paths:
            raise KronosAdapterError(
                "ENGINE_SETUP_FAILED",
                "Packaged Kronos source metadata is invalid.",
                "Duplicate packaged source file: %s" % relative,
            )
        seen_paths.add(relative)
        candidate = (root / relative).resolve()
        if (
            not relative
            or Path(relative).is_absolute()
            or ".." in Path(relative).parts
            or root not in candidate.parents
            or not candidate.is_file()
            or not SHA256_RE.fullmatch(digest)
            or _sha256_file(candidate) != digest
        ):
            raise KronosAdapterError(
                "ENGINE_SETUP_FAILED",
                "Packaged Kronos source failed verification.",
                "Invalid packaged source file: %s" % relative,
            )
    if seen_paths != {
        "LICENSE",
        "model/__init__.py",
        "model/kronos.py",
        "model/module.py",
    }:
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Packaged Kronos source metadata is invalid.",
            "Packaged source file set is incomplete.",
        )


def resolve_kronos_root(explicit_root=None, source_file=None):
    if explicit_root:
        candidate = Path(explicit_root).expanduser().resolve()
        if (candidate / "model" / "__init__.py").is_file():
            return candidate
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos source is unavailable. Run `git submodule update --init --recursive`.",
            "Kronos root does not contain model/__init__.py: %s" % candidate,
        )

    origin = Path(source_file or __file__).resolve()
    for ancestor in origin.parents:
        candidate = ancestor / "vendor" / "Kronos"
        if (candidate / "model" / "__init__.py").is_file():
            return candidate
    raise KronosAdapterError(
        "ENGINE_SETUP_FAILED",
        "Pinned Kronos source is unavailable. Run `git submodule update --init --recursive`.",
    )


def resolve_kronos_commit(explicit_path=None, source_file=None):
    candidates = []
    if explicit_path:
        candidates.append(Path(explicit_path).expanduser().resolve())
    else:
        origin = Path(source_file or __file__).resolve()
        candidates.extend(
            ancestor / "vendor" / "KRONOS_COMMIT.txt"
            for ancestor in origin.parents
        )
    for candidate in candidates:
        if not candidate.is_file():
            continue
        commit = candidate.read_text(encoding="utf-8").strip().lower()
        if KRONOS_COMMIT_RE.fullmatch(commit):
            return commit
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos commit metadata is invalid. Restore `vendor/KRONOS_COMMIT.txt`.",
            "Invalid commit metadata in %s" % candidate,
        )
    raise KronosAdapterError(
        "ENGINE_SETUP_FAILED",
        "Pinned Kronos commit metadata is missing. Restore `vendor/KRONOS_COMMIT.txt`.",
    )


def verify_kronos_checkout(kronos_root, expected_commit):
    kronos_root = Path(kronos_root).expanduser().resolve()
    if not (kronos_root / ".git").exists():
        verify_kronos_source_manifest(kronos_root, expected_commit)
        return
    try:
        result = subprocess.run(
            ["git", "-C", str(kronos_root), "rev-parse", "HEAD"],
            capture_output=True,
            check=False,
            encoding="utf-8",
            shell=False,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos source could not be verified. Run `npm run setup:forecast`.",
            "%s: %s" % (type(error).__name__, error),
        ) from error
    actual_commit = result.stdout.strip().lower()
    if result.returncode != 0 or actual_commit != expected_commit:
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos source does not match its recorded commit. Run `git submodule update --init --recursive`.",
            "Expected %s, found %s" % (
                expected_commit,
                actual_commit or "unavailable",
            ),
        )


class KronosAdapter:
    def __init__(
        self,
        kronos_root=None,
        commit_path=None,
        importer=None,
        checkout_verifier=None,
        cache_checker=None,
        manifest_path=None,
        snapshot_resolver=None,
    ):
        self._explicit_root = kronos_root
        self._explicit_commit_path = commit_path
        self._importer = importer or importlib.import_module
        self._checkout_verifier = checkout_verifier or verify_kronos_checkout
        self._cache_checker = (
            cache_checker or is_huggingface_artifact_cached
        )
        self._manifest_path = manifest_path
        self._snapshot_resolver = snapshot_resolver
        self._lock = threading.Lock()
        self._predictor = None
        self._metadata = None
        self._numpy = None
        self._pandas = None
        self._torch = None

    @property
    def is_ready(self):
        return self._predictor is not None

    @property
    def predictor(self):
        if self._predictor is None:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "Kronos-mini is not loaded.",
            )
        return self._predictor

    @property
    def metadata(self):
        if self._metadata is None:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "Kronos-mini metadata is unavailable before model loading.",
            )
        return dict(self._metadata)

    def prepare(self, on_status=None, is_cancelled=None):
        if self._predictor is not None:
            return self.metadata
        with self._lock:
            if self._predictor is not None:
                return self.metadata
            self._raise_if_cancelled(is_cancelled)
            root = resolve_kronos_root(self._explicit_root)
            commit = resolve_kronos_commit(self._explicit_commit_path)
            manifest = load_model_manifest(self._manifest_path)
            tokenizer_artifact = manifest["artifacts"]["tokenizer"]
            model_artifact = manifest["artifacts"]["model"]
            self._checkout_verifier(root, commit)
            self._add_kronos_import_path(root)
            try:
                torch = self._importer("torch")
                self._torch = torch
                self._numpy = self._importer("numpy")
                self._pandas = self._importer("pandas")
                hub = self._importer("huggingface_hub")
                model_module = self._importer("model")
                tokenizer_class = model_module.KronosTokenizer
                model_class = model_module.Kronos
                predictor_class = model_module.KronosPredictor
            except Exception as error:
                raise KronosAdapterError(
                    "ENGINE_SETUP_FAILED",
                    "Forecast engine dependencies are missing. Run `npm run setup:forecast`.",
                    "%s: %s" % (type(error).__name__, error),
                ) from error

            self._configure_deterministic_sampling(torch)
            runtime_device, metadata_device = self._select_device(torch)
            self._raise_if_cancelled(is_cancelled)
            tokenizer_cached = self._cache_checker(tokenizer_artifact)
            if on_status:
                on_status(
                    "loading" if tokenizer_cached else "downloading",
                    (
                        "Loading Kronos tokenizer from local cache"
                        if tokenizer_cached
                        else "Downloading Kronos tokenizer for first use"
                    ),
                )
            tokenizer = self._load_pretrained(
                tokenizer_class,
                tokenizer_artifact,
                "tokenizer",
                hub,
            )
            if on_status and not tokenizer_cached:
                on_status("loading", "Loading Kronos tokenizer into memory")
            self._raise_if_cancelled(is_cancelled)
            model_cached = self._cache_checker(model_artifact)
            if on_status:
                on_status(
                    "loading" if model_cached else "downloading",
                    (
                        "Loading Kronos-mini from local cache"
                        if model_cached
                        else "Downloading Kronos-mini for first use"
                    ),
                )
            model = self._load_pretrained(
                model_class,
                model_artifact,
                "model",
                hub,
            )
            if on_status and not model_cached:
                on_status("loading", "Loading Kronos-mini into memory")
            self._raise_if_cancelled(is_cancelled)
            try:
                predictor = predictor_class(
                    model,
                    tokenizer,
                    device=runtime_device,
                    max_context=MAX_CONTEXT,
                )
            except Exception as error:
                raise KronosAdapterError(
                    "MODEL_LOAD_FAILED",
                    "Kronos-mini could not be initialized. Retry setup or clear its cached model files.",
                    "%s: %s" % (type(error).__name__, error),
                ) from error

            self._predictor = predictor
            self._metadata = {
                "modelId": MODEL_ID,
                "tokenizerId": TOKENIZER_ID,
                "modelRevision": model_artifact["revision"],
                "tokenizerRevision": tokenizer_artifact["revision"],
                "modelSha256": next(
                    file_entry["sha256"]
                    for file_entry in model_artifact["files"]
                    if file_entry["path"] == "model.safetensors"
                ),
                "tokenizerSha256": next(
                    file_entry["sha256"]
                    for file_entry in tokenizer_artifact["files"]
                    if file_entry["path"] == "model.safetensors"
                ),
                "device": metadata_device,
                "kronosCommit": commit,
            }
            return self.metadata

    def prepare_input(self, payload):
        if self._predictor is None or self._numpy is None or self._pandas is None:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "Kronos-mini must be loaded before preparing forecast input.",
            )
        np = self._numpy
        pd = self._pandas
        columns = ["open", "high", "low", "close", "volume", "amount"]
        try:
            values = np.asarray(
                [
                    [candle[column] for column in columns]
                    for candle in payload["candles"]
                ],
                dtype=np.float32,
            )
            history_timestamps = pd.Series(
                pd.to_datetime(
                    [candle["timestamp"] for candle in payload["candles"]],
                    utc=True,
                )
            )
            future_timestamps = pd.Series(
                pd.to_datetime(payload["futureTimestamps"], utc=True)
            )
            history_features = self._time_features(history_timestamps, np)
            future_features = self._time_features(future_timestamps, np)
            value_mean = np.mean(values, axis=0)
            value_std = np.std(values, axis=0)
            normalized = np.clip(
                (values - value_mean) / (value_std + 1e-5),
                -5,
                5,
            )
        except Exception as error:
            raise KronosAdapterError(
                "INVALID_CANDLES",
                "Forecast history could not be prepared for Kronos-mini.",
                "%s: %s" % (type(error).__name__, error),
            ) from error
        if not np.isfinite(normalized).all():
            raise KronosAdapterError(
                "INVALID_CANDLES",
                "Forecast history normalization produced invalid values.",
            )
        return PreparedKronosInput(
            normalized[np.newaxis, :],
            history_features[np.newaxis, :],
            future_features[np.newaxis, :],
            value_mean,
            value_std,
            future_timestamps,
        )

    def set_seed(self, seed):
        if self._numpy is None or self._torch is None:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "Kronos-mini must be loaded before setting a path seed.",
            )
        random.seed(seed)
        self._numpy.random.seed(seed)
        self._torch.manual_seed(seed)
        if self._torch.cuda.is_available():
            self._torch.cuda.manual_seed_all(seed)

    def generate_path(self, prepared, payload):
        if self._predictor is None or self._numpy is None:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "Kronos-mini must be loaded before path generation.",
            )
        try:
            generated = self._predictor.generate(
                prepared.normalized_values,
                prepared.history_time_features,
                prepared.future_time_features,
                payload["predLen"],
                payload["temperature"],
                payload["topK"],
                payload["topP"],
                1,
                False,
            )
            values = self._numpy.asarray(generated, dtype=self._numpy.float64)
        except Exception as error:
            raise KronosAdapterError(
                "PATH_GENERATION_FAILED",
                "Kronos-mini could not generate a forecast path.",
                "%s: %s" % (type(error).__name__, error),
            ) from error
        expected_shape = (1, payload["predLen"], 6)
        if values.shape != expected_shape:
            raise KronosAdapterError(
                "OUTPUT_VALIDATION_FAILED",
                "Kronos-mini returned an invalid forecast path shape.",
                "Expected %s, found %s" % (expected_shape, values.shape),
            )
        return values[0] * (prepared.value_std + 1e-5) + prepared.value_mean

    def _add_kronos_import_path(self, root):
        root_text = str(root)
        if root_text not in sys.path:
            sys.path.insert(0, root_text)

    def _load_pretrained(self, model_class, artifact, label, hub):
        repo_id = artifact["repoId"]
        try:
            if self._snapshot_resolver:
                snapshot_path = self._snapshot_resolver(artifact)
            else:
                snapshot_path = hub.snapshot_download(
                    repo_id,
                    revision=artifact["revision"],
                    allow_patterns=[
                        expected["path"]
                        for expected in artifact["files"]
                    ],
                )
            verified_path = verify_snapshot_files(
                snapshot_path,
                artifact,
            )
        except Exception as error:
            if isinstance(error, KronosAdapterError):
                raise
            if _is_download_error(error):
                raise KronosAdapterError(
                    "MODEL_DOWNLOAD_FAILED",
                    "%s could not be downloaded. Check the internet connection and retry."
                    % repo_id,
                    "%s %s: %s" % (label, type(error).__name__, error),
                ) from error
            raise KronosAdapterError(
                "MODEL_DOWNLOAD_FAILED",
                "%s pinned snapshot could not be downloaded."
                % repo_id,
                "%s %s: %s" % (label, type(error).__name__, error),
            ) from error
        try:
            with contextlib.redirect_stdout(sys.stderr):
                return model_class.from_pretrained(str(verified_path))
        except Exception as error:
            raise KronosAdapterError(
                "MODEL_LOAD_FAILED",
                "%s could not be loaded. Retry setup or clear its cached model files."
                % repo_id,
                "%s %s: %s" % (label, type(error).__name__, error),
            ) from error

    @staticmethod
    def _select_device(torch):
        if torch.cuda.is_available():
            return "cuda:0", "cuda"
        mps = getattr(getattr(torch, "backends", None), "mps", None)
        if mps is not None and mps.is_available():
            return "mps", "mps"
        return "cpu", "cpu"

    @staticmethod
    def _configure_deterministic_sampling(torch):
        use_deterministic = getattr(
            torch,
            "use_deterministic_algorithms",
            None,
        )
        if callable(use_deterministic):
            use_deterministic(True, warn_only=True)
        cudnn = getattr(getattr(torch, "backends", None), "cudnn", None)
        if cudnn is not None:
            cudnn.benchmark = False
            cudnn.deterministic = True

    @staticmethod
    def _raise_if_cancelled(is_cancelled):
        if is_cancelled and is_cancelled():
            raise KronosAdapterError(
                "JOB_CANCELLED",
                "Forecast cancelled during model preparation.",
            )

    @staticmethod
    def _time_features(timestamps, np):
        return np.column_stack(
            (
                timestamps.dt.minute,
                timestamps.dt.hour,
                timestamps.dt.weekday,
                timestamps.dt.day,
                timestamps.dt.month,
            )
        ).astype(np.float32)


def verify_installation(
    kronos_root=None,
    commit_path=None,
    importer=None,
    checkout_verifier=None,
    manifest_path=None,
):
    import_module = importer or importlib.import_module
    root = resolve_kronos_root(kronos_root)
    commit = resolve_kronos_commit(commit_path)
    manifest = load_model_manifest(manifest_path)
    (checkout_verifier or verify_kronos_checkout)(root, commit)
    root_text = str(root)
    if root_text not in sys.path:
        sys.path.insert(0, root_text)
    versions = {}
    for name in (
        "numpy",
        "pandas",
        "torch",
        "einops",
        "huggingface_hub",
        "matplotlib",
        "safetensors",
        "tqdm",
    ):
        try:
            module = import_module(name)
        except Exception as error:
            raise KronosAdapterError(
                "ENGINE_SETUP_FAILED",
                "Forecast engine dependency `%s` is unavailable. Run `npm run setup:forecast`."
                % name,
                "%s: %s" % (type(error).__name__, error),
            ) from error
        versions[name] = str(getattr(module, "__version__", "unknown"))
    try:
        model_module = import_module("model")
        for class_name in ("Kronos", "KronosTokenizer", "KronosPredictor"):
            getattr(model_module, class_name)
    except Exception as error:
        raise KronosAdapterError(
            "ENGINE_SETUP_FAILED",
            "Pinned Kronos source could not be imported.",
            "%s: %s" % (type(error).__name__, error),
        ) from error
    return {
        "ok": True,
        "modelId": MODEL_ID,
        "tokenizerId": TOKENIZER_ID,
        "modelRevision": manifest["artifacts"]["model"]["revision"],
        "tokenizerRevision": manifest["artifacts"]["tokenizer"]["revision"],
        "kronosCommit": commit,
        "versions": versions,
    }


def _is_download_error(error):
    if isinstance(error, (ConnectionError, TimeoutError)):
        return True
    module_name = type(error).__module__.lower()
    class_name = type(error).__name__.lower()
    message = str(error).lower()
    return (
        module_name.startswith(("huggingface_hub", "httpx", "requests", "urllib3"))
        or "connection" in class_name
        or "timeout" in class_name
        or any(
            fragment in message
            for fragment in (
                "connection error",
                "connection refused",
                "network is unreachable",
                "name resolution",
                "timed out",
                "offline",
            )
        )
    )


def is_huggingface_artifact_cached(artifact):
    try:
        hub = importlib.import_module("huggingface_hub")
        snapshot_path = hub.snapshot_download(
            artifact["repoId"],
            revision=artifact["revision"],
            allow_patterns=[
                expected["path"] for expected in artifact["files"]
            ],
            local_files_only=True,
        )
        verify_snapshot_files(snapshot_path, artifact)
        return True
    except Exception:
        return False
