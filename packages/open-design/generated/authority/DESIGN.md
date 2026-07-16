# Bizarre Industries - Signal Infrastructure & Astronomical Atlas

> Category: Bold & Expressive
> A bilingual, instrument-led design system where gravitational data, tactile materials, film-like color, and a fixed Signal Lime channel turn the Bizarre Industries identity into recognizable infrastructure.

This file extends the canonical Bizarre Industries identity without replacing it. The approved Gravity Well mark, Signal Lime (`#C6FF24`), the exact slogan `CATCH THE STARS`, the official typography roles, and the two canonical layout modes remain authoritative. The Astronomical Atlas is a governed expression layer applied through those foundations.

Owner override, 2026-07-15: every older Calibrated Aperture/chamfer instruction is superseded by the selected left **Continuous Lens Aperture v2** direction. Its opening is a smooth tangent-continuous asymmetric oval with no corner, outline chamfer, wedge, notch, key cut, polygonal join, or straight segment. A physical bevel may exist only as a separate smooth material layer outside the unchanged opening.

The Swiss influence is methodological rather than cosmetic: make function distinctive enough to become identity; build recognition through standardization and repetition; let close inspection reveal additional information; treat security, material, and manufacturing behavior as part of the design rather than decoration.

## 1. Visual Theme & Atmosphere

### Core thesis

Bizarre exists at the intersection of science, engineering, making, motorsport, nature, and cosmic ambition. The system should feel as credible on a pit-wall instrument, machined camera body, circuit board label, reflective race livery, technical manual, or bilingual interface as it does on a poster.

The visual identity is summarized by one hierarchy:

> **BEND -> ABSENCE -> SIGNAL**

- **Bend:** broad gravitational contours create the first recognizable silhouette.
- **Absence:** a fixed asymmetrical Continuous Lens Aperture interrupts the field.
- **Signal:** one invariant Signal Lime trajectory shows the active path.

### Experience at three distances

1. **Far:** Signal Lime, lensing bend, and the aperture silhouette survive at speed or across a room.
2. **Normal:** instrument indices, contour families, spectral fields, real metadata, and bilingual structure become readable.
3. **Close:** dots, hatching, microtext, grain, gloss/matte layers, foil, UV, reflective media, and alternate representations reward inspection.

### Design personality

- Engineered, but never sterile.
- Complex, but governed.
- Colorful, but not rainbow-branded.
- Tactile, not flat.
- Scientific, but not pseudo-scientific.
- Fast, but not generic automotive aggression.
- Cosmic, but not sci-fi wallpaper.
- Garage-accessible, not luxury-coded.

### Modes

The canonical layout modes remain:

- **Precision Panel:** dense, technical, data-led, instrument-like.
- **Display Field:** spacious, ceremonial, large-type, object- or atlas-led.

`Astronomical Atlas` is not a third layout mode. It is a representational layer that can operate within either mode. `Workshop Stamp` remains a physical application state rather than a competing page layout.

### Prior art and reference method

- Bizarre Industries canonical identity and token repository.
- Swiss railway clock: operational signal and synchronized behavior becoming national identity.
- Swiss passport: one place described through topography, micro-patterns, material reveals, security layers, and alternate representations.
- Precision cameras, racing instruments, technical labels, cartography, contact sheets, and physical media.

## 2. Color

### Permanent brand anchors

| Role | Token | Value | Rule |
|---|---|---:|---|
| Signal Lime | `--bzr-signal-lime` | `#C6FF24` | Invariant operational channel. Never color-graded. |
| Lime Ink | `--bzr-signal-lime-ink` | `#5E7A00` | Accessible functional lime on light surfaces. |
| Lime Glow | `--bzr-signal-lime-glow` | `#E8FF8A` | Hover, tint, and low-priority light response. |
| Void | `--bzr-void` | `#0E0E0E` | Primary dark chassis. |
| Paper | `--bzr-paper` | `#F9F8F2` | Warm light chassis. |
| Void Gray | `--bzr-void-gray` | `#545454` | Structural neutral. |

