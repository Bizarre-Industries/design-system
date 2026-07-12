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
    $extensions: { 'industries.bizarre': { themeOrder, contrastPairs: [] } },
    modes: { void: { ink: color('#000') }, paper: { ink: color('#fff') } }
  }));
  await writeFile(join(directory, 'tokens', 'source', 'manifest.json'), JSON.stringify([
    'brand.tokens.json',
    'modes.tokens.json'
  ]));
  await writeFile(join(directory, 'governance', 'evidence-allowlist.json'), JSON.stringify({ paths: [] }));
  return pathToFileURL(`${directory}/`);
}

test('builds exact token package files', async () => {
  const files = await buildExpected(root);
  assert.deepEqual([...files.keys()], ['generated/manifest.json', 'generated/tokens.css', 'generated/tokens.json']);
  const css = files.get('generated/tokens.css').toString('utf8');
  assert.match(css, /--bzr-brand-accent-signal: var\(--bzr-color-accent-signal\);/);
  assert.match(css, /--bzr-font-size-base: 1rem;/);
  assert.match(css, /--bzr-motion-duration-fast: 150ms;/);
  assert.match(css, /--bzr-motion-easing-out: cubic-bezier\(0\.16, 1, 0\.3, 1\);/);
  assert.match(css, /--bzr-font-family-body: "Hanken Grotesk", "Helvetica Neue", "system-ui", "sans-serif";/);
  assert.match(css, /--bzr-shadow-md: 0px 4px 12px 0px #0000001F;/);
  for (const theme of ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']) {
    assert.match(css, new RegExp(`\\[data-bizarre-theme="${theme}"\\]`));
  }
  assert.match(css, /--bzr-surface-canvas: var\(--bzr-color-neutral-void\);/);
  assert.doesNotMatch(css, /\{[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+\}/);
  assert.doesNotMatch(css, /\[data-theme="light"\]/);
  assert.doesNotMatch(css, /--(?:fs|surface)-/);
  for (const declaration of css.matchAll(/--([\w-]+):/g)) assert.match(declaration[0], /^--bzr-/);
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
    await assert.rejects(buildExpected(await themeFixture(t, order)), /themeOrder must list every (?:semantic mode|theme) exactly once/);
  });
}
