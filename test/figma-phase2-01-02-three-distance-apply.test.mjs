import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const receiptPath = new URL('../governance/design-ledgers/figma/bizarre-atlas-v1-phase2-01.02-three-distance-apply.json', import.meta.url);
const receiptRelativePath = 'governance/design-ledgers/figma/bizarre-atlas-v1-phase2-01.02-three-distance-apply.json';
const sourceDriftPath = new URL('../governance/design-ledgers/figma/bizarre-v1-source-drift-observation-v2-2026-07-16.json', import.meta.url);
const portabilityPath = new URL('../governance/design-ledgers/figma/bizarre-v1-portability-normalization-v1-2026-07-17.json', import.meta.url);
const root = new URL('../', import.meta.url);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseSvgMetadata(source) {
  const match = source.match(/<metadata[^>]*>(.*?)<\/metadata>/s);
  assert.ok(match, 'governed SVG metadata is required');
  return JSON.parse(match[1]);
}

test('Phase 2 01.02 receipt is source-backed, editable, and blocked from premature promotion', async () => {
  const [receipt, sourceDrift, portability] = await Promise.all([
    readFile(receiptPath, 'utf8').then(JSON.parse),
    readFile(sourceDriftPath, 'utf8').then(JSON.parse),
    readFile(portabilityPath, 'utf8').then(JSON.parse),
  ]);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.status, 'APPLIED_QA_CAPTURED_NOT_VERIFIED');
  assert.equal(receipt.subject.subjectId, '01.02');
  assert.equal(receipt.subject.pageId, '47:8');
  assert.equal(receipt.subject.sourceRecipeId, '01.02/visual/v1');
  assert.equal(receipt.subject.appliedRecipeId, '01.02/visual/r1');
  assert.equal(receipt.subject.contentFingerprint, '038ff17ca9daab97cc8b4c038172c9f6b786b01bca072ef142151ba5c275b7e6');
  assert.equal(receipt.subject.verificationStatus, 'NOT VERIFIED');
  assert.equal(receipt.subject.promotionStatus, 'BLOCKED');
  assert.equal(receipt.validation.promotionGate, 'BLOCKED');
  assert.equal(receipt.subject.usesProvisionalInputs, true);
  assert.equal(receipt.subject.usesRejectedInputs, false);
  assert.match(receipt.subject.documentationPublicationStatus, /publishable/i);
  assert.match(receipt.subject.embeddedExportStatus, /nonpublishable/i);

  assert.deepEqual(
    receipt.liveImplementation.activeRoot,
    {
      nodeId: '181:2',
      name: '01 / FIGMA NATIVE - EDITABLE MASTER / 01.02 THREE-DISTANCE / r1',
      x: 0,
      y: 0,
      width: 1440,
      height: 3500,
      visible: true,
      locked: false,
      clipsContent: true,
      descendantCount: 1659,
      nodeTypeCounts: {
        FRAME: 64,
        RECTANGLE: 99,
        TEXT: 93,
        VECTOR: 1362,
        GROUP: 38,
        ELLIPSE: 3,
      },
    },
  );
  assert.equal(receipt.liveImplementation.archive.nodeId, '83:159');
  assert.equal(receipt.liveImplementation.archive.visible, false);
  assert.equal(receipt.liveImplementation.archive.locked, true);
  assert.deepEqual(receipt.liveImplementation.hiddenReferenceFrame.rasterNodeIds, []);
  assert.equal(receipt.liveImplementation.pageTopLevelFrameCount, 2);
  assert.deepEqual(receipt.execution.errors, []);
  assert.equal(receipt.execution.uploadedImageCount, 0);
  assert.deepEqual(receipt.execution.uploadedImageHashes, []);

  const expectedSourceNodeMap = {
    atlasSpectralLarge: '101:114',
    atlasContoursDark: '101:466',
    atlasContoursLarge: '101:540',
    atlasDotsLarge: '101:697',
    atlasHatchLarge: '101:974',
    atlasMicro: '101:1168',
  };
  assert.deepEqual(receipt.nativeReuse.sourceNodeMap, expectedSourceNodeMap);
  assert.equal(receipt.nativeReuse.sourceCloneCount, receipt.nativeReuse.sourceClones.length);
  for (const clone of receipt.nativeReuse.sourceClones) {
    assert.ok(expectedSourceNodeMap[clone.sourceId], `unapproved Figma source clone: ${clone.sourceId}`);
    assert.ok(clone.role.length > 0);
    assert.ok(['contain', 'cover'].includes(clone.fitMode));
  }
  assert.equal(receipt.nativeReuse.uniformScalingAndClippingOnly, true);
  assert.equal(receipt.nativeReuse.logoInstanceCount, 0);
  assert.equal(receipt.nativeReuse.mixedLogoColorRisk, false);
  for (const far of receipt.nativeReuse.farVisibilityFilters) {
    assert.equal(far.sourceNodeId, '101:540');
    assert.equal(far.hiddenMinorCount, 59);
    assert.equal(far.retainedMajorCount, 15);
    assert.equal(far.retainedGroupCount, 2);
    assert.equal(far.geometryPathMutationCount, 0);
    assert.ok(far.majorWeight / far.minorWeight >= 3.5);
    assert.ok(far.majorWeight / far.minorWeight <= 4.5);
  }

  assert.equal(receipt.governedSourceAudit.sourceType, 'synthetic');
  assert.equal(receipt.governedSourceAudit.model, 'single-mass-lensing-field/1.0.0');
  assert.equal(receipt.governedSourceAudit.algorithm, 'bizarre-atlas-single-mass/1.0.0');
  assert.equal(receipt.governedSourceAudit.orientationDegrees, 18);
  assert.equal(receipt.governedSourceAudit.trajectoryState, 'ACTIVE');
  assert.equal(receipt.governedSourceAudit.seed, null);
  assert.equal(receipt.governedSourceAudit.seedConsumed, false);
  assert.equal(receipt.governedSourceAudit.largeFieldConfigurationHash, '7e35c8cc2641acbb4bbf2afcb7b215af94544d8d6bdae3d55180cfd289838338');
  assert.equal(receipt.governedSourceAudit.aperture.version, 'continuous-lens-aperture/owner-selected-left-v2');
  assert.equal(receipt.governedSourceAudit.aperture.pathSha256, 'bb4079e12e6db7bb2387dc7fbe174b3283b57d5af4d4e942e4053bd96158c9dd');

  const expectedOpticalAvailability = {
    Micro: { status: 'EXACT GOVERNED-PROVISIONAL', sourceId: 'atlasMicro', sourceNodeId: '101:1168' },
    Small: { status: 'ASSET REQUIRED / NOT VERIFIED', sourceId: null, sourceNodeId: null },
    Medium: { status: 'EXACT GOVERNED-PROVISIONAL', sourceId: 'atlasContoursDark', sourceNodeId: '101:466' },
    Large: { status: 'EXACT GOVERNED-PROVISIONAL', sourceId: 'atlasContoursLarge', sourceNodeId: '101:540' },
    Field: { status: 'ASSET REQUIRED / NOT VERIFIED', sourceId: null, sourceNodeId: null },
    blocked: ['Small', 'Field'],
  };
  assert.deepEqual(receipt.opticalSizeAvailability, expectedOpticalAvailability);

  assert.deepEqual(receipt.imagegenAudit.allowedConceptReferenceIds, []);
  assert.equal(receipt.imagegenAudit.used, false);
  assert.equal(receipt.imagegenAudit.imageFillNodeCount, 0);
  assert.equal(receipt.imagegenAudit.hiddenReferenceRasterCount, 0);
  assert.equal(receipt.bilingualAudit.arabicReviewStatus, 'NOT VERIFIED');
  assert.equal(receipt.bilingualAudit.publicArabicCopyNodeCount, 0);
  assert.equal(receipt.bilingualAudit.publicReadinessClaimed, false);
  assert.ok(receipt.sourceArtifacts.every((artifact) => !artifact.path.includes('/imagegen/')));

  const audit = receipt.tokenStyleAndLayoutAudit;
  assert.equal(audit.textNodesWithStyleId + audit.textNodesWithoutStyleId, audit.textNodeCount);
  assert.equal(audit.textNodesWithoutStyleId, 0);
  assert.equal(audit.textOverflowCount, 0);
  assert.ok(audit.autoLayoutFrameCount > 0);
  assert.ok(audit.autoLayoutFrameCount <= audit.frameCountIncludingRoot);
  assert.equal(audit.unboundDocumentationSolidPaintCount, 0);
  assert.equal(audit.variableBoundSolidPaintCount + audit.exactSourceSolidPaintExceptionCount, audit.solidPaintCount);
  assert.equal(audit.gradientSignalInterpolationRiskCount, 0);
  assert.equal(audit.sourceViewportFailureCount, 0);
  assert.match(audit.classification, /documentation artboard/i);

  const contentSpecArtifact = receipt.sourceArtifacts.find((artifact) => artifact.path.endsWith('bizarre-masterbrand-content-spec-v1.json'));
  const subjectManifestArtifact = receipt.sourceArtifacts.find((artifact) => artifact.path.endsWith('bizarre-masterbrand-subjects-v1.json'));
  assert.ok(contentSpecArtifact);
  assert.ok(subjectManifestArtifact);
  const contentSpec = JSON.parse(await readFile(new URL(contentSpecArtifact.path, root), 'utf8'));
  const subjectManifest = JSON.parse(await readFile(new URL(subjectManifestArtifact.path, root), 'utf8'));
  const subject = contentSpec.subjects.find((item) => item.subjectId === '01.02');
  const contentSpecNormalization = portability.artifacts.find((artifact) => (
    artifact.artifactPath === contentSpecArtifact.path
  ));
  assert.ok(contentSpecNormalization);
  const fingerprintTransition = contentSpecNormalization.receiptSubjectFingerprintTransitions.find((entry) => (
    entry.subjectId === '01.02'
  ));
  assert.ok(fingerprintTransition);
  assert.ok(subject);
  assert.equal(receipt.subject.contentFingerprint, fingerprintTransition.before);
  assert.equal(subject.contentFingerprint, fingerprintTransition.after);
  assert.equal(contentSpecArtifact.canonicalSha256, contentSpecNormalization.beforeCanonicalSha256);
  assert.equal(contentSpec.canonicalSha256, contentSpecNormalization.afterCanonicalSha256);
  assert.equal(subjectManifest.canonicalSha256, subjectManifestArtifact.canonicalSha256);

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

  const assetArtifacts = receipt.sourceArtifacts.filter((artifact) => artifact.sourceId && artifact.path.endsWith('.svg'));
  for (const artifact of assetArtifacts) {
    const source = await readFile(new URL(artifact.path, root), 'utf8');
    const metadata = parseSvgMetadata(source);
    if (artifact.sourceId !== 'aperture') {
      const receiptAsset = receipt.governedSourceAudit.assets[artifact.sourceId];
      assert.ok(receiptAsset, `missing governed source audit: ${artifact.sourceId}`);
      assert.equal(receiptAsset.sha256, artifact.sha256);
      assert.equal(receiptAsset.fieldConfigurationHash, metadata.fieldConfigurationHash);
      assert.equal(receiptAsset.configurationHash, metadata.configurationHash);
    }
    assert.equal(metadata.model.name, 'single-mass-lensing-field');
    assert.equal(metadata.model.version, '1.0.0');
    assert.equal(metadata.algorithm.name, 'bizarre-atlas-single-mass');
    assert.equal(metadata.algorithm.version, '1.0.0');
  }

  for (const sourceId of ['atlasContoursLarge', 'atlasSpectralLarge', 'atlasDotsLarge', 'atlasHatchLarge']) {
    assert.equal(
      receipt.governedSourceAudit.assets[sourceId].fieldConfigurationHash,
      receipt.governedSourceAudit.largeFieldConfigurationHash,
      `large representation field mismatch: ${sourceId}`,
    );
  }

  const beforeCapture = await readFile(new URL(receipt.qaEvidence.before.path, root));
  const currentCapture = await readFile(new URL(receipt.qaEvidence.currentFigmaCapture.path, root));
  assert.equal(sha256(beforeCapture), receipt.qaEvidence.before.sha256);
  assert.equal(sha256(currentCapture), receipt.qaEvidence.currentFigmaCapture.sha256);
  assert.equal(receipt.qaEvidence.visualVerificationStatus, 'NOT VERIFIED');
  assert.equal(receipt.qaEvidence.sameInputComparisonStatus, 'VIEWED_IN_COMBINED_COMPARISON_INPUT_NOT_PERSISTED');
  assert.ok(receipt.openFindings.length >= 5);
});
