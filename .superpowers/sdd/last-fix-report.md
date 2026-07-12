# Last final-review fix report

Date: 2026-07-12
Branch: `codex/identity-refinement`
Review range: `a266b5c..HEAD`
Commit: the DCO-signed commit containing this report

## Change

- Replaced the foundational mark rule that authorized monochrome with a rule limited to the approved primary, inverse, and transparent treatments and their governed Signal Lime, Void, and Void Gray color-role combinations.
- Kept monochrome variants explicitly deferred and unavailable.
- Strengthened the documentation contract against `brand/assets.json`: it fixes the current approved logo variant set and rejects foundational or current-variant prose that authorizes monochrome when no approved monochrome asset exists.
- Regenerated token and asset manifests to update only the governed `BRAND.md` byte count and SHA-256 evidence.

## Verification evidence

- TDD red: `node --test test/documentation-contract.test.mjs` failed on the old foundational rule because it did not name the approved primary, inverse, and transparent treatments.
- TDD green: the same command passed 2/2 after the documentation correction.
- Focused docs/assets gate: `node --test test/documentation-contract.test.mjs test/assets.test.mjs test/build-assets.test.mjs test/build-tokens.test.mjs test/evidence.test.mjs` passed 36/36.
- Full gate: `npm run verify` passed 99/99 tests and generated-drift checking.
- Explicit generation: `npm run build && npm run check:generated` exited 0.
- Branch whitespace: `git diff --check a266b5c..HEAD` exited 0.
- Clean archive: a fresh `git archive HEAD` extraction at `/tmp/bizarre-last-fix.Z17eXQ` passed `npm ci`, `npm run verify` (99/99), `npm run build`, `npm run check:generated`, an index-wide whitespace check, and the source branch-range `git diff --check a266b5c..HEAD`.

## Protected user files

The untracked root `fonts/`, `logo/mark-inverse.png`, `logo/mark-primary.png`, and `tokens/tokens.css` were not modified or staged.

## Concerns

None. The clean-archive verification excludes the protected untracked files and confirms the committed repository is self-contained for this fix.
