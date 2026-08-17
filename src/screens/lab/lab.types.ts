import type { Drink, DrinkId } from '#/domain/drinks'

/**
 * The lab's in-memory state contract.
 *
 * Selection and whether the recipe is open are ordinary session state — they do not persist and
 * they never touch storage. Favourites are the only thing that outlives the session, and they
 * live in `#/domain/favourites`.
 */
export type LabContextValue = {
  readonly drink: Drink
  readonly select: (id: DrinkId) => void
  /** Move `delta` places along the collection. Clamped — the ends are ends, not a carousel. */
  readonly step: (delta: number) => void
  readonly recipeOpen: boolean
  readonly setRecipeOpen: (open: boolean) => void
}
