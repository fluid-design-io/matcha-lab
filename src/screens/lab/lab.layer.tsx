import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import {
  dissolve,
  useMotionTokens,
  type DissolveVariants,
  type MotionLayer,
} from '#/lib/motion'
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
   * What the layer dissolves on. Defaults to `dissolve(layer)`; the title passes `rollDissolve`,
   * because its letters do the leaving and arriving and a fade over the top of them only hides it.
   */
  variants?: DissolveVariants
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
export function LabLayer({
  layer,
  layerKey,
  variants: variantsOverride,
  className,
  children,
}: LabLayerProps) {
  const { drink } = useLab()
  const tokens = useMotionTokens()
  const variants = variantsOverride ?? dissolve(layer, tokens)

  return (
    <div className={cn('grid', className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={layerKey ?? drink.id}
          className="relative col-start-1 row-start-1"
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={variants.transition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
