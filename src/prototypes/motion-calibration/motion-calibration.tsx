import { useCallback, useEffect, useState } from 'react'

import {
  DRINKS,
  OPENING_DRINK_ID,
  getDrink,
  getDrinkIndex,
  type DrinkId,
} from '#/domain/drinks'

import { CANDIDATES } from './motion-calibration.candidates'
import { CandidatePanel } from './motion-calibration.panel'

/**
 * Ticket 09 — motion calibration. **Human in the loop.**
 *
 * "So subtle that only someone paying close attention notices it" is a taste judgement that
 * cannot be settled by reasoning about numbers, so this puts four intensities of the same
 * transition side by side and drives all four from **one** trigger. That is the whole design:
 * comparing four simultaneous responses to a single change is the only way to judge relative
 * intensity — flipping between them one at a time measures memory, not motion.
 *
 * Dev only. It renders nothing in a production build.
 */
export function MotionCalibration() {
  const [id, setId] = useState<DrinkId>(OPENING_DRINK_ID)
  const drink = getDrink(id)

  const step = useCallback((delta: number) => {
    setId((current) => {
      const next = (getDrinkIndex(current) + delta + DRINKS.length) % DRINKS.length
      return DRINKS[next]!.id
    })
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') step(1)
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step(-1)
      if (event.key === ' ') {
        event.preventDefault()
        step(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  if (!import.meta.env.DEV) return null

  return (
    <main className="flex h-svh w-screen flex-col gap-4 overflow-hidden bg-field p-6">
      <header className="flex shrink-0 items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-label text-on-field untrack uppercase">
            Motion calibration · ticket 09
          </h1>
          <p className="text-detail text-on-field-faint">
            One trigger, four responses. Change the drink and watch all four at once — the
            question is only which intensity is right, not which looks good alone.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-detail text-on-field-faint">
            {drink.romaji} · {getDrinkIndex(id) + 1} of {DRINKS.length}
          </span>
          <button
            type="button"
            onClick={() => step(-1)}
            className="text-label border border-hairline-field px-3 py-2 text-on-field-muted untrack uppercase"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="text-label border border-hairline-field px-3 py-2 text-on-field-muted untrack uppercase"
          >
            Next →
          </button>
        </div>
      </header>

      <p className="text-detail shrink-0 text-on-field-faint">
        Arrow keys or space also step. Jump several places at once with the rail order to see
        whether a long jump should differ from a single step.
      </p>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-5">
        {CANDIDATES.map((candidate) => (
          <CandidatePanel key={candidate.key} candidate={candidate} drink={drink} />
        ))}
      </div>
    </main>
  )
}
