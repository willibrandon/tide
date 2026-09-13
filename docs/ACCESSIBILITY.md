# Tide accessibility contract

## What is enforced

- Normal-size text: **at least 4.5:1**, without rounding up near the threshold.
- Essential non-text indicators: **at least 3:1**.
- The same 4.5:1 threshold applies to syntax on diff lines and word highlights.
- Foregrounds and transparent background stacks are composited before measuring.
- Both variants share the same ordered TextMate scopes, semantic selectors,
  workbench keys, and explicit non-italic typography.
- All emitted workbench keys must exist in the pinned VS Code registry snapshot.
  Colors marked as requiring transparency must remain translucent.
- Every emitted key must appear in `src/contrast-contract.json` as a measured
  foreground, a modeled background, or an exclusion with a reason. There is no
  naming-based exemption for newly added colors.

## Coverage

The contract includes editor text, comments, semantic tokens, active lines,
selections, search results, folds, linked editing, bracket matches, sticky scroll,
diffs, merge inputs, inline edits, chat code surfaces, notebook editors, coverage,
diagnostics, controls, focus borders, tabs, menus, lists, quick input, terminal
text, SCM labels, and modern activity/tab surfaces.

`scripts/audit.mjs` runs every configured syntax foreground against every
modeled syntax surface. A new palette value therefore gets checked across
surfaces even when its TextMate rule is language-specific.

Eight pinned grammars exercise TypeScript, TSX, C#, Python, Rust, Go, CSS, and
JSON. Role assertions check actual tokenization and non-italic styling. Broader
scope coverage is present, but these fixtures do not prove every grammar or
third-party semantic provider behaves identically.

## Deliberate boundaries

- Decorative separators, guides, shadows, and redundant state fills are not
  required to reach 3:1. Diff gutters and outlines carry change state while the
  translucent fill remains subtle. Color is supplemented by the editor's
  added/deleted markers and diagnostic shapes.
- A background classified as a supporting surface is not a claim that every
  possible foreground or nested state has been measured on it.
- ANSI black/white endpoints retain their terminal meaning. Terminal programs
  can use any palette entry as either a foreground or a background. Arbitrary
  ANSI combinations, reverse video, and application-supplied truecolor are
  outside the theme's universal control. Colored ANSI text and bright-black
  text are tested on the default terminal surface. VS Code also provides its
  own `terminal.integrated.minimumContrastRatio` adjustment.
- User customizations, extension-owned webviews, Markdown preview CSS, editor
  opacity settings, dimmed inactive windows, overlapping decorations not in the
  contract, and external semantic providers may alter rendered results.
- Contrast alone does not establish perceptual color separation, comfort for
  every user, or full application-level WCAG conformance.

## Reproduce

```sh
npm ci
npm run check
npm run check:contrast
npm run capture
```

`dist/contrast.json` contains every measurement, unrounded ratios, thresholds,
the weakest text/indicator pairs, and failures. `dist/grammar.json` records
grammar role assertions. `dist/visual.json` records actual VS Code version,
browser version, viewport, active palette checks, and nine rendered semantic
roles per variant from a controlled provider. Those runtime assertions verify
the editor's semantic styling path independently of grammar tokenization.

When reporting a readability issue, include theme variant, editor version,
language/extension, font size, semantic-highlighting setting, relevant
customizations, and a minimal sample. A screenshot is especially helpful for
overlapping selections, diagnostics, and diffs.
