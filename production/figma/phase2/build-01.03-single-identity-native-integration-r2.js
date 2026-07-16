const PAGE_ID = '47:9';
const LEGACY_ROOT_ID = '83:242';
const PAGE_NAME = '01.03 · Single Identity / Native Integration';
const REVISION = 'figma-01.03-single-identity-native-integration-r2';
const NS = 'bizarre.masterbrand';

const CONTRACT = {
  subjectId: '01.03',
  recipeId: '01.03/visual/v2',
  manifestSha256: '220dda8ff98f6fc67ef42187013a3274f9c1c3050e7ca0e38e3352d4ca7ef0de',
  contentSpecSha256: 'f46312ca7fcc53389462aa169ba8c8d763d656e47320869eb386ed29622bae39',
  contentFingerprint: '437c6da240d681988acb19f140b618c1ea64f7a745c2964aa2dea91aff0c0700',
  affinityArtifactSha256: '2cf9b42e141fbccc95a2a127fa2dd3414c1635f4db2d58d9bcf4c6c5c3ef7e00',
  affinityQaSha256: '6386f97bdcfea1861c96d6827e001c71678e8b94dd6f011157b5630a734d5290',
};

const LAYERS = [
  '40 / Color, Gradient, Pattern, or Material',
  '50 / Variants, States, and Optical Sizes',
  '60 / Usage and Applications',
  '70 / Accessibility, Bilingual, RTL, and Motion',
  '80 / Production and Export',
  '90 / Correct Use and Misuse',
  '99 / Provenance, Status, Evidence, and Navigation',
  '10 / Construction',
  '20 / Canonical Assets',
  '30 / Live Type and Metadata',
  '00 / Reference',
];

const STYLE_NAMES = [
  'Display/H1 Hero',
  'Display/H2',
  'Heading/H5',
  'Body/Base',
  'Caption/Base',
  'Technical/Label',
  'Data/Micro',
];

const HEX = {
  signal: '#C6FF24',
  signalInk: '#5E7A00',
  void: '#0E0E0E',
  paper: '#F9F8F2',
  bone: '#F5F2EA',
  ash300: '#B8B8B8',
  ash500: '#7A7A7A',
  ash700: '#545454',
  ash900: '#1F1F1F',
  iron: '#3D3D3D',
};

const REF = {
  signal: 'Brand/brand/accent/signal',
  signalInk: 'Palette/color/accent/ink',
  void: 'Palette/color/neutral/void',
  paper: 'Palette/color/neutral/paper',
  bone: 'Palette/color/neutral/bone',
  ash300: 'Palette/color/neutral/ash300',
  ash500: 'Palette/color/neutral/ash500',
  ash700: 'Palette/color/neutral/ash700',
  ash900: 'Palette/color/neutral/ash900',
  iron: 'Palette/color/neutral/iron',
};

const rgb = (hex) => {
  const value = hex.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16) / 255,
    g: Number.parseInt(value.slice(2, 4), 16) / 255,
    b: Number.parseInt(value.slice(4, 6), 16) / 255,
  };
};

const solid = (hex, opacity = 1) => ({ type: 'SOLID', color: rgb(hex), opacity });

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') throw new Error(`PAGE_NOT_FOUND:${PAGE_ID}`);
await figma.setCurrentPageAsync(page);

const current = page.findOne((node) => node.type === 'FRAME'
  && node.getSharedPluginData(NS, 'entity') === 'subject-master'
  && node.getSharedPluginData(NS, 'subject_id') === CONTRACT.subjectId
  && node.getSharedPluginData(NS, 'population_revision') === REVISION);
if (current) {
  const contractAligned = current.getSharedPluginData(NS, 'recipe_id') === CONTRACT.recipeId
    && current.getSharedPluginData(NS, 'manifest_sha256') === CONTRACT.manifestSha256
    && current.getSharedPluginData(NS, 'spec_sha256') === CONTRACT.contentSpecSha256
    && current.getSharedPluginData(NS, 'content_fingerprint') === CONTRACT.contentFingerprint
    && current.getSharedPluginData(NS, 'affinity_artifact_sha256') === CONTRACT.affinityArtifactSha256
    && current.getSharedPluginData(NS, 'affinity_qa_sha256') === CONTRACT.affinityQaSha256
    && current.getSharedPluginData(NS, 'authority_status') === 'canonical'
    && current.getSharedPluginData(NS, 'verification_status') === 'NOT VERIFIED'
    && current.getSharedPluginData(NS, 'publication_status') === 'publishable'
    && current.getSharedPluginData(NS, 'build_status') === 'complete';
  if (!contractAligned) throw new Error(`CURRENT_ROOT_CONTRACT_DRIFT:${current.id}`);
  return {
    status: 'skipped-current',
    pageId: page.id,
    pageName: page.name,
    masterId: current.id,
    removedLegacyRootId: null,
    childCount: page.children.length,
  };
}

const legacyRoot = await figma.getNodeByIdAsync(LEGACY_ROOT_ID);
if (!legacyRoot || legacyRoot.type !== 'FRAME' || legacyRoot.parent?.id !== PAGE_ID) {
  throw new Error(`LEGACY_ROOT_NOT_FOUND:${LEGACY_ROOT_ID}`);
}

