import { ATLAS_CONFIG, formatNumber } from './config.mjs';
import {
  APERTURE_ASPECT_RATIO,
  APERTURE_PATH_SHA256,
  APERTURE_ROTATION_DEGREES,
  APERTURE_VERSION,
  apertureContainment,
  apertureGeometry
} from './aperture.mjs';
import { ALGORITHM, createProvenance, serializeMetadata } from './provenance.mjs';

export { renderAperture } from './aperture.mjs';

const APPEARANCES = new Set(ATLAS_CONFIG.renderer.supported.appearances);
const OPTICAL_SIZES = new Set(ATLAS_CONFIG.renderer.supported.fieldOpticalSizes);
const PRODUCTION_PROFILES = new Set(ATLAS_CONFIG.renderer.supported.productionProfiles);
const REPRESENTATIONS = new Set(ATLAS_CONFIG.renderer.supported.fieldRepresentations);
const TRAJECTORY_STATES = new Set(ATLAS_CONFIG.renderer.supported.fieldTrajectoryStates);
const OPTION_KEYS = new Set([
  'appearance', 'height', 'opticalSize', 'orientation', 'productionProfile',
  'representation', 'trajectoryState', 'width'
]);

const point = (x, y) => `${formatNumber(x)} ${formatNumber(y)}`;

function dimension(value, label) {
  if (!Number.isInteger(value) || value < 48 || value > 4096) throw new TypeError(`${label} must be an integer from 48 to 4096`);
  return value;
}

function option(value, fallback, allowed, label) {
  const resolved = value ?? fallback;
  if (!allowed.has(resolved)) throw new TypeError(`Unsupported ${label}: ${String(resolved)}`);
  return resolved;
}

function fieldSegments({ baseY, height, massX, massY, orientation, strength, width }) {
  const { parameters } = ATLAS_CONFIG.field;
  const segments = [[]];
  const radiusX = width * parameters.apertureRadius.x;
  const radiusY = radiusX / APERTURE_ASPECT_RATIO;
  for (let index = 0; index <= parameters.sampleCount; index += 1) {
    const x = -width * 0.05 + (width * parameters.extent * index) / parameters.sampleCount;
    const sign = baseY >= massY ? 1 : -1;
    const dx = (x - massX) / (width * 0.25);
    const pull = Math.exp(-(Math.abs(dx) ** ATLAS_CONFIG.field.compressionExponent));
    const asymmetry = 1 + parameters.asymmetry * Math.tanh((x - massX) / (width * 0.18));
    const tilt = Math.PI / 180 * orientation * parameters.tiltScale;
    const y = baseY - sign * strength * pull * asymmetry + tilt * (x - width / 2);
    const occlusion = apertureContainment({
      centerX: massX,
      centerY: massY,
      radiusX,
      radiusY,
      rotationDegrees: APERTURE_ROTATION_DEGREES,
      x,
      y
    });
    if (occlusion < parameters.occlusionExpansion) {
      if (segments.at(-1).length > 0) segments.push([]);
    } else {
      segments.at(-1).push([x, y]);
    }
  }
  return segments.filter((segment) => segment.length > 1);
}

function sampledPath(points) {
  return `M ${points.map(([x, y], index) => `${index === 0 ? '' : 'L '}${point(x, y)}`).join(' ')}`;
}

function spectrumDefinitions() {
  const stops = ATLAS_CONFIG.palette.spectrum.map((color, index, values) => {
    const offset = formatNumber(index / (values.length - 1));
    return `<stop offset="${offset}" stop-color="${color}"/>`;
  }).join('');
  return `<defs><linearGradient id="atlas-spectrum" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>`;
}

