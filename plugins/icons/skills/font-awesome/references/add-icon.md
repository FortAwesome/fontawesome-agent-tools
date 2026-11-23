# Workflow: add an icon to the user's code

Use this when the user wants an icon in their project's code, including when the icon is one part of a bigger task (a page, panel, or component). It covers icon name resolution, project detection, and code generation for every Font Awesome integration method, and keeps `.font-awesome.md` current. Paths below are relative to the `font-awesome` skill directory.

## Inputs

Take these from the user's request:

- **icon** (required): an icon name (e.g. `cart-shopping`) or a concept (e.g. "shopping cart").
- **style** (optional): overrides the default style (e.g. solid, regular, light, thin, duotone).
- **location** (optional): where to insert the icon (e.g. "the checkout button in src/components/Header.tsx").

## Tools

- **`fa` CLI usage, auth, and quirks:** `references/fa-cli.md`. Read it before your first `fa` call. Its Auth section says what to do when a command needs the user to log in.
- **Fallback scripts** (no `fa` CLI): `scripts/` (`latest-version.py`, `icon-exists.py`, `search.py`, `fetch-kit.py`).
- **Finding an icon for a concept:** `references/suggest-icon.md`.
- **`.font-awesome.md` format:** `references/font-awesome-md-format.md`.

When the project uses a Kit, `fa kit icon --kit-token <TOKEN> <icon>` tells you whether an icon is in the Kit's subset and which family-styles it comes in. Use it to avoid adding an icon the Kit doesn't include (see step 3).

## Steps

### 1. Resolve the icon name

First, determine whether the project uses a Kit for integrating Font Awesome. If the project has a `.font-awesome.md` file, read it to determine whether a Kit is in use.

#### If project uses a Kit

If the project uses a Kit, then verify that the icon exists in the particular Kit's subset. This can only be done with the `fa` CLI, and it needs auth (see `fa-cli.md`).

If the `fa` CLI is not available, tell the user that you cannot verify whether the icon is in their Kit's subset. Suggest they install the `fa` CLI, log in with `fa login`, then ask again.

Use the Kit's resolved release as `<version>` in the commands below: the **Version** in `.font-awesome.md`, or `release.version` from `fa kit show --kit-token <TOKEN>`. Don't use the latest release, since a Kit pinned to an older major version can't use newer icons.

To verify the icon exists in the kit, run `fa kit icon --kit-token <TOKEN> <icon>`.

If the icon isn't in the Kit, what you do next depends on the Kit's subset type (`subsetType` from `fa kit show --kit-token <TOKEN>`: `FULL`, `AUTO` for By Style, or `CUSTOM` for By Icon):

- **Full Library (`FULL`) or By Style (`AUTO`) Kit:** these contain every icon, so the name isn't a Font Awesome icon at all. Follow `references/suggest-icon.md` with the user's `icon` input as the concept, scoped to the Kit, and use the top recommendation without asking.
- **By Icon (`CUSTOM`) Kit:** the Kit holds only a hand-picked subset, so its best match can be far from what the user meant. Compare it with the full catalog before using it:
  1. Search the full catalog: `fa search --version <version> --query <icon> --page-size 10`. Note the top ten icon names.
  2. Search the Kit: `fa search --kit-token <TOKEN> --query <icon> --page-size 10`.
  3. If the Kit's top hit is among the catalog's top ten, use it without asking, and tell the user which icon you used and that it's the closest one in their Kit.
  4. Otherwise (including when the Kit search finds nothing), **stop before generating code and ask.** Say the Kit has no close match for what they asked for, and list the catalog's top ten by name only. Offer two choices: add one of those icons to the Kit's subset at https://fontawesome.com/kits and try again, or use one of the less relevant icons already in the Kit (name them, from the Kit search).

  If the request isn't a single word (for example "an icon for coziness"), you can also try a closer search term, such as "cozy". Compare the Kit and the catalog with the same term.

#### If project does not use a Kit

If the project does not use a Kit, then to verify the icon exists:

Determine the version of Font Awesome in use. First, try to discover it from `.font-awesome.md`; otherwise, use the latest release (`fa releases`, or `scripts/latest-version.py`). Use this version as `<version>` in the following commands.

- **`fa` CLI:** Run `fa icons --version <version> --name <icon>`. The icon exists if `data.release.icon` is non-null. The `familyStylesByLicense` field shows the free/pro breakdown.
- **Fallback:** Run `scripts/icon-exists.py --version <version> --icon-name <icon>`. Exit code `0` means the icon exists; exit code `1` means it does not.

