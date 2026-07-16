import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const readText = (path) => readFile(new URL(path, root), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

function extractSubjects(appSource) {
  const match = appSource.match(/const SUBJECTS: Subject\[\] = (\[[\s\S]*?\n\]);/);
  assert.ok(match, 'Figma Make SUBJECTS array is missing');
  return JSON.parse(JSON.stringify(runInNewContext(`(${match[1]})`)));
}

test('Figma Make mirrors the canonical key and all 104 current v2 subjects', async () => {
  const [appSource, readme, manifest, contentSpec] = await Promise.all([
    readText('production/figma-make/bizarre-industries/src/app/App.tsx'),
    readText('production/figma-make/bizarre-industries/README.md'),
    readJson('production/affinity/bizarre-masterbrand-subjects-v2.json'),
    readJson('production/affinity/bizarre-masterbrand-content-spec-v2.json'),
  ]);
  const subjects = extractSubjects(appSource);
  const expectedFromManifest = manifest.subjects.map((subject) => ({
    id: subject.id,
    label: subject.name,
    chapter: subject.categoryId,
    chapterLabel: subject.categoryName,
    status: 'NOT VERIFIED',
  }));
  const expectedFromContent = contentSpec.subjects.map((subject) => ({
    id: subject.subjectId,
    label: subject.subjectName,
    chapter: subject.categoryId,
    chapterLabel: subject.categoryName,
    status: 'NOT VERIFIED',
  }));

  assert.equal(subjects.length, 104);
  assert.equal(new Set(subjects.map(({ id }) => id)).size, 104);
  assert.deepEqual(subjects, expectedFromManifest);
  assert.deepEqual(subjects, expectedFromContent);
  assert.equal(contentSpec.manifest.canonicalSha256, manifest.canonicalSha256);

  for (const source of [appSource, readme]) {
    assert.match(source, /s9stWDZe0kwBisJjfFMOqT/);
    assert.doesNotMatch(source, /spYYwil8WifO5JfKgJoxTQ/);
  }
  assert.doesNotMatch(appSource, /subjects loaded from the content contract/i);
});

test('Figma Make keeps the Bizarre recognition layer inside its host container', async () => {
  const [styles, contract] = await Promise.all([
    readText('production/figma-make/bizarre-industries/src/styles/index.css'),
    readJson('packages/ui/src/contract.json'),
  ]);

  assert.equal(contract.infrastructure.globalResetAllowed, false);
  assert.equal(contract.infrastructure.hostRootStyleOverrideAllowed, false);
  assert.doesNotMatch(styles, /^\s*:root\b/m, 'Figma Make must not override the host root');
  assert.doesNotMatch(styles, /^\s*\*\s*\{/m, 'Figma Make must not install a global universal reset');
  assert.doesNotMatch(styles, /^\s*html\s*\{/m, 'Figma Make must not style the host html element');
  assert.doesNotMatch(styles, /^\s*body\s*\{/m, 'Figma Make must not style the host body element');
  assert.match(styles, /^\.app-shell\s*\{[\s\S]*?--signal:\s*#C6FF24;/m);
});
