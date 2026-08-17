import { useLab } from './lab.context'
import { LabLayer } from './lab.layer'

/**
 * The title block and the recipe affordance — the bottom band of the composition. Portrait drops
 * the kanji gloss from the title row, which has to share its width with the affordance there; it
 * survives in the recipe overlay's footer.
 */
export function LabFooter() {
  return (
    <div className="flex items-end justify-between gap-8">
      <LabTitle />
      <LabRecipeAffordance />
    </div>
  )
}

/**
 * Three of the six dissolving layers, and the first three to move: romaji, then title, then the
 * ingredient line. The vertical rhythm sits on the layers rather than the type, because the layer
 * is the flex child.
 */
function LabTitle() {
  const { drink } = useLab()

  return (
    <div className="flex min-w-0 flex-col">
      {/* The document's only h1, and the one thing assistive tech reads when the drink changes.
          The three visible layers below are hidden from it, because `AnimatePresence` keeps the
          outgoing drink in the DOM for the length of the dissolve. */}
      <h1 aria-live="polite" className="sr-only">
        {drink.romaji} — {drink.name}. {drink.ingredientLine}. {drink.gloss}.
      </h1>

      <LabLayer layer="romaji">
        <p aria-hidden className="text-romaji text-accent untrack uppercase">
          {drink.romaji}
        </p>
      </LabLayer>

      <LabLayer layer="title" className="mt-3.5">
        <p aria-hidden className="text-title text-on-field">
          {drink.name}
        </p>
      </LabLayer>

      <LabLayer layer="detail" className="mt-3">
        <p aria-hidden className="text-detail text-on-field-faint">
          {drink.ingredientLine}
          <span className="hidden land:inline">
            {'   —   '}
            {drink.gloss}
          </span>
        </p>
      </LabLayer>
    </div>
  )
}

/**
 * The affordance does not dissolve: it says the same thing about every drink, and a label that
 * cross-fades into an identical copy of itself is motion with nothing to say.
 */
function LabRecipeAffordance() {
  const { drink, setRecipeOpen } = useLab()

  return (
    <button
      type="button"
      onClick={() => setRecipeOpen(true)}
      aria-label={`Recipe for ${drink.name}`}
      className="group flex shrink-0 flex-col items-end gap-1 land:mb-4 land:flex-row land:items-center land:gap-4"
    >
      {/* The affordance's only ornament, and landscape is the only place there is room for it. It
          grows on hover by scaling a fixed 96px box from its right edge — animating `width` would
          put a layout pass in every frame of it. */}
      <span
        aria-hidden
        className="hidden h-px w-24 origin-right scale-x-[0.875] bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100 land:block"
      />
      <span className="font-jp text-kanji-sm text-on-field-strong untrack">作り方</span>
      <span className="text-label text-on-field-muted untrack uppercase">Recipe →</span>
    </button>
  )
}
