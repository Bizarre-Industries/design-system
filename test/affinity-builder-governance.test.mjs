import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const builderUrl = new URL('../production/affinity/build-bizarre-masterbrand-library-v1-staged.js', import.meta.url);
const gradientManifestUrl = new URL('../governance/gradient-recipes.json', import.meta.url);
const contentSpecUrl = new URL('../production/affinity/bizarre-masterbrand-content-spec-v2.json', import.meta.url);

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

test('Affinity builder consumes the governed gradient manifest and only renders exact recipes', async () => {
  const [builder, manifest] = await Promise.all([
    readFile(builderUrl, 'utf8'),
    readFile(gradientManifestUrl, 'utf8').then(JSON.parse),
  ]);

  assert.match(builder, /bizarre-gradient-recipes-v1\.json/);
  assert.match(builder, /const exactGradientSubjectIds = \['04\.01', '04\.02'\]/);
  assert.match(builder, /const unresolvedGradientSubjectIds = \['04\.03', '04\.04', '04\.05', '04\.06', '04\.07'\]/);
  assert.match(builder, /GradientFillType\.Linear/);
  assert.match(builder, /recipe\.geometry\.angleDeg \* Math\.PI \/ 180/);
  assert.match(builder, /DERIVATION CONTRACT ONLY  \/  NO NUMERIC STOPS  \/  NO GEOMETRY  \/  NOT VERIFIED/);

  const optical = manifest.recipes.find(({ subjectId }) => subjectId === '04.02');
  assert.deepEqual(
    {
      kind: optical.geometry.kind,
      angleDeg: optical.geometry.angleDeg,
      stops: optical.stops.items.map(({ positionPercent, color }) => [positionPercent, color]),
    },
    {
      kind: 'linear',
      angleDeg: 100,
      stops: [
        [0, '#34383B'],
        [14, '#F5F7F4'],
        [29, '#67B7C2'],
        [46, '#765A9B'],
        [62, '#D7AE59'],
        [79, '#B85769'],
        [90, '#F6F2E8'],
        [100, '#4B4E50'],
      ],
    },
  );

  for (const recipe of manifest.recipes.filter(({ subjectId }) => /^04\.0[3-7]$/.test(subjectId))) {
    assert.equal(recipe.valueStatus, 'NOT VERIFIED');
    assert.equal(recipe.geometry.kind, null);
    assert.equal(recipe.geometry.angleDeg, null);
    assert.deepEqual(recipe.stops.items, []);
  }
});

test('Affinity builder binds every artboard and anatomy panel to the explicit 104-subject content spec', async () => {
  const [builder, contentSpec] = await Promise.all([
    readFile(builderUrl, 'utf8'),
    readFile(contentSpecUrl, 'utf8').then(JSON.parse),
  ]);
  assert.equal(contentSpec.subjects.length, 104);
  assert.match(builder, /bizarre-masterbrand-content-spec-v2\.json/);
  assert.match(builder, /contentBySubjectId\.get\(subject\.id\)\.sections\[section\]/);
  assert.match(builder, /bizarre\.contentFingerprint/);
  assert.match(builder, /Exact governed content/);
  assert.doesNotMatch(builder, /establishes the .* rule at an independently reproducible level/);
});

test('Affinity 01.03 renders the current single-identity native-integration contract', async () => {
  const [builder, contentSpec] = await Promise.all([
    readFile(builderUrl, 'utf8'),
    readFile(contentSpecUrl, 'utf8').then(JSON.parse),
  ]);
  const subject = contentSpec.subjects.find(({ subjectId }) => subjectId === '01.03');
  assert.equal(subject.exactLabel, '01.03 · Single Identity / Native Integration');
  assert.equal(subject.visualRecipe.recipeId, '01.03/visual/v2');
  assert.deepEqual(subject.governance.derivesFrom, [
    'identity', 'architecture', 'authority', 'uiContract', 'uiComponents', 'nativeIntegrationResearch'
  ]);
  assert.match(builder, /function addSingleIdentityNativeIntegrationPage\(item\)/);
  assert.match(builder, /if \(subject\.id === '01\.03'\) return addSingleIdentityNativeIntegrationPage\(item\)/);
  assert.match(builder, /INTEGRATE\. DO NOT REPLACE\./);
  assert.match(builder, /NATIVE INTEGRATION MATRIX/);
  assert.match(builder, /HOST CONVENTION WINS EVERY CONFLICT/);
  assert.doesNotMatch(builder, /addMasterbrandArchitectureInterlockingPage/);
  assert.doesNotMatch(builder, /BIZARRE LABS|BIZARRE FOUNDATION|HELLING|THREE RELATIONSHIP TYPES|SHARED PHYSICS|FUTURE ALLIED/iu);
});

