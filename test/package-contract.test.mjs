import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('package contract identifies the canonical package and downstream boundary', async () => {
  const contract = await readJson('governance/package-contract.json');
  assert.equal(contract.schemaVersion, 1);
  assert.equal(contract.canonicalRepository, 'Bizarre-Industries/design-system');
  assert.deepEqual(contract.packages, ['@bizarre/tokens']);
  assert.equal(contract.downstream.themes.repository, 'Bizarre-Industries/themes');
  assert.equal(contract.downstream.themes.policy, 'pin-released-version');
});

test('CI runs the complete verification gate on Node 22', async () => {
  const workflow = await readFile(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm run verify/);
});
