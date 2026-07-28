import os
import sys
import tempfile
import unittest
from pathlib import Path


sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from collect_licenses import collect_runtime_licenses


class RuntimeLicenseTests(unittest.TestCase):
    def test_runtime_license_inventory_covers_required_packages(self):
        with tempfile.TemporaryDirectory() as temp:
            entries = collect_runtime_licenses(temp)
            names = {entry["name"].lower() for entry in entries}
            self.assertTrue(
                {
                    "numpy",
                    "pandas",
                    "torch",
                    "einops",
                    "huggingface-hub",
                    "matplotlib",
                    "tqdm",
                    "safetensors",
                }.issubset(names)
            )
            self.assertTrue((Path(temp) / "README.md").is_file())
            self.assertTrue((Path(temp) / "manifest.json").is_file())


if __name__ == "__main__":
    unittest.main()
