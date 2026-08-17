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

1. **One viewport.** `height: 100svh`, no vertical scroll on the main experience, no
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
| `--color-paper-shade` | `#E8E3D8` | Recessed paper. The recipe panel's render well **while it is empty** — the render itself is opaque and covers it, so nothing else ever sees this. |
| `--color-ink` | `#1F271C` | Green-black. Type on paper. Never on the field. |
| `--color-accent` | `#A8C4D6` | The pale blue. Rail underline, axis markers, step numbers, the masthead tick. |

The accent is the only colour in the app that is not green, off-white, or black. It marks
**selection and state, never decoration.** If a blue line is not saying "this one" or "this is
on", it should not be blue.

#### Roles on the field

Text on the field is `--color-paper` at a fixed opacity ramp. Components use the role token,
never a raw alpha.

| Token | Paper at | Carries |
| --- | --- | --- |
| `--color-on-field` | 100% | Drink title. The one thing at full strength. |
| `--color-on-field-strong` | 88% | Masthead kanji, `作り方`, the selected rail kanji. |
| `--color-on-field-muted` | 62% | Micro-labels: `MATCHA LAB`, `RECIPE →`, romaji. |
| `--color-on-field-faint` | 46% | Ingredient line, kanji gloss, unselected rail kanji. |
| `--color-on-field-ghost` | 14% | The giant watermark kanji. Measured off the reference; do not raise it. |
| `--color-hairline-field` | 22% | Rules and the dashed empty-state frame on the field. |

**Considered and not added: `--color-frame-field` at 66%,** for the recipe overlay's hairline
frame. The reference measures that frame at exactly paper-67%; `--color-on-field-muted` at 62% is
the nearest existing role and is what ships. Over the scrim the two composite to `(177,179,160)`
and `(184,185,167)` against a measured `(185,186,169)` — seven levels out of 255, on a 1px line.
A seventh field role for one element, four points from an existing one, is the drift the restraint
rule exists to stop. Revisit only if a second field-side frame ever appears.

#### Roles on paper

| Token | Ink at | Carries |
| --- | --- | --- |
| `--color-on-paper` | 100% | Quantities, method steps, the drink name, header kanji. |
| `--color-on-paper-muted` | 58% | Micro-labels: `材料 / BUILD`, `MATCHA BASE`, axis names. |
| `--color-on-paper-faint` | 38% | Footer gloss, the derived extremes line. |
| `--color-hairline` | 20% | Section rules, axis scales, the panel's inset frame. |

#### Scrim

| Token | Value | Notes |
| --- | --- | --- |
| `--color-scrim` | `oklch(from var(--color-field-deep) 0.41 c h / 0.86)` | The field seen through the recipe overlay. A *darkened field*, not a black wash. Never `rgba(0,0,0,…)`; a neutral black scrim kills the green and the whole world with it. |

`L 0.41` is the derived value, and it is a lightness match rather than an exact one. Over
`--color-field` it composites to `#485A30` against the `#4D5B3E` measured off `ref-3-recipe.png` —
lightness within `0.01` in OKLab, total `ΔE_ok ≈ 0.021`. (The `0.34` this doc previously specified
composites to `#394920`, `ΔE_ok ≈ 0.072`, visibly too dark.)

