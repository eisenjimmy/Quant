#!/usr/bin/env python3
import json
import os
import sys

from kronos_adapter import KronosAdapterError, verify_installation


def main():
    if not ((3, 10) <= sys.version_info[:2] <= (3, 12)):
        print(
            "Forecast setup requires Python 3.10 through 3.12; found %s."
            % ".".join(str(part) for part in sys.version_info[:3]),
            file=sys.stderr,
        )
        return 2
    try:
        result = verify_installation(
            kronos_root=os.environ.get("QUANT_KRONOS_ROOT"),
            commit_path=os.environ.get("QUANT_KRONOS_COMMIT_PATH"),
        )
    except KronosAdapterError as error:
        print(error.public_message, file=sys.stderr)
        if error.detail:
            print(error.detail, file=sys.stderr)
        return 1
    print(json.dumps(result, separators=(",", ":"), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
