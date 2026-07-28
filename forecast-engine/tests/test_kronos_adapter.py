import contextlib
import importlib
import hashlib
import io
import json
import math
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path


sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from kronos_adapter import (
    MAX_CONTEXT,
    MODEL_ID,
    TOKENIZER_ID,
    KronosAdapter,
    KronosAdapterError,
    resolve_kronos_commit,
    verify_kronos_checkout,
    verify_installation,
)


PINNED_COMMIT = "67b630e67f6a18c9e9be918d9b4337c960db1e9a"


class FakePretrained:
    calls = []

    @classmethod
    def from_pretrained(cls, model_id):
        cls.calls.append(model_id)
        return cls()


class FakeTokenizer(FakePretrained):
    calls = []


class FakeModel(FakePretrained):
    calls = []


class NoisyTokenizer(FakePretrained):
    calls = []

    @classmethod
    def from_pretrained(cls, model_id):
        print("third-party loader output")
        return super().from_pretrained(model_id)


class FakePredictor:
    calls = []
    generate_calls = []

    def __init__(self, model, tokenizer, device, max_context):
        self.calls.append(
            {
                "model": model,
                "tokenizer": tokenizer,
                "device": device,
                "max_context": max_context,
            }
        )

    def generate(self, *args):
        self.generate_calls.append(args)
        np = importlib.import_module("numpy")
        pred_len = args[3]
        return np.zeros((1, pred_len, 6), dtype=np.float32)


def fake_torch(cuda=False, mps=False):
    return types.SimpleNamespace(
        __version__="test",
        manual_seed=lambda seed: seed,
        cuda=types.SimpleNamespace(
            is_available=lambda: cuda,
            manual_seed_all=lambda seed: seed,
        ),
        backends=types.SimpleNamespace(
            mps=types.SimpleNamespace(is_available=lambda: mps)
        ),
    )


