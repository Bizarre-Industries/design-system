import { readFile } from 'node:fs/promises';

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

export async function loadTokenModel(rootUrl) {
  const sourceUrl = new URL('tokens/source/', rootUrl);
  const [brand, modes] = await Promise.all([
    readFile(new URL('brand.tokens.json', sourceUrl), 'utf8').then(JSON.parse),
    readFile(new URL('modes.tokens.json', sourceUrl), 'utf8').then(JSON.parse)
  ]);
  const model = { brand, modes };
  flattenTokens(model);
  return model;
}
