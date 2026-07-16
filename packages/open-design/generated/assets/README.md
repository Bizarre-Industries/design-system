# @bizarre/assets

Governed, approved Bizarre Industries marks and local variable fonts. Import `@bizarre/assets/fonts.css` for WOFF2-first `@font-face` declarations; TTF masters remain as local fallbacks and derivative provenance.

The Gravity Well figure is strictly monochrome: fully Signal Lime or fully black. Use `mark-primary.svg` for black on Signal Lime, `mark-inverse.svg` for Signal Lime on Deep Void, and `mark-transparent.svg` for black on an approved light-neutral ground. Its geometry is identical in every variant; mixed figure colors and gradients are forbidden.

Only the six selected variable TTF masters are distributed. Each family includes its upstream `OFL.txt` and `README.txt`; static instances and source lockups are intentionally excluded.

## Reproducing web fonts

The committed WOFF2 files were generated with Python 3 and a transient FontTools environment (not a runtime dependency):

```sh
python3 -m venv /tmp/bizarre-fonttools
/tmp/bizarre-fonttools/bin/pip install 'fonttools[woff]==4.59.1'
for font in packages/assets/fonts/source/*.ttf; do
  /tmp/bizarre-fonttools/bin/python -m fontTools.ttLib.woff2 compress "$font"
  mv "${font%.ttf}.woff2" packages/assets/fonts/web/
done
```

## Provisional Atlas boundary

The owner-selected left Continuous Lens Aperture v2 is a governed-provisional working master. Every current Atlas field, texture, capture sequence, instrument dial, and livery strip depends on it. Those exact working SVGs remain in `packages/atlas/generated/` and are governed by `brand/provisional-assets.json`; they are not copied or exported by this package. Promotion requires numerical geometry, provenance, accessibility, and production verification, dependent-asset regeneration, and a publishable-boundary review.

Every packaged file records its SHA-256, media type, approval, allowed uses, source provenance, and master/derivative relationship. The approved public inventory is `brand/assets.json`; generated package metadata lives in `generated/manifest.json`. The public build validates that its inventory is disjoint from the provisional working inventory before it emits any files.
