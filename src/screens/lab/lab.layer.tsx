import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { dissolve, useMotionTokens, type MotionLayer } from '#/lib/motion'
import { cn } from '#/lib/utils'

import { useLab } from './lab.context'

type LabLayerProps = {
  /** Which of the six layers this is. Position in `MOTION_LAYERS` sets the delay. */
  layer: MotionLayer
  /**
   * What counts as "a change" for this layer. Defaults to the selected drink, which is what every
   * layer in the composition wants; the rail overrides it, because only the two slots whose
   * selection changed have anything to dissolve.
   */
  layerKey?: string
  /** Positioning and sizing for the layer as a whole. The copies inside inherit it. */
  className?: string
  children: ReactNode
}

/**
 * One cross-dissolving layer of the drink change.
 *
 * Old and new occupy the same grid cell, so both are on screen at once and this is a true
 * dissolve rather than a fade-out followed by a fade-in. Everything comes from
 * `dissolve(layer, tokens)` — the same function `src/lib/motion.ts` gives the calibration
 * prototype, so the app and the instrument cannot drift apart.
 *
 * The moving copy is `relative` so a caller can position children against the layer's own box
 * (the watermark and the rail both do). It stretches to fill the cell, which fills the wrapper.
 *
 * `initial={false}` because first paint is a still frame: nothing in this app animates on mount.
 *
 * Tokens come from `useMotionTokens()`, never from `MOTION` — that hook is what honours
 * `prefers-reduced-motion`, and it keeps listening, because iPadOS flips the setting from Control
 * Centre without reloading a home-screen app.
 */
export function LabLayer({ layer, layerKey, className, children }: LabLayerProps) {
  const { drink } = useLab()
  const tokens = useMotionTokens()
  const variants = dissolve(layer, tokens)

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
