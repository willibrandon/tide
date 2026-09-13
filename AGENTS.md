# Working on Tide

- Read `CONTRIBUTING.md` for the source layout and preview workflow.
- Edit `src/` rather than generated files in `themes/`. Run `npm run build`
  after a palette, workbench, or token change.
- Preserve paired dark/light coverage and non-italic token styling.
- Normal-size text, including code on diffs, requires 4.5:1. Essential
  indicators require 3:1. Fix colors or accurately model their backgrounds;
  do not lower thresholds to make a change pass.
- Every new workbench color needs a measured pairing, a modeled background
  role, or a specific exclusion in `src/contrast-contract.json`.
- Use `npm run check`, `npm run check:format`, and `npm run package` as
  appropriate. Use `npm run capture` for changes affecting rendered behavior.
- `reference/` contains pinned upstream snapshots. Refresh through the snapshot
  script; treat external checkouts as read-only.
- The extension is declarative: preview/test helpers belong only in development
  tooling and must never enter the VSIX.
