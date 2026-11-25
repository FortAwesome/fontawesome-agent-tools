"""Run a GraphQL document from queries/ against the public Font Awesome API.

The fallback scripts icon-exists.py, search.py and resolve-version.py are
thin wrappers around main(); latest-version.py and fetch-kit.py use
latest_release() and run_query(). Each `--kebab-name value`
argument sets the `$camelName` variable the document declares, converted to
the declared type. The API's JSON response is printed as `fa query` prints it,
so the same documents also run with `fa query -f queries/<name>.graphql`.

Exit codes: 0 success; 1 the path named by `require` is null (for example, the
icon doesn't exist); 2 an error (bad arguments, network, HTTP, or GraphQL
errors), with a message on stderr.

Only public catalog queries work here: requests are sent without auth.
"""

import http.client
import json
import os
import re
import sys
import traceback
import urllib.error
import urllib.request

API_URL = os.environ.get("FA_API_URL", "https://api.fontawesome.com")
QUERIES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "queries")
USER_AGENT = "fontawesome-agent-tools"
# Seconds to wait for the API to connect or send data before giving up.
TIMEOUT = float(os.environ.get("FA_API_TIMEOUT", "30"))

EXIT_NULL = 1
EXIT_ERROR = 2


class QueryError(Exception):
    pass


def load(name):
    """The text of queries/<name>.graphql."""
    path = os.path.join(QUERIES_DIR, f"{name}.graphql")
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError as e:
        raise QueryError(f"can't read {path}: {e}")


def declared_variables(document):
    """{name: (type, required, has_default)} for each `$name: Type` the document declares."""
    out = {}
    for m in re.finditer(r"\$(\w+)\s*:\s*([\w\[\]!]+)(\s*=)?", document):
        name, type_name, default = m.group(1), m.group(2), m.group(3)
        out[name] = (type_name.strip("[]!"), type_name.endswith("!"), bool(default))
    return out


def coerce(name, type_name, value):
    try:
        if type_name == "Int":
            return int(value)
        if type_name == "Float":
            return float(value)
    except ValueError:
        raise QueryError(f"--{kebab(name)} must be a number, not {value!r}")
    if type_name == "Boolean":
        if value.lower() in ("true", "1", "yes"):
            return True
        if value.lower() in ("false", "0", "no"):
            return False
        raise QueryError(f"--{kebab(name)} must be true or false, not {value!r}")
    return value


def camel(flag):
    return re.sub(r"-(\w)", lambda m: m.group(1).upper(), flag)


def kebab(name):
    return re.sub(r"([A-Z])", lambda m: "-" + m.group(1).lower(), name)


def parse_args(document, argv):
    """Map `--kebab-name value` (or `--kebab-name=value`) to the document's variables."""
    declared = declared_variables(document)
    flags = ", ".join(f"--{kebab(n)}" for n in declared) or "none"
    variables = {}
    args = list(argv)
    while args:
        arg = args.pop(0)
        if not arg.startswith("--"):
            raise QueryError(f"unexpected argument {arg!r}. Options: {flags}")
        flag, eq, value = arg[2:].partition("=")
        name = camel(flag)
        if name not in declared:
            raise QueryError(f"unknown option --{flag}. Options: {flags}")
        if not eq:
            if not args:
                raise QueryError(f"--{flag} needs a value")
            value = args.pop(0)
        variables[name] = coerce(name, declared[name][0], value)
    missing = [n for n, (_, required, has_default) in declared.items() if required and not has_default and n not in variables]
    if missing:
        raise QueryError("missing " + ", ".join(f"--{kebab(n)}" for n in missing))
    return variables


def post(document, variables):
    """POST the query and return the parsed JSON response, errors included."""
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({"query": document, "variables": variables}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            response = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        hint = " (rate limited; wait a minute and try again)" if e.code == 429 else ""
        body = e.read().decode("utf-8", "replace")[:300]
        raise QueryError(f"the Font Awesome API returned HTTP {e.code}{hint}: {body}")
    except urllib.error.URLError as e:
        raise QueryError(f"could not reach the Font Awesome API: {e.reason}")
    except json.JSONDecodeError as e:
        raise QueryError(f"the Font Awesome API returned something other than JSON: {e}")
    except (http.client.HTTPException, OSError) as e:
        # A dropped connection (RemoteDisconnected), a cut-short body
        # (IncompleteRead) or a timeout: urllib raises these as they are.
        raise QueryError(f"the connection to the Font Awesome API failed: {type(e).__name__}: {e}")
    if not isinstance(response, dict):
        raise QueryError(f"the Font Awesome API returned JSON that isn't an object: {json.dumps(response)[:100]}")
    return response


def run_query(name, variables=None):
    """Run queries/<name>.graphql and return its `data`. Raises QueryError on any error."""
    response = post(load(name), variables or {})
    if response.get("errors"):
        raise QueryError(f"the API returned errors: {json.dumps(response['errors'])}")
    return response.get("data") or {}


# latest_release() starts here and walks up one major version at a time.
FIRST_MAJOR = 7
MAX_MAJORS = 20


def latest_release():
    """The latest release, without listing them all.

    "7.x" resolves to the latest 7.x release. If that release is also the
    latest of all (isLatest), it's the answer; otherwise a newer major exists,
    so try "8.x", then "9.x", and so on.
    """
    for major in range(FIRST_MAJOR, FIRST_MAJOR + MAX_MAJORS):
        # Why this major is being checked, for the error message.
        context = "" if major == FIRST_MAJOR else f" ({major - 1}.x isn't the latest release)"
        try:
            release = run_query("latest-version", {"version": f"{major}.x"}).get("release")
        except QueryError as e:
            raise QueryError(f"couldn't resolve {major}.x{context}: {e}")
        if not release:
            raise QueryError(f"{major}.x doesn't resolve to a release{context}")
        if release.get("isLatest"):
            return release["version"]
    raise QueryError(f"no major version from {FIRST_MAJOR} to {FIRST_MAJOR + MAX_MAJORS - 1} is the latest")


def lookup(response, path):
    node = response
    for key in path.split("."):
        if not isinstance(node, dict):
            return None
        node = node.get(key)
    return node


def exit_on_unexpected_error(fn):
    """Exit 2, not Python's 1, if fn raises something unexpected.

    Exit 1 means "not found" (icon-exists.py), so a crash must never exit 1.
    """
    try:
        return fn()
    except SystemExit:
        raise
    except BaseException as e:  # noqa: BLE001
        traceback.print_exc()
        print(f"Error: unexpected {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(EXIT_ERROR)


def main(name, argv=None, require=None, usage=None):
    """Run queries/<name>.graphql with variables from argv, print the response, and exit."""
    exit_on_unexpected_error(lambda: _main(name, argv, require, usage))


def _main(name, argv, require, usage):
    argv = sys.argv[1:] if argv is None else argv
    if any(a in ("-h", "--help") for a in argv):
        print((usage or "").strip() or f"Runs queries/{name}.graphql")
        sys.exit(0)
    try:
        document = load(name)
        response = post(document, parse_args(document, argv))
    except QueryError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(EXIT_ERROR)
    print(json.dumps(response, separators=(",", ":")))
    if response.get("errors"):
        print(f"Error: the API returned errors: {json.dumps(response['errors'])}", file=sys.stderr)
        sys.exit(EXIT_ERROR)
    if require and lookup(response, require) is None:
        print(f"Not found: {require} is null.", file=sys.stderr)
        sys.exit(EXIT_NULL)
