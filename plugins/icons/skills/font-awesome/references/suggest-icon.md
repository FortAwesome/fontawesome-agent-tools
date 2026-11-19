# Suggesting an icon

Use this when the user wants an icon for a concept, noun, verb, or situation ("an icon for a cozy tea shop", "what vampire icons can I use?").

Your own knowledge of Font Awesome icons is good for a first guess, but it may be wrong for the version in use. Layer several sources before recommending anything. Command details are in [fa-cli.md](fa-cli.md).

## 1. Settle the scope

- **Version:** the version the user names, else the one in `.font-awesome.md`, else the latest (`fa releases`, or `scripts/latest-version.py`).
- **Kit:** if `.font-awesome.md` records a Kit token, or the user names a kit, every suggestion must come from that kit. A kit holds only a subset of Font Awesome, and suggesting an icon outside it gives a broken result. Scoping needs the `fa` CLI and auth. If `fa` isn't installed or the user can't log in, search unscoped instead and tell the user you couldn't verify Kit coverage, so some suggestions may not be in their Kit.
- **"Can I use":** if the question is about what the user can use and there's no project kit, check `fa entitlements` (Free vs Pro). If `fa kits` shows "By Icon" (`CUSTOM`) kits, note which of them contain your picks.

## 2. Search

Always use fuzzy search, not an exact-name lookup. Search turns up the exact icon when there is one, plus better or more specific alternatives.

1. **Search** with the user's term, and with your own best-guess icon name if it's different:
   - Kit in scope: `fa search --kit-token <t> --query <q> --page-size 10`. Every result is safe to recommend. Add `--custom` to also check the kit's uploaded icons.
   - No kit: `fa search --version <v> --query <q> --page-size 10` (fallback: `scripts/search.py`).
   - Try a couple of related queries if the first is thin (for "vampire": `bat`, `coffin`, `fangs`, `blood`).
   - To read the results compactly, pipe them through `scripts/summarize-icons.py` (see [fa-cli.md](fa-cli.md)) rather than writing your own filter. It keeps the families and Free/Pro you need for the table below.
2. **Find the exact match.** If a result's `id` is exactly the name the user asked for (or your guess), that's the lead answer. With a kit in scope, a result from the kit search is in the kit. An icon can exist in Font Awesome and still be missing from the kit.

## 3. Present

Lead with the exact match if there is one, emphasized, with whether it's Free or Pro and its families and styles (a count of family-styles is enough). Otherwise lead with the best match. Then list relevant alternatives. If there's no exact icon for the name or concept, say so plainly before the alternatives. Use a table:

| Icon | Families | Availability |
|------|----------|--------------|
| `mug-saucer` | classic, sharp, duotone, sharp-duotone | Free |
| `album-collection` | classic, sharp, duotone, sharp-duotone | Pro |

Keep the **Families** and **Availability** columns in every table, for every row. A count of family-styles is fine for Families, and you can add a column such as "Why it fits", but don't drop either one or move it into the prose. Availability says Free or Pro even when the user has Pro; that's when you add whether they can use it. Add "(requires a [subscription](https://fontawesome.com/plans))" to Pro rows only for a user you know is on Free, or who isn't authenticated.

- With a kit in scope, recommend only kit-available icons. If your best conceptual match isn't in the kit, say so, recommend the closest kit-available icon, and note that the missing one can be added at https://fontawesome.com/kits.
- When the user's license is known, say whether each pick is usable for them, not just whether it's Free or Pro in the abstract. If they're authenticated, check `fa entitlements` first, and don't tell a Pro user they need a subscription.
- Never provide SVG markup from memory. If they want the SVG, fetch it with `--svg-format` (see [fa-cli.md](fa-cli.md)).

## 4. Offer the next step

If you're running this as part of another workflow (such as `add-icon`), skip this step and hand the top pick back to that workflow without asking.

Otherwise, if the user is working in a project, ask whether they'd like the icon added to their code. If yes, follow the `add-icon` skill with the chosen icon (and location, if given).
