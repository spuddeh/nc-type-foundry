# NC Type Foundry

Custom display typefaces for the Night Corp universe ([nczoning.net](https://nczoning.net) and the NC Zoning Academy), built by measuring brand marks and reconstructing them as rule-driven geometry. First face: **Night Corp Display**. The method is a reusable scaffold for further game fonts.

Consumers only need `dist/`: the compiled font files, the test page, and the pure-geometry logo assets. Everything else is the foundry.

**Proof sheet:** open `proof.html` for the full family, trace-overlay verification, and typeset specimens. **Try the font:** open `dist/font-test.html`.

## Package

| Path | What it is | Status |
| --- | --- | --- |
| `tools/glyph-data.cjs` | Geometry tables: every glyph, advance cells, monogram, logo placement. **The single editable source.** | source |
| `source/nightcorp_logo_v2.svg` | The original bmp-traced logo, the canonical reference | immutable |
| `svg-original-trace/` | Pre-remaster bmp-trace glyphs, preserved as reference | immutable |
| `tools/generate_glyphs.cjs` | Renders `svg/` and the logo assets in `dist/` | tool |
| `tools/assemble_proof.cjs` | Builds `proof.html`; optional second output path argument | tool |
| `tools/build_font.cjs` | Compiles the font into `dist/`; flattens overlaps in painter's order | tool |
| `svg/` | One SVG per glyph: A..Z, 0..9, 41 named marks | generated |
| `dist/NightCorpDisplay-Regular.otf` / `.woff2` | The font, 79 glyphs; lowercase codepoints map to the capitals | generated |
| `dist/nightcorp_logo_v3.svg`, `dist/nightcorp_monogram.svg` | Pure-geometry logo (1546×1000) and monogram favicon source (1546×835) | generated |
| `proof.html` | The living proof sheet | generated |

The favicon Z canonical reference lives in the map repo (`nc-zoning-board/assets/img/favicon/favicon-map-cyan.svg`).

Rebuild everything:

```bash
cd tools
npm install          # once: opentype.js, wawoff2, polygon-clipping
node generate_glyphs.cjs && node assemble_proof.cjs && node build_font.cjs
```

Generated outputs are committed on purpose (they are the consumables); regenerate before committing any geometry change. Licence: not yet chosen.

## Canonical sources and provenance

The NIGHTCORP logo was bmp-traced (`source/nightcorp_logo_v2.svg`, never edited). On 2026-07-08 the wordmark and monogram were measured out of the trace (correcting for per-letter bbox normalisation and the R leg's ~3-unit baseline overshoot), the rules below were derived from those measurements, and the canonical glyphs were remastered as pure geometry, verified by overlaying rule-built rebuilds on the trace (see the proof sheet's "Remaster fit" section). Everything else was constructed to the rules. The full reasoning trail lives in the NC Zoning Board wiki (`decisions/nc-font-two-canonical-systems`, `learnings/svg-winding-normalisation-for-composed-glyphs`).

## Two systems, both canonical

| | Type (letters, digits, marks) | Monogram (N mark + slash bar) |
| --- | --- | --- |
| Strokes | verticals 26, horizontals 17 (3:2) | uniform 22.5 |
| Diagonals | 17 perpendicular | 45° exactly; N diagonal 37 horizontal cross-section |
| Corner cuts | 20 across × 14 down (≈35°) | 45° |

The favicon Z was designed to suit the monogram, the font Z suits the type system; never harmonise one toward the other.

## The type system

**Grid.** Cap height 100, baseline y=100. Bands: top bar y0..17, mid band y40..57 (crossbars, spurs, bowl bottoms), bottom bar y83..100. Advance cells: wide letters 136..149, open-horizontal letters (C, E, F, J, L, S, T) 134, I 26, digits tabular 110, marks per `CELLS` in the geometry tables. Side bearing 9 per side (letter gap 18); word space 60 visual (space advance 42 plus neighbouring bearings).

**Stroke.** Stems 26, bars 17, no tapering. Diagonals carry bar weight: 17 perpendicular, flat cuts at cap or baseline, never points. Reduced weights only for enclosed or dense marks: corp rings 13, degree ring 9, percent rings 13, hash verticals 17.

**Corners: chamfer bends, not terminals or junctions.** A convex 90° bend on the silhouette gets the 20×14 cut; stroke ends and T/cross junctions stay square; obtuse bends are untouched. Canonical quirks, preserved but never generalised: N chamfers only its top-right (monogram echo); R keeps a square top-left where P chamfers; Z chamfers its two bar-end terminals (the brand's top-left / bottom-right pair).

**Joinery laws** (each learnt from a real defect; enforced or checked in the tools):

1. Winding: solids one orientation, counters reversed, `fill-rule="nonzero"` explicit; normalised programmatically. Mixed winding cancels overlaps to transparent holes.
2. Constant-width turns: the inner edge turns before the outer; for the 27° family diagonal the stagger is (width difference)/1.953. A mitred turn reads as a blob (the 2's neck is the reference).
3. Flush joins: a diagonal meeting a vertical shares the vertical's footprint edge exactly, or it leaves a ledge.
4. Clip end cuts: a diagonal arm's flat end must not extend sideways past the stroke it joins (the Y's arms are clipped to pentagons).
5. Land strokes at element ends, never mid-bar.
6. Cell containment, y0..100. Registered exceptions only: comma and semicolon tails to y112, the dollar stem y−10..110, Q's tail.
7. Octagon rings (the circle substitute): moving a 45° edge inward by one stroke means offsetting stroke×√2 along the axes; ring counters are chamfered accordingly (the one permitted non-rectangular counter).
8. Font compile flattens overlaps in painter's order (union solids, subtract counters as they appear in the data); rasterisers and game-engine triangulators are stricter than SVG's nonzero rule, and a global subtract would erase anything drawn inside a counter (the corp-mark letters).

**Letterform DNA.** Rectilinear first: the canonical N refuses its diagonal, M and W are bridge forms. Return bars may stop short (G spur, P bowl, J hook, E and F mid bars). Counters rectangular except the ring law above. Distinguishers: O chamfers all four corners, D only its right two, Q adds the tail, 0 is the narrowed O cutting only the Z pair; I is the slant-top stem, 1 adds the tabular foot; 2 keeps its wall and neck where Z runs corner to corner.

## The method (the scaffold for the next game font)

1. **Pin the canonical source** (brand marks). Immutable; everything derives from it.
2. **Measure, never eyeball.** Parse the source programmatically; correct trace artefacts (bbox normalisation, overshoots) before reading numbers. Extract stroke widths by direction, corner cuts, band positions, widths, gaps.
3. **Write rules from measurements.** Expect surprises (the prior assumption of uniform 20 strokes and 45° chamfers was wrong on both counts). Separate laws from quirks, and watch for multiple systems in one brand; the favicon Z only made sense once the monogram was recognised as its own system.
4. **Verify by round trip**: rebuild the canonical glyphs purely from the written rules and overlay on the trace. Only then remaster.
5. **Extend by construction, not drawing.** Geometry lives in data tables; SVGs, fonts and proofs are generated. Derived marks scale the real letters (`scaledGlyph`); hand-copied minis drift (the ® once lost its counter that way).
6. **Proof visually at every step**, display and small sizes, overlaying each new glyph on its nearest sibling (0 over O, 5 over S).
7. **Package**: flatten overlaps, compile OTF and WOFF2, and test as an installed font, not as SVG renders.

Steps 2 to 4 are the part most skipped and the part that made this family work.

## Construction catalogue

**Digits** (lining, tabular 110): 0 = narrowed O cutting only the Z pair. 1 = I stem plus full-width foot. 2 = right wall into a corner-landing diagonal via the constant-width turn. 3 = mirrored E. 4 = rectilinear (right stem, mid bar, G-spur arm). 5 = the S construction. 6/9 = C spine with the ring low / ring high with a baseline spine. 7 = Z without the bottom bar. 8 = B without the stem, waist nick included.

**Marks.** Dots are 20×17 blocks; the comma family and the dollar stem are the only strokes outside the cap band (see exceptions). Slashes, 7 and Z share the flush corner-to-corner diagonal. Parens chamfer, brackets stay square, braces add the mid-band spur. The euro is a C-frame with two square-junction crossbars; the dollar is the S with the full overshooting stem (the interrupted version read too dense). Tilde: chevron-class single polygon, two 17-unit arms across the mid zone joined by the family diagonal. Corp marks: © and ℗ are full-size octagon rings holding 0.42-scale family C and P; ® is the same ensemble at 0.58 floating at the cap line (typographic convention); ™ is scaled T and M, superscript.

## Usage tiers on the Night Corp sites

Night Corp Display slots in ABOVE Orbitron; it does not replace it.

- **Tier 0, this face:** wordmarks, station IDs, splash heroes, section dividers, big drawn-digit moments (eddies balance, level stamps). Under ~20 characters, all caps, 40 px and up; never below ~28 px, never a full sentence.
- **Tier 1, Orbitron:** screen titles, card headers, stat labels, nav (true lowercase, solves small sizes).
- **Tier 2, Rajdhani** (body/data) and **Tier 3, Fira Code** (mono): unchanged. The `[ ACCESS TERMINAL ]` brackets arguably stay Fira Code; label colons stay Tier 1; `&` exists but its known uses stay body text.

## Font metrics (compiled)

unitsPerEm 1000, cap height 700 (design ×7), ascender 790, descender −130. Family "Night Corp Display", style Regular. No kerning table yet: diagonal-sided glyphs (V, W, X, Y, K, 7) will want pairs against T, L, A and the period family once real text settings exist; log pairs as they annoy, do not pre-kern.

## Production checklist (every new glyph)

1. Geometry into `tools/glyph-data.cjs` only, left edge x0, cell registered in `CELLS`.
2. Obey the joinery laws and cell exceptions above.
3. Overlay against the nearest sibling; check the specimen strings (`NC ZONING BOARD`, `NIGHT CITY ACADEMY 2077`, `0123456789`, `LEVEL 3-B, NO. 7?`, `360° ÷ 8 = 45°`, the pangram).
4. Regenerate all three outputs and eyeball the proof and the font test page.

## Proof palette (not part of the type)

Glyph fill #eaf2ff on #0a0e14; Academy accent gold #ffb300, Map accent cyan #00f0ff.
