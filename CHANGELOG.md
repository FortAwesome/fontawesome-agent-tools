# Changelog

Versions refer to the `icons` plugin. While the version is below 1.0.0, a minor bump (0.x.0) signals a breaking change.

## 0.1.0

### Breaking

- **One skill: `font-awesome`.** It replaces `add-icon`, `setup-fa`, `suggest-icon`, and `fa-help`, which are removed. It answers any Font Awesome question, sets up Font Awesome in a project, and adds icons to your code. Their guidance, scripts, and the `.font-awesome.md` format now live in it.
- **The `/add-icon`, `/setup-fa`, `/suggest-icon`, and `/fa-help` commands are gone.** Ask in plain language ("add a cart icon to the header", "set up Font Awesome", "what icon should I use for settings?"), or type `/font-awesome <request>` in Claude Code.

Upgrade steps:

- **Claude Code plugin:** update the `icons` plugin. The old skills are replaced automatically.
- **npx skills:** updating won't add the new skill. Add it, then remove the old ones (add `--global` to both if you installed globally):

  ```
  npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome
  npx skills remove add-icon setup-fa suggest-icon fa-help
  ```

- **claude.ai or the Skills API:** upload the `font-awesome` skill and delete the four old ones.

### Added

- **`font-awesome` skill.** A single place for anything Font Awesome: icon search and suggestions, availability by family and style, Free vs Pro entitlements, your kits and their contents, custom icons and their SVGs, releases, official SVG markup, answers from the docs, setting up Font Awesome, and adding icons to your code. You can ask in plain language without naming a skill.

## 0.0.9 and earlier

- `suggest-icon`: suggest icons for a concept, with Kit subset awareness.
- `add-icon`: add icons to project code and keep `.font-awesome.md` current.
- `setup-fa`: set up Font Awesome in a project.
- `fa-help`: answer questions from the official docs.
