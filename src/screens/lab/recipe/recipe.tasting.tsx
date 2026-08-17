import { Fragment } from 'react'

import {
  AXES,
  collectionExtremes,
  leadsCollection,
  type AxisValue,
  type Drink,
} from '#/domain/drinks'

/**
 * `味 TASTING NOTE` — the five axes as horizontal scales, and the derived extremes line.
 *
 * 味 椰 乳 力 涼 濃 share one column down the left, which is why 味 sets at full ink and without a
 * slash. `leadsCollection` and `collectionExtremes` are never recomputed here, so neither the
 * filled diamonds nor the sentence can go stale when an axis value changes.
 */
export function RecipeTasting({ drink }: { drink: Drink }) {
  const { highest, lowest } = collectionExtremes(drink)

  return (
    <section className="min-w-0">
      <p className="flex items-center gap-2.5">
        <span className="font-jp text-kanji-sm untrack text-on-paper">味</span>
        <span className="text-label untrack uppercase text-on-paper-muted">Tasting note</span>
      </p>

      {/* One grid for all five rows, so the glyph column, the name column and the scale start
          line up down the stack. `auto` on the name column sizes it to COCONUT, the longest. */}
      <div
        className="mt-2.5 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-2.5"
        style={{ gridAutoRows: 'var(--recipe-row)' }}
      >
        {AXES.map((axis) => (
          <Fragment key={axis.key}>
            <span className="font-jp text-kanji-xs pr-1.5 text-on-paper">{axis.kanji}</span>
            <span className="text-micro untrack uppercase text-on-paper-muted">{axis.name}</span>
            {/* The axis name is set beside it, so the scale's own label carries only the reading. */}
            <AxisScale value={drink.axes[axis.key]} leads={leadsCollection(drink, axis.key)} />
          </Fragment>
        ))}
      </div>

      {highest || lowest ? (
        <p className="text-detail mt-(--recipe-band) text-on-paper-faint">
          {highest ? (
            <>
              <span className="font-jp">{highest.kanji}</span> highest in the collection
            </>
          ) : null}
          {highest && lowest ? <span className="px-2">·</span> : null}
          {lowest ? (
            <>
              <span className="font-jp">{lowest.kanji}</span> lowest
              {highest ? null : ' in the collection'}
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  )
}

/**
 * One 0–10 scale: a hairline with a tick at each end and one at the midpoint, and a 7px diamond at
 * `value / 10` along it.
 *
 * Accent-filled when the drink holds the collection's high on that axis, hollow otherwise — the
 * fill is state, which is the only licence the accent has.
 */
function AxisScale({ value, leads }: { value: AxisValue; leads: boolean }) {
  return (
    <span role="img" aria-label={`${value} of 10`} className="relative block h-[7px] w-full">
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hairline" />

      <span aria-hidden className="absolute top-0 left-0 h-full w-px bg-on-paper-faint" />
      <span
        aria-hidden
        className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-on-paper-faint"
      />
      <span aria-hidden className="absolute top-0 right-0 h-full w-px bg-on-paper-faint" />

      <span
        aria-hidden
        className={
          leads
            ? 'absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent'
            : 'absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-on-paper-faint bg-paper'
        }
        style={{ left: `${value * 10}%` }}
      />
    </span>
  )
}
