# Task 5 report: accessible semantic themes

## Outcome

- Added WCAG 2.x sRGB linearization and contrast-ratio calculation.
- Added load-time validation for explicit contrast-pair metadata and identical semantic role paths across all five modes.
- Completed every mode with canvas/elevated/card surfaces; primary/secondary/muted/accent content; default/strong/accent borders; default/hover/active/disabled actions; and success/warning/danger/info surface/content pairs.
- Signal Lime remains `#C6FF24`. Paper and Bone never use Signal Lime as a content token; Paper uses Accent Ink and Bone uses Ash 900 for accessible accent content.

## Measured ratios

All content and status thresholds are 4.5:1. Border thresholds are 3:1. Values below are rounded to two decimals, matching validator diagnostics.

| Pair | Void | Paper | Void HC | Workshop | Bone |
| --- | ---: | ---: | ---: | ---: | ---: |
| content.primary / surface.canvas | 15.18 | 15.49 | 19.74 | 13.66 | 12.66 |
| content.secondary / surface.canvas | 9.73 | 7.12 | 16.52 | 8.93 | 6.77 |
| content.muted / surface.canvas | 9.73 | 7.12 | 10.59 | 8.93 | 6.77 |
| content.accent / surface.canvas | 16.30 | 4.63 | 17.73 | 14.96 | 14.73 |
| border.default / surface.canvas | 9.73 | 4.03 | 10.59 | 8.93 | 3.84 |
| border.strong / surface.canvas | 15.18 | 7.12 | 19.74 | 13.66 | 6.77 |
| border.accent / surface.canvas | 16.30 | 4.63 | 17.73 | 14.96 | 4.41 |
| status.success.content / status.success.surface | 7.60 | 7.60 | 7.60 | 7.60 | 7.60 |
| status.warning.content / status.warning.surface | 8.95 | 8.95 | 8.95 | 8.95 | 8.95 |
| status.danger.content / status.danger.surface | 5.57 | 5.57 | 5.57 | 5.57 | 5.57 |
| status.info.content / status.info.surface | 7.21 | 7.21 | 7.21 | 7.21 | 7.21 |

The legacy failing reference remains demonstrable: Signal Lime `#C6FF24` on Paper `#F9F8F2` is 1.11:1 and is rejected against 4.5:1.

## Primitive decisions

No palette primitives changed. In particular, Signal Lime and all four supplied functional status colors are unchanged. Each bright functional status surface uses Void `#0E0E0E` content; the lowest status pair is Danger at 5.57:1, so no functional primitive adjustment was necessary.

## Verification scope

The Task 5 focused suite covers known WCAG values, a legacy failing pair, a passing pair, five-mode role parity, missing-role diagnostics, and source-model loading. The four known build-token serializer/fixture failures remain deferred to Task 6 and were not modified here.
