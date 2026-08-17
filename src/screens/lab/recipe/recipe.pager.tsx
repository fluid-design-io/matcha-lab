import ArrowLeft from '@gravity-ui/icons/ArrowLeft'
import ArrowRight from '@gravity-ui/icons/ArrowRight'

import { DRINKS, getDrinkIndex } from '#/domain/drinks'
import { cn } from '#/lib/utils'

import { useLab } from '../lab.context'

/**
 * Step to the neighbouring drink without leaving the panel. It drives the same clamped `step` the
 * rail and the swipe do, so the collection has one notion of "next" wherever you move it from.
 */
export function RecipePager() {
  const { drink, step } = useLab()
  const index = getDrinkIndex(drink.id)

  return (
    // The 44px targets bleed 14px past the 16px glyphs, so the row stays the height of the metadata
    // line beside it and the trailing arrow's ink lands on the panel's content margin.
    <div className="-my-3.5 -mr-3.5 flex shrink-0 items-center">
      <PagerStep direction={-1} disabled={index <= 0} onStep={step} />
      <PagerStep direction={1} disabled={index >= DRINKS.length - 1} onStep={step} />
    </div>
  )
}

type PagerStepProps = {
  direction: -1 | 1
  disabled: boolean
  onStep: (delta: number) => void
}

/**
 * One arrow. At the end it holds its place and goes inert at `--color-on-paper-faint` — an end that
 * vanishes reflows the footer, and the ends of this collection are a fact worth showing.
 *
 * `aria-disabled` rather than `disabled`, because paging to an end with the keyboard would otherwise
 * destroy the focused control and hand focus back to the dialog's trap.
 */
function PagerStep({ direction, disabled, onStep }: PagerStepProps) {
  const Icon = direction === 1 ? ArrowRight : ArrowLeft

  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      aria-label={direction === 1 ? 'Next recipe' : 'Previous recipe'}
      onClick={() => {
        if (!disabled) onStep(direction)
      }}
      className={cn(
        'flex size-(--tap) items-center justify-center transition-colors',
        disabled ? 'cursor-default text-on-paper-faint' : 'text-on-paper-muted hover:text-on-paper',
      )}
    >
      <Icon width={16} height={16} aria-hidden />
    </button>
  )
}
