# The nine drinks as content

Type: task
Status: resolved
Blocked by: —

## Answer

`src/domain/drinks/` — a content module with a wide-by-design public boundary, since being read
is the whole point of it.

- `drinks.types.ts` — the contract. `AxisValue` is enumerated `0 | 1 | … | 10` rather than typed
  `number`, so a typo cannot put an 11 or a 3.5 into the collection; the axis scales in the recipe
  overlay assume the range is exact.
- `drinks.content.ts` — `MATCHA_BASE`, `AXES`, `SERVE_LABEL`, and the nine records.
- `drinks.utils.ts` — everything computed across the collection.
- `index.ts` — the boundary.

Specifics honoured:

- **NAGI is verbatim from reference 3** — 30–35 ml base, 180–220 ml coconut water, 5 ml optional
  honey, ice full glass; *whisk matcha · fill with ice · pour coconut water · float matcha*.
- **Usucha carries its top-up** as an explicit second build row, `Hot water 20–25 ml`. Without it
  the entry claims a ceremonial ratio the house concentrate does not serve.
- **Axis extremes are derived, not written.** Two different derivations from the same data:
  - `leadsCollection(drink, axis)` — holds the collection max, **ties included**. Drives the
    accent-filled diamonds. For NAGI this returns 椰 and 涼, exactly the two filled diamonds in
    reference 3.
  - `collectionExtremes(drink)` — the single most distinctive high and low, for the sentence.
    Stricter, because a sentence can only carry one claim: an extreme shared by three or more
    drinks is discarded (eight of nine score 0 on coconut, so "lowest" is meaningless there),
    fewer co-holders wins, and the tiebreak is distance from the collection mean.

  The mean tiebreak is what makes 深 SHIN read as *least fresh* rather than the equally true but
  duller *least energetic*. Verified output across all nine:

  | | leads | derived line |
  | --- | --- | --- |
  | 01 SUI | 力 | 力 highest in the collection |
  | 02 NAGI | 椰 涼 | 椰 highest in the collection · 濃 lowest |
  | 03 KUMO | 乳 濃 | 乳 highest in the collection · 涼 lowest |
  | 04 KAGE | — | *(nothing to declare)* |
  | 05 AWA | 力 | 力 highest in the collection |
  | 06 ON | — | *(nothing to declare)* |
  | 07 TŌ | 涼 | 涼 highest in the collection · 乳 lowest |
  | 08 ICHIGO | — | 力 lowest |
  | 09 SHIN | — | 涼 lowest |

  Note the mockup prints `涼 highest in the collection · 乳 lowest` under **NAGI**. With the final
  nine that line belongs to **TŌ**, which the derivation gets right — 透 TŌ is the only drink
  scoring 0 on cream. This is precisely the staleness the ticket asked to design out.

  Two drinks derive nothing at all. That is the honest answer for a drink sitting in the middle of
  every axis, and the line simply does not render.
- **Provenance rides along as doc comments, not fields.** Nothing renders it, so a field would be
  dead weight — but the next person to edit a tasting note has to read past it. Only 翠 SUI is
  marked traditional.

`render` is deliberately **not** a field here. The images are wired in
`drinks.renders.ts` by ticket 05, which keeps this file free of asset imports.

## Question

Author the nine drinks as typed TypeScript records — the single source of content truth. Recipes come from [drinks research](../research/drinks.md); the kanji mapping is settled in the map's Notes.

Design the type first. It must carry: id, kanji character, romaji, English name, the short ingredient line (`coconut water · matcha · ice`), the kanji gloss (`calm sea, still water`), serve temperature, the build (matcha base volume + each ingredient with metric amount or range), the method as 3–5 imperative phrases, the tasting note, and the five flavour axes as 0–10 integers.

Specifics:

- **NAGI's numbers are verbatim from reference 3** — matcha base 30–35 ml, coconut water 180–220 ml, honey 5 ml optional, ice full glass; method *whisk matcha · fill with ice · pour coconut water · float matcha*. Do not re-derive them.
- **Usucha needs its top-up.** The house base (3 g / 35–40 ml) is a concentrate; usucha is a 60 ml bowl. The build must show the extra 20–25 ml of 80 °C water or the entry is dishonest.
- Reference 3 renders axis extremes as copy — *"涼 highest in the collection · 乳 lowest"*. Derive that from the axis data rather than hardcoding strings, so it stays true if a number changes.
- Copy may evoke but must not claim heritage. Only usucha is genuinely traditional; see the research file's provenance notes.

Keep this pure data with no React and no persistence — [Data layer on TanStack Store](./04-data-layer.md) consumes it. Follow `react-composition-structure` for where it lives and what the module exports.
