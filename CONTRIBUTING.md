# Contributing to Tide

## Source of truth

| Path                         | Purpose                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `src/palettes.mjs`           | Dark/light semantic color roles and explicit overlays        |
| `src/workbench.json`         | VS Code UI keys → shared roles                               |
| `src/syntax.json`            | Ordered TextMate rules → shared roles                        |
| `src/semantic.json`          | Semantic selectors → shared roles                            |
| `src/contrast-contract.json` | Measured foreground/background relationships and exclusions  |
| `themes/`                    | Generated, checked-in extension output                       |
| `reference/`                 | Pinned upstream registry/grammar data for offline validation |
| `showcase/`                  | Standalone samples and exact grammar assertions              |

Edit the sources, then run `npm run build`. `npm run check` rejects stale
generated output instead of silently rewriting it.

Keep neutral chrome neutral. Teal is an action/focus accent, amber carries
types/constants, and ordinary punctuation/variables stay quieter. Do not
weaken the text contrast threshold to accommodate a stronger background fill.

## Validation

```sh
npm ci
npm run build
npm run check
npm run package
```

Add a meaningful mutation/regression test for a validator change. For a scope
change, add a small grammar fixture asserting the desired role; do not merely
snapshot the implementation's current output.

## Visual review

Run `npm run preview`, or use the desktop F5 launch configurations. Review:

1. Both themes with semantic highlighting enabled and disabled.
2. Selections, search matches, active lines, bracket guides, and hover text.
3. Inline and side-by-side diffs, including low-emphasis comments.
4. Error/warning/info diagnostics and focused/unfocused controls.
5. Terminal ANSI colors and actual programs that use background fills.
6. Narrow and wide layouts, notebooks, and chat where available.

`npm run capture` uses the actual pinned VS Code web build with a development-
only helper extension. The helper, grammars, browser tooling, and reports are
excluded from the shipped extension. It does not modify your installed editor.

For the icon: edit `assets/icon.svg`, then run `node scripts/render-icon.mjs`.

## Updating VS Code support

```sh
npm run reference:update -- /path/to/read-only/vscode-checkout <release-commit>
```

The snapshot tool reads the Git object database; it does not change that
checkout. It records literal `registerColor` calls, built-in extension color
contributions, the fixed ANSI registration set, and selected grammars. It is
not a full execution of VS Code's registry; new dynamic registration mechanisms
require updating the extractor.

Update `engines.vscode` with the pinned release, inspect upstream changes,
classify new keys, refresh captures, and run the entire check/package flow.

## Release

The extension ID is **`willibrandon.tide-theme`** in both the
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=willibrandon.tide-theme)
and [Open VSX](https://open-vsx.org/extension/willibrandon/tide-theme).

1. For subsequent releases, use `npm version <version> --no-git-tag-version`
   to update both manifests. The first release is already set to `0.1.0`.
2. Update `CHANGELOG.md`; build, check, and package. Refresh captures for visual changes.
3. Commit and push to `main`, then wait for CI to pass.
4. Push an annotated version tag. For the first release:

   ```sh
   git tag -a v0.1.0 -m "Tide v0.1.0"
   git push origin v0.1.0
   ```

The tag triggers the release workflow: validate the version and publisher,
package once, attach the VSIX and SHA-256 checksum to the GitHub release, then
publish that same artifact to both registries. Packaged README links use the
release tag so each version keeps its matching documentation and screenshots.

Repository secrets **`VSCE_PAT`** and **`OVSX_PAT`** authenticate the two publish
jobs. Missing or invalid credentials fail publication. If a publish job fails,
fix the credential or registry issue and rerun the failed job; duplicate
versions are skipped by both publishers.
