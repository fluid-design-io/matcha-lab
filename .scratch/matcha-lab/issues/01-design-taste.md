# Design taste contract

Type: task
Status: resolved
Blocked by: —

## Answer

`DESIGN-TASTE.md` at the repo root, split three ways:

- **[`DESIGN-TASTE.md`](../../../DESIGN-TASTE.md)** — the spine. Part 1 in full (colour, type,
  space, motion, icons, components, voice) plus a summary of Part 2.
- **[`docs/design/layout-geometry.md`](../../../docs/design/layout-geometry.md)** — every
  measurement, viewport by viewport. Split out because it is tabular reference material nobody
  reads end to end.
- **[`docs/design/image-generation.md`](../../../docs/design/image-generation.md)** — Part 2 in
  full, plus `scripts/generate-render.sh`, which encodes the prompt skeleton, the nine vessels,
  the verification thresholds and the post-processing as one runnable command.

Grounded in the four reference mockups, which were found in `~/Downloads` and preserved as
`.scratch/matcha-lab/assets/ref-{1-portrait,2-base-sheet,3-recipe,4-landscape}.png`. Every colour
and type size in Part 1 was measured off those files rather than eyeballed.

Decisions that were not in the brief and are now settled:

- **Accent is `#A8C4D6`**, and it marks selection and state only — never decoration.
- **The scrim behind the recipe overlay is a darkened field, not a black wash.** Measured
  `#4D5B3E`; a neutral black scrim kills the green and the whole world with it.
- **The neutral grotesque is Archivo.** Its moderate x-height sits correctly against kanji where
  Inter's tall x-height fights them, its caps hold at 9px with 0.3em tracking, and it has real
  tabular figures for the quantity column. Both faces are self-hosted and subset — a home-screen
  app cannot depend on a Google Fonts round trip at launch.
- **Four icons, not five:** `Heart`, `HeartFill`, `Xmark`, `Picture`. `ArrowRight` is ruled out
  because `RECIPE →` sets the arrow typographically inside a letterspaced run; `Flask`/`Cup`/`Mug`
  because the render already draws the true vessel; `Snowflake`/`Flame` because serve temperature
  sets as a word. Box sizes are 12/16/20 only — the family is a 16px grid and other sizes go soft.
- **Aspect-ratio breakpoints are `@custom-variant`, not `--breakpoint-*`.** Tailwind v4's
  `--breakpoint-*` namespace can only generate width queries; the compound `min-width` **and**
  `min-height` guard the brief requires needs a custom variant.

Motion tokens are stubbed and marked `CALIBRATION PENDING` — they are ticket 09's to fill.

## Question

Author `DESIGN-TASTE.md` at the repo root — the file future agents read to share this project's feel. Two parts, in this order, plus separate reference files wherever a part gets long enough to deserve its own page (your call on the split).

**Part 1 — the code-facing design system.** What any agent touching UI must obey:

- Colour tokens. The `#7B8F63` field, rice-paper surfaces, green-black ink, and the pale blue accent visible in the reference mockups (rail underline, tasting-axis markers, the ♥ SAVED mark). Name them semantically, not by hue.
- Type scale. Noto Sans JP leads and carries kanji and Japanese labels; a neutral grotesque carries romanization and English at *much* smaller sizes, letterspaced. Pin the actual sizes, weights and tracking for: giant watermark kanji, drink title, rail kanji, romaji, micro-labels (`MATCHA COCONUT LAB`, `RECIPE →`, axis names), and numerals.
- Spacing and layout rules. The single-viewport constraint, safe-area handling, the centred square render frame, edge margins at each target viewport.
- Motion timings. Durations, springs, and stagger offsets, expressed as tokens. The standing rule is *extremely subtle* — noticeable only under attention.
- Component rules: what the rail, the render frame, the title block, and overlays may and may not do.
- **Icons.** `@gravity-ui/icons` is the only icon family — deep-imported per icon (`@gravity-ui/icons/Heart`) so it tree-shakes. Pin the sizes, stroke treatment and optical alignment against the micro-label type, since icons here sit next to 10px letterspaced text and will look wrong at their default weight. Verified available: `Heart`, `HeartFill`, `Xmark`, `ArrowRight`, `Picture`, plus `Flask`, `Cup`, `Mug`, `Snowflake`, `Flame`. Rule the rest out explicitly — a nine-drink app needs about five icons, and the list should say so.

**Part 2 — the image generation contract.** The reason this file exists. Nine images must read as one family, and this is the part that silently drifts:

- The literal reusable prompt skeleton, with the variable slot marked.
- Fixed camera angle, crop, subject scale within frame, and lighting direction.
- The palette clamp (flat `#7B8F63` ground, off-white line, drink colour as the only variable).
- Line weight and rendering style — see the verified reference at `.scratch/matcha-lab/assets/imgen-reference.png`, which is the target.
- The vessel rule: each drink gets its *true* vessel, everything else locked.
- The verification requirement: colour-count check to catch code-drawn fakes.

Consult the `frontend-design` skill. Ground Part 1 in the four reference mockups. Part 2 must be concrete enough that a fresh agent can produce image number ten a month from now and have it match.
