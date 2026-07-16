import assert from 'node:assert/strict';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function buildEvidence() {
  const { buildExpectedOpenDesign } = await import('../scripts/build-open-design.mjs');
  const files = await buildExpectedOpenDesign(root);
  return { files, report: JSON.parse(files.get('generated/release/evidence.json')) };
}

function resolvePointer(value, fragment) {
  if (!fragment.startsWith('/')) return undefined;
  return fragment.slice(1).split('/').reduce((current, segment) => current?.[segment.replaceAll('~1', '/').replaceAll('~0', '~')], value);
}

function markdownAnchors(source) {
  return new Set([...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')));
}

test('release evidence uses only governed statuses and requires resolvable evidence for PASS', async () => {
  const { files, report } = await buildEvidence();
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.releaseStatus, 'NOT VERIFIED');
  assert.deepEqual(report.statuses, ['PASS', 'FAIL', 'NOT VERIFIED']);
  assert.ok(report.checks.length >= 8);
  assert.deepEqual(
    report.checks.filter(({ status }) => status === 'PASS').map(({ id }) => id).sort(),
    ['approved-asset-integrity', 'authority-integrity', 'token-package-integrity', 'ui-package-integrity'],
  );
  for (const check of report.checks) {
    assert.ok(report.statuses.includes(check.status), check.id);
    assert.ok(check.evidence?.ref, `${check.id} requires an evidence reference`);
    const evidencePath = `generated/${check.evidence.ref.split('#')[0]}`;
    assert.ok(files.has(evidencePath), `${check.id} evidence must resolve to ${evidencePath}`);
    const fragment = check.evidence.ref.split('#')[1];
    if (fragment && evidencePath.endsWith('.json')) {
      assert.notEqual(resolvePointer(JSON.parse(files.get(evidencePath)), fragment), undefined, `${check.id} JSON pointer must resolve`);
    }
    if (fragment && evidencePath.endsWith('.md')) {
      assert.ok(markdownAnchors(files.get(evidencePath).toString('utf8')).has(fragment), `${check.id} Markdown anchor must resolve`);
    }
    if (check.status === 'PASS') {
      assert.equal(check.evidence.type, 'machine');
      assert.match(check.evidence.sha256, /^[a-f0-9]{64}$/);
      assert.ok(['sha256-match', 'manifest-hash-verification'].includes(check.evidence.method));
      assert.notEqual(check.evidence.method, 'self-declared');
    }
  }
});

test('release evidence covers every authoritative Atlas checklist gate and gives FAIL precedence', async () => {
  const { deriveReleaseStatus } = await import('../scripts/build-open-design.mjs');
  const { report } = await buildEvidence();
  const authoritativeGateIds = [
    'gravity-well-integrity',
    'signal-salience',
    'spectrum-mapping',
    'aperture-geometry',
    'far-monochrome-recognition',
    'singular-lime-trajectory',
    'metadata-provenance',
    'bilingual-optical-parity',
    'interaction-accessibility',
    'production-fine-lines',
    'material-function',
    'credible-mockups',
  ];

  assert.equal(report.authorityChecklistRef, 'authority/DESIGN.md#release-checklist');
  assert.deepEqual(report.requiredGateIds, authoritativeGateIds);
  const byId = new Map(report.checks.map((check) => [check.id, check]));
  for (const id of authoritativeGateIds) {
    assert.ok(byId.has(id), `${id} must be represented in the release ledger`);
    assert.equal(byId.get(id).status, 'NOT VERIFIED', `${id} has no qualifying release evidence yet`);
  }

  assert.equal(deriveReleaseStatus([]), 'NOT VERIFIED');
  assert.equal(deriveReleaseStatus([{ status: 'PASS' }]), 'PASS');
  assert.equal(deriveReleaseStatus([{ status: 'PASS' }, { status: 'NOT VERIFIED' }]), 'NOT VERIFIED');
  assert.equal(deriveReleaseStatus([{ status: 'PASS' }, { status: 'FAIL' }, { status: 'NOT VERIFIED' }]), 'FAIL');
});

test('PDF, bilingual shipping, visual review, and every physical sample remain evidence-gated', async () => {
  const { files, report } = await buildEvidence();
  const byId = new Map(report.checks.map((check) => [check.id, check]));
  for (const id of [
    'pdf-print-certification',
    'public-bilingual-readiness',
    'manual-visual-review',
    'fine-print-sample',
    'vinyl-sample',
    'screen-sample',
    'aperture-print-sample',
    'aperture-screen-sample',
  ]) {
    assert.equal(byId.get(id)?.status, 'NOT VERIFIED', id);
  }
  assert.equal(byId.get('pdf-print-certification').output, null);
  assert.deepEqual(byId.get('pdf-print-certification').requires, [
    'selected-fonts-embedded',
    'page-raster-comparison-pass',
  ]);
  assert.ok([...files.keys()].every((path) => !path.endsWith('.pdf')));

  const production = JSON.parse(files.get('generated/policies/production.json'));
  for (const [name, minimum] of Object.entries(production.minimums)) {
    assert.equal(minimum.evidence, 'NOT VERIFIED', name);
  }
  const bilingual = JSON.parse(files.get('generated/policies/bilingual.json'));
  assert.equal(bilingual.release.publicReady, false);
});

test('the generated governance manual preserves only the two true invariants', async () => {
  const { files } = await buildEvidence();
  const brand = files.get('generated/authority/BRAND.md').toString('utf8');
  const governance = files.get('generated/manual/pages/governance.html').toString('utf8');
  assert.match(brand, /Two things are non-negotiable: the exact `Bizarre Industries` name and the approved Gravity Well geometry/);
  assert.match(brand, /Three things you never break in this governed version:/);
  assert.doesNotMatch(brand, /(?:tagline|slogan|fonts?|typography|themes?|layout modes?)[^.\n]*(?:permanent|immutable|non-negotiable)/i);
  assert.match(governance, /only[^.]*Bizarre Industries[^.]*Gravity Well geometry[^.]*non-negotiable/i);
  assert.match(governance, /CATCH THE STARS[^.]*current governed tagline/i);
});

test('brand guidance consumes current tokens and reconciles Atlas gradient and bilingual overrides', async () => {
  const { files } = await buildEvidence();
  const brand = files.get('generated/authority/BRAND.md').toString('utf8');
  const tokens = files.get('generated/tokens/tokens.css').toString('utf8');
  const declaredTokens = new Set([...tokens.matchAll(/^\s*(--bzr-[\w-]+)\s*:/gm)].map(([, name]) => name));
  const referencedTokens = new Set([...brand.matchAll(/`(--bzr-[\w-]+)`/g)].map(([, name]) => name));
  for (const name of referencedTokens) assert.ok(declaredTokens.has(name), `${name} must resolve in canonical tokens.css`);

  const colors = brand.match(/## 4\. Colors[\s\S]+?(?=\n## 5\.)/)?.[0] ?? '';
  assert.doesNotMatch(colors, /#[\dA-F]{6,8}/i, 'brand color guidance must not duplicate canonical token values');
  assert.match(colors, /gradients?[^.]*permitted[^.]*data[^.]*material/i);
  assert.match(colors, /(?:approved mark|logo)[^.]*gradient|gradient[^.]*(?:approved mark|logo)/i);
  assert.match(colors, /Signal Lime[^.]*(?:never|must not)[^.]*grad/i);

  const typeRules = brand.match(/## 5\. Type[\s\S]+?### Rules\n\n([\s\S]+?)(?=\n---)/)?.[1] ?? '';
  assert.doesNotMatch(typeRules, /slogan is always|no exceptions/i);

  const bilingual = brand.match(/## 10\. Arabic and multi-language[\s\S]+?(?=\n## 11\.)/)?.[0] ?? '';
  assert.match(bilingual, /Noto Sans Arabic/);
  assert.match(bilingual, /Noto Sans Arabic UI/);
  assert.match(bilingual, /Noto Sans Arabic Condensed[^.\n]*800/);
  assert.match(bilingual, /NOT VERIFIED/);
  assert.match(bilingual, /native Arabic review/i);
  assert.doesNotMatch(bilingual, /translates well/i);
});
