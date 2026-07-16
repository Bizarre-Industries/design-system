import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildExpectedUi } from '../scripts/build-ui.mjs';

const root = new URL('../', import.meta.url);
const readText = (path) => readFile(new URL(path, root), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

test('UI contract wraps host-owned accessible primitives without replacing behavior', async () => {
  const contract = await readJson('packages/ui/src/contract.json');
  assert.equal(contract.schemaVersion, 2);
  assert.equal(contract.package, '@bizarre/ui');
  assert.deepEqual(contract.integration, {
    principle: 'integrate-not-replace',
    auditBeforeStyling: true,
    conflictResolution: 'host-convention-wins',
    identityModel: 'single-identity',
    identityOwner: 'Bizarre Industries',
    hostVisualLanguageOwner: 'host-product-and-platform',
    bizarreExpression: 'restrained-recognition-layer',
    adapterSurface: 'opt-in-html-css'
  });
  assert.equal(contract.infrastructure.behaviorOwner, 'host-application');
  assert.equal(contract.infrastructure.browserBehaviorOwner, 'browser-and-host-application');
  assert.equal(contract.infrastructure.hostComponentSystemRequired, true);
  assert.equal(contract.infrastructure.semanticHtmlRequired, true);
  assert.equal(contract.infrastructure.globalResetAllowed, false);
  assert.equal(contract.infrastructure.hostRootStyleOverrideAllowed, false);
  assert.deepEqual(contract.infrastructure.nativePrimitives, ['a', 'button', 'input', 'output', 'select']);
  assert.deepEqual(contract.infrastructure.prohibitedRuntime, [
    'component-runtime',
    'dialog-system',
    'focus-manager',
    'form-engine',
    'router'
  ]);
  assert.deepEqual(contract.themes, ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']);
});

test('contract covers the complete signature component and state vocabulary', async () => {
  const contract = await readJson('packages/ui/src/contract.json');
  const components = contract.components;
  assert.deepEqual(Object.keys(components).sort(), [
    'atlas-panel',
    'bilingual-data-panel',
    'calibration-label',
    'instrument-dial',
    'physical-label',
    'signal-action',
    'status-indicator'
  ]);
  assert.deepEqual(components['signal-action'].states, [
    'default', 'hover', 'focus', 'pressed', 'disabled', 'loading', 'success', 'error'
  ]);
  assert.deepEqual(components['signal-action'].variants, ['primary', 'quiet']);
  assert.equal(components['signal-action'].disabled.nativeAttribute, 'disabled');
  assert.deepEqual(components['signal-action'].pressed, { ariaAttribute: 'aria-pressed', value: 'true' });
  assert.deepEqual(components['signal-action'].loading, { ariaAttribute: 'aria-busy', value: 'true' });
  assert.equal(components['status-indicator'].role, 'status');
  assert.equal(components['status-indicator'].live, 'polite');
  assert.deepEqual(components['status-indicator'].states, [
    'idle', 'ready', 'aligned', 'active', 'captured', 'released', 'fault'
  ]);
  assert.deepEqual(components['calibration-label'].requiredFields, [
    'atlas-id', 'source', 'state', 'version-date'
  ]);
  assert.equal(components['calibration-label'].syntheticIdentifier, 'configuration-hash');
  assert.equal(components['instrument-dial'].nativeElement, 'input');
  assert.equal(components['instrument-dial'].nativeType, 'range');
  assert.deepEqual(components['atlas-panel'].representations, [
    'spectral', 'bands', 'contour', 'shaded-contour', 'dots', 'hatching', 'grain', 'material', 'one-color'
  ]);
  assert.equal(components['bilingual-data-panel'].directionSource, 'nearest-dir-attribute');
  assert.deepEqual(components['bilingual-data-panel'].leadVariants, ['english', 'arabic']);
  assert.equal(components['physical-label'].coordinateSpace, 'physical');
});

test('component CSS is token-only, target-safe, and exposes native interaction states', async () => {
  const contract = await readJson('packages/ui/src/contract.json');
  const css = await readText('packages/ui/src/components.css');
  assert.ok(contract.accessibility.minimumTargetPx >= 44);
  assert.equal(contract.accessibility.targetToken, 'space.12');
  assert.match(css, /\[data-bzr-component="signal-action"\][\s\S]*min-block-size:\s*var\(--bzr-space-12\)/);
  assert.match(css, /\[data-bzr-component="signal-action"\][\s\S]*min-inline-size:\s*var\(--bzr-space-12\)/);
  assert.match(css, /\[data-bzr-component="signal-action"\]:focus-visible[\s\S]*var\(--bzr-focus-ring\)/);
  assert.match(css, /\[data-bzr-component="signal-action"\]:hover/);
  assert.match(css, /\[data-bzr-component="signal-action"\]:active/);
  assert.match(css, /\[aria-pressed="true"\]/);
  assert.match(css, /\[aria-busy="true"\]/);
  assert.match(css, /:disabled/);
  assert.match(css, /\[data-state="success"\]/);
  assert.match(css, /\[data-state="error"\]/);
  assert.doesNotMatch(css, /--bzr-[\w-]+\s*:/, 'UI package must never redefine canonical tokens');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i, 'UI colors must come from semantic tokens');
  assert.doesNotMatch(css, /border:\s*var\(--bzr-border-2\)/, 'core framing uses the governed 1px or 3px weights');
  assert.doesNotMatch(css, /box-shadow:/, 'precision surfaces are flat by default');
  assert.match(css, /^\[data-bzr-component\],/);
  assert.doesNotMatch(css, /(?:^|,)\s*\*(?=\s*(?:,|\{))/m, 'UI package must not ship a global universal reset');
  assert.doesNotMatch(css, /(?:^|\})\s*(?:html|body|:root|\[data-bzr-ui\])(?:\b|\s|\{|:)/m, 'UI package must not restyle a host root');
  for (const tracking of css.matchAll(/letter-spacing:\s*([^;]+);/g)) {
    assert.match(tracking[1], /^calc\(var\(--bzr-font-tracking-[\w-]+\) \* 1em\)$/);
  }
  assert.doesNotMatch(css, /(?:^|[;{\s])(?:left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/m);
});

test('capture motion maps every governed phase and reduces to the final captured state', async () => {
  const contract = await readJson('packages/ui/src/contract.json');
  const css = await readText('packages/ui/src/motion.css');
  assert.deepEqual(contract.motion.phaseOrder, ['approach', 'compress', 'eclipse', 'lock', 'release']);
  assert.equal(contract.motion.durationToken, 'capture.duration.ceremonial');
  assert.equal(contract.motion.reducedMotionState, 'captured');
  for (const phase of contract.motion.phaseOrder) {
    assert.deepEqual(contract.motion.phases[phase], {
      startToken: `capture.phase.${phase}.start`,
      endToken: `capture.phase.${phase}.end`
    });
    assert.match(css, new RegExp(`--bzr-capture-phase-${phase}-start`));
    assert.match(css, new RegExp(`--bzr-capture-phase-${phase}-end`));
    assert.match(css, new RegExp(`data-bzr-capture-phase="${phase}"`));
  }
  assert.match(css, /--bzr-capture-duration-ceremonial/);
  assert.doesNotMatch(css, /--bzr-capture-duration-standard/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /animation:\s*none\s*!important/);
  assert.match(css, /transition:\s*none\s*!important/);
  assert.match(css, /\[data-bzr-capture\]\[data-state="captured"\]/);
  assert.doesNotMatch(css, /\[data-bzr-ui\]\s+\*/, 'reduced motion must not globally disable every transition');
});

test('RTL layer uses direction-aware selectors and preserves physical coordinate fields', async () => {
  const contract = await readJson('packages/ui/src/contract.json');
  const css = await readText('packages/ui/src/rtl.css');
  assert.equal(contract.rtl.layoutSelector, ':dir(rtl)');
  assert.equal(contract.rtl.physicalCoordinateDirection, 'ltr');
  assert.match(css, /:dir\(rtl\)/);
  assert.match(css, /\[data-bzr-coordinate-space="physical"\][\s\S]*direction:\s*ltr/);
  assert.match(css, /margin-inline|padding-inline|inset-inline|border-inline|text-align:\s*start/);
  assert.doesNotMatch(css, /(?:^|[;{\s])(?:left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/m);
});

test('UI build publishes an exact deterministic package boundary', async () => {
  const files = await buildExpectedUi(root);
  assert.deepEqual([...files.keys()], [
    'generated/components.css',
    'generated/contract.json',
    'generated/manifest.json',
    'generated/motion.css',
    'generated/rtl.css'
  ]);
  const manifest = JSON.parse(files.get('generated/manifest.json'));
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.package, '@bizarre/ui');
  assert.deepEqual(Object.keys(manifest.files), [
    'generated/components.css',
    'generated/contract.json',
    'generated/motion.css',
    'generated/rtl.css'
  ]);
  assert.ok([...files.values()].every(Buffer.isBuffer));
});
