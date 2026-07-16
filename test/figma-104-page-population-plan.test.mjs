import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const planPath = 'governance/design-ledgers/figma/bizarre-104-page-population-plan-v1.json';
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

test('archived v1 population plan is internally canonical and records its original read-only scope', async () => {
  const plan = await readJson(planPath);
  const hashable = structuredClone(plan);
  delete hashable.canonicalSha256;
  assert.equal(sha256(canonicalJson(hashable)), plan.canonicalSha256);

  assert.equal(plan.planId, 'bizarre-104-page-population-plan-v1');
  assert.equal(plan.scope.figmaFileKey, 'hGgrP9G0tEam8mpk5u3rHg');
  assert.equal(plan.scope.mutationStatus, 'READ_ONLY PLAN / FIGMA UNCHANGED');
  assert.equal(plan.scope.executionSurface, 'official Figma MCP only');
  assert.match(plan.scope.computerUse, /forbidden/i);
  assert.equal(plan.scope.graphicsGeneration, 'none');

  assert.equal(plan.sources.every((source) => /^[a-f0-9]{64}$/.test(source.fileSha256)), true);
});

test('archived v1 subjects preserve their original 104-page and manifest mapping', async () => {
  const [plan, manifest, pageMap] = await Promise.all([
    readJson(planPath),
    readJson('production/affinity/bizarre-masterbrand-subjects-v1.json'),
    readJson('governance/design-ledgers/figma/bizarre-page-map-v1.json'),
  ]);
  const pageById = new Map(pageMap.pages.map((page) => [page.subjectId, page]));

  assert.equal(plan.subjects.length, 104);
  assert.equal(new Set(plan.subjects.map((subject) => subject.subjectId)).size, 104);
  assert.deepEqual(plan.subjects.map((subject) => subject.subjectId), manifest.subjects.map((subject) => subject.id));

  for (const [index, subject] of plan.subjects.entries()) {
    const sourceSubject = manifest.subjects[index];
    const mappedPage = pageById.get(subject.subjectId);
    assert.equal(subject.subjectName, sourceSubject.name);
    assert.equal(subject.exactPageName, sourceSubject.exactLabel);
    assert.equal(subject.exactPageName, mappedPage.name);
    assert.equal(subject.liveFigmaPage.pageNodeId, mappedPage.pageId);
    assert.equal(subject.liveFigmaPage.name, mappedPage.name);
    assert.equal(subject.dimensions.widthPx, sourceSubject.artboard.widthPx);
    assert.equal(subject.dimensions.minimumHeightPx, sourceSubject.artboard.minimumHeightPx);
    assert.equal(subject.dimensions.heightStrategy, sourceSubject.artboard.heightStrategy);
    assert.equal(subject.dimensions.dpi, sourceSubject.artboard.dpi);
    assert.equal(subject.affinityDependency.artboardExactLabel, sourceSubject.exactLabel);
  }
});

test('archived v1 capture records its historical 102-empty and two-exemplar state', async () => {
  const plan = await readJson(planPath);
  const empty = plan.subjects.filter((subject) => subject.liveFigmaPage.populationStatus === 'empty-live-page');
  const populated = plan.subjects.filter((subject) => subject.liveFigmaPage.populationStatus === 'existing-native-exemplar');

  assert.equal(plan.scope.emptyPermanentPageCount, 102);
  assert.equal(plan.scope.populatedPermanentPageCount, 2);
  assert.equal(empty.length, 102);
  assert.equal(populated.length, 2);
  assert.deepEqual(populated.map((subject) => subject.subjectId), ['04.01', '06.01']);
  assert.equal(empty.every((subject) => subject.liveFigmaPage.observedChildCount === 0), true);
  assert.equal(empty.every((subject) => subject.liveFigmaPage.targetFrame.nodeId === null), true);
  assert.equal(empty.every((subject) => subject.liveFigmaPage.targetFrame.plannedName === '01 / FIGMA NATIVE — EDITABLE MASTER'), true);

  assert.deepEqual(populated.map((subject) => ({
    subjectId: subject.subjectId,
    pageId: subject.liveFigmaPage.pageNodeId,
    targetId: subject.liveFigmaPage.targetFrame.nodeId,
    mode: subject.mode.name,
  })), [
    { subjectId: '04.01', pageId: '47:23', targetId: '60:3', mode: 'void' },
    { subjectId: '06.01', pageId: '47:38', targetId: '60:5', mode: 'paper' },
  ]);

  assert.equal(plan.liveFigmaEvidence.pageInventory.topLevelPageCount, 117);
  assert.equal(plan.liveFigmaEvidence.pageInventory.legacyPageCount, 13);
  assert.equal(plan.liveFigmaEvidence.pageInventory.permanentPageCount, 104);
  assert.equal(plan.liveFigmaEvidence.pageInventory.emptyPermanentPageCount, 102);
});

