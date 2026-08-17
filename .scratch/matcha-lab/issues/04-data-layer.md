# Data layer on TanStack Store

Type: task
Status: open
Blocked by: 03

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
