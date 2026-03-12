# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Claude Code plugin marketplace package (`fontawesome-agent-tools`) by Font Awesome. It provides AI agent tools for integrating Font Awesome icons into projects.

## Architecture

- **`.claude-plugin/manifest.json`** — Top-level marketplace manifest. Declares the package name, owner, and lists all plugins.
- **`plugins/icons/`** — The "icons" plugin. Its config lives at `plugins/icons/.claude-plugin/plugin.json` and points to skills at `.claude/skills/`.
- **`.claude/skills/`** — Skill definitions (SKILL.md files). Currently contains `suggest-icon`, a user-invokable skill that suggests Font Awesome icons for a given concept or use case.

The manifest schema follows `https://anthropic.com/claude-code/marketplace.schema.json`.

## Adding a New Skill

1. Create a directory under `plugins/<plugin-name>/skills/<skill-name>/`.
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`, `user-invokable`, `args`).
3. If it belongs to a new plugin, add the plugin entry to `.claude-plugin/manifest.json` and create its `plugin.json`.
4. Run `bash scripts/deploy-skills.sh` to create the top-level symlink (or let the pre-commit hook handle it).

## Deployment

The top-level `skills/` directory contains symlinks to the canonical skill directories under `plugins/*/skills/*/`. This is required for `npx skills add` to discover skills.

- **`scripts/deploy-skills.sh`** — Creates and maintains these symlinks. It removes stale symlinks, detects naming collisions across plugins, and creates relative symlinks. Idempotent and safe to run repeatedly.
- **`scripts/bump-plugin-versions.sh`** — Detects which plugins have staged changes and increments their patch version in both `plugins/<name>/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Skips plugins whose `plugin.json` is already staged (assumes a manual version bump).
- **`lefthook.yml`** — Configures pre-commit hooks that run `deploy-skills.sh` and `bump-plugin-versions.sh`, auto-staging any modified files. Run `lefthook install` after cloning to activate the hooks.
