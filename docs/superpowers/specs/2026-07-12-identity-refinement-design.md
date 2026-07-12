# Bizarre Industries Identity Refinement Design

**Date:** 2026-07-12
**Status:** Approved for planning
**Scope:** Normalize the supplied identity, logo, fonts, token draft, and proof sheet into the canonical design-system repository.

## 1. Authority and intent

The supplied identity files define the visual and verbal direction. This work refines and governs that material; it does not replace or reinterpret the identity.

Authority is ordered as follows:

1. Explicit owner decisions recorded in this specification.
2. Governed machine-readable identity and token contracts.
3. Governed logo and font source manifests.
4. `BRAND.md` as explanatory guidance synchronized with those contracts.
5. Proof sheets and examples as derived evidence.

The permanent slogan is exactly `CATCH THE STARS`, with no trailing punctuation. Signal Lime (`#C6FF24`) remains the sole brand accent. The gravity-well mark supplied by the owner is the official mark.

## 2. Logo system

### 2.1 Master geometry

The vector paths in the supplied `logo/Original Logo.svg` and `logo/Transparent Logo.svg` are the source geometry. The outlined text group reading “Bizarre industries” is removed. The remaining artwork is cropped to the square mark boundary.

No gravity-well path may be redrawn, simplified, smoothed, rotated, mirrored, or otherwise altered during this milestone. Equivalent serialization changes from SVG optimization are allowed only when rendered geometry remains identical.

### 2.2 Required variants

- **Primary:** mark-only artwork derived from `Original Logo.svg`, preserving the supplied Signal Lime ground and gray/lime construction.
- **Inverse:** identical mark paths and proportions on a Void ground, using Signal Lime geometry. Its appearance must match the supplied inverse PNG reference.
- **Transparent:** mark-only artwork derived from `Transparent Logo.svg`, retaining the transparent exterior.

Primary and inverse SVGs are canonical masters. PNGs are derived raster exports or visual references, not editable masters.

The simplified small-size mark, mono variants, wordmarks, and formal lockups remain future artifacts. The full mark must not be presented as approved below 48 px until a simplified variant is explicitly designed and approved.

### 2.3 Asset contract

Every governed logo entry records:

- stable path and role;
- variant and approval state;
- media type and intrinsic dimensions or view box;
- SHA-256 hash;
- master/derivative relationship;
- allowed color role;
- source provenance.

The contract rejects missing files, path traversal, symlinks, hash drift, unexpected media types, unapproved publishable variants, and derivatives that do not name a master.

## 3. Brand identity and architecture

The machine-readable identity contract will represent the supplied brand structure:

- Bizarre Industries: top-level movement/foundation identity;
- Bizarre Labs: commercial arm;
- Bizarre Foundation: governing nonprofit entity;
- Helling: first-class product under Labs.

The contract also records the official mark name, permanent slogan, sole accent, typography roles, and layout modes. Values already described in the supplied files are adopted unless they conflict with an explicit owner decision or an accessibility requirement.

The previous slogan with a period is removed from the schema, tests, README, generated evidence, and guidance. Narrative examples must use the canonical punctuation-free form.

## 4. Typography

The supplied open-source families define the typography system:

- Unbounded: display, ceremony, and slogan;
- Big Shoulders Stencil: wordmark, livery, and industrial display;
- Hanken Grotesk: body, interface, and reading;
- JetBrains Mono: code, technical information, and eyebrow labels.

Repository-owned font definitions use one tested CSS family name per family and explicit supported weight/style ranges. Runtime examples must load local governed assets, not Google Fonts.

The governed source set retains the variable TTF files, family README files, and OFL licenses. Redundant static TTF instances are not distributed. Web-ready WOFF2 derivatives belong in `@bizarre/assets`, with their source relationship and hashes recorded in the asset manifest.

## 5. Design-token architecture

### 5.1 Single source

Files under `tokens/source/` are the only machine-readable token authority. Generated package outputs are consumable artifacts. Handwritten CSS is never a parallel source.

The supplied `tokens/tokens.css` is migration input. Accepted values move into structured DTCG source documents, after which the loose stylesheet is removed.

An explicitly ordered source manifest controls token loading. Directory enumeration must not determine canonical merge order.

### 5.2 Token domains

The canonical source covers:

- brand and neutral color primitives;
- semantic color roles for every theme;
- typography families, weights, sizes, leading, and tracking;
- spacing and dimensions;
- radii and border widths;
- motion durations and easing curves;
- shadows and layering.

Signal Lime remains the only accent. Lime Ink and Lime Glow are functional palette roles, not additional accents.

Generated CSS uses only the `--bzr-*` namespace and `[data-bizarre-theme="<mode>"]` selectors.

