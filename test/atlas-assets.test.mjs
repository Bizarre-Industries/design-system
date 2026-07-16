import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildExpectedAssets } from '../scripts/build-assets.mjs';
import {
  assertAssetManifestSeparation,
  validateAssets,
  validateProvisionalAssets,
} from '../scripts/lib/assets.mjs';
import { assertSchemaValid } from './helpers/schema-contract.mjs';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const aperturePath = 'packages/atlas/generated/calibrated-aperture.svg';

test('isolates every current Atlas SVG in a governed provisional inventory', async () => {
  const [publishable, provisional, atlasManifest] = await Promise.all([
    readJson('brand/assets.json'),
    readJson('brand/provisional-assets.json'),
    readJson('packages/atlas/generated/manifest.json'),
  ]);
  const expectedPaths = Object.keys(atlasManifest.files)
    .filter((path) => path.endsWith('.svg'))
    .map((path) => `packages/atlas/${path}`)
    .sort();

  assert.equal(assertAssetManifestSeparation(publishable, provisional), true);
  assert.deepEqual(
    publishable.assets.filter(({ path }) => path.startsWith('packages/atlas/generated/')),
    [],
  );
  assert.deepEqual(provisional.assets.map(({ path }) => path).sort(), expectedPaths);
  assert.equal(provisional.version, 'v1');
  assert.equal(provisional.classification, 'governed-provisional');
  assert.equal(provisional.publicationStatus, 'nonpublishable');
  assert.deepEqual(provisional.promotionRequires, [
    'explicit-master-approval',
    'geometry-and-provenance-verification',
    'dependent-asset-regeneration',
    'publishable-boundary-review',
  ]);
});

test('records the aperture as a nonpublishable working master and every Atlas output as its provisional derivative', async () => {
  const provisional = await readJson('brand/provisional-assets.json');
  const rows = await validateProvisionalAssets(root, provisional);
  const aperture = provisional.assets.find(({ path }) => path === aperturePath);

  assert.equal(rows.length, provisional.assets.length);
  assert.equal(aperture.kind, 'aperture');
  assert.equal(aperture.relationship, 'master');
  assert.equal(aperture.master, undefined);
  for (const entry of provisional.assets) {
    assert.equal(entry.approved, false, entry.path);
    assert.equal(entry.approvalState, 'provisional', entry.path);
    assert.equal(entry.authorityStatus, 'governed-provisional', entry.path);
    assert.equal(entry.verificationStatus, 'NOT VERIFIED', entry.path);
    assert.equal(entry.publicationStatus, 'nonpublishable', entry.path);
    assert.equal(entry.publishable, false, entry.path);
    if (entry !== aperture) {
      assert.equal(entry.relationship, 'derivative', entry.path);
      assert.equal(entry.master, aperturePath, entry.path);
    }
  }
});

test('both asset manifests satisfy their separate schemas', async () => {
  const [publishable, publishableSchema, provisional, provisionalSchema] = await Promise.all([
    readJson('brand/assets.json'),
    readJson('schemas/assets.schema.json'),
    readJson('brand/provisional-assets.json'),
    readJson('schemas/provisional-assets.schema.json'),
  ]);

  assertSchemaValid(publishableSchema, publishable);
  assertSchemaValid(provisionalSchema, provisional);
  assert.ok((await validateAssets(root, publishable)).length > 0);
  assert.ok((await validateProvisionalAssets(root, provisional)).length > 0);
});

test('rejects overlap, status promotion, incomplete coverage, and provenance drift', async () => {
  const [publishable, provisional] = await Promise.all([
    readJson('brand/assets.json'),
    readJson('brand/provisional-assets.json'),
  ]);
  const overlap = structuredClone(publishable);
  overlap.assets.push(structuredClone(provisional.assets[0]));
  assert.throws(
    () => assertAssetManifestSeparation(overlap, provisional),
    /both publishable and provisional/,
  );

  const promoted = structuredClone(provisional);
  promoted.assets[0].approved = true;
  await assert.rejects(validateProvisionalAssets(root, promoted), /publishable or approved status/);

  const incomplete = structuredClone(provisional);
  incomplete.assets.pop();
  await assert.rejects(validateProvisionalAssets(root, incomplete), /classify every generated Atlas SVG/);

  const drifted = structuredClone(provisional);
  drifted.assets[0].generator.configurationHash = '0'.repeat(64);
  await assert.rejects(validateProvisionalAssets(root, drifted), /does not match Atlas manifest|provenance does not match Atlas manifest|configurationHash/);
});

test('the approved asset build emits no provisional Atlas files or export path', async () => {
  const [files, packageJson] = await Promise.all([
    buildExpectedAssets(root),
    readJson('packages/assets/package.json'),
  ]);
  const manifest = JSON.parse(files.get('generated/manifest.json'));

  assert.ok([...files.keys()].every((path) => !path.startsWith('generated/atlas/')));
  assert.ok(Object.keys(manifest.files).every((path) => !path.startsWith('generated/atlas/')));
  assert.equal(packageJson.exports['./atlas/*'], undefined);
  for (const [path, record] of Object.entries(manifest.files)) {
    assert.equal(record.approved, true, path);
    assert.equal(record.approvalState, 'approved', path);
  }
});
