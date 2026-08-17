import { DRINKS } from '#/domain/drinks'

import { useLab } from '../lab.context'
import { RailItem } from './rail.item'

/**
 * The nine, as one component that **reflows** — vertical on the right edge in landscape,
 * horizontal along the bottom in portrait. Same nine children, same selection state, same
 * underline; only the flow direction and the label placement change.
 *
 * Never two components swapped. That is what lets a rotation preserve selection, and later what
 * lets the accent underline animate between orientations instead of being torn down and rebuilt.
 */
export function Rail() {
  const { drink, select } = useLab()

  return (
    <nav
      aria-label="Drinks"
      className="flex h-full w-full items-stretch justify-center border-t border-hairline-field pt-7 land:flex-col land:border-t-0 land:pt-0"
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
