import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { palettes, resolveColor } from '../src/palettes.mjs';
import { root, readJson, json } from './lib/project.mjs';

export function buildTheme(variant) {
  const palette = palettes[variant];
  if (!palette) throw new Error(`Unknown variant: ${variant}`);
  const workbench = readJson('src/workbench.json');
  const syntax = readJson('src/syntax.json');
  const semantic = readJson('src/semantic.json');
  return {
    $schema: 'vscode://schemas/color-theme',
    name: `Tide ${variant === 'dark' ? 'Dark' : 'Light'}`,
    semanticHighlighting: true,
    colors: Object.fromEntries(
      Object.entries(workbench)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([key, role]) => [key, resolveColor(palette, role)]),
    ),
    tokenColors: [
      { name: 'Default typography', settings: { foreground: palette.foreground, fontStyle: '' } },
      ...syntax.map(({ name, scope, role, fontStyle = '' }) => ({
        name,
        scope,
        settings: { foreground: resolveColor(palette, role), fontStyle },
      })),
    ],
    semanticTokenColors: {
      '*': { italic: false },
      ...Object.fromEntries(
        Object.entries(semantic)
          .sort(([a], [b]) => a.localeCompare(b, 'en'))
          .map(([selector, role]) => [
            selector,
            {
              foreground: resolveColor(palette, role),
              italic: false,
              bold: false,
              underline: false,
            },
          ]),
      ),
    },
  };
}

export function build() {
  mkdirSync(resolve(root, 'themes'), { recursive: true });
  for (const variant of Object.keys(palettes))
    writeFileSync(resolve(root, `themes/tide-${variant}.json`), json(buildTheme(variant)));
  console.log('Built Tide Dark and Tide Light.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) build();
