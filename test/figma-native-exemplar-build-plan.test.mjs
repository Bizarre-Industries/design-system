import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const planPath = 'governance/design-ledgers/figma/bizarre-native-exemplar-build-plan-v1.json';
const sourceDriftPath = 'governance/design-ledgers/figma/bizarre-v1-source-drift-observation-v2-2026-07-16.json';
const portabilityPath = 'governance/design-ledgers/figma/bizarre-v1-portability-normalization-v1-2026-07-17.json';

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function readReferencedFile(path) {
  if (path.startsWith('/')) return readFile(path);
  return readFile(new URL(path, root));
}

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG', 'expected PNG signature');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', 'expected PNG IHDR chunk');
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function collectBindingRefs(value, refs = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectBindingRefs(item, refs);
    return refs;
  }
  if (!value || typeof value !== 'object') return refs;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith('Binding') && typeof item === 'string') refs.push(item);
    if (key === 'bindings' && Array.isArray(item)) refs.push(...item);
    collectBindingRefs(item, refs);
  }
  return refs;
}

test('native exemplar plan is canonical, source-hashed or explicitly frozen, and closed to the two approved pages', async () => {
  const [plan, sourceDrift, portability] = await Promise.all([
    readJson(planPath),
    readJson(sourceDriftPath),
    readJson(portabilityPath),
  ]);
  const hashable = structuredClone(plan);
  delete hashable.canonicalSha256;
  assert.equal(sha256(canonicalJson(hashable)), plan.canonicalSha256);
  const hashableDrift = structuredClone(sourceDrift);
  delete hashableDrift.canonicalSha256;
  assert.equal(sha256(canonicalJson(hashableDrift)), sourceDrift.canonicalSha256);
  assert.equal(sourceDrift.policy.historicalArtifactsImmutable, true);
  assert.equal(sourceDrift.policy.rewriteRecordedHashesForbidden, true);
  assert.equal(portability.policy.historicalExecutionClaimsImmutable, true);
  assert.equal(portability.policy.rewriteReceiptHashesForbidden, true);

  assert.equal(plan.planId, 'bizarre-native-figma-exemplars-04.01-06.01');
  assert.equal(plan.scope.mutationStatus, 'NOT_APPLIED_BY_THIS_ARTIFACT');
  assert.deepEqual(plan.scope.subjectIds, ['04.01', '06.01']);
  assert.deepEqual(plan.pages.map(({ subjectId }) => subjectId), ['04.01', '06.01']);
  assert.equal(plan.figma.fileKey, 'hGgrP9G0tEam8mpk5u3rHg');
  assert.equal(plan.figma.executionSurface, 'official Figma MCP only');
  assert.match(plan.figma.computerUse, /forbidden/);

  for (const source of plan.sources) {
    const currentSha256 = sha256(await readReferencedFile(source.path));
    if (currentSha256 === source.fileSha256) continue;
    const normalized = portability.artifacts.find((artifact) => (
      artifact.artifactPath === source.path
      && artifact.beforeRawSha256 === source.fileSha256
      && artifact.afterRawSha256 === currentSha256
    ));
    if (normalized) continue;
    const observed = sourceDrift.historicalArtifacts.find(({ artifactPath, sourcePath }) => (
      artifactPath === planPath && sourcePath === source.path
    ));
    assert.ok(observed, `${source.sourceId} source hash drift is not governed`);
    assert.equal(observed.recordedSha256, source.fileSha256);
    assert.equal(sourceDrift.currentSource.path, source.path);
    assert.equal(sourceDrift.currentSource.sha256, currentSha256);
    assert.equal(observed.disposition, 'HISTORICAL_SOURCE_DRIFT_CONFIRMED_DO_NOT_PROMOTE');
  }
});

