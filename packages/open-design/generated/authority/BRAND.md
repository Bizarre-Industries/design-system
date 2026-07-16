# BIZARRE INDUSTRIES

## Brand Book, v0.2 - July 2026

---

## 0. What this is

Human-readable guidance for how Bizarre looks, sounds, and shows up. The versioned machine-readable identity contract is `brand/identity.json`; computed design values are published by the generated packages.

It is not a marketing plan, a corporate style guide, or a deck. It is a livery. The rules exist so that anyone picking up the kit deploys it coherently without needing to ask permission.

Two things are non-negotiable: the exact `Bizarre Industries` name and the approved Gravity Well geometry. Everything else is a governed design decision that can change through an explicit identity revision. Three things you never break in this governed version:

1. The mark uses only the approved primary, inverse, and transparent treatments, with Signal Lime, Void, and Void Gray only in the color-role combinations defined by their approved assets. The Gravity Well figure is always monochrome, fully Signal Lime or fully black, never a mixture of both.
2. The slogan is exactly **CATCH THE STARS** with no trailing punctuation. Its standalone rule is defined below.
3. The voice is second-person, promotion-focused, never anti-establishment.

Everything below is the longer explanation.

---

## 1. Thesis

Bizarre is a flag for people already doing the work. A house for the ones already wired. Not a club, not a lifestyle brand. Bizarre Industries is the only identity. It does not create subbrands or child brands.

The thesis in one line: *agency is native, curiosity is the reason: **CATCH THE STARS***

The thesis in one paragraph: human beings were born with the instinct to make, fix, chase, and build. The world spends eighteen years trying to talk us out of it. Bizarre is for the people who didn't listen. The ones who are still up welding, coding, racing, writing, soldering, prototyping, and shipping the dumb thing because the dumb thing wants to exist. We don't make the work. We name the people who already do.

Every downstream decision, visual, verbal, commercial, refers back to this thesis. If a proposed ad, product, feature, partnership, or piece of copy does not trace back to "this helps the already-wired do their thing," it doesn't belong.

---

## 2. Voice

### Register

Casual, direct, dry. Slightly sarcastic where it earns the laugh. No HR-speak, no tech-bro jargon, no manifesto-ese that sounds like every other manifesto. Talk like a friend who respects you enough to skip the warm-up.

### Person

Second-person ("you") is primary. The brand speaks TO the reader, not AS a collective. Exceptions are rare and deliberate: the moment of inclusion ("you were always one of us"), and internal documentation.

First-person singular ("I") is for individual voices inside the movement, not for the brand itself.

Third-person ("Bizarre is", "the movement does") is administrative and fine when documenting.

### Rhythm

Short. Then short. Then a longer sentence when it earns the breath. Then short again. Readable at speed. Nothing purple, nothing professorial.

### What Bizarre sounds like

> "You already know. You've always known."
>
> "Every broken prototype is tuition."
>
> "The bench is honest in a way almost nothing else is."
>
> "Do it because you can."

### What Bizarre does not sound like

> ❌ "We're on a mission to empower creators..." (mission-statement HR-speak)
>
> ❌ "Disrupting the status quo..." (anti-establishment cliché)
>
> ❌ "Join the movement!" (begging)
>
> ❌ "Because we believe..." (permission-seeking)
>
> ❌ "In today's fast-paced world..." (filler opening)

### Forbidden phrases

- "disrupt" or any conjugation
- "synergy", "leverage", "ecosystem", "unlock", "empower", "elevate"
- "in a world where..."
- "passionate about"
- "the future of X"
- Emoji in headlines or display type (fine in casual social posts)
- Exclamation marks in taglines or display text

### Allowed profanity

Rare, earned, never gratuitous. The thesis ("do things because you can, cleaned-up fuck-around-and-find-out") means the edge is there, but the brand doesn't lean on swearing as personality. Think fewer than one instance per thousand words across the surface area.

---

## 3. The mark

### Construction

The primary mark is a square frame containing a concentric spiral with an off-center dark sphere near the center. The spiral reads as a gravity well or portal; the sphere reads as the thing being caught. This is not decorative. The mark IS the slogan, rendered as geometry: something being pulled toward something else, at the edge of possibility, about to be caught.

