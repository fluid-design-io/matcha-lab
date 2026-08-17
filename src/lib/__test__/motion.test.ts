import { describe, expect, test } from 'bun:test'

import { dissolve, type MotionTokens } from '../motion'

/** Stand-ins, not the shipped numbers — what is under test is which way the layer travels. */
const TOKENS: MotionTokens = {
  stagger: 0,
  layer: { visualDuration: 0.4, bounce: 0 },
  watermark: { visualDuration: 2, bounce: 0 },
  drift: 4,
  watermarkDrift: 8,
  carry: 48,
  blur: 0,
  watermarkBlur: 0,
}

describe('dissolve', () => {
  test('without a swipe the layer rises from below and leaves upward', () => {
    const { initial, exit } = dissolve('render', TOKENS)
    expect([initial.x, initial.y]).toEqual([0, 4])
    expect([exit.x, exit.y]).toEqual([0, -4])
  })

  test('a forward swipe sends the layer out the way the finger went', () => {
    // Forward is the finger moving left, so the copy leaving goes left and its replacement
    // arrives from the right.
    const { initial, exit } = dissolve('render', TOKENS, { axis: 'x', direction: 1 })
    expect([initial.x, initial.y]).toEqual([48, 0])
    expect([exit.x, exit.y]).toEqual([-48, 0])
  })

  test('a backward swipe in landscape travels down the rail', () => {
    const { initial, exit } = dissolve('render', TOKENS, { axis: 'y', direction: -1 })
    expect([initial.x, initial.y]).toEqual([0, -48])
    expect([exit.x, exit.y]).toEqual([0, 48])
  })
})
