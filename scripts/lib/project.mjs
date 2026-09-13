import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export function parseJsonStrict(text, path = 'JSON') {
  const value = JSON.parse(text);
  const source = ts.parseJsonText(path, text);
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const keys = new Set();
      for (const property of node.properties) {
        const key = property.name.text;
        if (keys.has(key)) {
          const { line, character } = source.getLineAndCharacterOfPosition(
            property.getStart(source),
          );
          throw new Error(`${path}:${line + 1}:${character + 1}: duplicate JSON key ${key}`);
        }
        keys.add(key);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return value;
}
export const readJson = (path) =>
  parseJsonStrict(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'), path);
export const json = (value) => JSON.stringify(value, null, 2) + '\n';
