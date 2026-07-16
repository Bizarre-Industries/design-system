import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FIGMA_IMPORT_PLAN_PATH,
  expectedFigmaVariableImportPlanText,
  validateFigmaVariableImportPlan,
} from './lib/figma-variable-import-plan.mjs';

const rootUrl = new URL('../', import.meta.url);
const actualText = await readFile(new URL(`../${FIGMA_IMPORT_PLAN_PATH}`, import.meta.url), 'utf8');
const plan = JSON.parse(actualText);
assert.deepEqual(validateFigmaVariableImportPlan(plan), []);
assert.deepEqual(plan.blockedAmbiguities, [], 'blocked ambiguities must be resolved before Figma mutation');
assert.equal(actualText, await expectedFigmaVariableImportPlanText(rootUrl), 'canonical variable import artifact drift');

console.log('Validated 9 collections, 173 variables, 5 Modes values, 7 governed live-registry font-family mappings, and 4 shadow effect-style handoffs without mutating Figma');
