export const CONTINUOUS_LENS_R20_REVISION = 'atlas-continuous-lens-concept-fidelity-r20';

const SPECTRUM = [
  ['Palette/color/spectrum/deep-indigo', '#20274D'],
  ['Palette/color/spectrum/electric-blue', '#3156A6'],
  ['Palette/color/spectrum/ion-cyan', '#4AA5AF'],
  ['Palette/color/spectrum/oxidized-teal', '#5C887C'],
  ['Palette/color/spectrum/solar-gold', '#D5A347'],
  ['Palette/color/spectrum/amber', '#C96C3E'],
  ['Palette/color/spectrum/crimson', '#B64C63'],
  ['Palette/color/spectrum/violet-shadow', '#684F83'],
].map(([ref, fallback], index, items) => ({
  ref,
  fallback,
  position: index / (items.length - 1),
}));

const SUBJECTS = {
  '07.05': {
    mode: 'shaded-contour',
    orbitCount: 60,
    proofSourceIds: ['atlasContoursLarge'],
  },
  '07.08': {
    mode: 'grain',
    orbitCount: 76,
    proofSourceIds: ['atlasContoursLarge', 'atlasSpectralLarge'],
  },
  '07.09': {
    mode: 'material',
    orbitCount: 60,
    proofSourceIds: ['atlasContoursLarge'],
  },
  '07.10': {
    mode: 'one-color',
    orbitCount: 68,
    proofSourceIds: ['atlasHatchLarge', 'atlasDotsLarge'],
  },
};

export function buildContinuousLensR20Geometry(box, orbitCount, mode) {
  const allowedModes = new Set(['shaded-contour', 'grain', 'material', 'one-color']);
  if (!allowedModes.has(mode)) throw new Error(`Unknown Continuous Lens r20 mode: ${mode}`);
  if (box.width !== 600 || box.height !== 238) {
    throw new Error(`Continuous Lens r20 requires the approved 600 x 238 viewport, received ${box.width} x ${box.height}`);
  }
  if (!Number.isInteger(orbitCount) || orbitCount < 48) {
    throw new Error('Continuous Lens r20 requires at least 48 editable orbits');
  }

  const aperture = {
    cx: box.x + box.width * 0.64,
    cy: box.y + box.height * 0.45,
    rx: box.width * 0.145,
    ry: box.height * 0.195,
    rotation: -14 * Math.PI / 180,
  };
  const maximum = {
    rx: box.width * 0.64,
    ry: box.height * 0.63,
    leftShift: box.width * 0.17,
    downShift: box.height * 0.015,
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
      throw new Error(`Continuous Lens r20 lost monotonic tangent geometry at index ${index}`);
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
        throw new Error(`Continuous Lens r20 orbit family crosses or touches at index ${index}, sample ${sample}`);
      }
    }
  }

  const trajectoryAngle = 72 * Math.PI / 180;
  const cosine = Math.cos(aperture.rotation);
  const sine = Math.sin(aperture.rotation);
  const localEndX = aperture.rx * Math.cos(trajectoryAngle);
  const localEndY = aperture.ry * Math.sin(trajectoryAngle);
  const trajectory = {
    start: [box.x - 12, box.y + box.height * 0.86],
    control1: [box.x + box.width * 0.27, box.y + box.height * 0.90],
    control2: [box.x + box.width * 0.53, box.y + box.height * 0.72],
    end: [
      aperture.cx + localEndX * cosine - localEndY * sine,
      aperture.cy + localEndX * sine + localEndY * cosine,
    ],
  };

  return { aperture, orbits, trajectory };
}

