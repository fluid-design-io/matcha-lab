# Viewport verification pass

Type: task
Status: resolved
Blocked by: 05, 06, 08, 10, 11, 12

## Answer

Driven in a real browser at **1366×1024, 1194×834, 1024×1366 and 1024×768**, plus **834×1194 and
768×1024** because the rotation checks pass through them and the recipe panel changes size there.
Every number below is a measurement off the running app, not a reading of the source.

**One real defect found and fixed: the rail and the recipe quantities were rendering at 16 px.**
Everything else the ticket asks for holds. Two findings became tickets
[15](./15-render-payload.md) and [16](./16-portrait-recipe-rule.md). What a human still has to do
is at the bottom, separately.

### First, what the instrument can and cannot see

The browser pane delivers **zero `requestAnimationFrame` frames**. Hit-testing, computed style,
layout measurement, `elementFromPoint` and synthesized clicks all work and caught the defect below.
Nothing time-based does:

- Motion never advances a spring, so every `AnimatePresence` exit stays mounted for the life of the
  page. After a drink change the outgoing layer sits at `opacity: 1` and the incoming one at `0` —
  **a screenshot taken after selecting a new drink still shows the old one.** That is the
  instrument, not the app; the DOM, the `h1`, the rail state and the recipe contents are all
  correct at the same moment.
- Closing the recipe leaves the popup node mounted at full size, so it keeps swallowing pointer
  events. React has already closed it (Base UI has released `inert`/`aria-hidden` on the shell), so
  this is only a screenshot and click-through nuisance.
- `performance.getEntriesByType('paint')` returns `[]`. There is no first-paint number to be had.
- The WebGPU field never draws, so every screenshot below is over flat `#7B8F63` rather than over
  the shader.

Screenshots of a drink other than the opening 凪 NAGI are therefore not reliable, and the
qualitative read below is based on the four opening-view compositions and two recipe panels that
*are* trustworthy.

### The defect: `cn()` was deleting every font size it did not recognise

`cn()` was `twMerge(clsx(...))` on tailwind-merge's stock config, which knows only the
`text-xs…text-9xl` scale. Every one of this app's `--text-*` utilities looks like a colour to it, so
in any class list where a size and a `text-<role>` colour met, **the size was dropped and the
element fell back to the inherited 16 px.** Three call sites, all pre-existing:

| Where | Should be | Was rendering |
| --- | --- | --- |
| `rail.item.tsx` selected kanji | `--text-kanji-lg` 32 px / 300 | 16 px / 400 |
| `rail.item.tsx` unselected kanji | `--text-kanji-md` 24 px / 250 | 16 px / 400 |
| `rail.item.tsx` romaji | `--text-micro` 9 px, `0.18em` | 16 px, no tracking |
| `recipe.build.tsx` quantity | `--text-quantity` 30 px / 300 | 16 px / 400 |

So the rail had **no size difference between selected and unselected at all** — the one thing that
marks selection besides the accent tick — and its romaji was setting larger than the design's
`--text-kanji-sm`, against the rule that romaji is never more than a third of the height of the
kanji it labels. The recipe's `材料 BUILD` column, which is a specification only because the
quantity is large and the label small, had the two at the same size.

It survived three rounds of agents because the places that get this right —
`lab.footer.tsx`, `lab.masthead.tsx`, `recipe.header.tsx`, and **the motion-calibration prototype
at `/prototypes/motion`** — all pass a plain `className` string rather than going through `cn()`.
The rail the human calibrated the motion against was the prototype's, at the correct 32/24 px.

Fixed once, in `src/lib/utils.ts`, by teaching tailwind-merge the app's font-size class group
rather than by shuffling classes at four call sites:

```ts
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TEXT_SIZES }] } },
})
```

`TEXT_SIZES` is one entry per `--text-*` token in `styles.css`, and the comment above it says to
add to it when a token is added. Verified after the change at every viewport: 32 px/300 selected,
24 px/250 unselected, 9 px with `1.62px` tracking on the romaji at roomy; 26.88 / 20.16 / 9 px at
compact, which is the `--type-display: 0.84` column of the design table. Quantity 30 px roomy,
25.2 px compact.

