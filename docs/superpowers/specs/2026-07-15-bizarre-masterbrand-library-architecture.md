# Bizarre Industries Identity System Library Architecture

**Date:** 2026-07-15

**Status:** Approved architecture lock, owner-updated 2026-07-16

**Scope:** One modular Figma identity-system library, one mirrored Affinity master document, and one separate Figma Make prototype for the single Bizarre Industries public identity.

## 1. Approved decisions

The owner approved the following architecture decisions:

1. The permanent library has 104 subject slots. Every category has an overview page that explains the system and navigates to its children; every specific subject has its own detailed page and explanation.
2. The Figma Design file and Affinity master use the same subject IDs and exact names. A subject may contain multiple examples, states, frames, or layers, but it may not be collapsed into another subject's page or artboard.
3. The owner selected the left `Continuous Lens` visual direction for the aperture. Its smooth, tangent-continuous silhouette and broad orbital compression replace the rejected sharp/notched proposal. Numerical geometry, production behavior, and provenance remain provisional until their evidence is promoted; no sharp edge, chamfer, wedge, notch, key cut, straight segment, or polygonal join is permitted in the outline.
4. Shaded Contour, Grain and Halftone, Material/Reflective/UV, and One-Color Translation are governed provisional studies. ImageGen establishes the visual target; Affinity reconstructs the approved direction from the same governed field dataset; they become canonical only after explicit approval and evidence.
5. Figma Make remains a separate interactive prototype. It consumes the approved Design library and never becomes a source of brand truth.
6. Bizarre Industries is the only identity. Subbrands, child brands, endorsed brands, derivative Bizarre identities, and product-specific Bizarre identities are excluded.
7. Product design follows `integrate, do not replace`. Existing product infrastructure and platform conventions remain primary. Bizarre contributes a restrained recognition layer without replacing native behavior, accessibility, navigation, controls, typography defaults, density, or interaction grammar.

The owner-approved name, `Bizarre Industries`, and the exact Gravity Well geometry remain invariant. The permanent tagline is exactly `CATCH THE STARS`. The public meaning is `Make the distant tangible`, and the recognition grammar is `BEND -> ABSENCE -> SIGNAL`.

## 2. Artifact topology and authority

There are three external design artifacts with distinct responsibilities:

| Artifact | Required topology | Responsibility | Authority boundary |
| --- | --- | --- | --- |
| Figma Design | One file, key `hGgrP9G0tEam8mpk5u3rHg`, with 104 permanent subject pages | Variables, styles, documentation, components, application specifications, and handoff | Derivative of the canonical repository; it does not supersede governed token, asset, or policy sources |
| Affinity | Exactly one native master, `Bizarre-Industries-Masterbrand-Library.afdesign`, containing one artboard per permanent subject | High-fidelity vector/live-type reconstruction, gradients, patterns, material recipes, production surfaces, and honest mockup masters | Derivative working master; imported canonical vectors remain geometrically invariant |
| Figma Make | Separate file, key `s9stWDZe0kwBisJjfFMOqT` | Interactive product prototype built from the approved library and existing product infrastructure | Consumer only; no unique token, logo, pattern, component, or brand rule may originate here |

The canonical repository remains the machine source of truth. Figma and Affinity must store source paths, hashes, status, and evidence references for every subject. The full brand guide is an assembly of governed sources, not a second source of truth.

The 104 permanent Figma pages and 104 permanent Affinity artboards are a mirrored pair. Temporary Figma migration pages `99.10` through `99.22` are not part of the permanent count and are not mirrored into Affinity.

## 3. Naming and mirroring contract

The permanent page and artboard name format is exactly:

```text
<subject-id> · <exact-subject-name>
```

Both tools must use the same ID and exact subject name, including capitalization, punctuation, slashes, and provisional labels. IDs are stable public navigation keys; reordering the sidebar or artboard canvas must not change them.

