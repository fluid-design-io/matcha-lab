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
 * `--text-kanji-md` over `--text-kanji-lg`. Both sizes are the same multiple of `--type-display`,
 * so the ratio holds at every density and one `scale` covers the whole type scale.
 */
const UNSELECTED_SCALE = 1.5 / 2

/**
 * One slot on the rail: the button takes the whole ruled band so no part of it is dead to a finger,
 * and a `--rail-row` box pinned to the band's bottom edge holds the glyph's optical position.
 * Everything inside sits absolutely within a fixed `--rail-item` pitch, so selection can change the
 * glyph's size and add a label without moving a neighbour.
 */
export function RailItem({ drink, selected, onSelect }: RailItemProps) {
  const tokens = useMotionTokens()

  // Everything in a slot is part of the rail layer, so it all waits its turn behind the layers in
  // front of it and moves on the same spring the dissolve would have used.
  const railSpring = {
    type: 'spring' as const,
    visualDuration: tokens.layer.visualDuration,
    bounce: tokens.layer.bounce,
    delay: layerDelay('rail', tokens),
  }

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
          The glyph grows and brightens rather than dissolving: it is the one thing in a slot that
          is the same before and after, so cross-fading it against a copy of itself reads as a blur
          where the design wants a size change. `scale` and `opacity` only, per the no-layout rule —
          `font-size` is layout, and `--color-on-field-*` is a `color-mix()` no interpolator reads.
        */}
        <motion.span
          aria-hidden
          // The box is always the selected size and scales down when it is not, so the glyph's
          // centre stays on the same point: Tailwind's `translate` is its own property, which the
          // `transform` Motion writes composes with rather than replaces.
          className={cn(
            'font-jp text-kanji-lg absolute top-[28%] left-1/2 grid -translate-x-1/2 -translate-y-1/2 leading-none',
            'land:top-1/2 land:left-[63%]',
          )}
          initial={false}
          animate={{ scale: selected ? 1 : UNSELECTED_SCALE }}
          transition={railSpring}
        >
          {/* The two roles stacked in one cell and cross-faded, which is how this app changes a
              colour without animating `color` — the same trick as the favourite heart. Both copies
              carry the selected weight: the smaller token is 250 against 300, and weight is not
              what this design changes on selection. */}
          <motion.span
            className="col-start-1 row-start-1"
            initial={false}
            animate={{ color: selected ? 'var(--color-on-field-strong)' : 'var(--color-on-field-faint)', y: selected ? 0 : 4, fontWeight: selected ? 500 : 300 }}
            transition={railSpring}
          >
            {drink.kanji}
          </motion.span>
        </motion.span>

        {/*
          The rail's share of the staggered dissolve, now the label alone: keyed on selection rather
          than on the drink, because eight of the nine slots are identical either side of a change
          and cross-fading each against a copy of itself leaves a visible double image. Only the two
          slots that did change animate, on the spring and delay the whole block would have had.
        */}
        <LabLayer layer="rail" className="absolute inset-0">
          {/* Only the tablet-portrait rail has the width to name the whole collection; everywhere
              else the nine words collide, so only the selected one shows. Both placements are
              absolute, so neither can change the slot's pitch. */}
          <span
            aria-hidden
            className={cn(
              'text-micro absolute top-[70%] left-1/2 -translate-x-1/2 untrack uppercase',
              'land:top-1/2 land:left-[82%] land:translate-x-0 land:-translate-y-[calc(50%-2.5px)] land:[writing-mode:vertical-rl]',
              selected ? 'text-on-field-muted' : 'text-on-field-faint opacity-0 port:opacity-100',
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
            transition={railSpring}
            // Offsets, not transforms: Motion drives this element's `transform` to project it from
            // its old box to its new one, and `scale` does not multiply a standalone `translate`.
            className={cn(
              'absolute h-px bg-accent',
              'bottom-0 left-[38%] w-[24%]',
              'land:top-1/2 land:bottom-auto land:left-[32%] land:w-[10%]',
            )}
          />
        ) : null}
      </span>
    </button>
  )
}