Two side effects, both checked. `leading-none` now loses to the font size that follows it in
`rail.item.tsx` — tailwind-merge treats `font-size` as conflicting with `leading`, and
`--text-kanji-lg--line-height` and `--text-kanji-md--line-height` are both `1`, so the computed
line-height is unchanged. And the rail's 30 px growth is absorbed entirely by the fixed
`--rail-item` pitch: pitch is still 73 / 60 / 108 / 80 px, the nine slots still span 657 px centred
on 512 in the landscape master, and nothing reflowed.

### No vertical scroll, and no nested scroll container

At all six viewports, with each of the nine drinks selected in turn:

- `documentElement.scrollWidth/Height` equals `clientWidth/Height`, same for `body`.
- **Zero elements in the whole tree declare `overflow-x` or `overflow-y` of `auto` or `scroll`** —
  main experience and recipe overlay alike. Not "no scrollbar appeared"; there is no scroll
  container to appear in.
- Every element with a clipping overflow was checked for `scrollHeight > clientHeight`, per the
  ticket. Two classes of hit, both intended: the `.sr-only` boxes, which are 1px clips by
  construction, and `LabWatermark`'s own `overflow-hidden` wrapper — 815 against 806 at 1366×1024,
  which is the deliberate stage clip on the giant kanji, and is `hidden`, never `auto`.

### The recipe overlay fits, 54 times

Six viewports × nine drinks, each one opened through the real path — click the rail slot, click the
affordance, measure, click the close button — and each one asserted on `paper.scrollHeight <=
clientHeight`, `scrollWidth <= clientWidth`, and zero declared scrollables anywhere inside the
dialog. **54 of 54 fit.** Re-run in full after the font-size fix, because the quantity nearly
doubling changes the `材料 BUILD` column's height.

| Viewport | Panel | `--recipe-pad` | Arrangement | Render well |
| --- | --- | ---: | --- | ---: |
| 1366×1024 | 1226×884 | 56 px | wide-roomy, 3 columns | 398 px |
| 1194×834 | 1078×718 | 37 px | wide-roomy, 3 columns | 323 px |
| 1024×768 | 908×652 | 30 px | wide-roomy, 3 columns | 293 px |
| 1024×1366 | 884×1226 | 56 px | tall-roomy, 2 columns | 367 px |
| 834×1194 | 718×1078 | 37 px | tall-roomy, 2 columns | 306 px |
| 768×1024 | 652×908 | 30 px | tall-roomy, 2 columns | 272 px |

The render survives at every tablet target — the shortest panel axis is 652 px, and the
`recipe-tight` rule that drops it triggers under 600. Panel and frame land exactly where
[Layout geometry](../../../docs/design/layout-geometry.md) says: frame inset 56 px all sides at the
master (`x 56→1310`, `y 56→968`), paper at 70 px, content box `1114 × 772` from `x 126` to
`x 1240`, render well 398 px square, close button a true 44×44.

Only two things cross the panel's padding box, and both are correct:

- The tasting-note diamond at value 10, 5 px past. It is `size-[7px]` rotated 45°, so its bounding
  box is 9.9 px and it is centred on the scale's end tick — which the reference draws the same way,
  with the scale line ending at `x 1240`. It sits inside 30–56 px of panel padding.
- The `SAVED` label, 2.8 px, exactly cancelled by `untrack`'s `margin-right: -0.3em` at that size.
  This is the trailing-space compensation working, not failing.

**One doc drift, in a file this ticket did not own.** `layout-geometry.md`'s hard-constraint section
gives the 1024×768 panel content as `772 × 516`, which assumes a flat 56 px pad. `--recipe-pad`
tracks the panel's short axis now, so the real content box there is `848 × 592` — more headroom than
the constraint claims, not less.

### Safe areas: the mechanism is right, the values need a device

Verified honestly, because a desktop browser reports every inset as zero:

- `CSS.supports('padding-top', 'env(safe-area-inset-top)')` is `true`, and a probe element with
  `padding: env(safe-area-inset-top, 77px)` on all four sides computes `0px`, not `77px`. So the
  keyword is recognised and the insets are genuinely zero here — the app is not silently falling
  back.
- `viewport-fit=cover` is in the viewport meta, alongside
  `apple-mobile-web-app-status-bar-style: black-translucent`.
