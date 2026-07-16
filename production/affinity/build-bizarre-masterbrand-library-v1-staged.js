'use strict';

(async () => {
  const { Document, NewDocumentOptions } = require('/document');
  const { UnitType } = require('/units');
  const { Gradient, RGBA8 } = require('/colours');
  const { Point, PolyCurve, Rectangle, Transform } = require('/geometry');
  const { ShapeEllipse, ShapeRectangle } = require('/shapes');
  const {
    ArtTextNodeDefinition,
    ContainerNodeDefinition,
    ImageNodeDefinition,
    PolyCurveNodeDefinition,
    ShapeNodeDefinition,
  } = require('/nodes');
  const {
    BlendMode,
    FillDescriptor,
    GradientFill,
    GradientFillType,
  } = require('/fills');
  const {
    LineCap,
    LineJoin,
    LineStyle,
    LineStyleDescriptor,
    LineType,
    StrokeAlignment,
  } = require('/linestyle');
  const {
    AddChildNodesCommandBuilder,
    DocumentCommand,
    InsertionMode,
    NodeChildType,
    NodeMoveType,
  } = require('/commands');
  const { Selection } = require('/selections');
  const { StoryBuilder } = require('/storybuilder');
  const { FontFamily } = require('/fonts');
  const { Bitmap, RasterFormat } = require('/rasterobject');
  const { FileSystemPromises } = require('/fs');

  const ROOT = String(globalThis.__BIZARRE_OUTPUT_ROOT__ || '');
  if (!ROOT) throw new Error('Missing required Affinity output root: globalThis.__BIZARRE_OUTPUT_ROOT__');
  const MANIFEST_PATH = `${ROOT}/source/manifests/bizarre-masterbrand-subjects-v2.json`;
  const GRADIENT_MANIFEST_PATH = `${ROOT}/source/manifests/bizarre-gradient-recipes-v1.json`;
  const CONTENT_SPEC_PATH = `${ROOT}/source/manifests/bizarre-masterbrand-content-spec-v2.json`;
  const OUTPUT_PATH = `${ROOT}/Bizarre-Industries-Masterbrand-Library.afdesign`;
  const QA_PATH = `${ROOT}/qa`;
  const CANONICAL = `${ROOT}/source/canonical`;
  const REFERENCES = `${ROOT}/source/references`;
  const REPO_ATLAS_GENERATED = String(globalThis.__BIZARRE_REPO_ATLAS_GENERATED__ || '');
  if (!REPO_ATLAS_GENERATED) throw new Error('Missing required Atlas source root: globalThis.__BIZARRE_REPO_ATLAS_GENERATED__');
  const BUILD_PHASE = String(globalThis.__BIZARRE_BUILD_PHASE__ || '');
  const RECOVER_SESSION_UUID = String(globalThis.__BIZARRE_RECOVER_SESSION_UUID__ || '');
  const EXTERNAL_TEXT = globalThis.__BIZARRE_EXTERNAL_TEXT__
    && typeof globalThis.__BIZARRE_EXTERNAL_TEXT__ === 'object'
    ? globalThis.__BIZARRE_EXTERNAL_TEXT__
    : {};
  const REQUESTED_SUBJECT_IDS = Array.isArray(globalThis.__BIZARRE_SUBJECT_IDS__)
    ? [...new Set(globalThis.__BIZARRE_SUBJECT_IDS__.map(String))]
    : [];
  const BUILD_REVISION = 'affinity-masterbrand-v1.0.0-r16-continuous-lens-v2-targets';
  const CONTINUOUS_LENS_FIDELITY_REVISION = 'continuous-lens-native-fidelity-r18';
  const ATLAS_SUBJECT_FIDELITY_REVISION = 'atlas-subject-native-fidelity-r19';
  const ATLAS_CONCEPT_FIDELITY_REVISION = 'atlas-continuous-lens-concept-fidelity-r20';
  const SHADED_CONTOUR_ARTIFACT_REVISION = 'shaded-contour-artifact-first-r25-optical-proof-parity';
  const HARDWARE_PANEL_ARTIFACT_REVISION = 'hardware-panel-real-photo-artifact-first-r4-visible-native-production';
  const SWISS_WORKING_ARTIFACT_REVISION = 'brand-core-swiss-working-artifact-first-r3-editorial-fit';
  const THREE_DISTANCE_ARTIFACT_REVISION = 'brand-core-three-distance-progressive-field-r3-governed-sources';
  const BRAND_ARCHITECTURE_ARTIFACT_REVISION = 'brand-core-single-identity-native-integration-r1-governed';
  const FIDELITY_REVISION_BY_SUBJECT_ID = new Map([
    ['01.01', SWISS_WORKING_ARTIFACT_REVISION],
    ['01.02', THREE_DISTANCE_ARTIFACT_REVISION],
    ['01.03', BRAND_ARCHITECTURE_ARTIFACT_REVISION],
    ['04.01', CONTINUOUS_LENS_FIDELITY_REVISION],
    ['06.01', CONTINUOUS_LENS_FIDELITY_REVISION],
    ...Array.from({ length: 12 }, (_, index) => [`07.${String(index).padStart(2, '0')}`, ATLAS_SUBJECT_FIDELITY_REVISION]),
    ['07.05', SHADED_CONTOUR_ARTIFACT_REVISION],
    ['07.08', ATLAS_CONCEPT_FIDELITY_REVISION],
    ['07.09', ATLAS_CONCEPT_FIDELITY_REVISION],
    ['07.10', ATLAS_CONCEPT_FIDELITY_REVISION],
    ['11.05', HARDWARE_PANEL_ARTIFACT_REVISION],
  ]);

  const SOURCE_PATHS = {
    markInverse: `${CANONICAL}/mark-inverse.svg`,
    markPrimary: `${CANONICAL}/mark-primary.svg`,
    markTransparent: `${CANONICAL}/mark-transparent.svg`,
    atlasBands: `${CANONICAL}/atlas-bands.svg`,
    atlasContoursDark: `${CANONICAL}/atlas-contours-dark.svg`,
    atlasContoursLight: `${CANONICAL}/atlas-contours-light.svg`,
    atlasDots: `${CANONICAL}/atlas-dots.svg`,
    atlasHatch: `${CANONICAL}/atlas-hatch.svg`,
    atlasMicro: `${CANONICAL}/atlas-micro.svg`,
    atlasSpectral: `${CANONICAL}/atlas-spectral.svg`,
    atlasContoursLarge: `${CANONICAL}/atlas-contours-large.svg`,
    atlasDotsLarge: `${CANONICAL}/atlas-dots-large.svg`,
    atlasHatchLarge: `${CANONICAL}/atlas-hatch-large.svg`,
    atlasSpectralLarge: `${CANONICAL}/atlas-spectral-large.svg`,
    calibratedAperture: `${CANONICAL}/calibrated-aperture.svg`,
    atlasConfig: `${REPO_ATLAS_GENERATED}/config.json`,
    atlasManifest: `${REPO_ATLAS_GENERATED}/manifest.json`,
    referenceMaster: `${REFERENCES}/imagegen-master-direction.png`,
    referenceCover: `${REFERENCES}/imagegen-cover-direction-v1.png`,
    referenceProduct: `${REFERENCES}/imagegen-product-family.png`,
    referenceShaded: `${REFERENCES}/atlas-shaded-contour-continuous-lens-v2.png`,
    referenceShadedArtifactFirst: `${REFERENCES}/07.05-shaded-contour-artifact-first-imagegen.png`,
    referenceGrain: `${REFERENCES}/atlas-field-grain-continuous-lens-v2.png`,
    referenceMaterial: `${REFERENCES}/atlas-material-response-continuous-lens-v2.png`,
    referenceOneColor: `${REFERENCES}/atlas-one-color-continuous-lens-v2.png`,
    referenceContinuousLens: `${REFERENCES}/aperture-pattern-continuous-lens-v2.png`,
    referenceContinuousLensPanel: `${REFERENCES}/aperture-pattern-continuous-lens-main-panel-v2.png`,
    referenceSwissWorking: `${REFERENCES}/01.01-swiss-working-instrument-target-v1.png`,
    realHardwarePhoto: `${REFERENCES}/real-pexels-control-panel-13401910.jpg`,
  };

  const VOID = RGBA8(14, 14, 14, 255);
  const VOID_RAISED = RGBA8(24, 24, 23, 255);
  const PAPER = RGBA8(249, 248, 242, 255);
  const PAPER_MUTED = RGBA8(235, 233, 224, 255);
  const SIGNAL = RGBA8(198, 255, 36, 255);
  const SIGNAL_INK = RGBA8(94, 122, 0, 255);
  const ASH_300 = RGBA8(184, 184, 184, 255);
  const ASH_500 = RGBA8(112, 112, 112, 255);
  const ASH_700 = RGBA8(84, 84, 84, 255);
  const IRON = RGBA8(61, 61, 61, 255);
  const SPECTRUM = [
    RGBA8(32, 39, 77, 255),
    RGBA8(49, 86, 166, 255),
    RGBA8(74, 165, 175, 255),
    RGBA8(92, 136, 124, 255),
    RGBA8(213, 163, 71, 255),
    RGBA8(201, 108, 62, 255),
    RGBA8(182, 76, 99, 255),
    RGBA8(104, 79, 131, 255),
  ];
  const FIELD_SPECTRUM = SPECTRUM.slice(0, 7);
  const FIELD_SPECTRUM_HEX = ['#20274D', '#3156A6', '#4AA5AF', '#5C887C', '#D5A347', '#C96C3E', '#B64C63'];
  const FIELD_SPECTRUM_POSITIONS = [0, 0.17, 0.34, 0.49, 0.66, 0.82, 1];

  const manifest = JSON.parse(String(await FileSystemPromises.readAll(MANIFEST_PATH)));
  const gradientManifest = JSON.parse(String(await FileSystemPromises.readAll(GRADIENT_MANIFEST_PATH)));
  const contentSpec = JSON.parse(String(await FileSystemPromises.readAll(CONTENT_SPEC_PATH)));
  if (manifest.subjects.length !== 104) throw new Error('Affinity build refuses any subject count other than 104');
  if (contentSpec.subjects?.length !== 104) throw new Error('Affinity build requires explicit content specifications for all 104 subjects');
  if (contentSpec.manifest?.canonicalSha256 !== manifest.canonicalSha256) {
    throw new Error('Affinity content specification does not match the staged subject manifest');
  }
  if (gradientManifest.recipes?.length !== 7) throw new Error('Affinity build requires exactly seven governed gradient systems');
  if (gradientManifest.globalRules?.signalLime?.interpolation !== 'forbidden') {
    throw new Error('Affinity build requires the governed Signal Lime no-interpolation rule');
  }
  if (manifest.approvedPageRule.widthPx !== 1440 || manifest.approvedPageRule.affinityDpi !== 144) {
    throw new Error('Affinity build requires the owner-approved 1440px / 144 DPI page rule');
  }
  if (!['shell', 'subjects', 'audit'].includes(BUILD_PHASE)) {
    throw new Error(`Unsupported staged Affinity build phase: ${BUILD_PHASE || '(missing)'}`);
  }
  const subjectById = new Map(manifest.subjects.map((subject) => [subject.id, subject]));
  const contentBySubjectId = new Map(contentSpec.subjects.map((subject) => [subject.subjectId, subject]));
  for (const subject of manifest.subjects) {
    const content = contentBySubjectId.get(subject.id);
    if (!content || content.exactLabel !== subject.exactLabel) throw new Error(`Missing exact Affinity content contract for ${subject.id}`);
    if (JSON.stringify(content.requiredSectionOrder) !== JSON.stringify(subject.anatomy)) {
      throw new Error(`Affinity section order drift for ${subject.id}`);
    }
  }
  for (const id of REQUESTED_SUBJECT_IDS) {
    if (!subjectById.has(id)) throw new Error(`Unknown requested subject ID: ${id}`);
  }
  if (BUILD_PHASE === 'subjects' && REQUESTED_SUBJECT_IDS.length === 0) {
    throw new Error('The subjects phase requires at least one explicit subject ID');
  }

  const textCache = new Map();
  async function readText(path) {
    if (Object.prototype.hasOwnProperty.call(EXTERNAL_TEXT, path)) return String(EXTERNAL_TEXT[path]);
    if (!textCache.has(path)) textCache.set(path, String(await FileSystemPromises.readAll(path)));
    return textCache.get(path);
  }

  const fontMap = new Map();
  for (const family of FontFamily.all) {
    for (const font of family.fonts) fontMap.set(font.postscriptName, font);
  }
  function exactFont(postscriptName) {
    const font = fontMap.get(postscriptName);
    if (!font) throw new Error(`Missing approved Affinity font face: ${postscriptName}`);
    return font;
  }

  const FONTS = {
    displayBlack: exactFont('Unbounded-Regular_Black'),
    displayBold: exactFont('Unbounded-Regular_Bold'),
    displayRegular: exactFont('Unbounded-Regular'),
    stencilBold: exactFont('BigShouldersStencil-Bold'),
    body: exactFont('HankenGrotesk-Regular'),
    bodyMedium: exactFont('HankenGrotesk-Regular_Medium'),
    bodyBold: exactFont('HankenGrotesk-Regular_Bold'),
    mono: exactFont('JetBrainsMono-Regular'),
    monoMedium: exactFont('JetBrainsMonoRoman-Medium'),
    monoBold: exactFont('JetBrainsMonoRoman-Bold'),
  };

  const firstSubject = manifest.subjects[0];
  const options = NewDocumentOptions.createDefault();
  options.units = UnitType.Pixel;
  options.width = firstSubject.artboard.widthPx;
  options.height = firstSubject.artboard.minimumHeightPx;
  options.dpi = manifest.approvedPageRule.affinityDpi;
  options.isLandscape = firstSubject.artboard.widthPx > firstSubject.artboard.minimumHeightPx;
  options.createArtboard = true;
  options.isMultiPage = false;
  let master;
  if (BUILD_PHASE === 'shell') {
    if (await FileSystemPromises.exists(OUTPUT_PATH)) {
      throw new Error(`Shell phase refuses to overwrite an existing library: ${OUTPUT_PATH}`);
    }
    const recoverable = RECOVER_SESSION_UUID
      ? Document.all.find((document) => document.sessionUuid === RECOVER_SESSION_UUID)
      : null;
    if (RECOVER_SESSION_UUID && !recoverable) {
      throw new Error(`Requested recovery document is not open: ${RECOVER_SESSION_UUID}`);
    }
    if (recoverable) {
      const recoveryArtboards = [...recoverable.artboards];
      const recoveryIsBlank = recoveryArtboards.length === 1
        && [...recoveryArtboards[0].node.children].length === 0
        && recoverable.path === ''
        && recoverable.dpi === manifest.approvedPageRule.affinityDpi;
      if (!recoveryIsBlank) throw new Error(`Recovery document is not the verified blank build shell: ${RECOVER_SESSION_UUID}`);
      master = recoverable;
    } else {
      master = Document.createFromOptions(options);
    }
    const spread = master.spreads.first;
    if (!master.currentSpread.isSameNode(spread)) {
      master.executeCommand(DocumentCommand.createSetCurrentSpread(spread));
    }
    let initialArtboard = [...master.artboards][0];
    const initialBox = initialArtboard.baseBox;
    if (initialBox.width !== firstSubject.artboard.widthPx || initialBox.height !== firstSubject.artboard.minimumHeightPx) {
      const before = [...master.artboards];
      master.addRectangularArtboard(new Rectangle(0, 0, firstSubject.artboard.widthPx, firstSubject.artboard.minimumHeightPx), false, false, false);
      const replacement = [...master.artboards].find((candidate) => !before.some((existing) => candidate.isSameObject(existing)));
      if (!replacement) throw new Error('Failed to replace the portrait recovery artboard with the approved 1440 × 900 shell');
      master.executeCommand(DocumentCommand.createDeleteSelection(initialArtboard.node.selfSelection, false));
      initialArtboard = replacement;
    }
    initialArtboard.node.userDescription = 'BUILD SHELL / AWAITING 00.00';
    master.executeCommand(DocumentCommand.createSetTagValueForKey(initialArtboard.node.selfSelection, 'bizarre.buildShell', 'true'));
    master.executeCommand(DocumentCommand.createSetTagValueForKey(initialArtboard.node.selfSelection, 'bizarre.manifestHash', manifest.canonicalSha256));
    await FileSystemPromises.createDirectories(QA_PATH);
    const saveResult = master.saveAs(OUTPUT_PATH);
    console.log(JSON.stringify({
      status: 'shell-created',
      output: OUTPUT_PATH,
      saveResult,
      documentSessionUuid: master.sessionUuid,
      documentPersistentUuid: master.persistentUuid,
      dpi: master.dpi,
      artboardCount: [...master.artboards].length,
      manifestHash: manifest.canonicalSha256,
    }));
    return;
  }

  master = Document.all.find((document) => document.path === OUTPUT_PATH) || Document.load(OUTPUT_PATH);
  if (!master || !master.isOpen) throw new Error(`Unable to load staged Affinity library: ${OUTPUT_PATH}`);
  const workingSpread = master.spreads.first;
  if (!master.currentSpread.isSameNode(workingSpread)) {
    master.executeCommand(DocumentCommand.createSetCurrentSpread(workingSpread));
  }
  if (BUILD_PHASE === 'audit') {
    const expectedLayerNames = manifest.affinity.exactLayerStack;
    const expectedSubjectIds = new Set(manifest.subjects.map(({ id }) => id));
    const actual = [...master.artboards].map((artboard) => {
      const node = artboard.node;
      const subjectId = node.hasKey('bizarre.subjectId') ? node.getValueForKey('bizarre.subjectId') : null;
      const complete = node.hasKey('bizarre.buildComplete') && node.getValueForKey('bizarre.buildComplete') === 'true';
      const manifestHash = node.hasKey('bizarre.manifestHash') ? node.getValueForKey('bizarre.manifestHash') : null;
      const buildRevision = node.hasKey('bizarre.buildRevision') ? node.getValueForKey('bizarre.buildRevision') : null;
      const fidelityRevision = node.hasKey('bizarre.continuousLensFidelityRevision') ? node.getValueForKey('bizarre.continuousLensFidelityRevision') : null;
      const contentFingerprint = node.hasKey('bizarre.contentFingerprint') ? node.getValueForKey('bizarre.contentFingerprint') : null;
      const layerNames = [...node.children].map((child) => child.userDescription);
      return { subjectId, complete, manifestHash, buildRevision, fidelityRevision, contentFingerprint, layerNames };
    });
    const duplicateIds = [...new Set(actual.map(({ subjectId }) => subjectId).filter((id, index, values) => id && values.indexOf(id) !== index))];
    const completeIds = actual.filter(({ complete }) => complete).map(({ subjectId }) => subjectId).filter(Boolean);
    const incompleteIds = actual.filter(({ subjectId, complete }) => subjectId && !complete).map(({ subjectId }) => subjectId);
    const missingIds = manifest.subjects.map(({ id }) => id).filter((id) => !completeIds.includes(id));
    const unexpectedIds = [...new Set(actual.map(({ subjectId }) => subjectId).filter((id) => id && !expectedSubjectIds.has(id)))];
    const untaggedArtboards = actual.map(({ subjectId }, index) => ({ subjectId, index })).filter(({ subjectId }) => !subjectId).map(({ index }) => index);
    const staleIds = actual
      .filter(({ subjectId, manifestHash, buildRevision, fidelityRevision, contentFingerprint }) => subjectId && (
        manifestHash !== manifest.canonicalSha256
        || buildRevision !== BUILD_REVISION
        || (FIDELITY_REVISION_BY_SUBJECT_ID.has(subjectId)
          && fidelityRevision !== FIDELITY_REVISION_BY_SUBJECT_ID.get(subjectId))
        || contentFingerprint !== contentBySubjectId.get(subjectId)?.contentFingerprint
      ))
      .map(({ subjectId }) => subjectId);
    const layerFailures = actual
      .filter(({ subjectId }) => subjectId)
      .filter(({ layerNames }) => layerNames.length !== expectedLayerNames.length
        || new Set(layerNames).size !== expectedLayerNames.length
        || expectedLayerNames.some((name) => !layerNames.includes(name)))
      .map(({ subjectId, layerNames }) => ({ subjectId, layerNames }));
    const auditFailed = actual.length !== manifest.affinity.permanentArtboardCount
      || completeIds.length !== manifest.affinity.permanentArtboardCount
      || duplicateIds.length > 0
      || incompleteIds.length > 0
      || missingIds.length > 0
      || unexpectedIds.length > 0
      || untaggedArtboards.length > 0
      || staleIds.length > 0
      || layerFailures.length > 0;
    console.log(JSON.stringify({
      status: auditFailed ? 'audit-failed' : 'audit-ok',
      output: OUTPUT_PATH,
      documentSessionUuid: master.sessionUuid,
      documentPersistentUuid: master.persistentUuid,
      dpi: master.dpi,
      buildRevision: BUILD_REVISION,
      continuousLensFidelityRevision: CONTINUOUS_LENS_FIDELITY_REVISION,
      atlasSubjectFidelityRevision: ATLAS_SUBJECT_FIDELITY_REVISION,
      atlasConceptFidelityRevision: ATLAS_CONCEPT_FIDELITY_REVISION,
      brandArchitectureFidelityRevision: BRAND_ARCHITECTURE_ARTIFACT_REVISION,
      hardwarePanelFidelityRevision: HARDWARE_PANEL_ARTIFACT_REVISION,
      artboardCount: actual.length,
      completeCount: completeIds.length,
      completeIds,
      incompleteIds,
      missingIds,
      duplicateIds,
      unexpectedIds,
      untaggedArtboards,
      staleIds,
      layerFailures,
      manifestHash: manifest.canonicalSha256,
      contentSpecHash: contentSpec.canonicalSha256,
    }));
    return;
  }

  function addDefinition(definition, target, mode = InsertionMode.Inside_AtBack, childType = NodeChildType.Main) {
    const builder = AddChildNodesCommandBuilder.create();
    builder.addNode(definition);
    builder.setInsertionTarget(target);
    builder.setInsertionMode(mode);
    const command = builder.createCommand(false, childType);
    master.executeCommand(command);
    const node = command.newNodes[0];
    if (!node) throw new Error(`Affinity did not return a node for ${definition.userDescription || 'unnamed definition'}`);
    return node;
  }

  let currentOrigin = { x: 0, y: 0 };

  function addContainer(name, target, mode = InsertionMode.Inside_AtFront) {
    const definition = ContainerNodeDefinition.create(name);
    definition.userDescription = name;
    return addDefinition(definition, target, mode);
  }

  function addShape({ x, y, width, height, fill, target, name, mode = InsertionMode.Inside_AtBack, shape = ShapeRectangle.create() }) {
    const descriptor = fill instanceof FillDescriptor ? fill : FillDescriptor.createSolid(fill, BlendMode.Normal);
    const definition = ShapeNodeDefinition.create(
      shape,
      new Rectangle(x + currentOrigin.x, y + currentOrigin.y, width, height),
      descriptor,
      null,
      null,
      null,
    );
    definition.userDescription = name;
    return addDefinition(definition, target, mode);
  }

  function addText({ text, x, y, size, fill, target, name, font = FONTS.body, tracking = 0 }) {
    const story = StoryBuilder.create().setToArtisticTextDefaultStyle(master.dpi, RasterFormat.RGBA8);
    const attributes = story.glyphAtts;
    attributes.font = font;
    attributes.height = size;
    attributes.characterSpacing = tracking;
    attributes.brushFill = FillDescriptor.createSolid(fill, BlendMode.Normal);
    story.setGlyphAtts(attributes).addText(text);
    const definition = ArtTextNodeDefinition.createFromStoryBuilder(new Point(x + currentOrigin.x, y + currentOrigin.y), story);
    definition.userDescription = name;
    return addDefinition(definition, target, InsertionMode.Inside_AtBack);
  }

  function lineDescriptor(weight, cap = LineCap.Round, join = LineJoin.Round, type = LineType.Solid, dashPattern = null, dashPhase = 0) {
    const style = LineStyle.createDefaultWithWeight(weight);
    style.cap = cap;
    style.join = join;
    style.type = type;
    style.miterLimit = 4;
    if (dashPattern) {
      style.dashPattern = dashPattern;
      style.dashPhase = dashPhase;
      style.hasBalancedDashes = true;
    }
    return LineStyleDescriptor.create(style, { strokeAlignment: StrokeAlignment.Centre });
  }

  function addPolyCurve({
    curves,
    fill,
    stroke,
    strokeFillDescriptor = null,
    strokeWidth = 1,
    target,
    name,
    cap = LineCap.Round,
    lineType = LineType.Solid,
    dashPattern = null,
    dashPhase = 0,
  }) {
    const polyCurve = PolyCurve.create();
    for (const curve of curves) polyCurve.addCurve(curve);
    const hasFill = fill != null;
    const hasStroke = (stroke != null || strokeFillDescriptor != null) && strokeWidth > 0;
    const fillDescriptor = fill instanceof FillDescriptor
      ? fill
      : hasFill ? FillDescriptor.createSolid(fill, BlendMode.Normal) : FillDescriptor.createNone();
    const definition = PolyCurveNodeDefinition.create(
      polyCurve,
      fillDescriptor,
      lineDescriptor(strokeWidth, cap, LineJoin.Round, hasStroke ? lineType : LineType.None, dashPattern, dashPhase),
      hasStroke ? (strokeFillDescriptor || FillDescriptor.createSolid(stroke, BlendMode.Normal)) : FillDescriptor.createNone(),
      FillDescriptor.createNone(),
    );
    definition.userDescription = name;
    return addDefinition(definition, target, InsertionMode.Inside_AtBack);
  }

  function addPolygon({ points, fill, stroke = null, strokeWidth = 0, target, name }) {
    if (!Array.isArray(points) || points.length < 3) throw new Error(`Polygon requires at least three points: ${name}`);
    const builder = require('/geometry').CurveBuilder.create()
      .beginXY(points[0][0] + currentOrigin.x, points[0][1] + currentOrigin.y);
    for (const [x, y] of points.slice(1)) builder.lineToXY(x + currentOrigin.x, y + currentOrigin.y);
    builder.close();
    return addPolyCurve({ curves: [builder.createCurve()], fill, stroke, strokeWidth, target, name, cap: LineCap.Round });
  }

  function addLinePath({ points, stroke, strokeWidth = 1, target, name, lineType = LineType.Solid, dashPattern = null, dashPhase = 0 }) {
    if (!Array.isArray(points) || points.length < 2) throw new Error(`Line path requires at least two points: ${name}`);
    const builder = require('/geometry').CurveBuilder.create()
      .beginXY(points[0][0] + currentOrigin.x, points[0][1] + currentOrigin.y);
    for (const [x, y] of points.slice(1)) builder.lineToXY(x + currentOrigin.x, y + currentOrigin.y);
    return addPolyCurve({ curves: [builder.createCurve()], fill: null, stroke, strokeWidth, target, name, lineType, dashPattern, dashPhase, cap: LineCap.Round });
  }

  function rotatedLocalPoint(cx, cy, x, y, rotation) {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    return [
      cx + x * cosine - y * sine + currentOrigin.x,
      cy + x * sine + y * cosine + currentOrigin.y,
    ];
  }

  function createSmoothEllipseCurve({ cx, cy, rx, ry, rotation = 0 }) {
    if (![cx, cy, rx, ry, rotation].every(Number.isFinite) || rx <= 0 || ry <= 0) {
      throw new Error('Smooth ellipse requires finite positive geometry');
    }
    const kappa = 0.5522847498307936;
    const point = (x, y) => rotatedLocalPoint(cx, cy, x, y, rotation);
    const p0 = point(rx, 0);
    const p1 = point(0, ry);
    const p2 = point(-rx, 0);
    const p3 = point(0, -ry);
    const c01a = point(rx, kappa * ry);
    const c01b = point(kappa * rx, ry);
    const c12a = point(-kappa * rx, ry);
    const c12b = point(-rx, kappa * ry);
    const c23a = point(-rx, -kappa * ry);
    const c23b = point(-kappa * rx, -ry);
    const c30a = point(kappa * rx, -ry);
    const c30b = point(rx, -kappa * ry);
    const builder = require('/geometry').CurveBuilder.create().beginXY(p0[0], p0[1]);
    builder.addBezierXY(c01a[0], c01a[1], c01b[0], c01b[1], p1[0], p1[1]);
    builder.addBezierXY(c12a[0], c12a[1], c12b[0], c12b[1], p2[0], p2[1]);
    builder.addBezierXY(c23a[0], c23a[1], c23b[0], c23b[1], p3[0], p3[1]);
    builder.addBezierXY(c30a[0], c30a[1], c30b[0], c30b[1], p0[0], p0[1]);
    builder.close();
    return builder.createCurve();
  }

  function addSmoothEllipse({
    cx,
    cy,
    rx,
    ry,
    rotation = 0,
    fill = null,
    stroke = null,
    strokeFillDescriptor = null,
    strokeWidth = 1,
    target,
    name,
    cap = LineCap.Round,
    lineType = LineType.Solid,
    dashPattern = null,
    dashPhase = 0,
  }) {
    return addPolyCurve({
      curves: [createSmoothEllipseCurve({ cx, cy, rx, ry, rotation })],
      fill,
      stroke,
      strokeFillDescriptor,
      strokeWidth,
      target,
      name,
      cap,
      lineType,
      dashPattern,
      dashPhase,
    });
  }

  function addSmoothCubicPath({ start, control1, control2, end, stroke, strokeWidth, target, name }) {
    const builder = require('/geometry').CurveBuilder.create()
      .beginXY(start[0] + currentOrigin.x, start[1] + currentOrigin.y);
    builder.addBezierXY(
      control1[0] + currentOrigin.x,
      control1[1] + currentOrigin.y,
      control2[0] + currentOrigin.x,
      control2[1] + currentOrigin.y,
      end[0] + currentOrigin.x,
      end[1] + currentOrigin.y,
    );
    return addPolyCurve({
      curves: [builder.createCurve()],
      fill: null,
      stroke,
      strokeWidth,
      target,
      name,
      cap: LineCap.Round,
    });
  }

  function moveNodesInsideNode(targetNode, nodes) {
    if (!nodes.length) return;
    const selection = Selection.create(master, nodes, true);
    master.executeCommand(DocumentCommand.createMoveNodes(selection, targetNode, NodeMoveType.Inside, NodeChildType.Main));
  }

  function moveNodeToEnclosureMask(targetNode, maskNode) {
    const selection = Selection.create(master, [maskNode], true);
    master.executeCommand(DocumentCommand.createMoveNodes(selection, targetNode, NodeMoveType.Inside, NodeChildType.Enclosure));
  }

  function createEditableMaskedGroup({
    name,
    target,
    payloadNodes,
    maskNode,
    mode = InsertionMode.Inside_AtFront,
  }) {
    const group = addContainer(name, target, mode);
    moveNodesInsideNode(group, payloadNodes);
    moveNodeToEnclosureMask(group, maskNode);
    if ([...group.enclosures].length !== 1) throw new Error(`${name} must contain exactly one editable enclosure mask`);
    return group;
  }

  function gradientDescriptor(stops, type, x, y, width, height, noise = 0, angleRadians = 0) {
    x += currentOrigin.x;
    y += currentOrigin.y;
    const gradient = Gradient.create(stops.map((stop, index) => ({
      colour: stop.colour,
      position: stop.position,
      midpoint: stop.midpoint ?? 0.5,
      smoothness: stop.smoothness ?? 0,
    })));
    gradient.noise = noise;
    gradient.intensity = 1;
    gradient.tint = 1;
    const gradientFill = GradientFill.create(gradient, type);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    let transform;
    if (type === GradientFillType.Linear) {
      if (Math.abs(Math.abs(angleRadians) - Math.PI / 2) < 0.0001) {
        transform = Transform.createTranslate(centerX, y)
          .multiply(Transform.createRotate(angleRadians))
          .multiply(Transform.createScale(height, height));
      } else {
        transform = Transform.createTranslate(x, centerY)
          .multiply(Transform.createRotate(angleRadians))
          .multiply(Transform.createScale(width, width));
      }
    } else if (type === GradientFillType.Elliptical) {
      transform = Transform.createTranslate(centerX, centerY).multiply(Transform.createScale(width / 2, height / 2));
    } else {
      const radius = Math.max(width, height) / 2;
      transform = Transform.createTranslate(centerX, centerY).multiply(Transform.createScale(radius, radius));
      if (type === GradientFillType.Conical) transform = transform.multiply(Transform.createRotate(-Math.PI / 2));
    }
    return FillDescriptor.create(gradientFill, false, transform, BlendMode.Normal, false);
  }

  function parseHex(value, alpha = 255) {
    const hex = String(value || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
    return RGBA8(
      Number.parseInt(hex.slice(1, 3), 16),
      Number.parseInt(hex.slice(3, 5), 16),
      Number.parseInt(hex.slice(5, 7), 16),
      alpha,
    );
  }

  function addContinuousLensSpecimen(item, box, label, {
    lineCount = 64,
    representation = 'spectral',
    showLabels = true,
    trajectory = true,
  } = {}) {
    const layers = item.layers;
    const allowedRepresentations = new Set(['spectral', 'grain', 'material', 'one-color']);
    if (!allowedRepresentations.has(representation)) throw new Error(`Unknown Continuous Lens representation: ${representation}`);
    const paperMode = representation === 'one-color';
    const grainMode = representation === 'grain';
    const materialMode = representation === 'material';
    const scale = Math.max(0.72, box.height / 400);
    const centerX = box.x + box.width * 0.65;
    const centerY = box.y + box.height * 0.50;
    const apertureRx = box.width * 0.115;
    const apertureRy = apertureRx / 1.82;
    const apertureRotation = -14 * Math.PI / 180;
    const ground = paperMode ? PAPER : grainMode ? RGBA8(7, 17, 42, 255) : materialMode ? VOID_RAISED : VOID;

    addShape({
      ...box,
      fill: ground,
      target: layers.get('40 / Color, Gradient, Pattern, or Material'),
      name: `${label} / ${paperMode ? 'Paper one-ink' : materialMode ? 'Matte material' : grainMode ? 'Deep navy grain' : 'Deep Void'} field ground`,
    });
    if (!paperMode) {
      const fieldWash = gradientDescriptor([
        { colour: RGBA8(32, 39, 77, grainMode ? 76 : 48), position: 0, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(74, 165, 175, materialMode ? 52 : 42), position: 0.38, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(213, 163, 71, materialMode ? 54 : 40), position: 0.68, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(182, 76, 99, 22), position: 1, midpoint: 0.5, smoothness: 0 },
      ], GradientFillType.Elliptical, box.x + box.width * 0.16, box.y + box.height * 0.02, box.width * 0.86, box.height * 0.96, materialMode ? 0.18 : grainMode ? 0.06 : 0);
      addShape({
        ...box,
        fill: fieldWash,
        target: layers.get('40 / Color, Gradient, Pattern, or Material'),
        name: `${label} / Native elliptical field wash`,
      });
    }

    const exactFieldStops = FIELD_SPECTRUM.map((colour, index) => ({
      colour: paperMode
        ? RGBA8(14, 14, 14, index % 2 === 0 ? 255 : 216)
        : colour,
      position: FIELD_SPECTRUM_POSITIONS[index],
      midpoint: 0.5,
      smoothness: 0,
    }));
    const fieldStroke = gradientDescriptor(
      exactFieldStops,
      GradientFillType.Linear,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
    );
    const contourNodes = [];
    for (let index = 0; index < lineCount; index += 1) {
      const normalized = lineCount === 1 ? 0 : index / (lineCount - 1);
      const growth = Math.pow(normalized, 1.18);
      const ringRx = apertureRx + 4 * scale + growth * box.width * 0.79;
      const ringRy = apertureRy + 3 * scale + growth * box.height * 0.69;
      const ringCx = centerX - growth * box.width * 0.17;
      const ringCy = centerY + Math.sin(growth * Math.PI) * box.height * 0.016;
      const ringRotation = apertureRotation - growth * 4 * Math.PI / 180;
      const isMajor = index % 7 === 0;
      const dotted = grainMode || (paperMode && index % 3 !== 0);
      const width = grainMode
        ? (isMajor ? 1.08 : 0.76)
        : paperMode
          ? (isMajor ? 1.28 : 0.68)
          : materialMode
            ? (isMajor ? 1.24 : 0.68)
            : (isMajor ? 1.16 : 0.62);
      contourNodes.push(addSmoothEllipse({
        cx: ringCx,
        cy: ringCy,
        rx: ringRx,
        ry: ringRy,
        rotation: ringRotation,
        strokeFillDescriptor: fieldStroke.clone(),
        strokeWidth: width * scale,
        target: layers.get('20 / Canonical Assets'),
        name: `${label} / Tangent-continuous ${dotted ? 'microdot' : 'contour'} ${String(index + 1).padStart(2, '0')} / ${isMajor ? 'Major' : 'Minor'}`,
        lineType: dotted ? LineType.Dash : LineType.Solid,
        dashPattern: dotted ? (grainMode ? [0.10, 2.40] : [0.26, 1.34]) : null,
        dashPhase: dotted ? (index % 11) * 0.17 : 0,
      }));
    }
    const fieldClipMask = addShape({
      ...box,
      fill: PAPER,
      target: layers.get('20 / Canonical Assets'),
      name: `${label} / Editable rectangular field enclosure`,
    });
    createEditableMaskedGroup({
      name: `${label} / Native editable continuous ${grainMode ? 'grain' : paperMode ? 'one-ink' : materialMode ? 'material' : 'spectral'} field`,
      target: layers.get('20 / Canonical Assets'),
      payloadNodes: contourNodes,
      maskNode: fieldClipMask,
    });

    if (materialMode) {
      const exactOptical = gradientStudies['04.02'];
      const materialRim = gradientDescriptor(
        exactOptical.colours.map((colour, index) => ({
          colour,
          position: exactOptical.positions[index],
          midpoint: 0.5,
          smoothness: 0,
        })),
        exactOptical.type,
        centerX - apertureRx - 8,
        centerY - apertureRy - 8,
        apertureRx * 2 + 16,
        apertureRy * 2 + 16,
        0,
        exactOptical.angle,
      );
      addSmoothEllipse({
        cx: centerX,
        cy: centerY,
        rx: apertureRx + 6 * scale,
        ry: apertureRy + 6 * scale,
        rotation: apertureRotation,
        fill: materialRim,
        target: layers.get('40 / Color, Gradient, Pattern, or Material'),
        name: `${label} / External metallic material rim / Smooth silhouette preserved`,
      });
    }
    addSmoothEllipse({
      cx: centerX,
      cy: centerY,
      rx: apertureRx,
      ry: apertureRy,
      rotation: apertureRotation,
      fill: paperMode ? PAPER : VOID,
      stroke: paperMode ? VOID : null,
      strokeFillDescriptor: !paperMode && !materialMode ? fieldStroke.clone() : null,
      strokeWidth: paperMode ? 0.92 * scale : materialMode ? 0 : 1.08 * scale,
      target: layers.get('20 / Canonical Assets'),
      name: `${label} / Continuous Lens aperture / Four cubic segments / No corners`,
    });

    if (trajectory) {
      const endX = centerX + apertureRx * 0.62;
      const endY = centerY + apertureRy * 0.80;
      const trajectoryColour = paperMode ? VOID : SIGNAL;
      addSmoothCubicPath({
        start: [box.x - 12, box.y + box.height * 0.86],
        control1: [box.x + box.width * 0.34, box.y + box.height * 0.88],
        control2: [box.x + box.width * 0.57, box.y + box.height * 0.76],
        end: [endX, endY],
        stroke: trajectoryColour,
        strokeWidth: 3.2 * scale,
        target: layers.get('20 / Canonical Assets'),
        name: `${label} / Single smooth active trajectory`,
      });
      addShape({
        x: endX - 6 * scale,
        y: endY - 6 * scale,
        width: 12 * scale,
        height: 12 * scale,
        fill: trajectoryColour,
        target: layers.get('20 / Canonical Assets'),
        name: `${label} / Active trajectory datum`,
        shape: ShapeEllipse.create(),
      });
    }

    if (showLabels) {
      const legendScale = Math.max(0.8, scale);
      const legendWidth = 104 * legendScale;
      const legendHeight = 142 * legendScale;
      const legendX = box.x + box.width - legendWidth - 14 * legendScale;
      const legendY = box.y + box.height * 0.39;
      addShape({
        x: legendX,
        y: legendY,
        width: legendWidth,
        height: legendHeight,
        fill: paperMode ? RGBA8(249, 248, 242, 224) : RGBA8(14, 14, 14, 204),
        target: layers.get('40 / Color, Gradient, Pattern, or Material'),
        name: `${label} / Normalized field legend ground`,
      });
      addText({
        text: 'NORMALIZED FIELD',
        x: legendX + 10 * legendScale,
        y: legendY + 10 * legendScale,
        size: 6.5 * legendScale,
        fill: paperMode ? VOID : PAPER,
        target: layers.get('30 / Live Type and Metadata'),
        name: `${label} / Normalized field legend title`,
        font: FONTS.monoBold,
        tracking: 0.05,
      });
      const legendEntries = [
        ['+02', FIELD_SPECTRUM[6]],
        ['+01', FIELD_SPECTRUM[5]],
        ['00', FIELD_SPECTRUM[4]],
        ['-01', FIELD_SPECTRUM[3]],
        ['-02', FIELD_SPECTRUM[1]],
      ];
      legendEntries.forEach(([value, colour], index) => {
        const rowY = legendY + (34 + index * 17) * legendScale;
        addText({ text: value, x: legendX + 10 * legendScale, y: rowY, size: 6.5 * legendScale, fill: paperMode ? VOID : PAPER, target: layers.get('30 / Live Type and Metadata'), name: `${label} / Field legend ${value}`, font: FONTS.monoMedium });
        addShape({ x: legendX + 56 * legendScale, y: rowY + 3 * legendScale, width: 34 * legendScale, height: 1.4 * legendScale, fill: colour, target: layers.get('20 / Canonical Assets'), name: `${label} / Field legend ${value} swatch` });
      });
      addText({
        text: 'BEND\n↓\nABSENCE\n↓\nSIGNAL',
        x: box.x + 24 * scale,
        y: box.y + 36 * scale,
        size: 10 * scale,
        fill: paperMode ? VOID : PAPER,
        target: layers.get('30 / Live Type and Metadata'),
        name: `${label} / Functional sequence`,
        font: FONTS.monoBold,
        tracking: 0.08,
      });
      addText({
        text: 'CONTINUOUS LENS  /  EXACT FIELD STOPS  /  NATIVE EDITABLE CURVES',
        x: box.x + 24 * scale,
        y: box.y + box.height - 34 * scale,
        size: 8 * scale,
        fill: paperMode ? ASH_700 : ASH_300,
        target: layers.get('30 / Live Type and Metadata'),
        name: `${label} / Construction caption`,
        font: FONTS.monoMedium,
        tracking: 0.05,
      });
    }

    return {
      centerX,
      centerY,
      apertureRx,
      apertureRy,
      apertureRotation,
    };
  }

  function parseAttributes(tag) {
    const attributes = {};
    const matcher = /([:\w-]+)=["']([^"']*)["']/g;
    for (let match = matcher.exec(tag); match; match = matcher.exec(tag)) attributes[match[1]] = match[2];
    if (attributes.style) {
      for (const declaration of attributes.style.split(';')) {
        const [key, value] = declaration.split(':').map((part) => part?.trim());
        if (key && value && attributes[key] == null) attributes[key] = value;
      }
    }
    return attributes;
  }

  function isContinuousLensAperture(attributes) {
    return attributes['data-layer'] === 'continuous-lens-aperture';
  }

  function isContinuousLensOrSignalTrajectory(attributes) {
    return isContinuousLensAperture(attributes) || attributes['data-layer'] === 'signal-trajectory';
  }

  function parseSvgPathData(data) {
    const tokens = String(data).match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
    const counts = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
    const curves = [];
    let builder = null;
    let command = null;
    let index = 0;
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let cubicControl = null;
    let quadraticControl = null;

    function finishOpenCurve() {
      if (!builder) return;
      curves.push(builder.createCurve());
      builder = null;
    }

    function absolutePair(px, py, relative) {
      return relative ? [x + px, y + py] : [px, py];
    }

    while (index < tokens.length) {
      if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++];
      if (!command) throw new Error(`SVG path begins without a command: ${String(data).slice(0, 80)}`);
      const upper = command.toUpperCase();
      const relative = command !== upper;
      if (upper === 'Z') {
        if (builder) {
          builder.close();
          finishOpenCurve();
        }
        x = startX;
        y = startY;
        cubicControl = null;
        quadraticControl = null;
        command = null;
        continue;
      }
      if (upper === 'A') throw new Error('Canonical SVG importer refuses arc approximation');
      const count = counts[upper];
      if (count == null || index + count > tokens.length) throw new Error(`Invalid or truncated SVG command ${command}`);
      const values = tokens.slice(index, index + count).map(Number);
      index += count;

      if (upper === 'M') {
        const [nextX, nextY] = absolutePair(values[0], values[1], relative);
        finishOpenCurve();
        builder = require('/geometry').CurveBuilder.create().beginXY(nextX, nextY);
        x = nextX;
        y = nextY;
        startX = x;
        startY = y;
        command = relative ? 'l' : 'L';
      } else if (upper === 'L') {
        const [nextX, nextY] = absolutePair(values[0], values[1], relative);
        builder.lineToXY(nextX, nextY);
        x = nextX;
        y = nextY;
      } else if (upper === 'H') {
        const nextX = relative ? x + values[0] : values[0];
        builder.lineToXY(nextX, y);
        x = nextX;
      } else if (upper === 'V') {
        const nextY = relative ? y + values[0] : values[0];
        builder.lineToXY(x, nextY);
        y = nextY;
      } else if (upper === 'C') {
        const [c1x, c1y] = absolutePair(values[0], values[1], relative);
        const [c2x, c2y] = absolutePair(values[2], values[3], relative);
        const [nextX, nextY] = absolutePair(values[4], values[5], relative);
        builder.addBezierXY(c1x, c1y, c2x, c2y, nextX, nextY);
        x = nextX;
        y = nextY;
        cubicControl = [c2x, c2y];
      } else if (upper === 'S') {
        const c1x = cubicControl ? 2 * x - cubicControl[0] : x;
        const c1y = cubicControl ? 2 * y - cubicControl[1] : y;
        const [c2x, c2y] = absolutePair(values[0], values[1], relative);
        const [nextX, nextY] = absolutePair(values[2], values[3], relative);
        builder.addBezierXY(c1x, c1y, c2x, c2y, nextX, nextY);
        x = nextX;
        y = nextY;
        cubicControl = [c2x, c2y];
      } else if (upper === 'Q' || upper === 'T') {
        let qx;
        let qy;
        let nextX;
        let nextY;
        if (upper === 'Q') {
          [qx, qy] = absolutePair(values[0], values[1], relative);
          [nextX, nextY] = absolutePair(values[2], values[3], relative);
        } else {
          qx = quadraticControl ? 2 * x - quadraticControl[0] : x;
          qy = quadraticControl ? 2 * y - quadraticControl[1] : y;
          [nextX, nextY] = absolutePair(values[0], values[1], relative);
        }
        const c1x = x + (2 / 3) * (qx - x);
        const c1y = y + (2 / 3) * (qy - y);
        const c2x = nextX + (2 / 3) * (qx - nextX);
        const c2y = nextY + (2 / 3) * (qy - nextY);
        builder.addBezierXY(c1x, c1y, c2x, c2y, nextX, nextY);
        x = nextX;
        y = nextY;
        quadraticControl = [qx, qy];
      }
      if (!['C', 'S'].includes(upper)) cubicControl = null;
      if (!['Q', 'T'].includes(upper)) quadraticControl = null;
    }
    finishOpenCurve();
    return curves;
  }

  async function addSvgVector({
    path,
    target,
    box,
    namePrefix,
    overrideFill = null,
    overrideStroke = null,
    fillOpacityForPath = null,
    strokeFillDescriptor = null,
    pathFilter = null,
    lineStyleForPath = null,
    strokeWidthMultiplierForPath = null,
    skipBackground = true,
    includeCircles = true,
    fitMode = 'contain',
  }) {
    const source = await readText(path);
    const rootTag = source.match(/<svg\b[^>]*>/i)?.[0];
    if (!rootTag) throw new Error(`SVG root missing: ${path}`);
    const rootAttributes = parseAttributes(rootTag);
    const viewBox = (rootAttributes.viewBox || `0 0 ${rootAttributes.width} ${rootAttributes.height}`).split(/\s+/).map(Number);
    const [viewX, viewY, viewWidth, viewHeight] = viewBox;
    const absoluteBox = { ...box, x: box.x + currentOrigin.x, y: box.y + currentOrigin.y };
    if (!['contain', 'cover'].includes(fitMode)) throw new Error(`Unsupported SVG fit mode: ${fitMode}`);
    const scale = fitMode === 'cover'
      ? Math.max(absoluteBox.width / viewWidth, absoluteBox.height / viewHeight)
      : Math.min(absoluteBox.width / viewWidth, absoluteBox.height / viewHeight);
    const offsetX = absoluteBox.x + (absoluteBox.width - viewWidth * scale) / 2 - viewX * scale;
    const offsetY = absoluteBox.y + (absoluteBox.height - viewHeight * scale) / 2 - viewY * scale;
    let pathIndex = 0;
    let sourcePathIndex = 0;
    const created = [];

    for (const tag of source.match(/<path\b[^>]*>/gi) || []) {
      const attributes = parseAttributes(tag);
      sourcePathIndex += 1;
      if (!attributes.d) continue;
      if (pathFilter && !pathFilter(attributes, sourcePathIndex)) continue;
      const mappedFill = typeof overrideFill === 'function'
        ? overrideFill(attributes, sourcePathIndex)
        : overrideFill;
      const sourceFillValue = attributes.fill || 'none';
      const fillValue = mappedFill && sourceFillValue !== 'none' ? mappedFill : sourceFillValue;
      const mappedStroke = typeof overrideStroke === 'function'
        ? overrideStroke(attributes, sourcePathIndex)
        : overrideStroke;
      const strokeValue = mappedStroke || attributes.stroke || 'none';
      const fillOpacity = Math.round(255 * Number(fillOpacityForPath
        ? fillOpacityForPath(attributes, sourcePathIndex)
        : attributes['fill-opacity'] ?? 1));
      const strokeOpacity = Math.round(255 * Number(attributes['stroke-opacity'] ?? 1));
      const fill = fillValue === 'none' ? null : parseHex(fillValue, fillOpacity);
      const stroke = strokeValue === 'none' ? null : parseHex(strokeValue, strokeOpacity);
      const mappedStrokeDescriptor = typeof strokeFillDescriptor === 'function'
        ? strokeFillDescriptor(attributes, sourcePathIndex, {
          scale,
          offsetX: offsetX - currentOrigin.x,
          offsetY: offsetY - currentOrigin.y,
        })
        : strokeFillDescriptor;
      if (!fill && !stroke && !mappedStrokeDescriptor) continue;
      const curves = parseSvgPathData(attributes.d);
      for (const curve of curves) {
        curve.transform(Transform.createScale(scale));
        curve.translate(offsetX, offsetY);
      }
      const requestedLineStyle = lineStyleForPath ? lineStyleForPath(attributes, sourcePathIndex) : {};
      const sourceDashPattern = String(attributes['stroke-dasharray'] || '')
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number)
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => value * scale);
      const dashPattern = requestedLineStyle.dashPattern || (sourceDashPattern.length > 0 ? sourceDashPattern : null);
      const dashPhase = requestedLineStyle.dashPhase ?? Number(attributes['stroke-dashoffset'] || 0) * scale;
      const lineType = requestedLineStyle.lineType || (dashPattern ? LineType.Dash : LineType.Solid);
      const strokeWidthMultiplier = strokeWidthMultiplierForPath
        ? Number(strokeWidthMultiplierForPath(attributes, sourcePathIndex))
        : 1;
      const node = addPolyCurve({
        curves,
        fill,
        stroke,
        strokeFillDescriptor: mappedStrokeDescriptor,
        strokeWidth: Number(attributes['stroke-width'] || 1) * scale * strokeWidthMultiplier,
        target,
        name: `${namePrefix} / Path ${String(++pathIndex).padStart(2, '0')}`,
        cap: attributes['stroke-linecap'] === 'round' ? LineCap.Round : LineCap.Butt,
        lineType,
        dashPattern,
        dashPhase,
      });
      created.push(node);
    }

    let sourceCircleIndex = 0;
    for (const tag of includeCircles ? (source.match(/<circle\b[^>]*>/gi) || []) : []) {
      const attributes = parseAttributes(tag);
      sourceCircleIndex += 1;
      if (pathFilter && !pathFilter(attributes, sourcePathIndex + sourceCircleIndex)) continue;
      const mappedFill = typeof overrideFill === 'function' ? overrideFill(attributes, sourcePathIndex + sourceCircleIndex) : overrideFill;
      const fill = parseHex(mappedFill || attributes.fill);
      if (!fill) continue;
      const cx = Number(attributes.cx);
      const cy = Number(attributes.cy);
      const radius = Number(attributes.r);
      created.push(addShape({
        x: offsetX + (cx - radius) * scale,
        y: offsetY + (cy - radius) * scale,
        width: radius * 2 * scale,
        height: radius * 2 * scale,
        fill,
        target,
        name: `${namePrefix} / Circle`,
        shape: ShapeEllipse.create(),
      }));
    }
    if (!skipBackground) {
      for (const tag of source.match(/<rect\b[^>]*>/gi) || []) {
        const attributes = parseAttributes(tag);
        const fill = parseHex(attributes.fill);
        if (!fill) continue;
        created.push(addShape({
          x: offsetX + Number(attributes.x || 0) * scale,
          y: offsetY + Number(attributes.y || 0) * scale,
          width: Number(attributes.width) * scale,
          height: Number(attributes.height) * scale,
          fill,
          target,
          name: `${namePrefix} / Background`,
        }));
      }
    }
    return created;
  }

  async function addExactSvgViewport(item, {
    path,
    box,
    label,
    fitMode = 'contain',
    skipBackground = false,
    overrideFill = null,
    overrideStroke = null,
    pathFilter = null,
    includeCircles = true,
  }) {
    const target = item.layers.get('20 / Canonical Assets');
    const source = await readText(path);
    const spectrumDefinition = source.match(/<linearGradient\b[^>]*id=["']atlas-spectrum["'][^>]*>([\s\S]*?)<\/linearGradient>/i);
    let exactSpectrumStops = null;
    if (spectrumDefinition) {
      exactSpectrumStops = [...spectrumDefinition[1].matchAll(/<stop\b[^>]*>/gi)].map((match) => {
        const attributes = parseAttributes(match[0]);
        const colourHex = attributes['stop-color'];
        const colour = parseHex(colourHex);
        const rawOffset = String(attributes.offset || '0');
        const position = rawOffset.endsWith('%') ? Number.parseFloat(rawOffset) / 100 : Number(rawOffset);
        if (!colour || !Number.isFinite(position)) throw new Error(`Invalid exact SVG spectrum stop in ${path}`);
        return { colourHex, position, midpoint: 0.5, smoothness: 0 };
      });
      if (exactSpectrumStops.length === 0) throw new Error(`Exact SVG spectrum definition has no stops: ${path}`);
    }
    const payloadNodes = await addSvgVector({
      path,
      target,
      box,
      namePrefix: `${label} / Exact governed SVG`,
      fitMode,
      skipBackground,
      overrideFill,
      overrideStroke,
      strokeFillDescriptor: (attributes, _sourceIndex, mapping) => {
        if (attributes.stroke !== 'url(#atlas-spectrum)') return null;
        if (!exactSpectrumStops) throw new Error(`Missing exact SVG spectrum stops for ${path}`);
        if (/[^MLZ0-9eE+.,\s-]/.test(attributes.d)) {
          throw new Error(`Exact SVG spectrum importer refuses non-linear path geometry in ${path}`);
        }
        const coordinates = String(attributes.d).match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)?.map(Number) || [];
        if (coordinates.length < 4 || coordinates.length % 2 !== 0) throw new Error(`Invalid exact SVG spectrum path in ${path}`);
        const xs = coordinates.filter((_value, index) => index % 2 === 0);
        const ys = coordinates.filter((_value, index) => index % 2 === 1);
        const x = mapping.offsetX + Math.min(...xs) * mapping.scale;
        const y = mapping.offsetY + Math.min(...ys) * mapping.scale;
        const width = Math.max(0.001, (Math.max(...xs) - Math.min(...xs)) * mapping.scale);
        const height = Math.max(0.001, (Math.max(...ys) - Math.min(...ys)) * mapping.scale);
        const strokeAlpha = Math.round(255 * Number(attributes['stroke-opacity'] ?? 1));
        const exactStopsWithOpacity = exactSpectrumStops.map(({ colourHex, position, midpoint, smoothness }) => ({
          colour: parseHex(colourHex, strokeAlpha),
          position,
          midpoint,
          smoothness,
        }));
        return gradientDescriptor(exactStopsWithOpacity, GradientFillType.Linear, x, y, width, height, 0, 0);
      },
      pathFilter,
      includeCircles,
    });
    if (payloadNodes.length === 0) throw new Error(`Exact governed SVG produced no editable nodes: ${label}`);
    const maskNode = addShape({
      ...box,
      fill: PAPER,
      target,
      name: `${label} / Exact viewport enclosure`,
    });
    return createEditableMaskedGroup({
      name: `${label} / EXACT GOVERNED SVG / ${fitMode.toUpperCase()} VIEWPORT`,
      target,
      payloadNodes,
      maskNode,
    });
  }

  function wrap(text, maxLength) {
    return String(text).split('\n').map((paragraph) => {
      if (!paragraph) return '';
      const lines = [];
      let line = '';
      let pendingSpace = '';
      const tokens = paragraph.match(/\S+|\s+/g) || [];
      for (const token of tokens) {
        if (/^\s+$/.test(token)) {
          pendingSpace = token;
          continue;
        }
        const chunks = token.length > maxLength
          ? token.match(new RegExp(`.{1,${maxLength}}`, 'g'))
          : [token];
        for (const chunk of chunks) {
          const prefix = line ? pendingSpace : '';
          if (line && `${line}${prefix}${chunk}`.length > maxLength) {
            lines.push(line.trimEnd());
            line = chunk;
          } else {
            line = `${line}${prefix}${chunk}`;
          }
          pendingSpace = '';
          if (chunk.length === maxLength && chunks.length > 1) {
            lines.push(line.trimEnd());
            line = '';
          }
        }
      }
      if (line) lines.push(line.trimEnd());
      return lines.join('\n');
    }).join('\n');
  }

  function sectionCopy(subject, section) {
    const sectionContract = contentBySubjectId.get(subject.id)?.sections?.[section];
    if (!sectionContract) throw new Error(`Missing Affinity section contract for ${subject.id} / ${section}`);
    const content = sectionContract.content || sectionContract.reason;
    if (!content) throw new Error(`Empty Affinity section contract for ${subject.id} / ${section}`);
    return content;
  }

  function isDarkSubject(subject) {
    return subject.id === '00.00' || ['04', '07', '10', '11'].includes(subject.categoryId);
  }

  function createArtboard(rect) {
    const before = [...master.artboards];
    master.addRectangularArtboard(rect, false, false, false);
    const after = [...master.artboards];
    const created = after.find((candidate) => !before.some((existing) => candidate.isSameObject(existing)));
    if (!created) throw new Error('Affinity failed to return the newly created artboard');
    return created;
  }

  const categoryOrder = [...new Set(manifest.subjects.map(({ categoryId }) => categoryId))];
  const categoryX = new Map(categoryOrder.map((categoryId, index) => [categoryId, index * 1680]));
  const categoryY = new Map(categoryOrder.map((categoryId) => [categoryId, 0]));
  const positionBySubjectId = new Map();
  for (const subject of manifest.subjects) {
    const x = categoryX.get(subject.categoryId);
    const y = categoryY.get(subject.categoryId);
    positionBySubjectId.set(subject.id, { x, y });
    categoryY.set(subject.categoryId, y + subject.artboard.minimumHeightPx + 240);
  }
  const existingBySubjectId = new Map();
  const duplicateExistingIds = new Set();
  for (const artboard of master.artboards) {
    if (artboard.node.hasKey('bizarre.subjectId')) {
      const subjectId = artboard.node.getValueForKey('bizarre.subjectId');
      if (existingBySubjectId.has(subjectId)) duplicateExistingIds.add(subjectId);
      else existingBySubjectId.set(subjectId, artboard);
    }
  }
  if (duplicateExistingIds.size > 0) {
    throw new Error(`Duplicate tagged artboards must be resolved before building: ${[...duplicateExistingIds].join(', ')}`);
  }
  const requestedSubjects = REQUESTED_SUBJECT_IDS.map((id) => subjectById.get(id));
  const artboards = [];
  const completedBefore = [];
  const initialArtboard = [...master.artboards][0];

  for (const subject of requestedSubjects) {
    const { x, y } = positionBySubjectId.get(subject.id);
    const width = subject.artboard.widthPx;
    const height = subject.artboard.minimumHeightPx;
    let artboard = existingBySubjectId.get(subject.id) || null;
    const expectedFidelityRevision = FIDELITY_REVISION_BY_SUBJECT_ID.get(subject.id) || null;
    const isCurrentComplete = artboard
      && artboard.node.hasKey('bizarre.buildComplete')
      && artboard.node.getValueForKey('bizarre.buildComplete') === 'true'
      && artboard.node.hasKey('bizarre.manifestHash')
      && artboard.node.getValueForKey('bizarre.manifestHash') === manifest.canonicalSha256
      && artboard.node.hasKey('bizarre.buildRevision')
      && artboard.node.getValueForKey('bizarre.buildRevision') === BUILD_REVISION
      && (!expectedFidelityRevision
        || (artboard.node.hasKey('bizarre.continuousLensFidelityRevision')
          && artboard.node.getValueForKey('bizarre.continuousLensFidelityRevision') === expectedFidelityRevision))
      && artboard.node.hasKey('bizarre.contentFingerprint')
      && artboard.node.getValueForKey('bizarre.contentFingerprint') === contentBySubjectId.get(subject.id).contentFingerprint;
    if (isCurrentComplete) {
      completedBefore.push(subject.id);
      continue;
    }
    if (artboard) {
      master.executeCommand(DocumentCommand.createDeleteSelection(artboard.node.selfSelection, false));
      artboard = null;
    }
    const untouchedShell = subject.id === '00.00'
      && initialArtboard
      && initialArtboard.node.hasKey('bizarre.buildShell')
      && !initialArtboard.node.hasKey('bizarre.subjectId')
      && [...initialArtboard.node.children].length === 0;
    artboard = untouchedShell ? initialArtboard : createArtboard(new Rectangle(x, y, width, height));
    artboard.node.userDescription = subject.exactLabel;
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.subjectId', subject.id));
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.subjectName', subject.name));
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.status', subject.governance.status));
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.manifestHash', manifest.canonicalSha256));
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.buildRevision', BUILD_REVISION));
    if (expectedFidelityRevision) {
      master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.continuousLensFidelityRevision', expectedFidelityRevision));
    }
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.contentFingerprint', contentBySubjectId.get(subject.id).contentFingerprint));
    master.executeCommand(DocumentCommand.createSetTagValueForKey(artboard.node.selfSelection, 'bizarre.buildComplete', 'false'));
    artboards.push({ subject, artboard, x, y, width, height });
  }

  const artboardById = new Map();
  const affinityLayerZOrder = [
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
  for (const item of artboards) {
    const layers = new Map();
    const logicalLayerSet = new Set(item.subject.layerStack);
    if (affinityLayerZOrder.some((layerName) => !logicalLayerSet.has(layerName)) || logicalLayerSet.size !== affinityLayerZOrder.length) {
      throw new Error(`Layer contract mismatch for ${item.subject.id}`);
    }
    for (const layerName of [...affinityLayerZOrder].reverse()) {
      layers.set(layerName, addContainer(layerName, item.artboard.node, InsertionMode.Inside_AtFront));
    }
    const actual = [...item.artboard.node.children].map((node) => node.userDescription);
    if (actual.length !== 11 || new Set(actual).size !== 11 || actual.some((layerName) => !logicalLayerSet.has(layerName))) {
      throw new Error(`Layer anatomy failed for ${item.subject.id}`);
    }
    artboardById.set(item.subject.id, { ...item, layers });
  }

  function basePage(item) {
    const { subject, width, height, layers } = item;
    const dark = isDarkSubject(subject);
    const background = dark ? VOID : PAPER;
    const primary = dark ? PAPER : VOID;
    const secondary = dark ? ASH_300 : ASH_700;
    const panel = dark ? VOID_RAISED : PAPER_MUTED;
    addShape({ x: 0, y: 0, width, height, fill: background, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Ground / Approved page mode' }).lock();
    if (subject.id === '07.05' || subject.id === '11.05') return { dark, background, primary, secondary, panel };
    addShape({ x: 80, y: 0, width: 1280, height: 6, fill: SIGNAL, target: layers.get('10 / Construction'), name: 'Signal rail / Active datum' });
    addText({ text: `BZR / ${subject.categoryId} / ${subject.kind.toUpperCase()}`, x: 80, y: 48, size: 14, fill: dark ? SIGNAL : SIGNAL_INK, target: layers.get('30 / Live Type and Metadata'), name: 'Metadata / System rail', font: FONTS.monoBold, tracking: 0.12 });
    const statusRail = subject.id === '06.01'
      ? 'DIRECTION APPROVED / GEOMETRY PROVISIONAL'
      : subject.governance.status;
    addText({ text: `${statusRail}  /  ${subject.id}`, x: subject.id === '06.01' ? 930 : 1010, y: 48, size: subject.id === '06.01' ? 12 : 14, fill: secondary, target: layers.get('30 / Live Type and Metadata'), name: 'Metadata / Status rail', font: FONTS.monoMedium, tracking: 0.08 });
    const provisionalTitle = subject.name.includes('/ Provisional');
    const titleSize = subject.id === '06.01' ? 56 : provisionalTitle ? 58 : subject.name.length > 42 ? 48 : subject.name.length > 30 ? 56 : 72;
    const titleWrap = provisionalTitle ? 18 : subject.name.length > 42 ? 22 : subject.name.length > 30 ? 25 : 30;
    addText({ text: wrap(subject.name.toUpperCase(), titleWrap), x: 80, y: 118, size: titleSize, fill: primary, target: layers.get('30 / Live Type and Metadata'), name: 'Title / Subject', font: FONTS.displayBlack, tracking: -0.025 });
    addText({ text: `${subject.categoryId} / ${subject.categoryName.toUpperCase()}  ·  ${subject.artboard.heightStrategy.toUpperCase()} / 1440PX / 144DPI`, x: 82, y: 330, size: 16, fill: secondary, target: layers.get('30 / Live Type and Metadata'), name: 'Metadata / Category and page rule', font: FONTS.monoMedium, tracking: 0.04 });
    addShape({ x: 80, y: height - 90, width: 1280, height: 1, fill: dark ? IRON : ASH_300, target: layers.get('10 / Construction'), name: 'Footer datum' });
    addText({ text: 'CATCH THE STARS  /  MAKE THE DISTANT TANGIBLE', x: 80, y: height - 58, size: 12, fill: dark ? SIGNAL : SIGNAL_INK, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Footer / Permanent tagline', font: FONTS.monoBold, tracking: 0.1 });
    addText({ text: `${manifest.manifestVersion}  /  ${manifest.canonicalSha256.slice(0, 12)}`, x: 1080, y: height - 58, size: 12, fill: secondary, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Footer / Manifest version', font: FONTS.monoMedium });
    return { dark, background, primary, secondary, panel };
  }

  function anatomyPanels(item, palette, startY) {
    const { subject, height, layers } = item;
    const sections = subject.anatomy;
    const columns = 2;
    const rows = Math.ceil(sections.length / columns);
    const gapX = 40;
    const gapY = 30;
    const panelWidth = 620;
    const remaining = height - startY - 170;
    const panelHeight = Math.max(250, Math.floor((remaining - gapY * (rows - 1)) / rows));
    sections.forEach((section, index) => {
      const sectionContract = contentBySubjectId.get(subject.id).sections[section];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 80 + column * (panelWidth + gapX);
      const y = startY + row * (panelHeight + gapY);
      const target = section.startsWith('Construction') ? layers.get('10 / Construction')
        : section.startsWith('Exact tokens') ? layers.get('20 / Canonical Assets')
          : section.startsWith('Variants') ? layers.get('50 / Variants, States, and Optical Sizes')
            : section.startsWith('Usage') || section.startsWith('When-to-use') || section.startsWith('Far, normal') ? layers.get('60 / Usage and Applications')
              : section.startsWith('Accessibility') || section.startsWith('Motion') ? layers.get('70 / Accessibility, Bilingual, RTL, and Motion')
                : section.startsWith('Production') ? layers.get('80 / Production and Export')
                  : section.startsWith('Correct') || section.startsWith('Misuse') || section.startsWith('Rules') ? layers.get('90 / Correct Use and Misuse')
                    : section.startsWith('Provenance') || section.startsWith('Parent') || section.startsWith('Change log') || section.startsWith('Status') || section.startsWith('Child navigation') ? layers.get('99 / Provenance, Status, Evidence, and Navigation')
                      : layers.get('30 / Live Type and Metadata');
      addShape({ x, y, width: panelWidth, height: panelHeight, fill: palette.panel, target, name: `Section ${String(index + 1).padStart(2, '0')} / ${section}` });
      addShape({ x, y, width: 8, height: panelHeight, fill: index === 0 ? SIGNAL : palette.dark ? IRON : ASH_300, target, name: `Section ${String(index + 1).padStart(2, '0')} / Index rail` });
      addText({ text: String(index + 1).padStart(2, '0'), x: x + 28, y: y + 30, size: 13, fill: palette.dark ? SIGNAL : SIGNAL_INK, target, name: `Section ${String(index + 1).padStart(2, '0')} / Number`, font: FONTS.monoBold });
      addText({ text: wrap(section.toUpperCase(), 48), x: x + 78, y: y + 28, size: 15, fill: palette.primary, target, name: `Section ${String(index + 1).padStart(2, '0')} / Heading`, font: FONTS.bodyBold, tracking: 0.02 });
      addText({ text: sectionContract.status, x: x + panelWidth - 124, y: y + 34, size: 8, fill: sectionContract.status === 'APPLICABLE' ? (palette.dark ? SIGNAL : SIGNAL_INK) : palette.secondary, target, name: `Section ${String(index + 1).padStart(2, '0')} / Applicability`, font: FONTS.monoBold, tracking: 0.05 });
      addText({ text: wrap(sectionCopy(subject, section), 88), x: x + 30, y: y + 92, size: 11.5, fill: palette.secondary, target, name: `Section ${String(index + 1).padStart(2, '0')} / Exact governed content`, font: FONTS.bodyMedium });
    });
  }

  function addSwissWorkingEditorialBands(item, palette, startY) {
    const { subject, layers } = item;
    const sections = subject.anatomy;
    const section = (index) => sections[index];
    const copy = (index) => sectionCopy(subject, section(index));
    const colourLayer = layers.get('40 / Color, Gradient, Pattern, or Material');
    const constructionLayer = layers.get('10 / Construction');
    const typeLayer = layers.get('30 / Live Type and Metadata');
    const exactLayer = layers.get('20 / Canonical Assets');
    const variantsLayer = layers.get('50 / Variants, States, and Optical Sizes');
    const usageLayer = layers.get('60 / Usage and Applications');
    const accessLayer = layers.get('70 / Accessibility, Bilingual, RTL, and Motion');
    const productionLayer = layers.get('80 / Production and Export');
    const correctLayer = layers.get('90 / Correct Use and Misuse');
    const provenanceLayer = layers.get('99 / Provenance, Status, Evidence, and Navigation');

    function label(index, x, y, target, accent = false) {
      addText({ text: `${String(index + 1).padStart(2, '0')} / ${section(index).toUpperCase()}`, x, y, size: 10, fill: accent ? SIGNAL_INK : VOID, target, name: `Section ${String(index + 1).padStart(2, '0')} / ${section(index)} / Editorial label`, font: FONTS.monoBold, tracking: 0.055 });
    }

    const testY = startY;
    addShape({ x: 80, y: testY, width: 1280, height: 290, fill: VOID, target: colourLayer, name: '01.01 / Editorial band / The test / Ground' });
    addShape({ x: 80, y: testY, width: 12, height: 290, fill: SIGNAL, target: colourLayer, name: '01.01 / Editorial band / The test / Signal index' });
    addText({ text: 'THE TEST', x: 116, y: testY + 32, size: 12, fill: SIGNAL, target: typeLayer, name: '01.01 / Editorial band / The test / Heading', font: FONTS.monoBold, tracking: 0.08 });
    addText({ text: 'EVERY NEW CHOICE MUST IMPROVE', x: 116, y: testY + 68, size: 19, fill: PAPER, target: usageLayer, name: '01.01 / Editorial band / The test / Statement', font: FONTS.bodyBold, tracking: 0.015 });
    const tests = [
      ['FUNCTION', 'DOES IT WORK BETTER?'],
      ['RECOGNITION', 'DOES IT BECOME MORE BIZARRE?'],
      ['USEFUL REVEAL', 'DOES DETAIL EARN ITS PLACE?'],
    ];
    tests.forEach(([name, question], index) => {
      const x = 116 + index * 406;
      addShape({ x, y: testY + 126, width: 358, height: 1, fill: index === 2 ? SIGNAL : IRON, target: constructionLayer, name: `01.01 / The test / ${name} datum` });
      addShape({ x: x + 350, y: testY + 120, width: 12, height: 12, fill: index === 2 ? SIGNAL : PAPER, target: exactLayer, name: `01.01 / The test / ${name} registered state`, shape: ShapeEllipse.create() });
      addText({ text: name, x, y: testY + 150, size: 23, fill: index === 2 ? SIGNAL : PAPER, target: usageLayer, name: `01.01 / The test / ${name}`, font: FONTS.displayBold, tracking: -0.018 });
      addText({ text: question, x, y: testY + 202, size: 10, fill: ASH_300, target: usageLayer, name: `01.01 / The test / ${name} question`, font: FONTS.monoMedium, tracking: 0.045 });
    });
    label(0, 1020, testY + 34, typeLayer);
    addText({ text: wrap(copy(0), 90), x: 116, y: testY + 246, size: 8.4, fill: ASH_300, target: typeLayer, name: `Section 01 / ${section(0)} / Exact governed content`, font: FONTS.bodyMedium });

    const modesY = testY + 320;
    addText({ text: 'ONLY TWO MODES', x: 80, y: modesY, size: 13, fill: SIGNAL_INK, target: variantsLayer, name: '01.01 / Editorial band / Only two modes / Heading', font: FONTS.monoBold, tracking: 0.08 });
    addText({ text: 'ASTRONOMICAL ATLAS IS AN EXPRESSION LAYER. NOT A THIRD MODE.', x: 760, y: modesY + 2, size: 10, fill: ASH_700, target: variantsLayer, name: '01.01 / Editorial band / Only two modes / Rule', font: FONTS.monoBold, tracking: 0.04 });
    addShape({ x: 80, y: modesY + 36, width: 600, height: 390, fill: PAPER_MUTED, target: colourLayer, name: '01.01 / Precision Panel / Native mode specimen / Ground' });
    addShape({ x: 80, y: modesY + 36, width: 600, height: 12, fill: SIGNAL, target: colourLayer, name: '01.01 / Precision Panel / Active rail' });
    addText({ text: 'PRECISION PANEL', x: 112, y: modesY + 78, size: 28, fill: VOID, target: variantsLayer, name: '01.01 / Precision Panel / Name', font: FONTS.displayBold, tracking: -0.02 });
    addText({ text: 'METHOD / PUBLIC LEGIBILITY / REPEATABLE STRUCTURE', x: 112, y: modesY + 132, size: 9, fill: ASH_700, target: variantsLayer, name: '01.01 / Precision Panel / Definition', font: FONTS.monoBold, tracking: 0.045 });
    for (let row = 0; row < 5; row += 1) {
      const y = modesY + 194 + row * 42;
      addShape({ x: 112, y, width: 516, height: 1, fill: row === 2 ? SIGNAL_INK : ASH_300, target: constructionLayer, name: `01.01 / Precision Panel / Measured row ${row + 1}` });
      addShape({ x: 112 + row * 84, y: y - 5, width: 10, height: 10, fill: row === 2 ? SIGNAL_INK : VOID, target: exactLayer, name: `01.01 / Precision Panel / Registered datum ${row + 1}`, shape: ShapeEllipse.create() });
    }
    addText({ text: 'SIGNAL  /  INSTRUMENT  /  DATA  /  REVEAL', x: 112, y: modesY + 360, size: 11, fill: VOID, target: variantsLayer, name: '01.01 / Precision Panel / Functional sequence', font: FONTS.monoBold, tracking: 0.07 });

    addShape({ x: 760, y: modesY + 36, width: 600, height: 390, fill: VOID, target: colourLayer, name: '01.01 / Display Field / Native mode specimen / Ground' });
    addText({ text: 'DISPLAY FIELD', x: 792, y: modesY + 78, size: 28, fill: PAPER, target: variantsLayer, name: '01.01 / Display Field / Name', font: FONTS.displayBold, tracking: -0.02 });
    addText({ text: 'EMOTION / IMMERSION / MATERIAL DEPTH', x: 792, y: modesY + 132, size: 9, fill: ASH_300, target: variantsLayer, name: '01.01 / Display Field / Definition', font: FONTS.monoBold, tracking: 0.045 });
    for (let index = 0; index < 15; index += 1) {
      const t = index / 14;
      addSmoothEllipse({ cx: 1136 - t * 20, cy: modesY + 264, rx: 210 - t * 170, ry: 118 - t * 88, rotation: -0.11, fill: null, stroke: index === 2 || index === 10 ? SIGNAL : index % 4 === 0 ? ASH_500 : IRON, strokeWidth: index === 2 || index === 10 ? 1.4 : 0.72, target: exactLayer, name: `01.01 / Display Field / Mode contour ${String(index + 1).padStart(2, '0')}` });
    }
    addSmoothEllipse({ cx: 1120, cy: modesY + 264, rx: 46, ry: 22, rotation: -14 * Math.PI / 180, fill: VOID, stroke: SIGNAL, strokeWidth: 1.8, target: exactLayer, name: '01.01 / Display Field / Smooth Continuous Lens cue' });
    label(2, 112, modesY + 400, exactLayer);
    label(3, 792, modesY + 400, variantsLayer);
    addText({ text: wrap(copy(2), 125), x: 112, y: modesY + 424, size: 5.2, fill: ASH_700, target: exactLayer, name: `Section 03 / ${section(2)} / Exact governed content`, font: FONTS.bodyMedium });
    addText({ text: wrap(copy(3), 82), x: 792, y: modesY + 424, size: 7.5, fill: ASH_300, target: variantsLayer, name: `Section 04 / ${section(3)} / Exact governed content`, font: FONTS.bodyMedium });

    const criteriaY = modesY + 520;
    addShape({ x: 80, y: criteriaY, width: 1280, height: 330, fill: PAPER_MUTED, target: colourLayer, name: '01.01 / Editorial band / Operating criteria / Ground' });
    addText({ text: 'OPERATING CRITERIA', x: 112, y: criteriaY + 30, size: 12, fill: SIGNAL_INK, target: usageLayer, name: '01.01 / Editorial band / Operating criteria / Heading', font: FONTS.monoBold, tracking: 0.08 });
    const criteria = ['OPERATIONAL CUES', 'REPEATABLE GRIDS', 'REAL METADATA', 'TACTILE CONSTRUCTION', 'GARAGE ACCESS'];
    criteria.forEach((name, index) => {
      const x = 112 + index * 240;
      addText({ text: String(index + 1).padStart(2, '0'), x, y: criteriaY + 92, size: 11, fill: index === 4 ? SIGNAL_INK : ASH_700, target: correctLayer, name: `01.01 / Operating criterion ${index + 1} / Index`, font: FONTS.monoBold });
      addShape({ x, y: criteriaY + 128, width: 204, height: 1, fill: ASH_300, target: constructionLayer, name: `01.01 / Operating criterion ${index + 1} / Datum` });
      addShape({ x: x + 184 - index * 24, y: criteriaY + 122, width: 12, height: 12, fill: index === 4 ? SIGNAL : VOID, target: exactLayer, name: `01.01 / Operating criterion ${index + 1} / Registered value`, shape: ShapeEllipse.create() });
      addText({ text: wrap(name, 18), x, y: criteriaY + 160, size: 16, fill: VOID, target: correctLayer, name: `01.01 / Operating criterion ${index + 1} / Name`, font: FONTS.bodyBold });
    });
    label(4, 112, criteriaY + 254, usageLayer, true);
    addText({ text: wrap(copy(4), 82), x: 112, y: criteriaY + 280, size: 8, fill: ASH_700, target: usageLayer, name: `Section 05 / ${section(4)} / Exact governed content`, font: FONTS.bodyMedium });

    const operationsY = criteriaY + 360;
    addShape({ x: 80, y: operationsY, width: 1280, height: 330, fill: PAPER, target: colourLayer, name: '01.01 / Editorial band / Access production motion / Ground' });
    const operations = [
      { index: 5, x: 80, w: 410, target: accessLayer, title: 'ACCESS', cue: 'LABEL + SHAPE + POSITION' },
      { index: 6, x: 515, w: 410, target: accessLayer, title: 'MOTION', cue: 'STATE OR FORCE. NEVER DECORATION.' },
      { index: 7, x: 950, w: 410, target: productionLayer, title: 'PRODUCTION', cue: 'LIVE TYPE / NATIVE ASSETS / SOURCE-BACKED' },
    ];
    operations.forEach((operation, opIndex) => {
      addShape({ x: operation.x, y: operationsY, width: operation.w, height: 1, fill: opIndex === 2 ? SIGNAL_INK : ASH_300, target: constructionLayer, name: `01.01 / ${operation.title} / Top datum` });
      label(operation.index, operation.x + 24, operationsY + 26, operation.target, opIndex === 2);
      addText({ text: operation.title, x: operation.x + 24, y: operationsY + 72, size: 24, fill: VOID, target: operation.target, name: `01.01 / ${operation.title} / Heading`, font: FONTS.displayBold, tracking: -0.018 });
      addText({ text: operation.cue, x: operation.x + 24, y: operationsY + 122, size: 9, fill: SIGNAL_INK, target: operation.target, name: `01.01 / ${operation.title} / Functional cue`, font: FONTS.monoBold, tracking: 0.045 });
      addShape({ x: operation.x + 24, y: operationsY + 160, width: operation.w - 48, height: 1, fill: ASH_300, target: constructionLayer, name: `01.01 / ${operation.title} / Measure` });
      [0.2, 0.5, 0.8].forEach((t, index) => addShape({ x: operation.x + 20 + t * (operation.w - 48), y: operationsY + 154, width: 12, height: 12, fill: index === opIndex ? SIGNAL : VOID, target: exactLayer, name: `01.01 / ${operation.title} / State ${index + 1}`, shape: ShapeEllipse.create() }));
      addText({ text: wrap(copy(operation.index), 58), x: operation.x + 24, y: operationsY + 204, size: 7.7, fill: ASH_700, target: operation.target, name: `Section ${String(operation.index + 1).padStart(2, '0')} / ${section(operation.index)} / Exact governed content`, font: FONTS.bodyMedium });
    });

    const useY = operationsY + 360;
    addShape({ x: 80, y: useY, width: 620, height: 300, fill: PAPER_MUTED, target: colourLayer, name: '01.01 / Correct use / Ground' });
    addShape({ x: 740, y: useY, width: 620, height: 300, fill: VOID, target: colourLayer, name: '01.01 / Misuse / Ground' });
    addShape({ x: 80, y: useY, width: 12, height: 300, fill: SIGNAL, target: colourLayer, name: '01.01 / Correct use / Signal rail' });
    label(8, 116, useY + 28, correctLayer, true);
    addText({ text: 'THIS IS THE SYSTEM WORKING.', x: 116, y: useY + 74, size: 21, fill: VOID, target: correctLayer, name: '01.01 / Correct use / Statement', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: wrap(copy(8), 78), x: 116, y: useY + 132, size: 8.6, fill: ASH_700, target: correctLayer, name: `Section 09 / ${section(8)} / Exact governed content`, font: FONTS.bodyMedium });
    label(9, 776, useY + 28, correctLayer);
    addText({ text: 'COSPLAY IS NOT INFRASTRUCTURE.', x: 776, y: useY + 74, size: 19, fill: PAPER, target: correctLayer, name: '01.01 / Misuse / Statement', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: wrap(copy(9), 78), x: 776, y: useY + 132, size: 8.2, fill: ASH_300, target: correctLayer, name: `Section 10 / ${section(9)} / Exact governed content`, font: FONTS.bodyMedium });

    const evidenceY = useY + 330;
    addShape({ x: 80, y: evidenceY, width: 1280, height: 150, fill: PAPER, target: colourLayer, name: '01.01 / Evidence and navigation / Ground' });
    addShape({ x: 80, y: evidenceY, width: 1280, height: 1, fill: ASH_300, target: constructionLayer, name: '01.01 / Evidence and navigation / Top datum' });
    label(10, 80, evidenceY + 26, provenanceLayer, true);
    label(11, 740, evidenceY + 26, provenanceLayer);
    addText({ text: wrap(copy(10), 104), x: 80, y: evidenceY + 58, size: 6.9, fill: ASH_700, target: provenanceLayer, name: `Section 11 / ${section(10)} / Exact governed content`, font: FONTS.bodyMedium });
    addText({ text: wrap(copy(11), 104), x: 740, y: evidenceY + 58, size: 6.9, fill: ASH_700, target: provenanceLayer, name: `Section 12 / ${section(11)} / Exact governed content`, font: FONTS.bodyMedium });
  }

  const gradientRecipeBySubjectId = new Map(gradientManifest.recipes.map((recipe) => [recipe.subjectId, recipe]));
  const exactGradientSubjectIds = ['04.01', '04.02'];
  const unresolvedGradientSubjectIds = ['04.03', '04.04', '04.05', '04.06', '04.07'];

  function governedGradientStudy(subjectId) {
    const recipe = gradientRecipeBySubjectId.get(subjectId);
    if (!recipe || recipe.valueStatus !== 'EXACT SOURCE VALUE' || recipe.stops?.valueStatus !== 'EXACT SOURCE VALUE') {
      throw new Error(`Gradient ${subjectId} is not authorized for numeric rendering`);
    }
    if (recipe.geometry?.kind !== 'linear' || !Number.isFinite(recipe.geometry.angleDeg)) {
      throw new Error(`Gradient ${subjectId} requires an exact linear angle`);
    }
    const colours = recipe.stops.items.map(({ color }) => {
      const colour = parseHex(color);
      if (!colour) throw new Error(`Gradient ${subjectId} contains an invalid governed colour: ${color}`);
      return colour;
    });
    const positions = recipe.stops.items.map(({ positionPercent }) => positionPercent / 100);
    return {
      type: GradientFillType.Linear,
      colours,
      positions,
      angle: recipe.geometry.angleDeg * Math.PI / 180,
      recipe,
    };
  }

  const gradientStudies = Object.fromEntries(
    exactGradientSubjectIds.map((subjectId) => [subjectId, governedGradientStudy(subjectId)]),
  );

  for (const subjectId of unresolvedGradientSubjectIds) {
    const recipe = gradientRecipeBySubjectId.get(subjectId);
    if (!recipe || recipe.valueStatus !== 'NOT VERIFIED' || recipe.stops?.items?.length !== 0) {
      throw new Error(`Gradient ${subjectId} must remain a stop-free derivation contract`);
    }
    if (recipe.geometry?.kind != null || recipe.geometry?.angleDeg != null) {
      throw new Error(`Gradient ${subjectId} must not invent geometry`);
    }
  }

  function addGradientStudy(item, recipe, x, y, width, height, name) {
    const stops = recipe.colours.map((colour, index) => ({
      colour,
      position: recipe.positions?.[index] ?? (recipe.colours.length === 1 ? 0 : index / (recipe.colours.length - 1)),
      midpoint: 0.5,
      smoothness: 0,
    }));
    const descriptor = gradientDescriptor(stops, recipe.type, x, y, width, height, 0, recipe.angle || 0);
    addShape({ x, y, width, height, fill: descriptor, target: item.layers.get('40 / Color, Gradient, Pattern, or Material'), name });
    addShape({ x, y: y + height - 8, width, height: 8, fill: SIGNAL, target: item.layers.get('40 / Color, Gradient, Pattern, or Material'), name: `${name} / Signal is separate, never graded` });
  }

  function addGradientContractCard(item, recipe, x, y, width, height, name) {
    const colourLayer = item.layers.get('40 / Color, Gradient, Pattern, or Material');
    const typeLayer = item.layers.get('30 / Live Type and Metadata');
    const evidenceLayer = item.layers.get('99 / Provenance, Status, Evidence, and Navigation');
    addShape({ x, y, width, height, fill: VOID_RAISED, target: colourLayer, name: `${name} / Solid contract ground / No gradient` });
    addShape({ x, y, width: 8, height, fill: SIGNAL, target: colourLayer, name: `${name} / Flat Signal status rail` });
    addText({
      text: `${recipe.subjectId}  ${recipe.system.toUpperCase().replaceAll('-', ' ')}`,
      x: x + 20,
      y: y + 18,
      size: 10,
      fill: PAPER,
      target: typeLayer,
      name: `${name} / System label`,
      font: FONTS.monoBold,
      tracking: 0.03,
    });
    addText({
      text: 'DERIVATION CONTRACT\nNO STOPS / NO ANGLE',
      x: x + 20,
      y: y + 52,
      size: 12,
      fill: ASH_300,
      target: typeLayer,
      name: `${name} / Unresolved recipe statement`,
      font: FONTS.bodyBold,
    });
    ['INPUT', 'MAP', 'CONTROL', 'FALLBACK'].forEach((label, index) => {
      const rowY = y + 124 + index * 20;
      addShape({ x: x + 20, y: rowY + 7, width: 42 + index * 22, height: 2, fill: index === 2 ? SIGNAL : ASH_500, target: colourLayer, name: `${name} / ${label} contract station` });
      addText({ text: label, x: x + 174, y: rowY, size: 7.5, fill: PAPER, target: typeLayer, name: `${name} / ${label} label`, font: FONTS.monoMedium, tracking: 0.04 });
    });
    addText({
      text: 'NOT VERIFIED',
      x: x + 174,
      y: y + height - 28,
      size: 9,
      fill: SIGNAL,
      target: evidenceLayer,
      name: `${name} / Publication status`,
      font: FONTS.monoBold,
      tracking: 0.06,
    });
  }

  function addUnresolvedGradientContract(item, recipe, x, y, width, height, name) {
    const colourLayer = item.layers.get('40 / Color, Gradient, Pattern, or Material');
    const typeLayer = item.layers.get('30 / Live Type and Metadata');
    const evidenceLayer = item.layers.get('99 / Provenance, Status, Evidence, and Navigation');
    addShape({ x, y, width, height, fill: VOID, target: colourLayer, name: `${name} / Solid contract ground / No gradient` });
    addShape({ x, y, width: 286, height, fill: VOID_RAISED, target: colourLayer, name: `${name} / Contract index field` });
    addShape({ x, y, width: 10, height, fill: SIGNAL, target: colourLayer, name: `${name} / Flat Signal status rail` });
    addText({ text: recipe.subjectId, x: x + 34, y: y + 40, size: 34, fill: SIGNAL, target: typeLayer, name: `${name} / Subject ID`, font: FONTS.displayBold });
    addText({ text: wrap(recipe.name.toUpperCase(), 18), x: x + 34, y: y + 110, size: 20, fill: PAPER, target: typeLayer, name: `${name} / System name`, font: FONTS.bodyBold });
    addText({ text: 'DERIVATION\nCONTRACT', x: x + 34, y: y + 228, size: 14, fill: ASH_300, target: typeLayer, name: `${name} / Contract type`, font: FONTS.monoBold, tracking: 0.06 });
    addText({ text: 'NO NUMERIC STOPS\nNO GEOMETRY\nNOT VERIFIED', x: x + 34, y: y + height - 126, size: 12, fill: SIGNAL, target: evidenceLayer, name: `${name} / Stop-ship status`, font: FONTS.monoBold, tracking: 0.04 });

    const controls = recipe.derivation.requiredControls.join(' ');
    const rows = [
      ['01 / INPUT', recipe.derivation.input],
      ['02 / MAPPING', recipe.derivation.mapping],
      ['03 / REQUIRED CONTROLS', controls],
      ['04 / FALLBACK', recipe.derivation.fallback],
    ];
    const rowX = x + 318;
    const rowWidth = width - 350;
    const rowGap = 18;
    const rowHeight = (height - 54 - rowGap * 3) / 4;
    rows.forEach(([label, copy], index) => {
      const rowY = y + 18 + index * (rowHeight + rowGap);
      addShape({ x: rowX, y: rowY, width: rowWidth, height: rowHeight, fill: VOID_RAISED, target: colourLayer, name: `${name} / ${label} field` });
      addShape({ x: rowX, y: rowY, width: 8, height: rowHeight, fill: index === 2 ? SIGNAL : IRON, target: colourLayer, name: `${name} / ${label} index rail` });
      addText({ text: label, x: rowX + 28, y: rowY + 20, size: 10, fill: index === 2 ? SIGNAL : ASH_300, target: typeLayer, name: `${name} / ${label}`, font: FONTS.monoBold, tracking: 0.05 });
      addText({ text: wrap(copy, 76), x: rowX + 204, y: rowY + 17, size: 13, fill: PAPER, target: typeLayer, name: `${name} / ${label} content`, font: FONTS.bodyMedium });
    });
  }

  async function addReference(item, path, x, y, width, height, label, { hidden = false, classificationOutside = false } = {}) {
    const referenceLayer = item.layers.get('00 / Reference');
    const target = hidden
      ? addContainer(`CONCEPT REFERENCE — NONPUBLISHABLE / ${label}`, referenceLayer, InsertionMode.Inside_AtBack)
      : referenceLayer;
    const bitmap = Bitmap.loadFromFile(path, RasterFormat.RGBA8);
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const actualWidth = bitmap.width * scale;
    const actualHeight = bitmap.height * scale;
    const absoluteX = x + currentOrigin.x;
    const absoluteY = y + currentOrigin.y;
    const definition = ImageNodeDefinition.create(RasterFormat.RGBA8);
    definition.bitmap = bitmap;
    definition.transform = Transform.createTranslate(absoluteX + (width - actualWidth) / 2, absoluteY + (height - actualHeight) / 2).multiply(Transform.createScale(scale));
    definition.userDescription = `CONCEPT REFERENCE — NONPUBLISHABLE / ${label}`;
    const node = addDefinition(definition, target, InsertionMode.Inside_AtBack);
    node.lock();
    const classificationY = classificationOutside ? y - 38 : y;
    addShape({ x, y: classificationY, width, height: 38, fill: SIGNAL, target, name: `Reference classification / ${label}` });
    addText({ text: `CONCEPT REFERENCE — NONPUBLISHABLE  /  ${label}`, x: x + 16, y: classificationY + 12, size: 12, fill: VOID, target, name: `Reference classification label / ${label}`, font: FONTS.monoBold, tracking: 0.04 });
    if (hidden) {
      master.executeCommand(DocumentCommand.createSetVisibility(target.selfSelection, false));
      target.lock();
      return target;
    }
    return node;
  }

  function addAtlasCaption(item, text, x, y, { status = false, fill = null } = {}) {
    addText({
      text,
      x,
      y,
      size: status ? 10 : 12,
      fill: fill || (status ? SIGNAL : PAPER),
      target: item.layers.get(status ? '99 / Provenance, Status, Evidence, and Navigation' : '30 / Live Type and Metadata'),
      name: `Atlas / ${text} / ${status ? 'Status' : 'Caption'}`,
      font: FONTS.monoBold,
      tracking: status ? 0.04 : 0.06,
    });
  }

  async function addAtlasCard(item, { path, box, label, fitMode = 'contain' }) {
    await addExactSvgViewport(item, { path, box, label, fitMode, skipBackground: false });
    addAtlasCaption(item, label, box.x, box.y + box.height + 18);
  }

  function buildContinuousLensConceptGeometry(box, orbitCount, mode, opticalSize = 'normal') {
    const approvedAspect = 600 / 238;
    const aspectDrift = Math.abs(box.width / box.height - approvedAspect);
    if (aspectDrift > 0.01) {
      throw new Error(`Continuous Lens concept reconstruction requires the approved 600:238 viewport ratio, received ${box.width} x ${box.height}`);
    }
    if (!Number.isInteger(orbitCount) || orbitCount < 48) throw new Error('Continuous Lens concept reconstruction requires at least 48 editable orbits');
    const opticalScale = {
      far: 0.72,
      normal: 1,
      close: 1.26,
    }[opticalSize];
    if (!opticalScale) throw new Error(`Unknown Continuous Lens optical size: ${opticalSize}`);
    const aperture = {
      cx: box.x + box.width * 0.64,
      cy: box.y + box.height * 0.45,
      rx: box.width * 0.145 * opticalScale,
      ry: box.height * 0.195 * opticalScale,
      rotation: -14 * Math.PI / 180,
    };
    const maximum = {
      rx: box.width * 0.64 * opticalScale,
      ry: box.height * 0.63 * opticalScale,
      leftShift: box.width * 0.17 * opticalScale,
      downShift: box.height * 0.015 * opticalScale,
    };
    const minimumT = mode === 'material' ? 0.075 : 0.012;
    const orbits = Array.from({ length: orbitCount }, (_, index) => {
      const normalized = orbitCount === 1 ? 1 : index / (orbitCount - 1);
      const t = minimumT + (1 - minimumT) * Math.pow(normalized, 1.1);
      return {
        cx: aperture.cx - maximum.leftShift * t,
        cy: aperture.cy + maximum.downShift * t,
        rx: aperture.rx + (maximum.rx - aperture.rx) * t,
        ry: aperture.ry + (maximum.ry - aperture.ry) * t,
        rotation: aperture.rotation,
        t,
      };
    });

    const family = [aperture, ...orbits];
    for (let index = 0; index < family.length - 1; index += 1) {
      const inner = family[index];
      const outer = family[index + 1];
      if (outer.rx <= inner.rx || outer.ry <= inner.ry || outer.rotation !== inner.rotation) {
        throw new Error(`Continuous Lens orbit family lost monotonic tangent geometry at index ${index}`);
      }
      const cosine = Math.cos(inner.rotation);
      const sine = Math.sin(inner.rotation);
      for (let sample = 0; sample < 360; sample += 1) {
        const angle = sample * Math.PI / 180;
        const x = inner.cx + inner.rx * Math.cos(angle) * cosine - inner.ry * Math.sin(angle) * sine;
        const y = inner.cy + inner.rx * Math.cos(angle) * sine + inner.ry * Math.sin(angle) * cosine;
        const dx = x - outer.cx;
        const dy = y - outer.cy;
        const localX = dx * cosine + dy * sine;
        const localY = -dx * sine + dy * cosine;
        const outerEquation = (localX * localX) / (outer.rx * outer.rx) + (localY * localY) / (outer.ry * outer.ry);
        if (outerEquation >= 0.999999) {
          throw new Error(`Continuous Lens orbit family crosses or touches at index ${index}, sample ${sample}`);
        }
      }
    }
    return { aperture, orbits };
  }

  function addContinuousLensConceptSpecimen(item, box, label, mode, { orbitCount: requestedOrbitCount = null, opticalSize = 'normal' } = {}) {
    const allowedModes = new Set(['shaded-contour', 'grain', 'material', 'one-color']);
    if (!allowedModes.has(mode)) throw new Error(`Unknown Continuous Lens concept mode: ${mode}`);
    const orbitCount = requestedOrbitCount || (mode === 'grain' ? 76 : mode === 'one-color' ? 68 : 60);
    const { aperture, orbits } = buildContinuousLensConceptGeometry(box, orbitCount, mode, opticalSize);
    const target = item.layers.get('20 / Canonical Assets');
    const materialLayer = item.layers.get('40 / Color, Gradient, Pattern, or Material');
    const paperMode = mode === 'one-color';
    const grainMode = mode === 'grain';
    const materialMode = mode === 'material';
    const ground = paperMode ? PAPER : grainMode ? RGBA8(6, 16, 43, 255) : materialMode ? VOID_RAISED : VOID;
    addShape({ ...box, fill: ground, target: materialLayer, name: `${label} / Concept field ground` });

    const conceptSpectrumHex = ['#20274D', '#3156A6', '#4AA5AF', '#5C887C', '#D5A347', '#C96C3E', '#B64C63', '#684F83'];
    if (!paperMode) {
      const washStops = conceptSpectrumHex.map((colourHex, index) => ({
        colour: parseHex(colourHex, grainMode ? 34 : 24),
        position: index / (conceptSpectrumHex.length - 1),
        midpoint: 0.5,
        smoothness: 0,
      }));
      addShape({
        ...box,
        fill: gradientDescriptor(washStops, GradientFillType.Linear, box.x, box.y, box.width, box.height, 0, 0),
        target: materialLayer,
        name: `${label} / Native editable low-salience spectrum wash`,
      });
    }

    const payloadNodes = [];
    orbits.forEach((orbit, index) => {
      const major = index % 8 === 0;
      const edgeFade = Math.max(mode === 'shaded-contour' ? 0.36 : 0.28, 1 - 0.66 * Math.pow(orbit.t, 1.55));
      let stroke = null;
      let strokeFillDescriptor = null;
      if (paperMode) {
        stroke = RGBA8(14, 14, 14, Math.round(255 * edgeFade * (major ? 0.92 : 0.68)));
      } else {
        const alpha = Math.round(255 * edgeFade * (major ? 0.98 : grainMode ? 0.78 : mode === 'shaded-contour' ? 0.78 : 0.70));
        const stops = conceptSpectrumHex.map((colourHex, stopIndex) => ({
          colour: parseHex(colourHex, alpha),
          position: stopIndex / (conceptSpectrumHex.length - 1),
          midpoint: 0.5,
          smoothness: 0,
        }));
        strokeFillDescriptor = gradientDescriptor(stops, GradientFillType.Linear, box.x, box.y, box.width, box.height, 0, 0);
      }
      const dotted = grainMode || (paperMode && !major);
      payloadNodes.push(addSmoothEllipse({
        cx: orbit.cx,
        cy: orbit.cy,
        rx: orbit.rx,
        ry: orbit.ry,
        rotation: orbit.rotation,
        stroke,
        strokeFillDescriptor,
        strokeWidth: major ? (grainMode ? 0.82 : paperMode ? 0.76 : 0.88) : (grainMode ? 0.58 : paperMode ? 0.46 : 0.52),
        target,
        name: `${label} / Native tangent-continuous non-crossing ${dotted ? 'dot orbit' : 'lens orbit'} ${String(index + 1).padStart(2, '0')}`,
        cap: LineCap.Round,
        lineType: dotted ? LineType.Dash : LineType.Solid,
        dashPattern: dotted ? (grainMode ? [0.08, 2.15] : [0.22, 1.18]) : null,
        dashPhase: dotted ? (index % 13) * 0.17 : 0,
      }));
    });

    if (materialMode) {
      const exactOptical = gradientStudies['04.02'];
      const externalMaterial = gradientDescriptor(
        exactOptical.colours.map((colour, index) => ({ colour, position: exactOptical.positions[index], midpoint: 0.5, smoothness: 0 })),
        exactOptical.type,
        aperture.cx - aperture.rx - 7,
        aperture.cy - aperture.ry - 7,
        aperture.rx * 2 + 14,
        aperture.ry * 2 + 14,
        0,
        exactOptical.angle,
      );
      payloadNodes.push(addSmoothEllipse({
        ...aperture,
        rx: aperture.rx + 6,
        ry: aperture.ry + 6,
        fill: externalMaterial,
        target,
        name: `${label} / External-only material rim / Opening geometry unchanged`,
      }));
    }

    payloadNodes.push(addSmoothEllipse({
      ...aperture,
      fill: paperMode ? PAPER : VOID,
      stroke: paperMode ? VOID : RGBA8(249, 248, 242, materialMode ? 150 : grainMode ? 96 : 88),
      strokeWidth: paperMode ? 1.05 : 0.72,
      target,
      name: `${label} / Large smooth Continuous Lens aperture / Unchanged tangent-continuous opening`,
    }));

    const trajectoryAngle = 72 * Math.PI / 180;
    const cosine = Math.cos(aperture.rotation);
    const sine = Math.sin(aperture.rotation);
    const localEndX = aperture.rx * Math.cos(trajectoryAngle);
    const localEndY = aperture.ry * Math.sin(trajectoryAngle);
    const endX = aperture.cx + localEndX * cosine - localEndY * sine;
    const endY = aperture.cy + localEndX * sine + localEndY * cosine;
    const trajectoryColour = paperMode ? VOID : SIGNAL;
    payloadNodes.push(addSmoothCubicPath({
      start: [box.x - 12, box.y + box.height * 0.86],
      control1: [box.x + box.width * 0.27, box.y + box.height * 0.90],
      control2: [box.x + box.width * 0.53, box.y + box.height * 0.72],
      end: [endX, endY],
      stroke: trajectoryColour,
      strokeWidth: paperMode ? 1.15 : 1.45,
      target,
      name: `${label} / Single thin active trajectory / Exactly one path`,
    }));
    payloadNodes.push(addShape({
      x: endX - 4.3,
      y: endY - 4.3,
      width: 8.6,
      height: 8.6,
      fill: trajectoryColour,
      target,
      name: `${label} / Single trajectory datum`,
      shape: ShapeEllipse.create(),
    }));

    const maskNode = addShape({ ...box, fill: PAPER, target, name: `${label} / Approved 600 x 238 concept viewport enclosure` });
    createEditableMaskedGroup({
      name: `${label} / CONCEPT-ONLY EDITABLE CONTINUOUS LENS / NON-CROSSING ORBITS / ONE TRAJECTORY`,
      target,
      payloadNodes,
      maskNode,
    });
  }

  async function addAtlasProvenanceConsole(item) {
    const config = JSON.parse(await readText(SOURCE_PATHS.atlasConfig));
    const atlasManifest = JSON.parse(await readText(SOURCE_PATHS.atlasManifest));
    const configHash = atlasManifest.files?.['generated/config.json']?.sha256;
    if (!configHash || configHash !== 'ad667c8a7fa4078b5b0f4341c5265128a9509306cf5927078b5d856fbd603292') {
      throw new Error('07.01 refuses a provenance console whose governed config hash has drifted');
    }
    const panels = [
      {
        x: 80,
        width: 400,
        title: 'SOURCE / SYNTHETIC',
        content: [
          `MODEL  ${config.renderer.model.name}@${config.renderer.model.version}`,
          `ALGORITHM  ${config.renderer.algorithm.name}@${config.renderer.algorithm.version}`,
          `MASS  ${config.field.mass.x}, ${config.field.mass.y}`,
          `ORIENTATION  ${config.orientationFamily.join(' / ')} DEG`,
          `TRAJECTORY COUNT  ${config.trajectoryCount}`,
        ].join('\n'),
      },
      {
        x: 520,
        width: 400,
        title: 'FIELD / CONFIGURATION',
        content: [
          `COMPRESSION  ${config.field.compressionExponent}`,
          `SPACING  ${config.field.parameters.spacing}`,
          `LARGE SPACING  ${config.field.parameters.spacingByOpticalSize.large}`,
          `LINE COUNTS  ${Object.entries(config.field.parameters.lineCounts).map(([key, value]) => `${key}:${value}`).join(' / ')}`,
          `APERTURE  RATIO ${config.aperture.constructionRatio} / TANGENT ${String(config.aperture.tangentContinuity).toUpperCase()}`,
        ].join('\n'),
      },
      {
        x: 960,
        width: 400,
        title: 'PROVENANCE / EXACT HASHES',
        content: [
          `CONFIG  ${configHash}`,
          `SPECTRAL LARGE  ${atlasManifest.files['generated/atlas-spectral-large.svg'].sha256}`,
          `CONTOURS LARGE  ${atlasManifest.files['generated/atlas-contours-large.svg'].sha256}`,
          `DOTS LARGE  ${atlasManifest.files['generated/atlas-dots-large.svg'].sha256}`,
          `HATCH LARGE  ${atlasManifest.files['generated/atlas-hatch-large.svg'].sha256}`,
        ].join('\n'),
      },
    ];
    for (const panel of panels) {
      addShape({ x: panel.x, y: 430, width: panel.width, height: 620, fill: VOID_RAISED, target: item.layers.get('40 / Color, Gradient, Pattern, or Material'), name: `07.01 / ${panel.title} / Console field` });
      addShape({ x: panel.x, y: 430, width: 10, height: 620, fill: SIGNAL, target: item.layers.get('40 / Color, Gradient, Pattern, or Material'), name: `07.01 / ${panel.title} / Signal rail` });
      addText({ text: panel.title, x: panel.x + 34, y: 466, size: 14, fill: SIGNAL, target: item.layers.get('30 / Live Type and Metadata'), name: `07.01 / ${panel.title}`, font: FONTS.monoBold, tracking: 0.05 });
      addText({ text: wrap(panel.content, panel.x === 960 ? 48 : 43), x: panel.x + 34, y: 536, size: panel.x === 960 ? 9 : 12, fill: PAPER, target: item.layers.get('30 / Live Type and Metadata'), name: `07.01 / ${panel.title} / Live exact values`, font: FONTS.monoMedium, tracking: 0.01 });
    }
    addAtlasCaption(item, 'EXACT CONFIG + MANIFEST VALUES / SYNTHETIC SOURCE DECLARED / NO OBSERVATIONAL CLAIM / NO FIELD ART', 82, 1090, { status: true });
    return 1180;
  }

  async function addAtlasProvisionalPair(item, { referencePath, referenceLabel, mode }) {
    const leftBox = { x: 80, y: 430, width: 600, height: 238 };
    const rightBox = { x: 760, y: 430, width: 600, height: 238 };
    await addReference(item, referencePath, leftBox.x, leftBox.y, leftBox.width, leftBox.height, referenceLabel, { classificationOutside: true });
    addAtlasCaption(item, 'LOCKED IMAGEGEN TARGET / 1991:790-ISH / NONPUBLISHABLE', leftBox.x, 690);

    addContinuousLensConceptSpecimen(item, rightBox, `${referenceLabel} / Native concept reconstruction`, mode);

    addAtlasCaption(item, 'NATIVE EDITABLE CONCEPT CURVES / SAME 600 x 238 VIEWPORT / ONE OPENING / ONE THIN TRAJECTORY', rightBox.x, 690);
    addAtlasCaption(item, 'SAME-INPUT COMPARISON / REFERENCE IS NEVER TRACED / CONCEPT RECONSTRUCTION REMAINS PROVISIONAL + NONPUBLISHABLE', 82, 748, { status: true });
    addAtlasCaption(item, mode === 'material'
      ? 'MATERIAL RESPONSE EXISTS ONLY OUTSIDE THE UNCHANGED OPENING'
      : 'SMOOTH NESTED NON-CROSSING LENS ORBITS / NO CORNERS / NO EXTRA TRACER', 82, 782, { status: true, fill: ASH_300 });
    return 880;
  }

  function addArtifactSectionLabel(item, index, label, x, y, fill = SIGNAL) {
    addText({
      text: `${String(index).padStart(2, '0')} / ${label}`,
      x,
      y,
      size: 11,
      fill,
      target: item.layers.get('30 / Live Type and Metadata'),
      name: `Artifact-first section ${String(index).padStart(2, '0')} / ${label}`,
      font: FONTS.monoBold,
      tracking: 0.07,
    });
  }

  async function addShadedContourArtifactFirstPage(item) {
    const { layers } = item;
    const typeLayer = layers.get('30 / Live Type and Metadata');
    const constructionLayer = layers.get('10 / Construction');
    const colourLayer = layers.get('40 / Color, Gradient, Pattern, or Material');
    const variantsLayer = layers.get('50 / Variants, States, and Optical Sizes');
    const usageLayer = layers.get('60 / Usage and Applications');
    const motionLayer = layers.get('70 / Accessibility, Bilingual, RTL, and Motion');
    const productionLayer = layers.get('80 / Production and Export');
    const rulesLayer = layers.get('90 / Correct Use and Misuse');
    const evidenceLayer = layers.get('99 / Provenance, Status, Evidence, and Navigation');

    addShape({ x: 80, y: 0, width: 1280, height: 6, fill: SIGNAL, target: constructionLayer, name: '07.05 / Artifact-first header / Signal rail' });
    addText({ text: 'BZR / 07 / ASTRONOMICAL ATLAS PATTERNS', x: 80, y: 44, size: 12, fill: SIGNAL, target: typeLayer, name: '07.05 / Artifact-first header / System rail', font: FONTS.monoBold, tracking: 0.09 });
    addText({ text: 'PROVISIONAL v1  /  07.05', x: 1088, y: 44, size: 11, fill: ASH_300, target: typeLayer, name: '07.05 / Artifact-first header / Status rail', font: FONTS.monoMedium, tracking: 0.06 });
    addText({ text: 'SHADED CONTOUR', x: 80, y: 112, size: 62, fill: PAPER, target: typeLayer, name: '07.05 / Artifact-first header / Title', font: FONTS.displayBlack, tracking: -0.03 });
    addText({ text: 'FIELD MAGNITUDE WITHOUT GEOMETRY DRIFT.', x: 82, y: 236, size: 14, fill: ASH_300, target: typeLayer, name: '07.05 / Artifact-first header / Definition', font: FONTS.bodyBold, tracking: 0.02 });
    addText({ text: 'CATCH THE STARS', x: 82, y: 292, size: 18, fill: SIGNAL, target: typeLayer, name: '07.05 / Artifact-first header / Permanent phrase', font: FONTS.displayBold, tracking: -0.02 });
    addShape({ x: 80, y: 356, width: 1280, height: 1, fill: IRON, target: constructionLayer, name: '07.05 / Artifact-first header / Lower datum' });

    addArtifactSectionLabel(item, 1, 'DEFINITION / ONE CONTINUOUS FIELD', 82, 404);
    const heroBox = { x: 80, y: 430, width: 1280, height: 508 };
    addContinuousLensConceptSpecimen(
      item,
      heroBox,
      '07.05 / Artifact-first hero / Native shaded contour',
      'shaded-contour',
      { orbitCount: 60 },
    );
    addShape({
      x: 104,
      y: 456,
      width: 270,
      height: 214,
      fill: RGBA8(14, 14, 14, 224),
      target: colourLayer,
      name: '07.05 / Hero rule console',
    });
    addText({
      text: 'SHADED CONTOUR\n\nONE CONTINUOUS FIELD.\nNO CROSSINGS.\nONE CAPTURE TRAJECTORY.\nONE DATUM POINT.',
      x: 128,
      y: 486,
      size: 13,
      fill: PAPER,
      target: typeLayer,
      name: '07.05 / Hero rule console / Live type',
      font: FONTS.monoBold,
      tracking: 0.035,
    });
    addShape({
      x: 104,
      y: 696,
      width: 270,
      height: 96,
      fill: RGBA8(14, 14, 14, 210),
      target: colourLayer,
      name: '07.05 / Hero recognition console',
    });
    addText({
      text: 'BEND  >  ABSENCE  >  SIGNAL\nCATCH THE STARS',
      x: 128,
      y: 724,
      size: 11,
      fill: SIGNAL,
      target: typeLayer,
      name: '07.05 / Hero recognition grammar',
      font: FONTS.monoBold,
      tracking: 0.05,
    });
    addText({
      text: '60 NATIVE EDITABLE ORBITS  /  600:238 APPROVED RATIO  /  SIGNAL LIME REMAINS FLAT',
      x: 104,
      y: 902,
      size: 10,
      fill: ASH_300,
      target: typeLayer,
      name: '07.05 / Hero exact reconstruction rail',
      font: FONTS.monoMedium,
      tracking: 0.04,
    });

    addArtifactSectionLabel(item, 2, 'VARIANTS, MODES, STATES, AND OPTICAL SIZES', 82, 982);
    const proofY = 1010;
    const proofBoxes = [
      { x: 80, mode: 'shaded-contour', opticalSize: 'far', orbitCount: 60, label: 'FAR / WHOLE FIELD' },
      { x: 405, mode: 'shaded-contour', opticalSize: 'normal', orbitCount: 60, label: 'NORMAL / ACTIVE RANGE' },
      { x: 730, mode: 'shaded-contour', opticalSize: 'close', orbitCount: 60, label: 'CLOSE / DETAIL RESOLVE' },
      { x: 1055, mode: 'one-color', opticalSize: 'normal', orbitCount: 60, label: 'ONE-COLOR / PRODUCTION' },
    ];
    for (const proof of proofBoxes) {
      addContinuousLensConceptSpecimen(
        item,
        { x: proof.x, y: proofY, width: 305, height: 120.98 },
        `07.05 / ${proof.label}`,
        proof.mode,
        { orbitCount: proof.orbitCount, opticalSize: proof.opticalSize },
      );
      if (proof.opticalSize === 'far') {
        addShape({
          x: proof.x,
          y: proofY,
          width: 305,
          height: 120.98,
          fill: RGBA8(14, 14, 14, 72),
          target: variantsLayer,
          name: '07.05 / Far state / Native low-salience veil',
        });
      }
      addText({
        text: proof.label,
        x: proof.x,
        y: 1148,
        size: 10,
        fill: proof.mode === 'one-color' ? PAPER : SIGNAL,
        target: typeLayer,
        name: `07.05 / ${proof.label} / Label`,
        font: FONTS.monoBold,
        tracking: 0.05,
      });
    }

    addShape({ x: 80, y: 1260, width: 620, height: 500, fill: PAPER_MUTED, target: constructionLayer, name: '07.05 / Construction plate' });
    addArtifactSectionLabel(item, 3, 'CONSTRUCTION AND SOURCE', 108, 1290, SIGNAL_INK);
    addText({
      text: 'TANGENT-CONTINUOUS OPENING\nFOUR CUBIC SEGMENTS / NO CORNERS',
      x: 108,
      y: 1332,
      size: 13,
      fill: VOID,
      target: typeLayer,
      name: '07.05 / Construction statement',
      font: FONTS.monoBold,
      tracking: 0.03,
    });
    addShape({ x: 112, y: 1536, width: 556, height: 1, fill: ASH_300, target: constructionLayer, name: '07.05 / Construction horizontal axis' });
    addShape({ x: 390, y: 1402, width: 1, height: 264, fill: ASH_300, target: constructionLayer, name: '07.05 / Construction vertical axis' });
    [0, 1, 2].forEach((ring) => addSmoothEllipse({
      cx: 390 - ring * 12,
      cy: 1536 + ring * 2,
      rx: 146 + ring * 34,
      ry: 66 + ring * 22,
      rotation: -14 * Math.PI / 180,
      stroke: ring === 0 ? SIGNAL_INK : ASH_700,
      strokeWidth: ring === 0 ? 2.2 : 1,
      target: constructionLayer,
      name: `07.05 / Construction orbit ${ring + 1} / Smooth nested ellipse`,
    }));
    [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach((angle, index) => {
      const rotation = -14 * Math.PI / 180;
      const px = 390 + 146 * Math.cos(angle) * Math.cos(rotation) - 66 * Math.sin(angle) * Math.sin(rotation);
      const py = 1536 + 146 * Math.cos(angle) * Math.sin(rotation) + 66 * Math.sin(angle) * Math.cos(rotation);
      addShape({
        x: px - 5,
        y: py - 5,
        width: 10,
        height: 10,
        fill: SIGNAL,
        target: constructionLayer,
        name: `07.05 / Tangent join ${index + 1}`,
        shape: ShapeEllipse.create(),
      });
    });
    addText({
      text: 'CENTER 64% / 45%\nRADII 14.5% / 19.5%\nROTATION -14 DEG\nSTATUS PROVISIONAL / NOT FINAL GEOMETRY',
      x: 108,
      y: 1680,
      size: 9,
      fill: ASH_700,
      target: typeLayer,
      name: '07.05 / Provisional geometry values',
      font: FONTS.monoMedium,
      tracking: 0.03,
    });

    addShape({ x: 740, y: 1260, width: 620, height: 500, fill: VOID_RAISED, target: colourLayer, name: '07.05 / Exact token and gradient plate' });
    addArtifactSectionLabel(item, 4, 'EXACT TOKENS, ASSETS, STYLES, AND MATERIAL RECIPE', 768, 1290);
    addText({
      text: 'FIELD MAGNITUDE / NATIVE SEVEN-STOP GRADIENT',
      x: 768,
      y: 1332,
      size: 13,
      fill: PAPER,
      target: typeLayer,
      name: '07.05 / Gradient recipe heading',
      font: FONTS.monoBold,
      tracking: 0.03,
    });
    const exactField = gradientStudies['04.01'];
    const exactFieldDescriptor = gradientDescriptor(
      exactField.colours.map((colour, index) => ({
        colour,
        position: exactField.positions[index],
        midpoint: 0.5,
        smoothness: 0,
      })),
      exactField.type,
      780,
      1398,
      540,
      126,
      0,
      exactField.angle,
    );
    addShape({ x: 780, y: 1398, width: 540, height: 126, fill: exactFieldDescriptor, target: colourLayer, name: '07.05 / Exact field gradient / Seven governed stops' });
    exactField.colours.forEach((colour, index) => {
      const swatchX = 780 + index * 77;
      addShape({ x: swatchX, y: 1550, width: 66, height: 42, fill: colour, target: colourLayer, name: `07.05 / Field stop ${index + 1}` });
      addText({
        text: `${Math.round(exactField.positions[index] * 100)}%`,
        x: swatchX,
        y: 1604,
        size: 8,
        fill: ASH_300,
        target: typeLayer,
        name: `07.05 / Field stop ${index + 1} / Position`,
        font: FONTS.monoMedium,
      });
    });
    addShape({ x: 780, y: 1664, width: 540, height: 12, fill: SIGNAL, target: colourLayer, name: '07.05 / Flat Signal Lime channel / Never interpolated' });
    addText({
      text: 'SIGNAL LIME / FLAT CHANNEL / NEVER INTERPOLATED',
      x: 780,
      y: 1696,
      size: 10,
      fill: SIGNAL,
      target: typeLayer,
      name: '07.05 / Signal Lime rule',
      font: FONTS.monoBold,
      tracking: 0.05,
    });

    addShape({ x: 80, y: 1810, width: 1280, height: 420, fill: VOID_RAISED, target: motionLayer, name: '07.05 / Motion sequence field' });
    addArtifactSectionLabel(item, 5, 'MOTION AND INTERACTION', 108, 1840);
    const motionStates = [
      ['APPROACH', '00-32%', 0.12],
      ['COMPRESS', '32-55%', 0.36],
      ['ECLIPSE', '55-72%', 0.58],
      ['LOCK', '72-88%', 0.82],
      ['RELEASE', '88-100%', 1],
    ];
    motionStates.forEach(([label, range, progress], index) => {
      const x = 100 + index * 246;
      addShape({ x, y: 1884, width: 220, height: 300, fill: VOID, target: motionLayer, name: `07.05 / Motion frame ${index + 1} / ${label}` });
      [0, 1, 2, 3].forEach((ring) => addSmoothEllipse({
        cx: x + 126 - ring * 4,
        cy: 1994 + ring,
        rx: 34 + ring * 17,
        ry: 18 + ring * 10,
        rotation: -14 * Math.PI / 180,
        stroke: ring === 0 ? PAPER : ring === 3 ? ASH_700 : IRON,
        strokeWidth: ring === 0 ? 1.2 : 0.8,
        target: motionLayer,
        name: `07.05 / ${label} / Field ring ${ring + 1}`,
      }));
      const endX = x + 28 + progress * 98;
      const endY = 2104 - progress * 92;
      addSmoothCubicPath({
        start: [x + 18, 2110],
        control1: [x + 72, 2110],
        control2: [x + 104, 2054],
        end: [endX, endY],
        stroke: SIGNAL,
        strokeWidth: 2,
        target: motionLayer,
        name: `07.05 / ${label} / One phase trajectory`,
      });
      addShape({
        x: endX - 4,
        y: endY - 4,
        width: 8,
        height: 8,
        fill: SIGNAL,
        target: motionLayer,
        name: `07.05 / ${label} / Phase datum`,
        shape: ShapeEllipse.create(),
      });
      addText({
        text: `${label}\n${range}`,
        x: x + 18,
        y: 2140,
        size: 10,
        fill: index === 3 ? SIGNAL : PAPER,
        target: typeLayer,
        name: `07.05 / ${label} / Motion label`,
        font: FONTS.monoBold,
        tracking: 0.04,
      });
    });

    addShape({ x: 80, y: 2270, width: 620, height: 470, fill: VOID_RAISED, target: motionLayer, name: '07.05 / Accessibility and bilingual behavior plate' });
    addArtifactSectionLabel(item, 6, 'ACCESSIBILITY, BILINGUAL BEHAVIOR, AND RTL', 98, 2300);
    addContinuousLensConceptSpecimen(
      item,
      { x: 90, y: 2346, width: 600, height: 238 },
      '07.05 / Accessible dark normal state',
      'shaded-contour',
      { orbitCount: 60 },
    );
    addText({
      text: 'EN + AR COMPOSITION MAY REORDER / PHYSICAL FIELD AND GRAVITY WELL NEVER MIRROR',
      x: 98,
      y: 2612,
      size: 9,
      fill: ASH_300,
      target: typeLayer,
      name: '07.05 / RTL behavior rule',
      font: FONTS.monoBold,
      tracking: 0.035,
    });

    addShape({ x: 740, y: 2270, width: 620, height: 470, fill: PAPER, target: productionLayer, name: '07.05 / Production and export plate' });
    addArtifactSectionLabel(item, 7, 'PRODUCTION AND EXPORT', 758, 2300, SIGNAL_INK);
    addContinuousLensConceptSpecimen(
      item,
      { x: 750, y: 2346, width: 600, height: 238 },
      '07.05 / One-color production proof',
      'one-color',
      { orbitCount: 60 },
    );
    [1, 2, 4].forEach((weight, index) => {
      addShape({
        x: 768,
        y: 2620 + index * 27,
        width: 350 - index * 66,
        height: weight,
        fill: VOID,
        target: productionLayer,
        name: `07.05 / Production line-weight proof ${weight}px`,
      });
      addText({
        text: `${weight}PX`,
        x: 1144,
        y: 2608 + index * 27,
        size: 9,
        fill: ASH_700,
        target: typeLayer,
        name: `07.05 / Production line-weight label ${weight}px`,
        font: FONTS.monoBold,
      });
    });

    addShape({ x: 80, y: 2790, width: 620, height: 430, fill: VOID_RAISED, target: rulesLayer, name: '07.05 / Correct example plate' });
    addArtifactSectionLabel(item, 8, 'CORRECT EXAMPLES', 98, 2820);
    addContinuousLensConceptSpecimen(
      item,
      { x: 90, y: 2866, width: 600, height: 238 },
      '07.05 / Correct smooth field example',
      'shaded-contour',
      { orbitCount: 60 },
    );
    addText({
      text: 'DO / KEEP THE OPENING SMOOTH, LARGE, AND UNCHANGED',
      x: 98,
      y: 3136,
      size: 10,
      fill: SIGNAL,
      target: typeLayer,
      name: '07.05 / Correct example rule',
      font: FONTS.monoBold,
      tracking: 0.05,
    });

    addShape({ x: 740, y: 2790, width: 620, height: 430, fill: VOID_RAISED, target: rulesLayer, name: '07.05 / Misuse plate' });
    addArtifactSectionLabel(item, 9, 'MISUSE', 758, 2820);
    addContinuousLensConceptSpecimen(
      item,
      { x: 750, y: 2866, width: 600, height: 238 },
      '07.05 / Misuse base field / Deliberately obstructed below',
      'shaded-contour',
      { orbitCount: 60 },
    );
    addShape({
      x: 1060,
      y: 2866,
      width: 112,
      height: 238,
      fill: VOID,
      target: rulesLayer,
      name: '07.05 / Forbidden hard crop through aperture',
    });
    addShape({ x: 750, y: 3084, width: 600, height: 20, fill: SIGNAL, target: rulesLayer, name: '07.05 / Forbidden status rail' });
    addText({
      text: 'DO NOT / CROP, CHAMFER, NOTCH, OR SHARPEN THE OPENING',
      x: 758,
      y: 3136,
      size: 10,
      fill: SIGNAL,
      target: typeLayer,
      name: '07.05 / Misuse rule',
      font: FONTS.monoBold,
      tracking: 0.045,
    });

    addArtifactSectionLabel(item, 10, 'USAGE AND APPLICATIONS', 82, 3260);
    const applications = [
      { x: 80, ground: VOID, mode: 'shaded-contour', title: 'POSTER / FIELD' },
      { x: 520, ground: PAPER, mode: 'one-color', title: 'UI HEADER / REDUCED' },
      { x: 960, ground: VOID_RAISED, mode: 'shaded-contour', title: 'PIT DISPLAY / HIGH CONTRAST' },
    ];
    for (const application of applications) {
      const light = application.ground === PAPER;
      addShape({ x: application.x, y: 3290, width: 400, height: 390, fill: application.ground, target: usageLayer, name: `07.05 / Application composition / ${application.title}` });
      addContinuousLensConceptSpecimen(
        item,
        { x: application.x + 20, y: 3310, width: 360, height: 142.8 },
        `07.05 / ${application.title} / Field`,
        application.mode,
        { orbitCount: 60 },
      );
      addText({
        text: 'CATCH\nTHE\nSTARS',
        x: application.x + 24,
        y: 3480,
        size: 25,
        fill: light ? VOID : PAPER,
        target: typeLayer,
        name: `07.05 / ${application.title} / Catch the Stars`,
        font: FONTS.displayBold,
        tracking: -0.02,
      });
      addShape({
        x: application.x + 24,
        y: 3630,
        width: 352,
        height: 8,
        fill: SIGNAL,
        target: usageLayer,
        name: `07.05 / ${application.title} / Flat Signal rail`,
      });
      addText({
        text: application.title,
        x: application.x + 24,
        y: 3652,
        size: 9,
        fill: light ? SIGNAL_INK : SIGNAL,
        target: typeLayer,
        name: `07.05 / ${application.title} / Application label`,
        font: FONTS.monoBold,
        tracking: 0.05,
      });
    }

    addArtifactSectionLabel(item, 11, 'PROVENANCE, HASHES, STATUS, AND EVIDENCE', 82, 3720);
    await addReference(
      item,
      SOURCE_PATHS.referenceShadedArtifactFirst,
      80,
      3760,
      600,
      300,
      '07.05 / IMAGEGEN ARTIFACT-FIRST TARGET / NONPUBLISHABLE',
    );
    addContinuousLensConceptSpecimen(
      item,
      { x: 760, y: 3760, width: 600, height: 238 },
      '07.05 / Native Affinity reconstruction / Same-input QA',
      'shaded-contour',
      { orbitCount: 60 },
    );
    addText({
      text: 'NATIVE EDITABLE RECONSTRUCTION / 60 ORBITS / ONE APERTURE / ONE TRAJECTORY',
      x: 760,
      y: 4018,
      size: 9,
      fill: SIGNAL,
      target: evidenceLayer,
      name: '07.05 / Same-input QA caption',
      font: FONTS.monoBold,
      tracking: 0.035,
    });
    const chain = [
      'IMAGEGEN TARGET\nLOCKED / NONPUBLISHABLE',
      'AFFINITY MASTER\nNATIVE / EDITABLE',
      'FIGMA PAGE\nMIRRORED / COMPONENTIZED',
      'PRODUCTION\nEVIDENCE BEFORE RELEASE',
    ];
    chain.forEach((label, index) => {
      const x = 80 + index * 320;
      addShape({ x, y: 4070, width: 280, height: 86, fill: index === 1 ? SIGNAL : IRON, target: evidenceLayer, name: `07.05 / Provenance chain ${index + 1}` });
      addText({
        text: label,
        x: x + 18,
        y: 4090,
        size: 9,
        fill: index === 1 ? VOID : PAPER,
        target: typeLayer,
        name: `07.05 / Provenance chain ${index + 1} / Label`,
        font: FONTS.monoBold,
        tracking: 0.035,
      });
      if (index < chain.length - 1) addShape({ x: x + 280, y: 4109, width: 40, height: 8, fill: SIGNAL, target: evidenceLayer, name: `07.05 / Provenance chain connector ${index + 1}` });
    });
    addArtifactSectionLabel(item, 12, 'PARENT AND SIBLING LINKS / 07.00 > 07.04 > 07.05 > 07.06', 82, 4170, ASH_300);
    addShape({ x: 80, y: 4210, width: 1280, height: 1, fill: IRON, target: evidenceLayer, name: '07.05 / Artifact-first footer / Datum' });
    addText({ text: 'CATCH THE STARS  /  MAKE THE DISTANT TANGIBLE', x: 80, y: 4242, size: 11, fill: SIGNAL, target: evidenceLayer, name: '07.05 / Artifact-first footer / Permanent phrase', font: FONTS.monoBold, tracking: 0.08 });
    addText({ text: 'PROVISIONAL  /  NOT PUBLISHABLE  /  r25', x: 1060, y: 4242, size: 10, fill: ASH_300, target: evidenceLayer, name: '07.05 / Artifact-first footer / Status', font: FONTS.monoMedium, tracking: 0.05 });
    return 4188;
  }

  async function addHardwarePanelArtifactFirstPage(item) {
    const { layers } = item;
    const colourLayer = layers.get('40 / Color, Gradient, Pattern, or Material');
    const assetLayer = layers.get('20 / Canonical Assets');
    const typeLayer = layers.get('30 / Live Type and Metadata');
    const constructionLayer = layers.get('10 / Construction');
    const usageLayer = layers.get('60 / Usage and Applications');
    const accessLayer = layers.get('70 / Accessibility, Bilingual, RTL, and Motion');
    const productionLayer = layers.get('80 / Production and Export');
    const misuseLayer = layers.get('90 / Correct Use and Misuse');
    const evidenceLayer = layers.get('99 / Provenance, Status, Evidence, and Navigation');
    const heroBox = { x: 80, y: 430, width: 1280, height: 853 };
    const photoBitmap = Bitmap.loadFromFile(SOURCE_PATHS.realHardwarePhoto, RasterFormat.RGBA8);
    const instrumentDialPath = `${REPO_ATLAS_GENERATED}/instrument-dial.svg`;
    const materialTokenPath = String(globalThis.__BIZARRE_MATERIAL_TOKENS__ || '');
    const paletteTokenPath = String(globalThis.__BIZARRE_PALETTE_TOKENS__ || '');
    if (!materialTokenPath || !paletteTokenPath) throw new Error('Missing required token source paths');
    const materialTokenDocument = JSON.parse(await readText(materialTokenPath));
    const paletteTokenDocument = JSON.parse(await readText(paletteTokenPath));
    const materialEvidenceBoundary = new Map([
      ['matte-void', 'FINISH / NOT VERIFIED'],
      ['gloss-void', 'GLOSS LEVEL / NOT VERIFIED'],
      ['aluminum', 'FINISH / NOT VERIFIED'],
      ['brushed-aluminum', 'BRUSH DIRECTION + FINISH / NOT VERIFIED'],
      ['carbon', 'MATERIAL CONSTRUCTION / NOT VERIFIED'],
      ['bakelite', 'MATERIAL SAMPLE / NOT VERIFIED'],
      ['signal-spot', 'PRINT SPOT MATCH / NOT VERIFIED'],
    ]);

    function resolveTokenHex(value) {
      if (value && typeof value === 'object' && typeof value.hex === 'string') return value.hex.toUpperCase();
      if (typeof value === 'string' && /^\{[^}]+\}$/.test(value)) {
        const path = value.slice(1, -1).split('.');
        let resolved = paletteTokenDocument;
        for (const segment of path) resolved = resolved?.[segment];
        if (!resolved || !Object.prototype.hasOwnProperty.call(resolved, '$value')) throw new Error(`Unresolved material token alias: ${value}`);
        return resolveTokenHex(resolved.$value);
      }
      throw new Error(`Unsupported material token value: ${JSON.stringify(value)}`);
    }

    const materialTokens = Object.entries(materialTokenDocument.material || {})
      .filter(([name, token]) => name !== '$type' && token && Object.prototype.hasOwnProperty.call(token, '$value'))
      .map(([name, token]) => {
        const hex = resolveTokenHex(token.$value);
        return [`material.${name}`, hex, parseHex(hex), materialEvidenceBoundary.get(name) || 'PHYSICAL EVIDENCE / NOT VERIFIED'];
      });
    const materialColourByName = new Map(materialTokens.map(([token, , fill]) => [token.slice('material.'.length), fill]));
    for (const requiredName of materialEvidenceBoundary.keys()) {
      if (!materialColourByName.has(requiredName)) throw new Error(`Missing exact material token: material.${requiredName}`);
    }

    function addPhotoCrop(target, box, sourceCrop, name, lock = false) {
      const scale = Math.max(box.width / sourceCrop.width, box.height / sourceCrop.height);
      const imageDefinition = ImageNodeDefinition.create(RasterFormat.RGBA8);
      imageDefinition.bitmap = photoBitmap;
      imageDefinition.transform = Transform.createTranslate(
        box.x - sourceCrop.x * scale + currentOrigin.x,
        box.y - sourceCrop.y * scale + currentOrigin.y,
      ).multiply(Transform.createScale(scale));
      imageDefinition.userDescription = `${name} / Licensed photograph payload`;
      const imageNode = addDefinition(imageDefinition, target, InsertionMode.Inside_AtBack);
      const maskNode = addShape({ ...box, fill: PAPER, target, name: `${name} / Editable crop enclosure` });
      const group = createEditableMaskedGroup({
        name,
        target,
        payloadNodes: [imageNode],
        maskNode,
        mode: InsertionMode.Inside_AtBack,
      });
      if (lock) group.lock();
      return group;
    }

    function applyEditableRotation(node, box, rotationDeg) {
      const pivotX = box.x + box.width / 2 + currentOrigin.x;
      const pivotY = box.y + box.height / 2 + currentOrigin.y;
      const transform = Transform.createTranslate(pivotX, pivotY)
        .multiply(Transform.createRotate(rotationDeg * Math.PI / 180))
        .multiply(Transform.createTranslate(-pivotX, -pivotY));
      const freshSelection = Selection.create(master, [node], true);
      master.executeCommand(DocumentCommand.createTransform(freshSelection, transform, { correctChildren: true }));
    }

    async function addClippedHardwareField({
      target,
      box,
      ground,
      inkOverride = null,
      namePrefix,
    }) {
      const fieldPayload = [addShape({
        ...box,
        fill: ground,
        target,
        name: `${namePrefix} / Field window substrate`,
      })];
      fieldPayload.push(...await addSvgVector({
        path: SOURCE_PATHS.atlasContoursLarge,
        target,
        box,
        namePrefix: `${namePrefix} / atlasContoursLarge / Exact source geometry`,
        overrideFill: inkOverride,
        overrideStroke: inkOverride,
        skipBackground: true,
      }));
      const fieldMask = addShape({
        ...box,
        fill: PAPER,
        target,
        name: `${namePrefix} / Editable rectangular field enclosure`,
      });
      return createEditableMaskedGroup({
        name: `${namePrefix} / Exact clipped field window`,
        target,
        payloadNodes: fieldPayload,
        maskNode: fieldMask,
        mode: InsertionMode.Inside_AtBack,
      });
    }

    async function addHardwareCalibrationLabel({
      box,
      variant = 'paper',
      namePrefix,
      target = assetLayer,
      shadow = false,
    }) {
      const unit = box.width / 370;
      const signalSpot = materialColourByName.get('signal-spot');
      const configurations = {
        paper: { ground: PAPER, ink: VOID, anchor: signalSpot, mark: '#0E0E0E', status: 'READY / V01', field: 'exact' },
        black: { ground: materialColourByName.get('gloss-void'), ink: PAPER, anchor: signalSpot, mark: '#0E0E0E', logoPlaque: signalSpot, status: 'BLACK / READY', field: 'exact' },
        aluminum: { ground: materialColourByName.get('aluminum'), ink: VOID, anchor: signalSpot, mark: '#0E0E0E', logoPlaque: PAPER, status: 'ALUMINUM / NV', field: 'exact' },
        composite: { ground: materialColourByName.get('carbon'), ink: PAPER, anchor: signalSpot, mark: '#0E0E0E', logoPlaque: signalSpot, status: 'COMPOSITE / NV', field: 'exact' },
        active: { ground: PAPER, ink: VOID, anchor: signalSpot, mark: '#0E0E0E', status: 'ACTIVE / READY', field: 'exact' },
        inactive: { ground: PAPER, ink: VOID, anchor: ASH_500, mark: '#0E0E0E', status: 'INACTIVE / HOLD', field: 'exact' },
        bilingual: { ground: PAPER, ink: VOID, anchor: signalSpot, mark: '#0E0E0E', status: 'ARABIC SLOT / INTERIM', field: 'exact' },
        worn: { ground: PAPER_MUTED, ink: VOID, anchor: signalSpot, mark: '#0E0E0E', logoPlaque: PAPER, status: 'WORN / SAMPLE NV', field: 'exact', worn: true },
        'service-open': { ground: PAPER, ink: VOID, anchor: signalSpot, mark: '#0E0E0E', status: 'SERVICE OPEN', field: 'exact', serviceOpen: true },
        'one-colour': { ground: PAPER, ink: VOID, anchor: VOID, mark: '#0E0E0E', status: 'K ONLY', field: 'mono-k' },
        'proof-k': { ground: PAPER, ink: VOID, anchor: VOID, mark: '#0E0E0E', status: 'K SEPARATION', field: 'mono-k', proof: 'k' },
        'proof-spot': { ground: VOID, ink: signalSpot, anchor: signalSpot, mark: '#0E0E0E', logoPlaque: signalSpot, status: 'SPOT SEPARATION', field: 'mono-signal', proof: 'spot' },
        'proof-cut': { ground: PAPER, ink: VOID, anchor: ASH_700, mark: '#0E0E0E', status: 'CUT OUTLINE', proof: 'cut' },
        'proof-footprint': { ground: ASH_300, ink: VOID, anchor: PAPER, mark: '#0E0E0E', status: 'LAMINATE / PSA', proof: 'footprint' },
      };
      const config = configurations[variant];
      if (!config) throw new Error(`Unsupported 11.05 calibration-label variant: ${variant}`);
      const group = addContainer(`${namePrefix} / Reusable editable calibration-label group`, target, InsertionMode.Inside_AtBack);
      const fieldWidth = box.width * 0.34;
      const fieldBox = {
        x: box.x + box.width * 0.045,
        y: box.y + box.height * 0.14,
        width: fieldWidth,
        height: fieldWidth * 349 / 620,
      };
      const railHeight = Math.max(4, box.height * 0.09);
      const textX = box.x + box.width * 0.43;
      const titleY = box.y + box.height * 0.14;
      const markSize = Math.max(10, box.height * 0.22);
      const fieldFits = box.width >= 96 && box.height >= 48 && !['cut', 'footprint'].includes(config.proof);
      const statusInk = config.anchor === signalSpot || config.anchor === PAPER || config.anchor === PAPER_MUTED
        ? VOID
        : PAPER;

      if (shadow) addShape({ x: box.x + 3, y: box.y + 3, width: box.width, height: box.height, fill: RGBA8(0, 0, 0, 48), target: group, name: `${namePrefix} / Contact shadow / 3 px / 18.8 percent` });
      addShape({ ...box, fill: config.ground, target: group, name: `${namePrefix} / Substrate` });

      if (fieldFits) {
        await addClippedHardwareField({
          target: group,
          box: fieldBox,
          ground: config.field === 'mono-k' ? PAPER : VOID,
          inkOverride: config.field === 'mono-k' ? '#0E0E0E' : config.field === 'mono-signal' ? '#C6FF24' : null,
          namePrefix: `${namePrefix} / Exact atlasContoursLarge field window`,
        });
      }

      if (config.proof === 'cut') {
        addLinePath({
          points: [[box.x + 4, box.y + 4], [box.x + box.width - 4, box.y + 4], [box.x + box.width - 4, box.y + box.height - 4], [box.x + 4, box.y + box.height - 4], [box.x + 4, box.y + 4]],
          stroke: VOID,
          strokeWidth: Math.max(1, unit),
          target: group,
          name: `${namePrefix} / Actual cut-outline separation`,
        });
      }
      if (config.proof === 'footprint') {
        addShape({ x: box.x + 5, y: box.y + 5, width: box.width - 10, height: box.height - 10, fill: PAPER_MUTED, target: group, name: `${namePrefix} / Laminate footprint` });
        addShape({ x: box.x + 10, y: box.y + 10, width: box.width - 20, height: box.height - 20, fill: ASH_500, target: group, name: `${namePrefix} / PSA footprint / Specification not verified` });
      }
      if (config.worn) {
        [0.16, 0.51, 0.78].forEach((fraction, index) => addShape({
          x: box.x + box.width * fraction,
          y: box.y + box.height * (0.22 + index * 0.13),
          width: box.width * (0.07 + index * 0.015),
          height: Math.max(1, unit),
          fill: RGBA8(112, 112, 112, 92),
          target: group,
          name: `${namePrefix} / Worn-state deterministic abrasion ${index + 1}`,
        }));
      }
      if (config.serviceOpen) {
        addShape({ x: box.x + box.width * 0.82, y: box.y, width: box.width * 0.05, height: box.height - railHeight, fill: VOID, target: group, name: `${namePrefix} / Service-open state flag` });
      }

      addShape({ x: box.x, y: box.y + box.height - railHeight, width: box.width, height: railHeight, fill: config.anchor, target: group, name: `${namePrefix} / Status rail` });
      addShape({ x: box.x + 2, y: box.y + 2, width: box.width - 4, height: Math.max(1, 1.5 * unit), fill: RGBA8(255, 255, 255, 42), target: group, name: `${namePrefix} / Surface highlight / Top` });
      addShape({ x: box.x + 2, y: box.y + 3, width: Math.max(1, unit), height: box.height - railHeight - 6, fill: RGBA8(255, 255, 255, 28), target: group, name: `${namePrefix} / Surface highlight / Edge` });
      if (!['spot', 'cut', 'footprint'].includes(config.proof)) {
        addText({ text: 'BZR / CAL', x: textX, y: titleY, size: Math.max(4, 11 * unit), fill: config.ink, target: group, name: `${namePrefix} / Live title`, font: FONTS.stencilBold, tracking: 0.025 });
        addText({
          text: variant === 'bilingual'
            ? 'SOURCE / SYNTHETIC\nARABIC SLOT / INTERIM'
            : 'SOURCE / SYNTHETIC\nSEED / 1105-260716',
          x: textX,
          y: box.y + box.height * 0.39,
          size: Math.max(2.7, 5.6 * unit),
          fill: config.ink,
          target: group,
          name: `${namePrefix} / Live source metadata`,
          font: FONTS.monoBold,
          tracking: 0.03,
        });
        const markBox = {
          x: box.x + box.width - markSize - box.width * 0.045,
          y: box.y + box.height * 0.14,
          width: markSize,
          height: markSize,
        };
        if (config.logoPlaque) {
          const plaquePad = Math.max(2, unit * 3);
          addShape({
            x: markBox.x - plaquePad,
            y: markBox.y - plaquePad,
            width: markBox.width + plaquePad * 2,
            height: markBox.height + plaquePad * 2,
            fill: config.logoPlaque,
            target: group,
            name: `${namePrefix} / Approved one-color logo context plaque`,
          });
        }
        await addSvgVector({
          path: SOURCE_PATHS.markPrimary,
          target: group,
          box: markBox,
          namePrefix: `${namePrefix} / Exact original Gravity Well / Monochrome only`,
          overrideFill: config.mark,
        });
      }
      addText({ text: config.status, x: box.x + box.width * 0.045, y: box.y + box.height - railHeight * 0.92, size: Math.max(2.5, 5.2 * unit), fill: statusInk, target: group, name: `${namePrefix} / Live status rail copy`, font: FONTS.monoBold, tracking: 0.045 });
      return group;
    }

    async function addExactInstrumentDial(target, box, namePrefix) {
      const source = await readText(instrumentDialPath);
      const rootAttributes = parseAttributes(source.match(/<svg\b[^>]*>/i)?.[0] || '');
      const [viewX, viewY, viewWidth, viewHeight] = (rootAttributes.viewBox || '0 0 900 900').split(/\s+/).map(Number);
      const scale = Math.min(box.width / viewWidth, box.height / viewHeight);
      const offsetX = box.x + (box.width - viewWidth * scale) / 2 - viewX * scale;
      const offsetY = box.y + (box.height - viewHeight * scale) / 2 - viewY * scale;
      const group = addContainer(`${namePrefix} / Exact instrument-dial.svg / Native`, target, InsertionMode.Inside_AtBack);

      for (const tag of source.match(/<rect\b[^>]*>/gi) || []) {
        const attributes = parseAttributes(tag);
        addShape({ x: offsetX + Number(attributes.x || 0) * scale, y: offsetY + Number(attributes.y || 0) * scale, width: Number(attributes.width) * scale, height: Number(attributes.height) * scale, fill: parseHex(attributes.fill), target: group, name: `${namePrefix} / Exact housing` });
      }
      for (const tag of source.match(/<circle\b[^>]*data-layer=["']dial-face["'][^>]*>/gi) || []) {
        const attributes = parseAttributes(tag);
        addSmoothEllipse({
          cx: offsetX + Number(attributes.cx) * scale,
          cy: offsetY + Number(attributes.cy) * scale,
          rx: Number(attributes.r) * scale,
          ry: Number(attributes.r) * scale,
          fill: parseHex(attributes.fill),
          stroke: parseHex(attributes.stroke),
          strokeWidth: Number(attributes['stroke-width'] || 1) * scale,
          target: group,
          name: `${namePrefix} / Exact dial face`,
        });
      }
      for (const [index, tag] of (source.match(/<line\b[^>]*>/gi) || []).entries()) {
        const attributes = parseAttributes(tag);
        const builder = require('/geometry').CurveBuilder.create()
          .beginXY(offsetX + Number(attributes.x1) * scale + currentOrigin.x, offsetY + Number(attributes.y1) * scale + currentOrigin.y);
        builder.lineToXY(offsetX + Number(attributes.x2) * scale + currentOrigin.x, offsetY + Number(attributes.y2) * scale + currentOrigin.y);
        addPolyCurve({
          curves: [builder.createCurve()],
          fill: null,
          stroke: parseHex(attributes.stroke),
          strokeWidth: Number(attributes['stroke-width'] || 1) * scale,
          target: group,
          name: `${namePrefix} / Exact dial index ${String(index + 1).padStart(2, '0')}`,
          cap: attributes['stroke-linecap'] === 'round' ? LineCap.Round : LineCap.Butt,
        });
      }
      await addSvgVector({ path: instrumentDialPath, target: group, box, namePrefix: `${namePrefix} / Exact SVG paths`, includeCircles: false, skipBackground: true });
      for (const tag of source.match(/<circle\b[^>]*data-layer=["']signal-trajectory["'][^>]*>/gi) || []) {
        const attributes = parseAttributes(tag);
        addSmoothEllipse({ cx: offsetX + Number(attributes.cx) * scale, cy: offsetY + Number(attributes.cy) * scale, rx: Number(attributes.r) * scale, ry: Number(attributes.r) * scale, fill: parseHex(attributes.fill), target: group, name: `${namePrefix} / Exact terminal datum` });
      }
      return group;
    }

    async function addHardwareProductionSeparation(target, box, channel, namePrefix) {
      const group = addContainer(`${namePrefix} / Dedicated ${channel} production separation`, target, InsertionMode.Inside_AtBack);
      if (channel === 'K') {
        addShape({ ...box, fill: PAPER, target: group, name: `${namePrefix} / Paper viewing substrate / Not ink` });
        await addClippedHardwareField({
          target: group,
          box: { x: box.x + 8, y: box.y + 8, width: box.width * 0.48, height: box.height - 16 },
          ground: PAPER,
          inkOverride: '#0E0E0E',
          namePrefix: `${namePrefix} / Pure K field`,
        });
        addText({ text: 'BZR / CAL\nK ONLY', x: box.x + box.width * 0.55, y: box.y + 11, size: Math.max(4, box.width * 0.035), fill: VOID, target: group, name: `${namePrefix} / Pure K live type`, font: FONTS.monoBold, tracking: 0.03 });
        await addSvgVector({
          path: SOURCE_PATHS.markPrimary,
          target: group,
          box: { x: box.x + box.width * 0.76, y: box.y + box.height * 0.50, width: box.height * 0.30, height: box.height * 0.30 },
          namePrefix: `${namePrefix} / Pure K exact original Gravity Well`,
          overrideFill: '#0E0E0E',
        });
      } else if (channel === 'SPOT') {
        addShape({ ...box, fill: VOID, target: group, name: `${namePrefix} / Void viewing substrate / Not ink` });
        await addClippedHardwareField({
          target: group,
          box: { x: box.x + 8, y: box.y + 8, width: box.width - 16, height: box.height - 26 },
          ground: VOID,
          inkOverride: '#C6FF24',
          namePrefix: `${namePrefix} / Pure Signal spot field`,
        });
        addShape({ x: box.x + 8, y: box.y + box.height - 12, width: box.width - 16, height: 4, fill: SIGNAL, target: group, name: `${namePrefix} / Pure Signal spot rail` });
      } else if (channel === 'CUT') {
        addShape({ ...box, fill: PAPER, target: group, name: `${namePrefix} / Paper viewing substrate / Not tooling` });
        addLinePath({
          points: [[box.x + 8, box.y + 8], [box.x + box.width - 8, box.y + 8], [box.x + box.width - 8, box.y + box.height - 8], [box.x + 8, box.y + box.height - 8], [box.x + 8, box.y + 8]],
          stroke: VOID,
          strokeWidth: 1.2,
          target: group,
          name: `${namePrefix} / Dedicated closed tooling outline`,
        });
        addText({ text: 'CUT / TOOLING\nNOT ARTWORK', x: box.x + 18, y: box.y + 20, size: Math.max(4, box.width * 0.034), fill: VOID, target: group, name: `${namePrefix} / Tooling live note`, font: FONTS.monoBold, tracking: 0.04 });
      } else if (channel === 'LAMINATE / PSA') {
        addShape({ ...box, fill: PAPER_MUTED, target: group, name: `${namePrefix} / Viewing substrate` });
        addShape({ x: box.x + 8, y: box.y + 8, width: box.width - 16, height: box.height - 16, fill: RGBA8(255, 255, 255, 86), target: group, name: `${namePrefix} / Dedicated laminate footprint` });
        addShape({ x: box.x + 14, y: box.y + 14, width: box.width - 28, height: box.height - 28, fill: ASH_500, target: group, name: `${namePrefix} / Dedicated PSA footprint / Specification not verified` });
        addText({ text: 'FOOTPRINT ONLY', x: box.x + 22, y: box.y + 24, size: Math.max(4, box.width * 0.034), fill: VOID, target: group, name: `${namePrefix} / Footprint live note`, font: FONTS.monoBold, tracking: 0.04 });
      } else {
        throw new Error(`Unsupported 11.05 production separation: ${channel}`);
      }
      return group;
    }

    addShape({ x: 80, y: 0, width: 1280, height: 6, fill: SIGNAL, target: constructionLayer, name: '11.05 / Header / Signal datum' });
    addText({ text: 'BZR / 11 / APPLICATION DETAIL', x: 80, y: 48, size: 13, fill: SIGNAL, target: typeLayer, name: '11.05 / Header / System rail', font: FONTS.monoBold, tracking: 0.10 });
    addText({ text: 'VERIFICATION / NOT VERIFIED  /  EXPORT / NONPUBLISHABLE', x: 920, y: 48, size: 10, fill: ASH_300, target: typeLayer, name: '11.05 / Header / Verification status', font: FONTS.monoMedium, tracking: 0.05 });
    addText({ text: 'HARDWARE PANEL /\nCAMERA BODY', x: 80, y: 94, size: 58, fill: PAPER, target: typeLayer, name: '11.05 / Header / Title', font: FONTS.displayBlack, tracking: -0.025 });
    addText({ text: 'A REAL MACHINE. A COMPACT, EDITABLE CALIBRATION LAYER.', x: 82, y: 320, size: 14, fill: ASH_300, target: typeLayer, name: '11.05 / Header / Thesis', font: FONTS.bodyBold, tracking: 0.02 });
    addText({ text: 'CATCH THE STARS', x: 1118, y: 320, size: 12, fill: SIGNAL, target: typeLayer, name: '11.05 / Header / Permanent phrase', font: FONTS.monoBold, tracking: 0.08 });

    addArtifactSectionLabel(item, 1, 'DEFINITION / LICENSED REAL PHOTOGRAPH', 80, 394);
    addPhotoCrop(
      constructionLayer,
      heroBox,
      { x: 0, y: 0, width: photoBitmap.width, height: photoBitmap.height },
      '11.05 / REAL LICENSED PHOTO BASE / PEXELS 13401910 / FULL BASE / LOCKED',
      true,
    );
    const appliedBox = { x: 870, y: 555, width: 370, height: 112 };
    const appliedLabel = await addHardwareCalibrationLabel({ box: appliedBox, variant: 'paper', namePrefix: '11.05 / MANUAL WARP TARGET / Applied hero label', target: assetLayer, shadow: true });
    applyEditableRotation(appliedLabel, appliedBox, 2.2);

    addShape({ x: 104, y: 1122, width: 330, height: 96, fill: RGBA8(14, 14, 14, 224), target: assetLayer, name: '11.05 / Hero / Source classification plate' });
    addText({ text: 'REAL LICENSED BASE / PEXELS 13401910\nLABEL / NATIVE VECTOR + LIVE TYPE\nCONTROLS / UNOBSTRUCTED', x: 124, y: 1144, size: 9, fill: PAPER, target: typeLayer, name: '11.05 / Hero / Source classification', font: FONTS.monoBold, tracking: 0.035 });
    addShape({ x: 100, y: 1230, width: 1240, height: 33, fill: RGBA8(14, 14, 14, 226), target: assetLayer, name: '11.05 / Hero / Evidence caption plate' });
    addText({ text: 'COMPACT PAPER LABEL  /  CLEAR UPPER-RIGHT PANEL  /  +2.2 DEG LOCAL PLANE  /  3 PX SHADOW AT 18.8 PERCENT  /  NO PHOTO OCCLUSIONS', x: 120, y: 1239, size: 9, fill: PAPER, target: typeLayer, name: '11.05 / Hero / Evidence caption', font: FONTS.monoBold, tracking: 0.035 });

    addArtifactSectionLabel(item, 2, 'CONSTRUCTION AND SOURCE', 80, 1324);
    addShape({ x: 80, y: 1360, width: 800, height: 540, fill: PAPER, target: constructionLayer, name: '11.05 / Construction / Flat artwork ground' });
    const flatBox = { x: 120, y: 1450, width: 720, height: 218 };
    await addHardwareCalibrationLabel({ box: flatBox, variant: 'paper', namePrefix: '11.05 / Flat production master', target: assetLayer });
    addLinePath({ points: [[flatBox.x - 10, flatBox.y - 10], [flatBox.x + flatBox.width + 10, flatBox.y - 10], [flatBox.x + flatBox.width + 10, flatBox.y + flatBox.height + 10], [flatBox.x - 10, flatBox.y + flatBox.height + 10], [flatBox.x - 10, flatBox.y - 10]], stroke: SIGNAL_INK, strokeWidth: 2, target: constructionLayer, name: '11.05 / Flat artwork / Independent cut path' });
    addText({ text: 'ONE REUSABLE SOURCE GEOMETRY  /  TYPE + VECTORS NESTED TOGETHER  /  NO CONTROL CUTOUTS REQUIRED', x: 120, y: 1710, size: 9, fill: SIGNAL_INK, target: typeLayer, name: '11.05 / Construction / Flat master status', font: FONTS.monoBold, tracking: 0.035 });
    addText({ text: 'FIELD / exact atlasContoursLarge.svg\nMARK / exact original Gravity Well\nLOGO / MONOCHROME ONLY\nTYPE / LIVE\nSTATUS RAIL / EDITABLE\nHIGHLIGHTS / EDITABLE', x: 120, y: 1760, size: 9, fill: VOID, target: typeLayer, name: '11.05 / Construction / Nested source anatomy', font: FONTS.monoBold, tracking: 0.035 });

    addShape({ x: 920, y: 1360, width: 440, height: 540, fill: VOID_RAISED, target: constructionLayer, name: '11.05 / Construction / Surface mapping console' });
    addLinePath({ points: [[968, 1510], [1300, 1523], [1294, 1624], [964, 1611], [968, 1510]], stroke: SIGNAL, strokeWidth: 2, target: constructionLayer, name: '11.05 / Construction / Local affine plane' });
    [[968, 1510], [1300, 1523], [1294, 1624], [964, 1611]].forEach(([x, y], index) => addShape({ x: x - 5, y: y - 5, width: 10, height: 10, fill: SIGNAL, target: constructionLayer, name: `11.05 / Construction / Affine corner ${index + 1}`, shape: ShapeEllipse.create() }));
    addText({ text: 'CURRENT NATIVE APPLICATION\nROTATE / +2.2 DEG\nSHEAR / NONE\nSHADOW / 3 PX / 18.8 PERCENT\nPHOTO BASE / FULL / LOCKED', x: 964, y: 1402, size: 10, fill: PAPER, target: typeLayer, name: '11.05 / Construction / Applied transform values', font: FONTS.monoBold, tracking: 0.035 });
    addText({ text: 'MESH WARP / MANUAL NATIVE PASS REQUIRED\nAFFINITY SDK LIVE MESH API / ABSENT\nCURRENT EXPORT / AFFINE ONLY\nDO NOT CLAIM MESH WARP UNTIL MANUAL PASS IS RECORDED', x: 964, y: 1688, size: 9, fill: SIGNAL, target: typeLayer, name: '11.05 / Construction / Honest mesh-warp boundary', font: FONTS.monoBold, tracking: 0.03 });
    addText({ text: 'VERIFICATION / NOT VERIFIED\nPHYSICAL FIT / NOT VERIFIED\nFINISH / NOT VERIFIED', x: 964, y: 1810, size: 9, fill: ASH_300, target: typeLayer, name: '11.05 / Construction / Verification boundary', font: FONTS.monoMedium, tracking: 0.035 });

    addArtifactSectionLabel(item, 3, 'EXACT TOKENS, ASSETS, AND MATERIAL STACK', 80, 1944);
    addShape({ x: 80, y: 1980, width: 1280, height: 340, fill: VOID_RAISED, target: colourLayer, name: '11.05 / Exact material tokens / Ground' });
    materialTokens.forEach(([token, hex, fill, boundary], index) => {
      const rowY = 2008 + index * 31;
      addShape({ x: 116, y: rowY, width: 92, height: 22, fill, target: colourLayer, name: `11.05 / Exact token / ${token} / ${hex}` });
      addText({ text: `${token} / ${hex} / EXACT COLOR TOKEN`, x: 232, y: rowY + 3, size: 8, fill: PAPER, target: typeLayer, name: `11.05 / Exact token label / ${token}`, font: FONTS.monoBold, tracking: 0.03 });
      addText({ text: boundary, x: 870, y: rowY + 3, size: 8, fill: token === 'material.signal-spot' ? SIGNAL : ASH_300, target: typeLayer, name: `11.05 / Material evidence boundary / ${token}`, font: FONTS.monoBold, tracking: 0.03 });
    });
    addText({ text: 'LAMINATE / NO CANONICAL MATERIAL TOKEN / FINISH NOT VERIFIED  /  ADHESIVE / NO CANONICAL MATERIAL TOKEN / SPECIFICATION NOT VERIFIED  /  THICKNESS / NOT VERIFIED', x: 116, y: 2244, size: 8, fill: SIGNAL, target: evidenceLayer, name: '11.05 / Material stack / Unverified laminate and adhesive boundary', font: FONTS.monoBold, tracking: 0.025 });
    addText({ text: 'SOURCE / tokens/source/material.tokens.json  /  NO INVENTED FINISH, ADHESIVE, OR THICKNESS CLAIMS', x: 116, y: 2280, size: 8, fill: ASH_300, target: evidenceLayer, name: '11.05 / Material stack / Exact source', font: FONTS.monoMedium, tracking: 0.03 });

    addArtifactSectionLabel(item, 4, 'VARIANTS, MODES, STATES, AND OPTICAL SIZES', 80, 2364);
    addShape({ x: 80, y: 2400, width: 620, height: 340, fill: VOID_RAISED, target: colourLayer, name: '11.05 / Variant matrix / Ground' });
    const variants = [
      ['paper', 'PAPER'], ['black', 'BLACK'], ['aluminum', 'ALUMINUM'], ['composite', 'COMPOSITE'], ['active', 'ACTIVE'],
      ['inactive', 'INACTIVE'], ['bilingual', 'BILINGUAL SLOT'], ['worn', 'WORN'], ['service-open', 'SERVICE OPEN'], ['one-colour', 'ONE COLOR'],
    ];
    for (const [index, [variant, label]] of variants.entries()) {
      const column = index % 5;
      const row = Math.floor(index / 5);
      const x = 98 + column * 119;
      const y = 2440 + row * 132;
      await addHardwareCalibrationLabel({ box: { x, y, width: 105, height: 62 }, variant, namePrefix: `11.05 / Variant ${String(index + 1).padStart(2, '0')} / ${label}`, target: assetLayer });
      addText({ text: label, x, y: y + 76, size: 6.5, fill: variant === 'active' ? SIGNAL : ASH_300, target: typeLayer, name: `11.05 / Variant ${index + 1} / Caption`, font: FONTS.monoBold, tracking: 0.04 });
    }

    addArtifactSectionLabel(item, 5, 'USAGE', 740, 2364);
    addShape({ x: 740, y: 2400, width: 620, height: 340, fill: VOID_RAISED, target: usageLayer, name: '11.05 / Usage / Ground' });
    const usageCases = [
      ['SERVICE / CALIBRATION', 'paper', { x: 2900, y: 280, width: 2350, height: 660 }, { x: 992, yOffset: 8, width: 126, height: 38 }],
      ['RETROFIT / TRACEABLE', 'black', { x: 1700, y: 620, width: 2550, height: 717 }, { x: 790, yOffset: 5, width: 120, height: 36 }],
      ['EQUIPMENT / IDENTIFY', 'one-colour', { x: 600, y: 300, width: 4200, height: 600 }, { x: 998, yOffset: 7, width: 116, height: 35 }],
    ];
    for (const [index, [title, variant, sourceCrop, labelPlacement]] of usageCases.entries()) {
      const y = 2438 + index * 92;
      addPhotoCrop(usageLayer, { x: 776, y, width: 360, height: 78 }, sourceCrop, `11.05 / Usage / ${title} / Licensed real hardware crop`);
      await addHardwareCalibrationLabel({
        box: { x: labelPlacement.x, y: y + labelPlacement.yOffset, width: labelPlacement.width, height: labelPlacement.height },
        variant,
        namePrefix: `11.05 / Usage / ${title} / Applied source geometry`,
        target: usageLayer,
        shadow: true,
      });
      addShape({ x: 1148, y, width: 176, height: 78, fill: VOID, target: usageLayer, name: `11.05 / Usage / ${title} / Governed host-asset evidence cell` });
      await addExactInstrumentDial(usageLayer, { x: 1154, y: y + 5, width: 68, height: 68 }, `11.05 / Usage / ${title} / Exact synthetic host asset`);
      addText({ text: `${title}\nREAL PHOTO / LEFT\nEXACT DIAL / RIGHT`, x: 1228, y: y + 16, size: 5.4, fill: index === 0 ? SIGNAL : PAPER, target: typeLayer, name: `11.05 / Usage / ${title} / Source classification`, font: FONTS.monoBold, tracking: 0.025 });
    }

    addArtifactSectionLabel(item, 6, 'ACCESSIBILITY, BILINGUAL BEHAVIOR, AND RTL', 80, 2784);
    addShape({ x: 80, y: 2820, width: 620, height: 340, fill: VOID_RAISED, target: accessLayer, name: '11.05 / Accessibility / Ground' });
    await addHardwareCalibrationLabel({ box: { x: 112, y: 2872, width: 250, height: 76 }, variant: 'paper', namePrefix: '11.05 / Accessibility / English-leading specimen', target: accessLayer });
    await addHardwareCalibrationLabel({ box: { x: 418, y: 2872, width: 250, height: 76 }, variant: 'bilingual', namePrefix: '11.05 / Accessibility / Bilingual interim specimen', target: accessLayer });
    addText({ text: 'ENGLISH-LEADING / LIVE TYPE\nTEXT + POSITION + STATUS RAIL', x: 112, y: 2972, size: 8, fill: PAPER, target: typeLayer, name: '11.05 / Accessibility / English contract', font: FONTS.monoBold, tracking: 0.03 });
    addText({ text: 'ARABIC SLOT / INTERIM ONLY\nARABIC FONT BINARY / ABSENT\nLIVE ARABIC / NOT VERIFIED', x: 418, y: 2972, size: 8, fill: SIGNAL, target: typeLayer, name: '11.05 / Accessibility / Arabic boundary', font: FONTS.monoBold, tracking: 0.03 });
    addText({ text: 'SIGNAL LIME IS NEVER THE ONLY STATE CUE  /  PHYSICAL CONTRAST + LEGIBILITY REQUIRE SAMPLE EVIDENCE', x: 112, y: 3070, size: 8, fill: ASH_300, target: accessLayer, name: '11.05 / Accessibility / Non-colour and evidence contract', font: FONTS.monoMedium, tracking: 0.03 });

    addArtifactSectionLabel(item, 7, 'MOTION AND INTERACTION', 740, 2784);
    addShape({ x: 740, y: 2820, width: 620, height: 340, fill: VOID_RAISED, target: accessLayer, name: '11.05 / Motion / Ground' });
    await addExactInstrumentDial(accessLayer, { x: 786, y: 2860, width: 210, height: 210 }, '11.05 / Motion / Exact governed host control');
    await addHardwareCalibrationLabel({ box: { x: 1030, y: 2890, width: 250, height: 76 }, variant: 'active', namePrefix: '11.05 / Motion / Static calibration label', target: accessLayer });
    addText({ text: 'HOST CONTROL / instrument-dial.svg EXACT\nMOTION / PHYSICAL CONTROL ONLY', x: 786, y: 3090, size: 7.5, fill: ASH_300, target: typeLayer, name: '11.05 / Motion / Exact dial source', font: FONTS.monoBold, tracking: 0.03 });
    addText({ text: 'LABEL / STATIC\nANIMATION / NONE\nSTATE / READABLE STATUS RAIL', x: 1030, y: 2994, size: 8, fill: PAPER, target: typeLayer, name: '11.05 / Motion / Static label behavior', font: FONTS.monoBold, tracking: 0.03 });

    addArtifactSectionLabel(item, 8, 'PRODUCTION AND EXPORT', 80, 3204);
    addShape({ x: 80, y: 3240, width: 1280, height: 330, fill: PAPER, target: productionLayer, name: '11.05 / Production separations / Ground' });
    const productionProofs = [
      ['COMPOSITE', 'paper'],
      ['K', 'K'],
      ['SPOT', 'SPOT'],
      ['CUT OUTLINE', 'CUT'],
      ['LAMINATE / PSA', 'LAMINATE / PSA'],
    ];
    for (const [index, [label, channel]] of productionProofs.entries()) {
      const x = 104 + index * 248;
      addShape({ x, y: 3286, width: 224, height: 210, fill: index === 2 ? VOID : PAPER_MUTED, target: productionLayer, name: `11.05 / Production proof ${index + 1} / ${label} / Ground` });
      if (index === 0) {
        await addHardwareCalibrationLabel({ box: { x: x + 17, y: 3322, width: 190, height: 58 }, variant: channel, namePrefix: `11.05 / Production proof ${index + 1} / ${label}`, target: productionLayer });
      } else {
        await addHardwareProductionSeparation(productionLayer, { x: x + 17, y: 3322, width: 190, height: 58 }, channel, `11.05 / Production proof ${index + 1} / ${label}`);
      }
      addText({ text: label, x: x + 17, y: 3410, size: 8, fill: index === 2 ? SIGNAL : VOID, target: typeLayer, name: `11.05 / Production proof ${index + 1} / Label`, font: FONTS.monoBold, tracking: 0.04 });
      addText({ text: index < 3 ? 'EDITABLE CHANNEL' : 'SPECIFICATION / NOT VERIFIED', x: x + 17, y: 3440, size: 6.5, fill: index === 2 ? PAPER : ASH_700, target: typeLayer, name: `11.05 / Production proof ${index + 1} / Status`, font: FONTS.monoMedium, tracking: 0.03 });
    }
    addText({ text: 'ACTUAL MINI LABEL SEPARATIONS  /  COMPOSITE + K + SPOT + CUT OUTLINE + LAMINATE/PSA FOOTPRINT  /  ADHESIVE AND FINISH VALUES NOT VERIFIED', x: 104, y: 3520, size: 8, fill: SIGNAL_INK, target: productionLayer, name: '11.05 / Production / Export boundary', font: FONTS.monoBold, tracking: 0.03 });

    addArtifactSectionLabel(item, 9, 'CORRECT EXAMPLES', 80, 3614);
    addShape({ x: 80, y: 3650, width: 620, height: 260, fill: VOID_RAISED, target: misuseLayer, name: '11.05 / Correct / Ground' });
    addPhotoCrop(misuseLayer, { x: 112, y: 3692, width: 556, height: 156 }, { x: 2900, y: 280, width: 2350, height: 660 }, '11.05 / Correct / Real photo crop / Clear upper panel');
    await addHardwareCalibrationLabel({ box: { x: 390, y: 3723, width: 238, height: 72 }, variant: 'paper', namePrefix: '11.05 / MANUAL WARP TARGET / Correct / Compact label on clear surface', target: misuseLayer, shadow: true });
    addText({ text: 'CORRECT / REAL PHOTO CROP / COMPACT LABEL ON CLEAR SURFACE / CONTROLS REMAIN USABLE', x: 112, y: 3872, size: 7.5, fill: SIGNAL, target: typeLayer, name: '11.05 / Correct / Caption', font: FONTS.monoBold, tracking: 0.03 });

    addArtifactSectionLabel(item, 10, 'MISUSE', 740, 3614);
    addShape({ x: 740, y: 3650, width: 620, height: 260, fill: VOID_RAISED, target: misuseLayer, name: '11.05 / Misuse / Ground' });
    addPhotoCrop(misuseLayer, { x: 772, y: 3692, width: 556, height: 156 }, { x: 1700, y: 620, width: 2550, height: 717 }, '11.05 / Misuse / Real photo crop / Controls');
    await addHardwareCalibrationLabel({ box: { x: 830, y: 3704, width: 440, height: 133 }, variant: 'paper', namePrefix: '11.05 / Misuse / Oversized flat paste over controls', target: misuseLayer });
    addLinePath({ points: [[842, 3714], [1256, 3827]], stroke: ASH_300, strokeWidth: 4, target: misuseLayer, name: '11.05 / Misuse / Rejection slash 01' });
    addLinePath({ points: [[1256, 3714], [842, 3827]], stroke: ASH_300, strokeWidth: 4, target: misuseLayer, name: '11.05 / Misuse / Rejection slash 02' });
    addText({ text: 'REJECT / REAL PHOTO CROP / OVERSIZED FLAT PASTE / CONTROLS OBSCURED', x: 772, y: 3872, size: 7.5, fill: PAPER, target: typeLayer, name: '11.05 / Misuse / Caption', font: FONTS.monoBold, tracking: 0.03 });

    addArtifactSectionLabel(item, 11, 'PROVENANCE, HASHES, STATUS, AND EVIDENCE', 80, 3954);
    addShape({ x: 80, y: 3990, width: 820, height: 200, fill: VOID_RAISED, target: evidenceLayer, name: '11.05 / Provenance / Ground' });
    addText({
      text: 'BASE / LICENSED REAL PHOTOGRAPH\nSOURCE / PEXELS 13401910\nURL / https://www.pexels.com/photo/close-up-of-the-switches-of-a-machine-13401910/\nLICENSE / https://www.pexels.com/license/\nLOCAL / source/references/real-pexels-control-panel-13401910.jpg\nPIXELS / 5472 x 3648\nSHA256 / b93fcb94f9db1ffdb8788b0d29b33cffda3bcc70ad6c37aa1dfa37806558f660',
      x: 108,
      y: 4016,
      size: 8,
      fill: PAPER,
      target: evidenceLayer,
      name: '11.05 / Provenance / Exact photo source and hash',
      font: FONTS.monoMedium,
      tracking: 0.02,
    });
    addText({ text: 'VERIFICATION / NOT VERIFIED  /  EMBEDDED FIELD / GOVERNED-PROVISIONAL  /  EXPORT / NONPUBLISHABLE PENDING EVIDENCE', x: 108, y: 4160, size: 8, fill: SIGNAL, target: evidenceLayer, name: '11.05 / Provenance / Explicit release boundary', font: FONTS.monoBold, tracking: 0.025 });

    addArtifactSectionLabel(item, 12, 'PARENT, SIBLINGS, AND CANONICAL SOURCES', 940, 3954);
    addShape({ x: 940, y: 3990, width: 420, height: 200, fill: VOID_RAISED, target: evidenceLayer, name: '11.05 / Navigation / Ground' });
    addText({ text: 'PARENT / 11.00\nDEPENDENCIES / 07.04 / 09.07 / 10.02 / 10.03 / 10.07 / 12.03\nSIBLINGS / 11.04 / 11.06\nRECIPE / 11.05/visual/v1\nREVISION / r4', x: 968, y: 4020, size: 8.5, fill: PAPER, target: evidenceLayer, name: '11.05 / Navigation / Exact relationships', font: FONTS.monoBold, tracking: 0.025 });
    addText({ text: 'CANONICAL SOURCES / atlasContoursLarge.svg + Gravity Well + instrument-dial.svg', x: 968, y: 4156, size: 7, fill: SIGNAL, target: evidenceLayer, name: '11.05 / Navigation / Authority boundary', font: FONTS.monoBold, tracking: 0.025 });

    addShape({ x: 80, y: 4230, width: 1280, height: 1, fill: IRON, target: constructionLayer, name: '11.05 / Footer datum' });
    addText({ text: 'CATCH THE STARS  /  MAKE THE DISTANT TANGIBLE', x: 80, y: 4250, size: 10, fill: SIGNAL, target: evidenceLayer, name: '11.05 / Footer / Permanent phrase', font: FONTS.monoBold, tracking: 0.08 });
    addText({ text: 'NOT VERIFIED  /  NONPUBLISHABLE PENDING EVIDENCE  /  HARDWARE PANEL r4', x: 850, y: 4250, size: 9, fill: ASH_300, target: evidenceLayer, name: '11.05 / Footer / Revision and status', font: FONTS.monoMedium, tracking: 0.035 });
    return 4190;
  }

  async function addAtlasSubjectVisual(item) {
    const { subject } = item;
    if (subject.id === '07.00') {
      const cards = [
        [SOURCE_PATHS.atlasSpectralLarge, '07.02 / CONTINUOUS SPECTRAL / EXACT LARGE', 80, 430],
        [SOURCE_PATHS.atlasContoursLarge, '07.04 / CONTOURS / EXACT LARGE', 760, 430],
        [SOURCE_PATHS.atlasDotsLarge, '07.06 / DOT DENSITY / EXACT LARGE', 80, 840],
        [SOURCE_PATHS.atlasHatchLarge, '07.07 / HATCHING / EXACT LARGE', 760, 840],
      ];
      for (const [path, label, x, y] of cards) await addAtlasCard(item, { path, box: { x, y, width: 600, height: 338 }, label });
      addAtlasCaption(item, 'ONE GOVERNED FIELD / FOUR EXACT REPRESENTATIONS / APERTURE + TRAJECTORY STATE PRESERVED PER EXPORT', 82, 1238, { status: true });
      return 1320;
    }
    if (subject.id === '07.01') return addAtlasProvenanceConsole(item);
    if (subject.id === '07.02') {
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasSpectralLarge, box: { x: 80, y: 430, width: 1280, height: 720 }, label: '07.02 / ATLAS-SPECTRAL-LARGE / EXACT PRIMARY' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasSpectral, box: { x: 80, y: 1210, width: 600, height: 338 }, label: '07.02 / ATLAS-SPECTRAL / EXACT NORMAL' });
      await addAtlasCard(item, { path: SOURCE_PATHS.calibratedAperture, box: { x: 760, y: 1210, width: 600, height: 338 }, label: '07.02 / CALIBRATED-APERTURE / EXACT SOURCE' });
      return 1620;
    }
    if (subject.id === '07.03') {
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasBands, box: { x: 80, y: 430, width: 600, height: 338 }, label: '07.03 / ATLAS-BANDS / EXACT STEPPED FIELD' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasSpectral, box: { x: 760, y: 430, width: 600, height: 338 }, label: '07.03 / ATLAS-SPECTRAL / EXACT CONTINUOUS PARENT' });
      return 860;
    }
    if (subject.id === '07.04') {
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasContoursLarge, box: { x: 80, y: 430, width: 1280, height: 720 }, label: '07.04 / ATLAS-CONTOURS-LARGE / EXACT PRIMARY' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasContoursDark, box: { x: 80, y: 1210, width: 600, height: 338 }, label: '07.04 / ATLAS-CONTOURS-DARK / EXACT' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasContoursLight, box: { x: 760, y: 1210, width: 600, height: 338 }, label: '07.04 / ATLAS-CONTOURS-LIGHT / EXACT' });
      return 1620;
    }
    if (subject.id === '07.05') return addShadedContourArtifactFirstPage(item);
    if (subject.id === '07.06') {
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasDotsLarge, box: { x: 80, y: 430, width: 1280, height: 720 }, label: '07.06 / ATLAS-DOTS-LARGE / EXACT PRIMARY' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasDots, box: { x: 80, y: 1210, width: 600, height: 338 }, label: '07.06 / ATLAS-DOTS / EXACT NORMAL' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasContoursLarge, box: { x: 760, y: 1210, width: 600, height: 338 }, label: '07.06 / CONTOUR ANCHORS / EXACT LARGE PARENT' });
      return 1620;
    }
    if (subject.id === '07.07') {
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasHatchLarge, box: { x: 80, y: 430, width: 1280, height: 720 }, label: '07.07 / ATLAS-HATCH-LARGE / EXACT PRIMARY' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasHatch, box: { x: 80, y: 1210, width: 600, height: 338 }, label: '07.07 / ATLAS-HATCH / EXACT NORMAL' });
      return 1620;
    }
    if (subject.id === '07.08') return addAtlasProvisionalPair(item, { referencePath: SOURCE_PATHS.referenceGrain, referenceLabel: '07.08 / GRAIN + HALFTONE / CONTINUOUS LENS v2', mode: 'grain' });
    if (subject.id === '07.09') return addAtlasProvisionalPair(item, { referencePath: SOURCE_PATHS.referenceMaterial, referenceLabel: '07.09 / MATERIAL RESPONSE / CONTINUOUS LENS v2', mode: 'material' });
    if (subject.id === '07.10') return addAtlasProvisionalPair(item, { referencePath: SOURCE_PATHS.referenceOneColor, referenceLabel: '07.10 / ONE-COLOR / CONTINUOUS LENS v2', mode: 'one-color' });
    if (subject.id === '07.11') {
      addShape({ x: 80, y: 430, width: 360, height: 288, fill: VOID_RAISED, target: item.layers.get('40 / Color, Gradient, Pattern, or Material'), name: '07.11 / Actual-size micro inspection field' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasMicro, box: { x: 80, y: 430, width: 96, height: 48 }, label: '07.11 / ATLAS-MICRO / ACTUAL 96 x 48' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasMicro, box: { x: 520, y: 430, width: 576, height: 288 }, label: '07.11 / ATLAS-MICRO / 6x INSPECTION' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasContoursDark, box: { x: 80, y: 810, width: 600, height: 338 }, label: '07.11 / NORMAL PARENT / EXACT CONTOURS DARK' });
      await addAtlasCard(item, { path: SOURCE_PATHS.atlasContoursLarge, box: { x: 760, y: 810, width: 600, height: 338 }, label: '07.11 / LARGE PARENT / EXACT CONTOURS LARGE' });
      return 1230;
    }
    throw new Error(`Unhandled Atlas subject visual: ${subject.id}`);
  }

  async function addSwissWorkingInstrumentPage(item) {
    const { layers } = item;
    const specimen = { x: 80, y: 430, width: 1280, height: 760 };
    await addReference(
      item,
      SOURCE_PATHS.referenceSwissWorking,
      specimen.x,
      specimen.y,
      specimen.width,
      specimen.height,
      '01.01 / SWISS-WORKING INSTRUMENT / IMAGEGEN DIRECTION / SHA 96EAF8958C31',
      { hidden: true },
    );

    addShape({ ...specimen, fill: PAPER, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: '01.01 / Paper Precision Panel / Ground' });
    addShape({ x: 80, y: 430, width: 1280, height: 1, fill: ASH_300, target: layers.get('10 / Construction'), name: '01.01 / Specimen top datum' });
    addShape({ x: 80, y: 1189, width: 1280, height: 1, fill: ASH_300, target: layers.get('10 / Construction'), name: '01.01 / Specimen bottom datum' });

    const phaseStops = [
      { x: 104, index: '01', label: 'SIGNAL', note: 'ONE ACCENT' },
      { x: 356, index: '02', label: 'INSTRUMENT', note: 'MEASURED STRUCTURE' },
      { x: 624, index: '03', label: 'DATA', note: 'REAL METADATA' },
      { x: 946, index: '04', label: 'REVEAL', note: 'EARNED PERSONALITY' },
    ];
    phaseStops.forEach((phase, index) => {
      addText({ text: `${phase.index} / ${phase.label}`, x: phase.x, y: 462, size: 12, fill: index === 3 ? SIGNAL_INK : VOID, target: layers.get('30 / Live Type and Metadata'), name: `01.01 / Phase ${phase.index} / Label`, font: FONTS.monoBold, tracking: 0.08 });
      addText({ text: phase.note, x: phase.x, y: 488, size: 9, fill: ASH_700, target: layers.get('30 / Live Type and Metadata'), name: `01.01 / Phase ${phase.index} / Functional note`, font: FONTS.monoMedium, tracking: 0.04 });
      addShape({ x: phase.x, y: 516, width: index === 3 ? 126 : 112, height: index === 3 ? 4 : 1, fill: index === 3 ? SIGNAL : ASH_300, target: layers.get('10 / Construction'), name: `01.01 / Phase ${phase.index} / Progress datum` });
    });

    addText({ text: 'NOT SWISS-LOOKING.', x: 104, y: 548, size: 30, fill: VOID, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Philosophy / Not Swiss-looking', font: FONTS.displayBold, tracking: -0.025 });
    addText({ text: 'SWISS-WORKING.', x: 104, y: 596, size: 34, fill: SIGNAL_INK, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Philosophy / Swiss-working', font: FONTS.displayBlack, tracking: -0.03 });
    addText({ text: 'FUNCTIONAL PRECISION BECOMES IDENTITY.', x: 106, y: 652, size: 11, fill: ASH_700, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Philosophy / Definition', font: FONTS.monoBold, tracking: 0.06 });

    const fieldCenterX = 1172;
    const fieldCenterY = 792;
    addSmoothEllipse({ cx: fieldCenterX, cy: fieldCenterY, rx: 386, ry: 278, rotation: -0.04, fill: VOID, stroke: SIGNAL, strokeWidth: 1.4, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: '01.01 / Display Field / Smooth deep-void body' });
    for (let index = 0; index < 28; index += 1) {
      const t = index / 27;
      const rx = 350 - t * 302;
      const ry = 246 - t * 206;
      const isSignal = index === 2 || index === 9 || index === 20;
      const isMajor = index % 5 === 0;
      addSmoothEllipse({
        cx: fieldCenterX - t * 18,
        cy: fieldCenterY + Math.sin(t * Math.PI) * 4,
        rx,
        ry,
        rotation: -0.04 - t * 0.035,
        fill: null,
        stroke: isSignal ? SIGNAL : isMajor ? ASH_500 : IRON,
        strokeWidth: isSignal ? 1.6 : isMajor ? 1.15 : 0.62,
        target: layers.get('20 / Canonical Assets'),
        name: `01.01 / Display Field / Governed contour ${String(index + 1).padStart(2, '0')} / ${isSignal ? 'Signal' : isMajor ? 'Major' : 'Minor'}`,
        lineType: index % 7 === 4 ? LineType.Dash : LineType.Solid,
        dashPattern: index % 7 === 4 ? [0.18, 2.6] : null,
        dashPhase: index * 0.17,
      });
    }
    addSmoothEllipse({ cx: fieldCenterX - 10, cy: fieldCenterY, rx: 72, ry: 34, rotation: -14 * Math.PI / 180, fill: VOID, stroke: SIGNAL, strokeWidth: 2.4, target: layers.get('20 / Canonical Assets'), name: '01.01 / Reveal / Continuous Lens aperture / Smooth four-cubic silhouette' });
    addShape({ x: fieldCenterX - 16, y: fieldCenterY - 6, width: 12, height: 12, fill: SIGNAL, target: layers.get('20 / Canonical Assets'), name: '01.01 / Reveal / Active datum', shape: ShapeEllipse.create() });
    addText({ text: 'REVEAL / ACTIVE', x: 1062, y: 560, size: 10, fill: SIGNAL, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Display Field / Active state', font: FONTS.monoBold, tracking: 0.06 });

    addShape({ x: 104, y: 790, width: 1110, height: 1.2, fill: SIGNAL, target: layers.get('10 / Construction'), name: '01.01 / Functional rail / Signal path' });
    for (let index = 0; index <= 74; index += 1) {
      const major = index % 10 === 0;
      addShape({ x: 104 + index * 14.2, y: 790 - (major ? 7 : 3), width: 1, height: major ? 14 : 6, fill: index > 50 ? SIGNAL : ASH_700, target: layers.get('10 / Construction'), name: `01.01 / Functional rail / Tick ${String(index + 1).padStart(2, '0')}` });
    }
    [104, 356, 624, 946, 1158].forEach((x, index) => addShape({ x: x - 5, y: 785, width: 10, height: 10, fill: index === 4 ? SIGNAL : VOID, target: layers.get('20 / Canonical Assets'), name: `01.01 / Functional rail / Datum ${String(index + 1).padStart(2, '0')}`, shape: ShapeEllipse.create() }));

    const waveSegments = [
      [[118, 790], [142, 742], [166, 838], [190, 790]],
      [[190, 790], [220, 716], [250, 864], [280, 790]],
      [[280, 790], [304, 754], [328, 826], [352, 790]],
    ];
    waveSegments.forEach((segment, index) => addSmoothCubicPath({ start: segment[0], control1: segment[1], control2: segment[2], end: segment[3], stroke: index === 1 ? SIGNAL_INK : ASH_500, strokeWidth: index === 1 ? 1.8 : 1, target: layers.get('20 / Canonical Assets'), name: `01.01 / Signal / Measured waveform ${String(index + 1).padStart(2, '0')}` }));

    [112, 86, 60, 34].forEach((radius, index) => addSmoothEllipse({ cx: 448, cy: 790, rx: radius, ry: radius, fill: null, stroke: index === 2 ? SIGNAL_INK : ASH_300, strokeWidth: index === 2 ? 1.6 : 0.85, target: layers.get('20 / Canonical Assets'), name: `01.01 / Instrument / Calibration ring ${String(index + 1).padStart(2, '0')}`, lineType: index === 1 ? LineType.Dash : LineType.Solid, dashPattern: index === 1 ? [0.2, 2.8] : null }));
    addShape({ x: 447.5, y: 672, width: 1, height: 236, fill: ASH_300, target: layers.get('10 / Construction'), name: '01.01 / Instrument / Vertical calibration axis' });
    addShape({ x: 442, y: 784, width: 12, height: 12, fill: VOID, target: layers.get('20 / Canonical Assets'), name: '01.01 / Instrument / Registered center', shape: ShapeEllipse.create() });
    addShape({ x: 445, y: 787, width: 6, height: 6, fill: SIGNAL, target: layers.get('20 / Canonical Assets'), name: '01.01 / Instrument / Active center', shape: ShapeEllipse.create() });

    for (let row = 0; row < 13; row += 1) {
      for (let column = 0; column < 17; column += 1) {
        const signalPoint = (row === 6 && [2, 8, 14].includes(column)) || (column === 8 && [2, 10].includes(row));
        addShape({ x: 566 + column * 15.5, y: 688 + row * 16.5, width: signalPoint ? 4 : 2, height: signalPoint ? 4 : 2, fill: signalPoint ? SIGNAL : ASH_300, target: layers.get('20 / Canonical Assets'), name: `01.01 / Data / Sample ${String(row + 1).padStart(2, '0')}.${String(column + 1).padStart(2, '0')}`, shape: ShapeEllipse.create() });
      }
    }
    addText({ text: 'ATLAS / G-042\nMODEL / MULTI-MASS FIELD\nSOURCE / SYNTHETIC\nSEED / 241107\nTRACE / ACTIVE', x: 578, y: 842, size: 9.5, fill: ASH_700, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Data / Governed synthetic metadata', font: FONTS.monoMedium, tracking: 0.025 });

    addShape({ x: 104, y: 1010, width: 872, height: 148, fill: PAPER_MUTED, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: '01.01 / Evidence console / Ground' });
    [328, 552, 776].forEach((x, index) => addShape({ x, y: 1010, width: 1, height: 148, fill: ASH_300, target: layers.get('10 / Construction'), name: `01.01 / Evidence console / Divider ${index + 1}` }));
    const evidence = [
      ['INPUT', 'SIGNAL / LIVE'],
      ['METHOD', 'CALIBRATED / REPEATABLE'],
      ['EVIDENCE', 'SOURCE / SYNTHETIC'],
      ['TEST', 'FUNCTION / RECOGNITION / REVEAL'],
    ];
    evidence.forEach(([label, value], index) => {
      const x = 126 + index * 224;
      addText({ text: label, x, y: 1034, size: 8, fill: SIGNAL_INK, target: layers.get('30 / Live Type and Metadata'), name: `01.01 / Evidence console / ${label}`, font: FONTS.monoBold, tracking: 0.08 });
      addText({ text: wrap(value, 26), x, y: 1070, size: 11, fill: VOID, target: layers.get('30 / Live Type and Metadata'), name: `01.01 / Evidence console / ${label} value`, font: FONTS.monoMedium, tracking: 0.03 });
    });
    addShape({ x: 1000, y: 1010, width: 336, height: 148, fill: VOID, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: '01.01 / Independent closing / Deep Void plate' });
    addText({ text: 'BEND  >  ABSENCE  >  SIGNAL', x: 1024, y: 1036, size: 9, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Independent closing / Recognition grammar', font: FONTS.monoBold, tracking: 0.06 });
    addText({ text: 'CATCH THE STARS', x: 1024, y: 1072, size: 22, fill: SIGNAL, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Independent closing / Tagline', font: FONTS.displayBold, tracking: -0.02 });
    addText({ text: 'MAKE THE DISTANT TANGIBLE', x: 1026, y: 1118, size: 9, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: '01.01 / Independent closing / Meaning', font: FONTS.monoMedium, tracking: 0.05 });

    addText({ text: 'NATIVE AFFINITY RECONSTRUCTION  /  IMAGEGEN DIRECTION HIDDEN AS NONPUBLISHABLE REFERENCE  /  ALL VISIBLE ELEMENTS EDITABLE', x: 82, y: 1208, size: 11, fill: SIGNAL_INK, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: '01.01 / Reconstruction status', font: FONTS.monoBold, tracking: 0.035 });
    return 1240;
  }

  async function addThreeDistanceRecognitionPage(item) {
    const { subject, layers } = item;
    const constructionLayer = layers.get('10 / Construction');
    const assetLayer = layers.get('20 / Canonical Assets');
    const typeLayer = layers.get('30 / Live Type and Metadata');
    const colourLayer = layers.get('40 / Color, Gradient, Pattern, or Material');
    const variantsLayer = layers.get('50 / Variants, States, and Optical Sizes');
    const usageLayer = layers.get('60 / Usage and Applications');
    const accessLayer = layers.get('70 / Accessibility, Bilingual, RTL, and Motion');
    const productionLayer = layers.get('80 / Production and Export');
    const rulesLayer = layers.get('90 / Correct Use and Misuse');
    const evidenceLayer = layers.get('99 / Provenance, Status, Evidence, and Navigation');
    const sections = subject.anatomy;
    const exactCopy = (index) => sectionCopy(subject, sections[index]);

    function sectionLabel(index, x, y, target, fill = SIGNAL_INK) {
      addText({
        text: `${String(index + 1).padStart(2, '0')} / ${sections[index].toUpperCase()}`,
        x,
        y,
        size: 9,
        fill,
        target,
        name: `01.02 / Section ${String(index + 1).padStart(2, '0')} / ${sections[index]} / Editorial label`,
        font: FONTS.monoBold,
        tracking: 0.055,
      });
    }

    addText({ text: 'THE SAME SYSTEM CHANGES RESOLUTION.', x: 80, y: 406, size: 28, fill: VOID, target: typeLayer, name: '01.02 / Hero / Resolution thesis', font: FONTS.displayBold, tracking: -0.022 });
    addText({ text: 'ONE GOVERNED FIELD  /  THREE OPTICAL DISTANCES  /  ZERO NEW SILHOUETTES', x: 82, y: 458, size: 10, fill: ASH_700, target: typeLayer, name: '01.02 / Hero / Invariant rail', font: FONTS.monoBold, tracking: 0.055 });

    const distanceSpecimens = [
      {
        key: 'FAR', order: '01', x: 80, y: 562, width: 300, height: 169,
        visible: 'BEND / ABSENCE / SIGNAL', role: 'SILHOUETTE', labelY: 760,
        path: SOURCE_PATHS.atlasContoursLarge,
        sourceLabel: 'EXACT atlasContoursLarge.svg / MAJOR FIELD + APERTURE + SIGNAL',
        pathFilter: (attributes) => attributes['data-layer'] === 'continuous-lens-aperture'
          || attributes['data-layer'] === 'signal-trajectory'
          || (attributes['data-layer'] === 'field-line' && attributes['data-line-kind'] === 'major'),
      },
      {
        key: 'NORMAL', order: '02', x: 410, y: 518, width: 420, height: 237,
        visible: '+ INDICES / FIELD / STATE', role: 'FUNCTION', labelY: 784,
        path: SOURCE_PATHS.atlasSpectralLarge,
        sourceLabel: 'EXACT atlasSpectralLarge.svg / NATIVE SPECTRUM + APERTURE + SIGNAL',
      },
      {
        key: 'CLOSE', order: '03', x: 860, y: 474, width: 500, height: 282,
        visible: '+ REPRESENTATIONS / PROVENANCE', role: 'EVIDENCE', labelY: 784,
        path: SOURCE_PATHS.atlasContoursLarge,
        sourceLabel: 'EXACT atlasContoursLarge.svg / INSPECTION BASE',
      },
    ];
    addShape({ x: 80, y: 756, width: 1280, height: 2, fill: ASH_300, target: constructionLayer, name: '01.02 / Hero / Shared optical baseline' });
    for (const [index, specimen] of distanceSpecimens.entries()) {
      addShape({ x: specimen.x - 1, y: specimen.y - 1, width: specimen.width + 2, height: specimen.height + 2, fill: index === 2 ? SIGNAL : ASH_300, target: colourLayer, name: `01.02 / ${specimen.key} / Registered enclosure` });
      await addExactSvgViewport(item, {
        path: specimen.path,
        box: { x: specimen.x, y: specimen.y, width: specimen.width, height: specimen.height },
        label: `01.02 / ${specimen.key} / ${specimen.sourceLabel}`,
        fitMode: 'contain',
        skipBackground: false,
        pathFilter: specimen.pathFilter || null,
      });
      addShape({ x: specimen.x, y: specimen.labelY, width: specimen.width, height: 88, fill: index === 2 ? VOID : PAPER_MUTED, target: colourLayer, name: `01.02 / ${specimen.key} / Optical label plate` });
      addText({ text: `${specimen.order} / ${specimen.key}`, x: specimen.x + 18, y: specimen.labelY + 14, size: 13, fill: index === 2 ? SIGNAL : VOID, target: typeLayer, name: `01.02 / ${specimen.key} / Distance label`, font: FONTS.monoBold, tracking: 0.065 });
      addText({ text: specimen.visible, x: specimen.x + 18, y: specimen.labelY + 45, size: 8.5, fill: index === 2 ? PAPER : ASH_700, target: typeLayer, name: `01.02 / ${specimen.key} / Visible layer rule`, font: FONTS.monoBold, tracking: 0.04 });
      addText({ text: specimen.role, x: specimen.x + specimen.width - 108, y: specimen.labelY + 14, size: 9, fill: index === 2 ? SIGNAL : SIGNAL_INK, target: typeLayer, name: `01.02 / ${specimen.key} / Reading role`, font: FONTS.monoBold, tracking: 0.04 });
      addShape({ x: specimen.x + specimen.width / 2 - 6, y: 750, width: 12, height: 12, fill: index === 2 ? SIGNAL : VOID, target: assetLayer, name: `01.02 / ${specimen.key} / Registered baseline datum`, shape: ShapeEllipse.create() });
    }
    const closeInspectionChips = [
      { path: SOURCE_PATHS.atlasDotsLarge, x: 1082, label: 'DOTS' },
      { path: SOURCE_PATHS.atlasHatchLarge, x: 1168, label: 'HATCH' },
      { path: SOURCE_PATHS.atlasSpectralLarge, x: 1254, label: 'SPECTRAL' },
    ];
    for (const chip of closeInspectionChips) {
      await addExactSvgViewport(item, {
        path: chip.path,
        box: { x: chip.x, y: 672, width: 72, height: 41 },
        label: `01.02 / CLOSE / EXACT ${chip.label} INSPECTION CHIP`,
        fitMode: 'cover',
        skipBackground: false,
      });
      addText({ text: chip.label, x: chip.x, y: 718, size: 5.8, fill: SIGNAL, target: typeLayer, name: `01.02 / Close / ${chip.label} representation label`, font: FONTS.monoBold, tracking: 0.035 });
    }

    const evidenceY = 900;
    addShape({ x: 80, y: evidenceY, width: 872, height: 174, fill: PAPER_MUTED, target: colourLayer, name: '01.02 / Hero evidence console / Ground' });
    [298, 516, 734].forEach((x, index) => addShape({ x, y: evidenceY, width: 1, height: 174, fill: ASH_300, target: constructionLayer, name: `01.02 / Hero evidence console / Divider ${index + 1}` }));
    const evidenceCells = [
      ['SOURCE', 'SYNTHETIC /\nSINGLE-MASS FIELD'],
      ['INVARIANT', 'ORIENTATION / +18 DEG\nTRACE / ACTIVE'],
      ['TRANSFORM', 'OPTICAL SIZE /\nCROP ONLY'],
      ['STATUS', 'GOVERNED-PROVISIONAL\nNOT VERIFIED'],
    ];
    evidenceCells.forEach(([label, value], index) => {
      const x = 104 + index * 218;
      addText({ text: label, x, y: evidenceY + 24, size: 8, fill: SIGNAL_INK, target: typeLayer, name: `01.02 / Hero evidence console / ${label}`, font: FONTS.monoBold, tracking: 0.075 });
      addText({ text: value, x, y: evidenceY + 68, size: 10, fill: VOID, target: typeLayer, name: `01.02 / Hero evidence console / ${label} value`, font: FONTS.monoBold, tracking: 0.025 });
    });
    addShape({ x: 976, y: evidenceY, width: 384, height: 174, fill: VOID, target: colourLayer, name: '01.02 / Hero closing plate / Ground' });
    addText({ text: 'BEND  >  ABSENCE  >  SIGNAL', x: 1000, y: evidenceY + 24, size: 8.5, fill: ASH_300, target: typeLayer, name: '01.02 / Hero closing plate / Recognition grammar', font: FONTS.monoBold, tracking: 0.055 });
    addText({ text: 'ONE SOURCE.\nTHREE READINGS.', x: 1000, y: evidenceY + 62, size: 19, fill: PAPER, target: typeLayer, name: '01.02 / Hero closing plate / Thesis', font: FONTS.displayBold, tracking: -0.02 });
    addText({ text: 'CATCH THE STARS', x: 1000, y: evidenceY + 138, size: 9, fill: SIGNAL, target: typeLayer, name: '01.02 / Hero closing plate / Permanent phrase', font: FONTS.monoBold, tracking: 0.06 });
    sectionLabel(0, 80, 1094, typeLayer);
    addText({ text: 'Codify recognition at far, normal, and close distances so identity survives speed while rewarding inspection.', x: 80, y: 1122, size: 9, fill: ASH_700, target: typeLayer, name: `01.02 / Section 01 / ${sections[0]} / Exact governed sentence`, font: FONTS.bodyMedium });
    sectionLabel(1, 740, 1094, constructionLayer);
    addText({ text: 'CHOOSE ONE UNCHANGED SOURCE  /  APPROVED OPTICAL CROP ONLY  /  ANNOTATE EACH REVEAL', x: 740, y: 1122, size: 7.8, fill: ASH_700, target: constructionLayer, name: `01.02 / Section 02 / ${sections[1]} / Exact construction steps`, font: FONTS.monoBold, tracking: 0.025 });
    addShape({ x: 80, y: 1160, width: 1280, height: 38, fill: VOID, target: colourLayer, name: '01.02 / Hero / Exact source status rail' });
    addText({ text: 'MODEL / SINGLE-MASS-LENSING-FIELD 1.0.0  /  ALGORITHM / BIZARRE-ATLAS-SINGLE-MASS 1.0.0  /  FIELD HASH / 7E35C8CC2641  /  APERTURE PATH / BB4079E12E6D  /  NOT VERIFIED', x: 104, y: 1173, size: 7.2, fill: SIGNAL, target: evidenceLayer, name: '01.02 / Hero / Factual model and source status', font: FONTS.monoBold, tracking: 0.02 });

    const resolveY = 1240;
    addShape({ x: 80, y: resolveY, width: 1280, height: 456, fill: VOID, target: colourLayer, name: '01.02 / Resolve matrix / Deep Void ground' });
    addShape({ x: 80, y: resolveY, width: 12, height: 456, fill: SIGNAL, target: colourLayer, name: '01.02 / Resolve matrix / Signal index' });
    addText({ text: 'THREE DISTANCES / ONE FIELD', x: 112, y: resolveY + 30, size: 23, fill: PAPER, target: variantsLayer, name: '01.02 / Resolve matrix / Heading', font: FONTS.displayBold, tracking: -0.02 });
    addText({ text: 'DETAIL ARRIVES IN A CONTROLLED ORDER.', x: 112, y: resolveY + 78, size: 9, fill: ASH_300, target: typeLayer, name: '01.02 / Resolve matrix / Definition', font: FONTS.monoBold, tracking: 0.05 });
    const resolveColumns = [
      {
        x: 112,
        label: 'FAR / SILHOUETTE',
        path: SOURCE_PATHS.atlasContoursLarge,
        filter: (attributes) => attributes['data-layer'] === 'continuous-lens-aperture'
          || attributes['data-layer'] === 'signal-trajectory'
          || (attributes['data-layer'] === 'field-line' && attributes['data-line-kind'] === 'major'),
        sentence: 'Signal Lime, lensing bend, and the aperture silhouette survive at speed or across a room.',
      },
      {
        x: 522,
        label: 'NORMAL / FUNCTION',
        path: SOURCE_PATHS.atlasSpectralLarge,
        sentence: 'Instrument indices, contour families, spectral fields, real metadata, and bilingual structure become readable.',
      },
      {
        x: 932,
        label: 'CLOSE / EVIDENCE',
        path: SOURCE_PATHS.atlasHatchLarge,
        sentence: 'Dots, hatching, microtext, grain, gloss/matte layers, foil, UV, reflective media, and alternate representations reward inspection.',
      },
    ];
    for (const column of resolveColumns) {
      addText({ text: column.label, x: column.x, y: resolveY + 124, size: 11, fill: column.label.startsWith('CLOSE') ? SIGNAL : PAPER, target: variantsLayer, name: `01.02 / Resolve matrix / ${column.label} heading`, font: FONTS.monoBold, tracking: 0.055 });
      await addExactSvgViewport(item, {
        path: column.path,
        box: { x: column.x, y: resolveY + 158, width: 340, height: 150 },
        label: `01.02 / RESOLVE / ${column.label} / EXACT GOVERNED SOURCE`,
        fitMode: 'cover',
        skipBackground: false,
        pathFilter: column.filter || null,
      });
      addShape({ x: column.x, y: resolveY + 326, width: 340, height: 1, fill: column.label.startsWith('CLOSE') ? SIGNAL : IRON, target: constructionLayer, name: `01.02 / Resolve matrix / ${column.label} / Evidence datum` });
      addText({ text: wrap(column.sentence, 52), x: column.x, y: resolveY + 346, size: 8.3, fill: PAPER, target: variantsLayer, name: `01.02 / Resolve matrix / ${column.label} / Exact owner sentence`, font: FONTS.bodyMedium });
    }
    addText({ text: 'DEFINITION / CODIFY RECOGNITION AT FAR, NORMAL, AND CLOSE DISTANCES SO IDENTITY SURVIVES SPEED WHILE REWARDING INSPECTION.', x: 112, y: resolveY + 424, size: 8.2, fill: SIGNAL, target: variantsLayer, name: '01.02 / Resolve matrix / Exact definition rail', font: FONTS.monoBold, tracking: 0.025 });

    const grammarY = 1720;
    addText({ text: 'RECOGNITION GRAMMAR', x: 80, y: grammarY, size: 12, fill: SIGNAL_INK, target: usageLayer, name: '01.02 / Recognition grammar / Heading', font: FONTS.monoBold, tracking: 0.08 });
    await addExactSvgViewport(item, {
      path: SOURCE_PATHS.atlasContoursLarge,
      box: { x: 80, y: grammarY + 38, width: 1280, height: 304 },
      label: '01.02 / RECOGNITION GRAMMAR / EXACT atlasContoursLarge.svg / COVER CROP',
      fitMode: 'cover',
      skipBackground: false,
    });
    const grammarTerms = [
      { x: 104, label: 'BEND', fill: PAPER },
      { x: 532, label: 'ABSENCE', fill: PAPER },
      { x: 988, label: 'SIGNAL', fill: SIGNAL },
    ];
    grammarTerms.forEach(({ x, label, fill }, index) => {
      addShape({ x, y: grammarY + 96, width: index === 1 ? 300 : 260, height: 82, fill: RGBA8(14, 14, 14, 224), target: colourLayer, name: `01.02 / Recognition grammar / ${label} plate` });
      addText({ text: `${String(index + 1).padStart(2, '0')} / ${label}`, x: x + 22, y: grammarY + 120, size: 20, fill, target: usageLayer, name: `01.02 / Recognition grammar / ${label}`, font: FONTS.displayBold, tracking: -0.015 });
    });
    const applicationContexts = ['IDENTITY APPROVAL', 'VEHICLE RECOGNITION', 'SIGNAGE', 'COMPONENTS', 'MOCKUP QA'];
    applicationContexts.forEach((context, index) => {
      const x = 104 + index * 244;
      addShape({ x, y: grammarY + 246, width: 220, height: 36, fill: RGBA8(14, 14, 14, 224), target: usageLayer, name: `01.02 / Application proof / ${context} / Ground` });
      addShape({ x, y: grammarY + 246, width: 6, height: 36, fill: index === 4 ? SIGNAL : ASH_300, target: usageLayer, name: `01.02 / Application proof / ${context} / Register` });
      addText({ text: context, x: x + 18, y: grammarY + 258, size: 7.2, fill: index === 4 ? SIGNAL : PAPER, target: usageLayer, name: `01.02 / Application proof / ${context}`, font: FONTS.monoBold, tracking: 0.035 });
    });
    sectionLabel(4, 104, grammarY + 306, usageLayer, SIGNAL);
    addText({ text: 'USE FOR IDENTITY APPROVAL, VEHICLE RECOGNITION, SIGNAGE, COMPONENTS, AND MOCKUP QA.', x: 386, y: grammarY + 306, size: 7.8, fill: PAPER, target: usageLayer, name: `01.02 / Section 05 / ${sections[4]} / Exact governed content`, font: FONTS.monoBold, tracking: 0.02 });

    const opticalY = 2130;
    addShape({ x: 80, y: opticalY, width: 1280, height: 396, fill: PAPER_MUTED, target: colourLayer, name: '01.02 / Optical-size ruler / Ground' });
    addText({ text: 'OPTICAL-SIZE RULER', x: 112, y: opticalY + 28, size: 18, fill: VOID, target: variantsLayer, name: '01.02 / Optical-size ruler / Heading', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: 'NO SCALE MAY INVENT A NEW SILHOUETTE.', x: 112, y: opticalY + 68, size: 9, fill: SIGNAL_INK, target: variantsLayer, name: '01.02 / Optical-size ruler / Invariant', font: FONTS.monoBold, tracking: 0.05 });
    addShape({ x: 112, y: opticalY + 112, width: 1216, height: 2, fill: VOID, target: constructionLayer, name: '01.02 / Optical-size ruler / Primary measure' });
    for (let index = 0; index <= 64; index += 1) {
      const major = index % 16 === 0;
      addShape({ x: 112 + index * 19, y: opticalY + 112 - (major ? 9 : 4), width: 1, height: major ? 20 : 9, fill: major ? SIGNAL_INK : ASH_500, target: constructionLayer, name: `01.02 / Optical-size ruler / Tick ${String(index + 1).padStart(2, '0')}` });
    }
    const opticalSizes = [
      { label: 'MICRO / <48 PX', path: SOURCE_PATHS.atlasMicro, x: 112, status: 'EXACT GOVERNED-PROVISIONAL DERIVATIVE' },
      { label: 'SMALL / 48-96 PX', path: null, x: 356, status: 'ASSET REQUIRED / NOT VERIFIED' },
      { label: 'MEDIUM / 96-320 PX', path: SOURCE_PATHS.atlasContoursDark, x: 600, status: 'EXACT GOVERNED-PROVISIONAL DERIVATIVE' },
      { label: 'LARGE / >320 PX', path: SOURCE_PATHS.atlasContoursLarge, x: 844, status: 'EXACT GOVERNED-PROVISIONAL DERIVATIVE' },
      { label: 'FIELD / ENVIRONMENTAL CROP', path: null, x: 1088, status: 'ASSET REQUIRED / NOT VERIFIED' },
    ];
    for (const [index, optical] of opticalSizes.entries()) {
      const boxY = opticalY + 142;
      const box = { x: optical.x, y: boxY, width: 220, height: 124 };
      if (optical.path) {
        await addExactSvgViewport(item, {
          path: optical.path,
          box,
          label: `01.02 / OPTICAL SIZE / ${optical.label} / EXACT SOURCE`,
          fitMode: 'contain',
          skipBackground: false,
        });
      } else {
        addShape({ ...box, fill: VOID, target: variantsLayer, name: `01.02 / Optical size / ${optical.label} / Blocked bay` });
        addShape({ x: box.x, y: box.y, width: 12, height: box.height, fill: SIGNAL, target: variantsLayer, name: `01.02 / Optical size / ${optical.label} / Blocked rail` });
        addText({ text: 'ASSET REQUIRED\nNOT VERIFIED', x: box.x + 32, y: box.y + 38, size: 10, fill: PAPER, target: variantsLayer, name: `01.02 / Optical size / ${optical.label} / Blocked status`, font: FONTS.monoBold, tracking: 0.04 });
      }
      addText({ text: `${String(index + 1).padStart(2, '0')} / ${optical.label}`, x: optical.x, y: opticalY + 282, size: 8.5, fill: optical.path ? VOID : SIGNAL_INK, target: variantsLayer, name: `01.02 / Optical size / ${optical.label} label`, font: FONTS.monoBold, tracking: 0.04 });
      addText({ text: optical.status, x: optical.x, y: opticalY + 310, size: 5.8, fill: ASH_700, target: variantsLayer, name: `01.02 / Optical size / ${optical.label} status`, font: FONTS.monoBold, tracking: 0.025 });
    }
    sectionLabel(3, 112, opticalY + 342, variantsLayer);
    addText({ text: 'TEST MICRO, SMALL, MEDIUM, LARGE, AND FIELD OPTICAL SIZES; NO SCALE MAY INVENT A NEW SILHOUETTE. THRESHOLD EVIDENCE / NOT VERIFIED.', x: 352, y: opticalY + 342, size: 7.5, fill: ASH_700, target: variantsLayer, name: `01.02 / Section 04 / ${sections[3]} / Exact governed content`, font: FONTS.monoBold, tracking: 0.02 });

    const exampleY = 2590;
    addShape({ x: 80, y: exampleY, width: 620, height: 318, fill: PAPER_MUTED, target: colourLayer, name: '01.02 / Correct example / Ground' });
    addShape({ x: 80, y: exampleY, width: 12, height: 318, fill: SIGNAL, target: colourLayer, name: '01.02 / Correct example / Signal rail' });
    addShape({ x: 740, y: exampleY, width: 620, height: 318, fill: VOID, target: colourLayer, name: '01.02 / Misuse / Ground' });
    addText({ text: 'CORRECT / SAME PHYSICS', x: 116, y: exampleY + 28, size: 16, fill: VOID, target: rulesLayer, name: '01.02 / Correct example / Heading', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: 'MISUSE / FULL RES BELOW MINIMUM', x: 776, y: exampleY + 28, size: 14, fill: PAPER, target: rulesLayer, name: '01.02 / Misuse / Heading', font: FONTS.displayBold, tracking: -0.018 });
    const correctBoxes = [
      { x: 116, y: exampleY + 86, width: 126, height: 71 },
      { x: 262, y: exampleY + 74, width: 170, height: 96 },
      { x: 452, y: exampleY + 60, width: 214, height: 121 },
    ];
    for (const [index, box] of correctBoxes.entries()) {
      await addExactSvgViewport(item, { path: SOURCE_PATHS.atlasContoursLarge, box, label: `01.02 / CORRECT / SAME SOURCE ${index + 1}`, fitMode: 'contain', skipBackground: false });
    }
    const misuseBoxes = [
      { x: 776, y: exampleY + 102, width: 86, height: 48 },
      { x: 914, y: exampleY + 102, width: 86, height: 48 },
      { x: 1052, y: exampleY + 102, width: 86, height: 48 },
    ];
    for (const [index, box] of misuseBoxes.entries()) {
      await addExactSvgViewport(item, { path: SOURCE_PATHS.atlasContoursLarge, box, label: `01.02 / MISUSE / FULL SOURCE BELOW MINIMUM ${index + 1}`, fitMode: 'contain', skipBackground: false });
      addShape({ x: box.x, y: box.y + box.height + 10, width: box.width, height: 4, fill: SIGNAL, target: rulesLayer, name: `01.02 / Misuse / Failure indicator ${index + 1}` });
    }
    sectionLabel(8, 116, exampleY + 208, rulesLayer);
    addText({ text: wrap(exactCopy(8), 78), x: 116, y: exampleY + 232, size: 6.4, fill: ASH_700, target: rulesLayer, name: `01.02 / Section 09 / ${sections[8]} / Exact governed content`, font: FONTS.bodyMedium });
    sectionLabel(9, 776, exampleY + 208, rulesLayer, SIGNAL);
    addText({ text: wrap(exactCopy(9), 78), x: 776, y: exampleY + 232, size: 5.8, fill: ASH_300, target: rulesLayer, name: `01.02 / Section 10 / ${sections[9]} / Exact governed content`, font: FONTS.bodyMedium });

    const governanceY = 2970;
    addShape({ x: 80, y: governanceY, width: 1280, height: 418, fill: VOID, target: colourLayer, name: '01.02 / Governance and operations / Ground' });
    const operationColumns = [
      { index: 5, x: 112, width: 360, heading: 'ACCESS', cue: 'LABEL + SHAPE + POSITION', state: 'BILINGUAL PUBLIC READINESS / NOT VERIFIED' },
      { index: 6, x: 520, width: 360, heading: 'MOTION', cue: 'N/A / STATIC COMPARISON', state: 'ROUTE / 08 / CAPTURE' },
      { index: 7, x: 928, width: 400, heading: 'EXPORT', cue: 'DOCUMENTATION / AFTER VERIFICATION', state: 'EMBEDDED PROVISIONAL / NONPUBLISHABLE' },
    ];
    operationColumns.forEach((operation, index) => {
      addText({ text: operation.heading, x: operation.x, y: governanceY + 34, size: 21, fill: index === 2 ? SIGNAL : PAPER, target: index === 2 ? productionLayer : accessLayer, name: `01.02 / Governance / ${operation.heading}`, font: FONTS.displayBold, tracking: -0.018 });
      addText({ text: operation.cue, x: operation.x, y: governanceY + 78, size: 8.5, fill: SIGNAL, target: index === 2 ? productionLayer : accessLayer, name: `01.02 / Governance / ${operation.heading} cue`, font: FONTS.monoBold, tracking: 0.045 });
      addShape({ x: operation.x, y: governanceY + 112, width: operation.width, height: 54, fill: IRON, target: index === 2 ? productionLayer : accessLayer, name: `01.02 / Governance / ${operation.heading} state register` });
      addShape({ x: operation.x, y: governanceY + 112, width: 12, height: 54, fill: index === 2 ? SIGNAL : ASH_300, target: index === 2 ? productionLayer : accessLayer, name: `01.02 / Governance / ${operation.heading} state rail` });
      addText({ text: operation.state, x: operation.x + 28, y: governanceY + 130, size: 8, fill: PAPER, target: index === 2 ? productionLayer : accessLayer, name: `01.02 / Governance / ${operation.heading} state`, font: FONTS.monoBold, tracking: 0.035 });
    });
    sectionLabel(5, 112, governanceY + 190, accessLayer, SIGNAL);
    addText({ text: wrap(exactCopy(5), 58), x: 112, y: governanceY + 214, size: 5.6, fill: ASH_300, target: accessLayer, name: `01.02 / Section 06 / ${sections[5]} / Exact governed content`, font: FONTS.bodyMedium });
    sectionLabel(6, 520, governanceY + 190, accessLayer, SIGNAL);
    addText({ text: wrap(exactCopy(6), 58), x: 520, y: governanceY + 214, size: 5.6, fill: ASH_300, target: accessLayer, name: `01.02 / Section 07 / ${sections[6]} / Exact governed content`, font: FONTS.bodyMedium });
    sectionLabel(7, 928, governanceY + 190, productionLayer, SIGNAL);
    addText({ text: wrap(exactCopy(7), 68), x: 928, y: governanceY + 214, size: 5.6, fill: ASH_300, target: productionLayer, name: `01.02 / Section 08 / ${sections[7]} / Exact governed content`, font: FONTS.bodyMedium });
    addShape({ x: 112, y: governanceY + 298, width: 1216, height: 1, fill: IRON, target: constructionLayer, name: '01.02 / Governance / Provenance separator' });
    sectionLabel(10, 112, governanceY + 314, evidenceLayer, SIGNAL);
    addText({ text: wrap(exactCopy(10), 118), x: 112, y: governanceY + 336, size: 4.6, fill: ASH_300, target: evidenceLayer, name: `01.02 / Section 11 / ${sections[10]} / Exact governed content`, font: FONTS.bodyMedium });
    sectionLabel(11, 720, governanceY + 314, evidenceLayer, SIGNAL);
    addText({ text: wrap(exactCopy(11), 118), x: 720, y: governanceY + 336, size: 4.6, fill: ASH_300, target: evidenceLayer, name: `01.02 / Section 12 / ${sections[11]} / Exact governed content`, font: FONTS.bodyMedium });
    addText({ text: 'NATIVE AFFINITY VECTORS  /  EXACT GOVERNED SOURCE  /  NO IMAGEGEN  /  VERIFICATION NOT VERIFIED', x: 112, y: governanceY + 394, size: 8.5, fill: SIGNAL, target: evidenceLayer, name: '01.02 / Governance / Native build status', font: FONTS.monoBold, tracking: 0.04 });
    return 3388;
  }

  async function addSingleIdentityNativeIntegrationPage(item) {
    const { subject, layers } = item;
    const constructionLayer = layers.get('10 / Construction');
    const assetLayer = layers.get('20 / Canonical Assets');
    const typeLayer = layers.get('30 / Live Type and Metadata');
    const colourLayer = layers.get('40 / Color, Gradient, Pattern, or Material');
    const variantsLayer = layers.get('50 / Variants, States, and Optical Sizes');
    const usageLayer = layers.get('60 / Usage and Applications');
    const accessLayer = layers.get('70 / Accessibility, Bilingual, RTL, and Motion');
    const productionLayer = layers.get('80 / Production and Export');
    const rulesLayer = layers.get('90 / Correct Use and Misuse');
    const evidenceLayer = layers.get('99 / Provenance, Status, Evidence, and Navigation');
    const sections = subject.anatomy;

    function sectionLabel(index, x, y, target, fill = SIGNAL_INK) {
      addText({
        text: `${String(index + 1).padStart(2, '0')} / ${sections[index].toUpperCase()}`,
        x,
        y,
        size: 9,
        fill,
        target,
        name: `01.03 / Section ${String(index + 1).padStart(2, '0')} / ${sections[index]} / Canonical label`,
        font: FONTS.monoBold,
        tracking: 0.055,
      });
    }

    function statusRegister(x, y, width, label, state, target, options = {}) {
      const ground = options.dark === false ? PAPER_MUTED : VOID_RAISED;
      const foreground = options.dark === false ? VOID : PAPER;
      const rail = options.rail || (state.includes('NOT VERIFIED') || state.includes('REQUIRED') ? ASH_300 : SIGNAL);
      addShape({ x, y, width, height: 74, fill: ground, target, name: `01.03 / ${label} / Boundary register` });
      addShape({ x, y, width: 10, height: 74, fill: rail, target, name: `01.03 / ${label} / Boundary rail` });
      addText({ text: label, x: x + 26, y: y + 14, size: 9, fill: rail === SIGNAL ? SIGNAL : ASH_500, target: typeLayer, name: `01.03 / ${label} / Label`, font: FONTS.monoBold, tracking: 0.05 });
      addText({ text: state, x: x + 26, y: y + 40, size: 10, fill: foreground, target: typeLayer, name: `01.03 / ${label} / State`, font: FONTS.monoBold, tracking: 0.025 });
    }

    addText({ text: 'INTEGRATE. DO NOT REPLACE.', x: 80, y: 406, size: 28, fill: VOID, target: typeLayer, name: '01.03 / Hero / Integration thesis', font: FONTS.displayBold, tracking: -0.022 });
    addText({ text: 'ONE IDENTITY  /  HOST SYSTEM FIRST  /  RECOGNIZABLE WITHOUT RESKINNING', x: 82, y: 458, size: 10, fill: ASH_700, target: typeLayer, name: '01.03 / Hero / Authority boundary', font: FONTS.monoBold, tracking: 0.055 });

    const instrumentY = 510;
    addShape({ x: 80, y: instrumentY, width: 1280, height: 980, fill: VOID, target: colourLayer, name: '01.03 / Native integration chassis / Deep Void ground' });
    addShape({ x: 80, y: instrumentY, width: 12, height: 980, fill: SIGNAL, target: colourLayer, name: '01.03 / Native integration chassis / Single-identity index' });

    addShape({ x: 112, y: instrumentY + 34, width: 1216, height: 206, fill: VOID_RAISED, target: colourLayer, name: '01.03 / Identity / Bizarre Industries instrument plate' });
    addShape({ x: 112, y: instrumentY + 34, width: 1216, height: 12, fill: SIGNAL, target: colourLayer, name: '01.03 / Identity / Fixed identity rail' });
    addText({ text: 'BIZARRE INDUSTRIES', x: 144, y: instrumentY + 78, size: 34, fill: PAPER, target: typeLayer, name: '01.03 / Identity / Exact public name', font: FONTS.displayBold, tracking: -0.025 });
    addText({ text: 'THE ONLY IDENTITY  /  ONE RECOGNITION SYSTEM', x: 146, y: instrumentY + 148, size: 11, fill: SIGNAL, target: typeLayer, name: '01.03 / Identity / Rule', font: FONTS.monoBold, tracking: 0.055 });
    addText({ text: 'PUBLIC IDENTITY / ONE\nRECOGNITION SYSTEM / ONE\nNATIVE HOSTS / MULTIPLE', x: 890, y: instrumentY + 76, size: 10, fill: ASH_300, target: typeLayer, name: '01.03 / Identity / Governed properties', font: FONTS.monoBold, tracking: 0.035 });

    addShape({ x: 164, y: instrumentY + 278, width: 1112, height: 16, fill: IRON, target: constructionLayer, name: '01.03 / Native integration chassis / Host-system bus' });
    [292, 708, 1124].forEach((cx, index) => {
      addShape({ x: cx - 6, y: instrumentY + 238, width: 12, height: 76, fill: index === 0 ? SIGNAL : ASH_300, target: constructionLayer, name: `01.03 / Native integration chassis / Platform junction ${index + 1}` });
      addShape({ x: cx - 9, y: instrumentY + 281, width: 18, height: 18, fill: index === 0 ? SIGNAL : ASH_300, target: assetLayer, name: `01.03 / Native integration chassis / Registered platform ${index + 1}`, shape: ShapeEllipse.create() });
    });

    const platformPlates = [
      { x: 112, title: 'WEB PRODUCT', role: 'EXISTING COMPONENT SYSTEM', boundary: 'REACT / IMPLEMENTATION, NOT A LOOK', rail: SIGNAL },
      { x: 528, title: 'iOS', role: 'SWIFTUI + iOS CONVENTIONS', boundary: 'TOUCH / DYNAMIC TYPE / NATIVE CONTROLS', rail: ASH_300 },
      { x: 944, title: 'macOS', role: 'SWIFTUI + macOS CONVENTIONS', boundary: 'WINDOWS / MENUS / KEYBOARD / PRECISION INPUT', rail: ASH_300 },
    ];
    platformPlates.forEach((plate) => {
      addShape({ x: plate.x, y: instrumentY + 322, width: 384, height: 214, fill: VOID_RAISED, target: colourLayer, name: `01.03 / Platform / ${plate.title} / Host plate` });
      addShape({ x: plate.x, y: instrumentY + 322, width: 10, height: 214, fill: plate.rail, target: colourLayer, name: `01.03 / Platform / ${plate.title} / Recognition rail` });
      addText({ text: plate.title, x: plate.x + 30, y: instrumentY + 356, size: 26, fill: PAPER, target: typeLayer, name: `01.03 / Platform / ${plate.title} / Name`, font: FONTS.displayBold, tracking: -0.02 });
      addText({ text: plate.role, x: plate.x + 30, y: instrumentY + 416, size: 10, fill: plate.rail === SIGNAL ? SIGNAL : ASH_300, target: typeLayer, name: `01.03 / Platform / ${plate.title} / Host rule`, font: FONTS.monoBold, tracking: 0.05 });
      addText({ text: wrap(plate.boundary, 44), x: plate.x + 30, y: instrumentY + 474, size: 8.5, fill: ASH_300, target: typeLayer, name: `01.03 / Platform / ${plate.title} / Native boundary`, font: FONTS.monoBold, tracking: 0.035 });
    });

    addShape({ x: 112, y: instrumentY + 582, width: 1216, height: 164, fill: PAPER_MUTED, target: colourLayer, name: '01.03 / Host ownership / Rule plane' });
    addShape({ x: 112, y: instrumentY + 582, width: 12, height: 164, fill: SIGNAL, target: colourLayer, name: '01.03 / Host ownership / Signal index' });
    addText({ text: 'HOST SYSTEM / PRIMARY CHASSIS', x: 146, y: instrumentY + 616, size: 18, fill: VOID, target: typeLayer, name: '01.03 / Host ownership / Heading', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: 'NAVIGATION  /  CONTROLS  /  INPUT  /  ACCESSIBILITY  /  TYPOGRAPHY DEFAULTS  /  DENSITY  /  MOTION GRAMMAR', x: 146, y: instrumentY + 666, size: 10, fill: SIGNAL_INK, target: typeLayer, name: '01.03 / Host ownership / Exact boundary', font: FONTS.monoBold, tracking: 0.035 });

    addShape({ x: 112, y: instrumentY + 784, width: 1216, height: 144, fill: VOID_RAISED, target: colourLayer, name: '01.03 / Bizarre recognition layer / Separate ground' });
    for (let index = 0; index < 26; index += 1) {
      addShape({ x: 144 + index * 44, y: instrumentY + 808, width: 22, height: 4, fill: index % 4 === 0 ? SIGNAL : ASH_700, target: constructionLayer, name: `01.03 / Bizarre recognition layer / Restrained signal segment ${String(index + 1).padStart(2, '0')}` });
    }
    addText({ text: 'BIZARRE RECOGNITION / RESTRAINED LAYER', x: 144, y: instrumentY + 842, size: 16, fill: PAPER, target: typeLayer, name: '01.03 / Bizarre recognition layer / Scope', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: 'OPERATIONAL SIGNAL  /  VOICE  /  COMPOSITION  /  DATA VISUALIZATION  /  RARE IDENTITY MOMENTS', x: 144, y: instrumentY + 884, size: 9, fill: SIGNAL, target: typeLayer, name: '01.03 / Bizarre recognition layer / Exact boundary', font: FONTS.monoBold, tracking: 0.045 });

    sectionLabel(0, 112, instrumentY + 944, typeLayer, SIGNAL);
    addText({ text: 'Bizarre Industries is the only identity. Products preserve the host and receive a restrained recognition layer.', x: 380, y: instrumentY + 944, size: 8.5, fill: ASH_300, target: typeLayer, name: '01.03 / Section 01 / Exact governed definition', font: FONTS.bodyMedium });
    sectionLabel(1, 112, instrumentY + 968, constructionLayer, SIGNAL);
    addText({ text: 'AUDIT HOST  /  PRESERVE NATIVE  /  APPLY RESTRAINED LAYER  /  VERIFY NATIVE + RECOGNIZABLE', x: 380, y: instrumentY + 968, size: 8.5, fill: ASH_300, target: constructionLayer, name: '01.03 / Section 02 / Construction sequence', font: FONTS.monoBold, tracking: 0.025 });

    const matrixY = 1540;
    addShape({ x: 80, y: matrixY, width: 1280, height: 642, fill: PAPER_MUTED, target: colourLayer, name: '01.03 / Native integration matrix / Ground' });
    addShape({ x: 80, y: matrixY, width: 1280, height: 82, fill: VOID, target: colourLayer, name: '01.03 / Native integration matrix / Header ground' });
    addText({ text: 'NATIVE INTEGRATION MATRIX', x: 112, y: matrixY + 24, size: 22, fill: PAPER, target: variantsLayer, name: '01.03 / Native integration matrix / Heading', font: FONTS.displayBold, tracking: -0.02 });
    addText({ text: 'ONE IDENTITY / MULTIPLE HOST SYSTEMS', x: 890, y: matrixY + 34, size: 9, fill: SIGNAL, target: variantsLayer, name: '01.03 / Native integration matrix / Scope rail', font: FONTS.monoBold, tracking: 0.045 });

    const columns = [
      { x: 112, width: 300, label: 'RULE' },
      { x: 412, width: 184, label: 'IDENTITY' },
      { x: 596, width: 184, label: 'WEB' },
      { x: 780, width: 184, label: 'iOS' },
      { x: 964, width: 184, label: 'macOS' },
      { x: 1148, width: 180, label: 'OTHER' },
    ];
    columns.forEach((column, index) => {
      addText({ text: column.label, x: column.x + 12, y: matrixY + 100, size: 9, fill: index === 1 ? SIGNAL_INK : VOID, target: variantsLayer, name: `01.03 / Native integration matrix / Column ${column.label}`, font: FONTS.monoBold, tracking: 0.05 });
      if (index > 0) addShape({ x: column.x, y: matrixY + 82, width: 1, height: 510, fill: ASH_300, target: constructionLayer, name: `01.03 / Native integration matrix / Column divider ${index}` });
    });

    const matrixRows = [
      ['IDENTITY MODEL', 'BIZARRE ONLY', 'HOST PRODUCT', 'HOST PRODUCT', 'HOST PRODUCT', 'HOST PRODUCT'],
      ['HOST VISUAL LANGUAGE', 'RESTRAINED LAYER', 'EXISTING SYSTEM', 'iOS NATIVE', 'macOS NATIVE', 'AUDIT REQUIRED'],
      ['BEHAVIOR OWNER', 'HOST-FIRST RULE', 'HOST APP', 'HOST APP', 'HOST APP', 'HOST APP'],
      ['COMPONENT STRATEGY', 'REUSE -> WRAP -> LOCAL', 'EXISTING PRIMITIVES', 'SYSTEM CONTROLS', 'SYSTEM CONTROLS', 'NATIVE FIRST'],
      ['BIZARRE EXPRESSION', 'ONE IDENTITY', 'FUNCTIONAL + RARE', 'FUNCTIONAL + RARE', 'FUNCTIONAL + RARE', 'FUNCTIONAL + RARE'],
      ['SIGNAL LIME', 'OPERATIONAL', 'STATE ONLY', 'STATE ONLY', 'STATE ONLY', 'STATE ONLY'],
      ['ACCESS + MOTION', 'HOST CONVENTION', 'PRESERVE', 'PRESERVE', 'PRESERVE', 'PRESERVE'],
    ];
    matrixRows.forEach((row, rowIndex) => {
      const y = matrixY + 132 + rowIndex * 64;
      addShape({ x: 112, y: y + 46, width: 1216, height: 1, fill: ASH_300, target: constructionLayer, name: `01.03 / Native integration matrix / Row divider ${rowIndex + 1}` });
      row.forEach((value, columnIndex) => {
        const column = columns[columnIndex];
        const unresolved = /REQUIRED|AUDIT/.test(value);
        addText({
          text: value,
          x: column.x + 12,
          y,
          size: columnIndex === 0 ? 8.5 : 7.6,
          fill: columnIndex === 1 ? SIGNAL_INK : unresolved ? ASH_700 : VOID,
          target: variantsLayer,
          name: `01.03 / Native integration matrix / ${row[0]} / ${columns[columnIndex].label}`,
          font: FONTS.monoBold,
          tracking: 0.025,
        });
      });
    });
    addShape({ x: 112, y: matrixY + 594, width: 1216, height: 34, fill: VOID, target: colourLayer, name: '01.03 / Native integration matrix / Authority footer' });
    addText({ text: 'HOST CONVENTION WINS EVERY CONFLICT. BIZARRE NEVER REPLACES THE PRODUCT CHASSIS.', x: 136, y: matrixY + 606, size: 9, fill: SIGNAL, target: variantsLayer, name: '01.03 / Native integration matrix / Authority statement', font: FONTS.monoBold, tracking: 0.04 });
    sectionLabel(2, 112, matrixY + 646, evidenceLayer);
    addText({ text: 'IDENTITY.JSON  /  UI CONTRACT  /  ARCHITECTURE  /  OFFICIAL PLATFORM RESEARCH  /  ZERO IMAGEGEN', x: 510, y: matrixY + 646, size: 7.8, fill: ASH_700, target: evidenceLayer, name: '01.03 / Section 03 / Exact source rail', font: FONTS.monoBold, tracking: 0.02 });

    const integrationY = 2250;
    addShape({ x: 80, y: integrationY, width: 1280, height: 300, fill: VOID, target: colourLayer, name: '01.03 / Integration sequence / Deep Void ground' });
    addText({ text: 'INTEGRATION SEQUENCE', x: 112, y: integrationY + 28, size: 20, fill: PAPER, target: usageLayer, name: '01.03 / Integration sequence / Heading', font: FONTS.displayBold, tracking: -0.018 });
    addText({ text: 'HOST FIRST  /  BIZARRE SECOND', x: 1000, y: integrationY + 36, size: 8.5, fill: SIGNAL, target: usageLayer, name: '01.03 / Integration sequence / Reading order', font: FONTS.monoBold, tracking: 0.05 });
    addShape({ x: 138, y: integrationY + 130, width: 1138, height: 4, fill: IRON, target: constructionLayer, name: '01.03 / Integration sequence / Continuous host rail' });
    const integrationSteps = [
      { x: 112, label: '01 / AUDIT', state: 'EXISTING INFRASTRUCTURE', rule: 'COMPONENTS / FLOWS / TOKENS', rail: SIGNAL },
      { x: 416, label: '02 / PRESERVE', state: 'NATIVE BEHAVIOR', rule: 'NAV / CONTROL / INPUT / ACCESS', rail: ASH_300 },
      { x: 720, label: '03 / LAYER', state: 'RESTRAINED BIZARRE', rule: 'SIGNAL / VOICE / DATA / MOMENT', rail: ASH_300 },
      { x: 1024, label: '04 / VERIFY', state: 'NATIVE + RECOGNIZABLE', rule: 'HOST CHARACTER STILL PRIMARY', rail: ASH_300 },
    ];
    integrationSteps.forEach((step, index) => {
      addShape({ x: step.x, y: integrationY + 84, width: 280, height: 142, fill: VOID_RAISED, target: usageLayer, name: `01.03 / Integration sequence / ${step.label} / Ground` });
      addShape({ x: step.x, y: integrationY + 84, width: 10, height: 142, fill: step.rail, target: usageLayer, name: `01.03 / Integration sequence / ${step.label} / Rail` });
      addShape({ x: step.x + 124, y: integrationY + 119, width: 22, height: 22, fill: index === 0 ? SIGNAL : PAPER, target: assetLayer, name: `01.03 / Integration sequence / ${step.label} / Registered datum`, shape: ShapeEllipse.create() });
      addText({ text: step.label, x: step.x + 24, y: integrationY + 98, size: 9, fill: step.rail === SIGNAL ? SIGNAL : ASH_300, target: usageLayer, name: `01.03 / Integration sequence / ${step.label} / Label`, font: FONTS.monoBold, tracking: 0.05 });
      addText({ text: step.state, x: step.x + 24, y: integrationY + 154, size: 13, fill: PAPER, target: usageLayer, name: `01.03 / Integration sequence / ${step.label} / State`, font: FONTS.displayBold, tracking: -0.015 });
      addText({ text: step.rule, x: step.x + 24, y: integrationY + 192, size: 7.2, fill: ASH_300, target: usageLayer, name: `01.03 / Integration sequence / ${step.label} / Rule`, font: FONTS.monoBold, tracking: 0.025 });
    });
    sectionLabel(3, 112, integrationY + 244, variantsLayer, SIGNAL);
    addText({ text: 'WEB / iOS / macOS / OTHER HOSTS KEEP THEIR OWN VISUAL LANGUAGE, BEHAVIOR, AND COMPONENT GRAMMAR.', x: 390, y: integrationY + 244, size: 7.8, fill: ASH_300, target: variantsLayer, name: '01.03 / Section 04 / Host-state rule', font: FONTS.monoBold, tracking: 0.02 });
    sectionLabel(4, 112, integrationY + 272, usageLayer, SIGNAL);
    addText({ text: 'USE BEFORE THEMING, COMPONENT CHANGES, PLATFORM ADAPTATION, OR PROTOTYPE WORK FOR ANY PRODUCT.', x: 390, y: integrationY + 272, size: 7.8, fill: ASH_300, target: usageLayer, name: '01.03 / Section 05 / Exact governed use', font: FONTS.monoBold, tracking: 0.02 });

    const rulesY = 2590;
    addShape({ x: 80, y: rulesY, width: 620, height: 290, fill: PAPER_MUTED, target: colourLayer, name: '01.03 / Correct / Ground' });
    addShape({ x: 80, y: rulesY, width: 12, height: 290, fill: SIGNAL, target: colourLayer, name: '01.03 / Correct / Signal rail' });
    addText({ text: 'CORRECT / NATIVE FIRST, RECOGNIZABLE SECOND', x: 116, y: rulesY + 28, size: 18, fill: VOID, target: rulesLayer, name: '01.03 / Correct / Heading', font: FONTS.displayBold, tracking: -0.018 });
    statusRegister(116, rulesY + 84, 240, 'HOST', 'PRESERVED', rulesLayer, { dark: false, rail: SIGNAL });
    statusRegister(376, rulesY + 84, 288, 'BIZARRE', 'RESTRAINED + FUNCTIONAL', rulesLayer, { dark: false, rail: SIGNAL_INK });
    sectionLabel(8, 116, rulesY + 188, rulesLayer);
    addText({ text: 'The product preserves its host system and platform character. A restrained functional Bizarre layer makes it recognizable.', x: 116, y: rulesY + 220, size: 9, fill: ASH_700, target: rulesLayer, name: '01.03 / Section 09 / Correct sentence', font: FONTS.bodyMedium });

    addShape({ x: 740, y: rulesY, width: 620, height: 290, fill: VOID, target: colourLayer, name: '01.03 / Misuse / Ground' });
    addText({ text: 'MISUSE / REPLACEMENT SKIN', x: 776, y: rulesY + 28, size: 18, fill: PAPER, target: rulesLayer, name: '01.03 / Misuse / Heading', font: FONTS.displayBold, tracking: -0.018 });
    statusRegister(776, rulesY + 84, 240, 'CONTROLS', 'RESKINNED', rulesLayer, { rail: ASH_300 });
    statusRegister(1036, rulesY + 84, 288, 'IDENTITY', 'DERIVATIVE CREATED', rulesLayer, { rail: ASH_300 });
    sectionLabel(9, 776, rulesY + 188, rulesLayer, SIGNAL);
    addText({ text: 'Do not reskin standard controls, replace navigation, invent a React visual language, or force Bizarre styling onto every surface.', x: 776, y: rulesY + 220, size: 9, fill: ASH_300, target: rulesLayer, name: '01.03 / Section 10 / Misuse sentence', font: FONTS.bodyMedium });

    const governanceY = 2920;
    addShape({ x: 80, y: governanceY, width: 1280, height: 448, fill: VOID, target: colourLayer, name: '01.03 / Governance and operations / Ground' });
    const operations = [
      { x: 112, width: 360, heading: 'ACCESS', cue: 'HOST-NATIVE ACCESSIBILITY', state: 'FOCUS / INPUT / TEXT SCALE / SR', index: 5, text: 'Preserve host focus, keyboard, screen-reader, and text-scaling behavior. No public Arabic copy appears on this page.' },
      { x: 520, width: 360, heading: 'MOTION', cue: 'HOST MOTION GRAMMAR FIRST', state: 'REDUCE MOTION / NATIVE + IMMEDIATE', index: 6, text: 'Use Bizarre motion only for governed signal or state moments. Platform timing and reduced-motion behavior remain primary.' },
      { x: 928, width: 400, heading: 'EXPORT', cue: 'LIVE TYPE / EDITABLE VECTORS', state: 'PDF + PNG / AFTER VERIFICATION', index: 7, text: 'No raster reference, logo, gradient, ImageGen reference, or public Arabic copy is embedded on this page.' },
    ];
    operations.forEach((operation, operationIndex) => {
      addText({ text: operation.heading, x: operation.x, y: governanceY + 30, size: 20, fill: operationIndex === 2 ? SIGNAL : PAPER, target: operationIndex === 2 ? productionLayer : accessLayer, name: `01.03 / Governance / ${operation.heading}`, font: FONTS.displayBold, tracking: -0.018 });
      addText({ text: operation.cue, x: operation.x, y: governanceY + 72, size: 8.5, fill: SIGNAL, target: operationIndex === 2 ? productionLayer : accessLayer, name: `01.03 / Governance / ${operation.heading} cue`, font: FONTS.monoBold, tracking: 0.045 });
      addShape({ x: operation.x, y: governanceY + 108, width: operation.width, height: 54, fill: IRON, target: operationIndex === 2 ? productionLayer : accessLayer, name: `01.03 / Governance / ${operation.heading} state register` });
      addShape({ x: operation.x, y: governanceY + 108, width: 10, height: 54, fill: operationIndex === 2 ? SIGNAL : ASH_300, target: operationIndex === 2 ? productionLayer : accessLayer, name: `01.03 / Governance / ${operation.heading} state rail` });
      addText({ text: operation.state, x: operation.x + 26, y: governanceY + 126, size: 8, fill: PAPER, target: operationIndex === 2 ? productionLayer : accessLayer, name: `01.03 / Governance / ${operation.heading} state`, font: FONTS.monoBold, tracking: 0.03 });
      sectionLabel(operation.index, operation.x, governanceY + 184, operationIndex === 2 ? productionLayer : accessLayer, SIGNAL);
      addText({ text: wrap(operation.text, 58), x: operation.x, y: governanceY + 210, size: 7.5, fill: ASH_300, target: operationIndex === 2 ? productionLayer : accessLayer, name: `01.03 / Section ${String(operation.index + 1).padStart(2, '0')} / Governed content`, font: FONTS.bodyMedium });
    });
    addShape({ x: 112, y: governanceY + 286, width: 1216, height: 1, fill: IRON, target: constructionLayer, name: '01.03 / Governance / Provenance separator' });
    sectionLabel(10, 112, governanceY + 306, evidenceLayer, SIGNAL);
    addText({ text: wrap('AUTHORITY / CANONICAL  /  VERIFICATION / NOT VERIFIED  /  PUBLICATION / PUBLISHABLE AFTER VERIFICATION  /  IMAGEGEN / FORBIDDEN  /  LOGO INSTANCES / ZERO  /  GRADIENTS / ZERO', 78), x: 112, y: governanceY + 334, size: 6.4, fill: ASH_300, target: evidenceLayer, name: '01.03 / Section 11 / Provenance summary', font: FONTS.monoBold, tracking: 0.02 });
    sectionLabel(11, 720, governanceY + 306, evidenceLayer, SIGNAL);
    addText({ text: wrap('CATEGORY / 01 BRAND CORE  /  SIBLINGS / 01.00 + 01.01 + 01.02 + 01.04  /  DEPENDENCIES / 09.01 + 09.02 + 12.05  /  SOURCES / IDENTITY + ARCHITECTURE + UI CONTRACT + COMPONENTS + PLATFORM RESEARCH', 78), x: 720, y: governanceY + 334, size: 6.4, fill: ASH_300, target: evidenceLayer, name: '01.03 / Section 12 / Navigation summary', font: FONTS.monoBold, tracking: 0.02 });
    addText({ text: 'NATIVE AFFINITY INTEGRATION INSTRUMENT  /  ONE IDENTITY  /  HOST SYSTEM FIRST  /  NOT VERIFIED', x: 112, y: governanceY + 402, size: 9, fill: SIGNAL, target: evidenceLayer, name: '01.03 / Governance / Native build status', font: FONTS.monoBold, tracking: 0.04 });

    return 3388;
  }

  async function specialVisual(item, palette) {
    const { subject, layers } = item;
    if (subject.id === '01.01') return addSwissWorkingInstrumentPage(item);
    if (subject.id === '01.02') return addThreeDistanceRecognitionPage(item);
    if (subject.id === '01.03') return addSingleIdentityNativeIntegrationPage(item);
    if (subject.categoryId === '07') return addAtlasSubjectVisual(item);
    if (subject.id === '02.01') {
      const boxes = [
        { x: 80, path: SOURCE_PATHS.markTransparent, ground: VOID, fill: '#C6FF24', label: 'SIGNAL LIME' },
        { x: 520, path: SOURCE_PATHS.markTransparent, ground: SIGNAL, fill: '#0E0E0E', label: 'BLACK ON SIGNAL' },
        { x: 960, path: SOURCE_PATHS.markTransparent, ground: PAPER_MUTED, fill: '#0E0E0E', label: 'BLACK ON PAPER' },
      ];
      for (const box of boxes) {
        addShape({ x: box.x, y: 430, width: 400, height: 500, fill: box.ground, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: `Mark variant / ${box.label} / Ground` });
        await addSvgVector({ path: box.path, target: layers.get('20 / Canonical Assets'), box: { x: box.x + 70, y: 500, width: 260, height: 260 }, namePrefix: `Gravity Well / ${box.label} / EXACT MONOCHROME`, overrideFill: box.fill });
        addText({ text: box.label, x: box.x + 32, y: 860, size: 15, fill: box.ground === SIGNAL || box.ground === PAPER_MUTED ? VOID : PAPER, target: layers.get('30 / Live Type and Metadata'), name: `Mark variant / ${box.label} / Label`, font: FONTS.monoBold, tracking: 0.08 });
      }
      return 1040;
    }
    if (subject.categoryId === '04') {
      if (subject.id === '04.00') {
        const gradientLabels = {
          '04.01': ['FIELD / SPATIAL DEPTH', '7 STOP / 90 DEG'],
          '04.02': ['OPTICAL / VIEW ANGLE', '8 STOP / 100 DEG / LINEAR'],
          '04.03': ['DATA / ORDERED SCALE', 'DERIVATION CONTRACT'],
          '04.04': ['HEAT / THERMAL STATE', 'DERIVATION CONTRACT'],
          '04.05': ['EXPOSURE / LIGHT REVEAL', 'DERIVATION CONTRACT'],
          '04.06': ['REFLECTIVE / FILM', 'DERIVATION CONTRACT'],
          '04.07': ['MATERIAL / SUBSTRATE', 'DERIVATION CONTRACT'],
        };
        gradientManifest.recipes.forEach((governedRecipe, index) => {
          const id = governedRecipe.subjectId;
          const x = 80 + (index % 4) * 320;
          const y = 430 + Math.floor(index / 4) * 280;
          if (governedRecipe.valueStatus === 'EXACT SOURCE VALUE') {
            addGradientStudy(item, gradientStudies[id], x, y, 290, 230, `Gradient study / ${id} / EXACT SOURCE VALUE`);
            addShape({ x: x + 10, y: y + 10, width: 270, height: 38, fill: RGBA8(14, 14, 14, 220), target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: `Gradient study / ${id} / Identification band` });
            addShape({ x: x + 10, y: y + 166, width: 270, height: 54, fill: RGBA8(14, 14, 14, 220), target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: `Gradient study / ${id} / Encoding band` });
            addText({ text: `${id}  ${gradientLabels[id][0]}`, x: x + 20, y: y + 22, size: 11, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: `Gradient study / ${id} / Label`, font: FONTS.monoBold });
            addText({ text: gradientLabels[id][1], x: x + 20, y: y + 186, size: 10, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: `Gradient study / ${id} / Recipe`, font: FONTS.monoMedium, tracking: 0.04 });
          } else {
            addGradientContractCard(item, governedRecipe, x, y, 290, 230, `Gradient study / ${id} / NOT VERIFIED`);
          }
        });
      } else if (subject.id === '04.01') {
        await addReference(
          item,
          SOURCE_PATHS.referenceContinuousLensPanel,
          80,
          430,
          1280,
          640,
          'OWNER-APPROVED CONTINUOUS LENS / LEFT DIRECTION / SHA 62511EF6BFA1',
          { hidden: true },
        );
        addContinuousLensSpecimen(
          item,
          { x: 80, y: 430, width: 1280, height: 640 },
          'Field gradient / Continuous Lens exemplar',
          { lineCount: 67, showLabels: true },
        );
        const sourceRamp = gradientDescriptor(
          FIELD_SPECTRUM.map((colour, index) => ({
            colour,
            position: FIELD_SPECTRUM_POSITIONS[index],
            midpoint: 0.5,
            smoothness: 0,
          })),
          GradientFillType.Linear,
          80,
          1100,
          1280,
          78,
          0,
          gradientStudies['04.01'].angle,
        );
        addShape({ x: 80, y: 1100, width: 1280, height: 78, fill: sourceRamp, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Field gradient / Exact seven-stop source ramp / 90 degrees' });
        FIELD_SPECTRUM_POSITIONS.forEach((position, index) => {
          addText({
            text: `${Math.round(position * 100)}%\n${FIELD_SPECTRUM_HEX[index]}`,
            x: 80 + position * 1190,
            y: 1194,
            size: 10,
            fill: PAPER,
            target: layers.get('30 / Live Type and Metadata'),
            name: `Field gradient / Stop ${String(index + 1).padStart(2, '0')} / Live label`,
            font: FONTS.monoBold,
            tracking: 0.02,
          });
        });
        addText({ text: 'NATIVE AFFINITY GRADIENT  /  GOVERNED RECIPE  /  OWNER-SELECTED CONTINUOUS LENS DIRECTION  /  FLAT SIGNAL CHANNEL', x: 82, y: 1295, size: 13, fill: SIGNAL, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Gradient status / Continuous Lens exemplar', font: FONTS.monoBold, tracking: 0.04 });
        return 1390;
      } else if (gradientStudies[subject.id]) {
        addGradientStudy(item, gradientStudies[subject.id], 80, 430, 1280, 640, `Native gradient / ${subject.name} / EXACT SOURCE VALUE`);
      } else {
        addUnresolvedGradientContract(
          item,
          gradientRecipeBySubjectId.get(subject.id),
          80,
          430,
          1280,
          640,
          `Gradient derivation / ${subject.name} / NOT VERIFIED`,
        );
      }
      addText({
        text: gradientStudies[subject.id]
          ? `NATIVE AFFINITY GRADIENT  /  EXACT SOURCE VALUE  /  ${subject.governance.publishable ? 'PUBLISHABLE UNDER GOVERNANCE' : 'NONPUBLISHABLE UNTIL RECIPE EVIDENCE PASSES'}`
          : 'DERIVATION CONTRACT ONLY  /  NO NUMERIC STOPS  /  NO GEOMETRY  /  NOT VERIFIED',
        x: 82,
        y: 1100,
        size: 13,
        fill: SIGNAL,
        target: layers.get('99 / Provenance, Status, Evidence, and Navigation'),
        name: 'Gradient status / Governance',
        font: FONTS.monoBold,
        tracking: 0.04,
      });
      return 1220;
    }
    if (subject.id === '06.01') {
      await addReference(
        item,
          SOURCE_PATHS.referenceContinuousLensPanel,
          80,
          430,
          600,
          254,
          'LEFT CONTINUOUS LENS / 62511EF6',
      );
      addContinuousLensSpecimen(
        item,
        { x: 720, y: 430, width: 640, height: 254 },
        'Continuous Lens / Native Affinity reconstruction',
        { lineCount: 53, showLabels: true },
      );

      addShape({ x: 80, y: 880, width: 600, height: 560, fill: PAPER, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Continuous Lens / Tangent construction ground' });
      addShape({ x: 120, y: 1158, width: 520, height: 1, fill: ASH_300, target: layers.get('10 / Construction'), name: 'Continuous Lens / Horizontal construction axis' });
      addShape({ x: 380, y: 925, width: 1, height: 466, fill: ASH_300, target: layers.get('10 / Construction'), name: 'Continuous Lens / Vertical construction axis' });
      addSmoothEllipse({
        cx: 380,
        cy: 1160,
        rx: 214,
        ry: 106,
        rotation: -14 * Math.PI / 180,
        fill: VOID,
        stroke: SIGNAL_INK,
        strokeWidth: 3,
        target: layers.get('20 / Canonical Assets'),
        name: 'Continuous Lens / Native four-segment cubic silhouette / Tangent continuous',
      });
      [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach((angle, index) => {
        const localX = 380 + 214 * Math.cos(angle) * Math.cos(-14 * Math.PI / 180) - 106 * Math.sin(angle) * Math.sin(-14 * Math.PI / 180);
        const localY = 1160 + 214 * Math.cos(angle) * Math.sin(-14 * Math.PI / 180) + 106 * Math.sin(angle) * Math.cos(-14 * Math.PI / 180);
        addShape({ x: localX - 5, y: localY - 5, width: 10, height: 10, fill: SIGNAL, target: layers.get('10 / Construction'), name: `Continuous Lens / Cubic join ${index + 1} / Smooth tangent`, shape: ShapeEllipse.create() });
      });
      addText({ text: 'FOUR CUBIC SEGMENTS\nTANGENT-CONTINUOUS JOINS\nNO CORNER / CHAMFER / WEDGE / NOTCH\n-14 DEG / SCREEN COORDINATES', x: 118, y: 944, size: 13, fill: VOID, target: layers.get('30 / Live Type and Metadata'), name: 'Continuous Lens / Construction statement', font: FONTS.monoBold, tracking: 0.04 });
      addText({ text: 'OWNER-APPROVED VISUAL DIRECTION\nNUMERICAL CONSTRUCTION REMAINS PROVISIONAL', x: 118, y: 1338, size: 11, fill: SIGNAL_INK, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Continuous Lens / Approval boundary', font: FONTS.monoBold, tracking: 0.04 });

      const opticalStops = [
        { colour: RGBA8(52, 56, 59, 255), position: 0, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(245, 247, 244, 255), position: 0.14, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(103, 183, 194, 255), position: 0.29, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(118, 90, 155, 255), position: 0.46, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(215, 174, 89, 255), position: 0.62, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(184, 87, 105, 255), position: 0.79, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(246, 242, 232, 255), position: 0.90, midpoint: 0.5, smoothness: 0 },
        { colour: RGBA8(75, 78, 80, 255), position: 1, midpoint: 0.5, smoothness: 0 },
      ];
      const opticalCoating = gradientDescriptor(opticalStops, GradientFillType.Linear, 720, 880, 640, 560, 0, 100 * Math.PI / 180);
      addShape({ x: 720, y: 880, width: 640, height: 560, fill: VOID_RAISED, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Continuous Lens / Material depth study ground' });
      opticalStops.forEach((stop, index) => {
        addShape({
          x: 752 + index * 72,
          y: 1012,
          width: 64,
          height: 18,
          fill: stop.colour,
          target: layers.get('40 / Color, Gradient, Pattern, or Material'),
          name: `Continuous Lens / Optical coating stop ${String(index + 1).padStart(2, '0')} / ${Math.round(stop.position * 100)} percent`,
        });
      });
      addSmoothEllipse({ cx: 1040, cy: 1150, rx: 250, ry: 142, rotation: -14 * Math.PI / 180, fill: opticalCoating, stroke: PAPER, strokeWidth: 1, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Continuous Lens / External optical coating rim / Exact governed recipe' });
      addSmoothEllipse({ cx: 1040, cy: 1150, rx: 218, ry: 110, rotation: -14 * Math.PI / 180, fill: VOID, stroke: PAPER, strokeWidth: 1, target: layers.get('20 / Canonical Assets'), name: 'Continuous Lens / Unchanged smooth opening inside external material rim' });
      addText({ text: 'EXTERNAL MATERIAL RESPONSE\n100 DEG / 8 EXACT STOPS\nOUTLINE REMAINS UNCHANGED', x: 752, y: 918, size: 12, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: 'Continuous Lens / Material distinction', font: FONTS.monoBold, tracking: 0.04 });
      addText({ text: 'MATERIAL MAY CHANGE OUTSIDE THE OPENING\nTHE SILHOUETTE NEVER ACQUIRES A SHARP EDGE', x: 752, y: 1358, size: 10, fill: SIGNAL, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Continuous Lens / Material rule', font: FONTS.monoBold, tracking: 0.04 });
      return 1540;
    }
    if (subject.categoryId === '10') {
      addUnresolvedGradientContract(
        item,
        gradientRecipeBySubjectId.get('04.07'),
        80,
        430,
        1280,
        640,
        `Material response derivation / ${subject.name} / NOT VERIFIED`,
      );
      return 1180;
    }
    if (subject.id === '11.05') return addHardwarePanelArtifactFirstPage(item);
    if (subject.categoryId === '11') {
      await addReference(item, SOURCE_PATHS.referenceProduct, 80, 430, 1280, 720, 'PRODUCT FAMILY DIRECTION');
      return 1240;
    }
    if (subject.categoryId === '03') {
      const swatchWidth = 1280 / SPECTRUM.length;
      SPECTRUM.forEach((colour, index) => addShape({ x: 80 + index * swatchWidth, y: 430, width: swatchWidth, height: 300, fill: colour, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: `Spectrum / ${String(index + 1).padStart(2, '0')}` }));
      addShape({ x: 80, y: 760, width: 1280, height: 60, fill: SIGNAL, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Signal Lime / Operational channel / Separate' });
      return 930;
    }
    if (subject.categoryId === '05') {
      const specimens = [
        ['UNBOUNDED / DISPLAY', FONTS.displayBlack, 54],
        ['BIG SHOULDERS STENCIL / INDUSTRIAL', FONTS.stencilBold, 56],
        ['Hanken Grotesk / Body and UI', FONTS.bodyMedium, 40],
        ['JETBRAINS MONO / TECHNICAL / 12:24.7', FONTS.monoBold, 28],
      ];
      specimens.forEach(([text, font, size], index) => addText({ text, x: 80, y: 450 + index * 140, size, fill: palette.primary, target: layers.get('30 / Live Type and Metadata'), name: `Type specimen / ${index + 1}`, font }));
      if (subject.id === '05.05') addText({ text: 'ARABIC FONT BINARIES ABSENT / NOT VERIFIED / NO FALLBACK PRESENTED AS APPROVED', x: 80, y: 1040, size: 16, fill: SIGNAL_INK, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Arabic type / Not verified', font: FONTS.monoBold });
      return 1160;
    }
    return 0;
  }

  async function buildCover(item) {
    const { layers, width, height, subject } = item;
    addShape({ x: 0, y: 0, width, height, fill: VOID, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Deep Void ground' }).lock();
    await addReference(item, SOURCE_PATHS.referenceCover, 0, 0, width, height, 'COVER DIRECTION v1', { hidden: true });

    addShape({ x: 64, y: 42, width: 1312, height: 1, fill: IRON, target: layers.get('10 / Construction'), name: 'Cover / Top datum' });
    addShape({ x: 64, y: 680, width: 1312, height: 1, fill: IRON, target: layers.get('10 / Construction'), name: 'Cover / Specimen datum' });
    addShape({ x: 64, y: 858, width: 1312, height: 1, fill: IRON, target: layers.get('10 / Construction'), name: 'Cover / Footer datum' });
    addShape({ x: 64, y: 42, width: 1, height: 817, fill: ASH_700, target: layers.get('10 / Construction'), name: 'Cover / Left calibration rail' });
    for (let index = 0; index < 28; index += 1) {
      addShape({
        x: index % 7 === 0 ? 54 : 58,
        y: 58 + index * 21,
        width: index % 7 === 0 ? 10 : 6,
        height: 1,
        fill: index % 7 === 0 ? SIGNAL : ASH_700,
        target: layers.get('10 / Construction'),
        name: `Cover / Calibration tick ${String(index + 1).padStart(2, '0')}`,
      });
    }

    const coverAtlasBox = { x: 500, y: 96, width: 860, height: 484 };
    addShape({ x: 500, y: 86, width: 860, height: 514, fill: VOID_RAISED, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Flat field proof ground / Exact spectrum remains on governed contours' });

    await addSvgVector({
      path: SOURCE_PATHS.atlasContoursLarge,
      target: layers.get('20 / Canonical Assets'),
      box: coverAtlasBox,
      namePrefix: 'Cover / Governed Atlas field / Dense exact contour topology',
      pathFilter: (attributes) => attributes['data-layer'] === 'field-line',
      overrideStroke: (attributes) => attributes['data-line-kind'] === 'major' ? '#B8B8B8' : '#545454',
      strokeWidthMultiplierForPath: (attributes) => attributes['data-line-kind'] === 'major' ? 0.32 : 0.46,
      includeCircles: false,
    });
    await addSvgVector({
      path: SOURCE_PATHS.atlasSpectralLarge,
      target: layers.get('20 / Canonical Assets'),
      box: coverAtlasBox,
      namePrefix: 'Cover / Governed spectrum evidence / Major contours only',
      pathFilter: (attributes) => attributes['data-layer'] === 'field-line' && attributes['data-line-kind'] === 'major',
      strokeWidthMultiplierForPath: () => 0.24,
      includeCircles: false,
    });
    await addSvgVector({
      path: SOURCE_PATHS.atlasDotsLarge,
      target: layers.get('20 / Canonical Assets'),
      box: coverAtlasBox,
      namePrefix: 'Cover / Governed field texture / Minor contour evidence',
      pathFilter: (attributes) => attributes['data-layer'] === 'field-line' && attributes['data-line-kind'] === 'minor',
      overrideStroke: '#545454',
      strokeWidthMultiplierForPath: () => 0.22,
      includeCircles: false,
    });
    await addSvgVector({
      path: SOURCE_PATHS.atlasContoursLarge,
      target: layers.get('20 / Canonical Assets'),
      box: coverAtlasBox,
      namePrefix: 'Cover / Exact Continuous Lens Aperture and one flat Signal trajectory',
      pathFilter: isContinuousLensOrSignalTrajectory,
      overrideFill: (attributes) => isContinuousLensAperture(attributes) ? '#0E0E0E' : null,
      overrideStroke: (attributes) => String(attributes.stroke || '').toUpperCase() === '#C6FF24' ? '#C6FF24' : isContinuousLensAperture(attributes) ? '#F9F8F2' : null,
    });

    addShape({ x: 1244, y: 66, width: 112, height: 112, fill: SIGNAL, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Gravity Well signal tile' });
    await addSvgVector({ path: SOURCE_PATHS.markTransparent, target: layers.get('20 / Canonical Assets'), box: { x: 1244, y: 66, width: 112, height: 112 }, namePrefix: 'Cover / Gravity Well / EXACT BLACK MONOCHROME', overrideFill: '#0E0E0E' });

    addText({ text: 'BI  /  PUBLIC MASTERBRAND  /  SYSTEM 01  /  2026.07', x: 88, y: 58, size: 12, fill: SIGNAL, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / System rail', font: FONTS.monoBold, tracking: 0.11 });
    addText({ text: '00.00  /  PRIMARY COVER', x: 1120, y: 58, size: 11, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Page rail', font: FONTS.monoMedium, tracking: 0.08 });
    addText({ text: 'BIZARRE\nINDUSTRIES', x: 88, y: 196, size: 76, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Name', font: FONTS.displayBlack, tracking: -0.035 });
    addText({ text: 'CATCH THE STARS', x: 88, y: 424, size: 44, fill: SIGNAL, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Tagline', font: FONTS.displayBold, tracking: -0.025 });
    addText({ text: 'MAKE THE DISTANT TANGIBLE.', x: 90, y: 496, size: 16, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Meaning', font: FONTS.bodyMedium, tracking: 0.02 });
    addText({ text: 'BEND  /  ABSENCE  /  SIGNAL', x: 90, y: 542, size: 11, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Recognition grammar', font: FONTS.monoBold, tracking: 0.08 });
    addText({ text: 'SYSTEM  PUBLIC MASTERBRAND\nVERSION  01\nSTATUS   PUBLIC\nDATE     2026.07', x: 90, y: 574, size: 10, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / System identification block', font: FONTS.monoMedium, tracking: 0.05 });
    addText({ text: 'GRAVITY\nWELL\nMARK\n01', x: 1250, y: 195, size: 10, fill: PAPER, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Mark identification', font: FONTS.monoBold, tracking: 0.08 });

    const exactOpticalCover = gradientStudies['04.02'];
    const reflectiveDescriptor = gradientDescriptor(
      exactOpticalCover.colours.map((colour, index) => ({
        colour,
        position: exactOpticalCover.positions[index],
        midpoint: 0.5,
        smoothness: 0,
      })),
      exactOpticalCover.type,
      88,
      730,
      220,
      86,
      0,
      exactOpticalCover.angle,
    );
    [324, 572, 964, 1204].forEach((x, index) => addShape({ x, y: 696, width: 1, height: 128, fill: IRON, target: layers.get('10 / Construction'), name: `Cover / Specimen divider ${index + 1}` }));

    addText({ text: 'OPTICAL COATING  /  04.02 EXACT', x: 88, y: 704, size: 9, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Optical coating specimen label', font: FONTS.monoMedium, tracking: 0.06 });
    addShape({ x: 88, y: 730, width: 220, height: 86, fill: reflectiveDescriptor, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Exact governed optical coating gradient / 100 degrees' });
    await addSvgVector({
      path: SOURCE_PATHS.markTransparent,
      target: layers.get('20 / Canonical Assets'),
      box: { x: 216, y: 726, width: 92, height: 92 },
      namePrefix: 'Cover / Material engraving / Exact Gravity Well fragment',
      pathFilter: (attributes, sourcePathIndex) => [7, 8].includes(sourcePathIndex),
      overrideFill: '#0E0E0E',
      includeCircles: false,
    });

    addText({ text: 'REFLECTIVE FILM  /  NOT VERIFIED', x: 340, y: 704, size: 9, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Reflective-film contract label', font: FONTS.monoMedium, tracking: 0.06 });
    addShape({ x: 340, y: 730, width: 212, height: 86, fill: ASH_700, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Flat reflective-film derivation proof / No invented gradient' });
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        addShape({
          x: 352 + column * 22 + (row % 2) * 11,
          y: 741 + row * 19,
          width: 7,
          height: 7,
          fill: RGBA8(61, 61, 61, 150),
          target: layers.get('40 / Color, Gradient, Pattern, or Material'),
          name: `Cover / Reflective microprism ${row + 1}.${column + 1}`,
          shape: ShapeEllipse.create(),
        });
      }
    }
    addShape({ x: 340, y: 810, width: 212, height: 6, fill: SIGNAL, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Reflective-film flat Signal channel' });

    addText({ text: 'SYSTEM SPECTRUM  /  DATA EVIDENCE', x: 590, y: 704, size: 9, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Spectrum label', font: FONTS.monoMedium, tracking: 0.06 });
    FIELD_SPECTRUM.forEach((colour, index) => {
      addShape({ x: 590 + index * 50, y: 730, width: 42, height: 86, fill: colour, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: `Cover / Field spectrum ${String(index + 1).padStart(2, '0')}` });
    });

    addText({ text: 'GRID AND CALIBRATION', x: 982, y: 704, size: 9, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / Calibration label', font: FONTS.monoMedium, tracking: 0.06 });
    for (let index = 0; index <= 8; index += 1) {
      addShape({ x: 982 + index * 25, y: 730, width: 1, height: 86, fill: index === 4 ? ASH_300 : IRON, target: layers.get('10 / Construction'), name: `Cover / Calibration vertical ${index}` });
    }
    for (let index = 0; index <= 4; index += 1) {
      addShape({ x: 982, y: 730 + index * 21.5, width: 200, height: 1, fill: index === 2 ? ASH_300 : IRON, target: layers.get('10 / Construction'), name: `Cover / Calibration horizontal ${index}` });
    }
    addShape({ x: 1073, y: 764, width: 18, height: 18, fill: SIGNAL, target: layers.get('40 / Color, Gradient, Pattern, or Material'), name: 'Cover / Calibration active datum', shape: ShapeEllipse.create() });

    addText({ text: 'SYSTEM INDEX', x: 1220, y: 704, size: 9, fill: ASH_300, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / System index label', font: FONTS.monoMedium, tracking: 0.06 });
    addText({ text: '01', x: 1220, y: 756, size: 58, fill: SIGNAL, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / System index value', font: FONTS.displayBlack, tracking: -0.04 });
    addText({ text: '/ 13', x: 1300, y: 786, size: 20, fill: ASH_500, target: layers.get('30 / Live Type and Metadata'), name: 'Cover / System category count', font: FONTS.monoBold });

    const compact = subject.anatomy.map((section, index) => `${String(index + 1).padStart(2, '0')} ${section.toUpperCase()}`).join('  /  ');
    addText({ text: wrap(compact, 158), x: 88, y: 874, size: 7, fill: ASH_500, target: layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Cover / Complete anatomy index', font: FONTS.mono });
  }

  for (const item of artboardById.values()) {
    currentOrigin = { x: item.x, y: item.y };
    if (item.subject.id === '00.00') {
      await buildCover(item);
      continue;
    }
    const palette = basePage(item);
    const visualEnd = await specialVisual(item, palette);
    if (item.subject.id === '01.01') {
      addSwissWorkingEditorialBands(item, palette, visualEnd + 100);
    } else if (!['01.02', '01.03', '07.05', '11.05'].includes(item.subject.id)) {
      anatomyPanels(item, palette, visualEnd ? visualEnd + 100 : 430);
    }
    if (item.subject.governance.publishable === false) {
      addShape({ x: 1090, y: 268, width: 270, height: 44, fill: SIGNAL, target: item.layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Status flag / Nonpublishable' });
      addText({ text: 'NONPUBLISHABLE', x: 1110, y: 280, size: 14, fill: VOID, target: item.layers.get('99 / Provenance, Status, Evidence, and Navigation'), name: 'Status flag / Nonpublishable text', font: FONTS.monoBold, tracking: 0.08 });
    }
  }

  for (const item of artboardById.values()) {
    const referenceLayer = item.layers.get('00 / Reference');
    referenceLayer.lock();
    master.executeCommand(DocumentCommand.createSetTagValueForKey(item.artboard.node.selfSelection, 'bizarre.buildComplete', 'true'));
  }

  const summary = {
    status: 'subjects-complete-awaiting-checkpoint',
    output: OUTPUT_PATH,
    documentSessionUuid: master.sessionUuid,
    documentPersistentUuid: master.persistentUuid,
    dpi: master.dpi,
    subjectCount: manifest.subjects.length,
    artboardCount: [...master.artboards].length,
    manifestHash: manifest.canonicalSha256,
    contentSpecHash: contentSpec.canonicalSha256,
    buildRevision: BUILD_REVISION,
    continuousLensFidelityRevision: CONTINUOUS_LENS_FIDELITY_REVISION,
    atlasSubjectFidelityRevision: ATLAS_SUBJECT_FIDELITY_REVISION,
    atlasConceptFidelityRevision: ATLAS_CONCEPT_FIDELITY_REVISION,
    brandArchitectureFidelityRevision: BRAND_ARCHITECTURE_ARTIFACT_REVISION,
    hardwarePanelFidelityRevision: HARDWARE_PANEL_ARTIFACT_REVISION,
    requestedIds: REQUESTED_SUBJECT_IDS,
    completedIds: [...artboardById.keys()],
    completedBefore,
    provisionalIdsInBatch: requestedSubjects.filter(({ governance }) => governance.publishable === false).map(({ id }) => id),
  };
  console.log(JSON.stringify(summary));
})().catch((error) => {
  console.log(JSON.stringify({ status: 'failed', error: String(error?.stack || error) }));
  throw error;
});
