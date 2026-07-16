import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

import { canonicalJson } from './lib/canonical-json.mjs';
import { evaluateCurrentRootContract } from './lib/figma-v2-root-contract.mjs';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
const readFlag = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
};
const outputPath = new URL(
  process.env.BIZARRE_FIGMA_V2_PLAN_OUTPUT
    || 'governance/design-ledgers/figma/bizarre-104-page-population-plan-v2.json',
  root,
);
const observationPath = readFlag('--observation') || process.env.BIZARRE_FIGMA_V2_OBSERVATION;
if (!observationPath) {
  throw new Error(
    'MISSING_REQUIRED_FIGMA_OBSERVATION: use --observation <path> with a fresh read-only official Figma MCP capture',
  );
}
if (outputPath.pathname.endsWith('bizarre-104-page-population-plan-v1.json')) {
  throw new Error('IMMUTABLE_V1_OUTPUT: the v2 population-plan builder refuses the frozen v1 output path');
}

const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const readRequiredObservation = async () => {
  try {
    return await readJson(observationPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(
        `MISSING_REQUIRED_FIGMA_OBSERVATION: ${observationPath}. `
        + 'Capture a fresh read-only official Figma MCP observation before generating the v2 population plan.',
      );
    }
    throw error;
  }
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const canonicalCompact = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalCompact).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalCompact(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const sourcePaths = [
  'production/affinity/bizarre-masterbrand-content-spec-v2.json',
  'production/affinity/bizarre-masterbrand-subjects-v2.json',
  'governance/design-ledgers/figma/bizarre-page-map-v2.json',
  observationPath,
  'governance/design-ledgers/figma/bizarre-native-exemplar-build-plan-v1.json',
  'governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-import.json',
  'governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-apply.json',
  'packages/ui/src/contract.json',
  'packages/ui/src/components.css',
  'schemas/figma-live-observation.schema.json',
  'governance/design-ledgers/figma/bizarre-figma-v2-01.03-preserved-root-adoption.json',
];

const [contentSpec, subjectManifest, pageMap, observation, exemplarPlan, variableImport, variableApply, adoptionReceipt] = await Promise.all([
  readJson(sourcePaths[0]),
  readJson(sourcePaths[1]),
  readJson(sourcePaths[2]),
  readRequiredObservation(),
  readJson(sourcePaths[4]),
  readJson(sourcePaths[5]),
  readJson(sourcePaths[6]),
  readJson(sourcePaths[10]),
]);

const sources = await Promise.all(sourcePaths.map(async (path) => ({
  path,
  fileSha256: sha256(await readFile(new URL(path, root))),
})));

const sourceIdByPath = new Map([
  [sourcePaths[0], 'affinity-content-spec'],
  [sourcePaths[1], 'affinity-subject-manifest'],
  [sourcePaths[2], 'figma-page-map'],
  [sourcePaths[3], 'figma-live-observation'],
  [sourcePaths[4], 'native-exemplar-contract'],
  [sourcePaths[5], 'canonical-variable-import-plan'],
  [sourcePaths[6], 'canonical-variable-apply-receipt'],
  [sourcePaths[7], 'ui-component-contract'],
  [sourcePaths[8], 'ui-component-styles'],
  [sourcePaths[9], 'figma-live-observation-schema'],
  [sourcePaths[10], '01.03-preserved-root-adoption-receipt'],
]);
for (const source of sources) source.sourceId = sourceIdByPath.get(source.path);

const contentById = new Map(contentSpec.subjects.map((subject) => [subject.subjectId, subject]));
const pageById = new Map(pageMap.pages.map((page) => [page.subjectId, page]));
if (contentSpec.specVersion !== '2.0.0'
  || subjectManifest.manifestVersion !== '2.0.0'
  || contentSpec.manifest?.canonicalSha256 !== subjectManifest.canonicalSha256) {
  throw new Error('V2 Affinity manifest/content-spec pair is missing or mismatched');
}
if (pageMap.schemaVersion !== 2
  || pageMap.mapVersion !== '2.0.0'
  || pageMap.manifestHash !== subjectManifest.canonicalSha256) {
  throw new Error('V2 Figma page map is stale relative to the governed subject manifest');
}
if (adoptionReceipt.schemaVersion !== 2
  || adoptionReceipt.receiptVersion !== '2.0.0'
  || adoptionReceipt.subject?.subjectId !== '01.03'
  || adoptionReceipt.invariants?.singleIdentityOnly !== true
  || adoptionReceipt.invariants?.legacyRootAbsent !== true
  || adoptionReceipt.invariants?.retiredOrganizationVariableMatchCount !== 0) {
  throw new Error('V2 01.03 preserved-root adoption receipt is missing or invalid');
}
const observedPages = observation?.liveFigmaEvidence?.pageInventory?.pages;
if (observation?.schemaVersion !== 2 || observation?.observationVersion !== '2.0.0') {
  throw new Error('V2 Figma observation must declare schemaVersion=2 and observationVersion=2.0.0');
}
if (observation.figmaFileKey !== subjectManifest.figma.fileKey) {
  throw new Error('V2 Figma observation targets a different Figma file');
}
if (observation.mutationStatus !== 'READ_ONLY / FIGMA UNCHANGED') {
  throw new Error('V2 Figma observation must be captured read-only with Figma unchanged');
}
if (!Array.isArray(observedPages) || observedPages.length !== 104) {
  throw new Error('V2 Figma observation must include exactly 104 permanent page observations');
}

const pageObservationById = new Map();
const actionByClassification = {
  empty: 'populate-empty-page',
  'managed-current': 'preserve-existing',
  'managed-stale': 'migration-required',
  'unmanaged-conflict': 'block-unmanaged-conflict',
};
for (const observed of observedPages) {
  if (pageObservationById.has(observed.subjectId)) {
    throw new Error(`Duplicate v2 Figma page observation: ${observed.subjectId}`);
  }
  const mapped = pageById.get(observed.subjectId);
  if (!mapped) throw new Error(`Unknown v2 Figma page observation: ${observed.subjectId}`);
  if (observed.pageId !== mapped.pageId || observed.name !== mapped.name) {
    throw new Error(`V2 Figma observation/page-map drift for ${observed.subjectId}`);
  }
  if (!Number.isInteger(observed.observedChildCount) || observed.observedChildCount < 0) {
    throw new Error(`Invalid observed child count for ${observed.subjectId}`);
  }
  if (!Array.isArray(observed.topLevelNodes)
    || observed.topLevelNodes.length !== observed.observedChildCount) {
    throw new Error(`V2 Figma top-level node inventory is incomplete for ${observed.subjectId}`);
  }
  for (const node of observed.topLevelNodes) {
    if (!node.nodeId || !node.type || typeof node.visible !== 'boolean' || typeof node.locked !== 'boolean') {
      throw new Error(`V2 Figma node metadata is incomplete for ${observed.subjectId}`);
    }
  }
  const planAction = actionByClassification[observed.classification];
  if (!planAction) throw new Error(`Unclassified v2 Figma page state for ${observed.subjectId}`);
  if (observed.classification === 'empty'
    && (observed.observedChildCount !== 0 || observed.activeRoot !== null)) {
    throw new Error(`Empty classification contradicts live observation for ${observed.subjectId}`);
  }
  if (observed.classification.startsWith('managed-')) {
    const activeRoot = observed.activeRoot;
    const content = contentById.get(observed.subjectId);
    if (!activeRoot?.nodeId || activeRoot.type !== 'FRAME'
      || !activeRoot.name
      || !activeRoot.rect
      || !['x', 'y', 'width', 'height'].every((key) => Number.isFinite(activeRoot.rect[key]))
      || !observed.topLevelNodes.some((node) => node.nodeId === activeRoot.nodeId)
      || activeRoot.pluginData?.entity !== 'subject-master'
      || activeRoot.pluginData?.subject_id !== observed.subjectId) {
      throw new Error(`Managed classification lacks exact owned-root evidence for ${observed.subjectId}`);
    }
    const auxiliaryTopLevelNodes = observed.topLevelNodes
      .filter((node) => node.nodeId !== activeRoot.nodeId);
    const exactAtlasSourceLibraryOnly = observed.subjectId === '07.01'
      && auxiliaryTopLevelNodes.length === 1
      && auxiliaryTopLevelNodes[0].type === 'FRAME'
      && auxiliaryTopLevelNodes[0].locked === true
      && auxiliaryTopLevelNodes[0].name === '90 / ATLAS GOVERNED SOURCE LIBRARY — EDITABLE / DO NOT APPROXIMATE';
    if (auxiliaryTopLevelNodes.length > 0 && !exactAtlasSourceLibraryOnly) {
      throw new Error(`Managed classification contains unowned top-level content for ${observed.subjectId}`);
    }
    if (observed.classification === 'managed-current'
      && (observed.pagePluginData?.subject_id !== observed.subjectId
        || observed.pagePluginData?.current_master_id !== activeRoot.nodeId
        || observed.pagePluginData?.population_revision !== activeRoot.pluginData.population_revision
        || observed.pagePluginData?.build_status !== 'complete')) {
      throw new Error(`Managed classification lacks an exact page-to-root pointer for ${observed.subjectId}`);
    }
    const currentContract = evaluateCurrentRootContract({
      activeRoot,
      observed,
      content,
      contentSpec,
      subjectManifest,
      adoptionReceipt,
    });
    const rootIsCurrent = currentContract.current;
    if (observed.classification === 'managed-current' && !rootIsCurrent) {
      throw new Error(`Managed-current root contract drift for ${observed.subjectId}`);
    }
    if (observed.classification === 'managed-stale' && rootIsCurrent) {
      throw new Error(`Managed-stale classification is current for ${observed.subjectId}`);
    }
    observed.currentContractType = currentContract.contractType;
  }
  if (observed.classification === 'unmanaged-conflict'
    && (observed.observedChildCount === 0 || observed.activeRoot !== null)) {
    throw new Error(`Unmanaged-conflict classification contradicts live observation for ${observed.subjectId}`);
  }
  pageObservationById.set(observed.subjectId, { ...observed, planAction });
}
const liveEvidence = observation.liveFigmaEvidence;
if (!liveEvidence.capturedAt || Number.isNaN(Date.parse(liveEvidence.capturedAt))) {
  throw new Error('V2 Figma observation requires a valid capturedAt timestamp');
}
if (!/official Figma MCP/i.test(liveEvidence.captureMethod || '')) {
  throw new Error('V2 Figma observation must identify the official Figma MCP capture method');
}
if (!Array.isArray(liveEvidence.pageInventory?.mcpRequestIds)
  || liveEvidence.pageInventory.mcpRequestIds.length === 0
  || new Set(liveEvidence.pageInventory.mcpRequestIds).size !== liveEvidence.pageInventory.mcpRequestIds.length
  || liveEvidence.pageInventory.permanentPageCount !== 104
  || liveEvidence.pageInventory.legacyPageCount !== 13) {
  throw new Error('V2 Figma observation requires request-backed 104-page and 13-legacy-page inventory evidence');
}
for (const key of ['canonicalVariables', 'localStyles', 'libraries', 'legacyComponentSweep', 'componentRegistry']) {
  if (!liveEvidence[key] || typeof liveEvidence[key] !== 'object') {
    throw new Error(`V2 Figma observation is missing ${key} evidence`);
  }
}
const retiredSweep = liveEvidence.retiredLegacyVariableSweep;
const retiredVariableIds = ['VariableID:9:10', 'VariableID:9:11', 'VariableID:9:12', 'VariableID:9:13'];
const retiredVariableNames = [
  'organization/parent',
  'organization/commercial-arm',
  'organization/foundation',
  'organization/product/helling',
];
if (!retiredSweep?.mcpRequestId
  || canonicalCompact(retiredSweep.formerIds) !== canonicalCompact(retiredVariableIds)
  || canonicalCompact(retiredSweep.formerNames) !== canonicalCompact(retiredVariableNames)
  || !Array.isArray(retiredSweep.liveMatches)
  || retiredSweep.liveMatches.length !== 0) {
  throw new Error('Retired organization variables reappeared or lack official Figma MCP absence evidence');
}

const observedCollections = liveEvidence.canonicalVariables.collections;
const observedVariables = liveEvidence.canonicalVariables.variables;
if (!Array.isArray(liveEvidence.canonicalVariables.mcpRequestIds)
  || liveEvidence.canonicalVariables.mcpRequestIds.length === 0
  || new Set(liveEvidence.canonicalVariables.mcpRequestIds).size !== liveEvidence.canonicalVariables.mcpRequestIds.length
  || !Array.isArray(observedCollections) || observedCollections.length !== 9
  || !Array.isArray(observedVariables) || observedVariables.length !== 173) {
  throw new Error('V2 Figma observation requires exact records for 9 canonical collections and 173 variables');
}
const canonicalCollectionByName = new Map();
for (const collection of observedCollections) {
  if (!collection.name || !collection.id || canonicalCollectionByName.has(collection.name)) {
    throw new Error('V2 Figma observation contains an invalid or duplicate canonical collection');
  }
  canonicalCollectionByName.set(collection.name, collection);
}
for (const expected of variableApply.canonicalCollections) {
  const observed = canonicalCollectionByName.get(expected.name);
  if (!observed
    || observed.id !== expected.id
    || observed.variableCount !== expected.variableCount
    || canonicalCompact(observed.modes) !== canonicalCompact(expected.modes)) {
    throw new Error(`Canonical variable collection drift requires explicit migration: ${expected.name}`);
  }
}
const observedVariableByRef = new Map();
for (const variable of observedVariables) {
  if (!variable.ref || !variable.id || observedVariableByRef.has(variable.ref)) {
    throw new Error('V2 Figma observation contains an invalid or duplicate canonical variable');
  }
  observedVariableByRef.set(variable.ref, variable);
}
if (new Set(observedVariables.map((variable) => variable.id)).size !== 173) {
  throw new Error('V2 Figma observation contains duplicate canonical variable IDs');
}

const variableRegistry = {};
const variableRefsByCollection = new Map();
for (const collection of variableImport.collections) {
  const liveCollection = canonicalCollectionByName.get(collection.name);
  if (!liveCollection) throw new Error(`Missing live canonical collection ${collection.name}`);
  const refs = [];
  collection.variables.forEach((variable) => {
    const ref = `${collection.name}/${variable.name}`;
    const observed = observedVariableByRef.get(ref);
    if (!observed
      || observed.collection !== collection.name
      || observed.collectionId !== liveCollection.id
      || observed.name !== variable.name
      || observed.resolvedType !== variable.resolvedType) {
      throw new Error(`Canonical variable drift requires explicit migration: ${ref}`);
    }
    const entry = {
      ref,
      id: observed.id,
      collection: collection.name,
      collectionId: liveCollection.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      sourceFilePath: variable.sourceFilePath,
      tokenPath: variable.tokenPath,
      codeSyntax: variable.codeSyntax,
    };
    variableRegistry[ref] = entry;
    refs.push(ref);
  });
  variableRefsByCollection.set(collection.name, refs);
}

if (Object.keys(variableRegistry).length !== 173) throw new Error('Expected 173 canonical live variable entries');

const shellVariableRefs = [
  'Modes/surface/canvas',
  'Modes/content/primary',
  'Modes/content/secondary',
  'Modes/content/accent',
  'Modes/border/default',
  'Brand/brand/accent/signal',
  'Palette/color/neutral/void',
  'Palette/color/neutral/paper',
  'Palette/color/neutral/ash300',
  'Palette/color/neutral/ash700',
  'Palette/color/neutral/iron',
  'Typography/font/family/display',
  'Typography/font/family/body',
  'Typography/font/family/mono',
  'Typography/font/weight/regular',
  'Typography/font/weight/medium',
  'Typography/font/weight/bold',
  'Typography/font/weight/black',
  'Geometry/space/20',
  'Geometry/space/10',
  'Geometry/border/1',
  'Geometry/border/3',
];
for (const ref of shellVariableRefs) {
  if (!variableRegistry[ref]) throw new Error(`Missing shell variable ${ref}`);
}

const componentContractRegistry = {
  'local/signal-action': {
    source: 'local-existing',
    pageId: '30:2',
    nodeId: '30:281',
    componentKey: '8a7aaeb99f89230cd9083316790dc87e64f060a3',
    name: 'Signal Action',
    variantCount: 16,
    nestedFoundationRef: 'sds/button',
    codeSource: 'packages/ui/src/contract.json#components.signal-action',
  },
  'local/status-indicator': {
    source: 'local-existing',
    pageId: '34:2',
    nodeId: '34:185',
    componentKey: '99d2bbabdfd154acd8dc3103220377b03df78c19',
    name: 'Status Indicator',
    variantCount: 7,
    nestedFoundationRef: 'sds/tag',
    codeSource: 'packages/ui/src/contract.json#components.status-indicator',
  },
  'sds/button': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: 'cc8b558dc7d9684011b6b99ce8e6509399bc836b',
    liveImportedNodeId: '30:82',
    name: 'Button',
  },
  'sds/tag': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: '0fcd16616b41884b21451ffa4a2fc98a03093b49',
    liveImportedNodeId: '34:86',
    name: 'Tag',
  },
  'sds/card-slot': {
    source: 'Simple Design System',
    assetType: 'component',
    componentKey: '938ddbc1add07bdc6bbec6388327aa27d9d04868',
    name: 'Card (Slot)',
  },
  'sds/input-field': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: 'c28150b04d333d34ed9d2b77abd9f2f54e1a878a',
    name: 'Input Field',
  },
  'sds/select-field': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: 'b4d568282b67de741c52524b83888113e79a662c',
    name: 'Select Field',
  },
  'sds/navigation-pill-list': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: '868412c34424ea9c8439205c1cd8007b88d7ca7b',
    name: 'Navigation Pill List',
  },
  'sds/tabs': {
    source: 'Simple Design System',
    assetType: 'component',
    componentKey: 'b839f8a495ef7b0ef0a47ad1aefd6e05438825b5',
    name: 'Tabs',
  },
  'sds/accordion': {
    source: 'Simple Design System',
    assetType: 'component',
    componentKey: '82ffc91046aa70df8a12275baa65bdf5f0a674b0',
    name: 'Accordion',
  },
  'sds/dialog': {
    source: 'Simple Design System',
    assetType: 'component',
    componentKey: '050bf5b28eb08c43b117646b3e4b00c9db55c540',
    name: 'Dialog',
  },
  'sds/table': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: '57c258e682022e216d0b97fa50482d1307dca884',
    name: 'Table',
  },
  'sds/slider-field': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: '32e5ee1981237f506e8eba45d8f4835bcbb4e6cb',
    name: 'Slider Field',
  },
  'sds/checkbox-field': {
    source: 'Simple Design System',
    assetType: 'component_set',
    componentKey: 'e396597bb4eade21b593d15dc3b3a3f79a0048bf',
    name: 'Checkbox Field',
  },
};

