import type { Drink } from '#/domain/drinks'

import { RecipeLabel } from './recipe.label'

/**
 * `手順 / METHOD` — the imperative steps, numbered.
 *
 * The numbers are the only accent in the body of the panel and they are `--text-micro`, a third
 * the height of the step they count. `items-baseline` sits a 9px numeral on the same baseline as
 * the 18px step, including when the step wraps to a second line at the narrower viewports — the
 * number stays on the first line, which is the only place it means anything.
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
