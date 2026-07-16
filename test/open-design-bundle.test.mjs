import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { posix } from 'node:path';
import test from 'node:test';

import { flattenTokens } from '../scripts/lib/token-model.mjs';

const root = new URL('../', import.meta.url);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (bytes) => JSON.parse(bytes.toString('utf8'));

async function buildBundle() {
  const { buildExpectedOpenDesign } = await import('../scripts/build-open-design.mjs');
  return buildExpectedOpenDesign(root);
}

async function expectedInventory(files) {
  const assets = json(files.get('generated/assets/manifest.json'));
  const provisional = json(files.get('generated/provisional/manifest.json'));
  const assetPaths = Object.keys(assets.files)
    .map((path) => `generated/assets/${path.slice('generated/'.length)}`);
  const provisionalPaths = provisional.assets
    .map(({ path }) => `generated/provisional/atlas/${path.split('/').at(-1)}`);
  return [
    'generated/assets/manifest.json',
    ...assetPaths,
    'generated/provisional/manifest.json',
    ...provisionalPaths,
    'generated/authority/BRAND.md',
    'generated/authority/DESIGN.md',
    'generated/authority/SOURCE.json',
    'generated/authority/authority.json',
    'generated/authority/identity.json',
    'generated/fixture/index.html',
    'generated/fixture/proof.js',
    'generated/manifest.json',
    'generated/manual/index.html',
    'generated/manual/manual.css',
    'generated/manual/pages/aperture.html',
    'generated/manual/pages/bilingual.html',
    'generated/manual/pages/components.html',
    'generated/manual/pages/evidence.html',
    'generated/manual/pages/governance.html',
    'generated/manual/pages/motion.html',
    'generated/manual/pages/poster.html',
    'generated/manual/pages/precision-panel.html',
    'generated/manual/pages/production.html',
    'generated/manual/pages/textures.html',
    'generated/manual/print.html',
    'generated/manual/token-tree.json',
    'generated/policies/bilingual.json',
    'generated/policies/production.json',
    'generated/policies/provenance.json',
    'generated/preview/index.html',
    'generated/release/evidence.json',
    'generated/tokens/manifest.json',
    'generated/tokens/tokens.css',
    'generated/tokens/tokens.json',
    'generated/ui/components.css',
    'generated/ui/contract.json',
    'generated/ui/manifest.json',
    'generated/ui/motion.css',
    'generated/ui/rtl.css',
  ].sort();
}

