#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContinuousLensR20Geometry,
  CONTINUOUS_LENS_R20_REVISION,
  continuousLensR20ConceptForSubject,
  createContinuousLensR20Figma,
} from './lib/continuous-lens-r20.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const args = process.argv.slice(2);
const subjectId = args[0] && !args[0].startsWith('--') ? args[0] : null;
const readFlag = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
};
const planInput = readFlag('--plan');
const specInput = readFlag('--spec');
const allowFrozenV1 = args.includes('--allow-frozen-v1');

if (!subjectId || !planInput || !specInput) {
  throw new Error(
    'Usage: node scripts/build-figma-subject-population-code.mjs <subject-id> '
    + '--plan <v2-plan.json> --spec <v2-content-spec.json>',
  );
}

const resolveInput = (input) => (path.isAbsolute(input) ? input : path.join(root, input));
const readRequired = (input, kind) => {
  const resolved = resolveInput(input);
  if (!fs.existsSync(resolved)) throw new Error(`MISSING_REQUIRED_${kind}:${input}`);
  return { resolved, bytes: fs.readFileSync(resolved) };
};
const planFile = readRequired(planInput, 'V2_PLAN');
const specFile = readRequired(specInput, 'V2_SPEC');
const plan = JSON.parse(planFile.bytes.toString('utf8'));
const spec = JSON.parse(specFile.bytes.toString('utf8'));
const gradientManifest = JSON.parse(fs.readFileSync(path.join(root, 'production/affinity/manifests/bizarre-gradient-recipes-v1.json'), 'utf8'));

const frozenV1 = plan.planId === 'bizarre-104-page-population-plan-v1'
  && spec.specVersion === '1.0.0';
if (frozenV1) {
  if (!allowFrozenV1) throw new Error('FROZEN_V1_INPUT_REQUIRES_EXPLICIT_ALLOW_FLAG');
  const frozenHashes = {
    plan: 'de0aeeb578e274b1f37a16f4f2b6c97f3c515245434e294ff0b98680820e0d4c',
    spec: 'd7ce1d97cfbcc9110a9bf39ea124ba4e04cdcdf289f933e6e32cb09e9d64cd31',
  };
  if (crypto.createHash('sha256').update(planFile.bytes).digest('hex') !== frozenHashes.plan
    || crypto.createHash('sha256').update(specFile.bytes).digest('hex') !== frozenHashes.spec) {
    throw new Error('FROZEN_V1_INPUT_HASH_DRIFT');
  }
} else {
  if (plan.schemaVersion !== 2
    || plan.planId !== 'bizarre-104-page-population-plan-v2'
    || plan.planVersion !== '2.0.0'
    || spec.specVersion !== '2.0.0') {
    throw new Error('V2_PLAN_SPEC_PAIR_REQUIRED');
  }
  const specSource = plan.sources?.find((source) => source.sourceId === 'affinity-content-spec');
  const specSha256 = crypto.createHash('sha256').update(specFile.bytes).digest('hex');
  if (!specSource || specSource.fileSha256 !== specSha256) {
    throw new Error('V2_PLAN_SPEC_SOURCE_HASH_DRIFT');
  }
}

const planned = plan.subjects.find((subject) => subject.subjectId === subjectId);
const content = spec.subjects.find((subject) => subject.subjectId === subjectId);
if (!planned || !content) throw new Error(`Unknown subject: ${subjectId}`);
if (!frozenV1 && planned.liveFigmaPage.planAction === 'migration-required') {
  throw new Error(`MIGRATION_REQUIRED:${subjectId}`);
}
if (!frozenV1 && planned.liveFigmaPage.planAction === 'block-unmanaged-conflict') {
  throw new Error(`UNMANAGED_PAGE_CONFLICT:${subjectId}`);
}
if (planned.exactPageName !== content.exactLabel) throw new Error(`Page/label drift for ${subjectId}`);
if (planned.subjectName !== content.subjectName) throw new Error(`Subject-name drift for ${subjectId}`);
if (planned.nativeSpecimen.contentFingerprint !== content.contentFingerprint) throw new Error(`Content fingerprint drift for ${subjectId}`);
if (JSON.stringify(planned.layout.sections) !== JSON.stringify(content.requiredSectionOrder)) throw new Error(`Section-order drift for ${subjectId}`);

const assetPaths = {
  markInverse: 'packages/assets/logo/mark-inverse.svg',
  markPrimary: 'packages/assets/logo/mark-primary.svg',
  markTransparent: 'packages/assets/logo/mark-transparent.svg',
  aperture: 'packages/atlas/generated/calibrated-aperture.svg',
  atlasBands: 'packages/atlas/generated/atlas-bands.svg',
  atlasContours: 'packages/atlas/generated/atlas-contours-large.svg',
  atlasDots: 'packages/atlas/generated/atlas-dots-large.svg',
  atlasHatch: 'packages/atlas/generated/atlas-hatch-large.svg',
  atlasMicro: 'packages/atlas/generated/atlas-micro.svg',
  atlasSpectral: 'packages/atlas/generated/atlas-spectral-large.svg',
  captureSequence: 'packages/atlas/generated/capture-sequence.svg',
  instrumentDial: 'packages/atlas/generated/instrument-dial.svg',
  liveryStrip: 'packages/atlas/generated/livery-strip.svg'
};

const atlasSourcePage = {
  pageNodeId: '47:46',
  exactPageName: '07.01 · Field Source & Provenance'
};

const atlasSourcePaths = {
  atlasSpectral: 'packages/atlas/generated/atlas-spectral.svg',
  atlasSpectralLarge: 'packages/atlas/generated/atlas-spectral-large.svg',
  atlasBands: 'packages/atlas/generated/atlas-bands.svg',
  atlasContoursDark: 'packages/atlas/generated/atlas-contours-dark.svg',
  atlasContoursLight: 'packages/atlas/generated/atlas-contours-light.svg',
  atlasContoursLarge: 'packages/atlas/generated/atlas-contours-large.svg',
  atlasDots: 'packages/atlas/generated/atlas-dots.svg',
  atlasDotsLarge: 'packages/atlas/generated/atlas-dots-large.svg',
  atlasHatch: 'packages/atlas/generated/atlas-hatch.svg',
  atlasHatchLarge: 'packages/atlas/generated/atlas-hatch-large.svg',
  atlasMicro: 'packages/atlas/generated/atlas-micro.svg',
  aperture: 'packages/atlas/generated/calibrated-aperture.svg'
};

const atlasSourcesBySubject = {
  '07.00': ['atlasSpectralLarge', 'atlasContoursLarge', 'atlasDotsLarge', 'atlasHatchLarge'],
  '07.01': Object.keys(atlasSourcePaths),
  '07.02': ['atlasSpectralLarge', 'atlasSpectral', 'aperture'],
  '07.03': ['atlasBands', 'atlasSpectral'],
  '07.04': ['atlasContoursDark', 'atlasContoursLight', 'atlasContoursLarge'],
  '07.05': ['atlasSpectralLarge', 'atlasContoursLarge', 'aperture'],
  '07.06': ['atlasDotsLarge', 'atlasDots', 'atlasContoursLarge'],
  '07.07': ['atlasHatchLarge', 'atlasHatch'],
  '07.08': ['atlasDotsLarge', 'atlasContoursLarge', 'atlasSpectralLarge', 'aperture'],
  '07.09': ['atlasSpectralLarge', 'atlasContoursLarge', 'aperture'],
  '07.10': ['atlasContoursLarge', 'atlasHatchLarge', 'atlasDotsLarge', 'aperture'],
  '07.11': ['atlasMicro', 'atlasContoursDark', 'atlasContoursLarge']
};

const atlasConceptPaths = {
  '07.05': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.05-shaded-contour-continuous-lens-v2.png',
  '07.08': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.08-field-grain-continuous-lens-v2.png',
  '07.09': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.09-material-response-continuous-lens-v2.png',
  '07.10': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.10-one-color-continuous-lens-v2.png'
};

function atlasSourceDefinition(id) {
  const relativePath = atlasSourcePaths[id];
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return {
    id,
    sourcePath: relativePath,
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
    width: Number(source.match(/<svg[^>]*\bwidth="([0-9.]+)"/)?.[1]),
    height: Number(source.match(/<svg[^>]*\bheight="([0-9.]+)"/)?.[1]),
    authorityStatus: 'governed-provisional',
    verificationStatus: 'NOT VERIFIED',
    publicationStatus: 'nonpublishable'
  };
}

