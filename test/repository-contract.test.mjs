import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { lstat, readFile, readlink } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const root = fileURLToPath(new URL('../', import.meta.url));

test('repository declares its canonical boundary and required scripts', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const readme = await read('README.md');
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.workspaces, ['packages/*']);
  assert.equal(pkg.engines.node, '>=22');
  assert.equal(pkg.scripts.verify, 'npm test && npm run check:generated');
  assert.equal(pkg.scripts['build:open-design'], 'node scripts/build-open-design.mjs');
  assert.equal(
    pkg.scripts.build,
    'npm run build:tokens && npm run build:logos && npm run build:atlas && npm run build:assets && npm run build:ui && npm run build:open-design'
  );
  assert.match(readme, /canonical Bizarre Industries design language/i);
  assert.match(readme, /themes.*downstream/i);
});

test('repository ignores local runtime state', async () => {
  const ignore = await read('.gitignore');
  for (const entry of [
    'node_modules/',
    '.DS_Store',
    '.superpowers/',
    '*.log',
    '*.tmp',
    'tooling/codex-design-marketplace/',
    'outputs/imagegen/**/codex-exec-image-results.json',
    'outputs/imagegen/**/data/',
    'outputs/imagegen/**/latest-action.json',
    'outputs/imagegen/**/moodboard-widget-payload.json',
    'outputs/imagegen/**/preflight/',
    'outputs/imagegen/**/run-state.json',
    'outputs/imagegen/**/workers/',
    'scripts/run-affinity-masterbrand.mjs',
    'fonts/',
    'logo/*.png',
    'audits/',
    'outputs/atlas/qa/',
    'production/mockups/sources/*-16x9.jpg',
    'production/affinity/aperture-pattern-study-v2/smooth-aperture-options-v2.png',
    'production/affinity/build-bizarre-masterbrand-library-v1.js',
  ]) {
    assert.ok(ignore.split(/\r?\n/).includes(entry), `missing ignore rule: ${entry}`);
  }
});

test('portable commit candidates contain no personal home paths or absolute symlinks', async () => {
  const candidates = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'utf8' },
  ).split('\0').filter(Boolean);
  const textExtensions = new Set([
    '.css', '.html', '.js', '.json', '.jsonl', '.md', '.mjs', '.svg', '.txt', '.yaml', '.yml',
  ]);
  const absoluteSymlinks = [];
  const personalPathFiles = [];

  for (const relativePath of candidates) {
    const absolutePath = path.join(root, relativePath);
    const stats = await lstat(absolutePath);
    if (stats.isSymbolicLink()) {
      if (path.isAbsolute(await readlink(absolutePath))) absoluteSymlinks.push(relativePath);
      continue;
    }
    if (!stats.isFile() || !textExtensions.has(path.extname(relativePath))) continue;
    if (/\/Users\/[^/]+\//.test(await readFile(absolutePath, 'utf8'))) {
      personalPathFiles.push(relativePath);
    }
  }

  assert.deepEqual(absoluteSymlinks, [], `absolute symlinks: ${absoluteSymlinks.join(', ')}`);
  assert.deepEqual(personalPathFiles, [], `personal paths: ${personalPathFiles.join(', ')}`);
});
