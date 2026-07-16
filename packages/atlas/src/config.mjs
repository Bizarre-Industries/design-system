import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../../', import.meta.url);
const SNAPSHOT = new URL('../generated/config.json', import.meta.url);
const SOURCE_PATHS = {
  atlas: 'tokens/source/atlas.tokens.json',
  capture: 'tokens/source/capture.tokens.json',
  material: 'tokens/source/material.tokens.json',
  motion: 'tokens/source/motion.tokens.json',
  palette: 'tokens/source/palette.tokens.json',
  productionPolicy: 'policies/production.json',
  provenancePolicy: 'policies/provenance.json',
  rendererConfig: 'packages/atlas/src/renderer-config.json'
};

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function readJson(url) {
  const bytes = readFileSync(url);
  return { bytes, value: JSON.parse(bytes.toString('utf8')) };
}

function tokenValue(token, label) {
  if (!token || typeof token !== 'object' || !Object.hasOwn(token, '$value')) {
    throw new TypeError(`Missing canonical token: ${label}`);
  }
  return token.$value;
}

function numberToken(token, label) {
  const value = tokenValue(token, label);
  if (!Number.isFinite(value)) throw new TypeError(`Expected numeric canonical token: ${label}`);
  return value;
}

function booleanToken(token, label) {
  const value = tokenValue(token, label);
  if (typeof value !== 'boolean') throw new TypeError(`Expected boolean canonical token: ${label}`);
  return value;
}

function dimensionToken(token, label, unit) {
  const value = tokenValue(token, label);
  if (!value || !Number.isFinite(value.value) || value.unit !== unit) {
    throw new TypeError(`Expected ${unit} canonical dimension: ${label}`);
  }
  return value.value;
}

