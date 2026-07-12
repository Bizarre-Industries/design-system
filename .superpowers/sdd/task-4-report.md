# Task 4 report: canonical token sources and ordered loading

## Status

Implemented the ordered canonical DTCG source model and migrated the approved loose-CSS primitives. The root `tokens/tokens.css` remains untracked and unstaged as migration input, per the controller brief.

## Delivered

- Added an explicit six-document source manifest. Loading follows manifest order and ignores undeclared files.
- Added palette, typography, geometry, and motion token documents using the requested DTCG types.
- Converted the brand accent and the existing five mode pairs to checked aliases without changing any semantic foreground/background pairing.
- Added duplicate path rejection across documents, safe/unique manifest validation, local type inheritance, missing-target checks, DFS cycle detection, and alias type compatibility checks.
- Migrated palette, font stacks and weights, fixed type sizes, leading, tracking, spacing, radii, borders, durations, easing curves, shadows, and z layers.
- Explicitly rejected the loose `fs-hero` clamp as a computed responsive usage expression rather than pretending it is an atomic DTCG `dimension`; canonical 4xl-6xl bounds remain available.

## TDD evidence

- RED: `node --test test/token-model.test.mjs` failed because `resolveTokenAliases` was not exported.
- GREEN: `node --test test/token-model.test.mjs` passes 16/16.
- `git diff --check` passes.

## Full-suite sequencing concern

`npm test` currently passes 77 tests and fails 4 build-token tests. These failures are the Task 5 boundary: the current serializer emits alias strings literally and its temporary fixtures do not create the new source manifest. Task 4 intentionally did not modify `scripts/build-tokens.mjs` or `test/build-tokens.test.mjs` because they are assigned to the downstream deterministic CSS task.

## Preservation

Unrelated untracked identity inputs and `tokens/tokens.css` were not staged or modified. No semantic accessibility pair was changed; only the prior literal values were replaced with same-value primitive aliases.
