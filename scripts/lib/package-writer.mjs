import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, open, readdir, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST = 'generated/manifest.json';
const SUPPORTED_MANIFEST_SCHEMA_VERSIONS = new Set([1, 2]);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function validatePath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\\') || path.startsWith('/') ||
      posix.normalize(path) !== path || path.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new TypeError(`Expected path is not canonical and relative: ${path}`);
  }
  if (!path.startsWith('generated/') || path === 'generated/') throw new TypeError(`Expected path must be below generated/: ${path}`);
}

function validateExpected(expectedFiles) {
  if (!(expectedFiles instanceof Map)) throw new TypeError('expectedFiles must be a Map');
  const folded = new Map();
  for (const [path, bytes] of expectedFiles) {
    validatePath(path);
    if (!Buffer.isBuffer(bytes)) throw new TypeError(`Expected bytes must be a Buffer: ${path}`);
    const key = path.toLocaleLowerCase('en-US');
    if (folded.has(key)) throw new Error(`Expected paths collide under case-folding: ${folded.get(key)} and ${path}`);
    for (const [otherKey, otherPath] of folded) {
      if (key.startsWith(`${otherKey}/`) || otherKey.startsWith(`${key}/`)) {
        throw new Error(`Expected paths collide as a file and directory: ${otherPath} and ${path}`);
      }
    }
    folded.set(key, path);
  }
  if (!expectedFiles.has(MANIFEST)) throw new Error(`Expected files must contain ${MANIFEST}`);
  let manifest;
  try { manifest = JSON.parse(expectedFiles.get(MANIFEST)); } catch { throw new Error('Expected manifest contains invalid ownership data'); }
  if (!SUPPORTED_MANIFEST_SCHEMA_VERSIONS.has(manifest?.schemaVersion) || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('Expected manifest contains invalid ownership data');
  }
  const payloadPaths = [...expectedFiles.keys()].filter((path) => path !== MANIFEST).sort();
  const claimedPaths = Object.keys(manifest.files).sort();
  if (payloadPaths.length !== claimedPaths.length || payloadPaths.some((path, index) => path !== claimedPaths[index])) {
    throw new Error('Expected manifest must own exactly the expected payload');
  }
  for (const path of payloadPaths) {
    const record = manifest.files[path];
    if (!record || record.sha256 !== sha256(expectedFiles.get(path))) throw new Error(`Expected manifest hash mismatch: ${path}`);
  }
}

function snapshotExpected(expectedFiles) {
  if (!(expectedFiles instanceof Map)) throw new TypeError('expectedFiles must be a Map');
  const entries = [];
  for (const [path, bytes] of expectedFiles) {
    if (!Buffer.isBuffer(bytes)) throw new TypeError(`Expected bytes must be a Buffer: ${path}`);
    entries.push([path, Buffer.from(bytes)]);
  }
  entries.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  return new Map(entries);
}

async function statOrNull(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function rejectSymlinkAncestors(path) {
  const ancestors = [];
  for (let current = path; ; current = dirname(current)) {
    ancestors.push(current);
    if (dirname(current) === current) break;
  }
  for (const ancestor of ancestors.reverse()) {
    const stat = await lstat(ancestor);
    if (stat.isSymbolicLink()) throw new Error(`Package root ancestor is a symbolic link: ${ancestor}`);
  }
}

async function inspectTree(root, prefix = 'generated') {
  const files = new Map();
  const rootStat = await statOrNull(root);
  if (!rootStat) return files;
  if (rootStat.isSymbolicLink()) throw new Error(`${prefix} is a symbolic link`);
  if (!rootStat.isDirectory()) throw new Error(`${prefix} is not a directory`);
  async function visit(directory, logical) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const diskPath = join(directory, entry.name);
      const path = `${logical}/${entry.name}`;
      const stat = await lstat(diskPath);
      if (stat.isSymbolicLink()) throw new Error(`${path} is a symbolic link`);
      if (stat.isDirectory()) await visit(diskPath, path);
      else if (stat.isFile()) files.set(path, await readFile(diskPath));
      else throw new Error(`${path} is a special file`);
    }
  }
  await visit(root, prefix);
  return files;
}

