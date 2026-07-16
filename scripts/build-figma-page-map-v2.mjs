import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

import { canonicalJson } from './lib/canonical-json.mjs';

const root = new URL('../', import.meta.url);
const v1Path = 'governance/design-ledgers/figma/bizarre-page-map-v1.json';
const manifestPath = 'production/affinity/bizarre-masterbrand-subjects-v2.json';
const outputPath = new URL(
  process.env.BIZARRE_FIGMA_V2_PAGE_MAP_OUTPUT
    || 'governance/design-ledgers/figma/bizarre-page-map-v2.json',
  root,
);
if (outputPath.pathname.endsWith('bizarre-page-map-v1.json')) {
  throw new Error('IMMUTABLE_V1_OUTPUT: the v2 page-map builder refuses the frozen v1 output path');
}

const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const canonicalCompact = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalCompact).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalCompact(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const [v1Map, manifest, v1Bytes] = await Promise.all([
  readJson(v1Path),
  readJson(manifestPath),
  readFile(new URL(v1Path, root)),
]);

if (v1Map.pages.length !== 104 || manifest.subjects.length !== 104) {
  throw new Error('Figma v2 page-map migration requires exactly 104 v1 pages and 104 v2 subjects');
}

const subjectsById = new Map(manifest.subjects.map((subject) => [subject.id, subject]));
const pages = v1Map.pages.map((page) => {
  const subject = subjectsById.get(page.subjectId);
  if (!subject) throw new Error(`V2 manifest is missing mapped subject ${page.subjectId}`);
  return {
    subjectId: page.subjectId,
    pageId: page.pageId,
    name: subject.exactLabel,
  };
});

if (new Set(pages.map((page) => page.subjectId)).size !== 104) {
  throw new Error('Figma v2 page map contains duplicate subject IDs');
}
if (new Set(pages.map((page) => page.pageId)).size !== 104) {
  throw new Error('Figma v2 page map contains duplicate stable page IDs');
}

const changedNames = pages
  .filter((page, index) => page.name !== v1Map.pages[index].name)
  .map((page) => page.subjectId);
if (changedNames.length !== 1 || changedNames[0] !== '01.03') {
  throw new Error(`Expected only 01.03 to change in the v2 page map; changed: ${changedNames.join(', ') || '(none)'}`);
}

const map = {
  schemaVersion: 2,
  mapId: 'bizarre-page-map-v2',
  mapVersion: '2.0.0',
  title: 'Bizarre Industries Figma Permanent Page Map / v2 Migration Target',
  canonicalSha256: null,
  figmaFileKey: manifest.figma.fileKey,
  manifestHash: manifest.canonicalSha256,
  mappingStatus: 'OFFLINE TARGET / LIVE FIGMA NOT OBSERVED',
  captureMethod: 'offline migration map derived from immutable v1 page IDs and governed v2 subject labels',
  derivesFrom: {
    path: v1Path,
    fileSha256: sha256(v1Bytes),
    policy: 'Preserve all 104 stable page IDs. Rename only governed labels changed by the v2 manifest.',
  },
  permanentPageCount: pages.length,
  legacyPagesPreserved: v1Map.legacyPagesPreserved,
  pages,
};

const hashable = structuredClone(map);
delete hashable.canonicalSha256;
map.canonicalSha256 = sha256(canonicalCompact(hashable));

await writeFile(outputPath, canonicalJson(map));
process.stdout.write(`${outputPath.pathname}\n${map.canonicalSha256}\n`);
