import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonStrict } from '../scripts/lib/project.mjs';

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
