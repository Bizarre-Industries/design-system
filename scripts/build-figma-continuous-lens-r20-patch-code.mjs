#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContinuousLensR20Geometry,
  CONTINUOUS_LENS_R20_REVISION,
  CONTINUOUS_LENS_R20_SUBJECT_IDS,
  continuousLensR20ConceptForSubject,
  createContinuousLensR20Figma,
} from './lib/continuous-lens-r20.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'governance/design-ledgers/figma/bizarre-104-page-population-plan-v1.json'), 'utf8'));
const gradients = JSON.parse(fs.readFileSync(path.join(root, 'production/affinity/manifests/bizarre-gradient-recipes-v1.json'), 'utf8'));
const conceptPaths = {
  '07.05': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.05-shaded-contour-continuous-lens-v2.png',
  '07.08': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.08-field-grain-continuous-lens-v2.png',
  '07.09': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.09-material-response-continuous-lens-v2.png',
  '07.10': 'outputs/imagegen/atlas-representation-studies/v2.0.0/generated/07.10-one-color-continuous-lens-v2.png',
};
const targetMapId = 'bizarre-figma-continuous-lens-r20-target-map-v1';

const usage = `Usage:
  node scripts/build-figma-continuous-lens-r20-patch-code.mjs <07.05|07.08|07.09|07.10> \\
    --page-id <figma-page-id> --master-id <subject-master-id> --viewport-id <native-viewport-id>

  node scripts/build-figma-continuous-lens-r20-patch-code.mjs <subject-id> --target-map <governed-map.json>

The governed map must contain:
  {"mapId":"${targetMapId}","fileKey":"${plan.scope.figmaFileKey}","subjects":{"07.05":{"pageId":"…","masterId":"…","viewportId":"…"}}}

The script writes one official use_figma JavaScript patch to stdout. It does not call Figma.`;

function readConceptReference(subjectId) {
  const sourcePath = conceptPaths[subjectId];
  const bytes = fs.readFileSync(path.join(root, sourcePath));
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Concept reference is not a PNG: ${sourcePath}`);
  return {
    id: `concept.atlas.${subjectId}`,
    sourcePath,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function parseOptions(argv) {
  const options = {};
  const allowed = new Set(['page-id', 'master-id', 'viewport-id', 'target-map']);
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}\n${usage}`);
    const name = key.slice(2);
    if (!allowed.has(name)) throw new Error(`Unknown option: ${key}\n${usage}`);
    if (Object.hasOwn(options, name)) throw new Error(`Duplicate option: ${key}\n${usage}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}\n${usage}`);
    options[name] = value;
    index += 1;
  }
  return options;
}

function readTargetMap(relativeOrAbsolutePath, subjectId) {
  if (!relativeOrAbsolutePath) return null;
  const absolutePath = path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(root, relativeOrAbsolutePath);
  const targetMap = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  if (targetMap.mapId !== targetMapId) throw new Error(`Ungoverned target map: expected ${targetMapId}`);
  if (targetMap.fileKey !== plan.scope.figmaFileKey) throw new Error(`Target-map Figma file drift: ${targetMap.fileKey}`);
  const target = targetMap.subjects?.[subjectId];
  if (!target) throw new Error(`Target map has no entry for ${subjectId}`);
  return target;
}

function chooseTargetId(name, explicitValue, mappedValue) {
  if (explicitValue && mappedValue && explicitValue !== mappedValue) throw new Error(`${name} conflicts with governed target map`);
  const value = explicitValue || mappedValue;
  if (!value || /\s/.test(value)) throw new Error(`Missing or invalid ${name}`);
  return value;
}

