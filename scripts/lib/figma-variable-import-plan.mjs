import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { canonicalJson } from './canonical-json.mjs';
import { flattenTokens, loadTokenModel, resolveTokenAliases } from './token-model.mjs';

const ALIAS = /^\{([^{}]+)\}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const FIGMA_TYPES = new Set(['COLOR', 'FLOAT', 'STRING', 'BOOLEAN']);
const FIGMA_SCOPES = new Set([
  'ALL_SCOPES',
  'FRAME_FILL',
  'SHAPE_FILL',
  'TEXT_FILL',
  'STROKE_COLOR',
  'STROKE_FLOAT',
  'GAP',
  'CORNER_RADIUS',
  'FONT_FAMILY',
  'FONT_SIZE',
  'FONT_WEIGHT',
]);

const BOOLEAN_SCOPE_APPLICATION = Object.freeze({
  status: 'UNSUPPORTED_NOT_APPLICABLE',
  operation: 'OMIT_SCOPE_ASSIGNMENT',
  applyScopes: false,
  liveApiReportedScopes: Object.freeze(['ALL_SCOPES']),
  observedAssignmentError: 'Invalid scope for this variable type',
});

export const FIGMA_IMPORT_PLAN_PATH = 'governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-import.json';
export const FIGMA_FONT_FAMILY_MAPPING_PATH = 'governance/design-ledgers/figma/bizarre-font-family-mapping-v1.json';

export const FIGMA_FONT_FAMILY_TARGETS = Object.freeze([
  Object.freeze({ tokenPath: 'font.family.arabic', sourcePrimaryFamily: 'Noto Sans Arabic', figmaFamily: 'Noto Sans Arabic', mappingKind: 'identity-registered-family' }),
  Object.freeze({ tokenPath: 'font.family.arabic-industrial', sourcePrimaryFamily: 'Noto Sans Arabic Condensed', figmaFamily: 'Noto Sans Arabic', mappingKind: 'registered-family-substitution' }),
  Object.freeze({ tokenPath: 'font.family.arabic-ui', sourcePrimaryFamily: 'Noto Sans Arabic UI', figmaFamily: 'Noto Sans Arabic', mappingKind: 'registered-family-substitution' }),
  Object.freeze({ tokenPath: 'font.family.body', sourcePrimaryFamily: 'Hanken Grotesk', figmaFamily: 'Hanken Grotesk', mappingKind: 'identity-registered-family' }),
  Object.freeze({ tokenPath: 'font.family.display', sourcePrimaryFamily: 'Unbounded', figmaFamily: 'Unbounded', mappingKind: 'identity-registered-family' }),
  Object.freeze({ tokenPath: 'font.family.mono', sourcePrimaryFamily: 'JetBrains Mono', figmaFamily: 'JetBrains Mono', mappingKind: 'identity-registered-family' }),
  Object.freeze({ tokenPath: 'font.family.stencil', sourcePrimaryFamily: 'Big Shoulders Stencil', figmaFamily: 'Big Shoulders Stencil Display', mappingKind: 'registered-family-substitution' }),
]);

const FIGMA_REGISTERED_FONT_FAMILIES = Object.freeze([
  'Unbounded',
  'Hanken Grotesk',
  'JetBrains Mono',
  'Noto Sans Arabic',
  'Big Shoulders Stencil Display',
  'Big Shoulders Stencil Text',
]);

const FIGMA_UNREGISTERED_EXACT_FONT_FAMILIES = Object.freeze([
  'Big Shoulders Stencil',
  'Noto Sans Arabic UI',
  'Noto Sans Arabic Condensed',
]);

const FIGMA_WORKING_TEXT_STYLE_PAIRS = Object.freeze([
  Object.freeze({ role: 'Industrial H3', family: 'Big Shoulders Stencil Display', style: 'ExtraBold', evidenceRef: 'working-local-text-styles' }),
  Object.freeze({ role: 'Industrial H4', family: 'Big Shoulders Stencil Display', style: 'Bold', evidenceRef: 'working-local-text-styles' }),
  Object.freeze({ role: 'Arabic Industrial', family: 'Noto Sans Arabic', style: 'Condensed ExtraBold', evidenceRef: 'working-local-text-styles' }),
]);

export const APPROVED_FIGMA_COLLECTIONS = [
  { name: 'Palette', document: 'palette', sourceFile: 'palette.tokens.json', expectedCount: 34, modes: ['Value'] },
  { name: 'Brand', document: 'brand', sourceFile: 'brand.tokens.json', expectedCount: 1, modes: ['Value'] },
  { name: 'Typography', document: 'typography', sourceFile: 'typography.tokens.json', expectedCount: 37, modes: ['Value'] },
  { name: 'Geometry', document: 'geometry', sourceFile: 'geometry.tokens.json', expectedCount: 29, modes: ['Value'] },
  { name: 'Motion', document: 'motion', sourceFile: 'motion.tokens.json', expectedCount: 9, modes: ['Value'] },
  { name: 'Atlas', document: 'atlas', sourceFile: 'atlas.tokens.json', expectedCount: 15, modes: ['Value'] },
  { name: 'Material', document: 'material', sourceFile: 'material.tokens.json', expectedCount: 7, modes: ['Value'] },
  { name: 'Capture', document: 'capture', sourceFile: 'capture.tokens.json', expectedCount: 14, modes: ['Value'] },
  {
    name: 'Modes',
    document: 'modes',
    sourceFile: 'modes.tokens.json',
    expectedCount: 27,
    modes: ['void', 'paper', 'void-hicontrast', 'workshop', 'bone'],
  },
];

const SHADOW_HANDOFF = [
  ['Shadow/SM', 'shadow.sm'],
  ['Shadow/MD', 'shadow.md'],
  ['Shadow/LG', 'shadow.lg'],
  ['Shadow/Signal', 'shadow.signal'],
];

