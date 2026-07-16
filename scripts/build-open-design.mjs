import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { pathToFileURL } from 'node:url';

import { canonicalJson } from './lib/canonical-json.mjs';
import { assertAssetManifestSeparation, validateProvisionalAssets } from './lib/assets.mjs';
import { flattenTokens, resolveTokenAliases } from './lib/token-model.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const comparePaths = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const text = (value) => Buffer.from(value);
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const PAGE_ORDER = [
  ['precision-panel', 'Precision Panel'],
  ['textures', 'Textures'],
  ['aperture', 'Aperture'],
  ['motion', 'Motion'],
  ['poster', 'Poster'],
  ['components', 'Components'],
  ['bilingual', 'Bilingual'],
  ['production', 'Production'],
  ['governance', 'Governance'],
  ['evidence', 'Evidence'],
];

const RELEASE_STATUSES = new Set(['PASS', 'FAIL', 'NOT VERIFIED']);

export function deriveReleaseStatus(checks) {
  if (!Array.isArray(checks) || checks.length === 0) return 'NOT VERIFIED';
  for (const { status } of checks) {
    if (!RELEASE_STATUSES.has(status)) throw new Error(`Unknown release status: ${status}`);
  }
  if (checks.some(({ status }) => status === 'FAIL')) return 'FAIL';
  return checks.every(({ status }) => status === 'PASS') ? 'PASS' : 'NOT VERIFIED';
}

export function isProposalDerivative(path, record = {}) {
  if (record.proposal === true || record.publishable === false || record.sourceClassification === 'proposal') return true;
  const lineage = [path, record.sourcePath, record.sourceProvenance]
    .filter((value) => value !== undefined && value !== null)
    .map(String)
    .join('\n');
  return /(?:^|[\s\\/_.-])proposal(?:s)?(?:[\s\\/_.-]|$)|bizarre-astronomical-atlas\.zip/i.test(lineage);
}

async function readBytes(rootUrl, path) {
  return Buffer.from(await readFile(new URL(path, rootUrl)));
}

async function readJson(rootUrl, path) {
  return JSON.parse(await readFile(new URL(path, rootUrl), 'utf8'));
}

function assertManifest(manifest, expectedPackage, files, prefix, expectedSchemaVersion = 1) {
  if (manifest?.schemaVersion !== expectedSchemaVersion || manifest.package !== expectedPackage || !manifest.files || Array.isArray(manifest.files)) {
    throw new TypeError(`${expectedPackage} manifest is invalid`);
  }
  for (const [path, record] of Object.entries(manifest.files)) {
    const bytes = files.get(`${prefix}${path.slice('generated/'.length)}`);
    if (!bytes || sha256(bytes) !== record.sha256) throw new Error(`${expectedPackage} manifest hash mismatch: ${path}`);
  }
}

function extractAtlasMetadata(svg) {
  const match = svg.match(/<metadata id="bizarre-atlas-provenance">([^<]+)<\/metadata>/);
  if (!match) throw new Error('Atlas preview asset is missing embedded provenance');
  return JSON.parse(match[1]);
}

function pageHead({ title, resourcePrefix, manualCss }) {
  return `<!doctype html>
<html lang="en" data-bizarre-theme="void">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Bizarre Industries</title>
  <link rel="stylesheet" href="${resourcePrefix}tokens/tokens.css">
  <link rel="stylesheet" href="${resourcePrefix}assets/fonts/bizarre-fonts.css">
  <link rel="stylesheet" href="${resourcePrefix}ui/components.css">
  <link rel="stylesheet" href="${resourcePrefix}ui/motion.css">
  <link rel="stylesheet" href="${resourcePrefix}ui/rtl.css">
  <link rel="stylesheet" href="${manualCss}">
</head>`;
}

function manualNav() {
  return `<nav class="manual-nav" aria-label="Manual pages">
    <a href="../index.html">Overview</a>
    ${PAGE_ORDER.map(([slug, title]) => `<a href="./${slug}.html">${escapeHtml(title)}</a>`).join('\n    ')}
  </nav>`;
}

function manualPage({ slug, title, lede, body }) {
  return `${pageHead({ title, resourcePrefix: '../../', manualCss: '../manual.css' })}
<body data-bzr-ui>
  <main class="manual-shell">
    ${manualNav()}
    <article class="manual-page" data-manual-page="${slug}">
      <header class="manual-page-header">
        <p class="manual-eyebrow">Bizarre Industries / Astronomical Atlas / PROVISIONAL v1 / NONPUBLISHABLE</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="manual-lede">${escapeHtml(lede)}</p>
      </header>
      ${body}
    </article>
  </main>
</body>
</html>
`;
}

