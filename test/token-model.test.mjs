import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadTokenModel, flattenTokens, resolveTokenAliases } from '../scripts/lib/token-model.mjs';

const root = new URL('../', import.meta.url);

test('loads Signal Lime as the sole brand accent', async () => {
  const model = await loadTokenModel(root);
  assert.equal(model.brand.brand.accent.signal.$type, 'color');
  assert.equal(model.brand.brand.accent.signal.$value, '{color.accent.signal}');
  assert.equal(model.palette.color.accent.signal.$value.hex, '#C6FF24');
  assert.deepEqual(Object.keys(model.brand.brand.accent), ['signal']);
});

test('defines the five canonical modes and required theme order', async () => {
  const model = await loadTokenModel(root);
  assert.deepEqual(model.modes.$extensions['industries.bizarre'].themeOrder, ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']);
  assert.deepEqual(Object.keys(model.modes.modes).sort(), ['bone', 'paper', 'void', 'void-hicontrast', 'workshop'].sort());
});

test('defines identical semantic role paths across every mode', async () => {
  const model = await loadTokenModel(root);
  const paths = (theme) => flattenTokens({ theme: model.modes.modes[theme] }).map(({ path }) => path);
  const [first, ...rest] = model.modes.$extensions['industries.bizarre'].themeOrder;
  for (const theme of rest) assert.deepEqual(paths(theme), paths(first), `${theme} role parity`);
});

test('governs surface and content roles for every action state in every mode', async () => {
  const model = await loadTokenModel(root);
  const states = ['default', 'hover', 'active', 'disabled'];
  for (const theme of model.modes.$extensions['industries.bizarre'].themeOrder) {
    for (const state of states) {
      assert.ok(model.modes.modes[theme].action[state].surface, `${theme}.${state}.surface`);
      assert.ok(model.modes.modes[theme].action[state].content, `${theme}.${state}.content`);
    }
  }
  const pairs = model.modes.$extensions['industries.bizarre'].contrastPairs;
  for (const state of states) {
    assert.ok(pairs.some(({ foreground, background, threshold }) =>
      foreground === `action.${state}.content`
      && background === `action.${state}.surface`
      && threshold === 4.5), `missing action.${state} contrast pair`);
  }
  assert.ok(pairs.some(({ foreground, background, threshold }) =>
    foreground === 'focus.ring' && background === 'surface.canvas' && threshold === 3), 'missing adaptive focus contrast pair');
  assert.equal(model.modes.modes.paper.focus.ring.$value, '{color.accent.ink}');
  assert.equal(model.modes.modes.bone.focus.ring.$value, '{color.accent.ink}');
  assert.equal(model.modes.modes.void.focus.ring.$value, '{color.accent.signal}');
});

test('loads the canonical Astronomical Atlas extension values', async () => {
  const model = await loadTokenModel(root);
  assert.equal(model.atlas.$schema, undefined, 'token sources must not claim an HTML document as a JSON Schema');
  assert.deepEqual(model.atlas.$extensions['industries.bizarre'].orientationFamily, [-38, -18, 18, 38]);
  assert.equal(model.atlas.$extensions['industries.bizarre'].trajectoryCount, 1);
  assert.deepEqual(model.atlas.$extensions['industries.bizarre'].recognitionGrammar, ['bend', 'absence', 'signal']);
  assert.equal(model.atlas.atlas.mass.x.$value, 0.69);
  assert.equal(model.atlas.atlas.mass.y.$value, 0.53);
  assert.equal(model.atlas.atlas['compression-exponent'].$value, 1.72);
  assert.equal(model.atlas.atlas['major-interval'].$value, 5);
  assert.deepEqual(model.atlas.atlas.line.minor.$value, { value: 1, unit: 'px' });
  assert.deepEqual(model.atlas.atlas.line.major.$value, { value: 4, unit: 'px' });
  assert.deepEqual(model.atlas.atlas.line.band.$value, { value: 14, unit: 'px' });
  assert.equal(model.atlas.atlas.orientation.a.$value, -38);
  assert.equal(model.atlas.atlas.orientation.b.$value, -18);
  assert.equal(model.atlas.atlas.orientation.c.$value, 18);
  assert.equal(model.atlas.atlas.orientation.d.$value, 38);
  assert.equal(model.atlas.aperture.ratio.$value, 1.618);
  assert.equal(model.atlas.aperture['tangent-continuity'].$type, 'boolean');
  assert.equal(model.atlas.aperture['tangent-continuity'].$value, true);
  assert.match(model.atlas.aperture['tangent-continuity'].$description, /tangent-continuous/i);
  assert.doesNotMatch(JSON.stringify(model.atlas.aperture), /(?:^|[.\s"-])notch(?:[.\s"-]|$)/iu);
  assert.equal(model.atlas.aperture.offset.$value, 0.07);
  assert.deepEqual(model.atlas.aperture['reveal-depth'].$value, { value: 4, unit: 'px' });
});

test('keeps Atlas spectrum and materials outside the brand accent namespace', async () => {
  const model = await loadTokenModel(root);
  assert.equal(model.material.$schema, undefined, 'token sources must not claim an HTML document as a JSON Schema');
  assert.deepEqual(Object.keys(model.brand.brand.accent), ['signal']);
  assert.deepEqual(Object.keys(model.palette.color.spectrum), [
    'deep-indigo', 'electric-blue', 'ion-cyan', 'oxidized-teal',
    'solar-gold', 'amber', 'crimson', 'violet-shadow'
  ]);
  assert.equal(model.material.material['signal-spot'].$value, '{color.accent.signal}');
});

test('defines continuous capture phases and real reduced-motion duration targets', async () => {
  const model = await loadTokenModel(root);
  assert.equal(model.capture.$schema, undefined, 'token sources must not claim an HTML document as a JSON Schema');
  assert.equal(model.capture.$extensions['industries.bizarre'].reducedMotionState, 'captured');
  assert.equal(model.capture.capture.duration['fast-min'].$value, '{motion.duration.mid}');
  assert.equal(model.capture.capture.duration['fast-max'].$value, '{motion.duration.slow}');
  assert.equal(model.capture.capture.duration.ceremonial.$value, '{motion.duration.epic}');
  assert.deepEqual(model.capture.capture.duration.installation.$value, { value: 2400, unit: 'ms' });
  const phases = ['approach', 'compress', 'eclipse', 'lock', 'release'];
  let previousEnd = 0;
  for (const phase of phases) {
    const { start, end } = model.capture.capture.phase[phase];
    assert.equal(start.$value, previousEnd, `${phase} must start at the previous phase end`);
    assert.ok(end.$value > start.$value, `${phase} must have positive duration`);
    previousEnd = end.$value;
  }
  assert.equal(previousEnd, 1);
});

test('rejects non-standard DTCG dimensions and durations', () => {
  assert.throws(() => flattenTokens({ invalid: {
    angle: { $type: 'dimension', $value: { value: 38, unit: 'deg' } }
  } }), /finite px or rem/);
  assert.throws(() => flattenTokens({ invalid: {
    print: { $type: 'dimension', $value: { value: 0.18, unit: 'mm' } }
  } }), /finite px or rem/);
  assert.throws(() => flattenTokens({ invalid: {
    time: { $type: 'duration', $value: { value: 1, unit: 'minute' } }
  } }), /finite ms or s/);
});

test('rejects a mode missing a semantic role', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'token-model-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, 'tokens', 'source');
  await mkdir(source, { recursive: true });
  await writeFile(join(source, 'manifest.json'), JSON.stringify(['modes.tokens.json']));
  await writeFile(join(source, 'modes.tokens.json'), JSON.stringify({
    $extensions: { 'industries.bizarre': { themeOrder: ['complete', 'incomplete'], contrastPairs: [] } },
    modes: {
      complete: { $type: 'color', surface: { canvas: { $value: '#000000' } } },
      incomplete: { $type: 'color', surface: {}
      }
    }
  }));

  await assert.rejects(loadTokenModel(pathToFileURL(`${directory}/`)), /incomplete.*missing semantic role.*surface\.canvas/);
});

