# Recipe overlay

Type: task
Status: open
Blocked by: 04, 07

## Question

Build the recipe view — reference 3 is the master. This closes the core loop: *select → view → open recipe → close → select another*.

A centred, rice-paper panel over the field, with an inset hairline frame. Three columns in landscape:

- **Left** — the drink render, reused at smaller scale.
- **Middle** — `材料 / BUILD`: each ingredient as a micro-label above a large weight-300 quantity (`MATCHA BASE` / `30–35 ml`).
- **Right** — `手順 / METHOD`: numbered steps, then a rule, then `味 TASTING NOTE`: the five axes as horizontal scales with kanji glyphs (椰 乳 力 涼 濃), diamond markers, accent-filled where the drink leads the collection. Beneath, the derived extremes line.

Header pairs the kanji with romaji and the English name; footer carries the gloss and the base temperature, with the favourite control at bottom right (`♥ SAVED`).

Requirements:

- Icons from `@gravity-ui/icons`: `Xmark` for close, `HeartFill` for the saved state. If serve temperature deserves a mark, `Snowflake` and `Flame` exist — but only if it earns its place; the reference gets by on type alone.
- Build on **BaseUI React** for the dialog primitive — focus trap, escape, scroll lock, ARIA come free and hand-rolling them is a mistake.
- The panel is the one place **container queries** belong: it renders at very different widths in landscape and portrait, and its internals should respond to the panel, not the viewport.
- **No nested scrolling.** If the content does not fit at any target viewport, the layout is wrong — fix the layout.
- Open and close animate at the same restraint as everything else; reuse the tokens from [Motion calibration](./09-motion-calibration.md).
- Portrait needs its own arrangement of the same three groups. Verify all four viewports.