function canonicalCompact(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalCompact).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalCompact(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const valueSha256 = (value) => sha256(canonicalCompact(value));
const variableName = (tokenPath) => tokenPath.replaceAll('.', '/');
const webCodeSyntax = (tokenPath) => `var(--bzr-${tokenPath.replaceAll('.', '-')})`;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function hashableFontFamilyMapping(mapping) {
  const copy = structuredClone(mapping);
  delete copy.canonicalSha256;
  return copy;
}

export function validateFigmaFontFamilyMapping(mapping, { expectedWebTokenSourceFileSha256 } = {}) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (mapping?.schemaVersion !== 1) fail('font-family mapping schemaVersion must be 1');
  if (mapping?.mappingVersion !== '1.0.0') fail('font-family mappingVersion must be 1.0.0');
  if (mapping?.mappingId !== 'bizarre-figma-font-family-mapping-v1') fail('font-family mappingId drift');
  if (mapping?.classification !== 'governed-figma-only-font-family-mapping') fail('font-family mapping classification drift');
  if (mapping?.authority?.scope !== 'canonical-figma-typography-family-variable-values-only') fail('font-family mapping authority scope drift');
  if (canonicalCompact(mapping?.authority?.doesNotAuthorize) !== canonicalCompact([
    'web-token-mutation',
    'font-stack-mutation',
    'figma-mutation',
    'figma-text-style-mutation',
    'design-asset-mutation',
  ])) fail('font-family mapping mutation authority drift');
  if (mapping?.figma?.fileKey !== 'hGgrP9G0tEam8mpk5u3rHg') fail('font-family mapping Figma file key drift');
  if (mapping?.figma?.registryEvidenceStatus !== 'LIVE VERIFIED') fail('font-family registry evidence must be LIVE VERIFIED');
  if (mapping?.figma?.mutationStatus !== 'NOT_APPLIED') fail('font-family mapping mutationStatus must remain NOT_APPLIED');
  if (canonicalCompact(mapping?.figma?.observedRegisteredFamilies) !== canonicalCompact(FIGMA_REGISTERED_FONT_FAMILIES)) {
    fail('font-family registered-family evidence drift');
  }
  if (canonicalCompact(mapping?.figma?.observedUnregisteredExactFamilies) !== canonicalCompact(FIGMA_UNREGISTERED_EXACT_FONT_FAMILIES)) {
    fail('font-family unregistered-family evidence drift');
  }
  if (mapping?.webTokenContract?.sourceFilePath !== 'tokens/source/typography.tokens.json') fail('font-family web token source path drift');
  if (!SHA256.test(mapping?.webTokenContract?.sourceFileSha256 ?? '')) fail('font-family web token source hash is invalid');
  if (expectedWebTokenSourceFileSha256 && mapping?.webTokenContract?.sourceFileSha256 !== expectedWebTokenSourceFileSha256) {
    fail('font-family web token source hash drift');
  }
  if (mapping?.webTokenContract?.mutationStatus !== 'UNCHANGED') fail('font-family web token mutationStatus must remain UNCHANGED');
  if (canonicalCompact(mapping?.workingTextStylePairs) !== canonicalCompact(FIGMA_WORKING_TEXT_STYLE_PAIRS)) {
    fail('font-family working text-style evidence drift');
  }

  const evidenceIds = new Set((mapping?.evidence ?? []).map(({ evidenceId }) => evidenceId));
  if (canonicalCompact([...evidenceIds]) !== canonicalCompact([
    'live-font-registry',
    'working-local-text-styles',
    'canonical-web-typography-tokens',
  ])) fail('font-family evidence inventory drift');
  for (const evidence of mapping?.evidence ?? []) {
    if (typeof evidence.locator !== 'string' || evidence.locator.length === 0) fail(`font-family evidence ${evidence.evidenceId} locator is missing`);
    if (!['LIVE VERIFIED', 'HASH VERIFIED'].includes(evidence.status)) fail(`font-family evidence ${evidence.evidenceId} status is invalid`);
  }

  if (canonicalCompact((mapping?.mappings ?? []).map(({ tokenPath, sourcePrimaryFamily, figmaFamily, mappingKind }) => ({
    tokenPath,
    sourcePrimaryFamily,
    figmaFamily,
    mappingKind,
  }))) !== canonicalCompact(FIGMA_FONT_FAMILY_TARGETS)) fail('font-family mapping target inventory drift');
  for (const entry of mapping?.mappings ?? []) {
    if (!Array.isArray(entry.sourceStack) || entry.sourceStack[0] !== entry.sourcePrimaryFamily) {
      fail(`${entry.tokenPath} source stack/primary family drift`);
    }
    if (!FIGMA_REGISTERED_FONT_FAMILIES.includes(entry.figmaFamily)) fail(`${entry.tokenPath} maps to an unregistered Figma family`);
    if (entry.mappingKind === 'registered-family-substitution'
      && !FIGMA_UNREGISTERED_EXACT_FONT_FAMILIES.includes(entry.sourcePrimaryFamily)) {
      fail(`${entry.tokenPath} substitution does not originate from a confirmed unregistered exact family`);
    }
    if (entry.mappingKind === 'identity-registered-family' && entry.sourcePrimaryFamily !== entry.figmaFamily) {
      fail(`${entry.tokenPath} identity mapping family drift`);
    }
    if (typeof entry.styleSelection !== 'string' || entry.styleSelection.length === 0) fail(`${entry.tokenPath} style-selection guidance is missing`);
    if (!Array.isArray(entry.evidenceRefs) || entry.evidenceRefs.length === 0
      || entry.evidenceRefs.some((evidenceRef) => !evidenceIds.has(evidenceRef))) {
      fail(`${entry.tokenPath} has invalid font-family mapping evidence references`);
    }
  }
  if (mapping?.canonicalSha256 !== sha256(canonicalCompact(hashableFontFamilyMapping(mapping)))) {
    fail('font-family mapping canonicalSha256 drift');
  }
  return errors;
}

function tokenDescriptionMetadata(document) {
  const metadata = new Map();
  const descriptionRecord = (groupPath, description) => ({
    groupPath,
    verbatim: description,
    sha256: sha256(description),
  });
  const tokenRecord = (token, inheritedGroupDescriptions, inheritedInvalidDescription) => ({
    canonicalDescription: typeof token.$description === 'string' ? token.$description : null,
    canonicalDescriptionSha256: typeof token.$description === 'string' ? sha256(token.$description) : null,
    inheritedGroupDescriptions,
    invalidDescription: inheritedInvalidDescription
      || (Object.hasOwn(token, '$description') && typeof token.$description !== 'string'),
  });

  function visit(node, segments, inheritedGroupDescriptions, inheritedInvalidDescription) {
    if (!isRecord(node)) return;
    if (Object.hasOwn(node, '$value')) {
      metadata.set(segments.join('.'), tokenRecord(node, inheritedGroupDescriptions, inheritedInvalidDescription));
      return;
    }

    const groupPath = segments.join('.') || '$root';
    const invalidGroupDescription = Object.hasOwn(node, '$description') && typeof node.$description !== 'string';
    const nextInherited = typeof node.$description === 'string'
      ? [...inheritedGroupDescriptions, descriptionRecord(groupPath, node.$description)]
      : inheritedGroupDescriptions;
    if (Object.hasOwn(node, '$root') && isRecord(node.$root)) {
      metadata.set(groupPath, tokenRecord(
        node.$root,
        nextInherited,
        inheritedInvalidDescription || invalidGroupDescription,
      ));
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) {
        visit(child, [...segments, key], nextInherited, inheritedInvalidDescription || invalidGroupDescription);
      }
    }
  }

  visit(document, [], [], false);
  return metadata;
}

function sourceMetadata(row) {
  return row.descriptionMetadata ?? {
    canonicalDescription: null,
    canonicalDescriptionSha256: null,
    inheritedGroupDescriptions: [],
    invalidDescription: false,
  };
}