function statusBadge(status) {
  return `<span class="manual-status" data-status="${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function evidenceTable(checks) {
  return `<div class="manual-table-wrap">
    <table>
      <thead><tr><th scope="col">Gate</th><th scope="col">Status</th><th scope="col">Evidence</th></tr></thead>
      <tbody>
        ${checks.map((check) => `<tr><th scope="row"><code>${escapeHtml(check.id)}</code><span>${escapeHtml(check.label)}</span></th><td>${statusBadge(check.status)}</td><td><code>${escapeHtml(check.evidence.ref)}</code></td></tr>`).join('\n        ')}
      </tbody>
    </table>
  </div>`;
}

function productionTable(production) {
  const ordered = ['finePrintContour', 'vinylContour', 'screenContour', 'aperturePrint', 'apertureScreen'];
  return `<div class="manual-table-wrap">
    <table>
      <thead><tr><th scope="col">Profile gate</th><th scope="col">Current minimum</th><th scope="col">Evidence</th></tr></thead>
      <tbody>
        ${ordered.map((name) => {
          const minimum = production.minimums[name];
          const salience = minimum.highSalience === undefined ? '' : ` / high salience ${minimum.highSalience}${minimum.unit}`;
          return `<tr><th scope="row"><code>${name}</code></th><td>${minimum.value}${escapeHtml(minimum.unit)}${escapeHtml(salience)}</td><td>${statusBadge(minimum.evidence)}</td></tr>`;
        }).join('\n        ')}
      </tbody>
    </table>
  </div>`;
}

function createPageBodies(context, rootPrefix) {
  const {
    atlasMetadata,
    authority,
    bilingual,
    evidence,
    identity,
    production,
    provisionalManifest,
    source,
    tokenRows,
    ui,
  } = context;
  const tokenByPath = new Map(tokenRows.map((row) => [row.path, row]));
  const phaseOrder = ui.motion.phaseOrder;
  const atlas = (name) => `${rootPrefix}provisional/atlas/${name}`;
  const meta = atlasMetadata;
  const provisionalByPath = new Map(provisionalManifest.assets.map((entry) => [entry.path, entry]));
  const textures = [
    ['atlas-dots.svg', 'Dots'],
    ['atlas-hatch.svg', 'Hatching'],
    ['atlas-bands.svg', 'Bands'],
  ];
  const textureFigures = textures.map(([file, title]) => {
    const record = provisionalByPath.get(`packages/atlas/generated/${file}`);
    return `<figure class="manual-media-card">
      <img src="${atlas(file)}" alt="Synthetic Astronomical Atlas ${escapeHtml(title.toLowerCase())} representation">
      <figcaption><strong>${escapeHtml(title)}</strong><span><code>${escapeHtml(record.generator.configurationHash)}</code></span><span>${escapeHtml(record.provenance.sourceType)} / ${escapeHtml(record.relationship)}</span></figcaption>
    </figure>`;
  }).join('\n');

  const components = ui.components;
  const governanceRows = authority.invariants.map((row) => `<tr><th scope="row"><code>${escapeHtml(row.id)}</code></th><td>${escapeHtml(row.source)}</td><td>${row.overrideable === false ? 'No' : 'Yes'}</td></tr>`).join('\n');
  const extensionOverrides = authority.extensions.flatMap((extension) => extension.overrides.map((override) => `<li><code>${escapeHtml(override.id)}</code> — ${escapeHtml(override.type)}</li>`)).join('\n');

  return {
    'precision-panel': `<section class="manual-precision" data-bzr-layout="precision-panel">
      <header data-bzr-component="calibration-label" data-state="aligned"><span>Atlas / Contour / Precision Panel</span><span>Synthetic / Aligned</span></header>
      <div class="manual-grid">
        <figure data-bzr-component="atlas-panel">
          <img src="${atlas('atlas-contours-dark.svg')}" alt="Synthetic single-mass Astronomical Atlas contour field with one Signal trajectory">
          <figcaption><span>BEND → ABSENCE → SIGNAL</span><span>Full field / contain</span></figcaption>
        </figure>
        <dl class="bzr-meta-grid">
          <div><dt>Atlas ID</dt><dd>${escapeHtml(meta.configurationHash)}</dd></div>
          <div><dt>Source</dt><dd>${escapeHtml(meta.sourceType)}</dd></div>
          <div><dt>Model</dt><dd>${escapeHtml(meta.model.name)}/${escapeHtml(meta.model.version)}</dd></div>
          <div><dt>Orientation</dt><dd>${meta.orientation}${escapeHtml(meta.orientationUnit)}</dd></div>
          <div><dt>Representation</dt><dd>${escapeHtml(meta.representation)}</dd></div>
          <div><dt>Trajectory</dt><dd>${escapeHtml(meta.trajectoryState)} / one Signal path</dd></div>
          <div><dt>Production profile</dt><dd>${escapeHtml(meta.productionProfile)}</dd></div>
          <div><dt>Authority import</dt><dd>${escapeHtml(source.importDate)}</dd></div>
        </dl>
      </div>
      <output data-bzr-component="status-indicator" data-state="aligned" role="status" aria-live="polite">Metadata shown here comes from the displayed governed SVG.</output>
    </section>`,

    textures: `<section>
      <p>Texture is a representation of the same governed field, not decoration and not a second accent system. Each sample below retains the provisional aperture lineage and synthetic source record.</p>
      <div class="manual-grid manual-texture-grid">${textureFigures}</div>
    </section>`,

    aperture: `<section class="manual-grid">
      <figure class="manual-media-card manual-aperture">
        <img src="${atlas('calibrated-aperture.svg')}" alt="Governed smooth Continuous Lens aperture with tangent-continuous outline">
        <figcaption><strong>Continuous Lens aperture</strong><span>Owner-selected direction / governed provisional</span></figcaption>
      </figure>
      <div class="manual-copy-block">
        <h2>Construction, not cropping</h2>
        <p>The silhouette is a fixed smooth, tangent-continuous vector with no chamfer, notch, wedge, corner, or straight segment. Any physical bevel is a separate material study and never changes the opening. Media is contained at full width; the aperture is never used as a cover crop.</p>
        <dl class="manual-definition-list">
          <div><dt>Version</dt><dd>${escapeHtml(meta.apertureVersion)}</dd></div>
          <div><dt>Authority status</dt><dd>${escapeHtml(provisionalManifest.classification)}</dd></div>
          <div><dt>Publication</dt><dd>${escapeHtml(provisionalManifest.publicationStatus)}</dd></div>
          <div><dt>Path SHA-256</dt><dd><code>${escapeHtml(meta.aperturePathSha256)}</code></dd></div>
          <div><dt>Print minimum</dt><dd>${production.minimums.aperturePrint.value}${escapeHtml(production.minimums.aperturePrint.unit)} ${statusBadge(production.minimums.aperturePrint.evidence)}</dd></div>
          <div><dt>Screen minimum</dt><dd>${production.minimums.apertureScreen.value}${escapeHtml(production.minimums.apertureScreen.unit)} ${statusBadge(production.minimums.apertureScreen.evidence)}</dd></div>
        </dl>
      </div>
    </section>`,

    motion: `<section data-bzr-capture data-state="captured">
      <figure data-bzr-component="atlas-panel">
        <img src="${atlas('capture-sequence.svg')}" alt="Governed five-phase Capture sequence held in its final state">
        <figcaption><span>Capture / ${escapeHtml(ui.motion.durationToken)}</span><span>Reduced motion / captured</span></figcaption>
      </figure>
      <ol class="manual-phase-list">${phaseOrder.map((phase) => `<li data-bzr-capture-phase="${phase}">${escapeHtml(phase[0].toUpperCase() + phase.slice(1))}<span>${tokenByPath.get(`capture.phase.${phase}.start`).value}–${tokenByPath.get(`capture.phase.${phase}.end`).value}</span></li>`).join('')}</ol>
      <p>Approach, Compress, Eclipse, Lock, and Release map directly to canonical phase leaves. Under reduced motion the final captured state is rendered immediately; the sequence is not left blank and does not traverse the field.</p>
    </section>`,

    poster: `<section class="manual-poster" data-bzr-layout="display-field" aria-labelledby="poster-title">
      <header data-bzr-component="calibration-label" data-state="active"><span>Poster / Display Field</span><span>Signal / Current path</span></header>
      <img src="${atlas('atlas-spectral.svg')}" alt="Synthetic Astronomical Atlas spectral field">
      <div class="manual-poster-copy">
        <p>Bizarre Industries</p>
        <h2 id="poster-title">${escapeHtml(identity.tagline)}</h2>
        <p>${escapeHtml(identity.taglineMeaning)}</p>
      </div>
      <footer>BEND → ABSENCE → SIGNAL</footer>
    </section>`,

    components: `<section>
      <p>This layer wraps existing native interaction infrastructure. The host application owns behavior; Bizarre supplies governed tokens, states, motion, and composition.</p>
      <div class="manual-grid">
        <article class="manual-component-sample">
          <h2>Action and status</h2>
          <div class="manual-action-row">
            <button type="button" data-bzr-component="signal-action" data-variant="primary">Capture</button>
            <button type="button" data-bzr-component="signal-action" data-variant="quiet" aria-pressed="true">Aligned</button>
            <button type="button" data-bzr-component="signal-action" disabled>Disabled</button>
          </div>
          <output data-bzr-component="status-indicator" data-state="ready" role="status" aria-live="polite">System ready</output>
        </article>
        <fieldset data-bzr-component="instrument-dial">
          <legend>Instrument dial</legend>
          <label for="manual-compression">Compression exponent</label>
          <input id="manual-compression" type="range" min="100" max="220" value="${Math.round(tokenByPath.get('atlas.compression-exponent').value * 100)}" step="1">
          <output for="manual-compression">${tokenByPath.get('atlas.compression-exponent').value}</output>
        </fieldset>
        <article data-bzr-component="physical-label"><h2>Physical label</h2><p><bdi data-bzr-coordinate-space="physical" dir="ltr">MASS X ${tokenByPath.get('atlas.mass.x').value} / MASS Y ${tokenByPath.get('atlas.mass.y').value}</bdi></p></article>
        <figure data-bzr-component="atlas-panel"><img src="${atlas('instrument-dial.svg')}" alt="Governed Astronomical Atlas instrument dial"><figcaption><span>Atlas panel</span><span>Contain / provenance required</span></figcaption></figure>
      </div>
      <p class="manual-note">Contract families: ${Object.keys(components).map((name) => `<code>${escapeHtml(name)}</code>`).join(', ')}.</p>
    </section>`,

    bilingual: `<section>
      <div data-bzr-component="bilingual-data-panel">
        <section lang="en" dir="ltr"><h2>Field calibration</h2><p>Single-mass synthetic field. Equal semantic priority; English does not become the default source of meaning.</p><p><bdi data-bzr-coordinate-space="physical" dir="ltr">ORIENTATION ${meta.orientation}${escapeHtml(meta.orientationUnit)}</bdi></p></section>
        <section lang="ar" dir="rtl"><h2>معايرة المجال</h2><p>مجال اصطناعي بكتلة واحدة. أولوية دلالية متساوية.</p><p><bdi data-bzr-coordinate-space="physical" dir="ltr">ORIENTATION ${meta.orientation}${escapeHtml(meta.orientationUnit)}</bdi></p></section>
      </div>
      <div class="manual-callout"><h2>Public readiness ${statusBadge('NOT VERIFIED')}</h2><p>The current Arabic stack is provisional. Public bilingual shipping requires governed font binaries, native Arabic review, and optical-parity evidence. The field preserves physical direction in both reading orders.</p><p>Optical-area tolerance: ${bilingual.opticalAreaTolerance}. Policy status: <code>${escapeHtml(bilingual.status)}</code>.</p></div>
    </section>`,

    production: `<section>
      <p>These are governed minimums, not passed production tests. Every row remains evidence-gated until a real sample or calibrated screen inspection is recorded.</p>
      ${productionTable(production)}
      <h2>Unresolved production profiles</h2>
      <ul class="manual-chip-list">${production.unresolvedProfiles.map((profile) => `<li>${escapeHtml(profile)} ${statusBadge('NOT VERIFIED')}</li>`).join('')}</ul>
      <p>One-color output is required; lime is not required. Material and spectrum encode environment or data, never a second brand accent.</p>
    </section>`,

    governance: `<section>
      <div class="manual-callout"><h2>Invariant boundary</h2><p>Only the exact Bizarre Industries name and the approved Gravity Well geometry are non-negotiable. The ${escapeHtml(identity.tagline)} tagline is the current governed tagline; fonts, themes, layout modes, colors, and other identity choices may change only through an explicit versioned revision.</p></div>
      <h2>Precedence</h2>
      <ol>${authority.precedence.map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join('')}</ol>
      <div class="manual-table-wrap"><table><thead><tr><th scope="col">Invariant</th><th scope="col">Source</th><th scope="col">Overrideable</th></tr></thead><tbody>${governanceRows}</tbody></table></div>
      <h2>Astronomical Atlas explicit overrides</h2><ul>${extensionOverrides}</ul>
      <p>Where the Atlas extension is silent, the current canonical repository remains authoritative. HTML, CSS, PDF, mockups, Figma, Affinity, and Open Design outputs are derivatives and never become authority.</p>
    </section>`,

    evidence: `<section>
      <div class="manual-callout"><h2>Release status ${statusBadge(evidence.releaseStatus)}</h2><p>A PASS appears only when a machine or human evidence reference exists. Unperformed specialist, visual, PDF, and physical checks remain NOT VERIFIED.</p></div>
      ${evidenceTable(evidence.checks)}
    </section>`,
  };
}

const MANUAL_CSS = `*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
}

