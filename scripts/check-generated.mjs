import { lstat, readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { buildExpected } from './build-tokens.mjs';
import { buildExpectedAssets } from './build-assets.mjs';

const comparePaths = (left, right) => left < right ? -1 : left > right ? 1 : 0;

async function listFiles(directoryUrl, prefix = '') {
  let directoryStat;
  try {
    directoryStat = await lstat(directoryUrl);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (directoryStat.isSymbolicLink()) throw new Error(`${prefix || 'generated'} is a symbolic link`);
  if (!directoryStat.isDirectory()) throw new Error(`${prefix || 'generated'} is not a directory`);
  let entries;
  try {
    entries = await readdir(directoryUrl, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    const entryUrl = new URL(entry.name, directoryUrl);
    const stat = await lstat(entryUrl);
    if (stat.isSymbolicLink()) throw new Error(`${path} is a symbolic link`);
    if (stat.isDirectory()) files.push(...await listFiles(new URL(`${entry.name}/`, directoryUrl), path));
    else if (stat.isFile()) files.push(path);
    else throw new Error(`${path} is a special file`);
  }
  return files.sort(comparePaths);
}

export async function compareGenerated(packageUrl, expected) {
  try {
    const generatedStat = await lstat(new URL('generated', packageUrl));
    if (generatedStat.isSymbolicLink()) throw new Error('generated is a symbolic link');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const actualPaths = await listFiles(new URL('generated/', packageUrl), 'generated');
  const expectedPaths = [...expected.keys()].sort(comparePaths);
  const missing = expectedPaths.filter((path) => !actualPaths.includes(path)).sort(comparePaths);
  const obsolete = actualPaths.filter((path) => !expected.has(path)).sort(comparePaths);
  const modified = [];
  for (const path of expectedPaths.filter((candidate) => actualPaths.includes(candidate))) {
    const actual = await readFile(new URL(path, packageUrl));
    if (!actual.equals(expected.get(path))) modified.push(path);
  }
  return { missing, modified: modified.sort(comparePaths), obsolete };
}

export async function checkGenerated(rootUrl) {
  return {
    tokens: await compareGenerated(new URL('packages/tokens/', rootUrl), await buildExpected(rootUrl)),
    assets: await compareGenerated(new URL('packages/assets/', rootUrl), await buildExpectedAssets(rootUrl))
  };
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const packages = await checkGenerated(new URL('../', import.meta.url));
  for (const [name, drift] of Object.entries(packages)) {
    for (const category of ['missing', 'modified', 'obsolete']) {
      for (const path of drift[category]) console.error(`${name}: ${category}: ${path}`);
    }
  }
  if (Object.values(packages).some((drift) => Object.values(drift).some((paths) => paths.length > 0))) process.exitCode = 1;
}
