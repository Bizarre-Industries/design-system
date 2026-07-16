import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { buildExpectedAtlas } from '../scripts/build-atlas.mjs';
import { ATLAS_CONFIG } from '../packages/atlas/src/config.mjs';
import { renderAtlas } from '../packages/atlas/src/render.mjs';
import { hashConfiguration, validateProvenance } from '../packages/atlas/src/provenance.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const execFile = promisify(execFileCallback);

function embeddedMetadata(bytes) {
  const match = bytes.toString('utf8').match(/<metadata id="bizarre-atlas-provenance">([\s\S]*?)<\/metadata>/);
  assert.ok(match, 'generated SVG must embed provenance');
  return JSON.parse(match[1]);
}

test('validates honest synthetic provenance and detects tampering', () => {
  const { metadata } = renderAtlas({ orientation: 18, representation: 'dots' });
  assert.equal(validateProvenance(metadata), true);
  assert.equal(
    metadata.sourceIdentifier,
    `synthetic:${metadata.algorithm.name}@${metadata.algorithm.version}:${metadata.fieldConfigurationHash}`
  );
  for (const field of ATLAS_CONFIG.policies.provenance.exports.requiredMetadata) {
    assert.ok(Object.hasOwn(metadata, field), `missing policy-required metadata: ${field}`);
  }

  assert.throws(
    () => validateProvenance({ ...metadata, configurationHash: '0'.repeat(64) }),
    /configuration hash/i
  );
  const forgedFieldHash = '1'.repeat(64);
  assert.throws(
    () => validateProvenance({
      ...metadata,
      fieldConfigurationHash: forgedFieldHash,
      sourceIdentifier: `synthetic:${metadata.algorithm.name}@${metadata.algorithm.version}:${forgedFieldHash}`
    }),
    /field configuration hash/i
  );
  assert.throws(
    () => validateProvenance({ ...metadata, sourceType: 'observed' }),
    /synthetic/i
  );
  assert.throws(
    () => validateProvenance({ ...metadata, representation: 'spectral' }),
    /representation.*configuration/i
  );
  assert.throws(
    () => validateProvenance({ ...metadata, aperturePathSha256: '2'.repeat(64) }),
    /aperture path hash.*configuration/i
  );
  assert.throws(
    () => validateProvenance({ ...metadata, seed: 1 }),
    /seed/i
  );
  assert.throws(() => validateProvenance({ ...metadata, schemaVersion: 999 }), /schema version/i);
  assert.throws(() => validateProvenance({ ...metadata, orientationUnit: 'rad' }), /orientation unit/i);

  for (const [field, value] of [
    ['appearance', 'sepia'],
    ['opticalSize', 'billboard'],
    ['productionProfile', 'print'],
    ['representation', 'decorative-noise'],
    ['trajectoryState', 'orbiting']
  ]) {
    const configuration = {
      ...metadata.configuration,
      render: { ...metadata.configuration.render, [field]: value }
    };
    assert.throws(() => validateProvenance({
      ...metadata,
      configuration,
      configurationHash: hashConfiguration(configuration),
      [field]: value
    }), new RegExp(`unsupported ${field}`, 'i'));
  }
});

test('sources every algorithm constant from the governed renderer configuration', async () => {
  const bytes = await readFile(new URL('../packages/atlas/src/renderer-config.json', import.meta.url));
  const source = JSON.parse(bytes);

  assert.deepEqual(ATLAS_CONFIG.field.parameters, source.renderer.parameters);
  assert.deepEqual(ATLAS_CONFIG.renderer.algorithm, source.renderer.algorithm);
  assert.deepEqual(ATLAS_CONFIG.renderer.model, source.renderer.model);
  assert.equal(ATLAS_CONFIG.sourceDocuments.rendererConfig.sha256, hash(bytes));
  assert.equal(ATLAS_CONFIG.sourceDocuments.rendererConfig.path, 'packages/atlas/src/renderer-config.json');
});

