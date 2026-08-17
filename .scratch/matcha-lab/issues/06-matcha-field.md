# The living matcha field

Type: task
Status: resolved
Blocked by: 01, 02

## Answer

`src/components/matcha-field/` — `matcha-field.shader.ts` (the fragment function and its uniform)
and `matcha-field.tsx` (canvas, GPU lifecycle, frame budget). Full-bleed at `z-0` behind
everything; it draws the ground and nothing else.

**Two noise terms, and the difference between them is the whole trick.**

- *Drift* is two Perlin octaves at 2.1 and 5.3 cycles, travelling in different directions at
  mismatched speeds (~0.005 units/s) so the pattern never settles into a visible repeat. A feature
  takes about four minutes to cross the screen.
- *Grain* is a function of the pixel and **nothing else** — no time term anywhere. This is the
  part that is easy to get wrong: animated grain reads as television static at any amplitude,
  while static grain reads as paper. Sample space is aspect-corrected so neither stretches when
  the iPad rotates.

`@typegpu/noise`'s `perlin2d` and `randf`, not hand-rolled hashes.

**Verified numerically rather than by eye.** The in-app browser pane reports `document.hidden`
permanently and does not composite a WebGPU canvas, so a screenshot proves nothing. Rendering the
same pipeline into an offscreen texture and reading it back is both available and stronger
evidence — it measures the shader instead of the compositor:

| | measured | target |
| --- | --- | --- |
| mean R / G / B | 123.19 / 143.18 / 99.16 | 123 / 143 / 99 (`#7B8F63`) |
| spread | ±3/255 | reference mockups' own noise is ±4/255 |
| change over 60 s | 0.39/255 mean, 2/255 max | it should breathe, not animate |

It lands exactly on the field colour, and it moves half a level of 255 in a minute. That is the
brief: *if a viewer can see it moving without looking for it, it is too strong.*

**A real bug found and fixed:** the canvas was at `-z-10`. `body` carries the flat `#7B8F63` for
first paint and does not establish a stacking context, so a negative-z-index child is hoisted into
the root's stacking context and painted **before** body's background — which then covers it. The
field rendered perfectly and was invisible. It sits at `z-0` now, with the shell at `z-10`.

**Cost.** 12 fps, because the drift takes four minutes to cross the screen and this runs
continuously on battery behind everything; device pixel ratio capped at 2, since the iPad is a 2x
display and there is nothing finer for extra pixels to resolve on a slow gradient. Rendering stops
when the document is hidden — but the *first* frame always draws, even hidden, so a tab that loads
in the background and is then brought forward is already painted rather than showing bare body
colour until the next animation frame.

`prefers-reduced-motion` keeps the field and stops the drift: time freezes at zero and the loop
draws only on resize, rather than re-rendering an identical image forever.

`autoResize` is off and the backing store is sized in the frame loop instead — one owner, a capped
ratio, and it self-heals on rotation without depending on a `ResizeObserver` delivering a
`contentBoxSize`, which not every engine does.

**Still to confirm:** that the canvas composites on a real, visible browser. It could not be
checked here (headless pane, and the Chrome extension is not connected). Carried into
[Viewport verification pass](./13-viewport-pass.md).

## Question

Render the `#7B8F63` ground as a living surface with TypeGPU — the one shader-drawn thing in the app, full-bleed behind everything.

Consult the `typegpu` skill first. `typegpu`, `@typegpu/noise`, `@typegpu/color` and `@typegpu/react` are already installed, and `unplugin-typegpu` is already wired into `vite.config.ts`.

- Slow value-noise drift plus a fine paper grain. The field should breathe, not animate. If a viewer can *see* it moving without looking for it, it is too strong.
- No WebGPU fallback — iPadOS 26+ and modern browsers only. Body already paints flat `#7B8F63`, so the canvas fading in over it covers first paint.
- Honour `prefers-reduced-motion`: keep the field, stop the drift.
- This renders the *field only*. It does not touch the drink imagery, and there is no refraction or distortion pass.

Watch the cost — this runs continuously on battery. Cap the frame rate if a lower one is indistinguishable, and stop rendering entirely when the document is hidden.
