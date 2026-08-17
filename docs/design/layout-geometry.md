# Layout geometry

Reference material for [DESIGN-TASTE.md](../../DESIGN-TASTE.md) Part 1. Every number here was
measured off the four mockups in `.scratch/matcha-lab/assets/` at their native size, then
expressed as a formula that holds at the other three target viewports.

Read this before positioning anything. Do not re-derive.

---

## Breakpoints

Layout adapts by **aspect ratio**, not width. Tailwind v4's `--breakpoint-*` namespace only
generates width media queries, so the aspect-ratio system is expressed as `@custom-variant`
instead — which is the correct v4 mechanism for a compound query and the only one that can guard
on `min-width` **and** `min-height` at once.

```css
/* src/styles.css */
@custom-variant land  (@media (aspect-ratio >= 1) and (width >= 900px) and (height >= 620px));
@custom-variant port  (@media (aspect-ratio < 1)  and (width >= 700px) and (height >= 900px));
@custom-variant roomy (@media ((width >= 1280px) and (height >= 940px)) or ((width >= 960px) and (height >= 1280px)));
```

Base (unprefixed) styles are the **compact** treatment — phones, small windows. `land` and `port`
layer the tablet compositions on top. `roomy` is an orthogonal *density* axis that raises the type
scale and edge margins; it is not a third layout.

The `width`/`height` guards are the whole point: a 852×393 phone in landscape has
`aspect-ratio >= 1` but fails `height >= 620px`, so it stays compact instead of getting the tall
treatment.