test('configuration hashing rejects state that canonical JSON cannot preserve', () => {
  const { metadata } = renderAtlas({ orientation: 18 });
  const withNamedArrayState = structuredClone(metadata.configuration);
  withNamedArrayState.palette.spectrum.calibration = '#FFFFFF';
  assert.throws(() => hashConfiguration(withNamedArrayState), /array.*named|JSON-safe/i);
  assert.throws(
    () => validateProvenance({ ...metadata, configuration: withNamedArrayState }),
    /array.*named|JSON-safe/i
  );

  const cyclic = structuredClone(metadata.configuration);
  cyclic.self = cyclic;
  assert.throws(() => hashConfiguration(cyclic), /cyclic/i);
  assert.throws(() => validateProvenance({ ...metadata, configuration: cyclic }), /cyclic/i);
});

test('packed Atlas renderer loads and renders without monorepo-relative sources', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'bizarre-atlas-pack-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const { stdout } = await execFile('npm', ['pack', './packages/atlas', '--json', '--pack-destination', directory], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, npm_config_cache: join(directory, '.npm-cache') },
  });
  const [{ filename }] = JSON.parse(stdout);
  await execFile('tar', ['-xzf', join(directory, filename), '-C', directory]);
  const moduleUrl = pathToFileURL(join(directory, 'package', 'src', 'render.mjs')).href;
  const probe = [
    `const atlas = await import(${JSON.stringify(moduleUrl)});`,
    'const result = atlas.renderAtlas({ orientation: 18 });',
    'if (result.metadata.sourceType !== "synthetic") process.exit(2);'
  ].join('');
  await execFile(process.execPath, ['--input-type=module', '-e', probe]);
});

test('builds the complete deterministic Atlas package inventory', async () => {
  const expectedPaths = [
    'generated/atlas-bands.svg',
    'generated/atlas-contours-dark.svg',
    'generated/atlas-contours-large.svg',
    'generated/atlas-contours-light.svg',
    'generated/atlas-dots-large.svg',
    'generated/atlas-dots.svg',
    'generated/atlas-hatch-large.svg',
    'generated/atlas-hatch.svg',
    'generated/atlas-micro.svg',
    'generated/atlas-spectral-large.svg',
    'generated/atlas-spectral.svg',
    'generated/calibrated-aperture.svg',
    'generated/capture-sequence.svg',
    'generated/config.json',
    'generated/instrument-dial.svg',
    'generated/livery-strip.svg',
    'generated/manifest.json'
  ];
  const first = await buildExpectedAtlas(new URL('../', import.meta.url));
  const second = await buildExpectedAtlas(new URL('../', import.meta.url));

  assert.deepEqual([...first.keys()], expectedPaths);
  assert.deepEqual([...second.keys()], expectedPaths);
  for (const path of expectedPaths) assert.deepEqual(first.get(path), second.get(path), path);

  const manifest = JSON.parse(first.get('generated/manifest.json'));
  assert.equal(manifest.package, '@bizarre/atlas');
  assert.deepEqual(Object.keys(manifest.files), expectedPaths.slice(0, -1));
  for (const path of expectedPaths.slice(0, -1)) {
    assert.equal(manifest.files[path].sha256, hash(first.get(path)), path);
    if (path === 'generated/config.json') {
      assert.equal(manifest.files[path].mediaType, 'application/json');
      assert.deepEqual(JSON.parse(first.get(path)), ATLAS_CONFIG);
      continue;
    }
    assert.equal(manifest.files[path].mediaType, 'image/svg+xml');
    const metadata = embeddedMetadata(first.get(path));
    assert.equal(validateProvenance(metadata), true, path);
    assert.equal(manifest.files[path].provenance.sourceIdentifier, metadata.sourceIdentifier, path);
  }
});