body {
  margin: 0;
  background: var(--bzr-surface-canvas);
}

:where(img, object, video) {
  display: block;
  inline-size: 100%;
  max-inline-size: 100%;
  block-size: auto;
  object-fit: contain;
  object-position: center;
}

a {
  color: var(--bzr-content-accent);
}

.manual-shell {
  inline-size: min(100%, calc(var(--bzr-space-48) * 8));
  margin-inline: auto;
  padding: var(--bzr-space-6);
}

.manual-nav,
.manual-action-row,
.manual-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bzr-space-3);
  align-items: center;
}

.manual-nav {
  padding-block: var(--bzr-space-4);
  border-block-end: var(--bzr-border-1) solid var(--bzr-border-default);
  font-family: var(--bzr-font-family-mono);
  font-size: var(--bzr-font-size-xs);
  letter-spacing: calc(var(--bzr-font-tracking-wide) * 1em);
  text-transform: uppercase;
}

.manual-nav a {
  min-block-size: var(--bzr-space-12);
  display: inline-flex;
  align-items: center;
  padding-inline: var(--bzr-space-3);
}

.manual-page {
  padding-block: var(--bzr-space-8);
}

.manual-page-header {
  max-inline-size: calc(var(--bzr-space-48) * 4);
  margin-block-end: var(--bzr-space-8);
}

