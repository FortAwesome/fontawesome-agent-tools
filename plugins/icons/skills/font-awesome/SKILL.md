---
name: font-awesome
description: >-
  Font Awesome knowledge and tooling through the `fa` CLI and the official docs.
  Use for ANY question or action involving Font Awesome: finding, searching for,
  or suggesting icons; checking whether an icon exists or which families and
  styles it comes in; Free vs Pro and what the user's account is entitled to;
  the user's kits, what a kit contains, kit subsets and family-styles; custom
  (uploaded) icons and their SVGs; releases and versions; official SVG markup,
  including any request for an icon's SVG (even "from memory"); and how-to
  questions about setup, styling, troubleshooting, and upgrading, such as "how
  do I set up Font Awesome with Vue?".
  Includes questions phrased about the user, such as "what vampire icons can I
  use?", "list my kits", "show my custom icons", "which of my kits has bat?",
  or "am I on Pro?". To put an icon into project code, use add-icon instead.
---

This is the entry point for anything Font Awesome. Answer the question directly using the tools below; there is no need for the user to pick a narrower skill. Hand off to a workflow skill only when the job is a multi-step change to a project (see "Workflows").

Your own knowledge of Font Awesome is probably stale or invalid for a particular user's kit. Icon names change between versions, new families ship, and kits are per-user and may include only a subset of icons. Verify against the API before stating facts.

## Tools

The `fa` CLI is the primary tool. It returns JSON and covers the catalog, the user's account, and their kits. Read [references/fa-cli.md](references/fa-cli.md) for the command map, auth, output shapes, and known quirks before your first `fa` call in a conversation.

- Run `command -v fa` once. If it's missing, the Python scripts in `scripts/` (relative to this skill's directory) cover catalog lookups and a kit's basic metadata (version, license, families via `fetch-kit.py`), but not account data, searching within a kit, or custom icons. **Whenever `fa` is missing, end your answer by suggesting the user install it, with this link:** https://docs.fontawesome.com/web/use-with/fa-cli. Say what it would add (their account, kits, and official SVGs).
- **The CLI documents itself and is newer than your training data.** Before falling back to anything heavier (downloading a kit, scraping a page, writing a script), run `fa <command> --help` on the command you're already using and look for a flag that does the job. If no command fits, `fa query` runs any GraphQL query against the Font Awesome API.
- For conceptual questions (setup, styling, frameworks, troubleshooting, upgrading), the official docs are authoritative. See [references/docs.md](references/docs.md).

## Who is "I"? Resolve the user's context

Many questions are about the user: "what can I use", "my kits", "do I have". Work out which context applies before answering, cheapest source first:

1. **A project.** If the working directory has a `.font-awesome.md` (format in [references/font-awesome-md-format.md](references/font-awesome-md-format.md)), it records the version, license, families, and possibly a Kit token. A Kit token means the project can only use what that kit contains, so scope every answer to it.
2. **The account.** With no project config, "I" means the logged-in account:
   - `fa whoami`: who they are, and whether kit and account commands will work.
   - `fa entitlements`: which Icon Collection they own (Free, Pro, Pro+). This decides which icons they can use at all.
   - `fa kits`: every kit, with version, license, subset type, technology, and custom icons.
3. **Neither.** If not logged in and no project config, answer from the public catalog for the latest release and say that's what you did. Suggest `fa login` (run in a separate terminal) for answers about their own account, but only once you know they aren't authenticated (see the ground rules).

Don't do all of this for every question. "Is there a bat icon?" needs only the catalog to find the icon. "Can I use the bat icon?" needs entitlements, and if they have kits, which kits contain it.

**Before saying anything about Pro or subscriptions, know the license.** If your answer includes a Pro icon, style or family and the user is authenticated (`FA_API_TOKEN` is set or `fa whoami` succeeds), run `fa entitlements` first, even for a plain "is there an X icon?" question. A Pro user should hear that they can use it, not that they need to buy it.