The mark is direction-agnostic for left-to-right and right-to-left layouts, but its supplied orientation is fixed. Do not rotate it.

### Variants

Approved logo paths and checksums are recorded in `packages/assets/generated/manifest.json`; use those generated SVGs rather than reconstructed marks.

- **Primary (Signal Lime ground, black figure):** default tile treatment. The Gravity Well figure is fully black.
- **Inverse (Deep Void ground, Signal Lime figure):** for dark surfaces and dark-mode UI. The Gravity Well figure is fully Signal Lime.
- **Transparent (black figure, no ground):** for Paper and other approved light-neutral grounds.

The Gravity Well figure is always monochrome: fully Signal Lime or fully black. Never mix the two colors inside the figure, and never apply the Atlas spectrum, a gradient, material shading, or an optical effect to the mark itself.

### Clearspace

Minimum clearspace around the mark on all sides equals the width of one ring (the unit X). At small sizes, clearspace = 1 character height of adjacent type. No text, other marks, edges, or significant visual noise inside the clearspace zone.

### Minimum sizes

- Full mark: 48px digital, 15mm print.
- The full mark is not approved below 48px digital or 15mm print. A simplified small-size mark is deferred and unavailable until formally approved.

### What the mark does not do

- Uses only the color-role combinations declared by its approved asset entry; the figure is fully Signal Lime or fully black.
- Does not get a gradient.
- Does not rotate.
- Does not have a drop shadow, glow, or bevel.
- Does not get cropped, flipped inside the frame, or reframed.
- Does not appear in a circle, hexagon, or rounded-square container. The frame is part of the mark.

### Wordmark

Big Shoulders Stencil Display, all caps at weight 800, is the future typographic direction for wordmark exploration. Formal wordmark and lockup assets, names, spacing, and configurations are deferred and unavailable; none are approved for use. Until those assets are governed, keep ordinary typography spatially separate from the approved mark and do not present the combination as a wordmark or lockup.

### Slogan

**CATCH THE STARS** stands alone: it is never a formal logo/wordmark lockup, button label, product name, or email subject. It may share a larger editorial surface when spatial separation makes it an independent closing or ceremonial element. It is the benediction, appearing at the end of manifestos, on the back of posters, on the inside of packaging, on the flip side of stickers, and in other closing positions.

In the current governed version, slogan type is Unbounded at black weight, all caps, with letterspacing from `--bzr-font-tracking-tight`.

---

## 4. Colors

### Current brand core (governed)

| Token | Role |
|---|---|
| `--bzr-color-accent-signal` | Signal Lime. The highest-salience operational cue and approved primary-mark ground. |
| `--bzr-color-neutral-ash700` | Void Gray. Structural neutral for fields and UI, never a Gravity Well figure color. |
| `--bzr-color-neutral-void` | Deep Void. Primary dark background primitive. |
| `--bzr-color-neutral-paper` | Paper. Primary warm light-background primitive. |

### Functional extensions

| Token | Role |
|---|---|
| `--bzr-color-accent-ink` | Lime Ink. Accessible functional text and controls where Signal Lime would fail on a light surface. |
| `--bzr-color-accent-glow` | Lime Glow. Governed tints, hover fields, and highlight strokes on dark surfaces. |
| `--bzr-surface-card` and `--bzr-surface-elevated` | Theme-aware elevated surfaces; use these semantic roles instead of fixed dark values. |
| `--bzr-color-neutral-ash900` through `--bzr-color-neutral-ash100` | Canonical mid-neutral primitives. |

The tables are explanatory. Use `packages/tokens/generated/tokens.css` or the `@bizarre/tokens` package for computed values; do not copy values from this document into implementations.

### Rules

1. **Signal Lime is never used on white/paper surfaces as body text or functional UI.** It fails contrast. Use Lime Ink (`--bzr-color-accent-ink`) for that role.
2. **Lime is the hero, not the carrier.** In a page or poster, lime should be the rare accent that draws the eye, not the ground. The ground is void, gray, or paper. Exceptions: the primary mark's ground, dedicated lime-field posters, and signage meant to be seen at distance.
3. **Gradients are permitted when they encode a documented data field, exposure, heat, optical coating, or material response.** They are not an arbitrary brand-color treatment: do not apply a gradient to the approved mark, and Signal Lime must never be graded into another hue. Decorative aurora blobs are outside the current system.
4. **The semantic colors (success, warn, danger, info) are for functional UI only.** Never use them as brand accents in marketing, type, or identity contexts.

