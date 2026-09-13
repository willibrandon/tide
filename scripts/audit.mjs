import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { contrast } from './lib/color.mjs';
import { readJson, root, json } from './lib/project.mjs';

export function auditTheme(theme, contract) {
  const checks = [];
  const backgrounds = (keys) =>
    keys.map((key) => {
      if (!theme.colors[key]) throw new Error(`${theme.name}: missing background ${key}`);
      return theme.colors[key];
    });
  const measure = (label, fg, layers, minimum, kind) => {
    let ratio;
    try {
      ratio = contrast(fg, backgrounds(layers));
    } catch (error) {
      throw new Error(`${theme.name}: ${label} on ${layers.join(' over ')}: ${error.message}`, {
        cause: error,
      });
    }
    checks.push({
      theme: theme.name,
      label,
      foreground: fg,
      backgrounds: layers,
      ratio,
      minimum,
      kind,
      passed: ratio >= minimum,
    });
  };
  for (const pair of contract.pairs)
    measure(
      pair.foreground,
      theme.colors[pair.foreground],
      pair.backgrounds,
      pair.minimum,
      pair.kind,
    );
  const syntax = [
    ...theme.tokenColors
      .filter((r) => r.settings.foreground)
      .map((r) => [`TextMate: ${r.name}`, r.settings.foreground]),
    ...Object.entries(theme.semanticTokenColors)
      .filter(([, s]) => s.foreground)
      .map(([key, s]) => [`semantic: ${key}`, s.foreground]),
  ];
  for (const [name, foreground] of syntax)
    for (const surface of contract.syntaxSurfaces)
      measure(`${name} on ${surface.name}`, foreground, surface.backgrounds, 4.5, 'text');
  return checks;
}

export function audit(themes) {
  const contract = readJson('src/contrast-contract.json');
  const checks = themes.flatMap((theme) => auditTheme(theme, contract));
  const failures = checks.filter((check) => !check.passed).sort((a, b) => a.ratio - b.ratio);
  const lowest = (kind) =>
    checks.filter((c) => c.kind === kind).sort((a, b) => a.ratio - b.ratio)[0];
  const report = {
    policy: 'WCAG 2.x: normal-size text >=4.5, essential indicators >=3. No diff-text exceptions.',
    checkedAgainst: readJson('reference/vscode-colors.json').version,
    checks: checks.length,
    failures,
    lowestText: lowest('text'),
    lowestIndicator: lowest('indicator'),
    results: checks,
  };
  mkdirSync(resolve(root, 'dist'), { recursive: true });
  writeFileSync(resolve(root, 'dist/contrast.json'), json(report));
  if (failures.length) {
    for (const check of failures.slice(0, 40))
      console.error(
        `${check.theme}: ${check.label}: ${check.ratio.toFixed(3)} < ${check.minimum} on ${check.backgrounds.join(' over ')}`,
      );
    throw new Error(
      `${failures.length} of ${checks.length} contrast checks failed. Full report: dist/contrast.json`,
    );
  }
  console.log(
    `Contrast: ${checks.length} checks passed. Text minimum ${report.lowestText.ratio.toFixed(3)}:1; indicator minimum ${report.lowestIndicator.ratio.toFixed(3)}:1.`,
  );
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  audit(['dark', 'light'].map((v) => readJson(`themes/tide-${v}.json`)));
