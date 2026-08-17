import { Dialog } from '@base-ui/react/dialog'
import Xmark from '@gravity-ui/icons/Xmark'

import type { Drink } from '#/domain/drinks'

/**
 * 凪 · NAGI — Coconut Water Matcha, and the close control.
 *
 * The whole run is the `Dialog.Title`, so the accessible name is `凪 NAGI Coconut Water Matcha`
 * rather than just the English half.
 */
export function RecipeHeader({ drink }: { drink: Drink }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-6">
      <Dialog.Title render={<h2 />} className="flex min-w-0 items-center gap-4">
        <span className="font-jp text-kanji-xl shrink-0 text-on-paper">{drink.kanji}</span>
        <span className="text-romaji untrack shrink-0 uppercase text-on-paper-muted">
          {drink.romaji}
        </span>
        {/* An em-dash rule, not an em dash: at 11px a typed dash sits on the Latin baseline and
            reads as punctuation, where a 1px rule on the optical centre reads as a separator. */}
        <span aria-hidden className="h-px w-7 shrink-0 bg-accent" />
        <span className="text-name min-w-0 truncate text-on-paper">{drink.name}</span>
      </Dialog.Title>

      {/* The tap target is invisible: the glyph is 16px and lands where the reference puts it. */}
      <Dialog.Close
        aria-label="Close recipe"
        className="flex size-(--tap) shrink-0 items-center justify-center text-on-paper-muted"
      >
        <Xmark width={16} height={16} aria-hidden />
      </Dialog.Close>
    </header>
  )
}
