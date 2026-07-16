import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specPath = resolve(root, 'production/affinity/bizarre-masterbrand-content-spec-v2.json');
const manifestPath = resolve(root, 'production/affinity/bizarre-masterbrand-subjects-v2.json');
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const overviewSections = [
  'Purpose and recognition role',
  'Subject navigation with every page ID and exact name',
  'When-to-use matrix',
  'Status matrix',
  'Dependencies',
  'Rules and anti-patterns',
  'Far, normal, and close examples',
  'Change log and source references',
];

const detailSections = [
  'Definition',
  'Construction and source',
  'Exact tokens, assets, styles, or material recipe',
  'Variants, modes, states, and optical sizes',
  'Usage',
  'Accessibility, bilingual behavior, and RTL',
  'Motion and interaction',
  'Production and export',
  'Correct examples',
  'Misuse',
  'Provenance, hashes, status, and evidence',
  'Category and related-page links plus canonical source paths',
];

const provisionalIds = new Set(['06.01', '07.05', '07.08', '07.09', '07.10']);
const allowedSourceClassifications = new Set(['canonical', 'owner-supplied-override', 'owner-reference', 'licensed-observed-base', 'governed-provisional', 'rejected-noncanonical', 'noncanonical-evidence', 'primary-source-research']);
const placeholderPattern = /\b(?:TBD|TODO|FIXME|LOREM(?:\s+IPSUM)?|COMING\s+SOON|INSERT\s+(?:COPY|TEXT)|FILL\s+(?:THIS|ME)\s+IN|DUMMY\s+(?:COPY|TEXT)|SAME\s+AS\s+ABOVE)\b/i;
const gravityRule = 'The Gravity Well is monochrome: every internal element is either fully Signal Lime or fully black. Mixed green/black construction, spectrum, gradient, foil, glow, bevel, and material effects on the mark are forbidden.';
const markContexts = 'Approved Gravity Well contexts are: fully Signal Lime figure on Void; fully black figure on Signal; fully black figure on Paper.';
const apertureRule = 'The owner-selected Continuous Lens Aperture v2 direction is a smooth tangent-continuous asymmetric oval with broad orbital compression. The silhouette has no chamfer, sharp edge, corner, polygonal join, clipped wedge, notch, straight segment, or key cut. Any machined cue is an external physical bevel or material-depth treatment around the opening, never part of the outline. Numerical construction and production evidence remain provisional; the superseded sharp-edged proposal is rejected and noncanonical.';

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function resolvedPath(path) {
  return path.startsWith('/') ? path : resolve(root, path);
}

async function actualFileHash(path) {
  const filePath = resolvedPath(path);
  await access(filePath);
  return sha256(await readFile(filePath));
}

function expectedGovernance(manifestSubject) {
  if (manifestSubject.governance.status === 'OWNER-APPROVED DIRECTION / PROVISIONAL GEOMETRY') {
    return {
      inheritedManifestStatus: 'OWNER-APPROVED DIRECTION / PROVISIONAL GEOMETRY',
      authorityStatus: 'governed-provisional',
      verificationStatus: 'NOT VERIFIED',
      publicationStatus: 'nonpublishable',
      publishable: false,
    };
  }
  if (manifestSubject.governance.status === 'PROVISIONAL v1') {
    return {
      inheritedManifestStatus: 'PROVISIONAL v1',
      authorityStatus: 'governed-provisional',
      verificationStatus: 'NOT VERIFIED',
      publicationStatus: 'nonpublishable',
      publishable: false,
    };
  }
  if (manifestSubject.governance.status === 'NONCANONICAL INDEX') {
    return {
      inheritedManifestStatus: 'NONCANONICAL INDEX',
      authorityStatus: 'noncanonical-reference',
      verificationStatus: 'NOT VERIFIED',
      publicationStatus: 'nonpublishable',
      publishable: false,
    };
  }
  return {
    inheritedManifestStatus: 'GOVERNED',
    authorityStatus: 'canonical',
    verificationStatus: 'NOT VERIFIED',
    publicationStatus: 'publishable',
    publishable: true,
  };
}

