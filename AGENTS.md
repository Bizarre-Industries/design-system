# Repository Instructions

## Active work — resume contract

- Canonical handoff: `docs/agent-handoff.md`
- Active implementation plan: `docs/superpowers/plans/2026-07-15-astronomical-atlas-system.md`
- Before editing, compare branch, HEAD, and worktree status with the handoff snapshot.
- Continue at the handoff's first exact next action and the plan's first unfinished task.
- Update both documents before ending a working session.

## Stable rules

- Read `governance/CONTRIBUTING.md`, the handoff, and the active plan before changing source or generated output.
- Authority order is the non-negotiable name and Gravity Well geometry, explicit Atlas overrides, canonical repository sources where the extension is silent, then derived output. See `governance/authority.json`.
- Bizarre Industries is one identity. Preserve host product and platform conventions; apply Bizarre as a restrained recognition layer.
- Never edit `packages/*/generated/**` directly. Change canonical sources, add or update the focused contract test, then run the declared build.
- Preserve unexplained staged, unstaged, and untracked work. Never delete, reset, restore, or clean it to make verification pass.
- Approved local gates are `npm test`, `npm run check:generated`, and `npm run verify`. Use Node.js 22 or newer.
