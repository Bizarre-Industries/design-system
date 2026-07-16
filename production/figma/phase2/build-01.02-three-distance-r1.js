const STAGE = 'preflight-and-skeleton';

const PAGE_ID = '47:8';
const LEGACY_ROOT_ID = '83:159';
const NS = 'bizarre_design_system';
const REVISION = 'figma-01.02-three-distance-r1-affinity-r3';
const AFFINITY_REVISION = 'brand-core-three-distance-progressive-field-r3-governed-sources';
const CONTENT_FINGERPRINT = '038ff17ca9daab97cc8b4c038172c9f6b786b01bca072ef142151ba5c275b7e6';
const FIELD_CONFIGURATION_HASH = '7e35c8cc2641acbb4bbf2afcb7b215af94544d8d6bdae3d55180cfd289838338';
const APERTURE_VERSION = 'continuous-lens-aperture/owner-selected-left-v2';
const APERTURE_PATH_SHA = 'bb4079e12e6db7bb2387dc7fbe174b3283b57d5af4d4e942e4053bd96158c9dd';
const PALETTE_COLLECTION_ID = 'VariableCollectionId:52:2';
const MODES_COLLECTION_ID = 'VariableCollectionId:52:10';

const SOURCE_SPECS = {
  atlasSpectralLarge: {
    nodeId: '101:114',
    sha256: 'a0a32c822abe8b8511d0d66438d9778e7b5dd8c9c7b466d43990af14f1a840cf',
  },
  atlasContoursDark: {
    nodeId: '101:466',
    sha256: 'b4694f25d640a0c4a0e849898eab392eaa3e2cafcbd4924e6082e184d229307c',
  },
  atlasContoursLarge: {
    nodeId: '101:540',
    sha256: 'a9b98e58ebdbc8afb0c42a1d7946cf681a8a5fa96a29e94dcd13face5f647e97',
  },
  atlasDotsLarge: {
    nodeId: '101:697',
    sha256: '861f47486671516e8a0ce5f5dcebae1308777a1fcd4cffdfe7967053ee500f',
  },
  atlasHatchLarge: {
    nodeId: '101:974',
    sha256: '03358c5c00f03b76004d782ddbcad688e5a259ae6dff1147138ab4b0fe2a2ec9',
  },
  atlasMicro: {
    nodeId: '101:1168',
    sha256: '374d2b9b691567ab9bc26e2b2bf67d8fdb12048826cf77f1444816a24bbe98ab',
  },
};

const COLOR_NAMES = {
  signal: 'color/accent/signal',
  signalInk: 'color/accent/ink',
  paper: 'color/neutral/paper',
  bone: 'color/neutral/bone',
  void: 'color/neutral/void',
  iron: 'color/neutral/iron',
  ash100: 'color/neutral/ash100',
  ash300: 'color/neutral/ash300',
  ash500: 'color/neutral/ash500',
  ash700: 'color/neutral/ash700',
  ash900: 'color/neutral/ash900',
};

const REQUIRED_TEXT_STYLES = [
  'Display/H2',
  'Industrial/H3',
  'Industrial/H4',
  'Heading/H5',
  'Label/Eyebrow',
  'Body/Lead',
  'Body/Base',
  'Caption/Base',
  'Code/Base',
  'Technical/Label',
  'Data/Micro',
];

const REQUIRED_SECTION_LABELS = [
  '01 / DEFINITION',
  '02 / CONSTRUCTION STEPS',
  '03 / EXACT TOKENS, ASSETS, STYLES, OR MATERIAL RECIPE',
  '04 / VARIANTS, MODES, STATES, AND OPTICAL SIZES',
  '05 / USAGE',
  '06 / ACCESSIBILITY, BILINGUAL BEHAVIOR, AND RTL',
  '07 / MOTION AND INTERACTION',
  '08 / PRODUCTION AND EXPORT',
  '09 / CORRECT EXAMPLES',
  '10 / MISUSE',
  '11 / PROVENANCE, HASHES, STATUS, AND EVIDENCE',
  '12 / PARENT AND SIBLING LINKS PLUS CANONICAL SOURCE PATHS',
];

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') throw new Error('01.02 page not found');
await figma.setCurrentPageAsync(page);

const variables = await figma.variables.getLocalVariablesAsync('COLOR');
const variableByName = new Map(
  variables
    .filter((variable) => variable.variableCollectionId === PALETTE_COLLECTION_ID)
    .map((variable) => [variable.name, variable]),
);
for (const variableName of Object.values(COLOR_NAMES)) {
  if (!variableByName.has(variableName)) throw new Error(`Missing canonical Palette variable: ${variableName}`);
}

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const modesCollection = collections.find((collection) => collection.id === MODES_COLLECTION_ID);
const paperMode = modesCollection?.modes.find((mode) => mode.name === 'paper');
if (!modesCollection || !paperMode) throw new Error('Canonical Modes / paper mode not found');

const localStyles = await figma.getLocalTextStylesAsync();
const styleByName = new Map(localStyles.map((style) => [style.name, style]));
for (const styleName of REQUIRED_TEXT_STYLES) {
  const style = styleByName.get(styleName);
  if (!style) throw new Error(`Missing local text style: ${styleName}`);
  await figma.loadFontAsync(style.fontName);
}

const sourceById = {};
for (const [sourceId, spec] of Object.entries(SOURCE_SPECS)) {
  const source = await figma.getNodeByIdAsync(spec.nodeId);
  if (!source || source.type !== 'FRAME') throw new Error(`Missing governed Figma source: ${sourceId} / ${spec.nodeId}`);
  sourceById[sourceId] = source;
}

function paint(variableName, opacity = 1) {
  const variable = variableByName.get(variableName);
  let value = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity };
  value = figma.variables.setBoundVariableForPaint(value, 'color', variable);
  return value;
}

function makeFrame(parent, name, x, y, width, height, fillName = null, clipsContent = false) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, height);
  node.x = x;
  node.y = y;
  node.clipsContent = clipsContent;
  node.fills = fillName ? [paint(fillName)] : [];
  parent.appendChild(node);
  return node;
}

function makeRect(parent, name, x, y, width, height, fillName, opacity = 1) {
  const node = figma.createRectangle();
  node.name = name;
  node.resize(width, height);
  node.x = x;
  node.y = y;
  node.fills = [paint(fillName, opacity)];
  parent.appendChild(node);
  return node;
}

function makeEllipse(parent, name, x, y, width, height, fillName) {
  const node = figma.createEllipse();
  node.name = name;
  node.resize(width, height);
  node.x = x;
  node.y = y;
  node.fills = [paint(fillName)];
  parent.appendChild(node);
  return node;
}

function makeText(parent, name, characters, x, y, width, styleName, fillName, options = {}) {
  const style = styleByName.get(styleName);
  if (!style) throw new Error(`Unknown canonical text style: ${styleName}`);
  const node = figma.createText();
  node.name = name;
  node.textStyleId = style.id;
  node.characters = characters;
  node.resize(width, 10);
  node.textAutoResize = options.fixedHeight ? 'NONE' : 'HEIGHT';
  if (options.fixedHeight) node.resize(width, options.fixedHeight);
  node.x = x;
  node.y = y;
  node.fills = [paint(fillName)];
  if (options.align) node.textAlignHorizontal = options.align;
  if (options.opacity != null) node.opacity = options.opacity;
  parent.appendChild(node);
  return node;
}

