#!/usr/bin/env python3

import json
import urllib.request

GRAPHQL_URL = "https://api.fontawesome.com"

query = """
{
  releases {
    version
    isLatest
  }
}
"""

req = urllib.request.Request(
    GRAPHQL_URL,
    data=json.dumps({"query": query}).encode(),
    headers={
        "Content-Type": "application/json",
        "User-Agent": "fontawesome-agent-tools",
    },
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

for release in data["data"]["releases"]:
    if release["isLatest"]:
        print(release["version"])
        break
