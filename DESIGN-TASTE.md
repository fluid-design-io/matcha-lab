# Design taste — Matcha Lab

The file every agent reads before touching UI or generating art. Two parts:

1. **[Part 1 — the design system](#part-1--the-design-system)**, below. What code must obey.
2. **[Part 2 — the image generation contract](./docs/design/image-generation.md)**. How image number ten gets made a month from now and still matches the first nine.

Long reference material lives beside it:

- [Layout geometry](./docs/design/layout-geometry.md) — every measurement, viewport by viewport.
- [Image generation contract](./docs/design/image-generation.md) — the prompt skeleton, the pipeline, the verification.

Everything here is derived from the four reference mockups in `.scratch/matcha-lab/assets/`:
`ref-1-portrait.png`, `ref-2-base-sheet.png`, `ref-3-recipe.png`, `ref-4-landscape.png`.
When this file and a mockup disagree, this file wins — it is the one that got measured.

---

## The feel, in one paragraph

A small exhibition, not a dashboard. One drink at a time on a field of muted matcha green,
lit like a printed catalogue: enormous kanji held at a whisper, tiny letterspaced Latin doing
the labelling, and a single square render carrying all the colour. Nothing scrolls. Nothing
stacks. Nothing announces itself. The whole surface should feel like it is holding still on
purpose, and the only things that move are the things you touched.

**Three rules that override any local cleverness:**

1. **One viewport.** `min-height: 100dvh`, no vertical scroll on the main experience, no
   nested scroll containers anywhere. If content does not fit, the layout is wrong — fix the
   layout, do not add a scrollbar.
2. **Motion is extremely subtle.** Noticeable only under attention. When two options are
   close, take the quieter one.
3. **Restraint is the signature.** There is exactly one accent colour, one icon family, four
   icons, two typefaces. Adding a fifth icon or a third colour is a regression, not a feature.

---

## Part 1 — the design system

### 1. Colour

One world colour, one paper, one ink, one accent. Nothing else. All tokens are semantic —
never reach for a hue name in a component.

#### Ground truth

| Token | Value | What it is |
| --- | --- | --- |
| `--color-field` | `#7B8F63` | The matcha field. The single unifying world. `body` paints this flat so there is no white flash before the GPU device resolves. |
| `--color-field-deep` | `#6E8156` | The field's shaded end. Used **only** by the shader and the overlay scrim — never as a surface fill. |
| `--color-paper` | `#F1ECDF` | Rice paper. The recipe panel, and the ink colour for everything drawn *on* the field. |
| `--color-paper-shade` | `#E8E3D8` | Recessed paper. The render well inside the recipe panel. |
| `--color-ink` | `#1F271C` | Green-black. Type on paper. Never on the field. |
| `--color-accent` | `#A8C4D6` | The pale blue. Rail underline, axis markers, step numbers, the saved heart, the masthead tick. |

The accent is the only colour in the app that is not green, off-white, or black. It marks
**selection and state, never decoration.** If a blue line is not saying "this one" or "this is
on", it should not be blue.

#### Roles on the field

Text on the field is `--color-paper` at a fixed opacity ramp. Components use the role token,
never a raw alpha.

| Token | Paper at | Carries |
| --- | --- | --- |
| `--color-on-field` | 100% | Drink title. The one thing at full strength. |
| `--color-on-field-strong` | 88% | Masthead kanji, `作り方`, the selected rail kanji, the favourite count. |
| `--color-on-field-muted` | 62% | Micro-labels: `MATCHA COCONUT LAB`, `RECIPE →`, romaji. |
| `--color-on-field-faint` | 46% | Ingredient line, kanji gloss, unselected rail kanji. |
| `--color-on-field-ghost` | 14% | The giant watermark kanji. Measured off the reference; do not raise it. |
| `--color-hairline-field` | 22% | Rules and the dashed empty-state frame on the field. |

#### Roles on paper

| Token | Ink at | Carries |
| --- | --- | --- |
| `--color-on-paper` | 100% | Quantities, method steps, the drink name, header kanji. |
| `--color-on-paper-muted` | 58% | Micro-labels: `材料 / BUILD`, `MATCHA BASE`, axis names, `SAVED`. |
| `--color-on-paper-faint` | 38% | Footer gloss, the derived extremes line. |
| `--color-hairline` | 20% | Section rules, axis scales, the panel's inset frame. |

#### Scrim

| Token | Value | Notes |
| --- | --- | --- |
| `--color-scrim` | `oklch(from var(--color-field-deep) 0.34 c h / 0.86)` | The field seen through the recipe overlay. Measured `#4D5B3E` in `ref-3-recipe.png` — a *darkened field*, not a black wash. Never `rgba(0,0,0,…)`; a neutral black scrim kills the green and the whole world with it. |

#### Forbidden

- No second accent. No warning red, no success green, no hover-blue.
- No pure `#000` or `#fff` anywhere, including borders and shadows.
- No drop shadows on the field. Depth comes from the opacity ramp and the watermark, not blur.
  The recipe panel is the single exception and gets one long, near-transparent shadow to lift
  it off the field — see [Components](#6-components).

### 2. Type

Two families, and they do not overlap in job.

| Family | Role | Why |
| --- | --- | --- |
| **Noto Sans JP** (variable, wght) | Every Japanese glyph — kanji, kana. The watermark, the rail, the section heads, the axis glyphs. | It is the only face here that has to render 凪 at 450px and 12px in the same frame and stay on skeleton. |
| **Archivo** (variable, wght + wdth) | Every Latin glyph — romaji, English, numerals, units. | A grotesque in the American-gothic line. Its moderate x-height sits correctly against kanji (Inter's tall x-height fights them), its caps stay crisp at 9px with 0.3em tracking, and it has real tabular figures for the quantity column. |

Both are **self-hosted and subset** into `public/fonts/`. No Google Fonts round trip — this is a
home-screen app and must launch from a cold cache without a network. See
[App shell](./docs/design/layout-geometry.md#fonts) for the subsetting command.

Japanese never sets in Archivo and Latin never sets in Noto Sans JP. A mixed run
(`凪 — calm sea, still water`) uses `font-family: var(--font-jp), var(--font-sans)` so the kanji
resolves first and the Latin falls through.

#### Scale

Sizes are `rem` (root `16px`). The px column is what the mockup measures at the 1366×1024 master.
The **compact** column applies at `1194×834` and `1024×768`, where the same composition has ~20%
less room.

| Token | Role | Size | Compact | Weight | Tracking | Family |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-watermark` | Giant watermark kanji | `44svh` | `44svh` | 200 | `0` | JP |
| `--text-title` | Drink name | `2.25rem` / 36px | 30px | 300 | `-0.01em` | Latin |
| `--text-quantity` | Recipe build quantity | `1.875rem` / 30px | 26px | 300 | `-0.01em` | Latin |
| `--text-kanji-xl` | Recipe header kanji | `2.5rem` / 40px | 34px | 300 | `0` | JP |
| `--text-kanji-lg` | Selected rail kanji | `2rem` / 32px | 28px | 300 | `0` | JP |
| `--text-kanji-md` | Unselected rail kanji | `1.5rem` / 24px | 21px | 250 | `0` | JP |
| `--text-kanji-sm` | Masthead 抹茶, `作り方`, `材料`, `手順`, `味` | `1rem` / 16px | 15px | 300 | `0.16em` | JP |
| `--text-kanji-xs` | Axis glyphs 椰乳力涼濃, inline gloss kanji | `0.875rem` / 14px | 13px | 300 | `0` | JP |
| `--text-body` | Method steps | `1.125rem` / 18px | 16px | 300 | `0` | Latin |
| `--text-name` | English name in the overlay header | `0.875rem` / 14px | 13px | 400 | `0` | Latin |
| `--text-detail` | Ingredient line, kanji gloss, footer | `0.6875rem` / 11px | 10px | 400 | `0.06em` | Latin |
| `--text-romaji` | `NAGI` beside a kanji | `0.6875rem` / 11px | 10px | 500 | `0.26em` | Latin |
| `--text-label` | `MATCHA COCONUT LAB`, `RECIPE →`, `BUILD`, `SAVED` | `0.625rem` / 10px | 9px | 500 | `0.30em` | Latin |
| `--text-micro` | Axis names, step numbers, rail romaji | `0.5625rem` / 9px | 9px | 500 | `0.18em` | Latin |
| `--text-numeral` | Favourite count | `0.6875rem` / 11px | 10px | 400 | `0.18em` | Latin, `tnum` |

**Rules that are not negotiable:**

- **Latin gets smaller as Japanese gets bigger.** The kanji leads every pairing. Romaji is never
  more than a third of the height of the kanji it labels.
- **Everything at or under 11px is uppercase and letterspaced.** No exceptions, and no
  letterspacing above 18px — tracking on a 36px title reads as a mistake.
- **Trailing-space compensation.** Letterspacing adds trailing space after the last glyph.
  Any letterspaced run that has to align to a right edge or sit next to an icon gets
  `margin-right: -0.30em` (matching its tracking).
- **`font-optical-sizing: none`** globally. Both faces are variable; letting the browser pick an
  optical size makes the 9px labels and the 450px watermark drift apart between engines.
- **Tabular figures** (`font-variant-numeric: tabular-nums`) for the favourite count, step
  numbers, and every quantity. A counter that shifts width from `09` to `10` is a bug.
- **Never bold.** The heaviest weight in the app is 500, and it appears only under 11px. The
  large sizes are 200–300. Weight is not how this design creates emphasis; size and opacity are.

### 3. Space and layout

Full measurements live in **[Layout geometry](./docs/design/layout-geometry.md)**. The rules that
constrain every component:

- **One viewport, always.** `100dvh` on the shell, `overflow: hidden` on `body`. The main
  experience has no scroll container. The recipe overlay has no scroll container.
- **Safe areas are structural, not a patch.** Edge padding is
  `max(var(--edge), env(safe-area-inset-*))`, applied at the shell, so nothing inside a component
  has to know about the home indicator or the camera housing.
- **Layout adapts by aspect ratio, not width.** Three custom variants; see
  [Breakpoints](./docs/design/layout-geometry.md#breakpoints). A short-but-wide phone window must
  never get the tall treatment, so every variant guards on `min-width` **and** `min-height`.
- **Container queries live inside components, never at the top level.** Exactly one component
  earns them: the recipe panel, which renders at wildly different widths in landscape and
  portrait.
- **The render frame is always square**, sized off the short viewport axis by a single `min()`
  expression per orientation. It never becomes a rectangle, and it never sizes off content.
- **`svh` / `svw`, not `vh` / `vw`.** iPadOS toolbars change `vh` mid-gesture.

Edge margins:

| Viewport | Edge |
| --- | --- |
| 1366×1024, 1024×1366 (`roomy`) | 56px |
| 1194×834, 1024×768 | 44px |
| below that | 24px |

### 4. Motion

> **CALIBRATION PENDING — ticket 09.** The shape below is settled; the numbers are candidates
> until a human picks. Do not ship a transition that has not come out of that prototype, and
> when it lands, rewrite this section with the chosen values and delete this note.

The one transition that matters is the **drink change**: a staggered cross-dissolve where every
layer lags the one before it and the giant watermark kanji moves **last and slowest**. Depth
without 3D. Layer order, front to back:

`title → romaji → ingredient line → render → rail → watermark`

Tokens:

| Token | Meaning |
| --- | --- |
| `--motion-stagger` | Delay added per layer, in order above. |
| `--motion-spring` | The spring every dissolving layer uses (`stiffness` / `damping` / `mass`). |
| `--motion-opacity-floor` | How far down a layer dips mid-transition. `1` = pure cross-fade with no dip. |
| `--motion-drift` | Distance a layer travels, if any. Candidate A is `0` — opacity only. |
| `--motion-watermark` | The watermark's own, slower spring. |

Fixed regardless of calibration:

- **Import from `motion/react`.** Never `framer-motion`. Consult the `motion` skill before
  writing any animation.
- **The rail underline is one shared element**, animated with Motion's `layout` prop — not nine
  elements fading in and out.
- **`prefers-reduced-motion` keeps every state change but removes the travel.** The field stops
  drifting and holds; the drink change collapses to a single 120ms opacity cross-fade with no
  stagger and no movement. Reduced motion must never mean "no feedback".
- **Only animate `opacity`, `transform`, and `filter`.** Nothing that triggers layout. The one
  exception is the shared rail underline, where Motion's `layout` prop reads and inverts the
  layout itself.
- **The favourite toggle is louder than everything else**, and it is the only thing that is.
  See [Components](#6-components).
- **Nothing animates on mount** except the field canvas fading in over the flat `#7B8F63` body
  and the favourite count settling after hydration. First paint is a still frame.

### 5. Icons

`@gravity-ui/icons` is the only icon family. `lucide-react` is a scaffold leftover and is removed
— two icon families in one app is exactly the drift this project should not have.

**Deep-import per icon** so the family tree-shakes:

```tsx
import Heart from '@gravity-ui/icons/Heart'      // ✅
import { Heart } from '@gravity-ui/icons'        // ❌ pulls the whole set
```

Every glyph is a filled path on a `16×16` viewBox with a **1.5px optical stroke at 16px**. That
is heavier than this app's 1px hairlines and heavier than 9–11px letterspaced type, so size is
the only lever for weight.

**Only use box sizes 12, 16, or 20px** — halves and multiples of the 16 grid land on whole pixels
and stay crisp. `13px` and `18px` produce a soft, slightly grey glyph.

The app needs four icons. That is the whole list:

| Use | Icon | Box | Effective stroke | Pairing |
| --- | --- | --- | --- | --- |
| Favourite count, header | `Heart` | 12px | 1.13px | Beside `--text-numeral`. Matches the hairline weight. |
| Saved state, recipe overlay | `HeartFill` | 12px | — | Beside `--text-label` `SAVED`, in `--color-accent`. |
| Close the recipe overlay | `Xmark` | 16px | 1.5px | Standalone. 44px hit area, invisible. |
| Empty / loading render frame | `Picture` | 20px | 1.88px | Above an 11px caption, inside the dashed frame. |

**Ruled out, deliberately:**

- `ArrowRight` — the recipe affordance sets `RECIPE →` as a typographic arrow *inside* the
  letterspaced run. An SVG dropped into that run breaks the tracking rhythm and optical baseline.
- `Flask`, `Cup`, `Mug` — vessel is communicated by the render itself, which draws each drink's
  true vessel. A vessel icon next to a picture of the vessel is redundant.
- `Snowflake`, `Flame` — serve temperature sets as a `--text-label` word (`HOT` / `ICED` /
  `HOT ON FROZEN`). The reference gets by on type alone and so do we; the affogato's
  "hot on frozen" has no icon anyway.
- Everything else in the family.

**Optical alignment.** Gravity glyphs are centred in the 16-box with roughly 1px of internal
padding, so they sit ~0.5px low against cap-height Latin. Pair them in a flex row with
`align-items: center` and nudge `translateY(-0.5px)`. Never `vertical-align: middle`.

Icons inherit `currentColor`. They never carry their own colour token.

### 6. Components

What each may and may not do. Anything not listed is not allowed to appear.

#### The masthead

抹茶 at `--text-kanji-sm`, then `MATCHA COCONUT LAB` at `--text-label`. A 1px accent hairline
drops from the very top edge of the viewport down past the kanji, sitting exactly on the left
content margin — a printer's registration tick, and the only vertical rule in the app.

May not: gain a logo, a nav, a tagline, or a second line.

#### The rail

Nine kanji, one component that **reflows** — vertical on the right edge in landscape, horizontal
along the bottom in portrait. Same nine children, same selection state, same underline. Only flow
direction and label placement change. Never two components swapped.

- Selected: `--text-kanji-lg`, `--color-on-field-strong`, romaji beside it (rotated in landscape
  via `writing-mode: vertical-rl`, beneath it in portrait).
- Unselected: `--text-kanji-md`, `--color-on-field-faint`, no romaji.
- Selection is marked by a short accent rule — to the left of the kanji in landscape, beneath the
  romaji in portrait — and it is **one shared layout element** that slides.
- Hit targets are at least 44×44px regardless of how small the glyph is.

May not: scroll, wrap, reorder, show more than nine, or animate the nine glyphs independently.

#### The render frame

A square, sized off the short viewport axis, holding one drink image.

- Loaded: the image, no border, no shadow, no radius.
- Empty or loading: a 1px dashed `--color-hairline-field` frame with a `Picture` icon and an
  11px caption. This is the **only** surviving trace of the mockups' upload drop-zone — there is
  no upload, and the "or browse files" affordance does not ship.

May not: become a rectangle, crop the image, gain a caption when loaded, or carry a background
fill on the field.

#### The title block

Romaji at `--text-romaji` in `--color-accent`, drink name at `--text-title`, then the ingredient
line and kanji gloss on one `--text-detail` row separated by an em dash.

May not: gain a description, a price, a rating, a CTA button, or a second paragraph.

#### The recipe affordance

An accent hairline, then `作り方`, then `RECIPE →`. It is a button, not a link, and the whole
row is the target.

May not: become a filled button, gain a border, or move away from the bottom-right group.

#### The recipe overlay

A centred rice-paper panel over a scrim of the darkened field, with a 1px `--color-hairline`
frame inset 14px from the panel edge. Built on Base UI's dialog primitive — focus trap, escape,
scroll lock and ARIA come free, and hand-rolling them is a mistake.

- One shadow in the whole app: `0 40px 120px -40px oklch(from var(--color-field-deep) 0.22 c h / 0.5)`.
- Container queries drive its internals. Its children respond to the panel, not the viewport.
- No nested scrolling, at any target viewport, ever.

#### The favourite toggle

The most tactile moment in the app and the only place the brief's *slightly playful* note is
allowed to land. It gets **more life than anything else** — a quick scale overshoot on the heart
and the accent arriving a beat before the fill — and it is still restrained: under 400ms, under
1.15× scale, no particles, no confetti, no colour outside the accent.

The header count `♡ 02` fades in after hydration rather than popping. It must read as
*settling*, not *flickering*.

### 7. Content voice

- **Copy may evoke, but must not claim heritage.** Only usucha is genuinely traditional. Matcha
  with azuki is a traditional pairing in a modern format. Everything else is a modern café
  invention, and the words must not imply otherwise. The research file records the provenance of
  each drink; when in doubt, describe the drink, not its lineage.
- **Micro-labels label. They do not sell.** `MATCHA BASE`, not `THE PERFECT MATCHA BASE`.
- **Method steps are imperative phrases, lowercase, no terminal punctuation** — `whisk matcha`,
  `fill with ice`. Three to five of them. If a drink needs six, the drink is too complicated for
  this menu.
- **Derived copy stays derived.** The tasting-note extremes line (`涼 highest in the collection ·
  乳 lowest`) is computed from the axis data, never written by hand, so it cannot go stale when a
  number changes.

---

## Part 2 — the image generation contract

Nine images have to read as one family, and this is the part that silently drifts. The full
contract — prompt skeleton, camera, palette clamp, per-drink vessel table, the exact Codex
invocation, the post-processing pipeline, and the colour-count verification that catches
code-drawn fakes — is in **[docs/design/image-generation.md](./docs/design/image-generation.md)**.

The short version, so nobody has to open it to know the shape:

- **Flat `#7B8F63` ground, off-white line, drink colour as the only variable.** Three-value clamp.
- **Camera, crop, subject scale and lighting are fixed** across all nine and stated verbatim in
  the prompt skeleton. Only the vessel and the liquid change.
- **Each drink gets its true vessel** — chawan for 翠 SUI, tall glass for 透 TŌ, bowl-and-spoon
  for 雲 KUMO. The vessel is the one thing the render is allowed to say that the type does not.
- **Verify every output** with `file` *and* a distinct-colour count. A PIL fake had 664 colours;
  genuine generations run 17k–27k. In flat line-art style a fake looks plausible, and this check
  is the only reliable tell.
- **Nine that nearly match is worse than eight that do.** Regenerate anything that breaks family.
