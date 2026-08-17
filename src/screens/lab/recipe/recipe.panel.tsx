import type { Drink } from '#/domain/drinks'
import { cn } from '#/lib/utils'

import { RecipeBuild } from './recipe.build'
import { RecipeFooter } from './recipe.footer'
import { RecipeHeader } from './recipe.header'
import { RecipeMethod } from './recipe.method'
import { RecipeRender } from './recipe.render'
import { RecipeTasting } from './recipe.tasting'

/**
 * The rice paper and everything printed on it. Requires its parent to be a size container named
 * `recipe` carrying no padding of its own, because `cq` units resolve against the content box.
 *
 * Four arrangements, keyed on the panel's own box: the long axis says which way the groups run, the
 * short axis says whether all four groups fit at all. 600px is the short-axis line — the smallest
 * tablet panel measures 652 on it and the tallest phone one 317, and every panel measured between
 * 504 and 564 overflowed the roomy arrangement.
 *
 * Unprefixed is tall-and-roomy; the other three are mutually exclusive container queries, so only
 * their order against the unprefixed utilities matters, and Tailwind always emits variants after
 * those.
 */
export function RecipePanel({ drink }: { drink: Drink }) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col overflow-hidden bg-paper',
        // The one shadow in the app, lifting the paper off the field.
        '[box-shadow:0_40px_120px_-40px_oklch(from_var(--color-field-deep)_0.22_c_h/0.5)]',
        // Padding tracks the panel's *short* axis, so a panel short on one axis does not spend that
        // axis on margin. A straight line through the two measurements: 56px where the short axis
        // is the masters' 884px, 30px where it is the tightest tablet's 652px.
        'p-(--recipe-pad) [--recipe-pad:clamp(16px,calc(11.2cqmin_-_43px),56px)]',
        '[@container_recipe_((width<600px)_or_(height<600px))]:[--recipe-pad:16px]',
        // The rhythm. Every value compacts with the panel instead of holding still while the
        // content grows, which is what keeps the paper free of a scrollbar.
        '[--recipe-gap:clamp(24px,4.3cqw,56px)]',
        '[--recipe-lead:clamp(20px,3.4cqh,32px)]',
        '[--recipe-band:clamp(16px,2.7cqh,26px)]',
        '[--recipe-step:clamp(10px,1.9cqh,18px)]',
        '[--recipe-row:clamp(22px,3.6cqh,34px)]',
        // A panel short on one axis has no room to breathe, and these clamps would otherwise sit at
        // their upper bound because the *other* axis is still long.
        '[@container_recipe_((width<600px)_or_(height<600px))]:[--recipe-gap:24px]',
        '[@container_recipe_((width<600px)_or_(height<600px))]:[--recipe-lead:14px]',
        '[@container_recipe_((width<600px)_or_(height<600px))]:[--recipe-band:12px]',
        '[@container_recipe_((width<600px)_or_(height<600px))]:[--recipe-step:8px]',
        '[@container_recipe_((width<600px)_or_(height<600px))]:[--recipe-row:22px]',
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
          '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:grid-cols-[var(--recipe-render)_minmax(0,1fr)_minmax(0,1fr)]',
          '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:grid-rows-[minmax(0,1fr)]',
          '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:gap-y-0',
          '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:[--recipe-render:min(36cqw,45cqh)]',
          // Tight: no render, and the three groups that are left run along the panel's long axis as
          // peers — build, method, the rule, tasting, in source order.
          '[@container_recipe_(aspect-ratio<1)_and_(width<600px)]:grid-cols-[minmax(0,1fr)]',
          '[@container_recipe_(aspect-ratio<1)_and_(width<600px)]:grid-rows-[auto_auto_1px_auto]',
          '[@container_recipe_(aspect-ratio>=1)_and_(height<600px)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_1px_minmax(0,0.8fr)]',
          '[@container_recipe_(aspect-ratio>=1)_and_(height<600px)]:grid-rows-[minmax(0,1fr)]',
          '[@container_recipe_(aspect-ratio>=1)_and_(height<600px)]:gap-y-0',
        )}
      >
        {/* The one group a tight panel drops: it is the largest, and it is the only one that
            repeats something the stage was showing a tap ago. */}
        <div
          className={cn(
            'w-(--recipe-render) max-w-full',
            '[@container_recipe_((width<600px)_or_(height<600px))]:hidden',
          )}
        >
          <RecipeRender drink={drink} />
        </div>

        <RecipeBuild drink={drink} />

        {/* METHOD and TASTING NOTE are one group that turns: side by side where the panel is tall,
            stacked where it is wide, and where it is tight the wrapper drops to `display: contents`
            so the same three children become peers of the build column. */}
        <div
          className={cn(
            'col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-(--recipe-gap)',
            '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:col-span-1',
            '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:grid-cols-[minmax(0,1fr)]',
            '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:grid-rows-[auto_1px_minmax(0,1fr)]',
            '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:gap-x-0',
            '[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:gap-y-(--recipe-lead)',
            '[@container_recipe_((width<600px)_or_(height<600px))]:contents',
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
