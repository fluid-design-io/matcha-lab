import type { Drink } from '#/domain/drinks'
import { cn } from '#/lib/utils'

import { RecipeLabel } from './recipe.label'

/**
 * `材料 / BUILD` — every ingredient as a micro-label above a large weight-300 quantity. A tight
 * panel turns each row onto one line instead, because five stacked rows do not fit a phone.
 */
export function RecipeBuild({ drink }: { drink: Drink }) {
  return (
    <section className="min-w-0">
      <RecipeLabel kanji="材料" latin="Build" />

      <ul className="mt-(--recipe-lead) flex flex-col gap-(--recipe-band)">
        {drink.build.map((item) => (
          <li
            key={item.label}
            className="recipe-tight:flex recipe-tight:items-baseline recipe-tight:justify-between recipe-tight:gap-4"
          >
            {/* No `untrack`: trailing-space compensation is for runs that align to a right edge or
                sit beside an icon, and on this left-aligned block it only pushes the box out. */}
            <p className="text-label uppercase text-on-paper-muted">
              {item.label}
              {item.optional ? ' · optional' : null}
            </p>
            {/* Tabular, so `5 ml` and `180–220 ml` share a digit width down the column. */}
            <p className={cn('text-quantity tnum mt-2 shrink-0 text-on-paper', 'recipe-tight:mt-0')}>
              {item.amount}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
