import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  APPROVED_FIGMA_COLLECTIONS,
  FIGMA_FONT_FAMILY_MAPPING_PATH,
  FIGMA_FONT_FAMILY_TARGETS,
  FIGMA_IMPORT_PLAN_PATH,
  buildFigmaVariableImportPlan,
  expectedFigmaVariableImportPlanText,
  validateFigmaFontFamilyMapping,
  validateFigmaVariableImportPlan,
} from '../scripts/lib/figma-variable-import-plan.mjs';

const execFileAsync = promisify(execFile);
const root = new URL('../', import.meta.url);
const readPlanText = () => readFile(new URL(`../${FIGMA_IMPORT_PLAN_PATH}`, import.meta.url), 'utf8');
const readPlan = async () => JSON.parse(await readPlanText());
const byCollection = (plan) => new Map(plan.collections.map((collection) => [collection.name, collection]));
const byName = (collection) => new Map(collection.variables.map((variable) => [variable.name, variable]));

test('canonical Figma variable import artifact validates without mutating Figma', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['scripts/validate-figma-variable-import-plan.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.match(stdout, /Validated 9 collections, 173 variables, 5 Modes values, 7 governed live-registry font-family mappings, and 4 shadow effect-style handoffs without mutating Figma/);
});

test('artifact is a deterministic canonical projection of the nine approved token sources', async () => {
  const actualText = await readPlanText();
  assert.equal(actualText, await expectedFigmaVariableImportPlanText(root));
  assert.deepEqual(validateFigmaVariableImportPlan(JSON.parse(actualText)), []);

  const first = await buildFigmaVariableImportPlan(root);
  const second = await buildFigmaVariableImportPlan(root);
  assert.deepEqual(first, second);
  assert.equal(first.canonicalSha256, second.canonicalSha256);
  assert.equal(first.planVersion, '1.2.0');
  assert.deepEqual(first.blockedAmbiguities, []);
  assert.equal(first.readyForFigmaMutation, true);
  assert.equal(first.figma.mutationAuthorized, false);
  assert.equal(first.figma.mutationPerformed, false);
  assert.equal(first.figma.mutationStatus, 'NOT_APPLIED');
});

test('governed Figma-only font-family mapping is bound to live registry evidence and unchanged web stacks', async () => {
  const [mappingText, typographyText, plan] = await Promise.all([
    readFile(new URL(`../${FIGMA_FONT_FAMILY_MAPPING_PATH}`, import.meta.url), 'utf8'),
    readFile(new URL('../tokens/source/typography.tokens.json', import.meta.url), 'utf8'),
    readPlan(),
  ]);
  const mapping = JSON.parse(mappingText);
  const typography = JSON.parse(typographyText);
  const typographySha256 = createHash('sha256').update(typographyText).digest('hex');

  assert.deepEqual(validateFigmaFontFamilyMapping(mapping, {
    expectedWebTokenSourceFileSha256: typographySha256,
  }), []);
  assert.equal(mapping.webTokenContract.mutationStatus, 'UNCHANGED');
  assert.equal(mapping.webTokenContract.sourceFileSha256, typographySha256);
  assert.deepEqual(mapping.figma.observedRegisteredFamilies, [
    'Unbounded',
    'Hanken Grotesk',
    'JetBrains Mono',
    'Noto Sans Arabic',
    'Big Shoulders Stencil Display',
    'Big Shoulders Stencil Text',
  ]);
  assert.deepEqual(mapping.figma.observedUnregisteredExactFamilies, [
    'Big Shoulders Stencil',
    'Noto Sans Arabic UI',
    'Noto Sans Arabic Condensed',
  ]);
  assert.deepEqual(mapping.workingTextStylePairs, [
    { role: 'Industrial H3', family: 'Big Shoulders Stencil Display', style: 'ExtraBold', evidenceRef: 'working-local-text-styles' },
    { role: 'Industrial H4', family: 'Big Shoulders Stencil Display', style: 'Bold', evidenceRef: 'working-local-text-styles' },
    { role: 'Arabic Industrial', family: 'Noto Sans Arabic', style: 'Condensed ExtraBold', evidenceRef: 'working-local-text-styles' },
  ]);

  const sourceStacks = new Map(Object.entries(typography.font.family)
    .filter(([key]) => !key.startsWith('$'))
    .map(([key, token]) => [`font.family.${key}`, token.$value]));
  assert.deepEqual(
    mapping.mappings.map(({ tokenPath, sourceStack }) => [tokenPath, sourceStack]),
    FIGMA_FONT_FAMILY_TARGETS.map(({ tokenPath }) => [tokenPath, sourceStacks.get(tokenPath)]),
  );
  assert.equal(plan.figmaFontFamilyMapping.filePath, FIGMA_FONT_FAMILY_MAPPING_PATH);
  assert.equal(plan.figmaFontFamilyMapping.fileSha256, createHash('sha256').update(mappingText).digest('hex'));
  assert.equal(plan.figmaFontFamilyMapping.canonicalSha256, mapping.canonicalSha256);
  assert.equal(plan.figmaFontFamilyMapping.webTokenMutationStatus, 'UNCHANGED');
});