const componentRegistry = {};
for (const [ref, contract] of Object.entries(componentContractRegistry)) {
  const observed = liveEvidence.componentRegistry[ref];
  if (!observed || observed.componentKey !== contract.componentKey) {
    throw new Error(`V2 Figma component observation drift or absence: ${ref}`);
  }
  for (const idKey of ['nodeId', 'liveImportedNodeId']) {
    if (contract[idKey] && observed[idKey] !== contract[idKey]) {
      throw new Error(`V2 Figma component node ID drift requires explicit migration: ${ref}/${idKey}`);
    }
  }
  componentRegistry[ref] = { ...contract, ...observed };
}

const componentRefsBySubject = {
  '00.01': ['sds/navigation-pill-list'],
  '07.00': ['sds/card-slot'],
  '08.09': ['local/signal-action', 'local/status-indicator', 'sds/button', 'sds/tag', 'sds/input-field', 'sds/select-field'],
  '09.00': ['local/signal-action', 'local/status-indicator', 'sds/button', 'sds/tag', 'sds/card-slot'],
  '09.01': ['sds/button', 'sds/tag', 'sds/card-slot', 'sds/input-field', 'sds/select-field', 'sds/slider-field'],
  '09.02': ['sds/button', 'sds/tag', 'sds/input-field', 'sds/select-field', 'sds/slider-field', 'sds/checkbox-field'],
  '09.03': ['local/signal-action', 'sds/button'],
  '09.04': ['local/status-indicator', 'sds/tag'],
  '09.05': ['sds/card-slot'],
  '09.06': ['sds/card-slot', 'sds/tag'],
  '09.07': ['sds/slider-field'],
  '09.08': ['sds/card-slot', 'sds/tabs'],
  '09.09': ['sds/card-slot'],
  '11.00': ['sds/card-slot'],
  '11.04': ['sds/card-slot', 'sds/tag'],
  '11.05': ['sds/card-slot'],
  '11.06': ['sds/slider-field'],
  '11.12': ['local/signal-action', 'local/status-indicator', 'sds/button', 'sds/tag', 'sds/card-slot', 'sds/input-field', 'sds/select-field', 'sds/navigation-pill-list', 'sds/tabs', 'sds/accordion', 'sds/dialog', 'sds/table', 'sds/slider-field', 'sds/checkbox-field'],
  '12.00': ['sds/table'],
  '12.04': ['sds/table'],
  '12.05': ['local/signal-action', 'local/status-indicator', 'sds/table'],
  '12.06': ['sds/table'],
  '12.07': ['local/signal-action', 'local/status-indicator', 'sds/navigation-pill-list', 'sds/accordion', 'sds/table'],
  '99.00': ['local/signal-action', 'local/status-indicator', 'sds/button', 'sds/tag'],
};