## Answering common questions

| Question shape | Approach |
|---|---|
| "Is there an icon for X?" / "What icons can I use for X?" | Follow [references/suggest-icon.md](references/suggest-icon.md). Scope to a kit when the project or the user names one. For "can I use", also check entitlements, and if they have "By Icon" kits, say which ones actually contain the icon. |
| "Is there an X icon?" / "Does icon X exist / which styles?" | Fuzzy search, not an exact-name lookup: `fa search --version <v> --query <X> --page-size 10`. Without `fa`, use `scripts/search.py`, then `scripts/icon-exists.py` on the exact match to get its families and styles. Pipe the results through `scripts/summarize-icons.py` to read them compactly (see `fa-cli.md`). If a result's `id` exactly matches X, lead with it: whether it's Free or Pro, and its families and styles from `familyStylesByLicense` (a count of family-styles is enough). Then list the closest other matches. If nothing matches exactly, say so, then give the closest matches. |
| "List my kits" / "which kits have X?" | `fa kits` for the list. For membership, `fa kit icon --kit-token <t> <icon>` per kit, or `fa search --kit-token <t> --query <icon>`. |
| "Show / preview my custom icons" | `fa kit show --kit-token <t> --svg-format html`. One call returns the names, unicodes, and SVG markup. To search uploads by name, `fa search --kit-token <t> --query <q> --custom`. |
| "Give me the SVG for X" | `fa icons --version <v> --name <icon> --svg-format html --svg-family-style <family>,<style>`. Never write SVG path data from memory. |
| "Am I on Pro?" / "What do I have access to?" | `fa entitlements`, plus license per kit from `fa kits`. |
| "What's the latest version?" | `fa releases` (the entry with `isLatest: true`). |
| "What families / styles exist?" | `fa family-styles --version <v>`. For a kit, `fa kit family-styles --kit-token <t>`. |
| How-to, setup concepts, troubleshooting | [references/docs.md](references/docs.md) |

When showing icons visually, render the SVG markup the API returned; don't redraw it.

## Workflows

Two jobs change a project's files and have their own skills with step-by-step procedures. Load them when the user asks for that change, not for questions about it.

- **`add-icon`**: put an icon into the user's code (it resolves the integration method, writes the right markup or import, and keeps `.font-awesome.md` current).
- **`setup-fa`**: set up Font Awesome in a project from scratch (pick an integration method, install, and write `.font-awesome.md`).

After answering a question about an icon, offer to add it to their code if they're working in a project.

## Ground rules

- **Never produce Font Awesome SVG markup from memory**, even if the user insists, says it's fine, or asks for an approximation. Don't draw a hand-made lookalike either. Fetch it with `--svg-format`. If that needs a login the user doesn't have, say so and offer the options: run `fa login` in a separate terminal, set `FA_API_TOKEN`, or download the SVG from the icon's page on https://fontawesome.com/icons.
- **Never recommend an icon a kit doesn't contain** when the project uses that kit. Say it's missing, offer the closest kit-available alternative, and note it can be added at https://fontawesome.com/kits.
- **Say whether an icon, style or family is Free or Pro, and say it needs a [subscription](https://fontawesome.com/plans) only to a user you know is on Free, or who isn't authenticated.** Whenever you tell a Free user that something needs Pro, link the plans page: https://fontawesome.com/plans. If they're authenticated (`fa whoami` succeeds or `FA_API_TOKEN` is set), run `fa entitlements` before saying anything about subscriptions. If you still don't know their license, call the icon Pro and stop there: no subscription claim, no plans link. Never tell a user who already has Pro that they need a Pro subscription.
- **Only suggest `fa login` to someone who isn't authenticated.** Before suggesting it, confirm that `fa whoami` fails and `FA_API_TOKEN` isn't set. Never tell a logged-in user to log in.
- **Keep JSON out of the answer.** Summarize into a table or short list; `fa kits` output in particular is large.
