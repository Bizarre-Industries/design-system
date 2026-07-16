export function evaluateCurrentRootContract({
  activeRoot,
  observed,
  content,
  contentSpec,
  subjectManifest,
  adoptionReceipt,
  planId = 'bizarre-104-page-population-plan-v2',
  planVersion = '2.0.0',
}) {
  const pluginData = activeRoot?.pluginData || {};
  const sourceAligned = pluginData.content_fingerprint === content.contentFingerprint
    && pluginData.recipe_id === content.visualRecipe.recipeId
    && pluginData.manifest_sha256 === subjectManifest.canonicalSha256
    && pluginData.spec_sha256 === contentSpec.canonicalSha256
    && pluginData.authority_status === content.governance.authorityStatus
    && pluginData.verification_status === content.governance.verificationStatus
    && pluginData.publication_status === content.governance.publicationStatus
    && pluginData.build_status === 'complete';

  const planManaged = sourceAligned
    && pluginData.plan_id === planId
    && pluginData.plan_version === planVersion
    && new RegExp(`^figma-native-104-v${planVersion.replaceAll('.', '\\.')}(?:-|$)`)
      .test(pluginData.population_revision || '');

  const receiptSubject = adoptionReceipt?.subject;
  const receiptAdopted = sourceAligned
    && adoptionReceipt?.status === 'ADOPTED_CURRENT_SOURCE_CONTRACT_NOT_PLAN_GENERATED'
    && adoptionReceipt?.mutationStatus === 'METADATA-ONLY / VISUALS UNCHANGED'
    && adoptionReceipt?.figmaFileKey === subjectManifest.figma.fileKey
    && adoptionReceipt?.invariants?.planIdFabricated === false
    && adoptionReceipt?.invariants?.visualMutationCount === 0
    && receiptSubject?.planAffiliation === null
    && receiptSubject?.subjectId === observed.subjectId
    && receiptSubject?.pageId === observed.pageId
    && receiptSubject?.rootId === activeRoot?.nodeId
    && receiptSubject?.populationRevision === pluginData.population_revision
    && receiptSubject?.recipeId === content.visualRecipe.recipeId
    && receiptSubject?.manifestCanonicalSha256 === subjectManifest.canonicalSha256
    && receiptSubject?.specCanonicalSha256 === contentSpec.canonicalSha256
    && receiptSubject?.contentFingerprint === content.contentFingerprint
    && receiptSubject?.authorityStatus === content.governance.authorityStatus
    && receiptSubject?.verificationStatus === content.governance.verificationStatus
    && receiptSubject?.publicationStatus === content.governance.publicationStatus
    && receiptSubject?.buildStatus === 'complete'
    && pluginData.plan_id === ''
    && pluginData.plan_version === ''
    && pluginData.plan_sha256 === '';

  return {
    sourceAligned,
    planManaged,
    receiptAdopted,
    current: planManaged || receiptAdopted,
    contractType: planManaged ? 'plan-managed' : receiptAdopted ? 'receipt-adopted' : null,
  };
}
