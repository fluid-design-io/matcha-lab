import { Dialog } from '@base-ui/react/dialog'
import { AnimatePresence, motion } from 'motion/react'

import { panelTransition, useMotionTokens } from '#/lib/motion'

import { useLab } from '../lab.context'
import { RecipePanel } from './recipe.panel'

/**
 * The recipe overlay — dialog mechanics, the scrim, the frame, and the way the panel arrives.
 *
 * ## Base UI, and the four halves of the exit animation
 *
 * Focus trap, escape, scroll lock and ARIA all come free from the dialog primitive, and every part
 * of the motion skill's Base UI recipe is load-bearing here: the open state is hoisted (it already
 * lives in `lab.context`), the `Portal` is `keepMounted`, `AnimatePresence` wraps the conditional,
 * and the `motion` components go in through `render` rather than being spread. Base UI holds the
 * portal mounted for as long as `element.getAnimations()` reports work, which is why both exits
 * animate `opacity` — Motion runs that through WAAPI, where Base UI can see it.
 *
 * ## Container queries
 *
 * This is the one component in the app that gets them, and the container is the popup — see
 * `recipe.panel.tsx` for what they drive. Two details that are easy to get wrong:
 *
 * - `container-type: size`, not `inline-size`, because the panel's rhythm is `cqh`. It is set
 *   through `style` so it cannot lose a specificity race with a utility class.
 * - the popup carries **no padding**. `cqw` resolves against the container's content box, so
 *   padding here would quietly shrink every `cq` number inside. The padding is on the paper.
 *
 * The panel's arrangement switches on its own **aspect ratio** rather than its width: portrait at
 * 1024×1366 gives an 884px panel and landscape at 1024×768 gives a 908px one, 24px apart, so any
 * width threshold separating those two would be a coincidence rather than a rule.
 */
export function RecipeOverlay() {
  const { drink, recipeOpen, setRecipeOpen } = useLab()
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
              className="fixed inset-0 bg-scrim"
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
              className="fixed"
              style={{
                // The frame lands exactly on the main view's content margin and the paper 14px
                // inside it, so the overlay registers with the composition it covers — through the
                // safe area, the same way the shell does it.
                top: 'calc(max(var(--edge), env(safe-area-inset-top)) + 14px)',
                right: 'calc(max(var(--edge), env(safe-area-inset-right)) + 14px)',
                bottom: 'calc(max(var(--edge), env(safe-area-inset-bottom)) + 14px)',
                left: 'calc(max(var(--edge), env(safe-area-inset-left)) + 14px)',
                containerType: 'size',
                containerName: 'recipe',
              }}
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
              {/* The hairline frame sits outside the paper, on the scrim — measured off
                  ref-3-recipe.png, where it reads as paper at ~67% rather than as an ink hairline.
                  It belongs to the panel rather than to the backdrop so the two arrive as one
                  object. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-3.5 border border-on-field-muted"
              />

              <RecipePanel drink={drink} />

              {/* Not set anywhere in the panel: the reference has no room for a sentence and the
                  five axes say it better. It is worth keeping as the dialog's description, where a
                  screen reader gets the flavour of the drink on open. */}
              <Dialog.Description className="sr-only">{drink.tastingNote}</Dialog.Description>
            </Dialog.Popup>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