test('overview/detail anatomy is exactly 13/91 with the approved layouts and 11-layer contract', async () => {
  const [plan, manifest, exemplarPlan] = await Promise.all([
    readJson(planPath),
    readJson('production/affinity/bizarre-masterbrand-subjects-v1.json'),
    readJson('governance/design-ledgers/figma/bizarre-native-exemplar-build-plan-v1.json'),
  ]);
  const overview = plan.subjects.filter((subject) => subject.anatomyType === 'overview');
  const detail = plan.subjects.filter((subject) => subject.anatomyType === 'detail');

  assert.equal(plan.scope.overviewCount, 13);
  assert.equal(plan.scope.detailCount, 91);
  assert.equal(overview.length, 13);
  assert.equal(detail.length, 91);
  assert.equal(overview.every((subject) => subject.layout.templateId === 'overview-v1'), true);
  assert.equal(overview.every((subject) => subject.layout.sectionCount === 8 && subject.layout.panelGrid.rows === 4), true);
  assert.equal(detail.every((subject) => subject.layout.templateId === 'detail-v1'), true);
  assert.equal(detail.every((subject) => subject.layout.sectionCount === 12 && subject.layout.panelGrid.rows === 6), true);

  assert.equal(plan.contracts.layers.count, 11);
  assert.deepEqual(plan.contracts.layers.backToFront, exemplarPlan.sharedFrameContract.layerOrderBackToFront);
  assert.equal(new Set(plan.contracts.layers.backToFront).size, 11);
  for (const subject of manifest.subjects) {
    assert.deepEqual(new Set(plan.contracts.layers.backToFront), new Set(subject.layerStack));
  }
  assert.equal(plan.subjects.every((subject) => subject.layout.layerContractRef === 'contracts/layers/backToFront'), true);
});

test('mode assignments follow the Affinity renderer rule and preserve the exemplar modes', async () => {
  const plan = await readJson(planPath);
  const byMode = Map.groupBy(plan.subjects, (subject) => subject.mode.name);
  assert.equal(byMode.get('void').length, 42);
  assert.equal(byMode.get('paper').length, 62);
  assert.deepEqual(new Set(plan.subjects.map((subject) => subject.mode.name)), new Set(['void', 'paper']));
  assert.equal(plan.subjects.every((subject) => subject.mode.collectionId === 'VariableCollectionId:52:10'), true);

  for (const subject of plan.subjects) {
    const shouldUseVoid = subject.subjectId === '00.00' || ['04', '07', '10', '11'].includes(subject.categoryId);
    assert.equal(subject.mode.name, shouldUseVoid ? 'void' : 'paper', subject.subjectId);
    assert.equal(subject.mode.modeId, shouldUseVoid ? '52:8' : '52:9', subject.subjectId);
  }
});

test('archived v1 variable references resolve to its 173 captured canonical variables', async () => {
  const [plan, variableImport, variableApply] = await Promise.all([
    readJson(planPath),
    readJson('governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-import.json'),
    readJson('governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-apply.json'),
  ]);
  assert.equal(Object.keys(plan.variableRegistry).length, 173);
  assert.equal(plan.liveFigmaEvidence.canonicalVariables.variableCount, 173);
  assert.equal(plan.liveFigmaEvidence.canonicalVariables.collectionCount, 9);
  assert.deepEqual(
    new Set(Object.values(plan.liveFigmaEvidence.canonicalVariables.collectionIds)),
    new Set(variableApply.canonicalCollections.map((collection) => collection.id)),
  );

  const expectedRefs = new Set(variableImport.collections.flatMap((collection) => collection.variables.map((variable) => `${collection.name}/${variable.name}`)));
  assert.deepEqual(new Set(Object.keys(plan.variableRegistry)), expectedRefs);
  for (const subject of plan.subjects) {
    for (const ref of [...subject.exactVariables.shellRefs, ...subject.exactVariables.specimenRefs]) {
      assert.ok(plan.variableRegistry[ref], `${subject.subjectId} references unknown variable ${ref}`);
    }
    assert.equal(new Set(subject.exactVariables.specimenRefs).size, subject.exactVariables.specimenRefs.length);
  }
});

