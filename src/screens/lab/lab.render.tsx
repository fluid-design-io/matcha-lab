import { useCallback, useState } from 'react'
import Picture from '@gravity-ui/icons/Picture'

import { getDrinkRender, type Drink } from '#/domain/drinks'
import { cn } from '#/lib/utils'

/** Which surface the render is drawn on — the field, or the recipe panel's paper well. */
type RenderTone = 'field' | 'paper'

type LabRenderProps = {
  drink: Drink
  tone: RenderTone
}

/**
 * One drink's image, filling the box it is given, with the dashed frame standing in until the image
 * has decoded. The swap is hard rather than faded — nothing in this app animates on mount, and on
 * the stage the dissolve around it is already the fade.
 */
export function LabRender({ drink, tone }: LabRenderProps) {
  const src = getDrinkRender(drink.id)

  // The loaded *source*, not a boolean: the selection can change under a mounted component, and a
  // boolean would still read `true` for an image that has not arrived.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  // The ref callback runs in the commit, before paint, so reading `complete` there is what stops
  // the placeholder flashing — `onLoad` is too late, and cached images may never fire it at all.
  const measure = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete) setLoadedSrc(src)
    },
    [src],
  )

  const loaded = loadedSrc === src

  return (
    <>
      {/* The reference reads "NAGI · glass render", but each drink has its own true vessel and only
          some of them are glasses. Naming the drink is enough. */}
      {loaded ? null : <RenderPlaceholder tone={tone} label={`${drink.romaji} · render`} />}
      <img
        key={src}
        ref={measure}
        src={src}
        // Decorative deliberately: the title block already says every word an alt could carry, and
        // during a dissolve there are briefly two of these in the DOM.
        alt=""
        onLoad={() => setLoadedSrc(src)}
        decoding="async"
        // Otherwise the browser's own drag-and-drop takes the pointer off the stage's swipe and
        // shows a ghost image of the render.
        draggable={false}
        // The one thing in the app carrying real colour, and the reason the frame is square. No
        // radius, no border, no shadow.
        className="absolute inset-0 size-full object-contain"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </>
  )
}

/**
 * The empty and loading frame — the only surviving trace of the mockups' upload drop-zone. There is
 * no upload: the nine renders ship with the app, so this is a loading state and nothing else.
 */
function RenderPlaceholder({ label, tone }: { label: string; tone: RenderTone }) {
  return (
    <div
      // Colour is set once here and inherited: the icon takes `currentColor` and never its own token.
      // On paper it carries the recessed fill too, since the render that replaces it is opaque.
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 border border-dashed',
        tone === 'field'
          ? 'border-hairline-field text-on-field-faint'
          : 'border-hairline bg-paper-shade text-on-paper-faint',
      )}
    >
      <Picture width={20} height={20} aria-hidden />
      <p className="text-detail">{label}</p>
    </div>
  )
}
