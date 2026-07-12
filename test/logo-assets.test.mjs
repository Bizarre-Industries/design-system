import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { inspectMarkSvg } from '../scripts/lib/svg-contract.mjs';

const expectedViewBox = '261.29998779296875 253.89999389648438 506.89996337890625 506.8000183105469';
const assetPaths = {
  primary: new URL('../packages/assets/logo/mark-primary.svg', import.meta.url),
  inverse: new URL('../packages/assets/logo/mark-inverse.svg', import.meta.url),
  transparent: new URL('../packages/assets/logo/mark-transparent.svg', import.meta.url),
};
const sourcePaths = [
  new URL('../logo/source/original-lockup.svg', import.meta.url),
  new URL('../logo/source/transparent-lockup.svg', import.meta.url),
];

async function inspect(url) {
  return inspectMarkSvg(await readFile(url, 'utf8'));
}

test('published marks are square mark-only SVGs', async () => {
  for (const [name, url] of Object.entries(assetPaths)) {
    const mark = await inspect(url);
    assert.equal(mark.hasTextLockup, false, `${name} contains lockup text`);
    assert.equal(mark.viewBox, expectedViewBox, `${name} has the wrong crop`);
  }
});

test('published variants preserve identical gravity-well paths', async () => {
  const primary = await inspect(assetPaths.primary);
  const inverse = await inspect(assetPaths.inverse);
  const transparent = await inspect(assetPaths.transparent);

  assert.deepEqual(inverse.pathData, primary.pathData);
  assert.deepEqual(transparent.pathData, primary.pathData);
  for (const sourcePath of sourcePaths) {
    const source = await inspect(sourcePath);
    assert.deepEqual(primary.pathData, source.pathData);
  }
});

test('published variants use the governed colors', async () => {
  const primary = await inspect(assetPaths.primary);
  const inverse = await inspect(assetPaths.inverse);

  assert.ok(primary.fills.includes('#545454'));
  assert.ok(primary.fills.includes('#C6FF24'));
  assert.ok(inverse.fills.includes('#0E0E0E'));
  assert.ok(inverse.fills.includes('#C6FF24'));
});
