# Astronomical Atlas System — Reconciled Implementation Plan

Last reconciled: 2026-07-17T00:51:39+04:00

Canonical handoff: [docs/agent-handoff.md](../../agent-handoff.md)

## Goal

Merge the approved Astronomical Atlas extension into the canonical Bizarre Industries design system, preserve the exact company name and Gravity Well geometry, and produce governed repository packages plus exactly 104 mirrored Figma pages and Affinity artboards with a separate interactive Figma Make prototype.

## Architecture and implementation approach

Authority flows from governance/authority.json and the imported Atlas design, through canonical brand, token, policy, renderer, asset, and UI sources, into deterministic packages. Figma and Affinity consume the same 104-subject v2 manifest and content spec but remain native, independently verified artifacts. Figma Make consumes the approved library and UI contract; it is not a second design authority.

Product work follows integrate-not-replace. Host platforms and product systems own behavior, components, semantics, accessibility, typography defaults, density, navigation, and motion grammar. Bizarre contributes one restrained recognition layer.

## Technology and relevant subsystems

- Node.js 22 ESM, npm workspaces, Node test runner.
- DTCG-style JSON tokens, JSON Schema contracts, deterministic SVG and package generation.
- Framework-neutral HTML/CSS adapter under packages/ui.
- Official Figma connector and Figma native variables, styles, components, plugin metadata, and receipts.
- Affinity 3 native document tooling and MCP.
- React source mirror for Figma Make key s9stWDZe0kwBisJjfFMOqT.

## Global constraints

- The public name is exactly Bizarre Industries.
- The approved Gravity Well geometry is invariant. The figure is fully Signal Lime or fully black, never mixed, rotated, or gradient-filled.
- There is one identity. No subbrands, child brands, endorsed identities, or product identities.
- Signal Lime #C6FF24 is the sole operational accent and is never interpolated into a gradient.
- Existing host UX and accessibility infrastructure is preserved.
- The Continuous Lens must be one smooth, closed, tangent-continuous, asymmetric oval with no sharp edge, corner, notch, wedge, chamfer, key cut, or polygonal join.
- ImageGen may guide concept direction only. Canonical art is native vector/live type; real mockups use observed, licensed, or original bases.
- Exactly 104 permanent subjects exist in both Figma and Affinity: 13 overviews and 91 details, each with the approved 11-layer anatomy.
- Legacy Figma pages, collections, nodes, SDS instances, and frozen v1 ledgers remain until separately approved cleanup with tested restore evidence.
- Generated package trees are derivative and are never edited directly.
- Every release claim is PASS, FAIL, or NOT VERIFIED with evidence.
- No dependency installation is required. Publication is authorized only after a portable staged scope is explicit and required checks are satisfied. Cleanup may remove only merged, clean auxiliary worktrees.

## Scope

- Reconcile canonical Atlas sources and deterministic packages.
- Correct the asymmetric aperture contract and propagate it across repository, Figma, and Affinity.
- Reconcile and populate the 104-page Figma library.
- Complete and verify the mirrored 104-artboard Affinity master.
- Synchronize and verify the separate Figma Make prototype.
- Complete honest cross-tool release evidence.

## Non-goals

- Replacing React, SwiftUI, native Apple controls, SDS, or another product design system.
- Building full product-specific applications.
- Publishing provisional Atlas, Open Design, mockups, Arabic readiness, PDF, or physical-production claims.
- Creating a simplified mark, formal wordmark, or new identity architecture.
- Rewriting dated milestone history.

## Source specifications

1. governance/authority.json
2. extensions/astronomical-atlas/DESIGN.md
3. brand/identity.json and BRAND.md
4. docs/research/2026-07-16-native-integration.md
5. docs/superpowers/specs/2026-07-15-bizarre-masterbrand-library-architecture.md
6. production/affinity/bizarre-masterbrand-subjects-v2.json
7. production/affinity/bizarre-masterbrand-content-spec-v2.json
8. governance/design-ledgers/figma/bizarre-live-observation-v2-2026-07-16.json
9. governance/design-ledgers/figma/bizarre-104-page-population-plan-v2.json
10. Current canonical source and focused contract tests.