function makeRule(parent, name, x, y, width, height = 1, fillName = COLOR_NAMES.ash300) {
  return makeRect(parent, name, x, y, width, height, fillName);
}

function tag(node, key, value) {
  node.setSharedPluginData(NS, key, typeof value === 'string' ? value : JSON.stringify(value));
}

function getDraftRoot() {
  const id = page.getSharedPluginData(NS, 'phase2.01.02.draftRoot');
  if (!id) throw new Error('01.02 draft root is not registered on the page');
  const root = page.findOne((node) => node.id === id);
  if (!root || root.type !== 'FRAME') throw new Error(`Registered 01.02 draft root is missing: ${id}`);
  return root;
}

function replaceStage(root, stageKey, name, x, y, width, height) {
  const owned = root.children.filter(
    (child) => child.type === 'FRAME' && child.getSharedPluginData(NS, 'stageKey') === stageKey,
  );
  for (const child of owned) child.remove();
  const stage = makeFrame(root, name, x, y, width, height, null, true);
  tag(stage, 'stageKey', stageKey);
  tag(stage, 'buildRevision', REVISION);
  return stage;
}

function sourcePaintSummary(source) {
  const paints = { solid: 0, gradient: 0, image: 0 };
  for (const node of source.findAll(() => true)) {
    for (const key of ['fills', 'strokes']) {
      if (!(key in node) || node[key] === figma.mixed) continue;
      for (const value of node[key]) {
        if (value.visible === false) continue;
        if (value.type === 'SOLID') paints.solid += 1;
        else if (value.type.startsWith('GRADIENT_')) paints.gradient += 1;
        else if (value.type === 'IMAGE') paints.image += 1;
      }
    }
  }
  return paints;
}

function validateContourTopology(source) {
  const stroked = source.children.filter((node) =>
    node.type === 'VECTOR'
      && node.strokes !== figma.mixed
      && node.fills !== figma.mixed
      && node.strokes.some((value) => value.visible !== false)
      && node.fills.filter((value) => value.visible !== false).length === 0
      && typeof node.strokeWeight === 'number',
  );
  const clusters = [];
  for (const node of stroked) {
    let cluster = clusters.find((item) => Math.abs(item.weight - node.strokeWeight) <= 0.001);
    if (!cluster) {
      cluster = { weight: node.strokeWeight, nodes: [] };
      clusters.push(cluster);
    }
    cluster.nodes.push(node);
  }
  clusters.sort((a, b) => a.weight - b.weight);
  const groups = source.children.filter((node) => node.type === 'GROUP');
  if (clusters.length !== 2) throw new Error(`CONTOUR_WEIGHT_CLUSTER_DRIFT:${JSON.stringify(clusters.map((item) => ({ weight: item.weight, count: item.nodes.length })))}`);
  const ratio = clusters[1].weight / clusters[0].weight;
  if (ratio < 3.5 || ratio > 4.5) throw new Error(`CONTOUR_WEIGHT_RATIO_DRIFT:${ratio}`);
  if (groups.length !== 2) throw new Error(`CONTOUR_GROUP_TOPOLOGY_DRIFT:${groups.length}`);
  return {
    minorWeight: clusters[0].weight,
    minorCount: clusters[0].nodes.length,
    majorWeight: clusters[1].weight,
    majorCount: clusters[1].nodes.length,
    groupCount: groups.length,
  };
}

function filterMajorContourLines(clone) {
  const topology = validateContourTopology(clone);
  const stroked = clone.children.filter((node) =>
    node.type === 'VECTOR'
      && node.strokes !== figma.mixed
      && node.fills !== figma.mixed
      && node.strokes.some((value) => value.visible !== false)
      && node.fills.filter((value) => value.visible !== false).length === 0
      && typeof node.strokeWeight === 'number',
  );
  const minor = stroked.filter((node) => Math.abs(node.strokeWeight - topology.minorWeight) <= 0.001);
  for (const node of minor) {
    node.visible = false;
    node.name = `${node.name} / MINOR LINE HIDDEN FOR FAR OPTICAL DERIVATIVE`;
  }
  const report = {
    derivation: 'exact-source-clone-with-major-line-visibility-filter',
    minorWeight: topology.minorWeight,
    majorWeight: topology.majorWeight,
    hiddenMinorCount: minor.length,
    retainedMajorCount: topology.majorCount,
    retainedGroupCount: topology.groupCount,
    geometryPathMutationCount: 0,
  };
  tag(clone, 'filterReport', report);
  return report;
}

function cloneSourceIntoViewport(parent, options) {
  const {
    name,
    sourceId,
    x,
    y,
    width,
    height,
    fitMode = 'contain',
    filterMajorOnly = false,
    role,
  } = options;
  const source = sourceById[sourceId];
  const spec = SOURCE_SPECS[sourceId];
  if (!source || !spec) throw new Error(`Unknown governed source: ${sourceId}`);
  const viewport = makeFrame(parent, `${name} / Clipping viewport`, x, y, width, height, COLOR_NAMES.void, true);
  tag(viewport, 'sourceViewport', true);
  tag(viewport, 'sourceId', sourceId);
  tag(viewport, 'sourceNodeId', spec.nodeId);
  tag(viewport, 'sourceSha256', spec.sha256);
  tag(viewport, 'fitMode', fitMode);
  tag(viewport, 'role', role);

  const clone = source.clone();
  clone.name = `${name} / Exact editable ${sourceId}`;
  viewport.appendChild(clone);
  let filterReport = null;
  if (filterMajorOnly) filterReport = filterMajorContourLines(clone);
  const scale = fitMode === 'cover'
    ? Math.max(width / clone.width, height / clone.height)
    : Math.min(width / clone.width, height / clone.height);
  clone.rescale(scale);
  clone.x = (width - clone.width) / 2;
  clone.y = (height - clone.height) / 2;
  tag(clone, 'sourceClone', true);
  tag(clone, 'sourceId', sourceId);
  tag(clone, 'sourceNodeId', spec.nodeId);
  tag(clone, 'sourceSha256', spec.sha256);
  tag(clone, 'authority', 'governed-provisional');
  tag(clone, 'verification', 'NOT VERIFIED');
  tag(clone, 'publication', 'nonpublishable when embedded');
  tag(clone, 'fitMode', fitMode);
  tag(clone, 'role', role);
  tag(clone, 'derivationPolicy', filterMajorOnly
    ? 'Exact clone. Minor contour vectors hidden by stroke-weight cluster. No path, paint, transform, aperture, or trajectory geometry mutation.'
    : 'Exact unmodified source clone. Uniform scaling and clipped viewport only.');
  return { viewport, clone, filterReport };
}

function sectionLabel(parent, index, characters, x, y, width, fillName = COLOR_NAMES.signalInk) {
  const node = makeText(
    parent,
    `Section ${String(index).padStart(2, '0')} / Canonical label`,
    characters,
    x,
    y,
    width,
    'Technical/Label',
    fillName,
  );
  tag(node, 'sectionIndex', String(index).padStart(2, '0'));
  tag(node, 'canonicalSectionLabel', characters);
  return node;
}

