import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, realpath, rename as fsRename, rm as fsRm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { writePackage } from '../scripts/lib/package-writer.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = (files) => Buffer.from(`${JSON.stringify({ schemaVersion: 1, files: Object.fromEntries([...files].map(([path, bytes]) => [path, { sha256: hash(bytes) }])) })}\n`);

async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'bizarre-writer-')));
  const packageUrl = new URL('./package/', pathToFileURL(`${root}/`));
  await mkdir(packageUrl);
  return { root, packageUrl };
}

function expected(css = Buffer.from(':root {}\n')) {
  const files = new Map([['generated/tokens.css', css]]);
  files.set('generated/manifest.json', manifest(files));
  return files;
}

test('publishes every expected file with exact bytes and the manifest last', async () => {
  const { packageUrl } = await fixture();
  const files = expected();
  const events = [];
  await writePackage(packageUrl, files, { onOperation: ({ name, path }) => events.push(`${name}:${path ?? ''}`) });
  for (const [path, bytes] of files) assert.deepEqual(await readFile(new URL(path, packageUrl)), bytes);
  const writes = events.filter((event) => event.startsWith('stage-file:'));
  assert.deepEqual(writes, ['stage-file:generated/tokens.css', 'stage-file:generated/manifest.json']);
});

test('snapshots the caller map and buffers before the first operation hook', async () => {
  const { packageUrl } = await fixture();
  const css = Buffer.from(':root { color: lime; }\n');
  const files = expected(css);
  const originalManifest = Buffer.from(files.get('generated/manifest.json'));
  await writePackage(packageUrl, files, {
    onOperation({ name }) {
      if (name !== 'stage-file') return;
      css.fill(0);
      files.get('generated/manifest.json')?.fill(0);
      files.clear();
      files.set('generated/attacker.txt', Buffer.from('changed\n'));
    }
  });
  assert.equal(await readFile(new URL('generated/tokens.css', packageUrl), 'utf8'), ':root { color: lime; }\n');
  assert.deepEqual(await readFile(new URL('generated/manifest.json', packageUrl)), originalManifest);
  await assert.rejects(readFile(new URL('generated/attacker.txt', packageUrl)), { code: 'ENOENT' });
});

test('leaves the previous package unchanged when staging fails', async () => {
  const { packageUrl } = await fixture();
  const old = expected(Buffer.from('old\n'));
  await writePackage(packageUrl, old);
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    onOperation(event) { if (event.name === 'stage-file' && event.path.endsWith('manifest.json')) throw new Error('injected stage failure'); }
  }), /injected stage failure/);
  assert.deepEqual(await readFile(new URL('generated/tokens.css', packageUrl)), old.get('generated/tokens.css'));
});

test('refuses to overwrite an unowned or locally modified file', async () => {
  const { packageUrl } = await fixture();
  await mkdir(new URL('generated/', packageUrl));
  await writeFile(new URL('generated/private.txt', packageUrl), 'mine');
  await assert.rejects(writePackage(packageUrl, expected()), /unowned/);

  const second = await fixture();
  await writePackage(second.packageUrl, expected(Buffer.from('old\n')));
  await writeFile(new URL('generated/tokens.css', second.packageUrl), 'edited\n');
  await assert.rejects(writePackage(second.packageUrl, expected(Buffer.from('new\n'))), /locally modified/);
});

test('refuses symlink leaves and parents without following them', async () => {
  const leaf = await fixture();
  await mkdir(new URL('generated/', leaf.packageUrl));
  await symlink('/tmp', new URL('generated/tokens.css', leaf.packageUrl));
  await assert.rejects(writePackage(leaf.packageUrl, expected()), /symbolic link/);

  const parent = await fixture();
  await symlink('/tmp', new URL('generated', parent.packageUrl));
  await assert.rejects(writePackage(parent.packageUrl, expected()), /symbolic link/);
});

test('refuses a symlink in a package root ancestor', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'bizarre-writer-ancestor-')));
  await mkdir(join(root, 'real', 'package'), { recursive: true });
  await symlink(join(root, 'real'), join(root, 'linked'));
  const packageUrl = new URL('./linked/package/', pathToFileURL(`${root}/`));
  await assert.rejects(writePackage(packageUrl, expected()), /ancestor.*symbolic link/);
});

test('removes obsolete owned files only when their prior hashes match', async () => {
  const { packageUrl } = await fixture();
  const obsolete = Buffer.from('obsolete\n');
  const old = expected();
  old.set('generated/old.css', obsolete);
  old.set('generated/manifest.json', manifest(new Map([...old].filter(([path]) => !path.endsWith('manifest.json')))));
  await writePackage(packageUrl, old);
  await writePackage(packageUrl, expected());
  await assert.rejects(readFile(new URL('generated/old.css', packageUrl)), { code: 'ENOENT' });

  const edited = await fixture();
  await writePackage(edited.packageUrl, old);
  await writeFile(new URL('generated/old.css', edited.packageUrl), 'changed\n');
  await assert.rejects(writePackage(edited.packageUrl, expected()), /locally modified/);
});