const plannedFamilyRefsBySubject = {
  '11.04': ['09.06'],
  '11.05': ['09.05'],
  '11.06': ['09.07'],
  '11.12': ['09.03', '09.04', '09.05', '09.06', '09.07', '09.08', '09.09'],
  '12.05': ['09.03', '09.04', '09.05', '09.06', '09.07', '09.08', '09.09'],
  '12.07': ['09.03', '09.04', '09.05', '09.06', '09.07', '09.08', '09.09'],
};

const componentBuildPolicies = {
  '09.05': 'SDS Card (Slot) wrapper only after the component API gap is verified',
  '09.06': 'local family only after the subscribed-library search is reconfirmed at build time',
  '09.07': 'SDS Slider Field wrapper only; host range behavior remains authoritative',
  '09.08': 'SDS Card (Slot) and Tabs composition wrapper only after API verification',
  '09.09': 'local noninteractive family only after the subscribed-library search is reconfirmed at build time',
};

const tokenSourceToCollection = {
  tokenPalette: 'Palette',
  tokenBrand: 'Brand',
  tokenTypography: 'Typography',
  tokenGeometry: 'Geometry',
  tokenMotion: 'Motion',
  tokenAtlas: 'Atlas',
  tokenMaterial: 'Material',
  tokenCapture: 'Capture',
  tokenModes: 'Modes',
};

