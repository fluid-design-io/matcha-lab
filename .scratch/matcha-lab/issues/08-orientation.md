# Orientation adaptation

Type: task
Status: resolved
Blocked by: 07

## Answer

Portrait was already the *base* layout — ticket 07 wrote the grid as
`auto 1fr auto auto` with `land:` overriding it, which is the right shape. What was missing was
that nothing gave the portrait rail a **cross-axis size**. The nav was `h-full` inside an `auto`
grid row and every child inside a slot is absolutely positioned, so the slots measured zero: at
1024×1366 the rail collapsed to a 28px strip with all nine glyphs stacked at the top of it. That
is the whole reason portrait looked wrong, and it is not visible from reading the classes.

Two tokens now carry it, alongside the existing `--rail-item`:

| Token | compact | `land` | `port` | roomy `land` | roomy `port` |
| --- | --- | --- | --- | --- | --- |
| `--rail-item` (pitch) | `min(52px, 100svw/9)` | `60px` | **`80px`** | `73px` | `108px` |
| `--rail-band` (rule → baseline) | `68px` | — | `77px` | — | **`87px`** |
| `--rail-row` (the glyph's box) | `var(--tap)` | — | `var(--tap)` | — | **`48px`** |
| `--tap` (minimum target) | `44px` | `44px` | `44px` | `44px` | `44px` |

`--rail-band` is the nav's height. That replaces the old `pt-7`, which could not be expressed as a
utility: `roomy:` is registered after `land:` in `styles.css`, so a `roomy:pt-[38px]` would have
beaten `land:pt-0` in roomy landscape. Every layout number in this file already lives on `:root`
behind a media query for exactly that reason; these now do too.

`--tap` is new and global — the 44px minimum was being spelled three different ways in three files
(`--rail-row: 44px`, `size-11`, `-my-4 … py-4`). It is deliberately not responsive.

### The band is the hit target; `--rail-row` is only where the ink sits

`--rail-row` used to be the slot **button's** height, bottom-aligned in a taller `--rail-band`.
That left the top of the visible ruled band dead to a finger: at 1024×1366 the nav occupied
`y 1233–1320` but the buttons only `y 1272–1320`, so a tap at `y 1250` — directly above the glyph
and plainly inside the band — hit nothing. 38px dead at the master, 33px at 768×1024, 23px on a
phone.

The button now stretches to the whole band (the nav dropped `items-end`, so the flex default
stretches it), and an absolutely-positioned `--rail-row` box pinned to the band's bottom edge
carries the glyph, the romaji and the shared underline. **Every measured position is unchanged** —
the box is exactly where the button used to be — but the target grows from 108×48 to 108×86 in the
portrait master, 80×44 → 80×76 at 768×1024, and 52×44 → 52×67 on a phone.

One visible consequence: the global `:focus-visible` outline now traces the real target, so in
portrait the keyboard focus ring is band-height and its top edge lands ~3px above the rule. It is
honest about what is tappable; if it reads as crowding the rule it should move to the inner box.

### The `--rail-item` disagreement, resolved down

Three numbers were in play and no two agreed:

- the token table in `layout-geometry.md` says `port: 92px`
- `styles.css` said `88px`
- the derived table two sections below says `88` at 834×1194 and `80` at 768×1024

**Went with 80.** One value has to serve both non-roomy portrait targets, and 768×1024 is the
binding one: nine slots of 88 come to 792px against a 768px viewport, so the outer glyphs would be
clipped by the screen. Nine of 80 come to 720 and clear it with 24px a side. 92 fits nothing and
appears to be a stale figure — it is not derivable from either master. The roomy `108px` is
untouched, because that one *is* measured off `ref-1-portrait.png`.

### The roomy-portrait branch was clipping itself

`--rail-item: 108px` was guarded on `(width >= 960px) and (height >= 1280px)`, borrowed from the
`roomy` variant. But `roomy` is a *density* axis and 960 is its portrait floor, so a 960×1280
viewport got nine 108px slots — 972px of rail inside 960px of screen. The row overflowed 6px past
each end slot, the outermost glyph centre landed at `x=48` inside the 56px margin, and
`scrollWidth > clientWidth` meant the roving-tabindex `.focus()` in `rail.tsx` would have scrolled
the shell sideways with no way back.

**The branch is now guarded at `width >= 1024px`**, which is the portrait master's own width and
the smallest viewport nine 108px slots fit. Between 960 and 1023 wide, portrait keeps `port`'s
80px pitch (720px, comfortable) while still getting roomy's type scale and 56px edge — which is
correct, because density and rail pitch are separate axes. Clamping the pitch with a `min()` was
the alternative and was rejected: it would have made the master's measured 108 a coincidence.

### The rail bleeds; the ink does not

Nine slots at the measured pitch are **wider than the content column** — 972px against 912px at
the master, and 720 against 680 at 768×1024. That is not a mistake in the pitch, it is what the
reference shows: the outermost glyph centre is at x=80 while the content margin is at 56, so the
*ink* sits comfortably inside the margin and only the invisible slot boxes reach past it. The
centred row overflows symmetrically into the shell's edge padding, which stays visible because
`overflow: hidden` clips at the padding box, not the content box. The rule above the rail is on
the `nav`, so it keeps the content width while its children spill.

The side effect is a bonus rather than a cost: the two end slots reach further towards the bezel,
which is where a thumb actually lands.

### Portrait, computed against ref-1

The in-app browser pane cannot be used (it reports `document.hidden` and delivers no frames), so
these are **computed from the token stack**, not read off a rendered page. Every number is the
sum of the tokens above resolved at 1024×1366.

| Element | Computed | `ref-1-portrait.png` |
| --- | --- | --- |
| Masthead 抹茶 box | `y 56→72` | `y 58→74` |
| `MATCHA LAB` box | `y 84→94` | baseline `y≈95` |
| Watermark ink | `y 178→429` | `y 175→425` |
| Render frame | `301→896`, 594² | `302→900`, 598² |
| Title romaji box | top `1103` | `y≈1104` |
| Drink name box | top `1128` | ink `y≈1140` |
| Rule above rail | `y 1233` | `y 1233` |
| Rail glyph centres | `y 1289`; `x 80…944`, pitch 108 | `y≈1290`; `x 80…943`, pitch 108 |
| Rail romaji centres | `y 1306` | baseline `y≈1309` |
| Rail bottom | `y 1320` | 46px off the viewport = `1320` |

Three numbers made the difference:

- **40px between the footer and the rule** (`port:mt-10`). Without it the footer sits flush on the
  rail band and lands 40px low; with it the romaji falls on y=1103 and the rule on y=1233, both
  from the reference.
- **−10px on the rail band** (`port:-mb-2.5`). The reference puts the rail's last line 46px off
  the viewport bottom while the edge margin is 56, which is the doc's `calc(var(--edge) − 10px)`.
  The band reaches ten pixels into the bottom padding and stays visible for the same padding-box
  reason as the horizontal bleed.
- **The watermark's portrait anchor moved from `top-[6%]` to `top-[4%]`.** Same trap as the
  landscape `-translate-y-[52%]`, from the other end: Noto Sans JP's ink sits ~9% of the font size
  below its em box centre, so at `28svw` the box has to start 26px *above* where the ink should
  land. 6% put the ink centre on y=323 against a measured 300.

The one place still off the reference is the **romaji → title gap**: 25px built against 33–36px
measured. That is inherited from landscape, where ticket 07 verified and shipped the same
`mt-3.5`, so tightening it here would have desynchronised the two orientations to fix 11px in one
of them. Left alone, deliberately.

The kanji gloss is dropped in portrait (it was already), the masthead stacks (already), the
registration tick stays landscape-only (already, and correct — reference 1 has no tick). The
masthead's stacked gap went `6px → 12px`; the reference has 抹茶 ending at y=74 and the label
starting at y≈87, and 6px was visibly tight. Landscape is unaffected because that flex is a row
there with its own `22px`.

### Compact

Base is the compact treatment and it takes both phone orientations, since 852×393 fails `land`'s
`height >= 620px` guard on purpose. Two things had to give:

- `--rail-item` is `min(52px, 100svw/9)`. Nine fixed 52px slots are 468px wide and a 393px phone
  cannot hold them; the `min()` is still a constant at any one viewport, so the pitch is still
  fixed and the underline still slides a constant distance. **The honest cost: at 393px the slots
  are 43.67px wide, just under the 44px minimum.** Nine targets in a row on a phone genuinely
  cannot be 44px each — 396px of target against 393px of screen — so the band height carries the
  44 instead. The first version subtracted a cosmetic `- 12px` from the viewport before dividing,
  which bought nothing (the slot boxes are invisible and already bleed ~18px per side into the
  shell padding) and cost 1.3px per slot, taking them to 42.33px. That term is gone.
- `--frame-size` compact is `min(76svw, 40svh)` in portrait and `min(76svw, 34svh)` in landscape,
  split by a bare `@media (aspect-ratio >= 1)` sitting between the base `:root` and the `land`
  block. It was briefly `34svh` for *both*: 852×393 leaves the stage only ~143px and `40svh`
  overflowed it into the footer. But that flipped which term binds on a portrait phone — at
  393×852, `40svh` is 340.8 and `34svh` is 289.7 against `76svw`'s 298.7 — so portrait phones
  silently lost 9px of render to fix a landscape problem. The aspect guard gives each orientation
  its own ceiling and leaves `land`/`port`/`roomy` untouched, since those all override it later.

### Also in `styles.css`: the scrim is derived now

`--color-scrim` was `color-mix(in oklab, #414f34 88%, transparent)` — a hex literal, which meant it
would silently stop tracking the ground if `--color-field-deep` were ever retuned, and it put a
seventh colour into a system documented as six. It is now
`oklch(from var(--color-field-deep) 0.41 c h / 0.86)`.

**DESIGN-TASTE's own formula for this was wrong and could not be shipped as written.** It specified
`L 0.34`, which resolves to base `#2E3E15` and composites over `#7B8F63` to `#394A20` — ΔE 0.071 in
OKLab from the `#4D5B3E` measured off `ref-3-recipe.png`, a visibly darker and more saturated wash
than either the reference or what was on screen. Sweeping `L` with `c` and `h` inherited:

| Scrim | Base | Over the field | ΔE from `#4D5B3E` |
| --- | --- | --- | --- |
| DESIGN-TASTE `L 0.34 / 0.86` | `#2E3E15` | `#394A20` | 0.0712 |
| shipped literal `#414F34 / 0.88` | `#414F34` | `#48573A` | 0.0163 |
| **derived `L 0.41 / 0.86`** | `#405128` | `#485A30` | 0.0207 |

0.016–0.018 is the floor for any `L`, because inheriting `--color-field-deep`'s chroma (0.0666)
overshoots the reference's own (0.0486) and no lightness fixes that. `L 0.41` is within 0.002 of
that floor and within 0.0184 of the shipped literal, so the scrim does not visibly change — it just
stops being a magic number. DESIGN-TASTE now carries `0.41`.

### Verified, and not

- `bun run typecheck` clean, `bun test` 20 pass.
- Every utility compiles: checked by running `@tailwindcss/node`'s `compile()` over `styles.css`
  with the candidate list, rather than by trusting that `port:-mb-2.5`, `h-(--rail-band)`,
  `land:h-auto` and `size-(--tap)` are real. All 42 candidates resolve.
- Geometry is **computed, not measured**. Nobody has looked at portrait in a real browser. The
  numbers above are the ones to re-check first at 1024×1366 and 768×1024. The three geometry
  changes in this pass (band-height buttons, the 1024 guard, the `--frame-size` aspect split) are
  all argued from the token stack, not from a rendered page.
- Rotation preserving selection follows from the rail being one component whose children never
  unmount — there is no code path that resets `selectedId` — but it has not been exercised on a
  device.

### Left for the integrator

Nothing outstanding. `docs/design/layout-geometry.md` carried two wrong rows when this ticket was
first answered (`--rail-item` `port: 92px`, and a `--rail-w` table with no roomy-landscape split);
both are now correct in that file, along with `--tap`, the 1024 guard, the `--frame-size` split and
the band-fills-the-slot rule.

## Question

Make the layout adapt cleanly by aspect ratio so landscape and portrait are both first-class — not two layouts behind a width breakpoint.

- **Portrait (1024×1366)** follows reference 1: the rail becomes **horizontal along the bottom**, kanji in a row with romaji beneath each; the header spans the top; the title block and recipe affordance sit above the rail. The render frame stays a centred square, sized off the narrower axis.
- **Landscape (1366×1024)** stays as built in [Landscape master layout](./07-landscape-layout.md).
- The rail is **one component that reflows**, not two components swapped. Same nine children, same selection state, same accent underline — only flow direction and label placement change.
- Drive it from the aspect-ratio `--breakpoint-*` tokens defined in [App shell and SPA foundation](./02-app-shell.md), which combine `min-width` and `min-height`. A short-but-wide window must not get the tall treatment.
- Container queries belong *inside* components that render at very different sizes, not at the top level.

Verify 1366×1024, 1194×834, 1024×1366 and 1024×768. Rotating the iPad must not reload or lose selection. Mobile should not be broken, but polish there is explicitly a nice-to-have.
