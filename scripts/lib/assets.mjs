import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const mediaTypes = new Map([
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.woff2', 'font/woff2'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.md', 'text/markdown'],
  ['.txt', 'text/plain'],
]);

function safePath(root, path) {
  if (typeof path !== 'string' || path.length === 0 || path.startsWith('/') || path.includes('\\')) {
    throw new Error(`${path} is not a safe relative path`);
  }
  const target = resolve(root, path);
  const rel = relative(root, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || rel === '' || path.split('/').includes('..')) {
    throw new Error(`${path} is not a safe relative path`);
  }
  return target;
}

async function assertRegularFileWithoutSymlinks(root, path) {
  let current = root;
  for (const component of path.split('/')) {
    current = resolve(current, component);
    let stats;
    try { stats = await lstat(current); } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`missing asset: ${path}`);
      throw error;
    }
    if (stats.isSymbolicLink()) throw new Error(`asset path may not contain a symlink: ${path}`);
  }
  const stats = await lstat(current);
  if (!stats.isFile()) throw new Error(`asset is not a file: ${path}`);
}

export async function validateAssets(rootUrl, manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) {
    throw new Error('invalid asset manifest');
  }
  const root = fileURLToPath(rootUrl);
  const entries = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  if (entries.size !== manifest.assets.length) throw new Error('duplicate asset path');

  for (const entry of manifest.assets) {
    if (entry.approved !== true) throw new Error(`publishable asset is unapproved: ${entry.path}`);
    safePath(root, entry.path);
    const expected = mediaTypes.get(extname(entry.path).toLowerCase());
    if (!expected || entry.mediaType !== expected) throw new Error(`wrong media type for ${entry.path}`);
    if (entry.master && !entries.has(entry.master)) throw new Error(`derivative master is absent: ${entry.master}`);
    if (entry.master && entries.get(entry.master)?.kind !== 'font') throw new Error(`invalid derivative master: ${entry.master}`);
    if (entry.kind === 'font') {
      const license = entries.get(entry.license);
      if (!license || license.kind !== 'license' || license.family !== entry.family || !/OFL\.txt$/i.test(license.path)) {
        throw new Error(`font entry lacks a family OFL license: ${entry.path}`);
      }
    }
  }

  const rows = await Promise.all(manifest.assets.map(async (entry) => {
    const target = safePath(root, entry.path);
    await assertRegularFileWithoutSymlinks(root, entry.path);
    const bytes = await readFile(target);
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== entry.sha256) throw new Error(`sha256 mismatch for ${entry.path}`);
    return { path: entry.path, sha256: actual, mediaType: entry.mediaType };
  }));
  return rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