export function createContinuousLensR20Figma({
  figma,
  parent,
  subjectId,
  concept,
  buildGeometry,
  solid,
  boundSolid,
  gradient,
  tag,
}) {
  if (!parent || parent.type !== 'FRAME') throw new Error('CONTINUOUS_LENS_R20_VIEWPORT_NOT_FRAME');
  if (parent.width !== 600 || parent.height !== 238 || !parent.clipsContent) {
    throw new Error(`CONTINUOUS_LENS_R20_VIEWPORT_DRIFT:${parent.width}x${parent.height}:${parent.clipsContent}`);
  }
  if (!concept || concept.revision !== 'atlas-continuous-lens-concept-fidelity-r20') {
    throw new Error('CONTINUOUS_LENS_R20_CONCEPT_CONTRACT_MISSING');
  }

  const geometry = buildGeometry({ x: 0, y: 0, width: 600, height: 238 }, concept.orbitCount, concept.mode);
  const createdNodeIds = [];
  const register = (node) => {
    createdNodeIds.push(node.id);
    return node;
  };
  const addRect = ({ name, fill }) => {
    const node = figma.createRectangle();
    node.name = name;
    node.resize(600, 238);
    node.x = 0;
    node.y = 0;
    node.fills = fill ? [fill] : [];
    parent.appendChild(node);
    return register(node);
  };
  const addRotatedEllipse = ({ name, ellipse, fill = null, stroke = null, weight = 1, dash = null }) => {
    const node = figma.createEllipse();
    node.name = name;
    node.resize(ellipse.rx * 2, ellipse.ry * 2);
    node.fills = fill ? [fill] : [];
    node.strokes = stroke ? [stroke] : [];
    node.strokeWeight = weight;
    node.strokeCap = 'ROUND';
    node.strokeJoin = 'ROUND';
    if (dash) node.dashPattern = dash;
    parent.appendChild(node);
    const cosine = Math.cos(ellipse.rotation);
    const sine = Math.sin(ellipse.rotation);
    node.relativeTransform = [
      [cosine, -sine, ellipse.cx - cosine * ellipse.rx + sine * ellipse.ry],
      [sine, cosine, ellipse.cy - sine * ellipse.rx - cosine * ellipse.ry],
    ];
    return register(node);
  };

  parent.fills = [];
  const base = addRect({
    name: 'R20 / Field ground',
    fill: boundSolid(concept.ground.ref, concept.ground.fallback),
  });
  tag(base, { entity: 'continuous-lens-ground', subject_id: subjectId, concept_revision: concept.revision });

  if (concept.mode !== 'one-color') {
    const washOpacity = concept.mode === 'grain' ? 34 / 255 : 24 / 255;
    const wash = addRect({
      name: 'R20 / Native editable low-salience spectrum wash',
      fill: gradient(concept.spectrum.map((stop) => ({ ...stop, opacity: washOpacity })), parent, 0),
    });
    tag(wash, { entity: 'continuous-lens-spectrum-wash', subject_id: subjectId, concept_revision: concept.revision });
  }

  for (let index = 0; index < geometry.orbits.length; index += 1) {
    const orbit = geometry.orbits[index];
    const major = index % 8 === 0;
    const edgeFade = Math.max(0.28, 1 - 0.66 * Math.pow(orbit.t, 1.55));
    const paperMode = concept.mode === 'one-color';
    const grainMode = concept.mode === 'grain';
    const opacity = edgeFade * (major ? (paperMode ? 0.92 : 0.94) : paperMode ? 0.68 : grainMode ? 0.78 : 0.70);
    const dotted = grainMode || (paperMode && !major);
    const stroke = paperMode
      ? boundSolid(concept.void.ref, concept.void.fallback, opacity)
      : gradient(concept.spectrum.map((stop) => ({ ...stop, opacity })), parent, 0);
    const node = addRotatedEllipse({
      name: `R20 / Native tangent-continuous non-crossing ${dotted ? 'dot orbit' : 'lens orbit'} ${String(index + 1).padStart(2, '0')}`,
      ellipse: orbit,
      stroke,
      weight: major ? (grainMode ? 0.82 : paperMode ? 0.76 : 0.88) : (grainMode ? 0.58 : paperMode ? 0.46 : 0.52),
      dash: dotted ? (grainMode ? [0.08, 2.15] : [0.22, 1.18]) : null,
    });
    tag(node, {
      entity: 'continuous-lens-orbit', subject_id: subjectId, concept_revision: concept.revision,
      orbit_index: index + 1, orbit_role: major ? 'major' : 'minor', orbit_rendering: dotted ? 'dotted' : 'solid',
      tangent_continuity: 'native-ellipse', crossing_status: 'validated-none',
    });
  }

  if (concept.mode === 'material') {
    if (!concept.materialRecipe || concept.materialRecipe.subjectId !== '04.02') {
      throw new Error('CONTINUOUS_LENS_R20_MATERIAL_RECIPE_MISSING');
    }
    const rim = addRotatedEllipse({
      name: 'R20 / External-only material rim / Opening geometry unchanged',
      ellipse: { ...geometry.aperture, rx: geometry.aperture.rx + 6, ry: geometry.aperture.ry + 6 },
      fill: gradient(
        concept.materialRecipe.stops.items.map((stop) => ({ position: stop.positionPercent / 100, fallback: stop.color, opacity: 1 })),
        parent,
        concept.materialRecipe.geometry.angleDeg,
      ),
    });
    tag(rim, {
      entity: 'continuous-lens-material-rim', subject_id: subjectId, concept_revision: concept.revision,
      material_scope: 'external-only', opening_modified: 'false', recipe_id: '04.02',
    });
  }

  const aperture = addRotatedEllipse({
    name: 'R20 / Large smooth Continuous Lens aperture / Unchanged tangent-continuous opening',
    ellipse: geometry.aperture,
    fill: boundSolid(concept.mode === 'one-color' ? concept.paper.ref : concept.void.ref, concept.mode === 'one-color' ? concept.paper.fallback : concept.void.fallback),
    stroke: concept.mode === 'one-color'
      ? boundSolid(concept.void.ref, concept.void.fallback)
      : boundSolid(concept.paper.ref, concept.paper.fallback, concept.mode === 'material' ? 150 / 255 : 176 / 255),
    weight: concept.mode === 'one-color' ? 1.05 : 0.72,
  });
  tag(aperture, {
    entity: 'continuous-lens-aperture', subject_id: subjectId, concept_revision: concept.revision,
    tangent_continuity: 'native-ellipse', sharp_edges: 'none', opening_modified: 'false',
  });

  const trajectory = figma.createVector();
  trajectory.name = 'R20 / Single thin active trajectory / Exactly one cubic path';
  const points = [geometry.trajectory.start, geometry.trajectory.control1, geometry.trajectory.control2, geometry.trajectory.end];
  const originX = Math.min(...points.map((point) => point[0]));
  const originY = Math.min(...points.map((point) => point[1]));
  const local = points.map(([x, y]) => [x - originX, y - originY]);
  trajectory.vectorPaths = [{
    windingRule: 'NONZERO',
    data: `M ${local[0][0]} ${local[0][1]} C ${local[1][0]} ${local[1][1]} ${local[2][0]} ${local[2][1]} ${local[3][0]} ${local[3][1]}`,
  }];
  trajectory.fills = [];
  trajectory.strokes = [boundSolid(concept.mode === 'one-color' ? concept.void.ref : concept.signal.ref, concept.mode === 'one-color' ? concept.void.fallback : concept.signal.fallback)];
  trajectory.strokeWeight = concept.mode === 'one-color' ? 1.15 : 1.45;
  trajectory.strokeCap = 'ROUND';
  trajectory.strokeJoin = 'ROUND';
  parent.appendChild(trajectory);
  trajectory.x = originX;
  trajectory.y = originY;
  register(trajectory);
  tag(trajectory, {
    entity: 'continuous-lens-trajectory', subject_id: subjectId, concept_revision: concept.revision,
    trajectory_count: '1', path_kind: 'single-cubic', stroke_role: 'thin-active-signal',
  });

  const datum = figma.createEllipse();
  datum.name = 'R20 / Single trajectory datum';
  datum.resize(8.6, 8.6);
  datum.x = geometry.trajectory.end[0] - 4.3;
  datum.y = geometry.trajectory.end[1] - 4.3;
  datum.fills = [boundSolid(concept.mode === 'one-color' ? concept.void.ref : concept.signal.ref, concept.mode === 'one-color' ? concept.void.fallback : concept.signal.fallback)];
  datum.strokes = [];
  parent.appendChild(datum);
  register(datum);
  tag(datum, {
    entity: 'continuous-lens-trajectory-datum', subject_id: subjectId, concept_revision: concept.revision,
    datum_count: '1', trajectory_role: 'terminal-datum',
  });

  tag(parent, {
    entity: 'continuous-lens-concept-viewport', subject_id: subjectId, concept_revision: concept.revision,
    concept_mode: concept.mode, geometry_contract: 'native-editable-figma-r20',
    rotation_screen_deg: -14, figma_transform: 'center-rotation-matrix',
    viewport_width: 600, viewport_height: 238, orbit_count: concept.orbitCount,
    trajectory_count: 1, datum_count: 1, crossing_status: 'validated-none',
    authority_status: 'owner-selected-direction', verification_status: 'NOT VERIFIED', publication_status: 'nonpublishable',
    concept_reference_id: concept.reference.id, source_path: concept.reference.sourcePath, source_sha256: concept.reference.sha256,
  });

  const orbitNodes = parent.children.filter((node) => node.getSharedPluginData('bizarre.masterbrand', 'entity') === 'continuous-lens-orbit');
  const trajectoryNodes = parent.children.filter((node) => node.getSharedPluginData('bizarre.masterbrand', 'entity') === 'continuous-lens-trajectory');
  const datumNodes = parent.children.filter((node) => node.getSharedPluginData('bizarre.masterbrand', 'entity') === 'continuous-lens-trajectory-datum');
  if (orbitNodes.length !== concept.orbitCount || trajectoryNodes.length !== 1 || datumNodes.length !== 1) {
    throw new Error(`CONTINUOUS_LENS_R20_RENDER_AUDIT_FAILED:${orbitNodes.length}:${trajectoryNodes.length}:${datumNodes.length}`);
  }

  return {
    createdNodeIds,
    orbitNodeIds: orbitNodes.map((node) => node.id),
    apertureNodeId: aperture.id,
    trajectoryNodeId: trajectory.id,
    datumNodeId: datum.id,
  };
}

