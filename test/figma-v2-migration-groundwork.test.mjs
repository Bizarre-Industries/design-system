import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { evaluateCurrentRootContract } from '../scripts/lib/figma-v2-root-contract.mjs';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const readJson = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, root), 'utf8'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

test('v1 Figma migration evidence remains byte-for-byte pinned after the approved portability normalization', async () => {
  const frozen = {
    'governance/design-ledgers/figma/bizarre-page-map-v1.json': '1c362392a9870b71b956b7f5fac613e8ba37600cc236fb2c3fb4415d72fdde43',
    'governance/design-ledgers/figma/bizarre-104-page-population-plan-v1.json': 'de0aeeb578e274b1f37a16f4f2b6c97f3c515245434e294ff0b98680820e0d4c',
    'governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-import.json': '3b19a6b2b33d55bedb65929083ecd1f4aa1bd4ef7f18992b581598b0494c2d93',
    'governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-apply.json': '9880e9af8b96ecd3af21852cd9ae38c733af75de8a90da72d2002b29fdfc55e1',
    'governance/design-ledgers/figma/bizarre-atlas-v1.json': '33c51def0f40c9c306b9546754a9386a0c69052c29a23c29f9088251df46f8c6',
    'production/affinity/bizarre-masterbrand-subjects-v1.json': 'c01485191832c624c02a25984b79ae796d676b4f9d3e8bbf4358fd524e73509b',
    'production/affinity/bizarre-masterbrand-content-spec-v1.json': 'd7ce1d97cfbcc9110a9bf39ea124ba4e04cdcdf289f933e6e32cb09e9d64cd31',
  };
  for (const [relativePath, expected] of Object.entries(frozen)) {
    assert.equal(sha256(await readFile(new URL(relativePath, root))), expected, relativePath);
  }
});

test('approved v1 portability ledger preserves historical claims and pins every normalized artifact', async () => {
  const ledger = await readJson('governance/design-ledgers/figma/bizarre-v1-portability-normalization-v1-2026-07-17.json');
  const hashable = structuredClone(ledger);
  delete hashable.canonicalSha256;

  assert.equal(ledger.changeClass, 'PORTABILITY_ONLY');
  assert.equal(ledger.policy.historicalExecutionClaimsImmutable, true);
  assert.equal(ledger.policy.rewriteReceiptHashesForbidden, true);
  assert.equal(ledger.policy.semanticAuthorityUnchanged, true);
  assert.equal(ledger.policy.visualGeometryChanged, false);
  assert.equal(sha256(canonicalJson(hashable)), ledger.canonicalSha256);

  for (const artifact of ledger.artifacts) {
    assert.equal(
      sha256(await readFile(new URL(artifact.artifactPath, root))),
      artifact.afterRawSha256,
      artifact.artifactPath,
    );
  }
  for (const evidence of ledger.evidenceImports) {
    assert.equal(sha256(await readFile(new URL(evidence.path, root))), evidence.sha256, evidence.path);
  }
});

test('v2 page map preserves all stable IDs and changes only governed 01.03 naming', async () => {
  const [v1, v2, manifest] = await Promise.all([
    readJson('governance/design-ledgers/figma/bizarre-page-map-v1.json'),
    readJson('governance/design-ledgers/figma/bizarre-page-map-v2.json'),
    readJson('production/affinity/bizarre-masterbrand-subjects-v2.json'),
  ]);
  const hashable = structuredClone(v2);
  delete hashable.canonicalSha256;

  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.mapId, 'bizarre-page-map-v2');
  assert.equal(v2.mapVersion, '2.0.0');
  assert.equal(v2.mappingStatus, 'OFFLINE TARGET / LIVE FIGMA NOT OBSERVED');
  assert.equal(v2.manifestHash, manifest.canonicalSha256);
  assert.equal(sha256(canonicalJson(hashable)), v2.canonicalSha256);
  assert.equal(v2.pages.length, 104);
  assert.deepEqual(v2.pages.map(({ subjectId, pageId }) => ({ subjectId, pageId })), v1.pages.map(({ subjectId, pageId }) => ({ subjectId, pageId })));

  const changed = v2.pages.filter((page, index) => page.name !== v1.pages[index].name);
  assert.deepEqual(changed, [{
    subjectId: '01.03',
    pageId: '47:9',
    name: '01.03 · Single Identity / Native Integration',
  }]);
  assert.equal(v2.pages.every((page, index) => page.name === manifest.subjects[index].exactLabel), true);

  const immutableResult = spawnSync(process.execPath, ['scripts/build-figma-page-map-v2.mjs'], {
    cwd: rootPath,
    env: {
      ...process.env,
      BIZARRE_FIGMA_V2_PAGE_MAP_OUTPUT: 'governance/design-ledgers/figma/bizarre-page-map-v1.json',
    },
    encoding: 'utf8',
  });
  assert.notEqual(immutableResult.status, 0);
  assert.match(immutableResult.stderr, /IMMUTABLE_V1_OUTPUT/);
});

