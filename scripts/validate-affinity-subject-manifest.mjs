import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, 'production/affinity/bizarre-masterbrand-subjects-v2.json');
const manifest = JSON.parse(await readFile(path, 'utf8'));

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const expectedHash = manifest.canonicalSha256;
const hashable = structuredClone(manifest);
delete hashable.canonicalSha256;
assert.equal(createHash('sha256').update(canonicalJson(hashable)).digest('hex'), expectedHash, 'manifest canonical hash drift');

assert.equal(manifest.subjects.length, 104, 'manifest must contain exactly 104 subjects');
assert.equal(new Set(manifest.subjects.map(({ id }) => id)).size, 104, 'subject IDs must be unique');
assert.equal(new Set(manifest.subjects.map(({ exactLabel }) => exactLabel)).size, 104, 'subject labels must be unique');
assert.equal(manifest.approvedPageRule.widthPx, 1440);
assert.equal(manifest.approvedPageRule.affinityDpi, 144);
assert.equal(manifest.approvedPageRule.heightStrategy, 'content-driven');
assert.deepEqual(manifest.approvedPageRule.coverAndDividerSizePx, [1440, 900]);

const byId = new Map(manifest.subjects.map((subject) => [subject.id, subject]));
for (const required of ['00.00', '03.05', '06.01', '07.05', '07.08', '07.09', '07.10', '99.00']) {
  assert.ok(byId.has(required), `missing required subject ${required}`);
}

for (const subject of manifest.subjects) {
  assert.equal(subject.exactLabel, `${subject.id} · ${subject.name}`);
  assert.equal(subject.artboard.widthPx, 1440);
  assert.equal(subject.artboard.dpi, 144);
  assert.equal(subject.artboard.heightStrategy, 'content-driven');
  assert.ok(subject.artboard.minimumHeightPx >= 900);
  assert.equal(subject.layerStack.length, 11);
  assert.equal(new Set(subject.layerStack).size, 11);
  assert.equal(subject.anatomy.length, subject.anatomyType === 'overview' ? 8 : 12);
  assert.equal(new Set(subject.anatomy).size, subject.anatomy.length);
  if (subject.id === '06.01') {
    assert.equal(subject.name, 'Continuous Lens Aperture v2');
    assert.equal(subject.governance.status, 'OWNER-APPROVED DIRECTION / PROVISIONAL GEOMETRY');
    assert.equal(subject.governance.publishable, false);
  } else if (['07.05', '07.08', '07.09', '07.10'].includes(subject.id)) {
    assert.equal(subject.governance.status, 'PROVISIONAL v1');
    assert.equal(subject.governance.publishable, false);
  }
}

const colorSubjects = manifest.subjects.filter(({ id }) => id.startsWith('03.'));
assert.equal(colorSubjects.length, 6, 'Color must remain six separate subjects');
const overviews = manifest.subjects.filter(({ anatomyType }) => anatomyType === 'overview');
assert.equal(overviews.length, 13, '12 category overviews plus 99.00 are required');
assert.equal(manifest.subjects.filter(({ governance }) => governance.status === 'PROVISIONAL v1').length, 4);
assert.equal(manifest.subjects.filter(({ governance }) => governance.status === 'OWNER-APPROVED DIRECTION / PROVISIONAL GEOMETRY').length, 1);
console.log(`Validated ${manifest.subjects.length} mirrored subjects (${overviews.length} overview anatomy, ${manifest.subjects.length - overviews.length} detail anatomy)`);
