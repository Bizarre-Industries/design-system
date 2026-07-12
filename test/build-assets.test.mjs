import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { buildExpectedAssets } from '../scripts/build-assets.mjs';

const root = new URL('../', import.meta.url);

test('builds the exact governed asset package in stable path order', async () => {
  const files = await buildExpectedAssets(root);
  const source = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../brand/assets.json', import.meta.url)));
  const payloadPaths = source.assets
    .map(({ path }) => `generated/${path.slice('packages/assets/'.length)}`)
    .sort();

  assert.deepEqual([...files.keys()], ['generated/manifest.json', ...payloadPaths].sort());
  assert.ok([...files.values()].every(Buffer.isBuffer));

  const manifest = JSON.parse(files.get('generated/manifest.json'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.package, '@bizarre/assets');
  assert.deepEqual(Object.keys(manifest.files), payloadPaths);
  assert.ok(manifest.evidence.some(({ path }) => path === 'BRAND.md'), 'finalized brand guidance must be governed evidence');
  assert.ok(manifest.evidence.some(({ path }) => path === 'schemas/assets.schema.json'));
  for (const license of source.assets.filter(({ kind }) => kind === 'license')) {
    assert.ok(manifest.evidence.some(({ path }) => path === license.path));
  }
});

test('rejects files in the governed source package that are absent from the asset manifest', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-build-assets-leak-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'brand'), { recursive: true });
  await mkdir(join(directory, 'governance'), { recursive: true });
  await mkdir(join(directory, 'packages', 'assets'), { recursive: true });
  await writeFile(join(directory, 'packages', 'assets', 'package.json'), '{}\n');
  await writeFile(join(directory, 'packages', 'assets', 'manifest.json'), '{}\n');
  await writeFile(join(directory, 'packages', 'assets', 'undeclared.bin'), Buffer.from([0, 1, 2]));
  await writeFile(join(directory, 'brand', 'assets.json'), JSON.stringify({ schemaVersion: 1, assets: [] }));
  await writeFile(join(directory, 'governance', 'evidence-allowlist.json'), JSON.stringify({ schemaVersion: 1, paths: [] }));

  await assert.rejects(buildExpectedAssets(pathToFileURL(`${directory}/`)), /undeclared asset package file: packages\/assets\/undeclared\.bin/);
});
