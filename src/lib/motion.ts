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

import { useSyncExternalStore } from 'react'

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
  /** Blur radius, in px, at the far end of the dissolve. `0` means no defocus. */
  readonly blur: number
  /** The watermark defocuses further, for the same reason it travels further. */
  readonly watermarkBlur: number
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
 * **Candidate B, "a whisper of travel", plus a slight defocus.** Picked by the human at
 * 1366×1024 with all four candidates responding to one trigger — ticket 09.
 *
 * Four pixels of rise is enough to feel a direction and not enough to see one. The blur was
 * added on top of B by the same call: two pixels at the far end of the dissolve, which reads as
 * the layer settling into focus rather than as an effect. It is not in the prototype's original
 * four because it was asked for after they were judged; the candidates carry it now so the
 * instrument still matches what shipped.
 */
export const MOTION: MotionTokens = {
  stagger: 0.04,
  layer: { visualDuration: 0.38, bounce: 0 },
  watermark: { visualDuration: 1, bounce: 0 },
  drift: 4,
  watermarkDrift: 9,
  blur: 2,
  watermarkBlur: 4,
}

/**
 * What `prefers-reduced-motion` collapses the transition to.
 *
 * Not "no feedback" — every state change still reads, it just stops travelling. One short
 * cross-fade, no stagger, no movement, no defocus.
 */
export const MOTION_REDUCED: MotionTokens = {
  stagger: 0,
  layer: { visualDuration: 0.12, bounce: 0 },
  watermark: { visualDuration: 0.12, bounce: 0 },
  drift: 0,
  watermarkDrift: 0,
  blur: 0,
  watermarkBlur: 0,
}

/**
 * A single step along the rail and a jump of several get the **same** transition.
 *
 * Settled while watching the prototype: scaling the stagger by distance makes a jump from 01 to
 * 09 feel like a different, heavier interaction than a jump from 01 to 02, and the collection is
 * nine peers rather than a timeline. One response to one change.
 */
export const MOTION_DISTANCE_SCALES = false

/** The spring a given layer dissolves on. Only the watermark has its own. */
export function layerSpring(layer: MotionLayer, tokens: MotionTokens): SpringToken {
  return layer === 'watermark' ? tokens.watermark : tokens.layer
}

/** How far a given layer travels and defocuses. Only the watermark has its own. */
export function layerDistance(
  layer: MotionLayer,
  tokens: MotionTokens,
): { drift: number; blur: number } {
  return layer === 'watermark'
    ? { drift: tokens.watermarkDrift, blur: tokens.watermarkBlur }
    : { drift: tokens.drift, blur: tokens.blur }
}

export type DissolveVariants = {
  initial: { opacity: number; y: number; filter: string }
  animate: { opacity: number; y: number; filter: string }
  exit: { opacity: number; y: number; filter: string }
  transition: {
    type: 'spring'
    visualDuration: number
    bounce: number
    delay: number
  }
}

/**
 * The whole transition for one layer, as props for a `motion` element inside `AnimatePresence`.
 *
 * The incoming layer rises from below and the outgoing one leaves upward, so the two never
 * travel in the same direction — that is what makes 4px legible as a direction at all.
 *
 * `filter` is animated rather than a wrapper's `backdrop-filter`: `opacity`, `transform` and
 * `filter` are the three properties this design is allowed to animate, and all three composite
 * without touching layout.
 */
export function dissolve(layer: MotionLayer, tokens: MotionTokens): DissolveVariants {
  const spring = layerSpring(layer, tokens)
  const { drift, blur } = layerDistance(layer, tokens)
  const away = blur > 0 ? `blur(${blur}px)` : 'blur(0px)'

  return {
    initial: { opacity: 0, y: drift, filter: away },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -drift, filter: away },
    transition: {
      type: 'spring',
      visualDuration: spring.visualDuration,
      bounce: spring.bounce,
      delay: layerDelay(layer, tokens),
    },
  }
}

/**
 * The overlay's own open/close, which is not a dissolve — one panel arriving, not six layers
 * trading places. It borrows the layer spring so it sits in the same family, and it gets no
 * stagger and no defocus: a panel that arrives out of focus reads as a lightbox.
 */
export function panelTransition(tokens: MotionTokens) {
  return {
    type: 'spring' as const,
    visualDuration: tokens.layer.visualDuration,
    bounce: tokens.layer.bounce,
  }
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function readReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(REDUCED_QUERY).matches
}

/**
 * The tokens in force right now.
 *
 * A hook rather than a module constant because `prefers-reduced-motion` can change while the app
 * is open — iPadOS flips it from Control Centre without reloading the page — and a home-screen
 * app is never reloaded.
 *
 * `useSyncExternalStore` with a server snapshot of `false`: the SSR shell is a still frame, so
 * full motion is the correct thing to hydrate against either way.
 */
export function useMotionTokens(): MotionTokens {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    () => false,
  )
  return reduced ? MOTION_REDUCED : MOTION
}