class AdapterTests(unittest.TestCase):
    def setUp(self):
        FakeTokenizer.calls = []
        FakeModel.calls = []
        FakePredictor.calls = []
        FakePredictor.generate_calls = []
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / "Kronos"
        (self.root / "model").mkdir(parents=True)
        source_files = {
            "LICENSE": b"license",
            "model/__init__.py": b"",
            "model/kronos.py": b"kronos",
            "model/module.py": b"module",
        }
        for relative, contents in source_files.items():
            candidate = self.root / relative
            candidate.parent.mkdir(parents=True, exist_ok=True)
            candidate.write_bytes(contents)
        self.commit_path = Path(self.temp.name) / "KRONOS_COMMIT.txt"
        self.commit_path.write_text(PINNED_COMMIT + "\n", encoding="utf-8")
        (Path(self.temp.name) / "KRONOS_SOURCE_MANIFEST.json").write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "commit": PINNED_COMMIT,
                    "files": [
                        {
                            "path": relative,
                            "sha256": hashlib.sha256(contents).hexdigest(),
                        }
                        for relative, contents in source_files.items()
                    ],
                }
            ),
            encoding="utf-8",
        )
        self.snapshots = {}
        artifacts = {}
        for name, repo_id, revision in (
            ("model", MODEL_ID, "1" * 40),
            ("tokenizer", TOKENIZER_ID, "2" * 40),
        ):
            snapshot = Path(self.temp.name) / ("%s-snapshot" % name)
            snapshot.mkdir()
            files = []
            for filename, contents in (
                ("config.json", ('{"artifact":"%s"}' % name).encode()),
                ("model.safetensors", ("%s-weights" % name).encode()),
            ):
                (snapshot / filename).write_bytes(contents)
                files.append(
                    {
                        "path": filename,
                        "size": len(contents),
                        "sha256": hashlib.sha256(contents).hexdigest(),
                    }
                )
            self.snapshots[repo_id] = snapshot
            artifacts[name] = {
                "repoId": repo_id,
                "revision": revision,
                "files": files,
            }
        self.model_manifest_path = Path(self.temp.name) / "model-manifest.json"
        self.model_manifest_path.write_text(
            json.dumps({"schemaVersion": 1, "artifacts": artifacts}),
            encoding="utf-8",
        )

    def tearDown(self):
        self.temp.cleanup()

    def importer(self, name):
        if name == "torch":
            return fake_torch(mps=True)
        if name in ("numpy", "pandas"):
            return importlib.import_module(name)
        if name in (
            "einops",
            "huggingface_hub",
            "matplotlib",
            "safetensors",
            "tqdm",
        ):
            return types.SimpleNamespace(__version__="test")
        if name == "model":
            return types.SimpleNamespace(
                KronosTokenizer=FakeTokenizer,
                Kronos=FakeModel,
                KronosPredictor=FakePredictor,
            )
        raise ImportError(name)

    def snapshot_resolver(self, artifact):
        return self.snapshots[artifact["repoId"]]

    def make_adapter(self, **overrides):
        options = {
            "kronos_root": self.root,
            "commit_path": self.commit_path,
            "importer": self.importer,
            "checkout_verifier": self.checkout_verifier,
            "manifest_path": self.model_manifest_path,
            "snapshot_resolver": self.snapshot_resolver,
        }
        options.update(overrides)
        return KronosAdapter(**options)

    @staticmethod
    def checkout_verifier(root, commit):
        if not (Path(root) / "model" / "__init__.py").is_file():
            raise AssertionError("unexpected Kronos root")
        if commit != PINNED_COMMIT:
            raise AssertionError("unexpected Kronos commit")

    def test_model_and_dependencies_are_lazy_and_cached(self):
        calls = []

        def recording_importer(name):
            calls.append(name)
            return self.importer(name)

        adapter = self.make_adapter(importer=recording_importer)
        self.assertFalse(adapter.is_ready)
        self.assertEqual(calls, [])

        metadata = adapter.prepare()
        second_metadata = adapter.prepare()

        self.assertTrue(adapter.is_ready)
        self.assertEqual(metadata, second_metadata)
        self.assertEqual(metadata["modelId"], MODEL_ID)
        self.assertEqual(metadata["tokenizerId"], TOKENIZER_ID)
        self.assertEqual(metadata["device"], "mps")
        self.assertEqual(metadata["kronosCommit"], PINNED_COMMIT)
        self.assertEqual(
            FakeTokenizer.calls,
            [str(self.snapshots[TOKENIZER_ID].resolve())],
        )
        self.assertEqual(
            FakeModel.calls,
            [str(self.snapshots[MODEL_ID].resolve())],
        )
        self.assertEqual(FakePredictor.calls[0]["max_context"], MAX_CONTEXT)
        self.assertEqual(FakePredictor.calls[0]["device"], "mps")

    def test_pretrained_loader_output_does_not_leak_to_protocol_stdout(self):
        def noisy_importer(name):
            imported = self.importer(name)
            if name == "model":
                return types.SimpleNamespace(
                    KronosTokenizer=NoisyTokenizer,
                    Kronos=FakeModel,
                    KronosPredictor=FakePredictor,
                )
            return imported

        protocol_output = io.StringIO()
        diagnostic_output = io.StringIO()
        with contextlib.redirect_stdout(protocol_output):
            with contextlib.redirect_stderr(diagnostic_output):
                self.make_adapter(importer=noisy_importer).prepare()

        self.assertEqual(protocol_output.getvalue(), "")
        self.assertIn(
            "third-party loader output",
            diagnostic_output.getvalue(),
        )

    def test_preparation_status_distinguishes_download_and_cached_load(self):
        statuses = []
        adapter = self.make_adapter(
            cache_checker=lambda artifact: artifact["repoId"] == MODEL_ID,
        )

        adapter.prepare(
            on_status=lambda phase, message: statuses.append((phase, message))
        )

        self.assertEqual(
            statuses,
            [
                (
                    "downloading",
                    "Downloading Kronos tokenizer for first use",
                ),
                ("loading", "Loading Kronos tokenizer into memory"),
                ("loading", "Loading Kronos-mini from local cache"),
            ],
        )

    def test_model_preparation_observes_cancellation_before_download(self):
        adapter = self.make_adapter()
        with self.assertRaises(KronosAdapterError) as caught:
            adapter.prepare(is_cancelled=lambda: True)
        self.assertEqual(caught.exception.code, "JOB_CANCELLED")
        self.assertEqual(FakeTokenizer.calls, [])
        self.assertEqual(FakeModel.calls, [])

    def test_input_is_normalized_once_for_runner_reuse(self):
        adapter = self.make_adapter()
        adapter.prepare()
        candles = []
        for index in range(300):
            price = 100 + index
            candles.append(
                {
                    "timestamp": "2026-01-%02dT14:30:00.000Z"
                    % ((index % 28) + 1),
                    "open": price,
                    "high": price + 2,
                    "low": price - 2,
                    "close": price + 1,
                    "volume": 1000 + index,
                    "amount": (1000 + index) * price,
                }
            )
        future = [
            "2026-02-%02dT14:30:00.000Z" % (index + 1)
            for index in range(24)
        ]
        prepared = adapter.prepare_input(
            {"candles": candles, "futureTimestamps": future}
        )
        self.assertEqual(prepared.normalized_values.shape, (1, 300, 6))
        self.assertEqual(prepared.history_time_features.shape, (1, 300, 5))
        self.assertEqual(prepared.future_time_features.shape, (1, 24, 5))
        means = prepared.normalized_values.mean(axis=1)[0]
        self.assertTrue(all(math.isclose(value, 0, abs_tol=1e-5) for value in means))

        adapter.set_seed(42)
        generated = adapter.generate_path(
            prepared,
            {
                "predLen": 24,
                "temperature": 1.0,
                "topK": 0,
                "topP": 0.95,
            },
        )
        self.assertEqual(generated.shape, (24, 6))
        generate_call = FakePredictor.generate_calls[0]
        self.assertEqual(generate_call[7], 1)
        self.assertFalse(generate_call[8])

    def test_missing_dependency_is_actionable(self):
        def missing_importer(name):
            if name == "torch":
                raise ModuleNotFoundError("No module named 'torch'")
            return self.importer(name)

        adapter = self.make_adapter(importer=missing_importer)
        with self.assertRaises(KronosAdapterError) as caught:
            adapter.prepare()
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")
        self.assertIn("npm run setup:forecast", caught.exception.public_message)

    def test_broken_native_dependency_is_setup_failure(self):
        def broken_importer(name):
            if name == "torch":
                raise OSError("native library could not be loaded")
            return self.importer(name)

        adapter = self.make_adapter(importer=broken_importer)
        with self.assertRaises(KronosAdapterError) as caught:
            adapter.prepare()
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")
        self.assertIn("npm run setup:forecast", caught.exception.public_message)

    def test_network_failure_has_stable_download_code(self):
        def offline_snapshot_resolver(artifact):
            raise ConnectionError("offline")

        adapter = self.make_adapter(
            snapshot_resolver=offline_snapshot_resolver
        )
        with self.assertRaises(KronosAdapterError) as caught:
            adapter.prepare()
        self.assertEqual(caught.exception.code, "MODEL_DOWNLOAD_FAILED")
        self.assertIn("internet connection", caught.exception.public_message)

    def test_tampered_snapshot_is_rejected_before_model_load(self):
        (
            self.snapshots[TOKENIZER_ID] / "model.safetensors"
        ).write_bytes(b"tampered")
        adapter = self.make_adapter()
        with self.assertRaises(KronosAdapterError) as caught:
            adapter.prepare()
        self.assertEqual(caught.exception.code, "MODEL_LOAD_FAILED")
        self.assertEqual(FakeTokenizer.calls, [])

    @unittest.skipIf(os.name == "nt", "Symlink permissions vary on Windows")
    def test_huggingface_snapshot_symlink_to_blob_is_verified(self):
        snapshot_file = self.snapshots[TOKENIZER_ID] / "config.json"
        blob = Path(self.temp.name) / "blobs" / "tokenizer-config"
        blob.parent.mkdir()
        snapshot_file.replace(blob)
        snapshot_file.symlink_to(blob)
        metadata = self.make_adapter().prepare()
        self.assertEqual(metadata["tokenizerId"], TOKENIZER_ID)
        self.assertEqual(
            FakeTokenizer.calls,
            [str(self.snapshots[TOKENIZER_ID].resolve())],
        )

    def test_mutable_model_revision_is_rejected(self):
        manifest = json.loads(
            self.model_manifest_path.read_text(encoding="utf-8")
        )
        manifest["artifacts"]["model"]["revision"] = "main"
        self.model_manifest_path.write_text(
            json.dumps(manifest),
            encoding="utf-8",
        )
        adapter = self.make_adapter()
        with self.assertRaises(KronosAdapterError) as caught:
            adapter.prepare()
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")
        self.assertEqual(FakeModel.calls, [])

    def test_manifest_missing_required_weight_is_rejected(self):
        manifest = json.loads(
            self.model_manifest_path.read_text(encoding="utf-8")
        )
        manifest["artifacts"]["model"]["files"] = [
            manifest["artifacts"]["model"]["files"][0]
        ]
        self.model_manifest_path.write_text(
            json.dumps(manifest),
            encoding="utf-8",
        )
        with self.assertRaises(KronosAdapterError) as caught:
            self.make_adapter().prepare()
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")

    def test_invalid_commit_metadata_is_rejected(self):
        self.commit_path.write_text("main\n", encoding="utf-8")
        with self.assertRaises(KronosAdapterError) as caught:
            resolve_kronos_commit(self.commit_path)
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")

    def test_packaged_checkout_source_manifest_detects_tampering(self):
        verify_kronos_checkout(self.root, PINNED_COMMIT)
        (self.root / "model" / "__init__.py").write_text(
            "tampered",
            encoding="utf-8",
        )
        with self.assertRaises(KronosAdapterError) as caught:
            verify_kronos_checkout(self.root, PINNED_COMMIT)
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")
        self.assertIn("failed verification", caught.exception.public_message)

    def test_packaged_checkout_requires_complete_source_manifest(self):
        manifest_path = (
            Path(self.temp.name) / "KRONOS_SOURCE_MANIFEST.json"
        )
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["files"] = manifest["files"][:-1]
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaises(KronosAdapterError) as caught:
            verify_kronos_checkout(self.root, PINNED_COMMIT)
        self.assertEqual(caught.exception.code, "ENGINE_SETUP_FAILED")
        self.assertIn("metadata is invalid", caught.exception.public_message)

    def test_setup_verification_imports_kronos_without_loading_weights(self):
        result = verify_installation(
            kronos_root=self.root,
            commit_path=self.commit_path,
            importer=self.importer,
            checkout_verifier=self.checkout_verifier,
            manifest_path=self.model_manifest_path,
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["kronosCommit"], PINNED_COMMIT)
        self.assertEqual(FakeTokenizer.calls, [])
        self.assertEqual(FakeModel.calls, [])


if __name__ == "__main__":
    unittest.main()
