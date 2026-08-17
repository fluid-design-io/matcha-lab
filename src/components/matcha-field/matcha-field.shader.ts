import tgpu, { d, std } from 'typegpu'
import { perlin2d, randf } from '@typegpu/noise'

/**
 * The field shader.
 *
 * Renders `#7B8F63` as a living surface: slow value-noise drift plus a fine paper grain. It draws
 * the *ground* and nothing else — no drink imagery, no refraction, no distortion pass.
 *
 * The governing rule is from DESIGN-TASTE.md: if a viewer can see it *moving* without looking for
 * it, it is too strong. That rule is about motion, and it was previously being applied to the
 * spatial amplitude too, which left the surface reading as a flat fill — the effect was
 * indistinguishable from the `body` colour it sits on. So the two are now tuned separately: the
 * ground is mottled clearly enough to be seen standing still, and the drift through it stays slow
 * enough that you have to watch for it.
 */

export const FieldUniforms = d.struct({
  resolution: d.vec2f,
  /** Seconds. Frozen under `prefers-reduced-motion` — the field stays, the drift stops. */
  time: d.f32,
  /**
   * Device pixels per CSS pixel. The grain is sized in CSS pixels, so it has to be undone here —
   * see `GRAIN_AMPLITUDE`.
   */
  pixelRatio: d.f32,
})

export const fieldLayout = tgpu.bindGroupLayout({
  field: { uniform: FieldUniforms },
})

/**
 * `#7B8F63` as raw 0–1 components.
 *
 * The canvas format is `bgra8unorm`, not `-srgb`, so what is written is what is displayed — no
 * gamma conversion, and this matches the flat colour `body` is already painting underneath.
 */
const FIELD = d.vec3f(123 / 255, 143 / 255, 99 / 255)

/**
 * How far the drift moves the ground, as a fraction of full scale.
 *
 * `13/255` is the distance from `--color-field` (`#7B8F63`) to `--color-field-deep` (`#6E8156`) —
 * the token DESIGN-TASTE.md reserves for this shader and the scrim, and which this shader was
 * previously not using at all. The drift's shaded extreme lands on it; the lit extreme is the
 * mirror image. Peak-to-peak that is ~26/255 across the surface, so the mottling is legible
 * without being a gradient you could name.
 *
 * The reference mockups' own noise spans about ±4/255, but they are flat PNGs of a *photographed*
 * surface — their grain is doing work that a 26/255 swing has to do here across a whole viewport.
 */
const DRIFT_SPAN = 13 / 255

/**
 * Maps the realistic range of the two summed octaves onto ±1 so the extremes actually reach
 * `DRIFT_SPAN`. 2D Perlin is nominally `[-1, 1]` but practically peaks near ±0.7, and the 0.68/0.32
 * octave mix pulls that down further — without this the span would only ever be half-used. Values
 * past ±0.5 clamp, which costs the rare peak its last sliver of range and is invisible on a
 * gradient this slow.
 */
const DRIFT_GAIN = 2

/**
 * The drift is very slightly warm on its light side, which keeps it from reading as a flat
 * brightness knob. It also happens to aim the shaded end almost exactly at the token: the dark
 * extreme composites to `(110, 130, 87)` against `--color-field-deep`'s `(110, 129, 86)`.
 */
const DRIFT_TINT = d.vec3f(1, 0.96, 0.88)

/**
 * Grain is quieter than drift — it is texture, not movement. `randf.sample()` is centred to ±0.5,
 * so this is about ±3/255 per grain cell, and a cell is one *CSS* pixel. Seeding per device pixel
 * (which is what this did before) puts the grain at 2x frequency on any retina display, where it
 * averages out to nothing at arm's length — the single biggest reason the surface read as flat.
 */
const GRAIN_AMPLITUDE = 0.024

export const fieldFragment = tgpu.fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})(({ uv }) => {
  'use gpu'

  const time = fieldLayout.$.field.time
  const resolution = fieldLayout.$.field.resolution
  const pixelRatio = fieldLayout.$.field.pixelRatio

  // Aspect-correct the sample space, so the drift pattern does not stretch when the iPad rotates.
  const p = uv.mul(d.vec2f(resolution.x / resolution.y, 1))

  // Two octaves travelling in different directions at mismatched speeds, so the pattern never
  // settles into a visible repeat. At ~0.01 units/second a feature crosses the screen in about two
  // minutes. This is the knob to reach for first if the field ever reads as busy — the amplitude
  // above is what makes the surface visible, the speed is what could make it distracting.
  const coarse = perlin2d.sample(p.mul(2.1).add(d.vec2f(time * 0.013, time * -0.0084)))
  const fine = perlin2d.sample(p.mul(5.3).add(d.vec2f(time * -0.018, time * 0.011)))
  const drift = std.clamp((coarse * 0.68 + fine * 0.32) * DRIFT_GAIN, -1, 1)

  // Grain is a function of the pixel and nothing else — no time term anywhere. Animated grain
  // reads as television static at any amplitude; static grain reads as paper. Flooring to CSS
  // pixels makes one grain cell cover the 2x2 device pixels it should on a retina display.
  randf.seed2(std.floor(uv.mul(resolution).div(pixelRatio)).mul(0.001))
  const grain = randf.sample() - d.f32(0.5)

  const shade = DRIFT_TINT.mul(drift * DRIFT_SPAN).add(d.vec3f(grain * GRAIN_AMPLITUDE))

  return d.vec4f(FIELD.add(shade), 1)
})
