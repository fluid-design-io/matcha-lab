import type { CSSProperties } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AnimatePresence, motion } from 'motion/react'

import { panelTransition, useMotionTokens } from '#/lib/motion'
import { cn } from '#/lib/utils'

import { useLab } from '../lab.context'
import { RecipePanel } from './recipe.panel'

/**
 * The recipe overlay — dialog mechanics, the scrim, the hairline frame, and the way the panel
 * arrives.
 *
 * The exit needs the hoisted open state, `keepMounted`, `AnimatePresence` and `render` all four
 * together, and both exits must animate `opacity`, because Base UI holds the portal mounted only
 * while `element.getAnimations()` reports work.
 */
export function RecipeOverlay() {
  const { drink, recipeOpen, setRecipeOpen, onSelectionKeyDown } = useLab()
  const tokens = useMotionTokens()
  const transition = panelTransition(tokens)

  return (
    <Dialog.Root open={recipeOpen} onOpenChange={setRecipeOpen}>
      <AnimatePresence>
        {recipeOpen ? (
          <Dialog.Portal keepMounted>
            {/* A darkened field, never a black wash: `--color-scrim` is the field taken down, so
                the world behind the panel is still green and still moving. */}
            <Dialog.Backdrop
              className="fixed inset-0 z-20 bg-scrim"
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                />
              }
            />

            <Dialog.Popup
              // The dialog stops keydown at the popup, so the window binding in `LabProvider` never
              // sees it. Bound here the arrows page the panel the way the footer's pager does.
              onKeyDown={onSelectionKeyDown}
              className={cn(
                // The top layer of the app, over `LabShell` at z-10. Without a positive z the
                // shell wins on tree order and hit-tests over the whole dialog.
                'fixed z-20',
                // The frame lands on the main view's content margin and the paper sits inside it,
                // so the overlay registers with the composition it covers. A compact viewport has
                // no room for either: there the panel *is* the viewport, safe area aside.
                '[--recipe-frame:0px] [--recipe-margin:0px]',
                'land:[--recipe-frame:14px] land:[--recipe-margin:var(--edge)]',
                'port:[--recipe-frame:14px] port:[--recipe-margin:var(--edge)]',
              )}
              style={
                {
                  top: 'calc(max(var(--recipe-margin), env(safe-area-inset-top)) + var(--recipe-frame))',
                  right:
                    'calc(max(var(--recipe-margin), env(safe-area-inset-right)) + var(--recipe-frame))',
                  bottom:
                    'calc(max(var(--recipe-margin), env(safe-area-inset-bottom)) + var(--recipe-frame))',
                  left: 'calc(max(var(--recipe-margin), env(safe-area-inset-left)) + var(--recipe-frame))',
                  // `size`, not `inline-size`: the panel's rhythm is `cqh`, which `inline-size`
                  // does not answer. Set through `style` so it cannot lose to a utility class.
                  containerType: 'size',
                  containerName: 'recipe',
                } as CSSProperties
              }
              render={
                <motion.div
                  // It rises the same 4px the rest of the app moves, and leaves the way it came.
                  // No defocus: a panel that arrives out of focus reads as a lightbox.
                  initial={{ opacity: 0, y: tokens.drift }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: tokens.drift }}
                  transition={transition}
                />
              }
            >
              {/* Outside the paper, on the scrim: sampled off the reference it reads as paper at
                  ~67%, not as an ink hairline. It belongs to the panel rather than the backdrop so
                  the two arrive as one object, and it goes with the margin it registers against. */}
              <span
                aria-hidden
                className="pointer-events-none absolute hidden border border-on-field-muted port:block land:block"
                style={{ inset: 'calc(var(--recipe-frame) * -1)' }}
              />

              <RecipePanel drink={drink} />

              {/* Set nowhere in the panel: the reference has no room for a sentence and the five
                  axes say it better, so a screen reader gets it on open and the layout gets
                  nothing to fit. */}
              <Dialog.Description className="sr-only">{drink.tastingNote}</Dialog.Description>
            </Dialog.Popup>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
