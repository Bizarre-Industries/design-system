import { readFile, writeFile } from 'node:fs/promises';

const rootUrl = new URL('../', import.meta.url);
const logoRoot = new URL('packages/assets/logo/', rootUrl);
const masterUrl = new URL('mark-transparent.svg', logoRoot);
const source = await readFile(masterUrl, 'utf8');
const rootTag = source.match(/<svg\b[^>]*>/i)?.[0];
const viewBox = rootTag?.match(/\bviewBox=["']([^"']+)["']/i)?.[1];
if (!rootTag || !viewBox) throw new Error('Gravity Well master is missing its root viewBox');

const [x, y, width, height] = viewBox.split(/\s+/);
const geometry = source
  .slice(rootTag.length, source.lastIndexOf('</svg>'))
  .replace(/\s*<rect\b[^>]*\/>\s*/gi, '\n');

function recolorPaths(content, colour) {
  return content.replace(/<path\b[^>]*>/gi, (tag) => tag
    .replace(/\bfill=["']#[0-9a-f]{6}["']/gi, `fill="${colour}"`)
    .replace(/\bfill\s*:\s*#[0-9a-f]{6}/gi, `fill: ${colour}`));
}

function variant({ background, figure }) {
  const backgroundNode = background
    ? `\n  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${background}"/>`
    : '';
  return `${rootTag}${backgroundNode}${recolorPaths(geometry, figure).trimEnd()}\n</svg>\n`;
}

const variants = {
  'mark-primary.svg': variant({ background: '#C6FF24', figure: '#0E0E0E' }),
  'mark-inverse.svg': variant({ background: '#0E0E0E', figure: '#C6FF24' }),
  'mark-transparent.svg': variant({ background: null, figure: '#0E0E0E' }),
};

await Promise.all(Object.entries(variants).map(([path, bytes]) => writeFile(new URL(path, logoRoot), bytes)));
console.log('Built exact monochrome Gravity Well variants: black, Signal Lime, and black transparent');