### The 60-30-10 rule for layouts

60% ground (void, paper, or ash depending on surface)
30% structure (ash tones, gray, or lime-glow tints)
10% Signal Lime, as accent, never more

Going above 10% lime per surface cheapens it. The scarcity is what makes it land.

---

## 5. Type

### The stack

| Family | Role | Weights used | Why |
|---|---|---|---|
| **Unbounded** | Display, ceremony, the slogan | 400, 700, 900 | Geometric, slightly cosmic silhouette. Reads as "the reach." Wordmark alternative for display contexts. |
| **Big Shoulders Stencil Display** | Industrial headings, livery, panels; future wordmark exploration | 700, 800, 900 | Industrial stencil DNA. Reads as "the workshop." Formal wordmark use is deferred. |
| **Hanken Grotesk** | Body, UI, reading | 300, 400, 500, 700 | Precise modern grotesque, highly readable at small sizes, neutral enough to carry long text. |
| **JetBrains Mono** | Code, technical, dev artifacts, eyebrow labels | 400, 500, 700 | For code, terminals, technical documentation, and the uppercase eyebrow labels that sit above headings. |

All four are governed local assets in `@bizarre/assets`; web surfaces load the generated local font stylesheet. License and provenance records are included in the asset package.

### Minimum viable subset

If you only have two fonts: **Big Shoulders Stencil Display** (headings and display) + **Hanken Grotesk** (everything else). This covers roughly 90% of surfaces.

If you only have one font: **Hanken Grotesk** at multiple weights. Acceptable for internal documents and emergency fallback.

### Type hierarchy (web / screen)

```text
H1  (hero display)   Unbounded 900, clamp(3.75rem, 12vw, 12rem), -0.04em, lh 0.92
H2                   Unbounded 700, 3.75rem, -0.02em, lh 1.15
H3                   Big Shoulders Stencil 800, 2.75rem, 0, lh 1.15
H4                   Big Shoulders Stencil 700, 2rem, 0, lh 1.15
H5                   Hanken Grotesk 700, 1.5rem, 0, lh 1.15
Eyebrow              JetBrains Mono 500, 0.875rem, UPPERCASE, 0.16em, lh 1
Body                 Hanken Grotesk 400, 1rem, 0, lh 1.55
Body-lead            Hanken Grotesk 400, 1.125rem, 0, lh 1.55
Caption              Hanken Grotesk 400, 0.875rem, 0, lh 1.55
Code                 JetBrains Mono 400, 0.9em, 0, lh 1.5
```

### Rules

These are rules for the current governed version, not immutable brand anchors.

1. **Use one display family per heading.** Do not mix Unbounded and Big Shoulders Stencil inside one heading block.
2. **The current slogan treatment uses Unbounded.** Its typography can change through an explicit governed identity revision; the slogan text remains separately governed.
3. **Future wordmark exploration starts with Big Shoulders Stencil.** This is guidance for the deferred design process, not approval of a wordmark asset.
4. **Eyebrows use monospace, uppercase, wide-tracked type.** Repetition makes this current detail recognizable.
5. **Body text uses start alignment.** That is left in LTR and right in RTL; do not justify it.

---

## 6. Layout grammar

### The grid

Use the governed spacing scale published by `packages/tokens/generated/tokens.css`; this document does not define parallel CSS names or values.

### The two layout modes

Bizarre layouts fall into one of two modes. Pick one per page/poster/surface and commit to it.

**Precision Panel.** Tight grid, technical, stencil labels, dense. Reads as a spec sheet, a dashboard, a datasheet, a race team press release. Use for docs, dev surfaces, internal tools, packaging.

**Display Field.** Loose, single column, large type, lots of negative space. Reads as a poster, a manifesto spread, a fashion-book-style editorial. Use for manifestos, posters, hero sections, announcements.

Never mix the modes in a single surface. Sections within a longer document can alternate (a manifesto opens in Mode B, then spec pages later are Mode A), but each self-contained view is one mode.

