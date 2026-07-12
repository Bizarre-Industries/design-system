# Bizarre Industries Identity Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize the supplied Bizarre Industries identity into governed, accessible, deterministic token and asset packages without changing the official gravity-well geometry.

**Architecture:** Machine-readable identity, token sources, and asset manifests are the authorities; generated packages and the proof sheet are derived outputs. Token loading uses an explicit ordered manifest, asset publication uses allowlisted inventories and hashes, and every semantic color role declares a tested foreground/background pair.

**Tech Stack:** Node.js 22 ESM, Node test runner, JSON Schema-shaped contracts, DTCG token JSON, deterministic CSS/JSON generation, SVG, CSS `@font-face`, npm workspaces.

## Global Constraints

- The permanent slogan is exactly `CATCH THE STARS`, with no trailing punctuation.
- Signal Lime is `#C6FF24` and remains the sole brand accent.
- Preserve the supplied gravity-well paths exactly; remove outlined text and crop only.
- Generate the inverse from the same geometry with Void ground and Signal Lime geometry.
- `tokens/source/` is the only machine-readable token authority.
- Generated CSS uses only `--bzr-*` custom properties and `[data-bizarre-theme="<mode>"]` selectors.
- Normal text pairs require 4.5:1 contrast; explicit large-text and non-text roles require 3:1.
- Runtime examples use local governed assets and no remote font dependency.
- `@bizarre/tokens` stays token-only; reusable logos and fonts ship from `@bizarre/assets`.
- Use test-first red/green/refactor cycles and signed-off focused commits.

---

## File map

- `brand/identity.json`, `schemas/identity.schema.json`: permanent identity and brand architecture.
- `brand/assets.json`, `schemas/assets.schema.json`: governed logo/font inventory and integrity metadata.
- `logo/source/*.svg`: owner-supplied source evidence retained without publication.
- `packages/assets/logo/*.svg`: approved cleaned masters.
- `packages/assets/fonts/source/*`: minimal variable-font source set and OFL licenses.
- `packages/assets/fonts/bizarre-fonts.css`: repository-owned font-face contract.
- `tokens/source/manifest.json`: explicit token source merge order.
- `tokens/source/*.tokens.json`: primitives, semantics, typography, geometry, and motion.
- `scripts/lib/token-model.mjs`: ordered loading, DTCG validation, alias resolution.
- `scripts/lib/assets.mjs`: asset validation and hashing.
- `scripts/build-tokens.mjs`: deterministic token outputs.
- `scripts/build-assets.mjs`: deterministic asset manifest/package output.
- `examples/identity-proof/index.html`: offline derived proof sheet.
- `test/*.test.mjs`: behavioral, accessibility, integrity, determinism, and documentation contracts.

### Task 1: Normalize the permanent identity contract

