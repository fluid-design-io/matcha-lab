import type { CSSProperties } from 'react'

import type { Drink } from '#/domain/drinks'
import { cn } from '#/lib/utils'

import { RecipeBuild } from './recipe.build'
import { RecipeFooter } from './recipe.footer'
import { RecipeHeader } from './recipe.header'
import { RecipeMethod } from './recipe.method'
import { RecipeRender } from './recipe.render'
import { RecipeTasting } from './recipe.tasting'

/**
 * The rice paper and everything printed on it.
 *
 * Deliberately knows nothing about dialogs, portals or motion — it is a drink and a rectangle. Its
 * one requirement of whatever renders it is that the parent be a size container named `recipe`
 * with **no padding of its own**: `cqw` resolves against the container's content box, so padding
 * out there would silently shrink every `cq` number in here. `recipe.overlay.tsx` provides that;
 * so does the static harness the layout was checked in.
 *
 * ## The rhythm
 *
 * Five variables, all `cqh`/`cqw` clamps. The centre of each clamp is the measurement off
 * `ref-3-recipe.png` at the 1366×1024 master, and the bounds stop portrait going loose and
 * 1024×768 going tight. This is the whole mechanism that keeps the panel free of a scrollbar: the
 * spacing compacts with the panel instead of holding still while the content grows.
 *
 * ## No nested scrolling
 *
 * Verified at 1366×1024, 1194×834, 1024×1366 and 1024×768, with the drinks that stress each axis —
 * 透 TŌ has five method steps, 深 SHIN has five build rows and the longest steps, 雲 KUMO has the
 * longest footer. If a content change ever breaks it, the fix is the content or these numbers,
 * never `overflow: auto`.
 */
export function RecipePanel({ drink }: { drink: Drink }) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden bg-paper p-(--panel-pad)"
      style={
        {
          // The only shadow in the app, lifting the paper off the field.
          boxShadow: '0 40px 120px -40px oklch(from var(--color-field-deep) 0.22 c h / 0.5)',
          '--recipe-gap': 'clamp(24px, 4.3cqw, 56px)',
          '--recipe-lead': 'clamp(20px, 3.4cqh, 32px)',
          '--recipe-band': 'clamp(16px, 2.7cqh, 26px)',
          '--recipe-step': 'clamp(10px, 1.9cqh, 18px)',
          '--recipe-row': 'clamp(22px, 3.6cqh, 34px)',
        } as CSSProperties
      }
    >
      <RecipeHeader drink={drink} />

      <div
        className={cn(
          'mt-(--recipe-lead) grid min-h-0 flex-1 gap-x-(--recipe-gap) gap-y-(--recipe-lead)',
          // Portrait: render and build share a row, method and tasting sit beneath.
          'grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-[auto_1fr]',
          "[grid-template-areas:'render_build'_'notes_notes']",
          '[--recipe-render:min(45cqw,30cqh)]',
          // Landscape: three columns, the render at the measured 398px.
          '[@container_recipe_(aspect-ratio>=1)]:grid-cols-[var(--recipe-render)_minmax(0,1fr)_minmax(0,1fr)]',
          '[@container_recipe_(aspect-ratio>=1)]:grid-rows-[minmax(0,1fr)]',
          "[@container_recipe_(aspect-ratio>=1)]:[grid-template-areas:'render_build_notes']",
          '[@container_recipe_(aspect-ratio>=1)]:[--recipe-render:min(36cqw,45cqh)]',
        )}
      >
        <RecipeRender drink={drink} />
        <RecipeBuild drink={drink} />

        {/* METHOD and TASTING NOTE are one group that turns: stacked with a horizontal rule
            between them in landscape, side by side with a vertical one in portrait. Same three
            children and the same divider element — the rule stretches into whichever 1px track it
            lands in, which is why portrait is a re-grouping rather than a squeeze. */}
        <div
          className={cn(
            '[grid-area:notes] grid min-w-0',
            'grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-(--recipe-gap)',
            '[@container_recipe_(aspect-ratio>=1)]:grid-cols-[minmax(0,1fr)]',
            '[@container_recipe_(aspect-ratio>=1)]:grid-rows-[auto_1px_minmax(0,1fr)]',
            '[@container_recipe_(aspect-ratio>=1)]:gap-x-0',
            '[@container_recipe_(aspect-ratio>=1)]:gap-y-(--recipe-lead)',
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
