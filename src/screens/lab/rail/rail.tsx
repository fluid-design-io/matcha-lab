import { useEffect, useRef } from 'react'

import { DRINKS } from '#/domain/drinks'

import { useLab } from '../lab.context'
import { RailItem } from './rail.item'

/**
 * The nine, as one component that **reflows** — vertical on the right edge in landscape,
 * horizontal along the bottom in portrait. Same nine children, same selection state, same
 * underline; only the flow direction and the label placement change.
 *
 * Never two components swapped. That is what lets a rotation preserve selection, and what lets
 * the accent underline slide between orientations instead of being torn down and rebuilt.
 *
 * In portrait the nine slots are wider than the content column — 972px of pitch against 912px of
 * column at the master — and they overflow the centred row symmetrically into the shell's edge
 * padding. That is what the reference shows: the slot boxes bleed, the glyph ink does not, and
 * the outermost hit targets reach further towards the bezel for it. The rule above the rail stays
 * on the nav, so it keeps the content width.
 */
export function Rail() {
  const { drink, select } = useLab()
  const navRef = useRef<HTMLElement>(null)

  // Roving tabindex: only the selected slot is a tab stop, so the rail is one stop rather than
  // nine, and the arrow keys that `LabProvider` owns move the focus ring along with the
  // selection. Following focus here rather than handling keys here keeps selection in one place.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !nav.contains(document.activeElement)) return
    nav.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus()
  }, [drink.id])

  return (
    <nav
      ref={navRef}
      aria-label="Drinks"
      className="flex h-(--rail-band) w-full items-end justify-center border-t border-hairline-field land:h-full land:flex-col land:items-stretch land:justify-center land:border-t-0"
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