Each permanent subject records the corresponding Figma page node ID and Affinity artboard identifier in the governed build ledger at `governance/design-ledgers/figma/bizarre-atlas-v1.json`. QA must fail on a missing subject, duplicate ID, mismatched name, or unapproved extra permanent subject.

## 4. Permanent 104-subject map

### 00 / Entry and navigation

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `00.00` | Cover | Front matter |
| `00.01` | System Map & Navigation | Navigation |
| `00.02` | Getting Started / Authority / Source of Truth | Entry guide |

### 01 / Brand core

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `01.00` | Brand Core Overview | Category overview |
| `01.01` | Design Philosophy / Swiss-Working | Detail |
| `01.02` | Recognition Grammar / Three-Distance Test | Detail |
| `01.03` | Single Identity / Native Integration | Detail |
| `01.04` | Voice / CATCH THE STARS / Metadata Copy | Detail |

### 02 / Identity

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `02.00` | Identity Overview | Category overview |
| `02.01` | Gravity Well Master & Approved Variants | Detail |
| `02.02` | Name, Lockups & Coexistence | Detail |
| `02.03` | Clear Space, Minimum Size & Background Use | Detail |
| `02.04` | Invariance, Misuse & Verification | Detail |

### 03 / Color

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `03.00` | Color Overview | Category overview |
| `03.01` | Primitives & Neutral Chassis | Detail |
| `03.02` | Signal Lime Operational Channel | Detail |
| `03.03` | Data-Shaped Spectrum | Detail |
| `03.04` | Semantic Modes & Status Colors | Detail |
| `03.05` | Contrast & Physical/Accessible Translations | Detail |

### 04 / Gradients

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `04.00` | Gradient Overview & Decision Matrix | Category overview |
| `04.01` | Field Gradient | Detail |
| `04.02` | Optical-Coating Gradient | Detail |
| `04.03` | Data-Ramp Gradient | Detail |
| `04.04` | Heat Gradient | Detail |
| `04.05` | Exposure Gradient | Detail |
| `04.06` | Reflective-Film Gradient | Detail |
| `04.07` | Material-Response Gradient | Detail |

### 05 / Typography

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `05.00` | Typography Overview | Category overview |
| `05.01` | Unbounded / Display | Detail |
| `05.02` | Big Shoulders Stencil / Industrial | Detail |
| `05.03` | Hanken Grotesk / Body and UI | Detail |
| `05.04` | JetBrains Mono / Technical | Detail |
| `05.05` | Arabic Type System | Detail |
| `05.06` | Hierarchy, Numerals, Bilingual Composition & RTL | Detail |

### 06 / Geometry and layout

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `06.00` | Geometry & Layout Overview | Category overview |
| `06.01` | Continuous Lens Aperture v2 | Provisional detail |
| `06.02` | Precision Panel | Detail |
| `06.03` | Display Field | Detail |
| `06.04` | Grid & Spacing | Detail |
| `06.05` | Optical Sizes, Minimums & Responsive Scaling | Detail |
| `06.06` | Lines, Corners, Depth & Composition | Detail |
| `06.07` | Iconography, Instrument Indices & Directional Symbols | Detail |

### 07 / Astronomical Atlas patterns

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `07.00` | Atlas Patterns Overview / One Field, Many Representations | Category overview |
| `07.01` | Field Source & Provenance | Detail |
| `07.02` | Continuous Spectral Field | Detail |
| `07.03` | Stepped Bands | Detail |
| `07.04` | Contour Lines | Detail |
| `07.05` | Shaded Contour / Provisional | Provisional detail |
| `07.06` | Dot Density | Detail |
| `07.07` | Hatching | Detail |
| `07.08` | Grain and Halftone / Provisional | Provisional detail |
| `07.09` | Material, Reflective and UV / Provisional | Provisional detail |
| `07.10` | One-Color Translation / Provisional | Provisional detail |
| `07.11` | Micro Derivative | Detail |

