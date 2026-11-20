---
name: fa-help
description: Answer Font Awesome questions using the official documentation.
---

This is the `/fa-help` command. It's kept so the command still works. Since version 0.1.0 of the Font Awesome agent tools, the guidance itself lives in the `font-awesome` skill. That skill is normally installed next to this one, at `../font-awesome/` relative to this skill's base directory. If it's installed somewhere else, use that location instead.

## Inputs

- **question** (required): a question about Font Awesome (setup, styling, troubleshooting, APIs, upgrading, the user's kits, and so on). It's whatever the user typed after `/fa-help`. If they typed nothing, ask what they'd like to know.

## Steps

1. Check for the `font-awesome` skill:

   ```
   sh <this skill's base directory>/scripts/check-font-awesome.sh
   ```

   If it prints `NOT INSTALLED` and a message, and the `font-awesome` skill isn't in your list of available skills either, go to "If the `font-awesome` skill is missing" below.
2. Read `../font-awesome/SKILL.md` for the tools, the user's context, and the ground rules.
3. Answer the question the way that skill directs. Conceptual questions go through `../font-awesome/references/docs.md`. Questions about the user's account, kits, or specific icons use the `fa` CLI.

## If the `font-awesome` skill is missing

The check script printed a message for the user (it's also in `references/missing-font-awesome.md`). Your reply must start with that message, word for word, before anything else. Show it even though you can still answer without the skill: it's how the user finds out what to install. It's short on purpose, so don't drop or reword it, and don't explain why you're showing it.

For example, for "how do I change an icon's color?":

> Note: the `font-awesome` skill, which `/fa-help` now uses, isn't installed. … I'll answer from the Font Awesome docs in the meantime.
>
> Set the CSS `color` on the icon or its parent. …

Then answer from the official docs:

1. Fetch the index at `https://docs.fontawesome.com/llms.txt`. It lists every docs page; each is a Markdown file with a descriptive path (e.g. `/web/setup/use-kit.md`).
2. Fetch the most relevant page or pages, at most three.
3. Answer directly, with code examples from the docs. If the project has a `.font-awesome.md`, tailor the answer to its integration method, version, and license. If the docs don't cover the question, say so rather than guessing.
4. Cite the pages at the end, with `.md` removed from the URL, e.g. `Source: [Use a Kit](https://docs.fontawesome.com/web/setup/use-kit)`.

If the question is about the user's own account or kits and `fa` is installed, use `fa whoami`, `fa entitlements`, or `fa kits` (each needs the user to be logged in; if not, ask them to run `fa login` in a separate terminal). Summarize the output rather than showing raw JSON.

## Before you finish

If the check script printed `NOT INSTALLED`, check that your reply starts with its message, word for word.
