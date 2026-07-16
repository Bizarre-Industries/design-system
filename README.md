# Bizarre Industries Design System

Canonical Bizarre Industries design language for software, hardware, graphics, and media.

Signal Lime is the current sole brand accent. CATCH THE STARS is the current governed tagline, meaning “Make the distant tangible.”

This repository publishes the official identity, tokens, assets, framework overlays, and conformance contracts. `brand/identity.json` is the versioned machine-readable identity contract. The `Bizarre-Industries/themes` repository is a downstream third-party theme consumer and must pin a released package from this repository.

## Governed extensions

Astronomical Atlas is an approved extension of the canonical identity. Its imported authority and source record live in `extensions/astronomical-atlas/`, while `governance/authority.json` defines the machine-readable precedence contract.

Only an explicit override in the extension outranks the canonical repository; wherever the extension is silent, the canonical repository remains authoritative. The only non-negotiable identity invariants are the Bizarre Industries name and Gravity Well geometry. Generated and tool-authored output is derivative only and never becomes a competing source of authority.

## Commands

- `npm test` verifies source and build contracts.
- `npm run build` atomically publishes deterministic local package output.
- `npm run check:generated` verifies generated output without writing.
- `npm run verify` runs the complete local gate.
