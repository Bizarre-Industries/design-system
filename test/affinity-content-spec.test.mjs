import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = new URL('../', import.meta.url);

test('the governed 104-subject Affinity content specification validates', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['scripts/validate-affinity-content-spec.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.match(stdout, /Validated explicit Affinity content\/visual specifications for 104 subjects/);
});

test('identity, aperture, concept, and overview contracts stay explicit', async () => {
  const spec = JSON.parse(await readFile(new URL('../production/affinity/bizarre-masterbrand-content-spec-v2.json', import.meta.url), 'utf8'));
  const byId = new Map(spec.subjects.map((subject) => [subject.subjectId, subject]));

  assert.equal(spec.subjects.length, 104);
  assert.equal(spec.subjects.filter((subject) => subject.anatomyType === 'overview').length, 13);
  assert.equal(spec.subjects.filter((subject) => subject.governance.authorityStatus === 'governed-provisional').length, 5);

  assert.equal(byId.get('01.03').subjectName, 'Single Identity / Native Integration');
  assert.match(byId.get('01.03').sections.Definition.content, /one Bizarre Industries identity/i);
  assert.match(byId.get('01.03').sections.Usage.content, /before theming, component changes, platform adaptation, or prototype work/i);
  assert.match(byId.get('01.03').sections.Misuse.content, /inventing a React visual language/i);
  assert.ok(!byId.get('01.03').visualRecipe.sourceMappings.some(({ sourceId }) => sourceId === 'designDoc'));
  assert.deepEqual(byId.get('01.03').visualRecipe.allowedConceptReferenceIds, []);

  assert.match(byId.get('02.01').sections.Usage.content, /complete Signal Lime mark on Void/);
  assert.match(byId.get('02.01').sections.Usage.content, /complete black mark on Signal or Paper/);
  assert.match(byId.get('02.01').sections.Misuse.content, /mixed green\/black/);

  assert.match(byId.get('06.01').sections.Definition.content, /smooth tangent-continuous asymmetric oval/);
  assert.equal(byId.get('06.01').governance.usesRejectedInputs, false);
  assert.equal(byId.get('06.01').governance.usesProvisionalInputs, true);
  assert.match(byId.get('06.01').sections.Misuse.content, /sharp edge/);
  assert.match(byId.get('06.01').sections.Misuse.content, /key cut/);
  assert.equal(spec.sourceRegistry.find(({ sourceId }) => sourceId === 'fusionUpdate').classification, 'noncanonical-evidence');
  assert.ok(!byId.get('00.02').visualRecipe.sourceMappings.some(({ sourceId }) => sourceId === 'fusionUpdate'));

  assert.deepEqual(byId.get('07.05').visualRecipe.allowedConceptReferenceIds, ['concept.atlas-shaded-contour.v2']);
  assert.deepEqual(byId.get('07.08').visualRecipe.allowedConceptReferenceIds, ['concept.atlas-field-grain.v2']);
  assert.deepEqual(byId.get('07.09').visualRecipe.allowedConceptReferenceIds, ['concept.atlas-material-response.v2']);
  assert.deepEqual(byId.get('07.10').visualRecipe.allowedConceptReferenceIds, ['concept.atlas-one-color.v2']);

  for (const overview of spec.subjects.filter((subject) => subject.anatomyType === 'overview' && subject.subjectId !== '99.00')) {
    assert.ok(overview.childMatrix.length > 0, `${overview.subjectId} must enumerate its children`);
  }
  assert.equal(byId.get('99.00').noncanonicalReferenceMatrix.legacyPages.length, 13);
});