const additionalCollectionsBySubject = {
  '01.00': ['Palette', 'Brand', 'Atlas'],
  '02.00': ['Palette', 'Brand'],
  '02.01': ['Palette', 'Brand'],
  '02.04': ['Palette', 'Brand'],
  '12.00': ['Palette', 'Brand', 'Typography', 'Geometry', 'Motion', 'Atlas', 'Material', 'Capture', 'Modes'],
  '12.01': ['Palette', 'Brand'],
  '12.02': ['Palette', 'Brand', 'Material'],
  '12.03': ['Geometry', 'Material'],
  '12.04': ['Palette', 'Brand', 'Typography', 'Geometry', 'Motion', 'Atlas', 'Material', 'Capture', 'Modes'],
  '12.05': ['Palette', 'Brand', 'Typography', 'Geometry', 'Motion', 'Atlas', 'Material', 'Capture', 'Modes'],
  '12.06': ['Palette', 'Brand', 'Typography', 'Geometry', 'Motion', 'Atlas', 'Material', 'Capture', 'Modes'],
  '12.07': ['Palette', 'Brand', 'Typography', 'Geometry', 'Motion', 'Atlas', 'Material', 'Capture', 'Modes'],
};

const legacyPages = [
  { temporaryId: '99.10', pageId: '0:1', name: '00 · Cover' },
  { temporaryId: '99.11', pageId: '12:2', name: '01 · Getting Started' },
  { temporaryId: '99.12', pageId: '12:3', name: '02 · Foundations' },
  { temporaryId: '99.13', pageId: '12:4', name: '02.1 · Color' },
  { temporaryId: '99.14', pageId: '12:5', name: '02.2 · Typography' },
  { temporaryId: '99.15', pageId: '12:6', name: '02.3 · Geometry' },
  { temporaryId: '99.16', pageId: '12:7', name: '02.4 · Motion + Atlas' },
  { temporaryId: '99.17', pageId: '12:8', name: '──────── COMPONENTS' },
  { temporaryId: '99.18', pageId: '12:9', name: '03 · Components' },
  { temporaryId: '99.19', pageId: '30:2', name: '03.1 · Signal Action' },
  { temporaryId: '99.20', pageId: '34:2', name: '03.2 · Status Indicator' },
  { temporaryId: '99.21', pageId: '12:10', name: '──────── UTILITIES' },
  { temporaryId: '99.22', pageId: '12:11', name: '04 · Utilities' },
];

