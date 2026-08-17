import type { Drink, DrinkId } from '#/domain/drinks'

/**
 * A keydown from either binding of the selection keys — the window listener gets the native event,
 * the recipe popup gets React's synthetic one, and the handler only touches what they share.
 */
export type SelectionKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'target' | 'defaultPrevented' | 'metaKey' | 'ctrlKey' | 'altKey' | 'preventDefault'
>

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
  /** Arrow / Home / End over the collection. Bound to the window, and to the recipe popup. */
  readonly onSelectionKeyDown: (event: SelectionKeyEvent) => void
  readonly recipeOpen: boolean
  readonly setRecipeOpen: (open: boolean) => void
}
