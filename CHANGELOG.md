# Changelog

Versions refer to the `icons` plugin. While the version is below 1.0.0, a minor bump (0.x.0) signals a breaking change.

## 0.1.0

### Breaking

- **One skill: `font-awesome`.** It replaces `add-icon`, `setup-fa`, `suggest-icon`, and `fa-help`, which are removed. It answers any Font Awesome question, sets up Font Awesome in a project, and adds icons to your code. Their guidance, scripts, and the `.font-awesome.md` format now live in it.
- **The `/add-icon`, `/setup-fa`, `/suggest-icon`, and `/fa-help` commands are gone.** Ask in plain language ("add a cart icon to the header", "set up Font Awesome", "what icon should I use for settings?"), or type `/font-awesome <request>` in Claude Code.

Upgrade steps:

- **Claude Code plugin:** update the `icons` plugin. The old skills are replaced automatically.
- **npx skills:** `npx skills update` won't add the new skill, and it keeps the four old ones (it warns that they were deleted upstream). Add the new skill, then remove the old ones (add `--global` to both if you installed globally):

  ```
  npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome
  npx skills remove add-icon setup-fa suggest-icon fa-help
  ```

- **claude.ai or the Skills API:** upload the `font-awesome` skill and delete the four old ones.

### Added

- **`font-awesome` skill.** A single place for anything Font Awesome: icon search and suggestions, availability by family and style, Free vs Pro entitlements, your kits and their contents, custom icons and their SVGs, releases, official SVG markup, answers from the docs, setting up Font Awesome, and adding icons to your code. You can ask in plain language without naming a skill.

### Changed

- **Fallback scripts (no `fa` CLI):** the catalog lookups are GraphQL documents in `queries/`, run by `scripts/query_runner.py` through the same `scripts/*.py` commands, and print the API's JSON. `latest-version.py` prints just the latest version, found by resolving `7.x` (then `8.x`, …) rather than listing every release. `search.py` and `icon-exists.py` output pipes into `summarize-icons.py`. `icon-exists.py` exits 2 when the check fails, rather than 1 ("doesn't exist"). New `resolve-version.py` resolves a symbolic kit version such as `7.x`.
- **`fetch-kit.py` no longer guesses a kit's families.** Without `fa` it can't see them, so it says so and lists what the kit's license allows, from the API, as an assumption. Its version is the release the kit serves now; the kit JS doesn't say whether the kit follows a major version such as `7.x`.
- **Kit versions such as `7.x` are resolved fresh** each time, and `.font-awesome.md` records the kit's version as set, not the release it resolved to, and no families for a kit.

## 0.0.9 and earlier

- `suggest-icon`: suggest icons for a concept, with Kit subset awareness.
- `add-icon`: add icons to project code and keep `.font-awesome.md` current.
- `setup-fa`: set up Font Awesome in a project.
- `fa-help`: answer questions from the official docs.