function makeDistanceLabel(parent, specimen) {
  const plate = makeFrame(
    parent,
    `Hero / ${specimen.key} / Optical label plate`,
    specimen.x,
    specimen.labelY,
    specimen.width,
    96,
    specimen.key === 'CLOSE' ? COLOR_NAMES.void : COLOR_NAMES.bone,
    true,
  );
  plate.layoutMode = 'VERTICAL';
  plate.primaryAxisSizingMode = 'FIXED';
  plate.counterAxisSizingMode = 'FIXED';
  plate.paddingTop = 14;
  plate.paddingBottom = 12;
  plate.paddingLeft = 18;
  plate.paddingRight = 18;
  plate.itemSpacing = 8;
  makeText(plate, `Hero / ${specimen.key} / Distance label`, `${specimen.order} / ${specimen.key}`, 0, 0, specimen.width - 36, 'Technical/Label', specimen.key === 'CLOSE' ? COLOR_NAMES.signal : COLOR_NAMES.void);
  makeText(plate, `Hero / ${specimen.key} / Visible rule`, specimen.visible, 0, 0, specimen.width - 36, 'Data/Micro', specimen.key === 'CLOSE' ? COLOR_NAMES.paper : COLOR_NAMES.ash700);
  return plate;
}

function makeEvidenceRow(parent, x, y) {
  const row = makeFrame(parent, 'Hero evidence console / Auto Layout row', x, y, 872, 174, COLOR_NAMES.bone, true);
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'FIXED';
  row.counterAxisSizingMode = 'FIXED';
  row.itemSpacing = 0;
  const evidenceCells = [
    ['SOURCE', 'SYNTHETIC /\nSINGLE-MASS FIELD'],
    ['INVARIANT', 'ORIENTATION / +18 DEG\nTRACE / ACTIVE'],
    ['TRANSFORM', 'OPTICAL SIZE /\nCROP ONLY'],
    ['STATUS', 'GOVERNED-PROVISIONAL\nNOT VERIFIED'],
  ];
  for (const [index, [label, value]] of evidenceCells.entries()) {
    const cell = makeFrame(row, `Hero evidence console / ${label}`, 0, 0, 218, 174, null, true);
    cell.layoutMode = 'VERTICAL';
    cell.primaryAxisSizingMode = 'FIXED';
    cell.counterAxisSizingMode = 'FIXED';
    cell.paddingTop = 22;
    cell.paddingBottom = 18;
    cell.paddingLeft = 22;
    cell.paddingRight = 18;
    cell.itemSpacing = 24;
    if (index > 0) cell.strokes = [paint(COLOR_NAMES.ash300)];
    if (index > 0) {
      cell.strokeLeftWeight = 1;
      cell.strokeRightWeight = 0;
      cell.strokeTopWeight = 0;
      cell.strokeBottomWeight = 0;
    }
    makeText(cell, `${label} / Label`, label, 0, 0, 178, 'Data/Micro', COLOR_NAMES.signalInk);
    makeText(cell, `${label} / Value`, value, 0, 0, 178, 'Technical/Label', COLOR_NAMES.void);
  }
  return row;
}

function findSourceCloneAncestor(node) {
  let current = node;
  while (current && current.id !== page.id) {
    if ('getSharedPluginData' in current && current.getSharedPluginData(NS, 'sourceClone') === 'true') return current;
    current = current.parent;
  }
  return null;
}

function collectAudit(root) {
  const descendants = root.findAll(() => true);
  const texts = descendants.filter((node) => node.type === 'TEXT');
  const styledTexts = texts.filter((node) => node.textStyleId !== figma.mixed && node.textStyleId !== '');
  const frames = [root, ...descendants.filter((node) => node.type === 'FRAME')];
  const autoLayoutFrames = frames.filter((node) => node.layoutMode !== 'NONE');
  const sourceClones = descendants.filter((node) => 'getSharedPluginData' in node && node.getSharedPluginData(NS, 'sourceClone') === 'true');
  const sourceViewports = descendants.filter((node) => 'getSharedPluginData' in node && node.getSharedPluginData(NS, 'sourceViewport') === 'true');
  const imagePaintNodes = [];
  const unboundSolidPaintNodes = [];
  let solidPaintCount = 0;
  let variableBoundSolidPaintCount = 0;
  let gradientPaintCount = 0;
  for (const node of [root, ...descendants]) {
    for (const key of ['fills', 'strokes']) {
      if (!(key in node) || node[key] === figma.mixed) continue;
      for (const value of node[key]) {
        if (value.visible === false) continue;
        if (value.type === 'IMAGE') imagePaintNodes.push({ nodeId: node.id, nodeName: node.name, property: key });
        if (value.type.startsWith('GRADIENT_')) gradientPaintCount += 1;
        if (value.type !== 'SOLID') continue;
        solidPaintCount += 1;
        if (value.boundVariables?.color) variableBoundSolidPaintCount += 1;
        else if (!findSourceCloneAncestor(node)) unboundSolidPaintNodes.push({ nodeId: node.id, nodeName: node.name, property: key });
      }
    }
  }
  const sectionCounts = {};
  for (const label of REQUIRED_SECTION_LABELS) {
    sectionCounts[label] = texts.filter((node) => node.characters === label).length;
  }
  const sourceRoles = sourceClones.map((node) => ({
    nodeId: node.id,
    nodeName: node.name,
    sourceId: node.getSharedPluginData(NS, 'sourceId'),
    sourceNodeId: node.getSharedPluginData(NS, 'sourceNodeId'),
    role: node.getSharedPluginData(NS, 'role'),
    fitMode: node.getSharedPluginData(NS, 'fitMode'),
    filterReport: node.getSharedPluginData(NS, 'filterReport') || null,
  }));
  const viewportFailures = sourceViewports
    .filter((viewport) => !viewport.clipsContent || viewport.children.filter((child) => child.getSharedPluginData(NS, 'sourceClone') === 'true').length !== 1)
    .map((viewport) => viewport.id);
  return {
    descendantCount: descendants.length,
    typeCounts: descendants.reduce((counts, node) => {
      counts[node.type] = (counts[node.type] || 0) + 1;
      return counts;
    }, {}),
    textNodeCount: texts.length,
    styledTextCount: styledTexts.length,
    unstyledTextCount: texts.length - styledTexts.length,
    autoLayoutFrameCount: autoLayoutFrames.length,
    frameCountIncludingRoot: frames.length,
    sourceCloneCount: sourceClones.length,
    sourceViewportCount: sourceViewports.length,
    sourceRoles,
    viewportFailures,
    imagePaintNodes,
    solidPaintCount,
    variableBoundSolidPaintCount,
    unboundSolidPaintNodes,
    gradientPaintCount,
    sectionCounts,
    arabicTextNodeIds: texts.filter((node) => /[\u0600-\u06FF]/.test(node.characters)).map((node) => node.id),
    logoNodeIds: descendants.filter((node) => /gravity well|mark-primary|mark-inverse/i.test(node.name)).map((node) => node.id),
    missingFont: typeof figma.hasMissingFont === 'boolean' ? figma.hasMissingFont : null,
  };
}

