# BIZARRE INDUSTRIES
## Brand Book, v0.1 — April 2026

---

## 0. What this is

Human-readable guidance for how Bizarre looks, sounds, and shows up. The permanent machine-readable identity contract is `brand/identity.json`; computed design values are published by the generated packages.

It is not a marketing plan, a corporate style guide, or a deck. It is a livery. The rules exist so that anyone picking up the kit deploys it coherently without needing to ask permission.

Three things you never break, everything else is interpretation:

1. The mark appears in Signal Lime and Void Gray, or monochrome. Never other colors.
2. The slogan is exactly **CATCH THE STARS** with no trailing punctuation. Its standalone rule is defined below.
3. The voice is second-person, promotion-focused, never anti-establishment.

Everything below is the longer explanation.

---

## 1. Thesis

Bizarre is a flag for people already doing the work. A house for the ones already wired. Not a company, not a club, not a lifestyle brand. Bizarre Industries is the top-level movement/foundation identity; Bizarre Labs is its commercial arm; Bizarre Foundation is its governing nonprofit; Helling is a first-class product under Labs.

The thesis in one line: *agency is native, curiosity is the reason, catch the stars.*

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

The mark is direction-agnostic (works left-to-right, right-to-left, upside down) and can be rotated in 90° increments without losing meaning.

### Variants

Approved logo paths and checksums are recorded in `packages/assets/generated/manifest.json`; use those generated SVGs rather than reconstructed marks.

- **Primary (lime ground, void figure):** default, full color. Used anywhere the ground can be Signal Lime.
- **Inverse (void ground, lime figure):** for dark surfaces and dark-mode UI.
- **Mono lime:** single-color lime on any dark surface where the full mark would be too busy.
- **Mono void:** single-color void on any light surface where the full mark would be too busy.
- **Mono snow:** single-color white on photography, video, or colored grounds (e.g., a race livery).

### Clearspace

Minimum clearspace around the mark on all sides equals the width of one ring (the unit X). At small sizes, clearspace = 1 character height of adjacent type. No text, other marks, edges, or significant visual noise inside the clearspace zone.

### Minimum sizes

- Full mark: 48px digital, 15mm print.
- Simplified mark: 16px digital, 5mm print.
- Do not scale the full mark below 48px under any circumstance. Use the simplified variant.

### What the mark does not do

- Does not wear colors other than lime, void, mono.
- Does not get a gradient.
- Does not rotate continuously (it is not a loading spinner).
- Does not have a drop shadow, glow, or bevel.
- Does not get cropped, flipped inside the frame, or reframed.
- Does not appear in a circle, hexagon, or rounded-square container. The frame is part of the mark.

### Wordmark

"BIZARRE" is the short wordmark. "BIZARRE INDUSTRIES" is the full wordmark. "BIZARRE LABS" and "BIZARRE FOUNDATION" are the sub-brand wordmarks.

Wordmark type: Big Shoulders Stencil Display, all caps, weight 800. Letterspacing: default (`--ls-body`, 0). Line-height tight.

Wordmark is a separate artifact from the mark. They lock up in only two approved configurations:

1. **Horizontal lockup:** mark on left, wordmark on right, aligned to cap-height of the wordmark. Space between = 1X (one ring unit of the mark).
2. **Vertical lockup:** mark above, wordmark below, centered. Space between = 1X.

Any other configuration is not a lockup, it is a layout, which is fine but is not the official mark.

### Slogan

**CATCH THE STARS** stands alone: it is never a formal logo/wordmark lockup, button label, product name, or email subject. It may share a larger editorial surface when spatial separation makes it an independent closing or ceremonial element. It is the benediction, appearing at the end of manifestos, on the back of posters, on the inside of packaging, on the flip side of stickers, and in other closing positions.

Slogan type: Unbounded, black weight (900), all caps, tight letterspacing (`--ls-tight`, -0.04em).

---

## 4. Colors

### Brand core (never change)

| Token | Hex | Role |
|---|---|---|
| `--bzr-lime` | `#C6FF24` | Signal Lime. The brand. Hero surfaces and accents on dark. |
| `--bzr-gray` | `#545454` | Void Gray. The original mark color. Structural, not decorative. |
| `--bzr-void` | `#0E0E0E` | Deep Void. Primary dark background. |
| `--bzr-paper` | `#F9F8F2` | Paper. Primary light background, slightly warm. |

