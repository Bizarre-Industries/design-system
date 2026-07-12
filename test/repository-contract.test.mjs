import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('repository declares its canonical boundary and required scripts', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const readme = await read('README.md');
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.workspaces, ['packages/*']);
  assert.equal(pkg.engines.node, '>=22');
  assert.equal(pkg.scripts.verify, 'npm test && npm run check:generated');
  assert.equal(pkg.scripts.build, 'npm run build:tokens && npm run build:assets');
  assert.match(readme, /canonical Bizarre Industries design language/i);
  assert.match(readme, /themes.*downstream/i);
});

test('repository ignores local runtime state', async () => {
  const ignore = await read('.gitignore');
  for (const entry of ['node_modules/', '.DS_Store', '.superpowers/', '*.log', '*.tmp']) {
    assert.ok(ignore.split(/\r?\n/).includes(entry), `missing ignore rule: ${entry}`);
  }
});
