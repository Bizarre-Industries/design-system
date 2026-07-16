import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('package contract identifies the canonical package and downstream boundary', async () => {
  const contract = await readJson('governance/package-contract.json');
  assert.equal(contract.schemaVersion, 1);
  assert.equal(contract.canonicalRepository, 'Bizarre-Industries/design-system');
  assert.deepEqual(contract.packages, ['@bizarre/assets', '@bizarre/atlas', '@bizarre/open-design', '@bizarre/tokens', '@bizarre/ui']);
  assert.deepEqual(contract.publication, {
    publishable: ['@bizarre/assets', '@bizarre/tokens', '@bizarre/ui'],
    privateWorking: ['@bizarre/atlas', '@bizarre/open-design'],
    provisionalAssetManifest: 'brand/provisional-assets.json'
  });
  assert.equal(contract.downstream.themes.repository, 'Bizarre-Industries/themes');
  assert.equal(contract.downstream.themes.policy, 'pin-released-version');
});

test('workspace exposes both governed packages and the exact asset publish boundary', async () => {
  const workspace = await readJson('package.json');
  const lock = await readJson('package-lock.json');
  const assets = await readJson('packages/assets/package.json');
  const openDesign = await readJson('packages/open-design/package.json');
  const ui = await readJson('packages/ui/package.json');
  assert.deepEqual(workspace.workspaces, ['packages/*']);
  assert.equal(lock.packages['packages/assets'].name, '@bizarre/assets');
  assert.equal(lock.packages['node_modules/@bizarre/assets'].resolved, 'packages/assets');
  assert.equal(lock.packages['packages/ui'].name, '@bizarre/ui');
  assert.equal(lock.packages['node_modules/@bizarre/ui'].resolved, 'packages/ui');
  assert.equal(lock.packages['packages/open-design'].name, '@bizarre/open-design');
  assert.equal(lock.packages['node_modules/@bizarre/open-design'].resolved, 'packages/open-design');
  assert.deepEqual(assets.files, ['generated']);
  assert.deepEqual(assets.exports, {
    './manifest.json': './generated/manifest.json',
    './fonts.css': './generated/fonts/bizarre-fonts.css',
    './fonts/*': './generated/fonts/*',
    './logo/*': './generated/logo/*'
  });
  assert.equal((await readJson('packages/atlas/package.json')).private, true);
  assert.equal(openDesign.private, true);
  assert.deepEqual(ui.files, ['generated', 'README.md']);
  assert.deepEqual(ui.exports, {
    './components.css': './generated/components.css',
    './contract.json': './generated/contract.json',
    './manifest.json': './generated/manifest.json',
    './motion.css': './generated/motion.css',
    './rtl.css': './generated/rtl.css'
  });
  assert.deepEqual(openDesign.files, ['generated', 'README.md']);
  assert.deepEqual(openDesign.exports, {
    './manifest.json': './generated/manifest.json',
    './preview': './generated/preview/index.html',
    './manual': './generated/manual/index.html',
    './print': './generated/manual/print.html',
    './evidence.json': './generated/release/evidence.json'
  });
  assert.equal(openDesign.dependencies, undefined);
  assert.equal(openDesign.peerDependencies, undefined);
  assert.equal(openDesign.optionalDependencies, undefined);
});

test('CI runs the complete verification gate on Node 22', async () => {
  const workflow = await readFile(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm run verify/);
});
