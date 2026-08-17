import { useLayoutEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { DRINKS, getDrinkRender, type Drink } from '#/domain/drinks'
import { layerDelay, type MotionLayer, type MotionTokens } from '#/lib/motion'

import type { Candidate } from './motion-calibration.candidates'

/** The master viewport. Positions inside the composition are the measured landscape values. */
const STAGE_W = 1366
const STAGE_H = 1024

/**
 * One candidate, rendered as a miniature of the landscape composition.
 *
 * `zoom` rather than `transform: scale` — zoom scales the layout itself, so px travel distances
 * shrink in the same proportion as everything else and the relative feel is preserved. A
 * transform would keep text crisper but leave a 20px drift looking like 20px at half size, which
 * is the one thing this prototype must not misrepresent.
 */
export function CandidatePanel({ candidate, drink }: { candidate: Candidate; drink: Drink }) {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(0.4)

  useLayoutEffect(() => {
    if (!box) return
    const fit = () => {
      const { width, height } = box.getBoundingClientRect()
      setZoom(Math.min(width / STAGE_W, height / STAGE_H))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [box])

  return (
    <figure className="flex min-h-0 flex-col gap-2">
      <figcaption className="flex shrink-0 items-baseline gap-3">
        <span className="text-romaji text-accent untrack">{candidate.key}</span>
        <span className="text-detail text-on-field">{candidate.name}</span>
        <span className="text-detail text-on-field-faint">{candidate.claim}</span>
      </figcaption>

      <div
        ref={setBox}
        className="relative min-h-0 flex-1 overflow-hidden border border-hairline-field"
      >
        <div style={{ zoom, width: STAGE_W, height: STAGE_H }} className="relative">
          <Composition tokens={candidate.tokens} drink={drink} />
        </div>
      </div>
    </figure>
  )
}

/** The landscape composition, at its measured positions. */
function Composition({ tokens, drink }: { tokens: MotionTokens; drink: Drink }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-field">
      <Layer layer="watermark" tokens={tokens} drink={drink} distance={tokens.watermarkDrift}>
        <span className="font-jp block select-none text-[450px] font-[200] leading-none text-on-field-ghost">
          {drink.kanji}
        </span>
      </Layer>

      <Layer layer="render" tokens={tokens} drink={drink} at="left-[66.3%] top-[46.4%]" centred>
        <img
          src={getDrinkRender(drink.id)}
          alt=""
          className="block h-[492px] w-[492px] max-w-none"
        />
      </Layer>

      <Layer layer="romaji" tokens={tokens} drink={drink} at="left-14 top-[879px]">
        <span className="text-romaji text-accent untrack uppercase">{drink.romaji}</span>
      </Layer>

      <Layer layer="title" tokens={tokens} drink={drink} at="left-14 top-[904px]">
        <span className="text-title block text-on-field">{drink.name}</span>
      </Layer>

      <Layer layer="detail" tokens={tokens} drink={drink} at="left-14 top-[952px]">
        <span className="text-detail text-on-field-faint">
          {drink.ingredientLine} — {drink.gloss}
        </span>
      </Layer>

      {/* The rail keeps its measured 73px pitch and 1259px centre, because the point of the
          prototype is judging motion inside a familiar composition. */}
      <Layer layer="rail" tokens={tokens} drink={drink} at="left-[1259px] top-1/2" centred>
        <span className="flex flex-col items-center">
          {DRINKS.map((candidate) => (
            <span
              key={candidate.id}
              className="flex h-[73px] items-center justify-center leading-none"
            >
              <span
                className={
                  candidate.id === drink.id
                    ? 'font-jp text-kanji-lg text-on-field-strong'
                    : 'font-jp text-kanji-md text-on-field-faint'
                }
              >
                {candidate.kanji}
              </span>
            </span>
          ))}
        </span>
      </Layer>
    </div>
  )
}

/**
 * One cross-dissolving layer. Old and new overlap absolutely, so this is a true dissolve rather
 * than a fade-out followed by a fade-in.
 */
function Layer({
  layer,
  tokens,
  drink,
  children,
  at,
  centred = false,
  distance,
}: {
  layer: MotionLayer
  tokens: MotionTokens
  drink: Drink
  children: ReactNode
  at?: string
  centred?: boolean
  distance?: number
}) {
  const travel = distance ?? tokens.drift
  const spring = layer === 'watermark' ? tokens.watermark : tokens.layer
  const position = layer === 'watermark' ? 'left-[82px] top-1/2' : at

  // The wrapper span is a zero-size anchor, so any centring transform has to land on the
  // motion.span inside it — that is the element with real dimensions to be centred against.
  const offset = layer === 'watermark' ? '-translate-y-[52%]' : centred ? '-translate-x-1/2 -translate-y-1/2' : ''

  return (
    <span className={`absolute ${position ?? ''}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={drink.id}
          className={`absolute block whitespace-nowrap ${offset}`}
          initial={{ opacity: 0, y: travel }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -travel }}
          transition={{
            type: 'spring',
            visualDuration: spring.visualDuration,
            bounce: spring.bounce,
            delay: layerDelay(layer, tokens),
          }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