function ownershipFromManifest(files) {
  if (files.size === 0) return new Map();
  const bytes = files.get(MANIFEST);
  if (!bytes) throw new Error('Current generated tree contains unowned files (manifest is missing)');
  let manifest;
  try { manifest = JSON.parse(bytes); } catch { throw new Error('Current manifest contains invalid ownership data'); }
  if (!SUPPORTED_MANIFEST_SCHEMA_VERSIONS.has(manifest?.schemaVersion) || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('Current manifest contains invalid ownership data');
  }
  const owned = new Map([[MANIFEST, sha256(bytes)]]);
  const folded = new Set([MANIFEST.toLowerCase()]);
  for (const [path, record] of Object.entries(manifest.files)) {
    try { validatePath(path); } catch { throw new Error('Current manifest contains invalid ownership data'); }
    const key = path.toLocaleLowerCase('en-US');
    if (path === MANIFEST || folded.has(key) || !record || typeof record.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(record.sha256)) {
      throw new Error('Current manifest contains invalid ownership data');
    }
    folded.add(key);
    owned.set(path, record.sha256);
  }
  for (const path of files.keys()) if (!owned.has(path)) throw new Error(`Refusing to overwrite unowned file: ${path}`);
  for (const [path, expectedHash] of owned) {
    if (!files.has(path)) throw new Error(`Current manifest contains invalid ownership data: missing ${path}`);
    if (path !== MANIFEST && sha256(files.get(path)) !== expectedHash) throw new Error(`Refusing to overwrite locally modified file: ${path}`);
  }
  return owned;
}

async function syncDirectory(path) {
  const handle = await open(path, 'r');
  try { await handle.sync(); } finally { await handle.close(); }
}

async function syncTreeDirectories(path, fsyncDirectory) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isDirectory()) await syncTreeDirectories(join(path, entry.name), fsyncDirectory);
  }
  await fsyncDirectory(path);
}

async function writeSynced(path, bytes, fsyncFile) {
  const handle = await open(path, 'wx', 0o644);
  try { await handle.writeFile(bytes); await fsyncFile(handle, path); } finally { await handle.close(); }
}

/**
 * Publishes a complete generated tree using rollback-safe staged replacement.
 * Portable filesystems require two renames, so this guarantees data recovery,
 * not an uninterrupted atomic directory exchange for concurrent readers.
 */
