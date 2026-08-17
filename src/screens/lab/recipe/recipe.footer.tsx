import { MATCHA_BASE, SERVE_LABEL, type Drink } from '#/domain/drinks'

/**
 * The metadata band: what the kanji means, how it is served, and what the shared base is.
 *
 * This is the only place the gloss survives a rotation — the main view's title block drops it in
 * portrait.
 */
export function RecipeFooter({ drink }: { drink: Drink }) {
  return (
    <footer className="mt-(--recipe-lead) shrink-0">
      <span aria-hidden className="block h-px w-full bg-hairline" />

      <div className="mt-(--recipe-lead)">
        <p className="text-detail min-w-0 text-on-paper-faint">
          <span className="font-jp">{drink.kanji}</span>
          {' — '}
          {drink.gloss}
          <span className="px-2.5">·</span>
          <span className="text-label untrack uppercase text-on-paper-muted">
            {SERVE_LABEL[drink.serve]}
          </span>
          <span className="px-2.5">·</span>
          matcha base {MATCHA_BASE.temperature}
        </p>
      </div>
    </footer>
  )
}
