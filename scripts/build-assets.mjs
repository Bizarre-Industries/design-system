import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './lib/canonical-json.mjs';
import { collectEvidence } from './lib/evidence.mjs';
import {
  assertAssetManifestSeparation,
  assetPackagePath,
  validateAssets,
  validateProvisionalAssets,
} from './lib/assets.mjs';

const SOURCE_PREFIX = 'packages/assets/';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const comparePaths = (left, right) => left < right ? -1 : left > right ? 1 : 0;

async function listSourceFiles(directoryUrl, prefix = SOURCE_PREFIX) {
  const files = [];
  for (const entry of await readdir(directoryUrl, { withFileTypes: true })) {
    if (entry.name === 'generated') continue;
    const path = `${prefix}${entry.name}`;
    const url = new URL(entry.name, directoryUrl);
    const stat = await lstat(url);
    if (stat.isSymbolicLink()) throw new Error(`asset package source may not contain a symlink: ${path}`);
    if (stat.isDirectory()) files.push(...await listSourceFiles(new URL(`${entry.name}/`, directoryUrl), `${path}/`));
    else if (stat.isFile()) files.push(path);
    else throw new Error(`asset package source contains a special file: ${path}`);
  }
  return files.sort(comparePaths);
}

export async function buildExpectedAssets(rootUrl) {
  const [sourceManifest, provisionalManifest] = await Promise.all([
    readFile(new URL('brand/assets.json', rootUrl), 'utf8').then(JSON.parse),
    readFile(new URL('brand/provisional-assets.json', rootUrl), 'utf8').then(JSON.parse),
  ]);
  assertAssetManifestSeparation(sourceManifest, provisionalManifest);
  await validateProvisionalAssets(rootUrl, provisionalManifest);
  const rows = await validateAssets(rootUrl, sourceManifest);
  const declared = new Set(rows.map(({ path }) => path));
  for (const path of await listSourceFiles(new URL(SOURCE_PREFIX, rootUrl))) {
    if (!declared.has(path) && path !== `${SOURCE_PREFIX}package.json` && path !== `${SOURCE_PREFIX}manifest.json`) {
      throw new Error(`undeclared asset package file: ${path}`);
    }
  }

  const allowlist = JSON.parse(await readFile(new URL('governance/evidence-allowlist.json', rootUrl), 'utf8'));
  if (!Array.isArray(allowlist.paths)) throw new TypeError('evidence allowlist must contain paths');

  const payload = new Map();
  const sourceByOutput = new Map();
  for (const row of rows) {
    const outputPath = `generated/${assetPackagePath(row.path)}`;
    if (sourceByOutput.has(outputPath)) {
      throw new Error(`asset package path collision: ${sourceByOutput.get(outputPath)} and ${row.path} both map to ${outputPath}`);
    }
    sourceByOutput.set(outputPath, row.path);
    payload.set(outputPath, await readFile(new URL(row.path, rootUrl)));
  }
  const sourceEntries = new Map(sourceManifest.assets.map((entry) => [entry.path, entry]));
  const files = Object.fromEntries([...payload].sort(([left], [right]) => comparePaths(left, right))
    .map(([path, bytes]) => {
      const sourcePath = sourceByOutput.get(path);
      const source = sourceEntries.get(sourcePath);
      const {
        path: ignoredPath,
        sha256: ignoredSha256,
        master,
        license,
        ...governance
      } = source;
      return [path, {
        ...governance,
        ...(license ? { license: `generated/${assetPackagePath(license)}` } : {}),
        ...(master ? { master: `generated/${assetPackagePath(master)}` } : {}),
        sha256: sha256(bytes),
        sourcePath,
      }];
    }));
  payload.set('generated/manifest.json', Buffer.from(canonicalJson({
    schemaVersion: 1,
    package: '@bizarre/assets',
    files,
    evidence: await collectEvidence(rootUrl, allowlist.paths)
  })));
  return new Map([...payload].sort(([left], [right]) => comparePaths(left, right)));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const rootUrl = new URL('../', import.meta.url);
  const { writePackage } = await import('./lib/package-writer.mjs');
  await writePackage(new URL('../packages/assets/', import.meta.url), await buildExpectedAssets(rootUrl));
}
