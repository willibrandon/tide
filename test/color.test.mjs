import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrast, parseHex, flatten, composite } from '../scripts/lib/color.mjs';

test('WCAG reference ratios and threshold are not rounded up', () => {
  assert.equal(contrast('#000', ['#fff']), 21);
  assert.equal(contrast('#fff', ['#fff']), 1);
  assert.ok(contrast('#767676', ['#fff']) >= 4.5);
  assert.ok(contrast('#777777', ['#fff']) < 4.5);
});
test('short alpha notation and nested compositing match explicit equivalents', () => {
  assert.deepEqual(parseHex('#1234'), parseHex('#11223344'));
  assert.deepEqual(flatten(['#0008', '#fff']), composite(parseHex('#0008'), parseHex('#fff')));
  assert.ok(Math.abs(contrast('#00000080', ['#fff']) - 4.0041) < 0.01);
  assert.deepEqual(flatten(['#0000', '#fff']), parseHex('#fff'));
});
test('invalid colors and incomplete background stacks fail closed', () => {
  for (const invalid of ['red', '#12345', '#GG0000', null, 12])
    assert.throws(() => parseHex(invalid));
  assert.throws(() => flatten([]));
  assert.throws(() => flatten(['#0008']));
});
