# @bizarre/assets

Governed Bizarre Industries marks and local variable fonts. Import `@bizarre/assets/fonts.css` for WOFF2-first `@font-face` declarations; TTF masters remain as local fallbacks and derivative provenance.

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

The SHA-256 values and each derivative-to-master relationship are recorded in `manifest.json` and the canonical repository manifest at `brand/assets.json`.
