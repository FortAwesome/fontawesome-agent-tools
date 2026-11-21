# Path B: Kit package via npm

1. Ask the user for their Kit code.
2. Fetch Kit details to determine version and available families:
   - **`fa` CLI:** Needs auth (see `references/fa-cli.md`). Run `fa kit show --kit-token <code>` to get the Kit's technology setting, and `fa kit family-styles --kit-token <code>` to get the kit's family-styles. If the user can't log in, fall back below.
   - **Fallback:** Run `scripts/fetch-kit.py --kit-id <code>`.
3. Configure the npm registry in `.npmrc` in the project root. It needs all three of these lines. Kit packages come from the `@awesome.me` scope, and the Pro packages a Kit package depends on come from `@fortawesome`. Both scopes use the same private registry and the same token:
   ```
   @awesome.me:registry=https://npm.fontawesome.com/
   @fortawesome:registry=https://npm.fontawesome.com/
   //npm.fontawesome.com/:_authToken=${FA_PACKAGE_TOKEN}
   ```
   If `.npmrc` already exists, keep its contents and add whichever of these lines are missing. Don't overwrite it, and don't add a second `_authToken` line for `npm.fontawesome.com`.
   Tell the user they need to set the `FA_PACKAGE_TOKEN` environment variable with their Font Awesome package token (found at https://fontawesome.com/account/general under "Package Manager Tokens").
4. Install the Kit package:
   - npm: `npm install @awesome.me/kit-<code>`
   - yarn: `yarn add @awesome.me/kit-<code>`
   - pnpm: `pnpm add @awesome.me/kit-<code>`
5. Add the framework-specific initialization code (see `path-f-framework-init.md`).
