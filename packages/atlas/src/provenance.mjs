import { createHash } from 'node:crypto';
import { ATLAS_CONFIG } from './config.mjs';

export const ALGORITHM = ATLAS_CONFIG.renderer.algorithm;
export const MODEL = ATLAS_CONFIG.renderer.model;

function canonicalValue(value, path = '$', active = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`Atlas canonical JSON requires a finite number at ${path}`);
    return value;
  }
  if (!value || typeof value !== 'object') {
    throw new TypeError(`Atlas canonical JSON contains an unsupported ${typeof value} value at ${path}`);
  }
  if (active.has(value)) throw new TypeError(`Atlas canonical JSON contains a cyclic reference at ${path}`);
  active.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) {
        throw new TypeError(`Atlas canonical JSON requires an ordinary array at ${path}`);
      }
      const expectedIndices = new Set(Array.from({ length: value.length }, (_, index) => String(index)));
      for (const key of Reflect.ownKeys(value)) {
        if (key === 'length') continue;
        if (typeof key !== 'string' || !expectedIndices.has(key)) {
          throw new TypeError(`Atlas canonical JSON array has a named property at ${path}: ${String(key)}`);
        }
      }
      return Array.from({ length: value.length }, (_, index) => {
        if (!Object.hasOwn(value, index)) throw new TypeError(`Atlas canonical JSON requires a dense array at ${path}`);
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
          throw new TypeError(`Atlas canonical JSON requires data array elements at ${path}[${index}]`);
        }
        return canonicalValue(descriptor.value, `${path}[${index}]`, active);
      });
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`Atlas canonical JSON requires a plain object at ${path}`);
    }
    const entries = [];
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError(`Atlas canonical JSON contains a symbol property at ${path}`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError(`Atlas canonical JSON requires enumerable data properties at ${path}.${key}`);
      }
      entries.push([key, descriptor.value]);
    }
    return Object.fromEntries(
      entries.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, child]) => [key, canonicalValue(child, `${path}.${key}`, active)])
    );
  } finally {
    active.delete(value);
  }
}

export const canonicalStringify = (value) => JSON.stringify(canonicalValue(value));
export const hashConfiguration = (configuration) => createHash('sha256').update(canonicalStringify(configuration)).digest('hex');

const FIELD_CONFIGURATION_KEYS = ['algorithm', 'aperture', 'dimensions', 'field', 'orientation', 'sourceDocuments'];

function fieldConfigurationFrom(configuration) {
  const fieldConfiguration = {};
  for (const key of FIELD_CONFIGURATION_KEYS) {
    if (!Object.hasOwn(configuration, key)) throw new TypeError(`Atlas configuration is missing field input: ${key}`);
    fieldConfiguration[key] = configuration[key];
  }
  return fieldConfiguration;
}

function forbiddenClaim(value, active = new Set()) {
  if (!value || typeof value !== 'object' || active.has(value)) return null;
  active.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (/^(seed|catalogue|catalog|coordinates?|epoch|dataset|observation)$/i.test(key)) return key;
    const nested = forbiddenClaim(child, active);
    if (nested) return nested;
  }
  active.delete(value);
  return null;
}

export function createProvenance({
  aperturePathSha256,
  apertureVersion,
  appearance,
  configuration,
  fieldConfiguration,
  opticalSize,
  orientation,
  productionProfile,
  representation,
  trajectoryState
}) {
  const fieldConfigurationHash = hashConfiguration(fieldConfiguration);
  const metadata = {
    algorithm: ALGORITHM,
    aperturePathSha256,
    apertureVersion,
    appearance,
    configuration,
    configurationHash: hashConfiguration(configuration),
    fieldConfigurationHash,
    model: MODEL,
    opticalSize,
    orientation,
    orientationUnit: orientation === 'fixed' ? 'fixed' : 'deg',
    productionProfile,
    representation,
    schemaVersion: 1,
    sourceIdentifier: `synthetic:${ALGORITHM.name}@${ALGORITHM.version}:${fieldConfigurationHash}`,
    sourceType: 'synthetic',
    trajectoryState
  };
  validateProvenance(metadata);
  return metadata;
}