test('Affinity builder has no rejected aperture edge layer or sharp-outline dependency', async () => {
  const [builder, contentSpec] = await Promise.all([
    readFile(builderUrl, 'utf8'),
    readFile(contentSpecUrl, 'utf8').then(JSON.parse),
  ]);
  assert.doesNotMatch(builder, /machined-chamfer/iu);
  assert.doesNotMatch(builder, /pathFilter:\s*\(attributes\)\s*=>\s*attributes\['data-layer'\]\s*!==\s*'field-line'/u);
  assert.match(builder, /Continuous Lens aperture \/ Four cubic segments \/ No corners/);
  assert.match(builder, /Exact Continuous Lens Aperture and one flat Signal trajectory/);
  assert.match(builder, /function isContinuousLensAperture/);
  assert.match(builder, /return attributes\['data-layer'\] === 'continuous-lens-aperture'/);
  assert.doesNotMatch(builder, /\['continuous-lens-aperture', 'aperture-silhouette'\]/);
  assert.match(builder, /atlas-shaded-contour-continuous-lens-v2\.png/);
  assert.match(builder, /atlas-field-grain-continuous-lens-v2\.png/);
  assert.match(builder, /atlas-material-response-continuous-lens-v2\.png/);
  assert.match(builder, /atlas-one-color-continuous-lens-v2\.png/);
  assert.match(contentSpec.subjects.find(({ subjectId }) => subjectId === '06.01').sections.Misuse.content, /sharp edge.*chamfer.*wedge.*notch.*key cut/iu);
});

test('Affinity provisional Atlas concepts use one validated non-crossing Continuous Lens field', async () => {
  const builder = await readFile(builderUrl, 'utf8');
  const geometryStart = builder.indexOf('function buildContinuousLensConceptGeometry');
  const conceptStart = builder.indexOf('function addContinuousLensConceptSpecimen');
  const conceptEnd = builder.indexOf('async function addAtlasProvenanceConsole');
  assert.ok(geometryStart >= 0 && conceptStart > geometryStart && conceptEnd > conceptStart);
  const geometry = builder.slice(geometryStart, conceptStart);
  const concept = builder.slice(conceptStart, conceptEnd);

  assert.match(geometry, /const approvedAspect = 600 \/ 238/);
  assert.match(geometry, /const aspectDrift = Math\.abs\(box\.width \/ box\.height - approvedAspect\)/);
  assert.match(geometry, /if \(aspectDrift > 0\.01\)/);
  assert.match(geometry, /outer\.rx <= inner\.rx \|\| outer\.ry <= inner\.ry/);
  assert.match(geometry, /for \(let sample = 0; sample < 360; sample \+= 1\)/);
  assert.match(geometry, /outerEquation >= 0\.999999/);
  assert.match(geometry, /leftShift: box\.width \* 0\.17/);
  assert.match(geometry, /rotation: -14 \* Math\.PI \/ 180/);
  const buildGeometry = runInNewContext(`(${extractNamedFunction(builder, 'buildContinuousLensConceptGeometry')})`);
  for (const [mode, count] of [['shaded-contour', 60], ['grain', 76], ['material', 60], ['one-color', 68]]) {
    const result = buildGeometry({ x: 0, y: 0, width: 600, height: 238 }, count, mode);
    assert.equal(result.orbits.length, count);
    assert.ok(result.orbits.at(-1).cx < result.aperture.cx, `${mode} must broaden toward the left`);
    assert.ok(result.orbits.at(-1).rx > result.aperture.rx * 4, `${mode} must preserve the broad field envelope`);
  }

  assert.equal((concept.match(/addSmoothCubicPath\(\{/g) || []).length, 1, 'concept generator must create exactly one trajectory path');
  assert.equal((concept.match(/Single trajectory datum/g) || []).length, 1, 'concept generator must create exactly one trajectory datum');
  assert.match(concept, /Native tangent-continuous non-crossing/);
  assert.match(concept, /mode === 'grain' \? 76/);
  assert.match(concept, /grainMode \? \[0\.08, 2\.15\]/);
  assert.match(concept, /External-only material rim \/ Opening geometry unchanged/);
  assert.match(concept, /paperMode \? PAPER : VOID/);
  assert.doesNotMatch(concept, /SOURCE_PATHS\.atlas(?:Spectral|Contours|Dots|Hatch)/);

  assert.match(builder, /\['07\.05', SHADED_CONTOUR_ARTIFACT_REVISION\]/);
  for (const subjectId of ['07.08', '07.09', '07.10']) {
    assert.match(builder, new RegExp(`\\['${subjectId.replace('.', '\\.')}', ATLAS_CONCEPT_FIDELITY_REVISION\\]`));
  }
  assert.match(builder, /atlas-continuous-lens-concept-fidelity-r20/);
  assert.match(builder, /NATIVE EDITABLE CONCEPT CURVES \/ SAME 600 x 238 VIEWPORT/);
});
