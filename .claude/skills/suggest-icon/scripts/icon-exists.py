#!/usr/bin/env python3

import argparse
import json
import sys
import urllib.request

GRAPHQL_URL = "https://api.fontawesome.com"

parser = argparse.ArgumentParser(description="Check if a Font Awesome icon exists")
parser.add_argument("--version", required=True, help="Font Awesome version (e.g. 6.7.2)")
parser.add_argument("--icon-name", required=True, help="Icon name to check (e.g. coffee)")
args = parser.parse_args()

query = """
query ($version: String!, $name: String!) {
  release(version: $version) {
    icon(name: $name) {
      id
      label
      familyStylesByLicense {
        free { family style }
        pro { family style }
      }
    }
  }
}
"""

req = urllib.request.Request(
    GRAPHQL_URL,
    data=json.dumps({
        "query": query,
        "variables": {"version": args.version, "name": args.icon_name},
    }).encode(),
    headers={
        "Content-Type": "application/json",
        "User-Agent": "fontawesome-agent-tools",
    },
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

icon = data["data"]["release"]["icon"]

if icon is None:
    print(f"Icon '{args.icon_name}' does not exist in version {args.version}")
    sys.exit(1)

print(f"Icon '{icon['id']}' (label: {icon['label']}) exists in version {args.version}")

styles = icon["familyStylesByLicense"]
free = styles.get("free") or []
pro = styles.get("pro") or []

if free:
    print(f"  Free: {', '.join(f'{s['family']} {s['style']}' for s in free)}")
if pro:
    print(f"  Pro: {', '.join(f'{s['family']} {s['style']}' for s in pro)}")
