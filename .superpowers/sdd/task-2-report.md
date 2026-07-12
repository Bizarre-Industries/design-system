# Task 2 report

Status: complete

Commit: `a0ca1d9` (`feat: publish canonical gravity well marks`, DCO signed off)

## Verification

- RED: `node --test test/logo-assets.test.mjs` failed with `ERR_MODULE_NOT_FOUND` before the SVG inspector and published masters existed.
- GREEN: `node --test test/logo-assets.test.mjs` passed 3/3 tests.
- Full suite: `node --test` passed 57/57 tests.
- Whitespace: `git diff --check` and `git diff --cached --check` passed.
- Rendering: Quick Look produced 1024 px thumbnails for primary, inverse, and transparent masters; visual inspection confirmed the same square gravity-well geometry without the wordmark. The transparent render reports an alpha channel.

## Scope

- Preserved the supplied lockup SVG bytes at stable source-evidence paths.
- Published primary, inverse, and transparent mark-only SVG masters with the exact governed square viewBox and verbatim ordered gravity-well `d` attributes.
- Added deterministic trusted-format SVG contract inspection and regression tests.
- Left unrelated `BRAND.md`, fonts, proof sheet, token CSS, PNGs, and `.DS_Store` unstaged and uncommitted.

## Concerns

None.

## Review fix: corrected figure/ground polarity

Status: complete

### Evidence

- Added a regression test that checks ordered element-to-color assignments rather than mere color presence. It fails against `a0ca1d9` because primary begins with a `#545454` rectangle instead of Signal Lime and because inverse geometry is Signal Lime instead of Void.
- Primary now renders with Signal Lime (`#C6FF24`) outer and field grounds and `#545454` gravity-well/frame/spiral geometry.
- Inverse now renders with a Void (`#0E0E0E`) outer ground, Signal Lime mark field, and Void gravity-well/frame/spiral geometry.
- Ordered `d` attributes remain unchanged and continue to compare exactly against both preserved source lockups.
- All three published SVGs now contain real newline characters and no literal `\\n` sequences.

### Commands and outputs

- RED: `node --test test/logo-assets.test.mjs` failed 2/4 tests. The polarity assertion reported primary rectangle fills as `['#545454']` instead of `['#C6FF24', '#C6FF24']`; the newline assertion reported literal `\\n` text.
- GREEN: `node --test test/logo-assets.test.mjs && git diff --check` passed 4/4 tests with exit code 0 and no whitespace errors.
- Render: `qlmanage -t -s 1024 -o /tmp/bizarre-logo-proof packages/assets/logo/mark-primary.svg packages/assets/logo/mark-inverse.svg packages/assets/logo/mark-transparent.svg` produced three 1024 x 1024 RGBA thumbnails. Visual inspection confirmed the primary and inverse references' figure/ground assignments, consistent padding, identical gravity-well geometry, and a wordmark-free transparent variant.
- Full suite: `npm test` passed 58/58 tests with 0 failures.

### Concerns

None.