if (STAGE === 'preflight-and-skeleton') {
  const legacyRoot = await figma.getNodeByIdAsync(LEGACY_ROOT_ID);
  if (!legacyRoot || legacyRoot.type !== 'FRAME' || legacyRoot.parent?.id !== page.id) {
    throw new Error('Expected legacy 01.02 root is missing from the target page');
  }
  const topology = validateContourTopology(sourceById.atlasContoursLarge);
  if (topology.minorCount !== 59 || topology.majorCount !== 15 || topology.groupCount !== 2) {
    throw new Error(`EXACT_CONTOUR_TOPOLOGY_DRIFT:${JSON.stringify(topology)}`);
  }
  for (const [sourceId, source] of Object.entries(sourceById)) {
    const paints = sourcePaintSummary(source);
    if (paints.image !== 0) throw new Error(`RASTER_SOURCE_FORBIDDEN:${sourceId}`);
  }

  const previousDraftId = page.getSharedPluginData(NS, 'phase2.01.02.draftRoot');
  if (previousDraftId) {
    const previousDraft = page.findOne((node) => node.id === previousDraftId);
    if (previousDraft && previousDraft.type === 'FRAME' && previousDraft.getSharedPluginData(NS, 'buildOwner') === 'phase2.01.02.draft') previousDraft.remove();
  }

  const root = makeFrame(page, 'DRAFT / 01.02 / FIGMA NATIVE EDITABLE MASTER', 0, 0, 1440, 3500, COLOR_NAMES.paper, true);
  root.visible = false;
  root.setExplicitVariableModeForCollection(modesCollection, paperMode.modeId);
  tag(root, 'buildOwner', 'phase2.01.02.draft');
  tag(root, 'subjectId', '01.02');
  tag(root, 'recipeId', '01.02/visual/r1');
  tag(root, 'visualRevision', REVISION);
  tag(root, 'contentFingerprint', CONTENT_FINGERPRINT);
  tag(root, 'authority', 'canonical');
  tag(root, 'verification', 'NOT VERIFIED');
  tag(root, 'publication', 'documentation publishable under governance; embedded provisional export nonpublishable');
  tag(root, 'usesProvisionalInputs', true);
  tag(root, 'usesRejectedInputs', false);
  tag(root, 'affinitySource', 'affinity-artifact://Bizarre-Industries-Masterbrand-Library.afdesign#01.02');
  tag(root, 'affinityRevision', AFFINITY_REVISION);
  tag(root, 'fieldConfigurationHash', FIELD_CONFIGURATION_HASH);
  tag(root, 'model', 'single-mass-lensing-field/1.0.0');
  tag(root, 'algorithm', 'bizarre-atlas-single-mass/1.0.0');
  tag(root, 'orientationDegrees', '18');
  tag(root, 'trajectory', 'ACTIVE');
  tag(root, 'seed', 'NONE / NO SEED CONSUMED');
  tag(root, 'apertureVersion', APERTURE_VERSION);
  tag(root, 'aperturePathSha256', APERTURE_PATH_SHA);
  tag(root, 'sourceNodeMap', Object.fromEntries(Object.entries(SOURCE_SPECS).map(([id, spec]) => [id, spec.nodeId])));
  tag(root, 'sourceShaMap', Object.fromEntries(Object.entries(SOURCE_SPECS).map(([id, spec]) => [id, spec.sha256])));
  tag(root, 'logoPolicy', 'No Gravity Well instance on this page. Any future mark remains exact and entirely Signal Lime or entirely black.');
  tag(root, 'imagegenPolicy', 'No ImageGen concept reference allowed. No raster reference may be embedded.');
  tag(root, 'signalPolicy', 'Signal Lime is a flat operational channel and never interpolates into another hue.');
  tag(root, 'bilingualReadiness', 'NOT VERIFIED / no public Arabic copy on this page');
  tag(root, 'blockedOpticalDerivatives', ['Small', 'Field']);

  const reference = makeFrame(root, '00 / Reference / METADATA ONLY / NO RASTER / 01.02', 0, 0, 1, 1, null, true);
  reference.visible = false;
  reference.locked = true;
  tag(reference, 'classification', 'METADATA ONLY / NO IMAGEGEN / NO QA RASTER');
  tag(reference, 'allowedConceptReferenceIds', []);

  page.setSharedPluginData(NS, 'phase2.01.02.draftRoot', root.id);
  page.setSharedPluginData(NS, 'phase2.01.02.draftRevision', REVISION);
  return {
    stage: STAGE,
    page: { id: page.id, name: page.name },
    draftRoot: { id: root.id, name: root.name, width: root.width, height: root.height, visible: root.visible },
    reference: { id: reference.id, visible: reference.visible, locked: reference.locked },
    legacyRoot: { id: legacyRoot.id, name: legacyRoot.name, visible: legacyRoot.visible, locked: legacyRoot.locked },
    topology,
    sourcePaintSummaries: Object.fromEntries(Object.entries(sourceById).map(([id, source]) => [id, sourcePaintSummary(source)])),
  };
}

