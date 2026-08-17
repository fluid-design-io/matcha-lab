import Picture from '@gravity-ui/icons/Picture'

import { useLab } from './lab.context'

/**
 * The watermark and the render frame — the two things that occupy the stage.
 *
 * Both are absolutely positioned inside the stage cell so neither can push the footer down, which
 * is what keeps the single-viewport promise honest at every size.
 */
export function LabStage() {
  return (
    <>
      <LabWatermark />
      <LabRenderFrame />
    </>
  )
}

/**
 * The selected drink's character at enormous scale and 14% opacity — the atmosphere of the whole
 * screen. Landscape anchors it to the left edge and centres it vertically; portrait centres it
 * horizontally near the top, behind the render.
 *
 * Clipped by the stage, deliberately: the widest kanji reach past the left margin, and a character
 * that runs off the edge reads as a watermark rather than as a very large piece of type.
 */
function LabWatermark() {
  const { drink } = useLab()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* -translate-y-[52%], not -1/2. Noto Sans JP's ink sits ~9% of the font size below its em
          box's centre, so centring the box leaves the character low on the axis. Measured against
          the reference with TextMetrics rather than guessed — the element box is a poor proxy for
          where a CJK glyph actually is. */}
      <span
        className="font-jp absolute left-1/2 top-[6%] -translate-x-1/2 select-none text-(length:--watermark-size) font-[200] leading-none text-on-field-ghost land:left-[6svw] land:top-1/2 land:translate-x-0 land:-translate-y-[52%]"
      >
        {drink.kanji}
      </span>
    </div>
  )
}

/**
 * A square, sized off the short viewport axis, holding one drink image.
 *
 * Landscape sits it right of centre, in the space between the watermark and the rail; portrait
 * centres it. It is never a rectangle and it never crops.
 */
function LabRenderFrame() {
  const { drink } = useLab()

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 land:left-[76%] size-(--frame-size)"
    >
      {/* The reference reads "NAGI · glass render", but each drink has its own true vessel and
          only some of them are glasses. Naming the drink is enough. */}
      <RenderFramePlaceholder label={`${drink.romaji} · render`} />
    </div>
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