## Current status summary

- Task 1: COMPLETE.
- Task 2: COMPLETE. Canonical source, policy, generated token output, and deterministic checks agree.
- Task 3: BLOCKED BY OWNER GEOMETRY CHOICE. The selected visual direction has no approved numerical control points. Current repository, Figma, and Affinity derivatives use symmetric ellipses.
- Task 4: COMPLETE at repository-package level. Logo lineage, monochrome geometry, asset generation, and deterministic checks agree. Aperture-dependent final assets remain governed by Task 3.
- Task 5: COMPLETE.
- Task 6: COMPLETE at package level. Release evidence correctly retains unverified external gates.
- Task 7: IN PROGRESS. Final portable planning classifies 60 pages as migration-required, 38 empty, and six unmanaged conflicts. No permanent root is currently preserved as managed-current.
- Task 8: BLOCKED by live synchronization and incomplete library approval. The local host-boundary CSS violation is fixed and tested. The live Make document remains an empty template.
- Task 9: IN PROGRESS. Live Affinity inspection confirms 104 artboards and the exact 11 direct anatomy layers on every artboard. Per-subject visual QA, exact aperture, and final real-mockup coverage remain incomplete.
- Task 10: REPOSITORY RELEASE CANDIDATE VERIFIED; PRODUCT RELEASE BLOCKED by Tasks 3 and 7–9 plus external bilingual, accessibility, mockup, and physical evidence.

Passing current evidence:

- `npm test`: 234/234.
- `npm run check:generated`: PASS.
- `npm run verify`: PASS.
- 32/32 focused V1/V2 Figma contracts and 3/3 repository portability contracts.
- Affinity manifest validates 104 subjects. Seven gradient recipes validate.
- Live Affinity inspection confirms 104 artboards with 11 direct anatomy layers each.
- Commit candidates contain no personal absolute paths or absolute symlink targets. Runtime state, cached plugins, local symlinks, duplicate scratch assets, and ungoverned captures are ignored and preserved locally.

Blocked external evidence:

- The selected Continuous Lens direction has no owner-approved numerical geometry.
- Figma pages require 60 migrations, 38 populations, and six conflict reconciliations.
- The live Figma Make document is not synchronized.
- Affinity subject-level visual QA and final real-mockup coverage are incomplete.
- Arabic specialist review, full accessibility and motion review, and physical-production evidence remain `NOT VERIFIED`.

## First unfinished task

**Task 3A - obtain the owner geometry-workflow decision in the next implementation session. Status: BLOCKED.**

Ask exactly:

    Should I create three manually authored, non-traced native Affinity four-cubic asymmetric candidates from the selected left reference for your choice, or create one closest optical reconstruction and ask you to approve that exact geometry packet before propagation?

Recommended: three native candidates. Do not edit packages/atlas/src/aperture.mjs, the Affinity master, scripts/lib/continuous-lens-r20.mjs, or aperture-dependent Figma pages before the answer. Acceptance is an explicit owner choice that authorizes one numerical-geometry workflow.

Closeout ends here. The next implementation session resumes at Task 3A and must re-read external state before any design mutation.

---

## Task 1 — Govern extension and precedence

Status: COMPLETE

- Objective: preserve the imported Atlas authority exactly and encode how its explicit overrides interact with permanent invariants and repository fallback.
- Dependencies and order: first authority layer; all later tasks consume it.
- Exact files: extensions/astronomical-atlas/DESIGN.md, SOURCE.json, README.md; governance/authority.json; schemas/authority.schema.json; test/authority.test.mjs; README.md.
- Existing symbols/headings: governance contract sections invariants, extensions, fallbacks, and derivedOutputs.
- Interfaces consumed: imported source hashes; permanent name and Gravity Well decision.
- Interfaces produced: machine-readable precedence and a tested extension boundary.
- Preconditions: imported files and hashes remain unchanged.
- Current evidence: `node --test test/authority.test.mjs` passes; README identifies the governed extension.
- Remaining implementation: none.
- Verification: node --test test/authority.test.mjs.
- Expected result: all authority, hash, invariant, override, fallback, and derivative-output tests pass.
- Acceptance criteria: exact source hashes, only two permanent invariants, explicit Atlas overrides, repository fallback, generated output never authority.
- Documentation impact: README and extension README are current.
- Recovery: restore only an accidentally changed authority hunk from a known copy; never re-import over user work.
- Risks and edge cases: generated proposals and tool output must never be promoted above canonical source.

