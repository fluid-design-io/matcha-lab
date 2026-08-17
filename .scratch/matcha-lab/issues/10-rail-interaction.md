# Rail interaction

Type: task
Status: resolved
Blocked by: 07, 09

## Answer

**Three** inputs reach selection: a tap on a rail slot (`select`), a horizontal swipe on the stage
(`step`), and the arrow keys plus `Home`/`End` (`step`, and `setSelectedId` directly for the two
ends — `select` *is* `setSelectedId`, so this is the same function under two names rather than a
second path). The recipe overlay is **not** a fourth: nothing under `recipe/` calls `select` or
`step`, and while it is open `lab.context` detaches the key listener entirely, so no input changes
the drink until it closes. That is deliberate — changing the recipe out from under the reader is
worse than a dead arrow key — but the earlier version of this Answer claimed four inputs and it was
wrong.

`LabProvider` still owns selection outright, which is what keeps the rail's focus behaviour from
becoming a second implementation.

### The dissolve, and where it deviates from the prototype

`src/screens/lab/lab.layer.tsx` is the one wrapper. Old and new sit in the same grid cell, both on
screen at once, so it is a true dissolve and not a fade-out followed by a fade-in. Variants come
from `dissolve(layer, tokens)` and tokens from `useMotionTokens()`, so `prefers-reduced-motion`
works and the app cannot drift from the calibration instrument. `initial={false}` everywhere —
first paint is a still frame.

Layers land as: `title`, `romaji`, `detail` in the footer, `render` and `watermark` in the stage,
`rail` inside each slot.

**The rail is the deviation, and it is deliberate.** The prototype dissolves the rail as one
block, which is right at 40% zoom and wrong at full size: eight of the nine glyphs are identical
either side of a change, and cross-fading each against a copy of itself 8px away at 46% opacity
leaves a visible double image on every one of them. So the rail's `AnimatePresence` lives *inside*
each slot and keys on that slot's own selection state. Only the two slots that actually changed
animate; the other seven re-render with an unchanged key and never move. Same layer, same spring,
same 160ms delay the block would have had — the calibration is untouched, only the thing it is
applied to got smaller. **Not re-derived, not re-tuned.** Worth a look on a real device: if the
two-slot version reads as too quiet, the fix is to reconsider this choice, not the numbers.

### The underline

One `motion.span` with `layoutId="rail-selection"`, rendered only by the selected slot. It slides
and stretches between the landscape tick (`left-[32%] w-[10%]` of the rail column — the measured
`x 1216→1229`) and the portrait rule beneath the romaji, and it survives a rotation because the
rail is one component and the element is never torn down.

It sits **outside** the per-slot dissolve. A `layoutId` cannot be in two places at once, and
`AnimatePresence` deliberately keeps the outgoing copy mounted for the length of the transition —
inside, there would briefly be two claimants to the same id.

**It carries no CSS transform, on purpose.** The first version centred it with
`-translate-x-1/2`. Tailwind v4 emits that as the standalone `translate` property, which the
browser applies *before* `transform` and which `scale` does not multiply — so the moment Motion's
projection scales the element to morph 26px into 13px, a percentage translate stops agreeing with
the box it is translating. Offsets (`left-[38%] w-[24%]`) instead. This costs half a pixel of
vertical centring in landscape and buys correctness.