test('builds the exact portable Open Design inventory from canonical packages', async () => {
  const files = await buildBundle();
  assert.deepEqual([...files.keys()], await expectedInventory(files));
  assert.ok([...files.values()].every(Buffer.isBuffer));

  const manifest = json(files.get('generated/manifest.json'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.package, '@bizarre/open-design');
  assert.equal(manifest.publicationStatus, 'nonpublishable');
  assert.deepEqual(manifest.provisionalAssets, {
    path: 'generated/provisional/manifest.json',
    status: 'PROVISIONAL v1',
  });
  assert.deepEqual(Object.keys(manifest.files).sort(), [...files.keys()].filter((path) => path !== 'generated/manifest.json').sort());
  for (const [path, record] of Object.entries(manifest.files)) {
    assert.equal(record.sha256, sha256(files.get(path)), path);
  }

  const second = await buildBundle();
  assert.deepEqual([...second.keys()], [...files.keys()]);
  for (const [path, bytes] of files) assert.ok(bytes.equals(second.get(path)), path);
});

test('copies exact authority and package outputs without proposal derivatives or token duplication', async () => {
  const files = await buildBundle();
  const read = async (path) => Buffer.from(await (await import('node:fs/promises')).readFile(new URL(path, root)));
  const exactCopies = new Map([
    ['generated/authority/DESIGN.md', 'extensions/astronomical-atlas/DESIGN.md'],
    ['generated/authority/SOURCE.json', 'extensions/astronomical-atlas/SOURCE.json'],
    ['generated/authority/authority.json', 'governance/authority.json'],
    ['generated/authority/identity.json', 'brand/identity.json'],
    ['generated/authority/BRAND.md', 'BRAND.md'],
    ['generated/tokens/tokens.css', 'packages/tokens/generated/tokens.css'],
    ['generated/tokens/tokens.json', 'packages/tokens/generated/tokens.json'],
    ['generated/tokens/manifest.json', 'packages/tokens/generated/manifest.json'],
    ['generated/ui/components.css', 'packages/ui/generated/components.css'],
    ['generated/ui/contract.json', 'packages/ui/generated/contract.json'],
    ['generated/ui/motion.css', 'packages/ui/generated/motion.css'],
    ['generated/ui/rtl.css', 'packages/ui/generated/rtl.css'],
    ['generated/ui/manifest.json', 'packages/ui/generated/manifest.json'],
    ['generated/assets/manifest.json', 'packages/assets/generated/manifest.json'],
    ['generated/provisional/manifest.json', 'brand/provisional-assets.json'],
  ]);
  for (const [bundled, source] of exactCopies) assert.ok(files.get(bundled).equals(await read(source)), `${bundled} must be exact`);

  const paths = [...files.keys()];
  assert.equal(paths.filter((path) => path.endsWith('/tokens.css')).length, 1);
  assert.equal(paths.filter((path) => path.endsWith('/tokens.json')).length, 1);
  assert.ok(paths.every((path) => !/proposal|compiled/i.test(path)));
  assert.ok(paths.every((path) => !/\.pdf$/i.test(path)));
  const manifest = json(files.get('generated/manifest.json'));
  assert.deepEqual(manifest.exclusions, ['proposal-compiled-css', 'proposal-generated-mockups', 'proposal-pdf']);
  for (const path of paths.filter((path) => /\.(?:css|html|js)$/i.test(path) && path !== 'generated/tokens/tokens.css')) {
    assert.doesNotMatch(files.get(path).toString('utf8'), /--bzr-[\w-]+\s*:/, `${path} must consume rather than duplicate canonical tokens`);
  }
});

test('token tree is derived from the bundled token model and manifest', async () => {
  const files = await buildBundle();
  const tree = json(files.get('generated/manual/token-tree.json'));
  const model = json(files.get('generated/tokens/tokens.json'));
  const manifest = files.get('generated/tokens/manifest.json');
  const expectedPaths = flattenTokens(model).map(({ path }) => path);

  assert.equal(tree.schemaVersion, 1);
  assert.equal(tree.sourceManifestSha256, sha256(manifest));
  assert.deepEqual(tree.paths, expectedPaths);
  assert.deepEqual(tree.groups.map(({ name }) => name), [...new Set(expectedPaths.map((path) => path.split('.')[0]))].sort());
  assert.deepEqual(tree.groups.flatMap(({ paths }) => paths).sort(), expectedPaths);
});

test('includes only approved assets and preserves every asset provenance record', async () => {
  const files = await buildBundle();
  const assets = json(files.get('generated/assets/manifest.json'));
  for (const [path, record] of Object.entries(assets.files)) {
    assert.equal(record.approved, true, path);
    assert.equal(record.approvalState, 'approved', path);
    assert.ok(record.sourceProvenance, path);
    assert.ok(record.allowedUses.length > 0, path);
    const bundled = `generated/assets/${path.slice('generated/'.length)}`;
    assert.ok(files.has(bundled), bundled);
    assert.equal(sha256(files.get(bundled)), record.sha256, bundled);
  }
});

test('isolates provisional Atlas references outside the approved asset tree', async () => {
  const files = await buildBundle();
  const approved = json(files.get('generated/assets/manifest.json'));
  const provisional = json(files.get('generated/provisional/manifest.json'));

  assert.ok(Object.keys(approved.files).every((path) => !path.startsWith('generated/atlas/')));
  for (const entry of provisional.assets) {
    const path = `generated/provisional/atlas/${entry.path.split('/').at(-1)}`;
    assert.ok(files.has(path), path);
    assert.equal(sha256(files.get(path)), entry.sha256, path);
    assert.equal(entry.approved, false, path);
    assert.equal(entry.publishable, false, path);
  }
});

test('proposal exclusion follows lineage and permits governed raster evidence', async () => {
  const { isProposalDerivative } = await import('../scripts/build-open-design.mjs');
  const approvedAffinityRaster = {
    mediaType: 'image/png',
    sourcePath: 'packages/assets/mockups/hardware-panel.png',
    sourceProvenance: 'affinity/native/hardware-panel.afdesign',
  };
  assert.equal(isProposalDerivative('generated/mockups/hardware-panel.png', approvedAffinityRaster), false);
  assert.equal(isProposalDerivative('generated/mockups/hardware-panel.png', {
    ...approvedAffinityRaster,
    sourceProvenance: 'proposal/generated/mockups/hardware-panel.png',
  }), true);
  assert.equal(isProposalDerivative('generated/proposal/compiled.css', {
    mediaType: 'text/css',
    sourcePath: 'proposal/tokens.css',
    sourceProvenance: 'proposal/tokens.css',
  }), true);
});

test('portable package embeds its build inputs without runtime dependency requirements', async () => {
  const packageJson = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../packages/open-design/package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.peerDependencies, undefined);
  assert.equal(packageJson.optionalDependencies, undefined);
});

