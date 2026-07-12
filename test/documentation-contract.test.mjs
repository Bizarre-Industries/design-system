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

  assert.equal(identity.tagline, 'CATCH THE STARS');
  assert.doesNotMatch(brand, /CATCH THE STARS[.!?]/);
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
  assert.doesNotMatch(brand, /(?:single|two) sources? of truth/i);
  assert.doesNotMatch(brand, /tokens\/tokens\.css|See `tokens\.css`/);
  assert.doesNotMatch(brand, /ten rings|10 rings/i);
  assert.doesNotMatch(brand, /hosted on Google Fonts/i);
});
