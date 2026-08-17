import { useCallback, useSyncExternalStore } from 'react'
import { animate, useMotionValue, type MotionValue, type PanInfo } from 'motion/react'

import { DRINKS, getDrinkIndex } from '#/domain/drinks'
import { carryTransition, useMotionTokens, type SwipeAxis, type SwipeCarry } from '#/lib/motion'

import { useLab } from './lab.context'

/** Finger travel, in px, that commits to the neighbouring drink on release. */
const COMMIT_DISTANCE = 64

/**
 * How much of a flick's velocity (px/s) counts towards that distance. A fast 30px flick should
 * commit; a slow 60px drag that stops dead should not.
 */
const VELOCITY_WEIGHT = 0.12

/**
 * How much of the finger's travel the render follows. At 0.2 a 200px swipe slides it 40px — enough
 * to feel the drink being pushed aside, nowhere near enough to read as a carousel.
 */
const YIELD = 0.2

/**
 * The same at the ends, where `step` clamps and nothing will happen. A quarter of the give says
 * "held" while the finger is still down, so a dead swipe reads as an edge, not a dropped input.
 */
const YIELD_AT_END = 0.05

/**
 * The shell's landscape arrangement, mirrored from the `land` variant in `styles.css`. The two must
 * stay in step: the swipe follows the rail, and the rail is a column only here.
 */
const LANDSCAPE_QUERY = '(min-aspect-ratio: 1/1) and (min-width: 900px) and (min-height: 620px)'

/**
 * What a released swipe means: `1` forward, `-1` back, `0` nothing. Distance and velocity are
 * summed rather than checked separately, so a long slow drag and a short fast flick both commit
 * while a long drag that stops dead does not.
 */
export function swipeStep(offset: number, velocity: number): -1 | 0 | 1 {
  const travel = offset + velocity * VELOCITY_WEIGHT
  if (travel <= -COMMIT_DISTANCE) return 1
  if (travel >= COMMIT_DISTANCE) return -1
  return 0
}

function subscribeLandscape(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const query = window.matchMedia(LANDSCAPE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function isLandscape(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(LANDSCAPE_QUERY).matches
}

export type DrinkSwipe = {
  /** The axis the gesture runs on, for whatever has to be bound to one. */
  readonly axis: SwipeAxis
  /** How far the render leans out of place, in px along `axis`, while the finger is down. */
  readonly lean: MotionValue<number>
  /** Spread onto the `motion` element that receives the gesture. */
  readonly surface: {
    readonly drag: SwipeAxis
    readonly dragConstraints: { top: 0; right: 0; bottom: 0; left: 0 }
    readonly dragElastic: { top: number; right: number; bottom: number; left: number }
    readonly dragMomentum: false
    readonly onDragEnd: (event: unknown, info: PanInfo) => void
    /**
     * Motion writes the gesture straight to `lean` instead of transforming the element it is
     * spread onto, which must stay put — a surface that rode the elastic would sit over the rail
     * for the length of the snap-back and swallow taps on it.
     */
    readonly _dragX: MotionValue<number> | undefined
    readonly _dragY: MotionValue<number> | undefined
  }
}

/**
 * Swipe to move between drinks, along whichever axis the rail runs: left for the next drink in
 * portrait, up for it in landscape, the way a page turns in the direction the collection is laid
 * out. A committed swipe hands its lean to the dissolve rather than snapping back, so the render
 * carries on out and its replacement arrives from the other side.
 */
export function useDrinkSwipe(): DrinkSwipe {
  const { drink, step } = useLab()
  const tokens = useMotionTokens()
  const landscape = useSyncExternalStore(subscribeLandscape, isLandscape, () => false)
  const axis: SwipeAxis = landscape ? 'y' : 'x'
  const lean = useMotionValue(0)

  const index = getDrinkIndex(drink.id)
  const atFirst = index <= 0
  const atLast = index >= DRINKS.length - 1

  const onDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const direction = swipeStep(info.offset[axis], info.velocity[axis])
      if (direction === 0) return
      // At the ends `step` clamps to a no-op, so the lean stays on Motion's own snap-back and the
      // elastic that already resisted the finger is the whole answer.
      if (direction === 1 ? atLast : atFirst) return

      const swipe: SwipeCarry = { axis, direction }
      step(direction, swipe)
      // Taking the return over from Motion is what stops the render bouncing back out from under
      // the change: it holds where the finger left it until the render's turn in the dissolve.
      animate(lean, 0, carryTransition(tokens))
    },
    [atFirst, atLast, axis, lean, step, tokens],
  )

  // Forward is left and up, which is the low end of either axis.
  const forwardYield = atLast ? YIELD_AT_END : YIELD
  const backYield = atFirst ? YIELD_AT_END : YIELD

  return {
    axis,
    lean,
    surface: {
      drag: axis,
      // A point, not a range: the render never leaves its position, it only leans.
      dragConstraints: { top: 0, right: 0, bottom: 0, left: 0 },
      dragElastic:
        axis === 'x'
          ? { left: forwardYield, right: backYield, top: 0, bottom: 0 }
          : { top: forwardYield, bottom: backYield, left: 0, right: 0 },
      // Momentum on a pinned element just overshoots and springs back twice.
      dragMomentum: false,
      onDragEnd,
      _dragX: axis === 'x' ? lean : undefined,
      _dragY: axis === 'y' ? lean : undefined,
    },
  }
}