### Signal Lime semantics

Signal Lime is not an ambient palette color. It always means one of the following:

- active;
- selected;
- ready;
- captured;
- synchronized;
- aligned;
- live;
- the current path or reading.

Every major artifact needs one Lime anchor, but it does not need the logo. The anchor may be a tracer, pointer, index, switch, registration strip, reflective seam, cable, latch, or single active datum.

Signal Lime stays outside photographic grading and outside the spectral field. It may change only through a physically required translation: Lime Ink for accessible text on Paper, fluorescent spot ink, thread, enamel, retroreflective film, or illuminated material.

### Data-shaped photographic spectrum

The wider color system is a field/data palette, not a family of competing brand accents.

| Data role | Token | Value |
|---|---|---:|
| Deep field / colored shadow | `--bzr-spectrum-deep-indigo` | `#20274D` |
| High-energy blue | `--bzr-spectrum-electric-blue` | `#3156A6` |
| Ion / density cyan | `--bzr-spectrum-ion-cyan` | `#4AA5AF` |
| Oxidized transition | `--bzr-spectrum-oxidized-teal` | `#5C887C` |
| Solar highlight | `--bzr-spectrum-solar-gold` | `#D5A347` |
| Thermal amber | `--bzr-spectrum-amber` | `#C96C3E` |
| Redshift / warning field | `--bzr-spectrum-crimson` | `#B64C63` |
| Violet shadow | `--bzr-spectrum-violet-shadow` | `#684F83` |

**Rule:** data chooses where the colors go; Bizarre chooses how the colors feel.

The underlying quantity can be energy, curvature, density, temperature, velocity, redshift, probability, or another mapped field. The photographic response then adds warm highlights, colored shadows, restrained saturation, exposure rolloff, subtle grain, and limited halation.

### Gradient rules

Gradients are permitted when they describe a field, optical coating, data ramp, heat, exposure, or material response. They are not permitted as arbitrary decorative blobs.

- Never grade Signal Lime into another hue.
- Never use a rainbow to imply “technology.”
- Keep the brightest non-Lime color below Lime in salience.
- Use stepped bands for diagrams and liveries, continuous fields for screens and optical materials, and dots/hatching for simple production.
- Preserve the same source dataset across all representations.

### Accessible color use

- Normal text: minimum 4.5:1 contrast.
- Large text and meaningful UI graphics: minimum 3:1.
- Signal Lime on Paper is not body text; use Lime Ink.
- Spectrum colors are decorative or data-encoded unless a tested foreground/background pair is defined.
- Never rely on hue alone; pair with labels, shape, pattern, or position.

```css
:root {
  --bzr-signal-lime: #C6FF24;
  --bzr-signal-lime-ink: #5E7A00;
  --bzr-void: #0E0E0E;
  --bzr-paper: #F9F8F2;
  --bzr-spectrum-field: linear-gradient(90deg, #20274D, #3156A6, #4AA5AF, #5C887C, #D5A347, #C96C3E, #B64C63);
}
```

## 3. Typography

### Official Latin stack

- **Display:** Unbounded - ceremony, scale, the slogan, rare hero moments.
- **Stencil:** Big Shoulders Stencil - livery, industrial headings, equipment, future wordmark exploration.
- **Body:** Hanken Grotesk - reading, UI, labels, documentation.
- **Mono:** JetBrains Mono - code, coordinates, timing, versioning, measurements, real metadata.

### Arabic implementation stack

Until a custom Arabic display pairing is commissioned, use:

- **Arabic display/body:** Noto Sans Arabic, weights 400-900.
- **Arabic compact UI:** Noto Sans Arabic UI.
- **Technical numerals:** tabular Latin numerals in shared instruments unless the artifact is explicitly Arabic-native and tested with Arabic-Indic numerals.