### Functional extensions

| Token | Hex | Role |
|---|---|---|
| `--bzr-lime-ink` | `#5E7A00` | Lime Ink. Functional use of lime on light backgrounds (WCAG AA compliant). Use whenever lime would appear on paper or snow. |
| `--bzr-lime-glow` | `#E8FF8A` | Lime Glow. Tints, hover fields, highlight strokes on dark surfaces. |
| `--bzr-void-2` through `--bzr-void-4` | — | Elevated dark surfaces. |
| `--bzr-ash-900` through `--bzr-ash-100` | — | Mid-neutral scale. |

The tables are explanatory. Use `packages/tokens/generated/tokens.css` or the `@bizarre/tokens` package for computed values; do not copy values from this document into implementations.

### Rules

1. **Signal Lime is never used on white/paper surfaces as body text or functional UI.** It fails contrast. Use Lime Ink (`--bzr-lime-ink`) for that role.
2. **Lime is the hero, not the carrier.** In a page or poster, lime should be the rare accent that draws the eye, not the ground. The ground is void, gray, or paper. Exceptions: the primary mark's ground, dedicated lime-field posters, and signage meant to be seen at distance.
3. **No gradients on brand colors.** Brand colors are flat. Gradients are reserved for photographic/editorial use only, and never across lime-to-void (that specific gradient reads as trying too hard).
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
| **Big Shoulders Stencil Display** | Industrial, wordmark, livery, panels | 700, 800, 900 | Industrial stencil DNA. Reads as "the workshop." The wordmark font. |
| **Hanken Grotesk** | Body, UI, reading | 300, 400, 500, 700 | Precise modern grotesque, highly readable at small sizes, neutral enough to carry long text. |
| **JetBrains Mono** | Code, technical, dev artifacts, eyebrow labels | 400, 500, 700 | For code, terminals, technical documentation, and the uppercase eyebrow labels that sit above headings. |

All four are governed local assets in `@bizarre/assets`; web surfaces load the generated local font stylesheet. License and provenance records are included in the asset package.

### Minimum viable subset

If you only have two fonts: **Big Shoulders Stencil Display** (headings, display, wordmark) + **Hanken Grotesk** (everything else). This covers roughly 90% of surfaces.

If you only have one font: **Hanken Grotesk** at multiple weights. Acceptable for internal documents and emergency fallback.

### Type hierarchy (web / screen)

```
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

1. **Never mix Unbounded and Big Shoulders Stencil in the same heading.** They fight. Pick one per block.
2. **The slogan is always Unbounded.** No exceptions.
3. **The wordmark is always Big Shoulders Stencil.** No exceptions.
4. **Eyebrows always monospace, always uppercase, always wide-tracked.** This is the signature "eyebrow" detail and it reads as Bizarre on sight.
5. **Body text is never justified.** Always left-aligned (or right-aligned for RTL).

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
```
CATALOG / 014 / APR 2026
The workshop under the stars
```

### Rules

1. No rounded corners beyond 4px. Bizarre is geometric.
2. No drop shadows beyond the tokens' minimal set. Flat is the default.
3. No centered body text. Centering is reserved for display/manifesto type only.
4. No gradients as backgrounds (see color rules).
5. Borders and dividers use `--line-1` (1px) or `--line-3` (3px). Between those, pick 1 or 3, never 2.

---

## 7. Applications

### Priority order (build in this sequence)

1. **Web presence:** landing page at bizarre.industries + repo READMEs
2. **Physical stickers and patches:** 2" circle sticker, 3" woven patch, 8.5"x11" poster
3. **Dev artifacts:** terminal color scheme, shell prompt, vim theme
4. **Apparel:** plain black tee with lime mark, plain lime tee with void mark
5. **Livery elements:** vinyl decal pack for racing/shop application

### Web

- Default to dark mode (`--bzr-void` ground, `--bzr-paper` type).
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
- 3" woven patch: simplified mark in lime stitching on void twill backing. Merrowed edge in lime.
- 8.5"x11" poster: Mode B layout, manifesto or single-line slogan, Signal Lime ground or Void ground.

### Terminal theme

ANSI palette mapping (for iTerm2, kitty, WezTerm, Windows Terminal, etc.):

```
Foreground:   #F9F8F2   (paper)
Background:   #0E0E0E   (void)
Cursor:       #C6FF24   (lime)
Selection bg: #2B2B2B   (void-3)