.manual-page h1,
.manual-poster :where(h1, h2) {
  overflow-wrap: anywhere;
  font-family: var(--bzr-font-family-display);
  font-size: var(--bzr-font-size-4xl);
  font-weight: var(--bzr-font-weight-black);
  line-height: var(--bzr-font-lineHeight-tight);
  letter-spacing: calc(var(--bzr-font-tracking-tight) * 1em);
  text-transform: uppercase;
}

.manual-page h2 {
  font-family: var(--bzr-font-family-stencil);
  font-size: var(--bzr-font-size-xl);
  font-weight: var(--bzr-font-weight-extra-bold);
}

.manual-eyebrow,
.manual-status,
.manual-media-card figcaption,
.manual-poster > footer {
  font-family: var(--bzr-font-family-mono);
  font-size: var(--bzr-font-size-xs);
  letter-spacing: calc(var(--bzr-font-tracking-wide) * 1em);
  text-transform: uppercase;
}

.manual-eyebrow,
.manual-media-card figcaption,
.manual-lede,
.manual-note {
  color: var(--bzr-content-secondary);
}

.manual-lede {
  font-size: var(--bzr-font-size-lg);
}

.manual-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bzr-space-5);
  align-items: stretch;
}

.manual-grid > * {
  min-inline-size: 0;
  flex: 1 1 calc(var(--bzr-space-48) * 2);
}

.manual-precision {
  min-inline-size: 0;
  display: grid;
  gap: var(--bzr-space-6);
  padding: var(--bzr-space-6);
  border: var(--bzr-border-1) solid var(--bzr-border-default);
  background: var(--bzr-surface-elevated);
}

.manual-media-card,
.manual-component-sample,
.manual-copy-block,
.manual-callout {
  margin: 0;
  padding: var(--bzr-space-5);
  border: var(--bzr-border-1) solid var(--bzr-border-default);
  background: var(--bzr-surface-card);
}

.manual-media-card figcaption {
  display: grid;
  gap: var(--bzr-space-2);
  margin-block-start: var(--bzr-space-3);
  overflow-wrap: anywhere;
}

.manual-aperture img {
  max-block-size: calc(var(--bzr-space-48) * 3);
}

.manual-definition-list,
.manual-definition-list > div {
  display: grid;
  gap: var(--bzr-space-2);
}

.manual-definition-list > div {
  padding-block: var(--bzr-space-3);
  border-block-start: var(--bzr-border-1) solid var(--bzr-border-default);
}

