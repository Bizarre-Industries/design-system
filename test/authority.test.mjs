import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { isDeepStrictEqual } from 'node:util';

const ORIGINAL_DESIGN_SHA256 = 'e6aa6f391d12f568c6845fa8269178acd38bc969650ceed202e894c3de4aee93';
const IMPORTED_DESIGN_SHA256 = '4bbe2429bb13f85103d447b8bd589b643f3b8809bd4a83798958e5fe96c53e7f';
const PROPOSAL_ZIP_SHA256 = 'b070392d798a28e2ae50f276e2014437bde655eebe532e6fae22264c3974db53';
const PRECEDENCE = ['invariants', 'extensions', 'fallbacks', 'derivedOutputs'];

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const readJson = async (path) => JSON.parse(await read(path));
const hash = (value) => createHash('sha256').update(value).digest('hex');

function resolveReference(root, reference) {
  assert.match(reference, /^#\//, `unsupported schema reference: ${reference}`);
  return reference.slice(2).split('/').reduce(
    (value, segment) => value[segment.replaceAll('~1', '/').replaceAll('~0', '~')],
    root,
  );
}

function schemaErrors(schema, value, root, path = '$') {
  if (schema.$ref) return schemaErrors(resolveReference(root, schema.$ref), value, root, path);

  const errors = [];
  if (schema.oneOf) {
    const results = schema.oneOf.map((candidate) => schemaErrors(candidate, value, root, path));
    if (results.filter((result) => result.length === 0).length !== 1) {
      errors.push(`${path} must match exactly one allowed shape`);
    }
    return errors;
  }

  if (Object.hasOwn(schema, 'const') && !isDeepStrictEqual(value, schema.const)) {
    errors.push(`${path} must equal its canonical value`);
  }
  if (schema.enum && !schema.enum.some((candidate) => isDeepStrictEqual(value, candidate))) {
    errors.push(`${path} must be an allowed value`);
  }
  if (schema.type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (schema.type === 'array' && !Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return errors;
  }
  if (schema.type === 'string' && typeof value !== 'string') {
    errors.push(`${path} must be a string`);
    return errors;
  }
  if (schema.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
    return errors;
  }
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
    errors.push(`${path} must match ${schema.pattern}`);
  }
  if (schema.minLength && typeof value === 'string' && value.length < schema.minLength) {
    errors.push(`${path} must not be empty`);
  }

  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${path}.${required} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) errors.push(`${path}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) errors.push(...schemaErrors(child, value[key], root, `${path}.${key}`));
    }
  }

  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path} must contain unique items`);
    }
    if (schema.items) {
      value.forEach((item, index) => errors.push(...schemaErrors(schema.items, item, root, `${path}[${index}]`)));
    }
  }

  return errors;
}

function validate(schema, value) {
  const errors = schemaErrors(schema, value, schema);
  assert.deepEqual(errors, []);
}

function byId(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

test('imported DESIGN records its exact owner override and preserves the original proposal hash', async () => {
  const [design, source] = await Promise.all([
    read('extensions/astronomical-atlas/DESIGN.md'),
    readJson('extensions/astronomical-atlas/SOURCE.json'),
  ]);

  assert.equal(hash(design), IMPORTED_DESIGN_SHA256);
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.extension, 'astronomical-atlas');
  assert.equal(source.classification, 'approved-extension-with-overrides');
  assert.equal(source.importDate, '2026-07-15');
  assert.deepEqual(source.sources.design, {
    sourcePath: 'owner-attachment://Bizarre_Astronomical_Atlas_DESIGN.md',
    importedPath: 'extensions/astronomical-atlas/DESIGN.md',
    originalSourceSha256: ORIGINAL_DESIGN_SHA256,
    sha256: IMPORTED_DESIGN_SHA256,
    overrideBasis: 'Direct owner decisions in the active design task supersede imported wording. The imported authority records the owner-selected left Continuous Lens Aperture v2 direction and the 2026-07-16 single-identity, integrate-not-replace product policy.',
  });
  assert.equal(source.sources.proposalZip.sourcePath, 'owner-attachment://bizarre-astronomical-atlas.zip');
  assert.equal(source.sources.proposalZip.sha256, PROPOSAL_ZIP_SHA256);
  assert.equal(source.sources.proposalZip.classification, 'approved-source-bundle-with-quarantined-derivatives');
  assert.equal(source.sources.proposalZip.authority, 'scoped-by-entry');
  assert.ok(source.sources.proposalZip.entries.some(({ path, classification }) =>
    path === 'bizarre-astronomical-atlas/tokens/astronomical-atlas.tokens.json'
    && classification === 'approved-source-input-requires-canonical-translation'));
  assert.ok(source.sources.proposalZip.entries.some(({ path, sha256 }) =>
    path === 'bizarre-astronomical-atlas/DESIGN.md'
    && sha256 === ORIGINAL_DESIGN_SHA256));
  assert.ok(source.sources.proposalZip.entries.some(({ pathPattern, authority, publishable }) =>
    pathPattern?.includes('assets') && authority === false && publishable === false));
  assert.deepEqual(source.sources.proposalZip.conflictResolution, [{
    id: 'capture-duration-naming',
    winner: 'bizarre-astronomical-atlas/DESIGN.md',
    resolution: 'UI adaptation 300-600ms, ceremonial 1200ms, installation 2400ms',
  }]);
});