If the icon does not exist, follow `references/suggest-icon.md` with the user's `icon` input as the concept. Auto-accept the top recommendation and continue with that icon name. Do not ask the user to confirm — a working icon is better than a broken one.

### 2. Determine the integration method

Check for a `.font-awesome.md` file in the project root.

#### If `.font-awesome.md` exists

Read it and use the configuration it describes. Skip discovery and proceed to step 3. However, keep the file's contents in mind — if any later step reveals information that is missing or incomplete in the file (e.g., a new import pattern, a family not listed, a wrapper component not documented), you will update it at the end (see step 7).

#### If `.font-awesome.md` does not exist

Run a discovery process to figure out how the project uses Font Awesome. **Use a subagent** (via the Agent tool with `subagent_type: "Explore"`) to perform this discovery, even when the project is small. It keeps the file-by-file search out of the main conversation. The subagent should search for the following sources (in order of specificity) and return a structured summary of what it found:

1. **`package.json` / lock files** — look for Font Awesome packages:
   - `@fortawesome/react-fontawesome` → React component integration
   - `@fortawesome/vue-fontawesome` → Vue component integration
   - `@fortawesome/fontawesome-svg-core` → SVG core (used by React/Vue)
   - `@fortawesome/fontawesome-free` or `@fortawesome/fontawesome-pro` → general SVG+JS or web font
   - `@fortawesome/free-solid-svg-icons`, `@fortawesome/pro-solid-svg-icons`, etc. → individual icon packages (note the style and license)

2. **HTML files / templates** — look for:
   - Font Awesome Kit script tags: `<script src="https://kit.fontawesome.com/XXXXXX.js"...>` → Kit (SVG+JS). Extract the kit ID (the token before `.js`).
   - CDN links in `<link>` tags: `cdnjs.cloudflare.com/ajax/libs/font-awesome/` or `use.fontawesome.com` → Web Fonts+CSS via CDN
   - `<i class="fa-solid fa-...">` or `<i class="fas fa-...">` usage patterns → class-based (Web Fonts+CSS or SVG+JS)

3. **Import statements in source files** — scan for:
   - `import { FontAwesomeIcon }` → React component
   - `import { library }` from `@fortawesome/fontawesome-svg-core` → library approach
   - Individual icon imports like `import { faCoffee }` → individual import approach

4. **SVG sprite sheets** — look for `<use href="...sprites/...">` patterns or sprite SVG files.

5. **Web Components** — look for `<fa-icon>` custom elements.

6. **Other frameworks** — look for Angular (`angular.json`, `FontAwesomeModule`), Svelte, etc.

The subagent should return: which Font Awesome packages are installed (with versions), any kit IDs found, CDN URLs, the framework integration method, import patterns observed in source files, the license (free vs pro), and any project conventions (wrapper components, default sizing, etc.).

#### If discovery finds no Font Awesome

If the project has no Font Awesome setup (no packages, Kit, CDN link, or imports), adding the icon means setting up Font Awesome first, and that's the user's decision. **Stop before changing anything.** Don't write `.font-awesome.md`, install packages, or edit any file. Tell the user the project doesn't have Font Awesome set up yet, and ask whether to set it up and then add the icon. End your turn and wait for their answer. If they say yes, follow `references/setup.md`, then come back and add the icon. If they say no, stop.

Ask the same way whatever else the project uses. Don't look for other icon libraries, and don't treat them as a reason to go ahead or to decline.

The one exception: the user asked for the icon as inline SVG markup (see "Important: bare SVG markup" below). That needs no Font Awesome setup, so fetch the SVG with `fa` and insert it without asking.

After the subagent returns, if a kit ID was found, fetch the kit details:

- **`fa` CLI:** Run `fa kit show --kit-token <id>`. Returns JSON with the kit's version, license, technology, and available families. Needs auth (see `fa-cli.md`).
- **Fallback:** Run `scripts/fetch-kit.py --kit-id <id>` to get the kit's version, license, method, and available families.

After discovery, determine:

- **Integration method** — the primary way icons are rendered
- **Kit ID / CDN URL** — if using a kit or CDN
- **License** — `free` or `pro`. Detect from: kit config (via `fa kit show` or `fetch-kit.py`), npm package names (`fontawesome-free` vs `fontawesome-pro`, `free-*-svg-icons` vs `pro-*-svg-icons`), or CDN URL patterns.
- **Default style** — the most commonly used style in the project (solid, regular, light, thin, duotone). If unclear, default to `solid`.
- **Default family** — the most commonly used family (classic, duotone, sharp, sharp-duotone, chisel, etch, graphite, jelly, jelly-duo, jelly-fill, notdog, notdog-duo, slab, slab-press, thumbprint, utility, utility-duo, utility-fill, whiteboard). If unclear, default to `classic`.
- **Configured defaults** — whether the project changes the family and style of icons written with the legacy bare `fa` class and no family, style or prefix class (`<i class="fa fa-house">`). Only that construct uses them: `fa-thin fa-house` is Classic Thin whatever the configuration. SVG+JS: the `familyDefault` and `styleDefault` settings (`data-family-default` and `data-style-default` on the script tag, `window.FontAwesomeConfig`, or `config` from `@fortawesome/fontawesome-svg-core`). Web Fonts: the `--fa-family` and `--fa-style` custom properties (for example `:root { --fa-family: var(--fa-family-sharp); }`). Unset, bare `fa` icons are Classic Solid. Note which icons the project writes as bare `fa` icons: their family and style come from this configuration, not their classes.
- **CSS prefix** — `fa` unless the project changes it (`cssPrefix` in the SVG+JS config, `$css-prefix` in the SCSS). With `xy`, Sharp Thin is `xy-sharp xy-thin`.
- **Available families** — the set of families the project has access to. For kits, use the output of `fa kit show` (or `fetch-kit.py`). For npm, infer from installed packages. For free users, only `classic` is available.
- **Import pattern** — for JS frameworks: individual imports per-file vs. library registration
- **Version** — the Font Awesome version in use
- **Project conventions** — any wrapper components, standard sizing, or patterns observed

Write the results to `.font-awesome.md` in the project root. Read `references/font-awesome-md-format.md` for the template and format to use.

Tell the user: "I've written `.font-awesome.md` with your project's Font Awesome configuration. You should commit this file so the team benefits and future icon additions are faster."

**Do not proceed to the next step until `.font-awesome.md` has been written.** Write it as its own action, before any edit to the project's code, and don't combine it with the code change in one command. The remaining steps depend on this file. If discovery fails to produce enough information to write a meaningful `.font-awesome.md`, stop and ask the user to clarify their Font Awesome setup before continuing.

### 3. Determine the icon style and family

**Family-style identifiers.** Each family-style has two identifiers, and each one alone names exactly one family-style. `fa family-styles` and `fa kit family-styles` return both:

- **Shorthand**, human-readable: `solid`, `thin`, `sharp-thin`, `sharp-duotone-solid`. Classic's shorthands are the style alone; every other family's start with the family.
- **Prefix** (`short_prefix_id`): `fas`, `fat`, `fast`, `fasds`.

So a user's "thin" could be the shorthand for Classic Thin, or a style in whatever family is in play. Resolve it with the precedence below.

**Family** — the operative family, in this precedence:

1. If the user names a family, use that.
2. If they're changing an icon that's already there ("switch it to thin"), keep the family it renders in. For a bare `fa` icon (`fa fa-house`), that's the configured default family (step 2), not Classic. A style named without a family never changes the family.
3. Otherwise, the project's default family: `.font-awesome.md`, or the configured default (`familyDefault` or `--fa-family`, see step 2).
4. If none of these, `classic`.

**Style** — use this precedence:

1. If the user specified a style, use that.
2. If they're changing an icon that's already there and named only a family ("make it sharp"), keep the style it renders in. For a bare `fa` icon, that's the configured default style. Write that style's class too: `fa-sharp fa-house`, with a family class and no style class, is Sharp Solid, because the configured defaults apply only to the bare `fa` construct.
3. Otherwise, the default style from `.font-awesome.md`, or the configured default (`styleDefault` or `--fa-style`).
4. If none of these, `solid`.

**The project's license decides what you can add, not the account's.** If the project is on Free (the License in `.font-awesome.md`, Free-only packages such as `@fortawesome/free-*-svg-icons`, or a Free Kit) and the request needs Pro (a Pro-only icon, or a Pro-only style or family such as light, thin, duotone, or sharp), don't write a Pro import, package, or class: the project can't load it, so the build or the icon breaks. This holds even when `fa entitlements` shows the account has Pro. **Stop before changing any files and ask** which they'd like: the icon in a Free style instead (name it, for example solid), or setting the project up for Pro first (follow `references/setup.md`) and then adding the icon. If the account is on Free too, include the Pro notice from step 6.