test('locked reference and QA nodes retain exact IDs, dimensions, image hashes, and source hashes', async () => {
  const { lockedReferences } = await readJson(planPath);
  const expected = {
    '04.01': {
      pageId: '47:23', nodeId: '60:2', width: 1440, height: 4300,
      sha: 'a796d0362987e6070584d14ea83a272cb88597c3ea90d70d716e89e40aacef66',
      imageHash: 'abfd73029605bb51019ebeb2e7c93c14cb65d0a1',
    },
    '06.01': {
      pageId: '47:38', nodeId: '60:4', width: 1440, height: 4100,
      sha: 'a1f5a1e694c2c0c88c3fe1387adf6fd5352a70df6ef10120666c290b64e7e05b',
      imageHash: '771fa6059e4d7ca510930d4db347a853ab873571',
    },
    '06.01-same-input-qa': {
      pageId: '47:38', nodeId: '60:6', width: 1296, height: 254,
      sha: 'bf888e22fccf58cf8429739401475ef1dff676e7591a38ab7b04d5e814fe9dd0',
      imageHash: '42705e8749b1812ae1e73b241663449906b4bb18',
    },
  };

  for (const [key, contract] of Object.entries(expected)) {
    const reference = lockedReferences[key];
    const bytes = await readReferencedFile(reference.sourcePath);
    assert.equal(reference.pageId, contract.pageId);
    assert.equal(reference.nodeId, contract.nodeId);
    assert.equal(reference.locked, true);
    assert.equal(reference.figmaImageHash, contract.imageHash);
    assert.equal(reference.sourceSha256, contract.sha);
    assert.equal(sha256(bytes), contract.sha);
    assert.deepEqual(pngDimensions(bytes), { width: contract.width, height: contract.height });
    assert.deepEqual(
      { width: reference.rect.width, height: reference.rect.height },
      { width: contract.width, height: contract.height },
    );
  }

  const concept = lockedReferences['owner-continuous-lens-concept'];
  assert.equal(concept.pageId, '47:38');
  assert.equal(concept.layerNodeId, '67:12');
  assert.equal(concept.nodeId, '67:20');
  assert.equal(concept.name, 'CONCEPT REFERENCE — NONPUBLISHABLE / LEFT CONTINUOUS LENS / IMAGE TARGET');
  assert.equal(concept.figmaImageHash, '3740a582de2e6eca4b73b352d0c7cc58eca07dc1');
  assert.equal(sha256(await readReferencedFile(concept.sourcePath)), concept.sourceSha256);
  assert.equal(sha256(await readReferencedFile(concept.parentStudyPath)), concept.parentStudySha256);
  assert.equal(concept.classification, 'CONCEPT REFERENCE — NONPUBLISHABLE');
});

