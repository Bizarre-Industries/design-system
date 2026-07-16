import { readFile, writeFile } from 'node:fs/promises';

const rootUrl = new URL('../', import.meta.url);
const provisionalUrl = new URL('brand/provisional-assets.json', rootUrl);
const atlasManifestUrl = new URL('packages/atlas/generated/manifest.json', rootUrl);

const [provisional, atlasManifest] = await Promise.all([
  readFile(provisionalUrl, 'utf8').then(JSON.parse),
  readFile(atlasManifestUrl, 'utf8').then(JSON.parse),
]);

let updated = 0;
for (const asset of provisional.assets) {
  if (!asset.path.startsWith('packages/atlas/generated/')) continue;
  const packagePath = asset.path.slice('packages/atlas/'.length);
  const generated = atlasManifest.files[packagePath];
  if (!generated) throw new Error(`Atlas package manifest is missing ${packagePath}`);
  if (generated.mediaType !== 'image/svg+xml') throw new Error(`Expected SVG Atlas asset: ${asset.path}`);

  const source = await readFile(new URL(asset.path, rootUrl), 'utf8');
  const viewBox = source.match(/<svg\b[^>]*\bviewBox=["']([^"']+)["']/i)?.[1];
  if (!viewBox) throw new Error(`Atlas SVG is missing a viewBox: ${asset.path}`);

  asset.sha256 = generated.sha256;
  asset.mediaType = generated.mediaType;
  asset.viewBox = viewBox;
  asset.generator.name = generated.provenance.algorithm.name;
  asset.generator.version = generated.provenance.algorithm.version;
  asset.generator.configurationHash = generated.provenance.configurationHash;
  asset.provenance.sourceType = generated.provenance.sourceType;
  asset.provenance.sourceIdentifier = generated.provenance.sourceIdentifier;
  asset.provenance.model = generated.provenance.model;
  asset.provenance.apertureVersion = generated.provenance.apertureVersion;
  asset.provenance.aperturePathSha256 = generated.provenance.aperturePathSha256;
  updated += 1;
}

if (updated === 0) throw new Error('No provisional Atlas assets were synchronized');
await writeFile(provisionalUrl, `${JSON.stringify(provisional, null, 2)}\n`);
console.log(`Synchronized ${updated} provisional Atlas assets from the generated package manifest`);
