import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { open } from '@vscode/test-web';
import { root, readJson } from './lib/project.mjs';

const server = await open({
  browserType: 'none',
  quality: 'stable',
  commit: readJson('reference/vscode-colors.json').commit,
  extensionDevelopmentPath: root,
  folderPath: resolve(root, 'showcase'),
  host: 'localhost',
  port: 4173,
  testRunnerDataDir: resolve(tmpdir(), 'tide-vscode-test-web'),
});
console.log(
  'Tide preview: http://localhost:4173 — choose Tide Dark or Tide Light in the theme picker.',
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    server.dispose();
    process.exit(0);
  });
