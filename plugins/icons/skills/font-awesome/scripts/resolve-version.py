#!/usr/bin/env python3
"""The release a Font Awesome version resolves to now.

  python3 scripts/resolve-version.py --version 7.x

Prints the API's JSON: data.release.version. A symbolic version such as "7.x"
(what a kit set to the latest 7.x uses) moves to each new 7.x release, so
resolve it again each time rather than reusing an earlier answer. Don't pass
"latest": the API resolves it to the last 5.x release. Runs
queries/resolve-version.graphql.
"""

import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from query_runner import main  # noqa: E402

main("resolve-version", sys.argv[1:], require=None, usage=__doc__)
