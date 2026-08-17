import { motion } from 'motion/react'

import type { Drink } from '#/domain/drinks'
import { layerDelay, useMotionTokens } from '#/lib/motion'
import { cn } from '#/lib/utils'

import { LabLayer } from '../lab.layer'

type RailItemProps = {
  drink: Drink
  selected: boolean
  onSelect: (drink: Drink) => void
}

/** The one shared underline. One id, one element, nine possible positions. */
const SELECTION_LAYOUT_ID = 'rail-selection'

/**
 * One slot on the rail: the button takes the whole ruled band so no part of it is dead to a finger,
 * and a `--rail-row` box pinned to the band's bottom edge holds the glyph's optical position.
 * Everything inside sits absolutely within a fixed `--rail-item` pitch, so selection can change the
 * glyph's size and add a label without moving a neighbour.
 */
export function RailItem({ drink, selected, onSelect }: RailItemProps) {
  const tokens = useMotionTokens()

  return (
    <button
      type="button"
      onClick={() => onSelect(drink)}
      aria-current={selected ? 'true' : undefined}
      aria-label={`${drink.romaji} — ${drink.name}`}
      // Read by the rail to move focus when the keyboard moves selection.
      data-selected={selected}
      tabIndex={selected ? 0 : -1}
      // No height in portrait: the flex nav stretches it to the whole band.
      className="relative w-(--rail-item) shrink-0 land:h-(--rail-item) land:w-full"
    >
      {/* Landscape has no band to fill, so there the slot is the whole button. */}
      <span className="absolute inset-x-0 bottom-0 h-(--rail-row) land:top-0 land:h-auto">
        {/*
          The rail's share of the staggered dissolve, per slot rather than across the whole rail:
          eight of the nine glyphs are identical either side of a change, and cross-fading each
          against a copy of itself leaves a visible double image. Keying on selection means only
          the two slots that changed animate, on the spring and delay the whole block would have had.
        */}
        <LabLayer layer="rail" layerKey={selected ? 'on' : 'off'} className="absolute inset-0">
          <span
            aria-hidden
            className={cn(
              'font-jp absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none',
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
              'text-micro absolute top-[70%] left-1/2 -translate-x-1/2 untrack uppercase',
              'land:top-1/2 land:left-[82%] land:-translate-x-0 land:-translate-y-1/2 land:[writing-mode:vertical-rl]',
              selected ? 'text-on-field-muted' : 'text-on-field-faint land:opacity-0',
            )}
          >
            {drink.romaji}
          </span>
        </LabLayer>

        {selected ? (
          <motion.span
            aria-hidden
            // One element that slides, not nine that fade. It sits outside the dissolve because a
            // `layoutId` cannot be in two places at once and `AnimatePresence` keeps the outgoing
            // copy mounted for the length of it.
            layoutId={SELECTION_LAYOUT_ID}
            transition={{
              type: 'spring',
              visualDuration: tokens.layer.visualDuration,
              bounce: tokens.layer.bounce,
              // It is part of the rail layer, so it waits its turn like the rest of it.
              delay: layerDelay('rail', tokens),
            }}
            // Offsets, not transforms: Motion drives this element's `transform` to project it from
            // its old box to its new one, and `scale` does not multiply a standalone `translate`.
            className={cn(
              'absolute h-px bg-accent',
              'bottom-[8%] left-[38%] w-[24%]',
              'land:top-1/2 land:bottom-auto land:left-[32%] land:w-[10%]',
            )}
          />
        ) : null}
      </span>
    </button>
  )
}