export function validateProvenance(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new TypeError('Atlas provenance must be an object');
  const forbidden = forbiddenClaim(metadata);
  if (forbidden) throw new TypeError(`Atlas provenance contains unsupported ${forbidden} claim`);
  if (metadata.schemaVersion !== 1) throw new TypeError('Atlas provenance schema version must be 1');
  if (metadata.sourceType !== 'synthetic') throw new TypeError('Atlas renderer supports synthetic provenance only');
  if (canonicalStringify(metadata.model) !== canonicalStringify(MODEL)) throw new TypeError('Atlas provenance model must identify the canonical single-mass model');
  if (canonicalStringify(metadata.algorithm) !== canonicalStringify(ALGORITHM)) throw new TypeError('Atlas provenance algorithm/version is invalid');
  if (!metadata.configuration || typeof metadata.configuration !== 'object') throw new TypeError('Atlas provenance requires its actual configuration');
  if (metadata.configurationHash !== hashConfiguration(metadata.configuration)) throw new TypeError('Atlas provenance configuration hash does not match its configuration');
  if (canonicalStringify(metadata.configuration.algorithm) !== canonicalStringify(metadata.algorithm)) {
    throw new TypeError('Atlas provenance algorithm does not match its configuration');
  }
  if (!/^[a-f0-9]{64}$/.test(metadata.fieldConfigurationHash ?? '')) throw new TypeError('Atlas provenance field configuration hash is invalid');
  if (metadata.fieldConfigurationHash !== hashConfiguration(fieldConfigurationFrom(metadata.configuration))) {
    throw new TypeError('Atlas provenance field configuration hash does not match its configuration');
  }
  const expectedSourceIdentifier = `synthetic:${ALGORITHM.name}@${ALGORITHM.version}:${metadata.fieldConfigurationHash}`;
  if (metadata.sourceIdentifier !== expectedSourceIdentifier) throw new TypeError('Atlas provenance source identifier does not match its field configuration');
  if (!/^[a-f0-9]{64}$/.test(metadata.aperturePathSha256 ?? '')) throw new TypeError('Atlas provenance aperture path hash is invalid');
  if (typeof metadata.apertureVersion !== 'string' || metadata.apertureVersion.length === 0) throw new TypeError('Atlas provenance aperture version is required');
  if (metadata.aperturePathSha256 !== metadata.configuration.aperture?.pathSha256) {
    throw new TypeError('Atlas provenance aperture path hash does not match its configuration');
  }
  if (metadata.apertureVersion !== metadata.configuration.aperture?.version) {
    throw new TypeError('Atlas provenance aperture version does not match its configuration');
  }
  if (metadata.orientation !== 'fixed' && !ATLAS_CONFIG.orientationFamily.includes(metadata.orientation)) {
    throw new TypeError(`Atlas provenance orientation must be one of ${ATLAS_CONFIG.orientationFamily.join(', ')}`);
  }
  const expectedOrientationUnit = metadata.orientation === 'fixed' ? 'fixed' : 'deg';
  if (metadata.orientationUnit !== expectedOrientationUnit) {
    throw new TypeError(`Atlas provenance orientation unit must be ${expectedOrientationUnit}`);
  }
  if (metadata.orientation !== metadata.configuration.orientation) throw new TypeError('Atlas provenance orientation does not match its configuration');
  const supportedFields = {
    appearance: 'appearances',
    opticalSize: 'opticalSizes',
    productionProfile: 'productionProfiles',
    representation: 'representations',
    trajectoryState: 'trajectoryStates'
  };
  for (const [key, supportedKey] of Object.entries(supportedFields)) {
    if (typeof metadata[key] !== 'string' || metadata[key].length === 0) throw new TypeError(`Atlas provenance ${key} is required`);
    if (!ATLAS_CONFIG.renderer.supported[supportedKey].includes(metadata[key])) {
      throw new TypeError(`Atlas provenance contains unsupported ${key}: ${metadata[key]}`);
    }
    if (metadata[key] !== metadata.configuration.render?.[key]) throw new TypeError(`Atlas provenance ${key} does not match its configuration`);
  }
  for (const key of ATLAS_CONFIG.policies.provenance.exports?.requiredMetadata ?? []) {
    if (!Object.hasOwn(metadata, key)) throw new TypeError(`Atlas provenance is missing policy-required metadata: ${key}`);
  }
  return true;
}

export const serializeMetadata = (metadata) => canonicalStringify(metadata);