## Task 2 — Canonical Atlas tokens and policies

Status: COMPLETE

- Objective: provide canonical CSS-emittable Atlas/material/capture values and JSON-only bilingual, provenance, and production policies.
- Dependencies and order: consumes Task 1; source layer is sufficient for Task 3, but task completion still requires zero generated drift.
- Exact files: tokens/source/atlas.tokens.json, material.tokens.json, capture.tokens.json, palette.tokens.json, modes.tokens.json, typography.tokens.json, manifest.json; policies/bilingual.json, provenance.json, production.json; matching schemas; scripts/build-tokens.mjs; scripts/lib/token-model.mjs; test/token-model.test.mjs; test/policies.test.mjs.
- Existing symbols/headings: loadTokenModel, ordered manifest loading, alias resolution, canonical five modes.
- Interfaces consumed: current token manifest and DTCG loader.
- Interfaces produced: token model and policy documents consumed by Atlas, UI, Figma import, and Open Design.
- Preconditions: Signal Lime remains a flat alias; policy strings and booleans stay out of CSS token output.
- Current evidence: token and policy contracts pass. Canonical token output was rebuilt through `npm run build:tokens`; `npm run check:generated` and `npm run verify` pass.
- Remaining implementation: none at repository-package level. External visual use remains governed by Tasks 7–9.
- Test-first cycle: preserve the current canonical-source and generated-output contracts for future changes.
- Verification: node --test test/token-model.test.mjs test/policies.test.mjs test/build-tokens.test.mjs; npm run check:generated.
- Expected result: focused tests pass and no token generated drift remains.
- Acceptance criteria: values, aliases, modes, policy enums, and generated manifests agree deterministically.
- Documentation impact: no new user-facing claims until generated state is synchronized.
- Recovery: never hand-edit packages/tokens/generated; inspect and reverse only source changes from the current session.
- Risks and edge cases: bulk build can rewrite pre-existing generated output; preserve tokens/tokens.css as a user-owned migration input.

## Task 3 — Govern the asymmetric Continuous Lens and Atlas renderer

Status: BLOCKED BY OWNER GEOMETRY CHOICE

- Objective: make one owner-approved asymmetric, smooth, tangent-continuous Continuous Lens the canonical geometry for repository, Figma, and Affinity.
- Dependencies and order: consumes Task 2 sources. Must finish before aperture-dependent Figma pages 01.02, 04.01, 06.01 and related Affinity artboards are accepted.
- Exact files: packages/atlas/src/aperture.mjs, config.mjs, render.mjs, provenance.mjs; packages/atlas/src/renderer-config.json; scripts/build-atlas.mjs; test/atlas-renderer.test.mjs; test/atlas-provenance.test.mjs; production/affinity/bizarre-masterbrand-content-spec-v2.json.
- Existing symbols: APERTURE_VERSION, APERTURE_PATH, APERTURE_PATH_SHA256, apertureGeometry, apertureContainment, renderAperture, ellipsePoint, ellipseTangent.
- Interfaces consumed: canonical Atlas tokens, source documents, and owner-selected native geometry.
- Interfaces produced: renderAtlas, renderAperture, deterministic SVG, configuration hashes, path hash, and containment used for field occlusion.
- Preconditions: obtain exact owner-approved native control-point evidence. Do not invent an asymmetry from prose, trace or sample concept pixels, or edit the Gravity Well.
- Current evidence: renderer/provenance tests pass; APERTURE_PATH is four cubics with no sharp commands. Verified contradiction: ellipsePoint and ellipseTangent generate a centrally symmetric rotated ellipse while DESIGN.md and the content spec require asymmetry. The selected left concept is governed visual direction only and is explicitly forbidden as numerical authority.
- Remaining steps and test-first cycle:
  1. Task 3A: ask the exact workflow question in First unfinished task and wait for an explicit answer.
  2. Task 3B: perform the approved native-candidate workflow in Affinity without tracing. Record reference bounds, four anchors, eight handles, rotation, tangent rule, containment rule, optical-size rule, and path hash.
  3. Ask for explicit selection and approval of that exact geometry packet.
  4. Add the asymmetry assertion and confirm RED against the current ellipse.
  5. Implement the minimum apertureGeometry and apertureContainment changes from the approved packet.
  6. Update expected path, hash, version, and provenance only after native approval.
  7. Rerun focused tests, then Atlas package and external-content contract tests.
  8. Review derived diffs and update receipts.
