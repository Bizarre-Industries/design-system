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