### 08 / Motion and interaction

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `08.00` | Motion & Interaction Overview | Category overview |
| `08.01` | Capture Sequence | Detail |
| `08.02` | Approach | Detail |
| `08.03` | Compress | Detail |
| `08.04` | Eclipse | Detail |
| `08.05` | Lock | Detail |
| `08.06` | Release | Detail |
| `08.07` | Timing & Easing | Detail |
| `08.08` | Reduced Motion & Low Power | Detail |
| `08.09` | Micro-interactions & State Feedback | Detail |

### 09 / Components

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `09.00` | Components Overview | Category overview |
| `09.01` | SDS / Host-Infrastructure Boundary | Detail |
| `09.02` | Shared State, Target, Focus & RTL Contract | Detail |
| `09.03` | Signal Action | Component detail |
| `09.04` | Status Indicator | Component detail |
| `09.05` | Atlas Panel | Component detail |
| `09.06` | Calibration Label | Component detail |
| `09.07` | Instrument Dial | Component detail |
| `09.08` | Bilingual Data Panel | Component detail |
| `09.09` | Physical Label | Component detail |

### 10 / Materials and finishes

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `10.00` | Materials & Finishes Overview | Category overview |
| `10.01` | Matte and Gloss Void | Detail |
| `10.02` | Aluminum and Brushed Aluminum | Detail |
| `10.03` | Carbon, Bakelite and Composite | Detail |
| `10.04` | Signal Spot Media | Detail |
| `10.05` | Translucent, Ceramic and Optical Materials | Detail |
| `10.06` | Foil, Emboss, Deboss, Screen and UV | Detail |
| `10.07` | Assembly, Seams, Fasteners & Wear | Detail |

### 11 / Applications and mockups

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `11.00` | Applications & Mockups Overview | Category overview |
| `11.01` | Image Direction | Detail |
| `11.02` | ImageGen → Affinity Reconstruction & Mockup Honesty | Detail |
| `11.03` | Poster / Campaign | Application detail |
| `11.04` | Calibration Label / Sticker | Application detail |
| `11.05` | Hardware Panel / Camera Body | Application detail |
| `11.06` | Pit Instrument / Dial | Application detail |
| `11.07` | Film / Physical Media | Application detail |
| `11.08` | Packaging / Technical Manual | Application detail |
| `11.09` | Vehicle Livery / Day | Application detail |
| `11.10` | Vehicle Livery / Night | Application detail |
| `11.11` | Product-Family Mockup | Application detail |
| `11.12` | Digital Product / Figma Make Handoff | Prototype handoff |

### 12 / Production and release

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `12.00` | Production & Release Overview | Category overview |
| `12.01` | Print, One-Color & Production Profiles | Detail |
| `12.02` | Vinyl, Reflective & UV Registration | Detail |
| `12.03` | Fabrication & Physical-Sample Requirements | Detail |
| `12.04` | Digital, Vector & Raster Export Matrix | Detail |
| `12.05` | Accessibility, RTL, Motion & Visual-QA Evidence | Detail |
| `12.06` | Provenance, Approval & Change Control | Detail |
| `12.07` | Full Brand Guide Assembly / Release / Handoff | Assembly and handoff |

### 99 / Noncanonical reference

| ID | Exact subject name | Kind |
| --- | --- | --- |
| `99.00` | Noncanonical References & Legacy Index | Permanent noncanonical index |

The total is exactly 104 permanent mirrored subjects. `03.00` through `03.05` are six separate Color subjects; `03.05` must not be omitted or merged into another Color page.

## 5. Mandatory subject anatomy

### 5.1 Category overview anatomy

Every page/artboard whose kind is `Category overview`, plus `99.00`, must contain all of the following named sections:

1. Purpose and recognition role.
2. Child navigation with every child ID and exact name.
3. When-to-use matrix.
4. Status matrix.
5. Dependencies.
6. Rules and anti-patterns.
7. Far, normal, and close examples.
8. Change log and source references.