function fallbackDescription(collection, tokenPath, modeRows, sourceFilePath) {
  const sourceLocator = collection.name === 'Modes'
    ? `${sourceFilePath}#modes.{${collection.modes.join('|')}}.${tokenPath}`
    : `${sourceFilePath}#${modeRows[0]?.path ?? tokenPath}`;
  return `Governed ${collection.name} variable for ${tokenPath}. Source: ${sourceLocator}. Status: governed token source; publication authority unchanged.`;
}

function figmaDescription({ collection, tokenPath, modeRows, sourceFilePath, blockedAmbiguities }) {
  const sourceDescriptions = modeRows.map((row) => sourceMetadata(row).canonicalDescription);
  const presentDescriptions = sourceDescriptions.filter((description) => description !== null);
  const uniqueDescriptions = [...new Set(presentDescriptions)];
  if (uniqueDescriptions.length > 1 || (presentDescriptions.length > 0 && presentDescriptions.length !== modeRows.length)) {
    makeBlocked(
      blockedAmbiguities,
      'MODE_DESCRIPTION_DRIFT',
      tokenPath,
      'A single Figma variable cannot honestly represent divergent or partially populated mode descriptions',
    );
  }
  if (uniqueDescriptions.length === 1 && presentDescriptions.length === modeRows.length) {
    return { description: uniqueDescriptions[0], descriptionOrigin: 'canonical-token-$description' };
  }
  return {
    description: fallbackDescription(collection, tokenPath, modeRows, sourceFilePath),
    descriptionOrigin: 'governed-fallback',
  };
}

function resolvedType(type) {
  if (type === 'color') return 'COLOR';
  if (['number', 'dimension', 'duration', 'fontWeight'].includes(type)) return 'FLOAT';
  if (['fontFamily', 'cubicBezier'].includes(type)) return 'STRING';
  if (type === 'boolean') return 'BOOLEAN';
  throw new TypeError(`No Figma variable type for DTCG type ${type}`);
}

function scopesFor(collection, tokenPath) {
  if (collection === 'Typography') {
    if (tokenPath.startsWith('font.family.')) return ['FONT_FAMILY'];
    if (tokenPath.startsWith('font.weight.')) return ['FONT_WEIGHT'];
    if (tokenPath.startsWith('font.size.')) return ['FONT_SIZE'];
    return [];
  }
  if (collection === 'Geometry') {
    if (tokenPath.startsWith('space.')) return ['GAP'];
    if (tokenPath.startsWith('radius.')) return ['CORNER_RADIUS'];
    if (tokenPath.startsWith('border.')) return ['STROKE_FLOAT'];
    return [];
  }
  if (collection === 'Atlas') {
    if (tokenPath.startsWith('atlas.line.')) return ['STROKE_FLOAT'];
    return [];
  }
  if (collection === 'Material') return ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
  if (collection === 'Modes') {
    if (tokenPath.startsWith('surface.') || tokenPath.endsWith('.surface')) return ['FRAME_FILL', 'SHAPE_FILL'];
    if (tokenPath.startsWith('content.') || tokenPath.endsWith('.content')) return ['SHAPE_FILL', 'TEXT_FILL'];
    if (tokenPath.startsWith('border.') || tokenPath === 'focus.ring') return ['STROKE_COLOR'];
    return [];
  }
  return [];
}

function scopeContractFor(collection, tokenPath, figmaType) {
  const conceptualScopes = scopesFor(collection, tokenPath);
  if (figmaType !== 'BOOLEAN') return { scopes: conceptualScopes };
  return {
    conceptualScopes,
    scopes: ['ALL_SCOPES'],
    scopeApplication: structuredClone(BOOLEAN_SCOPE_APPLICATION),
  };
}

