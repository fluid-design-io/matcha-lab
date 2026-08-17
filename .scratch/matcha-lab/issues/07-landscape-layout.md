# Landscape master layout

Type: task
Status: open
Blocked by: 02, 03

## Question

Build the 1366×1024 landscape view — reference 4 is the master. Static composition only; interaction and motion are later tickets.

Elements, per the reference:

- **Header**, top left: 抹茶 + `MATCHA COCONUT LAB` micro-label. Favourite counter top right (`♡ 02`).
- **Giant watermark kanji** — the selected drink's character at enormous scale, low contrast, bleeding off the left edge. This is the atmosphere; get its scale, opacity and crop right.
- **Render frame** — centred square, sized off the smaller viewport axis, holding the drink image. Dashed border survives as the empty/loading state only.
- **Title block**, bottom left: romaji label, drink name at large weight-300 scale, ingredient line + kanji gloss beneath at micro scale.
- **Recipe affordance**, bottom right: 作り方 with `RECIPE →` beneath, and the accent rule.
- **Rail**, right edge, vertical: nine kanji, the selected one larger and ink-dark with its romaji rotated alongside, the rest pale. Accent underline marks selection.

Constraints: `min-height: 100dvh`, no vertical scroll, safe-area insets respected. NAGI is the opening selection. Selection is in-memory state — changing it must update every element above.

Follow `react-composition-structure` — the rail, the render frame and the title block are each their own compound component with a clean public boundary, since [Orientation adaptation](./08-orientation.md) will reflow them and [Rail interaction](./10-rail-interaction.md) will make the rail live.
