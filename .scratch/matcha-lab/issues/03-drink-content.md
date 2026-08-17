# The nine drinks as content

Type: task
Status: open
Blocked by: —

## Question

Author the nine drinks as typed TypeScript records — the single source of content truth. Recipes come from [drinks research](../research/drinks.md); the kanji mapping is settled in the map's Notes.

Design the type first. It must carry: id, kanji character, romaji, English name, the short ingredient line (`coconut water · matcha · ice`), the kanji gloss (`calm sea, still water`), serve temperature, the build (matcha base volume + each ingredient with metric amount or range), the method as 3–5 imperative phrases, the tasting note, and the five flavour axes as 0–10 integers.

Specifics:

- **NAGI's numbers are verbatim from reference 3** — matcha base 30–35 ml, coconut water 180–220 ml, honey 5 ml optional, ice full glass; method *whisk matcha · fill with ice · pour coconut water · float matcha*. Do not re-derive them.
- **Usucha needs its top-up.** The house base (3 g / 35–40 ml) is a concentrate; usucha is a 60 ml bowl. The build must show the extra 20–25 ml of 80 °C water or the entry is dishonest.
- Reference 3 renders axis extremes as copy — *"涼 highest in the collection · 乳 lowest"*. Derive that from the axis data rather than hardcoding strings, so it stays true if a number changes.
- Copy may evoke but must not claim heritage. Only usucha is genuinely traditional; see the research file's provenance notes.

Keep this pure data with no React and no persistence — [Data layer on TanStack Store](./04-data-layer.md) consumes it. Follow `react-composition-structure` for where it lives and what the module exports.
