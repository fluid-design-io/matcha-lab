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

Nothing inside a component knows about `env()`. The shell is `100dvh`, `overflow: hidden`, and
`overscroll-behavior: none` so a rubber-band drag on iPadOS cannot reveal anything behind it.

### Grid

**Landscape** — two columns, three rows:

```
grid-template-columns: 1fr var(--rail-w);
grid-template-rows:    auto 1fr auto;      /* masthead / stage / footer */
```

The masthead spans both columns (favourite count sits in the right one). The rail occupies
column 2 across all three rows and centres itself vertically. The stage cell is
`position: relative` and holds the watermark and the render frame as absolutely-positioned
children, so neither can push the footer.

**Portrait** — one column, four rows:

```
grid-template-columns: 1fr;
grid-template-rows:    auto 1fr auto auto; /* masthead / stage / footer / rail */
```

Same children, same order in the DOM. Only `grid-template-*` and the rail's flow direction change.

| Token | compact | `land` | `port` | `roomy` |
| --- | --- | --- | --- | --- |
| `--rail-w` | — | `138px` | `100%` | `138px` (land) |
| `--rail-item` | `52px` | `60px` | `92px` | `73px` (land) / `108px` (port) |

`--rail-item` is a **fixed pitch per slot** — the glyph is centred inside it. Selection changes the
glyph size but never the pitch, so the rail cannot reflow when you tap it and the shared underline
slides a constant distance every time. This is the single most important number in the rail.

## Landscape — 1366×1024 (master, `ref-4-landscape.png`)

| Element | Measured | Formula |
| --- | --- | --- |
| Edge margin | 56px | `--edge` |
| Masthead tick (accent hairline) | `x=56`, `y 0→120`, 1px | `left: var(--edge); top: 0; height: calc(var(--edge) + 64px)` |
| 抹茶 | `x=61`, cap 16px | Masthead row, `padding-left: 10px` off the tick |
| `MATCHA COCONUT LAB` | `x=119`, baseline `y≈75` | `margin-left: 22px` from 抹茶 |
| Favourite count `♡ 02` | right-aligned, `y 60→71` | Masthead row, column 2 |
| Watermark kanji | ink `x 135→570`, `y 320→695` | `font-size: 44svh`; em box `left: 6svw`, vertically centred |
| Render frame | `495×495` at centre `(905, 474.5)` | `min(48svh, 38svw)`, centred at `66%` / `46.5%` of the stage |
| Title romaji | `x 59→100`, `y 872→882` | Footer, column 1 |
| Drink name | ink `y 905→931`, 339px wide | 36px / 300 |
| Ingredient + gloss | ink `y 958→967` | 11px, `--color-on-field-faint` |
| Title block bottom | 57px from viewport bottom | `--edge` |
| Recipe affordance | rule `x 965→1048` at `y=947`; `作り方` `x 1035→1090`; `RECIPE →` `x 1104→1172` | Footer, column 1, right-aligned; `margin-bottom: 16px` |
| Rail kanji centre | `x=1259` | `--rail-w` column, glyph centred at 45% of it |
| Rail item pitch | 73px, span `y 217→802`, centred on 512 | `--rail-item` |
| Rail selection tick | `x 1216→1229` (13px), left of the glyph | `--color-accent`, 1px tall |
| Rail romaji | `x≈1292`, rotated | `writing-mode: vertical-rl` |

Derived sizes at the other landscape viewports:

| | 1366×1024 | 1194×834 | 1024×768 |
| --- | --- | --- | --- |
| `--edge` | 56 | 44 | 44 |
| Render frame `min(48svh, 38svw)` | 492 | 400 | 369 |
| Watermark `44svh` | 450 | 367 | 338 |
| `--rail-item` | 73 | 60 | 60 |
| Rail total (`8 × pitch + glyph`) | 616 | 512 | 512 |
| Rail fits in height | 1024 ✅ | 834 ✅ | 768 ✅ |

## Portrait — 1024×1366 (`ref-1-portrait.png`)

