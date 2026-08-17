/**
 * The nine drinks. The single source of content truth.
 *
 * Recipes come from `.scratch/matcha-lab/research/drinks.md`; the kanji mapping is settled in
 * that effort's `map.md`. Nothing here is derived — see `drinks.utils.ts` for anything computed
 * across the collection.
 *
 * **Provenance honesty.** Only 翠 SUI is genuinely traditional. Everything else is a modern café
 * invention, and the copy in this file may evoke but must not claim heritage. Each record carries
 * its provenance as a doc comment rather than a field, because nothing renders it — but the next
 * person to edit a tasting note has to read it first.
 */
import type { Axis, Drink, MatchaBase, ServeTemperature } from './drinks.types'

/**
 * Every one of the nine is *matcha base + N other ingredients*, N = 0–4.
 *
 * 3 g / 35–40 ml sits deliberately on the concentrate side. Traditional usucha is 2 g / 60 ml
 * (Ippodo); this base has to survive milk, ice and soda, so it is stronger — which is why 翠 SUI
 * carries an explicit hot-water top-up rather than pretending 3 g / 37 ml is a ceremonial ratio.
 */
export const MATCHA_BASE: MatchaBase = {
  kanji: '抹茶',
  label: 'Matcha base',
  matcha: '3 g',
  water: '35–40 ml',
  temperature: '75–80 °C',
  method: ['sift', 'whisk', 'pour'],
  note: 'used in all nine drinks',
}

/** Display order for the tasting axes. Fixed — the recipe overlay reads them in this order. */
export const AXES: readonly Axis[] = [
  { key: 'coconut', kanji: '椰', name: 'coconut' },
  { key: 'cream', kanji: '乳', name: 'cream' },
  { key: 'energy', kanji: '力', name: 'energy' },
  { key: 'fresh', kanji: '涼', name: 'fresh' },
  { key: 'level', kanji: '濃', name: 'level' },
]

/**
 * Serve temperature as authored copy. Set at `--text-label`; there is no icon for it — the
 * design contract rules `Snowflake` and `Flame` out, and `hot-on-frozen` has no icon anyway.
 */
export const SERVE_LABEL: Readonly<Record<ServeTemperature, string>> = {
  hot: 'hot',
  iced: 'iced',
  'hot-on-frozen': 'hot on frozen',
}