An overview explains and routes; it must not become the only source for a child asset. A child remains independently reproducible from its own detail page/artboard.

### 5.2 Detail anatomy

Every remaining permanent subject—including front matter, navigation, entry guide, detail, component, application, provisional, handoff, and production subjects—must contain all of the following named sections:

1. Definition.
2. Construction and source.
3. Exact tokens, assets, styles, or material recipe.
4. Variants, modes, states, and optical sizes.
5. Usage.
6. Accessibility, bilingual behavior, and RTL.
7. Motion and interaction.
8. Production and export.
9. Correct examples.
10. Misuse.
11. Provenance, hashes, status, and evidence.
12. Parent and sibling links plus canonical source paths.

If a section genuinely does not apply, it remains visible and states `N/A` with a reason. It may not be silently omitted. The pattern is deliberately exhaustive so small decisions such as animation, optical sizing, registration, or export behavior are not hidden in a general guide page.

### 5.3 Figma documentation frames and Affinity layers

Figma uses stable, named documentation frames for each anatomy section. Affinity uses a stable layer stack inside each artboard:

```text
00 / Reference
10 / Construction
20 / Canonical Assets
30 / Live Type and Metadata
40 / Color, Gradient, Pattern, or Material
50 / Variants, States, and Optical Sizes
60 / Usage and Applications
70 / Accessibility, Bilingual, RTL, and Motion
80 / Production and Export
90 / Correct Use and Misuse
99 / Provenance, Status, Evidence, and Navigation
```

Reference layers are locked and visibly classified. Canonical vectors, especially the Gravity Well, are placed from governed masters and are never traced, redrawn, simplified, rotated, mirrored, or cropped into a new geometry.

## 6. Figma foundations architecture

### 6.1 Canonical variable and style inventory

The finished Figma Design file has exactly nine local variable collections, 173 variables, and four local effect styles. Counts align to the nine canonical repository token sources:

| Exact collection name | Repository source | Variables | Modes |
| --- | --- | ---: | --- |
| `Palette` | `tokens/source/palette.tokens.json` | 34 | `Value` |
| `Brand` | `tokens/source/brand.tokens.json` | 1 | `Value` |
| `Typography` | `tokens/source/typography.tokens.json` | 37 | `Value` |
| `Geometry` | `tokens/source/geometry.tokens.json` | 29 | `Value` |
| `Motion` | Non-shadow values from `tokens/source/motion.tokens.json` | 9 | `Value` |
| `Atlas` | `tokens/source/atlas.tokens.json` | 15 | `Value` |
| `Material` | `tokens/source/material.tokens.json` | 7 | `Value` |
| `Capture` | `tokens/source/capture.tokens.json` | 14 | `Value` |
| `Modes` | Collapsed semantic roles from `tokens/source/modes.tokens.json` | 27 | `void`, `paper`, `void-hicontrast`, `workshop`, `bone` |
| **Total** |  | **173** |  |

`Modes` has 27 semantic variables with five mode values. It must not be flattened into 135 variables. The four composite shadow tokens are represented as effect styles rather than variables:

| Exact effect style name | Repository source |
| --- | --- |
| `Shadow/SM` | `shadow.sm` |
| `Shadow/MD` | `shadow.md` |
| `Shadow/LG` | `shadow.lg` |
| `Shadow/Signal` | `shadow.signal` |

Every variable has a deliberate Figma scope and repository-aligned code syntax. Semantic mode variables alias primitives where the Figma variable model supports the canonical relationship. No documentation frame or local component may introduce an ungoverned replacement value.

### 6.2 Current-state reconciliation and safe migration

The current governed live observation is
`governance/design-ledgers/figma/bizarre-live-observation-v2-2026-07-16.json`.
It supersedes the original seven-collection, 219-variable discovery snapshot for
current-state decisions. The original snapshot remains historical evidence in
the frozen v1 ledgers.

