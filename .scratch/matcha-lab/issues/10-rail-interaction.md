# Rail interaction

Type: task
Status: resolved
Blocked by: 07, 09

## Answer

Four inputs now reach selection — tap, swipe, arrow keys, and the recipe overlay's own — and all
four go through the same `step`/`select` on `LabProvider`. Nothing else owns selection, which is
what keeps the rail's focus behaviour from becoming a second implementation.

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

### Swipe

`src/screens/lab/lab.gestures.ts`. The gesture surface is **the whole stage**, not the render
frame: in landscape the render sits at 76% of the stage and a thumb at the left bezel would find
nothing there. The render is still the only thing that visibly answers — both are bound to one
`MotionValue`.

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
- **No motion has been watched.** The in-app browser pane reports `document.hidden` and delivers
  zero `requestAnimationFrame` frames, so Motion's frameloop never runs there — `initial` applies,
  `animate` never progresses, exits never complete. Everything above is reasoning plus typecheck
  plus the calibrated numbers. The dissolve, the underline slide, the elastic at the ends and the
  snap-back all need one pass in a real window.

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
