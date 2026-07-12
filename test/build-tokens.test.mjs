import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { buildExpected } from '../scripts/build-tokens.mjs';

const root = new URL('../', import.meta.url);

async function themeFixture(t, themeOrder) {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-theme-order-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'tokens', 'source'), { recursive: true });
  await mkdir(join(directory, 'governance'), { recursive: true });
  const color = (value) => ({ $type: 'color', $value: value });
  await writeFile(join(directory, 'tokens', 'source', 'brand.tokens.json'), JSON.stringify({ brand: { ink: color('#000') } }));
  await writeFile(join(directory, 'tokens', 'source', 'modes.tokens.json'), JSON.stringify({
    $extensions: { 'industries.bizarre': { themeOrder } },
    modes: { void: { ink: color('#000') }, paper: { ink: color('#fff') } }
  }));
  await writeFile(join(directory, 'governance', 'evidence-allowlist.json'), JSON.stringify({ paths: [] }));
  return pathToFileURL(`${directory}/`);
}

test('builds exact token package files', async () => {
  const files = await buildExpected(root);
  assert.deepEqual([...files.keys()], ['generated/manifest.json', 'generated/tokens.css', 'generated/tokens.json']);
  const css = files.get('generated/tokens.css').toString('utf8');
  assert.match(css, /--bzr-brand-accent-signal: #C6FF24;/);
  assert.match(css, /\[data-bizarre-theme="paper"\]/);
  const manifest = JSON.parse(files.get('generated/manifest.json'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.package, '@bizarre/tokens');
  assert.ok(manifest.evidence.every(({ path }) => !path.startsWith('.superpowers/')));
});

for (const [label, order] of [
  ['missing', ['void']],
  ['unknown', ['void', 'paper', 'ghost']],
  ['duplicate', ['void', 'void']]
]) {
  test(`rejects ${label} themes in themeOrder`, async (t) => {
    await assert.rejects(buildExpected(await themeFixture(t, order)), /themeOrder must list every theme exactly once/);
  });
}
