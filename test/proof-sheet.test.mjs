import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const proofUrl = new URL('../examples/identity-proof/index.html', import.meta.url);

test('offline proof consumes canonical generated styles and approved marks', async () => {
  const html = await readFile(proofUrl, 'utf8');
  assert.match(html, /href="\.\.\/\.\.\/packages\/tokens\/generated\/tokens\.css"/);
  assert.match(html, /href="\.\.\/\.\.\/packages\/assets\/generated\/fonts\/bizarre-fonts\.css"/);
  assert.match(html, /src="\.\.\/\.\.\/packages\/assets\/generated\/logo\/mark-primary\.svg"/);
  assert.match(html, /src="\.\.\/\.\.\/packages\/assets\/generated\/logo\/mark-inverse\.svg"/);
  assert.doesNotMatch(html, /https?:\/\/|fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(html, /tokens\/tokens\.css/);
  assert.doesNotMatch(html, /--bzr-[\w-]+\s*:/, 'proof must not redefine governed tokens');
  assert.match(html, /MARK · INVERSE/);
  assert.match(html, /@bizarre\/tokens/);
  assert.match(html, /@bizarre\/assets/);
});

test('every local proof resource resolves from its package-relative URL', async () => {
  const html = await readFile(proofUrl, 'utf8');
  const resources = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(([, path]) => path);
  assert.ok(resources.length >= 4);
  for (const path of resources) {
    assert.ok(!path.startsWith('data:'), `embedded resource is not governed: ${path}`);
    await access(new URL(path, proofUrl));
  }
});

test('legacy root proof sheet has been migrated', async () => {
  await assert.rejects(access(new URL('../proof-sheet.html', import.meta.url)));
});
