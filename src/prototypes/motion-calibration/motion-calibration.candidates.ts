import type { MotionTokens } from '#/lib/motion'

export type Candidate = {
  readonly key: 'A' | 'B' | 'C' | 'D'
  readonly name: string
  /** What this candidate is arguing for, in one line. */
  readonly claim: string
  /** Set on the one the human picked, so the instrument records its own verdict. */
  readonly chosen?: true
  readonly tokens: MotionTokens
}

/**
 * Four intensities of the same transition.
 *
 * The standing bias is *less* — if two are close, take the quieter one. D exists to bracket the
 * range rather than to win: you cannot judge "too subtle" without seeing "too much" beside it,
 * and a set of three that are all quiet just moves the question.
 *
 * **B was picked**, with a slight defocus added on top of it by the same call. The blur was asked
 * for after the four were judged; every candidate carries a proportionate value now so the
 * instrument still measures what shipped rather than a version of it that no longer exists.
 *
 * `carry` is `0` in all four: it only applies to a change a finger drove, and the instrument
 * triggers the transition from a button.
 */
export const CANDIDATES: readonly Candidate[] = [
  {
    key: 'A',
    name: 'Opacity only',
    claim: 'Nothing moves in space. The quietest thing that still reads as a change.',
    tokens: {
      stagger: 0.03,
      layer: { visualDuration: 0.34, bounce: 0 },
      watermark: { visualDuration: 0.9, bounce: 0 },
      drift: 0,
      watermarkDrift: 0,
      carry: 0,
      blur: 0,
      watermarkBlur: 0,
    },
  },
  {
    key: 'B',
    name: 'A whisper of travel',
    claim: 'Four pixels of rise. Enough to feel a direction, not enough to see one.',
    chosen: true,
    tokens: {
      stagger: 0.04,
      layer: { visualDuration: 0.38, bounce: 0 },
      watermark: { visualDuration: 1, bounce: 0 },
      drift: 4,
      watermarkDrift: 9,
      carry: 0,
      blur: 2,
      watermarkBlur: 4,
    },
  },
  {
    key: 'C',
    name: 'Legible depth',
    claim: 'The stagger becomes noticeable if you watch for it. The watermark clearly trails.',
    tokens: {
      stagger: 0.055,
      layer: { visualDuration: 0.44, bounce: 0 },
      watermark: { visualDuration: 1.2, bounce: 0.05 },
      drift: 9,
      watermarkDrift: 20,
      carry: 0,
      blur: 4,
      watermarkBlur: 9,
    },
  },
  {
    key: 'D',
    name: 'Too much, on purpose',
    claim: 'The bracket. If this is preferred, the whole brief has moved.',
    tokens: {
      stagger: 0.085,
      layer: { visualDuration: 0.58, bounce: 0.16 },
      watermark: { visualDuration: 1.7, bounce: 0.2 },
      drift: 20,
      watermarkDrift: 42,
      carry: 0,
      blur: 9,
      watermarkBlur: 18,
    },
  },
]