The current file contains 16 local collections and 388 local variables. The
nine canonical collections and all 173 canonical variables already exist
alongside the retained legacy collections. It also contains two paint styles,
18 text styles, four effect styles, and no grid styles. Additive creation is
complete; binding reconciliation, legacy retirement, and page population are
not.

The same observation records 117 pages: 104 permanent pages and 13 retained
legacy pages. Permanent-page classification is:

| Classification | Count | Required disposition |
| --- | ---: | --- |
| `managed-current` | 1 | Preserve; `01.03` remains evidence-gated |
| `managed-stale` | 59 | Migrate through the current v2 source/spec pair |
| `empty` | 38 | Populate through the current v2 population plan |
| `unmanaged-conflict` | 6 | Reconcile from fresh live evidence before mutation |
| **Total permanent** | **104** | All must satisfy the completion gates below |

Migration is parallel and reversible:

1. Record every current collection, variable ID, mode, scope, code syntax, local component binding, nested-instance dependency, page node ID, and restore reference in the governed, versioned ledger at `governance/design-ledgers/figma/bizarre-atlas-v1.json` before mutation. The ledger records `schemaVersion`, `ledgerVersion`, the Figma file key, source commit, capture timestamp, canonical serialization hash, current-to-target mappings, validation state, and tested restore-artifact reference.
2. Preserve and validate the already-created nine canonical collections alongside the retained legacy collections. Do not rename, delete, or repurpose a legacy variable merely because its display value appears equivalent.
3. Build foundations documentation against the canonical collections and verify all 173 variables, five semantic modes, and four effect styles.
4. Rebind one local component family at a time. After each family, inspect metadata and screenshots for every variant, state, theme, focus treatment, RTL state, and exposed property.
5. Retain the old variable and its collection until all known consumers have been rebound and the component-binding comparison is `PASS`.
6. Retire the legacy collections only after the full binding audit passes. In this architecture, `retire` means mark deprecated and remove from publication/library exposure while preserving the original nodes, IDs, values, and mappings for restoration; it never means delete. `Content` is explicitly noncanonical and receives no one-to-one replacement collection.
7. Destructive deletion requires a separate owner-approved cleanup and a governed, versioned, hash-stamped restore artifact whose restoration procedure has already passed a test restore. A manifest or untested rollback note is insufficient. This architecture does not authorize blind deletion.

`/tmp/dsb-state-bizarre-atlas-v1.json` may exist as a disposable working cache derived from the governed ledger. It is never the only copy, never the durable source of migration state, and never release evidence. Every accepted mutation checkpoint is written back to the governed ledger with a new ledger version and content hash.

### 6.3 SDS and host-infrastructure boundary

Existing Simple Design System instances are preserved. They must not be detached, redrawn, or silently replaced. Bizarre components reuse or wrap mature infrastructure while applying Bizarre tokens, state semantics, content, and composition.

For every component family, QA records whether the implementation is `reuse`, `wrap`, or `local`, why that choice was made, and which SDS instance/component key remains underneath. A wrapper may expose a Bizarre-facing API, but the nested SDS instance remains live. Existing `Signal Action` and `Status Indicator` component sets remain available throughout migration and are replaced only after their new bindings and variant contracts pass comparison.

## 7. Affinity master architecture and fidelity rules

Affinity has exactly one native `.afdesign` master containing the 104 permanent artboards. It is a single artboard document, not a collection of separate files and not one giant flattened guide layout. Artboards use the exact IDs, names, anatomy, and navigation contract in this specification.

The production method is mandatory:

