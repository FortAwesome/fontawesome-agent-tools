#!/usr/bin/env python3
"""Search the Font Awesome catalog (fallback for `fa search --version`).

  python3 scripts/search.py --version 7.3.1 --query cup [--first 10]

Prints the API's JSON: data.search[] with id, label, unicode and
familyStylesByLicense. Pipe it through summarize-icons.py for one line per icon:

  python3 scripts/search.py --version 7.3.1 --query cup | python3 scripts/summarize-icons.py

Runs queries/search.graphql.
"""

import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from query_runner import main  # noqa: E402

main("search", sys.argv[1:], require=None, usage=__doc__)
