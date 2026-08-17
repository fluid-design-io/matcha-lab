# TanStack DB — evaluation for matcha-lab

**Date:** 2026-08-16
**Question:** Should TanStack DB be the client-side data layer for an offline-first TanStack Start SPA holding ~9 static drink records + a set of favourite ids, with no server?

**Verdict up front:** No. Use TanStack Store (or plain React state) + a localStorage effect. TanStack DB works, is genuinely SSR-survivable in SPA mode, and the local collections are real first-class APIs — but it costs **~61 KB gzipped** versus **~3 KB** for TanStack Store, it has **no IndexedDB collection at all**, and it is in semver-zero with a breaking-capable minor roughly every two months. Details and the escape hatch below.

Everything in this document was verified against the actually-published packages (installed locally, source inspected, samples executed), not just read from docs. Where the docs are wrong, that is called out.

---

## 1. Packages and current versions

Verified against the npm registry on 2026-08-16.

| Package | Version | Notes |
| --- | --- | --- |
| `@tanstack/react-db` | **0.2.1** | React bindings. Re-exports **everything** from `@tanstack/db`. |
| `@tanstack/db` | **0.7.2** | Core. Pulled in transitively. |
| `@tanstack/db-ivm` | 0.1.18 | Transitive. The incremental-view-maintenance / differential-dataflow engine. |
| `@tanstack/pacer-lite` | 0.2.1 | Transitive. |

Peer dependencies:

- `@tanstack/react-db` → `react >=16.8.0`
- `@tanstack/db` → `typescript >=4.7`

React 19 is fine. There is no `react-dom` peer requirement.

### Install command

```sh
npm install @tanstack/react-db
```

That is the whole install. **Do not also install `@tanstack/db` explicitly** — the framework package re-exports the entire core surface, and adding it directly just creates a second version you can drift on. Import `createCollection`, `eq`, `localStorageCollectionOptions` etc. from `@tanstack/react-db`.

> Note the version skew: the React package is at `0.2.x` while core is at `0.7.x`. They are versioned independently, so pin both in your lockfile and read two changelogs when upgrading.

