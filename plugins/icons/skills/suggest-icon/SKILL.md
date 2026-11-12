---
name: suggest-icon
description: Suggest a Font Awesome icon for a particular situation, noun, verb, or concept.
disable-model-invocation: true
---

This is the `/suggest-icon` command. It's kept so the command still works. Since version 0.1.0 of the Font Awesome agent tools, the guidance itself lives in the `font-awesome` skill. That skill is normally installed next to this one, at `../font-awesome/` relative to this skill's base directory. If it's installed somewhere else, use that location instead.

## Inputs

- **use-case** (required): the concept, situation, noun, verb, or idea that needs an icon. It's whatever the user typed after `/suggest-icon`. If they typed nothing, ask what the icon is for.

## Steps

1. Check that `../font-awesome/SKILL.md` exists. If it doesn't, and the `font-awesome` skill isn't available anywhere else in this session, skip to "If the `font-awesome` skill is missing" below.
2. Read `../font-awesome/SKILL.md` for the tools, the user's context, and the ground rules.
3. Follow `../font-awesome/references/suggest-icon.md` with the use-case as the concept.

## If the `font-awesome` skill is missing

Tell the user:

> `/suggest-icon` now uses the `font-awesome` skill, which isn't installed. It was added in version 0.1.0 of the Font Awesome agent tools and gives better suggestions: it checks your kits, your license, and the exact Font Awesome version you use. To install it:
>
> - npx skills: `npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome`
> - Claude Code plugin: `/plugin marketplace update fontawesome-agent-tools`, then update the `icons` plugin from `/plugin`
> - claude.ai or the Skills API: upload the `font-awesome` skill from https://github.com/FortAwesome/fontawesome-agent-tools
>
> Here's a basic suggestion in the meantime.

Then give a basic answer:

- **If `fa` is installed** (`command -v fa`): use the version in `.font-awesome.md` if the project has one, else the latest from `fa releases` (the entry with `isLatest: true`). Run `fa search --version <version> --query <use-case> --page-size 10`. If `.font-awesome.md` records a Kit token, run `fa search --kit-token <TOKEN> --query <use-case> --page-size 10` instead, so every suggestion is in the Kit. That needs the user to be logged in; if it fails with an auth error, ask them to run `fa login` in a separate terminal. List the best few icon names, and use `familyStylesByLicense` to mark each as Free or Pro.
- **If `fa` isn't installed:** suggest a few icon names from your own knowledge, say plainly that you couldn't verify them, and link https://fontawesome.com/search?q=<use-case> so the user can check.

Don't produce SVG markup from memory.
