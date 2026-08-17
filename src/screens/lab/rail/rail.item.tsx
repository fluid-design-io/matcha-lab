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
 * One slot on the rail.
 *
 * The slot is a **fixed pitch** — `--rail-item` across the flow, `--rail-row` (portrait) or
 * `--rail-item` again (landscape) along it — and everything inside is absolutely positioned
 * within it. That is the most important detail in the rail: selection changes the glyph's size
 * and adds a label, and none of it may move the neighbours. A rail that reflows on tap cannot
 * have an underline that slides a constant distance, and it feels loose under the finger.
 *
 * The whole slot is the hit target, so the touchable area is 138x73 in landscape and 108x48 in
 * portrait even though the visible glyph is 24px.
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
      className="relative h-(--rail-row) w-(--rail-item) shrink-0 land:h-(--rail-item) land:w-full"
    >
      {/*
        The rail's share of the staggered dissolve, per slot rather than across the whole rail.
        The prototype dissolved the rail as one block, which is right at prototype scale and wrong
        at full size: eight of the nine glyphs are identical either side of a change, and
        cross-fading them against copies of themselves 8px away leaves a visible double image on
        every one. Keying on selection instead means only the two slots that actually changed
        animate, on the same spring and the same 160ms delay as the block would have had.
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
          // One element that slides, not nine that fade. It lives outside the dissolve above
          // because a `layoutId` cannot be in two places at once, and `AnimatePresence` keeps the
          // outgoing copy on screen for the length of the dissolve.
          layoutId={SELECTION_LAYOUT_ID}
          transition={{
            type: 'spring',
            visualDuration: tokens.layer.visualDuration,
            bounce: tokens.layer.bounce,
            // It is part of the rail layer, so it waits its turn like the rest of it.
            delay: layerDelay('rail', tokens),
          }}
          // No transforms here on purpose. Motion drives this element's `transform` to project it
          // from its old box to its new one, so the centring is done with offsets instead: 38% +
          // 24% + 38% in portrait, and the measured 32%/10% of the rail column in landscape.
          className={cn(
            'absolute h-px bg-accent',
            'bottom-[8%] left-[38%] w-[24%]',
            'land:top-1/2 land:bottom-auto land:left-[32%] land:w-[10%]',
          )}
        />
      ) : null}
    </button>
  )
}
