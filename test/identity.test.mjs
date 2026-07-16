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

test('identity preserves the current versioned Bizarre Industries decisions', async () => {
  const identity = await readJson('brand/identity.json');
  assert.equal(identity.schemaVersion, 4);
  assert.equal(identity.companyName, 'Bizarre Industries');
  assert.equal(identity.tagline, 'CATCH THE STARS');
  assert.equal(identity.taglineMeaning, 'Make the distant tangible');
  assert.deepEqual(identity.accent, { name: 'Signal Lime', value: '#C6FF24' });
  assert.deepEqual(identity.mark, {
    name: 'Gravity Well',
    geometry: 'invariant',
    approvedFigureColors: ['Signal Lime', 'Black'],
    mixedFigureColorAllowed: false,
  });
  assert.deepEqual(identity.layoutModes, ['Precision Panel', 'Display Field']);
  assert.deepEqual(identity.typography, {
    display: 'Unbounded', stencil: 'Big Shoulders Stencil',
    body: 'Hanken Grotesk', mono: 'JetBrains Mono'
  });
  assert.deepEqual(identity.identityModel, {
    model: 'single-identity', publicIdentity: 'Bizarre Industries',
    subbrandsAllowed: false, childBrandsAllowed: false
  });
  assert.deepEqual(identity.productIntegration, {
    principle: 'integrate-not-replace', auditBeforeStyling: true,
    hostSystemFirst: true, conflictResolution: 'host-convention-wins',
    hostBehavior: 'preserve', hostVisualLanguage: 'preserve',
    bizarreExpression: 'restrained-recognition-layer',
    platformProfiles: {
      web: {
        implementationLayer: 'host-framework',
        implementationIsVisualLanguage: false,
        preserve: ['existing-component-system', 'semantic-html', 'browser-conventions']
      },
      ios: {
        framework: 'SwiftUI',
        preserve: ['system-controls', 'navigation', 'typography', 'accessibility', 'touch-input', 'motion']
      },
      macos: {
        framework: 'SwiftUI',
        preserve: ['system-controls', 'windows', 'menus', 'typography', 'accessibility', 'keyboard-and-precision-input', 'motion']
      },
      other: { entryCondition: 'audit-existing-infrastructure' }
    }
  });
  assert.deepEqual(identity.themeOrder, ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']);
});

test('identity schema accepts only the canonical identity shape and values', async () => {
  const schema = await readJson('schemas/identity.schema.json');
  const identity = await readJson('brand/identity.json');
  assert.doesNotThrow(() => validateFixedSchema(schema, identity));
  assert.throws(() => validateFixedSchema(schema, { ...identity, unexpected: true }), /not allowed/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, accent: { ...identity.accent, unexpected: true } }), /not allowed/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, mark: { ...identity.mark, unexpected: true } }), /not allowed/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, identityModel: { ...identity.identityModel, subbrandsAllowed: true } }), /canonical value/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, productIntegration: { ...identity.productIntegration, hostVisualLanguage: 'replace' } }), /canonical value/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, productIntegration: { ...identity.productIntegration, conflictResolution: 'brand-wins' } }), /canonical value/);
  assert.throws(() => validateFixedSchema(schema, {
    ...identity,
    productIntegration: {
      ...identity.productIntegration,
      platformProfiles: {
        ...identity.productIntegration.platformProfiles,
        web: { ...identity.productIntegration.platformProfiles.web, implementationIsVisualLanguage: true }
      }
    }
  }), /canonical value/);
  assert.throws(() => validateFixedSchema(schema, { ...identity, tagline: 'Almost canonical' }), /canonical value/);
});
