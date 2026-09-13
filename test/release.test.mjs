import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease } from '../scripts/release.mjs';
test('release tags and both lockfile versions must match the manifest', () => {
  const manifest = { name: 'tide-theme', publisher: 'willibrandon', version: '0.1.0' };
  const lock = { version: '0.1.0', packages: { '': { version: '0.1.0' } } };
  assert.equal(validateRelease(manifest, lock, 'v0.1.0'), '0.1.0');
  assert.throws(() => validateRelease(manifest, lock, 'v0.2.0'));
  lock.packages[''].version = '0.0.1';
  assert.throws(() => validateRelease(manifest, lock, 'v0.1.0'));
});

test('release identity must match the registered publisher and extension name', () => {
  const manifest = { name: 'tide-theme', publisher: 'willibrandon', version: '0.1.0' };
  const lock = { version: '0.1.0', packages: { '': { version: '0.1.0' } } };
  assert.throws(
    () => validateRelease({ ...manifest, publisher: 'other' }, lock, 'v0.1.0'),
    /identity/,
  );
  assert.throws(() => validateRelease({ ...manifest, name: 'other' }, lock, 'v0.1.0'), /identity/);
});
