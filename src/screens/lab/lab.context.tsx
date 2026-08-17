import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'

import { DRINKS, OPENING_DRINK_ID, getDrink, getDrinkIndex, type DrinkId } from '#/domain/drinks'

import type { LabContextValue } from './lab.types'

const LabContext = createContext<LabContextValue | null>(null)

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

export function useLab(): LabContextValue {
  const value = use(LabContext)
  if (!value) throw new Error('useLab must be used inside <LabProvider>')
  return value
}
