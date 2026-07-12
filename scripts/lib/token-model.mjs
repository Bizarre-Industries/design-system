import { readFile } from 'node:fs/promises';
import { validateContrastPairs } from './contrast.mjs';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function addToken(token, path, inheritedType, rows, paths) {
  if (!isObject(token) || !('$value' in token)) throw new TypeError(`Invalid token at ${path}`);
  const childKeys = Object.keys(token).filter((key) => !key.startsWith('$'));
  if (childKeys.length > 0) throw new TypeError(`Token at ${path} cannot contain child groups or tokens`);

  let type = inheritedType;
  if ('$type' in token) {
    if (typeof token.$type !== 'string' || token.$type.length === 0) {
      throw new TypeError(`Invalid $type at ${path}`);
    }
    type = token.$type;
  }
  if (!type) throw new TypeError(`Untyped token at ${path}`);
  if (paths.has(path)) throw new TypeError(`Duplicate token path: ${path}`);
  paths.add(path);
  rows.push({ path, type, value: token.$value });
}

function visitGroup(group, segments, inheritedType, rows, paths) {
  const path = segments.join('.');
  if (!isObject(group)) throw new TypeError(`Invalid group at ${path || '<root>'}`);

  let type = inheritedType;
  if ('$type' in group) {
    if (typeof group.$type !== 'string' || group.$type.length === 0) {
      throw new TypeError(`Invalid $type at ${path || '<root>'}`);
    }
    type = group.$type;
  }

  if ('$value' in group) {
    addToken(group, path, type, rows, paths);
    return;
  }

  if ('$root' in group) addToken(group.$root, path || '$root', type, rows, paths);

  for (const [key, child] of Object.entries(group)) {
    if (!key.startsWith('$')) visitGroup(child, [...segments, key], type, rows, paths);
  }
}

export function flattenTokens(model) {
  if (!isObject(model)) throw new TypeError('Token model must be an object');

  const rows = [];
  const paths = new Set();
  for (const [name, document] of Object.entries(model)) {
    if (!isObject(document)) throw new TypeError(`Invalid token document: ${name}`);
    visitGroup(document, [], undefined, rows, paths);
  }
  return rows.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

const ALIAS = /^\{([^{}]+)\}$/;

export function resolveTokenAliases(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Token rows must be an array');
  const byPath = new Map();
  for (const row of rows) {
    if (!row || typeof row.path !== 'string' || typeof row.type !== 'string') {
      throw new TypeError('Invalid token row');
    }
    if (byPath.has(row.path)) throw new TypeError(`Duplicate token path: ${row.path}`);
    byPath.set(row.path, row);
  }

  const resolved = new Map();
  const active = [];
  function resolve(path) {
    if (resolved.has(path)) return resolved.get(path);
    const row = byPath.get(path);
    const cycleAt = active.indexOf(path);
    if (cycleAt !== -1) throw new TypeError(`alias cycle: ${[...active.slice(cycleAt), path].join(' -> ')}`);
    active.push(path);
    const match = typeof row.value === 'string' ? row.value.match(ALIAS) : null;
    let value = row.value;
    if (match) {
      const targetPath = match[1];
      const target = byPath.get(targetPath);
      if (!target) throw new TypeError(`missing token ${targetPath} referenced by ${path}`);
      if (target.type !== row.type) {
        throw new TypeError(`alias type mismatch at ${path}: ${row.type} cannot reference ${targetPath}: ${target.type}`);
      }
      value = resolve(targetPath);
    }
    active.pop();
    resolved.set(path, value);
    return value;
  }

  return rows.map((row) => {
    const isAlias = typeof row.value === 'string' && ALIAS.test(row.value);
    const resolvedValue = resolve(row.path);
    return isAlias ? { ...row, resolvedValue } : row;
  });
}

function validateSemanticModes(model, resolvedRows) {
  const modes = model.modes?.modes;
  if (!isObject(modes)) return;
  const metadata = model.modes?.$extensions?.['industries.bizarre'];
  const order = metadata?.themeOrder;
  if (!Array.isArray(order) || order.length === 0) throw new TypeError('Semantic modes require a non-empty themeOrder');
  if (new Set(order).size !== order.length || order.some((theme) => !Object.hasOwn(modes, theme)) || order.length !== Object.keys(modes).length) {
    throw new TypeError('themeOrder must list every semantic mode exactly once');
  }

  const rolePaths = new Map(order.map((theme) => [
    theme,
    resolvedRows
      .filter(({ path }) => path.startsWith(`modes.${theme}.`))
      .map(({ path }) => path.slice(`modes.${theme}.`.length))
  ]));
  const baseline = rolePaths.get(order[0]);
  for (const theme of order.slice(1)) {
    const roles = new Set(rolePaths.get(theme));
    for (const role of baseline) {
      if (!roles.has(role)) throw new TypeError(`Semantic mode ${theme} is missing semantic role ${role}`);
    }
    const expected = new Set(baseline);
    for (const role of roles) {
      if (!expected.has(role)) throw new TypeError(`Semantic mode ${order[0]} is missing semantic role ${role}`);
    }
  }

  if (!Array.isArray(metadata?.contrastPairs)) throw new TypeError('Semantic modes require contrastPairs metadata');
  const rows = new Map(resolvedRows.map((row) => [row.path, row]));
  validateContrastPairs({
    rows,
    pairs: order.flatMap((theme) => metadata.contrastPairs.map((pair) => ({
      ...pair,
      foreground: `modes.${theme}.${pair.foreground}`,
      background: `modes.${theme}.${pair.background}`
    })))
  });
}

export async function loadTokenModel(rootUrl) {
  const sourceUrl = new URL('tokens/source/', rootUrl);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', sourceUrl), 'utf8'));
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new TypeError('Token source manifest must be a non-empty array');
  }
  const seen = new Set();
  for (const path of manifest) {
    if (typeof path !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.tokens\.json$/.test(path)) {
      throw new TypeError(`Token source must be a safe relative JSON path: ${String(path)}`);
    }
    if (seen.has(path)) throw new TypeError(`duplicate source in manifest: ${path}`);
    seen.add(path);
  }

  const model = {};
  for (const path of manifest) {
    const name = path.slice(0, -'.tokens.json'.length);
    if (Object.hasOwn(model, name)) throw new TypeError(`duplicate token document name: ${name}`);
    model[name] = JSON.parse(await readFile(new URL(path, sourceUrl), 'utf8'));
  }
  const resolvedRows = resolveTokenAliases(flattenTokens(model));
  validateSemanticModes(model, resolvedRows);
  return model;
}
