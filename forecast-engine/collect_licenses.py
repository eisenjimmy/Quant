#!/usr/bin/env python3
import argparse
import json
import re
import shutil
from importlib import metadata
from pathlib import Path


LICENSE_NAME_RE = re.compile(
    r"^(license|licence|copying|copyright|notice|authors)",
    re.IGNORECASE,
)


def safe_name(value):
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-") or "package"


def collect_runtime_licenses(output_dir, distributions=None):
    output = Path(output_dir).expanduser().resolve()
    shutil.rmtree(output, ignore_errors=True)
    output.mkdir(parents=True)
    entries = []
    installed = list(distributions or metadata.distributions())
    installed.sort(
        key=lambda dist: (dist.metadata.get("Name") or "").lower()
    )
    for dist in installed:
        name = dist.metadata.get("Name")
        if not name:
            continue
        version = dist.version or "unknown"
        package_dir = output / safe_name("%s-%s" % (name, version))
        package_dir.mkdir()
        copied = []
        seen_sources = set()
        for relative in dist.files or []:
            relative_path = Path(str(relative))
            if not LICENSE_NAME_RE.match(relative_path.name):
                continue
            source = Path(dist.locate_file(relative)).resolve()
            if not source.is_file() or source in seen_sources:
                continue
            seen_sources.add(source)
            destination = package_dir / safe_name(str(relative_path))
            shutil.copy2(source, destination)
            copied.append(destination.name)
        declared = (
            dist.metadata.get("License-Expression")
            or dist.metadata.get("License")
            or ""
        ).strip()
        if declared and declared.upper() != "UNKNOWN":
            metadata_license = package_dir / "METADATA-LICENSE.txt"
            metadata_license.write_text(declared + "\n", encoding="utf-8")
            copied.append(metadata_license.name)
        if not copied:
            raise RuntimeError(
                "No license metadata was found for %s %s" % (name, version)
            )
        entries.append(
            {
                "name": name,
                "version": version,
                "declaredLicense": declared.splitlines()[0]
                if declared
                else "See included files",
                "files": sorted(set(copied)),
            }
        )
    (output / "manifest.json").write_text(
        json.dumps(
            {"schemaVersion": 1, "packages": entries},
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    markdown = [
        "# Frozen Forecast Runtime Licenses",
        "",
        "This inventory was generated from the exact Python environment used",
        "to build the platform forecast sidecar. Full available license,",
        "copyright, attribution, and notice files are retained in each package",
        "folder below.",
        "",
        "| Package | Version | Declared license |",
        "| --- | --- | --- |",
    ]
    for entry in entries:
        license_text = entry["declaredLicense"].replace("|", "\\|")
        markdown.append(
            "| %s | %s | %s |"
            % (entry["name"], entry["version"], license_text)
        )
    markdown.append("")
    (output / "README.md").write_text(
        "\n".join(markdown),
        encoding="utf-8",
    )
    return entries


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output_dir")
    args = parser.parse_args()
    entries = collect_runtime_licenses(args.output_dir)
    print("collected licenses for %d Python distributions" % len(entries))


if __name__ == "__main__":
    main()
