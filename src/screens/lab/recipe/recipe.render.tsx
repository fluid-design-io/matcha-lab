import { useState } from 'react'
import Picture from '@gravity-ui/icons/Picture'

import { getDrinkRender, type Drink } from '#/domain/drinks'

/**
 * The drink render, reused at smaller scale, in a recessed paper well.
 *
 * The renders are flat `#7B8F63` squares — on the main view they melt into the field, and here they
 * become the one window of colour on the rice paper. That is the point: the panel repeats the
 * composition rather than re-styling it.
 *
 * `--recipe-render` is a container-query size set by the arrangement (`min(36cqw, 45cqh)` in
 * landscape, `min(45cqw, 30cqh)` in portrait) — see `recipe.overlay.tsx`. `max-w-full` plus
 * `aspect-square` means the square survives being narrower than its nominal size in portrait,
 * where the grid column and the render are within a pixel of each other.
 */
export function RecipeRender({ drink }: { drink: Drink }) {
  // The loaded *source*, not a boolean: if the selection changes under a mounted panel — which it
  // can, during the closing animation — a boolean would still read `true` for an image that has
  // not arrived, and the well would flash empty at full opacity.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const src = getDrinkRender(drink.id)
  const loaded = loadedSrc === src

  return (
    <div className="[grid-area:render] w-(--recipe-render) max-w-full">
      <div className="relative aspect-square w-full bg-paper-shade">
        {loaded ? null : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border border-dashed border-hairline">
            <Picture width={20} height={20} className="text-on-paper-faint" aria-hidden />
            <p className="text-detail text-on-paper-faint">{drink.romaji} · render</p>
          </div>
        )}
        <img
          key={src}
          src={src}
          alt=""
          onLoad={() => setLoadedSrc(src)}
          decoding="async"
          className="absolute inset-0 size-full object-contain transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>
    </div>
  )
}
