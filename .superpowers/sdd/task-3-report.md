# Task 3 report: governed fonts and asset inventory

## Outcome

- Added the canonical `brand/assets.json` manifest and restrictive JSON Schema.
- Added `validateAssets(rootUrl, manifest)`, including safe relative-path checks, leaf and ancestor symlink rejection, exact media-type and SHA-256 validation, derivative/master enforcement, approval enforcement, family-specific OFL enforcement, and path-sorted results.
- Published exactly six supplied variable TTF masters, six WOFF2 derivatives, four families' original OFL/README files, the three accepted SVG marks, and WOFF2-first local font CSS.
- Added the `@bizarre/assets` workspace package with an explicit publish allowlist and exports.

## TDD evidence

1. `node --test test/assets.test.mjs` failed with `ERR_MODULE_NOT_FOUND` before the validator existed.
2. The first implementation exposed a path-ordering mismatch; the comparator was corrected and the focused suite passed.
3. A new ancestor-symlink regression test failed with `Missing expected rejection`; component-by-component `lstat` validation made it pass.

The focused suite covers valid manifests, missing paths, symlink leaves and ancestors, traversal, hash drift, media-type drift, orphan derivatives, unapproved entries, and missing family OFL licenses.

## Font derivative reproducibility

No runtime dependency was added. The derivatives were generated in a transient virtual environment with:

```sh
python3 -m venv /tmp/bizarre-fonttools
/tmp/bizarre-fonttools/bin/pip install 'fonttools[woff]==4.59.1'
for font in packages/assets/fonts/source/*.ttf; do
  /tmp/bizarre-fonttools/bin/python -m fontTools.ttLib.woff2 compress "$font"
  mv "${font%.ttf}.woff2" packages/assets/fonts/web/
done
```

Every WOFF2 entry records its exact TTF master and SHA-256 digest in the manifest.

## Verification

- `node --test test/assets.test.mjs`: 7/7 passed.
- `npm test`: 64/64 passed at the pre-report verification point.
- `npm pack --dry-run --workspace @bizarre/assets`: 27 files; no static TTFs, root PNGs, source lockups, `BRAND.md`, `proof-sheet.html`, or `tokens/tokens.css`.
- `git diff --check`: clean.

## Important review finding remediation

Strengthened font lineage validation so `master` is accepted only on `font/woff2` entries. Every WOFF2 must point directly to a governed `font/ttf` entry with no master of its own. Self-references, cycles, WOFF2-to-WOFF2 links, and family, style, weight-range, or license drift between derivative and master are rejected.

### Exact RED evidence

Command: `node --test test/assets.test.mjs`

- Exit code: `1`
- Summary: `tests 16`, `pass 7`, `fail 9`
- `rejects master on a non-WOFF2 entry`: `Missing expected rejection.`
- `rejects a WOFF2 entry without a master`: `Missing expected rejection.`
- `rejects a self-referencing WOFF2 master`: `Missing expected rejection.`
- `rejects cyclic font master references`: `Missing expected rejection.`
- `rejects a WOFF2-to-WOFF2 master link`: `Missing expected rejection.`
- Derivative `family` and `license` mismatches reached the pre-existing OFL check instead of the required master-parity error.
- Derivative `style` and `weightRange` mismatches reported `Missing expected rejection.`

### Exact GREEN evidence

Command: `node --test test/assets.test.mjs`

- Exit code: `0`
- Summary: `tests 16`, `pass 16`, `fail 0`, duration `72.439125 ms`

Command: `npm test`

- Exit code: `0`
- Summary: `tests 74`, `pass 74`, `fail 0`, duration `501.615875 ms`

## Whitespace review remediation

Normalized the four governed OFL copies from CRLF to LF and removed trailing horizontal whitespace without changing license wording. Updated the corresponding SHA-256 values in both `brand/assets.json` and `packages/assets/manifest.json`.

Added validator regressions for governed `text/*` assets. Before implementation, `node --test test/assets.test.mjs` exited `1`: both new cases reported `Missing expected rejection.` After validation and asset normalization, the focused suite passed `18/18` and the full suite passed `76/76`.

Verification before commit:

- `git diff --ignore-all-space --exit-code HEAD -- packages/assets/fonts/licenses/*/OFL.txt`: exit `0`, confirming wording-equivalent whitespace-only changes.
- `node --test test/assets.test.mjs`: exit `0`; `18` passed, `0` failed.
- `npm test`: exit `0`; `76` passed, `0` failed.
- `git diff --check aecbbf7`: exit `0`.
