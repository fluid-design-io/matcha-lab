import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

type LabShellProps = {
  masthead: ReactNode
  stage: ReactNode
  footer: ReactNode
  rail: ReactNode
  className?: string
}

/**
 * The one-viewport grid every other piece of the lab sits inside.
 *
 * Four slots, one DOM order, two arrangements. Landscape puts the rail in its own right-hand
 * column spanning the full height; portrait drops it to a fourth row along the bottom. Nothing
 * is swapped — the same four children reflow, which is what lets selection state and the shared
 * accent underline survive a rotation.
 *
 * Safe areas are handled here and only here, so no component further in has to know about the
 * home indicator or the camera housing.
 */
export function LabShell({ masthead, stage, footer, rail, className }: LabShellProps) {
  return (
    <div
      className={cn(
        // svh, not dvh: it is the smallest viewport height, so content fits even mid-gesture
        // while Safari's toolbars are animating. In standalone the two are identical.
        'grid h-svh w-screen overflow-hidden',
        'grid-cols-1 grid-rows-[auto_1fr_auto_auto]',
        "[grid-template-areas:'masthead''stage''footer''rail']",
        'land:grid-cols-[1fr_var(--rail-w)] land:grid-rows-[auto_1fr_auto]',
        "land:[grid-template-areas:'masthead_rail''stage_rail''footer_rail']",
        className,
      )}
      style={{
        paddingInline: 'max(var(--edge), env(safe-area-inset-left))',
        paddingBlock: 'max(var(--edge), env(safe-area-inset-top))',
        paddingBottom: 'max(var(--edge), env(safe-area-inset-bottom))',
        paddingRight: 'max(var(--edge), env(safe-area-inset-right))',
      }}
    >
      <div className="[grid-area:masthead]">{masthead}</div>
      {/* The stage is the positioning context for the watermark and the render frame, so
          neither can push the footer down. */}
      <div className="relative min-h-0 [grid-area:stage]">{stage}</div>
      <div className="[grid-area:footer]">{footer}</div>
      <div className="[grid-area:rail]">{rail}</div>
    </div>
  )
}