.manual-definition-list dt {
  color: var(--bzr-content-muted);
  font-family: var(--bzr-font-family-mono);
  text-transform: uppercase;
}

.manual-definition-list dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.manual-phase-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--bzr-space-1);
  margin-block: var(--bzr-space-5);
  padding: 0;
  list-style: none;
}

.manual-phase-list li {
  min-inline-size: 0;
  padding: var(--bzr-space-3);
  border-block-start: var(--bzr-border-3) solid var(--bzr-border-accent);
  background: var(--bzr-surface-card);
  overflow-wrap: anywhere;
}

.manual-phase-list span {
  display: block;
  color: var(--bzr-content-muted);
  font-family: var(--bzr-font-family-mono);
  font-size: var(--bzr-font-size-xs);
}

.manual-poster {
  display: grid;
  gap: var(--bzr-space-5);
  min-block-size: calc(var(--bzr-space-48) * 4);
  padding: var(--bzr-space-6);
  border: var(--bzr-border-1) solid var(--bzr-border-default);
  background: var(--bzr-surface-elevated);
}

.manual-poster > img {
  max-block-size: calc(var(--bzr-space-48) * 3);
}

.manual-poster-copy {
  align-self: end;
}

.manual-status {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--bzr-space-6);
  padding-inline: var(--bzr-space-2);
  border: var(--bzr-border-1) solid var(--bzr-border-strong);
  color: var(--bzr-content-secondary);
}

.manual-status[data-status="PASS"] {
  border-color: var(--bzr-border-accent);
  color: var(--bzr-content-accent);
}

.manual-status[data-status="FAIL"] {
  border-color: var(--bzr-status-danger-surface);
  color: var(--bzr-status-danger-content);
  background: var(--bzr-status-danger-surface);
}

.manual-table-wrap {
  max-inline-size: 100%;
}

table {
  inline-size: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: var(--bzr-space-3);
  border-block-end: var(--bzr-border-1) solid var(--bzr-border-default);
  text-align: start;
  vertical-align: top;
  overflow-wrap: anywhere;
}

th span {
  display: block;
  margin-block-start: var(--bzr-space-1);
  color: var(--bzr-content-secondary);
  font-weight: var(--bzr-font-weight-regular);
}

.manual-chip-list {
  padding: 0;
  list-style: none;
}

.manual-index-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(var(--bzr-space-48) * 2)), 1fr));
  gap: var(--bzr-space-4);
}

.manual-index-grid > a {
  min-block-size: calc(var(--bzr-space-48) + var(--bzr-space-12));
  display: flex;
  align-items: end;
  padding: var(--bzr-space-5);
  border: var(--bzr-border-1) solid var(--bzr-border-default);
  background: var(--bzr-surface-card);
  font-family: var(--bzr-font-family-stencil);
  font-size: var(--bzr-font-size-xl);
  font-weight: var(--bzr-font-weight-extra-bold);
  text-transform: uppercase;
}

@media print {
  .manual-nav {
    display: none;
  }

  .manual-shell {
    inline-size: 100%;
    padding: 0;
  }

  .manual-page {
    break-after: page;
  }

  .manual-page:last-child {
    break-after: auto;
  }
}
`;

function createEvidence({ assetManifestBytes, designBytes, production, provenance, tokenManifestBytes, uiManifestBytes }) {
  const statuses = provenance.release.statuses;
  if (JSON.stringify(statuses) !== JSON.stringify(['PASS', 'FAIL', 'NOT VERIFIED'])) {
    throw new Error('Release status vocabulary does not match the provenance policy');
  }
  const authorityChecklistRef = 'authority/DESIGN.md#release-checklist';
  const authorityChecklist = [
    ['gravity-well-integrity', 'Gravity Well asset is approved and unmodified'],
    ['signal-salience', 'Signal Lime remains the highest-salience operational cue'],
    ['spectrum-mapping', 'Spectrum colors map from data or a documented synthetic field'],
    ['aperture-geometry', 'Continuous Lens Aperture matches the governed geometry'],
    ['far-monochrome-recognition', 'Recognition works in monochrome at far distance'],
    ['singular-lime-trajectory', 'Lime trajectory is singular'],
    ['metadata-provenance', 'Metadata is real or explicitly labeled synthetic'],
    ['bilingual-optical-parity', 'Arabic and English are optically equal'],
    ['interaction-accessibility', 'Focus, contrast, and reduced-motion states are verified'],
    ['production-fine-lines', 'Fine lines meet the production profile minimum'],
    ['material-function', 'Material effects reveal function or representation rather than decoration'],
    ['credible-mockups', 'Mockups use credible physical objects and production logic'],
  ];
  const requiredGateIds = authorityChecklist.map(([id]) => id);
  const checks = [
    {
      id: 'authority-integrity',
      label: 'Imported Astronomical Atlas authority matches its approved source hash',
      status: 'PASS',
      evidence: { type: 'machine', method: 'sha256-match', ref: 'authority/SOURCE.json#/sources/design/sha256', sha256: sha256(designBytes) },
    },
    {
      id: 'token-package-integrity',
      label: 'Bundled token outputs match the canonical token package manifest',
      status: 'PASS',
      evidence: { type: 'machine', method: 'manifest-hash-verification', ref: 'tokens/manifest.json#/files', sha256: sha256(tokenManifestBytes) },
    },
    {
      id: 'ui-package-integrity',
      label: 'Bundled UI outputs match the canonical UI package manifest',
      status: 'PASS',
      evidence: { type: 'machine', method: 'manifest-hash-verification', ref: 'ui/manifest.json#/files', sha256: sha256(uiManifestBytes) },
    },
    {
      id: 'approved-asset-integrity',
      label: 'Every bundled asset is approved and matches its governed asset record',
      status: 'PASS',
      evidence: { type: 'machine', method: 'manifest-hash-verification', ref: 'assets/manifest.json#/files', sha256: sha256(assetManifestBytes) },
    },
    ...authorityChecklist.map(([id, label]) => ({
      id,
      label,
      status: 'NOT VERIFIED',
      evidence: { type: 'authority-requirement', ref: authorityChecklistRef },
    })),
    {
      id: 'public-bilingual-readiness',
      label: 'Public English and Arabic optical parity and specialist review',
      status: 'NOT VERIFIED',
      evidence: { type: 'policy', ref: 'policies/bilingual.json#/release' },
    },
    {
      id: 'manual-visual-review',
      label: 'Rendered manual page-by-page visual comparison',
      status: 'NOT VERIFIED',
      evidence: { type: 'release-gate', ref: 'authority/DESIGN.md#release-checklist' },
    },
    {
      id: 'pdf-print-certification',
      label: 'PDF font embedding and page raster comparison',
      status: 'NOT VERIFIED',
      output: null,
      requires: ['selected-fonts-embedded', 'page-raster-comparison-pass'],
      evidence: { type: 'authority', ref: 'authority/DESIGN.md#release-checklist' },
    },
  ];
  const physicalIds = {
    finePrintContour: 'fine-print-sample',
    vinylContour: 'vinyl-sample',
    screenContour: 'screen-sample',
    aperturePrint: 'aperture-print-sample',
    apertureScreen: 'aperture-screen-sample',
  };
  for (const [minimum, id] of Object.entries(physicalIds)) {
    if (production.minimums[minimum]?.evidence !== 'NOT VERIFIED') throw new Error(`${minimum} must remain evidence-gated`);
    checks.push({
      id,
      label: `${minimum} physical or calibrated display sample`,
      status: 'NOT VERIFIED',
      evidence: { type: 'policy', ref: `policies/production.json#/minimums/${minimum}` },
    });
  }
  return {
    schemaVersion: 1,
    authorityChecklistRef,
    requiredGateIds,
    releaseStatus: deriveReleaseStatus(checks),
    statuses,
    checks,
  };
}