Do not imitate Big Shoulders Stencil by cutting arbitrary gaps into Arabic letters. Arabic identity comes from weight, rhythm, spacing, directional composition, and equal authority - not faux stencil damage.

### Type hierarchy

| Role | Latin | Arabic | Typical size |
|---|---|---|---|
| Hero display | Unbounded 900 | Noto Sans Arabic 900 | `clamp(4.5rem, 12vw, 12rem)` |
| Display heading | Unbounded 700 | Noto Sans Arabic 800 | `clamp(2.5rem, 5vw, 5rem)` |
| Industrial heading | Big Shoulders Stencil 800 | Noto Sans Arabic Condensed 800 | `2rem-4rem` |
| Body | Hanken Grotesk 400 | Noto Sans Arabic 400 | `16px-18px` |
| Technical label | JetBrains Mono 500 | Noto Sans Arabic UI 500 + tabular digits | `11px-14px` |
| Micro data | JetBrains Mono 400 | Noto Sans Arabic UI 400 | `9px-11px` |

### Equal bilingual composition

Arabic and English are equal in priority, but equality is optical rather than mechanical.

- Balance visual area within approximately 12%, not nominal point size.
- Either language may lead.
- Text direction changes layout; it does not simply mirror every object.
- The Gravity Well and Atlas field keep their approved physical orientation unless the function itself changes.
- Metadata rails may swap sides; the active Signal channel remains physically consistent.
- Use `lang` and `dir` attributes. Do not flip Arabic with CSS transforms.
- Translation must preserve voice, not only literal wording.

### Typographic rules

- One display family per block.
- The slogan is always Unbounded in Latin and a visually matched heavy Arabic treatment.
- Data labels must carry real information. No decorative fake coordinates.
- Use tabular numerals for timing, telemetry, coordinates, and serials.
- Body text is never justified.
- Centering is reserved for dials, ceremony, or manifesto-scale display.

Font labels for catalog extraction:

Display: "Unbounded", "Inter Display", "Arial Black", system-ui, sans-serif
Body: "Hanken Grotesk", Inter, "Helvetica Neue", system-ui, sans-serif
Mono: "JetBrains Mono", "DejaVu Sans Mono", Menlo, monospace

## 4. Spacing

### Base system

