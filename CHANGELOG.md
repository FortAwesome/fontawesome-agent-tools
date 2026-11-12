# Changelog

Versions refer to the `icons` plugin. While the version is below 1.0.0, a minor bump (0.x.0) signals a breaking change.

## 0.1.0

### Breaking

- **New required skill: `font-awesome`.** `add-icon`, `setup-fa`, `/suggest-icon`, and `/fa-help` now depend on it. Claude Code plugin users get it automatically when they update. If you installed with `npx skills`, updating won't add it, so install it explicitly:

  ```
  npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome
  ```

  On claude.ai or the Skills API, upload the `font-awesome` skill.
- **Shared files moved into `font-awesome`.** The fallback scripts (`latest-version.py`, `icon-exists.py`, `search.py`, `fetch-kit.py`) and `font-awesome-md-format.md` moved from `suggest-icon/` and `add-icon/` to `font-awesome/scripts/` and `font-awesome/references/`.
- **`suggest-icon` and `fa-help` are now commands only.** Claude no longer loads them on its own; the `font-awesome` skill handles those questions instead. Typing `/suggest-icon` or `/fa-help` still works.

### Added

- **`font-awesome` skill.** A single place for any Font Awesome question: icon search and suggestions, availability by family and style, Free vs Pro entitlements, your kits and their contents, custom icons and their SVGs, releases, official SVG markup, and answers from the docs. You can ask in plain language without naming a skill.
- **Clear messages when `font-awesome` is missing.** Each skill that depends on it checks for it, tells you how to install it, and continues with reduced checks rather than failing.

### Changed

- `add-icon` and `setup-fa` have narrower descriptions, so Claude uses them only when you want to change your project's files.

## 0.0.9 and earlier

- `suggest-icon`: suggest icons for a concept, with Kit subset awareness.
- `add-icon`: add icons to project code and keep `.font-awesome.md` current.
- `setup-fa`: set up Font Awesome in a project.
- `fa-help`: answer questions from the official docs.