test('validator rejects drift in order, scopes, source token hashes, and alias targets', async () => {
  const plan = await readPlan();

  const reordered = structuredClone(plan);
  [reordered.collections[0], reordered.collections[1]] = [reordered.collections[1], reordered.collections[0]];
  assert.ok(validateFigmaVariableImportPlan(reordered).includes('collection order drift'));

  const scopeDrift = structuredClone(plan);
  byName(byCollection(scopeDrift).get('Palette')).get('color/accent/signal').scopes = ['TEXT_FILL'];
  assert.ok(validateFigmaVariableImportPlan(scopeDrift).includes('Palette/color/accent/signal scope mapping drift'));

  const booleanScopeDrift = structuredClone(plan);
  byName(byCollection(booleanScopeDrift).get('Atlas')).get('aperture/tangent-continuity').scopeApplication.operation = 'ASSIGN_SCOPES';
  assert.ok(validateFigmaVariableImportPlan(booleanScopeDrift).includes('Atlas/aperture/tangent-continuity BOOLEAN scope application contract drift'));

  const hashDrift = structuredClone(plan);
  byName(byCollection(hashDrift).get('Typography')).get('font/size/base').modeValues[0].source.tokenSha256 = '0'.repeat(64);
  assert.ok(validateFigmaVariableImportPlan(hashDrift).includes('Typography/font/size/base/Value source token hash drift'));

  const aliasDrift = structuredClone(plan);
  byName(byCollection(aliasDrift).get('Brand')).get('brand/accent/signal').modeValues[0].aliasTarget.variableName = 'color/accent/wrong';
  assert.ok(validateFigmaVariableImportPlan(aliasDrift).includes('Brand/brand/accent/signal/Value alias target name drift'));

  const descriptionDrift = structuredClone(plan);
  byName(byCollection(descriptionDrift).get('Brand')).get('brand/accent/signal').modeValues[0].source.canonicalDescriptionSha256 = '0'.repeat(64);
  assert.ok(validateFigmaVariableImportPlan(descriptionDrift).includes('Brand/brand/accent/signal/Value source description hash drift'));

  const mappedFamilyDrift = structuredClone(plan);
  byName(byCollection(mappedFamilyDrift).get('Typography')).get('font/family/stencil').modeValues[0].figmaValue = 'Big Shoulders Stencil';
  assert.ok(validateFigmaVariableImportPlan(mappedFamilyDrift).includes('Typography/font/family/stencil/Value Figma font-family value drift'));

  const mappingInventoryDrift = structuredClone(plan);
  mappingInventoryDrift.figmaFontFamilyMapping.mappings.find(({ tokenPath }) => tokenPath === 'font.family.arabic-ui').figmaFamily = 'Noto Sans Arabic UI';
  assert.ok(validateFigmaVariableImportPlan(mappingInventoryDrift).includes('Figma font-family mapping inventory drift'));
});

test('collection counts, names, modes, scopes, and WEB syntax are exact', async () => {
  const plan = await readPlan();
  assert.equal(plan.variableCount, 173);
  assert.deepEqual(
    plan.collections.map(({ name, variableCount, modes }) => [name, variableCount, modes]),
    APPROVED_FIGMA_COLLECTIONS.map(({ name, expectedCount, modes }) => [name, expectedCount, modes]),
  );

  for (const collection of plan.collections) {
    assert.equal(new Set(collection.variables.map(({ name }) => name)).size, collection.variables.length);
    for (const variable of collection.variables) {
      assert.equal(variable.name, variable.tokenPath.replaceAll('.', '/'));
      assert.equal(variable.codeSyntax.WEB, `var(--bzr-${variable.tokenPath.replaceAll('.', '-')})`);
      assert.deepEqual(variable.modeValues.map(({ mode }) => mode), collection.modes);
      assert.equal(variable.sourceFilePath, collection.sourceFilePath);
      assert.equal(variable.sourceFileSha256, collection.sourceFileSha256);
    }
  }
});

