import type { Drink } from '#/domain/drinks'
import { cn } from '#/lib/utils'

import { LabRender } from '../lab.render'
import { RecipeBuild } from './recipe.build'
import { RecipeFooter } from './recipe.footer'
import { RecipeHeader } from './recipe.header'
import { RecipeMethod } from './recipe.method'
import { RecipeTasting } from './recipe.tasting'

/**
 * The rice paper and everything printed on it, in whichever of the four `recipe-*` arrangements the
 * panel's own box asks for. Requires its parent to be a size container named `recipe` carrying no
 * padding of its own, because `cq` units resolve against the content box.
 */
export function RecipePanel({ drink }: { drink: Drink }) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col overflow-hidden bg-paper',
        'grain',
        'after:absolute after:inset-0 after:bg-linear-to-br after:from-scrim/15 after:to-transparent after:pointer-events-none',
        // The one shadow in the app, lifting the paper off the field.
        '[box-shadow:0_40px_120px_-40px_oklch(from_var(--color-field-deep)_0.22_c_h/0.5)]',
        // Padding tracks the panel's *short* axis, so a panel short on one axis does not spend that
        // axis on margin. A straight line through the two measurements: 56px where the short axis
        // is the masters' 884px, 30px where it is the tightest tablet's 652px.
        'p-(--recipe-pad) [--recipe-pad:clamp(16px,calc(11.2cqmin_-_43px),56px)]',
        'recipe-tight:[--recipe-pad:16px]',
        // The rhythm. Every value compacts with the panel instead of holding still while the
        // content grows, which is what keeps the paper free of a scrollbar.
        '[--recipe-gap:clamp(24px,4.3cqw,56px)]',
        '[--recipe-lead:clamp(20px,3.4cqh,32px)]',
        '[--recipe-band:clamp(16px,2.7cqh,26px)]',
        '[--recipe-step:clamp(10px,1.9cqh,18px)]',
        '[--recipe-row:clamp(22px,3.6cqh,34px)]',
        // A panel short on one axis has no room to breathe, and these clamps would otherwise sit at
        // their upper bound because the *other* axis is still long.
        'recipe-tight:[--recipe-gap:24px]',
        'recipe-tight:[--recipe-lead:14px]',
        'recipe-tight:[--recipe-band:12px]',
        'recipe-tight:[--recipe-step:8px]',
        'recipe-tight:[--recipe-row:22px]',
      )}
    >
      <RecipeHeader drink={drink} />

      <div
        className={cn(
          'mt-(--recipe-lead) grid min-h-0 flex-1 gap-x-(--recipe-gap) gap-y-(--recipe-lead)',
          // Tall and roomy: render and build share a row, the notes group spans beneath them.
          'grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]',
          '[--recipe-render:min(45cqw,30cqh)]',
          // Wide and roomy: three columns, the render at the measured 398px.
          'recipe-wide-roomy:grid-cols-[var(--recipe-render)_minmax(0,1fr)_minmax(0,1fr)]',
          'recipe-wide-roomy:grid-rows-[minmax(0,1fr)]',
          'recipe-wide-roomy:gap-y-0',
          'recipe-wide-roomy:[--recipe-render:min(36cqw,45cqh)]',
          // Tight: no render, and the three groups that are left run along the panel's long axis as
          // peers — build, method, the rule, tasting, in source order.
          'recipe-tall-tight:grid-cols-[minmax(0,1fr)]',
          'recipe-tall-tight:grid-rows-[auto_auto_1px_auto]',
          'recipe-wide-tight:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_1px_minmax(0,0.8fr)]',
          'recipe-wide-tight:grid-rows-[minmax(0,1fr)]',
          'recipe-wide-tight:gap-y-0',
        )}
      >
        {/* The one group a tight panel drops: it is the largest, and it is the only one that
            repeats something the stage was showing a tap ago. */}
        <div className="w-(--recipe-render) max-w-full recipe-tight:hidden">
          {/* The well, at the size the cell around it sets. Always square, and unfilled — the
              render's own ground is opaque, so a fill behind it would only ever be the empty
              state's, which `LabRender` carries. */}
          <div className="relative aspect-square w-full">
            <LabRender drink={drink} tone="paper" />
          </div>
        </div>

        <RecipeBuild drink={drink} />

        {/* METHOD and TASTING NOTE are one group that turns: side by side where the panel is tall,
            stacked where it is wide, and where it is tight the wrapper drops to `display: contents`
            so the same three children become peers of the build column. */}
        <div
          className={cn(
            'col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-(--recipe-gap)',
            'recipe-wide-roomy:col-span-1',
            'recipe-wide-roomy:grid-cols-[minmax(0,1fr)]',
            'recipe-wide-roomy:grid-rows-[auto_1px_minmax(0,1fr)]',
            'recipe-wide-roomy:gap-x-0',
            'recipe-wide-roomy:gap-y-(--recipe-lead)',
            'recipe-tight:contents',
          )}
        >
          <RecipeMethod drink={drink} />
          <span aria-hidden className="bg-hairline" />
          <RecipeTasting drink={drink} />
        </div>
      </div>

      <RecipeFooter drink={drink} />
    </div>
  )
}