1. Use the approved design guide, owner preview, and canonical repository sources to establish constraints.
2. For missing visual direction, create a single-subject ImageGen study. Inside Affinity, ImageGen imagery may exist only in `00 / Reference` as a locked layer visibly labeled `CONCEPT REFERENCE — NONPUBLISHABLE`. It may guide the direction or underlay a concept-only mockup, and it may be indexed by `99.00`; it is never a vector master, production base, or production proof.
3. Reconstruct the approved direction in Affinity with governed SVGs, native vector geometry, live type, native gradients, masks, blend modes, live filters, perspective/mesh placement, and real material logic. Canonical vectors and production artwork must derive from governed geometry, datasets, tokens, and approved sources rather than tracing, embedding, masking, sampling, or otherwise incorporating ImageGen pixels.
4. Use the same governed field dataset across contours, bands, dots, hatch, grain, material, and one-color translations. A representation may change; the underlying field, orientation, aperture relationship, and one active Signal trajectory may not.
5. Render and compare each critical artboard at far, normal, and close viewing distances against the approved reference and its paired Figma page before it can pass.

Python-generated graphics, simplistic programmatic line approximations, hand-redrawn marks, and whole-photograph tracing are forbidden production methods. The owner-approved hybrid workflow remains ImageGen → Affinity: ImageGen establishes a concept target; Affinity uses exact vector identity, live typography, masks, perspective, mesh, lighting, and material construction to build the governed result. The generated raster remains isolated on the locked, labeled concept-reference layer and cannot enter canonical vectors, production artwork layers, release evidence, or publishable exports. Final production mockup bases must be observed, licensed, or original, explicitly approved, and provenance-complete. Every base records its classification and approval reference.

The seven gradient subjects remain distinct. Signal Lime is never graded to another hue, and gradients are permitted only when they encode field, optical coating, data ramp, heat, exposure, reflective film, or material response. The Atlas pattern details likewise remain distinct and reproducible; a generic contour or decorative rainbow may not substitute for the governed dataset.

Rejected Affinity work is not legacy evidence. No rejected document, render, script, simplified drawing, or derivative may be reintroduced into the master, the Figma file, the repository, or `99.00`.

## 8. Figma Make prototype boundary

The separate Figma Make prototype consumes only approved library pages, variables, styles, component families, and governed assets. `11.12 · Digital Product / Figma Make Handoff` documents the exact library version, component mapping, prototype journey, responsive states, LTR/RTL behavior, reduced-motion behavior, and evidence links.

Figma Make must:

- lean on existing product and accessibility infrastructure;
- use the approved primary journey rather than inventing a conversion path;
- exercise navigation, primary action, Capture, loading, success, error, theme, RTL, keyboard, touch, and reduced-motion states;
- send any discovered design-system gap back through the repository and Figma Design library rather than fixing it only in the prototype;
- remain outside the 104-page/artboard mirror because it is an interactive consumer, not a documentation source.

## 9. Status, provenance, and evidence contract

Each permanent page/artboard displays and stores these fields:

| Field | Required meaning |
| --- | --- |
| `subjectId` and `subjectName` | Exact entry from the permanent map |
| `authorityStatus` | `canonical`, `governed-provisional`, `concept-reference`, or `noncanonical-reference` |
| `verificationStatus` | `PASS`, `FAIL`, or `NOT VERIFIED`; `PASS` requires an evidence reference |
| `publicationStatus` | `publishable` or `nonpublishable` |
| `sourcePaths` and `sourceHashes` | Canonical repository inputs and exact hashes used by the subject |
| `derivesFrom` | Master/derivative relationship, field configuration, and representation version |
| `approvalRef` | Owner, specialist, or release decision reference; absence does not imply approval |
| `evidenceRefs` | Tests, screenshots, renders, comparisons, physical samples, or specialist reviews |
| `toolIds` | Figma page/node IDs and Affinity artboard/document identifiers |
| `lastChanged` and `changeLog` | Dated, attributable change record |

Initial provisional status is mandatory for the numerical construction and production evidence of `06.01`, and for `07.05`, `07.08`, `07.09`, and `07.10`. The owner-approved Continuous Lens visual direction is binding, but visual-direction approval does not automatically approve exact numerical geometry, production behavior, or publication. Physical claims, Arabic readiness, material response, day/night registration, and manufacturing durability remain `NOT VERIFIED` until the corresponding specialist or physical evidence exists.

