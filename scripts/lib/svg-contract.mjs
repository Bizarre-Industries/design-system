const GRAVITY_WELL_VIEWBOX =
  '261.29998779296875 253.89999389648438 506.89996337890625 506.8000183105469';

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1] ?? null;
}

function pathValues(text) {
  return [...text.matchAll(/<path\b[^>]*>/gi)]
    .map(([tag]) => attribute(tag, 'd'))
    .filter((value) => value !== null);
}

export function inspectMarkSvg(text) {
  const svgTags = [...text.matchAll(/<svg\b[^>]*>/gi)];
  const gravityTag = svgTags.find(([tag]) => attribute(tag, 'viewBox') === GRAVITY_WELL_VIEWBOX);
  const selectedTag = gravityTag?.[0] ?? svgTags[0]?.[0];
  const selectedStart = gravityTag?.index ?? svgTags[0]?.index ?? 0;
  const selectedEnd = text.indexOf('</svg>', selectedStart);
  const selected = selectedEnd < 0 ? text.slice(selectedStart) : text.slice(selectedStart, selectedEnd + 6);
  const pathData = pathValues(selected);
  const fills = [...selected.matchAll(/(?:\bfill=["']|\bfill\s*:\s*)(#[0-9a-f]{6})/gi)]
    .map((match) => match[1].toUpperCase());
  const allPathData = pathValues(text);

  return {
    viewBox: attribute(selectedTag ?? '', 'viewBox'),
    pathData,
    fills: [...new Set(fills)],
    hasTextLockup: /<text\b/i.test(text) || allPathData.length > pathData.length,
  };
}
