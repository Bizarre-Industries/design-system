import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import {
  buildContinuousLensR20Geometry,
  CONTINUOUS_LENS_R20_REVISION,
  CONTINUOUS_LENS_R20_SUBJECT_IDS,
  continuousLensR20ConceptForSubject,
  createContinuousLensR20Figma,
} from '../scripts/lib/continuous-lens-r20.mjs';

const execute = promisify(execFile);
const root = new URL('../', import.meta.url);
const asyncFunction = Object.getPrototypeOf(async function noop() {}).constructor;
const builderPath = new URL('../scripts/build-figma-subject-population-code.mjs', import.meta.url);
const patchBuilderPath = new URL('../scripts/build-figma-continuous-lens-r20-patch-code.mjs', import.meta.url);
const expected = {
  '07.05': { mode: 'shaded-contour', orbitCount: 60, proofSourceIds: ['atlasContoursLarge'] },
  '07.08': { mode: 'grain', orbitCount: 76, proofSourceIds: ['atlasContoursLarge', 'atlasSpectralLarge'] },
  '07.09': { mode: 'material', orbitCount: 60, proofSourceIds: ['atlasContoursLarge'] },
  '07.10': { mode: 'one-color', orbitCount: 68, proofSourceIds: ['atlasHatchLarge', 'atlasDotsLarge'] },
};

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `missing function ${name}`);
  const opening = source.indexOf('{', start);
  let depth = 0;
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index];
    if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      for (index += 1; index < source.length; index += 1) {
        if (source[index] === '\\') index += 1;
        else if (source[index] === quote) break;
      }
    } else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unbalanced function ${name}`);
}

function parseGeneratedPayload(code) {
  const marker = ';function buildContinuousLensR20Geometry';
  const end = code.indexOf(marker);
  assert.ok(code.startsWith('const P=') && end > 8, 'generated code must start with its payload and embedded r20 geometry');
  return JSON.parse(code.slice('const P='.length, end));
}

async function buildSubjectCode(subjectId) {
  const { stdout } = await execute(process.execPath, [
    builderPath.pathname,
    subjectId,
    '--plan', 'governance/design-ledgers/figma/bizarre-104-page-population-plan-v1.json',
    '--spec', 'production/affinity/bizarre-masterbrand-content-spec-v1.json',
    '--allow-frozen-v1',
  ], { cwd: new URL('../', import.meta.url), maxBuffer: 2_000_000 });
  return stdout;
}

async function buildPatchCode(subjectId, pageId) {
  const { stdout } = await execute(process.execPath, [
    patchBuilderPath.pathname,
    subjectId,
    '--page-id', pageId,
    '--master-id', '900:1',
    '--viewport-id', '900:2',
  ], { maxBuffer: 2_000_000 });
  return stdout;
}

function createFakeFigma() {
  let nextId = 1;
  class FakeNode {
    constructor(type) {
      this.type = type;
      this.id = `fake:${nextId++}`;
      this.name = '';
      this.width = 0;
      this.height = 0;
      this.x = 0;
      this.y = 0;
      this.children = [];
      this.fills = [];
      this.strokes = [];
      this.pluginData = new Map();
    }
    resize(width, height) {
      this.width = width;
      this.height = height;
    }
    appendChild(node) {
      node.parent = this;
      this.children.push(node);
    }
    setSharedPluginData(namespace, key, value) {
      this.pluginData.set(`${namespace}/${key}`, value);
    }
    getSharedPluginData(namespace, key) {
      return this.pluginData.get(`${namespace}/${key}`) || '';
    }
  }
  return {
    FakeNode,
    figma: {
      createRectangle: () => new FakeNode('RECTANGLE'),
      createEllipse: () => new FakeNode('ELLIPSE'),
      createVector: () => new FakeNode('VECTOR'),
    },
  };
}

test('repo and Affinity use exactly the same validated r20 Continuous Lens geometry', async () => {
  const affinityBuilder = await readFile(new URL('../production/affinity/build-bizarre-masterbrand-library-v1-staged.js', import.meta.url), 'utf8');
  const affinityGeometry = runInNewContext(`(${extractNamedFunction(affinityBuilder, 'buildContinuousLensConceptGeometry')})`);
  const gradients = JSON.parse(await readFile(new URL('../production/affinity/manifests/bizarre-gradient-recipes-v1.json', import.meta.url), 'utf8'));
  const materialRecipe = gradients.recipes.find((recipe) => recipe.subjectId === '04.02');

  assert.deepEqual(CONTINUOUS_LENS_R20_SUBJECT_IDS, Object.keys(expected));
  for (const [subjectId, contract] of Object.entries(expected)) {
    const concept = continuousLensR20ConceptForSubject(subjectId, {
      conceptReference: { id: `concept.atlas.${subjectId}`, sourcePath: `${subjectId}.png`, sha256: 'a'.repeat(64) },
      materialRecipe,
    });
    assert.equal(concept.revision, CONTINUOUS_LENS_R20_REVISION);
    assert.equal(concept.mode, contract.mode);
    assert.equal(concept.orbitCount, contract.orbitCount);
    assert.deepEqual(concept.proofSourceIds, contract.proofSourceIds);
    assert.deepEqual(concept.viewport, { width: 600, height: 238 });

    const box = { x: 0, y: 0, width: 600, height: 238 };
    const repoGeometry = buildContinuousLensR20Geometry(box, concept.orbitCount, concept.mode);
    const affinity = affinityGeometry(box, concept.orbitCount, concept.mode);
    assert.deepEqual(repoGeometry.aperture, JSON.parse(JSON.stringify(affinity.aperture)), `${subjectId} aperture drift`);
    assert.deepEqual(repoGeometry.orbits, JSON.parse(JSON.stringify(affinity.orbits)), `${subjectId} orbit drift`);
    assert.equal(repoGeometry.orbits.length, contract.orbitCount);
    assert.ok(repoGeometry.orbits.at(-1).cx < repoGeometry.aperture.cx);
    assert.ok(repoGeometry.orbits.at(-1).rx > repoGeometry.aperture.rx * 4);

    const family = [repoGeometry.aperture, ...repoGeometry.orbits];
    for (let index = 0; index < family.length - 1; index += 1) {
      const inner = family[index];
      const outer = family[index + 1];
      const cosine = Math.cos(inner.rotation);
      const sine = Math.sin(inner.rotation);
      for (let sample = 0; sample < 720; sample += 1) {
        const angle = sample * Math.PI / 360;
        const x = inner.cx + inner.rx * Math.cos(angle) * cosine - inner.ry * Math.sin(angle) * sine;
        const y = inner.cy + inner.rx * Math.cos(angle) * sine + inner.ry * Math.sin(angle) * cosine;
        const dx = x - outer.cx;
        const dy = y - outer.cy;
        const localX = dx * cosine + dy * sine;
        const localY = -dx * sine + dy * cosine;
        const equation = (localX * localX) / (outer.rx * outer.rx) + (localY * localY) / (outer.ry * outer.ry);
        assert.ok(equation < 0.999999, `${subjectId} orbit ${index} crosses at sample ${sample}`);
      }
    }
  }
});

test('Figma subject production code builds native r20 concepts and preserves references and proof cards', async () => {
  const rendererSource = createContinuousLensR20Figma.toString();
  assert.equal((rendererSource.match(/figma\.createVector\(\)/g) || []).length, 1, 'one trajectory vector only');
  assert.match(rendererSource, /figma\.createEllipse\(\)/);
  assert.match(rendererSource, /trajectory\.vectorPaths/);
  assert.match(rendererSource, /grainMode \? \[0\.08, 2\.15\]/);
  assert.match(rendererSource, /External-only material rim \/ Opening geometry unchanged/);
  assert.match(rendererSource, /concept\.mode === 'one-color'/);
  assert.match(rendererSource, /crossing_status: 'validated-none'/);

  for (const [subjectId, contract] of Object.entries(expected)) {
    const code = await buildSubjectCode(subjectId);
    assert.ok(Buffer.byteLength(code) < 50_000, `${subjectId} must fit the official use_figma code limit`);
    assert.doesNotThrow(() => new asyncFunction('figma', code), `${subjectId} generated code must compile`);
    const payload = parseGeneratedPayload(code);
    assert.equal(payload.rendererId, '07-concept');
    assert.equal(payload.populationRevision, `figma-native-104-v1.0.0-${CONTINUOUS_LENS_R20_REVISION}`);
    assert.deepEqual(payload.continuousLensConcept.viewport, { width: 600, height: 238 });
    assert.equal(payload.continuousLensConcept.mode, contract.mode);
    assert.equal(payload.continuousLensConcept.orbitCount, contract.orbitCount);
    assert.deepEqual(payload.continuousLensConcept.proofSourceIds, contract.proofSourceIds);
    assert.match(code, /concept-reference-target/);
    assert.match(code, /source-proof-only/);
    assert.match(code, /NATIVE EDITABLE R20 RECONSTRUCTION \/ SAME 600×238 VIEWPORT/);
    assert.match(code, /createContinuousLensR20Figma/);
    assert.match(code, /await sourcePage\.loadAsync\(\)/);
    assert.doesNotMatch(code, /const mainSource=/);
    assert.doesNotMatch(code, /placeExactSource\(mainSource/);
    assert.doesNotMatch(code, /convertToOneInk/);
  }
});

test('native Figma renderer creates the exact editable node anatomy for every r20 mode', async () => {
  const gradients = JSON.parse(await readFile(new URL('../production/affinity/manifests/bizarre-gradient-recipes-v1.json', import.meta.url), 'utf8'));
  const materialRecipe = gradients.recipes.find((recipe) => recipe.subjectId === '04.02');
  for (const [subjectId, contract] of Object.entries(expected)) {
    const concept = continuousLensR20ConceptForSubject(subjectId, {
      conceptReference: { id: `concept.atlas.${subjectId}`, sourcePath: `${subjectId}.png`, sha256: 'b'.repeat(64) },
      materialRecipe,
    });
    const { FakeNode, figma } = createFakeFigma();
    const parent = new FakeNode('FRAME');
    parent.resize(600, 238);
    parent.clipsContent = true;
    const tag = (node, values) => {
      for (const [key, value] of Object.entries(values)) node.setSharedPluginData('bizarre.masterbrand', key, String(value ?? ''));
    };
    const solid = (fallback, opacity = 1) => ({ type: 'SOLID', fallback, opacity });
    const boundSolid = (ref, fallback, opacity = 1) => ({ type: 'BOUND_SOLID', ref, fallback, opacity });
    const gradient = (stops, _consumer, angle) => ({ type: 'GRADIENT_LINEAR', stops, angle });
    const receipt = createContinuousLensR20Figma({
      figma,
      parent,
      subjectId,
      concept,
      buildGeometry: buildContinuousLensR20Geometry,
      solid,
      boundSolid,
      gradient,
      tag,
    });

    const byEntity = (entity) => parent.children.filter((node) => node.getSharedPluginData('bizarre.masterbrand', 'entity') === entity);
    assert.equal(receipt.createdNodeIds.length, parent.children.length);
    assert.equal(byEntity('continuous-lens-orbit').length, contract.orbitCount);
    assert.equal(byEntity('continuous-lens-trajectory').length, 1);
    assert.equal(byEntity('continuous-lens-trajectory-datum').length, 1);
    assert.equal(byEntity('continuous-lens-aperture').length, 1);
    assert.equal(byEntity('continuous-lens-material-rim').length, contract.mode === 'material' ? 1 : 0);
    assert.equal(parent.children.filter((node) => node.type === 'VECTOR').length, 1);
    assert.match(byEntity('continuous-lens-trajectory')[0].vectorPaths[0].data, /^M .* C /);
    assert.equal(parent.getSharedPluginData('bizarre.masterbrand', 'crossing_status'), 'validated-none');
    for (const orbit of byEntity('continuous-lens-orbit')) {
      assert.equal(orbit.type, 'ELLIPSE');
      assert.equal(orbit.relativeTransform.flat().every(Number.isFinite), true);
      if (contract.mode === 'grain') assert.deepEqual(orbit.dashPattern, [0.08, 2.15]);
    }
    if (contract.mode === 'one-color') {
      assert.equal(byEntity('continuous-lens-ground')[0].fills[0].fallback, '#F9F8F2');
      assert.equal(byEntity('continuous-lens-trajectory')[0].strokes[0].fallback, '#0E0E0E');
    }
  }
});

test('standalone patch generator emits one safe in-place official use_figma patch', async () => {
  const plan = JSON.parse(await readFile(new URL('../governance/design-ledgers/figma/bizarre-104-page-population-plan-v1.json', import.meta.url), 'utf8'));
  const pageBySubject = new Map(plan.subjects.map((subject) => [subject.subjectId, subject.liveFigmaPage.pageNodeId]));

  for (const subjectId of CONTINUOUS_LENS_R20_SUBJECT_IDS) {
    const code = await buildPatchCode(subjectId, pageBySubject.get(subjectId));
    assert.ok(Buffer.byteLength(code) < 50_000, `${subjectId} patch must fit the official use_figma code limit`);
    assert.doesNotThrow(() => new asyncFunction('figma', code), `${subjectId} patch must compile`);
    assert.equal((code.match(/await figma\.setCurrentPageAsync\(page\)/g) || []).length, 1);
    assert.equal((code.match(/figma\.createVector\(\)/g) || []).length, 1);
    assert.match(code, /getStyledTextSegments\(\['fontName'\]\)/);
    assert.match(code, /await Promise\.all\(uniqueFonts\.map/);
    assert.match(code, /for\(const child of\[\.\.\.viewport\.children\]\)child\.remove\(\)/);
    assert.match(code, /createdNodeIds:receipt\.createdNodeIds/);
    assert.match(code, /mutatedNodeIds:\[page\.id,master\.id,viewport\.id,nativeLabel\.id\]/);
    assert.match(code, /preservedReferenceTargetId:referenceTarget\.id/);
    assert.match(code, /preservedSourceProofIds:sourceProofs\.map/);
    assert.match(code, /concept_revision/);
    assert.match(code, /source_sha256/);
    assert.doesNotMatch(code, /figma\.notify/);
    assert.doesNotMatch(code, /\.setPluginData\(/);
    assert.doesNotMatch(code, /createNodeFromSvg/);
    assert.doesNotMatch(code, /\(async\s*\(\)\s*=>/);
  }

  const { stdout: help } = await execute(process.execPath, [patchBuilderPath.pathname, '--help']);
  assert.match(help, /official use_figma JavaScript patch/);
  assert.match(help, /bizarre-figma-continuous-lens-r20-target-map-v1/);
  assert.match(help, /does not call Figma/);

  const directory = await mkdtemp(path.join(tmpdir(), 'bizarre-figma-r20-map-'));
  try {
    const targetMapPath = path.join(directory, 'targets.json');
    await writeFile(targetMapPath, JSON.stringify({
      mapId: 'bizarre-figma-continuous-lens-r20-target-map-v1',
      fileKey: plan.scope.figmaFileKey,
      subjects: {
        '07.05': {
          pageId: pageBySubject.get('07.05'),
          masterId: '901:1',
          viewportId: '901:2',
        },
      },
    }));
    const { stdout: mappedCode } = await execute(process.execPath, [patchBuilderPath.pathname, '07.05', '--target-map', targetMapPath]);
    assert.match(mappedCode, /"masterId":"901:1"/);
    assert.match(mappedCode, /"viewportId":"901:2"/);
    assert.doesNotThrow(() => new asyncFunction('figma', mappedCode));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
