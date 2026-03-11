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

## Steps

1. **Determine the latest version.** Run `./scripts/latest-version.py` to get the most recent Font Awesome version. Use this version for all subsequent steps.

2. **Make an initial guess.** Based on your knowledge, pick the icon name you think best fits the use case argument.

3. **Verify the icon exists.** Run `./scripts/icon-exists.py --version <version> --icon-name <your-guess>`. If the exit code is `0`, the icon exists — proceed to step 5. If the exit code is `1`, the icon does not exist — continue to step 4.

4. **Search for alternatives.** Run `./scripts/search.py --version <version> --query <your-guess>` to get suggestions from the Font Awesome GraphQL API. Pick the best match from the results.

5. **Present the recommendation.** Use a markdown table like this example:

   | Icon | Families | Availability |
   |------|----------|--------------|
   | `mug-saucer` | classic, sharp, duotone, sharp-duotone | Free |

   If the icon is pro-only, note that a Font Awesome subscription is required:

   | Icon | Families | Availability |
   |------|----------|--------------|
   | `album-collection` | classic, sharp, duotone, sharp-duotone | Pro (requires a [subscription](https://fontawesome.com/plans)) |
