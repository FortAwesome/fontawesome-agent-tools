#!/usr/bin/env python3
"""Look up one icon by exact name (fallback for `fa icons --name`).

  python3 scripts/icon-exists.py --version 7.3.1 --icon-name house

Prints the API's JSON: data.release.icon with id, label and
familyStylesByLicense, or null. Pipe it through summarize-icons.py for one line.
Runs queries/icon-exists.graphql.

Exit codes: 0 the icon exists; 1 it does not; 2 the check failed (unknown
version, network or API error), so whether it exists is unknown.
"""

import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from query_runner import main  # noqa: E402

main("icon-exists", sys.argv[1:], require="data.release.icon", usage=__doc__)
