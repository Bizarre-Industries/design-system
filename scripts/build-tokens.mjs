import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './lib/canonical-json.mjs';
import { collectEvidence } from './lib/evidence.mjs';
import { flattenTokens, loadTokenModel } from './lib/token-model.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function cssValue(value, path) {
  if (value && typeof value === 'object' && typeof value.hex === 'string') return value.hex;
  if (['string', 'number'].includes(typeof value)) return String(value);
  throw new TypeError(`Unsupported CSS token value at ${path}`);
}

function declaration(row, prefix = row.path) {
  return `  --bzr-${prefix.replaceAll('.', '-')}: ${cssValue(row.value, row.path)};`;
}

function buildCss(model, rows) {
  const brand = rows.filter(({ path }) => path.startsWith('brand.'));
  const modeRows = rows.filter(({ path }) => path.startsWith('modes.'));
  const declaredOrder = model.modes?.$extensions?.['industries.bizarre']?.themeOrder;
  const available = new Set(modeRows.map(({ path }) => path.split('.')[1]));
  const themes = Array.isArray(declaredOrder) ? declaredOrder : [...available].sort();
  if (themes.length !== available.size || themes.some((theme) => !available.has(theme)) || new Set(themes).size !== themes.length) {
    throw new Error('themeOrder must list every theme exactly once');
  }

  const blocks = [`:root {\n${brand.map((row) => declaration(row)).join('\n')}\n}`];
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
  const rows = flattenTokens(model);
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
