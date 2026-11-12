# Font Awesome Agent Tools

Agent skills for working with [Font Awesome](https://fontawesome.com) icons: finding the right icon, checking what your account and kits include, answering questions from the official docs, setting up Font Awesome in a project, and adding icons to your code.

## Skills

| Skill | What it does |
|---|---|
| `font-awesome` | The main skill. Answers any Font Awesome question: finding or suggesting icons, whether an icon exists and in which styles, Free vs Pro, your kits and custom icons, versions, official SVGs, and how-to questions from the docs. **The other skills depend on it.** |
| `add-icon` | Adds an icon to your code, using the right markup, component, or import for your project, and keeps `.font-awesome.md` current. |
| `setup-fa` | Sets up Font Awesome in a project: picks an integration method (Kit embed, Kit npm package, Kit download, or npm packages), installs it, and writes `.font-awesome.md`. |
| `suggest-icon` | The `/suggest-icon` command in Claude Code. Runs the `font-awesome` skill's icon suggestions. |
| `fa-help` | The `/fa-help` command in Claude Code. Answers a question with the `font-awesome` skill. |

You don't need to name a skill. Ask in plain language ("what icon should I use for settings?", "list my kits", "add a cart icon to the header") and Claude picks the right one.

## Install

Install all the skills. If you install only some, always include `font-awesome`, since the others rely on it.

### Claude Code plugin

```
/plugin marketplace add FortAwesome/fontawesome-agent-tools
/plugin install icons@fontawesome-agent-tools
```

### npx skills

```
npx skills add FortAwesome/fontawesome-agent-tools
```

To add a single skill later, pass `--skill <name>`, for example `--skill font-awesome`.

### claude.ai and the Skills API

Upload each skill directory from [`skills/`](skills/), starting with `font-awesome`. `suggest-icon` and `fa-help` exist only to provide Claude Code slash commands, so you can skip them here; ask your question directly and the `font-awesome` skill handles it.

## Requirements

- **The [`fa` CLI](https://docs.fontawesome.com/web/use-with/fa-cli)** (recommended, version 0.8.0 or newer). The skills use it to search icons, look up your account and kits, and fetch official SVGs. Run `fa login` once for anything involving your account or kits.
- **Python 3** for the fallback scripts used when `fa` isn't installed. They cover catalog lookups and basic kit metadata only.

## `.font-awesome.md`

`setup-fa` and `add-icon` write a `.font-awesome.md` file to your project root recording your integration method, version, license, Kit token, and conventions. The skills read it to give answers and code that fit your project. Commit it so your whole team benefits.

## Upgrading from 0.0.x

Version 0.1.0 adds the `font-awesome` skill and moves the shared guidance, scripts, and `.font-awesome.md` format into it. `add-icon`, `setup-fa`, `/suggest-icon`, and `/fa-help` now depend on it.

- **Claude Code plugin:** update as usual (`/plugin marketplace update fontawesome-agent-tools`, then update the `icons` plugin). The new skill comes with it.
- **npx skills:** updating your existing skills won't add a new one. Install it explicitly:

  ```
  npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome
  ```

- **claude.ai and the Skills API:** upload the `font-awesome` skill, then re-upload the others.

If a skill can't find `font-awesome`, it tells you how to install it and carries on with reduced checks.

See [CHANGELOG.md](CHANGELOG.md) for details.

## Development

Skills live under `plugins/<plugin>/skills/<skill>/`. The top-level `skills/` directory holds symlinks to them so `npx skills` can discover them.

- `bash scripts/deploy-skills.sh` creates and refreshes those symlinks.
- `bash scripts/bump-plugin-versions.sh` bumps the patch version of any plugin with staged changes. It skips a plugin whose `plugin.json` is already staged, so stage a manual bump for minor or major releases.
- `lefthook install` sets up a pre-commit hook that runs both scripts.

See [CLAUDE.md](CLAUDE.md) for the architecture and conventions for adding skills.
