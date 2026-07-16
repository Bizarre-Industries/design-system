import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { renderAperture } from '../packages/atlas/src/aperture.mjs';
import { ATLAS_CONFIG } from '../packages/atlas/src/config.mjs';
import { renderAtlas, renderCaptureSequence, renderInstrumentDial } from '../packages/atlas/src/render.mjs';
import { canonicalJson } from './lib/canonical-json.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const comparePaths = (left, right) => left < right ? -1 : left > right ? 1 : 0;

export async function buildExpectedAtlas() {
  const largeAffinity = {
    appearance: 'dark',
    height: 349,
    opticalSize: 'large',
    orientation: 18,
    productionProfile: 'screen',
    trajectoryState: 'active',
    width: 620
  };
  const outputs = new Map([
    ['generated/atlas-bands.svg', renderAtlas({ appearance: 'dark', orientation: 18, representation: 'bands' })],
    ['generated/atlas-contours-dark.svg', renderAtlas({ appearance: 'dark', orientation: 18, representation: 'contour' })],
    ['generated/atlas-contours-large.svg', renderAtlas({ ...largeAffinity, representation: 'contour' })],
    ['generated/atlas-contours-light.svg', renderAtlas({ appearance: 'light', orientation: 18, representation: 'contour' })],
    ['generated/atlas-dots-large.svg', renderAtlas({ ...largeAffinity, representation: 'dots' })],
    ['generated/atlas-dots.svg', renderAtlas({ appearance: 'dark', orientation: 18, representation: 'dots' })],
    ['generated/atlas-hatch-large.svg', renderAtlas({ ...largeAffinity, representation: 'hatch' })],
    ['generated/atlas-hatch.svg', renderAtlas({ appearance: 'dark', orientation: 18, representation: 'hatch' })],
    ['generated/atlas-micro.svg', renderAtlas({ appearance: 'dark', height: 48, opticalSize: 'micro', orientation: 18, representation: 'contour', width: 96 })],
    ['generated/atlas-spectral-large.svg', renderAtlas({ ...largeAffinity, representation: 'spectral' })],
    ['generated/atlas-spectral.svg', renderAtlas({ appearance: 'dark', orientation: 18, representation: 'spectral' })],
    ['generated/calibrated-aperture.svg', renderAperture()],
    ['generated/capture-sequence.svg', renderCaptureSequence()],
    ['generated/instrument-dial.svg', renderInstrumentDial()],
    ['generated/livery-strip.svg', renderAtlas({ appearance: 'dark', height: 380, opticalSize: 'field', orientation: 18, representation: 'spectral', width: 1800 })]
  ]);
  const payload = new Map(
    [...outputs].sort(([left], [right]) => comparePaths(left, right)).map(([path, output]) => [path, Buffer.from(output.svg)])
  );
  payload.set('generated/config.json', Buffer.from(canonicalJson(ATLAS_CONFIG)));
  const files = Object.fromEntries([...payload].map(([path, bytes]) => {
    if (path === 'generated/config.json') {
      return [path, {
        mediaType: 'application/json',
        sha256: sha256(bytes)
      }];
    }
    const metadata = outputs.get(path).metadata;
    return [path, {
      mediaType: 'image/svg+xml',
      provenance: {
        algorithm: metadata.algorithm,
        aperturePathSha256: metadata.aperturePathSha256,
        apertureVersion: metadata.apertureVersion,
        configurationHash: metadata.configurationHash,
        model: metadata.model,
        sourceIdentifier: metadata.sourceIdentifier,
        sourceType: metadata.sourceType
      },
      sha256: sha256(bytes)
    }];
  }));
  payload.set('generated/manifest.json', Buffer.from(canonicalJson({
    apertureMaster: 'generated/calibrated-aperture.svg',
    files,
    package: '@bizarre/atlas',
    schemaVersion: 1
  })));
  return new Map([...payload].sort(([left], [right]) => comparePaths(left, right)));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const { writePackage } = await import('./lib/package-writer.mjs');
  await writePackage(new URL('../packages/atlas/', import.meta.url), await buildExpectedAtlas());
}
