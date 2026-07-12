import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const proofUrl = new URL('../examples/identity-proof/index.html', import.meta.url);

test('offline proof consumes canonical generated styles and approved marks', async () => {
  const html = await readFile(proofUrl, 'utf8');
  assert.match(html, /<html[^>]*data-bizarre-theme="void"/);
  assert.match(html, /href="\.\.\/\.\.\/packages\/tokens\/generated\/tokens\.css"/);
  assert.match(html, /href="\.\.\/\.\.\/packages\/assets\/generated\/fonts\/bizarre-fonts\.css"/);
  assert.match(html, /src="\.\.\/\.\.\/packages\/assets\/generated\/logo\/mark-primary\.svg"/);
  assert.match(html, /src="\.\.\/\.\.\/packages\/assets\/generated\/logo\/mark-inverse\.svg"/);
  assert.doesNotMatch(html, /https?:\/\/|fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(html, /tokens\/tokens\.css/);
  assert.doesNotMatch(html, /--bzr-[\w-]+\s*:/, 'proof must not redefine governed tokens');
  assert.match(html, /MARK · INVERSE/);
  assert.match(html, /MARK · PRIMARY/);
  assert.match(html, /@bizarre\/tokens/);
  assert.match(html, /@bizarre\/assets/);
  assert.doesNotMatch(html, /overflow:\s*hidden/, 'mobile fit must not be achieved by masking overflow');
  assert.match(html, /figcaption\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(html, /\.panel h2\s*\{[^}]*overflow-wrap:\s*break-word/s);
});

test('proof active theme declares every semantic variable it consumes', async () => {
  const html = await readFile(proofUrl, 'utf8');
  const css = await readFile(new URL('../packages/tokens/generated/tokens.css', import.meta.url), 'utf8');
  const theme = html.match(/<html[^>]*data-bizarre-theme="([^"]+)"/)?.[1];
  assert.ok(theme, 'proof root must select an explicit theme');
  const declarations = css.match(new RegExp(`\\[data-bizarre-theme="${theme}"\\]\\s*\\{([^}]*)\\}`, 's'))?.[1];
  assert.ok(declarations, `missing active theme selector for ${theme}`);
  const declared = new Map([...declarations.matchAll(/(--bzr-[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
  const consumed = new Set([...html.matchAll(/var\((--bzr-(?:(?:surface|content|action|status)-[\w-]+|border-(?:default|strong|accent)))\)/g)].map(([, name]) => name));
  assert.ok(consumed.size > 0);
  for (const name of consumed) assert.ok(declared.get(name) && declared.get(name) !== 'unset', `${name} is unset for ${theme}`);
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
