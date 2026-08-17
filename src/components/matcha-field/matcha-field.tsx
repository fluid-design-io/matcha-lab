import { useMemo, useRef, useState } from 'react'
import { common } from 'typegpu'
import {
  ClientOnly,
  Root,
  useConfigureContext,
  useFrame,
  useRoot,
} from '@typegpu/react'

import { prefersReducedMotion } from '#/lib/motion'

import { FieldUniforms, fieldFragment, fieldLayout } from './matcha-field.shader'

/**
 * How often the field is allowed to redraw. The field both drifts and reshapes itself, but even at
 * its steepest a pixel only moves about 1.4/255 per second, which is 0.06/255 between frames at
 * this rate — far inside one quantisation step, so 24 fps is indistinguishable from sixty and the
 * mottling cannot be caught stepping. The shader is a couple of noise samples deep; the cost here
 * is the fragment count, not the frame rate, which is why this is a cap and not a target.
 */
const FRAME_INTERVAL_SECONDS = 1 / 24

const PRESENTATION_FORMAT =
  typeof navigator !== 'undefined' && navigator.gpu
    ? navigator.gpu.getPreferredCanvasFormat()
    : 'bgra8unorm'

/**
 * The iPad is a 2x display and this surface is a slow gradient — there is nothing above 2x for
 * the extra pixels to resolve, and they cost real battery on a canvas that never stops drawing.
 */
const MAX_PIXEL_RATIO = 2

/**
 * The `#7B8F63` ground as a living surface — the one shader-drawn thing in the app, full-bleed
 * behind everything. There is no WebGPU fallback and none is needed: `body` already paints flat
 * `#7B8F63`, so a device that never resolves just leaves a still version of the app.
 */
export function MatchaField() {
  return (
    // Root outside, ClientOnly inside: the hooks below suspend until the GPU device resolves, and
    // the Suspense boundary has to sit between the provider and its consumers to catch that.
    <Root>
      <ClientOnly>
        <FieldCanvas />
      </ClientOnly>
    </Root>
  )
}

function FieldCanvas() {
  const root = useRoot()
  // autoResize off — the frame loop sizes the backing store instead, so it self-heals on rotation
  // without depending on a ResizeObserver delivering `contentBoxSize`, which not every engine does.
  const { ref, ctxRef } = useConfigureContext({
    format: PRESENTATION_FORMAT,
    alphaMode: 'opaque',
    autoResize: false,
  })

  const [painted, setPainted] = useState(false)

  const { pipeline, uniform } = useMemo(() => {
    const buffer = root.createUniform(FieldUniforms)
    return {
      uniform: buffer,
      pipeline: root
        .createRenderPipeline({
          vertex: common.fullScreenTriangle,
          fragment: fieldFragment,
          targets: { format: PRESENTATION_FORMAT },
        })
        .with(root.createBindGroup(fieldLayout, { field: buffer })),
    }
  }, [root])

  const lastDraw = useRef(Number.NEGATIVE_INFINITY)
  const lastSize = useRef('')

  useFrame(({ elapsedSeconds }) => {
    const context = ctxRef.current
    if (!context) return

    const canvas = context.canvas as HTMLCanvasElement
    const ratio = Math.min(globalThis.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    const width = Math.round(canvas.clientWidth * ratio)
    const height = Math.round(canvas.clientHeight * ratio)
    if (width === 0 || height === 0) return

    const size = `${width}x${height}`
    const resized = size !== lastSize.current
    if (resized) {
      canvas.width = width
      canvas.height = height
    }

    // Reduced motion keeps the field and stops the drift: time freezes at zero, so redrawing
    // would burn battery for an identical image.
    const still = prefersReducedMotion()

    if (!painted) {
      // Always take the first frame, even while hidden, so a tab brought forward already has its
      // field painted rather than showing bare body colour.
    } else if (typeof document !== 'undefined' && document.hidden) {
      // requestAnimationFrame already throttles in most browsers, but "most" is not a guarantee
      // worth spending battery on.
      return
    } else if (still) {
      if (!resized) return
    } else if (!resized && elapsedSeconds - lastDraw.current < FRAME_INTERVAL_SECONDS) {
      return
    }

    lastDraw.current = elapsedSeconds
    lastSize.current = size

    uniform.write({
      resolution: [width, height],
      time: still ? 0 : elapsedSeconds,
      pixelRatio: ratio,
    })
    pipeline.withColorAttachment({ view: context }).draw(3)

    if (!painted) setPainted(true)
  })

  return (
    <canvas
      ref={ref}
      aria-hidden
      // z-0, never a negative z-index: body does not establish a stacking context, so a negative
      // one would be hoisted and painted behind body's own flat #7B8F63, rendering perfectly and
      // invisibly. Fading in over that colour makes the handover a settle rather than a swap.
      className="pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-700 ease-out"
      style={{ opacity: painted ? 1 : 0 }}
    />
  )
}
