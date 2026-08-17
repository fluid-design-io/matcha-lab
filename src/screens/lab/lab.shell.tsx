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
 * The one-viewport grid every other piece of the lab sits inside: four slots, one DOM order, two
 * arrangements, with the same four children reflowing rather than being swapped. Safe areas are
 * handled here and only here.
 */
export function LabShell({ masthead, stage, footer, rail, className }: LabShellProps) {
  return (
    <div
      className={cn(
        // svh, not dvh, so content fits even mid-gesture while Safari's toolbars animate. z-10
        // puts the shell above the field canvas at z-0.
        'relative z-10 grid h-svh w-screen overflow-hidden',
        'grid-cols-1 grid-rows-[auto_1fr_auto_auto]',
        "[grid-template-areas:'masthead''stage''footer''rail']",
        'land:grid-cols-[1fr_var(--rail-w)] land:grid-rows-[auto_1fr_auto]',
        "land:[grid-template-areas:'masthead_rail''stage_rail''footer_rail']",
        className,
      )}
      // Two-value shorthands, so each edge names its own inset rather than depending on later
      // longhands landing after the ones they correct.
      style={{
        paddingInline:
          'max(var(--edge), env(safe-area-inset-left)) max(var(--edge), env(safe-area-inset-right))',
        paddingBlock:
          'max(var(--edge), env(safe-area-inset-top)) max(var(--edge), env(safe-area-inset-bottom))',
      }}
    >
      <div className="[grid-area:masthead]">{masthead}</div>
      {/* The stage is the positioning context for the watermark and the render frame, so
          neither can push the footer down. */}
      <div className="relative min-h-0 [grid-area:stage]">{stage}</div>
      <div className="[grid-area:footer]">{footer}</div>
      {/* 40px of air puts the portrait romaji on y=1104 and the rule on y=1233 at the master. The
          -10px is the reference's own: the rail's last line sits 46px off the viewport bottom
          against a 56px edge margin, and `overflow: hidden` clips at the padding box. */}
      <div className="mt-4 [grid-area:rail] port:mt-10 port:-mb-2.5 land:mt-0">{rail}</div>
    </div>
  )
}
