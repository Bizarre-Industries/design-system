import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('foundation audit reports limits and next milestone order', async () => {
  const audit = await readFile(new URL('../docs/foundation-audit.md', import.meta.url), 'utf8');
  const next = await readFile(new URL('../docs/next-milestones.md', import.meta.url), 'utf8');
  assert.match(audit, /does not claim.*complete design system/i);
  assert.match(audit, /allowlisted evidence/i);
  const milestones = [...next.matchAll(/^(\d+)\. (.+)$/gm)].map(([, number, title]) => ({ number: Number(number), title }));
  assert.deepEqual(milestones, [
    'Identity refinement and production asset system.',
    'Semantic token architecture and proportional typography selection.',
    'Web foundation and Bizarre Mission Control.',
    'BizarreUI and Bizarre Field Unit for Apple platforms.',
    'Android Compose overlay and Bizarre Field Unit parity.',
    'Desktop, Qt, LVGL, embedded, hardware, and Bizarre Instrument.',
    'Graphics, motion, sonic, and media identity.',
    'Downstream `themes` migration and compatibility release.',
    'Cross-platform certification and public v1 release.'
  ].map((title, index) => ({ number: index + 1, title })));
});

test('brand book follows the governed identity and package contracts', async () => {
  const brand = await readFile(new URL('../BRAND.md', import.meta.url), 'utf8');
  const identity = JSON.parse(await readFile(new URL('../brand/identity.json', import.meta.url), 'utf8'));
  const assets = JSON.parse(await readFile(new URL('../brand/assets.json', import.meta.url), 'utf8'));

  assert.equal(identity.tagline, 'CATCH THE STARS');
  const sloganOccurrences = [...brand.matchAll(/catch the stars[.!?]?/gi)].map(([occurrence]) => occurrence);
  assert.ok(sloganOccurrences.length > 0, 'brand book must name the governed slogan');
  assert.deepEqual(
    sloganOccurrences,
    sloganOccurrences.map(() => identity.tagline),
    'every slogan occurrence must use exact casing and no trailing punctuation'
  );
  assert.match(brand, /Bizarre Industries.*top-level movement\/foundation identity/i);
  assert.match(brand, /Bizarre Labs.*commercial arm/i);
  assert.match(brand, /Bizarre Foundation.*governing nonprofit/i);
  assert.match(brand, /Helling.*product under Labs/i);
  assert.match(brand, /Precision Panel/);
  assert.match(brand, /Display Field/);
  assert.match(brand, /never a formal logo\/wordmark lockup/i);
  assert.match(brand, /independent closing or ceremonial element/i);
  assert.match(brand, /packages\/tokens\/generated\/tokens\.css/);
  assert.match(brand, /packages\/assets\/generated\/manifest\.json/);
  const approvedLogoVariants = assets.assets
    .filter(({ kind, approved, approvalState }) => kind === 'logo' && approved && approvalState === 'approved')
    .map(({ variant }) => variant)
    .sort();
  assert.deepEqual(approvedLogoVariants, ['inverse', 'primary', 'transparent']);

  const foundationalRules = brand.match(/Three things you never break[\s\S]+?Everything below is the longer explanation\./)?.[0] ?? '';
  assert.match(foundationalRules, /approved primary, inverse, and transparent treatments/i);
  assert.match(foundationalRules, /Signal Lime, Void, and Void Gray/);

  if (!approvedLogoVariants.some((variant) => /mono/i.test(variant))) {
    assert.doesNotMatch(
      foundationalRules,
      /(?:mark|variant|treatment)[^.\n]*(?:appears?|uses?|approved|available)[^.\n]*monochrome/i,
      'foundational rules must not authorize monochrome without an approved monochrome asset'
    );
    const variantGuidance = brand.match(/### Variants[\s\S]+?(?=\n### )/)?.[0] ?? '';
    const currentVariantProse = variantGuidance
      .split('\n')
      .filter((line) => !/(?:deferred|unavailable|do not)/i.test(line))
      .join('\n');
    assert.doesNotMatch(
      currentVariantProse,
      /monochrome/i,
      'current variant guidance must not authorize monochrome without an approved monochrome asset'
    );
  }
  assert.doesNotMatch(brand, /(?:single|two) sources? of truth/i);
  assert.doesNotMatch(brand, /tokens\/tokens\.css|See `tokens\.css`/);
  assert.doesNotMatch(brand, /ten rings|10 rings/i);
  assert.doesNotMatch(brand, /hosted on Google Fonts/i);
});
