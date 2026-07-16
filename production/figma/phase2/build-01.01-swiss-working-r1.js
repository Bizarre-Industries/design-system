const PAGE_ID = '47:7';
const OLD_ROOT_ID = '83:72';
const SOURCE_FIELD_ID = '101:466';
const NS = 'bizarre_design_system';
const REVISION = 'figma-01.01-swiss-working-r1-affinity-r3';

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') throw new Error('01.01 page not found');
await figma.setCurrentPageAsync(page);

const oldRoot = await figma.getNodeByIdAsync(OLD_ROOT_ID);
if (!oldRoot || oldRoot.type !== 'FRAME') throw new Error('Existing 01.01 root not found');
const sourceField = await figma.getNodeByIdAsync(SOURCE_FIELD_ID);
if (!sourceField || sourceField.type !== 'FRAME') throw new Error('Governed 07.04 contour source not found');

for (const node of [...page.children]) {
  if (node.type === 'FRAME' && node.name.startsWith('DRAFT / 01.01 /')) node.remove();
}

const variables = await figma.variables.getLocalVariablesAsync();
const variableByName = new Map(variables.map((variable) => [variable.name, variable]));
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const modesCollection = collections.find((collection) => collection.name === 'Modes');
const paperMode = modesCollection?.modes.find((mode) => mode.name === 'paper');
const textStyles = await figma.getLocalTextStylesAsync();
const styleByName = new Map(textStyles.map((style) => [style.name, style]));
const requiredStyles = [
  'Display/H1 Hero',
  'Display/H2',
  'Industrial/H3',
  'Industrial/H4',
  'Body/Lead',
  'Body/Base',
  'Technical/Label',
  'Data/Micro',
];
for (const name of requiredStyles) {
  const style = styleByName.get(name);
  if (!style) throw new Error(`Missing local text style: ${name}`);
  await figma.loadFontAsync(style.fontName);
}

const colorNames = {
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
for (const variableName of Object.values(colorNames)) {
  if (!variableByName.has(variableName)) throw new Error(`Missing canonical variable: ${variableName}`);
}

function paint(variableName, opacity = 1) {
  const variable = variableByName.get(variableName);
  let value = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity };
  value = figma.variables.setBoundVariableForPaint(value, 'color', variable);
  return value;
}

