# Answering from the official docs

Use this for conceptual questions about Font Awesome: setup, styling, framework integrations, troubleshooting, APIs, and upgrading. Ground the answer in the docs rather than training data, which may predate v7.

## Source

Font Awesome publishes docs for LLMs at `https://docs.fontawesome.com`. The index at `/llms.txt` lists every page. Each page is a self-contained Markdown file.

## Steps

0. **In a project, check which icon library it uses before answering:** `.font-awesome.md` if there is one, otherwise the icon packages in `package.json` or the imports in the file the user mentions. If it uses another library and not Font Awesome, answer for that library instead (see the ground rules in `SKILL.md`) and skip the steps below.
1. **Fetch the index first, every time,** even if you think you know the page's URL. Page paths change between versions, and a guessed URL can 404 or return an outdated page. `WebFetch` `https://docs.fontawesome.com/llms.txt` with a prompt like: "Return the complete content of this file exactly as-is. I need to see every URL and its description."
2. **Pick the page(s).** URLs end in `.md` and the paths are descriptive (e.g. `/web/setup/use-kit.md`, `/web/style/animate.md`, `/web/use-with/react/troubleshoot.md`). Most questions map to one or two pages. Start with the most specific.
3. **Fetch them**, at most three per question, with a prompt like: "Return the full content of this documentation page as Markdown. Preserve all headings, code blocks, and tables."
4. **Answer** directly and concisely, with code examples from the docs. If the project has a `.font-awesome.md`, tailor the answer to its integration method, version, and license. If the docs give several approaches, recommend the one that fits.
5. **Cite** the page(s) at the end, with the `.md` extension removed, e.g.:

   > Source: [Use a Kit](https://docs.fontawesome.com/web/setup/use-kit)

## Guidelines

- If the question is really about the user's account or kits ("does my kit support duotone?"), answer it with the `fa` CLI (see [fa-cli.md](fa-cli.md)), not the docs.
- If the docs don't cover the question, say so. Don't make up an answer.
- If the question isn't about Font Awesome (general CSS, an unrelated framework), say so and answer briefly without fetching docs.
- If the answer leads to an action, offer it: add an icon ([add-icon.md](add-icon.md)), set up Font Awesome ([setup.md](setup.md)), or find an icon ([suggest-icon.md](suggest-icon.md)).
