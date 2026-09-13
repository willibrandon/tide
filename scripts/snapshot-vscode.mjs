// Refresh only against a deliberate, pinned release. Normal builds are offline.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractColorRegistrations } from './lib/source.mjs';
import { root, json } from './lib/project.mjs';

const checkout = process.argv[2];
const revision = process.argv[3] ?? '645f29cc3176500b4b5762ba887cf2a7f0ffdf2c';
if (!checkout) throw new Error('Usage: npm run reference:update -- /path/to/vscode [commit]');
const git = (args) =>
  execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const commit = git(['rev-parse', `${revision}^{commit}`]).trim();
const version = JSON.parse(git(['show', `${commit}:package.json`])).version;
const files = git(['grep', '-l', 'registerColor(', commit, '--', 'src'])
  .trim()
  .split('\n')
  .map((line) => line.slice(commit.length + 1))
  .filter((path) => !path.includes('/test/'));
const colors = {};
for (const path of files) {
  Object.assign(colors, extractColorRegistrations(git(['show', `${commit}:${path}`]), path));
}
// Built-in extensions (notably Git) contribute colors through their manifests.
for (const entry of git(['grep', '-l', '"colors"', commit, '--', 'extensions/*/package.json'])
  .trim()
  .split('\n')
  .filter(Boolean)) {
  const path = entry.slice(commit.length + 1);
  const manifest = JSON.parse(git(['show', `${commit}:${path}`]));
  for (const color of manifest.contributes?.colors ?? []) {
    colors[color.id] = {
      source: path,
      description: color.description,
      requiresTransparency: false,
    };
  }
}
// The terminal registers this fixed set through a loop rather than literal calls.
for (const name of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
  for (const prefix of ['', 'Bright'])
    colors[`terminal.ansi${prefix}${name}`] = {
      source: 'src/vs/workbench/contrib/terminal/common/terminalColorRegistry.ts',
      description: 'ANSI terminal palette entry; usable as either foreground or background.',
      requiresTransparency: false,
    };
}
mkdirSync(resolve(root, 'reference/grammars'), { recursive: true });
writeFileSync(
  resolve(root, 'reference/vscode-colors.json'),
  json({
    version,
    commit,
    checkedOn: '2026-09-13',
    colors: Object.fromEntries(Object.entries(colors).sort(([a], [b]) => a.localeCompare(b, 'en'))),
  }),
);
const grammars = {
  typescript: ['extensions/typescript-basics/syntaxes/TypeScript.tmLanguage.json', 'source.ts'],
  tsx: ['extensions/typescript-basics/syntaxes/TypeScriptReact.tmLanguage.json', 'source.tsx'],
  python: ['extensions/python/syntaxes/MagicPython.tmLanguage.json', 'source.python'],
  rust: ['extensions/rust/syntaxes/rust.tmLanguage.json', 'source.rust'],
  go: ['extensions/go/syntaxes/go.tmLanguage.json', 'source.go'],
  csharp: ['extensions/csharp/syntaxes/csharp.tmLanguage.json', 'source.cs'],
  css: ['extensions/css/syntaxes/css.tmLanguage.json', 'source.css'],
  json: ['extensions/json/syntaxes/JSON.tmLanguage.json', 'source.json'],
};
const available = {};
for (const [language, [path, scope]] of Object.entries(grammars)) {
  const grammar = git(['show', `${commit}:${path}`]);
  writeFileSync(resolve(root, `reference/grammars/${language}.json`), grammar);
  available[language] = { scope, source: path, commit };
}
writeFileSync(resolve(root, 'reference/grammars.json'), json(available));
writeFileSync(
  resolve(root, 'reference/VSCODE-LICENSE.txt'),
  git(['show', `${commit}:LICENSE.txt`]),
);
writeFileSync(
  resolve(root, 'reference/VSCODE-THIRD-PARTY-NOTICES.txt'),
  git(['show', `${commit}:ThirdPartyNotices.txt`]),
);
console.log(
  `Recorded ${Object.keys(colors).length} literal/ANSI color registrations and ${Object.keys(available).length} grammars from VS Code ${version} (${commit}).`,
);