test('reuse matrix preserves legacy/local/SDS IDs and creates no unverified replacement component', async () => {
  const plan = await readJson(planPath);
  assert.equal(plan.preservation.legacyPages.length, 13);
  assert.equal(new Set(plan.preservation.legacyPages.map((page) => page.pageId)).size, 13);
  assert.deepEqual(plan.preservation.existingNativeExemplarSubjectIds, ['04.01', '06.01']);
  assert.deepEqual(plan.preservation.existingLocalComponentRefs, ['local/signal-action', 'local/status-indicator']);
  assert.deepEqual(plan.preservation.existingNestedSdsRefs, ['sds/button', 'sds/tag']);

  assert.equal(plan.componentRegistry['local/signal-action'].nodeId, '30:281');
  assert.equal(plan.componentRegistry['local/signal-action'].nestedFoundationRef, 'sds/button');
  assert.equal(plan.componentRegistry['sds/button'].liveImportedNodeId, '30:82');
  assert.equal(plan.componentRegistry['local/status-indicator'].nodeId, '34:185');
  assert.equal(plan.componentRegistry['local/status-indicator'].nestedFoundationRef, 'sds/tag');
  assert.equal(plan.componentRegistry['sds/tag'].liveImportedNodeId, '34:86');

  for (const subject of plan.subjects) {
    for (const ref of subject.reuse.componentRefs) assert.ok(plan.componentRegistry[ref], `${subject.subjectId} has unknown component ${ref}`);
    if (!['09.05', '09.06', '09.07', '09.08', '09.09'].includes(subject.subjectId)) {
      assert.match(subject.reuse.newComponentPolicy, /no new component|existing|listed|wrapper only|composition wrapper/i);
    }
  }
});

test('every subject is assigned to one deterministic batch and overviews precede category details', async () => {
  const plan = await readJson(planPath);
  const batched = plan.batches.flatMap((batch) => batch.subjectIds);
  assert.equal(plan.batches.length, 15);
  assert.equal(batched.length, 104);
  assert.equal(new Set(batched).size, 104);
  assert.deepEqual(new Set(batched), new Set(plan.subjects.map((subject) => subject.subjectId)));
  assert.deepEqual(plan.batches[0].subjectIds, ['04.01', '06.01']);
  assert.equal(plan.batches.slice(1).reduce((sum, batch) => sum + batch.subjectIds.length, 0), 102);

  for (const batch of plan.batches.slice(1)) {
    const batchSubjects = batch.subjectIds.map((id) => plan.subjects.find((subject) => subject.subjectId === id));
    const overviewIndex = batchSubjects.findIndex((subject) => subject.anatomyType === 'overview');
    if (overviewIndex >= 0) assert.equal(overviewIndex, 0, batch.batchId);
    batchSubjects.forEach((subject, index) => {
      assert.equal(subject.buildBatch.batchId, batch.batchId);
      assert.equal(subject.buildBatch.orderInBatch, index + 1);
    });
  }
});

test('native specimen geometry uses only the approved smooth continuous semantics', async () => {
  const plan = await readJson(planPath);
  const geometryText = JSON.stringify({
    smoothGeometry: plan.contracts.smoothGeometry,
    nativeSpecimens: plan.subjects.map((subject) => subject.nativeSpecimen),
  });
  assert.doesNotMatch(geometryText, /notch|chamfer/i);
  assert.equal(plan.contracts.smoothGeometry.semanticId, 'smooth-tangent-continuous-asymmetric-oval');
  assert.equal(plan.contracts.smoothGeometry.figmaPrimitive, 'ELLIPSE');
  assert.equal(plan.contracts.smoothGeometry.required.includes('tangent continuity at every point'), true);
  assert.equal(plan.contracts.smoothGeometry.required.includes('round joins'), true);
  assert.equal(plan.contracts.smoothGeometry.forbiddenOutlineEvents.includes('straight segment'), true);
});

test('archived v1 Affinity dependencies remain complete and hash-addressed', async () => {
  const plan = await readJson(planPath);
  for (const subject of plan.subjects) {
    const dependencies = subject.affinityDependency.sourceDependencies;
    assert.equal(new Set(dependencies.map((dependency) => dependency.sourceId)).size, dependencies.length);
    assert.equal(dependencies.every((dependency) => dependency.path && /^[a-f0-9]{64}$/.test(dependency.sha256)), true);
    assert.equal(subject.affinityDependency.recipeId, subject.nativeSpecimen.recipeId);
    assert.equal(subject.affinityDependency.exportDependency.verificationStatus, subject.provenanceAndStatus.verificationStatus);
  }
});
