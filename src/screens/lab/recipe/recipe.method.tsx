import type { Drink } from '#/domain/drinks'

import { RecipeLabel } from './recipe.label'

/**
 * `手順 / METHOD` — the imperative steps, numbered.
 *
 * `items-baseline` keeps the 9px numeral on the first line's baseline even when the step wraps,
 * which is the only line it means anything on.
 */
export function RecipeMethod({ drink }: { drink: Drink }) {
  return (
    <section className="min-w-0">
      <RecipeLabel kanji="手順" latin="Method" />

      <ol className="mt-(--recipe-lead) flex flex-col gap-(--recipe-step)">
        {drink.method.map((step, index) => (
          <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4">
            <span className="text-micro tnum untrack text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-body text-on-paper">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