### Eyebrows

Every major heading block gets an eyebrow: a small uppercase monospace label above the heading. Format: `FILE / SECTION / DATE` or `VERSION / STATUS / OWNER` or similar. This is the single strongest layout signature for Bizarre, on sight. Use it liberally.

Example:

```text
CATALOG / 014 / APR 2026
The workshop under the stars
```

### Rules

1. No rounded corners beyond 4px. Bizarre is geometric.
2. No drop shadows beyond the tokens' minimal set. Flat is the default.
3. No centered body text. Centering is reserved for display/manifesto type only.
4. No arbitrary decorative gradient backgrounds; documented data fields and material responses follow the color rules.
5. Borders and dividers use `--bzr-border-1` (1px) or `--bzr-border-3` (3px). Between those, pick 1 or 3, never 2.

---

## 7. Applications

### Priority order (build in this sequence)

1. **Web presence:** landing page at bizarre.industries + repo READMEs
2. **Physical stickers and patches:** 2" circle sticker, 3" woven patch, 8.5"x11" poster
3. **Dev artifacts:** terminal color scheme, shell prompt, vim theme
4. **Apparel:** plain black tee with lime mark, plain lime tee with void mark
5. **Livery elements:** vinyl decal pack for racing/shop application

### Web

- Default to the `void` theme, using its `--bzr-surface-canvas` ground and `--bzr-content-primary` type roles.
- Landing page is Mode B: single column, huge display type, the slogan as hero, the manifesto below.
- Eyebrows above every major section.
- No carousels, no sliders, no modal popups for newsletter signups.

### Repo README template

Every Bizarre-adjacent repo uses the same README header format:

```markdown
# PROJECT-NAME

> One-line description in Hanken Grotesk voice.

![mark](./assets/bizarre-mark.svg)

`BIZARRE / PROJECT-NAME / STATUS`

...rest of README in standard markdown...

---

    CATCH THE STARS
```

Full template to be produced as a separate artifact.

### Stickers and patches

- 2" circle sticker: primary mark, full color, die-cut to the square frame with 3mm bleed.
- 3" woven patch: production treatment deferred until a simplified mark is approved; do not substitute the full mark at an unapproved size.
- 8.5"x11" poster: Mode B layout, manifesto or single-line slogan, Signal Lime ground or Void ground.

### Terminal theme

ANSI palette mapping (for iTerm2, kitty, WezTerm, Windows Terminal, etc.):

| Terminal role | Canonical source |
|---|---|
| Foreground | `--bzr-color-neutral-paper` |
| Background | `--bzr-color-neutral-void` |
| Cursor | `--bzr-color-accent-signal` |
| Selection background | `--bzr-color-neutral-smoke` |
| ANSI 0 / black | `--bzr-color-neutral-void` |
| ANSI 1 / red | `--bzr-color-status-danger` |
| ANSI 2 / green | `--bzr-color-accent-signal` |
| ANSI 3 / yellow | `--bzr-color-status-warning` |
| ANSI 4 / blue | `--bzr-color-status-info` |
| ANSI 5 / magenta | `--bzr-color-accent-glow` |
| ANSI 6 / cyan | `--bzr-color-spectrum-ion-cyan` |
| ANSI 7 / white | `--bzr-color-neutral-ash100` |

Published terminal files must resolve these canonical tokens during their governed build. Bright ANSI values remain deferred until that artifact defines and tests them; do not lift luminance ad hoc in consuming applications.

Shell prompt:

```text
bzr ✦ ~/project (branch) ✦
```

Use `✦` (U+2726 black four-pointed star) as the prompt separator. Star, because obviously.

---

## 8. One identity, native integration

### Identity rule

- **BIZARRE INDUSTRIES** is the sole public identity.
- Subbrands, child brands, endorsed brands, derivative Bizarre names, and product-specific Bizarre identities are not part of the system.
- A product does not receive a new Bizarre mark, wordmark, lockup, or visual identity by default.

### Product integration rule

Integrate. Do not replace. The host product and platform own navigation, controls, input behavior, accessibility, typography defaults, density, layout conventions, and interaction grammar. Bizarre contributes a restrained recognition layer through governed tokens, state semantics, voice, composition, data visualization, and rare identity moments.

