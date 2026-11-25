#!/usr/bin/env python3
"""The latest Font Awesome release (fallback for `fa releases`).

  python3 scripts/latest-version.py

Prints the version, such as 7.3.1. It resolves "7.x" to its latest release
and checks that release's isLatest; if a newer major exists, it tries "8.x",
then "9.x", and so on. Runs queries/latest-version.graphql.

Exit codes: 0 success; 2 an error (network or API), with a message on stderr.
"""

import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from query_runner import EXIT_ERROR, QueryError, latest_release  # noqa: E402

if any(a in ("-h", "--help") for a in sys.argv[1:]):
    print(__doc__.strip())
    sys.exit(0)
if sys.argv[1:]:
    print(f"Error: latest-version.py takes no arguments, got {' '.join(sys.argv[1:])}", file=sys.stderr)
    sys.exit(EXIT_ERROR)
try:
    print(latest_release())
except QueryError as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(EXIT_ERROR)