const styles = new Map((await figma.getLocalTextStylesAsync()).map((style) => [style.name, style]));
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
const collectionNameById = new Map(collections.map((collection) => [collection.id, collection.name]));
const variableByRef = new Map();
for (const variable of await figma.variables.getLocalVariablesAsync()) {
  variableByRef.set(`${collectionNameById.get(variable.variableCollectionId)}/${variable.name}`, variable);
}

const paint = (ref, fallback, opacity = 1) => {
  let value = solid(fallback, opacity);
  const variable = variableByRef.get(ref);
  if (variable?.resolvedType === 'COLOR') {
    value = figma.variables.setBoundVariableForPaint(value, 'color', variable);
  }
  return value;
};

const tag = (node, values) => {
  for (const [key, value] of Object.entries(values)) {
    node.setSharedPluginData(NS, key, String(value ?? ''));
  }
};

let master;
try {
  master = figma.createFrame();
  master.name = '01 / FIGMA NATIVE / EDITABLE MASTER / SINGLE IDENTITY';
  master.resize(1440, 3500);
  master.x = 0;
  master.y = 0;
  master.fills = [paint(REF.paper, HEX.paper)];
  master.clipsContent = true;
  master.visible = false;
  page.appendChild(master);

  const layer = new Map();
  for (const name of LAYERS) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(1440, 3500);
    frame.x = 0;
    frame.y = 0;
    frame.fills = [];
    frame.clipsContent = false;
    master.appendChild(frame);
    tag(frame, { entity: 'semantic-layer', subject_id: CONTRACT.subjectId, layer_name: name });
    layer.set(name, frame);
  }

  const colorLayer = layer.get('40 / Color, Gradient, Pattern, or Material');
  const variantsLayer = layer.get('50 / Variants, States, and Optical Sizes');
  const usageLayer = layer.get('60 / Usage and Applications');
  const accessLayer = layer.get('70 / Accessibility, Bilingual, RTL, and Motion');
  const productionLayer = layer.get('80 / Production and Export');
  const rulesLayer = layer.get('90 / Correct Use and Misuse');
  const evidenceLayer = layer.get('99 / Provenance, Status, Evidence, and Navigation');
  const constructionLayer = layer.get('10 / Construction');
  const assetLayer = layer.get('20 / Canonical Assets');
  const typeLayer = layer.get('30 / Live Type and Metadata');
  const referenceLayer = layer.get('00 / Reference');

  const addRect = (target, { x, y, width, height, fillRef, fill, strokeRef, stroke, strokeWeight = 1, name }) => {
    const node = figma.createRectangle();
    node.name = name;
    node.resize(width, height);
    node.x = x;
    node.y = y;
    node.fills = fillRef || fill ? [paint(fillRef, fill)] : [];
    if (strokeRef || stroke) {
      node.strokes = [paint(strokeRef, stroke)];
      node.strokeWeight = strokeWeight;
    } else {
      node.strokes = [];
    }
    target.appendChild(node);
    return node;
  };

  const addEllipse = (target, { x, y, width, height, fillRef, fill, name }) => {
    const node = figma.createEllipse();
    node.name = name;
    node.resize(width, height);
    node.x = x;
    node.y = y;
    node.fills = [paint(fillRef, fill)];
    node.strokes = [];
    target.appendChild(node);
    return node;
  };

  const addText = async (target, {
    text,
    x,
    y,
    width,
    style,
    size,
    fillRef,
    fill,
    align = 'LEFT',
    tracking,
    name,
  }) => {
    const node = figma.createText();
    node.name = name;
    const textStyle = styles.get(style);
    if (typeof node.setTextStyleIdAsync === 'function') await node.setTextStyleIdAsync(textStyle.id);
    else node.textStyleId = textStyle.id;
    node.resize(width, 20);
    node.characters = text;
    if (size) node.fontSize = size;
    if (tracking !== undefined) node.letterSpacing = { unit: 'PERCENT', value: tracking * 100 };
    node.textAutoResize = 'HEIGHT';
    node.textAlignHorizontal = align;
    node.fills = [paint(fillRef, fill)];
    target.appendChild(node);
    node.x = x;
    node.y = y;
    return node;
  };

  const sectionNames = [
    'DEFINITION',
    'CONSTRUCTION AND SOURCE',
    'EXACT TOKENS, ASSETS, STYLES, OR MATERIAL RECIPE',
    'VARIANTS, MODES, STATES, AND OPTICAL SIZES',
    'USAGE',
    'ACCESSIBILITY, BILINGUAL BEHAVIOR, AND RTL',
    'MOTION AND INTERACTION',
    'PRODUCTION AND EXPORT',
    'CORRECT EXAMPLES',
    'MISUSE',
    'PROVENANCE, HASHES, STATUS, AND EVIDENCE',
    'CATEGORY AND RELATED-PAGE LINKS PLUS CANONICAL SOURCE PATHS',
  ];

  const sectionLabel = (index, x, y, target, light = false) => addText(target, {
    text: `${String(index + 1).padStart(2, '0')} / ${sectionNames[index]}`,
    x,
    y,
    width: 560,
    style: 'Data/Micro',
    size: 9,
    fillRef: light ? REF.signal : REF.signalInk,
    fill: light ? HEX.signal : HEX.signalInk,
    tracking: 0.055,
    name: `01.03 / Section ${String(index + 1).padStart(2, '0')} / ${sectionNames[index]}`,
  });

  const statusRegister = async (x, y, width, label, state, target, options = {}) => {
    const dark = options.dark !== false;
    const railRef = options.railRef || (dark ? REF.ash300 : REF.signal);
    const rail = options.rail || (dark ? HEX.ash300 : HEX.signal);
    addRect(target, {
      x,
      y,
      width,
      height: 74,
      fillRef: dark ? REF.ash900 : REF.bone,
      fill: dark ? HEX.ash900 : HEX.bone,
      name: `01.03 / ${label} / Boundary register`,
    });
    addRect(target, { x, y, width: 10, height: 74, fillRef: railRef, fill: rail, name: `01.03 / ${label} / Boundary rail` });
    await addText(typeLayer, {
      text: label,
      x: x + 26,
      y: y + 13,
      width: width - 40,
      style: 'Data/Micro',
      size: 9,
      fillRef: railRef,
      fill: rail,
      tracking: 0.05,
      name: `01.03 / ${label} / Label`,
    });
    await addText(typeLayer, {
      text: state,
      x: x + 26,
      y: y + 40,
      width: width - 40,
      style: 'Technical/Label',
      size: 10,
      fillRef: dark ? REF.paper : REF.void,
      fill: dark ? HEX.paper : HEX.void,
      tracking: 0.025,
      name: `01.03 / ${label} / State`,
    });
  };

  addRect(colorLayer, { x: 0, y: 0, width: 1440, height: 3500, fillRef: REF.paper, fill: HEX.paper, name: 'Ground / Paper mode' });
  addRect(constructionLayer, { x: 80, y: 0, width: 1280, height: 6, fillRef: REF.signal, fill: HEX.signal, name: 'Signal rail / Active datum' });
  await addText(typeLayer, { text: 'BZR / 01 / DETAIL', x: 80, y: 48, width: 420, style: 'Technical/Label', size: 14, fillRef: REF.signalInk, fill: HEX.signalInk, tracking: 0.12, name: 'Metadata / System rail' });
  await addText(typeLayer, { text: 'GOVERNED  /  01.03', x: 1010, y: 48, width: 350, style: 'Technical/Label', size: 14, fillRef: REF.ash700, fill: HEX.ash700, align: 'RIGHT', tracking: 0.08, name: 'Metadata / Status rail' });
  await addText(typeLayer, { text: 'SINGLE IDENTITY / NATIVE\nINTEGRATION', x: 80, y: 118, width: 1120, style: 'Display/H1 Hero', size: 56, fillRef: REF.void, fill: HEX.void, tracking: -0.025, name: 'Title / Subject' });
  await addText(typeLayer, { text: '01 / BRAND CORE  ·  CONTENT-DRIVEN / 1440PX / 144DPI', x: 82, y: 330, width: 920, style: 'Technical/Label', size: 16, fillRef: REF.ash700, fill: HEX.ash700, tracking: 0.04, name: 'Metadata / Category and page rule' });
  await addText(typeLayer, { text: 'INTEGRATE. DO NOT REPLACE.', x: 80, y: 406, width: 900, style: 'Display/H2', size: 28, fillRef: REF.void, fill: HEX.void, tracking: -0.022, name: '01.03 / Hero / Integration thesis' });
  await addText(typeLayer, { text: 'ONE IDENTITY  /  HOST SYSTEM FIRST  /  RECOGNIZABLE WITHOUT RESKINNING', x: 82, y: 458, width: 900, style: 'Data/Micro', size: 10, fillRef: REF.ash700, fill: HEX.ash700, tracking: 0.055, name: '01.03 / Hero / Authority boundary' });

  const instrumentY = 510;
  addRect(colorLayer, { x: 80, y: instrumentY, width: 1280, height: 980, fillRef: REF.void, fill: HEX.void, name: '01.03 / Native integration chassis / Deep Void ground' });
  addRect(colorLayer, { x: 80, y: instrumentY, width: 12, height: 980, fillRef: REF.signal, fill: HEX.signal, name: '01.03 / Native integration chassis / Single-identity index' });
  addRect(colorLayer, { x: 112, y: instrumentY + 34, width: 1216, height: 206, fillRef: REF.ash900, fill: HEX.ash900, name: '01.03 / Identity / Bizarre Industries instrument plate' });
  addRect(colorLayer, { x: 112, y: instrumentY + 34, width: 1216, height: 12, fillRef: REF.signal, fill: HEX.signal, name: '01.03 / Identity / Fixed identity rail' });
  await addText(typeLayer, { text: 'BIZARRE INDUSTRIES', x: 144, y: instrumentY + 78, width: 700, style: 'Display/H2', size: 34, fillRef: REF.paper, fill: HEX.paper, tracking: -0.025, name: '01.03 / Identity / Exact public name' });
  await addText(typeLayer, { text: 'THE ONLY IDENTITY  /  ONE RECOGNITION SYSTEM', x: 146, y: instrumentY + 148, width: 660, style: 'Technical/Label', size: 11, fillRef: REF.signal, fill: HEX.signal, tracking: 0.055, name: '01.03 / Identity / Rule' });
  await addText(typeLayer, { text: 'PUBLIC IDENTITY / ONE\nRECOGNITION SYSTEM / ONE\nNATIVE HOSTS / MULTIPLE', x: 890, y: instrumentY + 76, width: 370, style: 'Data/Micro', size: 10, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.035, name: '01.03 / Identity / Governed properties' });
  addRect(constructionLayer, { x: 164, y: instrumentY + 278, width: 1112, height: 16, fillRef: REF.iron, fill: HEX.iron, name: '01.03 / Native integration chassis / Host-system bus' });
  [292, 708, 1124].forEach((cx, index) => {
    const active = index === 0;
    addRect(constructionLayer, { x: cx - 6, y: instrumentY + 238, width: 12, height: 76, fillRef: active ? REF.signal : REF.ash300, fill: active ? HEX.signal : HEX.ash300, name: `01.03 / Native integration chassis / Platform junction ${index + 1}` });
    addEllipse(assetLayer, { x: cx - 9, y: instrumentY + 281, width: 18, height: 18, fillRef: active ? REF.signal : REF.ash300, fill: active ? HEX.signal : HEX.ash300, name: `01.03 / Native integration chassis / Registered platform ${index + 1}` });
  });

  const platforms = [
    { x: 112, title: 'WEB PRODUCT', role: 'EXISTING COMPONENT SYSTEM', boundary: 'REACT / IMPLEMENTATION, NOT A LOOK', active: true },
    { x: 528, title: 'iOS', role: 'SWIFTUI + iOS CONVENTIONS', boundary: 'TOUCH / DYNAMIC TYPE / NATIVE CONTROLS', active: false },
    { x: 944, title: 'macOS', role: 'SWIFTUI + macOS CONVENTIONS', boundary: 'WINDOWS / MENUS / KEYBOARD / PRECISION INPUT', active: false },
  ];
  for (const platform of platforms) {
    addRect(colorLayer, { x: platform.x, y: instrumentY + 322, width: 384, height: 214, fillRef: REF.ash900, fill: HEX.ash900, name: `01.03 / Platform / ${platform.title} / Host plate` });
    addRect(colorLayer, { x: platform.x, y: instrumentY + 322, width: 10, height: 214, fillRef: platform.active ? REF.signal : REF.ash300, fill: platform.active ? HEX.signal : HEX.ash300, name: `01.03 / Platform / ${platform.title} / Recognition rail` });
    await addText(typeLayer, { text: platform.title, x: platform.x + 30, y: instrumentY + 356, width: 320, style: 'Display/H2', size: 26, fillRef: REF.paper, fill: HEX.paper, tracking: -0.02, name: `01.03 / Platform / ${platform.title} / Name` });
    await addText(typeLayer, { text: platform.role, x: platform.x + 30, y: instrumentY + 416, width: 320, style: 'Data/Micro', size: 10, fillRef: platform.active ? REF.signal : REF.ash300, fill: platform.active ? HEX.signal : HEX.ash300, tracking: 0.05, name: `01.03 / Platform / ${platform.title} / Host rule` });
    await addText(typeLayer, { text: platform.boundary, x: platform.x + 30, y: instrumentY + 474, width: 320, style: 'Data/Micro', size: 8.5, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.035, name: `01.03 / Platform / ${platform.title} / Native boundary` });
  }

  addRect(colorLayer, { x: 112, y: instrumentY + 582, width: 1216, height: 164, fillRef: REF.bone, fill: HEX.bone, name: '01.03 / Host ownership / Rule plane' });
  addRect(colorLayer, { x: 112, y: instrumentY + 582, width: 12, height: 164, fillRef: REF.signal, fill: HEX.signal, name: '01.03 / Host ownership / Signal index' });
  await addText(typeLayer, { text: 'HOST SYSTEM / PRIMARY CHASSIS', x: 146, y: instrumentY + 616, width: 660, style: 'Display/H2', size: 18, fillRef: REF.void, fill: HEX.void, tracking: -0.018, name: '01.03 / Host ownership / Heading' });
  await addText(typeLayer, { text: 'NAVIGATION  /  CONTROLS  /  INPUT  /  ACCESSIBILITY  /  TYPOGRAPHY DEFAULTS  /  DENSITY  /  MOTION GRAMMAR', x: 146, y: instrumentY + 666, width: 1080, style: 'Data/Micro', size: 10, fillRef: REF.signalInk, fill: HEX.signalInk, tracking: 0.035, name: '01.03 / Host ownership / Exact boundary' });
  addRect(colorLayer, { x: 112, y: instrumentY + 784, width: 1216, height: 144, fillRef: REF.ash900, fill: HEX.ash900, name: '01.03 / Bizarre recognition layer / Separate ground' });
  for (let index = 0; index < 26; index += 1) {
    const active = index % 4 === 0;
    addRect(constructionLayer, { x: 144 + index * 44, y: instrumentY + 808, width: 22, height: 4, fillRef: active ? REF.signal : REF.ash700, fill: active ? HEX.signal : HEX.ash700, name: `01.03 / Bizarre recognition layer / Restrained signal segment ${String(index + 1).padStart(2, '0')}` });
  }
  await addText(typeLayer, { text: 'BIZARRE RECOGNITION / RESTRAINED LAYER', x: 144, y: instrumentY + 842, width: 720, style: 'Display/H2', size: 16, fillRef: REF.paper, fill: HEX.paper, tracking: -0.018, name: '01.03 / Bizarre recognition layer / Scope' });
  await addText(typeLayer, { text: 'OPERATIONAL SIGNAL  /  VOICE  /  COMPOSITION  /  DATA VISUALIZATION  /  RARE IDENTITY MOMENTS', x: 144, y: instrumentY + 884, width: 1020, style: 'Data/Micro', size: 9, fillRef: REF.signal, fill: HEX.signal, tracking: 0.045, name: '01.03 / Bizarre recognition layer / Exact boundary' });
  await sectionLabel(0, 112, instrumentY + 944, typeLayer, true);
  await addText(typeLayer, { text: 'Bizarre Industries is the only identity. Products preserve the host and receive a restrained recognition layer.', x: 380, y: instrumentY + 944, width: 910, style: 'Caption/Base', size: 8.5, fillRef: REF.ash300, fill: HEX.ash300, name: '01.03 / Section 01 / Exact governed definition' });
  await sectionLabel(1, 112, instrumentY + 968, constructionLayer, true);
  await addText(constructionLayer, { text: 'AUDIT HOST  /  PRESERVE NATIVE  /  APPLY RESTRAINED LAYER  /  VERIFY NATIVE + RECOGNIZABLE', x: 380, y: instrumentY + 968, width: 910, style: 'Data/Micro', size: 8.5, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.025, name: '01.03 / Section 02 / Construction sequence' });

  const matrixY = 1540;
  addRect(colorLayer, { x: 80, y: matrixY, width: 1280, height: 642, fillRef: REF.bone, fill: HEX.bone, name: '01.03 / Native integration matrix / Ground' });
  addRect(colorLayer, { x: 80, y: matrixY, width: 1280, height: 82, fillRef: REF.void, fill: HEX.void, name: '01.03 / Native integration matrix / Header ground' });
  await addText(variantsLayer, { text: 'NATIVE INTEGRATION MATRIX', x: 112, y: matrixY + 24, width: 660, style: 'Display/H2', size: 22, fillRef: REF.paper, fill: HEX.paper, tracking: -0.02, name: '01.03 / Native integration matrix / Heading' });
  await addText(variantsLayer, { text: 'ONE IDENTITY / MULTIPLE HOST SYSTEMS', x: 890, y: matrixY + 34, width: 400, style: 'Data/Micro', size: 9, fillRef: REF.signal, fill: HEX.signal, tracking: 0.045, name: '01.03 / Native integration matrix / Scope rail' });
  const columns = [
    { x: 112, width: 300, label: 'RULE' },
    { x: 412, width: 184, label: 'IDENTITY' },
    { x: 596, width: 184, label: 'WEB' },
    { x: 780, width: 184, label: 'iOS' },
    { x: 964, width: 184, label: 'macOS' },
    { x: 1148, width: 180, label: 'OTHER' },
  ];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    await addText(variantsLayer, { text: column.label, x: column.x + 12, y: matrixY + 100, width: column.width - 24, style: 'Data/Micro', size: 9, fillRef: index === 1 ? REF.signalInk : REF.void, fill: index === 1 ? HEX.signalInk : HEX.void, tracking: 0.05, name: `01.03 / Native integration matrix / Column ${column.label}` });
    if (index > 0) addRect(constructionLayer, { x: column.x, y: matrixY + 82, width: 1, height: 510, fillRef: REF.ash300, fill: HEX.ash300, name: `01.03 / Native integration matrix / Column divider ${index}` });
  }
  const matrixRows = [
    ['IDENTITY MODEL', 'BIZARRE ONLY', 'HOST PRODUCT', 'HOST PRODUCT', 'HOST PRODUCT', 'HOST PRODUCT'],
    ['HOST VISUAL LANGUAGE', 'RESTRAINED LAYER', 'EXISTING SYSTEM', 'iOS NATIVE', 'macOS NATIVE', 'AUDIT REQUIRED'],
    ['BEHAVIOR OWNER', 'HOST-FIRST RULE', 'HOST APP', 'HOST APP', 'HOST APP', 'HOST APP'],
    ['COMPONENT STRATEGY', 'REUSE -> WRAP -> LOCAL', 'EXISTING PRIMITIVES', 'SYSTEM CONTROLS', 'SYSTEM CONTROLS', 'NATIVE FIRST'],
    ['BIZARRE EXPRESSION', 'ONE IDENTITY', 'FUNCTIONAL + RARE', 'FUNCTIONAL + RARE', 'FUNCTIONAL + RARE', 'FUNCTIONAL + RARE'],
    ['SIGNAL LIME', 'OPERATIONAL', 'STATE ONLY', 'STATE ONLY', 'STATE ONLY', 'STATE ONLY'],
    ['ACCESS + MOTION', 'HOST CONVENTION', 'PRESERVE', 'PRESERVE', 'PRESERVE', 'PRESERVE'],
  ];
  for (let rowIndex = 0; rowIndex < matrixRows.length; rowIndex += 1) {
    const row = matrixRows[rowIndex];
    const y = matrixY + 132 + rowIndex * 64;
    addRect(constructionLayer, { x: 112, y: y + 46, width: 1216, height: 1, fillRef: REF.ash300, fill: HEX.ash300, name: `01.03 / Native integration matrix / Row divider ${rowIndex + 1}` });
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const value = row[columnIndex];
      const column = columns[columnIndex];
      const unresolved = /REQUIRED|AUDIT/.test(value);
      await addText(variantsLayer, { text: value, x: column.x + 12, y, width: column.width - 24, style: 'Data/Micro', size: columnIndex === 0 ? 8.5 : 7.6, fillRef: columnIndex === 1 ? REF.signalInk : unresolved ? REF.ash700 : REF.void, fill: columnIndex === 1 ? HEX.signalInk : unresolved ? HEX.ash700 : HEX.void, tracking: 0.025, name: `01.03 / Native integration matrix / ${row[0]} / ${column.label}` });
    }
  }
  addRect(colorLayer, { x: 112, y: matrixY + 594, width: 1216, height: 34, fillRef: REF.void, fill: HEX.void, name: '01.03 / Native integration matrix / Authority footer' });
  await addText(variantsLayer, { text: 'HOST CONVENTION WINS EVERY CONFLICT. BIZARRE NEVER REPLACES THE PRODUCT CHASSIS.', x: 136, y: matrixY + 606, width: 1120, style: 'Data/Micro', size: 9, fillRef: REF.signal, fill: HEX.signal, tracking: 0.04, name: '01.03 / Native integration matrix / Authority statement' });
  await sectionLabel(2, 112, matrixY + 646, evidenceLayer);
  await addText(evidenceLayer, { text: 'IDENTITY.JSON  /  UI CONTRACT  /  ARCHITECTURE  /  OFFICIAL PLATFORM RESEARCH  /  ZERO IMAGEGEN', x: 510, y: matrixY + 646, width: 760, style: 'Data/Micro', size: 7.8, fillRef: REF.ash700, fill: HEX.ash700, tracking: 0.02, name: '01.03 / Section 03 / Exact source rail' });

  const integrationY = 2250;
  addRect(colorLayer, { x: 80, y: integrationY, width: 1280, height: 300, fillRef: REF.void, fill: HEX.void, name: '01.03 / Integration sequence / Deep Void ground' });
  await addText(usageLayer, { text: 'INTEGRATION SEQUENCE', x: 112, y: integrationY + 28, width: 600, style: 'Display/H2', size: 20, fillRef: REF.paper, fill: HEX.paper, tracking: -0.018, name: '01.03 / Integration sequence / Heading' });
  await addText(usageLayer, { text: 'HOST FIRST  /  BIZARRE SECOND', x: 1000, y: integrationY + 36, width: 300, style: 'Data/Micro', size: 8.5, fillRef: REF.signal, fill: HEX.signal, tracking: 0.05, name: '01.03 / Integration sequence / Reading order' });
  addRect(constructionLayer, { x: 138, y: integrationY + 130, width: 1138, height: 4, fillRef: REF.iron, fill: HEX.iron, name: '01.03 / Integration sequence / Continuous host rail' });
  const steps = [
    { x: 112, label: '01 / AUDIT', state: 'EXISTING INFRASTRUCTURE', rule: 'COMPONENTS / FLOWS / TOKENS', active: true },
    { x: 416, label: '02 / PRESERVE', state: 'NATIVE BEHAVIOR', rule: 'NAV / CONTROL / INPUT / ACCESS', active: false },
    { x: 720, label: '03 / LAYER', state: 'RESTRAINED BIZARRE', rule: 'SIGNAL / VOICE / DATA / MOMENT', active: false },
    { x: 1024, label: '04 / VERIFY', state: 'NATIVE + RECOGNIZABLE', rule: 'HOST CHARACTER STILL PRIMARY', active: false },
  ];
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    addRect(usageLayer, { x: step.x, y: integrationY + 84, width: 280, height: 142, fillRef: REF.ash900, fill: HEX.ash900, name: `01.03 / Integration sequence / ${step.label} / Ground` });
    addRect(usageLayer, { x: step.x, y: integrationY + 84, width: 10, height: 142, fillRef: step.active ? REF.signal : REF.ash300, fill: step.active ? HEX.signal : HEX.ash300, name: `01.03 / Integration sequence / ${step.label} / Rail` });
    addEllipse(assetLayer, { x: step.x + 124, y: integrationY + 119, width: 22, height: 22, fillRef: step.active ? REF.signal : REF.paper, fill: step.active ? HEX.signal : HEX.paper, name: `01.03 / Integration sequence / ${step.label} / Registered datum` });
    await addText(usageLayer, { text: step.label, x: step.x + 24, y: integrationY + 98, width: 220, style: 'Data/Micro', size: 9, fillRef: step.active ? REF.signal : REF.ash300, fill: step.active ? HEX.signal : HEX.ash300, tracking: 0.05, name: `01.03 / Integration sequence / ${step.label} / Label` });
    await addText(usageLayer, { text: step.state, x: step.x + 24, y: integrationY + 154, width: 230, style: 'Display/H2', size: 13, fillRef: REF.paper, fill: HEX.paper, tracking: -0.015, name: `01.03 / Integration sequence / ${step.label} / State` });
    await addText(usageLayer, { text: step.rule, x: step.x + 24, y: integrationY + 192, width: 230, style: 'Data/Micro', size: 7.2, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.025, name: `01.03 / Integration sequence / ${step.label} / Rule` });
  }
  await sectionLabel(3, 112, integrationY + 244, variantsLayer, true);
  await addText(variantsLayer, { text: 'WEB / iOS / macOS / OTHER HOSTS KEEP THEIR OWN VISUAL LANGUAGE, BEHAVIOR, AND COMPONENT GRAMMAR.', x: 390, y: integrationY + 244, width: 900, style: 'Data/Micro', size: 7.8, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.02, name: '01.03 / Section 04 / Host-state rule' });
  await sectionLabel(4, 112, integrationY + 272, usageLayer, true);
  await addText(usageLayer, { text: 'USE BEFORE THEMING, COMPONENT CHANGES, PLATFORM ADAPTATION, OR PROTOTYPE WORK FOR ANY PRODUCT.', x: 390, y: integrationY + 272, width: 900, style: 'Data/Micro', size: 7.8, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.02, name: '01.03 / Section 05 / Exact governed use' });

  const rulesY = 2590;
  addRect(colorLayer, { x: 80, y: rulesY, width: 620, height: 290, fillRef: REF.bone, fill: HEX.bone, name: '01.03 / Correct / Ground' });
  addRect(colorLayer, { x: 80, y: rulesY, width: 12, height: 290, fillRef: REF.signal, fill: HEX.signal, name: '01.03 / Correct / Signal rail' });
  await addText(rulesLayer, { text: 'CORRECT / NATIVE FIRST, RECOGNIZABLE SECOND', x: 116, y: rulesY + 28, width: 570, style: 'Display/H2', size: 16, fillRef: REF.void, fill: HEX.void, tracking: -0.018, name: '01.03 / Correct / Heading' });
  await statusRegister(116, rulesY + 84, 240, 'HOST', 'PRESERVED', rulesLayer, { dark: false, railRef: REF.signal, rail: HEX.signal });
  await statusRegister(376, rulesY + 84, 288, 'BIZARRE', 'RESTRAINED + FUNCTIONAL', rulesLayer, { dark: false, railRef: REF.signalInk, rail: HEX.signalInk });
  await sectionLabel(8, 116, rulesY + 188, rulesLayer);
  await addText(rulesLayer, { text: 'The product preserves its host system and platform character. A restrained functional Bizarre layer makes it recognizable.', x: 116, y: rulesY + 220, width: 540, style: 'Caption/Base', size: 9, fillRef: REF.ash700, fill: HEX.ash700, name: '01.03 / Section 09 / Correct sentence' });
  addRect(colorLayer, { x: 740, y: rulesY, width: 620, height: 290, fillRef: REF.void, fill: HEX.void, name: '01.03 / Misuse / Ground' });
  await addText(rulesLayer, { text: 'MISUSE / REPLACEMENT SKIN', x: 776, y: rulesY + 28, width: 500, style: 'Display/H2', size: 18, fillRef: REF.paper, fill: HEX.paper, tracking: -0.018, name: '01.03 / Misuse / Heading' });
  await statusRegister(776, rulesY + 84, 240, 'CONTROLS', 'RESKINNED', rulesLayer, { railRef: REF.ash300, rail: HEX.ash300 });
  await statusRegister(1036, rulesY + 84, 288, 'IDENTITY', 'DERIVATIVE CREATED', rulesLayer, { railRef: REF.ash300, rail: HEX.ash300 });
  await sectionLabel(9, 776, rulesY + 188, rulesLayer, true);
  await addText(rulesLayer, { text: 'Do not reskin standard controls, replace navigation, invent a React visual language, or force Bizarre styling onto every surface.', x: 776, y: rulesY + 220, width: 540, style: 'Caption/Base', size: 9, fillRef: REF.ash300, fill: HEX.ash300, name: '01.03 / Section 10 / Misuse sentence' });

  const governanceY = 2920;
  addRect(colorLayer, { x: 80, y: governanceY, width: 1280, height: 448, fillRef: REF.void, fill: HEX.void, name: '01.03 / Governance and operations / Ground' });
  const operations = [
    { x: 112, width: 360, heading: 'ACCESS', cue: 'HOST-NATIVE ACCESSIBILITY', state: 'FOCUS / INPUT / TEXT SCALE / SR', index: 5, text: 'Preserve host focus, keyboard, screen-reader, and text-scaling behavior. No public Arabic copy appears on this page.', production: false },
    { x: 520, width: 360, heading: 'MOTION', cue: 'HOST MOTION GRAMMAR FIRST', state: 'REDUCE MOTION / NATIVE + IMMEDIATE', index: 6, text: 'Use Bizarre motion only for governed signal or state moments. Platform timing and reduced-motion behavior remain primary.', production: false },
    { x: 928, width: 400, heading: 'EXPORT', cue: 'LIVE TYPE / EDITABLE VECTORS', state: 'PDF + PNG / AFTER VERIFICATION', index: 7, text: 'No raster reference, logo, gradient, ImageGen reference, or public Arabic copy is embedded on this page.', production: true },
  ];
  for (const operation of operations) {
    const target = operation.production ? productionLayer : accessLayer;
    await addText(target, { text: operation.heading, x: operation.x, y: governanceY + 30, width: operation.width, style: 'Display/H2', size: 20, fillRef: operation.production ? REF.signal : REF.paper, fill: operation.production ? HEX.signal : HEX.paper, tracking: -0.018, name: `01.03 / Governance / ${operation.heading}` });
    await addText(target, { text: operation.cue, x: operation.x, y: governanceY + 72, width: operation.width, style: 'Data/Micro', size: 8.5, fillRef: REF.signal, fill: HEX.signal, tracking: 0.045, name: `01.03 / Governance / ${operation.heading} cue` });
    addRect(target, { x: operation.x, y: governanceY + 108, width: operation.width, height: 54, fillRef: REF.iron, fill: HEX.iron, name: `01.03 / Governance / ${operation.heading} state register` });
    addRect(target, { x: operation.x, y: governanceY + 108, width: 10, height: 54, fillRef: operation.production ? REF.signal : REF.ash300, fill: operation.production ? HEX.signal : HEX.ash300, name: `01.03 / Governance / ${operation.heading} state rail` });
    await addText(target, { text: operation.state, x: operation.x + 26, y: governanceY + 126, width: operation.width - 44, style: 'Data/Micro', size: 8, fillRef: REF.paper, fill: HEX.paper, tracking: 0.03, name: `01.03 / Governance / ${operation.heading} state` });
    await sectionLabel(operation.index, operation.x, governanceY + 184, target, true);
    await addText(target, { text: operation.text, x: operation.x, y: governanceY + 210, width: operation.width, style: 'Caption/Base', size: 7.5, fillRef: REF.ash300, fill: HEX.ash300, name: `01.03 / Section ${String(operation.index + 1).padStart(2, '0')} / Governed content` });
  }
  addRect(constructionLayer, { x: 112, y: governanceY + 286, width: 1216, height: 1, fillRef: REF.iron, fill: HEX.iron, name: '01.03 / Governance / Provenance separator' });
  await sectionLabel(10, 112, governanceY + 306, evidenceLayer, true);
  await addText(evidenceLayer, { text: 'AUTHORITY / CANONICAL  /  VERIFICATION / NOT VERIFIED  /  PUBLICATION / PUBLISHABLE AFTER VERIFICATION  /  IMAGEGEN / FORBIDDEN  /  LOGO INSTANCES / ZERO  /  GRADIENTS / ZERO', x: 112, y: governanceY + 334, width: 560, style: 'Data/Micro', size: 6.4, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.02, name: '01.03 / Section 11 / Provenance summary' });
  await sectionLabel(11, 720, governanceY + 306, evidenceLayer, true);
  await addText(evidenceLayer, { text: 'CATEGORY / 01 BRAND CORE  /  RELATED / 01.00 + 01.01 + 01.02 + 01.04  /  DEPENDENCIES / 09.01 + 09.02 + 12.05  /  SOURCES / IDENTITY + ARCHITECTURE + UI CONTRACT + COMPONENTS + PLATFORM RESEARCH', x: 720, y: governanceY + 334, width: 608, style: 'Data/Micro', size: 6.4, fillRef: REF.ash300, fill: HEX.ash300, tracking: 0.02, name: '01.03 / Section 12 / Navigation summary' });
  await addText(evidenceLayer, { text: 'NATIVE FIGMA INTEGRATION INSTRUMENT  /  ONE IDENTITY  /  HOST SYSTEM FIRST  /  NOT VERIFIED', x: 112, y: governanceY + 402, width: 900, style: 'Data/Micro', size: 9, fillRef: REF.signal, fill: HEX.signal, tracking: 0.04, name: '01.03 / Governance / Native build status' });

  addRect(constructionLayer, { x: 80, y: 3410, width: 1280, height: 1, fillRef: REF.ash300, fill: HEX.ash300, name: 'Footer datum' });
  await addText(evidenceLayer, { text: 'CATCH THE STARS  /  MAKE THE DISTANT TANGIBLE', x: 80, y: 3442, width: 700, style: 'Technical/Label', size: 12, fillRef: REF.signalInk, fill: HEX.signalInk, tracking: 0.1, name: 'Footer / Permanent tagline' });
  await addText(evidenceLayer, { text: '2.0.0  /  220DDA8FF98F', x: 1080, y: 3442, width: 280, style: 'Technical/Label', size: 12, fillRef: REF.ash700, fill: HEX.ash700, align: 'RIGHT', name: 'Footer / Manifest version' });

  referenceLayer.locked = true;
  tag(master, {
    entity: 'subject-master',
    subject_id: CONTRACT.subjectId,
    recipe_id: CONTRACT.recipeId,
    population_revision: REVISION,
    manifest_sha256: CONTRACT.manifestSha256,
    spec_sha256: CONTRACT.contentSpecSha256,
    content_fingerprint: CONTRACT.contentFingerprint,
    affinity_artifact_sha256: CONTRACT.affinityArtifactSha256,
    affinity_qa_sha256: CONTRACT.affinityQaSha256,
    authority_status: 'canonical',
    verification_status: 'NOT VERIFIED',
    publication_status: 'publishable',
    build_status: 'complete',
  });

  const removedLegacyRootId = legacyRoot.id;
  legacyRoot.remove();

  page.name = PAGE_NAME;
  tag(page, {
    subject_id: CONTRACT.subjectId,
    current_master_id: master.id,
    population_revision: REVISION,
    build_status: 'complete',
  });
  master.visible = true;
  master.locked = false;
  figma.currentPage.selection = [master];
  figma.viewport.scrollAndZoomIntoView([master]);

  return {
    status: 'migrated',
    pageId: page.id,
    pageName: page.name,
    masterId: master.id,
    removedLegacyRootId,
    pageChildCount: page.children.length,
    directLayerCount: master.children.length,
    directLayerNames: master.children.map((node) => node.name),
    descendantCount: master.findAll(() => true).length,
  };
} catch (error) {
  if (master && master.parent) master.remove();
  throw error;
}