| Element | Measured | Formula |
| --- | --- | --- |
| Edge margin | 56px | `--edge` |
| 抹茶 | `x=55`, `y 58→74` | Masthead, row 1 |
| `MATCHA COCONUT LAB` | `x=55`, `y≈95` | Beneath 抹茶, not beside it — the masthead stacks in portrait |
| Favourite count | right, `y≈69` | Masthead, right-aligned |
| Watermark kanji | ink `x 375→650`, `y 175→425` | `font-size: 28svw`, horizontally centred, top-anchored to the stage |
| Render frame | `598×598` at `x 212→811`, `y 302→900` | `min(58svw, 44svh)`, horizontally centred |
| Title romaji | `y≈1104` | Footer |
| Drink name | `y≈1140`, 319px wide | 36px / 300 |
| Ingredient line | `y≈1185` | Gloss is dropped in portrait — the row would collide with the affordance |
| Recipe affordance | `作り方` `y≈1164`, `RECIPE →` `y≈1188`, right-aligned; **stacked**, no rule | Footer, right |
| Rule above rail | `y=1233`, `x 55→969` | Full content width, `--color-hairline-field` |
| Rail kanji centre | `y≈1290`, pitch 108px, span `x 80→943` centred on 512 | `--rail-item: 108px` |
| Rail romaji | `y≈1309`, beneath each glyph | Not rotated |
| Rail bottom | 46px from viewport bottom | `calc(var(--edge) - 10px)` |

Derived sizes at the other portrait viewports:

| | 1024×1366 | 834×1194 | 768×1024 |
| --- | --- | --- | --- |
| `--edge` | 56 | 44 | 44 |
| Render frame `min(58svw, 44svh)` | 594 | 484 | 445 |
| Watermark `28svw` | 287 | 234 | 215 |
| `--rail-item` | 108 | 88 | 80 |
| Rail total (`9 × pitch`) | 972 | 792 | 720 |
| Rail fits in width | 1024 ✅ | 834 ✅ | 768 ✅ |

**Portrait drops the kanji gloss from the title block.** It survives in the recipe overlay footer,
which is where the reference puts it in portrait too. Losing it is correct: the footer row has to
share its width with the recipe affordance, and the gloss is the least load-bearing thing in it.

## Recipe overlay — `ref-3-recipe.png`

Measured at 1366×1024. Two nested insets, and the hairline is **outside** the paper, on the scrim:

| Layer | Inset from viewport | Formula |
| --- | --- | --- |
| Hairline frame | 56px all sides (`x 56→1310`, `y 56→968`) | `var(--edge)` — the frame sits exactly on the main view's content margin |
| Paper panel | 70px all sides (`x 70→1296`, `y 70→954`) | `calc(var(--edge) + 14px)` |
| Panel padding | 56px | `--panel-pad` |

Panel content box at 1366×1024: `1114 × 772`, from `x 126` to `x 1240`.

The panel is the one component that gets **container queries** (`container-type: inline-size`).
Its children respond to `cqw`/`cqh`, never to the viewport — it renders at 1226px wide in
landscape and 884px wide in portrait, and the viewport cannot tell it which it is.

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
| Footer | `y 898→914` | Gloss + base temperature left, `♥ SAVED` right |

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

Both faces are self-hosted from `public/fonts/` and **subset**, because a home-screen app must
launch from a cold cache with no network. Full Noto Sans JP is ~5 MB; this app uses about 30
distinct Japanese glyphs.

Sources are `devDependencies` — they are build inputs, not runtime deps. The generated `.woff2`
files are committed.

```bash
# regenerate: scripts/build-fonts.sh
```

The subset ranges:

- **Archivo** (`@fontsource-variable/archivo`) — Latin basic + Latin-1 supplement + the arrow `→`,
  em dash, middle dot, and degree sign. Axes kept: `wght`.
- **Noto Sans JP** (`@fontsource-variable/noto-sans-jp`) — all hiragana, all katakana, the kanji
  the app actually sets, plus `、。・「」〜°`. Kana are included wholesale rather than glyph-by-glyph
  so future copy does not need a font rebuild. Axes kept: `wght`.

Kanji currently set by the app:

```
抹茶翠凪雲影泡温透苺深椰乳力涼濃味材料手順作方基本度湯
```

If you add a kanji to any string in `src/`, re-run the script and commit the new `.woff2`. A
missing glyph falls back to the system CJK face and is immediately, obviously wrong — different
skeleton, different weight, different width.

`font-display: swap` is deliberately **not** used. These files are small and preloaded; a swap
would flash the system CJK face at 450px, which is far worse than 40ms of nothing on a surface
that is already painting flat `#7B8F63`. Use `font-display: block` with the default 3s timeout.
