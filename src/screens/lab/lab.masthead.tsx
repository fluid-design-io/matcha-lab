import Heart from '@gravity-ui/icons/Heart'

import { useFavouriteCount, useFavouritesHydrated } from '#/domain/favourites'

/**
 * 抹茶 · MATCHA COCONUT LAB, and the favourite count.
 *
 * The accent hairline dropping from the very top edge is a printer's registration tick, and the
 * only vertical rule in the app. It sits exactly on the left content margin and has to escape the
 * shell's top padding to reach the edge, which is what the negative offset is doing.
 *
 * Landscape sets the kanji and the label on one line; portrait stacks them, per the references.
 */
export function LabMasthead() {
  return (
    <header className="relative flex items-start justify-between">
      <span
        aria-hidden
        className="absolute left-0 hidden w-px bg-accent land:block"
        style={{
          top: 'calc(-1 * max(var(--edge), env(safe-area-inset-top)))',
          height: 'calc(max(var(--edge), env(safe-area-inset-top)) + 64px)',
        }}
      />

      {/* 12px stacked, measured off ref-1-portrait: 抹茶 ends at y=74 and the label starts at
          y≈87. The 22px in landscape is horizontal and unrelated. */}
      <div className="flex flex-col gap-3 land:flex-row land:items-baseline land:gap-[22px] land:pl-2.5">
        <span className="font-jp text-kanji-sm text-on-field-strong untrack">抹茶</span>
        <span className="text-label text-on-field-muted untrack uppercase">Matcha Coconut Lab</span>
      </div>

      <FavouriteCount />
    </header>
  )
}

function FavouriteCount() {
  const count = useFavouriteCount()
  const hydrated = useFavouritesHydrated()

  return (
    <p
      className="flex items-center gap-2 text-on-field-strong transition-opacity duration-500"
      // Hydration reads localStorage in an effect, so first paint is always zero. Fading in means
      // that correction reads as settling rather than as the number flickering.
      style={{ opacity: hydrated ? 1 : 0 }}
    >
      <Heart width={12} height={12} className="-translate-y-px" aria-hidden />
      <span className="text-numeral tnum untrack">{String(count).padStart(2, '0')}</span>
      <span className="sr-only">{count === 1 ? 'drink saved' : 'drinks saved'}</span>
    </p>
  )
}
