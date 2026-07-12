import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import test from 'node:test';
import { collectEvidence } from '../scripts/lib/evidence.mjs';

test('collects only explicit allowlist entries in stable order', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizarre-evidence-'));
  await mkdir(join(root, '.superpowers'), { recursive: true });
  await writeFile(join(root, 'README.md'), 'brand\n');
  await writeFile(join(root, 'LICENSE'), 'license\n');
  await writeFile(join(root, '.superpowers/server.pid'), '123\n');
  const rows = await collectEvidence(pathToFileURL(`${root}/`), ['README.md', 'LICENSE']);
  assert.deepEqual(rows.map(({ path }) => path), ['LICENSE', 'README.md']);
  assert.ok(rows.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
});

test('rejects duplicate allowlist entries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizarre-evidence-duplicate-'));
  await writeFile(join(root, 'README.md'), 'brand\n');
  await assert.rejects(
    () => collectEvidence(pathToFileURL(`${root}/`), ['README.md', 'README.md']),
    /allowlist must contain unique paths/
  );
});

test('rejects escaping, absolute, missing, directory, and symlink entries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizarre-evidence-invalid-'));
  await assert.rejects(() => collectEvidence(pathToFileURL(`${root}/`), ['../secret']), /canonical relative path/);
  await assert.rejects(() => collectEvidence(pathToFileURL(`${root}/`), ['/tmp/secret']), /canonical relative path/);
  await assert.rejects(() => collectEvidence(pathToFileURL(`${root}/`), ['missing.txt']), /missing allowlisted evidence/);
});

test('rejects a directory allowlist entry', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizarre-evidence-directory-'));
  await mkdir(join(root, 'docs'));
  await assert.rejects(
    () => collectEvidence(pathToFileURL(`${root}/`), ['docs']),
    /regular file/,
  );
});

test('rejects a symlink allowlist entry', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizarre-evidence-symlink-leaf-'));
  await writeFile(join(root, 'target.txt'), 'target\n');
  await symlink('target.txt', join(root, 'link.txt'));
  await assert.rejects(
    () => collectEvidence(pathToFileURL(`${root}/`), ['link.txt']),
    /regular file/,
  );
});

test('rejects a symlink in an allowlisted path ancestor', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizarre-evidence-symlink-ancestor-'));
  const outside = await mkdtemp(join(tmpdir(), 'bizarre-evidence-outside-'));
  await writeFile(join(outside, 'secret.txt'), 'secret\n');
  await symlink(outside, join(root, 'linked'));
  await assert.rejects(
    () => collectEvidence(pathToFileURL(`${root}/`), ['linked/secret.txt']),
    /symbolic link/,
  );
});

test('rejects percent-encoded traversal paths', async () => {
  const base = await mkdtemp(join(tmpdir(), 'bizarre-evidence-encoded-'));
  const root = join(base, 'root');
  await mkdir(root);
  await writeFile(join(base, 'secret.txt'), 'secret\n');
  await assert.rejects(
    () => collectEvidence(pathToFileURL(`${root}/`), ['%2e%2e/secret.txt']),
    /canonical relative path/,
  );
});

test('resolves allowlist entries beneath a root URL without a trailing slash', async () => {
  const base = await mkdtemp(join(tmpdir(), 'bizarre-evidence-resolution-'));
  const root = join(base, 'root');
  await mkdir(root);
  await writeFile(join(root, 'evidence.txt'), 'inside\n');
  await writeFile(join(base, 'evidence.txt'), 'outside\n');
  const rows = await collectEvidence(pathToFileURL(root), ['evidence.txt']);
  assert.equal(rows[0].bytes, Buffer.byteLength('inside\n'));
});
