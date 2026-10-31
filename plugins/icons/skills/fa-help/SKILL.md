---
name: fa-help
description: Answer Font Awesome questions using the official documentation.
disable-model-invocation: true
---

This is the `/fa-help` command. It's kept so the command still works; the guidance itself lives in the `font-awesome` skill, a sibling directory of this one (`../font-awesome/`).

## Inputs

- **question** (required): a question about Font Awesome (setup, styling, troubleshooting, APIs, upgrading, the user's kits, and so on). It's whatever the user typed after `/fa-help`. If they typed nothing, ask what they'd like to know.

## Steps

1. Read `../font-awesome/SKILL.md` for the tools, the user's context, and the ground rules.
2. Answer the question the way that skill directs. Conceptual questions go through `../font-awesome/references/docs.md`. Questions about the user's account, kits, or specific icons use the `fa` CLI.

If `../font-awesome/` doesn't exist, the `font-awesome` skill isn't installed. Tell the user that `/fa-help` now depends on it and that reinstalling the Font Awesome skills will add it.