test('cleans only its own temporary directories after success and failure', async () => {
  const { packageUrl } = await fixture();
  await mkdir(new URL('.generated.keep/', packageUrl));
  await writePackage(packageUrl, expected());
  assert.deepEqual((await readdir(packageUrl)).sort(), ['.generated.keep', 'generated']);
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    onOperation(event) { if (event.name === 'before-publish') throw new Error('stop'); }
  }), /stop/);
  assert.deepEqual((await readdir(packageUrl)).sort(), ['.generated.keep', 'generated']);
});

test('restores the previous directory when the final rename fails', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  const fsyncs = [];
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async rename(source, destination) {
        if (source.includes('.generated.stage-')) throw new Error('rename failed');
        return fsRename(source, destination);
      },
      async fsyncDirectory(path) { fsyncs.push(path); }
    }
  }), /rename failed/);
  assert.equal(await readFile(new URL('generated/tokens.css', packageUrl), 'utf8'), 'old\n');
  assert.ok(fsyncs.includes(fileURLToPath(packageUrl)));
});

test('restores the previous directory when fsync after move-current fails', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  let packageFsyncs = 0;
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async fsyncDirectory(path) {
        if (path === fileURLToPath(packageUrl) && ++packageFsyncs === 1) throw new Error('move fsync exploded');
      }
    }
  }), /move fsync exploded/);
  assert.equal(await readFile(new URL('generated/tokens.css', packageUrl), 'utf8'), 'old\n');
  assert.ok(!(await readdir(packageUrl)).some((name) => name.startsWith('.generated.rollback-')));
});

test('preserves rollback when move-current fsync and restoration both fail', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async rename(source, destination) {
        if (source.includes('.generated.rollback-')) throw new Error('restore exploded');
        return fsRename(source, destination);
      },
      async fsyncDirectory(path) {
        if (path === fileURLToPath(packageUrl)) throw new Error('move fsync exploded');
      }
    }
  }), (error) => {
    assert.match(error.message, /move-current durability failed.*restoration failed/i);
    assert.deepEqual(error.errors.map(({ message }) => message), ['move fsync exploded', 'restore exploded']);
    return true;
  });
  const rollback = (await readdir(packageUrl)).find((name) => name.startsWith('.generated.rollback-'));
  assert.ok(rollback);
  assert.equal(await readFile(new URL(`${rollback}/tokens.css`, packageUrl), 'utf8'), 'old\n');
});

test('preserves rollback and reports both errors when publication and restoration fail', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async rename(source, destination) {
        if (source.includes('.generated.stage-')) throw new Error('publish exploded');
        if (source.includes('.generated.rollback-')) throw new Error('restore exploded');
        return fsRename(source, destination);
      }
    }
  }), (error) => {
    assert.match(error.message, /publication failed.*restoration failed/i);
    assert.deepEqual(error.errors.map(({ message }) => message), ['publish exploded', 'restore exploded']);
    return true;
  });
  const rollback = (await readdir(packageUrl)).find((name) => name.startsWith('.generated.rollback-'));
  assert.ok(rollback, 'rollback is retained for recovery');
  assert.equal(await readFile(new URL(`${rollback}/tokens.css`, packageUrl), 'utf8'), 'old\n');
});

test('reports restoration durability failure without misidentifying restored data', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  let packageFsyncs = 0;
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async rename(source, destination) {
        if (source.includes('.generated.stage-')) throw new Error('publish exploded');
        return fsRename(source, destination);
      },
      async fsyncDirectory(path) {
        if (path === fileURLToPath(packageUrl) && ++packageFsyncs === 2) throw new Error('restore fsync exploded');
      }
    }
  }), /restored.*fsync failed/i);
  assert.equal(await readFile(new URL('generated/tokens.css', packageUrl), 'utf8'), 'old\n');
  assert.ok(!(await readdir(packageUrl)).some((name) => name.startsWith('.generated.rollback-')));
});

test('restores prior output when failed-output removal succeeds but its parent fsync fails', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  let packageFsyncs = 0;
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async rename(source, destination) {
        await fsRename(source, destination);
        if (source.includes('.generated.stage-')) {
          await writeFile(join(destination, 'tokens.css'), 'corrupt\n');
        }
      },
      async fsyncDirectory(path) {
        if (path === fileURLToPath(packageUrl) && ++packageFsyncs === 3) {
          throw new Error('failed-output removal fsync exploded');
        }
      }
    }
  }), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.deepEqual(error.errors.map(({ message }) => message), [
      'Published hash mismatch: generated/tokens.css',
      'failed-output removal fsync exploded'
    ]);
    return true;
  });
  assert.equal(await readFile(new URL('generated/tokens.css', packageUrl), 'utf8'), 'old\n');
  assert.ok(!(await readdir(packageUrl)).some((name) => name.startsWith('.generated.rollback-')));
});

