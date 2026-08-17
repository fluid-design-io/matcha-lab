import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { DRINKS, OPENING_DRINK_ID, getDrink, getDrinkIndex, type DrinkId } from '#/domain/drinks'

import type { LabContextValue } from './lab.types'

const LabContext = createContext<LabContextValue | null>(null)

/**
 * Which way each key moves along the collection.
 *
 * Both axes, because the rail reflows: it is a column on the right in landscape and a row along
 * the bottom in portrait, and a keyboard user should not have to know which. The two pairs mean
 * the same thing, which is also what makes this demoable on a laptop without a touchscreen.
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
      // Clamped, not wrapped. Nine drinks on a rail read as a list with two ends; a swipe that
      // silently teleports from 深 back to 翠 loses the sense of a fixed collection.
      const next = Math.min(Math.max(getDrinkIndex(current) + delta, 0), DRINKS.length - 1)
      return DRINKS[next]!.id
    })
  }, [])

  // Keyboard selection lives here rather than on the rail, because this is the one place that
  // owns selection — the rail follows it, and so would anything else that grows a shortcut. It is
  // a window listener, not a rail listener, so the arrows work wherever focus happens to be.
  useEffect(() => {
    // The recipe dialog traps focus and owns the keyboard while it is open; stepping the drink
    // underneath it would change the recipe out from under the reader.
    if (recipeOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
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
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [recipeOpen, step])

  const value = useMemo<LabContextValue>(
    () => ({
      drink: getDrink(selectedId),
      select: setSelectedId,
      step,
      recipeOpen,
      setRecipeOpen,
    }),
    [selectedId, recipeOpen, step],
  )

  return <LabContext value={value}>{children}</LabContext>
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
