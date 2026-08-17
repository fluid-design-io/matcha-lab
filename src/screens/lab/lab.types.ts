import type { Drink, DrinkId } from '#/domain/drinks'

/**
 * The lab's in-memory state contract.
 *
 * Selection and whether the recipe is open are ordinary session state — they do not persist or
 * touch storage.
 */
export type LabContextValue = {
  readonly drink: Drink
  readonly select: (id: DrinkId) => void
  /** Move `delta` places along the collection. Clamped — the ends are ends, not a carousel. */
  readonly step: (delta: number) => void
  readonly recipeOpen: boolean
  readonly setRecipeOpen: (open: boolean) => void
}
