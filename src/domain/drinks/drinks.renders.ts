import awa from '#/assets/renders/awa.webp'
import ichigo from '#/assets/renders/ichigo.webp'
import kage from '#/assets/renders/kage.webp'
import kumo from '#/assets/renders/kumo.webp'
import nagi from '#/assets/renders/nagi.webp'
import on from '#/assets/renders/on.webp'
import shin from '#/assets/renders/shin.webp'
import sui from '#/assets/renders/sui.webp'
import to from '#/assets/renders/to.webp'

import { DRINKS } from './drinks.content'
import type { DrinkId } from './drinks.types'

/**
 * The nine generated renders, wired to their drinks.
 *
 * Imported rather than referenced by path, so Vite fingerprints them and they cache immutably —
 * a home-screen app relaunches from cache far more often than it downloads.
 *
 * Kept out of `drinks.content.ts` so that file stays pure authored content with no asset imports.
 * See `docs/design/image-generation.md` for the contract they were made under.
 */
const RENDERS: Readonly<Record<DrinkId, string>> = {
  sui,
  nagi,
  kumo,
  kage,
  awa,
  on,
  to,
  ichigo,
  shin,
}

export function getDrinkRender(id: DrinkId): string {
  return RENDERS[id]
}

/**
 * The renders on either side of a selection.
 *
 * Warming these means a swipe or an arrow key lands on a decoded image rather than on the empty
 * frame — the two neighbours are the only ones a single gesture can reach.
 */
export function neighbourRenders(id: DrinkId): string[] {
  const index = DRINKS.findIndex((drink) => drink.id === id)
  return [DRINKS[index - 1], DRINKS[index + 1]]
    .filter((drink) => drink !== undefined)
    .map((drink) => RENDERS[drink.id])
}
