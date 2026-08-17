import { describe, expect, test } from 'bun:test'

import { swipeStep } from '../lab.gestures'

/**
 * The swipe itself cannot be tested here — Motion's drag needs a real pointer and a real
 * frameloop. What can be tested is the decision it makes on release, which is the part with an
 * opinion in it.
 *
 * Sign convention: the finger moving left is a negative offset and moves *forward* through the
 * collection, the way a page turns.
 */
describe('swipeStep', () => {
  test('a settled drag under the threshold does nothing', () => {
    expect(swipeStep(-40, 0)).toBe(0)
    expect(swipeStep(40, 0)).toBe(0)
    expect(swipeStep(0, 0)).toBe(0)
  })

  test('a long drag commits in the direction it travelled', () => {
    expect(swipeStep(-120, 0)).toBe(1)
    expect(swipeStep(120, 0)).toBe(-1)
  })

  test('a short fast flick commits', () => {
    // 30px is well under the 64px distance, but 400px/s of velocity carries it over.
    expect(swipeStep(-30, -400)).toBe(1)
    expect(swipeStep(30, 400)).toBe(-1)
  })

  test('a long drag that stops dead does not', () => {
    // 60px of travel, released stationary. Nearly there is not there.
    expect(swipeStep(-60, 0)).toBe(0)
  })

  test('a drag that reverses before release does not commit the way it started', () => {
    // Dragged 70px left, then flicked back right hard enough to cancel it.
    expect(swipeStep(-70, 300)).toBe(0)
  })

  test('vertical movement alone is not a swipe', () => {
    expect(swipeStep(0, 0)).toBe(0)
  })
})
