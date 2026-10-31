# `fa` CLI reference

The `fa` CLI talks to the Font Awesome GraphQL API and prints JSON. Pass `--json` to force JSON when output might be going to a terminal. Every command supports `--help`, and the help text is the most current source of truth. Check it whenever this page doesn't cover what you need.

## Version and availability

- `command -v fa` shows whether it's installed. `fa --version` shows the version.
- The `fa kit` subcommand needs `fa` 0.8.0 or newer. If an older version is installed, recommend upgrading: https://docs.fontawesome.com/web/use-with/fa-cli

## Auth

Catalog commands (`icons`, `search --version`, `releases`, `family-styles`, `icon-packs`) work anonymously. Account and kit commands (`whoami`, `entitlements`, `kits`, `kit ...`, `search --kit-token`) and SVG output (`--svg-format`) need auth:

- `fa whoami` succeeds when logged in. Alternatively, `FA_API_TOKEN` may be set in the environment.
- If neither, tell the user: "You need to be logged in to the Font Awesome CLI for this. Run `fa login` in a separate terminal, then try again." `fa login` is interactive (device authorization), so don't run it yourself.

## Command map

### Catalog (a release version)

| Need | Command |
|---|---|
| All releases, and which is latest | `fa releases` (`releases[]` with `version`, `date`, `isLatest`) |
| One icon: exists? families, styles, Free/Pro | `fa icons --version <v> --name <icon>`. `data.release.icon` is null if it doesn't exist. `familyStylesByLicense.{free,pro}[]` lists family-styles. |
| Official SVG for an icon | add `--svg-format html` (or `data`, `icon-definition`) and `--svg-family-style <family>,<style>` (repeatable) |
| Search by concept | `fa search --version <v> --query <q> --page-size 10`. Results at `data.searchPaginated.icons[]` with `id`, `label`, `unicodeHex`, `familyStylesByLicense`. |
| List icons in a release | `fa icons --version <v> [--license free\|pro] --page N --page-size N` |
| Families and styles in a release | `fa family-styles --version <v>` |
| Icon packs and collections | `fa icon-packs --version <v>` |

### Account

| Need | Command |
|---|---|
| Who is logged in | `fa whoami` |
| What the account owns | `fa entitlements` (`data.me.iconCollection.name`, e.g. `pro-plus-collection`) |
| All kits | `fa kits`. Each kit has `name`, `token`, `release.version`, `licenseSelected` (`free`/`pro`), `subsetType` (`FULL`, `AUTO` "By Style", `CUSTOM` "By Icon"), `technologySelected` (`svg`/`webfonts`), and `iconUploads[]`. |

### One kit (`--kit-token <t>` on every subcommand)

| Need | Command |
|---|---|
| Kit details and custom icons | `fa kit show --kit-token <t>` |
| Custom icons **with SVGs** | `fa kit show --kit-token <t> --svg-format html` (`iconUploads[].html`) |
| Is an official icon in the kit? | `fa kit icon --kit-token <t> <icon>`. Null means it isn't in the subset. |
| Search official icons in the kit | `fa search --kit-token <t> --query <q>` |
| Search custom icons in the kit | `fa search --kit-token <t> --query <q> --custom` |
| Family-styles in the kit | `fa kit family-styles --kit-token <t>`, or `fa kit family-style --kit-token <t> --prefix fas` for one |
| Every icon variant in the kit | `fa kit icons --kit-token <t> --page N --page-size N` |
| Download the kit build | `fa kit download web\|desktop --kit-token <t> --output <dir> [--unzip]` (setup only) |

### Anything else

`fa query -q '<graphql document>'` (or `-f file.graphql`, or STDIN) runs a raw query, authenticated if logged in. Use `--vars-json '{...}'` for variables. To discover fields, run an introspection query (for example `{ __type(name: "Kit") { fields { name } } }`).

## Quirks and gotchas

- **`fa kit icon` returns null for custom icons.** It only looks up official icons. For uploads, use `fa kit show` or `fa search --custom`.
- **Don't download a kit to inspect it.** `fa kit show --svg-format html` already returns custom icon SVGs. `fa kit download` is for installing a kit into a project.
- **`fa kit icons` is large on Full and By Style kits** (thousands of variants). For membership checks, use `fa kit icon` or `fa search --kit-token` instead of paging through it.
- **`fa kits` output is large.** It includes every kit's uploads. Summarize it instead of echoing it.
- **Kit search covers official icons only** unless you pass `--custom`. To answer "which of my icons match X", run both.
- **Kits record a major version (`version: "7.x"`) and a resolved release (`release.version`).** Use `release.version` for `--version` arguments.
- `fa kits --kit-token` and `fa kits --download` are deprecated. Use `fa kit show` and `fa kit download`.

## Fallback scripts (no `fa` CLI)

Run these from this skill's directory (`font-awesome/`). They call the public API and cover only catalog lookups and kit metadata:

| Script | Purpose |
|---|---|
| `scripts/latest-version.py` | Latest release version |
| `scripts/icon-exists.py --version <v> --icon-name <icon>` | Exit code 0 if the icon exists, 1 if not. Prints families and styles. |
| `scripts/search.py --version <v> --query <q>` | Search the catalog |
| `scripts/fetch-kit.py --kit-id <t>` | A kit's version, license, method, and families |

Without the CLI you can't search within a kit or see custom icons. Say so when it matters to the answer.
