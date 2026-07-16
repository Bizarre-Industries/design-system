import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  APERTURE_ASPECT_RATIO,
  APERTURE_PATH,
  APERTURE_PATH_SHA256,
  APERTURE_REFERENCE_BOUNDS,
  APERTURE_ROTATION_DEGREES,
  APERTURE_VERSION,
  apertureContainment,
  apertureGeometry,
  renderAperture
} from '../packages/atlas/src/aperture.mjs';
import { ATLAS_CONFIG } from '../packages/atlas/src/config.mjs';
import { renderAtlas, renderCaptureSequence, renderInstrumentDial } from '../packages/atlas/src/render.mjs';
import { hashConfiguration } from '../packages/atlas/src/provenance.mjs';

const EXPECTED_APERTURE_PATH = 'M 367.129 428.061 C 352.432 369.115 444.778 295.334 573.389 263.267 C 702 231.201 818.174 252.992 832.871 311.939 C 847.568 370.885 755.222 444.666 626.611 476.733 C 498 508.799 381.826 487.008 367.129 428.061 Z';
const EXPECTED_APERTURE_HASH = 'bb4079e12e6db7bb2387dc7fbe174b3283b57d5af4d4e942e4053bd96158c9dd';
const EXPECTED_APERTURE_VERSION = 'continuous-lens-aperture/owner-selected-left-v2';

function embeddedMetadata(svg) {
  const match = svg.match(/<metadata id="bizarre-atlas-provenance">([\s\S]*?)<\/metadata>/);
  assert.ok(match, 'SVG must embed actual provenance metadata');
  return JSON.parse(match[1]);
}

test('renders byte-identical single-mass fields with verifiable configuration metadata', () => {
  const options = { width: 640, height: 360, orientation: 18, representation: 'contour', appearance: 'dark' };
  const first = renderAtlas(options);
  const second = renderAtlas(options);

  assert.deepEqual(first, second);
  assert.equal(first.metadata.sourceType, 'synthetic');
  assert.deepEqual(first.metadata.model, { name: 'single-mass-lensing-field', version: '1.0.0' });
  assert.deepEqual(first.metadata.algorithm, { name: 'bizarre-atlas-single-mass', version: '1.0.0' });
  assert.equal(first.metadata.configurationHash, hashConfiguration(first.metadata.configuration));
  assert.deepEqual(embeddedMetadata(first.svg), first.metadata);
  assert.doesNotMatch(first.svg, /seed|multi[- ]mass|catalogue|coordinates/i);
});

test('accepts exactly the canonical orientation family', () => {
  for (const orientation of [-38, -18, 18, 38]) {
    assert.equal(renderAtlas({ orientation }).metadata.orientation, orientation);
  }
  for (const orientation of [-37, 0, 17, 39, '18']) {
    assert.throws(() => renderAtlas({ orientation }), /orientation.*-38.*-18.*18.*38/i);
  }
});

test('consumes the four canonical capture duration tiers without relabeling them', () => {
  assert.deepEqual(ATLAS_CONFIG.capture.duration, {
    ceremonial: 1200,
    fastMax: 600,
    fastMin: 300,
    installation: 2400,
    unit: 'ms'
  });
});

