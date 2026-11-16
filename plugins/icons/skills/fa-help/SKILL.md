---
name: fa-help
description: Answer Font Awesome questions using the official documentation.
disable-model-invocation: true
---

This is the `/fa-help` command. It's kept so the command still works. Since version 0.1.0 of the Font Awesome agent tools, the guidance itself lives in the `font-awesome` skill. That skill is normally installed next to this one, at `../font-awesome/` relative to this skill's base directory. If it's installed somewhere else, use that location instead.

## Inputs

- **question** (required): a question about Font Awesome (setup, styling, troubleshooting, APIs, upgrading, the user's kits, and so on). It's whatever the user typed after `/fa-help`. If they typed nothing, ask what they'd like to know.

## Steps

1. Check that `../font-awesome/SKILL.md` exists. If it doesn't, and the `font-awesome` skill isn't available anywhere else in this session, skip to "If the `font-awesome` skill is missing" below.
2. Read `../font-awesome/SKILL.md` for the tools, the user's context, and the ground rules.
3. Answer the question the way that skill directs. Conceptual questions go through `../font-awesome/references/docs.md`. Questions about the user's account, kits, or specific icons use the `fa` CLI.

## If the `font-awesome` skill is missing

Tell the user this message. Show it word for word, as the first thing in your reply. Don't shorten or reword it, and keep all three install lines.

> `/fa-help` now uses the `font-awesome` skill, which isn't installed. It was added in version 0.1.0 of the Font Awesome agent tools and can also answer questions about your account, kits, and specific icons. To install it:
>
> - npx skills: `npx skills add FortAwesome/fontawesome-agent-tools --skill font-awesome`
> - Claude Code plugin: `/plugin marketplace update fontawesome-agent-tools`, then update the `icons` plugin from `/plugin`
> - claude.ai or the Skills API: upload the `font-awesome` skill from https://github.com/FortAwesome/fontawesome-agent-tools
>
> I'll answer from the Font Awesome docs in the meantime.

Then answer from the official docs:

1. Fetch the index at `https://docs.fontawesome.com/llms.txt`. It lists every docs page; each is a Markdown file with a descriptive path (e.g. `/web/setup/use-kit.md`).
2. Fetch the most relevant page or pages, at most three.
3. Answer directly, with code examples from the docs. If the project has a `.font-awesome.md`, tailor the answer to its integration method, version, and license. If the docs don't cover the question, say so rather than guessing.
4. Cite the pages at the end, with `.md` removed from the URL, e.g. `Source: [Use a Kit](https://docs.fontawesome.com/web/setup/use-kit)`.

If the question is about the user's own account or kits and `fa` is installed, use `fa whoami`, `fa entitlements`, or `fa kits` (each needs the user to be logged in; if not, ask them to run `fa login` in a separate terminal). Summarize the output rather than showing raw JSON.