test('v2 population-plan builder requires fresh observation before any write', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'bizarre-figma-v2-plan-'));
  try {
    const output = path.join(directory, 'plan.json');
    const result = spawnSync(process.execPath, ['scripts/build-figma-104-page-population-plan.mjs'], {
      cwd: rootPath,
      env: { ...process.env, BIZARRE_FIGMA_V2_PLAN_OUTPUT: output },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /MISSING_REQUIRED_FIGMA_OBSERVATION/);
    assert.equal(result.stdout, '');
    assert.equal(result.error, undefined);

    const immutableResult = spawnSync(process.execPath, [
      'scripts/build-figma-104-page-population-plan.mjs',
      '--observation', path.join(directory, 'missing.json'),
    ], {
      cwd: rootPath,
      env: {
        ...process.env,
        BIZARRE_FIGMA_V2_PLAN_OUTPUT: 'governance/design-ledgers/figma/bizarre-104-page-population-plan-v1.json',
      },
      encoding: 'utf8',
    });
    assert.notEqual(immutableResult.status, 0);
    assert.match(immutableResult.stderr, /IMMUTABLE_V1_OUTPUT/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('v2 subject generator requires an explicit plan/spec pair and has a dedicated 01.03 renderer', async () => {
  const source = await readFile(new URL('scripts/build-figma-subject-population-code.mjs', root), 'utf8');
  assert.doesNotMatch(source, /readFileSync\(path\.join\(root, 'governance\/design-ledgers\/figma\/bizarre-104-page-population-plan-v1\.json'/);
  assert.doesNotMatch(source, /readFileSync\(path\.join\(root, 'production\/affinity\/bizarre-masterbrand-content-spec-v1\.json'/);
  assert.match(source, /--plan <v2-plan\.json> --spec <v2-content-spec\.json>/);
  assert.match(source, /INTEGRATE\. DO NOT REPLACE\./);
  assert.match(source, /EXISTING PRODUCT SYSTEM/);
  assert.match(source, /SWIFTUI \+ iOS/);
  assert.match(source, /SWIFTUI \+ macOS/);
  assert.match(source, /createdNodeIds/);
  assert.match(source, /mutatedNodeIds/);

  const result = spawnSync(process.execPath, [
    'scripts/build-figma-subject-population-code.mjs',
    '01.03',
    '--plan', '/tmp/bizarre-missing-v2-plan.json',
    '--spec', 'production/affinity/bizarre-masterbrand-content-spec-v2.json',
  ], { cwd: rootPath, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MISSING_REQUIRED_V2_PLAN/);

  const migrationResult = spawnSync(process.execPath, [
    'scripts/build-figma-subject-population-code.mjs',
    '01.03',
    '--plan', 'governance/design-ledgers/figma/bizarre-104-page-population-plan-v2.json',
    '--spec', 'production/affinity/bizarre-masterbrand-content-spec-v2.json',
  ], { cwd: rootPath, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  assert.notEqual(migrationResult.status, 0);
  assert.match(migrationResult.stderr, /MIGRATION_REQUIRED:01\.03/);
  assert.equal(migrationResult.stdout, '');

  const directSource = await readFile(new URL(
    'production/figma/phase2/build-01.03-single-identity-native-integration-r2.js',
    root,
  ), 'utf8');
  assert.notEqual(directSource.indexOf('const current = page.findOne'), -1);
  assert.ok(directSource.indexOf('const current = page.findOne') < directSource.indexOf('const legacyRoot = await figma.getNodeByIdAsync'));
  assert.doesNotMatch(directSource, /archived-subject-master|preservedLegacyVariableIds/);
  assert.match(directSource, /legacyRoot\.remove\(\)/);
  assert.match(directSource, /spec_sha256: CONTRACT\.contentSpecSha256/);
  assert.match(directSource, /publication_status: 'publishable'/);
});

test('historical receipt-backed 01.03 root is stale after source normalization and only a current plan contract can pass', async () => {
  const [observation, contentSpec, subjectManifest, receipt] = await Promise.all([
    readJson('governance/design-ledgers/figma/bizarre-live-observation-v2-2026-07-16.json'),
    readJson('production/affinity/bizarre-masterbrand-content-spec-v2.json'),
    readJson('production/affinity/bizarre-masterbrand-subjects-v2.json'),
    readJson('governance/design-ledgers/figma/bizarre-figma-v2-01.03-preserved-root-adoption.json'),
  ]);
  const observed = observation.liveFigmaEvidence.pageInventory.pages.find((page) => page.subjectId === '01.03');
  const content = contentSpec.subjects.find((subject) => subject.subjectId === '01.03');
  const exact = evaluateCurrentRootContract({
    activeRoot: observed.activeRoot,
    observed,
    content,
    contentSpec,
    subjectManifest,
    adoptionReceipt: receipt,
  });
  assert.deepEqual(exact, {
    sourceAligned: false,
    planManaged: false,
    receiptAdopted: false,
    current: false,
    contractType: null,
  });

  const withoutReceipt = evaluateCurrentRootContract({
    activeRoot: observed.activeRoot,
    observed,
    content,
    contentSpec,
    subjectManifest,
    adoptionReceipt: null,
  });
  assert.equal(withoutReceipt.current, false);

  for (const key of [
    'content_fingerprint',
    'recipe_id',
    'spec_sha256',
    'authority_status',
    'verification_status',
    'publication_status',
    'population_revision',
  ]) {
    const activeRoot = structuredClone(observed.activeRoot);
    activeRoot.pluginData[key] = `${activeRoot.pluginData[key]}-drift`;
    const drifted = evaluateCurrentRootContract({
      activeRoot,
      observed,
      content,
      contentSpec,
      subjectManifest,
      adoptionReceipt: receipt,
    });
    assert.equal(drifted.current, false, key);
  }

  const wrongRoot = structuredClone(observed.activeRoot);
  wrongRoot.nodeId = '184:999';
  assert.equal(evaluateCurrentRootContract({
    activeRoot: wrongRoot,
    observed,
    content,
    contentSpec,
    subjectManifest,
    adoptionReceipt: receipt,
  }).current, false);

  const planRoot = structuredClone(observed.activeRoot);
  Object.assign(planRoot.pluginData, {
    content_fingerprint: content.contentFingerprint,
    recipe_id: content.visualRecipe.recipeId,
    manifest_sha256: subjectManifest.canonicalSha256,
    spec_sha256: contentSpec.canonicalSha256,
    content_spec_sha256: contentSpec.canonicalSha256,
    authority_status: content.governance.authorityStatus,
    verification_status: content.governance.verificationStatus,
    publication_status: content.governance.publicationStatus,
    plan_id: 'bizarre-104-page-population-plan-v2',
    plan_version: '2.0.0',
    plan_sha256: 'generated-plan-hash',
    population_revision: 'figma-native-104-v2.0.0-portable-source-contract',
  });
  const generated = evaluateCurrentRootContract({
    activeRoot: planRoot,
    observed,
    content,
    contentSpec,
    subjectManifest,
    adoptionReceipt: receipt,
  });
  assert.equal(generated.current, true);
  assert.equal(generated.contractType, 'plan-managed');
});

test('fresh live observation produces the governed v2 plan without mutating Figma', async () => {
  const plan = await readJson('governance/design-ledgers/figma/bizarre-104-page-population-plan-v2.json');
  assert.equal(plan.scope.mutationStatus, 'READ_ONLY PLAN / FIGMA UNCHANGED');
  assert.equal(plan.scope.permanentSubjectCount, 104);
  assert.equal(plan.scope.preservedPermanentPageCount, 0);
  assert.equal(plan.scope.migrationRequiredCount, 60);
  assert.equal(plan.scope.unmanagedConflictCount, 6);
  assert.deepEqual(plan.preservation.preservedCurrentRootSubjectIds, []);
  const adopted = plan.subjects.find((subject) => subject.subjectId === '01.03');
  assert.equal(adopted.liveFigmaPage.planAction, 'migration-required');
  assert.equal(adopted.liveFigmaPage.targetFrame.contractType, null);
  assert.equal(adopted.liveFigmaPage.targetFrame.populationRevision, 'figma-01.03-single-identity-native-integration-r2');
});

test('live observation schema exposes only evidence-based page classifications', async () => {
  const schema = await readJson('schemas/figma-live-observation.schema.json');
  const classification = schema.$defs.pageObservation.properties.classification.enum;
  assert.deepEqual(classification, ['empty', 'managed-current', 'managed-stale', 'unmanaged-conflict']);
  assert.equal(schema.properties.mutationStatus.const, 'READ_ONLY / FIGMA UNCHANGED');
  assert.equal(schema.properties.liveFigmaEvidence.properties.pageInventory.properties.permanentPageCount.const, 104);
  assert.equal(schema.properties.liveFigmaEvidence.properties.pageInventory.required.includes('mcpRequestIds'), true);
  assert.equal(schema.properties.liveFigmaEvidence.properties.canonicalVariables.properties.variables.minItems, 173);
  assert.equal(schema.properties.liveFigmaEvidence.required.includes('retiredLegacyVariableSweep'), true);
});
