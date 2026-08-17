import Heart from '@gravity-ui/icons/Heart'

import { useFavouriteCount, useFavouritesHydrated } from '#/domain/favourites'

/**
 * 抹茶 · MATCHA LAB, and the favourite count. The accent hairline is a printer's
 * registration tick on the left content margin, and the negative offset is what lets it escape the
 * shell's top padding to reach the very edge of the viewport.
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

      {/* 12px stacked, measured off ref-1-portrait: 抹茶 ends at y=74, the label starts at y≈87. */}
      <div className="flex flex-col gap-3 land:flex-row land:items-baseline land:gap-[22px] land:pl-2.5">
        <span className="font-jp text-kanji-sm text-on-field-strong untrack">抹茶</span>
        <span className="text-label text-on-field-muted untrack uppercase">Matcha Lab</span>
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