test('flattens typed tokens in stable path order', async () => {
  const rows = flattenTokens(await loadTokenModel(root));
  assert.ok(rows.length >= 11);
  assert.deepEqual(rows.map(({ path }) => path), rows.map(({ path }) => path).sort());
  assert.ok(new Set(rows.map(({ type }) => type)).isSupersetOf(new Set([
    'color', 'fontFamily', 'fontWeight', 'dimension', 'number', 'duration', 'cubicBezier', 'shadow'
  ])));
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
  await writeFile(join(directory, 'tokens', 'source', 'manifest.json'), JSON.stringify(['brand.tokens.json', 'modes.tokens.json']));
  await writeFile(join(directory, 'tokens', 'source', 'brand.tokens.json'), JSON.stringify({ brand: { accent: { signal: { $value: '#fff' } } } }));
  await writeFile(join(directory, 'tokens', 'source', 'modes.tokens.json'), JSON.stringify({ modes: {} }));

  await assert.rejects(loadTokenModel(pathToFileURL(`${directory}/`)), /Untyped token at brand\.accent\.signal/);
});

test('loads only declared token documents in manifest order', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'token-model-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, 'tokens', 'source');
  await mkdir(source, { recursive: true });
  await writeFile(join(source, 'manifest.json'), JSON.stringify(['second.tokens.json', 'first.tokens.json']));
  await writeFile(join(source, 'first.tokens.json'), JSON.stringify({ first: { $type: 'number', $value: 1 } }));
  await writeFile(join(source, 'second.tokens.json'), JSON.stringify({ second: { $type: 'number', $value: 2 } }));
  await writeFile(join(source, 'ignored.tokens.json'), JSON.stringify({ ignored: { $type: 'number', $value: 3 } }));

  const model = await loadTokenModel(pathToFileURL(`${directory}/`));
  assert.deepEqual(Object.keys(model), ['second', 'first']);
  assert.equal(model.ignored, undefined);
});

