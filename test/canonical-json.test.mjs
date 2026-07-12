import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalJson } from '../scripts/lib/canonical-json.mjs';

test('sorts object keys recursively and preserves array order', () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 3 }, list: ['b', 'a'] }), '{\n  "a": {\n    "x": 3,\n    "y": 2\n  },\n  "list": [\n    "b",\n    "a"\n  ],\n  "z": 1\n}\n');
});