assert.equal(spec.schemaVersion, 1);
assert.equal(spec.specVersion, '2.0.0');
assert.equal(spec.manifest.path, 'production/affinity/bizarre-masterbrand-subjects-v2.json');
assert.equal(spec.manifest.canonicalSha256, manifest.canonicalSha256, 'content spec points to the wrong manifest snapshot');
assert.equal(spec.manifest.subjectCount, 104);
assert.deepEqual(spec.anatomy.overviewSections, overviewSections);
assert.deepEqual(spec.anatomy.detailSections, detailSections);
assert.equal(spec.globalRules.gravityWellColorRule, gravityRule);
assert.equal(spec.globalRules.apertureDirectionRule, apertureRule);

const expectedCanonicalHash = spec.canonicalSha256;
const hashableSpec = structuredClone(spec);
delete hashableSpec.canonicalSha256;
assert.equal(sha256(canonicalJson(hashableSpec)), expectedCanonicalHash, 'content spec canonical hash drift');

assert.ok(Array.isArray(spec.sourceRegistry) && spec.sourceRegistry.length >= 40, 'source registry is incomplete');
const sourceRegistryById = new Map();
for (const source of spec.sourceRegistry) {
  assert.match(source.sourceId, /^[A-Za-z][A-Za-z0-9]*$/);
  assert.ok(!sourceRegistryById.has(source.sourceId), `duplicate source ${source.sourceId}`);
  assert.ok(allowedSourceClassifications.has(source.classification), `invalid source classification on ${source.sourceId}`);
  assert.ok(source.path.length > 3 && source.role.length >= 24, `incomplete source mapping ${source.sourceId}`);
  assert.match(source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(await actualFileHash(source.path), source.sha256, `source hash drift for ${source.sourceId}`);
  sourceRegistryById.set(source.sourceId, source);
}
assert.equal(sourceRegistryById.get('aperture').classification, 'governed-provisional');
assert.equal(sourceRegistryById.get('fusionUpdate').classification, 'noncanonical-evidence');
assert.equal(sourceRegistryById.get('hardwarePhotoPexels13401910').classification, 'licensed-observed-base');
assert.match(sourceRegistryById.get('aperture').role, /Owner-selected left Continuous Lens direction/);

assert.ok(Array.isArray(spec.conceptReferenceRegistry) && spec.conceptReferenceRegistry.length === 8, 'exactly eight allowed ImageGen concept references are expected');
const conceptById = new Map();
for (const reference of spec.conceptReferenceRegistry) {
  assert.ok(!conceptById.has(reference.conceptReferenceId), `duplicate concept reference ${reference.conceptReferenceId}`);
  assert.equal(reference.classification, 'concept-reference');
  assert.equal(reference.verificationStatus, 'NOT VERIFIED');
  assert.equal(reference.publicationStatus, 'nonpublishable');
  assert.equal(reference.publishable, false);
  assert.equal(reference.requiredLayer, '00 / Reference');
  assert.equal(reference.requiredVisibleLabel, 'CONCEPT REFERENCE — NONPUBLISHABLE');
  assert.ok(reference.allowedUse.length >= 28 && reference.forbiddenUse.length >= 60);
  assert.match(reference.sha256, /^[a-f0-9]{64}$/);
  assert.equal(await actualFileHash(reference.path), reference.sha256, `concept hash drift for ${reference.conceptReferenceId}`);
  assert.ok(Array.isArray(reference.allowedSubjects) && reference.allowedSubjects.length >= 1);
  conceptById.set(reference.conceptReferenceId, reference);
}

assert.equal(spec.subjects.length, 104, 'content spec must contain exactly 104 subjects');
assert.equal(new Set(spec.subjects.map(({ subjectId }) => subjectId)).size, 104, 'content subject IDs must be unique');
assert.deepEqual(spec.subjects.map(({ subjectId }) => subjectId), manifest.subjects.map(({ id }) => id), 'content subject order/IDs must exactly match the permanent manifest');

const manifestById = new Map(manifest.subjects.map((subject) => [subject.id, subject]));
const specById = new Map(spec.subjects.map((subject) => [subject.subjectId, subject]));
const allSectionCopy = new Set();
const focalSpecimens = new Set();
const compositions = new Set();
const contentFingerprints = new Set();

for (const subject of spec.subjects) {
  const manifestSubject = manifestById.get(subject.subjectId);
  assert.ok(manifestSubject, `unknown subject ${subject.subjectId}`);
  assert.equal(subject.subjectName, manifestSubject.name);
  assert.equal(subject.exactLabel, manifestSubject.exactLabel);
  assert.equal(subject.kind, manifestSubject.kind);
  assert.equal(subject.categoryId, manifestSubject.categoryId);
  assert.equal(subject.categoryName, manifestSubject.categoryName);
  assert.equal(subject.anatomyType, manifestSubject.anatomyType);

  const expectedSections = subject.anatomyType === 'overview' ? overviewSections : detailSections;
  assert.deepEqual(subject.requiredSectionOrder, expectedSections, `${subject.subjectId} required section order drift`);
  assert.deepEqual(Object.keys(subject.sections), expectedSections, `${subject.subjectId} must explicitly define every anatomy section in exact order`);

  for (const sectionName of expectedSections) {
    const section = subject.sections[sectionName];
    assert.ok(section && ['APPLICABLE', 'N/A'].includes(section.status), `${subject.subjectId}/${sectionName} missing applicability`);
    assert.deepEqual(Object.keys(section), section.status === 'APPLICABLE' ? ['status', 'content'] : ['status', 'reason'], `${subject.subjectId}/${sectionName} has ambiguous section fields`);
    const copy = section.status === 'APPLICABLE' ? section.content : section.reason;
    assert.ok(copy.length >= 72, `${subject.subjectId}/${sectionName} is not a usable explicit specification`);
    assert.ok(copy.includes(subject.exactLabel), `${subject.subjectId}/${sectionName} is not explicitly scoped to its subject`);
    assert.ok(!placeholderPattern.test(copy), `${subject.subjectId}/${sectionName} contains placeholder copy`);
    if (section.status === 'N/A') {
      assert.ok(section.reason.startsWith(`N/A — ${subject.exactLabel}:`), `${subject.subjectId}/${sectionName} must state N/A with a subject-specific reason`);
    }
    assert.ok(!allSectionCopy.has(copy), `${subject.subjectId}/${sectionName} duplicates another subject section`);
    allSectionCopy.add(copy);
  }

  if (subject.anatomyType === 'overview') {
    assert.ok(Array.isArray(subject.childMatrix), `${subject.subjectId} overview must store a child matrix`);
    const expectedChildren = manifest.subjects.filter((candidate) => candidate.categoryId === subject.categoryId && candidate.id !== subject.subjectId);
    assert.deepEqual(subject.childMatrix.map(({ id }) => id), expectedChildren.map(({ id }) => id), `${subject.subjectId} child matrix IDs are not exact`);
    for (const [index, row] of subject.childMatrix.entries()) {
      const child = expectedChildren[index];
      const governance = expectedGovernance(child);
      assert.equal(row.exactName, child.name);
      assert.equal(row.exactLabel, child.exactLabel);
      assert.ok(row.whenToUse.length >= 40 && !placeholderPattern.test(row.whenToUse));
      assert.equal(row.authorityStatus, governance.authorityStatus);
      assert.equal(row.verificationStatus, governance.verificationStatus);
      assert.equal(row.publicationStatus, governance.publicationStatus);
      assert.equal(row.publishable, governance.publishable);
    }
  } else {
    assert.equal(subject.childMatrix, null, `${subject.subjectId} detail must not invent a child matrix`);
  }

  const recipe = subject.visualRecipe;
  assert.equal(recipe.recipeId, `${subject.subjectId}/visual/v2`);
  assert.equal(subject.governance.lastChanged, '2026-07-16');
  assert.ok(subject.governance.changeLog.every((entry) => /^v2 - /.test(entry)), `${subject.subjectId} change log does not match the v2 recipe contract`);
  assert.ok(recipe.focalSpecimen.length >= 72 && recipe.composition.length >= 72, `${subject.subjectId} visual recipe lacks subject-specific direction`);
  assert.ok(!focalSpecimens.has(recipe.focalSpecimen), `${subject.subjectId} reuses a generic focal specimen`);
  assert.ok(!compositions.has(recipe.composition), `${subject.subjectId} reuses a generic composition`);
  focalSpecimens.add(recipe.focalSpecimen);
  compositions.add(recipe.composition);
  assert.ok(Array.isArray(recipe.constructionSteps) && recipe.constructionSteps.length >= 3);
  assert.ok(recipe.constructionSteps.every((step) => step.length >= 20 && !placeholderPattern.test(step)), `${subject.subjectId} has an incomplete construction step`);
  assert.ok(Array.isArray(recipe.nativeAffinityFeatures) && recipe.nativeAffinityFeatures.length >= 3, `${subject.subjectId} must name native Affinity features`);
  assert.ok(Array.isArray(recipe.requiredVisualFacts) && recipe.requiredVisualFacts.length >= 2);
  assert.ok(Array.isArray(recipe.prohibitedShortcuts) && recipe.prohibitedShortcuts.length >= 6);
  assert.ok(recipe.prohibitedShortcuts.includes('Python-generated graphics'));
  assert.ok(recipe.prohibitedShortcuts.includes('hand-redrawn or simplified Gravity Well geometry'));
  assert.deepEqual(Object.keys(recipe.distanceChecks), ['far', 'normal', 'close']);
  for (const [distance, text] of Object.entries(recipe.distanceChecks)) {
    assert.ok(text.includes(subject.exactLabel) && text.includes(`/${distance.toUpperCase()} —`.replace('/', ' / ')), `${subject.subjectId} ${distance} distance check is not explicit`);
  }
  assert.ok(recipe.invariantRules.includes(gravityRule), `${subject.subjectId} omits the monochrome mark invariant`);
  assert.ok(recipe.invariantRules.includes(markContexts), `${subject.subjectId} omits approved mark contexts`);
  assert.ok(recipe.invariantRules.includes(apertureRule), `${subject.subjectId} omits the corrected aperture direction`);

  assert.ok(Array.isArray(recipe.sourceMappings) && recipe.sourceMappings.length >= 3, `${subject.subjectId} has no usable source mapping`);
  assert.equal(new Set(recipe.sourceMappings.map(({ sourceId }) => sourceId)).size, recipe.sourceMappings.length, `${subject.subjectId} repeats a source mapping`);
  assert.deepEqual(subject.governance.derivesFrom, recipe.sourceMappings.map(({ sourceId }) => sourceId), `${subject.subjectId} derivesFrom/source mapping drift`);
  for (const mapping of recipe.sourceMappings) {
    const registered = sourceRegistryById.get(mapping.sourceId);
    assert.ok(registered, `${subject.subjectId} maps unknown source ${mapping.sourceId}`);
    assert.equal(mapping.path, registered.path);
    assert.equal(mapping.sha256, registered.sha256);
    assert.equal(mapping.classification, registered.classification);
    assert.equal(mapping.role, registered.role);
    assert.ok(mapping.subjectUse.includes(subject.exactLabel));
  }

  assert.ok(Array.isArray(recipe.allowedConceptReferenceIds));
  for (const referenceId of recipe.allowedConceptReferenceIds) {
    const reference = conceptById.get(referenceId);
    assert.ok(reference, `${subject.subjectId} names unknown concept ${referenceId}`);
    assert.ok(reference.allowedSubjects.includes(subject.subjectId), `${referenceId} is not allowed on ${subject.subjectId}`);
  }
  if (recipe.allowedConceptReferenceIds.length) {
    assert.match(recipe.conceptReferencePolicy, /00 \/ Reference/);
    assert.match(recipe.conceptReferencePolicy, /NONPUBLISHABLE/);
  } else {
    assert.match(recipe.conceptReferencePolicy, /^No ImageGen concept reference is allowed/);
  }

  const governance = subject.governance;
  const expected = expectedGovernance(manifestSubject);
  for (const [key, value] of Object.entries(expected)) assert.equal(governance[key], value, `${subject.subjectId} governance inheritance drift: ${key}`);
  const usesProvisionalInputs = recipe.sourceMappings.some(({ classification }) => classification === 'governed-provisional');
  const usesRejectedInputs = recipe.sourceMappings.some(({ classification }) => classification === 'rejected-noncanonical');
  assert.equal(governance.usesProvisionalInputs, usesProvisionalInputs);
  assert.equal(governance.usesRejectedInputs, usesRejectedInputs);
  const expectedExportPolicy = governance.publishable === false
    ? 'all-subject-exports-nonpublishable'
    : usesRejectedInputs
      ? 'documentation-may-be-publishable; any export containing or reproducing a rejected noncanonical input is nonpublishable'
      : usesProvisionalInputs
        ? 'documentation-may-be-publishable; any export embedding a governed-provisional input is nonpublishable'
        : 'subject-publication-status-applies after verification';
  assert.equal(governance.embeddedExportPolicy, expectedExportPolicy);
  assert.deepEqual(governance.evidenceRefs, []);
  assert.equal(governance.toolIds.figmaPageNodeId, null);
  assert.equal(governance.toolIds.affinityArtboardId, null);
  assert.ok(governance.evidenceAbsenceReason.length >= 80 && governance.toolIds.nullReason.length >= 80);

  const expectedFingerprint = sha256(canonicalJson({ sections: subject.sections, visual: recipe, governance, childMatrix: subject.childMatrix }));
  assert.equal(subject.contentFingerprint, expectedFingerprint, `${subject.subjectId} content fingerprint drift`);
  assert.ok(!contentFingerprints.has(subject.contentFingerprint), `${subject.subjectId} repeats another subject fingerprint`);
  contentFingerprints.add(subject.contentFingerprint);
}

const overviews = spec.subjects.filter(({ anatomyType }) => anatomyType === 'overview');
assert.equal(overviews.length, 13, '13 overview content contracts are required');
assert.equal(spec.subjects.filter(({ governance }) => governance.authorityStatus === 'governed-provisional').length, 5, 'exactly five permanent subjects inherit governed-provisional status');
assert.deepEqual(spec.subjects.filter(({ governance }) => governance.authorityStatus === 'governed-provisional').map(({ subjectId }) => subjectId), [...provisionalIds]);
assert.equal(spec.subjects.filter(({ governance }) => governance.publicationStatus === 'publishable').length, 98);
assert.equal(specById.get('99.00').governance.authorityStatus, 'noncanonical-reference');
assert.equal(specById.get('99.00').governance.publicationStatus, 'nonpublishable');

for (const [referenceId, reference] of conceptById) {
  const actualSubjects = spec.subjects.filter(({ visualRecipe }) => visualRecipe.allowedConceptReferenceIds.includes(referenceId)).map(({ subjectId }) => subjectId);
  assert.deepEqual(actualSubjects, reference.allowedSubjects, `${referenceId} allowed-subject mapping drift`);
}

const noncanonicalMatrix = specById.get('99.00').noncanonicalReferenceMatrix;
assert.ok(noncanonicalMatrix);
assert.deepEqual(noncanonicalMatrix.legacyPages.map(({ id }) => id), ['99.10', '99.11', '99.12', '99.13', '99.14', '99.15', '99.16', '99.17', '99.18', '99.19', '99.20', '99.21', '99.22']);
assert.deepEqual(noncanonicalMatrix.conceptReferences.map(({ conceptReferenceId }) => conceptReferenceId), spec.conceptReferenceRegistry.map(({ conceptReferenceId }) => conceptReferenceId));
for (const subject of spec.subjects.filter(({ subjectId }) => subjectId !== '99.00')) assert.equal(subject.noncanonicalReferenceMatrix, null);

const identity = specById.get('02.01');
assert.match(identity.sections.Usage.content, /complete Signal Lime mark on Void/);
assert.match(identity.sections.Usage.content, /complete black mark on Signal or Paper/);
assert.match(identity.sections.Misuse.content, /mixed green\/black/);
assert.match(identity.sections.Misuse.content, /spectrum or gradient/);

const aperture = specById.get('06.01');
assert.equal(aperture.governance.authorityStatus, 'governed-provisional');
assert.equal(aperture.governance.publicationStatus, 'nonpublishable');
assert.equal(aperture.governance.usesRejectedInputs, false);
assert.equal(aperture.governance.usesProvisionalInputs, true);
assert.match(aperture.sections.Definition.content, /smooth tangent-continuous asymmetric oval/);
assert.match(aperture.sections.Misuse.content, /sharp edge/);
assert.match(aperture.sections.Misuse.content, /outline chamfer/);
assert.match(aperture.sections.Misuse.content, /key cut/);
assert.match(aperture.sections['Construction and source'].content, /PROVISIONAL \/ NONPUBLISHABLE/);
assert.match(aperture.sections['Construction and source'].content, /noncanonical lineage index/);

console.log(`Validated explicit Affinity content/visual specifications for ${spec.subjects.length} subjects (${overviews.length} overview matrices, ${spec.subjects.length - overviews.length} detail contracts)`);
