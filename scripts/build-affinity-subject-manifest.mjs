import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const architecturePath = resolve(root, 'docs/superpowers/specs/2026-07-15-bizarre-masterbrand-library-architecture.md');
const outputPath = resolve(root, 'production/affinity/bizarre-masterbrand-subjects-v2.json');

const layerStack = [
  '00 / Reference',
  '10 / Construction',
  '20 / Canonical Assets',
  '30 / Live Type and Metadata',
  '40 / Color, Gradient, Pattern, or Material',
  '50 / Variants, States, and Optical Sizes',
  '60 / Usage and Applications',
  '70 / Accessibility, Bilingual, RTL, and Motion',
  '80 / Production and Export',
  '90 / Correct Use and Misuse',
  '99 / Provenance, Status, Evidence, and Navigation',
];

const overviewAnatomy = [
  'Purpose and recognition role',
  'Subject navigation with every page ID and exact name',
  'When-to-use matrix',
  'Status matrix',
  'Dependencies',
  'Rules and anti-patterns',
  'Far, normal, and close examples',
  'Change log and source references',
];

const detailAnatomy = [
  'Definition',
  'Construction and source',
  'Exact tokens, assets, styles, or material recipe',
  'Variants, modes, states, and optical sizes',
  'Usage',
  'Accessibility, bilingual behavior, and RTL',
  'Motion and interaction',
  'Production and export',
  'Correct examples',
  'Misuse',
  'Provenance, hashes, status, and evidence',
  'Category and related-page links plus canonical source paths',
];

const provisionalIds = new Set(['06.01', '07.05', '07.08', '07.09', '07.10']);

function minimumHeightFor(subject) {
  if (subject.id === '00.00') return 900;
  if (subject.id === '99.00') return 3400;
  if (subject.kind === 'Front matter') return 900;
  if (subject.kind === 'Navigation') return 2400;
  if (subject.kind === 'Entry guide') return 2800;
  if (subject.id === '02.01' || ['04', '07', '10', '11'].includes(subject.categoryId)) return 4300;
  if (['03', '05'].includes(subject.categoryId)) return 4000;
  if (subject.kind === 'Category overview') return 2840;
  if (subject.kind === 'Provisional detail') return 4100;
  if (subject.kind === 'Component detail') return 3800;
  if (subject.kind === 'Application detail') return 4000;
  if (subject.kind === 'Prototype handoff') return 3600;
  if (subject.kind === 'Assembly and handoff') return 3800;
  return 3500;
}

function parseSubjects(markdown) {
  const mapStart = markdown.indexOf('## 4. Permanent 104-subject map');
  const mapEnd = markdown.indexOf('## 5. Mandatory subject anatomy');
  if (mapStart < 0 || mapEnd < 0 || mapEnd <= mapStart) {
    throw new Error('Could not locate the locked subject map in the architecture specification');
  }

  const subjects = [];
  let category = null;
  for (const line of markdown.slice(mapStart, mapEnd).split('\n')) {
    const categoryMatch = line.match(/^###\s+(\d{2})\s+\/\s+(.+)$/);
    if (categoryMatch) {
      category = { id: categoryMatch[1], name: categoryMatch[2].trim() };
      continue;
    }
    const row = line.match(/^\|\s+`(\d{2}\.\d{2})`\s+\|\s+(.+?)\s+\|\s+(.+?)\s+\|$/);
    if (!row) continue;
    if (!category) throw new Error(`Subject ${row[1]} has no category heading`);
    subjects.push({
      id: row[1],
      name: row[2].trim(),
      kind: row[3].trim(),
      categoryId: category.id,
      categoryName: category.name,
    });
  }
  return subjects;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const architecture = await readFile(architecturePath, 'utf8');
const architectureSha256 = createHash('sha256').update(architecture).digest('hex');
const parsed = parseSubjects(architecture);

const subjects = parsed.map((subject) => {
  const isOverview = subject.kind === 'Category overview' || subject.id === '99.00';
  const isProvisional = provisionalIds.has(subject.id);
  return {
    ...subject,
    exactLabel: `${subject.id} · ${subject.name}`,
    anatomyType: isOverview ? 'overview' : 'detail',
    anatomy: isOverview ? overviewAnatomy : detailAnatomy,
    layerStack,
    artboard: {
      widthPx: 1440,
      minimumHeightPx: minimumHeightFor(subject),
      heightStrategy: 'content-driven',
      dpi: 144,
    },
    governance: {
      status: subject.id === '06.01'
        ? 'OWNER-APPROVED DIRECTION / PROVISIONAL GEOMETRY'
        : isProvisional ? 'PROVISIONAL v1' : subject.id === '99.00' ? 'NONCANONICAL INDEX' : 'GOVERNED',
      publishable: !isProvisional && subject.id !== '99.00',
      authority: false,
      referenceOnly: subject.id === '99.00',
    },
    source: {
      architecturePath: 'docs/superpowers/specs/2026-07-15-bizarre-masterbrand-library-architecture.md',
      architectureSha256,
    },
  };
});

const payload = {
  schemaVersion: 1,
  manifestVersion: '2.0.0',
  title: 'Bizarre Industries Identity System Mirrored Subject Manifest',
  approvedPageRule: {
    widthPx: 1440,
    heightStrategy: 'content-driven',
    coverAndDividerSizePx: [1440, 900],
    affinityDpi: 144,
    approvedByOwner: true,
  },
  figma: {
    fileKey: 'hGgrP9G0tEam8mpk5u3rHg',
    permanentPageCount: 104,
  },
  affinity: {
    filename: 'Bizarre-Industries-Masterbrand-Library.afdesign',
    permanentArtboardCount: 104,
    exactLayerStack: layerStack,
  },
  prototype: {
    figmaMakeFileKey: 's9stWDZe0kwBisJjfFMOqT',
    mirroredSubject: false,
  },
  subjects,
};

payload.canonicalSha256 = createHash('sha256').update(canonicalJson(payload)).digest('hex');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${subjects.length} subjects to ${outputPath}`);
