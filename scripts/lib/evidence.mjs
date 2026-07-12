import { createHash } from 'node:crypto';
import { readFile, lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function isCanonicalEvidencePath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0') || path.includes('%') || path.includes('\\') || path.startsWith('/')) return false;
  return path.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

export async function collectEvidence(rootUrl, allowlist) {
  if (!(rootUrl instanceof URL) || rootUrl.protocol !== 'file:') throw new TypeError('rootUrl must be a file URL');
  if (!Array.isArray(allowlist) || new Set(allowlist).size !== allowlist.length) throw new TypeError('allowlist must contain unique paths');
  const rootPath = resolve(fileURLToPath(rootUrl));
  const paths = [...allowlist].sort();
  const rows = [];
  for (const path of paths) {
    if (!isCanonicalEvidencePath(path)) {
      throw new Error(`evidence path must be a canonical relative path: ${String(path)}`);
    }
    const parts = path.split('/');
    const candidate = resolve(rootPath, ...parts);
    const fromRoot = relative(rootPath, candidate);
    if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      throw new Error(`evidence path must resolve beneath root: ${path}`);
    }
    let stat;
    for (const index of parts.keys()) {
      const component = resolve(rootPath, ...parts.slice(0, index + 1));
      try { stat = await lstat(component); } catch { throw new Error(`missing allowlisted evidence: ${path}`); }
      if (stat.isSymbolicLink()) {
        if (index === parts.length - 1) throw new Error(`allowlisted evidence must be a regular file: ${path}`);
        throw new Error(`allowlisted evidence path must not contain a symbolic link: ${path}`);
      }
      if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`missing allowlisted evidence: ${path}`);
    }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`allowlisted evidence must be a regular file: ${path}`);
    const content = await readFile(candidate);
    rows.push({ path, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
  }
  return rows;
}