test('rejects malformed, duplicate, and unsafe manifest entries', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'token-model-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, 'tokens', 'source');
  await mkdir(source, { recursive: true });
  const rootUrl = pathToFileURL(`${directory}/`);
  for (const [manifest, pattern] of [
    [[], /non-empty array/],
    [['one.tokens.json', 'one.tokens.json'], /duplicate source.*one\.tokens\.json/],
    [['../one.tokens.json'], /safe relative JSON path/],
    [['nested/one.tokens.json'], /safe relative JSON path/],
    [['one.txt'], /safe relative JSON path/]
  ]) {
    await writeFile(join(source, 'manifest.json'), JSON.stringify(manifest));
    await assert.rejects(loadTokenModel(rootUrl), pattern);
  }
});

test('rejects duplicate paths introduced by ordered source merging', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'token-model-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, 'tokens', 'source');
  await mkdir(source, { recursive: true });
  await writeFile(join(source, 'manifest.json'), JSON.stringify(['one.tokens.json', 'two.tokens.json']));
  const document = JSON.stringify({ shared: { $type: 'number', $value: 1 } });
  await writeFile(join(source, 'one.tokens.json'), document);
  await writeFile(join(source, 'two.tokens.json'), document);
  await assert.rejects(loadTokenModel(pathToFileURL(`${directory}/`)), /Duplicate token path: shared/);
});

test('resolves aliases while retaining their declared token path and alias', () => {
  const rows = resolveTokenAliases([
    { path: 'color.base', type: 'color', value: '#000' },
    { path: 'color.text', type: 'color', value: '{color.base}' }
  ]);
  assert.deepEqual(rows[1], { path: 'color.text', type: 'color', value: '{color.base}', resolvedValue: '#000' });
});

test('resolves multi-hop semantic aliases before contrast validation', () => {
  const rows = resolveTokenAliases([
    { path: 'color.base', type: 'color', value: '#000000' },
    { path: 'semantic.ink', type: 'color', value: '{color.base}' },
    { path: 'modes.void.content.primary', type: 'color', value: '{semantic.ink}' },
  ]);
  assert.equal(rows.at(-1).resolvedValue, '#000000');
});

test('rejects missing aliases, alias cycles, and alias type mismatches with paths', () => {
  assert.throws(
    () => resolveTokenAliases([{ path: 'text.primary', type: 'color', value: '{color.neutral.void}' }]),
    /missing token.*color\.neutral\.void.*text\.primary/
  );
  assert.throws(
    () => resolveTokenAliases([
      { path: 'a', type: 'color', value: '{b}' },
      { path: 'b', type: 'color', value: '{a}' }
    ]),
    /alias cycle: a -> b -> a/
  );
  assert.throws(
    () => resolveTokenAliases([
      { path: 'space.base', type: 'dimension', value: { value: 4, unit: 'px' } },
      { path: 'layer.bad', type: 'number', value: '{space.base}' }
    ]),
    /type mismatch.*layer\.bad.*number.*space\.base.*dimension/
  );
});