function convertToFigma(type, value, { tokenPath = null, fontFamilyMappingByTokenPath = new Map() } = {}) {
  if (type === 'color') {
    const { components, alpha = 1 } = value ?? {};
    if (!Array.isArray(components) || components.length !== 3 || components.some((component) => !Number.isFinite(component))) {
      throw new TypeError('Figma COLOR requires three finite sRGB components');
    }
    return {
      figmaValue: { r: components[0], g: components[1], b: components[2], a: alpha },
      conversion: 'DTCG sRGB components to Figma RGBA',
    };
  }
  if (type === 'fontFamily') {
    if (!Array.isArray(value) || typeof value[0] !== 'string' || value[0].length === 0) {
      throw new TypeError('Figma font family requires a non-empty primary family');
    }
    const mapping = fontFamilyMappingByTokenPath.get(tokenPath);
    if (!mapping) throw new TypeError(`Figma font family ${tokenPath} requires a governed Figma-only mapping`);
    if (canonicalCompact(mapping.sourceStack) !== canonicalCompact(value)
      || mapping.sourcePrimaryFamily !== value[0]) {
      throw new TypeError(`Figma font family ${tokenPath} mapping drifted from the canonical WEB token stack`);
    }
    return {
      figmaValue: mapping.figmaFamily,
      conversion: `Governed Figma-only ${mapping.mappingKind}; the canonical WEB token retains the full fallback stack unchanged`,
      figmaFontFamilyMapping: {
        artifactPath: FIGMA_FONT_FAMILY_MAPPING_PATH,
        tokenPath: mapping.tokenPath,
        sourcePrimaryFamily: mapping.sourcePrimaryFamily,
        figmaFamily: mapping.figmaFamily,
        mappingKind: mapping.mappingKind,
        styleSelection: mapping.styleSelection,
        evidenceRefs: mapping.evidenceRefs,
      },
    };
  }
  if (type === 'fontWeight' || type === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${type} requires a finite number`);
    return { figmaValue: value, conversion: 'Identity numeric mapping' };
  }
  if (type === 'dimension') {
    if (!value || !Number.isFinite(value.value)) throw new TypeError('Dimension requires a finite value');
    if (value.unit === 'px') return { figmaValue: value.value, conversion: 'Pixel identity mapping' };
    if (value.unit === 'rem') {
      return { figmaValue: value.value * 16, conversion: 'rem to px at the established 16px Figma root' };
    }
    throw new TypeError(`Unsupported Figma dimension unit ${String(value.unit)}`);
  }
  if (type === 'duration') {
    if (!value || !Number.isFinite(value.value)) throw new TypeError('Duration requires a finite value');
    if (value.unit === 'ms') return { figmaValue: value.value, conversion: 'Millisecond identity mapping' };
    if (value.unit === 's') return { figmaValue: value.value * 1000, conversion: 'Seconds to milliseconds' };
    throw new TypeError(`Unsupported Figma duration unit ${String(value.unit)}`);
  }
  if (type === 'cubicBezier') {
    if (!Array.isArray(value) || value.length !== 4 || value.some((component) => !Number.isFinite(component))) {
      throw new TypeError('Cubic Bézier requires four finite components');
    }
    return {
      figmaValue: `cubic-bezier(${value.join(', ')})`,
      conversion: 'DTCG cubicBezier to CSS string because Figma has no cubic-bezier variable type',
    };
  }
  if (type === 'boolean') {
    if (typeof value !== 'boolean') throw new TypeError('Boolean token requires a boolean value');
    return { figmaValue: value, conversion: 'Boolean identity mapping' };
  }
  throw new TypeError(`Unsupported Figma conversion for DTCG type ${type}`);
}

function makeBlocked(blockedAmbiguities, code, sourceTokenPath, message) {
  blockedAmbiguities.push({ code, sourceTokenPath, message, resolutionStatus: 'BLOCKED' });
}

function makeModeValue({
  row,
  mode,
  sourceFilePath,
  resolvedRows,
  targetByTokenPath,
  fontFamilyMappingByTokenPath,
  blockedAmbiguities,
}) {
  const source = {
    canonicalDescription: sourceMetadata(row).canonicalDescription,
    canonicalDescriptionSha256: sourceMetadata(row).canonicalDescriptionSha256,
    filePath: sourceFilePath,
    inheritedGroupDescriptions: sourceMetadata(row).inheritedGroupDescriptions,
    tokenPath: row.path,
    type: row.type,
    tokenSha256: valueSha256({ path: row.path, type: row.type, value: row.value }),
    value: row.value,
  };
  const resolvedRow = resolvedRows.get(row.path);
  const match = typeof row.value === 'string' ? row.value.match(ALIAS) : null;
  try {
    const converted = convertToFigma(
      row.type,
      resolvedRow?.resolvedValue ?? resolvedRow?.value ?? row.value,
      { tokenPath: row.path, fontFamilyMappingByTokenPath },
    );
    if (!match) return { mode, source, valueKind: 'literal', ...converted };

    const target = targetByTokenPath.get(match[1]);
    if (!target) {
      makeBlocked(
        blockedAmbiguities,
        'UNRESOLVED_ALIAS_TARGET',
        row.path,
        `Alias ${row.value} has no approved Figma variable target`,
      );
      return { mode, source, valueKind: 'blocked-alias', aliasTarget: null, ...converted };
    }
    if (target.resolvedType !== resolvedType(row.type)) {
      makeBlocked(
        blockedAmbiguities,
        'ALIAS_TYPE_MISMATCH',
        row.path,
        `Alias ${row.value} resolves to ${target.resolvedType}, not ${resolvedType(row.type)}`,
      );
    }
    return {
      mode,
      source,
      valueKind: 'alias',
      aliasTarget: target,
      resolvedFigmaValue: converted.figmaValue,
      conversion: converted.conversion,
    };
  } catch (error) {
    makeBlocked(blockedAmbiguities, 'UNSUPPORTED_VALUE_CONVERSION', row.path, error.message);
    return { mode, source, valueKind: 'blocked', figmaValue: null, conversion: null };
  }
}

function makeVariable({
  collection,
  tokenPath,
  modeRows,
  sourceFilePath,
  resolvedRows,
  targetByTokenPath,
  fontFamilyMappingByTokenPath,
  blockedAmbiguities,
}) {
  const type = modeRows[0].type;
  let figmaType = null;
  try {
    figmaType = resolvedType(type);
  } catch (error) {
    makeBlocked(blockedAmbiguities, 'UNSUPPORTED_DTCG_TYPE', modeRows[0].path, error.message);
  }
  for (const row of modeRows) {
    if (sourceMetadata(row).invalidDescription) {
      makeBlocked(blockedAmbiguities, 'INVALID_SOURCE_DESCRIPTION', row.path, 'DTCG $description must be a string');
    }
  }
  const description = figmaDescription({ collection, tokenPath, modeRows, sourceFilePath, blockedAmbiguities });
  return {
    ...description,
    ...scopeContractFor(collection.name, tokenPath, figmaType),
    name: variableName(tokenPath),
    tokenPath,
    resolvedType: figmaType,
    codeSyntax: { WEB: webCodeSyntax(tokenPath) },
    hiddenFromPublishing: false,
    sourceFilePath,
    sourceFileSha256: collection.sourceFileSha256,
    modeValues: modeRows.map(({ mode, ...row }) => makeModeValue({
      row,
      mode,
      sourceFilePath,
      resolvedRows,
      targetByTokenPath,
      fontFamilyMappingByTokenPath,
      blockedAmbiguities,
    })),
  };
}

function hashablePlan(plan) {
  const copy = structuredClone(plan);
  delete copy.canonicalSha256;
  return copy;
}

export function validateFigmaVariableImportPlan(plan) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (plan.schemaVersion !== 1) fail('schemaVersion must be 1');
  if (plan.planVersion !== '1.2.0') fail('planVersion must be 1.2.0');
  if (plan.figma?.mutationStatus !== 'NOT_APPLIED') fail('Figma mutationStatus must remain NOT_APPLIED');
  if (plan.figma?.mutationAuthorized !== false) fail('Figma mutationAuthorized must remain false');
  if (plan.figma?.mutationPerformed !== false) fail('Figma mutationPerformed must be false');
  if (!Array.isArray(plan.collections) || plan.collections.length !== 9) fail('plan must contain nine collections');
  if (!Array.isArray(plan.blockedAmbiguities)) fail('blockedAmbiguities must be an array');
  if (plan.readyForFigmaMutation !== (plan.blockedAmbiguities?.length === 0)) fail('readyForFigmaMutation does not match blockers');

  const approvedSourceFiles = APPROVED_FIGMA_COLLECTIONS.map(({ sourceFile }) => sourceFile);
  if (plan.sourceManifest?.filePath !== 'tokens/source/manifest.json') fail('source manifest path drift');
  if (!SHA256.test(plan.sourceManifest?.fileSha256 ?? '')) fail('source manifest hash is invalid');
  if (canonicalCompact(plan.sourceManifest?.orderedFiles) !== canonicalCompact(approvedSourceFiles)) {
    fail('source manifest order drift');
  }

  const fontFamilyPlan = plan.figmaFontFamilyMapping;
  if (fontFamilyPlan?.filePath !== FIGMA_FONT_FAMILY_MAPPING_PATH) fail('Figma font-family mapping path drift');
  if (!SHA256.test(fontFamilyPlan?.fileSha256 ?? '')) fail('Figma font-family mapping file hash is invalid');
  if (!SHA256.test(fontFamilyPlan?.canonicalSha256 ?? '')) fail('Figma font-family mapping canonical hash is invalid');
  if (fontFamilyPlan?.mappingVersion !== '1.0.0') fail('Figma font-family mapping version drift');
  if (fontFamilyPlan?.mappingMutationStatus !== 'NOT_APPLIED') fail('Figma font-family mapping mutationStatus must remain NOT_APPLIED');
  if (fontFamilyPlan?.webTokenMutationStatus !== 'UNCHANGED') fail('Figma font-family mapping must leave web tokens unchanged');
  if (fontFamilyPlan?.webTokenSourceFilePath !== 'tokens/source/typography.tokens.json') fail('Figma font-family web token path drift');
  if (!SHA256.test(fontFamilyPlan?.webTokenSourceFileSha256 ?? '')) fail('Figma font-family web token hash is invalid');
  if (canonicalCompact((fontFamilyPlan?.mappings ?? []).map(({ tokenPath, sourcePrimaryFamily, figmaFamily, mappingKind }) => ({
    tokenPath,
    sourcePrimaryFamily,
    figmaFamily,
    mappingKind,
  }))) !== canonicalCompact(FIGMA_FONT_FAMILY_TARGETS)) fail('Figma font-family mapping inventory drift');
  if (canonicalCompact(plan.collections?.map(({ name }) => name)) !== canonicalCompact(APPROVED_FIGMA_COLLECTIONS.map(({ name }) => name))) {
    fail('collection order drift');
  }

  const expectedCollections = new Map(APPROVED_FIGMA_COLLECTIONS.map((entry) => [entry.name, entry]));
  const expectedFontFamilies = new Map(FIGMA_FONT_FAMILY_TARGETS.map((entry) => [entry.tokenPath, entry]));
  const fontFamilyPlanEntries = new Map((fontFamilyPlan?.mappings ?? []).map((entry) => [entry.tokenPath, entry]));
  const variablesByTarget = new Map();
  let total = 0;
  for (const collection of plan.collections ?? []) {
    const expected = expectedCollections.get(collection.name);
    if (!expected) {
      fail(`unexpected collection ${collection.name}`);
      continue;
    }
    if (collection.sourceFilePath !== `tokens/source/${expected.sourceFile}`) fail(`${collection.name} source path drift`);
    if (!SHA256.test(collection.sourceFileSha256 ?? '')) fail(`${collection.name} source hash is invalid`);
    if (collection.name === 'Typography'
      && collection.sourceFileSha256 !== fontFamilyPlan?.webTokenSourceFileSha256) {
      fail('Typography source hash drifted from the Figma font-family mapping contract');
    }
    if (collection.variableCount !== expected.expectedCount) fail(`${collection.name} variable count must be ${expected.expectedCount}`);
    if (collection.variables?.length !== expected.expectedCount) fail(`${collection.name} variable inventory length must be ${expected.expectedCount}`);
    if (canonicalCompact(collection.modes) !== canonicalCompact(expected.modes)) fail(`${collection.name} mode order drift`);
    total += collection.variables?.length ?? 0;

    const names = new Set();
    const tokenPaths = collection.variables?.map(({ tokenPath }) => tokenPath) ?? [];
    if (canonicalCompact(tokenPaths) !== canonicalCompact([...tokenPaths].sort())) fail(`${collection.name} variable order drift`);
    for (const variable of collection.variables ?? []) {
      if (names.has(variable.name)) fail(`${collection.name} duplicate variable ${variable.name}`);
      names.add(variable.name);
      if (variable.name !== variableName(variable.tokenPath)) fail(`${collection.name}/${variable.name} token/name drift`);
      if (!FIGMA_TYPES.has(variable.resolvedType)) fail(`${collection.name}/${variable.name} has invalid resolvedType`);
      if (typeof variable.description !== 'string' || variable.description.trim().length === 0) {
        fail(`${collection.name}/${variable.name} Figma description is missing`);
      }
      if (!Array.isArray(variable.scopes) || variable.scopes.some((scope) => !FIGMA_SCOPES.has(scope))) {
        fail(`${collection.name}/${variable.name} has invalid scopes`);
      }
      const conceptualScopes = scopesFor(collection.name, variable.tokenPath);
      if (variable.resolvedType === 'BOOLEAN') {
        if (canonicalCompact(variable.conceptualScopes) !== canonicalCompact(conceptualScopes)) {
          fail(`${collection.name}/${variable.name} conceptual scope mapping drift`);
        }
        if (canonicalCompact(variable.scopes) !== canonicalCompact(['ALL_SCOPES'])) {
          fail(`${collection.name}/${variable.name} live API scope report drift`);
        }
        if (canonicalCompact(variable.scopeApplication) !== canonicalCompact(BOOLEAN_SCOPE_APPLICATION)) {
          fail(`${collection.name}/${variable.name} BOOLEAN scope application contract drift`);
        }
      } else {
        if (canonicalCompact(variable.scopes) !== canonicalCompact(conceptualScopes)) {
          fail(`${collection.name}/${variable.name} scope mapping drift`);
        }
        if (Object.hasOwn(variable, 'conceptualScopes') || Object.hasOwn(variable, 'scopeApplication')) {
          fail(`${collection.name}/${variable.name} BOOLEAN-only scope contract leaked to another type`);
        }
      }
      if (variable.codeSyntax?.WEB !== webCodeSyntax(variable.tokenPath)) fail(`${collection.name}/${variable.name} WEB syntax drift`);
      if (variable.sourceFilePath !== collection.sourceFilePath || variable.sourceFileSha256 !== collection.sourceFileSha256) {
        fail(`${collection.name}/${variable.name} source file provenance drift`);
      }
      if (variable.modeValues?.length !== collection.modes.length) fail(`${collection.name}/${variable.name} mode count drift`);
      if (canonicalCompact(variable.modeValues?.map(({ mode }) => mode)) !== canonicalCompact(collection.modes)) {
        fail(`${collection.name}/${variable.name} mode order drift`);
      }
      variablesByTarget.set(`${collection.name}/${variable.name}`, variable);
      const canonicalDescriptions = [];
      for (const modeValue of variable.modeValues ?? []) {
        if (!SHA256.test(modeValue.source?.tokenSha256 ?? '')) fail(`${collection.name}/${variable.name}/${modeValue.mode} source token hash is invalid`);
        if (modeValue.source?.filePath !== collection.sourceFilePath) fail(`${collection.name}/${variable.name}/${modeValue.mode} source file path drift`);
        if (typeof modeValue.source?.tokenPath !== 'string' || modeValue.source.tokenPath.length === 0) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} source token path is invalid`);
        }
        if (typeof modeValue.source?.type !== 'string' || modeValue.source.type.length === 0) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} source token type is invalid`);
        } else {
          try {
            if (resolvedType(modeValue.source.type) !== variable.resolvedType) {
              fail(`${collection.name}/${variable.name}/${modeValue.mode} source/Figma type drift`);
            }
          } catch {
            fail(`${collection.name}/${variable.name}/${modeValue.mode} source token type is unsupported`);
          }
          const expectedTokenSha256 = valueSha256({
            path: modeValue.source.tokenPath,
            type: modeValue.source.type,
            value: modeValue.source.value,
          });
          if (modeValue.source.tokenSha256 !== expectedTokenSha256) {
            fail(`${collection.name}/${variable.name}/${modeValue.mode} source token hash drift`);
          }
        }
        const canonicalDescription = modeValue.source?.canonicalDescription;
        canonicalDescriptions.push(canonicalDescription);
        if (canonicalDescription === null) {
          if (modeValue.source?.canonicalDescriptionSha256 !== null) {
            fail(`${collection.name}/${variable.name}/${modeValue.mode} absent source description must have a null hash`);
          }
        } else if (typeof canonicalDescription === 'string' && canonicalDescription.length > 0) {
          if (modeValue.source?.canonicalDescriptionSha256 !== sha256(canonicalDescription)) {
            fail(`${collection.name}/${variable.name}/${modeValue.mode} source description hash drift`);
          }
        } else {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} source description must be a string or null`);
        }
        if (!Array.isArray(modeValue.source?.inheritedGroupDescriptions)) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} inherited source descriptions must be an array`);
        } else {
          for (const groupDescription of modeValue.source.inheritedGroupDescriptions) {
            if (typeof groupDescription.groupPath !== 'string' || groupDescription.groupPath.length === 0
              || typeof groupDescription.verbatim !== 'string' || groupDescription.verbatim.length === 0
              || groupDescription.sha256 !== sha256(groupDescription.verbatim)) {
              fail(`${collection.name}/${variable.name}/${modeValue.mode} inherited source description drift`);
            }
          }
        }
        if (modeValue.valueKind === 'alias' && !modeValue.aliasTarget) fail(`${collection.name}/${variable.name}/${modeValue.mode} alias target missing`);
        if (modeValue.valueKind === 'literal' && !Object.hasOwn(modeValue, 'figmaValue')) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} literal value missing`);
        }
        if (modeValue.valueKind === 'alias' && !Object.hasOwn(modeValue, 'resolvedFigmaValue')) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} resolved alias audit value missing`);
        }
        if (['alias', 'literal'].includes(modeValue.valueKind) && typeof modeValue.conversion !== 'string') {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} conversion record missing`);
        }
        const expectedFontFamily = expectedFontFamilies.get(variable.tokenPath);
        if (collection.name === 'Typography' && modeValue.source?.type === 'fontFamily') {
          const planEntry = fontFamilyPlanEntries.get(variable.tokenPath);
          const audit = modeValue.figmaFontFamilyMapping;
          if (!expectedFontFamily || !planEntry) {
            fail(`${collection.name}/${variable.name}/${modeValue.mode} governed Figma font-family mapping is missing`);
          } else {
            if (!Array.isArray(modeValue.source.value)
              || modeValue.source.value[0] !== expectedFontFamily.sourcePrimaryFamily) {
              fail(`${collection.name}/${variable.name}/${modeValue.mode} canonical WEB font stack drift`);
            }
            if (modeValue.figmaValue !== expectedFontFamily.figmaFamily) {
              fail(`${collection.name}/${variable.name}/${modeValue.mode} Figma font-family value drift`);
            }
            const expectedConversion = `Governed Figma-only ${expectedFontFamily.mappingKind}; the canonical WEB token retains the full fallback stack unchanged`;
            if (modeValue.conversion !== expectedConversion) {
              fail(`${collection.name}/${variable.name}/${modeValue.mode} Figma font-family conversion record drift`);
            }
            if (canonicalCompact(audit) !== canonicalCompact({
              artifactPath: FIGMA_FONT_FAMILY_MAPPING_PATH,
              tokenPath: planEntry.tokenPath,
              sourcePrimaryFamily: planEntry.sourcePrimaryFamily,
              figmaFamily: planEntry.figmaFamily,
              mappingKind: planEntry.mappingKind,
              styleSelection: planEntry.styleSelection,
              evidenceRefs: planEntry.evidenceRefs,
            })) {
              fail(`${collection.name}/${variable.name}/${modeValue.mode} Figma font-family audit mapping drift`);
            }
          }
        } else if (Object.hasOwn(modeValue, 'figmaFontFamilyMapping')) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} Figma font-family mapping leaked to a non-family value`);
        }
      }
      const presentDescriptions = canonicalDescriptions.filter((description) => typeof description === 'string');
      const uniqueDescriptions = [...new Set(presentDescriptions)];
      if (presentDescriptions.length === 0) {
        const expectedDescription = fallbackDescription(
          collection,
          variable.tokenPath,
          (variable.modeValues ?? []).map((modeValue) => ({ path: modeValue.source.tokenPath })),
          collection.sourceFilePath,
        );
        if (variable.descriptionOrigin !== 'governed-fallback' || variable.description !== expectedDescription) {
          fail(`${collection.name}/${variable.name} governed fallback description drift`);
        }
      } else if (presentDescriptions.length === canonicalDescriptions.length && uniqueDescriptions.length === 1) {
        if (variable.descriptionOrigin !== 'canonical-token-$description' || variable.description !== uniqueDescriptions[0]) {
          fail(`${collection.name}/${variable.name} canonical Figma description drift`);
        }
      } else {
        fail(`${collection.name}/${variable.name} source descriptions cannot map honestly to one Figma description`);
      }
    }
  }
  if (total !== 173 || plan.variableCount !== 173) fail('canonical variable total must be 173');

  for (const collection of plan.collections ?? []) {
    for (const variable of collection.variables ?? []) {
      for (const modeValue of variable.modeValues ?? []) {
        if (modeValue.valueKind !== 'alias') continue;
        const targetKey = `${modeValue.aliasTarget.collection}/${modeValue.aliasTarget.variableName}`;
        const target = variablesByTarget.get(targetKey);
        if (!target) fail(`${collection.name}/${variable.name}/${modeValue.mode} points to missing alias target ${targetKey}`);
        if (target && target.resolvedType !== variable.resolvedType) fail(`${collection.name}/${variable.name}/${modeValue.mode} alias type mismatch`);
        const sourceAlias = typeof modeValue.source?.value === 'string' ? modeValue.source.value.match(ALIAS) : null;
        if (!sourceAlias || sourceAlias[1] !== modeValue.aliasTarget.sourceTokenPath) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} alias source/target drift`);
        }
        if (modeValue.aliasTarget.variableName !== variableName(modeValue.aliasTarget.sourceTokenPath)) {
          fail(`${collection.name}/${variable.name}/${modeValue.mode} alias target name drift`);
        }
        if (target) {
          const targetValue = target.modeValues?.find(({ mode }) => mode === modeValue.mode)
            ?? target.modeValues?.[0];
          const resolvedTargetValue = targetValue?.valueKind === 'alias'
            ? targetValue.resolvedFigmaValue
            : targetValue?.figmaValue;
          if (canonicalCompact(modeValue.resolvedFigmaValue) !== canonicalCompact(resolvedTargetValue)) {
            fail(`${collection.name}/${variable.name}/${modeValue.mode} resolved alias audit value drift`);
          }
        }
      }
    }
  }

  if (canonicalCompact(plan.effectStyleHandoff?.map(({ styleName, sourceTokenPath }) => [styleName, sourceTokenPath])) !== canonicalCompact(SHADOW_HANDOFF)) {
    fail('effect-style handoff must contain the four approved shadows');
  }
  for (const handoff of plan.effectStyleHandoff ?? []) {
    if (handoff.variableImport !== 'excluded') fail(`${handoff.styleName} must remain excluded from variables`);
    if (handoff.sourceFilePath !== 'tokens/source/motion.tokens.json') fail(`${handoff.styleName} shadow source path drift`);
    if (!SHA256.test(handoff.sourceFileSha256 ?? '')) fail(`${handoff.styleName} shadow source file hash is invalid`);
    if (handoff.sourceTokenType !== 'shadow') fail(`${handoff.styleName} source token type must be shadow`);
    if (!SHA256.test(handoff.sourceTokenSha256 ?? '')) fail(`${handoff.styleName} source token hash is invalid`);
    const expectedShadowSha256 = valueSha256({
      path: handoff.sourceTokenPath,
      type: handoff.sourceTokenType,
      value: handoff.sourceValue,
    });
    if (handoff.sourceTokenSha256 !== expectedShadowSha256) fail(`${handoff.styleName} source token hash drift`);
  }
  const importedTokenPaths = (plan.collections ?? []).flatMap(({ variables }) => variables.map(({ tokenPath }) => tokenPath));
  if (importedTokenPaths.some((tokenPath) => /(?:^|\.)(notch|chamfer)(?:\.|$)/iu.test(tokenPath))) {
    fail('legacy notch/chamfer token semantics are forbidden');
  }
  if (plan.canonicalSha256 !== sha256(canonicalCompact(hashablePlan(plan)))) fail('canonicalSha256 drift');
  return errors;
}

