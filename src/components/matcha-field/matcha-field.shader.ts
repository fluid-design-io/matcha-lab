import tgpu, { d } from 'typegpu'
import { perlin2d, randf } from '@typegpu/noise'

/**
 * The field shader.
 *
 * Renders `#7B8F63` as a living surface: slow value-noise drift plus a fine paper grain. It draws
 * the *ground* and nothing else — no drink imagery, no refraction, no distortion pass.
 *
 * The governing rule is from DESIGN-TASTE.md: if a viewer can see it moving without looking for
 * it, it is too strong. Every amplitude below is deliberately at the edge of perception, and
 * every one of them is easier to over-tune than to under-tune.
 */

export const FieldUniforms = d.struct({
  resolution: d.vec2f,
  /** Seconds. Frozen under `prefers-reduced-motion` — the field stays, the drift stops. */
  time: d.f32,
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
 * How far the drift moves the ground, as a fraction of full scale. 0.013 is roughly ±3/255 —
 * measured off the reference mockups, whose own noise spans about ±4/255.
 */
const DRIFT_AMPLITUDE = 0.013

/**
 * The drift is very slightly warm on its light side, which keeps it from reading as a flat
 * brightness knob. Barely measurable; entirely felt.
 */
const DRIFT_TINT = d.vec3f(1, 0.96, 0.88)

/** Grain is quieter than drift — it is texture, not movement. About ±1.4/255. */
const GRAIN_AMPLITUDE = 0.011

export const fieldFragment = tgpu.fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})(({ uv }) => {
  'use gpu'

  const time = fieldLayout.$.field.time
  const resolution = fieldLayout.$.field.resolution

  // Aspect-correct the sample space, so the drift pattern does not stretch when the iPad rotates.
  const p = uv.mul(d.vec2f(resolution.x / resolution.y, 1))

  // Two octaves travelling in different directions at mismatched speeds, so the pattern never
  // settles into a visible repeat. The speeds are ~0.005 units/second: at this frequency a
  // feature crosses the screen in something like four minutes.
  const coarse = perlin2d.sample(p.mul(2.1).add(d.vec2f(time * 0.0065, time * -0.0042)))
  const fine = perlin2d.sample(p.mul(5.3).add(d.vec2f(time * -0.0091, time * 0.0053)))
  const drift = coarse * 0.68 + fine * 0.32

  // Grain is a function of the pixel and nothing else — no time term anywhere. Animated grain
  // reads as television static at any amplitude; static grain reads as paper.
  randf.seed2(uv.mul(resolution).mul(0.001))
  const grain = randf.sample() - d.f32(0.5)

  const shade = DRIFT_TINT.mul(drift * DRIFT_AMPLITUDE).add(d.vec3f(grain * GRAIN_AMPLITUDE))

  return d.vec4f(FIELD.add(shade), 1)
})
