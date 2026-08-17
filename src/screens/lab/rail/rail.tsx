import { useEffect, useRef } from 'react'

import { DRINKS } from '#/domain/drinks'

import { useLab } from '../lab.context'
import { RailItem } from './rail.item'

/**
 * The nine, as one component that reflows — vertical on the right edge in landscape, horizontal
 * along the bottom in portrait, never two components swapped, which is what lets a rotation preserve
 * selection and the accent underline slide rather than be rebuilt. In portrait the nine slots are
 * wider than the content column and bleed into the shell's edge padding: the boxes bleed, the ink
 * does not.
 */
export function Rail() {
  const { drink, select } = useLab()
  const navRef = useRef<HTMLElement>(null)

  // Roving tabindex, so the rail is one tab stop rather than nine. Following the selection that
  // `LabProvider` owns, rather than handling keys here, keeps selection in one place.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !nav.contains(document.activeElement)) return
    nav.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus()
  }, [drink.id])

  return (
    <nav
      ref={navRef}
      aria-label="Drinks"
      // Slots stretch to the whole band, so no part of the ruled area is dead to a finger.
      className="flex h-(--rail-band) w-full justify-center border-t border-hairline-field land:h-full land:flex-col land:justify-center land:border-t-0"
    >
      {DRINKS.map((candidate) => (
        <RailItem
          key={candidate.id}
          drink={candidate}
          selected={candidate.id === drink.id}
          onSelect={(next) => select(next.id)}
        />
      ))}
    </nav>
  )
}
