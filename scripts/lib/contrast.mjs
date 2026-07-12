const HEX_COLOR = /^#([0-9a-f]{6})$/i;

function relativeLuminance(hex) {
  const match = hex.match(HEX_COLOR);
  if (!match) throw new TypeError(`Expected a six-digit hex color, received ${String(hex)}`);
  const channels = match[1].match(/../g).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foregroundHex, backgroundHex) {
  const foreground = relativeLuminance(foregroundHex);
  const background = relativeLuminance(backgroundHex);
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

function rowHex(row, path) {
  if (!row) throw new TypeError(`Contrast pair references missing token ${path}`);
  const value = Object.hasOwn(row, 'resolvedValue') ? row.resolvedValue : row.value;
  if (typeof value === 'string') return value;
  if (value && typeof value.hex === 'string') return value.hex;
  throw new TypeError(`Contrast token ${path} does not resolve to a hex color`);
}

export function validateContrastPairs({ rows, pairs }) {
  if (!(rows instanceof Map)) throw new TypeError('Contrast model rows must be a Map');
  if (!Array.isArray(pairs)) throw new TypeError('Contrast model pairs must be an array');
  for (const pair of pairs) {
    const { foreground, background, threshold } = pair;
    if (typeof foreground !== 'string' || typeof background !== 'string' || !Number.isFinite(threshold) || threshold <= 0) {
      throw new TypeError('Invalid contrast pair metadata');
    }
    const ratio = contrastRatio(rowHex(rows.get(foreground), foreground), rowHex(rows.get(background), background));
    if (ratio < threshold) {
      throw new TypeError(`Contrast pair ${foreground} on ${background} is ${ratio.toFixed(2)}:1; requires ${threshold}:1`);
    }
  }
}