if (STAGE === 'hero-and-evidence') {
  const root = getDraftRoot();
  if (root.visible) throw new Error('Draft root must remain hidden until promotion');
  const stage = replaceStage(root, 'hero-and-evidence', '10 / Hero and governed evidence / 01.02', 0, 0, 1440, 1200);

  makeRect(stage, 'Signal rail / Active datum', 80, 0, 1280, 6, COLOR_NAMES.signal);
  makeText(stage, 'Header / System rail', 'BZR / 01 / DETAIL', 80, 42, 420, 'Label/Eyebrow', COLOR_NAMES.signalInk);
  makeText(stage, 'Header / Governance rail', 'GOVERNED / 01.02 / NOT VERIFIED', 840, 42, 520, 'Technical/Label', COLOR_NAMES.ash700, { align: 'RIGHT' });
  makeText(stage, 'Header / Subject', 'RECOGNITION GRAMMAR /\nTHREE-DISTANCE TEST', 80, 112, 1280, 'Display/H2', COLOR_NAMES.void);
  makeText(stage, 'Header / Thesis', 'THE SAME SYSTEM CHANGES RESOLUTION.', 80, 282, 900, 'Industrial/H4', COLOR_NAMES.void);
  makeText(stage, 'Header / Invariant', 'ONE GOVERNED FIELD / THREE OPTICAL DISTANCES / ZERO NEW SILHOUETTES', 82, 342, 1120, 'Technical/Label', COLOR_NAMES.ash700);

  const distanceSpecimens = [
    { key: 'FAR', order: '01', x: 80, y: 510, width: 300, height: 169, labelY: 694, sourceId: 'atlasContoursLarge', visible: 'BEND / ABSENCE / SIGNAL', role: 'hero/far/silhouette', filterMajorOnly: true },
    { key: 'NORMAL', order: '02', x: 410, y: 466, width: 420, height: 237, labelY: 718, sourceId: 'atlasSpectralLarge', visible: '+ INDICES / FIELD / STATE', role: 'hero/normal/function' },
    { key: 'CLOSE', order: '03', x: 860, y: 422, width: 500, height: 282, labelY: 718, sourceId: 'atlasContoursLarge', visible: '+ REPRESENTATIONS / PROVENANCE', role: 'hero/close/evidence' },
  ];
  makeRule(stage, 'Hero / Shared optical baseline', 80, 704, 1280, 2, COLOR_NAMES.ash300);
  const cloneResults = [];
  for (const specimen of distanceSpecimens) {
    makeRect(stage, `Hero / ${specimen.key} / Registered enclosure`, specimen.x - 2, specimen.y - 2, specimen.width + 4, specimen.height + 4, specimen.key === 'CLOSE' ? COLOR_NAMES.signal : COLOR_NAMES.ash300);
    const result = cloneSourceIntoViewport(stage, {
      name: `Hero / ${specimen.key}`,
      sourceId: specimen.sourceId,
      x: specimen.x,
      y: specimen.y,
      width: specimen.width,
      height: specimen.height,
      fitMode: 'contain',
      filterMajorOnly: specimen.filterMajorOnly || false,
      role: specimen.role,
    });
    cloneResults.push({ key: specimen.key, viewportId: result.viewport.id, cloneId: result.clone.id, filterReport: result.filterReport });
    makeEllipse(stage, `Hero / ${specimen.key} / Registered baseline datum`, specimen.x + specimen.width / 2 - 6, 698, 12, 12, specimen.key === 'CLOSE' ? COLOR_NAMES.signal : COLOR_NAMES.void);
    makeDistanceLabel(stage, specimen);
  }

  const chipSpecs = [
    { sourceId: 'atlasDotsLarge', x: 1082, label: 'DOTS' },
    { sourceId: 'atlasHatchLarge', x: 1168, label: 'HATCH' },
    { sourceId: 'atlasSpectralLarge', x: 1254, label: 'SPECTRAL' },
  ];
  for (const chip of chipSpecs) {
    const result = cloneSourceIntoViewport(stage, {
      name: `Hero / CLOSE / ${chip.label} inspection chip`,
      sourceId: chip.sourceId,
      x: chip.x,
      y: 640,
      width: 72,
      height: 41,
      fitMode: 'cover',
      role: `hero/close/inspection/${chip.label.toLowerCase()}`,
    });
    cloneResults.push({ key: `CLOSE-${chip.label}`, viewportId: result.viewport.id, cloneId: result.clone.id });
  }

  makeEvidenceRow(stage, 80, 844);
  const closing = makeFrame(stage, 'Hero closing plate / Deep Void', 976, 844, 384, 174, COLOR_NAMES.void, true);
  closing.layoutMode = 'VERTICAL';
  closing.primaryAxisSizingMode = 'FIXED';
  closing.counterAxisSizingMode = 'FIXED';
  closing.paddingTop = 22;
  closing.paddingBottom = 18;
  closing.paddingLeft = 24;
  closing.paddingRight = 24;
  closing.itemSpacing = 14;
  makeText(closing, 'Hero closing / Grammar', 'BEND > ABSENCE > SIGNAL', 0, 0, 336, 'Data/Micro', COLOR_NAMES.ash300);
  makeText(closing, 'Hero closing / Thesis', 'ONE SOURCE.\nTHREE READINGS.', 0, 0, 336, 'Heading/H5', COLOR_NAMES.paper);
  makeText(closing, 'Hero closing / Phrase', 'CATCH THE STARS', 0, 0, 336, 'Technical/Label', COLOR_NAMES.signal);

  sectionLabel(stage, 1, REQUIRED_SECTION_LABELS[0], 80, 1046, 540);
  makeText(stage, 'Section 01 / Definition', 'Codify recognition at far, normal, and close distances so identity survives speed while rewarding inspection.', 80, 1078, 560, 'Body/Base', COLOR_NAMES.ash700);
  sectionLabel(stage, 2, REQUIRED_SECTION_LABELS[1], 720, 1046, 640);
  makeText(stage, 'Section 02 / Construction', 'Choose one unchanged source artifact. Use approved optical crops only. Annotate exactly what each distance reveals.', 720, 1078, 640, 'Body/Base', COLOR_NAMES.ash700);
  sectionLabel(stage, 3, REQUIRED_SECTION_LABELS[2], 80, 1142, 760);
  makeText(stage, 'Section 03 / Governed source rail', 'SINGLE-MASS-LENSING-FIELD 1.0.0 / BIZARRE-ATLAS-SINGLE-MASS 1.0.0 / FIELD 7E35C8CC2641 / APERTURE BB4079E12E6D', 80, 1170, 1280, 'Data/Micro', COLOR_NAMES.signalInk);

  tag(stage, 'stageCloneResults', cloneResults);
  return { stage: STAGE, rootId: root.id, stageId: stage.id, cloneResults, descendantCount: stage.findAll(() => true).length };
}