function lineStyle({ appearance, index, major, representation }) {
  const { lineWidths } = ATLAS_CONFIG.field;
  const neutral = ATLAS_CONFIG.palette.neutral;
  const majorColor = appearance === 'dark' ? neutral.darkMajor : neutral.lightMajor;
  const minorColor = appearance === 'dark' ? neutral.darkMinor : neutral.lightMinor;
  const spectrum = ATLAS_CONFIG.palette.spectrum;
  switch (representation) {
    case 'bands':
      return { dash: '', opacity: major ? 0.78 : 0.48, stroke: spectrum[index % spectrum.length], width: major ? lineWidths.band : lineWidths.major };
    case 'dots':
      return { dash: ' stroke-dasharray="1 13" stroke-linecap="round"', opacity: major ? 0.88 : 0.64, stroke: majorColor, width: major ? lineWidths.major : lineWidths.minor };
    case 'hatch':
      return { dash: ' stroke-dasharray="18 11"', opacity: major ? 0.76 : 0.48, stroke: major ? majorColor : minorColor, width: major ? lineWidths.major : lineWidths.minor };
    case 'spectral':
      return { dash: '', opacity: major ? 0.78 : 0.42, stroke: 'url(#atlas-spectrum)', width: major ? lineWidths.band : lineWidths.major };
    default:
      return { dash: '', opacity: major ? 0.78 : 0.52, stroke: major ? majorColor : minorColor, width: major ? lineWidths.major : lineWidths.minor };
  }
}

function renderFieldLines({ appearance, height, opticalSize, orientation, representation, width }) {
  const { parameters } = ATLAS_CONFIG.field;
  const count = parameters.lineCounts[opticalSize];
  if (count === 0) return '';
  const massX = width * ATLAS_CONFIG.field.mass.x;
  const massY = height * ATLAS_CONFIG.field.mass.y;
  const center = (count - 1) / 2;
  const spacing = parameters.spacingByOpticalSize?.[opticalSize] ?? parameters.spacing;
  const lines = [];
  for (let index = 0; index < count; index += 1) {
    const offset = index - center;
    const baseY = massY + offset * height * spacing;
    const distance = center === 0 ? 0 : Math.abs(offset) / center;
    const strengthFactor = ATLAS_CONFIG.field.parameters.fieldStrength.near
      - (ATLAS_CONFIG.field.parameters.fieldStrength.near - ATLAS_CONFIG.field.parameters.fieldStrength.far) * distance;
    const major = index % ATLAS_CONFIG.field.majorInterval === 0;
    const style = lineStyle({ appearance, index, major, representation });
    for (const segment of fieldSegments({ baseY, height, massX, massY, orientation, strength: height * strengthFactor, width })) {
      lines.push(
        `<path data-layer="field-line" data-line-kind="${major ? 'major' : 'minor'}" stroke-width="${style.width}" d="${sampledPath(segment)}" fill="none" stroke="${style.stroke}" stroke-opacity="${formatNumber(style.opacity)}"${style.dash}/>`
      );
    }
  }
  return lines.join('');
}

function renderFieldAperture({ appearance, height, opticalSize, width }) {
  const massX = width * ATLAS_CONFIG.field.mass.x;
  const massY = height * ATLAS_CONFIG.field.mass.y;
  const scale = opticalSize === 'micro' ? 1.65 : 1;
  const radiusX = width * ATLAS_CONFIG.field.parameters.apertureRadius.x * scale;
  const geometry = apertureGeometry({
    centerX: massX,
    centerY: massY,
    radiusX,
    radiusY: radiusX / APERTURE_ASPECT_RATIO
  });
  const background = ATLAS_CONFIG.palette.backgrounds[appearance];
  const edge = appearance === 'dark' ? ATLAS_CONFIG.palette.neutral.paper : ATLAS_CONFIG.palette.neutral.void;
  return [
    '<g data-layer="continuous-lens-aperture-group">',
    `<path data-layer="continuous-lens-aperture" d="${geometry.path}" fill="${background}" stroke="${edge}" stroke-width="${ATLAS_CONFIG.field.lineWidths.major}"/>`,
    '</g>'
  ].join('');
}

function renderSignal({ height, trajectoryState, width }) {
  const start = [width * 0.05, height * 0.69];
  const controlA = [width * 0.34, height * 0.62];
  const controlB = [width * 0.58, height * 0.55];
  const end = trajectoryState === 'captured'
    ? [width * ATLAS_CONFIG.field.mass.x, height * ATLAS_CONFIG.field.mass.y]
    : [width * 0.97, height * 0.29];
  const path = `M ${point(...start)} C ${point(...controlA)} ${point(...controlB)} ${point(...end)}`;
  const radius = Math.max(2, ATLAS_CONFIG.field.lineWidths.band * 0.75);
  return [
    `<g data-layer="signal-trajectory-group" data-state="${trajectoryState}">`,
    `<path data-layer="signal-trajectory" data-role="path" d="${path}" fill="none" stroke="${ATLAS_CONFIG.palette.signal}" stroke-width="${ATLAS_CONFIG.field.lineWidths.band}" stroke-linecap="round"/>`,
    `<circle data-layer="signal-trajectory" data-role="datum" cx="${formatNumber(end[0])}" cy="${formatNumber(end[1])}" r="${formatNumber(radius)}" fill="${ATLAS_CONFIG.palette.signal}"/>`,
    '</g>'
  ].join('');
}

function normalizedOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Atlas options must be an object');
  for (const key of Object.keys(options)) if (!OPTION_KEYS.has(key)) throw new TypeError(`Unsupported Atlas option or claim: ${key}`);
  const orientation = options.orientation ?? 18;
  if (!ATLAS_CONFIG.orientationFamily.includes(orientation)) {
    throw new TypeError(`Atlas orientation must be one of ${ATLAS_CONFIG.orientationFamily.join(', ')}`);
  }
  return {
    appearance: option(options.appearance, 'dark', APPEARANCES, 'appearance'),
    height: dimension(options.height ?? 900, 'height'),
    opticalSize: option(options.opticalSize, 'medium', OPTICAL_SIZES, 'optical size'),
    orientation,
    productionProfile: option(options.productionProfile, 'screen', PRODUCTION_PROFILES, 'production profile'),
    representation: option(options.representation, 'contour', REPRESENTATIONS, 'representation'),
    trajectoryState: option(options.trajectoryState, 'active', TRAJECTORY_STATES, 'trajectory state'),
    width: dimension(options.width ?? 1600, 'width')
  };
}

export function renderAtlas(options = {}) {
  const normalized = normalizedOptions(options);
  const { appearance, height, opticalSize, orientation, productionProfile, representation, trajectoryState, width } = normalized;
  const fieldConfiguration = {
    algorithm: ALGORITHM,
    aperture: { pathSha256: APERTURE_PATH_SHA256, version: APERTURE_VERSION },
    dimensions: { height, width },
    field: ATLAS_CONFIG.field,
    orientation,
    sourceDocuments: ATLAS_CONFIG.sourceDocuments
  };
  const configuration = {
    ...fieldConfiguration,
    palette: ATLAS_CONFIG.palette,
    render: { appearance, opticalSize, productionProfile, representation, trajectoryState }
  };
  const metadata = createProvenance({
    aperturePathSha256: APERTURE_PATH_SHA256,
    apertureVersion: APERTURE_VERSION,
    appearance,
    configuration,
    fieldConfiguration,
    opticalSize,
    orientation,
    productionProfile,
    representation,
    trajectoryState
  });
  const background = ATLAS_CONFIG.palette.backgrounds[appearance];
  const definitions = representation === 'spectral' ? spectrumDefinitions() : '';
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<metadata id="bizarre-atlas-provenance">${serializeMetadata(metadata)}</metadata>`,
    definitions,
    `<rect data-layer="background" width="${width}" height="${height}" fill="${background}"/>`,
    renderFieldLines(normalized),
    renderFieldAperture(normalized),
    renderSignal(normalized),
    '</svg>\n'
  ].join('');
  return { metadata, svg };
}

function cubicPoint(start, controlA, controlB, end, t) {
  const inverse = 1 - t;
  return [0, 1].map((axis) =>
    inverse ** 3 * start[axis]
    + 3 * inverse ** 2 * t * controlA[axis]
    + 3 * inverse * t ** 2 * controlB[axis]
    + t ** 3 * end[axis]
  );
}

export function renderCaptureSequence(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Capture sequence options must be an object');
  const allowed = new Set(['height', 'orientation', 'width']);
  for (const key of Object.keys(options)) if (!allowed.has(key)) throw new TypeError(`Unsupported capture sequence option: ${key}`);
  const width = dimension(options.width ?? 1600, 'width');
  const height = dimension(options.height ?? 430, 'height');
  const orientation = options.orientation ?? 18;
  if (!ATLAS_CONFIG.orientationFamily.includes(orientation)) throw new TypeError(`Capture sequence orientation must be one of ${ATLAS_CONFIG.orientationFamily.join(', ')}`);
  const fieldConfiguration = {
    algorithm: ALGORITHM,
    aperture: { pathSha256: APERTURE_PATH_SHA256, version: APERTURE_VERSION },
    dimensions: { height, width },
    field: ATLAS_CONFIG.field,
    orientation,
    sourceDocuments: ATLAS_CONFIG.sourceDocuments
  };
  const configuration = {
    ...fieldConfiguration,
    capture: ATLAS_CONFIG.capture,
    palette: ATLAS_CONFIG.palette,
    render: {
      appearance: 'dark',
      opticalSize: 'sequence',
      productionProfile: 'screen',
      representation: 'capture-sequence',
      trajectoryState: 'capture-sequence'
    }
  };
  const metadata = createProvenance({
    aperturePathSha256: APERTURE_PATH_SHA256,
    apertureVersion: APERTURE_VERSION,
    appearance: 'dark',
    configuration,
    fieldConfiguration,
    opticalSize: 'sequence',
    orientation,
    productionProfile: 'screen',
    representation: 'capture-sequence',
    trajectoryState: 'capture-sequence'
  });
  const phaseEntries = Object.entries(ATLAS_CONFIG.capture.phases);
  const panelWidth = width / phaseEntries.length;
  const panels = phaseEntries.map(([phase, interval], index) => {
    const panelX = index * panelWidth;
    const panelCenterX = panelX + panelWidth / 2;
    const tilt = Math.PI / 180 * orientation * ATLAS_CONFIG.field.parameters.tiltScale;
    const orientedPoint = (x, y) => [x, y + tilt * (x - panelCenterX)];
    const massX = panelX + panelWidth * ATLAS_CONFIG.field.mass.x;
    const massY = height * ATLAS_CONFIG.field.mass.y;
    const start = orientedPoint(panelX + panelWidth * 0.06, height * 0.69);
    const controlA = orientedPoint(panelX + panelWidth * 0.34, height * 0.62);
    const controlB = orientedPoint(panelX + panelWidth * 0.58, height * 0.55);
    const end = orientedPoint(panelX + panelWidth * 0.94, height * 0.29);
    const curve = `M ${point(...start)} C ${point(...controlA)} ${point(...controlB)} ${point(...end)}`;
    const progress = (interval.start + interval.end) / 2;
    const signal = cubicPoint(start, controlA, controlB, end, progress);
    const apertureRadiusX = panelWidth * 0.13;
    const aperture = apertureGeometry({
      centerX: massX,
      centerY: massY,
      radiusX: apertureRadiusX,
      radiusY: apertureRadiusX / APERTURE_ASPECT_RATIO
    });
    return [
      `<g data-layer="capture-phase" data-phase="${phase}">`,
      `<rect x="${formatNumber(panelX)}" y="0" width="${formatNumber(panelWidth)}" height="${height}" fill="${ATLAS_CONFIG.palette.backgrounds.dark}" stroke="${ATLAS_CONFIG.palette.neutral.darkMinor}" stroke-width="${ATLAS_CONFIG.field.lineWidths.minor}"/>`,
      `<path d="${curve}" fill="none" stroke="${ATLAS_CONFIG.palette.neutral.darkMinor}" stroke-width="${ATLAS_CONFIG.field.lineWidths.major}"/>`,
      `<path data-layer="continuous-lens-aperture" d="${aperture.path}" fill="${ATLAS_CONFIG.palette.neutral.void}" stroke="${ATLAS_CONFIG.palette.neutral.paper}" stroke-width="${ATLAS_CONFIG.field.lineWidths.major}"/>`,
      `<circle data-layer="signal-state" cx="${formatNumber(signal[0])}" cy="${formatNumber(signal[1])}" r="${ATLAS_CONFIG.aperture.revealDepth}" fill="${ATLAS_CONFIG.palette.signal}"/>`,
      '</g>'
    ].join('');
  }).join('');
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<metadata id="bizarre-atlas-provenance">${serializeMetadata(metadata)}</metadata>`,
    panels,
    '</svg>\n'
  ].join('');
  return { metadata, svg };
}