const layerOrderBackToFront = [...exemplarPlan.sharedFrameContract.layerOrderBackToFront];
if (layerOrderBackToFront.length !== 11) throw new Error('Expected 11 native layers');

const categoryOrder = [...new Set(subjectManifest.subjects.map((subject) => subject.categoryId))];
const preservedSubjectIds = subjectManifest.subjects
  .map((subject) => subject.id)
  .filter((subjectId) => pageObservationById.get(subjectId).planAction === 'preserve-existing');
const categoryBatchId = new Map(categoryOrder.map((categoryId, index) => [categoryId, `B${String(index + 1).padStart(2, '0')}`]));
const batchSubjects = new Map(categoryOrder.map((categoryId) => [categoryId, subjectManifest.subjects
  .filter((subject) => subject.categoryId === categoryId && !preservedSubjectIds.includes(subject.id))
  .map((subject) => subject.id)]));

const batches = [
  {
    batchId: 'B00',
    name: 'Preserve explicitly observed current native roots',
    action: 'NO BUILD / NO MUTATION',
    subjectIds: preservedSubjectIds,
  },
  ...categoryOrder.map((categoryId, index) => ({
    batchId: categoryBatchId.get(categoryId),
    name: `${categoryId} / ${subjectManifest.subjects.find((subject) => subject.categoryId === categoryId).categoryName}`,
    action: 'follow observation classification; migration-required and conflicts remain blocked',
    predecessorBatchId: index === 0 ? 'B00' : categoryBatchId.get(categoryOrder[index - 1]),
    overviewFirst: true,
    subjectIds: batchSubjects.get(categoryId),
  })),
];