For web products, React is an implementation library, not a visual language. Preserve the product's existing component system, semantic HTML, browser behavior, and documented interaction patterns before applying any Bizarre styling.

For iOS and macOS products, preserve SwiftUI and Apple platform conventions. Standard controls, navigation, system typography, accessibility, input behavior, window behavior, and platform motion remain native. The Bizarre layer stays small, functional, and recognizable.

Framework convention wins when a Bizarre treatment would make the product feel less native, less accessible, or less familiar. Audit the existing product infrastructure before deciding the exact recognition layer.

---

## 9. The "no" list

What Bizarre is not in the current governed version.

1. **Not anti-establishment.** We are pro-human. The establishment isn't the enemy, inertia is.
2. **Not tech-bro.** No "we're changing the world," no "disruption," no crypto-bro adjacency, no hustle-culture language.
3. **Not luxury.** Bizarre is garage-accessible. A $12 sticker is as Bizarre as a $400 jacket.
4. **Not masculine-coded.** The workshop-under-stars register is universal. Visual language avoids gendered tropes (no "rugged man builds thing" photography).
5. **Not nostalgic.** Forward-facing always. The workshop is current, the stars are ahead. No retro-fetishism, no sepia tones, no typewriter affectations.
6. **Not viral-first.** Bizarre doesn't chase memes, trends, or the algorithm. Slow mark, patient growth, artifacts that last.
7. **Not preachy.** The manifesto exists once. After that, we don't re-manifesto at people. Show, don't sell.
8. **Not corporate.** No stock photography, no diversity-washed hero shots, no "our values" page, no "meet the team" in matching outfits.

When in doubt, ask: would this be in the bin if Bizarre had only ever made ten decisions? If yes, cut it.

---

## 10. Arabic and multi-language

### Status: provisional, not public-ready

Bizarre's founder thinks in Arabic and English. The Middle East is a plausible and welcome audience. The identity needs an Arabic treatment plan before it goes fully public in that region.

### What works already

- The mark works in LTR and RTL layouts without rotation.
- Signal Lime and Void Gray carry across cultures without specific connotations that block the brand.
- A working translation candidate for CATCH THE STARS is **امسك النجوم**. Its meaning, register, and voice are **NOT VERIFIED** pending native Arabic review; do not publish it as approved copy.

### What needs work

- The future wordmark direction (Big Shoulders Stencil) has no approved Arabic equivalent. Choose any eventual pairing with an Arabic type specialist, not by visual guesswork.
- The current provisional body and display stack is **Noto Sans Arabic**. Compact UI uses **Noto Sans Arabic UI**. Industrial labels use **Noto Sans Arabic Condensed** at weight **800**.
- Those stacks are implementation policy, not public-release evidence. Governed font binaries, native Arabic review, and optical-parity evidence are still missing.
- The manifesto needs translation, not transliteration. The voice has to land, not just the words.
- The standalone Arabic slogan treatment is right-to-left; it is not a lockup.

### Rule

Public bilingual shipping remains **NOT VERIFIED**. Interim internal Arabic surfaces use only the provisional governed stacks above and must be labeled provisional until native Arabic review and optical-parity evidence pass.

---

## 11. What's next

The following artifacts extend this book and should be produced in sequence:

1. **Deferred logo extensions** — the approved monochrome full mark is complete; simplified small-size, wordmark, monogram, and lockups still require design and formal approval before use. Future approved logo assets must remain clean SVG; governed evidence mockups may use provenance-recorded raster exports.
2. **Poster templates** — Precision Panel and Display Field reference layouts as Figma and Affinity files.
3. **README template** — markdown file with embedded SVG mark.
4. **Terminal theme files** — iTerm2 `.itermcolors`, kitty `.conf`, vim colorscheme, WezTerm lua.
5. **Sticker / patch production spec** — die lines, color matching, vendor notes.
6. **Web starter** — minimal landing page + tokens hooked into a real CSS/HTML scaffold, deployable to bizarre.industries.
7. **Arabic pairing decision** — type pairing chosen, manifesto translated, standalone slogan treatment approved.

---

CATCH THE STARS
