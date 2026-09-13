import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTheme } from '../scripts/build.mjs';
import { auditTheme } from '../scripts/audit.mjs';
import { validateTheme, validateParity } from '../scripts/lib/validate.mjs';
import { readJson } from '../scripts/lib/project.mjs';
import { resolveColor, palettes } from '../src/palettes.mjs';

const registry = readJson('reference/vscode-colors.json');
const contract = readJson('src/contrast-contract.json');
test('unknown color keys and unaudited known keys are rejected', () => {
  const theme = buildTheme('dark');
  theme.colors['editor.typoBackground'] = '#FFFFFF';
  theme.colors.contrastBorder = '#FFFFFF';
  const errors = validateTheme(theme, registry, contract);
  assert.ok(errors.some((e) => e.includes('Unknown VS Code color: editor.typoBackground')));
  assert.ok(errors.some((e) => e.includes('Unclassified color: contrastBorder')));
});
test('semantic italics and one-sided selector loss are detected', () => {
  const dark = buildTheme('dark'),
    light = buildTheme('light');
  light.semanticTokenColors.keyword.italic = true;
  delete light.semanticTokenColors.macro;
  assert.ok(validateTheme(light, registry, contract).some((e) => e.includes('italic')));
  assert.ok(validateParity(dark, light).some((e) => e.includes('semanticTokenColors')));
});
test('diff text gets the normal-size text threshold', () => {
  const theme = buildTheme('light');
  theme.colors['diffEditor.insertedTextBackground'] = '#006D68CC';
  const checks = auditTheme(theme, contract).filter((c) => c.label.includes(' on inserted text'));
  assert.ok(checks.length > 100);
  assert.ok(checks.every((c) => c.minimum === 4.5 && c.kind === 'text'));
  assert.ok(checks.some((c) => !c.passed));
});
test('missing background stacks, unsupported typography, and unknown roles fail', () => {
  const theme = buildTheme('dark');
  delete theme.colors['editor.background'];
  assert.throws(() => auditTheme(theme, contract), /missing background/);
  theme.tokenColors[1].settings.background = '#fff';
  assert.ok(
    validateTheme(theme, registry, contract).some((e) => e.includes('per-token backgrounds')),
  );
  assert.throws(() => resolveColor(palettes.dark, 'typo'));
});
