import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { basename, extname, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
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
const assetKinds = new Set([
  'logo', 'font', 'license', 'documentation', 'stylesheet', 'manifest',
  'atlas', 'aperture', 'texture', 'mockup', 'evidence',
]);
const generatedKinds = new Set(['atlas', 'aperture', 'texture']);
const derivativeKinds = new Set(['font', 'atlas', 'texture', 'mockup', 'evidence']);
const logoVariants = new Set(['primary', 'inverse', 'transparent']);
const approvalStates = new Set(['approved']);
const relationships = new Set(['master', 'derivative']);
const colorRoles = new Set(['signal', 'void', 'ash700']);
const provisionalIntendedUses = new Set(['data-visualization', 'editorial', 'interface', 'motion']);
const allowedUseValues = new Set([
  'data-visualization', 'documentation', 'editorial', 'evidence',
  'font-embedding', 'font-source-distribution', 'identity-mark',
  'interface', 'mockup', 'motion',
]);
const viewBoxPattern = /^-?(?:\d+\.?\d*|\.\d+)(?:\s+-?(?:\d+\.?\d*|\.\d+)){3}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const semverPattern = /^\d+\.\d+\.\d+$/;
const atlasSourcePrefix = 'packages/atlas/generated/';
const atlasManifestPath = `${atlasSourcePrefix}manifest.json`;
const apertureMasterPath = `${atlasSourcePrefix}calibrated-aperture.svg`;
const atlasTextureBasenames = new Set([
  'atlas-dots-large.svg',
  'atlas-dots.svg',
  'atlas-hatch-large.svg',
  'atlas-hatch.svg',
]);
const proposalDerivativePattern = /(?:^|\/)(?:proposal|mockups?)(?:\/|$)|bizarre-astronomical-atlas\.zip/i;

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

function requireFields(entry, fields, label = entry.kind) {
  for (const field of fields) {
    if (entry[field] === undefined) throw new Error(`${label} entry requires ${field}: ${entry.path}`);
  }
}

function validateStringArray(value, allowed, label, path) {
  if (!Array.isArray(value) || value.length === 0 || new Set(value).size !== value.length || value.some((item) => !allowed.has(item))) {
    throw new Error(`invalid ${label}: ${path}`);
  }
}

function validateGenerator(entry) {
  requireFields(entry, ['generator', 'provenance'], 'generated asset');
  const { generator, provenance } = entry;
  if (!generator || typeof generator !== 'object' || Array.isArray(generator)) throw new Error(`invalid generator: ${entry.path}`);
  requireFields({ ...generator, path: entry.path }, ['name', 'version', 'configurationHash'], 'generator');
  if (typeof generator.name !== 'string' || generator.name.length === 0 || !semverPattern.test(generator.version) || !hashPattern.test(generator.configurationHash)) {
    throw new Error(`invalid generator metadata: ${entry.path}`);
  }
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) throw new Error(`invalid provenance: ${entry.path}`);
  requireFields({ ...provenance, path: entry.path }, ['sourceType', 'sourceIdentifier', 'model', 'apertureVersion', 'aperturePathSha256'], 'provenance');
  if (provenance.sourceType !== 'synthetic' || typeof provenance.sourceIdentifier !== 'string' || provenance.sourceIdentifier.length === 0) {
    throw new Error(`invalid provenance source: ${entry.path}`);
  }
  if (!provenance.model || typeof provenance.model !== 'object' || typeof provenance.model.name !== 'string' || !semverPattern.test(provenance.model.version)) {
    throw new Error(`invalid provenance model: ${entry.path}`);
  }
  if (typeof provenance.apertureVersion !== 'string' || provenance.apertureVersion.length === 0 || !hashPattern.test(provenance.aperturePathSha256)) {
    throw new Error(`invalid aperture provenance: ${entry.path}`);
  }
}

function expectedAtlasMetadata(row) {
  return {
    generator: {
      name: row.provenance.algorithm.name,
      version: row.provenance.algorithm.version,
      configurationHash: row.provenance.configurationHash,
    },
    provenance: {
      sourceType: row.provenance.sourceType,
      sourceIdentifier: row.provenance.sourceIdentifier,
      model: row.provenance.model,
      apertureVersion: row.provenance.apertureVersion,
      aperturePathSha256: row.provenance.aperturePathSha256,
    },
  };
}

