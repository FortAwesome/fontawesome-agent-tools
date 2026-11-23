---
name: font-awesome
description: >-
  Font Awesome icons, kits, and setup. Use for ANY question or task involving
  Font Awesome, and load it before answering or writing icon code, not from
  memory: icon names, styles, and APIs change between versions. Covers
  finding, searching for, or suggesting icons; whether an icon exists and in
  which styles; Free vs Pro and what the user's account includes; the user's
  kits, kit contents, and custom icons; releases and versions; official SVG
  markup, including any request for an icon's SVG (even "from memory"); how-to
  questions about setup, styling, animation, troubleshooting, and upgrading;
  setting up Font Awesome in a project; and adding an icon to the user's code,
  including when the icon is one part of a bigger task (a page, panel, or
  component). Includes requests about the user, such as "what animal icons can
  I use?", "list my kits", "am I on Pro?", or "add a cart icon to the header".
---

Entry point for anything Font Awesome. Answer questions directly with the tools below. When the user wants project files changed, follow the matching workflow. If `/font-awesome` is invoked with no request, ask what they need and change nothing.

Your knowledge of Font Awesome is likely stale: icon names change between versions, new families ship, and kits hold per-user subsets. Verify against the API before stating facts.

## Tools

- **`fa` CLI** (primary): JSON for the catalog, the user's account and their kits. Read [references/fa-cli.md](references/fa-cli.md) before your first `fa` call. The CLI documents itself and is newer than your training data: before anything heavier (downloading a kit, scraping a page, writing a script), check `fa <command> --help` for a flag that does the job. `fa query` runs any GraphQL query.
- **No `fa`** (`command -v fa` fails): the Python `scripts/` in this skill's directory cover catalog lookups and a kit's basic metadata, not account data, searching within a kit, or custom icons. End your answer by suggesting the user install `fa` (https://docs.fontawesome.com/web/use-with/fa-cli), which adds their account, kits, and official SVGs.
- **Docs**, for conceptual questions: [references/docs.md](references/docs.md).

## Resolve "I" and "my"

Cheapest source first, and only as far as the question needs ("is there a bat icon?" needs only the catalog; "can I use it?" needs entitlements and kits):

1. **Project:** `.font-awesome.md` ([format](references/font-awesome-md-format.md)) records the version, license, families, and maybe a Kit token. With a Kit, scope every answer to that kit.
2. **Account:** `fa whoami` (who, and whether account commands work), `fa entitlements` (Free, Pro or Pro+: which icons they can use at all), `fa kits` (every kit with version, license, subset type, technology, and custom icons).
3. **Neither:** answer from the public catalog for the latest release, and say so. For answers about their own account, suggest `fa login` (see the ground rules).

## Answering common questions

| Question | Approach |
|---|---|
| "Is there an icon for X?" / "What icons can I use for X?" | [references/suggest-icon.md](references/suggest-icon.md). Scope to a kit when the project or user names one. For "can I use", check entitlements and say which "By Icon" kits contain it. |
| "Is there an X icon?" / "Which styles?" | Fuzzy search, not an exact lookup: `fa search --version <v> --query <X> --page-size 10` (no `fa`: `scripts/search.py`, then `scripts/icon-exists.py` on the exact match). Read results through `scripts/summarize-icons.py`. Lead with an exact `id` match: Free or Pro, and its families and styles from `familyStylesByLicense` (a count is enough). Then the closest matches; if none is exact, say so. |
| "List my kits" / "Which kits have X?" | `fa kits`. Membership: `fa kit icon --kit-token <t> <icon>` or `fa search --kit-token <t> --query <icon>`. |
| "Show my custom icons" | `fa kit show --kit-token <t> --svg-format html` (names, unicodes, SVGs). Search uploads: `fa search --kit-token <t> --query <q> --custom`. |
| "Give me the SVG for X" | `fa icons --version <v> --name <icon> --svg-format html --svg-family-style <family>,<style>` |
| "Am I on Pro?" | `fa entitlements`, plus each kit's license from `fa kits`. |
| "What's the latest version?" | `fa releases` (the entry with `isLatest: true`) |
| "What families / styles exist?" | `fa family-styles --version <v>`; for a kit, `fa kit family-styles --kit-token <t>`. |
| How-to, setup concepts, troubleshooting | [references/docs.md](references/docs.md) |

Show icons by putting the SVG markup the API returned in the answer itself, not only in a file; don't redraw it.

## Workflows

Two jobs change project files. **Read the whole workflow before touching any project file**, and follow it, including where it says to stop and ask.

- **An icon in their code** (adding or swapping one, or building a page, panel, or component that should have one): [references/add-icon.md](references/add-icon.md).
- **Installing, setting up, or reconfiguring Font Awesome:** [references/setup.md](references/setup.md).

A question about doing one of these ("how do I set up Font Awesome with Vue?") is a question: answer it from the docs and offer to do it. After answering a question about an icon in a project, offer to add it.

## Ground rules

- **Never produce Font Awesome SVG markup from memory**, even if the user insists or asks for an approximation, and don't draw a lookalike. Fetch it with `--svg-format`. If that needs a login they don't have, say so and offer: `fa login` in a separate terminal, setting `FA_API_TOKEN`, or downloading the SVG from the icon's page on https://fontawesome.com/icons.
- **Never recommend an icon a project's kit doesn't contain.** Say it's missing, offer the closest kit-available alternative, and note it can be added at https://fontawesome.com/kits.
- **Know the license before saying anything about Pro.** Say whether an icon, style or family is Free or Pro. If the user is authenticated (`fa whoami` succeeds or `FA_API_TOKEN` is set), run `fa entitlements` first, even for "is there an X icon?". Only a user you know is on Free, or who isn't authenticated, hears that something needs a Pro subscription, and always with https://fontawesome.com/plans. If the license is still unknown, call it Pro and stop there. Never tell a Pro user they need Pro.
- **Suggest `fa login` (in a separate terminal) only after confirming** that `fa whoami` fails and `FA_API_TOKEN` isn't set.
- **For a how-to question, answer for the icon library the project uses.** If it uses another library (such as Lucide) and has no Font Awesome, answer for that library. You may note in one sentence that Font Awesome isn't set up, but don't lead with it or offer to set it up unless asked. Requests to add an icon follow `references/add-icon.md`, which asks first.
- **A style named without a family means the operative family:** the icon being changed ("switch it to thin" keeps its family), else the project's default family, else Classic. A family-style has two unique IDs: a human-readable shorthand (`thin` is Classic Thin, `sharp-thin` is Sharp Thin) and a short_prefix_id (`fat`, `fast`). short_prefix_id is also sometimes called just "prefix". A short_prefix_id is always a valid class. A class without a family (`fa-thin`) gets the default family, Classic unless set by `familyDefault` (SVG+JS) or `--fa-family` (Web Fonts). Details: `references/add-icon.md` step 3.
- **Keep JSON out of the answer.** Summarize into a table or short list.
