# `.font-awesome.md` file format

This file lives in the project root and records the project's Font Awesome configuration. The `font-awesome` skill reads it to scope answers to the project and to generate correct code when adding icons, and creates it during initial setup. Commit it so the whole team benefits.

## Template

```markdown
# Font Awesome Configuration

Detected by the Font Awesome agent tools. Commit this file so the whole team benefits.

## Integration

- **Method:** [e.g., React components via @fortawesome/react-fontawesome, Kit embed (SVG+JS), CDN, self-hosted web fonts]
- **Version:** [e.g., 7.2.0. For a Kit, the version as the Kit sets it, which may be symbolic, e.g. `7.x`: record that, not the release it resolves to today, since a `7.x` Kit moves to each new 7.x release. Resolve it fresh when you need a release.]
- **License:** [Free or Pro]
- **Kit ID:** [if applicable, or omit — this is the Kit token, e.g. `abc123def4`. It's usable as `--kit-token` with the `fa` CLI (e.g. `fa kit icon ...`, `fa kit icons ...`, `fa kit family-styles ...`) to check what the Kit's subset includes, and `fa search --kit-token <TOKEN>` to search only kit-available icons. The Font Awesome skills use it to avoid adding or suggesting icons the Kit doesn't contain.]
- **Kit Revision:** [e.g. 42 -- this is the Kit's revision number, useful for tracking updates. It changes every time a kit is updated, whether by changing its subset, settings, or adding/removing/changing any custom icons. It's found as `kitRevision` in the kit detail from `fa kit show --kit-token <TOKEN>`]
- **CDN URL:** [if applicable, or omit]
- **Families:** [non-Kit projects only, e.g., classic, duotone, sharp, sharp-duotone — list all available families. Omit it for a Kit: its family-styles change whenever the Kit is edited, so get them fresh from `fa kit family-styles --kit-token <TOKEN>`, and never record the assumed list from `scripts/fetch-kit.py`.]

## Defaults

- **Style:** [e.g., solid]
- **Family:** [e.g., classic]
- **Configured defaults:** [only if the project sets them: `familyDefault`/`styleDefault` for SVG+JS, or `--fa-family`/`--fa-style` for Web Fonts, with where they're set. Only icons written with the bare `fa` class and no family or style class (`fa fa-house`) render in these.]
- **CSS prefix:** [only if not `fa`, e.g. `xy`]

## Import Pattern

[Describe how icons are imported/used in this project. Examples:]

- Individual imports: `import { faCartShopping } from '@fortawesome/pro-solid-svg-icons'`
- Component: `<FontAwesomeIcon icon={faCartShopping} />`

## Conventions

[Any project-specific patterns observed, e.g.:]

- Icons are wrapped in a custom `<Icon>` component at `src/components/Icon.tsx`
- Default size is `lg`
```

## When to create

- **Setup** ([setup.md](setup.md)) creates this file at the end of initial setup.
- **Adding an icon** ([add-icon.md](add-icon.md)) creates this file during its discovery step if it doesn't already exist.

## When to update

After any skill run, review whether new information was discovered that is missing from the file — a new import pattern, a family not listed, a wrapper component not documented, a version change, a kitRevision change, etc. Update only the sections that are incomplete or outdated. Do not rewrite sections that are already accurate.
