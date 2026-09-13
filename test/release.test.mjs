import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease } from '../scripts/release.mjs';
test('release tags and both lockfile versions must match the manifest', () => {
  const manifest = { version: '0.1.0' };
  const lock = { version: '0.1.0', packages: { '': { version: '0.1.0' } } };
  assert.equal(validateRelease(manifest, lock, 'v0.1.0'), '0.1.0');
  assert.throws(() => validateRelease(manifest, lock, 'v0.2.0'));
  lock.packages[''].version = '0.0.1';
  assert.throws(() => validateRelease(manifest, lock, 'v0.1.0'));
});
