import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';

function resolveReference(root, reference) {
  if (!reference.startsWith('#/')) throw new Error(`unsupported schema reference: ${reference}`);
  return reference.slice(2).split('/').reduce(
    (value, segment) => value[segment.replaceAll('~1', '/').replaceAll('~0', '~')],
    root,
  );
}

function matchesType(type, value) {
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'null') return value === null;
  return typeof value === type;
}

export function schemaErrors(schema, value, root = schema, path = '$') {
  if (schema.$ref) return schemaErrors(resolveReference(root, schema.$ref), value, root, path);

  const errors = [];
  if (schema.oneOf) {
    const matches = schema.oneOf.map((candidate) => schemaErrors(candidate, value, root, path));
    if (matches.filter((result) => result.length === 0).length !== 1) {
      errors.push(`${path} must match exactly one allowed shape`);
    }
    return errors;
  }

  if (Object.hasOwn(schema, 'const') && !isDeepStrictEqual(value, schema.const)) {
    errors.push(`${path} must equal its canonical value`);
  }
  if (schema.enum && !schema.enum.some((candidate) => isDeepStrictEqual(value, candidate))) {
    errors.push(`${path} must be an allowed value`);
  }
  if (schema.type && !matchesType(schema.type, value)) {
    errors.push(`${path} must be ${schema.type}`);
    return errors;
  }
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
    errors.push(`${path} must match ${schema.pattern}`);
  }
  if (schema.minLength !== undefined && typeof value === 'string' && value.length < schema.minLength) {
    errors.push(`${path} is too short`);
  }
  if (schema.exclusiveMinimum !== undefined && typeof value === 'number' && value <= schema.exclusiveMinimum) {
    errors.push(`${path} must be greater than ${schema.exclusiveMinimum}`);
  }

  if (schema.type === 'object') {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${path}.${required} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) errors.push(`${path}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) errors.push(...schemaErrors(child, value[key], root, `${path}.${key}`));
    }
  }

  if (schema.type === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path} must contain unique items`);
    }
    if (schema.items) value.forEach((item, index) => errors.push(...schemaErrors(schema.items, item, root, `${path}[${index}]`)));
  }

  return errors;
}

export function assertSchemaValid(schema, value) {
  assert.deepEqual(schemaErrors(schema, value), []);
}