ANSI colors:
  0  black         #0E0E0E
  1  red           #F0525B
  2  green         #C6FF24   (the signature — brand lime as green)
  3  yellow        #E8A33D
  4  blue          #5B9FFF
  5  magenta       #E8FF8A   (lime glow as magenta substitute)
  6  cyan          #7DD3FC
  7  white         #E4E4E4

Bright ANSI: same palette, lifted ~15% luminance
```

Shell prompt:

```
bzr ✦ ~/project (branch) ✦
```

Use `✦` (U+2726 black four-pointed star) as the prompt separator. Star, because obviously.

---

## 8. Sub-brands

### Structure

- **BIZARRE INDUSTRIES** is the top-level movement / foundation entity.
- **BIZARRE LABS** is the commercial arm.
- **BIZARRE FOUNDATION** is the governing nonprofit entity (Dutch stichting).
- **HELLING** is a first-class product under Labs, with its own mark (TBD) and subordinate wordmark relationship to BIZARRE.

### Visual rule

Sub-brand wordmarks use the same Big Shoulders Stencil treatment as the parent wordmark, at 60-70% of the parent size when paired, or at full size when standalone. Sub-brand wordmarks use the parent mark (the spiral) unchanged. Sub-brands do not get their own marks unless they are first-class products (HELLING gets its own mark because it is a product, not a sub-unit).

### Naming rule

Sub-brands under BIZARRE use a single word after the parent name. "Bizarre Labs", "Bizarre Foundation", "Bizarre Industries". Never two-word or hyphenated names ("Bizarre Applied Research Division" is not on the table).

Products and projects under the brand can be any name, but lean toward short, one-or-two syllable, evocative nouns. Helling is the pattern.

---

## 9. The "no" list

What Bizarre is not, and will never be.

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

### Status: flagged, not solved

Bizarre's founder thinks in Arabic and English. The Middle East is a plausible and welcome audience. The identity needs an Arabic treatment plan before it goes fully public in that region.

### What works already

- The mark is direction-neutral. It works LTR, RTL, and rotated.
- Signal Lime and Void Gray carry across cultures without specific connotations that block the brand.
- CATCH THE STARS translates well: **امسك النجوم** carries the same "catch the plural stars" meaning without cultural tax.

### What needs work

- The wordmark (Big Shoulders Stencil) has no Arabic equivalent in that family. A paired Arabic display type needs to be chosen. Candidates worth evaluating: **29LT Zarid Sans**, **Naskh-TTS**, **Rubik Arabic** (for compatibility with existing web stack), or a custom stencil-adjacent Arabic face. Decide with an Arabic type specialist, not a guess.
- The manifesto needs translation, not transliteration. The voice has to land, not just the words.
- The slogan lockup in Arabic is right-to-left, which is fine. It stands alone anyway, so the directionality doesn't affect lockups.

### Rule

Do not ship Arabic brand surfaces before the type pairing is resolved. Interim Arabic text uses system Arabic (e.g., iOS SF Arabic, or Noto Sans Arabic) and is marked as provisional.

---

## 11. What's next

The following artifacts extend this book and should be produced in sequence:

1. **Logo SVG set** — primary, inverse, mono variants, simplified small-size, wordmark, monogram, lockups. All as clean SVG, not raster.
2. **Poster templates** — Mode A and Mode B reference layouts as figma/illustrator files.
3. **README template** — markdown file with embedded SVG mark.
4. **Terminal theme files** — iTerm2 `.itermcolors`, kitty `.conf`, vim colorscheme, WezTerm lua.
5. **Sticker / patch production spec** — die lines, color matching, vendor notes.
6. **Web starter** — minimal landing page + tokens hooked into a real CSS/HTML scaffold, deployable to bizarre.industries.
7. **Arabic pairing decision** — type pairing chosen, manifesto translated, slogan lockup approved.

---

CATCH THE STARS