async function patchContinuousLensR20(P) {
  const NS = 'bizarre.masterbrand';
  if (figma.fileKey && figma.fileKey !== P.fileKey) throw new Error(`FIGMA_FILE_KEY_DRIFT:${figma.fileKey}`);
  const page = await figma.getNodeByIdAsync(P.pageId);
  if (!page || page.type !== 'PAGE') throw new Error(`PAGE_NOT_FOUND:${P.pageId}`);
  if (page.name !== P.pageName) throw new Error(`PAGE_NAME_DRIFT:${page.name}`);
  await figma.setCurrentPageAsync(page);

  const [master, viewport] = await Promise.all([
    figma.getNodeByIdAsync(P.masterId),
    figma.getNodeByIdAsync(P.viewportId),
  ]);
  if (!master || master.type !== 'FRAME') throw new Error(`SUBJECT_MASTER_NOT_FOUND:${P.masterId}`);
  if (!viewport || viewport.type !== 'FRAME') throw new Error(`CONCEPT_VIEWPORT_NOT_FOUND:${P.viewportId}`);
  if (master.getSharedPluginData(NS, 'entity') !== 'subject-master' || master.getSharedPluginData(NS, 'subject_id') !== P.subjectId) {
    throw new Error(`SUBJECT_MASTER_PROVENANCE_DRIFT:${master.id}`);
  }
  let ancestor = viewport.parent;
  while (ancestor && ancestor !== master) ancestor = ancestor.parent;
  if (ancestor !== master) throw new Error(`VIEWPORT_OUTSIDE_SUBJECT_MASTER:${viewport.id}`);

  const referenceTarget = master.findOne((node) => node.getSharedPluginData(NS, 'entity') === 'concept-reference-target');
  if (!referenceTarget || referenceTarget.getSharedPluginData(NS, 'sha256') !== P.concept.reference.sha256) {
    throw new Error('IMAGEGEN_REFERENCE_TARGET_MISSING_OR_DRIFTED');
  }
  const sourceProofs = master.findAll((node) => node.type === 'FRAME' && node.name.startsWith('Atlas comparison / Source proof ') && node.name.endsWith(' / Exact viewport'));
  if (sourceProofs.length !== P.concept.proofSourceIds.length) {
    throw new Error(`SOURCE_PROOF_CARD_COUNT_DRIFT:${sourceProofs.length}`);
  }
  const nativeLabel = master.findOne((node) => node.type === 'TEXT' && node.name === 'Atlas comparison / Native reconstruction / Source label');
  if (!nativeLabel) throw new Error('NATIVE_RECONSTRUCTION_LABEL_MISSING');
  const labelFonts = nativeLabel.getStyledTextSegments(['fontName']).map((segment) => segment.fontName);
  const uniqueFonts = [...new Map(labelFonts.map((fontName) => [`${fontName.family}/${fontName.style}`, fontName])).values()];
  await Promise.all(uniqueFonts.map((fontName) => figma.loadFontAsync(fontName)));

  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
  ]);
  const collectionNameById = new Map(collections.map((collection) => [collection.id, collection.name]));
  const variableByRef = new Map(variables.map((variable) => [`${collectionNameById.get(variable.variableCollectionId)}/${variable.name}`, variable]));
  const rgb = (hex) => {
    const value = hex.replace('#', '');
    return { r: parseInt(value.slice(0, 2), 16) / 255, g: parseInt(value.slice(2, 4), 16) / 255, b: parseInt(value.slice(4, 6), 16) / 255 };
  };
  const solid = (hex, opacity = 1) => ({ type: 'SOLID', color: rgb(hex), opacity });
  const tag = (node, values) => {
    for (const [key, value] of Object.entries(values)) node.setSharedPluginData(NS, key, String(value ?? ''));
  };
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
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[cosine, sine, (1 - cosine - sine) / 2], [-sine, cosine, (1 + sine - cosine) / 2]],
      gradientStops: stops.map((stop) => ({
        position: stop.position,
        color: { ...resolvedColor(stop.ref, stop.fallback, consumer), a: stop.opacity ?? 1 },
      })),
    };
  };

  const removedNodeIds = viewport.children.map((node) => node.id);
  for (const child of [...viewport.children]) child.remove();
  viewport.resize(600, 238);
  viewport.clipsContent = true;
  viewport.cornerRadius = 0;
  viewport.name = 'Atlas comparison / Native reconstruction / R20 editable viewport';

  const receipt = createContinuousLensR20Figma({
    figma,
    parent: viewport,
    subjectId: P.subjectId,
    concept: P.concept,
    buildGeometry: buildContinuousLensR20Geometry,
    solid,
    boundSolid,
    gradient,
    tag,
  });
  nativeLabel.characters = `R20 NATIVE GEOMETRY / ${P.concept.orbitCount} NON-CROSSING ORBITS / ONE CUBIC TRAJECTORY / 600×238`;
  tag(master, {
    population_revision: P.populationRevision,
    concept_revision: P.concept.revision,
    concept_patch_status: 'complete',
  });
  tag(page, {
    population_revision: P.populationRevision,
    concept_revision: P.concept.revision,
    current_master_id: master.id,
    concept_patch_status: 'complete',
  });

  return {
    status: 'continuous-lens-r20-patched',
    subjectId: P.subjectId,
    pageId: page.id,
    masterId: master.id,
    viewportId: viewport.id,
    createdNodeIds: receipt.createdNodeIds,
    mutatedNodeIds: [page.id, master.id, viewport.id, nativeLabel.id],
    removedNodeIds,
    orbitNodeIds: receipt.orbitNodeIds,
    apertureNodeId: receipt.apertureNodeId,
    trajectoryNodeId: receipt.trajectoryNodeId,
    datumNodeId: receipt.datumNodeId,
    preservedReferenceTargetId: referenceTarget.id,
    preservedSourceProofIds: sourceProofs.map((node) => node.id),
  };
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
      if ((word.test(previous) && word.test(next)) || (previous === '+' && next === '+') || (previous === '-' && next === '-')) compact += ' ';
      index = nextIndex;
      continue;
    }
    compact += character;
    index += 1;
  }
  return compact;
}

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}
const subjectId = argv.shift();
if (!CONTINUOUS_LENS_R20_SUBJECT_IDS.includes(subjectId)) throw new Error(`Unsupported subject: ${subjectId || '(missing)'}\n${usage}`);
const options = parseOptions(argv);
const mappedTarget = readTargetMap(options['target-map'], subjectId);
const planned = plan.subjects.find((subject) => subject.subjectId === subjectId);
if (!planned) throw new Error(`Subject missing from Figma population plan: ${subjectId}`);
const pageId = chooseTargetId('page-id', options['page-id'] || planned.liveFigmaPage.pageNodeId, mappedTarget?.pageId);
if (pageId !== planned.liveFigmaPage.pageNodeId) throw new Error(`page-id conflicts with governed page map for ${subjectId}`);
const masterId = chooseTargetId('master-id', options['master-id'], mappedTarget?.masterId);
const viewportId = chooseTargetId('viewport-id', options['viewport-id'], mappedTarget?.viewportId);
if (masterId === viewportId) throw new Error('master-id and viewport-id must be distinct');

const conceptReference = readConceptReference(subjectId);
const concept = continuousLensR20ConceptForSubject(subjectId, {
  conceptReference,
  materialRecipe: gradients.recipes.find((recipe) => recipe.subjectId === '04.02'),
});
const payload = {
  fileKey: plan.scope.figmaFileKey,
  subjectId,
  pageId,
  pageName: planned.exactPageName,
  masterId,
  viewportId,
  populationRevision: `figma-native-104-v1.0.0-${CONTINUOUS_LENS_R20_REVISION}`,
  concept,
};
const source = [
  buildContinuousLensR20Geometry.toString(),
  createContinuousLensR20Figma.toString(),
  patchContinuousLensR20.toString(),
].map(compactGeneratedJavaScript).join(' ');
process.stdout.write(`const P=${JSON.stringify(payload)};${source} return await patchContinuousLensR20(P);`);