**Files:**
- Modify: `brand/identity.json`
- Modify: `schemas/identity.schema.json`
- Modify: `test/identity.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces: identity fields `mark.name`, `typography`, `layoutModes`, `organization`, and exact `tagline`.
- Consumes: no new interface.

- [ ] **Step 1: Write failing identity tests**

Add these assertions and update the surrounding expected object shape to schema version 2:

```js
assert.equal(identity.tagline, 'CATCH THE STARS');
assert.equal(identity.mark.name, 'Gravity Well');
assert.deepEqual(identity.layoutModes, ['Precision Panel', 'Display Field']);
assert.deepEqual(identity.typography, {
  display: 'Unbounded', stencil: 'Big Shoulders Stencil',
  body: 'Hanken Grotesk', mono: 'JetBrains Mono'
});
assert.deepEqual(identity.organization, {
  parent: 'Bizarre Industries', commercialArm: 'Bizarre Labs',
  foundation: 'Bizarre Foundation', products: ['Helling']
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/identity.test.mjs`
Expected: FAIL because the old tagline contains a period and the new fields are absent.

- [ ] **Step 3: Update the identity and fixed-value schema**

Set the exact tested values in both JSON files, increment `schemaVersion` to `2`, remove the legacy `expressions` object, and retain the existing theme order.

- [ ] **Step 4: Synchronize the repository introduction**

Change README identity copy to `CATCH THE STARS` and state that `brand/identity.json` is the permanent machine-readable contract.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --test test/identity.test.mjs && git diff --check`
Expected: PASS and no whitespace errors.

```bash
git add brand/identity.json schemas/identity.schema.json test/identity.test.mjs README.md
git commit -s -m "feat: normalize canonical identity"
```

### Task 2: Produce governed mark-only SVG masters

**Files:**
- Create: `logo/source/original-lockup.svg`
- Create: `logo/source/transparent-lockup.svg`
- Create: `packages/assets/logo/mark-primary.svg`
- Create: `packages/assets/logo/mark-inverse.svg`
- Create: `packages/assets/logo/mark-transparent.svg`
- Create: `test/logo-assets.test.mjs`
- Create: `scripts/lib/svg-contract.mjs`

**Interfaces:**
- Produces: `inspectMarkSvg(text) -> { viewBox, pathData, fills, hasTextLockup }`.
- Consumes: supplied SVG path data and approved PNG visual references.

- [ ] **Step 1: Preserve the supplied lockups as source evidence**

Move the two supplied SVGs to the stable source filenames without modifying their bytes. Do not stage `.DS_Store`.

- [ ] **Step 2: Write failing SVG contract tests**

Test that each published SVG:

```js
assert.equal(mark.hasTextLockup, false);
assert.equal(mark.viewBox, '261.29998779296875 253.89999389648438 506.89996337890625 506.8000183105469');
assert.deepEqual(inverse.pathData, primary.pathData);
assert.ok(primary.fills.includes('#545454'));
assert.ok(primary.fills.includes('#C6FF24'));
assert.ok(inverse.fills.includes('#0E0E0E'));
assert.ok(inverse.fills.includes('#C6FF24'));
```

Also compare the ordered `d` attributes from the gravity-well group against both preserved source files.

- [ ] **Step 3: Run the focused test and verify RED**

Run: `node --test test/logo-assets.test.mjs`
Expected: FAIL because mark-only masters and the SVG inspector do not exist.

- [ ] **Step 4: Implement the SVG inspector**

Use deterministic string parsing limited to this trusted repository format. Extract `viewBox`, ordered `d` values, and normalized hex fills; flag the final lockup group or any `<text>` node as text content.

- [ ] **Step 5: Create cleaned masters**

Copy the inner gravity-well SVG group, preserve every `d` attribute verbatim, set the square view box above, remove the outlined wordmark group, and serialize stable primary, transparent, and inverse wrappers. The inverse wrapper adds a `#0E0E0E` background and uses `#C6FF24` for visible geometry.

- [ ] **Step 6: Render and visually compare**

Run:

```bash
qlmanage -t -s 1024 -o /tmp/bizarre-logo-proof packages/assets/logo/mark-primary.svg packages/assets/logo/mark-inverse.svg packages/assets/logo/mark-transparent.svg
```

Expected: all three render as the supplied gravity-well mark without wordmark text; inverse matches the supplied inverse PNG colors.

- [ ] **Step 7: Verify GREEN and commit**

Run: `node --test test/logo-assets.test.mjs && git diff --check`
Expected: PASS.

```bash
git add logo/source packages/assets/logo scripts/lib/svg-contract.mjs test/logo-assets.test.mjs
git commit -s -m "feat: publish canonical gravity well marks"
```

### Task 3: Govern fonts and the asset inventory

**Files:**
- Create: `brand/assets.json`
- Create: `schemas/assets.schema.json`
- Create: `scripts/lib/assets.mjs`
- Create: `test/assets.test.mjs`
- Create: `packages/assets/package.json`
- Create: `packages/assets/README.md`
- Create: `packages/assets/fonts/bizarre-fonts.css`
- Create: `packages/assets/fonts/source/BigShouldersStencil-VariableFont_opsz,wght.ttf`
- Create: `packages/assets/fonts/source/HankenGrotesk-VariableFont_wght.ttf`
- Create: `packages/assets/fonts/source/HankenGrotesk-Italic-VariableFont_wght.ttf`
- Create: `packages/assets/fonts/source/JetBrainsMono-VariableFont_wght.ttf`
- Create: `packages/assets/fonts/source/JetBrainsMono-Italic-VariableFont_wght.ttf`
- Create: `packages/assets/fonts/source/Unbounded-VariableFont_wght.ttf`
- Create: `packages/assets/fonts/web/*.woff2`

**Interfaces:**
- Produces: `validateAssets(rootUrl, manifest) -> Promise<Array<{ path, sha256, mediaType }>>`.
- Consumes: canonical mark SVGs and selected variable fonts/licenses.

- [ ] **Step 1: Write failing asset validation tests**

Cover valid manifests and rejection of missing paths, symlinks, `..` traversal, hash drift, wrong media type, derivative without master, publishable unapproved entry, and font entry without a family OFL license.

```js
await assert.rejects(validateAssets(root, badHash), /sha256 mismatch/);
await assert.rejects(validateAssets(root, traversal), /safe relative path/);
await assert.rejects(validateAssets(root, missingLicense), /OFL license/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/assets.test.mjs`
Expected: FAIL because the manifest and validator are absent.

- [ ] **Step 3: Implement safe asset validation**

Resolve every manifest path beneath the repository root, reject symlinks using `lstat`, read bytes once, verify SHA-256 and declared media type, then return rows sorted by path.

- [ ] **Step 4: Select the governed font source set**

Copy only these variable files plus each family `OFL.txt` and `README.txt`:

```text
BigShouldersStencil-VariableFont_opsz,wght.ttf
HankenGrotesk-VariableFont_wght.ttf
HankenGrotesk-Italic-VariableFont_wght.ttf
JetBrainsMono-VariableFont_wght.ttf
JetBrainsMono-Italic-VariableFont_wght.ttf
Unbounded-VariableFont_wght.ttf
```

Do not distribute the redundant static TTF instances.

- [ ] **Step 5: Create local font-face CSS**

Declare stable family names and exact variable ranges, for example:

```css
@font-face {
  font-family: "Hanken Grotesk";
  src: url("./source/HankenGrotesk-VariableFont_wght.ttf") format("truetype-variations");
  font-style: normal;
  font-weight: 300 900;
  font-display: swap;
}
```

Declare Big Shoulders Stencil normal `100 900`, Hanken Grotesk normal and italic `300 900`, JetBrains Mono normal and italic `100 800`, and Unbounded normal `200 900`, each pointing to its governed source file.

- [ ] **Step 6: Produce web derivatives**

Run `python3 -m fontTools.ttLib.woff2 compress <source.ttf>` for each of the six governed source fonts, write deterministic `.woff2` derivatives under `packages/assets/fonts/web/`, and add WOFF2-first sources to each `@font-face`. Record every derivative's source TTF in the asset manifest.

- [ ] **Step 7: Create and validate the asset manifest**

Record source/master relationships, hashes, media types, approval, logo roles, font family/style/weight range, and licenses. Package exports must list only approved logo/font paths, CSS, licenses, README, and manifest.

- [ ] **Step 8: Verify GREEN and commit**

Run: `node --test test/assets.test.mjs && npm pack --dry-run --workspace @bizarre/assets && git diff --check`
Expected: tests pass and package inventory contains no static font instances or source lockups.

```bash
git add brand/assets.json schemas/assets.schema.json scripts/lib/assets.mjs test/assets.test.mjs packages/assets
git commit -s -m "feat: govern brand asset package"
```

### Task 4: Expand canonical token sources and ordered loading

**Files:**
- Create: `tokens/source/manifest.json`
- Create: `tokens/source/palette.tokens.json`
- Create: `tokens/source/typography.tokens.json`
- Create: `tokens/source/geometry.tokens.json`
- Create: `tokens/source/motion.tokens.json`
- Modify: `tokens/source/brand.tokens.json`
- Modify: `tokens/source/modes.tokens.json`
- Modify: `scripts/lib/token-model.mjs`
- Modify: `test/token-model.test.mjs`

**Interfaces:**
- Produces: `loadTokenModel(rootUrl)`, `resolveTokenAliases(rows)`, and explicitly ordered merged token model.
- Consumes: DTCG documents named by `tokens/source/manifest.json`.

- [ ] **Step 1: Write failing ordered-source and alias tests**

Test that manifest order is honored; undeclared files are ignored; duplicate paths, missing aliases, alias cycles, and type mismatches fail with token paths in the message.

```js
assert.throws(() => resolveTokenAliases(cyclicRows), /alias cycle: a -> b -> a/);
assert.throws(() => resolveTokenAliases(missingRows), /missing token.*color\.neutral\.void/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/token-model.test.mjs`
Expected: FAIL because loading is hard-coded to two documents and aliases are unsupported.

- [ ] **Step 3: Implement manifest loading and alias resolution**

Require a non-empty unique array of safe relative JSON paths, merge in order with duplicate token rejection, retain local `$type` inheritance, and resolve `{token.path}` aliases with DFS cycle detection.

- [ ] **Step 4: Migrate approved primitives**

Represent the supplied palette as `color`; family stacks as `fontFamily`; weights as `fontWeight`; type sizes, spacing, radii, and borders as `dimension`; motion times as `duration`; easing arrays as `cubicBezier`; shadow layers as `shadow`; and unitless line heights and z-layers as `number`. Name every public path so generated CSS becomes `--bzr-*`.

- [ ] **Step 5: Remove competing loose CSS after migration**

Delete `tokens/tokens.css` only after every accepted value is represented by a canonical token or explicitly rejected by the specification.

- [ ] **Step 6: Verify GREEN and commit**

Run: `node --test test/token-model.test.mjs && git diff --check`
Expected: PASS.

```bash
git add tokens/source scripts/lib/token-model.mjs test/token-model.test.mjs
git commit -s -m "feat: expand canonical token model"
```

### Task 5: Add semantic themes and contrast enforcement

**Files:**
- Create: `scripts/lib/contrast.mjs`
- Create: `test/contrast.test.mjs`
- Modify: `tokens/source/modes.tokens.json`
- Modify: `test/token-model.test.mjs`

**Interfaces:**
- Produces: `contrastRatio(foregroundHex, backgroundHex) -> number` and `validateContrastPairs(model) -> void`.
- Consumes: resolved semantic token values and role metadata.

- [ ] **Step 1: Write failing contrast calculation tests**

Assert known values to two decimals and reject the legacy failures:

```js
assert.equal(contrastRatio('#1F1F1F', '#F9F8F2').toFixed(2), '15.49');
assert.equal(contrastRatio('#C6FF24', '#F9F8F2').toFixed(2), '1.11');
assert.throws(() => validateContrastPairs(failingModel), /semantic\.paper.*1\.11.*4\.5/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/contrast.test.mjs`
Expected: FAIL because contrast utilities are absent.

- [ ] **Step 3: Implement WCAG contrast math**

Convert sRGB channels to linear light using the WCAG formula, compute `(lighter + 0.05) / (darker + 0.05)`, and validate each declared pair against its explicit threshold.

- [ ] **Step 4: Define complete semantic role parity**

For all five modes, provide canvas/elevated/card surfaces; primary/secondary/muted/accent content; default/strong/accent borders; action states; and success/warning/danger/info surface/content pairs. Start from the supplied functional colors, pair dark status surfaces with Paper/Void content as measured, and darken or lighten only the functional status primitive when its declared pair misses 4.5:1. Preserve Signal Lime unchanged and never use it as light-mode content.

- [ ] **Step 5: Add parity and contrast validation to token loading**

Require identical role-path sets across modes. Error messages must identify the missing role or failing foreground/background pair.

- [ ] **Step 6: Verify GREEN and commit**

Run: `node --test test/contrast.test.mjs test/token-model.test.mjs && git diff --check`
Expected: PASS with every pair above threshold.

```bash
git add scripts/lib/contrast.mjs test/contrast.test.mjs tokens/source/modes.tokens.json test/token-model.test.mjs
git commit -s -m "feat: enforce accessible semantic themes"
```

### Task 6: Generate expanded deterministic token outputs

**Files:**
- Modify: `scripts/build-tokens.mjs`
- Modify: `test/build-tokens.test.mjs`
- Modify: `test/check-generated.test.mjs`
- Regenerate: `packages/tokens/generated/*`

**Interfaces:**
- Produces: deterministic CSS for primitive aliases and theme blocks.
- Consumes: resolved rows returned by the token model.

- [ ] **Step 1: Write failing output tests**

Assert support for aliases and DTCG values, the `--bzr-*` namespace, all five canonical selectors, and the absence of `[data-theme="light"]`, `--fs-`, `--surface-`, and unresolved `{...}` values.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/build-tokens.test.mjs`
Expected: FAIL because the builder supports only colors, strings, and numbers.

- [ ] **Step 3: Extend deterministic CSS serialization**

Serialize dimensions/durations with units, cubic Bézier arrays as `cubic-bezier(...)`, font-family arrays as quoted fallback lists, and shadows as stable CSS layers. Semantic aliases emit `var(--bzr-<primitive-path>)` where safe.

- [ ] **Step 4: Regenerate and verify drift checks**

Run: `npm run build && npm run check:generated`
Expected: generated CSS/JSON/manifest are updated and the drift checker passes.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --test test/build-tokens.test.mjs test/check-generated.test.mjs && git diff --check`
Expected: PASS.

```bash
git add scripts/build-tokens.mjs test/build-tokens.test.mjs test/check-generated.test.mjs packages/tokens/generated
git commit -s -m "feat: generate complete design tokens"
```

### Task 7: Integrate asset packaging and provenance

**Files:**
- Create: `scripts/build-assets.mjs`
- Create: `test/build-assets.test.mjs`
- Modify: `package.json`
- Modify: `governance/package-contract.json`
- Modify: `governance/evidence-allowlist.json`
- Modify: `test/package-contract.test.mjs`
- Modify: `test/evidence.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `buildExpectedAssets(rootUrl) -> Map<string, Buffer>`.
- Consumes: validated asset rows and brand asset manifest.

- [ ] **Step 1: Write failing package/provenance tests**

Require both workspace packages, exact asset package inventory, manifest evidence for the brand book/schema/licenses, and rejection of undeclared binary leakage.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test test/build-assets.test.mjs test/package-contract.test.mjs test/evidence.test.mjs`
Expected: FAIL because `@bizarre/assets` is not governed or built.

- [ ] **Step 3: Implement deterministic asset publication**

Build a sorted output map from approved asset entries and reuse the existing atomic package writer. Include an asset package manifest with per-file hashes and evidence hashes.

- [ ] **Step 4: Update workspace scripts and contracts**

Add `build:tokens`, `build:assets`, and a combined `build`; include both generated drift checks in `verify`; add `@bizarre/assets` to the package contract; ignore `.DS_Store` already covered and remove any tracked copy.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test && npm run build && npm run check:generated && npm pack --dry-run --workspace @bizarre/assets`
Expected: PASS with exact allowlisted package contents.

```bash
git add scripts/build-assets.mjs test/build-assets.test.mjs package.json governance test/package-contract.test.mjs test/evidence.test.mjs .gitignore packages/assets
git commit -s -m "feat: publish governed brand assets"
```

### Task 8: Normalize the brand book and offline proof sheet

**Files:**
- Modify: `BRAND.md`
- Create: `examples/identity-proof/index.html`
- Delete: `proof-sheet.html`
- Modify: `test/documentation-contract.test.mjs`
- Create: `test/proof-sheet.test.mjs`

**Interfaces:**
- Produces: reproducible proof sheet using package-relative canonical assets.
- Consumes: generated token CSS, local font CSS, and approved logo SVGs.

- [ ] **Step 1: Write failing documentation and proof tests**

Assert exact slogan consistency; no “two sources of truth”; no `tokens/tokens.css`; resolved local `href`/`src` paths; no `http://`, `https://`, or Google Fonts; correct `MARK · INVERSE` label; and links to canonical generated CSS/font CSS.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test test/documentation-contract.test.mjs test/proof-sheet.test.mjs`
Expected: FAIL on punctuation, remote fonts, broken mark path, duplicate values, and legacy authority claims.

- [ ] **Step 3: Normalize the brand book**

Adopt the exact slogan, supplied organization structure, font roles, Precision Panel/Display Field vocabulary, and clarified slogan-separation rule. Point computed values to canonical token sources/packages and logo references to the asset manifest. Remove the inaccurate ten-ring claim unless verified directly from the paths.

- [ ] **Step 4: Make the proof sheet offline and derived**

Move it to `examples/identity-proof/`, link generated token CSS and governed font CSS, use approved SVGs, correct labels, remove embedded duplicate token values, replace undeclared shadows with canonical tokens, and record package/manifest identity in visible metadata.

- [ ] **Step 5: Render representative viewports**

Open the proof locally and capture desktop and mobile screenshots. Verify fonts load locally, marks render, there are no missing resources, and poster compositions respect the clarified standalone-slogan rule.

- [ ] **Step 6: Verify GREEN and commit**

Run: `node --test test/documentation-contract.test.mjs test/proof-sheet.test.mjs && git diff --check`
Expected: PASS.

```bash
git add BRAND.md examples/identity-proof test/documentation-contract.test.mjs test/proof-sheet.test.mjs proof-sheet.html
git commit -s -m "docs: normalize brand guidance and proof"
```

### Task 9: Final verification, focused review, and milestone record

**Files:**
- Modify: `brand/README.md`
- Modify: `foundations/README.md`
- Modify: `docs/foundation-audit.md`
- Modify: `docs/next-milestones.md`
- Create: `docs/milestones/2026-07-12-identity-refinement.md`

**Interfaces:**
- Produces: final verification record and accurate milestone state.
- Consumes: all prior task outputs.

- [ ] **Step 1: Update completion documentation**

Record exact canonical/derived boundaries, package names, verification commands, remaining deferred creative work, and the asset/token manifest hashes. Do not claim simplified, mono, Arabic, Helling, or platform component work is complete.

- [ ] **Step 2: Run the complete verification matrix**

```bash
npm ci
npm run verify
npm pack --dry-run --workspace @bizarre/tokens
npm pack --dry-run --workspace @bizarre/assets
git diff --check
git status --short
```

Expected: all tests/build/drift checks pass; package inventories are exact; only intended files are modified or added.

- [ ] **Step 3: Perform visual verification**

Render primary, inverse, and transparent SVGs at 48, 128, 512, and 1024 px plus the proof sheet at desktop/mobile widths. Compare geometry against preserved source lockups and colors against supplied PNG references.

- [ ] **Step 4: Request independent review**

Review for competing authorities, geometry changes, accessibility regressions, unsafe asset paths, non-deterministic output, package leakage, stale punctuation, and broken offline proof resources. Address only evidence-backed findings and re-run the full matrix.

- [ ] **Step 5: Commit the milestone record**

```bash
git add brand/README.md foundations/README.md docs/foundation-audit.md docs/next-milestones.md docs/milestones/2026-07-12-identity-refinement.md
git commit -s -m "docs: record identity refinement milestone"
```

- [ ] **Step 6: Publish for review**

Push `codex/identity-refinement`, open a pull request with the verification evidence, wait for required checks and reviews, address actionable findings, re-verify, and merge only after all required checks pass.
