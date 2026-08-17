import type { Drink } from '#/domain/drinks'

import { RecipeLabel } from './recipe.label'

/**
 * `材料 / BUILD` — every ingredient as a micro-label above a large weight-300 quantity.
 *
 * The label is the small half and the amount is the large half, which is the inverse of how a
 * recipe usually sets and the reason this column reads as a specification rather than a list. Row
 * count runs 2 (翠 SUI) to 5 (深 SHIN); the rhythm is `--recipe-band`, which shrinks with the
 * panel, so five rows fit the shortest viewport without the two-row drinks looking stranded.
 */
export function RecipeBuild({ drink }: { drink: Drink }) {
  return (
    <section className="[grid-area:build] min-w-0">
      <RecipeLabel kanji="材料" latin="Build" />

      <ul className="mt-(--recipe-lead) flex flex-col gap-(--recipe-band)">
        {drink.build.map((item) => (
          <li key={item.label}>
            {/* No `untrack` here, deliberately: trailing-space compensation is for runs that align
                to a right edge or sit beside an icon, and this one is a left-aligned block. On a
                full-width block it does nothing but push the box 3px past its column. */}
            <p className="text-label uppercase text-on-paper-muted">
              {item.label}
              {item.optional ? ' · optional' : null}
            </p>
            {/* Tabular, so `5 ml` and `180–220 ml` share a digit width down the column. */}
            <p className="text-quantity tnum mt-2 text-on-paper">{item.amount}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