test('representation derivatives retain one underlying field configuration', async () => {
  const files = await buildExpectedAtlas(new URL('../', import.meta.url));
  const paths = [
    'generated/atlas-bands.svg',
    'generated/atlas-contours-dark.svg',
    'generated/atlas-contours-light.svg',
    'generated/atlas-dots.svg',
    'generated/atlas-hatch.svg',
    'generated/atlas-spectral.svg'
  ];
  const metadata = paths.map((path) => embeddedMetadata(files.get(path)));

  assert.equal(new Set(metadata.map(({ fieldConfigurationHash }) => fieldConfigurationHash)).size, 1);
  assert.deepEqual(new Set(metadata.map(({ representation }) => representation)), new Set(['bands', 'contour', 'dots', 'hatch', 'spectral']));
  for (const row of metadata) {
    assert.equal(row.sourceType, 'synthetic');
    assert.equal(row.model.name, 'single-mass-lensing-field');
    assert.equal(Object.hasOwn(row, 'seed'), false);
  }
});

test('Large Affinity derivatives retain one governed 620x349 field and invariant geometry', async () => {
  const files = await buildExpectedAtlas(new URL('../', import.meta.url));
  const paths = [
    'generated/atlas-contours-large.svg',
    'generated/atlas-dots-large.svg',
    'generated/atlas-hatch-large.svg',
    'generated/atlas-spectral-large.svg'
  ];
  const rows = paths.map((path) => {
    const bytes = files.get(path);
    assert.ok(bytes, `missing governed Large derivative: ${path}`);
    const svg = bytes.toString('utf8');
    return {
      aperture: svg.match(/<path data-layer="continuous-lens-aperture" d="([^"]+)"/)?.[1],
      field: [...svg.matchAll(/<path data-layer="field-line"[^>]* d="([^"]+)"/g)].map((match) => match[1]),
      metadata: embeddedMetadata(bytes),
      signal: svg.match(/<path data-layer="signal-trajectory" data-role="path" d="([^"]+)"/)?.[1]
    };
  });

  assert.deepEqual(rows.map(({ metadata }) => metadata.representation), ['contour', 'dots', 'hatch', 'spectral']);
  assert.equal(new Set(rows.map(({ metadata }) => metadata.fieldConfigurationHash)).size, 1);
  assert.equal(new Set(rows.map(({ metadata }) => metadata.sourceIdentifier)).size, 1);
  for (const { aperture, field, metadata, signal } of rows) {
    assert.deepEqual(metadata.configuration.dimensions, { height: 349, width: 620 });
    assert.equal(metadata.appearance, 'dark');
    assert.equal(metadata.opticalSize, 'large');
    assert.equal(metadata.orientation, 18);
    assert.equal(metadata.productionProfile, 'screen');
    assert.equal(metadata.trajectoryState, 'active');
    assert.equal(metadata.configuration.field.parameters.lineCounts.large, 53);
    assert.equal(metadata.configuration.field.parameters.spacingByOpticalSize.large, 0.01525);
    assert.equal(field.length, 74, 'smooth rotated Continuous Lens occlusion must retain the governed segment count');
    assert.ok(aperture, 'Large derivative must include the smooth Continuous Lens aperture');
    assert.ok(signal, 'Large derivative must include the active signal trajectory');
  }
  for (const row of rows.slice(1)) {
    assert.deepEqual(row.field, rows[0].field);
    assert.equal(row.aperture, rows[0].aperture);
    assert.equal(row.signal, rows[0].signal);
  }
});

test('workspace and governance expose the Atlas package build boundary', async () => {
  const workspace = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../package.json', import.meta.url), 'utf8')));
  const contract = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../governance/package-contract.json', import.meta.url), 'utf8')));
  const atlas = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../packages/atlas/package.json', import.meta.url), 'utf8')));

  assert.equal(workspace.scripts['build:atlas'], 'node scripts/build-atlas.mjs');
  assert.ok(workspace.scripts.build.includes('npm run build:atlas'));
  assert.ok(contract.packages.includes('@bizarre/atlas'));
  assert.equal(atlas.name, '@bizarre/atlas');
  assert.equal(atlas.private, true);
  assert.ok(contract.publication.privateWorking.includes('@bizarre/atlas'));
  assert.deepEqual(atlas.files, ['src', 'generated', 'README.md']);
});
