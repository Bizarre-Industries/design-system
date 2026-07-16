import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const repositoryRoot = new URL('../', import.meta.url);
const packageContract = JSON.parse(readFileSync(new URL('../governance/package-contract.json', import.meta.url), 'utf8'));
const workspacePaths = new Map(readdirSync(new URL('../packages/', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const packageJson = JSON.parse(readFileSync(new URL(`../packages/${entry.name}/package.json`, import.meta.url), 'utf8'));
    return [packageJson.name, `./packages/${entry.name}`];
  }));
const privatePackages = packageContract.publication.privateWorking.map((name) => {
  const path = workspacePaths.get(name);
  assert.ok(path, `${name} must resolve to a workspace package`);
  return [name, path];
});

function isolatedNpmCache(t) {
  const cache = mkdtempSync(join(tmpdir(), 'bizarre-npm-test-cache-'));
  t.after(() => rmSync(cache, { recursive: true, force: true }));
  return cache;
}

test('explicit directory publishing fails closed for every private working package', (t) => {
  const cache = isolatedNpmCache(t);
  for (const [name, path] of privatePackages) {
    const result = spawnSync(
      'npm',
      ['publish', path, '--dry-run', '--json'],
      { cwd: repositoryRoot, encoding: 'utf8', env: { ...process.env, npm_config_cache: cache } },
    );

    assert.notEqual(result.status, 0, `${name} must reject explicit directory publication`);
    assert.match(`${result.stdout}\n${result.stderr}`, /PUBLISH BLOCKED/);
    assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(name.replace('/', '\\/')));
  }
});

test('private working packages remain available to npm pack for controlled review', (t) => {
  const cache = isolatedNpmCache(t);
  for (const [name, path] of privatePackages) {
    const result = spawnSync(
      'npm',
      ['pack', path, '--dry-run', '--json'],
      { cwd: repositoryRoot, encoding: 'utf8', env: { ...process.env, npm_config_cache: cache } },
    );

    assert.equal(result.status, 0, `${name} must remain packable`);
    const [pack] = JSON.parse(result.stdout);
    assert.equal(pack.name, name);
    assert.ok(pack.entryCount > 0, `${name} pack must contain files`);
  }
});