If `.font-awesome.md` records a **Kit ID** (kit token), the project's icons come from a Kit, and a Kit contains only a subset of all Font Awesome icons. **Do not add an icon the Kit does not include** — it will not render.

Verify the icon is available in the chosen style and family, based on whether the project uses a Kit:

#### If the project uses a Kit

Re-use the output of `fa kit icon --kit-token <TOKEN> <icon>` from Step 1: "Resolve the icon name". There it was used to resolve the icon name. The same output can be used here to check whether the icon is available in the chosen family-style.

If your chosen family-style for the icon isn't included but another is, tell the user, and ask if they'd prefer to use another family-style that is available, or else tell them to add the missing one to the kit's subset.

Step 1 already settled which icon to use, and that it's in the Kit (or you stopped and asked). Never add an icon the Kit lacks.

To list what the Kit does contain, `fa kit family-styles --kit-token <TOKEN>` shows the available family-styles and `fa kit icons --kit-token <TOKEN>` lists the available icon variants, which are the icons in specific family-styles. Both are paginated queries.

#### If the project does not use a Kit

Use the `fa icons --version <version> --name <icon>` output from step 1 (or `icon-exists.py`). It shows available families and styles. If the icon is not available in the requested style or family, tell the user and suggest available alternatives. Also check that the chosen family is in the project's available families list — if not, warn the user.

### 4. Generate the code

Based on the integration method from `.font-awesome.md`, generate the correct code. Below are the patterns for each method. Match the conventions observed in the project — don't introduce a new pattern if the project already has an established one.

#### React (`@fortawesome/react-fontawesome`)

**Individual imports (preferred when project uses this pattern):**

```jsx
import { faCartShopping } from '@fortawesome/pro-solid-svg-icons'
// or @fortawesome/free-solid-svg-icons for free icons

<FontAwesomeIcon icon={faCartShopping} />
```

The import name is the icon name in camelCase prefixed with `fa`. For example: `cart-shopping` → `faCartShopping`.

The package name follows the pattern: `@fortawesome/{free|pro}-{style}-svg-icons`. For example:
- `@fortawesome/free-solid-svg-icons`
- `@fortawesome/pro-regular-svg-icons`
- `@fortawesome/pro-duotone-svg-icons`
- `@fortawesome/sharp-solid-svg-icons`
- `@fortawesome/sharp-duotone-solid-svg-icons`

**Library approach (when project registers icons globally):**

```jsx
// In the library setup file:
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCartShopping } from '@fortawesome/pro-solid-svg-icons'
library.add(faCartShopping)

// In components — use string reference:
<FontAwesomeIcon icon="cart-shopping" />
// or with explicit prefix for non-solid styles:
<FontAwesomeIcon icon={['far', 'cart-shopping']} />
```

Style prefixes: `fas` (solid), `far` (regular), `fal` (light), `fat` (thin), `fad` (duotone), `fass` (sharp solid), `fasr` (sharp regular), `fasl` (sharp light), `fast` (sharp thin), `fasd` (sharp duotone).

#### Vue (`@fortawesome/vue-fontawesome`)

Similar to React but with Vue component syntax:

```vue
<font-awesome-icon :icon="['fas', 'cart-shopping']" />
```

Imports follow the same package/naming conventions as React.

#### SVG+JS Kit (`<script src="https://kit.fontawesome.com/...">`)

```html
<i class="fa-solid fa-cart-shopping"></i>
```

Class pattern depends on the family. A missing family class means Classic and a missing style class means solid, whatever the configuration: `fa-thin fa-house` is Classic Thin. `fa-classic` is valid but normally left out. The configured defaults (step 2) apply only to the legacy bare `fa` class with no family, style or prefix class: `fa fa-house`. In a project that writes its icons that way, a new icon in the operative family and style can follow the convention. To change a bare `fa` icon's family or style, write both explicitly (`fa-sharp fa-thin fa-house`): adding only a style class (`fa fa-thin fa-house`) ends the bare `fa` construct, so it renders Classic. Use the project's CSS prefix in place of `fa` if it changed it. Any family-style's prefix also works as a class on its own, whatever the configuration: `<i class="fast fa-house"></i>` is Sharp Thin.

- **classic** (the default family unless configured otherwise; no family class needed): `fa-{style} fa-{icon-name}`
  - `<i class="fa-solid fa-cart-shopping"></i>`
