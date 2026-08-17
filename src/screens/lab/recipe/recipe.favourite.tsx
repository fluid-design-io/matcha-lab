import Heart from '@gravity-ui/icons/Heart'
import HeartFill from '@gravity-ui/icons/HeartFill'
import { motion } from 'motion/react'

import type { Drink } from '#/domain/drinks'
import { useIsFavourite, useToggleFavourite } from '#/domain/favourites'
import { panelTransition, useMotionTokens } from '#/lib/motion'

/**
 * `♥ SAVED` — three 12px hearts stacked in one box, the accent outline arriving a beat before the
 * fill, plus one scale overshoot. The stack is what keeps `color` out of the animation: every value
 * here is `opacity` or `transform`.
 */
export function RecipeFavourite({ drink }: { drink: Drink }) {
  const saved = useIsFavourite(drink.id)
  const toggle = useToggleFavourite()
  const tokens = useMotionTokens()

  // 4px of drift → 1.125×, comfortably under the 1.15 ceiling. 0px → no overshoot at all.
  const overshoot = 1 + tokens.drift / 32
  const fade = panelTransition(tokens)

  return (
    <button
      type="button"
      onClick={() => toggle(drink.id)}
      aria-pressed={saved}
      aria-label={`${drink.name} — ${saved ? 'saved to favourites' : 'save to favourites'}`}
      // The target is --tap tall around a `size-3` glyph, and the matching negative margin takes
      // that growth back off, so the footer row still measures only the glyph.
      className="my-[calc((0.75rem_-_var(--tap))/2)] flex h-(--tap) shrink-0 items-center gap-2.5"
    >
      {/* `initial={false}` on all three: opening the panel on an already-saved drink must show a
          filled heart, not perform one. Nothing in this app animates on mount. */}
      <motion.span
        aria-hidden
        className="relative block size-3 -translate-y-px"
        initial={false}
        animate={{ scale: saved ? [1, overshoot, 1] : 1 }}
        transition={{ duration: tokens.layer.visualDuration * 0.9, times: [0, 0.42, 1] }}
      >
        <Heart width={12} height={12} className="absolute inset-0 text-on-paper-faint" />

        <motion.span
          className="absolute inset-0 text-accent"
          initial={false}
          animate={{ opacity: saved ? 1 : 0 }}
          transition={fade}
        >
          <Heart width={12} height={12} />
        </motion.span>

        <motion.span
          className="absolute inset-0 text-accent"
          initial={false}
          animate={{ opacity: saved ? 1 : 0 }}
          // A beat behind the outline on the way in; level with it on the way out, so unsaving
          // reads as one movement rather than as the animation played backwards.
          transition={{ ...fade, delay: saved ? tokens.stagger : 0 }}
        >
          <HeartFill width={12} height={12} />
        </motion.span>
      </motion.span>

      {/* Fixed width, right-aligned: SAVE is a character narrower than SAVED, and without this the
          heart would step sideways every time the state changed. */}
      <span className="text-label untrack w-12 text-right uppercase text-on-paper-muted">
        {saved ? 'Saved' : 'Save'}
      </span>
    </button>
  )
}
