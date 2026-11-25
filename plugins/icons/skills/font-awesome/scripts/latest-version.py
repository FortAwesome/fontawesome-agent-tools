#!/usr/bin/env python3
"""Every Font Awesome release (fallback for `fa releases`).

  python3 scripts/latest-version.py

Prints the API's JSON: data.releases[] with version and isLatest. The latest
release is the one with isLatest: true. Runs queries/latest-version.graphql.
"""

import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from query_runner import main  # noqa: E402

main("latest-version", sys.argv[1:], require=None, usage=__doc__)
