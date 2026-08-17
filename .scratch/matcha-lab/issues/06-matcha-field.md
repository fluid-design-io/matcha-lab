# The living matcha field

Type: task
Status: open
Blocked by: 01, 02

## Question

Render the `#7B8F63` ground as a living surface with TypeGPU — the one shader-drawn thing in the app, full-bleed behind everything.

Consult the `typegpu` skill first. `typegpu`, `@typegpu/noise`, `@typegpu/color` and `@typegpu/react` are already installed, and `unplugin-typegpu` is already wired into `vite.config.ts`.

- Slow value-noise drift plus a fine paper grain. The field should breathe, not animate. If a viewer can *see* it moving without looking for it, it is too strong.
- No WebGPU fallback — iPadOS 26+ and modern browsers only. Body already paints flat `#7B8F63`, so the canvas fading in over it covers first paint.
- Honour `prefers-reduced-motion`: keep the field, stop the drift.
- This renders the *field only*. It does not touch the drink imagery, and there is no refraction or distortion pass.

Watch the cost — this runs continuously on battery. Cap the frame rate if a lower one is indistinguishable, and stop rendering entirely when the document is hidden.