function frame(parent, name, x, y, width, height, fillName = null, clipsContent = false) {
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

function rect(parent, name, x, y, width, height, fillName, opacity = 1) {
  const node = figma.createRectangle();
  node.name = name;
  node.resize(width, height);
  node.x = x;
  node.y = y;
  node.fills = [paint(fillName, opacity)];
  parent.appendChild(node);
  return node;
}

function ellipse(parent, name, x, y, width, height, fillName = null, strokeName = null, strokeWeight = 1, rotation = 0) {
  const node = figma.createEllipse();
  node.name = name;
  node.resize(width, height);
  node.x = x;
  node.y = y;
  node.rotation = rotation;
  node.fills = fillName ? [paint(fillName)] : [];
  node.strokes = strokeName ? [paint(strokeName)] : [];
  if (strokeName) node.strokeWeight = strokeWeight;
  parent.appendChild(node);
  return node;
}

function text(parent, name, characters, x, y, width, styleName, fillName, options = {}) {
  const style = styleByName.get(styleName);
  const node = figma.createText();
  node.name = name;
  node.textStyleId = style.id;
  node.characters = characters;
  node.resize(width, 10);
  node.textAutoResize = 'HEIGHT';
  node.x = x;
  node.y = y;
  node.fills = [paint(fillName)];
  if (options.fontSize != null) node.fontSize = options.fontSize;
  if (options.lineHeight != null) node.lineHeight = { unit: 'PIXELS', value: options.lineHeight };
  if (options.letterSpacing != null) node.letterSpacing = { unit: 'PERCENT', value: options.letterSpacing };
  if (options.textAlignHorizontal) node.textAlignHorizontal = options.textAlignHorizontal;
  if (options.opacity != null) node.opacity = options.opacity;
  parent.appendChild(node);
  return node;
}

function rule(parent, name, x, y, width, height = 1, fillName = colorNames.ash300) {
  return rect(parent, name, x, y, width, height, fillName);
}

function cloneTransparentField(parent, name, x, y, scale) {
  const clone = sourceField.clone();
  clone.name = name;
  for (const child of clone.children) {
    if ('fills' in child && 'strokes' in child && child.fills !== figma.mixed && child.strokes !== figma.mixed) {
      const visibleFills = child.fills.filter((value) => value.visible);
      const visibleStrokes = child.strokes.filter((value) => value.visible);
      if (child.width > sourceField.width * 0.9 && child.height > sourceField.height * 0.9 && visibleFills.length && !visibleStrokes.length) {
        child.visible = false;
        child.name = `${child.name} / Background hidden for oval field translation`;
      }
    }
  }
  clone.rescale(scale);
  clone.x = x;
  clone.y = y;
  clone.fills = [];
  parent.appendChild(clone);
  return clone;
}

const root = frame(page, 'DRAFT / 01.01 / FIGMA NATIVE EDITABLE MASTER', 0, 0, 1440, 3500, colorNames.paper, true);
root.visible = false;
if (modesCollection && paperMode) root.setExplicitVariableModeForCollection(modesCollection, paperMode.modeId);
root.setSharedPluginData(NS, 'subjectId', '01.01');
root.setSharedPluginData(NS, 'recipeId', '01.01/visual/r1');
root.setSharedPluginData(NS, 'visualRevision', REVISION);
root.setSharedPluginData(NS, 'authority', 'canonical');
root.setSharedPluginData(NS, 'verification', 'NOT VERIFIED');
root.setSharedPluginData(NS, 'publication', 'publishable under governance');
root.setSharedPluginData(NS, 'affinitySource', 'affinity-artifact://Bizarre-Industries-Masterbrand-Library.afdesign#01.01');
root.setSharedPluginData(NS, 'affinityRevision', 'brand-core-swiss-working-artifact-first-r3-editorial-fit');
root.setSharedPluginData(NS, 'imagegenTarget', 'outputs/imagegen/phase2-brand-core/01.01/swiss-working-instrument-target-v1.png');
root.setSharedPluginData(NS, 'imagegenSha256', '96eaf8958c31adf92e215705c7a71b8a2523f728620880bc8d7cb58f92d55bdb');
root.setSharedPluginData(NS, 'sourceContourNode', SOURCE_FIELD_ID);
root.setSharedPluginData(NS, 'logoPolicy', 'No logo instance on this page hero. Any future mark remains exact and monochrome.');

const reference = frame(root, '00 / Reference / NONPUBLISHABLE / 01.01 ImageGen and Affinity render', 0, 0, 1280, 760, null, true);
reference.visible = false;
reference.setSharedPluginData(NS, 'classification', 'CONCEPT REFERENCE - NONPUBLISHABLE');

rect(root, 'Signal rail / Active datum', 80, 0, 1280, 6, colorNames.signal);
text(root, 'Metadata / System rail', 'BZR / 01 / DETAIL', 80, 42, 420, 'Technical/Label', colorNames.signalInk, { fontSize: 14, letterSpacing: 12 });
text(root, 'Metadata / Status rail', 'GOVERNED / 01.01 / NOT VERIFIED', 960, 42, 400, 'Technical/Label', colorNames.ash700, { fontSize: 12, letterSpacing: 8, textAlignHorizontal: 'RIGHT' });
text(root, 'Title / Subject', 'DESIGN PHILOSOPHY /\nSWISS-WORKING', 80, 112, 1200, 'Display/H2', colorNames.void, { fontSize: 64, lineHeight: 72, letterSpacing: -3 });
text(root, 'Metadata / Category and page rule', '01 / BRAND CORE  /  CONTENT-DRIVEN  /  1440PX  /  PAPER MODE', 82, 332, 880, 'Technical/Label', colorNames.ash700, { fontSize: 14, letterSpacing: 4 });

const hero = frame(root, 'Specimen / 01.01 / Swiss-working instrument / Native editable', 80, 430, 1280, 760, colorNames.paper, true);
rule(hero, 'Specimen / Top datum', 0, 0, 1280, 1, colorNames.ash300);
rule(hero, 'Specimen / Bottom datum', 0, 759, 1280, 1, colorNames.ash300);

const phases = [
  { x: 24, id: '01', title: 'SIGNAL', note: 'ONE ACCENT' },
  { x: 276, id: '02', title: 'INSTRUMENT', note: 'MEASURED STRUCTURE' },
  { x: 544, id: '03', title: 'DATA', note: 'REAL METADATA' },
  { x: 866, id: '04', title: 'REVEAL', note: 'EARNED PERSONALITY' },
];
for (let index = 0; index < phases.length; index += 1) {
  const phase = phases[index];
  text(hero, `Phase ${phase.id} / Label`, `${phase.id} / ${phase.title}`, phase.x, 32, 220, 'Technical/Label', index === 3 ? colorNames.signalInk : colorNames.void, { fontSize: 11, letterSpacing: 7 });
  text(hero, `Phase ${phase.id} / Note`, phase.note, phase.x, 58, 220, 'Data/Micro', colorNames.ash700, { fontSize: 9, letterSpacing: 4 });
  rule(hero, `Phase ${phase.id} / Progress datum`, phase.x, 86, index === 3 ? 126 : 112, index === 3 ? 4 : 1, index === 3 ? colorNames.signal : colorNames.ash300);
}

text(hero, 'Philosophy / Not Swiss-looking', 'NOT SWISS-LOOKING.', 24, 116, 520, 'Display/H2', colorNames.void, { fontSize: 38, lineHeight: 44, letterSpacing: -3 });
text(hero, 'Philosophy / Swiss-working', 'SWISS-WORKING.', 24, 166, 520, 'Display/H2', colorNames.signalInk, { fontSize: 42, lineHeight: 48, letterSpacing: -3 });
text(hero, 'Philosophy / Definition', 'FUNCTIONAL PRECISION BECOMES IDENTITY.', 26, 230, 520, 'Technical/Label', colorNames.ash700, { fontSize: 10, letterSpacing: 6 });

ellipse(hero, 'Display Field / Smooth deep-void body', 706, 92, 772, 556, colorNames.void, colorNames.signal, 1.2, -2.5);
const heroField = cloneTransparentField(hero, 'Display Field / Exact governed 07.04 contour source / Background separated', 616, 146, 1.86);
heroField.setSharedPluginData(NS, 'sourceNodeId', SOURCE_FIELD_ID);
heroField.setSharedPluginData(NS, 'sourcePolicy', 'Exact clone. Background separated from source geometry; no contour redraw.');
text(hero, 'Display Field / Active state', 'REVEAL / ACTIVE', 988, 126, 190, 'Data/Micro', colorNames.signal, { fontSize: 10, letterSpacing: 6 });

rule(hero, 'Functional rail / Signal path', 24, 360, 1110, 2, colorNames.signal);
for (let index = 0; index <= 58; index += 1) {
  const major = index % 10 === 0;
  rect(hero, `Functional rail / Tick ${String(index + 1).padStart(2, '0')}`, 24 + index * 18.8, 360 - (major ? 7 : 3), 1, major ? 16 : 7, index > 39 ? colorNames.signal : colorNames.ash700);
}
for (const [index, x] of [24, 276, 544, 866, 1078].entries()) {
  ellipse(hero, `Functional rail / Datum ${String(index + 1).padStart(2, '0')}`, x - 5, 355, 10, 10, index === 4 ? colorNames.signal : colorNames.void);
}

for (let index = 0; index < 4; index += 1) {
  const size = 220 - index * 52;
  ellipse(hero, `Instrument / Calibration ring ${String(index + 1).padStart(2, '0')}`, 368 - size / 2, 360 - size / 2, size, size, null, index === 2 ? colorNames.signalInk : colorNames.ash300, index === 2 ? 1.6 : 1);
}
rule(hero, 'Instrument / Vertical calibration axis', 367.5, 246, 1, 228, colorNames.ash300);
ellipse(hero, 'Instrument / Registered center', 362, 354, 12, 12, colorNames.void);
ellipse(hero, 'Instrument / Active center', 365, 357, 6, 6, colorNames.signal);

for (let row = 0; row < 8; row += 1) {
  for (let column = 0; column < 12; column += 1) {
    const active = (row === 4 && [2, 6, 10].includes(column)) || (column === 6 && row === 1);
    ellipse(hero, `Data / Sample ${String(row + 1).padStart(2, '0')}.${String(column + 1).padStart(2, '0')}`, 484 + column * 20, 286 + row * 20, active ? 4 : 2, active ? 4 : 2, active ? colorNames.signal : colorNames.ash300);
  }
}
text(hero, 'Data / Governed synthetic metadata', 'ATLAS / G-042\nMODEL / MULTI-MASS FIELD\nSOURCE / SYNTHETIC\nSEED / 241107\nTRACE / ACTIVE', 500, 414, 240, 'Data/Micro', colorNames.ash700, { fontSize: 9, lineHeight: 13, letterSpacing: 2 });

rect(hero, 'Evidence console / Ground', 24, 580, 872, 148, colorNames.bone);
for (let index = 1; index < 4; index += 1) rule(hero, `Evidence console / Divider ${index}`, 24 + index * 218, 580, 1, 148, colorNames.ash300);
const evidence = [
  ['INPUT', 'SIGNAL / LIVE'],
  ['METHOD', 'CALIBRATED / REPEATABLE'],
  ['EVIDENCE', 'SOURCE / SYNTHETIC'],
  ['TEST', 'FUNCTION / RECOGNITION /\nUSEFUL REVEAL'],
];
for (let index = 0; index < evidence.length; index += 1) {
  const x = 46 + index * 218;
  text(hero, `Evidence console / ${evidence[index][0]}`, evidence[index][0], x, 604, 185, 'Data/Micro', colorNames.signalInk, { fontSize: 8, letterSpacing: 7 });
  text(hero, `Evidence console / ${evidence[index][0]} value`, evidence[index][1], x, 644, 185, 'Technical/Label', colorNames.void, { fontSize: 10, lineHeight: 15, letterSpacing: 3 });
}
rect(hero, 'Independent closing / Deep Void plate', 920, 580, 336, 148, colorNames.void);
text(hero, 'Independent closing / Recognition grammar', 'BEND  >  ABSENCE  >  SIGNAL', 944, 606, 290, 'Data/Micro', colorNames.ash300, { fontSize: 8, letterSpacing: 6 });
text(hero, 'Independent closing / Tagline', 'CATCH THE STARS', 944, 644, 290, 'Display/H2', colorNames.signal, { fontSize: 22, lineHeight: 28, letterSpacing: -2 });
text(hero, 'Independent closing / Meaning', 'MAKE THE DISTANT TANGIBLE', 946, 692, 284, 'Data/Micro', colorNames.paper, { fontSize: 8, letterSpacing: 5 });
text(root, 'Reconstruction status', 'NATIVE FIGMA TRANSLATION / AFFINITY R3 SOURCE / IMAGEGEN TARGET STORED AS NONPUBLISHABLE REFERENCE / VISIBLE ELEMENTS EDITABLE', 82, 1208, 1240, 'Data/Micro', colorNames.signalInk, { fontSize: 10, letterSpacing: 3 });

const testBand = frame(root, 'Editorial band / The test', 80, 1340, 1280, 290, colorNames.void, true);
rect(testBand, 'The test / Signal index', 0, 0, 12, 290, colorNames.signal);
text(testBand, 'The test / Heading', 'THE TEST', 36, 28, 180, 'Technical/Label', colorNames.signal, { fontSize: 11, letterSpacing: 8 });
text(testBand, 'The test / Statement', 'EVERY NEW CHOICE MUST IMPROVE', 36, 68, 640, 'Body/Lead', colorNames.paper, { fontSize: 20, lineHeight: 26 });
const tests = [
  ['FUNCTION', 'DOES IT WORK BETTER?'],
  ['RECOGNITION', 'DOES IT BECOME MORE BIZARRE?'],
  ['USEFUL REVEAL', 'DOES DETAIL EARN ITS PLACE?'],
];
for (let index = 0; index < tests.length; index += 1) {
  const x = 36 + index * 406;
  rule(testBand, `The test / ${tests[index][0]} datum`, x, 126, 358, 1, index === 2 ? colorNames.signal : colorNames.iron);
  ellipse(testBand, `The test / ${tests[index][0]} registered state`, x + 350, 120, 12, 12, index === 2 ? colorNames.signal : colorNames.paper);
  text(testBand, `The test / ${tests[index][0]}`, tests[index][0], x, 150, 360, 'Display/H2', index === 2 ? colorNames.signal : colorNames.paper, { fontSize: 24, lineHeight: 30, letterSpacing: -2 });
  text(testBand, `The test / ${tests[index][0]} question`, tests[index][1], x, 205, 360, 'Data/Micro', colorNames.ash300, { fontSize: 9, letterSpacing: 4 });
}
text(testBand, 'Section 01 / Definition', '01 / DEFINITION', 968, 28, 270, 'Data/Micro', colorNames.ash300, { fontSize: 9, letterSpacing: 5, textAlignHorizontal: 'RIGHT' });
text(testBand, 'Section 01 / Exact governed content', 'Swiss-working means functional precision becoming identity, never superficial International Style imitation.', 36, 250, 900, 'Body/Base', colorNames.ash300, { fontSize: 10, lineHeight: 14 });

text(root, 'Only two modes / Heading', 'ONLY TWO MODES', 80, 1662, 260, 'Technical/Label', colorNames.signalInk, { fontSize: 12, letterSpacing: 8 });
text(root, 'Only two modes / Rule', 'ASTRONOMICAL ATLAS IS AN EXPRESSION LAYER. NOT A THIRD MODE.', 690, 1664, 670, 'Data/Micro', colorNames.ash700, { fontSize: 9, letterSpacing: 4, textAlignHorizontal: 'RIGHT' });
const precision = frame(root, 'Mode / Precision Panel', 80, 1700, 600, 430, colorNames.bone, true);
rect(precision, 'Precision Panel / Active rail', 0, 0, 600, 12, colorNames.signal);
text(precision, 'Precision Panel / Name', 'PRECISION PANEL', 32, 42, 520, 'Display/H2', colorNames.void, { fontSize: 30, lineHeight: 36, letterSpacing: -2 });
text(precision, 'Precision Panel / Definition', 'METHOD / PUBLIC LEGIBILITY / REPEATABLE STRUCTURE', 32, 102, 520, 'Data/Micro', colorNames.ash700, { fontSize: 9, letterSpacing: 4 });
for (let row = 0; row < 5; row += 1) {
  const y = 170 + row * 42;
  rule(precision, `Precision Panel / Measured row ${row + 1}`, 32, y, 516, 1, row === 2 ? colorNames.signalInk : colorNames.ash300);
  ellipse(precision, `Precision Panel / Registered datum ${row + 1}`, 28 + row * 84, y - 5, 10, 10, row === 2 ? colorNames.signalInk : colorNames.void);
}
text(precision, 'Precision Panel / Functional sequence', 'SIGNAL  /  INSTRUMENT  /  DATA  /  REVEAL', 32, 342, 520, 'Technical/Label', colorNames.void, { fontSize: 10, letterSpacing: 6 });
text(precision, 'Section 03 / Label', '03 / EXACT TOKENS, ASSETS, STYLES, OR MATERIAL RECIPE', 32, 380, 530, 'Data/Micro', colorNames.signalInk, { fontSize: 8, letterSpacing: 3 });
text(precision, 'Section 03 / Source summary', 'DESIGN DOC / IDENTITY / ARCHITECTURE / GEOMETRY + MODES TOKENS / OWNER PREVIEW', 32, 404, 530, 'Data/Micro', colorNames.ash700, { fontSize: 7, letterSpacing: 2 });

const display = frame(root, 'Mode / Display Field', 760, 1700, 600, 430, colorNames.void, true);
text(display, 'Display Field / Name', 'DISPLAY FIELD', 32, 42, 520, 'Display/H2', colorNames.paper, { fontSize: 30, lineHeight: 36, letterSpacing: -2 });
text(display, 'Display Field / Definition', 'EMOTION / IMMERSION / MATERIAL DEPTH', 32, 102, 520, 'Data/Micro', colorNames.ash300, { fontSize: 9, letterSpacing: 4 });
const displaySource = cloneTransparentField(display, 'Display Field / Exact governed 07.04 contour source / Mode proof', 60, 126, 1.28);
displaySource.setSharedPluginData(NS, 'sourceNodeId', SOURCE_FIELD_ID);
text(display, 'Section 04 / Label', '04 / VARIANTS, MODES, STATES, AND OPTICAL SIZES', 32, 380, 530, 'Data/Micro', colorNames.signal, { fontSize: 8, letterSpacing: 3 });
text(display, 'Section 04 / Governed content', 'PRECISION PANEL + DISPLAY FIELD ONLY / ATLAS REMAINS AN EXPRESSION LAYER', 32, 404, 530, 'Data/Micro', colorNames.ash300, { fontSize: 7, letterSpacing: 2 });

const criteria = frame(root, 'Editorial band / Operating criteria', 80, 2180, 1280, 330, colorNames.bone, true);
text(criteria, 'Operating criteria / Heading', 'OPERATING CRITERIA', 32, 30, 300, 'Technical/Label', colorNames.signalInk, { fontSize: 12, letterSpacing: 8 });
const criteriaItems = ['OPERATIONAL CUES', 'REPEATABLE GRIDS', 'REAL METADATA', 'TACTILE\nCONSTRUCTION', 'GARAGE ACCESS'];
for (let index = 0; index < criteriaItems.length; index += 1) {
  const x = 32 + index * 240;
  text(criteria, `Operating criterion ${index + 1} / Index`, String(index + 1).padStart(2, '0'), x, 88, 204, 'Data/Micro', index === 4 ? colorNames.signalInk : colorNames.ash700, { fontSize: 9, letterSpacing: 5 });
  rule(criteria, `Operating criterion ${index + 1} / Datum`, x, 128, 204, 1, colorNames.ash300);
  ellipse(criteria, `Operating criterion ${index + 1} / Registered value`, x + 184 - index * 24, 122, 12, 12, index === 4 ? colorNames.signal : colorNames.void);
  text(criteria, `Operating criterion ${index + 1} / Name`, criteriaItems[index], x, 166, 204, 'Body/Lead', colorNames.void, { fontSize: 16, lineHeight: 20 });
}
text(criteria, 'Section 05 / Usage', '05 / USAGE', 32, 258, 160, 'Data/Micro', colorNames.signalInk, { fontSize: 8, letterSpacing: 5 });
text(criteria, 'Section 05 / Exact governed content', 'Use this test for every new design choice: improve function, recognition, or useful reveal.', 32, 282, 900, 'Body/Base', colorNames.ash700, { fontSize: 10, lineHeight: 14 });

const operationsY = 2540;
const operations = [
  { x: 80, index: '06', title: 'ACCESS', cue: 'LABEL + SHAPE + POSITION', content: 'Plain language. Equal bilingual authority. Physical fields do not mirror.' },
  { x: 515, index: '07', title: 'MOTION', cue: 'STATE OR FORCE. NEVER DECORATION.', content: 'The philosophy is static. Motion examples route to 08 and reduced motion shows the final state.' },
  { x: 950, index: '08', title: 'PRODUCTION', cue: 'LIVE TYPE / NATIVE ASSETS / SOURCE-BACKED', content: 'Export PDF and PNG without flattening canonical assets. Signal and the mark never receive gradients.' },
];
for (let opIndex = 0; opIndex < operations.length; opIndex += 1) {
  const operation = operations[opIndex];
  const op = frame(root, `Editorial band / ${operation.title}`, operation.x, operationsY, 410, 330, null, true);
  rule(op, `${operation.title} / Top datum`, 0, 0, 410, 1, opIndex === 2 ? colorNames.signalInk : colorNames.ash300);
  text(op, `Section ${operation.index} / Label`, `${operation.index} / ${operation.title === 'ACCESS' ? 'ACCESSIBILITY, BILINGUAL BEHAVIOR, AND RTL' : operation.title === 'MOTION' ? 'MOTION AND INTERACTION' : 'PRODUCTION AND EXPORT'}`, 24, 26, 360, 'Data/Micro', opIndex === 2 ? colorNames.signalInk : colorNames.void, { fontSize: 8, letterSpacing: 3 });
  text(op, `${operation.title} / Heading`, operation.title, 24, 74, 360, 'Display/H2', colorNames.void, { fontSize: 28, lineHeight: 34, letterSpacing: -2 });
  text(op, `${operation.title} / Functional cue`, operation.cue, 24, 132, 360, 'Data/Micro', colorNames.signalInk, { fontSize: 8, letterSpacing: 4 });
  rule(op, `${operation.title} / Measure`, 24, 176, 362, 1, colorNames.ash300);
  for (let index = 0; index < 3; index += 1) ellipse(op, `${operation.title} / State ${index + 1}`, 78 + index * 92, 170, 12, 12, index === opIndex ? colorNames.signal : colorNames.void);
  text(op, `Section ${operation.index} / Governed content`, operation.content, 24, 220, 360, 'Body/Base', colorNames.ash700, { fontSize: 10, lineHeight: 15 });
}

const correct = frame(root, 'Editorial band / Correct examples', 80, 2900, 620, 300, colorNames.bone, true);
rect(correct, 'Correct use / Signal rail', 0, 0, 12, 300, colorNames.signal);
text(correct, 'Section 09 / Label', '09 / CORRECT EXAMPLES', 36, 28, 520, 'Data/Micro', colorNames.signalInk, { fontSize: 9, letterSpacing: 4 });
text(correct, 'Correct use / Statement', 'THIS IS THE SYSTEM WORKING.', 36, 76, 530, 'Display/H2', colorNames.void, { fontSize: 25, lineHeight: 32, letterSpacing: -2 });
text(correct, 'Section 09 / Exact governed content', 'Operational cues. Repeatable grids. Real metadata. Tactile construction. Garage-accessible production. Approved mark contexts remain fully monochrome.', 36, 144, 530, 'Body/Base', colorNames.ash700, { fontSize: 11, lineHeight: 17 });

const misuse = frame(root, 'Editorial band / Misuse', 740, 2900, 620, 300, colorNames.void, true);
text(misuse, 'Section 10 / Label', '10 / MISUSE', 36, 28, 520, 'Data/Micro', colorNames.ash300, { fontSize: 9, letterSpacing: 4 });
text(misuse, 'Misuse / Statement', 'COSPLAY IS NOT INFRASTRUCTURE.', 36, 76, 540, 'Display/H2', colorNames.paper, { fontSize: 23, lineHeight: 30, letterSpacing: -2 });
text(misuse, 'Section 10 / Exact governed content', 'Swiss-looking cosplay. Sterile minimalism. Luxury coding. Random complexity. Novelty without operational purpose. No sharp aperture edges. No mixed-color or treated mark.', 36, 144, 540, 'Body/Base', colorNames.ash300, { fontSize: 11, lineHeight: 17 });

rule(root, 'Evidence and navigation / Top datum', 80, 3230, 1280, 1, colorNames.ash300);
text(root, 'Section 11 / Label', '11 / PROVENANCE, HASHES, STATUS, AND EVIDENCE', 80, 3256, 590, 'Data/Micro', colorNames.signalInk, { fontSize: 8, letterSpacing: 3 });
text(root, 'Section 11 / Governed content', 'AUTHORITY / CANONICAL\nVERIFICATION / NOT VERIFIED\nPUBLICATION / PUBLISHABLE UNDER GOVERNANCE\nIMAGEGEN TARGET / SHA 96EAF8958C31\nAFFINITY SOURCE / R3 EDITORIAL FIT', 80, 3292, 590, 'Data/Micro', colorNames.ash700, { fontSize: 8, lineHeight: 13, letterSpacing: 2 });
text(root, 'Section 12 / Label', '12 / PARENT AND SIBLING LINKS PLUS CANONICAL SOURCE PATHS', 740, 3256, 620, 'Data/Micro', colorNames.void, { fontSize: 8, letterSpacing: 3 });
text(root, 'Section 12 / Governed content', 'PARENT / 01.00 BRAND CORE OVERVIEW\nSIBLINGS / 01.02 / 01.03 / 01.04\nDEPENDENCIES / 01.02 / 06.02 / 06.03\nSOURCES / DESIGN DOC / IDENTITY / ARCHITECTURE / GEOMETRY / MODES / OWNER PREVIEW', 740, 3292, 620, 'Data/Micro', colorNames.ash700, { fontSize: 8, lineHeight: 13, letterSpacing: 2 });

rule(root, 'Footer datum', 80, 3410, 1280, 1, colorNames.ash300);
text(root, 'Footer / Permanent tagline', 'CATCH THE STARS  /  MAKE THE DISTANT TANGIBLE', 80, 3440, 760, 'Technical/Label', colorNames.signalInk, { fontSize: 10, letterSpacing: 8 });
text(root, 'Footer / Revision', '01.01  /  FIGMA R1  /  AFFINITY R3  /  GOVERNED', 900, 3440, 460, 'Data/Micro', colorNames.ash700, { fontSize: 9, letterSpacing: 4, textAlignHorizontal: 'RIGHT' });

root.name = '01 / FIGMA NATIVE - EDITABLE MASTER / 01.01 SWISS-WORKING / r1';
root.visible = true;
oldRoot.name = '99 / ARCHIVE / PRE-PHASE2 / 01.01';
oldRoot.visible = false;
oldRoot.locked = true;
page.setSharedPluginData(NS, 'phase2.01.01.activeRoot', root.id);
page.setSharedPluginData(NS, 'phase2.01.01.revision', REVISION);

return {
  page: { id: page.id, name: page.name },
  activeRoot: { id: root.id, name: root.name, width: root.width, height: root.height, visible: root.visible },
  archive: { id: oldRoot.id, name: oldRoot.name, visible: oldRoot.visible, locked: oldRoot.locked },
  hero: hero.id,
  sourceFieldClone: heroField.id,
  displayFieldClone: displaySource.id,
  referencePlaceholder: reference.id,
  revision: REVISION,
  descendantCount: root.findAll(() => true).length,
};
