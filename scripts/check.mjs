import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTheme } from './build.mjs';
import { validateTheme, validateParity } from './lib/validate.mjs';
import { audit } from './audit.mjs';
import { checkGrammars } from './grammar.mjs';
import { readJson, root, json } from './lib/project.mjs';

const manifest = readJson('package.json');
const lock = readJson('package-lock.json');
const registry = readJson('reference/vscode-colors.json');
const contract = readJson('src/contrast-contract.json');
const errors = [];
const themes = ['dark', 'light'].map((variant) => {
  const path = `themes/tide-${variant}.json`;
  const theme = readJson(path);
  if (readFileSync(resolve(root, path), 'utf8') !== json(buildTheme(variant)))
    errors.push(`${path}: stale generated theme; run npm run build`);
  errors.push(...validateTheme(theme, registry, contract).map((e) => `${variant}: ${e}`));
  return theme;
});
errors.push(...validateParity(...themes));
if (manifest.version !== lock.version || manifest.version !== lock.packages[''].version)
  errors.push('Manifest and lockfile versions differ');
if (manifest.engines.vscode !== `^${registry.version}`)
  errors.push('VS Code engine and pinned registry version must match');
if (
  manifest.contributes.themes.length !== 2 ||
  manifest.contributes.themes.some(
    (t, i) =>
      t.label !== themes[i].name ||
      t.uiTheme !== ['vs-dark', 'vs'][i] ||
      t.path !== `./themes/tide-${['dark', 'light'][i]}.json`,
  )
)
  errors.push('Theme contributions do not match generated themes');
if (errors.length) throw new Error(errors.join('\n'));
audit(themes);
await checkGrammars(themes);
console.log(
  `Structure, parity, generated files, and VS Code ${registry.version} compatibility passed.`,
);
