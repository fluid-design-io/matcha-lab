import { afterEach, describe, expect, test } from 'bun:test'

import {
  favouritesStore,
  startFavouritesPersistence,
  toggleFavourite,
} from '../favourites.store'

const KEY = 'matcha-lab:favourites'

/** Minimal Storage stub. `onWrite` lets a test make persistence fail the way a full quota does. */
function stubStorage(seed?: string | null, onWrite?: () => void) {
  const map = new Map<string, string>()
  if (seed != null) map.set(KEY, seed)

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        onWrite?.()
        map.set(k, v)
      },
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    },
  })

  return map
}

const teardowns: Array<() => void> = []
const start = () => {
  const stop = startFavouritesPersistence()
  teardowns.push(stop)
  return stop
}

afterEach(() => {
  while (teardowns.length) teardowns.pop()?.()
})

describe('hydration', () => {
  test('reads a valid stored set', () => {
    stubStorage(JSON.stringify(['nagi', 'to']))
    start()

    expect([...favouritesStore.state.ids].sort()).toEqual(['nagi', 'to'])
    expect(favouritesStore.state.hydrated).toBe(true)
  })

  test('an absent key hydrates empty', () => {
    stubStorage(null)
    start()

    expect(favouritesStore.state.ids.size).toBe(0)
    expect(favouritesStore.state.hydrated).toBe(true)
  })

  // The four ways a stored value goes bad. None may throw — a malformed entry must not
  // white-screen the app.
  test.each([
    ['malformed JSON', '{not json'],
    ['an empty string', ''],
    ['a JSON object rather than an array', '{"nagi":true}'],
    ['a JSON scalar', '42'],
  ])('falls back to empty for %s', (_label, stored) => {
    stubStorage(stored)

    expect(start).not.toThrow()
    expect(favouritesStore.state.ids.size).toBe(0)
    expect(favouritesStore.state.hydrated).toBe(true)
  })

  test('drops ids that are not in the collection', () => {
    // `yawa` was a real drink during charting — 柔 YAWA became 透 TŌ. An iPad that stored it
    // must not keep counting it.
    stubStorage(JSON.stringify(['nagi', 'yawa', 42, null, { id: 'sui' }]))
    start()

    expect([...favouritesStore.state.ids]).toEqual(['nagi'])
  })
})

describe('toggling', () => {
  test('adds, then removes', () => {
    stubStorage(null)
    start()

    toggleFavourite('kumo')
    expect(favouritesStore.state.ids.has('kumo')).toBe(true)

    toggleFavourite('kumo')
    expect(favouritesStore.state.ids.has('kumo')).toBe(false)
  })

  test('writes back on every change', () => {
    const map = stubStorage(null)
    start()

    toggleFavourite('awa')
    expect(JSON.parse(map.get(KEY)!)).toEqual(['awa'])

    toggleFavourite('shin')
    expect(JSON.parse(map.get(KEY)!).sort()).toEqual(['awa', 'shin'])

    toggleFavourite('awa')
    expect(JSON.parse(map.get(KEY)!)).toEqual(['shin'])
  })

  test('hydration does not write back what it just read', () => {
    let writes = 0
    stubStorage(JSON.stringify(['nagi']), () => {
      writes += 1
    })
    start()

    expect(writes).toBe(0)
  })

  test('survives a storage that refuses to write', () => {
    stubStorage(null, () => {
      throw new DOMException('QuotaExceededError')
    })
    start()

    // Private browsing, or a full disk. The session stays correct; it is simply not persisted.
    expect(() => toggleFavourite('sui')).not.toThrow()
    expect(favouritesStore.state.ids.has('sui')).toBe(true)
  })

  test('stops writing once persistence is torn down', () => {
    const map = stubStorage(null)
    const stop = start()

    toggleFavourite('on')
    const afterFirst = map.get(KEY)

    stop()
    toggleFavourite('kage')

    expect(map.get(KEY)).toBe(afterFirst)
  })
})