if (STAGE === 'resolution-grammar-optical') {
  const root = getDraftRoot();
  if (root.visible) throw new Error('Draft root must remain hidden until promotion');
  const stage = replaceStage(root, 'resolution-grammar-optical', '20 / Resolution, grammar, and optical sizes / 01.02', 0, 1200, 1440, 1350);

  const matrix = makeFrame(stage, 'Resolve matrix / Three distances one field', 80, 40, 1280, 456, COLOR_NAMES.void, true);
  makeRect(matrix, 'Resolve matrix / Signal index', 0, 0, 12, 456, COLOR_NAMES.signal);
  makeText(matrix, 'Resolve matrix / Heading', 'THREE DISTANCES / ONE FIELD', 32, 30, 700, 'Industrial/H4', COLOR_NAMES.paper);
  makeText(matrix, 'Resolve matrix / Definition', 'DETAIL ARRIVES IN A CONTROLLED ORDER.', 32, 82, 720, 'Technical/Label', COLOR_NAMES.ash300);
  const columns = [
    { x: 32, label: 'FAR / SILHOUETTE', sourceId: 'atlasContoursLarge', role: 'matrix/far/silhouette', filterMajorOnly: true, sentence: 'Signal Lime, lensing bend, and the aperture silhouette survive at speed or across a room.' },
    { x: 442, label: 'NORMAL / FUNCTION', sourceId: 'atlasSpectralLarge', role: 'matrix/normal/function', sentence: 'Instrument indices, contour families, spectral fields, metadata, and state become readable.' },
    { x: 852, label: 'CLOSE / EVIDENCE', sourceId: 'atlasHatchLarge', role: 'matrix/close/evidence', sentence: 'Exact alternate representations, source status, and provenance reward inspection.' },
  ];
  const cloneResults = [];
  for (const column of columns) {
    makeText(matrix, `Resolve matrix / ${column.label}`, column.label, column.x, 124, 340, 'Technical/Label', column.label.startsWith('CLOSE') ? COLOR_NAMES.signal : COLOR_NAMES.paper);
    const result = cloneSourceIntoViewport(matrix, {
      name: `Resolve matrix / ${column.label}`,
      sourceId: column.sourceId,
      x: column.x,
      y: 158,
      width: 340,
      height: 150,
      fitMode: 'cover',
      filterMajorOnly: column.filterMajorOnly || false,
      role: column.role,
    });
    cloneResults.push({ role: column.role, viewportId: result.viewport.id, cloneId: result.clone.id, filterReport: result.filterReport });
    makeRule(matrix, `Resolve matrix / ${column.label} / Datum`, column.x, 326, 340, 1, column.label.startsWith('CLOSE') ? COLOR_NAMES.signal : COLOR_NAMES.iron);
    makeText(matrix, `Resolve matrix / ${column.label} / Sentence`, column.sentence, column.x, 346, 340, 'Caption/Base', COLOR_NAMES.paper);
  }
  makeText(matrix, 'Resolve matrix / Definition rail', 'FAR READS THE SILHOUETTE. NORMAL REVEALS FUNCTION. CLOSE EARNS EVIDENCE.', 32, 422, 1200, 'Data/Micro', COLOR_NAMES.signal);

  const grammarY = 530;
  makeText(stage, 'Recognition grammar / Heading', 'RECOGNITION GRAMMAR', 80, grammarY, 680, 'Label/Eyebrow', COLOR_NAMES.signalInk);
  const grammar = cloneSourceIntoViewport(stage, {
    name: 'Recognition grammar / Exact field',
    sourceId: 'atlasContoursLarge',
    x: 80,
    y: grammarY + 38,
    width: 1280,
    height: 304,
    fitMode: 'cover',
    role: 'grammar/full-field',
  });
  cloneResults.push({ role: 'grammar/full-field', viewportId: grammar.viewport.id, cloneId: grammar.clone.id });
  const grammarTerms = [
    { x: 104, label: '01 / BEND', width: 260, fill: COLOR_NAMES.paper },
    { x: 532, label: '02 / ABSENCE', width: 300, fill: COLOR_NAMES.paper },
    { x: 988, label: '03 / SIGNAL', width: 260, fill: COLOR_NAMES.signal },
  ];
  for (const term of grammarTerms) {
    makeRect(stage, `Recognition grammar / ${term.label} plate`, term.x, grammarY + 96, term.width, 82, COLOR_NAMES.void, 0.88);
    makeText(stage, `Recognition grammar / ${term.label}`, term.label, term.x + 22, grammarY + 118, term.width - 44, 'Heading/H5', term.fill);
  }
  const contexts = ['IDENTITY APPROVAL', 'VEHICLE RECOGNITION', 'SIGNAGE', 'COMPONENTS', 'MOCKUP QA'];
  for (const [index, context] of contexts.entries()) {
    const x = 104 + index * 244;
    makeRect(stage, `Application / ${context} / Ground`, x, grammarY + 246, 220, 40, COLOR_NAMES.void, 0.88);
    makeRect(stage, `Application / ${context} / Register`, x, grammarY + 246, 6, 40, index === 4 ? COLOR_NAMES.signal : COLOR_NAMES.ash300);
    makeText(stage, `Application / ${context}`, context, x + 18, grammarY + 258, 190, 'Data/Micro', index === 4 ? COLOR_NAMES.signal : COLOR_NAMES.paper);
  }
  sectionLabel(stage, 5, REQUIRED_SECTION_LABELS[4], 104, grammarY + 304, 180, COLOR_NAMES.signal);
  makeText(stage, 'Section 05 / Usage sentence', 'Use for identity approval, vehicle recognition, signage, components, and mockup QA.', 300, grammarY + 304, 1000, 'Caption/Base', COLOR_NAMES.paper);

  const opticalY = 920;
  const optical = makeFrame(stage, 'Optical-size ruler / Governed availability', 80, opticalY, 1280, 390, COLOR_NAMES.bone, true);
  makeText(optical, 'Optical-size ruler / Heading', 'OPTICAL-SIZE RULER', 32, 28, 560, 'Industrial/H4', COLOR_NAMES.void);
  makeText(optical, 'Optical-size ruler / Invariant', 'NO SCALE MAY INVENT A NEW SILHOUETTE.', 32, 76, 760, 'Technical/Label', COLOR_NAMES.signalInk);
  makeRule(optical, 'Optical-size ruler / Primary measure', 32, 114, 1216, 2, COLOR_NAMES.void);
  for (let index = 0; index <= 64; index += 1) {
    const major = index % 16 === 0;
    makeRect(optical, `Optical-size ruler / Tick ${String(index + 1).padStart(2, '0')}`, 32 + index * 19, 114 - (major ? 9 : 4), 1, major ? 20 : 9, major ? COLOR_NAMES.signalInk : COLOR_NAMES.ash500);
  }
  const sizes = [
    { x: 32, label: 'MICRO / <48 PX', sourceId: 'atlasMicro', role: 'optical/micro', status: 'EXACT GOVERNED-PROVISIONAL' },
    { x: 276, label: 'SMALL / 48-96 PX', role: 'optical/small/blocked', status: 'ASSET REQUIRED / NOT VERIFIED' },
    { x: 520, label: 'MEDIUM / 96-320 PX', sourceId: 'atlasContoursDark', role: 'optical/medium', status: 'EXACT GOVERNED-PROVISIONAL' },
    { x: 764, label: 'LARGE / >320 PX', sourceId: 'atlasContoursLarge', role: 'optical/large', status: 'EXACT GOVERNED-PROVISIONAL' },
    { x: 1008, label: 'FIELD / ENVIRONMENTAL', role: 'optical/field/blocked', status: 'ASSET REQUIRED / NOT VERIFIED' },
  ];
  for (const [index, size] of sizes.entries()) {
    if (size.sourceId) {
      const result = cloneSourceIntoViewport(optical, {
        name: `Optical-size ruler / ${size.label}`,
        sourceId: size.sourceId,
        x: size.x,
        y: 142,
        width: 220,
        height: 124,
        fitMode: 'contain',
        role: size.role,
      });
      cloneResults.push({ role: size.role, viewportId: result.viewport.id, cloneId: result.clone.id });
    } else {
      const blocked = makeFrame(optical, `Optical-size ruler / ${size.label} / Blocked bay`, size.x, 142, 220, 124, COLOR_NAMES.void, true);
      tag(blocked, 'blockedOpticalDerivative', size.label.startsWith('SMALL') ? 'Small' : 'Field');
      makeRect(blocked, 'Blocked bay / Signal rail', 0, 0, 12, 124, COLOR_NAMES.signal);
      makeText(blocked, 'Blocked bay / Status', 'ASSET REQUIRED\nNOT VERIFIED', 32, 36, 168, 'Technical/Label', COLOR_NAMES.paper);
    }
    makeText(optical, `Optical-size ruler / ${size.label} / Label`, `${String(index + 1).padStart(2, '0')} / ${size.label}`, size.x, 280, 220, 'Data/Micro', size.sourceId ? COLOR_NAMES.void : COLOR_NAMES.signalInk);
    makeText(optical, `Optical-size ruler / ${size.label} / Status`, size.status, size.x, 312, 220, 'Data/Micro', COLOR_NAMES.ash700);
  }
  sectionLabel(optical, 4, REQUIRED_SECTION_LABELS[3], 32, 350, 650);
  makeText(optical, 'Section 04 / Optical size rule', 'Micro, Small, Medium, Large, Field. Small and Field remain blocked until exact derivatives exist.', 700, 350, 548, 'Caption/Base', COLOR_NAMES.ash700, { align: 'RIGHT' });

  tag(stage, 'stageCloneResults', cloneResults);
  return { stage: STAGE, rootId: root.id, stageId: stage.id, cloneResults, descendantCount: stage.findAll(() => true).length };
}