export const DRINKS: readonly Drink[] = [
  {
    /**
     * Provenance: **genuinely traditional.** The everyday preparation in Japanese tea practice,
     * as distinct from koicha. Ippodo (Kyoto, founded 1717) publishes it as their baseline.
     * This is the only drink in the collection that may be described as traditional.
     */
    id: 'sui',
    slot: '01',
    kanji: '翠',
    romaji: 'SUI',
    name: 'Thin Matcha',
    ingredientLine: 'matcha · hot water',
    gloss: 'kingfisher green, jade',
    serve: 'hot',
    build: [
      { label: 'Matcha base', amount: '35–40 ml' },
      // The house base is a concentrate; usucha is a 60 ml bowl. Without this row the entry
      // would be dishonest about the ratio it is claiming to serve.
      { label: 'Hot water', amount: '20–25 ml' },
    ],
    method: ['sift matcha', 'pour 80 °C water', 'whisk in a W', 'top up and serve in the bowl'],
    tastingNote: 'Sea-spray bitterness that turns sweet on the swallow; nothing hides here.',
    axes: { coconut: 0, cream: 2, energy: 8, fresh: 7, level: 7 },
  },
  {
    /** Provenance: modern. A wellness-café drink; no traditional claim from any source. */
    id: 'nagi',
    slot: '02',
    kanji: '凪',
    romaji: 'NAGI',
    name: 'Coconut Water Matcha',
    ingredientLine: 'coconut water · matcha · ice',
    gloss: 'calm sea, still water',
    serve: 'iced',
    // Verbatim from reference 3. Do not re-derive these numbers.
    build: [
      { label: 'Matcha base', amount: '30–35 ml' },
      { label: 'Coconut water', amount: '180–220 ml' },
      { label: 'Honey', amount: '5 ml', optional: true },
      { label: 'Ice', amount: 'full glass' },
    ],
    method: ['whisk matcha', 'fill with ice', 'pour coconut water', 'float matcha'],
    tastingNote: 'Electrolytes and chlorophyll — the drink you want at 3 pm in August.',
    axes: { coconut: 8, cream: 1, energy: 5, fresh: 9, level: 3 },
  },
  {
    /**
     * Provenance: modern fusion. The affogato format is Italian; Sugimoto call their version
     * "a green tea spin on the Italian classic". Honest fusion, not invented heritage.
     */
    id: 'kumo',
    slot: '03',
    kanji: '雲',
    romaji: 'KUMO',
    name: 'Matcha Affogato',
    ingredientLine: 'matcha · vanilla ice cream',
    gloss: 'cloud, drifting white',
    serve: 'hot-on-frozen',
    build: [
      // Pulled longer than the house base so there is enough to flood the scoops.
      { label: 'Matcha base', amount: '50 ml' },
      { label: 'Vanilla ice cream', amount: '2 scoops' },
    ],
    method: [
      'chill a small glass',
      'drop in two scoops',
      'whisk the matcha long and hot',
      'pour over at the table',
    ],
    tastingNote: 'Bitter and hot hitting sweet and frozen — the best two seconds on the menu.',
    axes: { coconut: 0, cream: 10, energy: 7, fresh: 1, level: 9 },
  },
  {
    /**
     * Provenance: modern format, traditional components. Hojicha is an established Japanese tea;
     * the two-tone layered latte is a contemporary café presentation.
     */
    id: 'kage',
    slot: '04',
    kanji: '影',
    romaji: 'KAGE',
    name: 'Layered Hojicha Matcha',
    ingredientLine: 'hojicha · milk · matcha · ice',
    gloss: 'shadow, cast light',
    serve: 'iced',
    build: [
      { label: 'Matcha base', amount: '35–40 ml' },
      { label: 'Hojicha shot', amount: '60 ml' },
      // The sugar is structural — it makes the milk heavy enough to hold the layers apart.
      { label: 'Milk + sugar', amount: '180 ml · 1 tsp' },
      { label: 'Ice', amount: 'half glass' },
    ],
    method: [
      'pour the hojicha shot',
      'add ice',
      'pour sweetened milk slowly',
      'float matcha last',
    ],
    tastingNote: 'Toasted chestnut underneath, cut grass on top, milk holding the two apart.',
    axes: { coconut: 0, cream: 6, energy: 5, fresh: 2, level: 6 },
  },
  {
    /**
     * Provenance: modern, Italian-derived. The caffè shakerato is a real Italian summer drink;
     * this transplants the technique. Ippodo publish a "Shaken Matcha", so the shake method has
     * vendor blessing even though the shakerato framing is Italian.
     */
    id: 'awa',
    slot: '05',
    kanji: '泡',
    romaji: 'AWA',
    name: 'Matcha Shakerato',
    ingredientLine: 'matcha · maple · ice',
    gloss: 'foam, rising bubble',
    serve: 'iced',
    build: [
      { label: 'Matcha base', amount: '35–40 ml' },
      { label: 'Cold water', amount: '100 ml' },
      { label: 'Maple syrup', amount: '10–15 ml' },
      { label: 'Ice', amount: '5–6 cubes' },
    ],
    method: [
      'whisk matcha',
      'tip into a jar with ice',
      'shake hard 15 s',
      'strain, foam last',
    ],
    tastingNote:
      'All the body of a latte and none of the milk — a jade espresso with a meringue collar.',
    axes: { coconut: 0, cream: 3, energy: 8, fresh: 8, level: 6 },
  },
  {
    /**
     * Provenance: modern. A Western café adaptation that emerged in the late 20th and early 21st
     * centuries; Starbucks introduced their version in 2006.
     */
    id: 'on',
    slot: '06',
    kanji: '温',
    romaji: 'ON',
    name: 'Matcha Latte',
    ingredientLine: 'matcha · steamed milk',
    gloss: 'warmth, held heat',
    serve: 'hot',
    build: [
      { label: 'Matcha base', amount: '35–40 ml' },
      { label: 'Milk', amount: '180 ml' },
      { label: 'Honey', amount: '5–10 ml', optional: true },
    ],
    method: [
      'whisk matcha in the mug',
      'heat milk to 65 °C and froth',
      'pour through the foam',
      'dust with matcha',
    ],
    tastingNote:
      'A warm green blanket — the grassy edge folded into steamed milk until it purrs.',
    axes: { coconut: 0, cream: 8, energy: 5, fresh: 2, level: 6 },
  },
  {
    /** Provenance: modern. It took off after the espresso tonic trend did. */
    id: 'to',
    slot: '07',
    kanji: '透',
    romaji: 'TŌ',
    name: 'Matcha Tonic',
    ingredientLine: 'tonic · lime · matcha · ice',
    gloss: 'clarity, seen through',
    serve: 'iced',
    build: [
      // The concentrated house base is what makes the float hold; a dilute one sinks.
      { label: 'Matcha base', amount: '35–40 ml' },
      { label: 'Tonic water', amount: '150–180 ml' },
      { label: 'Lime', amount: '7 ml' },
      { label: 'Ice', amount: '4–6 cubes' },
    ],
    method: [
      'fill the glass with ice',
      'pour tonic',
      'squeeze lime into the matcha',
      'float matcha slowly',
      'serve unstirred',
    ],
    tastingNote: 'Quinine bitterness and matcha bitterness shaking hands over a bed of lime.',
    axes: { coconut: 0, cream: 0, energy: 6, fresh: 9, level: 4 },
  },
  {
    /** Provenance: a modern Japanese café trend. No traditional lineage claimed by any source. */
    id: 'ichigo',
    slot: '08',
    kanji: '苺',
    romaji: 'ICHIGO',
    name: 'Strawberry Matcha Latte',
    ingredientLine: 'strawberry · milk · matcha · ice',
    gloss: 'strawberry, early summer',
    serve: 'iced',
    build: [
      { label: 'Matcha base', amount: '35–40 ml' },
      { label: 'Strawberry purée', amount: '60 g' },
      { label: 'Milk', amount: '180 ml' },
      { label: 'Ice', amount: 'full glass' },
    ],
    method: [
      'spoon in the purée and level it',
      'pile ice on top',
      'pour milk down the side',
      'float matcha over the surface',
    ],
    tastingNote: 'Three colours in one glass and a jammy red undertow beneath the green.',
    axes: { coconut: 0, cream: 7, energy: 4, fresh: 7, level: 6 },
  },
  {
    /**
     * Provenance: modern drink, traditional ingredient. Kurogoma is a wagashi staple; the latte
     * is contemporary.
     */
    id: 'shin',
    slot: '09',
    kanji: '深',
    romaji: 'SHIN',
    name: 'Black Sesame Matcha Latte',
    ingredientLine: 'black sesame · milk · matcha · ice',
    gloss: 'depth, far down',
    serve: 'iced',
    build: [
      { label: 'Matcha base', amount: '35–40 ml' },
      { label: 'Black sesame paste', amount: '20 g' },
      { label: 'Kuromitsu', amount: '15 ml' },
      { label: 'Milk', amount: '150 ml' },
      { label: 'Ice', amount: 'half glass' },
    ],
    method: [
      'loosen the sesame with kuromitsu',
      'spoon into the glass and add ice',
      'pour milk',
      'float matcha and stir',
    ],
    tastingNote: 'Halva and green tea, dark and sweet where every other drink is bright.',
    axes: { coconut: 0, cream: 8, energy: 4, fresh: 1, level: 8 },
  },
]

/** NAGI opens. Settled during charting; the reference mockups all show it selected. */
export const OPENING_DRINK_ID = 'nagi' as const
