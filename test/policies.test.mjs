import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertSchemaValid } from './helpers/schema-contract.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('bilingual policy is equal-priority, native-direction, and explicitly provisional', async () => {
  const policy = await readJson('policies/bilingual.json');
  const schema = await readJson('schemas/bilingual-policy.schema.json');
  assert.doesNotThrow(() => assertSchemaValid(schema, policy));
  assert.throws(() => assertSchemaValid(schema, { ...policy, invented: true }), /not allowed/);
  assert.equal(policy.schemaVersion, schema.properties.schemaVersion.const);
  assert.equal(schema.additionalProperties, false);
  assert.equal(policy.status, 'provisional');
  assert.equal(policy.equalPriority, true);
  assert.equal(policy.opticalAreaTolerance, 0.12);
  assert.deepEqual(policy.scale, { arabicBody: 1.06, arabicDisplay: 1.02 });
  assert.deepEqual(policy.fonts, {
    body: 'Noto Sans Arabic',
    ui: 'Noto Sans Arabic UI',
    industrial: { family: 'Noto Sans Arabic Condensed', weight: 800 }
  });
  assert.equal(policy.direction.text, 'native');
  assert.equal(policy.direction.field, 'preserve-physics');
  assert.equal(policy.numerals.sharedInstruments, 'tabular-latin');
  assert.equal(policy.release.publicReady, false);
  assert.deepEqual(policy.release.requires, ['governed-font-binaries', 'native-arabic-review', 'optical-parity-evidence']);
});

test('provenance policy forbids claims that the renderer does not implement', async () => {
  const policy = await readJson('policies/provenance.json');
  const schema = await readJson('schemas/provenance-policy.schema.json');
  assert.doesNotThrow(() => assertSchemaValid(schema, policy));
  assert.throws(() => assertSchemaValid(schema, {
    ...policy,
    exports: { requiredMetadata: policy.exports.requiredMetadata.slice(0, -1) }
  }), /canonical value/);
  assert.equal(policy.schemaVersion, schema.properties.schemaVersion.const);
  assert.deepEqual(policy.classifications, ['observed', 'synthetic', 'licensed', 'commissioned', 'generated', 'original']);
  assert.equal(policy.synthetic.requireModel, true);
  assert.equal(policy.synthetic.requireParameterHash, true);
  assert.equal(policy.synthetic.allowSeedOnlyWhenConsumed, true);
  assert.equal(policy.observed.requireCatalogueOrDataset, true);
  assert.equal(policy.observed.requireCoordinates, true);
  assert.equal(policy.observed.requireEpoch, true);
  assert.equal(policy.observed.requireUnits, true);
  assert.deepEqual(policy.exports.requiredMetadata, [
    'sourceType', 'sourceIdentifier', 'orientation', 'apertureVersion',
    'trajectoryState', 'representation', 'productionProfile'
  ]);
  assert.equal(policy.release.passRequiresEvidence, true);
  assert.deepEqual(policy.release.statuses, ['PASS', 'FAIL', 'NOT VERIFIED']);
});

test('production policy records targets without pretending physical samples passed', async () => {
  const policy = await readJson('policies/production.json');
  const schema = await readJson('schemas/production-policy.schema.json');
  assert.doesNotThrow(() => assertSchemaValid(schema, policy));
  assert.throws(() => assertSchemaValid(schema, {
    ...policy,
    minimums: { ...policy.minimums, finePrintContour: { ...policy.minimums.finePrintContour, value: 0.2 } }
  }), /canonical value/);
  assert.equal(policy.schemaVersion, schema.properties.schemaVersion.const);
  assert.deepEqual(policy.minimums, {
    finePrintContour: { value: 0.18, unit: 'mm', evidence: 'NOT VERIFIED' },
    vinylContour: { value: 1.5, unit: 'mm', evidence: 'NOT VERIFIED' },
    screenContour: { value: 1, unit: 'px', highSalience: 2, evidence: 'NOT VERIFIED' },
    aperturePrint: { value: 12, unit: 'mm', evidence: 'NOT VERIFIED' },
    apertureScreen: { value: 48, unit: 'px', evidence: 'NOT VERIFIED' }
  });
  assert.deepEqual(policy.unresolvedProfiles, ['embroidery', 'engraving', 'foil', 'retroreflective', 'illuminated']);
  assert.equal(policy.oneColor.required, true);
  assert.equal(policy.oneColor.limeRequired, false);
});