test('page dimensions, layer anatomy, compact copy, modes, and status match the governed Affinity sources', async () => {
  const [plan, subjects, contentSpec] = await Promise.all([
    readJson(planPath),
    readJson('production/affinity/bizarre-masterbrand-subjects-v1.json'),
    readJson('production/affinity/bizarre-masterbrand-content-spec-v1.json'),
  ]);
  const subjectById = new Map(subjects.subjects.map((subject) => [subject.id, subject]));
  const contentById = new Map(contentSpec.subjects.map((subject) => [subject.subjectId, subject]));
  const expectedTargets = {
    '04.01': { pageId: '47:23', frameId: '60:3', height: 4300, mode: 'void' },
    '06.01': { pageId: '47:38', frameId: '60:5', height: 4100, mode: 'paper' },
  };

  for (const page of plan.pages) {
    const sourceSubject = subjectById.get(page.subjectId);
    const contentSubject = contentById.get(page.subjectId);
    const expected = expectedTargets[page.subjectId];
    assert.equal(page.page.nodeId, expected.pageId);
    assert.equal(page.targetFrame.nodeId, expected.frameId);
    assert.deepEqual(page.targetFrame.rect, { x: 1600, y: 0, width: 1440, height: expected.height });
    assert.equal(page.targetFrame.explicitModesCollectionMode, expected.mode);
    assert.equal(page.targetFrame.rect.width, sourceSubject.artboard.widthPx);
    assert.equal(page.targetFrame.rect.height, sourceSubject.artboard.minimumHeightPx);
    assert.deepEqual(page.anatomy.sections.map(({ name }) => name), contentSubject.requiredSectionOrder);
    assert.deepEqual(page.anatomy.sections.map(({ index }) => index), Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')));
    assert.equal(page.nodeHierarchy.length, 11);
    assert.deepEqual(
      new Set(page.nodeHierarchy.map(({ name }) => name)),
      new Set(sourceSubject.layerStack),
    );
  }

  assert.equal(plan.pages[0].targetFrame.publicationStatus.includes('after verification'), true);
  assert.equal(plan.pages[1].targetFrame.publicationStatus, 'nonpublishable');
  assert.equal(plan.pages[1].targetFrame.authorityStatus, 'governed-provisional');
  assert.match(plan.pages[0].anatomy.sections[0].content, /data-shaped field treatment/);
  assert.match(plan.pages[1].anatomy.sections[0].content, /final numerical construction remains governed-provisional/);
});

test('live Figma structure, visual exceptions, receipts, and QA captures are reconciled without promoting either exemplar', async () => {
  const [plan, contentSpec, subjects] = await Promise.all([
    readJson(planPath),
    readJson('production/affinity/bizarre-masterbrand-content-spec-v1.json'),
    readJson('production/affinity/bizarre-masterbrand-subjects-v1.json'),
  ]);
  const [field, lens] = plan.pages;
  const manifestSha = '4c4500ea3c2f12cbfb100f129bd39e711ba1c6f5915242280808af42010448b1';

  assert.equal(contentSpec.manifest.canonicalSha256, manifestSha);
  assert.equal(subjects.canonicalSha256, manifestSha);
  assert.equal(plan.liveImplementationEvidence.manifestCanonicalSha256, manifestSha);
  assert.deepEqual(plan.liveImplementationEvidence.currentQaRevisionBySubject, { '04.01': 'r3', '06.01': 'r4' });
  assert.equal(plan.sharedFrameContract.footer.manifest.text, '1.0.0  /  4c4500ea3c2f');

  assert.equal(field.targetFrame.name, '01 / FIGMA NATIVE — EDITABLE MASTER');
  assert.equal(lens.targetFrame.name, '01 / FIGMA NATIVE — EDITABLE MASTER');
  assert.deepEqual(
    [field.headerContent.systemRail.y, field.headerContent.statusRail.y, field.headerContent.title.y, field.headerContent.categoryRail.y],
    [37, 37, 60, 316],
  );
  assert.deepEqual(
    [lens.headerContent.systemRail.y, lens.headerContent.statusRail.y, lens.headerContent.title.y, lens.headerContent.categoryRail.y],
    [37, 37, 66, 316],
  );
  assert.deepEqual(plan.sharedFrameContract.footer.tagline.resolvedYBySubject, { '04.01': 4236, '06.01': 4036 });
  assert.deepEqual(plan.sharedFrameContract.footer.manifest.resolvedYBySubject, { '04.01': 4236, '06.01': 4036 });
  assert.equal(field.anatomy.panelFill, '#181817');
  assert.equal(lens.anatomy.panelFill, '#EBE9E0');

  assert.deepEqual(field.nodeHierarchy.map(({ nodeId }) => nodeId), Array.from({ length: 11 }, (_, i) => `65:${i + 2}`));
  assert.deepEqual(lens.nodeHierarchy.map(({ nodeId }) => nodeId), Array.from({ length: 11 }, (_, i) => `67:${i + 2}`));
  assert.equal(lens.conceptReference.layerNodeId, '67:12');
  assert.equal(lens.conceptReference.nodeId, '67:20');
  assert.equal(lens.conceptReference.figmaImageHash, '3740a582de2e6eca4b73b352d0c7cc58eca07dc1');
  assert.equal(lens.conceptReference.frameName, 'CONCEPT REFERENCE — NONPUBLISHABLE / LEFT CONTINUOUS LENS / IMAGE TARGET');
  assert.equal(lens.conceptReference.classificationBand.nodeId, '67:21');
  assert.equal(lens.conceptReference.classificationBand.textNodeId, '67:22');

  assert.deepEqual(
    plan.liveImplementationEvidence.officialFigmaMcpReceipts.map(({ mcpRequestId }) => mcpRequestId),
    [
      'e1149e55-4c6c-4e9b-a16a-f72046a1e8f3',
      '9d5fbf4f-2c21-4370-8b61-138d25657578',
      '1f1dae15-3644-4832-8f2d-0347f06e3dae',
      '506fcf77-fe00-4950-9db9-dcbf9d6b9a7a',
      'da19ac0b-7ded-4b3e-b34b-84059325f0bd',
      '0feb1e06-e33d-4f67-8011-5c8b1a1f073a',
      '52f69891-f06c-45bc-b62e-708282598f93',
      '8bc293c4-8d4e-46fb-abb5-68cf55a54a0f',
      'f6635679-2eda-49d3-a0a8-0022cf55cb1b',
      '86b2dd3d-7c4c-4609-9ea3-4c6302e0998e',
      '30b4df60-5d35-450f-b1a0-28f9581c79c8',
      '134d0710-9fc8-48bc-bdce-3c86134f6cc5',
    ],
  );

  for (const [subjectId, expected] of Object.entries({
    '04.01': { revision: 'r3', sha: '53757273119bc3ee325667b7fe49d4718e547629de66960f9fc655fe5fc1ec86', width: 1440, height: 2150 },
    '06.01': { revision: 'r4', sha: '48a9eb3c3627257d4bdd1be7acbe1718d928f8395f71fb93273c5282b98b95ee', width: 2880, height: 4100 },
  })) {
    const evidence = plan.liveImplementationEvidence.qaComparisons[subjectId];
    const bytes = await readReferencedFile(evidence.path);
    assert.equal(evidence.revision, expected.revision);
    assert.equal(sha256(bytes), expected.sha);
    assert.equal(evidence.sha256, expected.sha);
    assert.deepEqual(pngDimensions(bytes), { width: expected.width, height: expected.height });
    assert.deepEqual(evidence.rect, { width: expected.width, height: expected.height });
  }

  for (const [subjectId, expected] of Object.entries({
    '04.01': { revision: 'r3', sha: '7f6f3076df588baf978fb18462762e81d6167dfa2449d7456fb9dfcae0d6c9c2', width: 1440, height: 4300, receipt: '8bc293c4-8d4e-46fb-abb5-68cf55a54a0f' },
    '06.01': { revision: 'r4', sha: '223cb5ffff25b8c5f68860ecc9b12ea034105b8c45703438967c4cafdd1fa531', width: 1440, height: 4100, receipt: '30b4df60-5d35-450f-b1a0-28f9581c79c8' },
  })) {
    const render = plan.liveImplementationEvidence.wholeTargetRenders[subjectId];
    const bytes = await readReferencedFile(render.path);
    assert.equal(render.revision, expected.revision);
    assert.equal(render.screenshotMcpRequestId, expected.receipt);
    assert.equal(render.sha256, expected.sha);
    assert.equal(sha256(bytes), expected.sha);
    assert.deepEqual(render.rect, { width: expected.width, height: expected.height });
    assert.deepEqual(pngDimensions(bytes), render.rect);
  }

  const isolated = plan.liveImplementationEvidence.isolatedNodeRenders['06.01-optical-ring'];
  const isolatedBytes = await readReferencedFile(isolated.path);
  assert.equal(isolated.revision, 'r3');
  assert.equal(isolated.nodeId, '67:115');
  assert.equal(isolated.screenshotMcpRequestId, '86b2dd3d-7c4c-4609-9ea3-4c6302e0998e');
  assert.equal(isolated.sha256, 'b94714cff6ea936ff346963069919f0c926e9e8439eac2c50e4afce6ab35e1be');
  assert.equal(sha256(isolatedBytes), isolated.sha256);
  assert.deepEqual(pngDimensions(isolatedBytes), { width: 492, height: 303 });

  const stopShip = plan.liveImplementationEvidence.stopShipValidation;
  assert.equal(stopShip.mcpRequestId, '134d0710-9fc8-48bc-bdce-3c86134f6cc5');
  assert.equal(stopShip.result, 'PASS');
  assert.deepEqual(stopShip.pages['04.01'], {
    targetNodeId: '60:3', layerCount: 11, mode: { name: 'void', modeId: '52:8' },
    contours: { count: 67, nodeType: 'ELLIPSE' }, panels: { count: 12, fillLiteral: '#181817' }, gradientStopCount: 7,
  });
  assert.equal(stopShip.pages['06.01'].layerCount, 11);
  assert.deepEqual(stopShip.pages['06.01'].mode, { name: 'paper', modeId: '52:9' });
  assert.deepEqual(stopShip.pages['06.01'].contours, { count: 53, nodeType: 'ELLIPSE' });
  assert.deepEqual(stopShip.pages['06.01'].panels, { count: 12, fillLiteral: '#EBE9E0' });
  assert.equal(stopShip.pages['06.01'].gradientStopCount, 8);
  assert.equal(stopShip.lockedReferences.every(({ locked }) => locked), true);
  assert.deepEqual(stopShip.embeddedConceptReference, {
    nodeId: '67:20', parentLayerNodeId: '67:12', locked: true,
    figmaImageHash: '3740a582de2e6eca4b73b352d0c7cc58eca07dc1',
  });

  assert.match(field.targetFrame.verificationStatus, /QA_CAPTURED/);
  assert.match(field.targetFrame.publicationStatus, /only after verification/);
  assert.match(lens.targetFrame.verificationStatus, /NONPUBLISHABLE/);
  assert.equal(lens.targetFrame.publicationStatus, 'nonpublishable');
});

test('field and optical gradients exactly mirror the governed recipes and never interpolate Signal Lime', async () => {
  const [plan, recipes] = await Promise.all([
    readJson(planPath),
    readJson('governance/gradient-recipes.json'),
  ]);
  const pageById = new Map(plan.pages.map((page) => [page.subjectId, page]));
  const recipeById = new Map(recipes.recipes.map((recipe) => [recipe.subjectId, recipe]));
  const field = pageById.get('04.01').fieldGradient;
  const fieldRecipe = recipeById.get('04.01');
  const optical = pageById.get('06.01').externalMaterialStudy.gradient;
  const opticalRing = pageById.get('06.01').externalMaterialStudy.outerRim;
  const opticalRecipe = recipeById.get('04.02');

  assert.equal(field.type, 'GRADIENT_LINEAR');
  assert.equal(field.angleDeg, fieldRecipe.geometry.angleDeg);
  assert.deepEqual(field.normalizedEndpoints, { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } });
  assert.deepEqual(
    field.stops.map(({ positionPercent, color }) => [positionPercent, color]),
    fieldRecipe.stops.items.map(({ positionPercent, color }) => [positionPercent, color]),
  );
  assert.equal(optical.angleDeg, opticalRecipe.geometry.angleDeg);
  assert.deepEqual(
    optical.stops.map(({ positionPercent, color }) => [positionPercent, color]),
    opticalRecipe.stops.items.map(({ positionPercent, color }) => [positionPercent, color]),
  );
  assert.deepEqual(opticalRing.gradientTransform.matrix, [
    [-0.31776300072669983, 0.4053857922554016, -0.14602310955524445],
    [-0.7137073874473572, -0.18048939108848572, 0.9574077129364014],
  ]);
  assert.equal(opticalRing.gradientTransform.angleDeg, 100);
  assert.deepEqual(opticalRing.gradientTransform.pageSpaceStart, { x: 720, y: 1160 });
  assert.equal(opticalRing.gradientTransform.pageSpaceDirectionExpression, '640 * (cos(100 degrees), sin(100 degrees))');
  assert.equal(opticalRing.gradientTransform.directionFormula, 'd=640*(cos100,sin100)');
  assert.equal(opticalRing.gradientTransform.parameterFormula, 't=dot(P-S,d)/|d|^2');
  assert.deepEqual(
    [opticalRing.gradientTransform.coordinateBridge.nodeLocalWidth, opticalRing.gradientTransform.coordinateBridge.nodeLocalHeight],
    [500, 284],
  );
  assert.equal(opticalRing.gradientTransform.coordinateBridge.nodeGeometrySource, 'node.relativeTransform');
  assert.equal(opticalRing.gradientTransform.mutationMcpRequestId, 'f6635679-2eda-49d3-a0a8-0022cf55cb1b');
  assert.equal(
    [...field.stops, ...optical.stops].some(({ color }) => color === '#C6FF24'),
    false,
    'Signal Lime must stay a flat separate operational channel',
  );
});