export function continuousLensR20ConceptForSubject(subjectId, { conceptReference, materialRecipe = null } = {}) {
  const subject = SUBJECTS[subjectId];
  if (!subject) return null;
  if (!conceptReference) throw new Error(`Continuous Lens r20 subject ${subjectId} requires its ImageGen reference`);
  if (subject.mode === 'material' && (!materialRecipe || materialRecipe.subjectId !== '04.02')) {
    throw new Error('Continuous Lens r20 material mode requires governed gradient recipe 04.02');
  }
  return {
    revision: CONTINUOUS_LENS_R20_REVISION,
    viewport: { width: 600, height: 238 },
    ...subject,
    spectrum: SPECTRUM.map((stop) => ({ ...stop })),
    signal: { ref: 'Brand/brand/accent/signal', fallback: '#C6FF24' },
    void: { ref: 'Palette/color/neutral/void', fallback: '#0E0E0E' },
    paper: { ref: 'Palette/color/neutral/paper', fallback: '#F9F8F2' },
    ground: subject.mode === 'one-color'
      ? { ref: 'Palette/color/neutral/paper', fallback: '#F9F8F2' }
      : subject.mode === 'grain'
        ? { ref: null, fallback: '#06102B' }
        : subject.mode === 'material'
          ? { ref: 'Modes/surface/elevated', fallback: '#181817' }
          : { ref: 'Palette/color/neutral/void', fallback: '#0E0E0E' },
    materialRecipe: subject.mode === 'material'
      ? {
        subjectId: materialRecipe.subjectId,
        geometry: { angleDeg: materialRecipe.geometry.angleDeg },
        stops: {
          items: materialRecipe.stops.items.map(({ positionPercent, color }) => ({ positionPercent, color })),
        },
      }
      : null,
    reference: {
      id: conceptReference.id,
      sourcePath: conceptReference.sourcePath,
      sha256: conceptReference.sha256,
    },
  };
}

export const CONTINUOUS_LENS_R20_SUBJECT_IDS = Object.freeze(Object.keys(SUBJECTS));
