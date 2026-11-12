# Suggesting an icon

Use this when the user wants an icon for a concept, noun, verb, or situation ("an icon for a cozy tea shop", "what vampire icons can I use?").

Your own knowledge of Font Awesome icons is good for a first guess, but it may be wrong for the version in use. Layer several sources before recommending anything. Command details are in [fa-cli.md](fa-cli.md).

## 1. Settle the scope

- **Version:** the version the user names, else the one in `.font-awesome.md`, else the latest (`fa releases`, or `scripts/latest-version.py`).
- **Kit:** if `.font-awesome.md` records a Kit token, or the user names a kit, every suggestion must come from that kit. A kit holds only a subset of Font Awesome, and suggesting an icon outside it gives a broken result. Scoping needs the `fa` CLI and auth. If `fa` isn't installed or the user can't log in, search unscoped instead and tell the user you couldn't verify Kit coverage, so some suggestions may not be in their Kit.
- **"Can I use":** if the question is about what the user can use and there's no project kit, check `fa entitlements` (Free vs Pro). If `fa kits` shows "By Icon" (`CUSTOM`) kits, note which of them contain your picks.

## 2. Guess, verify, and search

1. **Guess** the icon name that best fits.
2. **Verify it exists:** `fa icons --version <v> --name <guess>` (fallback: `scripts/icon-exists.py --version <v> --icon-name <guess>`). With a kit in scope, also run `fa kit icon --kit-token <t> <guess>`. An icon can exist in Font Awesome and still be missing from the kit.
3. **Search for alternatives anyway.** Search often turns up better or more specific icons than the guess:
   - Kit in scope: `fa search --kit-token <t> --query <q> --page-size 10`. Every result is safe to recommend. Add `--custom` to also check the kit's uploaded icons.
   - No kit: `fa search --version <v> --query <q> --page-size 10` (fallback: `scripts/search.py`).
   - Try a couple of related queries if the first is thin (for "vampire": `bat`, `coffin`, `fangs`, `blood`).

## 3. Present

Lead with the best match, then list relevant alternatives. If there's no exact icon for the concept, say so plainly before the alternatives. Use a table:

| Icon | Families | Availability |
|------|----------|--------------|
| `mug-saucer` | classic, sharp, duotone, sharp-duotone | Free |
| `album-collection` | classic, sharp, duotone, sharp-duotone | Pro (requires a [subscription](https://fontawesome.com/plans)) |

- With a kit in scope, recommend only kit-available icons. If your best conceptual match isn't in the kit, say so, recommend the closest kit-available icon, and note that the missing one can be added at https://fontawesome.com/kits.
- When the user's license is known, say whether each pick is usable for them, not just whether it's Free or Pro in the abstract.
- Never provide SVG markup from memory. If they want the SVG, fetch it with `--svg-format` (see [fa-cli.md](fa-cli.md)).

## 4. Offer the next step

If you're running this as part of another workflow (such as `add-icon`), skip this step and hand the top pick back to that workflow without asking.

Otherwise, if the user is working in a project, ask whether they'd like the icon added to their code. If yes, follow the `add-icon` skill with the chosen icon (and location, if given).
