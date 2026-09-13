import { readJson } from './lib/project.mjs';

export function validateRelease(manifest, lock, tag) {
  if (manifest.version !== lock.version || manifest.version !== lock.packages[''].version)
    throw new Error('Manifest/lockfile version mismatch');
  if (tag !== `v${manifest.version}`)
    throw new Error(`Release tag ${tag} does not match v${manifest.version}`);
  return manifest.version;
}
if (process.argv[1]?.endsWith('/release.mjs') || process.argv[1] === 'scripts/release.mjs') {
  const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
  if (!tag) throw new Error('Pass the release tag: npm run check:release -- v0.1.0');
  console.log(
    `Release ${validateRelease(readJson('package.json'), readJson('package-lock.json'), tag)} is consistent.`,
  );
}
