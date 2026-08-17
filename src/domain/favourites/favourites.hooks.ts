import { useEffect } from 'react'
import { useSelector } from '@tanstack/react-store'

import type { DrinkId } from '#/domain/drinks'

import {
  favouritesStore,
  startFavouritesPersistence,
  toggleFavourite,
} from './favourites.store'

/**
 * The whole surface components get. They ask *is this favourited* and *toggle this*; they never
 * see the store, the storage key, or the shape of what is written.
 */

/**
 * Call once, at the root. Reads localStorage inside an effect — never at module scope — so the
 * prerendered shell never touches it.
 */
export function useFavouritesPersistence(): void {
  useEffect(startFavouritesPersistence, [])
}

export function useIsFavourite(id: DrinkId): boolean {
  return useSelector(favouritesStore, (state) => state.ids.has(id))
}

export function useFavouriteCount(): number {
  return useSelector(favouritesStore, (state) => state.ids.size)
}

/**
 * True once storage has been read. For fading the count in as it settles — not for branching on.
 */
export function useFavouritesHydrated(): boolean {
  return useSelector(favouritesStore, (state) => state.hydrated)
}

/**
 * Stable across renders: `toggleFavourite` is a module function, not a closure over state, so it
 * never needs a dependency array or a `useCallback`.
 */
export function useToggleFavourite(): (id: DrinkId) => void {
  return toggleFavourite
}
