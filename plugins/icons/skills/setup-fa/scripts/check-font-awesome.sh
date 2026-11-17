#!/bin/sh
# Checks whether the font-awesome skill is installed next to this skill.
# If it isn't, prints the message the user must see (references/missing-font-awesome.md).
skill_dir=$(cd "$(dirname "$0")/.." && pwd)
if [ -f "$skill_dir/../font-awesome/SKILL.md" ]; then
  echo "font-awesome skill: installed at $(cd "$skill_dir/../font-awesome" && pwd)"
else
  echo "font-awesome skill: NOT INSTALLED. Message for the user:"
  cat "$skill_dir/references/missing-font-awesome.md"
fi
