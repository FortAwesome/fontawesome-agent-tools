#!/bin/sh
# Checks whether the font-awesome skill is installed.
# If it isn't, prints the message the user must see (references/missing-font-awesome.md).
#
# Looks next to this skill, both by the path it was run from and by its real
# path (installers such as `npx skills` symlink skills into .claude/skills), then
# in the project's and the user's skill directories.
case "$0" in
  */*) script_dir=${0%/*} ;;
  *) script_dir=. ;;
esac
skill_dir=$(cd "$script_dir/.." && pwd -P)
given_parent=${script_dir%/*}
given_parent=${given_parent%/*}
for candidate in \
  "$given_parent/font-awesome" \
  "$skill_dir/../font-awesome" \
  "./.claude/skills/font-awesome" \
  "${HOME:-/nonexistent}/.claude/skills/font-awesome"
do
  if [ -f "$candidate/SKILL.md" ]; then
    echo "font-awesome skill: installed at $(cd "$candidate" && pwd)"
    exit 0
  fi
done
echo "font-awesome skill: NOT INSTALLED. Message for the user:"
cat "$skill_dir/references/missing-font-awesome.md"