test('uses canonical compression, line widths, spectrum, and Signal Lime', () => {
  const contour = renderAtlas({ orientation: 18, representation: 'contour' });
  const bands = renderAtlas({ orientation: 18, representation: 'bands' });

  assert.equal(contour.metadata.configuration.field.compressionExponent, 1.72);
  assert.deepEqual(contour.metadata.configuration.field.lineWidths, { band: 14, major: 4, minor: 1, unit: 'px' });
  assert.match(contour.svg, /data-line-kind="minor"[^>]*stroke-width="1"/);
  assert.match(contour.svg, /data-line-kind="major"[^>]*stroke-width="4"/);
  assert.match(bands.svg, /data-line-kind="major"[^>]*stroke-width="14"/);
  for (const color of ['#20274D', '#3156A6', '#4AA5AF', '#5C887C', '#D5A347', '#C96C3E', '#B64C63']) {
    assert.ok(bands.metadata.configuration.palette.spectrum.includes(color), color);
  }
  assert.equal(contour.metadata.configuration.palette.signal, '#C6FF24');
  assert.equal((contour.svg.match(/data-layer="signal-trajectory"/g) ?? []).length, 2);
  assert.match(contour.svg, /<path data-layer="signal-trajectory" data-role="path"[\s\S]*#C6FF24/);
  assert.match(contour.svg, /<circle data-layer="signal-trajectory" data-role="datum"[\s\S]*#C6FF24/);
});

test('governs the owner-selected smooth Continuous Lens without sharp outline features', () => {
  const rendered = renderAperture();

  assert.equal(APERTURE_PATH, EXPECTED_APERTURE_PATH);
  assert.equal(APERTURE_PATH_SHA256, EXPECTED_APERTURE_HASH);
  assert.equal(APERTURE_VERSION, EXPECTED_APERTURE_VERSION);
  assert.equal(createHash('sha256').update(APERTURE_PATH).digest('hex'), EXPECTED_APERTURE_HASH);
  assert.equal(rendered.metadata.apertureVersion, APERTURE_VERSION);
  assert.equal(rendered.metadata.aperturePathSha256, EXPECTED_APERTURE_HASH);
  assert.match(rendered.svg, new RegExp(`data-layer="continuous-lens-aperture" d="${EXPECTED_APERTURE_PATH.replaceAll('.', '\\.')}`));
  assert.equal((APERTURE_PATH.match(/\bC\b/g) ?? []).length, 4);
  assert.doesNotMatch(APERTURE_PATH, /\b(?:A|H|L|Q|S|T|V)\b/);
  assert.doesNotMatch(rendered.svg, /machined-chamfer|aperture-silhouette|clipped-wedge|key-cut/i);
  const vectorMarkup = rendered.svg.replace(/<metadata[\s\S]*?<\/metadata>/, '');
  assert.doesNotMatch(vectorMarkup, /\d\.\d{7,}|-0(?:\.0+)?(?:\D|$)/);
});

test('keeps every generated Continuous Lens as four smooth cubic quadrants at the fixed rotation', () => {
  const geometry = apertureGeometry({ centerX: 320, centerY: 180, radiusX: 96 });

  assert.equal(geometry.rotationDegrees, APERTURE_ROTATION_DEGREES);
  assert.equal((geometry.path.match(/\bC\b/g) ?? []).length, 4);
  assert.doesNotMatch(geometry.path, /\b(?:A|H|L|Q|S|T|V)\b/);
  assert.equal(apertureContainment({ centerX: 320, centerY: 180, radiusX: 96, x: 320, y: 180 }), 0);
  assert.ok(Math.abs(apertureContainment({
    centerX: 320,
    centerY: 180,
    radiusX: 96,
    x: 320 + 96 * Math.cos(APERTURE_ROTATION_DEGREES * Math.PI / 180),
    y: 180 + 96 * Math.sin(APERTURE_ROTATION_DEGREES * Math.PI / 180)
  }) - 1) < 1e-12);
});

test('keeps the construction ratio separate from reference bounds aspect', () => {
  const { metadata } = renderAperture();

  assert.equal(metadata.constructionRatio, 1.618);
  assert.deepEqual(metadata.referenceBounds, {
    width: 480,
    height: 220,
    aspect: APERTURE_ASPECT_RATIO,
    rotationDegrees: APERTURE_ROTATION_DEGREES
  });
  assert.deepEqual(metadata.referenceBounds, APERTURE_REFERENCE_BOUNDS);
  assert.notEqual(metadata.constructionRatio, metadata.referenceBounds.aspect);
});

test('rotates field occlusion with the Continuous Lens and never reintroduces the rejected outline', () => {
  const rendered = renderAtlas({ width: 640, height: 360, orientation: 18, representation: 'contour', appearance: 'dark' });
  const radiusX = 640 * ATLAS_CONFIG.field.parameters.apertureRadius.x;
  const radiusY = radiusX / APERTURE_ASPECT_RATIO;
  const massX = 640 * ATLAS_CONFIG.field.mass.x;
  const massY = 360 * ATLAS_CONFIG.field.mass.y;
  const fieldPaths = [...rendered.svg.matchAll(/<path data-layer="field-line"[^>]* d="([^"]+)"/g)];

  assert.ok(fieldPaths.length > 0);
  for (const [, path] of fieldPaths) {
    const coordinates = [...path.matchAll(/(?:M|L)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)];
    for (const [, x, y] of coordinates) {
      assert.ok(apertureContainment({
        centerX: massX,
        centerY: massY,
        radiusX,
        radiusY,
        x: Number(x),
        y: Number(y)
      }) >= ATLAS_CONFIG.field.parameters.occlusionExpansion - 0.001);
    }
  }
  assert.doesNotMatch(rendered.svg, /machined-chamfer|aperture-silhouette|calibrated-aperture/i);
  assert.equal((rendered.svg.match(/data-layer="continuous-lens-aperture"/g) ?? []).length, 1);
});

test('emits vector-only output without fake fonts, text labels, or pseudo-scientific claims', () => {
  for (const { svg } of [renderAtlas({ orientation: 18 }), renderAperture()]) {
    assert.doesNotMatch(svg, /<text\b|font-family|@font-face/i);
    assert.doesNotMatch(svg, /SEED|J2000|G-042|observed|multi[- ]mass/i);
  }
});

test('rejects unsupported source and physical-evidence claims', () => {
  for (const options of [
    { seed: 241107 },
    { sourceType: 'observed' },
    { model: 'multi-mass-field' },
    { coordinates: [0, 0] },
    { catalogue: 'CANOPUS-01' },
    { productionProfile: 'embroidery' },
    { productionProfile: 'one-color' },
    { productionProfile: 'print' },
    { productionProfile: 'vinyl' }
  ]) {
    assert.throws(() => renderAtlas(options), /unsupported|synthetic|production profile/i);
  }
});

test('capture orientation changes the rendered trajectory instead of metadata only', () => {
  const vector = ({ svg }) => svg.replace(/<metadata[\s\S]*?<\/metadata>/, '');
  assert.notEqual(
    vector(renderCaptureSequence({ orientation: -38 })),
    vector(renderCaptureSequence({ orientation: 38 }))
  );
});

test('all aperture-bearing derivatives use the smooth Continuous Lens and separately addressable Signal nodes', () => {
  for (const { svg } of [
    renderAtlas({ orientation: 18 }),
    renderCaptureSequence({ orientation: 18 }),
    renderInstrumentDial({ orientation: 18 })
  ]) {
    assert.match(svg, /data-layer="continuous-lens-aperture"/);
    assert.doesNotMatch(svg, /machined-chamfer|aperture-silhouette|calibrated-aperture/i);
    for (const match of svg.matchAll(/<path data-layer="continuous-lens-aperture" d="([^"]+)"/g)) {
      assert.equal((match[1].match(/\bC\b/g) ?? []).length, 4);
      assert.doesNotMatch(match[1], /\b(?:A|H|L|Q|S|T|V)\b/);
    }
  }
  const atlas = renderAtlas({ orientation: 18 }).svg;
  assert.match(atlas, /<path data-layer="signal-trajectory" data-role="path"/);
  assert.match(atlas, /<circle data-layer="signal-trajectory" data-role="datum"/);
});

test('micro rendering omits field detail by policy instead of scaling it down', () => {
  const { svg, metadata } = renderAtlas({ orientation: 18, opticalSize: 'micro', width: 96, height: 48 });

  assert.equal(metadata.opticalSize, 'micro');
  assert.doesNotMatch(svg, /data-layer="field-line"/);
  assert.equal((svg.match(/data-layer="continuous-lens-aperture"/g) ?? []).length, 1);
  assert.equal((svg.match(/data-layer="signal-trajectory"/g) ?? []).length, 2);
});
