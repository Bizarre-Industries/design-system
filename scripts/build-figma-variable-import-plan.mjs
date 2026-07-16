import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson } from './lib/canonical-json.mjs';
import {
  FIGMA_IMPORT_PLAN_PATH,
  buildFigmaVariableImportPlan,
  validateFigmaVariableImportPlan,
} from './lib/figma-variable-import-plan.mjs';

const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootUrl = new URL('../', import.meta.url);
const outputPath = resolve(rootPath, FIGMA_IMPORT_PLAN_PATH);
const plan = await buildFigmaVariableImportPlan(rootUrl);
const errors = validateFigmaVariableImportPlan(plan);
if (errors.length > 0) throw new Error(`Figma variable import plan validation failed:\n${errors.join('\n')}`);
if (plan.blockedAmbiguities.length > 0) {
  throw new Error(`Figma variable import plan has blocked ambiguities:\n${plan.blockedAmbiguities.map(({ code, sourceTokenPath, message }) => `${code} ${sourceTokenPath}: ${message}`).join('\n')}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, canonicalJson(plan));
console.log(`Wrote ${plan.variableCount} canonical Figma variables to ${outputPath}`);
