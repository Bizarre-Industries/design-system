import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { validateAssets } from '../scripts/lib/assets.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-assets-'));
  await mkdir(join(directory, 'assets'), { recursive: true });
  await writeFile(join(directory, 'assets', 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await writeFile(join(directory, 'assets', 'font.ttf'), Buffer.from('font'));
  await writeFile(join(directory, 'assets', 'font.woff2'), Buffer.from('woff2'));
  await writeFile(join(directory, 'assets', 'OFL.txt'), 'SIL OPEN FONT LICENSE Version 1.1');
  const entry = async (path, mediaType, extra = {}) => ({
    path,
    sha256: hash(await readFile(join(directory, path))),
    mediaType,
    approved: true,
    ...extra,
  });
  const manifest = {
    schemaVersion: 1,
    assets: [
      await entry('assets/mark.svg', 'image/svg+xml', { kind: 'logo', role: 'primary' }),
      await entry('assets/OFL.txt', 'text/plain', { kind: 'license', family: 'Example' }),
      await entry('assets/font.ttf', 'font/ttf', { kind: 'font', family: 'Example', style: 'normal', weightRange: [100, 900], license: 'assets/OFL.txt' }),
      await entry('assets/font.woff2', 'font/woff2', { kind: 'font', family: 'Example', style: 'normal', weightRange: [100, 900], master: 'assets/font.ttf', license: 'assets/OFL.txt' }),
    ],
  };
  return { root: new URL(`file://${directory}/`), directory, manifest };
}

test('validates governed assets and returns path-sorted rows', async () => {
  const { root, manifest } = await fixture();
  const rows = await validateAssets(root, { ...manifest, assets: manifest.assets.toReversed() });
  assert.deepEqual(rows.map(({ path }) => path), rows.map(({ path }) => path).toSorted());
  assert.deepEqual(Object.keys(rows[0]), ['path', 'sha256', 'mediaType']);
});

test('rejects missing paths and symlinks', async () => {
  const { root, directory, manifest } = await fixture();
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...manifest.assets[0], path: 'assets/missing.svg' }] }), /missing asset/);
  await symlink(join(directory, 'assets', 'mark.svg'), join(directory, 'assets', 'linked.svg'));
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...manifest.assets[0], path: 'assets/linked.svg' }] }), /symlink/);
});

test('rejects a symlink in an asset path ancestor', async () => {
  const { root, directory, manifest } = await fixture();
  const outside = await mkdtemp(join(tmpdir(), 'bizarre-assets-outside-'));
  await writeFile(join(outside, 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await symlink(outside, join(directory, 'assets', 'linked-directory'));
  const linked = {
    ...manifest.assets[0],
    path: 'assets/linked-directory/mark.svg',
    sha256: hash(await readFile(join(outside, 'mark.svg'))),
  };
  await assert.rejects(validateAssets(root, { ...manifest, assets: [linked] }), /symlink/);
});

test('rejects unsafe traversal, hash drift, and wrong media type', async () => {
  const { root, manifest } = await fixture();
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...manifest.assets[0], path: '../mark.svg' }] }), /safe relative path/);
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...manifest.assets[0], sha256: '0'.repeat(64) }] }), /sha256 mismatch/);
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...manifest.assets[0], mediaType: 'image/png' }] }), /media type/);
});

test('rejects derivatives without masters and unapproved publishable entries', async () => {
  const { root, manifest } = await fixture();
  const derivative = manifest.assets.find(({ master }) => master);
  await assert.rejects(validateAssets(root, { ...manifest, assets: [derivative] }), /master/);
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...manifest.assets[0], approved: false }] }), /unapproved/);
});

test('rejects master on a non-WOFF2 entry', async () => {
  const { root, manifest } = await fixture();
  const malformed = structuredClone(manifest);
  malformed.assets[0].master = 'assets/font.ttf';
  await assert.rejects(validateAssets(root, malformed), /master is only allowed on font\/woff2 entries/);
});