- The shell computes 56/56/56/56 at roomy and 44 all round at the other tablet targets. Forcing
  `--edge: 0px` on `:root` drops all four to `0px`, which is `max()` handing the decision to the
  `env()` term — the closest a desktop browser can come to watching the fallback fire.
- **Nothing downstream re-adds a fixed edge margin.** A grep over `src/` for negative margins and
  fixed insets returns exactly two things that reach past the shell's padding, and both are the
  design asking for it:
  - `LabShell`'s rail wrapper carries `port:-mb-2.5`, bleeding 10 px into the bottom padding so the
    rail's last line sits 46 px off the viewport bottom at the portrait master, per the reference.
    At the 44 px-edge portrait targets that is 34 px of clear against an iPad home-indicator band of
    about 20 px. `port` needs `width >= 700` **and** `height >= 900`, so no phone ever takes it.
  - The masthead's registration tick is `top: calc(-1 * max(var(--edge), env(safe-area-inset-top)))`
    with a matching height, which puts its top edge on viewport `y = 0` — measured 1×120 px at
    `x = 56` at the master. Under `black-translucent` that is beneath the status bar. Landscape only,
    and `land` needs `height >= 620`, so no phone takes it either. **This is the one element that
    deliberately enters the inset**, and it is on the human checklist below.
- The overlay computes its own insets the same way,
  `max(var(--recipe-margin), env(...)) + var(--recipe-frame)`, with `--recipe-margin: 0` at compact
  so a phone falls back to the safe area alone and the frame is hidden.

**One small correction made.** `LabShell` was setting `paddingInline` and `paddingBlock` from the
*left* and *top* insets and then correcting right and bottom with two longhands after them. The
computed values are right — 56/56/56/56 before and after — but only because React happens to write
the object's keys in order, so reordering them would have silently given the right edge the left
inset. It now uses the two-value shorthands the geometry doc specifies, and each edge names its own
inset.

### Type hierarchy

Measured, not eyeballed. Roomy against compact, against the design table:

| | 1366×1024 · 1024×1366 | 1194×834 · 1024×768 | Table says |
| --- | ---: | ---: | --- |
| Title | 36 px | 30.24 px | 36 / 30 |
| Quantity | 30 px | 25.2 px | 30 / 25 |
| Rail kanji, selected | 32 px | 26.88 px | 32 / 27 |
| Rail kanji, unselected | 24 px | 20.16 px | 24 / 20 |
| `--text-kanji-sm` | 16 px | 14.72 px | 16 / 15 |
| Detail, romaji | 11 px | 10.12 px | 11 / 10 |
| `MATCHA COCONUT LAB` | 10 px, `3px` | 9.2 px, `2.76px` | 10 / 9 at `0.30em` |
| Rail romaji, step numbers | 9 px, `1.62px` | 9 px, `1.62px` | 9 at `0.18em`, unscaled |

Micro-labels stay legible: nothing lands below 9 px, `--text-micro` does not scale, and the 9 px
runs keep their full `0.18em`.

**The watermark is atmospheric, and it is atmospheric by the same amount everywhere.** Ink measured
with `measureText().actualBoundingBox*` rather than off the element box, because at 450 px the two
differ by 72 px:

| Viewport | Ink | Frame | Ink ÷ frame |
| --- | ---: | ---: | ---: |
| 1366×1024 | 378 px | 492 px | 0.770 |
| 1194×834 | 308 px | 400 px | 0.770 |
| 1024×768 | 284 px | 369 px | 0.770 |
| 1024×1366 | 241 px | 594 px | 0.406 |