### 5.3 Aliases and theme parity

Semantic roles alias primitives. The token model validates that aliases exist, match the expected type, and do not form cycles.

Every theme supplies the same required semantic role set. This includes explicit surface/content pairs for status and interaction states so consumers do not invent inaccessible combinations locally.

### 5.4 Accessibility rules

Automated tests calculate contrast for declared pairs:

- normal text: at least 4.5:1;
- large text: at least 3:1 when a role is explicitly restricted to large text;
- meaningful UI graphics and boundaries: at least 3:1 where WCAG non-text contrast applies.

Signal Lime must not be used as meaningful text or graphics on Paper, Bone, Snow, or another light surface unless an independently tested role permits it. Functional status colors must declare their own compatible content colors.

## 6. Layout language

The supplied layout vocabulary is canonical:

- **Precision Panel:** dense, technical, grid-led surfaces;
- **Display Field:** spacious, editorial, ceremony-led surfaces.

Workshop Stamp is a physical application expression, not a third competing page-layout mode. Earlier terms such as Precision Signal and Editorial Monument are removed or mapped in migration documentation; they do not remain parallel public vocabularies.

The rules in `BRAND.md` govern application: geometric construction, restrained radii and shadows, monospaced technical eyebrows, flat brand colors, and no centered body copy. Tokens that would appear to authorize forbidden brand treatments must either be removed or explicitly scoped to a valid component use.

“The slogan stands alone” means it is never a formal logo/wordmark lockup, button label, product name, or email subject. It may share a larger editorial surface when spatial separation makes it an independent closing or ceremonial element.

## 7. Packages and consumers

`@bizarre/tokens` remains token-only. A new `@bizarre/assets` package distributes approved logo masters/exports, font assets, licenses, font-face CSS, and its asset manifest.

Both packages are explicit entries in the governance package contract. Package inventories are allowlisted and tested so arbitrary repository files cannot leak into a release.

The downstream `Bizarre-Industries/themes` repository consumes pinned released versions. It does not copy or redefine canonical values.

## 8. Proof sheet

The proof sheet becomes derived, reproducible evidence:

- move it to a governed examples/evidence location;
- load generated canonical CSS;
- load local governed fonts;
- reference governed logo variants by correct paths;
- remove duplicated token values and remote font dependencies;
- correct primary/inverse labels;
- record the demonstrated package version or manifest hash;
- remove treatments that violate the brand rules or reference valid tokens for them.

The proof sheet is visually inspected after changes at representative desktop and mobile widths. It is evidence of application, never a source of identity values.

## 9. Documentation and provenance

`BRAND.md` is retained and normalized. It must not claim that handwritten CSS is a source of truth. Token values point to canonical sources and released packages. Logo references resolve through the asset contract.

The evidence manifest includes the brand book, identity contract, asset manifest/schema, source licenses, and approved decision record. Binary asset integrity is represented through the asset manifest rather than by recursively allowlisting every file.

The repository documents which artifacts are source, generated, derived evidence, and future work.

## 10. Validation and failure handling

Tests are written before each behavioral change. Required validation includes:

- identity schema and exact slogan;
- brand-book synchronization;
- SVG text removal, required view boxes, variant colors, and stable geometry;
- asset path, hash, media type, license, source/derivative, and symlink safety;
- DTCG type/value compatibility, aliases, cycles, and theme-role parity;
- contrast thresholds for every declared semantic pair;
- deterministic generated CSS/JSON/manifests;
- package inventory and provenance boundaries;
- proof-sheet local references and absence of undeclared remote dependencies.

Generation and publication retain the existing atomic-write and rollback behavior. Validation failure must leave the last valid generated package untouched.

## 11. Completion criteria

This milestone is complete when:

1. The punctuation-free slogan is consistent across all governed artifacts.
2. Cleaned primary, inverse, and transparent mark-only SVGs exist and preserve source geometry.
3. Logo/font assets have validated manifests and licenses.
4. The accepted token system is represented in DTCG and generated deterministically.
5. All declared semantic color pairs pass their required contrast thresholds.
6. The proof sheet renders offline from canonical packages and assets.
7. `npm run verify`, package dry runs, visual inspection, and repository diff checks pass.
8. A focused review finds no competing authority, broken reference, ungoverned publishable asset, or identity contradiction.

## 12. Deferred work

The following require separate creative approval and are not silently invented here:

- simplified sub-48 px mark;
- mono mark variants and formal lockups;
- custom Helling mark;
- Arabic display pairing and translated brand voice;
- poster, merchandise, livery, packaging, and hardware production templates;
- platform component libraries layered over SwiftUI, Material, web, desktop, and embedded frameworks.