**The residual is chroma, not lightness, and it is a known and accepted trade.** `oklch(from …)`
keeps `--color-field-deep`'s `c`, so the derived scrim carries chroma `0.068` where the reference
measures `0.049`: the mockup's darkening desaturated as it dimmed, and a relative colour syntax
that preserves `c` cannot. Deriving from the field token is worth more than the last 0.02 of
chroma — one edit to `--color-field-deep` should move the scrim with it, and a hand-tuned literal
would silently stop tracking. If the overlay ever reads too green, lower `c` here rather than
reaching for a hex.

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
| **Archivo** (variable, wght) | Every Latin glyph — romaji, English, numerals, units. | A grotesque in the American-gothic line. Its moderate x-height sits correctly against kanji (Inter's tall x-height fights them), its caps stay crisp at 9px with 0.3em tracking, and it has real tabular figures for the quantity column. |

Both are **self-hosted and subset** into `src/assets/fonts/`, imported so Vite fingerprints them.
No Google Fonts round trip — this is a home-screen app and must launch from a cold cache without a
network. The subsets are enumerated glyph by glyph, so **adding any Japanese glyph to a string
needs a font rebuild**; see [Fonts](./docs/design/layout-geometry.md#fonts).

Japanese never sets in Archivo and Latin never sets in Noto Sans JP. A mixed run
(`凪 — calm sea, still water`) uses `font-family: var(--font-jp), var(--font-sans)` so the kanji
resolves first and the Latin falls through.

#### Scale

Sizes are `rem` (root `16px`). The px column is what the mockup measures at the 1366×1024 master,
and it is what ships at both `roomy` viewports.

The **compact** column is not hand-set per row. Every size is `calc(<size> × var(--type-display))`
or `calc(<size> × var(--type-micro))`, and those two multipliers are the whole density system:

| Multiplier | roomy | everywhere else | Applies to |
| --- | :---: | :---: | --- |
| `--type-display` | `1` | `0.84` | Title, quantity, all kanji above 16px, method body |
| `--type-micro` | `1` | `0.92` | Everything at or under 16px — labels, romaji, detail, numerals |

Display type gives up ~16% at the four non-roomy tablet targets (`1194×834`, `1024×768`,
`834×1194`, `768×1024`); micro-labels give up almost nothing, because 9px letterspaced caps stop
being legible before they stop fitting. `--text-micro` does not scale at all. **If you change a
compact number, change the multiplier — the column below is derived, not authored.**

| Token | Role | Size | Compact | Weight | Tracking | Family |
| --- | --- | --- | --- | --- | --- | --- |
| `--watermark-size`¹ | Giant watermark kanji | `44svh` land / `28svw` port | not density-scaled | 200 | `0` | JP |
| `--text-title` | Drink name | `2.25rem` / 36px | 30px | 300 | `-0.01em` | Latin |
| `--text-quantity` | Recipe build quantity | `1.875rem` / 30px | 25px | 300 | `-0.01em` | Latin |
| `--text-kanji-xl` | Recipe header kanji | `2.5rem` / 40px | 34px | 300 | `0` | JP |
| `--text-kanji-lg` | Selected rail kanji | `2rem` / 32px | 27px | 300 | `0` | JP |
| `--text-kanji-md` | Unselected rail kanji | `1.5rem` / 24px | 20px | 250 | `0` | JP |
| `--text-kanji-sm` | Masthead 抹茶, `作り方`, `材料`, `手順`, `味` | `1rem` / 16px | 15px | 300 | `0.16em` | JP |
| `--text-kanji-xs` | Axis glyphs 椰乳力涼濃, inline gloss kanji | `0.875rem` / 14px | 13px | 300 | `0` | JP |
| `--text-body` | Method steps | `1.125rem` / 18px | 15px | 300 | `0` | Latin |
| `--text-name` | English name in the overlay header | `0.875rem` / 14px | 13px | 400 | `0` | Latin |
| `--text-detail` | Ingredient line, kanji gloss, footer | `0.6875rem` / 11px | 10px | 400 | `0.06em` | Latin |
| `--text-romaji` | `NAGI` beside a kanji | `0.6875rem` / 11px | 10px | 500 | `0.26em` | Latin |
| `--text-label` | `MATCHA LAB`, `RECIPE →`, `BUILD` | `0.625rem` / 10px | 9px | 500 | `0.30em` | Latin |
| `--text-micro` | Axis names, step numbers, rail romaji | `0.5625rem` / 9px | 9px | 500 | `0.18em` | Latin |

¹ Not a `--text-*` token, because it is orientation-dependent rather than density-dependent: `44svh`
in landscape, `28svw` in portrait, `34svw` at compact, where one stacked composition serves the
phone either way up. It lives on `:root` alongside the layout numbers, and it needs a **vertical
nudge**: Noto Sans JP's ink sits about 9% of the font size *below* its em box's centre, so centring
the box leaves the character low on the axis. `translateY(-52%)` rather than `-50%`.

When checking any large kanji against a reference, measure the **ink**, not the element box —
`canvas.measureText().actualBoundingBoxAscent/Descent` gives it exactly. At 450px the two differ
by 40px, which is more than enough to send you correcting in the wrong direction.

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
- **Tabular figures** (`font-variant-numeric: tabular-nums`) for step numbers and every quantity.
- **Never bold.** The heaviest weight in the app is 500, and it appears only under 11px. The
  large sizes are 200–300. Weight is not how this design creates emphasis; size and opacity are.

### 3. Space and layout

Full measurements live in **[Layout geometry](./docs/design/layout-geometry.md)**. The rules that
constrain every component:

- **One viewport, always.** `height: 100svh` on the shell, `overflow: hidden` on `body`. The main
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
- **`svh` / `svw`, not `vh`, `dvh` or `vw`.** `svh` is the *smallest* viewport height, so the
  composition still fits while Safari's toolbars are mid-animation; in standalone the two are
  identical, which is the case that actually ships.

Edge margins:

| Viewport | `--edge` |
| --- | --- |
| 1366×1024, 1024×1366 (`roomy`) | 56px |
| 1194×834, 1024×768, 834×1194, 768×1024 | 44px |
| below that (compact) | 24px |

### 4. Motion

The one transition that matters is the **drink change**: a staggered cross-dissolve where every
layer lags the one before it and the giant watermark kanji moves **last and slowest**. Depth
without 3D. Layer order, front to back:

`title → romaji → ingredient line → render → rail → watermark`

**Calibrated at 1366×1024 against four candidates responding to one trigger, and picked by a human
at the instrument — the prototype is still at `/prototypes/motion`. The pick is candidate B,
*a whisper of travel*, plus a slight defocus.** Four pixels of rise is enough to feel a direction
and not enough to see one; two pixels of blur at the far end reads as the layer settling into
focus rather than as an effect.

Every number lives in the `MOTION` object in `src/lib/motion.ts`, in the units Motion takes —
seconds and pixels:

| `MOTION` field | Value | Meaning |
| --- | --- | --- |
| `stagger` | `0.04` | Seconds of delay added per layer, in the order above. |
| `layer` | `visualDuration 0.38`, `bounce 0` | The spring every dissolving layer uses. |
| `drift` | `4` | Pixels a layer travels. In from below, out upward. |
| `blur` | `2` | Pixels of defocus at the far end of the dissolve. |
| `watermark` | `visualDuration 1`, `bounce 0` | The watermark's own, slower spring. |
| `watermarkDrift` | `9` | It travels further, because it is furthest away. |
| `watermarkBlur` | `4` | And defocuses further, for the same reason. |

A layer fades **fully** out — `opacity: 0`, no floor — because its replacement is already fading in.

**`styles.css` deliberately carries no `--motion-*` custom properties.** It carried eight and
nothing read them. Springs cannot be expressed in CSS, so every animation in this app is a Motion
spring driven from the object above, and a parallel set of CSS numbers is a second source with no
consumer — it can only drift. If a Tailwind `transition-*` ever genuinely has to keep pace with one
of these springs, add the token to `@theme` at that point, next to the code that reads it.

**Read tokens through `useMotionTokens()`.** `MOTION` and `MOTION_REDUCED` are module-private for
exactly this reason — a component cannot import one and silently ignore `prefers-reduced-motion` —
and every exported helper takes the tokens as a required argument. `motion.ts` exports only what
has a consumer — `useMotionTokens`, `dissolve`, `layerDelay`, `panelTransition`, and
`prefersReducedMotion` for the field's non-React frame loop. Widen that surface only for a caller
that already exists.

Settled with the numbers:

- **A multi-step jump gets the same transition as a single step.** Scaling the stagger by distance
  makes 01 → 09 feel like a heavier interaction than 01 → 02, and the collection is nine peers,
  not a timeline. One response to one change.
- **The watermark's slower spring is doing real work** and stays. It is the only thing that says
  the composition has depth, and at `blur(4px)` over one second it is the last thing to settle.

Fixed regardless of calibration:

- **Import from `motion/react`.** Never `framer-motion`. Consult the `motion` skill before
  writing any animation.
- **The rail underline is one shared element**, animated with Motion's `layout` prop — not nine
  elements fading in and out.
- **`prefers-reduced-motion` keeps every state change but removes the travel.** The field stops
  drifting and holds; the drink change collapses to a single 120ms opacity cross-fade with no
  stagger, no movement and no defocus. Reduced motion must never mean "no feedback".
- **Only animate `opacity`, `transform`, and `filter`.** Nothing that triggers layout. The one
  exception is the shared rail underline, where Motion's `layout` prop reads and inverts the
  layout itself.
- **Nothing animates on mount** except the field canvas fading in over the flat `#7B8F63` body.
  First paint is a still frame.

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

The app needs two icons. That is the whole list:

| Use | Icon | Box | Effective stroke | Pairing |
| --- | --- | --- | --- | --- |
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

抹茶 at `--text-kanji-sm`, then `MATCHA LAB` at `--text-label` — on one line in landscape,
stacked everywhere else, per the references.

**In landscape only,** a 1px accent hairline drops from the very top edge of the viewport down past
the kanji, sitting exactly on the left content margin — a printer's registration tick, and the only
vertical rule in the app. It escapes the shell's top padding with a negative offset to reach the
edge. Portrait has no tick: `ref-1-portrait.png` does not draw one, and a vertical rule above a
stacked masthead reads as a margin marker rather than as registration.

May not: gain a logo, a nav, a tagline, or a second line.

#### The rail

Nine kanji, one component that **reflows** — vertical on the right edge in landscape, horizontal
along the bottom in portrait. Same nine children, same selection state, same underline. Only flow
direction and label placement change. Never two components swapped.

- Selected: `--text-kanji-lg`, `--color-on-field-strong`, romaji at `--text-micro` in
  `--color-on-field-muted`.
- Unselected: `--text-kanji-md`, `--color-on-field-faint`.
- **Romaji is orientation-dependent, and that is the rule, not an inconsistency.** Portrait labels
  *every* glyph, beneath it, unselected ones dropping to `--color-on-field-faint`. Landscape labels
  *only the selected* glyph, rotated via `writing-mode: vertical-rl`. Both references say so —
  `ref-1-portrait.png` runs SUI through SHIN along the bottom, `ref-4-landscape.png` carries NAGI
  and nothing else. The horizontal rail has the width to name the whole collection; the vertical
  one does not, and nine rotated words down the right edge would read as a second column of type
  arguing with the watermark.
- Selection is marked by a short accent rule — to the left of the kanji in landscape, beneath the
  romaji in portrait — and it is **one shared layout element** that slides.
- **The whole slot is the hit target, and in portrait the slot fills the ruled band** — no part of
  the ruled area is dead to a finger, even though the glyph and its label sit in a shorter box
  pinned to the band's bottom edge. That clears 44×44px at every tablet target: 116×60 or 138×73
  in landscape, 80×77 or 108×87 in portrait. On a phone it cannot — nine 44px-wide slots need
  396px and the narrowest phone is 393 — so compact clamps the pitch to a ninth of the viewport
  and the slot goes narrow rather than the rail wrapping.

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
line on one `--text-detail` row.

**The kanji gloss joins that row after an em dash in landscape only.** Everywhere else the row has
to share its width with the recipe affordance, and the gloss is the least load-bearing thing in
it — it survives in the recipe overlay's footer, which is where the portrait reference puts it.

May not: gain a description, a price, a rating, a CTA button, or a second paragraph.

#### The recipe affordance

`作り方`, then `RECIPE →`. It is a button, not a link, and the whole group is the target.

**In landscape an accent hairline precedes them and the three sit on one row; everywhere else the
two labels stack, right-aligned, and the rule is dropped** — `ref-1-portrait.png` draws it that
way, and there is no width for a horizontal rule beside a stacked pair.

May not: become a filled button, gain a border, or move away from the bottom-right group.

#### The recipe overlay

A centred rice-paper panel over a scrim of the darkened field, with a 1px frame 14px **outside**
the paper — drawn on the scrim, landing exactly on the main view's content margin. Built on Base
UI's dialog primitive — focus trap, escape, scroll lock and ARIA come free, and hand-rolling them
is a mistake.

- **The frame and the 14px margin it sits on are `land`/`port` only.** Compact has room for
  neither, so there the panel fills the viewport inside the safe area and the frame is hidden. A
  phone showing no frame is the contract, not a regression to fix.
- **The frame is on the field side, so it takes a field-side ink role: `--color-on-field-muted`,
  never `--color-hairline`.** Ink at 20% over a scrim is invisible. The reference measures the
  frame as paper at ~67% — see
  [Layout geometry](./docs/design/layout-geometry.md#recipe-overlay--ref-3-recipepng).
- One shadow in the whole app: `0 40px 120px -40px oklch(from var(--color-field-deep) 0.22 c h / 0.5)`.
- The frame belongs to the panel, not the backdrop, so the two arrive as one object.
- Container queries drive its internals, on `container-type: size` — the panel's rhythm is `cqh`
  and `cqmin`. Its children respond to the panel, not the viewport.
- **The panel holds four groups — the render, `材料 BUILD`, `手順 METHOD`, `味 TASTING NOTE` — and
  drops the render once its own short axis is under 600px.** All four do not fit below that line,
  and the render is the one that goes: it is the largest of them, and the only one repeating what
  the stage was showing a tap ago. Restoring it at phone sizes brings the scrollbar back.
- No nested scrolling, at any target viewport, ever.

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
