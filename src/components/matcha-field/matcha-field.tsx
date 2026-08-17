import { useMemo, useRef, useState } from 'react'
import { common } from 'typegpu'
import {
  ClientOnly,
  Root,
  useConfigureContext,
  useFrame,
  useRoot,
} from '@typegpu/react'

import { FieldUniforms, fieldFragment, fieldLayout } from './matcha-field.shader'

/**
 * How often the field is allowed to redraw.
 *
 * The drift moves a feature across the screen in about four minutes, so a frame every 80 ms is
 * indistinguishable from sixty a second — and this runs continuously on battery, behind
 * everything, for as long as the app is open. 12 fps is the cheapest rate that still looks
 * continuous at this speed.
 */
const FRAME_INTERVAL_SECONDS = 1 / 12

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
 * behind everything.
 *
 * There is **no WebGPU fallback**: the target is iPadOS 26+ and modern browsers only. `body`
 * already paints flat `#7B8F63`, so if the device never resolves, the canvas simply never fades
 * in and the app looks like a still version of itself. That is first paint doing its job, not a
 * fallback path.
 */
export function MatchaField() {
  return (
    // Root outside, ClientOnly inside: the hooks below suspend until the GPU device resolves, and
    // the Suspense boundary has to sit *between* the provider and its consumers to catch that.
    <Root>
      <ClientOnly>
        <FieldCanvas />
      </ClientOnly>
    </Root>
  )
}

function FieldCanvas() {
  const root = useRoot()
  // autoResize off — the backing store is sized in the frame loop instead. One owner, a capped
  // pixel ratio, and it self-heals on rotation without depending on a ResizeObserver delivering
  // a `contentBoxSize` (which not every engine does).
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

    // prefers-reduced-motion keeps the field and stops the drift. Time freezes at zero, so
    // redrawing would burn battery for an identical image — draw once, then only on resize.
    const still = prefersReducedMotion()

    if (!painted) {
      // Always take the first frame, even while hidden. A tab that loads in the background and
      // is then brought forward should already have its field painted rather than showing bare
      // body colour until the next animation frame.
    } else if (typeof document !== 'undefined' && document.hidden) {
      // Stop entirely once painted and hidden. requestAnimationFrame already throttles in most
      // browsers, but "most" is not a guarantee worth spending battery on.
      return
    } else if (still) {
      if (!resized) return
    } else if (!resized && elapsedSeconds - lastDraw.current < FRAME_INTERVAL_SECONDS) {
      return
    }

    lastDraw.current = elapsedSeconds
    lastSize.current = size

    uniform.write({ resolution: [width, height], time: still ? 0 : elapsedSeconds })
    pipeline.withColorAttachment({ view: context }).draw(3)

    if (!painted) setPainted(true)
  })

  return (
    <canvas
      ref={ref}
      aria-hidden
      // z-0, NOT a negative z-index. `body` carries the flat #7B8F63 for first paint, and body
      // does not establish a stacking context — so a negative-z-index child gets hoisted to the
      // root's stacking context and painted *before* body's background, which then covers it.
      // The field would render perfectly and be invisible.
      //
      // Fades in over that flat colour, so the handover from first paint to the live surface is
      // invisible rather than a swap.
      className="pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-700 ease-out"
      style={{ opacity: painted ? 1 : 0 }}
    />
  )
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
