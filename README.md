# Font Awesome Agent Tools

An agent skill for working with [Font Awesome](https://fontawesome.com) icons: finding the right icon, checking what your account and kits include, answering questions from the official docs, setting up Font Awesome in a project, and adding icons to your code.

## The `font-awesome` skill

One skill handles everything:

- **Questions:** finding or suggesting icons, whether an icon exists and in which styles, Free vs Pro, your kits and custom icons, versions, official SVGs, and how-to questions answered from the docs.
- **Setup:** picks an integration method (Kit embed, Kit npm package, Kit download, or npm packages), installs it, and writes `.font-awesome.md`.
- **Adding icons:** puts an icon into your code with the right markup, component, or import for your project, and keeps `.font-awesome.md` current.

You don't need to invoke it. Ask in plain language ("what icon should I use for settings?", "list my kits", "set up Font Awesome", "add a cart icon to the header") and your agent loads it. In Claude Code you can also type `/font-awesome <request>`.

## Install

### Claude Code plugin

```
/plugin marketplace add FortAwesome/fontawesome-agent-tools
/plugin install icons@fontawesome-agent-tools
```

### npx skills

```
npx skills add FortAwesome/fontawesome-agent-tools
```

### claude.ai and the Skills API

Upload the [`skills/font-awesome`](skills/font-awesome) directory.

## Requirements

- **The [`fa` CLI](https://docs.fontawesome.com/web/use-with/fa-cli)** (recommended, version 0.8.0 or newer). The skill uses it to search icons, look up your account and kits, and fetch official SVGs. Run `fa login` once for anything involving your account or kits.
- **Python 3** for the fallback scripts used when `fa` isn't installed. They cover catalog lookups and basic kit metadata only.

## `.font-awesome.md`

Setting up Font Awesome or adding an icon writes a `.font-awesome.md` file to your project root recording your integration method, version, license, Kit token, and conventions. The skill reads it to give answers and code that fit your project. Commit it so your whole team benefits.

## Upgrading from 0.0.x

Version 0.1.0 replaces the four skills `add-icon`, `setup-fa`, `suggest-icon`, and `fa-help` with the single `font-awesome` skill. The `/add-icon`, `/setup-fa`, `/suggest-icon`, and `/fa-help` commands are gone: ask in plain language, or type `/font-awesome <request>`.

- **Claude Code plugin:** update as usual (`/plugin marketplace update fontawesome-agent-tools`, then update the `icons` plugin).
- **npx skills:** updating won't add the new skill. Add `font-awesome`, then remove the old skills:

  ```
  npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome
  npx skills remove add-icon setup-fa suggest-icon fa-help
  ```

  Use `--global` on both commands if you installed globally.
- **claude.ai and the Skills API:** upload the `font-awesome` skill and delete `add-icon`, `setup-fa`, `suggest-icon`, and `fa-help`.

See [CHANGELOG.md](CHANGELOG.md) for details.

## Development

Skills live under `plugins/<plugin>/skills/<skill>/`. The top-level `skills/` directory holds symlinks to them so `npx skills` can discover them.

- `bash scripts/deploy-skills.sh` creates and refreshes those symlinks.
- `bash scripts/bump-plugin-versions.sh` bumps the patch version of any plugin with staged changes, once per branch. If a plugin's version already differs from `main`, including a manual minor or major bump, it's left alone.
- `lefthook install` sets up a pre-commit hook that runs both scripts.

See [CLAUDE.md](CLAUDE.md) for the architecture and conventions for extending the skill.
