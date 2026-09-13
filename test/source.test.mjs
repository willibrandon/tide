import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonStrict } from '../scripts/lib/project.mjs';
import { extractColorRegistrations } from '../scripts/lib/source.mjs';

test('duplicate role keys fail instead of silently overwriting palette intent', () => {
  assert.throws(
    () => parseJsonStrict('{"colors":{"editor.background":"#000","editor.background":"#fff"}}'),
    /duplicate JSON key editor.background/,
  );
  assert.throws(() => parseJsonStrict('{"x":1,"\\u0078":2}'), /duplicate JSON key x/);
  assert.deepEqual(parseJsonStrict('{"dark":{"accent":1},"light":{"accent":2}}'), {
    dark: { accent: 1 },
    light: { accent: 2 },
  });
});

test('strict JSON parsing preserves JSON values and rejects JavaScript-only syntax', () => {
  const source = '{"__proto__":{"safe":true},"values":[null,false,-1.25e2,"escaped \\\" text"]}';
  assert.deepEqual(parseJsonStrict(source), JSON.parse(source));
  for (const text of ['{"x":1,}', '{/* comment */"x":1}', '{x:1}', 'NaN', '(1)']) {
    assert.throws(() => parseJsonStrict(text), SyntaxError);
  }
  assert.throws(
    () => parseJsonStrict('[{\n  "x": 1,\n  "x": 2\n}]', 'palette.json'),
    /palette\.json:3:3: duplicate JSON key x/,
  );
});

test('registry extraction handles TypeScript and literal registrations without compiler APIs', () => {
  const source = `
    @sealed
    class Example { constructor(@service readonly value: string) {} }
    const color: string = registerColor('editor.example', null, localize('example', 'Example'), true);
    theme.registerColor(\`editor.template\`, {}, 'Template', false);
    registerColor(dynamicKey, {}, 'Dynamic');
    registerColor(\`editor.\${suffix}\`, {}, 'Interpolated');
    unregisterColor('editor.notARegistration');
    // registerColor('editor.comment', {}, 'Comment');
    const text = "registerColor('editor.string', {}, 'String')";
  `;
  assert.deepEqual(extractColorRegistrations(source, 'colors.ts'), {
    'editor.example': {
      source: 'colors.ts',
      description: "localize('example', 'Example')",
      requiresTransparency: true,
    },
    'editor.template': {
      source: 'colors.ts',
      description: "'Template'",
      requiresTransparency: false,
    },
  });
});
