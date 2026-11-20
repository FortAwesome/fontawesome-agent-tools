# Path C: Kit download

This downloads a Kit's assets directly into the project — useful for self-hosting or desktop use.

1. Ask the user for their Kit code.
2. Kit download needs auth. Follow the Auth section of `references/fa-cli.md`, and don't continue until `fa whoami` succeeds or `FA_API_TOKEN` is set.
3. Determine the download type:
   - **Web project:** `fa kit download --kit-token <code> --unzip --output <dir> web`
   - **Desktop project:** `fa kit download --kit-token <code> --unzip --output <dir> desktop`
   Choose the output directory based on the project structure — e.g., `vendor/fontawesome`, `public/fontawesome`, `assets/fontawesome`, or ask the user.
4. Run the download command and verify the files were extracted.
5. For web projects, add the appropriate `<link>` or `<script>` tag pointing to the local files (follow the self-hosting docs fetched earlier).
