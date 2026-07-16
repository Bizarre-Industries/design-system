import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const readBytes = (path) => readFile(new URL(path, root));
const readText = async (path) => (await readBytes(path)).toString('utf8');
const readJson = async (path) => JSON.parse(await readText(path));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function pngDimensions(bytes) {
  const signature = bytes.subarray(0, 8).toString('hex');
  assert.equal(signature, '89504e470d0a1a0a', 'reference must be a PNG');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG must begin with IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function pathArray(svg) {
  return [...svg.matchAll(/<path\b[^>]*\bd="([^"]*)"/g)].map((match) => match[1]);
}

test('governs the owner reference and ImageGen concepts without promoting them to brand assets', async () => {
  const manifest = await readJson('extensions/astronomical-atlas/references/signal-infrastructure/v1.0.0/MANIFEST.json');
  const assets = await readJson('brand/assets.json');

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.collection, 'bizarre-signal-infrastructure');
  assert.equal(manifest.status, 'working-reference-set');
  assert.equal(manifest.authority, false);

  const ownerBytes = await readBytes(manifest.ownerReference.path);
  assert.equal(sha256(ownerBytes), manifest.ownerReference.sha256);
  assert.deepEqual(pngDimensions(ownerBytes), manifest.ownerReference.dimensions);
  assert.equal(manifest.ownerReference.classification, 'approved-visual-direction-reference');
  assert.equal(manifest.ownerReference.authority, 'scoped');
  assert.equal(manifest.ownerReference.publishable, false);

  assert.equal(manifest.generatedConcepts.length, 2);
  for (const concept of manifest.generatedConcepts) {
    const [image, prompt] = await Promise.all([readBytes(concept.path), readBytes(concept.promptPath)]);
    assert.equal(sha256(image), concept.sha256, concept.path);
    assert.deepEqual(pngDimensions(image), concept.dimensions, concept.path);
    assert.equal(sha256(prompt), concept.promptSha256, concept.promptPath);
    assert.equal(concept.classification, 'generated-concept-reference');
    assert.equal(concept.tool, 'openai-imagegen');
    assert.equal(concept.authority, false);
    assert.equal(concept.publishable, false);
    assert.deepEqual(concept.allowedUses, ['affinity-vector-reconstruction', 'internal-design-review']);
    assert.ok(concept.warnings.some((warning) => /non-canonical|exact governed|editable Affinity/i.test(warning)));
    assert.equal(assets.assets.some(({ path }) => path === concept.path), false);
  }
});

test('pins every Affinity reconstruction to the exact governed Gravity Well path array', async () => {
  const manifest = await readJson('extensions/astronomical-atlas/references/signal-infrastructure/v1.0.0/MANIFEST.json');
  const geometry = manifest.canonicalGeometry;

  assert.equal(geometry.geometryRule, 'exact-geometry');
  assert.equal(sha256(await readBytes(geometry.invariantSource)), geometry.invariantSourceSha256);
  assert.equal(geometry.placementAssets.length, 3);

  const pathFingerprints = [];
  for (const asset of geometry.placementAssets) {
    const bytes = await readBytes(asset.path);
    const svg = bytes.toString('utf8');
    assert.equal(sha256(bytes), asset.sha256, asset.path);
    assert.match(svg, new RegExp(`viewBox="${geometry.viewBox.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    const paths = pathArray(svg);
    assert.equal(paths.length, 16, asset.path);
    pathFingerprints.push(sha256(JSON.stringify(paths)));
  }

  assert.deepEqual(new Set(pathFingerprints), new Set([geometry.pathArraySha256]));
});

test('records the latest owner preview as a scoped visual-direction update', async () => {
  const source = await readJson('extensions/astronomical-atlas/SOURCE.json');
  const reference = source.sources.visualDirection;

  assert.deepEqual(reference, {
    sourcePath: 'owner-attachment://bizarre-signal-infrastructure-preview.png',
    importedPath: 'extensions/astronomical-atlas/references/signal-infrastructure/v1.0.0/owner/bizarre-signal-infrastructure-preview.png',
    manifestPath: 'extensions/astronomical-atlas/references/signal-infrastructure/v1.0.0/MANIFEST.json',
    sha256: '9f968b4f21eea302cb3bf659489ea5efe836457f92827e5a5ef5083d1e945376',
    classification: 'approved-visual-direction-reference',
    relationship: 'approved-visual-direction-update',
    authority: 'scoped-to-visual-direction',
    overrides: ['presentation-language', 'asset-production-method', 'mockup-production-method'],
    publishable: false,
  });
});

test('ships a strict schema for future reference collections', async () => {
  const schema = await readJson('schemas/reference-manifest.schema.json');
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.authority.const, false);
  assert.equal(schema.$defs.ownerReference.properties.authority.const, 'scoped');
  assert.equal(schema.$defs.generatedConcept.properties.authority.const, false);
  assert.equal(schema.$defs.generatedConcept.properties.publishable.const, false);
});
