import type { Drink } from '#/domain/drinks'
import { cn } from '#/lib/utils'

type RailItemProps = {
  drink: Drink
  selected: boolean
  onSelect: (drink: Drink) => void
}

/**
 * One slot on the rail.
 *
 * The slot is a **fixed pitch** — `--rail-item` — and everything inside is absolutely positioned
 * within it. That is the most important detail in the rail: selection changes the glyph's size
 * and adds a label, and none of it may move the neighbours. A rail that reflows on tap cannot
 * have an underline that slides a constant distance, and it feels loose under the finger.
 *
 * The whole slot is the hit target, so the touchable area is 138x73 in landscape and 108 wide in
 * portrait even though the visible glyph is 24px.
 */
export function RailItem({ drink, selected, onSelect }: RailItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(drink)}
      aria-current={selected ? 'true' : undefined}
      aria-label={`${drink.romaji} — ${drink.name}`}
      className="relative h-full w-(--rail-item) shrink-0 land:h-(--rail-item) land:w-full"
    >
      <span
        aria-hidden
        className={cn(
          'font-jp absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none',
          'land:top-1/2 land:left-[63%]',
          selected ? 'text-kanji-lg text-on-field-strong' : 'text-kanji-md text-on-field-faint',
        )}
      >
        {drink.kanji}
      </span>

      {/* Portrait labels every glyph; landscape labels only the selected one and rotates it.
          Both are absolutely positioned, so neither can change the slot's pitch. */}
      <span
        aria-hidden
        className={cn(
          'text-micro absolute top-[72%] left-1/2 -translate-x-1/2 untrack uppercase',
          'land:top-1/2 land:left-[82%] land:-translate-x-0 land:-translate-y-1/2 land:[writing-mode:vertical-rl]',
          selected ? 'text-on-field-muted' : 'text-on-field-faint land:opacity-0',
        )}
      >
        {drink.romaji}
      </span>

      {selected ? (
        <span
          aria-hidden
          className={cn(
            'absolute h-px bg-accent',
            'bottom-[8%] left-1/2 w-[24%] -translate-x-1/2',
            'land:top-1/2 land:bottom-auto land:left-[32%] land:w-[10%] land:-translate-x-0 land:-translate-y-1/2',
          )}
        />
      ) : null}
    </button>
  )
}
