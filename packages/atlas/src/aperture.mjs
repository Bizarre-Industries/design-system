import { createHash } from 'node:crypto';
import { ATLAS_CONFIG, formatNumber } from './config.mjs';
import { ALGORITHM, createProvenance, serializeMetadata } from './provenance.mjs';

const KAPPA = 0.5522847498307936;
const QUARTER_TURN = Math.PI / 2;

export const APERTURE_VERSION = 'continuous-lens-aperture/owner-selected-left-v2';
export const APERTURE_ROTATION_DEGREES = -14;
export const APERTURE_ASPECT_RATIO = 24 / 11;
export const APERTURE_REFERENCE_BOUNDS = Object.freeze({
  width: 480,
  height: 220,
  aspect: APERTURE_ASPECT_RATIO,
  rotationDegrees: APERTURE_ROTATION_DEGREES
});

const rotate = ([x, y], angleRadians) => [
  x * Math.cos(angleRadians) - y * Math.sin(angleRadians),
  x * Math.sin(angleRadians) + y * Math.cos(angleRadians)
];

const serializePoint = ([x, y]) => `${formatNumber(x)} ${formatNumber(y)}`;

function ellipsePoint(centerX, centerY, radiusX, radiusY, angleRadians, rotationRadians) {
  const [x, y] = rotate([
    radiusX * Math.cos(angleRadians),
    radiusY * Math.sin(angleRadians)
  ], rotationRadians);
  return [centerX + x, centerY + y];
}

function ellipseTangent(radiusX, radiusY, angleRadians, rotationRadians) {
  return rotate([
    -radiusX * Math.sin(angleRadians),
    radiusY * Math.cos(angleRadians)
  ], rotationRadians);
}

export function apertureGeometry({
  centerX,
  centerY,
  radiusX,
  radiusY = radiusX / APERTURE_ASPECT_RATIO,
  rotationDegrees = APERTURE_ROTATION_DEGREES
}) {
  for (const [name, value] of Object.entries({ centerX, centerY, radiusX, radiusY, rotationDegrees })) {
    if (!Number.isFinite(value) || ((name === 'radiusX' || name === 'radiusY') && value <= 0)) {
      throw new TypeError(`Invalid aperture geometry ${name}`);
    }
  }
  const rotationRadians = rotationDegrees * Math.PI / 180;
  const startAngle = Math.PI;
  const start = ellipsePoint(centerX, centerY, radiusX, radiusY, startAngle, rotationRadians);
  const segments = [];
  for (let index = 0; index < 4; index += 1) {
    const angleA = startAngle + index * QUARTER_TURN;
    const angleB = angleA + QUARTER_TURN;
    const pointA = ellipsePoint(centerX, centerY, radiusX, radiusY, angleA, rotationRadians);
    const pointB = ellipsePoint(centerX, centerY, radiusX, radiusY, angleB, rotationRadians);
    const tangentA = ellipseTangent(radiusX, radiusY, angleA, rotationRadians);
    const tangentB = ellipseTangent(radiusX, radiusY, angleB, rotationRadians);
    const controlA = [pointA[0] + KAPPA * tangentA[0], pointA[1] + KAPPA * tangentA[1]];
    const controlB = [pointB[0] - KAPPA * tangentB[0], pointB[1] - KAPPA * tangentB[1]];
    segments.push(`C ${serializePoint(controlA)} ${serializePoint(controlB)} ${serializePoint(pointB)}`);
  }
  return {
    path: [`M ${serializePoint(start)}`, ...segments, 'Z'].join(' '),
    rotationDegrees
  };
}

export function apertureContainment({
  centerX,
  centerY,
  radiusX,
  radiusY = radiusX / APERTURE_ASPECT_RATIO,
  rotationDegrees = APERTURE_ROTATION_DEGREES,
  x,
  y
}) {
  for (const [name, value] of Object.entries({ centerX, centerY, radiusX, radiusY, rotationDegrees, x, y })) {
    if (!Number.isFinite(value) || ((name === 'radiusX' || name === 'radiusY') && value <= 0)) {
      throw new TypeError(`Invalid aperture containment ${name}`);
    }
  }
  const rotationRadians = rotationDegrees * Math.PI / 180;
  const dx = x - centerX;
  const dy = y - centerY;
  const localX = dx * Math.cos(rotationRadians) + dy * Math.sin(rotationRadians);
  const localY = -dx * Math.sin(rotationRadians) + dy * Math.cos(rotationRadians);
  return (localX / radiusX) ** 2 + (localY / radiusY) ** 2;
}