The ratio is constant within each orientation, because both terms track the same viewport axis —
so **the watermark does not grow relative to the composition at the smaller landscape targets**,
which was the specific thing worth checking. Portrait deliberately runs it smaller (`28svw` against
landscape's `44svh`), which is what both references show. At 14% opacity it reads as ground.

**The render frame is square at every viewport and every drink** — `width === height` to inside
0.5 px at all six, 492 / 400 / 369 / 594 / 484 / 445 px, matching the geometry doc's derived table
exactly. The `<img>` is `object-contain` on a 2048×2048 source, so it cannot become a rectangle or
crop.

Everything else lands on the reference too, at the 1366×1024 master: masthead tick 1×120 px at
`x = 56`, `MATCHA COCONUT LAB` at `x = 120` (`119` measured off the mockup), title romaji baseline
at `y = 879` (`872`), 作り方 at `x = 1035` (`1035`), `RECIPE →` at `x = 1102` (`1104`), rail column
`x 1172→1310`, kanji centres on `x = 1259`, pitch 73. And at the 1024×1366 portrait master: rule
above the rail at `y = 1233` spanning `x 56→968`, band `1233→1320`, glyph centres `y ≈ 1289`, romaji
`y 1306→1315`, rail bottom 46 px off the viewport, slots bleeding symmetrically to `x 26` and
`x 998` inside a 1024 px viewport. Portrait drops the gloss and the masthead tick, and labels every
glyph rather than only the selected one — all three per the reference.

### Rotation preserves everything, and does not reload

Selected 透 TŌ — not the opening drink — then resized through **1024×1366 → 1366×1024 → 768×1024 →
1194×834 → 834×1194** in one page session. After every step:
`performance.getEntriesByType('navigation').length` stayed **1** and a `window` sentinel set before
the first rotation survived, so nothing reloaded; selection stayed TŌ; the favourite count stayed
`04`; the shared underline stayed inside the selected slot and re-laid-out under it; the rail
flipped `column`/`row`; `--edge` and `--frame-size` tracked the variant; the frame stayed square;
and the scroll and scroll-container checks stayed clean.

**With the recipe overlay open**, 1366×1024 → 1024×1366: the dialog stayed open, the panel reflowed
1226×884 → 884×1226, still fit with no scroll, the favourite kept `aria-pressed="true"` and the
header count kept `04`, and selection was still 影 KAGE.

The underline's *animation* cannot be judged here — its `layoutId` projection freezes at
`translate3d(0, -146px, 0)` for want of a frame — but its layout box is correct underneath.

### The full loop, with real clicks

At 1366×1024 and 1024×1366, driven by synthesized pointer events rather than `element.click()`:
select 影 KAGE → open the recipe → toggle the favourite (`aria-pressed` `false` → `true`, header
`03` → `04`, `localStorage` `["to","shin","nagi"]` → `["to","shin","nagi","kage"]`) → rotate to
portrait → close → select 翠 SUI. Every step landed. `elementFromPoint` was checked at the rail, the
affordance and the stage centre, and each returns the element that should own that pixel.

Programmatically the same loop ran another 54 times across the six viewports as part of the recipe
sweep — select, open, measure, close, select the next.

### The qualitative half

It reads as a small exhibition. The four opening compositions are calm, and the calm is
load-bearing rather than accidental: one object at full colour, one character at a whisper, four
short runs of type, and a great deal of ground. Nothing is boxed, nothing is carded, there is no
panel chrome anywhere in the main view, and the only two rules on the whole surface are 1 px and
say something (registration, selection). That is what keeps it off the dashboard side of the line.

Specifically, at the master:

- **The diagonal works.** Watermark low-left, render high-right, title bottom-left, affordance
  bottom-right — the eye goes 凪 → glass → name → RECIPE without a hierarchy cue louder than size
  and opacity. Weight never rises above 300 above 11 px, and that restraint is doing more for the
  "printed catalogue" feel than any single choice.
- **The render carries all the colour and is the right size doing it.** 492 px against a 450 px
  watermark and a 36 px title is a comfortable spread; the glass is the only saturated thing on
  screen and it does not have to shout to win.
- **The rail now reads.** With the sizes restored, 凪 at 32 px against its neighbours at 24 px and
  46% opacity is legible as *selection* from across the room, and the accent tick and the rotated
  9 px NAGI are confirmation rather than the whole signal. Before the fix the rail was a column of
  nine identical grey glyphs with a tiny blue dash — the flattest thing on the screen, and the one
  place a menu has to feel navigable.
- **Portrait is the more generous of the two** and better for it: the render at 594 px is the whole
  upper composition, the watermark tucks behind its top third, and the nine labelled glyphs along
  the bottom read exactly like a café menu's row of options.
- **1194×834 and 1024×768 hold the same proportions**, which is why they still feel like the same
  object rather than a squeezed copy — the type gives up 16%, the micro-labels give up almost
  nothing, and the watermark-to-frame ratio is identical to three decimal places.
- **The recipe panel reads as a specification card**, which is right: micro-label above a large
  light quantity is the inverse of a normal recipe and is the reason the `材料 BUILD` column reads
  as a spec rather than a shopping list. The five axis rows with the accent diamond on the drink's
  leading axis are the most information-dense thing in the app and still quiet.

Two things a human should settle, named precisely rather than adjusted:

1. **The portrait recipe's column rule outruns its columns** — 316 px of bare hairline at the
   portrait master, 57% of its own length; 46% at 834×1194, 23% at 768×1024. Landscape has the same
   slack (124 px, 20% of the body grid) but turns the rule horizontal, so nothing draws it. There is
   no portrait recipe reference to settle it against. → [16](./16-portrait-recipe-rule.md).
2. **The render frame's empty state has never been seen in anger.** `LabRender` swaps the dashed
   frame out on `img.complete` in the ref callback, so on a warm cache it never appears — but at
   302–625 KB per image on a cold cellular launch it will, for a while, and it is the only piece of
   the composition nobody has looked at on a real network. Its box is right (dashed
   `--color-hairline-field`, 20 px `Picture`, 11 px caption, correct tone on paper); whether it
   feels like part of the exhibition or like a broken image is a device question.

Nothing was found that was off by a few pixels and worth silently nudging. The geometry is on the
references everywhere it was checked, which is what made the 16 px type stand out.

### Performance, as far as it can honestly be taken here

**Frame budget, from `matcha-field.tsx`.** The field imposes four limits on itself and all four are
real:

- `FRAME_INTERVAL_SECONDS = 1/12` — it refuses to redraw more than 12 times a second. The drift
  crosses the screen in about four minutes, so this is invisible.
- `MAX_PIXEL_RATIO = 2` — the backing store never exceeds 2×, sized inside the frame loop rather
  than by a `ResizeObserver`, so rotation self-heals.
- It returns early while `document.hidden`, after taking the first frame regardless so a
  backgrounded tab comes forward already painted.
- Under `prefers-reduced-motion` it freezes `time` at 0 and stops redrawing entirely except on
  resize — the field stays, the drift stops.

Per drawn frame at 1366×1024 and DPR 2 that is 2732×2048 = 5.6 Mpx through one full-screen triangle
with a 12-byte uniform: two `perlin2d.sample` calls and one `randf.sample` per pixel, no render
targets, no readback, no per-frame allocation. About 67 Mpx/s of fragment work at the 12 fps cap.

**Payload.** `.output/` holds the last committed build (`4e225ba`) and is stale — it predates
today's edits and its webps are a superseded, smaller set — but the JS structure is current:

| | Raw | gzip |
| --- | ---: | ---: |
| `index-*.js` | 313,854 | 99,600 |
| `routes-*.js` | 583,193 | 166,941 |
| `motion-*.js` | 8,111 | 3,151 |
| `styles-*.css` | 31,903 | — |
| Two woff2 subsets | 28,636 | (already compressed) |

All three JS chunks are `modulepreload`ed from `index.html`, so roughly **270 KB gzipped of JS is on
the critical path**. The prototype route is split out and costs 496 bytes gzipped, so
`/prototypes/motion` is not riding along.

**Images are the real weight, and that became [15](./15-render-payload.md).** A cold load fetches
three of the nine — the selected drink plus the two `neighbourRenders` warms — which on the opening
view is 1,471,778 bytes to show one 492 px square. All nine are 2048×2048 and total 3.9 MB, against
a frame that never exceeds 594 px CSS.

**Not measurable here, and not guessed at:** frame rate, battery, and time to first meaningful
paint. No rAF frames means no paint entries, no advancing springs, and no shader. All three are on
the human list.

### Files changed

- `src/lib/utils.ts` — `cn()` now extends tailwind-merge with the app's font-size class group. This
  is the one change in this pass that alters what renders, and it restores what the components
  already asked for.
- `src/screens/lab/lab.shell.tsx` — two-value padding shorthands, so each edge names its own
  safe-area inset. Computed values unchanged.

`bun run typecheck` clean, `bun test` 20 pass / 0 fail, both after the changes.

### For a human, on the device

Everything below needs an installed home-screen app on a 12.9" iPad, which is what
[Pick a host](./14-pick-a-host.md) unblocks. Numbered so they can be ticked off.

1. **Safe-area values.** Rotate through all four orientations in standalone. The composition should
   never touch the home indicator or run under a rounded corner. Watch specifically for the two
   places that deliberately approach the inset: the rail's last line, which should sit ~46 px off
   the bottom in portrait, and the masthead's 1 px accent tick, which by design runs to the physical
   top of the viewport and will therefore pass behind the status bar in landscape. Confirm it does
   not read as a glitch next to the clock. If it does, the fix is to clamp its top to the safe area
   rather than to zero.
2. **The drink-change transition.** This is the one thing the calibration ticket signed off that
   nobody has since seen in the real app. Six layers should move in order — title, romaji,
   ingredient line, render, rail, watermark — each 40 ms behind the last, each rising 4 px out of a
   2 px defocus, and the watermark travelling 9 px over a full second at 4 px of blur, settling
   last. If the watermark arrives with the rest, the stagger is not reaching it. Compare against
   `/prototypes/motion`, candidate B.
3. **The rail underline.** It must *slide* between slots as one element, not fade out and in. Jump
   01 → 09 and confirm it takes the same time as 01 → 02.
4. **The favourite toggle.** The one deliberately louder moment: scale overshoot under 1.15×, the
   accent arriving a beat before the fill, under 400 ms total. Confirm it reads as tactile rather
   than as a bug.
5. **`prefers-reduced-motion`.** Turn it on from Control Centre *while the app is open* — it is
   wired to `useSyncExternalStore`, so it should take effect without a relaunch. The drink change
   should collapse to a 120 ms cross-fade with no travel and no blur, the field should stop drifting
   and hold, and every state change should still be visible. "No feedback" is a failure here.
6. **The field, at 12 fps.** Look for banding or stepping in the drift; at ±3/255 over four minutes
   it should be invisible unless looked for. Then confirm it stops: background the app for a minute
   and bring it back, and it should already be painted rather than flashing flat green.
7. **Battery over ten minutes idle.** Leave the app open and untouched on a full charge with the
   screen at a fixed brightness, and check Settings → Battery for the app's share. The field is the
   only thing running; if ten idle minutes costs more than a percent or two, the 12 fps cap or the
   2× pixel-ratio ceiling is not doing its job, and the next thing to try is dropping to 8 fps.
8. **Time to first meaningful paint, from a cold cache.** Force-quit, clear Safari's cache, relaunch
   from the home screen. The first frame must be flat `#7B8F63` — never white — then the fonts, then
   the render. Time it to the render appearing, and note whether the dashed empty frame is visible
   in between and for how long. That number is the input to [15](./15-render-payload.md).
9. **Touch targets, by finger rather than by measurement.** Every rail slot is the full band —
   116×60 or 138×73 in landscape, 108×86 in portrait — and the close button is a true 44×44. Confirm
   the outermost rail slots are comfortable near the bezel, and that a swipe across the stage
   changes the drink without the rail eating it.
10. **The two taste calls**, [16](./16-portrait-recipe-rule.md) and the cold-load empty frame in the
    qualitative section above.

## Question

The polish pass. Everything is built; this is where it becomes *finished*.

Drive the app in the browser at all four target viewports — 1366×1024, 1194×834, 1024×1366, 1024×768 — and at each one verify, with screenshots rather than assumption:

- No vertical scroll anywhere in the main experience. No nested scroll containers.
- The recipe overlay fits without scrolling at every size.
- Safe-area insets are respected; nothing collides with a home indicator or camera housing.
- Type hierarchy holds — micro-labels stay legible, the watermark kanji stays atmospheric rather than dominant, the render frame stays square.
- Rotation preserves selection and does not reload.
- The full loop works end to end at every size: select → view → open recipe → close → select another.

Then the qualitative pass, which is the actual point: does it feel **calm, spacious, minimal, elegant, tactile, slightly playful, visually distinctive**? Does it read as a digital café menu and a small exhibition rather than a dashboard? Where it does not, fix it — this ticket has licence to adjust spacing, scale and timing across the app.

Also here: a performance sanity check with the field shader running — frame rate, battery behaviour, and time to first meaningful paint on a cold load.

Anything found that is too large to fix in this pass becomes a new ticket rather than a compromise.
