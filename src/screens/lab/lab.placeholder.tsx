import Picture from '@gravity-ui/icons/Picture'

import { cn } from '#/lib/utils'

/** Which surface the frame is drawn on — the field, or the recipe panel's paper well. */
export type PlaceholderTone = 'field' | 'paper'

type RenderPlaceholderProps = {
  /** The caption under the icon, `NAGI · render`. */
  label: string
  tone: PlaceholderTone
}

/**
 * The empty and loading render frame — the only surviving trace of the mockups' upload drop-zone.
 * There is no upload: the nine renders ship with the app, so this is a loading state and nothing
 * else. Shared by the stage and the recipe panel, which is why the tone is a prop.
 */
export function RenderPlaceholder({ label, tone }: RenderPlaceholderProps) {
  return (
    <div
      // Colour is set once here and inherited: the icon takes `currentColor` and never its own token.
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 border border-dashed',
        tone === 'field'
          ? 'border-hairline-field text-on-field-faint'
          : 'border-hairline text-on-paper-faint',
      )}
    >
      <Picture width={20} height={20} aria-hidden />
      <p className="text-detail">{label}</p>
    </div>
  )
}