export function renderInstrumentDial(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Instrument dial options must be an object');
  const allowed = new Set(['orientation', 'size']);
  for (const key of Object.keys(options)) if (!allowed.has(key)) throw new TypeError(`Unsupported instrument dial option: ${key}`);
  const size = dimension(options.size ?? 900, 'size');
  const orientation = options.orientation ?? 18;
  if (!ATLAS_CONFIG.orientationFamily.includes(orientation)) throw new TypeError(`Instrument orientation must be one of ${ATLAS_CONFIG.orientationFamily.join(', ')}`);
  const fieldConfiguration = {
    algorithm: ALGORITHM,
    aperture: { pathSha256: APERTURE_PATH_SHA256, version: APERTURE_VERSION },
    dimensions: { height: size, width: size },
    field: ATLAS_CONFIG.field,
    orientation,
    sourceDocuments: ATLAS_CONFIG.sourceDocuments
  };
  const configuration = {
    ...fieldConfiguration,
    palette: ATLAS_CONFIG.palette,
    render: { appearance: 'light', opticalSize: 'instrument', productionProfile: 'screen', representation: 'instrument-dial', trajectoryState: 'active' }
  };
  const metadata = createProvenance({
    aperturePathSha256: APERTURE_PATH_SHA256,
    apertureVersion: APERTURE_VERSION,
    appearance: 'light',
    configuration,
    fieldConfiguration,
    opticalSize: 'instrument',
    orientation,
    productionProfile: 'screen',
    representation: 'instrument-dial',
    trajectoryState: 'active'
  });
  const center = size / 2;
  const outerRadius = size * 0.43;
  const ticks = Array.from({ length: 60 }, (_, index) => {
    const angle = Math.PI / 180 * (index * 6 - 90);
    const major = index % ATLAS_CONFIG.field.majorInterval === 0;
    const innerRadius = outerRadius - size * (major ? 0.078 : 0.045);
    return `<line data-layer="dial-index" data-line-kind="${major ? 'major' : 'minor'}" x1="${formatNumber(center + Math.cos(angle) * innerRadius)}" y1="${formatNumber(center + Math.sin(angle) * innerRadius)}" x2="${formatNumber(center + Math.cos(angle) * outerRadius)}" y2="${formatNumber(center + Math.sin(angle) * outerRadius)}" stroke="${ATLAS_CONFIG.palette.neutral.void}" stroke-width="${major ? ATLAS_CONFIG.field.lineWidths.major : ATLAS_CONFIG.field.lineWidths.minor}"/>`;
  }).join('');
  const pointerAngle = Math.PI / 180 * (orientation - 90);
  const pointerEnd = [center + Math.cos(pointerAngle) * size * 0.31, center + Math.sin(pointerAngle) * size * 0.31];
  const apertureRadiusX = size * 0.061;
  const aperture = apertureGeometry({
    centerX: size * 0.6,
    centerY: size * 0.59,
    radiusX: apertureRadiusX,
    radiusY: apertureRadiusX / APERTURE_ASPECT_RATIO
  });
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<metadata id="bizarre-atlas-provenance">${serializeMetadata(metadata)}</metadata>`,
    `<rect data-layer="housing" width="${size}" height="${size}" fill="${ATLAS_CONFIG.palette.neutral.void}"/>`,
    `<circle data-layer="dial-face" cx="${formatNumber(center)}" cy="${formatNumber(center)}" r="${formatNumber(size * 0.45)}" fill="${ATLAS_CONFIG.palette.backgrounds.light}" stroke="${ATLAS_CONFIG.palette.neutral.darkMinor}" stroke-width="${ATLAS_CONFIG.field.lineWidths.band}"/>`,
    ticks,
    `<path data-layer="continuous-lens-aperture" d="${aperture.path}" fill="${ATLAS_CONFIG.palette.neutral.void}"/>`,
    '<g data-layer="signal-trajectory-group" data-state="active">',
    `<path data-layer="signal-trajectory" data-role="path" d="M ${point(center, center)} L ${point(...pointerEnd)}" fill="none" stroke="${ATLAS_CONFIG.palette.signal}" stroke-width="${ATLAS_CONFIG.field.lineWidths.band}" stroke-linecap="round"/>`,
    `<circle data-layer="signal-trajectory" data-role="datum" cx="${formatNumber(pointerEnd[0])}" cy="${formatNumber(pointerEnd[1])}" r="${ATLAS_CONFIG.aperture.revealDepth}" fill="${ATLAS_CONFIG.palette.signal}"/>`,
    '</g>',
    '</svg>\n'
  ].join('');
  return { metadata, svg };
}
