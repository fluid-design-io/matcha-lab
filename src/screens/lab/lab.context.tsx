import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MotionConfig } from 'motion/react'

import { DRINKS, OPENING_DRINK_ID, getDrink, getDrinkIndex, type DrinkId } from '#/domain/drinks'

import type { LabContextValue, SelectionKeyEvent } from './lab.types'

const LabContext = createContext<LabContextValue | null>(null)

/**
 * Which way each key moves along the collection. Both axes, because the rail is a column in
 * landscape and a row in portrait and a keyboard user should not have to know which.
 */
const STEP_KEYS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

export function LabProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<DrinkId>(OPENING_DRINK_ID)
  const [recipeOpen, setRecipeOpen] = useState(false)

  const step = useCallback((delta: number) => {
    setSelectedId((current) => {
      // Clamped, not wrapped: a swipe that teleports from 深 back to 翠 loses the sense of a fixed
      // collection with two ends.
      const next = Math.min(Math.max(getDrinkIndex(current) + delta, 0), DRINKS.length - 1)
      return DRINKS[next]!.id
    })
  }, [])

  // A handler rather than only a listener: Base UI's dialog stops keydown propagating out of its
  // popup, so the recipe overlay binds this itself to keep the arrows working over its pager.
  const onSelectionKeyDown = useCallback(
    (event: SelectionKeyEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTextEntry(event.target)) return

      if (event.key === 'Home') setSelectedId(DRINKS[0]!.id)
      else if (event.key === 'End') setSelectedId(DRINKS[DRINKS.length - 1]!.id)
      else {
        const delta = STEP_KEYS[event.key]
        if (delta === undefined) return
        step(delta)
      }

      event.preventDefault()
    },
    [step],
  )

  // A window listener rather than a rail listener, so the arrows work wherever focus is, and it
  // lives here because this is the one place that owns selection.
  useEffect(() => {
    window.addEventListener('keydown', onSelectionKeyDown)
    return () => window.removeEventListener('keydown', onSelectionKeyDown)
  }, [onSelectionKeyDown])

  const value = useMemo<LabContextValue>(
    () => ({
      drink: getDrink(selectedId),
      select: setSelectedId,
      step,
      onSelectionKeyDown,
      recipeOpen,
      setRecipeOpen,
    }),
    [selectedId, recipeOpen, step, onSelectionKeyDown],
  )

  return (
    <LabContext value={value}>
      {/* `reducedMotion="user"` is the only thing that reaches a Motion `layout` animation —
          `useMotionTokens()` can shrink a spring but cannot stop the shared rail underline
          travelling the width of the rail. Motion's own default for this is "never". */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LabContext>
  )
}

/** Nothing in this app takes text today. Cheap insurance against the day something does. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function useLab(): LabContextValue {
  const value = use(LabContext)
  if (!value) throw new Error('useLab must be used inside <LabProvider>')
  return value
}
