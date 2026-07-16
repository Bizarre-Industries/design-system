import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const receiptUrl = new URL('../governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-apply.json', import.meta.url);
const planUrl = new URL('../governance/design-ledgers/figma/bizarre-atlas-v1-canonical-variable-import.json', import.meta.url);

test('records the additive live Figma variable migration against the exact governed plan', async () => {
  const [receiptText, planText] = await Promise.all([
    readFile(receiptUrl, 'utf8'),
    readFile(planUrl, 'utf8'),
  ]);
  const receipt = JSON.parse(receiptText);
  const plan = JSON.parse(planText);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.status, 'APPLIED_AND_VERIFIED');
  assert.equal(receipt.figmaFileKey, 'hGgrP9G0tEam8mpk5u3rHg');
  assert.equal(receipt.sourcePlan.planVersion, plan.planVersion);
  assert.equal(receipt.sourcePlan.canonicalSha256, plan.canonicalSha256);
  assert.equal(receipt.sourcePlan.fileSha256, createHash('sha256').update(planText).digest('hex'));
  assert.deepEqual(receipt.validation.errors, []);
});

test('preserves all legacy collections while adding exactly nine canonical collections and 173 variables', async () => {
  const receipt = JSON.parse(await readFile(receiptUrl, 'utf8'));
  assert.deepEqual(receipt.mutationPolicy, {
    additive: true,
    legacyCollectionsPreserved: true,
    legacyVariablesPreserved: true,
    legacyPagesPreserved: true,
    deletionsPerformed: false,
  });
  assert.deepEqual(receipt.totals, {
    localCollections: 16,
    localVariables: 392,
    canonicalCollections: 9,
    canonicalVariables: 173,
    legacyCollections: 7,
    legacyVariables: 219,
  });
  assert.deepEqual(
    receipt.canonicalCollections.map(({ name, variableCount }) => [name, variableCount]),
    [
      ['Palette', 34],
      ['Brand', 1],
      ['Typography', 37],
      ['Geometry', 29],
      ['Motion', 9],
      ['Atlas', 15],
      ['Material', 7],
      ['Capture', 14],
      ['Modes', 27],
    ],
  );
  assert.deepEqual(receipt.canonicalCollections.at(-1).modes.map(({ name }) => name), [
    'void',
    'paper',
    'void-hicontrast',
    'workshop',
    'bone',
  ]);
});

test('records the Figma BOOLEAN scope limitation without reintroducing rejected aperture semantics', async () => {
  const receipt = JSON.parse(await readFile(receiptUrl, 'utf8'));
  assert.deepEqual(receipt.platformExceptions, [{
    variable: 'Atlas::aperture/tangent-continuity',
    variableId: 'VariableID:52:176',
    resolvedType: 'BOOLEAN',
    value: true,
    conceptualScopes: [],
    liveApiReportedScopes: ['ALL_SCOPES'],
    operation: 'OMIT_SCOPE_ASSIGNMENT',
    reason: 'Figma BOOLEAN variables reject scope assignment with: Invalid scope for this variable type.',
  }]);
  assert.doesNotMatch(receiptTextWithoutPlatformError(receipt), /(?:notch|chamfer|wedge|key[- ]cut)/iu);
});

function receiptTextWithoutPlatformError(receipt) {
  const copy = structuredClone(receipt);
  for (const exception of copy.platformExceptions ?? []) delete exception.reason;
  return JSON.stringify(copy);
}
