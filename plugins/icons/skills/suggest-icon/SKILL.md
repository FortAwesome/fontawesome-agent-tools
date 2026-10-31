---
name: suggest-icon
description: Suggest a Font Awesome icon for a particular situation, noun, verb, or concept.
disable-model-invocation: true
---

This is the `/suggest-icon` command. It's kept so the command still works; the guidance itself lives in the `font-awesome` skill, a sibling directory of this one (`../font-awesome/`).

## Inputs

- **use-case** (required): the concept, situation, noun, verb, or idea that needs an icon. It's whatever the user typed after `/suggest-icon`. If they typed nothing, ask what the icon is for.

## Steps

1. Read `../font-awesome/SKILL.md` for the tools, the user's context, and the ground rules.
2. Follow `../font-awesome/references/suggest-icon.md` with the use-case as the concept.

If `../font-awesome/` doesn't exist, the `font-awesome` skill isn't installed. Tell the user that `/suggest-icon` now depends on it and that reinstalling the Font Awesome skills will add it.
