import { Store } from '@tanstack/store'

import { DRINKS, type DrinkId } from '#/domain/drinks'

/**
 * The one piece of state that outlives the session.
 *
 * Plain JSON under a key you can read in devtools — no opaque envelope. Everything else in the
 * app (selection, whether the recipe overlay is open) is ordinary in-memory React state and does
 * not belong here.
 *
 * Nothing outside this module touches the store or the storage key; see `favourites.hooks.ts`
 * for the surface components actually use.
 */
const STORAGE_KEY = 'matcha-lab:favourites'

export type FavouritesState = {
  readonly ids: ReadonlySet<DrinkId>
  /**
   * False until the effect has read localStorage. Exposed so the header count can fade in as
   * *settling* rather than popping from 0 — not so callers can special-case hydration.
   */
  readonly hydrated: boolean
}

const EMPTY: FavouritesState = { ids: new Set(), hydrated: false }

/**
 * Module scope, but deliberately not touching `localStorage` here — the prerendered shell would
 * run this on the server. First paint shows zero favourites and corrects on mount; at nine
 * records that is imperceptible, and it keeps SSR trivially safe.
 */
export const favouritesStore = new Store<FavouritesState>(EMPTY)

const KNOWN_IDS = new Set<string>(DRINKS.map((drink) => drink.id))

function isDrinkId(value: unknown): value is DrinkId {
  return typeof value === 'string' && KNOWN_IDS.has(value)
}

/**
 * Reads the stored set, falling back to empty for anything unexpected. A malformed entry — hand
 * edited, truncated by a full disk, written by an older build — must never white-screen the app,
 * and ids that no longer exist in the collection are dropped rather than counted.
 */
function readStored(): Set<DrinkId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter(isDrinkId))
  } catch {
    return new Set()
  }
}

function writeStored(ids: ReadonlySet<DrinkId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Private browsing, or a full quota. Favourites stay correct for this session and are simply
    // not persisted — which is a much better outcome than throwing out of a click handler.
  }
}

/**
 * Hydrates from storage, then keeps storage in step with the store.
 *
 * Reading before subscribing matters: it means hydration cannot immediately write back what it
 * just read. Returns the teardown, so React can own the lifetime.
 */
export function startFavouritesPersistence(): () => void {
  favouritesStore.setState((previous) => ({
    ...previous,
    ids: readStored(),
    hydrated: true,
  }))

  const subscription = favouritesStore.subscribe((state) => writeStored(state.ids))
  return () => subscription.unsubscribe()
}

export function toggleFavourite(id: DrinkId): void {
  favouritesStore.setState((previous) => {
    const ids = new Set(previous.ids)
    if (!ids.delete(id)) ids.add(id)
    return { ...previous, ids }
  })
}
