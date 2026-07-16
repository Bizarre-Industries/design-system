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

function fillOf(tag) {
  return tag.match(/\bfill=["'](#[0-9a-f]{6})["']/i)?.[1].toUpperCase()
    ?? tag.match(/\bfill\s*:\s*(#[0-9a-f]{6})/i)?.[1].toUpperCase()
    ?? null;
}

async function colorAssignments(url) {
  const text = await readFile(url, 'utf8');
  const rectFills = [...text.matchAll(/<rect\b[^>]*>/gi)].map(([tag]) => fillOf(tag));
  const pathFills = [...text.matchAll(/<path\b[^>]*>/gi)]
    .map(([tag]) => fillOf(tag))
    .filter((fill) => fill !== null);

  return { text, rectFills, pathFills };
}

test('published marks are square mark-only SVGs', async () => {
  for (const [name, url] of Object.entries(assetPaths)) {
    const mark = await inspect(url);
    assert.equal(mark.hasTextLockup, false, `${name} contains lockup text`);
    assert.equal(mark.viewBox, expectedViewBox, `${name} has the wrong crop`);
    const text = await readFile(url, 'utf8');
    assert.equal((text.match(/<svg\b/g) ?? []).length, 1, `${name} must not inset the mark in a nested SVG viewport`);
    assert.doesNotMatch(text, /<svg\b[^>]*\b(?:x|y|width|height)=/i, `${name} must use the shared root crop without a scaled child viewport`);
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
  const primary = await colorAssignments(assetPaths.primary);
  const inverse = await colorAssignments(assetPaths.inverse);
  const transparent = await colorAssignments(assetPaths.transparent);

  assert.deepEqual(primary.rectFills, ['#C6FF24']);
  assert.ok(primary.pathFills.length > 0);
  assert.ok(primary.pathFills.every((fill) => fill === '#0E0E0E'));

  assert.deepEqual(inverse.rectFills, ['#0E0E0E']);
  assert.ok(inverse.pathFills.length > 0);
  assert.ok(inverse.pathFills.every((fill) => fill === '#C6FF24'));

  assert.deepEqual(transparent.rectFills, []);
  assert.ok(transparent.pathFills.length > 0);
  assert.ok(transparent.pathFills.every((fill) => fill === '#0E0E0E'));
  for (const variant of [primary, inverse, transparent]) {
    assert.equal(new Set(variant.pathFills).size, 1, 'Gravity Well figure must be monochrome');
  }
});

test('published SVGs contain real newlines rather than escaped newline text', async () => {
  for (const [name, url] of Object.entries(assetPaths)) {
    const { text } = await colorAssignments(url);
    assert.equal(text.includes('\\n'), false, `${name} contains literal \\n text`);
    assert.match(text, /\n/);
  }
});
