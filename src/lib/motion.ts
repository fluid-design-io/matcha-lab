/**
 * The single source for the drink-change transition: a staggered dissolve where every layer
 * cross-fades on a spring lagging the one before it, the watermark last and slowest.
 */

import { useSyncExternalStore } from 'react'

type SpringToken = {
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
  /** How far a swipe carries the layer it moved, in px, along the axis the finger ran. */
  readonly carry: number
  /** Blur radius, in px, at the far end of the dissolve. `0` means no defocus. */
  readonly blur: number
  /** The watermark defocuses further, for the same reason it travels further. */
  readonly watermarkBlur: number
}

/**
 * Front to back. Each layer's delay is its index times `stagger`, which is what produces the sense
 * of depth: the things nearest the reader move first, the atmosphere moves last.
 */
const MOTION_LAYERS = [
  'title',
  'romaji',
  'detail',
  'render',
  'rail',
  'watermark',
] as const

export type MotionLayer = (typeof MOTION_LAYERS)[number]

/** Which way the finger moves to change drinks. It follows the rail, so a rail column swipes `y`. */
export type SwipeAxis = 'x' | 'y'

/** A committed swipe: the axis it ran along, and `1` forward through the collection or `-1` back. */
export type SwipeCarry = {
  readonly axis: SwipeAxis
  readonly direction: -1 | 1
}

/**
 * Tokens are a required argument and both token objects are module-private, so every caller
 * reaches them through `useMotionTokens()` and its `prefers-reduced-motion` handling.
 */
export function layerDelay(layer: MotionLayer, tokens: MotionTokens): number {
  return MOTION_LAYERS.indexOf(layer) * tokens.stagger
}

/**
 * Calibrated by a human at 1366×1024 against four candidates: a whisper of travel plus a slight
 * defocus. Four pixels of rise is enough to feel a direction and not enough to see one.
 */
const MOTION: MotionTokens = {
  stagger: 0.04,
  layer: { visualDuration: 0.38, bounce: 0 },
  watermark: { visualDuration: 2, bounce: 0 },
  drift: 4,
  watermarkDrift: 8,
  carry: 48,
  blur: 2,
  watermarkBlur: 12,
}

/**
 * What `prefers-reduced-motion` collapses the transition to: one short cross-fade, no stagger, no
 * movement, no defocus. Not "no feedback" — every state change still reads, it just stops
 * travelling.
 */
const MOTION_REDUCED: MotionTokens = {
  stagger: 0,
  layer: { visualDuration: 0.12, bounce: 0 },
  watermark: { visualDuration: 0.12, bounce: 0 },
  drift: 0,
  watermarkDrift: 0,
  carry: 0,
  blur: 0,
  watermarkBlur: 0,
}

/** The spring a given layer dissolves on. Only the watermark has its own. */
function layerSpring(layer: MotionLayer, tokens: MotionTokens): SpringToken {
  return layer === 'watermark' ? tokens.watermark : tokens.layer
}

/** How far a given layer travels and defocuses. Only the watermark has its own. */
function layerDistance(
  layer: MotionLayer,
  tokens: MotionTokens,
): { drift: number; blur: number } {
  return layer === 'watermark'
    ? { drift: tokens.watermarkDrift, blur: tokens.watermarkBlur }
    : { drift: tokens.drift, blur: tokens.blur }
}

type DissolveState = { opacity: number; x: number; y: number; filter: string }

export type DissolveVariants = {
  initial: DissolveState
  animate: DissolveState
  exit: DissolveState
  transition: {
    type: 'spring'
    visualDuration: number
    bounce: number
    delay: number
  }
}

/**
 * Where the arriving copy of a layer starts and where the leaving one ends. A swipe replaces the
 * rise with `carry` along the axis the finger ran.
 */
function travel(drift: number, tokens: MotionTokens, swipe: SwipeCarry | null) {
  if (!swipe) return { from: { x: 0, y: drift }, to: { x: 0, y: -drift } }

  const carry = tokens.carry * swipe.direction
  return swipe.axis === 'x'
    ? { from: { x: carry, y: 0 }, to: { x: -carry, y: 0 } }
    : { from: { x: 0, y: carry }, to: { x: 0, y: -carry } }
}

/**
 * The whole transition for one layer, as props for a `motion` element inside `AnimatePresence`.
 * The incoming layer rises from below and the outgoing one leaves upward, which is what makes 4px
 * legible as a direction at all; pass `swipe` and the layer travels the way the finger sent it
 * instead, its replacement arriving from the other side.
 */
export function dissolve(
  layer: MotionLayer,
  tokens: MotionTokens,
  swipe: SwipeCarry | null = null,
): DissolveVariants {
  const spring = layerSpring(layer, tokens)
  const { drift, blur } = layerDistance(layer, tokens)
  const away = blur > 0 ? `blur(${blur}px)` : 'blur(0px)'
  const { from, to } = travel(drift, tokens, swipe)

  return {
    initial: { opacity: 0, x: from.x, y: from.y, filter: away },
    animate: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: to.x, y: to.y, filter: away },
    transition: {
      type: 'spring',
      visualDuration: spring.visualDuration,
      bounce: spring.bounce,
      delay: layerDelay(layer, tokens),
    },
  }
}

/**
 * The overlay's own open/close — one panel arriving, not six layers trading places. It borrows the
 * layer spring to stay in the family, with no stagger and no defocus.
 */
export function panelTransition(tokens: MotionTokens) {
  return {
    type: 'spring' as const,
    visualDuration: tokens.layer.visualDuration,
    bounce: tokens.layer.bounce,
  }
}

/**
 * The spring the render frame's lean returns on after a committed swipe, replacing Motion's own
 * snap-back so the frame and the two dissolving copies inside it move as one.
 */
export function carryTransition(tokens: MotionTokens) {
  return {
    type: 'spring' as const,
    visualDuration: tokens.layer.visualDuration,
    bounce: tokens.layer.bounce,
    delay: layerDelay('render', tokens),
  }
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** The live setting, for non-React consumers and as `useMotionTokens`' snapshot source. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(REDUCED_QUERY).matches
}

/**
 * The tokens in force right now, as a hook because the setting can change while the app is open —
 * iPadOS flips it from Control Centre, and a home-screen app is never reloaded. The server
 * snapshot is `false`, since the SSR shell is a still frame either way.
 */
export function useMotionTokens(): MotionTokens {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  )
  return reduced ? MOTION_REDUCED : MOTION
}