export const APERTURE_PATH = apertureGeometry({
  centerX: 600,
  centerY: 370,
  radiusX: APERTURE_REFERENCE_BOUNDS.width / 2,
  radiusY: APERTURE_REFERENCE_BOUNDS.height / 2
}).path;
export const APERTURE_PATH_SHA256 = createHash('sha256').update(APERTURE_PATH).digest('hex');

function dimension(value, label) {
  if (!Number.isInteger(value) || value < 48 || value > 4096) throw new TypeError(`${label} must be an integer from 48 to 4096`);
  return value;
}

export function renderAperture(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Aperture options must be an object');
  const allowed = new Set(['appearance', 'height', 'width']);
  for (const key of Object.keys(options)) if (!allowed.has(key)) throw new TypeError(`Unsupported aperture option: ${key}`);
  const width = dimension(options.width ?? 1200, 'width');
  const height = dimension(options.height ?? 760, 'height');
  const appearance = options.appearance ?? 'light';
  if (!['dark', 'light'].includes(appearance)) throw new TypeError('Aperture appearance must be dark or light');

  const fieldConfiguration = {
    algorithm: ALGORITHM,
    aperture: {
      constructionRatio: ATLAS_CONFIG.aperture.constructionRatio,
      pathSha256: APERTURE_PATH_SHA256,
      version: APERTURE_VERSION
    },
    dimensions: { height, width },
    field: ATLAS_CONFIG.field,
    orientation: 'fixed',
    sourceDocuments: ATLAS_CONFIG.sourceDocuments
  };
  const configuration = {
    ...fieldConfiguration,
    palette: ATLAS_CONFIG.palette,
    render: { appearance, opticalSize: 'construction', productionProfile: 'screen', representation: 'aperture-construction', trajectoryState: 'not-applicable' }
  };
  const metadata = {
    ...createProvenance({
      aperturePathSha256: APERTURE_PATH_SHA256,
      apertureVersion: APERTURE_VERSION,
      appearance,
      configuration,
      fieldConfiguration,
      opticalSize: 'construction',
      orientation: 'fixed',
      productionProfile: 'screen',
      representation: 'aperture-construction',
      trajectoryState: 'not-applicable'
    }),
    constructionRatio: ATLAS_CONFIG.aperture.constructionRatio,
    referenceBounds: APERTURE_REFERENCE_BOUNDS
  };
  const colors = ATLAS_CONFIG.palette;
  const background = colors.backgrounds[appearance];
  const guide = appearance === 'dark' ? colors.neutral.darkMajor : colors.neutral.lightMajor;
  const silhouette = appearance === 'dark' ? colors.neutral.paper : colors.neutral.void;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 760">`,
    `<metadata id="bizarre-atlas-provenance">${serializeMetadata(metadata)}</metadata>`,
    `<rect data-layer="background" width="1200" height="760" fill="${background}"/>`,
    `<g data-layer="construction-guides" fill="none" stroke="${guide}" stroke-width="${ATLAS_CONFIG.field.lineWidths.minor}" stroke-dasharray="8 8">`,
    '<line x1="90" y1="370" x2="1110" y2="370"/>',
    '<line x1="600" y1="80" x2="600" y2="680"/>',
    '<rect x="360" y="260" width="480" height="220"/>',
    '</g>',
    `<path data-layer="continuous-lens-aperture" d="${APERTURE_PATH}" fill="${silhouette}" stroke="${silhouette}" stroke-width="${ATLAS_CONFIG.field.lineWidths.major}"/>`,
    `<circle data-layer="construction-origin" cx="600" cy="370" r="${ATLAS_CONFIG.aperture.revealDepth}" fill="${colors.signal}"/>`,
    '</svg>\n'
  ].join('');
  return { metadata, svg };
}
