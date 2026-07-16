import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertSchemaValid } from './helpers/schema-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const expectedRecipes = [
  ['04.01', 'field', 'Field Gradient'],
  ['04.02', 'optical-coating', 'Optical-Coating Gradient'],
  ['04.03', 'data-ramp', 'Data-Ramp Gradient'],
  ['04.04', 'heat', 'Heat Gradient'],
  ['04.05', 'exposure', 'Exposure Gradient'],
  ['04.06', 'reflective-film', 'Reflective-Film Gradient'],
  ['04.07', 'material-response', 'Material-Response Gradient'],
];

const expectedFieldStops = [
  [0, '#20274D', 'color.spectrum.deep-indigo'],
  [17, '#3156A6', 'color.spectrum.electric-blue'],
  [34, '#4AA5AF', 'color.spectrum.ion-cyan'],
  [49, '#5C887C', 'color.spectrum.oxidized-teal'],
  [66, '#D5A347', 'color.spectrum.solar-gold'],
  [82, '#C96C3E', 'color.spectrum.amber'],
  [100, '#B64C63', 'color.spectrum.crimson'],
];

const expectedOpticalStops = [
  [0, '#34383B'],
  [14, '#F5F7F4'],
  [29, '#67B7C2'],
  [46, '#765A9B'],
  [62, '#D7AE59'],
  [79, '#B85769'],
  [90, '#F6F2E8'],
  [100, '#4B4E50'],
];

test('gradient recipe source manifest is closed, canonical, and covers all seven approved systems', async () => {
  const manifest = await readJson('governance/gradient-recipes.json');
  const schema = await readJson('schemas/gradient-recipes.schema.json');

  assert.doesNotThrow(() => assertSchemaValid(schema, manifest));
  assert.throws(() => assertSchemaValid(schema, { ...manifest, invented: true }), /not allowed/);

  const hashable = structuredClone(manifest);
  delete hashable.canonicalSha256;
  assert.equal(
    createHash('sha256').update(canonicalJson(hashable)).digest('hex'),
    manifest.canonicalSha256,
    'gradient recipe canonical hash drift',
  );

  assert.deepEqual(
    manifest.recipes.map(({ subjectId, system, name }) => [subjectId, system, name]),
    expectedRecipes,
  );
  assert.equal(new Set(manifest.recipes.map(({ subjectId }) => subjectId)).size, 7);
  assert.equal(new Set(manifest.recipes.map(({ system }) => system)).size, 7);
  assert.deepEqual(manifest.globalRules.permittedSystems, expectedRecipes.map(([, system]) => system));
  assert.deepEqual(manifest.globalRules.signalLime, {
    hex: '#C6FF24',
    interpolation: 'forbidden',
    rule: 'Never grade Signal Lime into another hue.',
  });
  assert.equal(manifest.globalRules.decorativeBlobs, 'forbidden');
  assert.equal(manifest.globalRules.sharedDatasetAcrossRepresentations, 'required');
});

test('field and optical-coating recipes preserve only the two exact archive gradients', async () => {
  const manifest = await readJson('governance/gradient-recipes.json');
  const bySystem = new Map(manifest.recipes.map((recipe) => [recipe.system, recipe]));
  const field = bySystem.get('field');
  const optical = bySystem.get('optical-coating');

  assert.equal(field.valueStatus, 'EXACT SOURCE VALUE');
  assert.deepEqual(field.geometry, {
    kind: 'linear',
    angleDeg: 90,
    valueStatus: 'EXACT SOURCE VALUE',
    interpolationColorSpace: null,
    interpolationColorSpaceStatus: 'NOT VERIFIED',
  });
  assert.deepEqual(
    field.stops.items.map(({ positionPercent, color, tokenRef }) => [positionPercent, color, tokenRef]),
    expectedFieldStops,
  );

  assert.equal(optical.valueStatus, 'EXACT SOURCE VALUE');
  assert.deepEqual(optical.geometry, {
    kind: 'linear',
    angleDeg: 100,
    valueStatus: 'EXACT SOURCE VALUE',
    interpolationColorSpace: null,
    interpolationColorSpaceStatus: 'NOT VERIFIED',
  });
  assert.deepEqual(
    optical.stops.items.map(({ positionPercent, color }) => [positionPercent, color]),
    expectedOpticalStops,
  );

  for (const recipe of [field, optical]) {
    assert.equal(recipe.stops.valueStatus, 'EXACT SOURCE VALUE');
    assert.equal(recipe.physicalEvidenceStatus, 'NOT VERIFIED');
  }
  assert.equal(
    manifest.recipes.flatMap(({ stops }) => stops.items).some(({ color }) => color === '#C6FF24'),
    false,
    'Signal Lime must never be interpolated into a gradient',
  );
});

test('unresolved gradient systems define derivation contracts without invented numeric stops or geometry', async () => {
  const manifest = await readJson('governance/gradient-recipes.json');
  const exactSystems = new Set(['field', 'optical-coating']);
  const unresolved = manifest.recipes.filter(({ system }) => !exactSystems.has(system));

  assert.equal(unresolved.length, 5);
  for (const recipe of unresolved) {
    assert.equal(recipe.valueStatus, 'NOT VERIFIED');
    assert.equal(recipe.physicalEvidenceStatus, 'NOT VERIFIED');
    assert.deepEqual(recipe.geometry, {
      kind: null,
      angleDeg: null,
      valueStatus: 'NOT VERIFIED',
      interpolationColorSpace: null,
      interpolationColorSpaceStatus: 'NOT VERIFIED',
    });
    assert.deepEqual(recipe.stops, { valueStatus: 'NOT VERIFIED', items: [] });
    assert.ok(recipe.derivation.input.length > 0);
    assert.ok(recipe.derivation.mapping.length > 0);
    assert.ok(recipe.derivation.fallback.length > 0);
    assert.ok(recipe.derivation.requiredControls.length > 0);
  }
});

test('every gradient recipe has resolvable source evidence and makes no publication claim', async () => {
  const manifest = await readJson('governance/gradient-recipes.json');
  const sourceIds = new Set(manifest.sources.map(({ sourceId }) => sourceId));

  assert.deepEqual(manifest.authority.doesNotAuthorize, [
    'figma-publication',
    'affinity-publication',
    'physical-performance-claims',
  ]);
  for (const recipe of manifest.recipes) {
    assert.ok(recipe.sourceRefs.length > 0);
    for (const sourceRef of recipe.sourceRefs) assert.ok(sourceIds.has(sourceRef), `unknown source ${sourceRef}`);
  }
});