test('preserves rollback and aggregates errors when removal fsync and restoration fail', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  let packageFsyncs = 0;
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async rename(source, destination) {
        if (source.includes('.generated.rollback-')) throw new Error('restore exploded');
        await fsRename(source, destination);
        if (source.includes('.generated.stage-')) {
          await writeFile(join(destination, 'tokens.css'), 'corrupt\n');
        }
      },
      async fsyncDirectory(path) {
        if (path === fileURLToPath(packageUrl) && ++packageFsyncs === 3) {
          throw new Error('failed-output removal fsync exploded');
        }
      }
    }
  }), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.deepEqual(error.errors.map(({ message }) => message), [
      'Published hash mismatch: generated/tokens.css',
      'failed-output removal fsync exploded',
      'restore exploded'
    ]);
    return true;
  });
  const rollback = (await readdir(packageUrl)).find((name) => name.startsWith('.generated.rollback-'));
  assert.ok(rollback, 'rollback is retained for recovery');
  assert.equal(await readFile(new URL(`${rollback}/tokens.css`, packageUrl), 'utf8'), 'old\n');
});

test('continues cleanup and reports original and cleanup failures', async () => {
  const { packageUrl } = await fixture();
  const removed = [];
  await assert.rejects(writePackage(packageUrl, expected(), {
    onOperation(event) { if (event.name === 'before-publish') throw new Error('operation failed'); },
    operations: {
      async remove(path, options) {
        removed.push(path);
        if (path.includes('.generated.stage-')) throw new Error('stage cleanup failed');
        return fsRm(path, options);
      }
    }
  }), (error) => {
    assert.deepEqual(error.errors.map(({ message }) => message), ['operation failed', 'stage cleanup failed']);
    return true;
  });
  assert.ok(removed.some((path) => path.endsWith('.generated.lock')), 'lock cleanup still attempted');
});

test('fsyncs the package directory after deleting a successful rollback', async () => {
  const { packageUrl } = await fixture();
  await writePackage(packageUrl, expected(Buffer.from('old\n')));
  const events = [];
  await writePackage(packageUrl, expected(Buffer.from('new\n')), {
    operations: {
      async remove(path, options) { events.push(`remove:${path}`); return fsRm(path, options); },
      async fsyncDirectory(path) { events.push(`fsync:${path}`); }
    }
  });
  const packagePath = fileURLToPath(packageUrl);
  const rollbackRemoval = events.findIndex((event) => event.includes('remove:') && event.includes('.generated.rollback-'));
  assert.ok(rollbackRemoval >= 0);
  assert.equal(events[rollbackRemoval + 1], `fsync:${packagePath}`);
});

test('rejects non-canonical and case-colliding expected paths', async () => {
  const { packageUrl } = await fixture();
  await assert.rejects(writePackage(packageUrl, new Map([['generated/../x', Buffer.from('x')]])), /canonical/);
  await assert.rejects(writePackage(packageUrl, new Map([
    ['generated/A.css', Buffer.from('a')], ['generated/a.css', Buffer.from('b')], ['generated/manifest.json', Buffer.from('{}\n')]
  ])), /case-folding/);
  await assert.rejects(writePackage(packageUrl, new Map([
    ['generated/a', Buffer.from('a')], ['generated/a/b.css', Buffer.from('b')], ['generated/manifest.json', Buffer.from('{}\n')]
  ])), /file and directory/);
});

test('rejects a manifest that does not exactly own the expected payload', async () => {
  const { packageUrl } = await fixture();
  const files = expected();
  files.set('generated/manifest.json', Buffer.from('{"schemaVersion":1,"files":{}}\n'));
  await assert.rejects(writePackage(packageUrl, files), /Expected manifest/);
});

test('serializes publication with an event-gated exclusive lock', async () => {
  const { packageUrl } = await fixture();
  let release;
  let entered;
  const enteredPromise = new Promise((resolve) => { entered = resolve; });
  const releasePromise = new Promise((resolve) => { release = resolve; });
  const first = writePackage(packageUrl, expected(), {
    async onOperation(event) {
      if (event.name === 'before-publish') { entered(); await releasePromise; }
    }
  });
  await enteredPromise;
  await assert.rejects(writePackage(packageUrl, expected(Buffer.from('other\n'))), /already in progress/);
  release();
  await first;
});