export async function writePackage(packageUrl, expectedFiles, options = {}) {
  const files = snapshotExpected(expectedFiles);
  validateExpected(files);
  const packagePath = fileURLToPath(packageUrl);
  await rejectSymlinkAncestors(packagePath);
  const packageStat = await lstat(packagePath);
  if (!packageStat.isDirectory()) throw new Error('Package root is not a directory');
  const generatedPath = join(packagePath, 'generated');
  const lockPath = join(packagePath, '.generated.lock');
  const renamePath = options.operations?.rename ?? rename;
  const removePath = options.operations?.remove ?? rm;
  const fsyncPath = options.operations?.fsyncDirectory ?? syncDirectory;
  const fsyncFile = options.operations?.fsyncFile ?? ((handle) => handle.sync());
  const operation = async (name, path, action) => {
    await options.onOperation?.({ name, path });
    return action();
  };

  try {
    await mkdir(lockPath); // exclusive ownership prevents concurrent preflight/publication races
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Generated package publication is already in progress', { cause: error });
    throw error;
  }
  let stagePath;
  let rollbackPath;
  let previousMoved = false;
  let stagedPublished = false;
  let finalValidated = false;
  let failure;
  const restorePrevious = async (originalError, context) => {
    const preservedPath = rollbackPath;
    try {
      await renamePath(rollbackPath, generatedPath);
      previousMoved = false;
      rollbackPath = undefined;
    } catch (restoreError) {
      throw new AggregateError(
        [originalError, restoreError],
        `${context} and restoration failed; rollback preserved at ${preservedPath}`
      );
    }
    try {
      await fsyncPath(packagePath);
    } catch (fsyncError) {
      throw new AggregateError(
        [originalError, fsyncError],
        `${context}; previous output was restored but parent fsync failed`
      );
    }
  };
  try {
    ownershipFromManifest(await inspectTree(generatedPath));
    stagePath = await mkdtemp(join(packagePath, '.generated.stage-'));
    const payload = [...files].filter(([path]) => path !== MANIFEST);
    for (const [path, bytes] of [...payload, [MANIFEST, files.get(MANIFEST)]]) {
      const relativePath = path.slice('generated/'.length);
      const destination = join(stagePath, ...relativePath.split('/'));
      const confined = relative(stagePath, destination);
      if (confined.startsWith(`..${sep}`) || confined === '..') throw new Error(`Path escapes staging directory: ${path}`);
      await mkdir(dirname(destination), { recursive: true });
      await operation('stage-file', path, () => writeSynced(destination, bytes, fsyncFile));
    }
    await syncTreeDirectories(stagePath, fsyncPath);
    const staged = await inspectTree(stagePath, 'generated');
    for (const [path, bytes] of files) {
      if (!staged.has(path) || sha256(staged.get(path)) !== sha256(bytes)) throw new Error(`Staged hash mismatch: ${path}`);
    }
    if (staged.size !== files.size) throw new Error('Staging contains unexpected files');
    await operation('before-publish', undefined, async () => {});

    if (await statOrNull(generatedPath)) {
      rollbackPath = join(packagePath, `.generated.rollback-${randomUUID()}`);
      await operation('move-current', 'generated', () => renamePath(generatedPath, rollbackPath));
      previousMoved = true;
      try {
        await fsyncPath(packagePath);
      } catch (moveFsyncError) {
        await restorePrevious(moveFsyncError, 'Move-current durability failed');
        throw moveFsyncError;
      }
    }
    try {
      await operation('publish-staged', 'generated', () => renamePath(stagePath, generatedPath));
      stagedPublished = true;
      stagePath = undefined;
    } catch (publishError) {
      if (previousMoved) {
        await restorePrevious(publishError, 'Package publication failed');
      }
      throw publishError;
    }
    await fsyncPath(packagePath);
    const finalFiles = await inspectTree(generatedPath);
    if (finalFiles.size !== files.size) throw new Error('Published output contains unexpected files');
    for (const [path, bytes] of files) {
      if (!finalFiles.has(path) || sha256(finalFiles.get(path)) !== sha256(bytes)) throw new Error(`Published hash mismatch: ${path}`);
    }
    finalValidated = true;
    if (rollbackPath) {
      await removePath(rollbackPath, { recursive: true });
      rollbackPath = undefined;
      previousMoved = false;
      await fsyncPath(packagePath);
    }
  } catch (error) {
    failure = error;
    if (stagedPublished && !finalValidated) {
      const recoveryErrors = [error];
      let failedOutputRemoved = false;
      try {
        await removePath(generatedPath, { recursive: true, force: true });
        failedOutputRemoved = true;
      } catch (removeError) {
        recoveryErrors.push(removeError);
      }
      if (failedOutputRemoved) {
        try { await fsyncPath(packagePath); } catch (removeFsyncError) { recoveryErrors.push(removeFsyncError); }
      }
      if (failedOutputRemoved && previousMoved && rollbackPath) {
        const preservedPath = rollbackPath;
        try {
          await renamePath(rollbackPath, generatedPath);
          previousMoved = false;
          rollbackPath = undefined;
          try { await fsyncPath(packagePath); } catch (restoreFsyncError) { recoveryErrors.push(restoreFsyncError); }
        } catch (restoreError) {
          recoveryErrors.push(restoreError);
          rollbackPath = preservedPath;
          previousMoved = true;
        }
      }
      if (recoveryErrors.length > 1) {
        failure = new AggregateError(
          recoveryErrors,
          `Published output validation failed during recovery${rollbackPath ? `; rollback preserved at ${rollbackPath}` : ''}`
        );
      }
    }
  }

  const cleanupErrors = [];
  if (stagePath) {
    try { await removePath(stagePath, { recursive: true, force: true }); } catch (error) { cleanupErrors.push(error); }
  }
  try { await removePath(lockPath, { recursive: true }); } catch (error) { cleanupErrors.push(error); }
  if (cleanupErrors.length) {
    failure = new AggregateError(failure ? [failure, ...cleanupErrors] : cleanupErrors, 'Package publication cleanup failed');
  }
  if (failure) throw failure;
}
