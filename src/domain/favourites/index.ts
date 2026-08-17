/**
 * Favourites — the one thing that persists.
 *
 * A deep module: the store, the storage key and the serialisation format are all internal. If a
 * component needs something this barrel does not export, add a hook here rather than reaching
 * past it.
 */
export {
  useFavouriteCount,
  useFavouritesHydrated,
  useFavouritesPersistence,
  useIsFavourite,
  useToggleFavourite,
} from './favourites.hooks'