test('all declared canonical bindings resolve in the canonical variable plan without inventing variables', async () => {
  const [plan, variables] = await Promise.all([
    readJson(planPath),
    readJson('governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-import.json'),
  ]);
  const variablesByCollection = new Map(variables.collections.map((collection) => [
    collection.name,
    new Set(collection.variables.map((variable) => variable.name)),
  ]));
  const references = new Set([
    ...Object.values(plan.canonicalVariables.bindingRoles),
    ...collectBindingRefs(plan.pages),
    ...collectBindingRefs(plan.sharedFrameContract),
  ]);

  for (const reference of references) {
    const slash = reference.indexOf('/');
    assert.ok(slash > 0, `invalid binding reference ${reference}`);
    const collection = reference.slice(0, slash);
    const name = reference.slice(slash + 1);
    assert.ok(variablesByCollection.has(collection), `unknown collection ${collection}`);
    assert.ok(variablesByCollection.get(collection).has(name), `unknown variable ${reference}`);
  }
  assert.equal(references.has('Atlas/aperture/tangent-continuity'), true);
  assert.equal(references.has('Brand/brand/accent/signal'), true);
});

test('Continuous Lens geometry is smooth, native, tangent-continuous, and explicitly noncanonical numerically', async () => {
  const plan = await readJson(planPath);
  const pageById = new Map(plan.pages.map((page) => [page.subjectId, page]));
  const field = pageById.get('04.01');
  const lens = pageById.get('06.01');

  assert.equal(plan.smoothLensGeometry.figmaPrimitive, 'ELLIPSE');
  assert.equal(plan.smoothLensGeometry.optionalCubicFallback.lineSegmentsAllowed, false);
  assert.deepEqual(plan.smoothLensGeometry.optionalCubicFallback.commandTypes, ['C', 'C', 'C', 'C', 'Z']);
  for (const forbidden of ['polygon', 'corner', 'sharp edge', 'outline chamfer', 'key cut', 'notch', 'straight segment', 'miter join']) {
    assert.ok(plan.smoothLensGeometry.forbidden.includes(forbidden), `missing ${forbidden} rejection`);
  }

  assert.equal(field.specimen.lineCount, 67);
  assert.deepEqual(field.specimen.contourGenerator.indexRange, [0, 66]);
  assert.equal(field.specimen.aperture.primitive, 'ELLIPSE');
  assert.equal(field.specimen.aperture.rotationDeg, -14);
  assert.equal(lens.nativeReconstruction.lineCount, 53);
  assert.deepEqual(lens.nativeReconstruction.contourGenerator.indexRange, [0, 52]);
  assert.equal(lens.nativeReconstruction.aperture.primitive, 'ELLIPSE');
  assert.equal(lens.tangentConstruction.lens.primitive, 'ELLIPSE');
  assert.equal(lens.externalMaterialStudy.outerRim.primitive, 'ELLIPSE');
  assert.equal(lens.externalMaterialStudy.unchangedOpening.primitive, 'ELLIPSE');
  assert.match(lens.targetFrame.publicationStatus, /nonpublishable/);
  assert.match(plan.canonicalVariables.bindingExceptions.find(({ property }) => property === '-14 degree lens orientation').requiredHandling, /governed-provisional/);
});