function atlasConceptDefinition(id) {
  const relativePath = atlasConceptPaths[id];
  if (!relativePath) return null;
  const bytes = fs.readFileSync(path.join(root, relativePath));
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Concept reference is not a PNG: ${relativePath}`);
  return {
    id: `concept.atlas.${id}`,
    sourcePath: relativePath,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    authorityStatus: 'owner-selected-direction',
    verificationStatus: 'NOT VERIFIED',
    publicationStatus: 'nonpublishable'
  };
}

const conceptReference = planned.categoryId === '07' ? atlasConceptDefinition(planned.subjectId) : null;
const continuousLensConcept = continuousLensR20ConceptForSubject(planned.subjectId, {
  conceptReference,
  materialRecipe: gradientManifest.recipes.find((recipe) => recipe.subjectId === '04.02'),
});

function requiredAssets(subject) {
  const ids = [];
  if (subject.subjectId === '00.00') ids.push('markInverse');
  if (subject.categoryId === '02') ids.push('markInverse', 'markPrimary', 'markTransparent');
  if (subject.categoryId === '06') {
    if (subject.subjectId === '06.07') ids.push('instrumentDial');
    else ids.push('aperture');
  }
  // Atlas vectors are staged once through official Figma MCP on 07.01 and cloned
  // by exact tagged source ID. Embedding their 50–139 KB XML here exceeds the
  // official 50,000-character use_figma limit and invites accidental simplification.
  if (subject.categoryId === '08') ids.push('captureSequence');
  if (subject.subjectId === '09.07' || subject.subjectId === '11.06') ids.push('instrumentDial');
  if (subject.subjectId === '11.09' || subject.subjectId === '11.10' || subject.subjectId === '11.11') ids.push('liveryStrip');
  if (subject.subjectId === '11.03' || subject.subjectId === '11.04' || subject.subjectId === '11.05' || subject.subjectId === '11.08') ids.push('markInverse');
  return [...new Set(ids.filter(Boolean))];
}

const compactSvg = (source) => source
  .replace(/>\s+</g, '><')
  .replace(/\s{2,}/g, ' ')
  .trim();
const assets = Object.fromEntries(requiredAssets(planned).map((id) => [
  id,
  compactSvg(fs.readFileSync(path.join(root, assetPaths[id]), 'utf8'))
]));

const sections = content.requiredSectionOrder.map((title) => {
  const entry = content.sections[title];
  if (!entry) throw new Error(`Missing ${subjectId} section: ${title}`);
  return {
    title,
    status: entry.status,
    body: entry.content ?? entry.reason ?? ''
  };
});

const generatedPopulationRevision = continuousLensConcept
  ? `figma-native-104-v${plan.planVersion}-${CONTINUOUS_LENS_R20_REVISION}`
  : `figma-native-104-v${plan.planVersion}`;
const payload = {
  populationRevision: planned.liveFigmaPage.classification === 'managed-current'
    ? planned.liveFigmaPage.targetFrame.populationRevision
    : generatedPopulationRevision,
  planId: plan.planId,
  planVersion: plan.planVersion,
  planCanonicalSha256: plan.canonicalSha256,
  specCanonicalSha256: spec.canonicalSha256,
  manifestCanonicalSha256: planned.provenanceAndStatus.manifestCanonicalSha256,
  batchId: planned.buildBatch.batchId,
  subjectId: planned.subjectId,
  subjectName: planned.subjectName,
  exactPageName: planned.exactPageName,
  pageNodeId: planned.liveFigmaPage.pageNodeId,
  observedPageState: {
    classification: planned.liveFigmaPage.classification,
    observedChildCount: planned.liveFigmaPage.observedChildCount,
    activeRootId: planned.liveFigmaPage.targetFrame.nodeId,
    contractType: planned.liveFigmaPage.targetFrame.contractType,
    adoptionReceiptRef: planned.liveFigmaPage.targetFrame.adoptionReceiptRef,
  },
  categoryId: planned.categoryId,
  categoryName: planned.categoryName,
  anatomyType: planned.anatomyType,
  kind: planned.kind,
  minimumHeightPx: planned.dimensions.minimumHeightPx,
  mode: planned.mode,
  layerOrder: plan.contracts.layers.backToFront,
  sections,
  contentFingerprint: content.contentFingerprint,
  recipeId: content.visualRecipe.recipeId,
  visualRecipe: {
    recipeId: content.visualRecipe.recipeId,
    focalSpecimen: content.visualRecipe.focalSpecimen,
    composition: content.visualRecipe.composition
  },
  exactVariables: planned.categoryId === '03' ? { specimenRefs: planned.exactVariables.specimenRefs } : null,
  reuse: planned.categoryId === '09' ? planned.reuse : null,
  componentRegistry: planned.categoryId === '09'
    ? Object.fromEntries(planned.reuse.componentRefs.map((ref) => [ref, plan.componentRegistry[ref]]).filter(([, value]) => value))
    : null,
  gradientRecipes: planned.categoryId === '04'
    ? (planned.subjectId === '04.00'
      ? gradientManifest.recipes
      : gradientManifest.recipes.filter((recipe) => recipe.subjectId === planned.subjectId))
    : null,
  gradientGlobalRules: planned.categoryId === '04' ? gradientManifest.globalRules : null,
  provenanceAndStatus: planned.provenanceAndStatus,
  conceptReferenceIds: planned.affinityDependency.conceptReferenceIds,
  rendererId: continuousLensConcept ? '07-concept' : planned.categoryId,
  atlasSourcePage: planned.categoryId === '07' ? atlasSourcePage : null,
  atlasSources: planned.categoryId === '07'
    ? (atlasSourcesBySubject[planned.subjectId] || []).map(atlasSourceDefinition)
    : null,
  conceptReference,
  continuousLensConcept,
  assets
};

async function populateBizarreSubject(P) {
  const NS = 'bizarre.masterbrand';
  const STYLE_NAMES = [
    'Display/H1 Hero', 'Display/H2', 'Industrial/H3', 'Industrial/H4', 'Heading/H5',
    'Label/Eyebrow', 'Body/Base', 'Body/Lead', 'Caption/Base', 'Code/Base',
    'Technical/Label', 'Data/Micro', 'Provisional Arabic/Display/Heading',
    'Provisional Arabic/Body/Base', 'Provisional Arabic/Technical/Label'
  ];
  const FALLBACK = {
    signal: '#C6FF24', signalInk: '#526E00', void: '#0E0E0E', black: '#050505',
    paper: '#F9F8F2', bone: '#E8E4D8', ash100: '#E2E1DA', ash300: '#B8B7B0',
    ash500: '#777773', ash700: '#444441', ash900: '#232321', iron: '#2D2F31',
    cyan: '#58DBE8', blue: '#4B6FFF', indigo: '#322A8C', violet: '#7F49B7',
    crimson: '#C23A53', amber: '#E19A38', gold: '#F0C75E', teal: '#3E8D87',
    success: '#46B36B', warning: '#D89B2B', danger: '#D84A4A', info: '#4C80D8'
  };
  const LAYER_BY_SECTION = {
    'Definition': '20 / Canonical Assets',
    'Construction and source': '10 / Construction',
    'Exact tokens, assets, styles, or material recipe': '20 / Canonical Assets',
    'Variants, modes, states, and optical sizes': '50 / Variants, States, and Optical Sizes',
    'Usage': '60 / Usage and Applications',
    'Accessibility, bilingual behavior, and RTL': '70 / Accessibility, Bilingual, RTL, and Motion',
    'Motion and interaction': '70 / Accessibility, Bilingual, RTL, and Motion',
    'Production and export': '80 / Production and Export',
    'Correct examples': '90 / Correct Use and Misuse',
    'Misuse': '90 / Correct Use and Misuse',
    'Provenance, hashes, status, and evidence': '99 / Provenance, Status, Evidence, and Navigation',
    'Parent and sibling links plus canonical source paths': '99 / Provenance, Status, Evidence, and Navigation',
    'Purpose and recognition role': '20 / Canonical Assets',
    'Child navigation with every child ID and exact name': '99 / Provenance, Status, Evidence, and Navigation',
    'When-to-use matrix': '60 / Usage and Applications',
    'Status matrix': '99 / Provenance, Status, Evidence, and Navigation',
    'Dependencies': '10 / Construction',
    'Rules and anti-patterns': '90 / Correct Use and Misuse',
    'Far, normal, and close examples': '50 / Variants, States, and Optical Sizes',
    'Change log and source references': '99 / Provenance, Status, Evidence, and Navigation'
  };

  const rgb = (hex) => {
    const value = hex.replace('#', '');
    return { r: parseInt(value.slice(0, 2), 16) / 255, g: parseInt(value.slice(2, 4), 16) / 255, b: parseInt(value.slice(4, 6), 16) / 255 };
  };
  const solid = (hex, opacity = 1) => ({ type: 'SOLID', color: rgb(hex), opacity });
  const tag = (node, values) => {
    for (const [key, value] of Object.entries(values)) node.setSharedPluginData(NS, key, String(value ?? ''));
  };
  const setStroke = (node, paint, weight = 1) => {
    node.strokes = [paint];
    node.strokeWeight = weight;
  };

  const page = await figma.getNodeByIdAsync(P.pageNodeId);
  if (!page || page.type !== 'PAGE') throw new Error(`PAGE_NOT_FOUND:${P.pageNodeId}`);
  if (page.name !== P.exactPageName) throw new Error(`PAGE_NAME_DRIFT:${page.name}`);
  await figma.setCurrentPageAsync(page);
  if (page.children.length !== P.observedPageState.observedChildCount) {
    throw new Error(`OBSERVATION_CHILD_COUNT_DRIFT:${page.children.length}`);
  }

  const prior = page.findOne((node) => node.type === 'FRAME' && node.getSharedPluginData(NS, 'entity') === 'subject-master');
  if (P.observedPageState.classification === 'managed-current'
    && (!prior || prior.id !== P.observedPageState.activeRootId)) {
    throw new Error(`OBSERVATION_ACTIVE_ROOT_DRIFT:${prior?.id || 'missing'}`);
  }
  if (prior) {
    const expectedPlanId = P.observedPageState.contractType === 'receipt-adopted' ? '' : P.planId;
    const current = prior.getSharedPluginData(NS, 'subject_id') === P.subjectId
      && prior.getSharedPluginData(NS, 'content_fingerprint') === P.contentFingerprint
      && prior.getSharedPluginData(NS, 'recipe_id') === P.recipeId
      && prior.getSharedPluginData(NS, 'manifest_sha256') === P.manifestCanonicalSha256
      && prior.getSharedPluginData(NS, 'spec_sha256') === P.specCanonicalSha256
      && prior.getSharedPluginData(NS, 'population_revision') === P.populationRevision
      && prior.getSharedPluginData(NS, 'authority_status') === P.provenanceAndStatus.authorityStatus
      && prior.getSharedPluginData(NS, 'verification_status') === P.provenanceAndStatus.verificationStatus
      && prior.getSharedPluginData(NS, 'publication_status') === P.provenanceAndStatus.publicationStatus
      && prior.getSharedPluginData(NS, 'build_status') === 'complete'
      && prior.getSharedPluginData(NS, 'plan_id') === expectedPlanId;
    if (current) return {
      status: 'skipped-current',
      subjectId: P.subjectId,
      pageId: page.id,
      masterId: prior.id,
      createdNodeIds: [],
      mutatedNodeIds: [],
      preservedNodeIds: [page.id, prior.id],
    };
    throw new Error(`STALE_OWNED_MASTER:${prior.id}`);
  }
  const allowedAtlasLibrary = P.subjectId === '07.01'
    ? page.children.filter((node) => node.type === 'FRAME' && node.getSharedPluginData(NS, 'entity') === 'atlas-source-library')
    : [];
  const conflictingChildren = page.children.filter((node) => !allowedAtlasLibrary.includes(node));
  if (conflictingChildren.length !== 0) throw new Error(`NONEMPTY_PAGE_CONFLICT:${conflictingChildren.map((node) => `${node.id}:${node.name}`).join(',')}`);

  const allStyles = await figma.getLocalTextStylesAsync();
  const styles = new Map(allStyles.map((style) => [style.name, style]));
  const missingStyles = STYLE_NAMES.filter((name) => !styles.has(name));
  if (missingStyles.length) throw new Error(`MISSING_TEXT_STYLES:${missingStyles.join(',')}`);
  const loadedFonts = new Set();
  for (const name of STYLE_NAMES) {
    const fontName = styles.get(name).fontName;
    const key = `${fontName.family}/${fontName.style}`;
    if (!loadedFonts.has(key)) {
      await figma.loadFontAsync(fontName);
      loadedFonts.add(key);
    }
  }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
  const collectionNameById = new Map(collections.map((collection) => [collection.id, collection.name]));
  const variables = await figma.variables.getLocalVariablesAsync();
  const variableByRef = new Map();
  for (const variable of variables) variableByRef.set(`${collectionNameById.get(variable.variableCollectionId)}/${variable.name}`, variable);

  const boundSolid = (ref, fallback, opacity = 1) => {
    let paint = solid(fallback, opacity);
    const variable = variableByRef.get(ref);
    if (variable && variable.resolvedType === 'COLOR') paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
    return paint;
  };
  const resolvedColor = (ref, fallback, consumer) => {
    const variable = variableByRef.get(ref);
    if (!variable || variable.resolvedType !== 'COLOR') return rgb(fallback);
    const result = variable.resolveForConsumer(consumer);
    return result && result.value && typeof result.value === 'object' ? result.value : rgb(fallback);
  };
  const gradient = (stops, consumer, angle = 0) => {
    const radians = angle * Math.PI / 180;
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[c, s, (1 - c - s) / 2], [-s, c, (1 + s - c) / 2]],
      gradientStops: stops.map((stop) => ({
        position: stop.position,
        color: { ...resolvedColor(stop.ref, stop.fallback, consumer), a: stop.opacity ?? 1 }
      }))
    };
  };

  const makeText = async ({ text, style, colorRef, color, width, align = 'LEFT', name }) => {
    const node = figma.createText();
    node.name = name || text.slice(0, 48);
    const textStyle = styles.get(style);
    if (typeof node.setTextStyleIdAsync === 'function') await node.setTextStyleIdAsync(textStyle.id);
    else node.textStyleId = textStyle.id;
    node.resize(width, 20);
    node.characters = text;
    node.textAutoResize = 'HEIGHT';
    node.textAlignHorizontal = align;
    node.fills = [colorRef ? boundSolid(colorRef, color || FALLBACK.void) : solid(color || FALLBACK.void)];
    return node;
  };
  const addText = async (parent, options, x, y) => {
    const node = await makeText(options);
    parent.appendChild(node);
    node.x = x;
    node.y = y;
    return node;
  };
  const addRect = (parent, { x, y, width, height, fill, stroke, strokeWeight = 1, radius = 0, name }) => {
    const node = figma.createRectangle();
    node.name = name || 'Rectangle';
    node.resize(width, height);
    node.x = x;
    node.y = y;
    node.fills = fill ? [fill] : [];
    if (stroke) setStroke(node, stroke, strokeWeight);
    node.cornerRadius = radius;
    parent.appendChild(node);
    return node;
  };
  const addLine = (parent, { x, y, width, rotation = 0, stroke, weight = 1, dash, name }) => {
    const node = figma.createLine();
    node.name = name || 'Measurement line';
    node.resize(width, 0);
    node.x = x;
    node.y = y;
    node.rotation = rotation;
    node.strokes = [stroke];
    node.strokeWeight = weight;
    node.strokeCap = 'ROUND';
    if (dash) node.dashPattern = dash;
    parent.appendChild(node);
    return node;
  };
  const addEllipse = (parent, { x, y, width, height, fill, stroke, weight = 1, rotation = 0, name }) => {
    const node = figma.createEllipse();
    node.name = name || 'Smooth ellipse';
    node.resize(width, height);
    node.x = x;
    node.y = y;
    node.rotation = rotation;
    node.fills = fill ? [fill] : [];
    if (stroke) setStroke(node, stroke, weight);
    parent.appendChild(node);
    return node;
  };
  const addSourcedSvg = (parent, assetId, { x, y, maxWidth, maxHeight, name, label }) => {
    const source = P.assets[assetId];
    if (!source) return null;
    const node = figma.createNodeFromSvg(source);
    node.name = name || `Canonical SVG / ${assetId}`;
    parent.appendChild(node);
    const scale = Math.min(maxWidth / node.width, maxHeight / node.height);
    node.rescale(scale);
    node.x = x + (maxWidth - node.width) / 2;
    node.y = y + (maxHeight - node.height) / 2;
    tag(node, { entity: 'canonical-source-asset', source_asset_id: assetId, source_label: label || assetId, subject_id: P.subjectId });
    return node;
  };

  const dark = P.mode.name === 'void' || P.mode.name === 'void-hicontrast';
  const canvasRef = 'Modes/surface/canvas';
  const contentRef = 'Modes/content/primary';
  const secondaryRef = 'Modes/content/secondary';
  const borderRef = 'Modes/border/default';
  const panelFillRef = 'Modes/surface/card';
  const background = dark ? FALLBACK.void : FALLBACK.paper;
  const foreground = dark ? FALLBACK.paper : FALLBACK.void;
  const border = dark ? FALLBACK.ash700 : FALLBACK.ash300;
  const panel = dark ? FALLBACK.ash900 : '#FFFFFF';

  const master = figma.createFrame();
  master.name = '01 / FIGMA NATIVE — EDITABLE MASTER';
  master.resize(1440, Math.max(P.minimumHeightPx, 1200));
  master.x = 1600;
  master.y = 0;
  master.cornerRadius = 0;
  master.clipsContent = true;
  master.fills = [boundSolid(canvasRef, background)];
  page.appendChild(master);
  const modesCollection = collectionById.get(P.mode.collectionId);
  if (modesCollection && typeof master.setExplicitVariableModeForCollection === 'function') {
    master.setExplicitVariableModeForCollection(modesCollection, P.mode.modeId);
  }

  const layerMap = new Map();
  for (const layerName of P.layerOrder) {
    const layer = figma.createFrame();
    layer.name = layerName;
    layer.resize(1440, master.height);
    layer.x = 0;
    layer.y = 0;
    layer.fills = [];
    layer.clipsContent = false;
    master.appendChild(layer);
    tag(layer, { entity: 'semantic-layer', subject_id: P.subjectId, layer_name: layerName });
    layerMap.set(layerName, layer);
  }

  const metaLayer = layerMap.get('30 / Live Type and Metadata');
  const fieldLayer = layerMap.get('40 / Color, Gradient, Pattern, or Material');
  const assetLayer = layerMap.get('20 / Canonical Assets');
  const referenceLayer = layerMap.get('00 / Reference');

  addRect(metaLayer, { x: 0, y: 0, width: 1440, height: 8, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: 'Signal / Top calibration rail' });
  addLine(metaLayer, { x: 80, y: 80, width: 1280, stroke: boundSolid(borderRef, border), name: 'Header / Divider' });
  await addText(metaLayer, { text: `BZR / MASTERBRAND / ${P.categoryId}`, style: 'Technical/Label', colorRef: secondaryRef, color: border, width: 430, name: 'Header / System ID' }, 80, 42);
  await addText(metaLayer, { text: `${P.kind.toUpperCase()} · ${P.mode.name.toUpperCase()} · ${P.provenanceAndStatus.verificationStatus}`, style: 'Data/Micro', colorRef: secondaryRef, color: border, width: 620, align: 'RIGHT', name: 'Header / Status' }, 740, 44);
  await addText(metaLayer, { text: P.subjectId, style: 'Industrial/H4', colorRef: 'Brand/brand/accent/signal', color: FALLBACK.signalInk, width: 210, name: 'Title / Subject ID' }, 80, 122);
  const title = await addText(metaLayer, { text: P.subjectName.toUpperCase(), style: P.subjectId === '00.00' ? 'Display/H1 Hero' : 'Display/H2', colorRef: contentRef, color: foreground, width: 1050, name: 'Title / Subject name' }, 80, 172);
  const recipeY = Math.max(302, title.y + title.height + 26);
  await addText(metaLayer, { text: P.visualRecipe.focalSpecimen, style: 'Body/Lead', colorRef: secondaryRef, color: border, width: 920, name: 'Title / Focal specimen statement' }, 80, recipeY);

  const statusFill = P.provenanceAndStatus.publicationStatus === 'nonpublishable' ? FALLBACK.amber : FALLBACK.signal;
  const statusText = P.provenanceAndStatus.publicationStatus === 'nonpublishable' ? 'PROVISIONAL / NONPUBLISHABLE' : 'GOVERNED / PUBLISHABLE AFTER VERIFICATION';
  const statusPlate = addRect(metaLayer, { x: 1060, y: recipeY, width: 300, height: 54, fill: solid(statusFill), name: 'Status / Publication plate' });
  await addText(metaLayer, { text: statusText, style: 'Data/Micro', color: FALLBACK.void, width: 260, align: 'CENTER', name: 'Status / Publication label' }, statusPlate.x + 20, statusPlate.y + 19);

  const specimenY = Math.max(430, recipeY + 110);
  const specimenHeight = P.anatomyType === 'overview' ? 650 : 760;
  const specimen = figma.createFrame();
  specimen.name = `Specimen / ${P.nativeSpecimenType || P.recipeId}`;
  specimen.resize(1280, specimenHeight);
  specimen.x = 80;
  specimen.y = specimenY;
  specimen.fills = [boundSolid(panelFillRef, panel)];
  setStroke(specimen, boundSolid(borderRef, border), 1);
  specimen.clipsContent = true;
  fieldLayer.appendChild(specimen);
  tag(specimen, { entity: 'native-editable-specimen', subject_id: P.subjectId, recipe_id: P.recipeId, category_id: P.categoryId });
  await addText(specimen, { text: `FOCAL SPECIMEN / ${P.recipeId}`, style: 'Label/Eyebrow', colorRef: secondaryRef, color: border, width: 620, name: 'Specimen / Label' }, 32, 28);

  const renderEntry = async () => {
    if (P.subjectId === '00.00') {
      addSourcedSvg(specimen, 'markInverse', { x: 700, y: 82, maxWidth: 480, maxHeight: 480, name: 'Gravity Well / Exact Lime on Void', label: 'packages/assets/logo/mark-inverse.svg' });
      await addText(specimen, { text: 'BIZARRE\nINDUSTRIES', style: 'Display/H2', color: FALLBACK.paper, width: 600, name: 'Cover / Masterbrand' }, 48, 116);
      await addText(specimen, { text: 'CATCH THE STARS', style: 'Industrial/H3', color: FALLBACK.signal, width: 600, name: 'Cover / Permanent phrase' }, 48, 344);
      await addText(specimen, { text: 'BEND  →  ABSENCE  →  SIGNAL', style: 'Technical/Label', color: FALLBACK.paper, width: 620, name: 'Cover / Meaning system' }, 48, 438);
      await addText(specimen, { text: 'SWISS-WORKING / EMIRATI-LAYERED / GRAVITY-WELL PHYSICS', style: 'Data/Micro', color: FALLBACK.ash300, width: 620, name: 'Cover / Positioning' }, 48, 510);
      return;
    }
    const items = P.subjectId === '00.01'
      ? ['ENTRY', 'CORE', 'IDENTITY', 'COLOR', 'TYPE', 'GEOMETRY', 'ATLAS', 'MOTION', 'COMPONENTS', 'MATERIALS', 'APPLICATIONS', 'RELEASE']
      : ['OWNER OVERRIDES', 'CANONICAL REPO', 'GOVERNED PROVISIONAL', 'FIGMA NATIVE', 'AFFINITY MASTER', 'EVIDENCE GATE'];
    for (let i = 0; i < items.length; i += 1) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 40 + col * 300;
      const y = 104 + row * 150;
      addRect(specimen, { x, y, width: 270, height: 116, fill: i === 0 ? boundSolid('Brand/brand/accent/signal', FALLBACK.signal) : boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Navigation / ${items[i]}` });
      await addText(specimen, { text: `${String(i + 1).padStart(2, '0')} / ${items[i]}`, style: 'Technical/Label', color: i === 0 ? FALLBACK.void : foreground, width: 224, name: `Navigation label / ${items[i]}` }, x + 22, y + 46);
    }
  };

  const renderBrandCore = async () => {
    if (P.subjectId === '01.03') {
      await addText(specimen, { text: 'INTEGRATE. DO NOT REPLACE.', style: 'Industrial/H3', color: foreground, width: 820, name: 'Native integration / Thesis' }, 32, 78);
      await addText(specimen, { text: 'ONE BIZARRE INDUSTRIES IDENTITY  /  HOST SYSTEM FIRST  /  RECOGNIZABLE WITHOUT RESKINNING', style: 'Data/Micro', color: border, width: 1160, name: 'Native integration / Authority boundary' }, 32, 126);

      const lanes = [
        { label: 'WEB', host: 'EXISTING PRODUCT SYSTEM', native: 'COMPONENTS / FLOWS / TOKENS', cue: 'STATE + VOICE + SIGNAL' },
        { label: 'iOS', host: 'SWIFTUI + iOS', native: 'NAV / CONTROL / INPUT', cue: 'RARE RECOGNITION MOMENTS' },
        { label: 'macOS', host: 'SWIFTUI + macOS', native: 'WINDOW / MENU / COMMAND', cue: 'DATA + OPERATIONAL SIGNAL' },
      ];
      for (let index = 0; index < lanes.length; index += 1) {
        const lane = lanes[index];
        const x = 32 + index * 410;
        addRect(specimen, { x, y: 176, width: 382, height: 336, fill: boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Native integration / ${lane.label} lane` });
        addRect(specimen, { x, y: 176, width: 8, height: 336, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: `Native integration / ${lane.label} signal channel` });
        await addText(specimen, { text: lane.label, style: 'Industrial/H4', color: foreground, width: 310, name: `Native integration / ${lane.label} label` }, x + 28, 204);
        await addText(specimen, { text: lane.host, style: 'Technical/Label', color: border, width: 310, name: `Native integration / ${lane.label} host owner` }, x + 28, 270);
        addRect(specimen, { x: x + 28, y: 322, width: 326, height: 56, fill: boundSolid('Modes/surface/canvas', dark ? FALLBACK.void : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Native integration / ${lane.label} native primitive` });
        addRect(specimen, { x: x + 44, y: 340, width: 112, height: 10, fill: boundSolid('Modes/content/secondary', border), name: `Native integration / ${lane.label} native metadata` });
        addRect(specimen, { x: x + 44, y: 358, width: 236, height: 4, fill: boundSolid('Modes/border/default', border), name: `Native integration / ${lane.label} native rule` });
        await addText(specimen, { text: lane.native, style: 'Data/Micro', color: border, width: 310, name: `Native integration / ${lane.label} preserved behavior` }, x + 28, 404);
        await addText(specimen, { text: `BIZARRE LAYER  /  ${lane.cue}`, style: 'Data/Micro', color: FALLBACK.signalInk, width: 310, name: `Native integration / ${lane.label} restrained layer` }, x + 28, 458);
      }

      const steps = [
        ['01 / AUDIT', 'EXISTING INFRASTRUCTURE'],
        ['02 / PRESERVE', 'NATIVE BEHAVIOR'],
        ['03 / LAYER', 'RESTRAINED RECOGNITION'],
        ['04 / VERIFY', 'NATIVE + RECOGNIZABLE'],
      ];
      for (let index = 0; index < steps.length; index += 1) {
        const x = 32 + index * 306;
        addRect(specimen, { x, y: 560, width: 280, height: 116, fill: index === 0 ? boundSolid('Brand/brand/accent/signal', FALLBACK.signal) : boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Native integration / Step ${index + 1}` });
        await addText(specimen, { text: steps[index][0], style: 'Technical/Label', color: index === 0 ? FALLBACK.void : foreground, width: 232, name: `Native integration / Step ${index + 1} label` }, x + 24, 586);
        await addText(specimen, { text: steps[index][1], style: 'Data/Micro', color: index === 0 ? FALLBACK.void : border, width: 232, name: `Native integration / Step ${index + 1} rule` }, x + 24, 632);
      }
      return;
    }
    const isDistance = P.subjectId === '01.02';
    const labels = isDistance ? ['FAR / SILHOUETTE', 'NORMAL / FUNCTION', 'CLOSE / EVIDENCE'] : ['SIGNAL', 'INSTRUMENT', 'DATA', 'REVEAL'];
    for (let i = 0; i < labels.length; i += 1) {
      const width = isDistance ? 382 : 286;
      const x = 32 + i * (width + 28);
      addRect(specimen, { x, y: 100, width, height: 420, fill: i === labels.length - 1 ? boundSolid('Brand/brand/accent/signal', FALLBACK.signal) : boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Recognition / ${labels[i]}` });
      await addText(specimen, { text: labels[i], style: 'Industrial/H4', color: i === labels.length - 1 ? FALLBACK.void : foreground, width: width - 48, name: `Recognition label / ${labels[i]}` }, x + 24, 132);
      await addText(specimen, { text: isDistance ? ['MARK + LIME', 'HIERARCHY + STATE', 'SOURCE + HASH'][i] : ['one accent', 'measured structure', 'real metadata', 'earned personality'][i], style: 'Body/Base', color: i === labels.length - 1 ? FALLBACK.void : border, width: width - 48, name: `Recognition note / ${labels[i]}` }, x + 24, 236);
    }
    if (P.subjectId === '01.04') {
      await addText(specimen, { text: 'CATCH THE STARS', style: 'Display/H2', color: foreground, width: 720, name: 'Voice / English permanent phrase' }, 48, 548);
      await addText(specimen, { text: 'امسك النجوم', style: 'Provisional Arabic/Display/Heading', color: foreground, width: 420, align: 'RIGHT', name: 'Voice / Arabic standalone treatment' }, 810, 552);
    } else {
      await addText(specimen, { text: 'NOT SWISS-LOOKING.\nSWISS-WORKING.', style: 'Display/H2', color: foreground, width: 930, name: 'Philosophy / Principle' }, 48, 554);
    }
  };

  const renderIdentity = async () => {
    const cards = [
      { id: 'markInverse', label: 'FULL SIGNAL / VOID', bg: FALLBACK.void },
      { id: 'markPrimary', label: 'FULL BLACK / SIGNAL', bg: FALLBACK.signal },
      { id: 'markTransparent', label: 'FULL BLACK / PAPER', bg: FALLBACK.paper }
    ];
    for (let i = 0; i < cards.length; i += 1) {
      const x = 32 + i * 414;
      addRect(specimen, { x, y: 92, width: 384, height: 520, fill: solid(cards[i].bg), stroke: boundSolid(borderRef, border), name: `Identity context / ${cards[i].label}` });
      addSourcedSvg(specimen, cards[i].id, { x: x + 32, y: 132, maxWidth: 320, maxHeight: 320, name: `Gravity Well / ${cards[i].label}`, label: cards[i].id });
      await addText(specimen, { text: cards[i].label, style: 'Technical/Label', color: cards[i].bg === FALLBACK.void ? FALLBACK.signal : FALLBACK.void, width: 320, align: 'CENTER', name: `Identity context label / ${cards[i].label}` }, x + 32, 546);
    }
  };

  const renderColor = async () => {
    const refsBySubject = {
      '03.00': [
        'Palette/color/neutral/void', 'Palette/color/neutral/paper', 'Palette/color/accent/signal',
        'Palette/color/neutral/ash300', 'Palette/color/spectrum/ion-cyan', 'Palette/color/spectrum/crimson',
        'Palette/color/spectrum/solar-gold', 'Palette/color/status/success', 'Palette/color/status/warning',
        'Palette/color/status/danger', 'Palette/color/status/info', 'Palette/color/neutral/workshop'
      ],
      '03.01': [
        'Palette/color/neutral/black', 'Palette/color/neutral/void', 'Palette/color/neutral/ash900',
        'Palette/color/neutral/ash700', 'Palette/color/neutral/ash500', 'Palette/color/neutral/ash300',
        'Palette/color/neutral/ash100', 'Palette/color/neutral/smoke', 'Palette/color/neutral/bone',
        'Palette/color/neutral/paper', 'Palette/color/neutral/snow', 'Palette/color/neutral/midnight',
        'Palette/color/neutral/workshop', 'Palette/color/neutral/workshop-card', 'Palette/color/neutral/workshop-elevated',
        'Palette/color/neutral/workshop-muted', 'Palette/color/neutral/workshop-secondary', 'Palette/color/neutral/workshop-text'
      ],
      '03.02': [
        'Palette/color/accent/glow', 'Palette/color/accent/ink', 'Palette/color/accent/signal',
        'Modes/action/default/surface', 'Modes/action/hover/surface', 'Modes/action/active/surface',
        'Modes/action/disabled/surface', 'Modes/action/default/content', 'Modes/action/hover/content',
        'Modes/action/active/content', 'Modes/action/disabled/content', 'Modes/focus/ring'
      ],
      '03.03': [
        'Palette/color/spectrum/deep-indigo', 'Palette/color/spectrum/electric-blue',
        'Palette/color/spectrum/ion-cyan', 'Palette/color/spectrum/oxidized-teal',
        'Palette/color/spectrum/solar-gold', 'Palette/color/spectrum/amber',
        'Palette/color/spectrum/crimson', 'Palette/color/spectrum/violet-shadow'
      ],
      '03.04': [
        'Palette/color/status/success', 'Palette/color/status/warning', 'Palette/color/status/danger', 'Palette/color/status/info',
        'Modes/status/success/surface', 'Modes/status/warning/surface', 'Modes/status/danger/surface', 'Modes/status/info/surface',
        'Modes/status/success/content', 'Modes/status/warning/content', 'Modes/status/danger/content', 'Modes/status/info/content'
      ],
      '03.05': [
        'Palette/color/neutral/void', 'Palette/color/neutral/paper', 'Palette/color/accent/signal',
        'Palette/color/accent/ink', 'Modes/content/primary', 'Modes/content/secondary',
        'Modes/content/muted', 'Modes/border/strong', 'Modes/focus/ring',
        'Palette/color/status/success', 'Palette/color/status/warning', 'Palette/color/status/danger'
      ]
    };
    const refs = refsBySubject[P.subjectId] || refsBySubject['03.00'];
    const columns = refs.length === 8 ? 4 : 6;
    const cardWidth = refs.length === 8 ? 280 : 178;
    const columnStep = refs.length === 8 ? 304 : 204;
    const rowStep = refs.length === 8 ? 248 : 182;
    const swatchHeight = refs.length === 8 ? 168 : 112;
    for (let i = 0; i < refs.length; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = 32 + col * columnStep;
      const y = 92 + row * rowStep;
      const ref = refs[i];
      addRect(specimen, { x, y, width: cardWidth, height: swatchHeight, fill: boundSolid(ref, [FALLBACK.paper, FALLBACK.ash300, FALLBACK.signal, FALLBACK.iron, FALLBACK.cyan, FALLBACK.amber][i % 6]), stroke: boundSolid(borderRef, border), name: `Swatch / ${ref}` });
      await addText(specimen, { text: ref.replace(/^Palette\/color\//, '').replace(/^Modes\//, ''), style: 'Data/Micro', color: foreground, width: cardWidth, name: `Swatch label / ${ref}` }, x, y + swatchHeight + 12);
    }
    await addText(specimen, { text: 'LIME ONLY APPEARS WHEN SOMETHING IS HAPPENING.', style: 'Industrial/H3', color: foreground, width: 1120, name: 'Color / Operational rule' }, 32, 638);
  };

  const renderGradient = async () => {
    if (P.gradientGlobalRules?.signalLime?.interpolation !== 'forbidden') throw new Error('SIGNAL_INTERPOLATION_RULE_MISSING');
    const recipePaint = (recipe) => gradient(
      recipe.stops.items.map((stop) => ({ ref: '', fallback: stop.color, position: stop.positionPercent / 100 })),
      master,
      recipe.geometry.angleDeg
    );
    const tagGradient = (node, recipe) => tag(node, {
      entity: 'governed-native-gradient',
      subject_id: recipe.subjectId,
      value_status: recipe.valueStatus,
      stop_value_status: recipe.stops.valueStatus,
      angle_deg: recipe.geometry.angleDeg,
      stops: recipe.stops.items.map((stop) => `${stop.positionPercent}:${stop.color}`).join('|'),
      signal_interpolation: 'forbidden'
    });
    const tagContract = (node, recipe) => tag(node, {
      entity: 'gradient-derivation-contract',
      subject_id: recipe.subjectId,
      value_status: recipe.valueStatus,
      numeric_stops: 'none',
      geometry: 'none',
      verification_status: 'NOT VERIFIED'
    });

    if (P.subjectId === '04.00') {
      for (let index = 0; index < P.gradientRecipes.length; index += 1) {
        const recipe = P.gradientRecipes[index];
        const x = 32 + (index % 4) * 304;
        const y = 84 + Math.floor(index / 4) * 258;
        if (recipe.valueStatus === 'EXACT SOURCE VALUE') {
          const field = addRect(specimen, { x, y, width: 280, height: 220, fill: recipePaint(recipe), stroke: boundSolid(borderRef, border), name: `Gradient study / ${recipe.subjectId} / EXACT SOURCE VALUE` });
          tagGradient(field, recipe);
          addRect(specimen, { x, y, width: 280, height: 44, fill: solid(FALLBACK.void, 0.86), name: `Gradient study / ${recipe.subjectId} / Identification band` });
          addRect(specimen, { x, y: y + 212, width: 280, height: 8, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: `Gradient study / ${recipe.subjectId} / Flat Signal rail` });
          await addText(specimen, { text: `${recipe.subjectId} / ${recipe.system.toUpperCase().replaceAll('-', ' ')}`, style: 'Technical/Label', color: FALLBACK.paper, width: 248, name: `Gradient study / ${recipe.subjectId} / Label` }, x + 16, y + 15);
          await addText(specimen, { text: `${recipe.stops.items.length} STOPS / ${recipe.geometry.angleDeg}° / EXACT`, style: 'Data/Micro', color: FALLBACK.paper, width: 248, name: `Gradient study / ${recipe.subjectId} / Recipe` }, x + 16, y + 176);
        } else {
          const contract = addRect(specimen, { x, y, width: 280, height: 220, fill: solid(FALLBACK.ash900), stroke: boundSolid(borderRef, border), name: `Gradient study / ${recipe.subjectId} / NOT VERIFIED` });
          tagContract(contract, recipe);
          addRect(specimen, { x, y, width: 8, height: 220, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: `Gradient study / ${recipe.subjectId} / Flat Signal rail` });
          await addText(specimen, { text: `${recipe.subjectId} / ${recipe.system.toUpperCase().replaceAll('-', ' ')}`, style: 'Technical/Label', color: FALLBACK.paper, width: 240, name: `Gradient study / ${recipe.subjectId} / Label` }, x + 20, y + 20);
          await addText(specimen, { text: 'DERIVATION CONTRACT\nNO STOPS / NO ANGLE', style: 'Industrial/H4', color: FALLBACK.ash300, width: 232, name: `Gradient study / ${recipe.subjectId} / Contract` }, x + 20, y + 76);
          await addText(specimen, { text: 'NOT VERIFIED', style: 'Data/Micro', color: FALLBACK.signal, width: 232, name: `Gradient study / ${recipe.subjectId} / Status` }, x + 20, y + 184);
        }
      }
      await addText(specimen, { text: 'TWO EXACT SOURCE VALUES / FIVE STOP-FREE DERIVATION CONTRACTS / NO INVENTED GRADIENTS', style: 'Technical/Label', color: foreground, width: 1216, name: 'Gradient / Overview governance rule' }, 32, 620);
      return;
    }

    const recipe = P.gradientRecipes[0];
    if (!recipe) throw new Error(`MISSING_GRADIENT_RECIPE:${P.subjectId}`);
    if (recipe.valueStatus === 'EXACT SOURCE VALUE') {
      const field = addRect(specimen, { x: 32, y: 92, width: 1216, height: 430, fill: recipePaint(recipe), stroke: boundSolid(borderRef, border), name: `Native gradient / ${P.subjectName} / EXACT SOURCE VALUE` });
      tagGradient(field, recipe);
      for (let index = 0; index < recipe.stops.items.length; index += 1) {
        const stop = recipe.stops.items[index];
        const labelX = 32 + (stop.positionPercent / 100) * 1090;
        await addText(specimen, { text: `${stop.positionPercent}%\n${stop.color}`, style: 'Data/Micro', color: foreground, width: 118, name: `Gradient stop / ${String(index + 1).padStart(2, '0')}` }, labelX, 544);
      }
      addRect(specimen, { x: 32, y: 626, width: 1216, height: 12, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: 'Signal / Flat invariant trajectory' });
      await addText(specimen, { text: `EDITABLE NATIVE GRADIENT / ${recipe.stops.items.length} EXACT STOPS / ${recipe.geometry.angleDeg}° / SIGNAL OUTSIDE THE BLEND`, style: 'Technical/Label', color: foreground, width: 1216, name: 'Gradient / Construction rule' }, 32, 668);
      return;
    }

    const contract = addRect(specimen, { x: 32, y: 92, width: 1216, height: 500, fill: solid(FALLBACK.void), stroke: boundSolid(borderRef, border), name: `Gradient derivation / ${P.subjectName} / NOT VERIFIED` });
    tagContract(contract, recipe);
    addRect(specimen, { x: 32, y: 92, width: 286, height: 500, fill: solid(FALLBACK.ash900), name: 'Gradient contract / Index field' });
    addRect(specimen, { x: 32, y: 92, width: 10, height: 500, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: 'Gradient contract / Flat Signal status rail' });
    await addText(specimen, { text: recipe.subjectId, style: 'Industrial/H3', color: FALLBACK.signal, width: 220, name: 'Gradient contract / Subject ID' }, 66, 132);
    await addText(specimen, { text: recipe.name.toUpperCase(), style: 'Industrial/H4', color: FALLBACK.paper, width: 220, name: 'Gradient contract / System name' }, 66, 236);
    await addText(specimen, { text: 'DERIVATION\nCONTRACT', style: 'Technical/Label', color: FALLBACK.ash300, width: 220, name: 'Gradient contract / Contract type' }, 66, 330);
    await addText(specimen, { text: 'NO NUMERIC STOPS\nNO GEOMETRY\nNOT VERIFIED', style: 'Technical/Label', color: FALLBACK.signal, width: 220, name: 'Gradient contract / Stop-ship status' }, 66, 496);
    const controls = recipe.derivation.requiredControls.join(' ');
    const rows = [
      ['01 / INPUT', recipe.derivation.input],
      ['02 / MAPPING', recipe.derivation.mapping],
      ['03 / REQUIRED CONTROLS', controls],
      ['04 / FALLBACK', recipe.derivation.fallback]
    ];
    for (let index = 0; index < rows.length; index += 1) {
      const [label, body] = rows[index];
      const y = 116 + index * 112;
      await addText(specimen, { text: label, style: 'Technical/Label', color: FALLBACK.signal, width: 210, name: `Gradient contract / ${label}` }, 350, y);
      await addText(specimen, { text: body, style: 'Body/Base', color: FALLBACK.paper, width: 640, name: `Gradient contract / ${label} copy` }, 572, y);
    }
    await addText(specimen, { text: 'DERIVATION CONTRACT ONLY / NO NUMERIC STOPS / NO GEOMETRY / NOT VERIFIED', style: 'Technical/Label', color: foreground, width: 1216, name: 'Gradient / Governance rule' }, 32, 650);
  };

  const renderTypography = async () => {
    const sets = {
      '05.00': [
        ['Display/H1 Hero', 'CATCH THE STARS', 'DISPLAY'],
        ['Industrial/H3', 'SIGNAL INFRASTRUCTURE', 'INDUSTRIAL'],
        ['Body/Lead', 'Make the distant tangible.', 'BODY / LEAD'],
        ['Technical/Label', 'BEND → ABSENCE → SIGNAL', 'TECHNICAL'],
        ['Code/Base', 'FIELD_07 / CAPTURE / READY', 'MONO'],
        ['Provisional Arabic/Display/Heading', 'امسك النجوم', 'ARABIC']
      ],
      '05.01': [
        ['Display/H1 Hero', 'CATCH THE STARS', 'HERO'],
        ['Display/H2', 'CATCH THE STARS', 'DISPLAY / MEDIUM'],
        ['Industrial/H3', 'CATCH THE STARS', 'DISPLAY / COMPACT'],
        ['Provisional Arabic/Display/Heading', 'امسك النجوم', 'ARABIC / EQUAL AUTHORITY']
      ],
      '05.02': [
        ['Industrial/H3', 'SIGNAL INFRASTRUCTURE', 'INDUSTRIAL / PRIMARY'],
        ['Industrial/H4', 'CAPTURE / READY / ACTIVE', 'INSTRUMENT STATES'],
        ['Industrial/H3', '01  07  12  24  48', 'NUMERALS'],
        ['Technical/Label', 'FIELD  /  LIVERY  /  PANEL  /  INDEX', 'PAIRING']
      ],
      '05.03': [
        ['Body/Lead', 'Make the distant tangible without making the interface harder to use.', 'BODY / LEAD'],
        ['Body/Base', 'Use the host product hierarchy first. Add Bizarre personality through exact tokens, terse copy, instrument metadata, and earned Signal states.', 'BODY / BASE'],
        ['Heading/H5', 'Operational status', 'UI HEADING'],
        ['Caption/Base', 'Updated 2026-07-15 · source-backed · not verified', 'CAPTION']
      ],
      '05.04': [
        ['Code/Base', 'FIELD_07 / MASS_X 0.63 / MASS_Y 0.41', 'DATA LINE'],
        ['Technical/Label', 'BEND → ABSENCE → SIGNAL', 'TECHNICAL LABEL'],
        ['Code/Base', 'SHA256 4c4500ea3c2f12cb…', 'PROVENANCE'],
        ['Data/Micro', '1440 PX / 144 DPI / VOID / RTL SAFE', 'MICRO DATA'],
        ['Code/Base', 'CAPTURE.STATE = LOCKED', 'STATE']
      ],
      '05.05': [
        ['Provisional Arabic/Display/Heading', 'امسك النجوم', 'ARABIC / DISPLAY'],
        ['Provisional Arabic/Body/Base', 'اجعل البعيد ملموساً من دون التضحية بالوضوح أو الوظيفة.', 'ARABIC / BODY'],
        ['Provisional Arabic/Technical/Label', 'إشارة / أداة / بيانات / كشف', 'ARABIC / TECHNICAL'],
        ['Display/H2', 'CATCH THE STARS', 'ENGLISH / EQUAL AUTHORITY']
      ],
      '05.06': [
        ['Display/H2', 'CATCH THE STARS', 'LTR / DISPLAY'],
        ['Provisional Arabic/Display/Heading', 'امسك النجوم', 'RTL / DISPLAY'],
        ['Technical/Label', '07 / FIELD / CAPTURE / READY', 'LTR / METADATA'],
        ['Provisional Arabic/Technical/Label', '٠٧ / المجال / الالتقاط / جاهز', 'RTL / METADATA'],
        ['Body/Base', 'Logical order follows language direction; the physical field itself does not mirror.', 'BILINGUAL RULE']
      ]
    };
    const samples = sets[P.subjectId] || sets['05.00'];
    let y = 76;
    for (let i = 0; i < samples.length; i += 1) {
      const [style, value, label] = samples[i];
      await addText(specimen, { text: label, style: 'Data/Micro', color: border, width: 250, name: `Type label / ${label}` }, 32, y + 12);
      const sample = await addText(specimen, { text: value, style, color: foreground, width: 900, align: style.startsWith('Provisional Arabic') ? 'RIGHT' : 'LEFT', name: `Type specimen / ${style} / ${label}` }, 316, y);
      const baselineY = y + sample.height + 14;
      addLine(specimen, { x: 316, y: baselineY, width: 900, stroke: boundSolid(borderRef, border), dash: [4, 8], name: `Baseline / ${label}` });
      y = baselineY + 34;
    }
    await addText(specimen, { text: 'LIVE TYPE / APPROVED LOCAL STYLES / LANGUAGE DIRECTION IS LOGICAL / PHYSICAL FIELD DOES NOT MIRROR', style: 'Technical/Label', color: foreground, width: 1180, name: 'Typography / System rule' }, 32, 690);
  };

  const renderGeometry = async () => {
    const aperture = (x, y, width, height, name) => addSourcedSvg(specimen, 'aperture', { x, y, maxWidth: width, maxHeight: height, name });
    if (P.subjectId === '06.07') {
      addSourcedSvg(specimen, 'instrumentDial', { x: 370, y: 88, maxWidth: 540, maxHeight: 540, name: 'Instrument Dial / Exact governed source asset' });
      await addText(specimen, { text: 'ONE OBJECT / THREE READINGS', style: 'Industrial/H3', color: foreground, width: 540, name: 'Iconography / Reading rule' }, 48, 162);
      await addText(specimen, { text: 'TIME  /  GRAVITY  /  CAPTURE', style: 'Technical/Label', color: foreground, width: 540, name: 'Iconography / Semantic readings' }, 48, 270);
    } else if (P.subjectId === '06.04') {
      for (let column = 0; column <= 12; column += 1) addLine(specimen, { x: 48 + column * 94, y: 112, width: 480, rotation: -90, stroke: boundSolid(borderRef, border), weight: column % 4 === 0 ? 2 : 1, name: `Grid / Column ${column + 1}` });
      for (let row = 0; row <= 8; row += 1) addLine(specimen, { x: 48, y: 112 + row * 60, width: 1128, stroke: boundSolid(borderRef, border), weight: row % 4 === 0 ? 2 : 1, name: `Grid / Row ${row + 1}` });
      const spaces = [4, 8, 12, 16, 24, 32, 48];
      for (let index = 0; index < spaces.length; index += 1) {
        const x = 48 + index * 162;
        addRect(specimen, { x, y: 626 - spaces[index] * 2, width: 120, height: spaces[index] * 2, fill: index === spaces.length - 1 ? boundSolid('Brand/brand/accent/signal', FALLBACK.signal) : boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Spacing specimen / ${spaces[index]}` });
        await addText(specimen, { text: `${spaces[index]}`, style: 'Data/Micro', color: index === spaces.length - 1 ? FALLBACK.void : foreground, width: 120, align: 'CENTER', name: `Spacing label / ${spaces[index]}` }, x, 644);
      }
    } else if (P.subjectId === '06.05') {
      const sizes = [
        { x: 48, y: 106, width: 470, height: 470, label: 'FAR / ENVIRONMENTAL' },
        { x: 586, y: 186, width: 300, height: 300, label: 'NORMAL / INTERFACE' },
        { x: 964, y: 266, width: 150, height: 150, label: 'CLOSE / MICRO' }
      ];
      for (const size of sizes) {
        aperture(size.x, size.y, size.width, size.height, `Continuous Lens / ${size.label} / Exact source`);
        await addText(specimen, { text: size.label, style: 'Technical/Label', color: foreground, width: size.width, align: 'CENTER', name: `Optical size label / ${size.label}` }, size.x, 594);
      }
    } else if (P.subjectId === '06.06') {
      addEllipse(specimen, { x: 632, y: 116, width: 470, height: 300, fill: null, stroke: boundSolid('Modes/border/strong', border), weight: 8, rotation: -14, name: 'Material depth / External smooth rim' });
      addEllipse(specimen, { x: 652, y: 136, width: 430, height: 260, fill: null, stroke: boundSolid(borderRef, border), weight: 2, rotation: -14, name: 'Material depth / External bevel guide' });
      aperture(662, 146, 410, 240, 'Continuous Lens / Exact opening / No internal bevel');
      const weights = [1, 2, 3, 4, 8];
      for (let index = 0; index < weights.length; index += 1) {
        addLine(specimen, { x: 48, y: 138 + index * 88, width: 460, stroke: boundSolid(borderRef, border), weight: weights[index], name: `Line weight / ${weights[index]}` });
        await addText(specimen, { text: `${weights[index]} PX / ROUND CAP`, style: 'Technical/Label', color: foreground, width: 260, name: `Line label / ${weights[index]}` }, 48, 158 + index * 88);
      }
    } else if (P.subjectId === '06.02') {
      addRect(specimen, { x: 48, y: 104, width: 1168, height: 500, fill: boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid('Modes/border/strong', border), strokeWeight: 3, name: 'Precision Panel / Chassis' });
      addRect(specimen, { x: 48, y: 104, width: 1168, height: 12, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: 'Precision Panel / Active rail' });
      aperture(720, 178, 390, 250, 'Precision Panel / Continuous Lens opening / Exact source');
      await addText(specimen, { text: 'PRECISION PANEL', style: 'Industrial/H3', color: foreground, width: 540, name: 'Precision Panel / Heading' }, 90, 178);
      await addText(specimen, { text: 'MEASURED CHASSIS\nLIVE TYPE\nREAL STATE\nEXTERNAL DEPTH', style: 'Technical/Label', color: foreground, width: 420, name: 'Precision Panel / Anatomy' }, 90, 304);
    } else if (P.subjectId === '06.03') {
      addRect(specimen, { x: 48, y: 96, width: 1168, height: 520, fill: solid(FALLBACK.void), stroke: boundSolid(borderRef, border), name: 'Display Field / Void environment' });
      aperture(692, 150, 430, 280, 'Display Field / Continuous Lens focal opening / Exact source');
      await addText(specimen, { text: 'DISPLAY\nFIELD', style: 'Display/H2', color: FALLBACK.paper, width: 520, name: 'Display Field / Title' }, 90, 164);
      addRect(specimen, { x: 90, y: 472, width: 470, height: 12, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: 'Display Field / Singular active trajectory' });
      await addText(specimen, { text: 'ONE DOMINANT FIELD / ONE ACTIVE SIGNAL / NO DECORATIVE RINGS', style: 'Technical/Label', color: FALLBACK.paper, width: 820, name: 'Display Field / Rule' }, 90, 522);
    } else {
      aperture(650, 96, 520, 520, 'Continuous Lens / Exact governed SVG');
      for (let i = 0; i < 8; i += 1) {
        addLine(specimen, { x: 48, y: 122 + i * 62, width: 500, stroke: boundSolid(borderRef, border), dash: i % 2 ? [3, 9] : undefined, name: `Grid / Row ${i + 1}` });
        addLine(specimen, { x: 48 + i * 64, y: 122, width: 434, rotation: -90, stroke: boundSolid(borderRef, border), dash: i % 2 ? [3, 9] : undefined, name: `Grid / Column ${i + 1}` });
      }
    }
    await addText(specimen, { text: 'SMOOTH / TANGENT-CONTINUOUS / NO CORNERS / NO CHAMFER / MATERIAL DEPTH STAYS OUTSIDE THE OPENING', style: 'Technical/Label', color: foreground, width: 1180, name: 'Geometry / Aperture invariant' }, 48, 690);
  };

  const renderAtlasConcept = async () => {
    if (!P.atlasSourcePage || !Array.isArray(P.atlasSources) || !P.conceptReference || !P.continuousLensConcept) {
      throw new Error('CONTINUOUS_LENS_R20_SOURCE_CONTRACT_MISSING');
    }
    if (P.continuousLensConcept.revision !== 'atlas-continuous-lens-concept-fidelity-r20') {
      throw new Error(`CONTINUOUS_LENS_R20_REVISION_DRIFT:${P.continuousLensConcept.revision}`);
    }
    const sourceDefinitions = new Map(P.atlasSources.map((definition) => [definition.id, definition]));
    const sourcePage = await figma.getNodeByIdAsync(P.atlasSourcePage.pageNodeId);
    if (!sourcePage || sourcePage.type !== 'PAGE' || sourcePage.name !== P.atlasSourcePage.exactPageName) throw new Error('ATLAS_SOURCE_PAGE_DRIFT');
    await sourcePage.loadAsync();
    const sourceLibrary = sourcePage.findOne((node) => node.type === 'FRAME' && node.getSharedPluginData(NS, 'entity') === 'atlas-source-library');
    if (!sourceLibrary || sourceLibrary.getSharedPluginData(NS, 'build_status') !== 'complete' || !sourceLibrary.locked) throw new Error('ATLAS_SOURCE_LIBRARY_NOT_COMPLETE');

    const getExactSource = (id) => {
      const definition = sourceDefinitions.get(id);
      if (!definition) throw new Error(`ATLAS_SOURCE_NOT_PERMITTED:${id}`);
      const node = sourceLibrary.findOne((candidate) => candidate.getSharedPluginData(NS, 'atlas_source_id') === id);
      if (!node) throw new Error(`ATLAS_SOURCE_NODE_MISSING:${id}`);
      if (node.getSharedPluginData(NS, 'sha256') !== definition.sha256) throw new Error(`ATLAS_SOURCE_HASH_DRIFT:${id}`);
      if (node.getSharedPluginData(NS, 'source_path') !== definition.sourcePath) throw new Error(`ATLAS_SOURCE_PATH_DRIFT:${id}`);
      return { node, definition };
    };
    const makeViewport = ({ x, y, width, height, background: viewportBackground = FALLBACK.void, name }) => {
      const viewport = figma.createFrame();
      viewport.name = name;
      viewport.resize(width, height);
      viewport.x = x;
      viewport.y = y;
      viewport.fills = [solid(viewportBackground)];
      viewport.clipsContent = true;
      viewport.cornerRadius = 0;
      setStroke(viewport, boundSolid(borderRef, border), 1);
      specimen.appendChild(viewport);
      return viewport;
    };
    const placeExactSourceProof = async (id, { x, y, width, height, name, label }) => {
      const { node: sourceNode, definition } = getExactSource(id);
      const viewport = makeViewport({ x, y, width, height, name: `${name} / Exact viewport` });
      const clone = sourceNode.clone();
      clone.locked = false;
      viewport.appendChild(clone);
      const scale = Math.min(width / clone.width, height / clone.height);
      clone.rescale(scale);
      clone.x = (width - clone.width) / 2;
      clone.y = (height - clone.height) / 2;
      clone.name = `${name} / Exact editable ${id}`;
      tag(clone, {
        entity: 'atlas-source-instance', subject_id: P.subjectId, atlas_source_id: id,
        source_path: definition.sourcePath, sha256: definition.sha256,
        authority_status: definition.authorityStatus, verification_status: definition.verificationStatus,
        publication_status: definition.publicationStatus, approximation: 'forbidden', proof_role: 'source-proof-only'
      });
      await addText(specimen, { text: label, style: 'Data/Micro', color: foreground, width, name: `${name} / Source label` }, x, y + height + 10);
      return { viewport, clone };
    };

    const comparisonWidth = 600;
    const comparisonHeight = 238;
    const comparisonY = 112;
    await addText(referenceLayer, { text: `CONCEPT REFERENCE — NONPUBLISHABLE / ${P.conceptReference.sha256.slice(0, 16)}…`, style: 'Data/Micro', color: FALLBACK.warning, width: comparisonWidth, name: 'Reference / Exact ImageGen identification' }, specimen.x + 32, specimen.y + 82);
    const target = addRect(referenceLayer, {
      x: specimen.x + 32, y: specimen.y + comparisonY, width: comparisonWidth, height: comparisonHeight,
      fill: null, stroke: solid(FALLBACK.warning), strokeWeight: 2,
      name: `Reference / Upload target / ${P.subjectId} / ${P.conceptReference.sourcePath}`
    });
    tag(target, {
      entity: 'concept-reference-target', subject_id: P.subjectId, concept_reference_id: P.conceptReference.id,
      source_path: P.conceptReference.sourcePath, sha256: P.conceptReference.sha256,
      source_width: P.conceptReference.width, source_height: P.conceptReference.height,
      target_width: comparisonWidth, target_height: comparisonHeight,
      publication_status: 'nonpublishable', upload_status: 'pending'
    });

    await addText(specimen, { text: 'NATIVE EDITABLE R20 RECONSTRUCTION / SAME 600×238 VIEWPORT', style: 'Data/Micro', color: foreground, width: comparisonWidth, name: 'Atlas comparison / Native label' }, 648, 82);
    const viewport = makeViewport({
      x: 648,
      y: comparisonY,
      width: comparisonWidth,
      height: comparisonHeight,
      background: P.continuousLensConcept.mode === 'one-color' ? FALLBACK.paper : FALLBACK.void,
      name: 'Atlas comparison / Native reconstruction / R20 editable viewport',
    });
    const renderReceipt = createContinuousLensR20Figma({
      figma,
      parent: viewport,
      subjectId: P.subjectId,
      concept: P.continuousLensConcept,
      buildGeometry: buildContinuousLensR20Geometry,
      solid,
      boundSolid,
      gradient,
      tag,
    });
    await addText(specimen, {
      text: `R20 NATIVE GEOMETRY / ${P.continuousLensConcept.orbitCount} NON-CROSSING ORBITS / ONE CUBIC TRAJECTORY / 600×238`,
      style: 'Data/Micro', color: foreground, width: comparisonWidth, name: 'Atlas comparison / Native reconstruction / Source label'
    }, 648, comparisonY + comparisonHeight + 10);

    const sourceProofNodeIds = [];
    for (let index = 0; index < P.continuousLensConcept.proofSourceIds.length; index += 1) {
      const sourceId = P.continuousLensConcept.proofSourceIds[index];
      const proof = await placeExactSourceProof(sourceId, {
        x: 32 + index * 404,
        y: 432,
        width: 380,
        height: 214,
        name: `Atlas comparison / Source proof ${index + 1}`,
        label: `${sourceId} / SOURCE PROOF / NOT RECONSTRUCTION GEOMETRY`,
      });
      sourceProofNodeIds.push(proof.viewport.id, proof.clone.id);
    }
    await addText(specimen, {
      text: 'DOCUMENTATION PAGE MAY PUBLISH / IMAGEGEN DIRECTION AND GOVERNED SOURCE PROOFS REMAIN NONPUBLISHABLE / NOT VERIFIED',
      style: 'Technical/Label', color: FALLBACK.warning, width: 1216, name: 'Atlas / Embedded asset publication boundary'
    }, 32, 700);

    return {
      continuousLensViewportId: viewport.id,
      continuousLensCreatedNodeIds: renderReceipt.createdNodeIds,
      sourceProofNodeIds,
    };
  };

  const renderAtlas = async () => {
    if (!P.atlasSourcePage || !Array.isArray(P.atlasSources)) throw new Error('ATLAS_SOURCE_CONTRACT_MISSING');
    const sourceDefinitions = new Map(P.atlasSources.map((definition) => [definition.id, definition]));
    const sourcePage = await figma.getNodeByIdAsync(P.atlasSourcePage.pageNodeId);
    if (!sourcePage || sourcePage.type !== 'PAGE' || sourcePage.name !== P.atlasSourcePage.exactPageName) throw new Error('ATLAS_SOURCE_PAGE_DRIFT');
    await sourcePage.loadAsync();
    const sourceLibrary = sourcePage.findOne((node) => node.type === 'FRAME' && node.getSharedPluginData(NS, 'entity') === 'atlas-source-library');
    if (!sourceLibrary || sourceLibrary.getSharedPluginData(NS, 'build_status') !== 'complete' || !sourceLibrary.locked) throw new Error('ATLAS_SOURCE_LIBRARY_NOT_COMPLETE');

    const getExactSource = (id) => {
      const definition = sourceDefinitions.get(id);
      if (!definition) throw new Error(`ATLAS_SOURCE_NOT_PERMITTED:${id}`);
      const node = sourceLibrary.findOne((candidate) => candidate.getSharedPluginData(NS, 'atlas_source_id') === id);
      if (!node) throw new Error(`ATLAS_SOURCE_NODE_MISSING:${id}`);
      if (node.getSharedPluginData(NS, 'sha256') !== definition.sha256) throw new Error(`ATLAS_SOURCE_HASH_DRIFT:${id}`);
      if (node.getSharedPluginData(NS, 'source_path') !== definition.sourcePath) throw new Error(`ATLAS_SOURCE_PATH_DRIFT:${id}`);
      return { node, definition };
    };

    const makeViewport = ({ x, y, width, height, background: viewportBackground = FALLBACK.void, name }) => {
      const viewport = figma.createFrame();
      viewport.name = name;
      viewport.resize(width, height);
      viewport.x = x;
      viewport.y = y;
      viewport.fills = [solid(viewportBackground)];
      viewport.clipsContent = true;
      viewport.cornerRadius = 0;
      setStroke(viewport, boundSolid(borderRef, border), 1);
      specimen.appendChild(viewport);
      return viewport;
    };

    const placeExactSource = async (id, {
      x, y, width, height, name, crop = false,
      background: viewportBackground = FALLBACK.void,
      label = id
    }) => {
      const { node: sourceNode, definition } = getExactSource(id);
      const viewport = makeViewport({ x, y, width, height, background: viewportBackground, name: `${name} / Exact viewport` });
      const clone = sourceNode.clone();
      clone.locked = false;
      viewport.appendChild(clone);
      clone.x = 0;
      clone.y = 0;
      const scale = crop ? Math.max(width / clone.width, height / clone.height) : Math.min(width / clone.width, height / clone.height);
      clone.rescale(scale);
      clone.x = (width - clone.width) / 2;
      clone.y = (height - clone.height) / 2;
      clone.name = `${name} / Exact editable ${id}`;
      tag(clone, {
        entity: 'atlas-source-instance', subject_id: P.subjectId, atlas_source_id: id,
        source_path: definition.sourcePath, sha256: definition.sha256,
        authority_status: definition.authorityStatus, verification_status: definition.verificationStatus,
        publication_status: definition.publicationStatus, approximation: 'forbidden'
      });
      await addText(specimen, { text: label, style: 'Data/Micro', color: foreground, width, name: `${name} / Source label` }, x, y + height + 10);
      return { viewport, clone };
    };

    const addEmbeddedAssetBoundary = async (y) => {
      await addText(specimen, {
        text: 'DOCUMENTATION PAGE MAY PUBLISH / EMBEDDED GOVERNED-PROVISIONAL ATLAS EXPORT MAY NOT / NOT VERIFIED',
        style: 'Technical/Label', color: FALLBACK.warning, width: 1216, name: 'Atlas / Embedded asset publication boundary'
      }, 32, y);
    };

    if (P.subjectId === '07.01') {
      addRect(specimen, { x: 32, y: 84, width: 1216, height: 576, fill: solid(FALLBACK.void), stroke: boundSolid(borderRef, border), name: 'Atlas provenance / Instrument console' });
      await addText(specimen, { text: 'FIELD SOURCE / HASH / SIZE / STATUS', style: 'Industrial/H3', color: FALLBACK.paper, width: 1120, name: 'Atlas provenance / Heading' }, 56, 112);
      for (let index = 0; index < P.atlasSources.length; index += 1) {
        const definition = P.atlasSources[index];
        const y = 184 + index * 36;
        await addText(specimen, { text: `${definition.id.toUpperCase()}  /  ${definition.width}×${definition.height}  /  ${definition.sha256.slice(0, 16)}…  /  NONPUBLISHABLE`, style: 'Data/Micro', color: index % 2 === 0 ? FALLBACK.paper : FALLBACK.ash300, width: 1160, name: `Atlas provenance / ${definition.id}` }, 56, y);
      }
      await addText(specimen, { text: 'SYNTHETIC SINGLE-MASS FIELD / OWNER-SELECTED LEFT CONTINUOUS LENS / ONE SOURCE LIBRARY / NO APPROXIMATION', style: 'Technical/Label', color: FALLBACK.signal, width: 1160, name: 'Atlas provenance / Invariant' }, 56, 628);
      return;
    }

    if (P.subjectId === '07.00') {
      const overview = [
        ['atlasSpectralLarge', 'CONTINUOUS SPECTRAL'],
        ['atlasContoursLarge', 'CONTOUR LINES'],
        ['atlasDotsLarge', 'DOT DENSITY'],
        ['atlasHatchLarge', 'HATCHING']
      ];
      for (let index = 0; index < overview.length; index += 1) {
        const [id, label] = overview[index];
        await placeExactSource(id, { x: 32 + (index % 2) * 616, y: 86 + Math.floor(index / 2) * 260, width: 592, height: 220, crop: true, name: `Atlas overview / ${label}`, label: `${label} / EXACT GOVERNED SOURCE` });
      }
      await addEmbeddedAssetBoundary(610);
      return;
    }

    if (P.subjectId === '07.02') {
      await placeExactSource('atlasSpectralLarge', { x: 32, y: 88, width: 760, height: 428, name: 'Continuous spectral / Large source', label: 'LARGE / EXACT CONTINUOUS SPECTRAL FIELD' });
      await placeExactSource('atlasSpectral', { x: 824, y: 88, width: 424, height: 238, crop: true, name: 'Continuous spectral / Medium source', label: 'MEDIUM / SAME GOVERNED FIELD' });
      await placeExactSource('aperture', { x: 824, y: 374, width: 424, height: 268, crop: false, background: FALLBACK.paper, name: 'Continuous spectral / Aperture source', label: 'APERTURE / OWNER-SELECTED LEFT CONTINUOUS LENS' });
    } else if (P.subjectId === '07.03') {
      await placeExactSource('atlasBands', { x: 32, y: 100, width: 592, height: 333, name: 'Bands / Exact stepped field', label: 'STEPPED BANDS / EXACT SOURCE' });
      await placeExactSource('atlasSpectral', { x: 656, y: 100, width: 592, height: 333, name: 'Bands / Continuous comparison', label: 'CONTINUOUS SOURCE / SAME FIELD' });
    } else if (P.subjectId === '07.04') {
      const contourProofs = [
        ['atlasContoursDark', FALLBACK.void, 'DARK CHASSIS'],
        ['atlasContoursLight', FALLBACK.paper, 'PAPER CHASSIS'],
        ['atlasContoursLarge', FALLBACK.void, 'LARGE OPTICAL SIZE']
      ];
      for (let index = 0; index < contourProofs.length; index += 1) {
        const [id, viewportBackground, label] = contourProofs[index];
        await placeExactSource(id, { x: 32 + index * 404, y: 126, width: 380, height: 214, crop: true, background: viewportBackground, name: `Contours / ${label}`, label: `${label} / EXACT SOURCE` });
      }
    } else if (P.subjectId === '07.06') {
      await placeExactSource('atlasDotsLarge', { x: 32, y: 90, width: 760, height: 428, name: 'Dots / Large source', label: 'LARGE DOT DENSITY / EXACT SOURCE' });
      await placeExactSource('atlasDots', { x: 824, y: 90, width: 424, height: 238, crop: true, name: 'Dots / Medium source', label: 'MEDIUM DOT DENSITY / SAME FIELD' });
      await placeExactSource('atlasContoursLarge', { x: 824, y: 376, width: 424, height: 238, crop: true, name: 'Dots / Contour anchor', label: 'CONTOUR ANCHOR / SAME FIELD' });
    } else if (P.subjectId === '07.07') {
      await placeExactSource('atlasHatchLarge', { x: 32, y: 100, width: 592, height: 333, name: 'Hatch / Large source', label: 'LARGE HATCH / EXACT SOURCE' });
      await placeExactSource('atlasHatch', { x: 656, y: 100, width: 592, height: 333, name: 'Hatch / Medium source', label: 'MEDIUM HATCH / SAME FIELD' });
    } else if (P.subjectId === '07.11') {
      await placeExactSource('atlasMicro', { x: 32, y: 116, width: 96, height: 48, name: 'Micro / Actual size', label: 'ACTUAL 96×48' });
      await placeExactSource('atlasMicro', { x: 176, y: 92, width: 576, height: 288, name: 'Micro / Enlarged inspection', label: '6× INSPECTION / NO INVENTED DETAIL' });
      await placeExactSource('atlasContoursLarge', { x: 824, y: 92, width: 424, height: 238, crop: true, name: 'Micro / Large parent', label: 'LARGE PARENT / EXACT SOURCE' });
      await placeExactSource('atlasContoursDark', { x: 824, y: 382, width: 424, height: 238, crop: true, name: 'Micro / Medium parent', label: 'MEDIUM PARENT / EXACT SOURCE' });
    } else {
      throw new Error(`ATLAS_RENDERER_MISSING:${P.subjectId}`);
    }
    await addEmbeddedAssetBoundary(700);
  };

  const renderMotion = async () => {
    addSourcedSvg(specimen, 'captureSequence', { x: 32, y: 80, maxWidth: 1216, maxHeight: 390, name: 'Capture / Exact generated sequence' });
    const stages = ['APPROACH', 'COMPRESS', 'ECLIPSE', 'LOCK', 'RELEASE'];
    for (let i = 0; i < stages.length; i += 1) {
      const x = 32 + i * 244;
      addRect(specimen, { x, y: 518, width: 220, height: 116, fill: i === 3 ? boundSolid('Brand/brand/accent/signal', FALLBACK.signal) : boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: boundSolid(borderRef, border), name: `Capture state / ${stages[i]}` });
      await addText(specimen, { text: `${String(i + 1).padStart(2, '0')} / ${stages[i]}`, style: 'Technical/Label', color: i === 3 ? FALLBACK.void : foreground, width: 180, align: 'CENTER', name: `Capture label / ${stages[i]}` }, x + 20, 562);
    }
  };

  const renderComponents = async () => {
    const refs = P.reuse.componentRefs.length ? P.reuse.componentRefs : ['local/signal-action', 'local/status-indicator', 'sds/button', 'sds/tag'];
    let placed = 0;
    for (const ref of refs.slice(0, 6)) {
      const registry = P.componentRegistry[ref];
      if (!registry) continue;
      let instance = null;
      try {
        if (registry.source === 'local-existing' && registry.nodeId) {
          const component = await figma.getNodeByIdAsync(registry.nodeId);
          if (component && component.type === 'COMPONENT_SET' && component.defaultVariant) instance = component.defaultVariant.createInstance();
          else if (component && component.type === 'COMPONENT') instance = component.createInstance();
        } else if (registry.assetType === 'component') {
          const component = await figma.importComponentByKeyAsync(registry.componentKey);
          instance = component.createInstance();
        } else if (registry.assetType === 'component_set') {
          const set = await figma.importComponentSetByKeyAsync(registry.componentKey);
          const component = set.defaultVariant || set.children.find((child) => child.type === 'COMPONENT');
          if (component) instance = component.createInstance();
        }
      } catch (error) {
        await addText(specimen, { text: `${ref.toUpperCase()} / IMPORT REQUIRES LIVE LIBRARY RESOLUTION`, style: 'Technical/Label', color: FALLBACK.warning, width: 520, name: `Component import note / ${ref}` }, 48 + (placed % 2) * 610, 124 + Math.floor(placed / 2) * 180);
        placed += 1;
        continue;
      }
      if (!instance) continue;
      specimen.appendChild(instance);
      instance.name = `LIVE INSTANCE / ${ref}`;
      instance.x = 48 + (placed % 2) * 610;
      instance.y = 112 + Math.floor(placed / 2) * 190;
      const scale = Math.min(500 / instance.width, 120 / instance.height, 1.5);
      instance.rescale(scale);
      tag(instance, { entity: 'live-component-instance', component_ref: ref, subject_id: P.subjectId });
      placed += 1;
    }
    await addText(specimen, { text: 'HOST INFRASTRUCTURE FIRST / BIZARRE PERSONALITY THROUGH TOKENS, COPY, STATE, AND FIELD', style: 'Technical/Label', color: foreground, width: 1180, name: 'Components / Reuse rule' }, 48, 674);
  };

  const renderMaterials = async () => {
    const materials = [
      ['MATTE VOID', [['Palette/color/neutral/black', FALLBACK.black], ['Palette/color/neutral/ash900', FALLBACK.ash900]]],
      ['BRUSHED ALUMINUM', [['Palette/color/neutral/ash700', FALLBACK.ash700], ['Palette/color/neutral/paper', FALLBACK.paper], ['Palette/color/neutral/ash500', FALLBACK.ash500]]],
      ['OPTICAL COATING', [['Palette/color/spectrum/deep-indigo', FALLBACK.indigo], ['Palette/color/spectrum/ion-cyan', FALLBACK.cyan], ['Palette/color/spectrum/violet-shadow', FALLBACK.violet]]],
      ['REFLECTIVE FILM', [['Palette/color/neutral/void', FALLBACK.void], ['Palette/color/spectrum/solar-gold', FALLBACK.gold], ['Palette/color/neutral/paper', FALLBACK.paper]]]
    ];
    for (let i = 0; i < materials.length; i += 1) {
      const [label, colors] = materials[i];
      const x = 32 + i * 304;
      const stops = colors.map(([ref, fallback], index) => ({ ref, fallback, position: index / (colors.length - 1) }));
      addRect(specimen, { x, y: 96, width: 280, height: 430, fill: gradient(stops, master, i % 2 ? 8 : 90), stroke: boundSolid(borderRef, border), name: `Material coupon / ${label}` });
      await addText(specimen, { text: label, style: 'Technical/Label', color: foreground, width: 280, name: `Material label / ${label}` }, x, 548);
      addEllipse(specimen, { x: x + 24, y: 122, width: 18, height: 18, fill: solid(FALLBACK.void), stroke: solid(FALLBACK.ash300), name: `Fastener / ${label}` });
      addEllipse(specimen, { x: x + 238, y: 486, width: 18, height: 18, fill: solid(FALLBACK.void), stroke: solid(FALLBACK.ash300), name: `Fastener / ${label}` });
    }
    await addText(specimen, { text: 'GRADIENTS DESCRIBE PHYSICAL CAUSE. SIGNAL LIME REMAINS A FLAT OPERATIONAL CHANNEL.', style: 'Technical/Label', color: foreground, width: 1180, name: 'Materials / Cause rule' }, 32, 652);
  };

  const renderApplications = async () => {
    const assetId = Object.keys(P.assets)[0];
    if (assetId) addSourcedSvg(specimen, assetId, { x: 610, y: 92, maxWidth: 590, maxHeight: 520, name: `Application / Governed ${assetId}` });
    addRect(specimen, { x: 48, y: 100, width: 480, height: 520, fill: gradient([
      { ref: 'Palette/color/neutral/void', fallback: FALLBACK.void, position: 0 },
      { ref: 'Palette/color/spectrum/deep-indigo', fallback: FALLBACK.indigo, position: 0.44 },
      { ref: 'Palette/color/neutral/void', fallback: FALLBACK.void, position: 1 }
    ], master, -18), stroke: boundSolid(borderRef, border), name: 'Application / Native reconstruction field' });
    await addText(specimen, { text: 'CATCH\nTHE\nSTARS', style: 'Display/H2', color: FALLBACK.paper, width: 390, name: 'Application / Campaign headline' }, 84, 150);
    addRect(specimen, { x: 84, y: 514, width: 344, height: 10, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), name: 'Application / Signal rail' });
    await addText(specimen, { text: 'IMAGEGEN TARGET → AFFINITY RECONSTRUCTION → FIGMA HANDOFF', style: 'Technical/Label', color: foreground, width: 1120, name: 'Application / Honesty chain' }, 48, 666);
  };

  const renderRelease = async () => {
    const columns = ['ASSET', 'SOURCE', 'STATUS', 'EVIDENCE', 'RELEASE'];
    const rows = [
      ['GRAVITY WELL', 'CANONICAL SVG', 'GOVERNED', 'HASH', 'PENDING QA'],
      ['CONTINUOUS LENS', 'PROVISIONAL', 'NOT VERIFIED', 'COMPARE', 'BLOCKED'],
      ['TOKENS', 'REPO', 'GOVERNED', 'TESTS', 'PENDING QA'],
      ['FIGMA NATIVE', 'MCP', 'NOT VERIFIED', 'SCREENSHOT', 'PENDING QA'],
      ['AFFINITY MASTER', 'MCP', 'NOT VERIFIED', 'EXPORT', 'PENDING QA']
    ];
    const widths = [250, 240, 240, 220, 240];
    let x = 32;
    for (let i = 0; i < columns.length; i += 1) {
      addRect(specimen, { x, y: 94, width: widths[i], height: 66, fill: boundSolid('Brand/brand/accent/signal', FALLBACK.signal), stroke: boundSolid(borderRef, border), name: `Release header / ${columns[i]}` });
      await addText(specimen, { text: columns[i], style: 'Technical/Label', color: FALLBACK.void, width: widths[i] - 24, name: `Release header label / ${columns[i]}` }, x + 12, 119);
      x += widths[i];
    }
    for (let row = 0; row < rows.length; row += 1) {
      x = 32;
      for (let col = 0; col < columns.length; col += 1) {
        addRect(specimen, { x, y: 160 + row * 82, width: widths[col], height: 82, fill: boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : (row % 2 ? '#FFFFFF' : FALLBACK.paper)), stroke: boundSolid(borderRef, border), name: `Release cell / ${row + 1}.${col + 1}` });
        await addText(specimen, { text: rows[row][col], style: 'Data/Micro', color: foreground, width: widths[col] - 24, name: `Release value / ${rows[row][col]}` }, x + 12, 192 + row * 82);
        x += widths[col];
      }
    }
    await addText(specimen, { text: 'NO PASS EVIDENCE IS INVENTED. RELEASE ONLY AFTER VISUAL, ACCESSIBILITY, RTL, MOTION, AND PROVENANCE GATES.', style: 'Technical/Label', color: foreground, width: 1180, name: 'Release / Evidence rule' }, 32, 650);
  };

  const renderNoncanonical = async () => {
    const refs = ['LEGACY COVER', 'SUPERSEDED APERTURE', 'OLD TOKEN NAMES', 'REJECTED CONCEPT PIXELS', 'IMMUTABLE NODE IDS', 'HISTORICAL HASHES'];
    for (let i = 0; i < refs.length; i += 1) {
      const x = 32 + (i % 3) * 406;
      const y = 100 + Math.floor(i / 3) * 240;
      addRect(specimen, { x, y, width: 376, height: 202, fill: boundSolid('Modes/surface/elevated', dark ? FALLBACK.iron : FALLBACK.paper), stroke: solid(FALLBACK.danger), strokeWeight: 2, name: `Noncanonical / ${refs[i]}` });
      await addText(specimen, { text: 'NONCANONICAL / LOCKED', style: 'Data/Micro', color: FALLBACK.danger, width: 320, name: `Noncanonical status / ${refs[i]}` }, x + 28, y + 30);
      await addText(specimen, { text: refs[i], style: 'Industrial/H4', color: foreground, width: 320, name: `Noncanonical label / ${refs[i]}` }, x + 28, y + 84);
    }
  };

  const renderers = {
    '00': renderEntry,
    '01': renderBrandCore,
    '02': renderIdentity,
    '03': renderColor,
    '04': renderGradient,
    '05': renderTypography,
    '06': renderGeometry,
    '07': renderAtlas,
    '07-concept': renderAtlasConcept,
    '08': renderMotion,
    '09': renderComponents,
    '10': renderMaterials,
    '11': renderApplications,
    '12': renderRelease,
    '99': renderNoncanonical
  };
  const specimenRenderResult = await renderers[P.rendererId]();

  const panelStart = specimenY + specimenHeight + 92;
  const sectionPanels = [];
  for (let row = 0; row < Math.ceil(P.sections.length / 2); row += 1) {
    const rowPanels = [];
    for (let col = 0; col < 2; col += 1) {
      const section = P.sections[row * 2 + col];
      if (!section) continue;
      const layerName = LAYER_BY_SECTION[section.title] || '99 / Provenance, Status, Evidence, and Navigation';
      const layer = layerMap.get(layerName);
      const panelFrame = figma.createFrame();
      panelFrame.name = `Section ${String(row * 2 + col + 1).padStart(2, '0')} / ${section.title}`;
      panelFrame.layoutMode = 'VERTICAL';
      panelFrame.resize(620, 180);
      panelFrame.primaryAxisSizingMode = 'AUTO';
      panelFrame.counterAxisSizingMode = 'FIXED';
      panelFrame.paddingTop = 28;
      panelFrame.paddingRight = 28;
      panelFrame.paddingBottom = 30;
      panelFrame.paddingLeft = 28;
      panelFrame.itemSpacing = 18;
      panelFrame.fills = [boundSolid(panelFillRef, panel)];
      setStroke(panelFrame, boundSolid(borderRef, border), 1);
      layer.appendChild(panelFrame);
      const label = await makeText({ text: `${String(row * 2 + col + 1).padStart(2, '0')} / ${section.title.toUpperCase()}`, style: 'Technical/Label', colorRef: section.status === 'N/A' ? secondaryRef : 'Brand/brand/accent/signal', color: section.status === 'N/A' ? border : FALLBACK.signalInk, width: 564, name: 'Section / Heading' });
      panelFrame.appendChild(label);
      const status = await makeText({ text: section.status, style: 'Data/Micro', colorRef: secondaryRef, color: border, width: 564, name: 'Section / Applicability' });
      panelFrame.appendChild(status);
      const body = await makeText({ text: section.body, style: 'Body/Base', colorRef: contentRef, color: foreground, width: 564, name: 'Section / Exact governed copy' });
      panelFrame.appendChild(body);
      tag(panelFrame, { entity: 'governed-section', subject_id: P.subjectId, section_title: section.title, section_status: section.status, content_fingerprint: P.contentFingerprint });
      rowPanels.push({ frame: panelFrame, col });
      sectionPanels.push(panelFrame);
    }
    const rowHeight = Math.max(...rowPanels.map(({ frame }) => frame.height));
    const previousBottom = row === 0 ? panelStart : Math.max(...sectionPanels.filter((_, index) => Math.floor(index / 2) === row - 1).map((frame) => frame.y + frame.height)) + 30;
    for (const { frame, col } of rowPanels) {
      frame.x = col === 0 ? 80 : 740;
      frame.y = previousBottom;
      if (frame.height < rowHeight) frame.resize(frame.width, rowHeight);
    }
  }

  const panelsBottom = sectionPanels.length ? Math.max(...sectionPanels.map((node) => node.y + node.height)) : specimenY + specimenHeight;
  const contentFooterY = panelsBottom + 54;
  const finalHeight = Math.max(P.minimumHeightPx, contentFooterY + 92);
  const footerY = finalHeight - 92;
  await addText(layerMap.get('99 / Provenance, Status, Evidence, and Navigation'), { text: `CATCH THE STARS  /  ${P.subjectId}  /  ${P.provenanceAndStatus.authorityStatus.toUpperCase()}  /  ${P.provenanceAndStatus.verificationStatus}`, style: 'Technical/Label', colorRef: secondaryRef, color: border, width: 1280, name: 'Footer / Permanent phrase and status' }, 80, footerY);
  addLine(layerMap.get('99 / Provenance, Status, Evidence, and Navigation'), { x: 80, y: footerY - 24, width: 1280, stroke: boundSolid(borderRef, border), name: 'Footer / Divider' });
  master.resize(1440, finalHeight);
  for (const layer of layerMap.values()) layer.resize(1440, finalHeight);

  if (P.conceptReferenceIds.length) {
    await addText(referenceLayer, { text: `CONCEPT REFERENCE — NONPUBLISHABLE / ${P.conceptReferenceIds.join(', ')}`, style: 'Data/Micro', color: FALLBACK.warning, width: 520, align: 'RIGHT', name: 'Reference / Nonpublishable label' }, 840, specimenY + 22);
    tag(referenceLayer, { concept_reference_ids: P.conceptReferenceIds.join(','), publication_status: 'nonpublishable' });
  }
  const conceptReferenceTarget = P.conceptReference
    ? master.findOne((node) => node.getSharedPluginData(NS, 'entity') === 'concept-reference-target')
    : null;
  if (P.conceptReference && !conceptReferenceTarget) throw new Error('CONCEPT_REFERENCE_TARGET_MISSING');
  referenceLayer.locked = !P.conceptReference;

  tag(master, {
    entity: 'subject-master',
    subject_id: P.subjectId,
    batch_id: P.batchId,
    plan_id: P.planId,
    plan_version: P.planVersion,
    plan_sha256: P.planCanonicalSha256,
    spec_sha256: P.specCanonicalSha256,
    manifest_sha256: P.manifestCanonicalSha256,
    content_fingerprint: P.contentFingerprint,
    recipe_id: P.recipeId,
    population_revision: P.populationRevision,
    authority_status: P.provenanceAndStatus.authorityStatus,
    verification_status: P.provenanceAndStatus.verificationStatus,
    publication_status: P.provenanceAndStatus.publicationStatus,
    build_status: P.conceptReference ? 'pending-reference-image' : 'complete'
  });
  tag(page, {
    subject_id: P.subjectId, population_revision: P.populationRevision, current_master_id: master.id,
    build_status: P.conceptReference ? 'pending-reference-image' : 'complete'
  });

  const layerAudit = P.layerOrder.map((name) => ({ name, id: layerMap.get(name).id, childCount: layerMap.get(name).children.length }));
  const createdNodeIds = [master.id, ...master.findAll(() => true).map((node) => node.id)];
  return {
    status: P.conceptReference ? 'created-pending-reference-image' : 'created',
    subjectId: P.subjectId,
    pageId: page.id,
    masterId: master.id,
    finalHeight,
    sectionCount: sectionPanels.length,
    descendantCount: master.findAll(() => true).length,
    conceptReferenceTargetId: conceptReferenceTarget?.id || null,
    referenceLayerId: referenceLayer.id,
    continuousLensViewportId: specimenRenderResult?.continuousLensViewportId || null,
    continuousLensCreatedNodeIds: specimenRenderResult?.continuousLensCreatedNodeIds || [],
    sourceProofNodeIds: specimenRenderResult?.sourceProofNodeIds || [],
    createdNodeIds,
    mutatedNodeIds: [page.id],
    preservedNodeIds: [],
    layers: layerAudit
  };
}

const rendererById = {
  '00': 'renderEntry',
  '01': 'renderBrandCore',
  '02': 'renderIdentity',
  '03': 'renderColor',
  '04': 'renderGradient',
  '05': 'renderTypography',
  '06': 'renderGeometry',
  '07': 'renderAtlas',
  '07-concept': 'renderAtlasConcept',
  '08': 'renderMotion',
  '09': 'renderComponents',
  '10': 'renderMaterials',
  '11': 'renderApplications',
  '12': 'renderRelease',
  '99': 'renderNoncanonical'
};

function findMatchingBrace(source, openingIndex) {
  let depth = 0;
  for (let index = openingIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      for (index += 1; index < source.length; index += 1) {
        if (source[index] === '\\') index += 1;
        else if (source[index] === quote) break;
      }
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unbalanced generated plugin function');
}

function keepOnlyRenderer(source, rendererId) {
  const keep = rendererById[rendererId];
  if (!keep) throw new Error(`No renderer for ${rendererId}`);
  const names = Object.values(rendererById);
  const ranges = [];
  for (const name of names) {
    if (name === keep) continue;
    const start = source.indexOf(`const ${name} = async () => {`);
    if (start < 0) throw new Error(`Renderer declaration not found: ${name}`);
    const opening = source.indexOf('{', start);
    const closing = findMatchingBrace(source, opening);
    let end = closing + 1;
    while (source[end] === ';' || /\s/.test(source[end])) end += 1;
    ranges.push([start, end]);
  }
  ranges.sort((a, b) => b[0] - a[0]);
  for (const [start, end] of ranges) source = source.slice(0, start) + source.slice(end);
  const mapStart = source.indexOf('const renderers = {');
  if (mapStart < 0) throw new Error('Renderer map not found');
  const mapOpening = source.indexOf('{', mapStart);
  const mapClosing = findMatchingBrace(source, mapOpening);
  let mapEnd = mapClosing + 1;
  while (source[mapEnd] === ';' || /\s/.test(source[mapEnd])) mapEnd += 1;
  source = source.slice(0, mapStart) + source.slice(mapEnd);
  source = source.replace('await renderers[P.rendererId]();', `await ${keep}();`);
  return source;
}

function compactGeneratedJavaScript(source) {
  let compact = '';
  for (let index = 0; index < source.length;) {
    const character = source[index];
    if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      compact += character;
      index += 1;
      while (index < source.length) {
        const quoted = source[index];
        compact += quoted;
        index += 1;
        if (quoted === '\\' && index < source.length) {
          compact += source[index];
          index += 1;
        } else if (quoted === quote) {
          break;
        }
      }
      continue;
    }
    if (/\s/.test(character)) {
      let nextIndex = index + 1;
      while (nextIndex < source.length && /\s/.test(source[nextIndex])) nextIndex += 1;
      const previous = compact.at(-1) || '';
      const next = source[nextIndex] || '';
      const word = /[A-Za-z0-9_$]/;
      if ((word.test(previous) && word.test(next))
        || (previous === '+' && next === '+')
        || (previous === '-' && next === '-')) compact += ' ';
      index = nextIndex;
      continue;
    }
    compact += character;
    index += 1;
  }
  return compact;
}

const functionSource = compactGeneratedJavaScript(keepOnlyRenderer(populateBizarreSubject.toString(), payload.rendererId)
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .join(' '));
const continuousLensFunctionSource = continuousLensConcept
  ? compactGeneratedJavaScript(`${buildContinuousLensR20Geometry.toString()} ${createContinuousLensR20Figma.toString()}`
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' '))
  : '';
const code = `const P=${JSON.stringify(payload)};${continuousLensFunctionSource} return await (${functionSource})(P);`;
process.stdout.write(code);