test('source file and token hashes bind every imported value to its exact source', async () => {
  const plan = await readPlan();
  for (const collection of plan.collections) {
    const sourceText = await readFile(new URL(`../${collection.sourceFilePath}`, import.meta.url), 'utf8');
    assert.equal(createHash('sha256').update(sourceText).digest('hex'), collection.sourceFileSha256);
    for (const variable of collection.variables) {
      for (const modeValue of variable.modeValues) {
        assert.match(modeValue.source.tokenSha256, /^[a-f0-9]{64}$/);
        assert.equal(modeValue.source.filePath, collection.sourceFilePath);
        assert.ok(modeValue.source.tokenPath.length > 0);
      }
    }
  }
});

test('every variable has a Figma-ready description without losing canonical source descriptions', async () => {
  const plan = await readPlan();
  const collections = byCollection(plan);
  for (const collection of plan.collections) {
    for (const variable of collection.variables) {
      assert.ok(variable.description.trim().length > 0);
      assert.ok(['canonical-token-$description', 'governed-fallback'].includes(variable.descriptionOrigin));
      for (const modeValue of variable.modeValues) {
        const source = modeValue.source;
        if (source.canonicalDescription === null) {
          assert.equal(source.canonicalDescriptionSha256, null);
        } else {
          assert.equal(createHash('sha256').update(source.canonicalDescription).digest('hex'), source.canonicalDescriptionSha256);
        }
        for (const inherited of source.inheritedGroupDescriptions) {
          assert.equal(createHash('sha256').update(inherited.verbatim).digest('hex'), inherited.sha256);
        }
      }
    }
  }

  const brandSignal = byName(collections.get('Brand')).get('brand/accent/signal');
  assert.equal(brandSignal.description, 'The sole Bizarre Industries brand accent.');
  assert.equal(brandSignal.descriptionOrigin, 'canonical-token-$description');
  assert.equal(brandSignal.modeValues[0].source.canonicalDescription, brandSignal.description);

  const arabic = byName(collections.get('Typography')).get('font/family/arabic');
  assert.equal(arabic.description, 'Interim Arabic stack; public use remains gated by the bilingual policy.');

  const trackingWide = byName(collections.get('Typography')).get('font/tracking/wide');
  assert.equal(trackingWide.descriptionOrigin, 'governed-fallback');
  assert.match(trackingWide.description, /tokens\/source\/typography\.tokens\.json#font\.tracking\.wide/);
  assert.deepEqual(trackingWide.modeValues[0].source.inheritedGroupDescriptions, [{
    groupPath: 'font.tracking',
    verbatim: 'Unitless em ratios; CSS consumers multiply by 1em at use time.',
    sha256: createHash('sha256').update('Unitless em ratios; CSS consumers multiply by 1em at use time.').digest('hex'),
  }]);

  const atlasOrientation = byName(collections.get('Atlas')).get('atlas/orientation/a');
  assert.equal(atlasOrientation.descriptionOrigin, 'governed-fallback');
  assert.equal(atlasOrientation.modeValues[0].source.inheritedGroupDescriptions[0].groupPath, 'atlas.orientation');

  const paletteSignal = byName(collections.get('Palette')).get('color/accent/signal');
  assert.match(paletteSignal.description, /Status: governed token source; publication authority unchanged\./);
});

test('scopes follow the locked primitive, typography, geometry, material, Atlas, and semantic-role contracts', async () => {
  const collections = byCollection(await readPlan());
  assert.deepEqual(byName(collections.get('Palette')).get('color/accent/signal').scopes, []);
  assert.deepEqual(byName(collections.get('Brand')).get('brand/accent/signal').scopes, []);

  const typography = byName(collections.get('Typography'));
  assert.deepEqual(typography.get('font/family/display').scopes, ['FONT_FAMILY']);
  assert.deepEqual(typography.get('font/weight/bold').scopes, ['FONT_WEIGHT']);
  assert.deepEqual(typography.get('font/size/base').scopes, ['FONT_SIZE']);
  assert.deepEqual(typography.get('font/lineHeight/body').scopes, []);
  assert.deepEqual(typography.get('font/tracking/wide').scopes, []);

  const geometry = byName(collections.get('Geometry'));
  assert.deepEqual(geometry.get('space/4').scopes, ['GAP']);
  assert.deepEqual(geometry.get('radius/md').scopes, ['CORNER_RADIUS']);
  assert.deepEqual(geometry.get('border/1').scopes, ['STROKE_FLOAT']);
  assert.deepEqual(geometry.get('layer/modal').scopes, []);

  assert.deepEqual(byName(collections.get('Atlas')).get('atlas/line/major').scopes, ['STROKE_FLOAT']);
  const tangentContinuity = byName(collections.get('Atlas')).get('aperture/tangent-continuity');
  assert.deepEqual(tangentContinuity.conceptualScopes, []);
  assert.deepEqual(tangentContinuity.scopes, ['ALL_SCOPES']);
  assert.deepEqual(tangentContinuity.scopeApplication, {
    status: 'UNSUPPORTED_NOT_APPLICABLE',
    operation: 'OMIT_SCOPE_ASSIGNMENT',
    applyScopes: false,
    liveApiReportedScopes: ['ALL_SCOPES'],
    observedAssignmentError: 'Invalid scope for this variable type',
  });
  assert.deepEqual(byName(collections.get('Material')).get('material/aluminum').scopes, ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']);
  assert.deepEqual(byName(collections.get('Motion')).get('motion/duration/fast').scopes, []);
  assert.deepEqual(byName(collections.get('Capture')).get('capture/phase/lock/end').scopes, []);

  const modes = byName(collections.get('Modes'));
  assert.deepEqual(modes.get('surface/canvas').scopes, ['FRAME_FILL', 'SHAPE_FILL']);
  assert.deepEqual(modes.get('content/primary').scopes, ['SHAPE_FILL', 'TEXT_FILL']);
  assert.deepEqual(modes.get('border/default').scopes, ['STROKE_COLOR']);
  assert.deepEqual(modes.get('focus/ring').scopes, ['STROKE_COLOR']);
  assert.deepEqual(modes.get('action/default/surface').scopes, ['FRAME_FILL', 'SHAPE_FILL']);
  assert.deepEqual(modes.get('status/success/content').scopes, ['SHAPE_FILL', 'TEXT_FILL']);
});

test('aliases remain aliases and also carry honest resolved audit values', async () => {
  const plan = await readPlan();
  const collections = byCollection(plan);

  const brandSignal = byName(collections.get('Brand')).get('brand/accent/signal').modeValues[0];
  assert.equal(brandSignal.valueKind, 'alias');
  assert.deepEqual(brandSignal.aliasTarget, {
    collection: 'Palette',
    variableName: 'color/accent/signal',
    sourceTokenPath: 'color.accent.signal',
    resolvedType: 'COLOR',
  });
  assert.deepEqual(brandSignal.resolvedFigmaValue, {
    r: 0.7764705882,
    g: 1,
    b: 0.1411764706,
    a: 1,
  });

  const canvas = byName(collections.get('Modes')).get('surface/canvas');
  assert.deepEqual(canvas.modeValues.map(({ mode }) => mode), ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']);
  assert.ok(canvas.modeValues.every(({ valueKind, aliasTarget, resolvedFigmaValue }) =>
    valueKind === 'alias'
    && aliasTarget.collection === 'Palette'
    && resolvedFigmaValue !== null));

  const fastMin = byName(collections.get('Capture')).get('capture/duration/fast-min').modeValues[0];
  assert.equal(fastMin.valueKind, 'alias');
  assert.equal(fastMin.aliasTarget.collection, 'Motion');
  assert.equal(fastMin.aliasTarget.variableName, 'motion/duration/mid');
  assert.equal(fastMin.resolvedFigmaValue, 300);
});

test('Figma-only conversions remain explicit and source values remain intact', async () => {
  const plan = await readPlan();
  const collections = byCollection(plan);

  const fontBase = byName(collections.get('Typography')).get('font/size/base').modeValues[0];
  assert.deepEqual(fontBase.source.value, { value: 1, unit: 'rem' });
  assert.equal(fontBase.figmaValue, 16);
  assert.equal(fontBase.conversion, 'rem to px at the established 16px Figma root');

  const display = byName(collections.get('Typography')).get('font/family/display').modeValues[0];
  assert.deepEqual(display.source.value, ['Unbounded', 'Arial Black', 'system-ui', 'sans-serif']);
  assert.equal(display.figmaValue, 'Unbounded');
  assert.equal(display.conversion, 'Governed Figma-only identity-registered-family; the canonical WEB token retains the full fallback stack unchanged');

  const exactFamilyValues = new Map([
    ['font/family/arabic', 'Noto Sans Arabic'],
    ['font/family/arabic-industrial', 'Noto Sans Arabic'],
    ['font/family/arabic-ui', 'Noto Sans Arabic'],
    ['font/family/body', 'Hanken Grotesk'],
    ['font/family/display', 'Unbounded'],
    ['font/family/mono', 'JetBrains Mono'],
    ['font/family/stencil', 'Big Shoulders Stencil Display'],
  ]);
  const typography = byName(collections.get('Typography'));
  for (const [name, figmaValue] of exactFamilyValues) {
    const modeValue = typography.get(name).modeValues[0];
    assert.equal(modeValue.figmaValue, figmaValue);
    assert.equal(modeValue.figmaFontFamilyMapping.figmaFamily, figmaValue);
    assert.equal(modeValue.figmaFontFamilyMapping.artifactPath, FIGMA_FONT_FAMILY_MAPPING_PATH);
  }
  assert.equal(typography.get('font/family/stencil').modeValues[0].source.value[0], 'Big Shoulders Stencil');
  assert.equal(typography.get('font/family/arabic-ui').modeValues[0].source.value[0], 'Noto Sans Arabic UI');
  assert.equal(typography.get('font/family/arabic-industrial').modeValues[0].source.value[0], 'Noto Sans Arabic Condensed');

  const easing = byName(collections.get('Motion')).get('motion/easing/out').modeValues[0];
  assert.deepEqual(easing.source.value, [0.16, 1, 0.3, 1]);
  assert.equal(easing.figmaValue, 'cubic-bezier(0.16, 1, 0.3, 1)');
});

test('four shadows remain excluded from variables and legacy aperture semantics never enter the plan', async () => {
  const plan = await readPlan();
  assert.deepEqual(
    plan.effectStyleHandoff.map(({ styleName, sourceTokenPath, variableImport }) => [styleName, sourceTokenPath, variableImport]),
    [
      ['Shadow/SM', 'shadow.sm', 'excluded'],
      ['Shadow/MD', 'shadow.md', 'excluded'],
      ['Shadow/LG', 'shadow.lg', 'excluded'],
      ['Shadow/Signal', 'shadow.signal', 'excluded'],
    ],
  );
  for (const shadow of plan.effectStyleHandoff) {
    assert.equal(shadow.sourceFilePath, 'tokens/source/motion.tokens.json');
    assert.equal(shadow.sourceTokenType, 'shadow');
    assert.match(shadow.sourceFileSha256, /^[a-f0-9]{64}$/);
    assert.match(shadow.sourceTokenSha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(plan.collections.flatMap(({ variables }) => variables).some(({ tokenPath }) => tokenPath.startsWith('shadow.')), false);

  const atlas = byCollection(plan).get('Atlas');
  assert.equal(atlas.variableCount, 15);
  assert.equal(atlas.variables.some(({ tokenPath }) => /(?:^|\.)(notch|chamfer)(?:\.|$)/iu.test(tokenPath)), false);
  const tangentContinuity = byName(atlas).get('aperture/tangent-continuity');
  assert.equal(tangentContinuity.resolvedType, 'BOOLEAN');
  assert.deepEqual(tangentContinuity.conceptualScopes, []);
  assert.deepEqual(tangentContinuity.scopes, ['ALL_SCOPES']);
  assert.equal(tangentContinuity.scopeApplication.applyScopes, false);
  assert.equal(tangentContinuity.scopeApplication.operation, 'OMIT_SCOPE_ASSIGNMENT');
  assert.deepEqual(tangentContinuity.scopeApplication.liveApiReportedScopes, ['ALL_SCOPES']);
  assert.equal(tangentContinuity.modeValues[0].figmaValue, true);
  assert.match(tangentContinuity.description, /tangent-continuous/i);
});
