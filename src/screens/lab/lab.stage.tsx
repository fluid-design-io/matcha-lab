import { useCallback, useEffect, useState } from 'react'
import { motion, type MotionValue } from 'motion/react'
import Picture from '@gravity-ui/icons/Picture'

import { getDrinkRender, neighbourRenders, type Drink } from '#/domain/drinks'

import { useLab } from './lab.context'
import { useDrinkSwipe } from './lab.gestures'
import { LabLayer } from './lab.layer'

/**
 * The watermark and the render frame — the two things that occupy the stage — plus the surface
 * that receives the swipe.
 *
 * Both visible pieces are absolutely positioned inside the stage cell so neither can push the
 * footer down, which is what keeps the single-viewport promise honest at every size.
 */
export function LabStage() {
  const { x, surface } = useDrinkSwipe()

  return (
    <>
      <LabWatermark />
      <LabRenderFrame x={x} />

      {/* The gesture surface is the whole stage rather than the render alone. In landscape the
          render sits at 76% of the stage and a thumb resting at the left bezel would find nothing
          there; the render is still the only thing that visibly answers. Nothing underneath is
          interactive, so covering it costs nothing. */}
      <motion.div aria-hidden className="absolute inset-0" {...surface} />
    </>
  )
}

/**
 * The selected drink's character at enormous scale and 14% opacity — the atmosphere of the whole
 * screen. Landscape anchors it to the left edge and centres it vertically; portrait centres it
 * horizontally near the top, so it overlaps the head of the render exactly as reference 1 shows.
 *
 * Clipped by the stage, deliberately: the widest kanji reach past the left margin, and a character
 * that runs off the edge reads as a watermark rather than as a very large piece of type.
 *
 * Last and slowest of the six layers — the only thing in the composition that says it has depth.
 */
function LabWatermark() {
  const { drink } = useLab()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <LabLayer layer="watermark" className="size-full">
        {/* -translate-y-[52%], not -1/2. Noto Sans JP's ink sits ~9% of the font size below its em
            box's centre, so centring the box leaves the character low on the axis. Measured
            against the reference with TextMetrics rather than guessed — the element box is a poor
            proxy for where a CJK glyph actually is. The portrait 4% is the same correction from
            the other end: it puts the ink centre on y=300 at the 1024x1366 master. */}
        <span className="font-jp absolute top-[4%] left-1/2 -translate-x-1/2 select-none text-(length:--watermark-size) leading-none font-[200] text-on-field-ghost land:top-1/2 land:left-[6svw] land:translate-x-0 land:-translate-y-[52%]">
          {drink.kanji}
        </span>
      </LabLayer>
    </div>
  )
}

/**
 * A square, sized off the short viewport axis, holding one drink image.
 *
 * Landscape sits it right of centre, in the space between the watermark and the rail; portrait
 * centres it. It is never a rectangle and it never crops.
 *
 * Two transforms stack here and do not fight: Tailwind's centring uses the `translate` property,
 * Motion's swipe offset uses `transform`, and the browser applies `translate` first.
 */
function LabRenderFrame({ x }: { x: MotionValue<number> }) {
  const { drink } = useLab()

  // Warm the two renders a single gesture can reach, so a swipe or an arrow key lands on a
  // decoded image rather than on the empty frame. Without this the incoming layer of the dissolve
  // has nothing in it and cross-fades from blank.
  useEffect(() => {
    for (const href of neighbourRenders(drink.id)) {
      const image = new Image()
      image.src = href
    }
  }, [drink.id])

  return (
    <motion.div
      style={{ x }}
      className="absolute top-1/2 left-1/2 size-(--frame-size) -translate-x-1/2 -translate-y-1/2 land:left-[76%]"
    >
      <LabLayer layer="render" className="size-full">
        <RenderImage drink={drink} />
      </LabLayer>
    </motion.div>
  )
}

/**
 * One drink's image, inside one dissolving layer.
 *
 * The image used to own a 300ms opacity fade of its own. It does not any more: two fades on the
 * same element is one fade too many, and the dissolve is the one that was calibrated. What is
 * left is a hard swap from placeholder to image, which is invisible on a warm render and is the
 * honest empty state on a cold one.
 */
function RenderImage({ drink }: { drink: Drink }) {
  const [loaded, setLoaded] = useState(false)

  // A neighbour is already decoded by the time a gesture reaches it, so `complete` is true before
  // this layer's first paint. Reading it off the element in the ref callback — which runs in the
  // commit, before the browser paints — is what stops the placeholder flashing for one frame on
  // every change. `onLoad` alone does not fire early enough, and for a cached image some engines
  // do not fire it at all.
  const measure = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true)
  }, [])

  return (
    <>
      {loaded ? null : (
        // The reference reads "NAGI · glass render", but each drink has its own true vessel and
        // only some of them are glasses. Naming the drink is enough.
        <RenderFramePlaceholder label={`${drink.romaji} · render`} />
      )}
      <img
        ref={measure}
        src={getDrinkRender(drink.id)}
        // Decorative, deliberately. Every word an alt could carry here — the name, the vessel, the
        // ingredients — the title block already says, and during a dissolve there are briefly two
        // of these in the DOM. One description, in the block that owns it.
        alt=""
        onLoad={() => setLoaded(true)}
        decoding="async"
        // Otherwise the browser's own drag-and-drop takes the pointer off the swipe and shows a
        // ghost image of the render.
        draggable={false}
        // The render is the only thing in the app carrying real colour, and it is the reason the
        // frame is square. No radius, no border, no shadow.
        className="absolute inset-0 size-full object-contain"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </>
  )
}

/**
 * The empty and loading state — the only surviving trace of the mockups' upload drop-zone. There
 * is no upload: the nine renders ship with the app, and "or browse files" does not exist here.
 */
function RenderFramePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 border border-dashed border-hairline-field">
      <Picture width={20} height={20} className="text-on-field-faint" aria-hidden />
      <p className="text-detail text-on-field-faint">{label}</p>
    </div>
  )
}
