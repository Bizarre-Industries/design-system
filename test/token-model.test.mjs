import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadTokenModel, flattenTokens } from '../scripts/lib/token-model.mjs';

const root = new URL('../', import.meta.url);

test('loads Signal Lime as the sole brand accent', async () => {
  const model = await loadTokenModel(root);
  assert.equal(model.brand.brand.accent.signal.$type, 'color');
  assert.deepEqual(model.brand.brand.accent.signal.$value, {
    colorSpace: 'srgb',
    components: [0.7764705882, 1, 0.1411764706],
    alpha: 1,
    hex: '#C6FF24'
  });
  assert.deepEqual(Object.keys(model.brand.brand.accent), ['signal']);
});

test('defines the five canonical modes and required theme order', async () => {
  const model = await loadTokenModel(root);
  assert.deepEqual(model.modes.$extensions['industries.bizarre'].themeOrder, ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']);
  assert.deepEqual(Object.keys(model.modes.modes).sort(), ['bone', 'paper', 'void', 'void-hicontrast', 'workshop'].sort());
});

test('flattens typed tokens in stable path order', async () => {
  const rows = flattenTokens(await loadTokenModel(root));
  assert.ok(rows.length >= 11);
  assert.deepEqual(rows.map(({ path }) => path), rows.map(({ path }) => path).sort());
  assert.ok(rows.every(({ type }) => type === 'color'));
});

test('inherits the nearest group type', () => {
  const rows = flattenTokens({ document: { palette: { $type: 'color', ink: { $value: '#000' } } } });
  assert.deepEqual(rows, [{ path: 'palette.ink', type: 'color', value: '#000' }]);
});

test('uses a token-local type instead of its containing group type', () => {
  const rows = flattenTokens({
    document: {
      scale: {
        $type: 'dimension',
        compact: { $type: 'number', $value: 0.75 }
      }
    }
  });
  assert.deepEqual(rows, [{ path: 'scale.compact', type: 'number', value: 0.75 }]);
});

test('flattens DTCG root tokens at their containing group path', () => {
  const rows = flattenTokens({
    document: {
      $type: 'color',
      $root: { $value: 'document-root' },
      palette: {
        $root: { $value: 'palette-root' },
        ink: { $value: 'ink' }
      }
    }
  });
  assert.deepEqual(rows, [
    { path: '$root', type: 'color', value: 'document-root' },
    { path: 'palette', type: 'color', value: 'palette-root' },
    { path: 'palette.ink', type: 'color', value: 'ink' }
  ]);
});

test('sorts flattened paths by raw UTF-16 code units', () => {
  const token = (value) => ({ $type: 'color', $value: value });
  const rows = flattenTokens({
    document: {
      'é': token('é'),
      'a!': token('a!'),
      '中': token('中'),
      a: token('a'),
      A: token('A')
    }
  });
  assert.deepEqual(rows.map(({ path }) => path), ['A', 'a', 'a!', 'é', '中']);
});

test('rejects untyped tokens', () => {
  assert.throws(
    () => flattenTokens({ document: { token: { $value: 1 } } }),
    /Untyped token at token/
  );
});

test('rejects malformed token and group structures', () => {
  assert.throws(
    () => flattenTokens({ document: { token: { $type: 'color', $value: '#000', child: { $value: '#fff' } } } }),
    /Token at token cannot contain child groups or tokens/
  );
  assert.throws(
    () => flattenTokens({ document: { group: [] } }),
    /Invalid group at group/
  );
});

test('rejects duplicate flattened paths across documents', () => {
  const token = { $type: 'color', $value: '#000' };
  assert.throws(
    () => flattenTokens({ first: { shared: token }, second: { shared: token } }),
    /Duplicate token path: shared/
  );
});

test('loadTokenModel validates source documents', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'token-model-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'tokens', 'source'), { recursive: true });
  await writeFile(join(directory, 'tokens', 'source', 'brand.tokens.json'), JSON.stringify({ brand: { accent: { signal: { $value: '#fff' } } } }));
  await writeFile(join(directory, 'tokens', 'source', 'modes.tokens.json'), JSON.stringify({ modes: {} }));

  await assert.rejects(loadTokenModel(pathToFileURL(`${directory}/`)), /Untyped token at brand\.accent\.signal/);
});
