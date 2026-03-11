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

1. Create a directory under `.claude/skills/<skill-name>/`.
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`, `user-invokable`, `args`).
3. If it belongs to a new plugin, add the plugin entry to `.claude-plugin/manifest.json` and create its `plugin.json`.
