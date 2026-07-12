# Bizarre Industries Design System

Canonical Bizarre Industries design language for software, hardware, graphics, and media.

Signal Lime is the only brand accent. CATCH THE STARS is the permanent tagline.

This repository publishes the official identity, tokens, assets, framework overlays, and conformance contracts. `brand/identity.json` is the permanent machine-readable contract. The `Bizarre-Industries/themes` repository is a downstream third-party theme consumer and must pin a released package from this repository.

## Commands

- `npm test` verifies source and build contracts.
- `npm run build` atomically publishes deterministic local package output.
- `npm run check:generated` verifies generated output without writing.
- `npm run verify` runs the complete local gate.
