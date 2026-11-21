#!/usr/bin/env bash
#
# bump-plugin-versions.sh — Increment the patch version of any plugin
# that has staged changes, at most once per branch. Updates both the
# plugin's plugin.json and the top-level .claude-plugin/marketplace.json
# to keep them in sync.
#
# A plugin is bumped only if its version still matches the version at the
# point where this branch left the base branch (main, or origin/main). If
# the version already differs, whether from an earlier commit on this
# branch or a manual bump for a minor or major release, it is left alone.
# Commits made directly on the base branch are bumped every time.
#
# Usage:  bash scripts/bump-plugin-versions.sh
#         BUMP_BASE=<ref> bash scripts/bump-plugin-versions.sh   # other base
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MARKETPLACE="$REPO_ROOT/.claude-plugin/marketplace.json"

# ── Determine which plugins have staged changes ─────────────────────────────
staged_files="$(git -C "$REPO_ROOT" diff --cached --name-only)"

# ── Find where this branch left the base branch ─────────────────────────────
base_commit=""
for ref in ${BUMP_BASE:-main origin/main}; do
  if base_commit="$(git -C "$REPO_ROOT" merge-base HEAD "$ref" 2>/dev/null)"; then
    break
  fi
  base_commit=""
done
if [ -z "$base_commit" ]; then
  echo "bump-plugin-versions: no base branch found; skipping a plugin only if its plugin.json is staged"
fi

bumped=0

for plugin_dir in "$REPO_ROOT"/plugins/*/; do
  [ -d "$plugin_dir" ] || continue

  plugin_name="$(basename "$plugin_dir")"
  plugin_json="$plugin_dir.claude-plugin/plugin.json"

  [ -f "$plugin_json" ] || continue

  # Check if any staged file falls under this plugin's directory
  has_changes=false
  while IFS= read -r file; do
    case "$file" in
      plugins/"$plugin_name"/*) has_changes=true; break ;;
    esac
  done <<< "$staged_files"

  "$has_changes" || continue

  # ── Read current version ─────────────────────────────────────────────────
  current_version="$(python3 -c "
import json, sys
with open('$plugin_json') as f:
    print(json.load(f)['version'])
")"

  # ── Skip if this branch already changed the version ──────────────────────
  if [ -n "$base_commit" ]; then
    base_version="$(git -C "$REPO_ROOT" show "$base_commit:plugins/$plugin_name/.claude-plugin/plugin.json" 2>/dev/null \
      | python3 -c "import json, sys; print(json.load(sys.stdin)['version'])" 2>/dev/null || true)"
    if [ -z "$base_version" ]; then
      echo "skip: $plugin_name (new plugin since the base branch)"
      continue
    fi
    if [ "$current_version" != "$base_version" ]; then
      echo "skip: $plugin_name (already bumped on this branch: $base_version -> $current_version)"
      continue
    fi
  elif echo "$staged_files" | grep -q "^plugins/${plugin_name}/.claude-plugin/plugin.json$"; then
    echo "skip: $plugin_name (plugin.json already staged — assuming manual version bump)"
    continue
  fi

  # ── Bump patch ───────────────────────────────────────────────────────────

  IFS='.' read -r major minor patch <<< "$current_version"
  new_version="${major}.${minor}.$((patch + 1))"

  # ── Update plugin.json ───────────────────────────────────────────────────
  python3 -c "
import json
path = '$plugin_json'
with open(path) as f:
    data = json.load(f)
data['version'] = '$new_version'
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  # ── Update marketplace.json ──────────────────────────────────────────────
  python3 -c "
import json, sys
path = '$MARKETPLACE'
with open(path) as f:
    data = json.load(f)
found = False
for plugin in data.get('plugins', []):
    if plugin['name'] == '$plugin_name':
        plugin['version'] = '$new_version'
        found = True
        break
if not found:
    print('WARNING: plugin \"$plugin_name\" not found in marketplace.json', file=sys.stderr)
    sys.exit(0)
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  echo "bumped: $plugin_name $current_version -> $new_version"
  bumped=$((bumped + 1))
done

if [ "$bumped" -eq 0 ]; then
  echo "bump-plugin-versions: no plugins needed a version bump"
else
  echo ""
  echo "bump-plugin-versions: $bumped plugin(s) bumped"
fi
