#!/usr/bin/env python3
"""Summarize `fa` icon JSON as one compact line per icon.

Reads the JSON that `fa search`, `fa icons`, or `fa kit icon` prints (pass
`--json`) on stdin, and prints each icon's name, Free/Pro availability, its
families, the number of family-styles, and which family-styles are Free.
Use it instead of writing your own filter, so the families aren't lost.

  fa search --version 7.3.1 --query tea --page-size 10 --json | python3 scripts/summarize-icons.py

Catalog results look like:

  bat (Bat) | Pro | classic, duotone, sharp, sharp-duotone (16 family-styles)
  baseball-bat-ball (Baseball Bat Ball) | Free+Pro | classic, duotone, sharp, sharp-duotone (16 family-styles) | free: classic/solid

Kit results (`--kit-token`) list what the kit contains:

  mug-saucer (Mug Saucer) | in kit | classic/solid
"""

import json
import sys


def family_styles(entries):
    """[{family, style, prefix}] -> ["family/style", ...] without duplicates, in order."""
    seen = []
    for e in entries or []:
        fs = e.get("familyStyle", e) if isinstance(e, dict) else {}
        if fs.get("family") and fs.get("style"):
            key = f"{fs['family']}/{fs['style']}"
        else:
            key = fs.get("prefix") or fs.get("shorthand") or "?"
        if key not in seen:
            seen.append(key)
    return seen


def families_of(keys):
    out = []
    for k in keys:
        fam = k.split("/")[0]
        if fam not in out:
            out.append(fam)
    return out


def catalog_line(icon):
    by_license = icon.get("familyStylesByLicense") or {}
    free = family_styles(by_license.get("free"))
    pro = family_styles(by_license.get("pro"))
    every = free + [k for k in pro if k not in free]
    if free and pro:
        availability = "Free+Pro"
    elif free:
        availability = "Free"
    elif pro:
        availability = "Pro"
    else:
        availability = "no family-styles"
    parts = [name_of(icon), availability]
    if every:
        parts.append(f"{', '.join(families_of(every))} ({len(every)} family-style{'s' if len(every) != 1 else ''})")
    if free and pro:
        parts.append("free: " + ", ".join(free))
    return " | ".join(parts)


def kit_line(icon):
    variants = family_styles(icon.get("variants"))
    if len(variants) > 8:
        detail = f"{', '.join(families_of(variants))} ({len(variants)} family-styles)"
    else:
        detail = ", ".join(variants) or "no variants"
    return " | ".join([name_of(icon), "in kit", detail])


def name_of(icon):
    name = icon.get("id") or icon.get("name") or "?"
    label = icon.get("label")
    return f"{name} ({label})" if label and label.lower().replace(" ", "-") != name else name


def find_icons(node, out):
    """Collect every icon object in the response, wherever the command put it."""
    if isinstance(node, dict):
        if ("familyStylesByLicense" in node or "variants" in node) and (node.get("id") or node.get("name")):
            out.append(node)
            return
        for value in node.values():
            find_icons(value, out)
    elif isinstance(node, list):
        for value in node:
            find_icons(value, out)


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        sys.exit("summarize-icons: no input. Pipe `fa search ... --json` or `fa icons ... --json` into it.")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.exit(f"summarize-icons: input isn't JSON ({e}). Did the fa command fail? Its output starts: {raw[:200]!r}")
    if isinstance(data, dict) and data.get("errors"):
        sys.exit(f"summarize-icons: the API returned errors: {json.dumps(data['errors'])[:500]}")

    icons = []
    find_icons(data, icons)
    if not icons:
        # `fa icons --name x` for a name that doesn't exist returns {"data":{"release":{"icon":null}}}.
        print("No icons in the results.")
        return
    for icon in icons:
        print(kit_line(icon) if "variants" in icon and "familyStylesByLicense" not in icon else catalog_line(icon))


if __name__ == "__main__":
    main()