function mediaType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'text/javascript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (/\.jpe?g$/i.test(path)) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  if (/\.tiff?$/i.test(path)) return 'image/tiff';
  if (path.endsWith('.woff2')) return 'font/woff2';
  if (path.endsWith('.ttf')) return 'font/ttf';
  if (path.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

function assertLocalClosure(payload) {
  const markupPaths = [...payload.keys()].filter((path) => /\.(?:html|css|js)$/i.test(path));
  for (const path of markupPaths) {
    const source = payload.get(path).toString('utf8');
    if (/(?:https?:)?\/\//i.test(source) || /(?:src|href|data)\s*=\s*["']data:/i.test(source)) {
      throw new Error(`Open Design resource must remain local: ${path}`);
    }
    if (/object-fit:\s*cover|background-size:\s*cover/i.test(source)) throw new Error(`Open Design must not crop full-width media: ${path}`);
  }
  for (const path of markupPaths.filter((candidate) => candidate.endsWith('.html'))) {
    const source = payload.get(path).toString('utf8');
    for (const [, target] of source.matchAll(/(?:src|href|data)\s*=\s*["']([^"']+)["']/gi)) {
      if (target.startsWith('#')) continue;
      const clean = target.split(/[?#]/)[0];
      const resolved = posix.normalize(posix.join(posix.dirname(path), clean));
      if (!resolved.startsWith('generated/') || !payload.has(resolved)) throw new Error(`Open Design resource is unresolved: ${path} -> ${target}`);
    }
  }
}

export async function buildExpectedOpenDesign(rootUrl) {
  const payload = new Map();
  const copy = async (target, source) => payload.set(target, await readBytes(rootUrl, source));

  const [
    identity,
    authority,
    source,
    bilingual,
    production,
    provenance,
    tokenModel,
    tokenManifest,
    ui,
    uiManifest,
    assetManifest,
    publishableSourceManifest,
    provisionalManifest,
  ] = await Promise.all([
    readJson(rootUrl, 'brand/identity.json'),
    readJson(rootUrl, 'governance/authority.json'),
    readJson(rootUrl, 'extensions/astronomical-atlas/SOURCE.json'),
    readJson(rootUrl, 'policies/bilingual.json'),
    readJson(rootUrl, 'policies/production.json'),
    readJson(rootUrl, 'policies/provenance.json'),
    readJson(rootUrl, 'packages/tokens/generated/tokens.json'),
    readJson(rootUrl, 'packages/tokens/generated/manifest.json'),
    readJson(rootUrl, 'packages/ui/generated/contract.json'),
    readJson(rootUrl, 'packages/ui/generated/manifest.json'),
    readJson(rootUrl, 'packages/assets/generated/manifest.json'),
    readJson(rootUrl, 'brand/assets.json'),
    readJson(rootUrl, 'brand/provisional-assets.json'),
  ]);

  assertAssetManifestSeparation(publishableSourceManifest, provisionalManifest);
  await validateProvisionalAssets(rootUrl, provisionalManifest);

  await Promise.all([
    copy('generated/authority/BRAND.md', 'BRAND.md'),
    copy('generated/authority/DESIGN.md', 'extensions/astronomical-atlas/DESIGN.md'),
    copy('generated/authority/SOURCE.json', 'extensions/astronomical-atlas/SOURCE.json'),
    copy('generated/authority/authority.json', 'governance/authority.json'),
    copy('generated/authority/identity.json', 'brand/identity.json'),
    copy('generated/policies/bilingual.json', 'policies/bilingual.json'),
    copy('generated/policies/production.json', 'policies/production.json'),
    copy('generated/policies/provenance.json', 'policies/provenance.json'),
    copy('generated/tokens/manifest.json', 'packages/tokens/generated/manifest.json'),
    copy('generated/tokens/tokens.css', 'packages/tokens/generated/tokens.css'),
    copy('generated/tokens/tokens.json', 'packages/tokens/generated/tokens.json'),
    copy('generated/ui/components.css', 'packages/ui/generated/components.css'),
    copy('generated/ui/contract.json', 'packages/ui/generated/contract.json'),
    copy('generated/ui/manifest.json', 'packages/ui/generated/manifest.json'),
    copy('generated/ui/motion.css', 'packages/ui/generated/motion.css'),
    copy('generated/ui/rtl.css', 'packages/ui/generated/rtl.css'),
    copy('generated/assets/manifest.json', 'packages/assets/generated/manifest.json'),
    copy('generated/provisional/manifest.json', 'brand/provisional-assets.json'),
  ]);

  const designBytes = payload.get('generated/authority/DESIGN.md');
  if (sha256(designBytes) !== source.sources.design.sha256) throw new Error('Imported Astronomical Atlas authority hash mismatch');
  assertManifest(tokenManifest, '@bizarre/tokens', payload, 'generated/tokens/');
  assertManifest(uiManifest, '@bizarre/ui', payload, 'generated/ui/', 2);

  for (const [path, record] of Object.entries(assetManifest.files)) {
    if (record.approved !== true || record.approvalState !== 'approved' || !record.sourceProvenance || !Array.isArray(record.allowedUses) || record.allowedUses.length === 0) {
      throw new Error(`Open Design accepts approved governed assets only: ${path}`);
    }
    if (isProposalDerivative(path, record)) {
      throw new Error(`Proposal derivative is not publishable in Open Design: ${path}`);
    }
    const target = `generated/assets/${path.slice('generated/'.length)}`;
    const bytes = await readBytes(rootUrl, `packages/assets/${path}`);
    if (sha256(bytes) !== record.sha256) throw new Error(`Governed asset hash mismatch: ${path}`);
    payload.set(target, bytes);
  }
  assertManifest(assetManifest, '@bizarre/assets', payload, 'generated/assets/');

  for (const entry of provisionalManifest.assets) {
    const filename = entry.path.split('/').at(-1);
    const bytes = await readBytes(rootUrl, entry.path);
    if (sha256(bytes) !== entry.sha256) throw new Error(`Provisional asset hash mismatch: ${entry.path}`);
    payload.set(`generated/provisional/atlas/${filename}`, bytes);
  }

  const fixtureSource = await readFile(new URL('examples/identity-proof/index.html', rootUrl), 'utf8');
  const fixture = fixtureSource
    .replaceAll('../../packages/tokens/generated/', '../tokens/')
    .replaceAll('../../packages/assets/generated/', '../assets/')
    .replaceAll('../../packages/ui/generated/', '../ui/')
    .replaceAll('../../packages/atlas/generated/', '../provisional/atlas/')
    .replaceAll('CATCH THE STARS.</strong>', 'CATCH THE STARS</strong>')
    .replaceAll('>Catch the stars<', '>CATCH THE STARS<');
  payload.set('generated/fixture/index.html', text(fixture));
  await copy('generated/fixture/proof.js', 'examples/identity-proof/proof.js');

  const tokenRows = resolveTokenAliases(flattenTokens(tokenModel));
  const tokenPaths = tokenRows.map(({ path }) => path);
  const groups = [...new Set(tokenPaths.map((path) => path.split('.')[0]))].sort().map((name) => ({
    name,
    paths: tokenPaths.filter((path) => path.startsWith(`${name}.`)),
  }));
  payload.set('generated/manual/token-tree.json', text(canonicalJson({
    schemaVersion: 1,
    sourceManifestSha256: sha256(payload.get('generated/tokens/manifest.json')),
    groups,
    paths: tokenPaths,
  })));

  const atlasSvg = payload.get('generated/provisional/atlas/atlas-contours-dark.svg').toString('utf8');
  const atlasMetadata = extractAtlasMetadata(atlasSvg);
  const evidence = createEvidence({
    assetManifestBytes: payload.get('generated/assets/manifest.json'),
    designBytes,
    production,
    provenance,
    tokenManifestBytes: payload.get('generated/tokens/manifest.json'),
    uiManifestBytes: payload.get('generated/ui/manifest.json'),
  });
  payload.set('generated/release/evidence.json', text(canonicalJson(evidence)));

  const context = { assetManifest, atlasMetadata, authority, bilingual, evidence, identity, production, provisionalManifest, source, tokenRows, ui };
  const pageBodies = createPageBodies(context, '../../');
  for (const [slug, title] of PAGE_ORDER) {
    const ledes = {
      'precision-panel': 'A calibrated, metadata-first composition for operational and technical surfaces.',
      textures: 'The same physical field expressed through governed representation families.',
      aperture: 'The fixed absence that makes every Atlas application recognizable.',
      motion: 'Capture turns approach into a held, accessible final state.',
      poster: 'Display Field carries recognition at distance without sacrificing the governed signal.',
      components: 'Existing accessible primitives wrapped in Bizarre states and composition.',
      bilingual: 'English and Arabic share semantic priority while physical coordinates preserve direction.',
      production: 'Minimums and material profiles remain claims only after real evidence exists.',
      governance: 'Authority, override precedence, and the narrow invariant boundary.',
      evidence: 'An honest release ledger with machine references and explicit unknowns.',
    };
    payload.set(`generated/manual/pages/${slug}.html`, text(manualPage({ slug, title, lede: ledes[slug], body: pageBodies[slug] })));
  }
  payload.set('generated/manual/manual.css', text(MANUAL_CSS));

  const manualIndex = `${pageHead({ title: 'Open Design Manual', resourcePrefix: '../', manualCss: './manual.css' })}
<body data-bzr-ui>
  <main class="manual-shell">
    <article class="manual-page">
      <header class="manual-page-header"><p class="manual-eyebrow">Bizarre Industries / Open Design / PRIVATE WORKING BUNDLE</p><h1>${escapeHtml(identity.companyName)}</h1><p class="manual-lede">${escapeHtml(identity.tagline)} — ${escapeHtml(identity.taglineMeaning)}. This nonpublishable working manual combines canonical authority, tokens, UI contracts, approved assets, release evidence, and explicitly isolated provisional Atlas references.</p></header>
      <div class="manual-index-grid">${PAGE_ORDER.map(([slug, title]) => `<a href="./pages/${slug}.html">${escapeHtml(title)}</a>`).join('')}</div>
      <div class="manual-callout"><h2>Portable sources</h2><p><a href="../preview/index.html">Open preview</a> · <a href="../fixture/index.html">Open interactive fixture</a> · <a href="../authority/DESIGN.md">Read exact Atlas authority</a> · <a href="./token-tree.json">Inspect manifest-derived token tree</a></p></div>
    </article>
  </main>
</body>
</html>
`;
  payload.set('generated/manual/index.html', text(manualIndex));

  const printBodies = createPageBodies(context, '../');
  const print = `${pageHead({ title: 'Open Design Manual — Print Source', resourcePrefix: '../', manualCss: './manual.css' })}
<body data-bzr-ui>
  <main class="manual-shell">
    <header class="manual-page-header"><p class="manual-eyebrow">Bizarre Industries / Open Design / PRIVATE WORKING BUNDLE</p><h1>Provisional HTML review source</h1><p class="manual-lede">This source is nonpublishable while the owner-selected Continuous Lens Aperture v2 remains governed-provisional. No PDF is emitted until numerical geometry and production evidence are approved, selected fonts are embedded, and page raster comparison passes.</p></header>
    ${PAGE_ORDER.map(([slug, title]) => `<article class="manual-page" data-manual-page="${slug}"><header class="manual-page-header"><p class="manual-eyebrow">Astronomical Atlas / ${escapeHtml(title)}</p><h1>${escapeHtml(title)}</h1></header>${printBodies[slug]}</article>`).join('\n')}
  </main>
</body>
</html>
`;
  payload.set('generated/manual/print.html', text(print));

  const preview = `${pageHead({ title: 'Astronomical Atlas Preview', resourcePrefix: '../', manualCss: '../manual/manual.css' })}
<body data-bzr-ui>
  <main class="manual-shell">
    <article class="manual-poster" data-bzr-layout="display-field">
      <header data-bzr-component="calibration-label" data-state="active"><span>Bizarre Industries / Astronomical Atlas</span><span>Open Design / ${escapeHtml(evidence.releaseStatus)}</span></header>
      <img src="../provisional/atlas/atlas-spectral.svg" alt="Provisional synthetic Astronomical Atlas spectral field">
      <div class="manual-poster-copy"><p>${escapeHtml(identity.companyName)}</p><h1>${escapeHtml(identity.tagline)}</h1><p>${escapeHtml(identity.taglineMeaning)}</p></div>
      <footer>BEND → ABSENCE → SIGNAL</footer>
    </article>
    <nav class="manual-nav" aria-label="Preview links"><a href="../manual/index.html">Manual</a><a href="../fixture/index.html">Interactive fixture</a><a href="../release/evidence.json">Evidence report</a><a href="../authority/DESIGN.md">Exact authority</a></nav>
  </main>
</body>
</html>
`;
  payload.set('generated/preview/index.html', text(preview));

  assertLocalClosure(payload);
  const tokenCopies = [...payload.keys()].filter((path) => path.endsWith('/tokens.css') || path.endsWith('/tokens.json'));
  if (tokenCopies.length !== 2) throw new Error('Open Design must contain exactly one CSS token copy and one JSON token copy');

  const files = Object.fromEntries([...payload].sort(([left], [right]) => comparePaths(left, right)).map(([path, bytes]) => [path, {
    mediaType: mediaType(path),
    sha256: sha256(bytes),
  }]));
  payload.set('generated/manifest.json', text(canonicalJson({
    schemaVersion: 1,
    package: '@bizarre/open-design',
    publicationStatus: 'nonpublishable',
    provisionalAssets: {
      path: 'generated/provisional/manifest.json',
      status: 'PROVISIONAL v1',
    },
    authority: {
      path: 'generated/authority/DESIGN.md',
      sha256: sha256(designBytes),
    },
    exclusions: [
      'proposal-compiled-css',
      'proposal-generated-mockups',
      'proposal-pdf',
    ],
    releaseEvidence: {
      path: 'generated/release/evidence.json',
      status: evidence.releaseStatus,
    },
    files,
  })));
  return new Map([...payload].sort(([left], [right]) => comparePaths(left, right)));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const rootUrl = new URL('../', import.meta.url);
  const { writePackage } = await import('./lib/package-writer.mjs');
  await writePackage(new URL('../packages/open-design/', import.meta.url), await buildExpectedOpenDesign(rootUrl));
}
