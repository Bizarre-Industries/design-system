import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { compareGenerated } from '../scripts/check-generated.mjs';

test('sorts missing, modified, and obsolete diagnostics by raw code units', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-generated-check-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const packageUrl = new URL(`file://${directory}/`);
  await mkdir(new URL('generated/', packageUrl));
  await Promise.all([
    writeFile(new URL('generated/a.css', packageUrl), 'old'),
    writeFile(new URL('generated/!.css', packageUrl), 'obsolete'),
    writeFile(new URL('generated/_.css', packageUrl), 'obsolete')
  ]);

  const drift = await compareGenerated(packageUrl, new Map([
    ['generated/z.css', Buffer.from('missing')],
    ['generated/a.css', Buffer.from('new')],
    ['generated/B.css', Buffer.from('missing')]
  ]));

  assert.deepEqual(drift, {
    missing: ['generated/B.css', 'generated/z.css'],
    modified: ['generated/a.css'],
    obsolete: ['generated/!.css', 'generated/_.css']
  });
});

test('reports every expected file missing when generated directory is absent', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-generated-missing-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const drift = await compareGenerated(new URL(`file://${directory}/`), new Map([
    ['generated/z.css', Buffer.from('z')],
    ['generated/A.css', Buffer.from('A')]
  ]));
  assert.deepEqual(drift, {
    missing: ['generated/A.css', 'generated/z.css'],
    modified: [],
    obsolete: []
  });
});

test('rejects symlink leaves and ancestors in the generated tree', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-generated-symlink-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const packageUrl = new URL(`file://${directory}/`);
  await mkdir(new URL('generated/real/', packageUrl), { recursive: true });
  await writeFile(new URL('outside.css', packageUrl), 'outside');
  await symlink('../../outside.css', new URL('generated/real/link.css', packageUrl));
  await assert.rejects(
    () => compareGenerated(packageUrl, new Map([['generated/real/link.css', Buffer.from('outside')]])),
    /generated\/real\/link\.css is a symbolic link/
  );

  await rm(new URL('generated/', packageUrl), { recursive: true });
  await mkdir(new URL('outside/', packageUrl));
  await writeFile(new URL('outside/token.css', packageUrl), 'outside');
  await symlink('../outside', new URL('generated', packageUrl));
  await assert.rejects(
    () => compareGenerated(packageUrl, new Map([['generated/token.css', Buffer.from('outside')]])),
    /generated is a symbolic link/
  );
});