test('only the company name and Gravity Well geometry are non-negotiable invariants', async () => {
  const authority = await readJson('governance/authority.json');
  const invariants = byId(authority.invariants);

  assert.deepEqual(authority.precedence, PRECEDENCE);
  assert.deepEqual(invariants['company-name'], {
    id: 'company-name', source: 'brand/identity.json', pointer: '/companyName',
    rule: 'exact-value', value: 'Bizarre Industries', overrideable: false,
  });
  assert.deepEqual(invariants['gravity-well-geometry'], {
    id: 'gravity-well-geometry', source: 'logo/source/original-lockup.svg',
    rule: 'exact-geometry', overrideable: false,
  });
  assert.deepEqual(Object.keys(invariants).sort(), ['company-name', 'gravity-well-geometry']);
  assert.ok(authority.invariants.every(({ overrideable }) => overrideable === false));
});

test('Atlas explicitly overrides only the approved gradient, Arabic, and Workshop rules', async () => {
  const authority = await readJson('governance/authority.json');
  assert.equal(authority.extensions.length, 1);

  const extension = authority.extensions[0];
  assert.equal(extension.id, 'astronomical-atlas');
  assert.equal(extension.source, 'extensions/astronomical-atlas/DESIGN.md');
  assert.equal(extension.classification, 'approved-extension-with-overrides');
  assert.equal(extension.scope, 'explicit-rules-only');
  assert.equal(extension.overridesFallbacks, true);

  const overrides = byId(extension.overrides);
  assert.deepEqual(overrides['gradient-policy'], {
    id: 'gradient-policy', type: 'policy',
    evidence: 'extensions/astronomical-atlas/DESIGN.md#gradient-rules',
    permits: ['atlas', 'data', 'material'],
    forbids: ['logo', 'signal-lime'],
  });
  assert.deepEqual(overrides['interim-arabic-stack'], {
    id: 'interim-arabic-stack',
    type: 'typography',
    evidence: 'extensions/astronomical-atlas/DESIGN.md#arabic-implementation-stack',
    status: 'interim',
    fontStack: {
      displayAndBody: 'Noto Sans Arabic',
      compactUi: 'Noto Sans Arabic UI',
    },
    publicShipping: {
      status: 'NOT VERIFIED',
      requiredGates: ['governed-font-assets', 'specialist-optical-parity-review'],
    },
  });
  assert.deepEqual(overrides['workshop-semantic-values'], {
    id: 'workshop-semantic-values',
    type: 'tokens',
    evidence: 'archive:tools/build_system.py:520-524; archive:tokens.css:157-161; owner-approved-architecture:2026-07-15',
    theme: 'workshop',
    breakingChange: true,
    replacements: [
      { token: 'surface.elevated', from: '{color.neutral.midnight}', to: '#23211C' },
      { token: 'surface.card', from: '{color.neutral.smoke}', to: '#2D2A23' },
      { token: 'content.secondary', from: '{color.neutral.ash300}', to: '#B5B0A4' },
      { token: 'content.muted', from: '{color.neutral.ash300}', to: '#A49E90' },
    ],
  });
  assert.deepEqual(Object.keys(overrides).sort(), [
    'gradient-policy', 'interim-arabic-stack', 'workshop-semantic-values',
  ]);
});

test('the canonical repository is fallback authority wherever Atlas is silent', async () => {
  const authority = await readJson('governance/authority.json');
  assert.deepEqual(authority.fallbacks, [{
    id: 'canonical-repository',
    repository: 'Bizarre-Industries/design-system',
    source: '.',
    appliesWhen: 'atlas-extension-silent',
  }]);
});

test('generated and tool-authored outputs are derivative and never authority', async () => {
  const authority = await readJson('governance/authority.json');
  assert.deepEqual(authority.derivedOutputs, [{
    id: 'generated-artifacts',
    formats: ['html', 'css', 'pdf', 'mockup', 'figma', 'affinity', 'open-design'],
    classification: 'derivative-only',
    authority: false,
  }]);
});

test('authority schema accepts the contract and rejects weakened precedence', async () => {
  const [authority, schema] = await Promise.all([
    readJson('governance/authority.json'),
    readJson('schemas/authority.schema.json'),
  ]);

  assert.doesNotThrow(() => validate(schema, authority));
  assert.throws(() => validate(schema, { ...authority, unexpected: true }), /not allowed/);
  assert.throws(() => validate(schema, {
    ...authority,
    invariants: authority.invariants.map((item, index) => index === 0 ? { ...item, overrideable: true } : item),
  }), /canonical value/);
  assert.throws(() => validate(schema, {
    ...authority,
    derivedOutputs: authority.derivedOutputs.map((item) => ({ ...item, authority: true })),
  }), /canonical value/);
});

test('repository documentation identifies the governed extension boundary', async () => {
  const [rootReadme, extensionReadme] = await Promise.all([
    read('README.md'),
    read('extensions/astronomical-atlas/README.md'),
  ]);

  assert.match(rootReadme, /Astronomical Atlas.*approved extension/i);
  assert.match(rootReadme, /explicit override.*canonical repository.*silent/is);
  assert.match(extensionReadme, /byte-for-byte/i);
  assert.match(extensionReadme, /approved source bundle with authority scoped by entry/i);
  assert.match(extensionReadme, /Generated HTML, CSS, PDF, mockups.*derivative/i);
});
