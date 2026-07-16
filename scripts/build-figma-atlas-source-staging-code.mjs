#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const pageId = '47:46';
const pageName = '07.01 · Field Source & Provenance';
const namespace = 'bizarre.masterbrand';
const chunkSize = 38_000;

const sources = [
  ['atlasSpectral', 'packages/atlas/generated/atlas-spectral.svg'],
  ['atlasSpectralLarge', 'packages/atlas/generated/atlas-spectral-large.svg'],
  ['atlasBands', 'packages/atlas/generated/atlas-bands.svg'],
  ['atlasContoursDark', 'packages/atlas/generated/atlas-contours-dark.svg'],
  ['atlasContoursLight', 'packages/atlas/generated/atlas-contours-light.svg'],
  ['atlasContoursLarge', 'packages/atlas/generated/atlas-contours-large.svg'],
  ['atlasDots', 'packages/atlas/generated/atlas-dots.svg'],
  ['atlasDotsLarge', 'packages/atlas/generated/atlas-dots-large.svg'],
  ['atlasHatch', 'packages/atlas/generated/atlas-hatch.svg'],
  ['atlasHatchLarge', 'packages/atlas/generated/atlas-hatch-large.svg'],
  ['atlasMicro', 'packages/atlas/generated/atlas-micro.svg'],
  ['aperture', 'packages/atlas/generated/calibrated-aperture.svg'],
].map(([id, relativePath], index) => {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const width = Number(source.match(/<svg[^>]*\bwidth="([0-9.]+)"/)?.[1]);
  const height = Number(source.match(/<svg[^>]*\bheight="([0-9.]+)"/)?.[1]);
  if (!(width > 0) || !(height > 0)) throw new Error(`Missing SVG dimensions: ${relativePath}`);
  return {
    id,
    index,
    relativePath,
    source,
    width,
    height,
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
    chunks: Array.from({ length: Math.ceil(source.length / chunkSize) }, (_, chunkIndex) => source.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize)),
  };
});

const [command, sourceId, chunkIndexRaw] = process.argv.slice(2);
const source = sources.find((item) => item.id === sourceId);
const literal = (value) => JSON.stringify(value);

if (command === 'manifest') {
  process.stdout.write(`${JSON.stringify({ pageId, pageName, namespace, chunkSize, sources: sources.map(({ source: _source, chunks, ...item }) => ({ ...item, chunkCount: chunks.length })) }, null, 2)}\n`);
  process.exit(0);
}

if (command === 'init') {
  process.stdout.write(`const NS=${literal(namespace)};
const page=await figma.getNodeByIdAsync(${literal(pageId)});
if(!page||page.type!=='PAGE')throw new Error('ATLAS_SOURCE_PAGE_NOT_FOUND');
if(page.name!==${literal(pageName)})throw new Error('ATLAS_SOURCE_PAGE_NAME_DRIFT');
await figma.setCurrentPageAsync(page);
let library=page.findOne(n=>n.type==='FRAME'&&n.getSharedPluginData(NS,'entity')==='atlas-source-library');
if(!library){
  if(page.children.length!==0)throw new Error('ATLAS_SOURCE_PAGE_NONEMPTY_CONFLICT');
  library=figma.createFrame();
  library.name='90 / ATLAS GOVERNED SOURCE LIBRARY — EDITABLE / DO NOT APPROXIMATE';
  library.resize(1680,${sources.length * 980 + 160});
  library.x=3200;library.y=0;library.fills=[];library.clipsContent=false;
  library.setSharedPluginData(NS,'entity','atlas-source-library');
  library.setSharedPluginData(NS,'source_count',${literal(String(sources.length))});
  library.setSharedPluginData(NS,'authority_status','governed-provisional');
  library.setSharedPluginData(NS,'verification_status','NOT VERIFIED');
  library.setSharedPluginData(NS,'publication_status','nonpublishable');
  page.appendChild(library);
}
return {status:'source-library-ready',pageId:page.id,libraryId:library.id,existingAssets:library.children.length};`);
  process.exit(0);
}

if (command === 'stage') {
  if (!source) throw new Error(`Unknown Atlas source: ${sourceId}`);
  const chunkIndex = Number(chunkIndexRaw);
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= source.chunks.length) throw new Error(`Invalid chunk index for ${sourceId}: ${chunkIndexRaw}`);
  const key = `atlas_stage_${source.id}_${chunkIndex}`;
  process.stdout.write(`const NS=${literal(namespace)};
const page=await figma.getNodeByIdAsync(${literal(pageId)});
if(!page||page.type!=='PAGE'||page.name!==${literal(pageName)})throw new Error('ATLAS_SOURCE_PAGE_DRIFT');
page.setSharedPluginData(NS,${literal(key)},${literal(source.chunks[chunkIndex])});
return {status:'atlas-source-chunk-staged',sourceId:${literal(source.id)},chunkIndex:${chunkIndex},chunkCount:${source.chunks.length},characters:${source.chunks[chunkIndex].length}};`);
  process.exit(0);
}

