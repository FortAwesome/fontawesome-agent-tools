# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Claude Code plugin marketplace package (`fontawesome-agent-tools`) by Font Awesome. It provides AI agent tools for integrating Font Awesome icons into projects.

## Architecture

- **`.claude-plugin/marketplace.json`** — Top-level marketplace manifest. Declares the package name, owner, and lists all plugins.
- **`plugins/icons/`** — The "icons" plugin. Its config lives at `plugins/icons/.claude-plugin/plugin.json`; its skills live under `plugins/icons/skills/`:
  - **`font-awesome`** — The hub skill and the single entry point for any Font Awesome question or action (finding icons, kits, custom icons, entitlements, versions, docs). Its broad `description` is what makes Claude load it without the user naming a skill. It owns all shared material: `references/fa-cli.md` (the `fa` CLI command map, auth, and quirks), `references/suggest-icon.md` (icon suggestion workflow), `references/docs.md` (answering from docs.fontawesome.com), `references/font-awesome-md-format.md`, the fallback `scripts/`, and `evals/`.
  - **`add-icon`** and **`setup-fa`** — Workflow skills for jobs that change a project's files. Their descriptions are deliberately narrow so they don't compete with the hub on questions, and they reference the hub's shared material via `../font-awesome/...` paths rather than duplicating it.
  - **`suggest-icon`** and **`fa-help`** — Thin aliases kept so the existing `/suggest-icon` and `/fa-help` commands keep working. They set `disable-model-invocation: true`, so Claude never loads them on its own and they don't compete with the hub; they only run when typed. Their bodies just point at the hub's references. Don't remove them, since that would break the commands for existing users.

The manifest schema follows `https://anthropic.com/claude-code/marketplace.schema.json`.

## Adding a New Skill

1. Create a directory under `plugins/<plugin-name>/skills/<skill-name>/`.
2. Add a `SKILL.md` with YAML frontmatter containing only `name` and `description`. Other tools that install these skills (claude.ai upload, the Skills API) reject unknown keys, and Claude Code ignores ones it doesn't recognize. Document inputs in an "Inputs" section of the body instead. The one exception is `disable-model-invocation: true` on command-only aliases (see `suggest-icon` and `fa-help`). The `description` decides when Claude loads the skill, so say what the skill is for and when to use it, and keep it under 1,536 characters.
   - Prefer extending the `font-awesome` hub (a new reference file plus a row in its "Answering common questions" table) over adding a new skill. Add a separate skill only for a multi-step workflow that changes project files.
   - Put shared CLI guidance in `font-awesome/references/fa-cli.md`, not in individual skills.
3. If it belongs to a new plugin, add the plugin entry to `.claude-plugin/marketplace.json` and create its `plugin.json`.
4. If the skill reads anything from `../font-awesome/`, give it a "Requires the `font-awesome` skill" check like the one in `add-icon`. Users of `npx skills`, claude.ai, and the Skills API can install skills one at a time, so the skill must check that `font-awesome` is present, tell the user how to install it, and continue in a reduced mode. In any text a user might see, call it the `font-awesome` skill, never "the hub".
5. Run `bash scripts/deploy-skills.sh` to create the top-level symlink (or let the pre-commit hook handle it).

## Deployment

The top-level `skills/` directory contains symlinks to the canonical skill directories under `plugins/*/skills/*/`. This is required for `npx skills add` to discover skills.

- **`scripts/deploy-skills.sh`** — Creates and maintains these symlinks. It removes stale symlinks, detects naming collisions across plugins, and creates relative symlinks. Idempotent and safe to run repeatedly.
- **`scripts/bump-plugin-versions.sh`** — Detects which plugins have staged changes and increments their patch version in both `plugins/<name>/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Skips plugins whose `plugin.json` is already staged (assumes a manual version bump).
- **`lefthook.yml`** — Configures pre-commit hooks that run `deploy-skills.sh` and `bump-plugin-versions.sh`, auto-staging any modified files. Run `lefthook install` after cloning to activate the hooks.

## Versioning

The `icons` plugin is pre-1.0. The pre-commit hook bumps the patch version automatically. For a breaking change (a new required skill, moved shared files, a removed or renamed skill or command), bump the minor version by hand in both `plugins/icons/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, stage `plugin.json` so the hook skips it, and add an entry to `CHANGELOG.md` with upgrade steps for each install channel.
