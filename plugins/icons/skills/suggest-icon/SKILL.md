---
name: suggest-icon
description: Suggest an icon suitable for a particular situation, noun, verb, or concept
user-invokable: true
args:
  - name: use-case
    description: A concept, situation, noun, verb or idea that needs an icon
    required: true
---

Your inherent knowledge of Font Awesome icons is useful for a quick initial guess, but it may be inaccurate depending on the version. To give a reliable answer, layer multiple sources of information.

All scripts below are relative to this skill's directory (`plugins/icons/skills/suggest-icon/`). Run them from there.

## Steps

1. **Determine the version.** If the user specifies a Font Awesome version, use that. Otherwise, run `./scripts/latest-version.py` to get the most recent version. Use the resolved version for all subsequent steps.

2. **Make an initial guess.** Based on your knowledge, pick the icon name you think best fits the use case argument.

3. **Verify the icon exists.** Run `./scripts/icon-exists.py --version <version> --icon-name <your-guess>`. If the exit code is `0`, the icon exists. If the exit code is `1`, the icon does not exist.

4. **Search for alternatives.** Run `./scripts/search.py --version <version> --query <your-guess>` to find related icons from the Font Awesome GraphQL API. Do this regardless of whether your initial guess exists — searching often surfaces more specific or better-fitting icons that you wouldn't think of on your own.

5. **Present the recommendation.** Pick the best match as your primary recommendation, and include relevant alternatives if the search turned up other good options. Use a markdown table like this example:

   | Icon | Families | Availability |
   |------|----------|--------------|
   | `mug-saucer` | classic, sharp, duotone, sharp-duotone | Free |

   If the icon is pro-only, note that a Font Awesome subscription is required:

   | Icon | Families | Availability |
   |------|----------|--------------|
   | `album-collection` | classic, sharp, duotone, sharp-duotone | Pro (requires a [subscription](https://fontawesome.com/plans)) |

6. **Offer to add the icon.** After presenting your recommendation, ask the user: "Would you like me to add this icon to your code?" If they say yes or provide a location, invoke `/add-icon` with the recommended icon name (and location if given).