Use a 4px base. The canonical scale is:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192`

Spacing is not a proxy for minimalism. Dense and open regions may coexist, but their transitions must be deliberate.

### Optical-size system

| State | Typical size | Allowed detail |
|---|---:|---|
| Micro | `<15mm` or `<48px` | Aperture silhouette, one Lime index, no micro-contours. |
| Small | `15-30mm` or `48-96px` | 2-3 contour levels, aperture, one data line. |
| Medium | `30-100mm` or `96-320px` | Full contour family, dots or bands, basic reveal. |
| Large | `>100mm` or `>320px` | Full atlas, material layers, microtext, provenance. |
| Field | environmental scale | Cropped gravitational handwriting, no requirement to show the full mark. |

### Production minimums

- Fine print contour: `0.18mm` minimum.
- Vinyl contour: `1.5mm` minimum.
- Screen contour: `1px` minimum at 1x; use 2px for high-salience major lines.
- Aperture: `12mm` minimum print, `48px` minimum screen.
- Clear space around the full Gravity Well remains governed by the existing brand book.

### Corners, borders, and depth

- Corners: `0-4px` for core UI and equipment. Pills only for physical toggles or tightly scoped status chips.
- Borders: use 1px or 3px. Avoid default 2px framing.
- Shadows: flat by default. Use real material contrast, edge highlights, or optical separation before synthetic elevation.
- Do not add soft rounded cards to every section.

## 5. Layout & Composition

### Precision Panel

Use for dashboards, labels, calibration plates, documentation, telemetry, packaging, and engineering surfaces.

- Real grid and real metadata.
- Dense information blocks with clear reading order.
- Instrument labels align to a shared datum.
- Major lines and Signal Lime define state.
- Prefer grouped rows and light separators to nested cards.
- A panel may contain one Atlas window; the Atlas does not become background noise behind every datum.

### Display Field

Use for posters, campaign pages, opening/closing spreads, hero sections, vehicle graphics, and announcements.

- One dominant silhouette or object.
- Large type and controlled negative space.
- Atlas field may fill the surface, but the Lime trajectory remains singular.
- Close-range detail is optional; the composition must work from far away first.
- Film-like color and optical material may provide atmosphere.

### Astronomical Atlas layer

The Atlas can render as:

1. continuous spectral gradient;
2. stepped color bands;
3. contour lines;
4. shaded contour lines;
5. dot-density field;
6. hatching;
7. halftone/grain;
8. reflective/UV layer;
9. one-color translation.

All renderings must be generated from or aligned to one underlying field. Do not combine unrelated decorative patterns.

### Governed gravitational signature

Every field may differ, but the handwriting remains:

- one dominant off-centre mass;
- approved orientation family only;
- a repeatable compression curve;
- the fixed Continuous Lens Aperture;
- one occlusion region;
- a density response tied to the field;
- one Signal Lime trajectory;
- provenance metadata identifying real or synthetic source.

### Continuous Lens Aperture

The aperture is a permanent smooth asymmetric lens-like opening built from tangent-continuous curvature. It has no outline chamfer, sharp edge, corner, wedge, notch, key cut, polygonal join, or straight segment. Any physical bevel is a separate smooth material layer around the unchanged opening.

- Far: clean void.
- Near: alternate representation appears through it.
- Physical: may expose substrate, circuitry, metal, carbon, or translucent material.
- Signature editions: may add coordinates, Canopus, race/location data, or another hidden meaning.
- Never fill it like a generic badge.
- Never change its underlying geometry; use optical-size simplification only.

### Image direction

- Prefer real objects, mechanisms, landscapes, night tracks, desert, mountains, workshops, contact sheets, and material studies.
- Use film-like color response: warm highlights, deep colored shadows, restrained vibrancy, slight grain, controlled halation.
- Avoid generic stock-photo teamwork, synthetic sci-fi cities, and excessive neon.
- Surface construction should be visible: seams, fasteners, engraving, print edges, vinyl overlap, translucent layers, dust, fingerprints, and wear where appropriate.

## 6. Components

### Signal action

The primary action uses Signal Lime because something becomes active. The color is semantic, not decorative.

```css
.bzr-button[data-variant="signal"] {
  background: var(--bzr-signal-lime);
  color: var(--bzr-void);
  border: 1px solid var(--bzr-signal-lime);
  border-radius: 2px;
  min-height: 44px;
}
.bzr-button:focus-visible {
  outline: 3px solid var(--bzr-signal-lime);
  outline-offset: 3px;
}
```

### Status indicator

States are named by function:

- idle;
- ready;
- aligned;
- active;
- captured;
- released;
- fault.

Lime is used for ready/aligned/active/captured, while shape, text, and position preserve meaning for non-color users.

### Atlas panel

A bounded visualization of a field.

Required layers:

1. field representation;
2. Continuous Lens Aperture;
3. one active Signal trajectory when applicable;
4. provenance label;
5. scale or unit label when data is meaningful.

Do not add a second logo inside the panel unless the artifact is explicitly promotional.

### Calibration label

A low-tech, high-recognition component for equipment and physical media.

Required fields:

- `ATLAS / ID`;
- `SOURCE / REAL|SYNTHETIC`;
- `SEED` or catalogue reference;
- `STATE`;
- version/date;
- optional QR or serial;
- one Lime anchor.

It must survive one-color printing and label-maker constraints.

### Instrument dial

- Large black indices on a warm white face or inverse dark face.
- No decorative numerals when indices read faster.
- Lime pointer/tracer indicates the current reading.
- The capture pause or synchronization behavior is permitted only when functional.
- Tabular numerals for timing.

### Bilingual data panel

- Arabic and English receive equal hierarchy.
- Shared numerical data may occupy a neutral center rail.
- Directional labels align to their native edge.
- Field orientation remains physically stable by default.
- Do not create two separate mirrored products.

### Livery field

- Broad lensing bends provide high-speed recognition.
- The aperture must remain visible at the chosen viewing distance.
- One fluorescent/retroreflective Lime slingshot is the active signature.
- Spectrum colors are lower salience and may use matte, translucent, or angle-dependent material.
- The name and full mark are optional; the handwriting should carry recognition.

### Physical media and hardware

- Use actual production logic: anodized or powder-coated metal, carbon, ceramic, translucent polycarbonate, vinyl, enamel, foil, embossing, debossing, screen print, labels, fasteners, and seams.
- Show how the object is assembled.
- A $12 sticker and a precision instrument should belong to the same system.

## 7. Motion & Interaction

### Capture sequence

The signature motion is not a generic spin. It is a state transition:

1. **Approach:** the tracer moves through a stable field.
2. **Compress:** intervals tighten near the mass.
3. **Eclipse:** the tracer disappears through the aperture.
4. **Lock:** the system changes state and confirms capture.
5. **Release:** the tracer reappears at a new synchronized origin or path.

Default ceremonial duration: `1200ms`. Fast UI adaptations may use `300-600ms`. Large physical/digital installations may use `2400ms`.

### Motion semantics

- Motion must indicate state, data, or physical force.
- The field may distort; the Gravity Well mark does not rotate.
- Continuous decorative orbiting is discouraged.
- Lime remains the active path.
- Use stepped band or dot changes for low-power and reduced-motion states.

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- remove travel animations;
- show the final captured state;
- preserve the aperture, active Lime indicator, and status text;
- do not globally disable every transition with `*`.

```css
@media (prefers-reduced-motion: reduce) {
  .bzr-capture-tracer { animation: none; transition: none; }
}
```

### Interaction detail

- Hover may reveal one additional representation or material response.
- Focus states use a clear Lime ring and are never hidden behind optical effects.
- Press states should feel mechanical: short travel, state change, and fast recovery.
- Do not use gratuitous parallax on data-heavy surfaces.

## 8. Voice & Brand

### Permanent voice

Casual, direct, dry, respectful of the reader. Second person is primary. Short sentences. Then a longer one when it earns the breath.

The brand speaks to people already doing the work. It does not beg, preach, or explain creativity to them.

### Signature copy

- `CATCH THE STARS`
- Arabic standalone treatment: `امسك النجوم`
- `BEND -> ABSENCE -> SIGNAL`
- `The world changes color. The signal does not.`
- `Data chooses where the colors go. Bizarre chooses how those colors feel.`
- `Calibrated. Touched. Used.`

### Metadata voice

Technical labels must be real and terse:

```text
ATLAS / G-042
MODEL / MULTI-MASS FIELD
SOURCE / SYNTHETIC
SEED / 241107
TRACE / ACTIVE
```

Real-data editions should record source, coordinates, catalogue identifier, observation date/epoch, and units where relevant.

### Forbidden voice

- generic “future of” claims;
- fake mission statements;
- pseudo-scientific claims;
- made-up coordinates presented as real;
- “disrupt,” “synergy,” “ecosystem,” “unlock,” “empower,” or “elevate”;
- excessive exclamation marks;
- cosplay military or macho racing language.

### Identity and product integration

- Bizarre Industries is the only identity.
- The system has no subbrands, child brands, derivative Bizarre identities, or product-specific Bizarre identities.
- Products preserve their host framework, existing component system, platform conventions, native behavior, and accessibility semantics.
- Signal Infrastructure is a restrained recognition layer. It integrates into the host product and does not replace the host product.
- Framework convention wins whenever a Bizarre treatment would make the product feel less native, less accessible, or less familiar.

## 9. Anti-patterns

- Do not recolor, rotate, mirror, crop, or redraw the approved Gravity Well mark.
- Do not apply gradients, glow, bevel, or foil directly to the approved mark.
- Do not use Signal Lime as ordinary decoration or grade it into the spectrum.
- Do not create a permanent rainbow brand palette.
- Do not use arbitrary aurora gradients or blurred blobs.
- Do not use generic concentric circles as “space.”
- Do not create unrelated contour, dot, and hatch layers; all must map the same field.
- Do not change the Continuous Lens Aperture shape by application.
- Do not use more than one active Lime trajectory in a single focal field.
- Do not fill the aperture like a badge or place text across its silhouette.
- Do not use fake metadata, fake scientific units, or unlabeled synthetic data.
- Do not make every screen dark; Paper and Bone modes remain first-class.
- Do not make every section a card or every control a pill.
- Do not hide focus states behind texture or reflection.
- Do not mirror the entire interface for Arabic; adapt direction while preserving physical truth.
- Do not turn Arabic into decorative calligraphy or faux stencil fragments.
- Do not use tactile effects as luxury ornament; they must reveal process, function, or another representation.
- Do not present flat childlike vehicle drawings as livery proof when a real vehicle surface is the requirement.
- Do not claim that a generated field is observed astronomy unless it has recorded provenance.
- Do not use the full-resolution mark below its approved minimum size.

---

## Extended System: Astronomical Atlas

### One field, many representations

A source field may be real astronomical data or a physically plausible synthetic model. The same source can produce gradients, bands, contours, dots, hatching, grain, reflective layers, UV layers, or one-color translations.

Every exported field must retain:

- source type;
- seed or catalogue identifier;
- approved orientation;
- aperture geometry version;
- active trajectory state;
- representation mode;
- production profile.

### Provenance examples

```text
ATLAS / CANOPUS-01
SOURCE / ALPHA CARINAE
MODE / OBSERVED
EPOCH / J2000
TRACE / NAVIGATION
```

```text
ATLAS / G-042
SOURCE / SYNTHETIC
MODEL / MULTI-MASS FIELD
SEED / 241107
TRACE / CAPTURE
```

### Material depth hierarchy

1. **Field:** primary visible dataset.
2. **Alternate representation:** the same data rendered differently through the aperture.
3. **Material:** physical construction is revealed.
4. **Meaning:** coordinates, memory, race, place, Canopus, or another private layer.

### Files in this package

- `DESIGN.md` - agent-facing brand contract.
- `tokens.css` - compiled CSS custom properties and component primitives.
- `tokens/*.tokens.json` - Atlas, material, motion, and bilingual source tokens.
- `components.html` - standalone component fixture.
- `preview/index.html` - interactive design-system preview.
- `guidelines/bizarre-astronomical-atlas-guidelines.pdf` - full visual manual.
- `assets/atlas/*.svg` - reproducible Atlas assets.
- `assets/mockups/*.png` - visual proof applications.
- `MIGRATION.md` - integration plan for the canonical repository.

### Release checklist

- [ ] Gravity Well asset is approved and unmodified.
- [ ] Signal Lime remains the invariant highest-salience operational cue.
- [ ] Spectrum colors are mapped from data or a documented synthetic field.
- [ ] The Continuous Lens Aperture matches the governed geometry.
- [ ] Recognition works in monochrome at far distance.
- [ ] Lime trajectory is singular.
- [ ] Metadata is real or explicitly labeled synthetic.
- [ ] Arabic and English are optically equal.
- [ ] Focus, contrast, and reduced-motion states are verified.
- [ ] Fine lines meet the production profile minimum.
- [ ] Material effects reveal function or representation rather than decoration.
- [ ] Mockups use credible physical objects and production logic.
