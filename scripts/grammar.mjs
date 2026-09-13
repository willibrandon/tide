import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import textmate from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';
import { palettes } from '../src/palettes.mjs';
import { root, readJson, json } from './lib/project.mjs';

let loaded;
export async function tokenize(theme, language, text) {
  loaded ??= oniguruma.loadWASM(
    readFileSync(resolve(root, 'node_modules/vscode-oniguruma/release/onig.wasm')).buffer,
  );
  await loaded;
  const grammars = readJson('reference/grammars.json');
  const registry = new textmate.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (text) => new oniguruma.OnigString(text),
    }),
    theme: { settings: theme.tokenColors },
    loadGrammar: async (scope) => {
      const entry = Object.entries(grammars).find(([, value]) => value.scope === scope);
      return entry ? readJson(`reference/grammars/${entry[0]}.json`) : null;
    },
  });
  try {
    const grammar = await registry.loadGrammar(grammars[language].scope);
    if (!grammar) throw new Error(`Unable to load grammar: ${language}`);
    let state = textmate.INITIAL;
    const lines = [];
    for (const line of text.split('\n')) {
      const result = grammar.tokenizeLine2(line, state);
      const colors = registry.getColorMap();
      const tokens = [];
      for (let i = 0; i < result.tokens.length; i += 2) {
        const start = result.tokens[i],
          end = result.tokens[i + 2] ?? line.length;
        const metadata = result.tokens[i + 1];
        tokens.push({
          start,
          end,
          text: line.slice(start, end),
          foreground: colors[(metadata >>> 15) & 0x1ff],
          fontStyle: (metadata >>> 11) & 0xf,
        });
      }
      lines.push({ line, tokens });
      state = result.ruleStack;
    }
    return lines;
  } finally {
    registry.dispose();
  }
}

export async function checkGrammars(themes) {
  const results = [];
  for (const theme of themes) {
    const variant = theme.name.endsWith('Dark') ? 'dark' : 'light';
    for (const fixture of readJson('showcase/grammar-cases.json')) {
      const text = readFileSync(resolve(root, 'showcase', fixture.file), 'utf8');
      const lines = await tokenize(theme, fixture.language, text);
      if (lines.some((line) => line.tokens.some((t) => (t.fontStyle & 1) !== 0)))
        throw new Error(`${theme.name}: italic token in ${fixture.file}`);
      for (const check of fixture.checks) {
        const line = lines.find(({ line }) => line.includes(check.needle));
        if (!line) throw new Error(`Missing grammar assertion needle: ${check.needle}`);
        const position = line.line.indexOf(check.needle);
        const token = line.tokens.find((t) => t.start <= position && t.end > position);
        const expected = palettes[variant][check.role].toUpperCase();
        if (token?.foreground?.toUpperCase() !== expected)
          throw new Error(
            `${theme.name}, ${fixture.file}: ${check.needle} expected ${check.role} (${expected}), got ${token?.foreground}`,
          );
        results.push({
          theme: theme.name,
          file: fixture.file,
          needle: check.needle,
          role: check.role,
          foreground: token.foreground,
        });
      }
    }
  }
  mkdirSync(resolve(root, 'dist'), { recursive: true });
  writeFileSync(resolve(root, 'dist/grammar.json'), json(results));
  console.log(
    `Grammar: ${results.length} role assertions passed across 8 pinned grammars; no italic tokens.`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await checkGrammars(['dark', 'light'].map((v) => readJson(`themes/tide-${v}.json`)));
