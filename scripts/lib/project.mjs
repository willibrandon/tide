import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseExpression } from '@babel/parser';
import { walkSyntax } from './source.mjs';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export function parseJsonStrict(text, path = 'JSON') {
  const value = JSON.parse(text);
  const source = parseExpression(text, { sourceFilename: path });
  walkSyntax(source, (node) => {
    if (node.type === 'ObjectExpression') {
      const keys = new Set();
      for (const property of node.properties) {
        const key = property.key.value;
        if (keys.has(key)) {
          const { line, column } = property.loc.start;
          throw new Error(`${path}:${line}:${column + 1}: duplicate JSON key ${key}`);
        }
        keys.add(key);
      }
    }
  });
  return value;
}
export const readJson = (path) =>
  parseJsonStrict(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'), path);
export const json = (value) => JSON.stringify(value, null, 2) + '\n';