const slug = (value) => value.toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const primitiveStrategyByCategory = {
  '00': 'native entry field, navigation map, or authority flow with live type',
  '01': 'native hierarchy, recognition comparison, and bilingual live type',
  '02': 'governed identity assets with native measurement and verification overlays',
  '03': 'native variable-bound swatches and measured contrast annotations',
  '04': 'native editable gradients, masks, governed field geometry, and flat Signal treatment',
  '05': 'live type, baseline guides, and language-direction frames',
  '06': 'native vector geometry, grids, measurement guides, and responsive frames',
  '07': 'governed Atlas vectors plus native editable representation layers',
  '08': 'live state frames, timing labels, interactive component specimens, and reduced-motion proofs',
  '09': 'live local or SDS-backed component instances with host-native behavior labels',
  '10': 'native material studies, separations, masks, gradients, and evidence labels',
  '11': 'approved source-base reconstruction with native perspective, masks, live type, and governed artwork',
  '12': 'native release matrices, preflight tables, source links, and evidence fields',
  '99': 'locked reference index with immutable IDs, hashes, and classification labels',
};

const isVoidMode = (subject) => subject.id === '00.00' || ['04', '07', '10', '11'].includes(subject.categoryId);

const subjects = subjectManifest.subjects.map((subject) => {
  const content = contentById.get(subject.id);
  const page = pageById.get(subject.id);
  if (!content || !page) throw new Error(`Missing content or page mapping for ${subject.id}`);
  if (content.exactLabel !== subject.exactLabel || page.name !== subject.exactLabel) {
    throw new Error(`Exact name mismatch for ${subject.id}`);
  }

  const observed = pageObservationById.get(subject.id);
  const preserveExisting = observed.planAction === 'preserve-existing';
  const mode = isVoidMode(subject) ? 'void' : 'paper';
  const modeId = exemplarPlan.canonicalVariables.modeIds[mode];
  const directCollections = new Set(content.visualRecipe.sourceMappings
    .map((mapping) => tokenSourceToCollection[mapping.sourceId])
    .filter(Boolean));
  for (const collection of additionalCollectionsBySubject[subject.id] || []) directCollections.add(collection);
  const specimenVariableRefs = [...directCollections]
    .flatMap((collection) => variableRefsByCollection.get(collection) || [])
    .filter((ref) => !shellVariableRefs.includes(ref));
  const componentRefs = componentRefsBySubject[subject.id] || [];
  for (const ref of componentRefs) {
    if (!componentRegistry[ref]) throw new Error(`Unknown component ref ${ref} on ${subject.id}`);
  }

  const batchId = preserveExisting ? 'B00' : categoryBatchId.get(subject.categoryId);
  const orderedBatchSubjects = batches.find((batch) => batch.batchId === batchId).subjectIds;
  let reuseDecision = 'native-documentation-primitives';
  if (preserveExisting) reuseDecision = 'preserve-observed-current-native-root';
  else if (subject.id === '09.03' || subject.id === '09.04') reuseDecision = 'reuse-local-component-set-with-live-sds-foundation';
  else if (componentRefs.some((ref) => ref.startsWith('local/'))) reuseDecision = 'compose-existing-local-and-sds-assets';
  else if (componentRefs.length) reuseDecision = 'reuse-or-wrap-sds';

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    exactPageName: subject.exactLabel,
    kind: subject.kind,
    categoryId: subject.categoryId,
    categoryName: subject.categoryName,
    anatomyType: subject.anatomyType,
    liveFigmaPage: {
      pageNodeId: page.pageId,
      name: observed.name,
      observedChildCount: observed.observedChildCount,
      classification: observed.classification,
      populationStatus: observed.classification,
      planAction: observed.planAction,
      recoveryArtifactRef: observed.recoveryArtifactRef || null,
      targetFrame: observed.activeRoot ? {
        nodeId: observed.activeRoot.nodeId,
        name: observed.activeRoot.name,
        rect: observed.activeRoot.rect,
        populationRevision: observed.activeRoot.pluginData.population_revision,
        contractType: observed.currentContractType,
        adoptionReceiptRef: observed.currentContractType === 'receipt-adopted'
          ? 'governance/design-ledgers/figma/bizarre-figma-v2-01.03-preserved-root-adoption.json'
          : null,
      } : observed.classification === 'empty' ? {
        nodeId: null,
        nullReason: 'the live permanent page is empty',
        plannedName: '01 / FIGMA NATIVE — EDITABLE MASTER',
        plannedRect: { x: 1600, y: 0, width: subject.artboard.widthPx, height: subject.artboard.minimumHeightPx },
      } : {
        nodeId: null,
        nullReason: 'the live page has unmanaged content; no target frame may be inferred',
      },
    },
    mode: {
      collection: 'Modes',
      collectionId: canonicalCollectionByName.get('Modes').id,
      name: mode,
      modeId,
      ruleRef: 'contracts/modeAssignment',
    },
    dimensions: {
      widthPx: subject.artboard.widthPx,
      minimumHeightPx: subject.artboard.minimumHeightPx,
      heightStrategy: subject.artboard.heightStrategy,
      dpi: subject.artboard.dpi,
    },
    layout: {
      templateId: subject.anatomyType === 'overview' ? 'overview-v2' : 'detail-v2',
      sectionCount: content.requiredSectionOrder.length,
      sections: content.requiredSectionOrder,
      panelGrid: {
        columns: 2,
        rows: Math.ceil(content.requiredSectionOrder.length / 2),
        panelWidthPx: 620,
        columnX: [80, 740],
        columnGapPx: 40,
        rowGapPx: 30,
      },
      specimenStartYPx: 430,
      anatomyStartYExpression: 'max(430, specimenEnd + 100)',
      layerContractRef: 'contracts/layers/backToFront',
    },
    nativeSpecimen: {
      typeId: `native.${subject.id}.${slug(subject.name)}`,
      primitiveStrategy: subject.anatomyType === 'overview'
        ? `overview navigation matrix with representative child samples; ${primitiveStrategyByCategory[subject.categoryId]}`
        : primitiveStrategyByCategory[subject.categoryId],
      recipeId: content.visualRecipe.recipeId,
      contentFingerprint: content.contentFingerprint,
      editableNativeOnly: true,
      graphicsGeneration: 'none for this population plan',
      smoothGeometryContractRef: content.visualRecipe.sourceMappings.some((mapping) => mapping.sourceId === 'aperture') || subject.id === '06.01'
        ? 'contracts/smoothGeometry'
        : null,
    },
    reuse: {
      decision: reuseDecision,
      componentRefs,
      plannedFamilySubjectRefs: plannedFamilyRefsBySubject[subject.id] || [],
      newComponentPolicy: componentBuildPolicies[subject.id] || 'no new component; use native page primitives or the listed existing assets',
      preserveExistingIds: componentRefs
        .map((ref) => componentRegistry[ref])
        .filter((entry) => entry.liveImportedNodeId || entry.nodeId)
        .flatMap((entry) => [entry.nodeId, entry.liveImportedNodeId].filter(Boolean)),
    },
    exactVariables: {
      shellRefs: shellVariableRefs,
      specimenCollectionRefs: [...directCollections],
      specimenRefs: specimenVariableRefs,
      registryRef: 'variableRegistry',
      modeRef: `Modes/${mode}`,
    },
    provenanceAndStatus: {
      manifestCanonicalSha256: subjectManifest.canonicalSha256,
      manifestStatus: content.governance.inheritedManifestStatus,
      authorityStatus: content.governance.authorityStatus,
      verificationStatus: content.governance.verificationStatus,
      publicationStatus: content.governance.publicationStatus,
      publishable: content.governance.publishable,
      approvalRef: content.governance.approvalRef,
      promotionApprovalRef: content.governance.promotionApprovalRef,
      usesProvisionalInputs: content.governance.usesProvisionalInputs,
      usesRejectedInputs: content.governance.usesRejectedInputs,
      evidenceRefs: content.governance.evidenceRefs,
      evidenceAbsenceReason: content.governance.evidenceAbsenceReason,
    },
    affinityDependency: {
      documentName: subjectManifest.affinity.filename,
      artboardExactLabel: subject.exactLabel,
      recipeId: content.visualRecipe.recipeId,
      conceptReferenceIds: content.visualRecipe.allowedConceptReferenceIds,
      sourceDependencies: content.visualRecipe.sourceMappings.map((mapping) => ({
        sourceId: mapping.sourceId,
        path: mapping.path,
        sha256: mapping.sha256,
        classification: mapping.classification,
      })),
      exportDependency: {
        publicationStatus: content.governance.publicationStatus,
        usesProvisionalInputs: content.governance.usesProvisionalInputs,
        usesRejectedInputs: content.governance.usesRejectedInputs,
        verificationStatus: content.governance.verificationStatus,
        requiredEvidenceRefs: content.governance.evidenceRefs,
      },
    },
    buildBatch: {
      batchId,
      orderInBatch: orderedBatchSubjects.indexOf(subject.id) + 1,
      action: preserveExisting ? 'preserve observed current root' : observed.planAction,
    },
  };
});