Two `:root` blocks in `styles.css` use raw media queries rather than these variants, and both are
deliberate: the rail's roomy overrides split `roomy` back into its landscape and portrait halves
(and the portrait half guards at 1024px, not 960 — see [Grid](#grid)), and `--frame-size` splits
compact on a bare `aspect-ratio >= 1`.

| Viewport | `land` | `port` | `roomy` | Result |
| --- | :---: | :---: | :---: | --- |
| 1366×1024 | ✅ | — | ✅ | Landscape master |
| 1194×834 | ✅ | — | — | Landscape, compact density |
| 1024×768 | ✅ | — | — | Landscape, compact density |
| 1024×1366 | — | ✅ | ✅ | Portrait master |
| 834×1194 | — | ✅ | — | Portrait, compact density |
| 768×1024 | — | ✅ | — | Portrait, compact density |
| 393×852 (phone) | — | — | — | Compact |
| 852×393 (phone, rotated) | — | — | — | Compact — correctly *not* landscape |
| 1440×900 (laptop) | ✅ | — | — | Landscape, compact density |

## Shell

```css
--edge: 24px;                      /* compact */
land:  --edge: 44px;  port: --edge: 44px;
roomy: --edge: 56px;
```

Applied once, at the shell, and always through the safe area:

```css
padding-inline: max(var(--edge), env(safe-area-inset-left)) max(var(--edge), env(safe-area-inset-right));
padding-block:  max(var(--edge), env(safe-area-inset-top))  max(var(--edge), env(safe-area-inset-bottom));
```

Nothing inside a component knows about `env()`. The shell is `height: 100svh` with
`overflow: hidden`, and `body` carries `overscroll-behavior: none` so a rubber-band drag on
iPadOS cannot reveal anything behind it. `svh`, not `dvh`: it is the smallest viewport height, so
the composition fits even mid-gesture while the toolbars animate, and in standalone the two are
identical anyway.

### Grid

**Landscape** — two columns, three rows:

```
grid-template-columns: 1fr var(--rail-w);
grid-template-rows:    auto 1fr auto;      /* masthead / stage / footer */
```

The masthead spans both columns. The rail occupies column 2 across all three rows and centres
itself vertically. The stage cell is
`position: relative` and holds the watermark and the render frame as absolutely-positioned
children, so neither can push the footer.

**Portrait** — one column, four rows:

```
grid-template-columns: 1fr;
grid-template-rows:    auto 1fr auto auto; /* masthead / stage / footer / rail */
```

Same children, same order in the DOM. Only `grid-template-*` and the rail's flow direction change.

`roomy` is not one block in `styles.css` — the density block (type scale and `--edge`) covers both
orientations, and then two shape-specific blocks carry the rail numbers, because the rail pitch was
measured off each master separately and the two cannot share a value. The table follows that
structure.

| Token | compact | `land` | `port` | roomy `land` | roomy `port` |
| --- | --- | --- | --- | --- | --- |
| `--rail-w` | `100%` | `116px` | `100%` | `138px` | `100%` |
| `--rail-item` | `min(52px, 100svw / 9)` | `60px` | `80px` | `73px` | `108px` |
| `--rail-band` | `68px` | — | `77px` | — | `87px` |
| `--rail-row` | `var(--tap)` | — | `var(--tap)` | — | `48px` |

`—` means the token has no effect in that variant, not that it is unset. Landscape uses neither
`--rail-band` nor `--rail-row`: there the rail is `height: 100%` inside its own grid column and the
slot's cross axis is `--rail-w`.

`--tap: 44px` is global and never responsive — the minimum touch target is 44px on every screen.
It sizes `--rail-row` everywhere except the portrait master, where the measured 48px row is already
larger. The hit target is bigger than either: the slot fills the whole `--rail-band`.

**The roomy `port` rail block guards at `width >= 1024px`, not at `roomy`'s own 960px.** Those two
conditions are deliberately not the same query: nine slots of the master's 108px pitch come to
972px, so a 960px-wide viewport would clip the outermost pair. Between 960 and 1024 wide the
density is roomy — full type scale, 56px edge — while the rail stays on `port`'s 80px pitch. If
you widen one guard, widen the other or check the arithmetic again.

**`--rail-item` is a fixed pitch per slot** — the glyph is centred inside it. Selection changes the
glyph size but never the pitch, so the rail cannot reflow when you tap it and the shared underline
slides a constant distance every time. This is the single most important number in the rail.

**`--rail-band` and `--rail-row` are the portrait rail's cross axis, and they are not the same
box.** The band is the whole rule-to-baseline block, with a `border-top` hairline at its top edge.
Each slot **stretches to fill the band**, so no part of the ruled area is dead to a finger. Inside
the slot, a `--rail-row` box pinned to its bottom edge carries the glyph and the romaji, and that
is what holds their optical position. At the portrait master the band is
`87px = 1px rule + 38px clear + a 48px row`, which puts the rule on `y=1233` and the glyph centres
on `y≈1290`.

**What binds each rail number:**

- `--rail-w` at `land` is the measured roomy column scaled by the compact type multiplier:
  `138 × 0.84 = 116`. The column has to hold the glyph, the rotated romaji and the selection tick
  at whatever size the type scale is running.
- `--rail-item` in portrait is bound by **768×1024**, not by proportion. One value serves both
  non-roomy portrait targets, and at 768 nine slots of the proportional 88px come to 792px —
  wider than the viewport. Nine of 80px come to 720px and clear it with 24px a side. (`92px`
  appeared in an earlier version of this table; it is derivable from neither master and nine of
  them overflow 768 by 60px.)

### The stage's two sizes

| Token | compact ▭ | compact ▯ | `land` | `port` |
| --- | --- | --- | --- | --- |
| `--frame-size` | `min(76svw, 34svh)` | `min(95svw, 50svh)` | `min(48svh, 38svw)` | `min(72.5svw, 55svh)` |
| `--watermark-size` | `34svw` | `34svw` | `44svh` | `28svw` |

Compact is one stacked composition whichever way the phone is held, so it splits the frame on a
bare `aspect-ratio >= 1` rather than on `land`. Held sideways at 852×393 the masthead, footer and
rail leave the stage about 143px and the portrait height term overflows into the footer, so
landscape-shaped compact caps at `34svh`. Held upright the `svw` term binds long before the height
term does, and the taller ceiling costs nothing.

**Both portrait frames run 25% above the reference measurement** (`76 → 95svw` / `40 → 50svh`
compact, `58 → 72.5svw` / `44 → 55svh` at `port`). At the master's own scale the drink read too
small against all that field, and the stage has the height to spare in every portrait case — the
`svw` term still binds, and the widest result, 373px at 393×852, stays inside the viewport. The
landscape numbers are untouched; there the stage is the short axis and has nothing to give.

## Landscape — 1366×1024 (master, `ref-4-landscape.png`)

| Element | Measured | Formula |
| --- | --- | --- |
| Edge margin | 56px | `--edge` |
| Masthead tick (accent hairline) | `x=56`, `y 0→120`, 1px | `left: var(--edge); top: 0; height: calc(var(--edge) + 64px)` |
| 抹茶 | `x=61`, cap 16px | Masthead row, `padding-left: 10px` off the tick |
| `MATCHA LAB` | `x=119`, baseline `y≈75` | `margin-left: 22px` from 抹茶 |
| Watermark kanji | ink `x 135→570`, `y 320→695` | `font-size: 44svh`; em box `left: 6svw`, vertically centred |
| Render frame | `495×495` at centre `(905, 474.5)` | `min(48svh, 38svw)`, centred at `66%` / `46.5%` of the stage |
| Title romaji | `x 59→100`, `y 872→882` | Footer, column 1 |
| Drink name | ink `y 905→931`, 339px wide | 36px / 300 |
| Ingredient + gloss | ink `y 958→967` | 11px, `--color-on-field-faint` |
| Title block bottom | 57px from viewport bottom | `--edge` |
| Recipe affordance | rule `x 965→1048` at `y=947`; `作り方` `x 1035→1090`; `RECIPE →` `x 1104→1172` | Footer, column 1, right-aligned; `margin-bottom: 16px` |
| Rail column | `x 1172→1310` | `--rail-w: 138px`, flush to the content margin |
| Rail kanji centre | `x=1259` | `left: 63%` of `--rail-w` → `1172 + 86.9` |
| Rail item pitch | 73px, span `y 217→802`, centred on 512 | `--rail-item` |
| Rail selection tick | `x 1216→1229` (13px), left of the glyph | `left: 32%`, `width: 10%`; `--color-accent`, 1px tall |
| Rail romaji | `x≈1292`, rotated, selected slot only | `left: 82%`, `writing-mode: vertical-rl` |

Derived sizes at the other landscape viewports:

| | 1366×1024 | 1194×834 | 1024×768 |
| --- | --- | --- | --- |
| `--edge` | 56 | 44 | 44 |
| Render frame `min(48svh, 38svw)` | 492 | 400 | 369 |
| Watermark `44svh` | 450 | 367 | 338 |
| `--rail-w` | 138 | 116 | 116 |
| `--rail-item` | 73 | 60 | 60 |
| Rail height (`9 × pitch`) | 657 | 540 | 540 |
| Rail fits in height | 1024 ✅ | 834 ✅ | 768 ✅ |

## Portrait — 1024×1366 (`ref-1-portrait.png`)

| Element | Measured | Formula |
| --- | --- | --- |
| Edge margin | 56px | `--edge` |
| 抹茶 | `x=55`, `y 58→74` | Masthead, row 1 |
| `MATCHA LAB` | `x=55`, `y≈95` | Beneath 抹茶, not beside it — the masthead stacks in portrait |
| Watermark kanji | ink `x 375→650`, `y 175→425` | `font-size: 28svw`, horizontally centred, top-anchored to the stage |
| Render frame | `598×598` at `x 212→811`, `y 302→900` | `min(72.5svw, 55svh)`, horizontally centred — the measurement × 1.25, see [the stage's two sizes](#the-stages-two-sizes) |
| Title romaji | `y≈1104` | Footer |
| Drink name | `y≈1140`, 319px wide | 36px / 300 |
| Ingredient line | `y≈1185` | Gloss is dropped in portrait — the row would collide with the affordance |
| Recipe affordance | `作り方` `y≈1164`, `RECIPE →` `y≈1188`, right-aligned; **stacked**, no rule | Footer, right |
| Rule above rail | `y=1233`, `x 55→969` | Full content width, `--color-hairline-field`; the band's top border |
| Rail band | `y 1233→1320` (87px) | `--rail-band`; each slot stretches to fill it |
| Rail row | `y 1272→1320` (48px) | `--rail-row`, pinned to the slot's bottom edge |
| Rail kanji centre | `y≈1290`, pitch 108px, span `x 80→943` centred on 512 | `--rail-item: 108px`, glyph at 36% of the row |
| Rail romaji | `y≈1309`, beneath **every** glyph, selected and unselected alike | Not rotated; 70% of the row |
| Rail bottom | 46px from viewport bottom | `calc(var(--edge) - 10px)` |

Derived sizes at the other portrait viewports:

| | 1024×1366 | 834×1194 | 768×1024 |
| --- | --- | --- | --- |
| `--edge` | 56 | 44 | 44 |
| Render frame `min(72.5svw, 55svh)` | 742 | 605 | 557 |
| Watermark `28svw` | 287 | 234 | 215 |
| `--rail-item` | 108 | 80 | 80 |
| `--rail-band` / `--rail-row` | 87 / 48 | 77 / 44 | 77 / 44 |
| Rail width (`9 × pitch`) | 972 | 720 | 720 |
| Content column (viewport − 2×`--edge`) | 912 | 746 | 680 |
| Rail fits in viewport | 1024 ✅ | 834 ✅ | 768 ✅ |

**The portrait rail is allowed to be wider than the content column, and the reference shows it
that way** — 972px of pitch against 912px of column at the master. The centred row overflows
symmetrically into the shell's edge padding: the slot boxes bleed, the glyph ink does not, and the
outermost hit targets reach further towards the bezel for it. What must never overflow is the
**viewport**, which is why 768×1024 is the binding case for `--rail-item` in portrait. The rule
above the rail stays on the nav, so it keeps the content width rather than the rail's.

**Portrait drops the kanji gloss from the title block.** It survives in the recipe overlay footer,
which is where the reference puts it in portrait too. Losing it is correct: the footer row has to
share its width with the recipe affordance, and the gloss is the least load-bearing thing in it.

## Recipe overlay — `ref-3-recipe.png`

Measured at 1366×1024. Two nested insets, and the hairline is **outside** the paper, on the scrim:

| Layer | Inset from viewport | Formula |
| --- | --- | --- |
| Hairline frame | 56px all sides (`x 56→1310`, `y 56→968`) | `var(--edge)` — the frame sits exactly on the main view's content margin |
| Paper panel | 70px all sides (`x 70→1296`, `y 70→954`) | `calc(var(--edge) + 14px)` |
| Panel padding | 56px | `--recipe-pad` — see below |

Both insets are `land`/`port` only. Compact has room for neither, so there the frame is hidden and
the panel fills the viewport inside the safe area.

Because the frame is on the scrim, it takes a **field-side** ink role, not `--color-hairline`.
Sampled at `x=56, y=512` in `ref-3-recipe.png` it reads `(185,186,169)`, which against the
adjacent scrim `(72,85,58)` is paper at ~67%; the nearest shipped role is `--color-on-field-muted`
at 62%. An ink-based hairline there would be invisible. The frame is a child of the panel rather
than of the backdrop, so the two arrive as one object.

Panel content box at 1366×1024: `1114 × 772`, from `x 126` to `x 1240`.

The panel is the one component that gets **container queries**, and the type is
`container-type: size` — never `inline-size`. `recipe.overlay.tsx` declares it as
`containerType: 'size'` with `containerName: 'recipe'`, in `style` rather than a utility class so
it cannot be overridden.

**`inline-size` would break the panel silently, not visibly.** It resolves no block axis, so every
`cqh` and `cqmin` clamp on the panel — `--recipe-pad`, `--recipe-lead`, `--recipe-band`,
`--recipe-step`, `--recipe-row`, and the `--recipe-render` square — would collapse to its lower
bound, and the arrangement queries that test the panel's `height` and `aspect-ratio` would never
match, so a landscape panel would render the tall arrangement at minimum rhythm.

Its children respond to `cqw`/`cqh`/`cqmin`, never to the viewport — the panel is 1226×884 in
landscape and 884×1226 in portrait, and the viewport cannot tell it which it is.

**Panel padding is one of those children, and it tracks the panel's *short* axis.** `--recipe-pad`
is declared on the panel in `recipe.panel.tsx` as `clamp(16px, calc(11.2cqmin - 43px), 56px)`, and
pinned to a flat `16px` once the short axis is under 600px. `cqmin`, not `cqw`: the padding is
spent on both axes, so the axis with less to give is the one allowed to set it — a wide, short
panel must not spend its height on margin. The expression is a straight line through the two
measured panels: 56px at the masters' 884px short axis, 30px at the tightest tablet's 652px. It is
deliberately **not** a `:root` density token beside `--edge`, because a viewport-level token cannot
see the panel's own box, which is the only thing this measurement depends on.

### Landscape arrangement

```css
grid-template-columns: var(--recipe-render) 1fr 1fr;
grid-template-rows:    auto 1fr auto;   /* header / body / footer */
column-gap: 53px;
--recipe-render: min(36cqw, 45cqh);     /* 398px at the master — measured 399 */
```

| Region | Measured | Contents |
| --- | --- | --- |
| Header | `y 128→165` | 凪 at 40px, `NAGI` micro, an em-dash rule, the English name at 14px. `Xmark` far right. |
| Left column | `x 126→525`, `y 192→591` | The drink render, reused at smaller scale |
| Middle column | `x 578`, width 302 | `材料 / BUILD` — each ingredient as a micro-label above a 30px/300 quantity |
| Right column | `x 933→1240` | `手順 / METHOD` — numbered steps; rule at `y≈452`; `味 TASTING NOTE`; the five axes; the derived extremes line at `y≈684` |
| Footer rule | `y≈840`, `x 126→1240` | `--color-hairline` |
| Footer | `y 898→914` | Gloss, serve temperature, and matcha base |

Axis scale geometry: glyph at `x 936` (14px kanji), axis name at `x 967` (9px micro), the scale
line from `x 1040` to `x 1240` with a tick at each end and one at the midpoint, and a 7px diamond
marker positioned at `value / 10` along it. The diamond is **filled with `--color-accent` when the
drink leads the collection on that axis**, hollow (1px `--color-hairline`, paper fill) otherwise.
Row pitch 33px.

### Portrait arrangement

Same three groups, regrouped — never a squeezed version of the landscape one:

```css
grid-template-columns: 1fr 1fr;
grid-template-areas:
  "header header"
  "render build"
  "method method"
  "footer footer";
--recipe-render: min(45cqw, 30cqh);
```

`手順 / METHOD` and `味 TASTING NOTE` sit side by side inside the full-width `method` area, which
is what keeps the panel free of a scrollbar at 768×1024.

### Hard constraint

**No nested scrolling at any target viewport.** The tightest case is 1024×768: panel content
`772 × 516`, against a worst-case right column of five method steps + rule + five axis rows +
extremes line ≈ 386px at compact type. It fits. If a content change breaks that, the fix is the
layout or the content — never `overflow: auto`.

---

## Fonts

Both faces are self-hosted from `src/assets/fonts/` and **subset**, because a home-screen app must
launch from a cold cache with no network. `src/`, not `public/`: they are imported, so Vite
fingerprints them and they cache immutably, and `__root.tsx` preloads the two hashed URLs. Full
Noto Sans JP is 9.6 MB; the two subsets together are 28 KB.

`scripts/build-fonts.sh` — `bun run fonts` — generates them, and the `.woff2` files are committed.
It fetches the variable sources straight from `google/fonts`; the `@fontsource-variable/*`
devDependencies pin the same versions but ship pre-split into unicode-range chunks, which is the
opposite of what subsetting needs. It also needs `fonttools` and `brotli`, which are deliberately
not project deps — the script's header has the venv command.

Both subsets are **enumerated glyph by glyph, not by unicode range**:

- **Archivo** — ASCII, plus exactly the non-ASCII the app sets: `Ōō` for TŌ, `é` for purée, the en
  and em dashes, the middle dot, the degree sign, and `→`, because `RECIPE →` sets the arrow as
  type rather than as an icon. Width is instanced to 100 and the axis dropped; axes kept: `wght`.
- **Noto Sans JP** — the glyphs below and nothing else. Kana are **not** included wholesale:
  variable CJK carries heavy per-glyph `gvar` data, so adding all hiragana and katakana takes the
  file from 14 KB to 96 KB for glyphs no string sets. Axes kept: `wght`. The `vert`/`vrt2` layout
  features are kept, because the landscape rail sets romaji and kanji in `writing-mode: vertical-rl`.

The Japanese set:

```
抹茶翠凪雲影泡温透苺深椰乳力涼濃味材料手順作方り度湯基本・ー
```

If you add **any** Japanese glyph to a string in `src/` — kana included — re-run the script and
commit the new `.woff2`. A missing glyph falls back to the system CJK face and is immediately,
obviously wrong: different skeleton, different weight, different width.

`font-display: swap` is deliberately **not** used. These files are small and preloaded; a swap
would flash the system CJK face at 450px, which is far worse than 40ms of nothing on a surface
that is already painting flat `#7B8F63`. Use `font-display: block` with the default 3s timeout.
