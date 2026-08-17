import { useCallback } from 'react'
import { useMotionValue, type MotionValue, type PanInfo } from 'motion/react'

import { DRINKS, getDrinkIndex } from '#/domain/drinks'

import { useLab } from './lab.context'

/** Finger travel, in px, that commits to the neighbouring drink on release. */
const COMMIT_DISTANCE = 64

/**
 * How much of a flick's velocity (px/s) counts towards that distance. A fast 30px flick should
 * commit; a slow 60px drag that stops dead should not.
 */
const VELOCITY_WEIGHT = 0.12

/**
 * How much of the finger's travel the composition actually follows.
 *
 * The render is pinned — `dragConstraints` is a point, so every pixel of movement is elastic — and
 * this is the elasticity. At 0.2, a 200px swipe slides the render 40px: enough to feel the drink
 * being pushed aside, nowhere near enough to read as a carousel.
 */
const YIELD = 0.2

/**
 * And how much it yields at the ends of the collection.
 *
 * The ends are ends, not a carousel — `step()` clamps, so a swipe past 深 does nothing. Without
 * this the gesture would feel identical to one that worked and simply fail, which reads as a
 * dropped input. A quarter of the give says "held" while the finger is still down, so the answer
 * arrives before the release rather than after it.
 */
const YIELD_AT_END = 0.05

/**
 * What a released swipe means: `1` forward, `-1` back, `0` nothing.
 *
 * Pulled out of the hook because it is the only part of the gesture that is a decision rather
 * than a binding, and a decision is worth being able to test. Distance and velocity are summed
 * rather than checked separately, so a long slow drag and a short fast flick can both commit
 * while a long drag that stops dead does not.
 */
export function swipeStep(offsetX: number, velocityX: number): -1 | 0 | 1 {
  const travel = offsetX + velocityX * VELOCITY_WEIGHT
  if (travel <= -COMMIT_DISTANCE) return 1
  if (travel >= COMMIT_DISTANCE) return -1
  return 0
}

export type DrinkSwipe = {
  /** Bind this to anything that should slide with the gesture. The render frame does. */
  readonly x: MotionValue<number>
  /** Spread onto the `motion` element that receives the gesture. */
  readonly surface: {
    readonly drag: 'x'
    readonly dragConstraints: { left: 0; right: 0 }
    readonly dragElastic: { left: number; right: number; top: 0; bottom: 0 }
    readonly dragMomentum: false
    readonly onDragEnd: (event: unknown, info: PanInfo) => void
    readonly style: { x: MotionValue<number> }
  }
}

/**
 * Horizontal swipe to move between drinks — the gesture that makes this feel iPad-native rather
 * than a website on a tablet. It reads the same in both orientations: the rail reflows, the swipe
 * does not, because the swipe is about the collection and not about the rail.
 *
 * Swiping left moves forward, the way a page turns. Only `opacity` and `transform` move, so the
 * whole gesture composites.
 */
export function useDrinkSwipe(): DrinkSwipe {
  const { drink, step } = useLab()
  const x = useMotionValue(0)

  const index = getDrinkIndex(drink.id)
  const atFirst = index <= 0
  const atLast = index >= DRINKS.length - 1

  const onDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const delta = swipeStep(info.offset.x, info.velocity.x)
      // `step` clamps, so at the ends this is deliberately a no-op — the elastic already said so.
      if (delta !== 0) step(delta)
    },
    [step],
  )

  return {
    x,
    surface: {
      drag: 'x',
      // A point, not a range: the render never leaves its position, it only leans.
      dragConstraints: { left: 0, right: 0 },
      dragElastic: {
        left: atLast ? YIELD_AT_END : YIELD,
        right: atFirst ? YIELD_AT_END : YIELD,
        top: 0,
        bottom: 0,
      },
      // Momentum on a pinned element just overshoots and springs back twice.
      dragMomentum: false,
      onDragEnd,
      style: { x },
    },
  }
}