- Verification: node --test test/atlas-renderer.test.mjs test/atlas-provenance.test.mjs; node --test test/affinity-content-spec.test.mjs test/figma-104-page-population-plan.test.mjs; npm run check:generated.
- Expected result: explicit owner workflow approval, native candidate approval, initial RED for symmetry, then GREEN for the exact asymmetric path, containment, deterministic hashes, and downstream source alignment.
- Acceptance criteria: one governed asymmetric path, four smooth cubic segments, closed and tangent-continuous, no sharp features, one Signal trajectory, honest provenance, deterministic rendering.
- Documentation impact: update aperture construction guidance and receipts only after new source and hash pass.
- Recovery: keep prior path/hash in history and receipt evidence; do not overwrite external native masters without a versioned proof.
- Risks and edge cases: a shape can be smooth yet still be the rejected ellipse; containment and visual path must change together; rotation must not hide symmetry.

## Task 4 — Govern asset publication and deterministic lineage

Status: COMPLETE AT REPOSITORY-PACKAGE LEVEL

- Objective: publish approved assets with exact hashes and lineage while isolating all provisional Atlas and concept evidence.
- Dependencies and order: consumes Tasks 1–3; do not finalize Atlas derivatives until Task 3 is green.
- Exact files: brand/assets.json, brand/provisional-assets.json, schemas/assets.schema.json, scripts/lib/assets.mjs, scripts/build-assets.mjs, scripts/sync-provisional-atlas-assets.mjs, packages/assets/**, test/assets.test.mjs, test/atlas-assets.test.mjs, test/build-assets.test.mjs, test/reference-lineage.test.mjs.
- Existing symbols: asset validation and hashing in scripts/lib/assets.mjs; approved and provisional package inventories.
- Interfaces consumed: governed masters, deterministic Atlas outputs, license/provenance data.
- Interfaces produced: approved asset package, provisional nonpublishable boundary, hashes, master/derivative relationships.
- Preconditions: exact Gravity Well source authority for the current approved inventory. Task 3 approval is required only for final aperture-dependent derivatives.
- Current evidence: focused asset, build, reference-lineage, and repository-contract tests pass. The three monochrome logo variants retain one exact 16-path geometry fingerprint. Canonical asset output was rebuilt through `npm run build:assets`; `npm run check:generated` and `npm run verify` pass.
- Remaining implementation: none for the approved package inventory. Task 3 still governs any final aperture-dependent derivative.
- Test-first cycle: preserve exact Gravity Well path fingerprints and provisional/publication boundaries for future changes.
- Verification: node --test test/assets.test.mjs test/atlas-assets.test.mjs test/build-assets.test.mjs test/reference-lineage.test.mjs; npm run check:generated.
- Expected result: exact approved inventory, provisional Atlas excluded, logo geometry unchanged, no generated drift.
- Acceptance criteria: every publishable asset has correct type, hash, lineage, approval, provenance, and use; proposal mockups never publish.
- Documentation impact: update packages/assets/README.md only if the verified public inventory changes.
- Recovery: never redraw logo masters or hand-edit generated manifests; reverse only the current source-side change.
- Risks and edge cases: changing a test hash to match arbitrary output would hide geometry drift; generated concept evidence must stay outside publishable exports.

## Task 5 — Framework-neutral UI contract and proof

Status: COMPLETE

- Objective: provide an opt-in Bizarre styling/state layer over native host primitives and an offline proof.
- Dependencies and order: consumes Tasks 2 and 4.
- Exact files: packages/ui/src/contract.json, components.css, motion.css, rtl.css; scripts/build-ui.mjs; examples/identity-proof/index.html and proof.js; test/ui-contract.test.mjs; test/ui-proof.test.mjs; test/proof-sheet.test.mjs.
- Existing symbols: integration.principle, infrastructure.globalResetAllowed, infrastructure.hostRootStyleOverrideAllowed, data-bzr-* attributes, Capture phase mapping.
- Interfaces consumed: generated tokens and approved assets.
- Interfaces produced: semantic CSS/state contract and native proof fixture.
- Preconditions: host behavior stays outside the package.
- Current evidence: `node --test test/ui-contract.test.mjs test/ui-proof.test.mjs test/proof-sheet.test.mjs` passes.
- Remaining implementation: none in this package. Figma Make violates this contract and is tracked under Task 8.
- Verification: node --test test/ui-contract.test.mjs test/ui-proof.test.mjs test/proof-sheet.test.mjs.
- Expected result: native controls, complete states, 44 px targets, visible focus, RTL semantics, no global reset, captured reduced-motion state.
- Acceptance criteria: package remains CSS/data-attribute only with no router, focus manager, dialog system, form engine, or component runtime.
- Documentation impact: packages/ui/README.md is current.
- Recovery: preserve native elements and remove only current-session adapter changes if regression appears.
- Risks and edge cases: applying the contract as a global product skin would violate integrate-not-replace.

## Task 6 — Portable Open Design bundle

Status: COMPLETE

- Objective: create a deterministic private bundle of canonical authority, packages, proof, manual, and honest evidence.
- Dependencies and order: consumes Tasks 1–5. External release remains Task 10.
- Exact files: packages/open-design/**; scripts/build-open-design.mjs; scripts/reject-private-publish.mjs; test/open-design-bundle.test.mjs; test/release-evidence.test.mjs; test/private-publish-guard.test.mjs.
- Existing symbols/headings: generated authority copies, manual sections, release evidence statuses.
- Interfaces consumed: canonical package outputs and policy documents.
- Interfaces produced: private portable manual and evidence report.
- Preconditions: package stays private and excludes proposal derivatives.
- Current evidence: Open Design, release-evidence, and private-publish tests create isolated temporary npm caches and pass independently of user-cache permissions. Evidence retains unresolved rows as `NOT VERIFIED`.
- Remaining implementation: none for bundle mechanics. Evidence rows change only under Task 10.
- Verification: node --test test/open-design-bundle.test.mjs test/release-evidence.test.mjs test/private-publish-guard.test.mjs.
- Expected result: deterministic local-only inventory, no token duplication or concept publication, honest status rows.
- Acceptance criteria: bundle works without workspace runtime dependencies and never claims PDF, Arabic, visual, or physical checks without evidence.
- Documentation impact: generated manual is not hand-edited.
- Recovery: rebuild from canonical sources after approved changes; never patch generated manual files directly.
- Risks and edge cases: package-level completion is not product-release completion.

## Task 7 — Figma masterbrand library

Status: IN PROGRESS

- Objective: deliver exactly 104 permanent native Figma pages with correct anatomy, variables, styles, components, metadata, and evidence while preserving 13 legacy pages.
- Dependencies and order: consumes Tasks 2–5. Aperture-dependent pages wait for Task 3. Work one page or reviewer-sized batch at a time from fresh live state.
- Exact files/external state: approved Figma Design file; governance/design-ledgers/figma/bizarre-live-observation-v2-2026-07-16.json; bizarre-104-page-population-plan-v2.json; current v2 receipts; production/figma/phase2/*.js; scripts/build-figma-*.mjs; scripts/lib/figma-*.mjs; test/figma-*.test.mjs.
- Existing symbols/IDs: page IDs and root IDs in the v2 observation; current 01.03 root 184:2; local Signal Action and Status Indicator component sets; nine canonical collections and 173 variables.
- Interfaces consumed: exact v2 subject/spec hashes, canonical variable import plan, UI contract, current live observation.
- Interfaces produced: managed-current subject roots, receipts, QA evidence, Code Connect-ready names, and a refreshed observation.
- Preconditions: official connector access; fresh state before every mutation; no user focus conflict; Task 3 green before 01.02, 04.01, or 06.01 acceptance.
- Current evidence: 32 focused tests pass. Live observation: 104 permanent, 13 legacy, 16 local collections/388 variables total, nine canonical collections/173 variables, and four effect styles. The final portable plan classifies 60 roots as migration-required, 38 pages as empty, six as unmanaged conflicts, and zero as preserved-current. Page 01.03 root `184:2` is `managed-stale` against the final portable source.
- Conflict sequence:
  1. 01.01: capture fresh evidence, preserve both roots, then bounded reconciliation rather than blind adoption.
  2. 01.02: preserve roots; reconcile only after the asymmetric aperture source is fixed.
  3. 04.01: preserve verified native gradient geometry; bounded v2 rebuild with current metadata and evidence.
  4. 06.01: reconcile composition after Task 3; replace dependent ellipse primitives with the one governed path.
  5. 11.05: preserve the strong real-photo/component construction; reconcile anatomy, metadata, bilingual, motion, and publication evidence.
  6. 11.12: rebuild as a host-specific platform exemplar; do not treat it as the cross-platform Make product.
- Remaining test-first cycle:
  1. Add or update a receipt/plan assertion for one target page.
  2. Confirm RED against stale/conflicting state.
  3. Capture fresh live state and perform the minimum native mutation.
  4. Write the receipt, rerun the focused Figma slice, and compare matched screenshots.
  5. Continue through 60 migration-required and 38 empty pages in population-plan batch order, overview before details.
- Verification: node --test test/figma-v2-migration-groundwork.test.mjs test/figma-variable-import-plan.test.mjs test/figma-variable-apply-receipt.test.mjs test/figma-104-page-population-plan.test.mjs test/figma-make-subject-contract.test.mjs; official connector inspection; matched visual comparison.
- Expected result: all 104 permanent pages managed-current or honestly blocked, exact names/anatomy, bindings intact, no detached SDS instances, legacy pages preserved.
- Acceptance criteria: 104/104 inventory, 13/91 anatomy, 173 canonical variables, five modes, four effects, receipt-backed current roots, focus/RTL/contrast/motion checks.
- Documentation impact: refresh the v2 observation and this task status after every accepted batch.
- Recovery: preserve old roots and collections until accepted replacement receipts exist; never delete from v1 ledgers.
- Risks and edge cases: external canvas may change between reads; screenshots alone are not QA; current live conflicts override stale apply receipts.

## Task 8 — Figma Make interactive prototype

Status: BLOCKED BY LIVE SYNCHRONIZATION AND LIBRARY APPROVAL

- Objective: deliver a synchronized, interactive prototype using the approved library and host-native React patterns with restrained Bizarre recognition.
- Dependencies and order: follows approved Task 7 foundations and Task 3 geometry. Local source can be tested before live sync, but external completion cannot be claimed.
- Exact files/external state: production/figma-make/bizarre-industries/src/app/App.tsx; src/styles/index.css; README.md; assets; test/figma-make-subject-contract.test.mjs; Make key s9stWDZe0kwBisJjfFMOqT.
- Existing symbols: App, subject search/navigation, subject selection, Capture control, production-channel simulations, reduced-motion branch.
- Interfaces consumed: 104-subject v2 manifest, UI integration contract, approved library components/assets.
- Interfaces produced: complete visitor journey and synchronization receipt.
- Preconditions: Task 7 target frames approved; official Make access; host container identified.
- Current evidence: local key, 104-subject, and host-boundary CSS tests pass. Variables, universal rules, media defaults, and reduced-motion behavior are scoped to `.app-shell`. Session-observed external state, not repository-reverified during closeout: live connector inspection showed Make `App.tsx` as an empty centered div with template guidelines and generic global theme CSS. Status remains VERIFIED FAIL / NOT SYNCHRONIZED until a fresh live read proves otherwise.
- Remaining test-first cycle:
  1. Preserve the passing host-boundary contract. Do not reopen the completed CSS scoping work without a regression.
  2. Verify the local React journey against approved library components and current subject data.
  3. Synchronize the current Make key through the official connector.
  4. Re-read the live file and prove that App.tsx, theme, and guidelines match repository source.
  5. Verify keyboard, focus, reduced motion, LTR/RTL, responsive reflow, loading/error/success, and core Capture journey.
  6. Record a live synchronization receipt.
- Verification: node --test test/figma-make-subject-contract.test.mjs; local runtime interaction test; connector inspection at matched viewports.
- Expected result: no global/root takeover, all core controls work, live canvas matches the repository source and approved library.
- Acceptance criteria: current key synchronized, journey complete, host conventions preserved, accessibility and motion checks pass, receipt exists.
- Documentation impact: update production/figma-make/bizarre-industries/README.md only after live sync is verified.
- Recovery: keep the local mirror and previous live Make version until synchronization evidence is accepted.
- Risks and edge cases: a polished local React surface is not proof of the live Make canvas; Apple-specific exemplars must not define the cross-platform host.

## Task 9 — Affinity native master and real mockups

Status: IN PROGRESS

- Objective: complete one native Bizarre-Industries-Masterbrand-Library.afdesign document with 104 mirrored artboards, native vectors/live type, real mockups, and per-artboard provenance.
- Dependencies and order: consumes Tasks 2–4 and mirrors Task 7. Task 3 must resolve the aperture before dependent artboards are accepted.
- Exact files/external state: production/affinity/bizarre-masterbrand-subjects-v2.json; bizarre-masterbrand-content-spec-v2.json; build-bizarre-masterbrand-library-v1-staged.js; manifests/bizarre-gradient-recipes-v1.json; governance/gradient-recipes.json; Affinity native master; Affinity tests.
- Existing symbols: addSmoothEllipse, addSmoothCubicPath, staged subject renderers, 11-layer artboard construction.
- Interfaces consumed: 104-subject/spec pair, canonical assets, fonts, metadata fixtures, observed/licensed/original bases.
- Interfaces produced: 104 native artboards, approved exports, QA renders, cross-tool receipts.
- Preconditions: native Affinity access, exact aperture source, licensed/observed/original base evidence, one-artboard-at-a-time inspection.
- Current evidence: manifest validates 104 subjects, 13 overviews, and 91 details. Builder/content-spec tests pass. Session-observed external state, not repository-reverified during closeout: one Affinity spread contained 104 artboards, each with the exact anatomy layers named 40, 50, 60, 70, 80, 90, 99, 10, 20, 30, and 00. The document was clean. Artboard 11.05 uses a genuine observed Pexels hardware photo with an editable native label. Artboard 11.11 is explicitly a generated, nonpublishable concept reference and does not satisfy the final real-mockup requirement. Seven gradient recipes are repository-validated; per-subject gradient/material rendering and matched far/normal/close visual QA remain unverified.
- Remaining test-first cycle:
  1. Preserve the verified 104 by 11 live inventory as the anatomy baseline.
  2. After Task 3 owner approval, add an Affinity builder/content assertion that the aperture recipe cannot call addSmoothEllipse and confirm RED.
  3. Replace aperture calls with the governed Task 3 native path while leaving true circular and elliptical field contours alone.
  4. QA each subject at far, normal, and close scale against the approved reference and matched Figma page.
  5. Replace every final-mockup slot that is concept-only with an observed, licensed, or original base. Keep ImageGen references visibly nonpublishable.
  6. Produce per-subject receipts and approved exports only after visual QA.
- Verification: npm run check:affinity-manifest; npm run check:gradient-recipes; node --test test/affinity-builder-governance.test.mjs test/affinity-content-spec.test.mjs test/gradient-recipes.test.mjs; live Affinity inventory and matched visual comparison.
- Expected result: exact 104-artboard native document, no aperture ellipses, native gradients/materials/live type, real mockups, honest evidence.
- Acceptance criteria: 104/104 mirror, 11-layer anatomy, asymmetric aperture, exact Gravity Well, Signal Lime flat, all bases classified, no rejected/generated art in publishable layers.
- Documentation impact: record the portable live inventory and per-artboard evidence; do not paste personal filesystem paths into documentation.
- Recovery: preserve native master versions and locked concept-reference layers; do not flatten or overwrite accepted artboards without evidence.
- Risks and edge cases: manifest existence does not prove visual completeness; addSmoothEllipse is valid for real field contours but not the asymmetric aperture; a generated photo is not a real mockup.

## Task 10 — Full release gate and milestone

Status: REPOSITORY RELEASE CANDIDATE VERIFIED; PRODUCT RELEASE BLOCKED

- Objective: prove deterministic repository state and complete honest cross-tool visual, accessibility, bilingual, motion, production, and release evidence.
- Dependencies and order: final task; repository gates are green, while product release remains blocked by Tasks 3 and 7–9 plus external evidence.
- Exact files: docs/next-milestones.md; future milestone report docs/milestones/2026-07-15-astronomical-atlas-system.md; release evidence under packages/open-design generated from canonical source; all relevant tests and receipts.
- Existing headings/interfaces: release evidence statuses PASS, FAIL, NOT VERIFIED; package verify script.
- Interfaces consumed: all canonical packages, Figma receipts/screenshots, Affinity receipts/renders, Make synchronization evidence, specialist and physical evidence.
- Interfaces produced: one milestone report and release decision.
- Preconditions: repository candidate requires green machine gates, deterministic generated output, and portable staged scope. Full product release additionally requires no unresolved source contradiction, unmanaged external conflict, or unverified required gate.
- Current evidence: `npm test` passes 234/234. `npm run check:generated` and `npm run verify` pass. V1/V2 Figma contracts pass 32/32 and repository portability contracts pass 3/3. Commit candidates contain no personal absolute paths or absolute symlink targets. Runtime state, local runners, cached plugins, machine-local symlinks, duplicate scratch assets, and ungoverned captures are ignored and preserved locally. External design artifacts remain partial; multiple release rows correctly remain `NOT VERIFIED`.
- Remaining test-first/release cycle:
  1. Obtain the Task 3 owner geometry-workflow decision.
  2. Complete Tasks 7–9 with versioned receipts and matched comparisons.
  3. Run visual, focus, contrast, target, RTL, reduced-motion, Arabic, mockup, and physical evidence review.
  4. Generate the milestone report. Leave unavailable evidence `NOT VERIFIED`.
  5. Rerun `npm run verify`, `npm run check:generated`, staged secret and personal-path scans, and `git diff --check` before any later publication commit.
  6. Publish packages or public design claims only after all required external evidence is present.
- Verification: npm run verify; npm run check:generated; npm run check:affinity-manifest; npm run check:gradient-recipes; focused Figma and external evidence checks; git diff --check.
- Expected result: machine gates remain green, deterministic hashes match, required external gates carry evidence, staged scope stays portable, and no false completion claim is published.
- Acceptance criteria: full release evidence has no unexplained FAIL and no required OPEN UNKNOWN; owner/specialist/physical gates are either evidenced or the release remains blocked.
- Documentation impact: keep `docs/agent-handoff.md` and this plan current. Update `docs/next-milestones.md` and create the dated milestone report only when evidence supports completion.
- Recovery: do not clean the dirty tree; preserve all pre-existing work and reverse only release-document changes from the current session.
- Risks and edge cases: passing machine tests cannot substitute for visual or physical evidence; default npm cache permissions can create false code failures.

## Execution discipline

For every remaining implementation task:

1. Re-read docs/agent-handoff.md and compare branch, HEAD, and status.
2. Add or identify the narrow failing contract.
3. Run it and record the real RED result.
4. Make the minimum source change.
5. Rerun the focused test and relevant regression slice.
6. Update receipts and documentation from verified behavior only.
7. Review the exact diff and working-tree attribution.
8. Repository snapshot publication is authorized by the current owner request after portable staging scope is explicit, machine gates are green, and the staged diff passes secret and personal-path review. Product-release claims still require the external evidence in Task 10.