The slide is delayed by `layerDelay('rail', tokens)` like the rest of its layer. It means the
underline does not leave for 160ms after a tap. That is consistent with what was calibrated (the
prototype's whole rail, marker included, moved on that delay) and it is the first thing to
question if the tap feels unresponsive on hardware.

**It ignored `prefers-reduced-motion` until this pass, and got *worse* under it.** `useMotionTokens()`
cannot reach a Motion `layout` animation: Motion only skips one when `visualElement.shouldReduceMotion`
is true, that comes from `MotionConfigContext.reducedMotion`, and its default is `"never"`. The app
rendered no `<MotionConfig>`, so all the hook did was shorten the spring to `0.12s` — at 1024×1366,
focusing the rail and pressing `End` sent the underline 8 × 108px = 864px across the bottom of the
screen in 120ms, faster and more violent than with motion switched on.

`LabProvider` now wraps its children in `<MotionConfig reducedMotion="user">`. That sets
`animationOptions.type = false` and `delay = 0` on every layout animation in the tree
(`create-projection-node`), so the underline jumps rather than travels, and it also collapses
positional keys on ordinary animations — which costs nothing here, because `MOTION_REDUCED` already
zeroes `drift`, leaving only the opacity and blur cross-fade the design asks for. It sits at the
provider rather than in `lab.screen.tsx` (another stream's file) and covers the overlay too, since
React context reaches through the portal. **The hook is still the source for anything a spring can
be shrunk to; `MotionConfig` is what covers what the hook cannot reach**, and `lab.layer.tsx`'s
docblock now says exactly that instead of implying the hook does the whole job.

Not verified by watching: the pane delivers no frames. This is read off Motion 13.1's own source.

### Swipe

`src/screens/lab/lab.gestures.ts`. The gesture surface is **the whole stage**, not the render
frame: in landscape the render sits at 76% of the stage and a thumb at the left bezel would find
nothing there. The render is still the only thing that visibly answers.

**The surface does not move, and that took a second pass.** The first version bound the shared
`MotionValue` to the surface's own `style.x`, so the `absolute inset-0` surface rode the elastic.
At 1366×1024 the stage spans `x 56–1172` and the rail column `1172–1310`; drag right ~440px and
release and `dragElastic 0.2` leaves `x` near +87, with the inertia snap-back running ~400ms. For
that whole window the `aria-hidden` surface covered the left 87px of the rail — including the
selection tick at `x 1216` and the glyph centre at `x 1259` — so a tap on a kanji hit nothing and
read as a dropped input, which is the exact failure the elastic exists to avoid.

The surface only needs to *receive* the gesture. It is now spread with **`_dragX`** instead of
`style.x`: `VisualElementDragControls.getAxisMotionValue` returns `props._dragX` when it is present
and writes every gesture update, and the boundary spring's snap-back, straight into it — so the
render leans and the hit surface never leaves `inset-0`. Clipping the stage cell was the
alternative; this is the smaller change and does not constrain what the stage may overflow.

| | |
| --- | --- |
| Constraint | a point, `{ left: 0, right: 0 }` — the render never travels, it leans |
| Give | `dragElastic 0.2` — a 200px swipe slides the render 40px |
| Give at an end | `0.05` |
| Commit | `offset.x + velocity.x × 0.12` past `64px` |
| Momentum | off; the snap-back is Motion's overdamped boundary spring, no bounce |

**The ends are the interesting part.** `step()` clamps, so a swipe past 深 does nothing — and
without the asymmetric elastic it would feel *identical* to one that worked and simply fail, which
reads as a dropped input rather than as an edge. A quarter of the normal give says "held" while
the finger is still down, so the answer arrives before the release instead of after it. Direction
matches a page turn: swiping left moves forward.

The commit rule is pulled out as a pure `swipeStep(offsetX, velocityX)` and tested — a long slow
drag and a short fast flick both commit, a 60px drag released stationary does not, and a drag that
reverses before release cancels. That is the only part of the gesture that is a decision rather
than a binding, and it is the only part testable without a pointer and a frameloop.

### Keyboard and focus

Arrow keys are a `window` listener on `LabProvider`. Both axes move — the rail is a column in
landscape and a row in portrait, and a keyboard user should not have to know which — plus
`Home`/`End`. The listener is not attached at all while `recipeOpen`, because the dialog traps
focus and stepping the drink underneath it would change the recipe out from under the reader.

The rail is **one tab stop**, not nine: roving `tabIndex`, and after a change the rail moves focus
to the newly selected slot *only if focus was already inside the rail*. Following focus rather
than handling keys locally is what keeps `LabProvider` the single owner. The global
`:focus-visible` accent outline is the focus state; nothing custom.

### Hit targets

The brief asked for generous targets and the first version did not deliver them in portrait: the
slot button was `--rail-row` tall inside a taller `--rail-band`, so the top 38px of the visible
ruled band was dead. The button now fills the band and a `--rail-row` box pinned to its bottom edge
holds the ink — every measured position is unchanged, the target simply grows upward, from 108×48
to 108×86 at the portrait master. Full reasoning and the per-viewport numbers are under "the band
is the hit target" in [Orientation adaptation](./08-orientation.md).

One target still misses 44px: a 393px phone, where nine slots come to 43.67px wide. Nine 44px
targets need 396px, so this is a property of the screen rather than a choice.

### Portrait labels every glyph, and that is the rule

Both this ticket's brief and DESIGN-TASTE said "romaji appears for the selected one", while
`rail.item.tsx` renders all nine in portrait and only hides the unselected ones in landscape
(`land:opacity-0`). The code was right and the one-line summary was too coarse: `ref-1-portrait.png`
runs SUI through SHIN along the bottom, `ref-4-landscape.png` carries NAGI and nothing else, and
`layout-geometry.md`'s portrait table already said "beneath each glyph". A horizontal rail has the
width to name the whole collection; a vertical one does not, and nine rotated words down the right
edge would argue with the watermark. DESIGN-TASTE § The rail now states it as an
orientation-dependent rule rather than a single behaviour. No code change.

### Two things reconciled rather than stacked

- **The render's loaded/placeholder fade is gone.** It was a 300ms `transition-opacity` on the
  `<img>`, and the dissolve is now a second fade on the same element. What is left is a hard swap
  from placeholder to image — invisible on a warm render, honest on a cold one. The neighbours are
  preloaded, and `complete` is read in the ref callback (which runs in the commit, before paint)
  rather than waiting for `onLoad`, because otherwise the placeholder flashes for one frame on
  every change and some engines never fire `onLoad` for a cached image at all.
- **The title's accessible copy.** `AnimatePresence` keeps the outgoing drink mounted, so a naive
  version has two `<h1>`s and two `alt`s in the DOM for the length of every transition. The three
  visible footer layers are now `aria-hidden`, the render's `alt` is empty (every word it could
  carry, the title block already says), and one `sr-only` `<h1 aria-live="polite">` carries romaji,
  name, ingredients and gloss. It also fixes something that was simply missing: a screen-reader
  user pressing an arrow key now hears what changed.

### Verified, and not

- `bun run typecheck` clean; `bun test` 20 pass, six of them new for `swipeStep`.
- Motion's snap-back behaviour with `dragMomentum: false` and a point constraint was checked
  against the installed source rather than assumed: it animates to 0 on the boundary spring at
  stiffness 200 / damping 40, which is overdamped and bounce-free.
- `_dragX` and `reducedMotion="user"` were both read out of Motion 13.1's installed source
  (`VisualElementDragControls.getAxisMotionValue`, `create-projection-node`,
  `MotionConfigContext`) rather than taken from docs. `_dragX` is in the public `DraggableProps`
  type and typechecks; `getAxisMotionValue` uses it for the origin read, every `updateAxis` write
  and the snap-back animation, which is the whole gesture.
- **No motion has been watched.** The in-app browser pane reports `document.hidden` and delivers
  zero `requestAnimationFrame` frames, so Motion's frameloop never runs there — `initial` applies,
  `animate` never progresses, exits never complete. Everything above is reasoning plus typecheck
  plus the calibrated numbers. The dissolve, the underline slide, the elastic at the ends, the
  snap-back and the reduced-motion jump all need one pass in a real window.
- The claim that the surface no longer covers the rail is a **static** one — the surface has no
  transform at all now, at any point in the gesture — so it does not depend on watching frames.

### The `--motion-*` block in `@theme` is gone

`styles.css` carried eight motion custom properties — `--motion-stagger`, `--motion-opacity-floor`,
`--motion-drift`, `--motion-blur`, `--motion-watermark-drift`, `--motion-watermark-blur`,
`--motion-layer-duration`, `--ease-field` — and **nothing in `src/` read a single one of them.**
The block's own comment justified them as the numbers a Tailwind `transition-*` would need to keep
pace with a Motion spring in the same composition, and no such composition exists: the three CSS
transitions in the app (the affordance's hover rule, the favourite count settling after hydration,
the field canvas fading in over the flat body colour) are each a lone interaction with nothing to
stay in step with.

Deleted rather than wired. `src/lib/motion.ts` is the single source per DESIGN-TASTE, a parallel
set of CSS numbers is a second source with no consumer, and a second source can only drift. The
three transitions keep Tailwind's own `duration-*`/`ease-*` scale, which is the token system for
that. If one ever genuinely has to match a spring, the token goes back in next to the code that
reads it. DESIGN-TASTE § Motion documents this and has been updated to match.

Three smaller pieces of the same cleanup:

- **`transition-[width]` on the recipe affordance's hover rule** animated layout every frame,
  against the design's one fixed rule. It is now a fixed `w-24` with
  `origin-right scale-x-[0.875] → group-hover:scale-x-100` — same 84→96px result, on the
  compositor. Tailwind v4 emits `scale-x-*` as the standalone `scale` property and
  `transition-transform` covers it; `transform-origin: 100%` applies to it.
- **`prefers-reduced-motion` was being read in two places** — `lib/motion.ts` and
  `matcha-field.tsx`. Two consumers is the promotion trigger, and `lib/motion.ts` already owned
  the concept, so it now exports `prefersReducedMotion()` and the field imports it.
- **Dead exports in `lib/motion.ts`:** `MOTION_DISTANCE_SCALES` was an exported boolean nothing
  branched on (the prose above it already recorded the decision, and that prose is now the
  decision). `layerSpring` and `layerDistance` are consumed only by `dissolve()` in the same file
  and are no longer exported. `layerDelay`'s `tokens = MOTION` default is gone too, so no caller
  can bypass `useMotionTokens()` by omitting an argument.

Explicitly still not in scope, and still not built: pinch, long-press, drag-to-reorder.

## Question

Make the rail live, using the motion values settled in [Motion calibration](./09-motion-calibration.md).

- **Tap** a kanji to select its drink. Generous hit targets — the visible kanji is small, the touch target must not be.
- **Horizontal swipe** on the render area moves between drinks. This is the gesture that makes it feel iPad-native rather than a website on a tablet; it is worth doing properly, including at the ends of the collection.
- **Arrow keys** move selection, so it is demoable on a laptop.
- The **accent underline** slides between positions as a single shared layout element rather than nine independently animated ones. Motion's layout animation is the tool.
- Selected kanji scales up and darkens to ink; unselected stay pale. Romaji appears for the selected one.

Explicitly **not** in scope: pinch, long-press, drag-to-reorder. That is density creeping back in.

Interaction must work identically in both rail orientations from [Orientation adaptation](./08-orientation.md) — swipe direction stays horizontal-on-the-render in both. Keyboard focus order and visible focus states must be sane; this is a real UI, not a demo.
