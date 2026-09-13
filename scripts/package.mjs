import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { root, readJson } from './lib/project.mjs';

const { version } = readJson('package.json');
const output = `dist/tide-theme-${version}.vsix`;
mkdirSync(resolve(root, 'dist'), { recursive: true });
const cli = resolve(root, 'node_modules/@vscode/vsce/vsce');
// Inspect the actual package inventory before producing an installable artifact.
const files = execFileSync(process.execPath, [cli, 'ls', '--no-dependencies'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const allowed =
  /^(?:package\.json|README\.md|CHANGELOG\.md|LICENSE|THIRD_PARTY_NOTICES\.txt|docs\/ACCESSIBILITY\.md|themes\/tide-(?:dark|light)\.json|assets\/(?:icon|tide-(?:dark|light)(?:-diff)?)\.png)$/;
const unexpected = files.filter((path) => !allowed.test(path));
if (unexpected.length) throw new Error(`Unexpected packaged files: ${unexpected.join(', ')}`);
for (const required of [
  'package.json',
  'LICENSE',
  'THIRD_PARTY_NOTICES.txt',
  'assets/icon.png',
  'themes/tide-dark.json',
  'themes/tide-light.json',
])
  if (!files.includes(required)) throw new Error(`Missing packaged file: ${required}`);
const contentRef = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : 'main';
execFileSync(
  process.execPath,
  [cli, 'package', '--no-dependencies', '--githubBranch', contentRef, '--out', output],
  {
    cwd: root,
    stdio: 'inherit',
  },
);
const digest = createHash('sha256')
  .update(readFileSync(resolve(root, output)))
  .digest('hex');
writeFileSync(resolve(root, `${output}.sha256`), `${digest}  ${output.split('/').at(-1)}\n`);
console.log(`SHA-256: ${digest}`);