const plan = {
  schemaVersion: 2,
  planId: 'bizarre-104-page-population-plan-v2',
  planVersion: '2.0.0',
  title: 'Bizarre Industries / deterministic Figma v2 population and reuse matrix',
  canonicalSha256: null,
  scope: {
    figmaFileKey: subjectManifest.figma.fileKey,
    mutationStatus: 'READ_ONLY PLAN / FIGMA UNCHANGED',
    executionSurface: 'official Figma MCP only',
    computerUse: 'forbidden for this task',
    graphicsGeneration: 'none',
    permanentSubjectCount: subjects.length,
    emptyPermanentPageCount: subjects.filter((subject) => subject.liveFigmaPage.observedChildCount === 0).length,
    populatedPermanentPageCount: subjects.filter((subject) => subject.liveFigmaPage.observedChildCount > 0).length,
    preservedPermanentPageCount: subjects.filter((subject) => subject.liveFigmaPage.planAction === 'preserve-existing').length,
    migrationRequiredCount: subjects.filter((subject) => subject.liveFigmaPage.planAction === 'migration-required').length,
    unmanagedConflictCount: subjects.filter((subject) => subject.liveFigmaPage.planAction === 'block-unmanaged-conflict').length,
    overviewCount: subjects.filter((subject) => subject.anatomyType === 'overview').length,
    detailCount: subjects.filter((subject) => subject.anatomyType === 'detail').length,
  },
  sources,
  liveFigmaEvidence: observation.liveFigmaEvidence,
  preservation: {
    policy: 'preserve every legacy page, local component set, nested SDS instance, variable binding, node ID, and every observed current native root explicitly marked preserve-existing',
    prohibitedByThisPlan: ['rename', 'move', 'detach', 'delete', 'unpublish', 'rebind', 'restyle'],
    legacyPages,
    preservedCurrentRootSubjectIds: preservedSubjectIds,
    existingLocalComponentRefs: ['local/signal-action', 'local/status-indicator'],
    existingNestedSdsRefs: ['sds/button', 'sds/tag'],
  },
  contracts: {
    targetFrame: {
      name: '01 / FIGMA NATIVE — EDITABLE MASTER',
      x: 1600,
      y: 0,
      widthPx: 1440,
      heightSource: 'subject.artboard.minimumHeightPx',
      clipContent: true,
      cornerRadius: 0,
    },
    layers: {
      backToFront: layerOrderBackToFront,
      count: layerOrderBackToFront.length,
      referenceLayerLockedAfterBuild: true,
    },
    modeAssignment: {
      source: 'production/affinity/build-bizarre-masterbrand-library-v1-staged.js#isDarkSubject',
      voidWhen: ['subjectId=00.00', 'categoryId=04', 'categoryId=07', 'categoryId=10', 'categoryId=11'],
      paperOtherwise: true,
      allowedPrimaryModes: [
        { name: 'void', modeId: exemplarPlan.canonicalVariables.modeIds.void },
        { name: 'paper', modeId: exemplarPlan.canonicalVariables.modeIds.paper },
      ],
      additionalProofModes: canonicalCollectionByName.get('Modes').modes
        .filter((mode) => !['void', 'paper'].includes(mode.name)),
    },
    layoutTemplates: {
      'overview-v2': {
        sectionCount: 8,
        columns: 2,
        rows: 4,
        purpose: 'category navigation, status, dependencies, rules, distance checks, and source references',
      },
      'detail-v2': {
        sectionCount: 12,
        columns: 2,
        rows: 6,
        purpose: 'construction, exact sources, variants, usage, access, motion, production, misuse, provenance, and navigation',
      },
    },
    smoothGeometry: {
      semanticId: 'smooth-tangent-continuous-asymmetric-oval',
      figmaPrimitive: 'ELLIPSE',
      required: ['closed smooth oval', 'tangent continuity at every point', 'broad orbital compression', 'external material depth remains outside the opening', 'round caps', 'round joins'],
      forbiddenOutlineEvents: ['sharp edge', 'corner', 'polygonal join', 'clipped wedge', 'straight segment', 'key cut', 'miter join'],
    },
    componentReusePriority: ['existing local component', 'subscribed SDS component', 'SDS wrapper after API-gap verification', 'local component only after a repeated library search proves no mature match'],
  },
  componentRegistry,
  variableRegistry,
  batches,
  subjects,
};

const hashable = structuredClone(plan);
delete hashable.canonicalSha256;
plan.canonicalSha256 = sha256(canonicalCompact(hashable));
await writeFile(outputPath, canonicalJson(plan));

process.stdout.write(`${outputPath.pathname}\n${plan.canonicalSha256}\n`);