if (STAGE === 'rules-governance-footer') {
  const root = getDraftRoot();
  if (root.visible) throw new Error('Draft root must remain hidden until promotion');
  const stage = replaceStage(root, 'rules-governance-footer', '30 / Rules, governance, and footer / 01.02', 0, 2550, 1440, 950);

  const correct = makeFrame(stage, 'Correct example / Same physics', 80, 20, 620, 280, COLOR_NAMES.bone, true);
  makeRect(correct, 'Correct example / Signal rail', 0, 0, 12, 280, COLOR_NAMES.signal);
  makeText(correct, 'Correct example / Heading', 'CORRECT / SAME PHYSICS', 36, 28, 540, 'Heading/H5', COLOR_NAMES.void);
  const correctBoxes = [
    { x: 36, y: 84, width: 126, height: 71 },
    { x: 182, y: 72, width: 170, height: 96 },
    { x: 372, y: 58, width: 214, height: 121 },
  ];
  const cloneResults = [];
  for (const [index, box] of correctBoxes.entries()) {
    const result = cloneSourceIntoViewport(correct, {
      name: `Correct / Same governed source / ${index + 1}`,
      sourceId: 'atlasContoursLarge',
      ...box,
      fitMode: 'contain',
      role: `correct/same-source/${index + 1}`,
    });
    cloneResults.push({ role: `correct/same-source/${index + 1}`, viewportId: result.viewport.id, cloneId: result.clone.id });
  }
  sectionLabel(correct, 9, REQUIRED_SECTION_LABELS[8], 36, 192, 520);
  makeText(correct, 'Section 09 / Correct sentence', 'The same visual physics remain legible at every distance. Close detail adds evidence instead of clutter.', 36, 224, 540, 'Caption/Base', COLOR_NAMES.ash700);

  const misuse = makeFrame(stage, 'Misuse / Full source below minimum', 740, 20, 620, 280, COLOR_NAMES.void, true);
  makeText(misuse, 'Misuse / Heading', 'MISUSE / FULL RES BELOW MINIMUM', 36, 28, 548, 'Heading/H5', COLOR_NAMES.paper);
  const misuseBoxes = [
    { x: 36, y: 92, width: 86, height: 48 },
    { x: 174, y: 92, width: 86, height: 48 },
    { x: 312, y: 92, width: 86, height: 48 },
  ];
  for (const [index, box] of misuseBoxes.entries()) {
    const result = cloneSourceIntoViewport(misuse, {
      name: `Misuse / Full source below minimum / ${index + 1}`,
      sourceId: 'atlasContoursLarge',
      ...box,
      fitMode: 'contain',
      role: `misuse/full-source-below-minimum/${index + 1}`,
    });
    cloneResults.push({ role: `misuse/full-source-below-minimum/${index + 1}`, viewportId: result.viewport.id, cloneId: result.clone.id });
    makeRect(misuse, `Misuse / Failure indicator ${index + 1}`, box.x, box.y + box.height + 10, box.width, 4, COLOR_NAMES.signal);
  }
  sectionLabel(misuse, 10, REQUIRED_SECTION_LABELS[9], 36, 192, 520, COLOR_NAMES.signal);
  makeText(misuse, 'Section 10 / Misuse sentence', 'Never rely on microtext for far recognition, switch artifacts between distances, invent missing derivatives, or alter the smooth aperture silhouette.', 36, 224, 548, 'Caption/Base', COLOR_NAMES.ash300);

  const governance = makeFrame(stage, 'Governance and operations / Deep Void', 80, 340, 1280, 450, COLOR_NAMES.void, true);
  const operations = [
    { x: 32, width: 360, heading: 'ACCESS', cue: 'LABEL + SHAPE + POSITION', state: 'BILINGUAL PUBLIC READINESS / NOT VERIFIED', section: 6, label: REQUIRED_SECTION_LABELS[5], text: 'State the idea in plain language. Preserve meaning without color alone. No public Arabic copy ships before specialist review.' },
    { x: 440, width: 360, heading: 'MOTION', cue: 'N/A / STATIC COMPARISON', state: 'ROUTE / 08 / CAPTURE', section: 7, label: REQUIRED_SECTION_LABELS[6], text: 'This plate is static. Motion recognition is tested separately through Capture states and reduced-motion final states.' },
    { x: 848, width: 400, heading: 'EXPORT', cue: 'DOCUMENTATION / AFTER REVIEW', state: 'EMBEDDED PROVISIONAL / NONPUBLISHABLE', section: 8, label: REQUIRED_SECTION_LABELS[7], text: 'Documentation may publish under governance. Any export embedding a governed-provisional source remains nonpublishable.' },
  ];
  for (const [index, operation] of operations.entries()) {
    const column = makeFrame(governance, `Governance / ${operation.heading} / Auto Layout column`, operation.x, 24, operation.width, 250, null, true);
    column.layoutMode = 'VERTICAL';
    column.primaryAxisSizingMode = 'FIXED';
    column.counterAxisSizingMode = 'FIXED';
    column.itemSpacing = 12;
    makeText(column, `Governance / ${operation.heading}`, operation.heading, 0, 0, operation.width, 'Heading/H5', index === 2 ? COLOR_NAMES.signal : COLOR_NAMES.paper);
    makeText(column, `Governance / ${operation.heading} cue`, operation.cue, 0, 0, operation.width, 'Technical/Label', COLOR_NAMES.signal);
    const register = makeFrame(column, `Governance / ${operation.heading} / State register`, 0, 0, operation.width, 58, COLOR_NAMES.iron, true);
    makeRect(register, 'State register / Rail', 0, 0, 12, 58, index === 2 ? COLOR_NAMES.signal : COLOR_NAMES.ash300);
    makeText(register, 'State register / Text', operation.state, 28, 20, operation.width - 40, 'Data/Micro', COLOR_NAMES.paper);
    sectionLabel(column, operation.section, operation.label, 0, 0, operation.width, COLOR_NAMES.signal);
    makeText(column, `Section ${String(operation.section).padStart(2, '0')} / Governed sentence`, operation.text, 0, 0, operation.width, 'Caption/Base', COLOR_NAMES.ash300);
  }

  makeRule(governance, 'Governance / Provenance separator', 32, 294, 1216, 1, COLOR_NAMES.iron);
  sectionLabel(governance, 11, REQUIRED_SECTION_LABELS[10], 32, 314, 560, COLOR_NAMES.signal);
  makeText(governance, 'Section 11 / Provenance summary', 'SYNTHETIC / SINGLE-MASS / +18 DEG / TRACE ACTIVE / NO SEED / FIELD 7E35C8CC2641 / APERTURE BB4079E12E6D / NOT VERIFIED', 32, 344, 560, 'Data/Micro', COLOR_NAMES.ash300);
  sectionLabel(governance, 12, REQUIRED_SECTION_LABELS[11], 640, 314, 608, COLOR_NAMES.signal);
  makeText(governance, 'Section 12 / Navigation summary', 'PARENT / 01.00 BRAND CORE. SIBLINGS / 01.01 / 01.03 / 01.04. DEPENDENCIES / 02.01 / 06.05 / 07.11. EXACT SOURCES ONLY.', 640, 344, 608, 'Data/Micro', COLOR_NAMES.ash300);
  makeText(governance, 'Governance / Native build status', 'NATIVE FIGMA VECTORS / EXACT GOVERNED SOURCES / NO IMAGEGEN / NO RASTER / VERIFICATION NOT VERIFIED', 32, 416, 1216, 'Technical/Label', COLOR_NAMES.signal);

  makeRule(stage, 'Footer / Datum', 80, 824, 1280, 1, COLOR_NAMES.ash300);
  makeText(stage, 'Footer / Permanent phrase', 'CATCH THE STARS / MAKE THE DISTANT TANGIBLE', 80, 856, 820, 'Technical/Label', COLOR_NAMES.signalInk);
  makeText(stage, 'Footer / Revision', '01.02 / FIGMA R1 / AFFINITY R3 / GOVERNED', 900, 856, 460, 'Data/Micro', COLOR_NAMES.ash700, { align: 'RIGHT' });
  makeText(stage, 'Footer / Optical availability', 'MICRO EXACT / SMALL BLOCKED / MEDIUM EXACT / LARGE EXACT / FIELD BLOCKED', 80, 900, 1280, 'Data/Micro', COLOR_NAMES.ash700);

  tag(stage, 'stageCloneResults', cloneResults);
  return { stage: STAGE, rootId: root.id, stageId: stage.id, cloneResults, descendantCount: stage.findAll(() => true).length };
}

