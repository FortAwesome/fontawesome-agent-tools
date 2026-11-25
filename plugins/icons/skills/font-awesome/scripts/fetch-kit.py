#!/usr/bin/env python3
"""A kit's basic settings from its public kit JS (fallback when `fa` isn't installed).

  python3 scripts/fetch-kit.py --kit-id <kit token>

Prints the release the kit serves now (the kit JS doesn't say whether the kit
is pinned to it or follows a major version such as 7.x), its license, method
and startup file. Without `fa` there's no way to see which
family-styles the kit includes, so it prints a warning and then every
family-style the kit's license allows in that release, as an assumption, not
the kit's own list. With `fa`, use `fa kit show` and `fa kit family-styles`.

Exit codes: 0 the kit JS was read (if the API then fails, the kit's details are
still printed, with what couldn't be checked); 1 the kit JS couldn't be read;
2 bad arguments (no --kit-id) or an unexpected error.
"""

import argparse
import http.client
import json
import os
import sys
import urllib.error
import urllib.request

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from query_runner import (  # noqa: E402
    API_URL,
    TIMEOUT,
    USER_AGENT,
    QueryError,
    exit_on_unexpected_error,
    latest_release,
    run_query,
)

KIT_BASE_URL = os.environ.get("FA_KIT_URL", "https://kit.fontawesome.com")
FA_CLI_DOCS = "https://docs.fontawesome.com/web/use-with/fa-cli"


def fail(message):
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)


def fetch_kit_config(kit_id):
    """window.FontAwesomeKitConfig from the first line of the kit's JS."""
    req = urllib.request.Request(
        f"{KIT_BASE_URL}/{kit_id}.js",
        headers={"Origin": "http://fa.local", "User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            first_line = resp.readline()
    except urllib.error.HTTPError as e:
        if e.code == 403:
            fail(f"kit '{kit_id}' not found or access denied (HTTP 403)")
        if e.code == 404:
            fail(f"kit '{kit_id}' not found (HTTP 404)")
        fail(f"HTTP {e.code} fetching kit '{kit_id}'")
    except urllib.error.URLError as e:
        fail(f"could not reach kit server: {e.reason}")
    except (http.client.HTTPException, OSError) as e:
        fail(f"the connection to the kit server failed: {type(e).__name__}: {e}")
    try:
        line = first_line.decode("utf-8")
        json_start = line.index("= ") + 2
        json_end = line.rindex(";")
        config = json.loads(line[json_start:json_end])
    except ValueError as e:  # includes UnicodeDecodeError and JSONDecodeError
        fail(f"could not parse kit config from response: {e}")
    if not isinstance(config, dict):
        fail(f"could not parse kit config from response: it isn't an object ({json.dumps(config)[:100]})")
    return config


def resolve(version):
    """The release a kit's version resolves to now. Raises QueryError.

    The kit JS normally names a release (7.3.1), which resolves to itself. A
    symbolic version (7.x) resolves to the latest 7.x release. The kits service
    reads "latest" as the latest 5.x release (kits_edge_container utils.ex), so
    it's sent as "5.x": the skill never passes "latest" to the API.
    """
    if not version:
        return latest_release()
    query_version = "5.x" if version == "latest" else version
    release = run_query("resolve-version", {"version": query_version}).get("release")
    if not release:
        raise QueryError(f"version '{version}' not found in the API")
    return release["version"]


def rest(path):
    """GET a REST endpoint's JSON. Raises QueryError."""
    req = urllib.request.Request(f"{API_URL}{path}", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise QueryError(f"the Font Awesome API returned HTTP {e.code} for {path}")
    except urllib.error.URLError as e:
        raise QueryError(f"could not reach the Font Awesome API: {e.reason}")
    except json.JSONDecodeError as e:
        raise QueryError(f"the Font Awesome API returned something other than JSON for {path}: {e}")
    except (http.client.HTTPException, OSError) as e:
        raise QueryError(f"the connection to the Font Awesome API failed: {type(e).__name__}: {e}")
    if not isinstance(data, dict):
        raise QueryError(f"the Font Awesome API returned JSON that isn't an object for {path}")
    return data


def allowed_family_styles(license_type, release):
    """Every family-style the license allows in the release, from the API. Raises QueryError."""
    if license_type == "free":
        packs = rest(f"/releases/{release}/icon-packs")
        free = next((c for c in packs.get("iconCollections") or [] if c.get("name") == "free-collection"), None)
        if free is None:
            raise QueryError(f"the API lists no free-collection for {release}")
        return free.get("subset") or []
    return rest(f"/releases/{release}/family-styles").get("familyStyles") or []


def main():
    parser = argparse.ArgumentParser(description="Fetch a Font Awesome kit's basic settings")
    parser.add_argument("--kit-id", required=True, help="Kit token (e.g. e8aa7b71da)")
    args = parser.parse_args()

    config = fetch_kit_config(args.kit_id)
    version = config.get("version")
    license_type = config.get("license") or "unknown"
    # Everything after the kit JS is best effort: an API failure doesn't lose
    # the version, license and method the kit JS already gave.
    errors = []
    try:
        release = resolve(version)
    except QueryError as e:
        release = None
        errors.append(f"couldn't resolve the kit's version: {e}")

    # The kit JS names the release the kit serves now (7.3.1), even for a kit
    # set to follow a major version (7.x). Only `fa kit show` has the setting.
    following = "A kit set to follow a major version, such as 7.x, moves to each new release"
    if not version:
        version_line = (
            f"unknown (the kit JS names no version; {release} is the latest release"
            if release
            else "unknown (the kit JS names no version"
        ) + "; only `fa kit show` shows the kit's version)"
    elif release is None:
        version_line = f"{version} (couldn't check it against the API. {following})"
    elif version == "latest":
        version_line = f"latest (the kits service reads it as the latest 5.x release, {release} now)"
    elif version != release:
        version_line = f"{version} (resolves to {release} now; it moves with each new release)"
    else:
        version_line = (
            f"{release} (the release this kit serves now. {following}; only `fa kit show` shows the kit's setting)"
        )

    by_family = {}
    if license_type not in ("free", "pro"):
        errors.append(f"the kit JS gives license {license_type!r}, so there's no list of what it allows")
    elif release is not None:
        try:
            for fs in allowed_family_styles(license_type, release):
                if fs.get("family") and fs.get("style"):
                    by_family.setdefault(fs["family"], []).append(fs["style"])
        except QueryError as e:
            errors.append(f"couldn't list the family-styles its license allows: {e}")

    print(f"Kit ID: {config.get('token', args.kit_id)}")
    print(f"Version: {version_line}")
    print(f"License: {license_type}")
    print(f"Method: {config.get('method', 'unknown')}")
    print(f"Startup file: {config.get('startupFilename', '')}")
    print()
    if by_family:
        warning = (
            "so this assumes all of the family-styles its license allows in Font Awesome "
            f"{release}, listed below."
        )
    else:
        warning = "and couldn't list the family-styles its license allows either (see below)."
    print(
        f"Warning: Without the `fa` CLI I can't tell which family-styles this kit includes, {warning} "
        f"Install the `fa` CLI for more accurate results: {FA_CLI_DOCS}"
    )
    print()
    if by_family:
        label = "Free" if license_type == "free" else "Pro"
        print(f"Assumed family-styles (everything {label} allows in {release}, not the kit's own list):")
        for family, styles in by_family.items():
            print(f"  {family}: {', '.join(styles)}")
    for error in errors:
        print(f"Couldn't check: {error}")
        print(f"Error: {error}", file=sys.stderr)


if __name__ == "__main__":
    exit_on_unexpected_error(main)
