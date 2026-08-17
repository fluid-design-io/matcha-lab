import type { ReactNode } from 'react'
import { AnimatePresence, motion, usePresenceData } from 'motion/react'

import { dissolve, useMotionTokens, type MotionLayer, type SwipeCarry } from '#/lib/motion'
import { cn } from '#/lib/utils'

import { useLab } from './lab.context'

type LabLayerProps = {
  /** Which of the six layers this is. Position in `MOTION_LAYERS` sets the delay. */
  layer: MotionLayer
  /**
   * What counts as "a change" for this layer. Defaults to the selected drink; the rail overrides
   * it, because only the two slots whose selection changed have anything to dissolve.
   */
  layerKey?: string
  /**
   * The swipe that caused the change, if one did. Only the render passes it — it is the layer the
   * finger moved, and the rest keep their rise.
   */
  swipe?: SwipeCarry | null
  /** Positioning and sizing for the layer as a whole. The copies inside inherit it. */
  className?: string
  children: ReactNode
}

/**
 * One cross-dissolving layer of the drink change: old and new occupy the same grid cell, so both
 * are on screen at once and this is a true dissolve rather than a fade-out then a fade-in. Tokens
 * come from `useMotionTokens()`, which covers everything a spring can be shrunk to — a Motion
 * `layout` animation is out of its reach and `LabProvider`'s `MotionConfig` handles that instead.
 */
export function LabLayer({ layer, layerKey, swipe = null, className, children }: LabLayerProps) {
  const { drink } = useLab()

  return (
    <div className={cn('grid', className)}>
      <AnimatePresence initial={false} custom={swipe}>
        <LabLayerCopy key={layerKey ?? drink.id} layer={layer}>
          {children}
        </LabLayerCopy>
      </AnimatePresence>
    </div>
  )
}

/**
 * One side of the dissolve. It takes the swipe from `AnimatePresence` rather than from a prop,
 * because the copy that is leaving has already been removed and has no props left to update.
 */
function LabLayerCopy({ layer, children }: { layer: MotionLayer; children: ReactNode }) {
  const tokens = useMotionTokens()
  const swipe = usePresenceData() as SwipeCarry | null | undefined
  const variants = dissolve(layer, tokens, swipe)

  return (
    <motion.div
      className="relative col-start-1 row-start-1"
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={variants.transition}
    >
      {children}
    </motion.div>
  )
}