test('manual and fixture resources are local, closed, and never crop full-width media', async () => {
  const files = await buildBundle();
  const markupPaths = [...files.keys()].filter((path) => /\.(?:html|css|js)$/i.test(path));
  for (const path of markupPaths) {
    const source = files.get(path).toString('utf8');
    assert.doesNotMatch(source, /(?:https?:)?\/\//i, `${path} must not load remote resources`);
    assert.doesNotMatch(source, /(?:src|href|data)\s*=\s*["']data:/i, `${path} must not embed data resources`);
  }

  for (const path of markupPaths.filter((candidate) => candidate.endsWith('.html'))) {
    const source = files.get(path).toString('utf8');
    for (const [, target] of source.matchAll(/(?:src|href|data)\s*=\s*["']([^"']+)["']/gi)) {
      if (target.startsWith('#')) continue;
      const clean = target.split(/[?#]/)[0];
      assert.ok(clean && !clean.startsWith('/') && !clean.includes(':'), `${path}: ${target}`);
      const resolved = posix.normalize(posix.join(posix.dirname(path), clean));
      assert.ok(resolved.startsWith('generated/'), `${path}: ${target} escapes the bundle`);
      assert.ok(files.has(resolved), `${path}: missing ${resolved}`);
    }
  }

  const css = files.get('generated/manual/manual.css').toString('utf8');
  assert.match(css, /:where\(img,\s*object,\s*video\)[\s\S]*max-inline-size:\s*100%[\s\S]*object-fit:\s*contain/);
  assert.match(css, /\.manual-precision\s*\{[\s\S]*display:\s*grid[\s\S]*border:\s*var\(--bzr-border-1\) solid var\(--bzr-border-default\)/, 'Precision Panel must have a complete flat technical frame');
  assert.match(css, /\.manual-poster\s+:where\(h1,\s*h2\)/, 'preview and manual poster headings share the governed display treatment');
  assert.doesNotMatch(css, /object-fit:\s*cover|background-size:\s*cover/i);
  for (const path of markupPaths.filter((candidate) => candidate.endsWith('.html'))) {
    assert.doesNotMatch(files.get(path).toString('utf8'), /object-fit:\s*cover|background-size:\s*cover/i, path);
  }
});

test('manual contains every repaired page and a print source without claiming a PDF', async () => {
  const files = await buildBundle();
  const pages = {
    'precision-panel': /data-bzr-layout="precision-panel"[\s\S]*atlas-contours-dark\.svg/,
    textures: /atlas-dots\.svg[\s\S]*atlas-hatch\.svg[\s\S]*atlas-bands\.svg/,
    aperture: /calibrated-aperture\.svg/,
    motion: /capture-sequence\.svg[\s\S]*Approach[\s\S]*Compress[\s\S]*Eclipse[\s\S]*Lock[\s\S]*Release[\s\S]*reduced motion/i,
    poster: /data-bzr-layout="display-field"[\s\S]*CATCH THE STARS/,
    components: /data-bzr-component="signal-action"[\s\S]*data-bzr-component="status-indicator"[\s\S]*data-bzr-component="instrument-dial"/,
    bilingual: /lang="en"\s+dir="ltr"[\s\S]*lang="ar"\s+dir="rtl"[\s\S]*NOT VERIFIED/,
    production: /finePrintContour[\s\S]*vinylContour[\s\S]*aperturePrint[\s\S]*NOT VERIFIED/,
    governance: /only[^.]*Bizarre Industries[^.]*Gravity Well geometry[^.]*non-negotiable[\s\S]*tagline[^.]*governed/i,
    evidence: /authority-integrity[\s\S]*pdf-print-certification[\s\S]*NOT VERIFIED/,
  };
  for (const [name, pattern] of Object.entries(pages)) {
    assert.match(files.get(`generated/manual/pages/${name}.html`).toString('utf8'), pattern, name);
  }
  const print = files.get('generated/manual/print.html').toString('utf8');
  for (const name of Object.keys(pages)) assert.match(print, new RegExp(`data-manual-page="${name}"`));
  assert.match(print, /Provisional HTML review source/);
  assert.match(print, /nonpublishable/i);
  assert.doesNotMatch(print, /PDF (?:ready|verified|certified)/i);
  assert.ok([...files.keys()].every((path) => !path.endsWith('.pdf')));
});