- **sharp**: `fa-sharp fa-{style} fa-{icon-name}`
  - `<i class="fa-sharp fa-regular fa-cart-shopping"></i>`
- **sharp-duotone**: `fa-sharp-duotone fa-{style} fa-{icon-name}`
  - `<i class="fa-sharp-duotone fa-solid fa-cart-shopping"></i>`
- **duotone**: `fa-duotone fa-{style} fa-{icon-name}`
  - `<i class="fa-duotone fa-solid fa-cart-shopping"></i>`
- **Other FA7 families** (chisel, etch, graphite, jelly, jelly-duo, jelly-fill, notdog, notdog-duo, slab, slab-press, thumbprint, utility, utility-duo, utility-fill, whiteboard): `fa-{family} fa-{style} fa-{icon-name}`
  - `<i class="fa-slab fa-solid fa-cart-shopping"></i>`
  - `<i class="fa-jelly fa-regular fa-cart-shopping"></i>`

No imports needed — the kit handles loading.

#### Web Fonts+CSS (CDN or npm)

Same class syntax as SVG+JS Kit:

```html
<i class="fa-solid fa-cart-shopping"></i>
```

Family prefixes work the same way (e.g., `fa-sharp fa-solid fa-cart-shopping`). Ensure the appropriate CSS file is loaded (all.css or individual style sheets).

#### SVG Sprites

```html
<svg class="icon">
  <use href="/path/to/sprites/solid.svg#cart-shopping"></use>
</svg>
```

Match the sprite path used elsewhere in the project.

#### Angular

```html
<fa-icon [icon]="faCartShopping"></fa-icon>
```

With the corresponding import in the component's TypeScript file.

#### Web Components (`<fa-icon>`)

```html
<fa-icon class="fa-solid fa-cart-shopping"></fa-icon>
```

### Important: bare SVG markup

**Never generate Font Awesome SVG markup (raw `<svg>` elements) from your own knowledge or training data.** If a user needs bare SVG output — for instance, to inline an icon as an `<svg>` element — you must fetch it from the Font Awesome API using the `fa` CLI:

```
fa icons --version <version> --name <icon> --svg-format html
```

The `--svg-format` flag accepts `html`, `data`, or `icon-definition`. It needs auth (see `fa-cli.md`).

Do not approximate, reconstruct, or guess SVG path data. The authoritative source is always the Font Awesome API.

### 5. Insert or display

**If the user gave a location:**

Find the specified location in the code. Insert the icon code there, including any necessary import statements at the top of the file. Follow the project's existing patterns for formatting and placement.

**If no location was provided:**

Present the code snippet in a fenced code block with the appropriate language tag. If imports are needed, show them separately so the user knows what goes where.

Example output:

> Add this import (if not already present):
> ```jsx
> import { faCartShopping } from '@fortawesome/pro-solid-svg-icons'
> ```
>
> Then use the component:
> ```jsx
> <FontAwesomeIcon icon={faCartShopping} />
> ```

### 6. Pro notice

If the project or account is on Free (from the `.font-awesome.md` license field, the installed packages, the Kit's license, or `fa entitlements`), and the user asks for something that needs Pro (a Pro-only icon, or a Pro-only style or family such as light, thin, duotone, or sharp), tell them it needs Pro and **always link the plans page, https://fontawesome.com/plans**. This applies whether or not you insert anything. For example:

> Note: `cart-shopping` requires a Font Awesome Pro [subscription](https://fontawesome.com/plans). Your project appears to be using Font Awesome Free.

Don't show this notice, or link the plans page, to a user whose account already has Pro. For a Pro account with a Free project, the question from step 3 is enough.

### 7. Update `.font-awesome.md` if needed

Review whether any information discovered during this run is missing from `.font-awesome.md`. Examples of things that might be incomplete:

- A new import pattern was used that isn't documented under **Import Pattern**
- A family or style was encountered that isn't listed under **Families**
- A wrapper component or project convention was observed that isn't in **Conventions**
- The version, license, or integration method has changed

If anything is missing or outdated, update `.font-awesome.md` with the new information — keep the same format, just fill in the gaps. Do not rewrite sections that are already accurate. Let the user know what was updated so they can commit the change.

## Before you finish

If the project is on Free and the request needs Pro, your reply must be the question from step 3 (a Free style, or setting the project up for Pro first), with no files changed.

If discovery found no Font Awesome setup and the user hasn't yet agreed to set it up, your reply must be that question, with no files changed (unless they asked for inline SVG).
