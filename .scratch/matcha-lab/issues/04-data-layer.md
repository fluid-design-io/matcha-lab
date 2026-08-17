# Data layer on TanStack Store

Type: task
Status: resolved
Blocked by: 03

## Answer

`src/domain/favourites/` — a deep module. Components get five hooks and never see the store, the
storage key, or the serialisation format.

```ts
useFavouritesPersistence()   // once, at the root
useIsFavourite(id)
useFavouriteCount()
useFavouritesHydrated()      // for fading the count in, not for branching on
useToggleFavourite()
```

Nothing was installed and nothing was removed — `@tanstack/store` and `@tanstack/react-store` were
already there, and `@tanstack/react-db` was never added.

- **Drinks stay static.** Imported directly, never in a store.
- **Key is `matcha-lab:favourites`**, holding a plain JSON array of ids you can read in devtools.
- **Hydration happens in an effect**, so the prerendered shell never touches `localStorage`. The
  store is created at module scope but does not read storage there.
- **Read before subscribe**, so hydration cannot immediately write back what it just read. Proven
  by a test that counts writes.
- **`hydrated` is part of the state**, so ticket 12's counter can fade in as it settles rather
  than popping from 0.
- `useSelector`, not `useStore` — the latter is deprecated in `@tanstack/react-store` 0.11.

Twelve tests in `__test__/favourites.store.test.ts`, because "a malformed localStorage entry must
not white-screen the app" is the kind of requirement nobody verifies by hand:

- the four ways a stored value goes bad — malformed JSON, an empty string, a JSON object, a JSON
  scalar — each hydrating to empty rather than throwing;
- **unknown ids dropped.** 柔 YAWA was a real drink during charting before it became 透 TŌ. An iPad
  that stored it must not keep counting it, so ids are validated against the collection;
- a storage that refuses to write, the way private browsing and a full quota do: the session stays
  correct, it is simply not persisted, and the click handler does not throw;
- teardown actually stopping the write-back.

`bun test` and `bun run typecheck` are now scripts.

## Question

Stand up the client data layer on **TanStack Store**, with favourites persisted to localStorage by hand.

`@tanstack/store` and `@tanstack/react-store` are already in `package.json`. Nothing to install, nothing to remove — `@tanstack/react-db` was never added.

- **Drinks** are static content, not state. Import the [nine drink records](./03-drink-content.md) directly; `Array.find` over nine items is free. Do not put them in a store.
- **Favourites** are a `Store` holding a set of drink ids, hydrated from localStorage on mount and written back on change. Key: `matcha-lab:favourites`. Plain JSON you own and can read in devtools — no opaque envelope.
- **Selection and overlay open/closed** are ordinary in-memory React state. Only favourites persist.
- Hydrate inside an effect, not at module scope, so the prerendered shell never touches `localStorage`. First paint shows zero favourites and corrects on mount; at this scale that is imperceptible and it keeps SSR trivially safe.
- Handle a corrupt or absent stored value by falling back to empty rather than throwing. A malformed localStorage entry must not white-screen the app.

Expose a small, deep module — components ask for "is this favourited" and "toggle this", never for the store or the storage key. Follow `react-composition-structure` for placement and public API.

**Why Store and not TanStack DB** is settled and recorded in [the data-layer research](../research/tanstack-db.md): ~3 KB versus ~61 KB, and DB's optimistic-mutation engine can never fire without a backend. Do not switch back — it would also reintroduce the no-IndexedDB and `useLiveQuery`-crashes-SSR constraints that this choice avoids entirely.
