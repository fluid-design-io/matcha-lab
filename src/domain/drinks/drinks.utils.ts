/**
 * Everything computed *across* the collection.
 *
 * The reference mockup renders axis extremes as copy — "涼 highest in the collection · 乳 lowest".
 * That is derived here rather than authored in `drinks.content.ts`, so it stays true if a number
 * changes. Nothing in this file is stateful; it is all pure functions over `DRINKS`.
 */
import { AXES, AXIS_BY_KEY, DRINKS } from './drinks.content'
import type { Axis, AxisKey, Drink, DrinkId } from './drinks.types'

type AxisStats = {
  readonly min: number
  readonly max: number
  readonly mean: number
  /** How many of the nine sit on the minimum / maximum. */
  readonly minHolders: number
  readonly maxHolders: number
}

/**
 * An extreme shared by three or more drinks is not a fact worth printing — eight of the nine
 * score 0 on coconut, and "lowest in the collection" would be meaningless for all of them.
 */
const MAX_SHARED_HOLDERS = 2

const AXIS_STATS: Readonly<Record<AxisKey, AxisStats>> = Object.fromEntries(
  AXES.map(({ key }) => {
    // Widened to number: the literal union is a guard on *authoring*, and summing it back into
    // a mean immediately leaves the range anyway.
    const values: number[] = DRINKS.map((drink) => drink.axes[key])
    const min = Math.min(...values)
    const max = Math.max(...values)
    return [
      key,
      {
        min,
        max,
        mean: values.reduce((sum, value) => sum + value, 0) / values.length,
        minHolders: values.filter((value) => value === min).length,
        maxHolders: values.filter((value) => value === max).length,
      } satisfies AxisStats,
    ]
  }),
) as Record<AxisKey, AxisStats>

/** Nine records. `find` is cheaper than the Map that would replace it. */
export function getDrink(id: DrinkId): Drink {
  const drink = DRINKS.find((candidate) => candidate.id === id)
  if (!drink) throw new Error(`Unknown drink id: ${id}`)
  return drink
}

export function getDrinkIndex(id: DrinkId): number {
  return DRINKS.findIndex((candidate) => candidate.id === id)
}

/**
 * Whether this drink holds the collection's high on an axis — ties included.
 *
 * Drives the accent fill on the axis diamonds in the recipe overlay. Ties are deliberately
 * included: NAGI and TŌ both score 9 on `fresh`, and both should read as leading it.
 */
export function leadsCollection(drink: Drink, key: AxisKey): boolean {
  return drink.axes[key] === AXIS_STATS[key].max
}

/**
 * The single most distinctive high and low for one drink, for the derived extremes line.
 *
 * Stricter than {@link leadsCollection}, because this becomes a sentence and a sentence can only
 * carry one claim. Candidates must hold the extreme with at most {@link MAX_SHARED_HOLDERS}
 * drinks; among those, fewer co-holders wins, and the tiebreak is distance from the collection
 * mean — which is what makes "深 SHIN is the least fresh" beat the equally-true but duller
 * "深 SHIN is the least energetic".
 *
 * Either half may be `null`, and for a drink that sits in the middle of everything both are.
 * That is the honest answer: it has nothing to declare, and the line simply does not render.
 */
export function collectionExtremes(drink: Drink): {
  highest: Axis | null
  lowest: Axis | null
} {
  return {
    highest: pickExtreme(drink, 'max'),
    lowest: pickExtreme(drink, 'min'),
  }
}

function pickExtreme(drink: Drink, end: 'min' | 'max'): Axis | null {
  const holdersKey = end === 'max' ? 'maxHolders' : 'minHolders'

  const candidates = AXES.filter(({ key }) => {
    const stats = AXIS_STATS[key]
    return drink.axes[key] === stats[end] && stats[holdersKey] <= MAX_SHARED_HOLDERS
  })

  if (candidates.length === 0) return null

  return candidates.reduce((best, candidate) => {
    const byHolders = AXIS_STATS[candidate.key][holdersKey] - AXIS_STATS[best.key][holdersKey]
    if (byHolders !== 0) return byHolders < 0 ? candidate : best

    const distance = (axis: Axis) =>
      Math.abs(drink.axes[axis.key] - AXIS_STATS[axis.key].mean)
    return distance(candidate) > distance(best) ? candidate : best
  })
}

/** The axis identity for a key, for components that hold only a key. */
export function getAxis(key: AxisKey): Axis {
  return AXIS_BY_KEY[key]
}