export async function buildFigmaVariableImportPlan(rootUrl = new URL('../../', import.meta.url)) {
  const tokenSourceUrl = new URL('tokens/source/', rootUrl);
  const manifestText = await readFile(new URL('manifest.json', tokenSourceUrl), 'utf8');
  const manifest = JSON.parse(manifestText);
  const fontFamilyMappingText = await readFile(new URL(FIGMA_FONT_FAMILY_MAPPING_PATH, rootUrl), 'utf8');
  const fontFamilyMapping = JSON.parse(fontFamilyMappingText);
  const model = await loadTokenModel(rootUrl);
  const blockedAmbiguities = [];

  const approvedSourceFiles = APPROVED_FIGMA_COLLECTIONS.map(({ sourceFile }) => sourceFile);
  if (canonicalCompact(manifest) !== canonicalCompact(approvedSourceFiles)) {
    makeBlocked(
      blockedAmbiguities,
      'SOURCE_MANIFEST_DRIFT',
      'tokens/source/manifest.json',
      `Expected ${approvedSourceFiles.join(', ')}, received ${manifest.join(', ')}`,
    );
  }

  const resolvedRows = new Map(resolveTokenAliases(flattenTokens(model)).map((row) => [row.path, row]));
  const collectionSources = new Map();
  const descriptionMetadataByDocument = new Map();
  const rawRowsByDocument = new Map();
  for (const approved of APPROVED_FIGMA_COLLECTIONS) {
    const text = await readFile(new URL(approved.sourceFile, tokenSourceUrl), 'utf8');
    collectionSources.set(approved.document, {
      sourceFilePath: `tokens/source/${approved.sourceFile}`,
      sourceFileSha256: sha256(text),
    });
    const descriptions = tokenDescriptionMetadata(model[approved.document]);
    descriptionMetadataByDocument.set(approved.document, descriptions);
    if (approved.name !== 'Modes') {
      rawRowsByDocument.set(approved.document, flattenTokens({ [approved.document]: model[approved.document] }).map((row) => ({
        ...row,
        descriptionMetadata: descriptions.get(row.path),
      })));
    }
  }

  const includedRowsByCollection = new Map();
  for (const approved of APPROVED_FIGMA_COLLECTIONS.filter(({ name }) => name !== 'Modes')) {
    const rows = rawRowsByDocument.get(approved.document).filter((row) => row.type !== 'shadow');
    includedRowsByCollection.set(approved.name, rows);
  }

  const typographySourceSha256 = collectionSources.get('typography').sourceFileSha256;
  for (const error of validateFigmaFontFamilyMapping(fontFamilyMapping, {
    expectedWebTokenSourceFileSha256: typographySourceSha256,
  })) {
    makeBlocked(blockedAmbiguities, 'FIGMA_FONT_FAMILY_MAPPING_DRIFT', FIGMA_FONT_FAMILY_MAPPING_PATH, error);
  }
  const fontFamilyMappingByTokenPath = new Map(fontFamilyMapping.mappings.map((entry) => [entry.tokenPath, entry]));
  const typographyRows = new Map(includedRowsByCollection.get('Typography').map((row) => [row.path, row]));
  for (const target of FIGMA_FONT_FAMILY_TARGETS) {
    const row = typographyRows.get(target.tokenPath);
    const mapping = fontFamilyMappingByTokenPath.get(target.tokenPath);
    if (!row || row.type !== 'fontFamily') {
      makeBlocked(blockedAmbiguities, 'FIGMA_FONT_FAMILY_TOKEN_MISSING', target.tokenPath, 'Canonical Typography font-family token is missing');
      continue;
    }
    if (!mapping || canonicalCompact(mapping.sourceStack) !== canonicalCompact(row.value)) {
      makeBlocked(
        blockedAmbiguities,
        'FIGMA_FONT_FAMILY_SOURCE_STACK_DRIFT',
        target.tokenPath,
        'Figma-only mapping no longer matches the unchanged canonical WEB font stack',
      );
    }
  }

  const targetByTokenPath = new Map();
  for (const approved of APPROVED_FIGMA_COLLECTIONS.filter(({ name }) => name !== 'Modes')) {
    for (const row of includedRowsByCollection.get(approved.name)) {
      let figmaType = null;
      try {
        figmaType = resolvedType(row.type);
      } catch (error) {
        makeBlocked(blockedAmbiguities, 'UNSUPPORTED_DTCG_TYPE', row.path, error.message);
      }
      targetByTokenPath.set(row.path, {
        collection: approved.name,
        variableName: variableName(row.path),
        sourceTokenPath: row.path,
        resolvedType: figmaType,
      });
    }
  }

  const collections = [];
  for (const approved of APPROVED_FIGMA_COLLECTIONS) {
    const source = collectionSources.get(approved.document);
    const collection = { ...approved, ...source };
    let variables;
    if (approved.name !== 'Modes') {
      variables = includedRowsByCollection.get(approved.name).map((row) => makeVariable({
        collection,
        tokenPath: row.path,
        modeRows: [{ mode: 'Value', ...row }],
        sourceFilePath: source.sourceFilePath,
        resolvedRows,
        targetByTokenPath,
        fontFamilyMappingByTokenPath,
        blockedAmbiguities,
      }));
    } else {
      const themeOrder = model.modes?.$extensions?.['industries.bizarre']?.themeOrder;
      if (canonicalCompact(themeOrder) !== canonicalCompact(approved.modes)) {
        makeBlocked(blockedAmbiguities, 'MODE_ORDER_DRIFT', 'modes.$extensions.industries.bizarre.themeOrder', 'Canonical mode order drift');
      }
      const byTheme = new Map();
      for (const theme of approved.modes) {
        byTheme.set(theme, flattenTokens({ theme: model.modes.modes[theme] }).map((row) => ({
          ...row,
          path: `modes.${theme}.${row.path}`,
          rolePath: row.path,
          descriptionMetadata: descriptionMetadataByDocument.get('modes').get(`modes.${theme}.${row.path}`),
        })));
      }
      const baseline = byTheme.get(approved.modes[0]).map(({ rolePath }) => rolePath);
      for (const theme of approved.modes.slice(1)) {
        const roles = byTheme.get(theme).map(({ rolePath }) => rolePath);
        if (canonicalCompact(roles) !== canonicalCompact(baseline)) {
          makeBlocked(blockedAmbiguities, 'MODE_ROLE_DRIFT', `modes.${theme}`, `${theme} semantic roles differ from ${approved.modes[0]}`);
        }
      }
      variables = baseline.map((rolePath) => makeVariable({
        collection,
        tokenPath: rolePath,
        modeRows: approved.modes.map((theme) => ({
          mode: theme,
          ...byTheme.get(theme).find((row) => row.rolePath === rolePath),
        })),
        sourceFilePath: source.sourceFilePath,
        resolvedRows,
        targetByTokenPath,
        fontFamilyMappingByTokenPath,
        blockedAmbiguities,
      }));
    }

    if (variables.length !== approved.expectedCount) {
      makeBlocked(
        blockedAmbiguities,
        'COLLECTION_COUNT_DRIFT',
        source.sourceFilePath,
        `${approved.name} requires ${approved.expectedCount} variables, received ${variables.length}`,
      );
    }
    collections.push({
      name: approved.name,
      sourceFilePath: source.sourceFilePath,
      sourceFileSha256: source.sourceFileSha256,
      variableCount: variables.length,
      modes: approved.modes,
      variables,
    });
  }

  const motionRows = new Map(rawRowsByDocument.get('motion').map((row) => [row.path, row]));
  const effectStyleHandoff = SHADOW_HANDOFF.map(([styleName, sourceTokenPath]) => {
    const row = motionRows.get(sourceTokenPath);
    if (!row || row.type !== 'shadow') {
      makeBlocked(blockedAmbiguities, 'MISSING_SHADOW_HANDOFF', sourceTokenPath, `${styleName} source shadow is missing`);
      return { styleName, sourceTokenPath, sourceTokenSha256: null, sourceValue: null, variableImport: 'excluded' };
    }
    return {
      styleName,
      sourceFilePath: 'tokens/source/motion.tokens.json',
      sourceFileSha256: collectionSources.get('motion').sourceFileSha256,
      sourceTokenPath,
      sourceTokenType: row.type,
      sourceTokenSha256: valueSha256({ path: row.path, type: row.type, value: row.value }),
      sourceValue: row.value,
      variableImport: 'excluded',
      disposition: 'Create or reconcile as a local Figma effect style after variable import QA',
    };
  });

  const legacyAtlasPaths = collections
    .find(({ name }) => name === 'Atlas')
    .variables
    .map(({ tokenPath }) => tokenPath)
    .filter((path) => /(?:^|\.)(notch|chamfer)(?:\.|$)/iu.test(path));
  for (const path of legacyAtlasPaths) {
    makeBlocked(blockedAmbiguities, 'LEGACY_APERTURE_SEMANTIC', path, 'Continuous Lens import forbids notch/chamfer semantics');
  }

  const plan = {
    schemaVersion: 1,
    planVersion: '1.2.0',
    planId: 'bizarre-atlas-v1-canonical-variable-import',
    title: 'Bizarre Industries Figma Canonical Variable Import Plan',
    authority: {
      classification: 'governed-local-import-plan',
      sourceOfTruth: 'tokens/source/manifest.json and its nine declared token documents',
      doesNotAuthorize: ['figma-mutation', 'variable-retirement', 'legacy-deletion', 'library-publication'],
    },
    figma: {
      fileKey: 'hGgrP9G0tEam8mpk5u3rHg',
      mutationStatus: 'NOT_APPLIED',
      mutationAuthorized: false,
      mutationPerformed: false,
      applicationOrder: 'collections, variables, aliases, supported scope assignments, code syntax, then per-family binding QA; omit BOOLEAN scope assignment',
    },
    sourceManifest: {
      filePath: 'tokens/source/manifest.json',
      fileSha256: sha256(manifestText),
      orderedFiles: manifest,
    },
    figmaFontFamilyMapping: {
      filePath: FIGMA_FONT_FAMILY_MAPPING_PATH,
      fileSha256: sha256(fontFamilyMappingText),
      canonicalSha256: fontFamilyMapping.canonicalSha256,
      mappingVersion: fontFamilyMapping.mappingVersion,
      mappingMutationStatus: fontFamilyMapping.figma.mutationStatus,
      webTokenMutationStatus: fontFamilyMapping.webTokenContract.mutationStatus,
      webTokenSourceFilePath: fontFamilyMapping.webTokenContract.sourceFilePath,
      webTokenSourceFileSha256: fontFamilyMapping.webTokenContract.sourceFileSha256,
      mappings: fontFamilyMapping.mappings.map(({
        tokenPath,
        sourcePrimaryFamily,
        figmaFamily,
        mappingKind,
        styleSelection,
        evidenceRefs,
      }) => ({
        tokenPath,
        sourcePrimaryFamily,
        figmaFamily,
        mappingKind,
        styleSelection,
        evidenceRefs,
      })),
    },
    mappingContract: {
      variableName: 'Replace token-path dots with slashes without changing spelling or case',
      webCodeSyntax: 'var(--bzr-<token-path-with-dots-replaced-by-hyphens>)',
      remBasePx: 16,
      modeStrategy: 'Modes contains 27 variables with five values each; never flatten to 135 variables',
      aliasStrategy: 'Preserve resolvable cross-collection aliases and retain an honest resolved Figma value for audit',
      descriptionStrategy: 'Use canonical token $description verbatim when present; otherwise identify the governed source token and preserve publication authority',
      primitiveScopes: 'Palette and Brand use [] so semantic consumers remain the preferred pickers',
      booleanScopeStrategy: 'Retain the intended conceptual scope separately, omit scope assignment because Figma rejects it for BOOLEAN, and record the live API report of ALL_SCOPES',
      materialScopes: ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'],
      fontFamilyStrategy: 'Keep canonical WEB stacks unchanged; resolve each Figma FONT_FAMILY value through the governed live-registry mapping artifact and select condensed/display distinctions in text styles when Figma registers them as styles or separate families.',
      legacyApertureSemantics: 'notch and chamfer are forbidden; use the current governed Continuous Lens tokens only',
    },
    variableCount: collections.reduce((sum, collection) => sum + collection.variables.length, 0),
    collections,
    effectStyleHandoff,
    blockedAmbiguities,
    readyForFigmaMutation: blockedAmbiguities.length === 0,
  };
  plan.canonicalSha256 = sha256(canonicalCompact(plan));
  return plan;
}

export async function expectedFigmaVariableImportPlanText(rootUrl = new URL('../../', import.meta.url)) {
  return canonicalJson(await buildFigmaVariableImportPlan(rootUrl));
}