function embeddedAtlasMetadata(svg, path) {
  const source = svg.match(/<metadata\b[^>]*\bid=["']bizarre-atlas-provenance["'][^>]*>(.*?)<\/metadata>/s)?.[1];
  if (!source) throw new Error(`Atlas SVG lacks embedded provenance: ${path}`);
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Atlas SVG contains invalid embedded provenance: ${path}`, { cause: error });
  }
}

function validateAtlasLineage(entry, upstream, embedded) {
  const expected = expectedAtlasMetadata(upstream);
  if (!isDeepStrictEqual(entry.generator, expected.generator)) {
    throw new Error(`generator configurationHash or version does not match Atlas manifest: ${entry.path}`);
  }
  if (!isDeepStrictEqual(entry.provenance, expected.provenance)) {
    throw new Error(`provenance does not match Atlas manifest: ${entry.path}`);
  }
  if (!isDeepStrictEqual(embedded.algorithm, upstream.provenance.algorithm)
      || embedded.configurationHash !== upstream.provenance.configurationHash
      || embedded.sourceType !== upstream.provenance.sourceType
      || embedded.sourceIdentifier !== upstream.provenance.sourceIdentifier
      || !isDeepStrictEqual(embedded.model, upstream.provenance.model)
      || embedded.apertureVersion !== upstream.provenance.apertureVersion
      || embedded.aperturePathSha256 !== upstream.provenance.aperturePathSha256) {
    throw new Error(`Atlas manifest provenance does not match embedded SVG metadata: ${entry.path}`);
  }
}

export function assetPackagePath(path) {
  if (path.startsWith('packages/assets/')) return path.slice('packages/assets/'.length);
  if (/^packages\/atlas\/generated\/[^/]+\.svg$/.test(path)) return `atlas/${basename(path)}`;
  throw new Error(`asset source is outside the publishable package roots: ${path}`);
}

export function assertAssetManifestSeparation(publishableManifest, provisionalManifest) {
  if (!publishableManifest || !Array.isArray(publishableManifest.assets)) throw new TypeError('invalid publishable asset manifest');
  if (!provisionalManifest || !Array.isArray(provisionalManifest.assets)) throw new TypeError('invalid provisional asset manifest');
  const publishablePaths = new Set(publishableManifest.assets.map(({ path }) => path));
  for (const { path } of provisionalManifest.assets) {
    if (publishablePaths.has(path)) throw new Error(`asset cannot be both publishable and provisional: ${path}`);
  }
  return true;
}

export async function validateProvisionalAssets(rootUrl, manifest) {
  const promotionRequires = [
    'explicit-master-approval',
    'geometry-and-provenance-verification',
    'dependent-asset-regeneration',
    'publishable-boundary-review',
  ];
  if (!manifest
      || manifest.schemaVersion !== 1
      || manifest.classification !== 'governed-provisional'
      || manifest.version !== 'v1'
      || manifest.approvalState !== 'provisional'
      || manifest.publicationStatus !== 'nonpublishable'
      || manifest.sourceManifest !== atlasManifestPath
      || typeof manifest.reason !== 'string'
      || manifest.reason.length === 0
      || !isDeepStrictEqual(manifest.promotionRequires, promotionRequires)
      || !Array.isArray(manifest.assets)
      || manifest.assets.length === 0) {
    throw new Error('invalid provisional asset manifest');
  }

  const root = fileURLToPath(rootUrl);
  const entries = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  if (entries.size !== manifest.assets.length) throw new Error('duplicate provisional asset path');
  const atlasManifest = JSON.parse(await readFile(safePath(root, atlasManifestPath), 'utf8'));
  if (!atlasManifest || atlasManifest.package !== '@bizarre/atlas' || !atlasManifest.files) {
    throw new Error('invalid provisional Atlas source manifest');
  }
  const expectedPaths = Object.keys(atlasManifest.files)
    .filter((path) => path.endsWith('.svg'))
    .map((path) => `packages/atlas/${path}`)
    .sort();
  const actualPaths = [...entries.keys()].sort();
  if (!isDeepStrictEqual(actualPaths, expectedPaths)) {
    throw new Error('provisional asset manifest must classify every generated Atlas SVG');
  }

  const rows = [];
  for (const entry of manifest.assets) {
    requireFields(entry, [
      'path', 'sha256', 'approved', 'mediaType', 'kind', 'approvalState', 'viewBox',
      'sourceProvenance', 'relationship', 'generator', 'provenance', 'authorityStatus',
      'verificationStatus', 'publicationStatus', 'publishable', 'intendedUses',
    ], 'provisional asset');
    if (entry.approved !== false
        || entry.approvalState !== 'provisional'
        || entry.authorityStatus !== 'governed-provisional'
        || entry.verificationStatus !== 'NOT VERIFIED'
        || entry.publicationStatus !== 'nonpublishable'
        || entry.publishable !== false) {
      throw new Error(`provisional asset has publishable or approved status: ${entry.path}`);
    }
    if (!generatedKinds.has(entry.kind)
        || entry.mediaType !== 'image/svg+xml'
        || entry.sourceProvenance !== atlasManifestPath
        || !entry.path.startsWith(atlasSourcePrefix)
        || !viewBoxPattern.test(entry.viewBox)
        || !hashPattern.test(entry.sha256)) {
      throw new Error(`invalid provisional Atlas asset: ${entry.path}`);
    }
    validateStringArray(entry.intendedUses, provisionalIntendedUses, 'intendedUses', entry.path);
    validateGenerator(entry);

    const expectedKind = entry.path === apertureMasterPath
      ? 'aperture'
      : atlasTextureBasenames.has(basename(entry.path)) ? 'texture' : 'atlas';
    if (entry.kind !== expectedKind) throw new Error(`invalid provisional Atlas asset kind: ${entry.path}`);
    if (entry.path === apertureMasterPath) {
      if (entry.relationship !== 'master' || entry.master !== undefined) {
        throw new Error(`provisional aperture must remain the unlinked working master: ${entry.path}`);
      }
    } else if (entry.relationship !== 'derivative' || entry.master !== apertureMasterPath) {
      throw new Error(`provisional Atlas derivative must reference the provisional aperture: ${entry.path}`);
    }

    safePath(root, entry.path);
    await assertRegularFileWithoutSymlinks(root, entry.path);
    await assertRegularFileWithoutSymlinks(root, entry.sourceProvenance);
    const bytes = await readFile(safePath(root, entry.path));
    const svg = bytes.toString('utf8');
    const actualViewBox = svg.match(/<svg\b[^>]*\bviewBox=["']([^"']+)["']/i)?.[1];
    if (actualViewBox !== entry.viewBox) throw new Error(`provisional SVG viewBox mismatch for ${entry.path}`);
    const actualHash = createHash('sha256').update(bytes).digest('hex');
    if (actualHash !== entry.sha256) throw new Error(`provisional sha256 mismatch for ${entry.path}`);

    const upstreamPath = entry.path.slice('packages/atlas/'.length);
    const upstream = atlasManifest.files[upstreamPath];
    if (!upstream || upstream.mediaType !== entry.mediaType || upstream.sha256 !== entry.sha256) {
      throw new Error(`provisional asset does not match Atlas source manifest: ${entry.path}`);
    }
    validateAtlasLineage(entry, upstream, embeddedAtlasMetadata(svg, entry.path));
    rows.push({ path: entry.path, sha256: actualHash, mediaType: entry.mediaType });
  }

  const aperture = entries.get(apertureMasterPath);
  if (!aperture || aperture.kind !== 'aperture' || aperture.relationship !== 'master') {
    throw new Error('provisional Atlas inventory lacks the Continuous Lens Aperture working master');
  }
  return rows.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

export async function validateAssets(rootUrl, manifest) {
  if (!manifest || manifest.schemaVersion !== 2 || !Array.isArray(manifest.assets)) {
    throw new Error('invalid asset manifest');
  }
  const root = fileURLToPath(rootUrl);
  const entries = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  if (entries.size !== manifest.assets.length) throw new Error('duplicate asset path');

  for (const entry of manifest.assets) {
    requireFields(entry, ['path', 'sha256', 'mediaType', 'kind', 'approved', 'approvalState', 'relationship', 'sourceProvenance', 'allowedUses'], 'asset');
    if (!assetKinds.has(entry.kind)) throw new Error(`invalid asset kind: ${entry.path}`);
    if (entry.path.startsWith(atlasSourcePrefix) && !generatedKinds.has(entry.kind)) {
      throw new Error(`public Atlas outputs require an Atlas-generated asset kind: ${entry.path}`);
    }
    if (entry.approved !== true) throw new Error(`publishable asset is unapproved: ${entry.path}`);
    if (!approvalStates.has(entry.approvalState)) throw new Error(`invalid approvalState: ${entry.path}`);
    if (!relationships.has(entry.relationship)) throw new Error(`invalid relationship: ${entry.path}`);
    if (entry.kind === 'logo' && entry.relationship !== 'master') throw new Error(`invalid logo relationship: ${entry.path}`);
    if (!hashPattern.test(entry.sha256)) throw new Error(`invalid sha256: ${entry.path}`);
    validateStringArray(entry.allowedUses, allowedUseValues, 'allowedUses', entry.path);
    safePath(root, entry.path);
    try {
      safePath(root, entry.sourceProvenance);
    } catch (error) {
      throw new Error(`invalid sourceProvenance for ${entry.path}: ${error.message}`);
    }
    if (entry.kind === 'mockup' && proposalDerivativePattern.test(`${entry.path}\n${entry.sourceProvenance}\n${entry.provenanceNote ?? ''}`)) {
      throw new Error(`proposal mockup or proposal derivative is not publishable: ${entry.path}`);
    }
    const expected = mediaTypes.get(extname(entry.path).toLowerCase());
    if (!expected || entry.mediaType !== expected) throw new Error(`wrong media type for ${entry.path}`);
    if (entry.relationship === 'derivative' && !entry.master) throw new Error(`derivative entry requires master: ${entry.path}`);
    if (entry.relationship === 'derivative' && !derivativeKinds.has(entry.kind)) throw new Error(`asset kind may not be published as a derivative: ${entry.path}`);
    if (entry.relationship === 'master' && entry.master !== undefined) throw new Error(`master relationship may not reference another master: ${entry.path}`);
    if (entry.master && !entries.has(entry.master)) throw new Error(`derivative master is absent: ${entry.master}`);

    try {
      await assertRegularFileWithoutSymlinks(root, entry.sourceProvenance);
    } catch (error) {
      throw new Error(`invalid sourceProvenance for ${entry.path}: ${error.message}`);
    }

    if (entry.kind === 'logo') {
      requireFields(entry, ['variant', 'viewBox', 'allowedColorRoles'], 'logo');
      if (!logoVariants.has(entry.variant)) throw new Error(`invalid logo variant: ${entry.path}`);
      if (entry.relationship !== 'master') throw new Error(`invalid logo relationship: ${entry.path}`);
      if (!viewBoxPattern.test(entry.viewBox)) throw new Error(`invalid logo viewBox: ${entry.path}`);
      validateStringArray(entry.allowedColorRoles, colorRoles, 'logo allowedColorRoles', entry.path);
    }
    if (entry.kind === 'font') {
      requireFields(entry, ['family', 'style', 'weightRange', 'license'], 'font');
      if (!['normal', 'italic'].includes(entry.style)
          || !Array.isArray(entry.weightRange)
          || entry.weightRange.length !== 2
          || entry.weightRange.some((weight) => !Number.isInteger(weight))) {
        throw new Error(`invalid font metadata: ${entry.path}`);
      }
    }
    if (generatedKinds.has(entry.kind)) {
      requireFields(entry, ['viewBox', 'generator', 'provenance'], 'generated asset');
      if (entry.mediaType !== 'image/svg+xml' || !viewBoxPattern.test(entry.viewBox)) throw new Error(`invalid generated SVG metadata: ${entry.path}`);
      if (!entry.path.startsWith(atlasSourcePrefix) || entry.sourceProvenance !== atlasManifestPath) {
        throw new Error(`generated Atlas asset must consume the public Atlas output boundary: ${entry.path}`);
      }
      validateGenerator(entry);
      const expectedKind = entry.path === apertureMasterPath
        ? 'aperture'
        : atlasTextureBasenames.has(basename(entry.path)) ? 'texture' : 'atlas';
      if (entry.kind !== expectedKind) throw new Error(`invalid Atlas asset kind: ${entry.path}`);
      if (entry.kind === 'aperture' && entry.relationship !== 'master') throw new Error(`aperture must be a master: ${entry.path}`);
      if (entry.kind !== 'aperture' && (entry.relationship !== 'derivative' || entry.master !== apertureMasterPath)) {
        throw new Error(`Atlas derivative must reference the governed aperture master: ${entry.path}`);
      }
    }
    if (entry.kind === 'mockup') {
      requireFields(entry, ['viewBox', 'provenanceNote'], 'mockup');
      if (entry.mediaType !== 'image/svg+xml' || !entry.allowedUses.includes('mockup')) throw new Error(`invalid mockup governance: ${entry.path}`);
    }
    if (entry.kind === 'evidence') {
      requireFields(entry, ['provenanceNote'], 'evidence');
      if (!entry.allowedUses.includes('evidence')) throw new Error(`invalid evidence governance: ${entry.path}`);
    }
  }

  for (const entry of manifest.assets) {
    const visited = new Set([entry.path]);
    let current = entry;
    while (current.master) {
      if (visited.has(current.master)) throw new Error(`cyclic master reference: ${entry.path}`);
      visited.add(current.master);
      current = entries.get(current.master);
    }
  }

  for (const entry of manifest.assets) {
    if (entry.mediaType === 'font/woff2') {
      const master = entries.get(entry.master);
      if (entry.relationship !== 'derivative' || !master || master.kind !== 'font' || master.mediaType !== 'font/ttf' || master.relationship !== 'master' || master.master !== undefined) {
        throw new Error(`font/woff2 entry must reference a governed font/ttf source: ${entry.path}`);
      }
      for (const field of ['family', 'style', 'weightRange', 'license']) {
        const matches = field === 'weightRange'
          ? isDeepStrictEqual(entry[field], master[field])
          : entry[field] === master[field];
        if (!matches) throw new Error(`${field} must match master for ${entry.path}`);
      }
    }
    if (entry.relationship === 'derivative') {
      const master = entries.get(entry.master);
      if (!master || master.approved !== true || master.approvalState !== 'approved' || master.relationship !== 'master' || master.master !== undefined) {
        throw new Error(`derivative must reference an approved master relationship: ${entry.path}`);
      }
    }
    if (entry.mediaType === 'font/ttf' && (entry.relationship !== 'master' || entry.master !== undefined)) {
      throw new Error(`font/ttf entry must be a governed master: ${entry.path}`);
    }
    if (entry.kind === 'font') {
      const license = entries.get(entry.license);
      if (!license || license.kind !== 'license' || license.family !== entry.family || !/OFL\.txt$/i.test(license.path)) {
        throw new Error(`font entry lacks a family OFL license: ${entry.path}`);
      }
    }
  }

  let atlasManifest;
  if (manifest.assets.some(({ kind }) => generatedKinds.has(kind))) {
    atlasManifest = JSON.parse(await readFile(safePath(root, atlasManifestPath), 'utf8'));
    if (!atlasManifest || atlasManifest.package !== '@bizarre/atlas' || !atlasManifest.files) throw new Error('invalid public Atlas manifest');
  }

  const rows = await Promise.all(manifest.assets.map(async (entry) => {
    const target = safePath(root, entry.path);
    await assertRegularFileWithoutSymlinks(root, entry.path);
    const bytes = await readFile(target);
    if (entry.mediaType === 'image/svg+xml' && entry.viewBox !== undefined) {
      const svg = bytes.toString('utf8');
      const actualViewBox = svg.match(/<svg\b[^>]*\bviewBox=["']([^"']+)["']/i)?.[1];
      if (actualViewBox !== entry.viewBox) throw new Error(`SVG viewBox mismatch for ${entry.path}`);
      if (generatedKinds.has(entry.kind)) {
        const upstreamPath = entry.path.slice('packages/atlas/'.length);
        const upstream = atlasManifest.files[upstreamPath];
        if (!upstream || upstream.mediaType !== entry.mediaType || upstream.sha256 !== entry.sha256) {
          throw new Error(`asset hash or media type does not match Atlas manifest: ${entry.path}`);
        }
        validateAtlasLineage(entry, upstream, embeddedAtlasMetadata(svg, entry.path));
      }
    }
    if (entry.mediaType.startsWith('text/')) {
      const source = bytes.toString('utf8');
      if (source.includes('\r')) throw new Error(`governed text asset has CRLF line endings: ${entry.path}`);
      if (/[\t ]+$/m.test(source)) throw new Error(`governed text asset has trailing whitespace: ${entry.path}`);
    }
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== entry.sha256) throw new Error(`sha256 mismatch for ${entry.path}`);
    return { path: entry.path, sha256: actual, mediaType: entry.mediaType };
  }));
  return rows.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}
