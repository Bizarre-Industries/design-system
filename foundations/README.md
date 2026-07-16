# Foundations

Canonical machine-readable design tokens live only in the explicitly ordered documents listed by `tokens/source/manifest.json`. The generated CSS, JSON, and manifest under `packages/tokens/generated/` are deterministic release artifacts published as `@bizarre/tokens`; they must not be edited directly. Loose root-level token files are migration inputs, not parallel authorities.

This milestone governs primitives, semantic color roles for five modes, typography roles, geometry, motion, contrast declarations, and deterministic publication. It does not complete a component library, platform-native product integration, Arabic typography, downstream theme migration, or cross-platform certification.

Verify the workspace with `npm run verify`. To reproduce and check generated outputs explicitly, run `npm run build` followed by `npm run check:generated`.