if (command === 'finalize') {
  if (!source) throw new Error(`Unknown Atlas source: ${sourceId}`);
  const keys = source.chunks.map((_, index) => `atlas_stage_${source.id}_${index}`);
  process.stdout.write(`const NS=${literal(namespace)};
const page=await figma.getNodeByIdAsync(${literal(pageId)});
if(!page||page.type!=='PAGE'||page.name!==${literal(pageName)})throw new Error('ATLAS_SOURCE_PAGE_DRIFT');
await figma.setCurrentPageAsync(page);
const library=page.findOne(n=>n.type==='FRAME'&&n.getSharedPluginData(NS,'entity')==='atlas-source-library');
if(!library)throw new Error('ATLAS_SOURCE_LIBRARY_MISSING');
let node=library.findOne(n=>n.getSharedPluginData(NS,'atlas_source_id')===${literal(source.id)});
const keys=${literal(keys)};
const created=!node;
if(!node){
  const chunks=keys.map(key=>page.getSharedPluginData(NS,key));
  if(chunks.some(chunk=>!chunk))throw new Error('ATLAS_SOURCE_CHUNK_MISSING');
  const svg=chunks.join('');
  if(svg.length!==${source.source.length}||!svg.startsWith('<svg')||!svg.trimEnd().endsWith('</svg>'))throw new Error('ATLAS_SOURCE_REASSEMBLY_FAILED');
  node=figma.createNodeFromSvg(svg);
  node.name=${literal(`Atlas Source / ${source.id} / ${source.relativePath}`)};
  library.appendChild(node);
  node.x=40;node.y=${80 + source.index * 980};
}
node.setSharedPluginData(NS,'entity','atlas-source-asset');
node.setSharedPluginData(NS,'atlas_source_id',${literal(source.id)});
node.setSharedPluginData(NS,'source_path',${literal(source.relativePath)});
node.setSharedPluginData(NS,'sha256',${literal(source.sha256)});
node.setSharedPluginData(NS,'source_width',${literal(String(source.width))});
node.setSharedPluginData(NS,'source_height',${literal(String(source.height))});
node.setSharedPluginData(NS,'authority_status','governed-provisional');
node.setSharedPluginData(NS,'verification_status','NOT VERIFIED');
node.setSharedPluginData(NS,'publication_status','nonpublishable');
for(const key of keys)page.setSharedPluginData(NS,key,'');
return {status:created?'atlas-source-created':'atlas-source-repaired',sourceId:${literal(source.id)},nodeId:node.id,width:node.width,height:node.height,sha256:${literal(source.sha256)},sourcePath:${literal(source.relativePath)}};`);
  process.exit(0);
}

if (command === 'lock') {
  process.stdout.write(`const NS=${literal(namespace)};
const page=await figma.getNodeByIdAsync(${literal(pageId)});
if(!page||page.type!=='PAGE'||page.name!==${literal(pageName)})throw new Error('ATLAS_SOURCE_PAGE_DRIFT');
await figma.setCurrentPageAsync(page);
const library=page.findOne(n=>n.type==='FRAME'&&n.getSharedPluginData(NS,'entity')==='atlas-source-library');
if(!library)throw new Error('ATLAS_SOURCE_LIBRARY_MISSING');
const assets=library.children.filter(n=>n.getSharedPluginData(NS,'entity')==='atlas-source-asset');
if(assets.length!==${sources.length})throw new Error('ATLAS_SOURCE_LIBRARY_INCOMPLETE:'+assets.length);
const ids=new Set(assets.map(n=>n.getSharedPluginData(NS,'atlas_source_id')));
const missing=${literal(sources.map((item) => item.id))}.filter(id=>!ids.has(id));
if(missing.length)throw new Error('ATLAS_SOURCE_ASSETS_MISSING:'+missing.join(','));
library.locked=true;
library.setSharedPluginData(NS,'build_status','complete');
return {status:'atlas-source-library-complete',libraryId:library.id,assetCount:assets.length,assetIds:[...ids]};`);
  process.exit(0);
}

throw new Error('Usage: build-figma-atlas-source-staging-code.mjs manifest | init | stage <source-id> <chunk-index> | finalize <source-id> | lock');