Source: [docs/installation.md](https://github.com/TanStack/db/blob/main/docs/installation.md)

---

## 2. Collection types, and the persistence story

### What exists

Bundled in the framework package (no extra install):

- **`localOnlyCollectionOptions`** — in-memory, seeded from `initialData`. Not persisted; resets on reload.
- **`localStorageCollectionOptions`** — persisted to `localStorage` (or any synchronous `Storage`-shaped object), with automatic cross-tab sync via `storage` events.

Separate packages (all server/sync-oriented, none relevant here):

- `@tanstack/query-db-collection` → `queryCollectionOptions` (REST via TanStack Query)
- `@tanstack/electric-db-collection` → `electricCollectionOptions` (ElectricSQL/Postgres)
- `@tanstack/trailbase-db-collection` → `trailBaseCollectionOptions`
- `@tanstack/powersync-db-collection` → `powerSyncCollectionOptions` (SQLite/WASM)
- `@tanstack/rxdb-db-collection` → `rxdbCollectionOptions` (RxDB)

### The IndexedDB answer: there is no IndexedDB collection

This matters because the request was "IndexedDB **or** localStorage".

I grepped the entire installed dependency tree for `indexeddb`/`idb`:

```
grep -ril "indexeddb\|idb" node_modules/@tanstack/    →  (no matches)
```

There is **no first-class IndexedDB collection**, and you cannot cheaply adapt the localStorage one, because the `storage` option is typed as a **synchronous** API:

```ts
// node_modules/@tanstack/db/dist/esm/local-storage.d.ts:6
export type StorageApi = Pick<Storage, `getItem` | `setItem` | `removeItem`>;
```

`getItem` must return the value synchronously. IndexedDB is irreducibly asynchronous, so it cannot be dropped in. Getting IndexedDB under TanStack DB means either writing a custom collection (implementing the `sync` protocol — `begin`/`write`/`commit`/`markReady`) or adopting RxDB/PowerSync, both of which are far larger than the problem.

**For 9 drinks and a handful of favourite ids, localStorage is the correct storage anyway** — it is synchronous, ~5 MB, and survives iPad home-screen launches identically to IndexedDB. IndexedDB is the wrong tool at this size regardless of which library wins. So this constraint costs nothing in practice; it just means TanStack DB does not deliver on the "or IndexedDB" half of the ask.

### Note on the persisted format

The localStorage collection does **not** write a plain array. Verified by executing a real write:

```json
{"s:usucha":{"versionKey":"994e2b06-f6fe-4979-bf56-3b2c3bd5767e","data":{"drinkId":"usucha","addedAt":1}}}
```

Keys are type-tagged (`s:` string, `n:` number) and each row is wrapped with a `versionKey` used for cross-tab conflict resolution. This is an internal format. If you ever migrate off TanStack DB, or want to hand-edit/seed favourites, you are parsing their envelope rather than your own data. A hand-rolled localStorage effect writes `["usucha","koicha"]` and stays yours.

### (a) Static in-memory collection seeded from a TypeScript array

```ts
import { createCollection, localOnlyCollectionOptions } from '@tanstack/react-db'

export type Drink = {
  id: string
  name: string
  temp: 'hot' | 'iced'
}

const DRINKS: Array<Drink> = [
  { id: 'matcha-latte', name: 'Matcha Latte', temp: 'iced' },
  { id: 'usucha',       name: 'Usucha',       temp: 'hot'  },
  { id: 'koicha',       name: 'Koicha',       temp: 'hot'  },
  // ...9 total
]

export const drinkCollection = createCollection(
  localOnlyCollectionOptions({
    id: 'drinks',
    getKey: (drink) => drink.id,
    initialData: DRINKS,
  })
)
```

`localOnlyCollectionOptions` internally sets `startSync: true` and `gcTime: 0`, so `initialData` is written into the collection eagerly at construction — the data is there before any component subscribes. (Verified in `dist/esm/local-only.js`.)

### (b) Persisted collection of favourite ids

```ts
import { createCollection, localStorageCollectionOptions } from '@tanstack/react-db'

export type Favourite = {
  drinkId: string
  addedAt: number
}

export const favouriteCollection = createCollection(
  localStorageCollectionOptions({
    id: 'favourites',
    storageKey: 'matcha-lab:favourites', // the single localStorage key holding all rows
    getKey: (fav) => fav.drinkId,
  })
)
```

Required options are `id`, `storageKey`, `getKey`. Optional: `schema` (any Standard Schema — Zod/Valibot/ArkType/Effect), `storage` (defaults to `window.localStorage`; pass `sessionStorage` or a custom sync wrapper), `storageEventApi` (defaults to `window`), and `onInsert`/`onUpdate`/`onDelete`.

Both samples above were executed against the real published packages and confirmed working — see the validation section.

Sources: [local-storage-collection.md](https://github.com/TanStack/db/blob/main/docs/collections/local-storage-collection.md), [local-only-collection.md](https://github.com/TanStack/db/blob/main/docs/collections/local-only-collection.md)

---

## 3. Reading in React — `useLiveQuery`

The hook is `useLiveQuery`, from `@tanstack/react-db`. It **returns an object**, not an array:

```ts
// node_modules/@tanstack/react-db/dist/esm/useLiveQuery.d.ts:61
export declare function useLiveQuery<TContext extends Context>(
  queryFn: (q: InitialQueryBuilder) => QueryBuilder<TContext>,
  deps?: Array<unknown>
): {
  state: Map<string | number, GetResult<TContext>>
  data: InferResultType<TContext>
  collection: Collection<GetResult<TContext>, string | number, {}>
  status: CollectionStatus
  isLoading: boolean
  isReady: boolean
  isIdle: boolean
  isError: boolean
  isCleanedUp: boolean
  isEnabled: true
}
```

> **Docs bug:** the [live-queries guide](https://github.com/TanStack/db/blob/main/docs/guides/live-queries.md) shows `const activeUsers = useLiveQuery(...)` followed by `activeUsers.map(...)`. That is stale and will not compile — you must destructure `{ data }`. The [overview page](https://tanstack.com/db/latest/docs/overview) has it right. A small but telling sign of beta doc drift.

Filtering a collection:

```tsx
import { useLiveQuery, eq } from '@tanstack/react-db'
import { drinkCollection } from './collections'

function HotDrinks() {
  const { data: drinks, isReady } = useLiveQuery((q) =>
    q
      .from({ drink: drinkCollection })
      .where(({ drink }) => eq(drink.temp, 'hot'))
      .orderBy(({ drink }) => drink.name, 'asc')
  )

  if (!isReady) return null
  return <ul>{drinks.map((d) => <li key={d.id}>{d.name}</li>)}</ul>
}
```

The genuinely nice case — joining favourites to drinks, which is the one query where TanStack DB earns its keep here:

```tsx
import { useLiveQuery, eq } from '@tanstack/react-db'
import { drinkCollection, favouriteCollection } from './collections'

function FavouriteDrinks() {
  const { data: favourites } = useLiveQuery((q) =>
    q
      .from({ fav: favouriteCollection })
      .join({ drink: drinkCollection }, ({ fav, drink }) => eq(fav.drinkId, drink.id))
      .select(({ fav, drink }) => ({
        id: drink.id,
        name: drink.name,
        addedAt: fav.addedAt,
      }))
      .orderBy(({ fav }) => fav.addedAt, 'desc')
  )

  return <ul>{favourites.map((d) => <li key={d.id}>{d.name}</li>)}</ul>
}
```

Pass a `deps` array as the second argument when the query closes over props/state.

Other read APIs: `useLiveSuspenseQuery`, `useLiveInfiniteQuery`, `useLiveQueryEffect`, plus non-React `createLiveQueryCollection`, `liveQueryCollectionOptions`, and `queryOnce` for one-shot snapshots.

Every query result row carries injected virtual props — `$synced`, `$origin`, `$key`, `$collectionId` — confirmed present in my executed output. Harmless, but be aware they exist if you ever spread a row into something you persist.

---

## 4. Writing, and whether handlers are needed with no backend

Writes are direct method calls on the collection:

```ts
// insert
favouriteCollection.insert({ drinkId: 'usucha', addedAt: Date.now() })

// update (Immer-style draft mutation)
favouriteCollection.update('usucha', (draft) => {
  draft.addedAt = Date.now()
})

// delete by key
favouriteCollection.delete('usucha')

// toggle helper
function toggleFavourite(drinkId: string) {
  if (favouriteCollection.has(drinkId)) {
    favouriteCollection.delete(drinkId)
  } else {
    favouriteCollection.insert({ drinkId, addedAt: Date.now() })
  }
}
```

### Are `onInsert`/`onUpdate`/`onDelete` required? No — not for local collections.

This is the key architectural point and the answer is unambiguous.

For **server-backed** collections (query/electric/trailbase), the handlers are mandatory — they are the "persist to backend" leg of the optimistic loop, and omitting them throws (`MissingInsertHandlerError`, `MissingUpdateHandlerError`, `MissingDeleteHandlerError` are all exported error types).

For **local-only** and **localStorage** collections, handlers are **completely optional**. Both docs state this explicitly, and the source confirms it: `localOnlyCollectionOptions` wraps whatever you pass (or nothing) and then calls `confirmOperationsSync(...)` itself, immediately promoting the optimistic write to confirmed state. `localStorageCollectionOptions` likewise persists to storage and confirms without any handler.

The docs put it plainly:

> "With LocalStorage collections, you **directly mutate state** by calling methods like `collection.insert()`, `collection.update()`, and `collection.delete()` — that's all you need to do."

So with no server there is effectively **no optimistic window at all**. The write is applied and confirmed synchronously in the same tick; there is nothing to roll back because there is no async persistence step that can fail. The entire optimistic-mutation machinery — arguably TanStack DB's headline feature — is dead weight in this project. That is worth sitting with: you would be paying 61 KB largely for a rollback engine that can never fire.

`createOptimisticAction` / `createTransaction` exist for multi-collection atomic writes. Not needed here.

Source: [mutations.md](https://github.com/TanStack/db/blob/main/docs/guides/mutations.md)

---

## 5. SSR / SPA — the real hazards

I tested this directly rather than inferring it. Results are mixed but the conclusion is clean.

### Collection creation IS SSR-safe

`localStorageCollectionOptions` guards its browser access **inside the function body**, not at import time:

```js
// node_modules/@tanstack/db/dist/esm/local-storage.js:57-58
const storage = config.storage
  || (typeof window !== `undefined` ? window.localStorage : null)
  || createInMemoryStorage();
const storageEventApi = config.storageEventApi
  || (typeof window !== `undefined` ? window : null)
  || createNoOpStorageEventApi();
```

On the server it silently falls back to an in-memory `Map` and a no-op event listener. I ran this in Node with `typeof window === 'undefined'`: creating both collections and calling `.insert()` worked, and `favs.size` was `1`. **Module-scope collection definitions will not crash your server build or your SPA shell prerender.** That is better than most client-only data libraries.

### But `useLiveQuery` HARD-CRASHES during SSR

This is the finding that actually constrains the design. Rendering a component that calls `useLiveQuery` through `renderToString` throws:

```
Error: Missing getServerSnapshot, which is required for server-rendered content.
    at useSyncExternalStore (react-dom-server-legacy.node.development.js:9749)
    at useLiveQuery (@tanstack/react-db/dist/esm/useLiveQuery.js:78)
```

Cause, straight from the shipped source — `useSyncExternalStore` is called with only two arguments, no server snapshot:

```js
// node_modules/@tanstack/react-db/dist/esm/useLiveQuery.js:78
return useSyncExternalStore(
  subscribeRef.current,
  () => observer.getSnapshot()
);
```

I also grepped the whole React package for `getServerSnapshot`, `isServer`, and `typeof window` — **zero matches**. There is no SSR accommodation in `@tanstack/react-db` whatsoever, and the TanStack DB docs contain no SSR or hydration guidance at all. This is not a hydration-mismatch risk you can paper over; it is a thrown exception.

So: this is not a "hydration mismatch" hazard, it is a **"you must never server-render a `useLiveQuery` component"** hazard. Which is fine for this project, but it is a hard rule, not a preference.

### Recommended pattern for TanStack Start

TanStack Start has an explicit SPA mode, and it pairs exactly with this constraint. In `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
  ],
})
```

SPA mode "completely disables server-side execution of `beforeLoad` and `loader`, as well as server-side rendering of route components." The build prerenders **only the root route** into a static `/_shell.html`, rendering the router's pending fallback where matched routes would go, and rewrites 404s to that shell.

**The one trap:** the root route *is* still prerendered on the server to generate the shell. So the rule is — **do not call `useLiveQuery` in the root route component or in anything the shell renders.** Route components are safe because SPA mode substitutes the pending fallback for them. Keep all collection reads in child routes.

There is also per-route **Selective SSR** if you ever want a hybrid:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  ssr: false, // disables server beforeLoad, loader, AND component render
})
```

and a global default via `createStart`:

```ts
// src/start.ts
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
```

For an iPad home-screen app with no server, **`spa: { enabled: true }` is the right switch** — it also gives you a static shell you can host on any CDN. Note this applies equally whichever data layer you choose; it is good advice independent of TanStack DB.

Sources: [spa-mode.md](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode), [selective-ssr.md](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)

---

## 6. Honest assessment

### Measured bundle cost

I bundled a realistic import set for this project with esbuild (minified, React marked external), so these are real numbers, not estimates:

| Import set | Minified | Gzipped |
| --- | --- | --- |
| `@tanstack/react-db` — `createCollection`, `localStorageCollectionOptions`, `localOnlyCollectionOptions`, `useLiveQuery`, `eq` | 213,790 B (~209 KB) | **61,251 B (~61 KB)** |
| `@tanstack/store` + `@tanstack/react-store` — `Store`, `useStore` | 7,507 B (~7.3 KB) | **2,982 B (~3 KB)** |

**~61 KB gzipped versus ~3 KB. Roughly 20×.** The bulk is `@tanstack/db-ivm`, the differential-dataflow engine that makes live queries incremental. It does not tree-shake away, because `useLiveQuery` is the whole point of the library and it pulls the engine in.

For calibration: 61 KB gzipped is in the neighbourhood of React itself. You would be roughly doubling your framework payload to manage 9 records that ship in the bundle anyway, plus a list of ids. On an iPad home-screen app this is a one-time cost on a fast connection, so it is not catastrophic — but it is real, and it buys almost nothing at this scale.

### Beta churn — quantified

From the npm registry: **128 releases of `@tanstack/db` since 2025-05-12**, spanning minor lines `0.0` through `0.7`. Current `0.7.2` shipped 2026-08-13 — three days ago.

Under semver-zero, **every minor bump is allowed to break you**, and there have been 8 minor lines in ~15 months — a breaking-capable release roughly every 8 weeks. The React package is separately versioned at `0.2.1`, so upgrades mean reconciling two changelogs. I also found a stale, non-compiling example in the official live-queries guide, which suggests docs are lagging the code.

For a personal iPad app you may simply never upgrade, which defuses this. But if you do keep it current, budget for periodic breakage on a project whose data layer should be a solved problem forever.

### What TanStack DB genuinely gives you

Not nothing, and worth stating fairly:

- **Live queries** — `useLiveQuery` recomputes incrementally and re-renders only on real change. Declarative, and the join between favourites and drinks is genuinely elegant (verified working above).
- **A real query layer** — `where`/`join`/`select`/`orderBy`/`groupBy`/aggregations/subqueries, fully type-inferred from the query shape. The TypeScript inference is excellent.
- **Cross-tab sync for free** — the localStorage collection syncs via `storage` events automatically. Mostly irrelevant for a single iPad home-screen app.
- **Indexing** — `createIndex`, `autoIndex: 'eager'`, B-tree indexes. At 9 records this is pure overhead; the engine even logged a "consider creating an index" warning during my join test on a 3-row collection.
- **A future sync path** — if this ever grows a backend, swapping `localStorageCollectionOptions` for `queryCollectionOptions` or `electricCollectionOptions` keeps every component untouched. This is the strongest argument for adopting it.
- **Schema validation** — optional Standard Schema support.

### On "it will also help with the SPA pattern"

This premise does not hold, and it is worth correcting directly. TanStack DB has **no involvement in the SPA pattern**. It contains zero SSR handling — I grepped for it and found none. The SPA behaviour comes entirely from `tanstackStart({ spa: { enabled: true } })` in your Vite config, which is a TanStack **Start** feature and works identically whether your data lives in TanStack DB, TanStack Store, or `useState`.

If anything the relationship is inverted: TanStack DB **needs** SPA mode (or `ssr: false`) to avoid the `useLiveQuery` SSR crash. It does not help with SPA — it imposes a constraint that SPA mode happens to satisfy. TanStack Store has no such constraint at all.

### The alternative, in full

This is the entire data layer, and it is worth seeing at actual size:

```ts
import { Store, useStore } from '@tanstack/react-store'

const KEY = 'matcha-lab:favourites'

const favouriteStore = new Store<Array<string>>(
  typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(KEY) ?? '[]')
    : []
)

favouriteStore.subscribe(() => {
  localStorage.setItem(KEY, JSON.stringify(favouriteStore.state))
})

export function toggleFavourite(id: string) {
  favouriteStore.setState((ids) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  )
}

export function useFavouriteIds() {
  return useStore(favouriteStore)
}
```

And the drinks stay what they already are — a typed array:

```ts
export const DRINKS: Array<Drink> = [ /* 9 records */ ]

export function useFavouriteDrinks() {
  const ids = useFavouriteIds()
  return DRINKS.filter((d) => ids.includes(d.id))
}
```

That is ~25 lines, ~3 KB gzipped, zero beta risk, no SSR hazard, and a plain-JSON localStorage format you fully own. Filtering 9 records with `Array.filter` is free; no incremental dataflow engine is going to beat it at this size.

(If you want to drop the dependency entirely, `useSyncExternalStore` or even `useState` + a `useEffect` gets you the same thing with no library at all.)

### Recommendation

**Use TanStack Store + a localStorage effect.** TanStack DB is a well-built library solving a real and hard problem — reactive client stores over synced server data with optimistic mutations — but this project has **no server, no sync, no concurrency, and 9 records**. Every one of TanStack DB's differentiators is inert here:

- Optimistic mutations with rollback → nothing to roll back; writes confirm synchronously.
- Incremental live queries → 9 records; `Array.filter` is instant.
- Indexing → actively counterproductive at this size.
- Cross-tab sync → single iPad home-screen app.
- Sync-engine adapters → no backend, by design.

What is left is ~61 KB of gzipped JavaScript, a query DSL to learn, an opaque persisted format, a documented-but-drifting beta API, and a hard rule that you may never server-render your components. The favourites-to-drinks join is genuinely pleasant, but it replaces a one-line `Array.filter`.

**When I would change this answer:** if a backend and multi-device sync are actually on the roadmap — not hypothetically, but planned — then adopting TanStack DB now is defensible, because the migration path (swap the collection options, leave components alone) is real and valuable, and retrofitting it later means rewriting every component that touches data. If sync is genuinely coming, adopt it now and eat the 61 KB. If it is "maybe someday," the rewrite cost later is a few hours on a 9-record app — cheaper than carrying the weight and the beta risk indefinitely.

Independently of the data layer: **turn on `spa: { enabled: true }`.** That is the right call for an iPad home-screen app either way.

---

## Sources

**Official docs**
- https://tanstack.com/db/latest/docs/overview
- https://github.com/TanStack/db/blob/main/docs/installation.md
- https://github.com/TanStack/db/blob/main/docs/collections/local-storage-collection.md
- https://github.com/TanStack/db/blob/main/docs/collections/local-only-collection.md
- https://github.com/TanStack/db/blob/main/docs/guides/live-queries.md
- https://github.com/TanStack/db/blob/main/docs/guides/mutations.md
- https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode
- https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr
- https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering

**Repositories / registry**
- https://github.com/TanStack/db
- https://github.com/TanStack/router
- https://www.npmjs.com/package/@tanstack/react-db
- https://www.npmjs.com/package/@tanstack/db

**Primary evidence gathered locally** (installed `@tanstack/react-db@0.2.1` / `@tanstack/db@0.7.2`)
- `dist/esm/local-storage.js` (lines 53–58) — `typeof window` guards, in-memory fallback
- `dist/esm/local-storage.d.ts` (line 6) — `StorageApi` is synchronous
- `dist/esm/local-only.js` — `startSync: true`, `gcTime: 0`, handler wrapping + `confirmOperationsSync`
- `dist/esm/useLiveQuery.js` (line 78) — `useSyncExternalStore` with no `getServerSnapshot`
- `dist/esm/useLiveQuery.d.ts` (line 61) — return type is an object with `data`
- `renderToString` SSR crash reproduction
- esbuild bundle measurements (min + gzip) for both candidate stacks
- npm registry release-history analysis (128 releases, minor lines 0.0–0.7)
- End-to-end execution of both code samples with a mocked synchronous `localStorage`

---

## Appendix: validation

Both collection samples, the join query, the `where` filter, and the write path were executed against the real published packages with a mocked synchronous `localStorage`. Output:

```
favourited drinks: [
  { id: 'usucha', name: 'Usucha', addedAt: 1,
    '$synced': true, '$origin': 'remote',
    '$key': '[usucha,usucha]', '$collectionId': 'live-query-1' }
]
hot drinks: [ 'Koicha', 'Usucha' ]
RAW localStorage: {"s:usucha":{"versionKey":"994e2b06-...","data":{"drinkId":"usucha","addedAt":1}}}
```

Also emitted during the join, on a 3-row collection:

```
[TanStack DB] [drinks] Join requires an index on "id" for efficient loading.
Falling back to loading all data. Consider creating an index...
```

Everything documented above works as described. The recommendation is not about whether TanStack DB functions — it does — but about whether its cost is proportionate to this problem.