test('rejects a WOFF2 entry without a master', async () => {
  const { root, manifest } = await fixture();
  const malformed = structuredClone(manifest);
  delete malformed.assets.find(({ mediaType }) => mediaType === 'font/woff2').master;
  await assert.rejects(validateAssets(root, malformed), /font\/woff2 entry must reference a governed font\/ttf source/);
});

test('rejects a self-referencing WOFF2 master', async () => {
  const { root, manifest } = await fixture();
  const malformed = structuredClone(manifest);
  const derivative = malformed.assets.find(({ mediaType }) => mediaType === 'font/woff2');
  derivative.master = derivative.path;
  await assert.rejects(validateAssets(root, malformed), /must not reference itself|cyclic master/);
});

test('rejects cyclic font master references', async () => {
  const { root, manifest } = await fixture();
  const malformed = structuredClone(manifest);
  const source = malformed.assets.find(({ mediaType }) => mediaType === 'font/ttf');
  const derivative = malformed.assets.find(({ mediaType }) => mediaType === 'font/woff2');
  source.master = derivative.path;
  await assert.rejects(validateAssets(root, malformed), /master is only allowed on font\/woff2 entries|cyclic master/);
});

test('rejects a WOFF2-to-WOFF2 master link', async () => {
  const { root, directory, manifest } = await fixture();
  await writeFile(join(directory, 'assets', 'other.woff2'), Buffer.from('other woff2'));
  const malformed = structuredClone(manifest);
  const sha256 = hash(await readFile(join(directory, 'assets', 'other.woff2')));
  malformed.assets.push({
    ...malformed.assets.find(({ mediaType }) => mediaType === 'font/woff2'),
    path: 'assets/other.woff2',
    sha256,
    master: 'assets/font.woff2',
  });
  await assert.rejects(validateAssets(root, malformed), /font\/woff2 entry must reference a governed font\/ttf source/);
});

for (const [field, badValue] of [
  ['family', 'Other Family'],
  ['style', 'italic'],
  ['weightRange', [200, 800]],
  ['license', 'assets/other-OFL.txt'],
]) {
  test(`rejects a derivative whose ${field} does not match its master`, async () => {
    const { root, manifest } = await fixture();
    const malformed = structuredClone(manifest);
    malformed.assets.find(({ mediaType }) => mediaType === 'font/woff2')[field] = badValue;
    await assert.rejects(validateAssets(root, malformed), new RegExp(`${field} must match master`));
  });
}

test('rejects a font without a matching family OFL license', async () => {
  const { root, manifest } = await fixture();
  const font = manifest.assets.find(({ path }) => path.endsWith('.ttf'));
  await assert.rejects(validateAssets(root, { ...manifest, assets: [{ ...font, license: undefined }] }), /OFL license/);
});

for (const [name, contents, pattern] of [
  ['CRLF line endings', 'SIL OPEN FONT LICENSE Version 1.1\r\n', /CRLF line endings/],
  ['trailing whitespace', 'SIL OPEN FONT LICENSE Version 1.1 \n', /trailing whitespace/],
]) {
  test(`rejects governed text assets with ${name}`, async () => {
    const { root, directory, manifest } = await fixture();
    const license = manifest.assets.find(({ kind }) => kind === 'license');
    await writeFile(join(directory, license.path), contents);
    license.sha256 = hash(await readFile(join(directory, license.path)));
    await assert.rejects(validateAssets(root, manifest), pattern);
  });
}

test('repository asset manifest validates and matches its schema', async () => {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('../brand/assets.json', import.meta.url)));
  const schema = JSON.parse(await readFile(new URL('../schemas/assets.schema.json', import.meta.url)));
  assert.equal(manifest.schemaVersion, schema.properties.schemaVersion.const);
  assert.equal(schema.additionalProperties, false);
  assert.ok((await validateAssets(root, manifest)).length >= 20);
});
