import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

function validateFixedSchema(schema, value, path = '$') {
  if (schema.type === 'object') {
    assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${path} must be an object`);
    for (const required of schema.required ?? []) assert.ok(Object.hasOwn(value, required), `${path}.${required} is required`);
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) assert.ok(Object.hasOwn(schema.properties, key), `${path}.${key} is not allowed`);
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateFixedSchema(child, value[key], `${path}.${key}`);
    }
  }
  if (Object.hasOwn(schema, 'const')) assert.deepEqual(value, schema.const, `${path} must equal its canonical value`);
}

test('identity preserves permanent Bizarre Industries decisions', async () => {
  const identity = await readJson('brand/identity.json');
  assert.equal(identity.schemaVersion, 1);
  assert.equal(identity.companyName, 'Bizarre Industries');
  assert.equal(identity.tagline, 'CATCH THE STARS.');
  assert.deepEqual(identity.accent, { name: 'Signal Lime', value: '#C6FF24' });
  assert.equal(identity.expressions.core, 'Precision Signal');
  assert.equal(identity.expressions.editorial, 'Editorial Monument');
  assert.equal(identity.expressions.physical, 'Workshop Stamp');
  assert.deepEqual(identity.themeOrder, ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']);
});

test('identity schema accepts only the canonical identity shape and values', async () => {
  const schema = await readJson('schemas/identity.schema.json');
  const identity = await readJson('brand/identity.json');
  assert.doesNotThrow(() => validateFixedSchema(schema, identity));
  assert.throws(() => validateFixedSchema(schema, { ...identity, unexpected: true }), /not allowed/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, accent: { ...identity.accent, unexpected: true } }), /not allowed/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, expressions: { ...identity.expressions, unexpected: true } }), /not allowed/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, tagline: 'Almost canonical' }), /canonical value/);
});
