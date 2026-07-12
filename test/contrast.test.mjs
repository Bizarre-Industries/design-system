import assert from 'node:assert/strict';
import test from 'node:test';
import { contrastRatio, validateContrastPairs } from '../scripts/lib/contrast.mjs';

const color = (hex) => ({ type: 'color', value: hex, resolvedValue: hex });

test('computes WCAG contrast ratios from sRGB colors', () => {
  assert.equal(contrastRatio('#1F1F1F', '#F9F8F2').toFixed(2), '15.49');
  assert.equal(contrastRatio('#C6FF24', '#F9F8F2').toFixed(2), '1.11');
});

test('rejects a declared semantic pair below its threshold', () => {
  const failingModel = {
    rows: new Map([
      ['modes.paper.content.accent', color('#C6FF24')],
      ['modes.paper.surface.canvas', color('#F9F8F2')]
    ]),
    pairs: [{ foreground: 'modes.paper.content.accent', background: 'modes.paper.surface.canvas', threshold: 4.5 }]
  };

  assert.throws(() => validateContrastPairs(failingModel), /modes\.paper\.content\.accent.*modes\.paper\.surface\.canvas.*1\.11.*4\.5/);
});

test('accepts declared semantic pairs at or above their thresholds', () => {
  const passingModel = {
    rows: new Map([
      ['modes.paper.content.primary', color('#1F1F1F')],
      ['modes.paper.surface.canvas', color('#F9F8F2')]
    ]),
    pairs: [{ foreground: 'modes.paper.content.primary', background: 'modes.paper.surface.canvas', threshold: 4.5 }]
  };

  assert.doesNotThrow(() => validateContrastPairs(passingModel));
});