test('typography uses exact registered families and records every source-fidelity exception instead of silently rounding', async () => {
  const plan = await readJson(planPath);
  const registered = new Set(plan.typography.registeredFamilies);
  for (const role of Object.values(plan.typography.roles)) assert.ok(registered.has(role.family), `unregistered ${role.family}`);

  assert.equal(plan.typography.roles.pageTitle72.fontSizePx, 72);
  assert.equal(plan.typography.roles.pageTitle56.fontSizePx, 56);
  assert.equal(plan.typography.roles.sectionHeading.fontSizePx, 17);
  assert.equal(plan.typography.roles.sectionBody.fontSizePx, 17);
  assert.equal(plan.typography.roles.pageTitle72.family, 'Unbounded');
  assert.equal(plan.typography.roles.sectionBody.family, 'Hanken Grotesk');
  assert.equal(plan.typography.roles.systemRail.family, 'JetBrains Mono');
  assert.ok(plan.canonicalVariables.bindingExceptions.some(({ property }) => property === '04.01 and 06.01 page-title sizes'));
  assert.ok(plan.canonicalVariables.bindingExceptions.some(({ property }) => property === '17 px panel heading and body size'));
  assert.ok(plan.canonicalVariables.bindingExceptions.some(({ property }) => property === 'panel fills'));
});
