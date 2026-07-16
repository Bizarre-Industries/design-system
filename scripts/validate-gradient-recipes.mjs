import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const path = new URL('../governance/gradient-recipes.json', import.meta.url);
const manifest = JSON.parse(await readFile(path, 'utf8'));

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const hashable = structuredClone(manifest);
delete hashable.canonicalSha256;
assert.equal(
  createHash('sha256').update(canonicalJson(hashable)).digest('hex'),
  manifest.canonicalSha256,
  'gradient recipe canonical hash drift',
);

const expectedSystems = [
  ['04.01', 'field', 'Field Gradient'],
  ['04.02', 'optical-coating', 'Optical-Coating Gradient'],
  ['04.03', 'data-ramp', 'Data-Ramp Gradient'],
  ['04.04', 'heat', 'Heat Gradient'],
  ['04.05', 'exposure', 'Exposure Gradient'],
  ['04.06', 'reflective-film', 'Reflective-Film Gradient'],
  ['04.07', 'material-response', 'Material-Response Gradient'],
];
assert.deepEqual(manifest.recipes.map(({ subjectId, system, name }) => [subjectId, system, name]), expectedSystems);

const bySystem = new Map(manifest.recipes.map((recipe) => [recipe.system, recipe]));
assert.deepEqual(
  bySystem.get('field').stops.items.map(({ positionPercent, color }) => [positionPercent, color]),
  [[0, '#20274D'], [17, '#3156A6'], [34, '#4AA5AF'], [49, '#5C887C'], [66, '#D5A347'], [82, '#C96C3E'], [100, '#B64C63']],
);
assert.equal(bySystem.get('field').geometry.angleDeg, 90);
assert.deepEqual(
  bySystem.get('optical-coating').stops.items.map(({ positionPercent, color }) => [positionPercent, color]),
  [[0, '#34383B'], [14, '#F5F7F4'], [29, '#67B7C2'], [46, '#765A9B'], [62, '#D7AE59'], [79, '#B85769'], [90, '#F6F2E8'], [100, '#4B4E50']],
);
assert.equal(bySystem.get('optical-coating').geometry.angleDeg, 100);

for (const recipe of manifest.recipes) {
  assert.equal(recipe.physicalEvidenceStatus, 'NOT VERIFIED');
  assert.equal(recipe.stops.items.some(({ color }) => color === '#C6FF24'), false);
  if (recipe.system === 'field' || recipe.system === 'optical-coating') continue;
  assert.equal(recipe.valueStatus, 'NOT VERIFIED');
  assert.equal(recipe.geometry.kind, null);
  assert.equal(recipe.geometry.angleDeg, null);
  assert.equal(recipe.geometry.valueStatus, 'NOT VERIFIED');
  assert.equal(recipe.stops.valueStatus, 'NOT VERIFIED');
  assert.deepEqual(recipe.stops.items, []);
}

const sourceIds = new Set(manifest.sources.map(({ sourceId }) => sourceId));
for (const recipe of manifest.recipes) {
  for (const sourceRef of recipe.sourceRefs) assert.ok(sourceIds.has(sourceRef), `unknown source ${sourceRef}`);
}

console.log('Validated 7 governed gradient recipes (2 exact source recipes, 5 NOT VERIFIED derivation contracts)');
