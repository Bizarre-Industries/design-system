import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const receiptPath = new URL('../governance/design-ledgers/figma/bizarre-atlas-v1-phase2-01.01-swiss-working-apply.json', import.meta.url);
const receiptRelativePath = 'governance/design-ledgers/figma/bizarre-atlas-v1-phase2-01.01-swiss-working-apply.json';
const sourceDriftPath = new URL('../governance/design-ledgers/figma/bizarre-v1-source-drift-observation-v2-2026-07-16.json', import.meta.url);
const portabilityPath = new URL('../governance/design-ledgers/figma/bizarre-v1-portability-normalization-v1-2026-07-17.json', import.meta.url);
const root = new URL('../', import.meta.url);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

test('Phase 2 01.01 receipt is honest, reproducible, and remains blocked from promotion', async () => {
  const [receipt, sourceDrift, portability] = await Promise.all([
    readFile(receiptPath, 'utf8').then(JSON.parse),
    readFile(sourceDriftPath, 'utf8').then(JSON.parse),
    readFile(portabilityPath, 'utf8').then(JSON.parse),
  ]);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.status, 'APPLIED_QA_CAPTURED_NOT_VERIFIED');
  assert.equal(receipt.subject.subjectId, '01.01');
  assert.equal(receipt.subject.verificationStatus, 'NOT VERIFIED');
  assert.equal(receipt.subject.promotionStatus, 'BLOCKED');
  assert.equal(receipt.validation.promotionGate, 'BLOCKED');
  assert.equal(receipt.liveImplementation.activeRoot.nodeId, '167:2');
  assert.deepEqual(receipt.liveImplementation.activeRoot.width, 1440);
  assert.deepEqual(receipt.liveImplementation.activeRoot.height, 3500);
  assert.equal(receipt.liveImplementation.archive.visible, false);
  assert.equal(receipt.liveImplementation.archive.locked, true);
  assert.equal(receipt.liveImplementation.hiddenReferenceRasterNodeId, '175:2');
  assert.equal(receipt.qaEvidence.affinityCapture.figmaImageHash, receipt.execution.uploadedImageHash);
  assert.equal(receipt.tokenStyleAndLayoutAudit.textNodesWithStyleId, 0);
  assert.equal(receipt.tokenStyleAndLayoutAudit.autoLayoutFrameCount, 0);
  assert.equal(receipt.tokenStyleAndLayoutAudit.componentLikeNodeCount, 0);
  assert.ok(receipt.openFindings.length >= 5);

  for (const artifact of receipt.sourceArtifacts) {
    if (artifact.path.startsWith('/')) continue;
    const bytes = await readFile(new URL(artifact.path, root));
    const currentSha256 = sha256(bytes);
    if (currentSha256 === artifact.sha256) continue;
    const normalized = portability.artifacts.find((entry) => (
      entry.artifactPath === artifact.path
      && entry.beforeRawSha256 === artifact.sha256
      && entry.afterRawSha256 === currentSha256
    ));
    if (normalized) {
      assert.equal(portability.policy.historicalExecutionClaimsImmutable, true);
      assert.equal(portability.policy.rewriteReceiptHashesForbidden, true);
      continue;
    }
    const observed = sourceDrift.historicalArtifacts.find(({ artifactPath, sourcePath }) => (
      artifactPath === receiptRelativePath && sourcePath === artifact.path
    ));
    assert.ok(observed, `source hash drift is not governed: ${artifact.path}`);
    assert.equal(observed.recordedSha256, artifact.sha256);
    assert.equal(sourceDrift.currentSource.path, artifact.path);
    assert.equal(sourceDrift.currentSource.sha256, currentSha256);
    assert.equal(sourceDrift.policy.currentSourceDriftBlocksPromotion, true);
    assert.equal(observed.disposition, 'HISTORICAL_SOURCE_DRIFT_CONFIRMED_DO_NOT_PROMOTE');
  }

  const currentCapture = await readFile(new URL(receipt.qaEvidence.currentFigmaCapture.path, root));
  assert.equal(sha256(currentCapture), receipt.qaEvidence.currentFigmaCapture.sha256);
  const rejectedCapture = await readFile(new URL(receipt.qaEvidence.rejectedEvidence.path, root));
  assert.equal(sha256(rejectedCapture), receipt.qaEvidence.rejectedEvidence.sha256);
});
