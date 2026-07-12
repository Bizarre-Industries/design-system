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