if (STAGE === 'audit-and-promote') {
  const root = getDraftRoot();
  if (root.visible) throw new Error('Draft root unexpectedly visible before promotion');
  const requiredStageKeys = ['hero-and-evidence', 'resolution-grammar-optical', 'rules-governance-footer'];
  for (const key of requiredStageKeys) {
    const count = root.children.filter((node) => node.type === 'FRAME' && node.getSharedPluginData(NS, 'stageKey') === key).length;
    if (count !== 1) throw new Error(`STAGE_COUNT_FAILURE:${key}:${count}`);
  }

  const audit = collectAudit(root);
  const sectionFailures = Object.entries(audit.sectionCounts).filter(([, count]) => count !== 1);
  if (sectionFailures.length) throw new Error(`SECTION_LABEL_FAILURE:${JSON.stringify(sectionFailures)}`);
  if (audit.unstyledTextCount !== 0) throw new Error(`UNSTYLED_TEXT_FAILURE:${audit.unstyledTextCount}`);
  if (audit.autoLayoutFrameCount < 8) throw new Error(`AUTO_LAYOUT_COVERAGE_FAILURE:${audit.autoLayoutFrameCount}`);
  if (audit.imagePaintNodes.length) throw new Error(`IMAGE_PAINT_FORBIDDEN:${JSON.stringify(audit.imagePaintNodes)}`);
  if (audit.unboundSolidPaintNodes.length) throw new Error(`UNBOUND_DOCUMENTATION_PAINT_FAILURE:${JSON.stringify(audit.unboundSolidPaintNodes.slice(0, 10))}`);
  if (audit.viewportFailures.length) throw new Error(`SOURCE_VIEWPORT_FAILURE:${JSON.stringify(audit.viewportFailures)}`);
  if (audit.arabicTextNodeIds.length) throw new Error(`PUBLIC_ARABIC_COPY_FORBIDDEN:${JSON.stringify(audit.arabicTextNodeIds)}`);
  if (audit.logoNodeIds.length) throw new Error(`UNEXPECTED_LOGO_INSTANCE:${JSON.stringify(audit.logoNodeIds)}`);
  if (audit.missingFont === true) throw new Error('MISSING_FONT_FAILURE');

  const roleSet = new Set(audit.sourceRoles.map((item) => item.role));
  const requiredRoles = [
    'hero/far/silhouette',
    'hero/normal/function',
    'hero/close/evidence',
    'hero/close/inspection/dots',
    'hero/close/inspection/hatch',
    'hero/close/inspection/spectral',
    'matrix/far/silhouette',
    'matrix/normal/function',
    'matrix/close/evidence',
    'grammar/full-field',
    'optical/micro',
    'optical/medium',
    'optical/large',
  ];
  const missingRoles = requiredRoles.filter((role) => !roleSet.has(role));
  if (missingRoles.length) throw new Error(`GOVERNED_SOURCE_ROLE_FAILURE:${JSON.stringify(missingRoles)}`);

  const farRoles = audit.sourceRoles.filter((item) => item.role === 'hero/far/silhouette' || item.role === 'matrix/far/silhouette');
  for (const far of farRoles) {
    if (!far.filterReport) throw new Error(`FAR_FILTER_REPORT_MISSING:${far.nodeId}`);
    const report = JSON.parse(far.filterReport);
    if (report.hiddenMinorCount !== 59 || report.retainedMajorCount !== 15 || report.retainedGroupCount !== 2 || report.geometryPathMutationCount !== 0) {
      throw new Error(`FAR_FILTER_REPORT_FAILURE:${far.nodeId}:${far.filterReport}`);
    }
  }

  const blocked = root.findAll((node) => 'getSharedPluginData' in node && node.getSharedPluginData(NS, 'blockedOpticalDerivative'));
  const blockedNames = blocked.map((node) => node.getSharedPluginData(NS, 'blockedOpticalDerivative')).sort();
  if (JSON.stringify(blockedNames) !== JSON.stringify(['Field', 'Small'])) throw new Error(`BLOCKED_OPTICAL_FAILURE:${JSON.stringify(blockedNames)}`);

  const legacyRoot = await figma.getNodeByIdAsync(LEGACY_ROOT_ID);
  if (!legacyRoot || legacyRoot.type !== 'FRAME' || legacyRoot.parent?.id !== page.id) throw new Error('Legacy 01.02 root unavailable at promotion');

  root.name = '01 / FIGMA NATIVE - EDITABLE MASTER / 01.02 THREE-DISTANCE / r1';
  root.visible = true;
  root.locked = false;
  tag(root, 'buildOwner', 'phase2.01.02.active');
  tag(root, 'liveAudit', audit);
  tag(root, 'blockedOpticalAvailability', {
    Micro: 'EXACT / atlasMicro / 101:1168',
    Small: 'ASSET REQUIRED / NOT VERIFIED',
    Medium: 'EXACT / atlasContoursDark / 101:466',
    Large: 'EXACT / atlasContoursLarge / 101:540',
    Field: 'ASSET REQUIRED / NOT VERIFIED',
  });
  legacyRoot.name = '99 / ARCHIVE / PRE-PHASE2 / 01.02';
  legacyRoot.visible = false;
  legacyRoot.locked = true;
  page.setSharedPluginData(NS, 'phase2.01.02.activeRoot', root.id);
  page.setSharedPluginData(NS, 'phase2.01.02.revision', REVISION);
  page.setSharedPluginData(NS, 'phase2.01.02.draftRoot', '');
  page.setSharedPluginData(NS, 'phase2.01.02.draftRevision', '');

  return {
    stage: STAGE,
    page: { id: page.id, name: page.name },
    activeRoot: { id: root.id, name: root.name, x: root.x, y: root.y, width: root.width, height: root.height, visible: root.visible, locked: root.locked, clipsContent: root.clipsContent },
    archive: { id: legacyRoot.id, name: legacyRoot.name, visible: legacyRoot.visible, locked: legacyRoot.locked },
    reference: root.children.filter((node) => node.name.startsWith('00 / Reference')).map((node) => ({ id: node.id, name: node.name, visible: node.visible, locked: node.locked })),
    audit,
    blockedOpticalDerivatives: blockedNames,
    pageTopLevelFrames: page.children.filter((node) => node.type === 'FRAME').map((node) => ({ id: node.id, name: node.name, visible: node.visible, locked: node.locked })),
    revision: REVISION,
  };
}

throw new Error(`Unknown 01.02 build stage: ${STAGE}`);
