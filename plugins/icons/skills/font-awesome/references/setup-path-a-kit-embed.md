# Path A: Kit embed code (HTML script tag or CSS link)

1. Ask the user for their Kit code (the alphanumeric token, e.g., `abc123def4`). If they don't know it, direct them to https://fontawesome.com/kits to find it.
2. Determine whether to use SVG+JS or Web Fonts+CSS delivery. Check the Kit's settings if possible:
   - **`fa` CLI:** Needs auth (see `references/fa-cli.md`). Run `fa kit show --kit-token <code>` to get the Kit's technology setting. If `fa` is installed but the user can't log in, ask the user or default to SVG+JS.
   - **Fallback** (only when `command -v fa` fails): Run `scripts/fetch-kit.py --kit-id <code>` for the Kit's version, license, and method. Tell the user its warning: without the `fa` CLI it can't tell which family-styles the Kit includes, and assumes all that the license allows.
   - If neither works, ask the user or default to SVG+JS.
3. Add the embed code to the project's HTML `<head>`:
   - **SVG+JS:** `<script src="https://kit.fontawesome.com/<code>.js" crossorigin="anonymous"></script>`
   - **Web Fonts+CSS:** `<link rel="stylesheet" href="https://kit.fontawesome.com/<code>.css" crossorigin="anonymous">`
4. Find the appropriate HTML file(s) to modify — typically `index.html`, a layout template, or a base template.