Generated concept references are `concept-reference` and `nonpublishable`. `99.00` may index them with hashes and allowed-use labels, and Affinity may retain them only as locked layers visibly labeled `CONCEPT REFERENCE — NONPUBLISHABLE` inside `00 / Reference`. They may guide or underlay concept-only mockups, but they cannot enter canonical vectors, production artwork layers, release evidence, or publishable exports. Final production mockup bases must be observed, licensed, or original and explicitly approved. Publishable exports enter governed packages only after their source, derivative relationship, hash, allowed use, approval, and evidence are complete.

## 10. Legacy migration

The existing 13 Figma pages are migration inputs, not the new architecture. They remain intact and in their current order while the 104 permanent replacements are built and validated. They receive temporary IDs as follows:

| Temporary ID | Existing page retained under Legacy |
| --- | --- |
| `99.10` | `00 · Cover` |
| `99.11` | `01 · Getting Started` |
| `99.12` | `02 · Foundations` |
| `99.13` | `02.1 · Color` |
| `99.14` | `02.2 · Typography` |
| `99.15` | `02.3 · Geometry` |
| `99.16` | `02.4 · Motion + Atlas` |
| `99.17` | `──────── COMPONENTS` |
| `99.18` | `03 · Components` |
| `99.19` | `03.1 · Signal Action` |
| `99.20` | `03.2 · Status Indicator` |
| `99.21` | `──────── UTILITIES` |
| `99.22` | `04 · Utilities` |

The temporary page-name format is `99.xx · Legacy / <existing page name>`. These pages are indexed by `99.00`, excluded from the permanent 104 count, excluded from library documentation publication, and not mirrored into Affinity. Their node IDs, component sets, SDS instances, and variable bindings remain intact for rollback and comparison.

A permanent replacement passes migration only when its content, links, bindings, typography, visual comparison, accessibility, RTL, motion, provenance, and exports meet the applicable anatomy and evidence gates. Legacy pages are not deleted by this milestone. They may be retired only by deprecating and unpublishing them while preserving their nodes and mappings. Any future deletion requires explicit owner approval plus a governed, versioned, hash-stamped restore artifact whose restoration procedure has passed a test restore.

## 11. Validation and completion gates

The architecture is complete only when all of the following are true:

1. The permanent map contains exactly 104 Figma pages and 104 Affinity artboards with identical IDs and exact names.
2. Every category overview contains the complete overview anatomy and links to every child.
3. Every specific subject contains the complete detail anatomy, or an explicit `N/A` with a reason.
4. Figma contains exactly nine canonical collections, 173 variables, five `Modes` modes, and four effect styles; no semantic mode is flattened into five separate variables.
5. Every component binding is compared before a current variable collection is retired, and no live SDS instance has been detached.
6. The Gravity Well matches the governed geometry; the owner-selected Continuous Lens direction is preserved without sharp outline events; its numerical construction and the provisional Atlas representations are labeled honestly.
7. All seven gradient systems and every Atlas representation are independently documented, reproducible, and derived from governed sources.
8. Critical Affinity artboards pass reference-versus-render comparison at far, normal, and close distance; simplified rings, generic lines, false material effects, or missing gradient depth are a failure.
9. Figma Make consumes the approved library without introducing a parallel source of truth.
10. Every release row is `PASS`, `FAIL`, or `NOT VERIFIED` with evidence where required, and every published export has complete provenance.
11. `12.07` assembles the full guide from child sources without duplicating their authority.
12. Rejected Affinity work is absent from every artifact and reference index.
13. ImageGen imagery exists only on locked, visibly labeled, nonpublishable concept-reference layers and in the `99.00` reference flow; final production mockup bases are observed, licensed, or original and explicitly approved.
14. The governed Figma ledger is versioned and hash-stamped, `/tmp` is cache-only, and no destructive cleanup is eligible without a tested restore artifact and explicit owner approval.

Until all gates pass, the library remains an in-progress governed system rather than a released full identity.