function colorToken(token, label) {
  const value = tokenValue(token, label);
  if (!value || typeof value.hex !== 'string' || !/^#[0-9A-F]{6}$/.test(value.hex)) {
    throw new TypeError(`Expected canonical sRGB hex color: ${label}`);
  }
  return value.hex;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function validateRendererConfig(document) {
  if (document?.schemaVersion !== 1 || !document.renderer || typeof document.renderer !== 'object') {
    throw new TypeError('Atlas renderer configuration schema is invalid');
  }
  const { algorithm, model, parameters, supported } = document.renderer;
  for (const [label, identity] of Object.entries({ algorithm, model })) {
    if (typeof identity?.name !== 'string' || typeof identity?.version !== 'string') {
      throw new TypeError(`Atlas renderer ${label} identity is invalid`);
    }
  }
  if (!parameters || typeof parameters !== 'object') throw new TypeError('Atlas renderer parameters are invalid');
  for (const [name, values] of Object.entries(supported ?? {})) {
    if (!Array.isArray(values) || values.length === 0 || new Set(values).size !== values.length || values.some((value) => typeof value !== 'string')) {
      throw new TypeError(`Atlas renderer supported ${name} values are invalid`);
    }
  }
  for (const name of [
    'appearances',
    'fieldOpticalSizes',
    'fieldRepresentations',
    'fieldTrajectoryStates',
    'opticalSizes',
    'productionProfiles',
    'representations',
    'trajectoryStates'
  ]) {
    if (!Object.hasOwn(supported ?? {}, name)) throw new TypeError(`Atlas renderer supported ${name} values are missing`);
  }
}

function isWorkspaceCheckout() {
  try {
    return readJson(new URL('package.json', ROOT)).value.name === '@bizarre/design-system-workspace';
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function buildCanonicalConfig() {
  const sources = Object.fromEntries(
    Object.entries(SOURCE_PATHS).map(([name, path]) => [name, readJson(new URL(path, ROOT))])
  );
  const atlasDocument = sources.atlas.value;
  const paletteDocument = sources.palette.value;
  const captureDocument = sources.capture.value;
  const materialDocument = sources.material.value;
  const motionDocument = sources.motion.value;
  const rendererDocument = sources.rendererConfig.value;
  const atlas = atlasDocument.atlas;
  const aperture = atlasDocument.aperture;
  const palette = paletteDocument.color;
  const orientationFamily = atlasDocument.$extensions?.['industries.bizarre']?.orientationFamily;

  validateRendererConfig(rendererDocument);
  if (!Array.isArray(orientationFamily) || orientationFamily.length !== 4 || orientationFamily.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Canonical Atlas orientation family is invalid');
  }
  const orientationLeaves = Object.entries(atlas.orientation ?? {})
    .filter(([key]) => !key.startsWith('$'))
    .map(([, token]) => numberToken(token, 'atlas.orientation'));
  if (orientationLeaves.length !== orientationFamily.length || orientationLeaves.some((value, index) => value !== orientationFamily[index])) {
    throw new TypeError('Canonical Atlas orientation leaves must match its orientation family');
  }
  if (materialDocument.material?.['signal-spot']?.$value !== '{color.accent.signal}') {
    throw new TypeError('Material Signal must alias the canonical Signal Lime token');
  }

  const phases = Object.fromEntries(
    (captureDocument.$extensions?.['industries.bizarre']?.phaseOrder ?? []).map((phase) => [phase, {
      start: numberToken(captureDocument.capture?.phase?.[phase]?.start, `capture.phase.${phase}.start`),
      end: numberToken(captureDocument.capture?.phase?.[phase]?.end, `capture.phase.${phase}.end`)
    }])
  );
  const durationAliases = {
    ceremonial: ['{motion.duration.epic}', 'epic'],
    fastMax: ['{motion.duration.slow}', 'slow'],
    fastMin: ['{motion.duration.mid}', 'mid']
  };
  const resolvedDurations = Object.fromEntries(Object.entries(durationAliases).map(([name, [alias, motionName]]) => {
    const sourceName = name === 'fastMax' ? 'fast-max' : name === 'fastMin' ? 'fast-min' : name;
    if (captureDocument.capture?.duration?.[sourceName]?.$value !== alias) {
      throw new TypeError(`Capture ${sourceName} duration must alias motion.duration.${motionName}`);
    }
    return [name, dimensionToken(motionDocument.motion.duration[motionName], `motion.duration.${motionName}`, 'ms')];
  }));

  const config = {
    aperture: {
      constructionRatio: numberToken(aperture.ratio, 'aperture.ratio'),
      offset: numberToken(aperture.offset, 'aperture.offset'),
      revealDepth: dimensionToken(aperture['reveal-depth'], 'aperture.reveal-depth', 'px'),
      tangentContinuity: booleanToken(aperture['tangent-continuity'], 'aperture.tangent-continuity')
    },
    capture: {
      duration: {
        ceremonial: resolvedDurations.ceremonial,
        fastMax: resolvedDurations.fastMax,
        fastMin: resolvedDurations.fastMin,
        installation: dimensionToken(captureDocument.capture.duration.installation, 'capture.duration.installation', 'ms'),
        unit: 'ms'
      },
      phases,
      reducedMotionState: captureDocument.$extensions['industries.bizarre'].reducedMotionState
    },
    field: {
      compressionExponent: numberToken(atlas['compression-exponent'], 'atlas.compression-exponent'),
      lineWidths: {
        band: dimensionToken(atlas.line.band, 'atlas.line.band', 'px'),
        major: dimensionToken(atlas.line.major, 'atlas.line.major', 'px'),
        minor: dimensionToken(atlas.line.minor, 'atlas.line.minor', 'px'),
        unit: 'px'
      },
      majorInterval: numberToken(atlas['major-interval'], 'atlas.major-interval'),
      mass: {
        x: numberToken(atlas.mass.x, 'atlas.mass.x'),
        y: numberToken(atlas.mass.y, 'atlas.mass.y')
      },
      parameters: rendererDocument.renderer.parameters
    },
    orientationFamily: [...orientationFamily],
    palette: {
      backgrounds: {
        dark: colorToken(palette.neutral.void, 'color.neutral.void'),
        light: colorToken(palette.neutral.paper, 'color.neutral.paper')
      },
      neutral: {
        darkMajor: colorToken(palette.neutral.ash300, 'color.neutral.ash300'),
        darkMinor: colorToken(palette.neutral.ash700, 'color.neutral.ash700'),
        lightMajor: colorToken(palette.neutral.ash700, 'color.neutral.ash700'),
        lightMinor: colorToken(palette.neutral.iron, 'color.neutral.iron'),
        paper: colorToken(palette.neutral.paper, 'color.neutral.paper'),
        void: colorToken(palette.neutral.void, 'color.neutral.void')
      },
      signal: colorToken(palette.accent.signal, 'color.accent.signal'),
      spectrum: Object.entries(palette.spectrum).map(([name, token]) => colorToken(token, `color.spectrum.${name}`))
    },
    policies: {
      production: sources.productionPolicy.value,
      provenance: sources.provenancePolicy.value
    },
    renderer: {
      algorithm: rendererDocument.renderer.algorithm,
      model: rendererDocument.renderer.model,
      supported: rendererDocument.renderer.supported
    },
    sourceDocuments: Object.fromEntries(
      Object.entries(SOURCE_PATHS).map(([name, path]) => [name, { path, sha256: sha256(sources[name].bytes) }])
    ),
    trajectoryCount: atlasDocument.$extensions['industries.bizarre'].trajectoryCount
  };
  if (config.trajectoryCount !== 1) throw new TypeError('Canonical Atlas must define exactly one Signal trajectory');
  return config;
}

function loadAtlasConfig() {
  try {
    return buildCanonicalConfig();
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    if (isWorkspaceCheckout()) throw error;
    try {
      return readJson(SNAPSHOT).value;
    } catch (snapshotError) {
      if (snapshotError?.code === 'ENOENT') {
        throw new Error('Atlas canonical sources and packaged configuration snapshot are both unavailable', { cause: error });
      }
      throw snapshotError;
    }
  }
}

export const ATLAS_CONFIG = deepFreeze(loadAtlasConfig());
export const ALGORITHM_PARAMETERS = ATLAS_CONFIG.field.parameters;

export function formatNumber(value, precision = 3) {
  if (!Number.isFinite(value)) throw new TypeError(`Cannot serialize non-finite number: ${value}`);
  const rounded = Number(value.toFixed(precision));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}
