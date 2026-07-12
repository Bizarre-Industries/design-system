import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './lib/canonical-json.mjs';
import { collectEvidence } from './lib/evidence.mjs';
import { flattenTokens, loadTokenModel, resolveTokenAliases } from './lib/token-model.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const ALIAS = /^\{([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)\}$/;

function quantity(value, path) {
  if (!value || typeof value !== 'object' || !Number.isFinite(value.value) || typeof value.unit !== 'string' || !/^[A-Za-z%]+$/.test(value.unit)) {
    throw new TypeError(`Invalid CSS quantity at ${path}`);
  }
  return `${value.value}${value.unit}`;
}

function color(value, path) {
  if (!value || typeof value !== 'object' || typeof value.hex !== 'string' || !/^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/.test(value.hex)) {
    throw new TypeError(`Invalid CSS color at ${path}`);
  }
  return value.hex;
}

function shadowLayer(value, path) {
  if (!value || typeof value !== 'object') throw new TypeError(`Invalid CSS shadow at ${path}`);
  const inset = value.inset === true ? 'inset ' : '';
  return `${inset}${quantity(value.offsetX, path)} ${quantity(value.offsetY, path)} ${quantity(value.blur, path)} ${quantity(value.spread, path)} ${color(value.color, path)}`;
}

function cssValue(row) {
  const { path, type, value } = row;
  switch (type) {
    case 'color': return color(value, path);
    case 'dimension':
    case 'duration': return quantity(value, path);
    case 'cubicBezier':
      if (!Array.isArray(value) || value.length !== 4 || value.some((part) => !Number.isFinite(part))) break;
      return `cubic-bezier(${value.join(', ')})`;
    case 'fontFamily':
      if (!Array.isArray(value) || value.length === 0 || value.some((family) => typeof family !== 'string')) break;
      return value.map((family) => `"${family.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`).join(', ');
    case 'shadow':
      return (Array.isArray(value) ? value : [value]).map((layer) => shadowLayer(layer, path)).join(', ');
    case 'fontWeight':
    case 'number':
      if (Number.isFinite(value)) return String(value);
      break;
    default:
      break;
  }
  throw new TypeError(`Unsupported ${type} CSS token value at ${path}`);
}

function declaration(row, prefix = row.path) {
  const alias = typeof row.value === 'string' ? row.value.match(ALIAS) : null;
  const value = alias ? `var(--bzr-${alias[1].replaceAll('.', '-')})` : cssValue(row);
  return `  --bzr-${prefix.replaceAll('.', '-')}: ${value};`;
}

function buildCss(model, rows) {
  const primitives = rows.filter(({ path }) => !path.startsWith('modes.'));
  const modeRows = rows.filter(({ path }) => path.startsWith('modes.'));
  const declaredOrder = model.modes?.$extensions?.['industries.bizarre']?.themeOrder;
  const available = new Set(modeRows.map(({ path }) => path.split('.')[1]));
  const themes = Array.isArray(declaredOrder) ? declaredOrder : [...available].sort();
  if (themes.length !== available.size || themes.some((theme) => !available.has(theme)) || new Set(themes).size !== themes.length) {
    throw new Error('themeOrder must list every theme exactly once');
  }

  const blocks = [`:root {\n${primitives.map((row) => declaration(row)).join('\n')}\n}`];
  for (const theme of themes) {
    const prefix = `modes.${theme}.`;
    const declarations = modeRows
      .filter(({ path }) => path.startsWith(prefix))
      .map((row) => declaration(row, row.path.slice(prefix.length)));
    blocks.push(`[data-bizarre-theme="${theme}"] {\n${declarations.join('\n')}\n}`);
  }
  return `${blocks.join('\n\n')}\n`;
}

export async function buildExpected(rootUrl) {
  const model = await loadTokenModel(rootUrl);
  const rows = resolveTokenAliases(flattenTokens(model));
  const allowlist = JSON.parse(await readFile(new URL('governance/evidence-allowlist.json', rootUrl), 'utf8'));
  if (!Array.isArray(allowlist.paths)) throw new TypeError('evidence allowlist must contain paths');

  const tokens = Buffer.from(canonicalJson(model));
  const css = Buffer.from(buildCss(model, rows));
  const manifest = Buffer.from(canonicalJson({
    schemaVersion: 1,
    package: '@bizarre/tokens',
    files: {
      'generated/tokens.css': { sha256: sha256(css) },
      'generated/tokens.json': { sha256: sha256(tokens) }
    },
    evidence: await collectEvidence(rootUrl, allowlist.paths)
  }));

  return new Map([
    ['generated/tokens.css', css],
    ['generated/tokens.json', tokens],
    ['generated/manifest.json', manifest]
  ].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const rootUrl = new URL('../', import.meta.url);
  const { writePackage } = await import('./lib/package-writer.mjs');
  await writePackage(new URL('../packages/tokens/', import.meta.url), await buildExpected(rootUrl));
}
