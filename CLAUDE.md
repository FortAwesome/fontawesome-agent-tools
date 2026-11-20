# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Claude Code plugin marketplace package (`fontawesome-agent-tools`) by Font Awesome. It provides AI agent tools for integrating Font Awesome icons into projects.

## Architecture

- **`.claude-plugin/marketplace.json`** — Top-level marketplace manifest. Declares the package name, owner, and lists all plugins.
- **`plugins/icons/`** — The "icons" plugin. Its config lives at `plugins/icons/.claude-plugin/plugin.json`. It has one skill, **`font-awesome`** (`plugins/icons/skills/font-awesome/`), the single entry point for every Font Awesome question and task. Its broad `description` is what makes Claude load it without the user naming a skill, and `/font-awesome <request>` invokes it directly. It uses progressive disclosure: `SKILL.md` answers common questions and routes everything else to a file under `references/`:
  - `fa-cli.md` (the `fa` CLI command map, auth, and quirks), `suggest-icon.md` (icon suggestions), `docs.md` (answering from docs.fontawesome.com), and `font-awesome-md-format.md`.
  - **Workflows** that change a project's files: `add-icon.md` (add an icon to the user's code) and `setup.md` (set up Font Awesome, with one `setup-path-*.md` per integration method). `SKILL.md` tells Claude to read the whole workflow before touching any file.
  - The fallback `scripts/` (used when the `fa` CLI isn't installed) and `evals/`.

The manifest schema follows `https://anthropic.com/claude-code/marketplace.schema.json`.

## Adding a capability

Prefer extending `font-awesome` over adding a skill. One skill means one description to trigger on, nothing for skills to compete over, and no dependency between skills that users of `npx skills`, claude.ai, or the Skills API could install one at a time.

- **A new kind of question:** add a row to the "Answering common questions" table in `SKILL.md`, pointing to a new or existing reference file.
- **A new workflow that changes project files:** add `references/<workflow>.md` and a row to the "Workflows" table in `SKILL.md`. Make sure the `description` still covers it.
- Put shared CLI guidance in `references/fa-cli.md`. Paths in reference files are relative to the skill directory (`references/…`, `scripts/…`).

`SKILL.md` frontmatter may use only `name`, `description`, `license`, `compatibility`, `metadata`, and `allowed-tools`, the keys every agent platform accepts. Other keys are rejected by at least one platform (claude.ai upload, the Skills API, the Agent Skills validator), even ones Claude Code respects such as `disable-model-invocation`. The `description` decides when an agent loads the skill: keep it to 1,024 characters, since most agent tools truncate past that and terms beyond it don't help trigger the skill. `npm test` enforces these rules.

If you do add a skill, create `plugins/<plugin>/skills/<name>/SKILL.md` and run `bash scripts/deploy-skills.sh` to create the top-level symlink (or let the pre-commit hook handle it). If it belongs to a new plugin, add the plugin to `.claude-plugin/marketplace.json` and create its `plugin.json`.

## Tests

`tests/skills.test.mjs` (Node's built-in test runner) checks every `plugins/*/skills/*/SKILL.md`: frontmatter keys are limited to the set every agent platform accepts, `description` is at most 1,024 characters, every `references/…`, `scripts/…`, and relative Markdown link in the skill's files points to a file that exists, and the skill passes the Agent Skills reference validator. The validator is the Python `skills-ref` command, pinned in `tests/requirements.txt`; the test runs it once per skill. CI runs the tests on every push (`.github/workflows/test.yml`). Run them locally with:

```bash
npm ci
pip install -r tests/requirements.txt   # Python 3.11+, for skills-ref
npm test
```

Without installing `skills-ref`, point `SKILLS_REF` at a command that runs it, e.g. `SKILLS_REF="uvx --python 3.12 --from git+https://github.com/agentskills/agentskills.git@83021e2be457a9b6679148719c1f6074f0ad975e#subdirectory=skills-ref skills-ref" npm test`.

## Deployment

The top-level `skills/` directory contains symlinks to the canonical skill directories under `plugins/*/skills/*/`. This is required for `npx skills add` to discover skills.

- **`scripts/deploy-skills.sh`** — Creates and maintains these symlinks. It removes stale symlinks, detects naming collisions across plugins, and creates relative symlinks. Idempotent and safe to run repeatedly.
- **`scripts/bump-plugin-versions.sh`** — Detects which plugins have staged changes and increments their patch version in both `plugins/<name>/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, at most once per branch. It compares each plugin's version with its version where the branch left `main` (or `origin/main`; override with `BUMP_BASE`) and skips the plugin if they already differ. Commits made directly on `main` are bumped every time.
- **`lefthook.yml`** — Configures pre-commit hooks that run `deploy-skills.sh` and `bump-plugin-versions.sh`, auto-staging any modified files. Run `lefthook install` after cloning to activate the hooks.

## Versioning

The `icons` plugin is pre-1.0. The pre-commit hook bumps the patch version once per branch, so a branch ships as one release however many commits it has. For a breaking change (a new required skill, moved shared files, a removed or renamed skill or command), bump the minor version by hand in both `plugins/icons/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` at any point on the branch; the hook sees the version already differs from `main` and leaves it alone. Add an entry to `CHANGELOG.md` with upgrade steps for each install channel.
