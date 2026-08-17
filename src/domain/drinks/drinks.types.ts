/**
 * The content contract for the nine drinks.
 *
 * Pure types — no React, no persistence, no derived state. The records themselves live in
 * `drinks.content.ts`; anything computed *over* the collection lives in `drinks.utils.ts`.
 */

/**
 * The nine, keyed by romaji. Collection order is fixed by the reference mockups and is not
 * alphabetical — NAGI sits at 02.
 */
export type DrinkId =
  | 'sui'
  | 'nagi'
  | 'kumo'
  | 'kage'
  | 'awa'
  | 'on'
  | 'to'
  | 'ichigo'
  | 'shin'

/** How the drink is served. `hot-on-frozen` exists only for the affogato. */
export type ServeTemperature = 'hot' | 'iced' | 'hot-on-frozen'

/** The five tasting axes, in the order they are always displayed: 椰 乳 力 涼 濃. */
export type AxisKey = 'coconut' | 'cream' | 'energy' | 'fresh' | 'level'

/**
 * 0–10, integer. Enumerated rather than typed as `number` so a typo cannot slip an 11 or a 3.5
 * into the collection — the axis scales in the recipe overlay assume the range is exact.
 */
export type AxisValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type FlavourAxes = Readonly<Record<AxisKey, AxisValue>>

/** One axis's display identity. The kanji leads; the Latin name labels it. */
export type Axis = {
  readonly key: AxisKey
  /** 椰 乳 力 涼 濃 */
  readonly kanji: string
  /** Set uppercase and letterspaced at `--text-micro`. */
  readonly name: string
}

/**
 * One row of the build. Rendered as a micro-label above a large quantity, so both halves are
 * authored copy rather than a parsed amount.
 */
export type BuildItem = {
  /** Uppercase micro-label: `MATCHA BASE`, `COCONUT WATER`, `HONEY`. */
  readonly label: string
  /** The quantity exactly as it is set. En dash for ranges: `30–35 ml`, `full glass`. */
  readonly amount: string
  /** Appends `· OPTIONAL` to the label. */
  readonly optional?: boolean
}

/**
 * The shared preparation every one of the nine is built from. Deliberately on the concentrate
 * side of a ceremonial ratio so it survives milk, ice and soda — which is exactly why the usucha
 * entry has to show its top-up.
 */
export type MatchaBase = {
  readonly kanji: string
  readonly label: string
  readonly matcha: string
  readonly water: string
  readonly temperature: string
  readonly method: readonly string[]
  readonly note: string
}

export type Drink = {
  readonly id: DrinkId
  /** `01`–`09`. Display order, and the number the collection is counted by. */
  readonly slot: string
  /** The single identifying character. Rendered at 450px as the watermark and at 24px in the rail. */
  readonly kanji: string
  /** Uppercase romanization: `NAGI`. Carries a macron on `TŌ`. */
  readonly romaji: string
  /** English name: `Coconut Water Matcha`. */
  readonly name: string
  /** The short ingredient line: `coconut water · matcha · ice`. Lowercase, middle-dot separated. */
  readonly ingredientLine: string
  /** What the kanji means: `calm sea, still water`. Lowercase, comma separated, never a sentence. */
  readonly gloss: string
  readonly serve: ServeTemperature
  /** Matcha base first, then every other ingredient in the order it is added. */
  readonly build: readonly BuildItem[]
  /** 3–5 imperative phrases, lowercase, no terminal punctuation. */
  readonly method: readonly string[]
  /** One sentence. May evoke; must not claim heritage. */
  readonly tastingNote: string
  readonly axes: FlavourAxes
}
