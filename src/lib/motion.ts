/**
 * Motion tokens for the drink-change transition.
 *
 * The shape is settled: a **staggered dissolve**. Every layer cross-fades on a spring, each one
 * lagging the one before it, with the giant watermark kanji moving last and slowest — depth
 * without 3D.
 *
 * The numbers are ticket 09's, chosen by a human at 1366×1024 from four candidates side by side.
 * The prototype that produced them is at `/prototypes/motion`.
 */

export type SpringToken = {
  /** Seconds to visually reach the target. The bouncy part, if any, happens after. */
  readonly visualDuration: number
  /** 0 is no bounce, 1 is extremely bouncy. This design lives at or near 0. */
  readonly bounce: number
}

export type MotionTokens = {
  /** Delay added per layer, in seconds, in `MOTION_LAYERS` order. */
  readonly stagger: number
  /** The spring every dissolving layer uses. */
  readonly layer: SpringToken
  /** The watermark's own, slower spring. */
  readonly watermark: SpringToken
  /** How far a layer travels, in px. `0` means opacity only. */
  readonly drift: number
  /** The watermark travels further, because it is furthest away. */
  readonly watermarkDrift: number
}

/**
 * Front to back. Each layer's delay is its index times `stagger`, which is what produces the
 * sense of depth: the things nearest the reader move first, the atmosphere moves last.
 */
export const MOTION_LAYERS = [
  'title',
  'romaji',
  'detail',
  'render',
  'rail',
  'watermark',
] as const

export type MotionLayer = (typeof MOTION_LAYERS)[number]

export function layerDelay(layer: MotionLayer, tokens: MotionTokens = MOTION): number {
  return MOTION_LAYERS.indexOf(layer) * tokens.stagger
}

/**
 * CALIBRATION PENDING — ticket 09.
 *
 * Candidate C until a human picks. Do not ship a transition that has not come out of that
 * prototype; when it lands, replace this and delete the note.
 */
export const MOTION: MotionTokens = {
  stagger: 0.05,
  layer: { visualDuration: 0.42, bounce: 0 },
  watermark: { visualDuration: 1.1, bounce: 0 },
  drift: 6,
  watermarkDrift: 14,
}

/**
 * What `prefers-reduced-motion` collapses the transition to.
 *
 * Not "no feedback" — every state change still reads, it just stops travelling. One short
 * cross-fade, no stagger, no movement.
 */
export const MOTION_REDUCED: MotionTokens = {
  stagger: 0,
  layer: { visualDuration: 0.12, bounce: 0 },
  watermark: { visualDuration: 0.12, bounce: 0 },
  drift: 0,
  watermarkDrift: 0,
}
