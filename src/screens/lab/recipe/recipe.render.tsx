import { useCallback, useState } from 'react'

import { getDrinkRender, type Drink } from '#/domain/drinks'

import { RenderPlaceholder } from '../lab.placeholder'

/**
 * The drink render, reused at smaller scale, in a recessed paper well. Always square; the cell it
 * sits in is sized and placed by `RecipePanel`.
 */
export function RecipeRender({ drink }: { drink: Drink }) {
  const src = getDrinkRender(drink.id)

  // The loaded *source*, not a boolean: the selection can change under a mounted panel during the
  // closing animation, and a boolean would still read `true` for an image that has not arrived.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  // The stage has already painted this render, so the element reports `complete` in the commit,
  // before the browser paints. `onLoad` alone cannot fire that early — and for an image served
  // from cache some engines never fire it at all — which is what showed the placeholder first.
  const measure = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete) setLoadedSrc(src)
    },
    [src],
  )

  const loaded = loadedSrc === src

  return (
    <div className="relative aspect-square w-full bg-paper-shade">
      {loaded ? null : <RenderPlaceholder tone="paper" label={`${drink.romaji} · render`} />}
      <img
        key={src}
        ref={measure}
        src={src}
        alt=""
        onLoad={() => setLoadedSrc(src)}
        decoding="async"
        // A hard swap, not a fade: the panel's own arrival is the calibrated motion, and nothing
        // in this app animates on mount.
        className="absolute inset-0 size-full object-contain"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  )
}
