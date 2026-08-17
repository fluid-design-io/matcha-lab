import { useEffect } from 'react'
import { motion, type MotionValue } from 'motion/react'

import { neighbourRenders } from '#/domain/drinks'

import { useLab } from './lab.context'
import { useDrinkSwipe } from './lab.gestures'
import { LabLayer } from './lab.layer'
import { LabRender } from './lab.render'

/**
 * The watermark and the render frame — the two things that occupy the stage — plus the surface
 * that receives the swipe. Both visible pieces are absolutely positioned inside the stage cell, so
 * neither can push the footer down.
 */
export function LabStage() {
  const { x, surface } = useDrinkSwipe()

  return (
    <>
      <LabWatermark />
      <LabRenderFrame x={x} />

      {/* The whole stage receives the gesture rather than the render alone: in landscape the render
          sits at 76% of the stage and a thumb at the left bezel would find nothing there. The
          surface itself never moves — `_dragX` sends the offset to the render instead — so it
          cannot drift over the rail column and eat a tap during the snap-back. */}
      <motion.div aria-hidden className="absolute inset-0" {...surface} />
    </>
  )
}

/**
 * The selected drink's character at enormous scale and 14% opacity — the atmosphere of the whole
 * screen, and the last and slowest of the six layers. Clipped by the stage deliberately: a
 * character that runs off the edge reads as a watermark rather than as very large type.
 */
function LabWatermark() {
  const { drink } = useLab()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <LabLayer layer="watermark" className="size-full">
        {/* Noto Sans JP's ink sits ~9% of the font size below its em box's centre, so both offsets
            are corrections for that: -52% rather than -1/2 in landscape, and the portrait 4% puts
            the ink centre on y=300 at the 1024x1366 master. */}
        <span className="font-jp absolute top-[4%] left-1/2 -translate-x-1/2 select-none text-(length:--watermark-size) leading-none font-[200] text-on-field-ghost land:top-1/2 land:left-[6svw] land:translate-x-0 land:-translate-y-[52%]">
          {drink.kanji}
        </span>
      </LabLayer>
    </div>
  )
}

/**
 * A square, sized off the short viewport axis, holding one drink image — never a rectangle, never
 * cropped. Two transforms stack and do not fight: Tailwind's centring uses the `translate`
 * property, Motion's swipe offset uses `transform`, and the browser applies `translate` first.
 */
function LabRenderFrame({ x }: { x: MotionValue<number> }) {
  const { drink } = useLab()

  // Warm the two renders a single gesture can reach, so the incoming layer of the dissolve has a
  // decoded image in it rather than cross-fading from blank.
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
        <LabRender drink={drink} tone="field" />
      </LabLayer>
    </motion.div>
  )
}
