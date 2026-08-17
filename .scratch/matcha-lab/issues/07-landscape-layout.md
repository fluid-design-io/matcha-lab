# Landscape master layout

Type: task
Status: resolved
Blocked by: 02, 03

## Answer

Built at 1366×1024 and measured against `ref-4-landscape.png` element by element rather than
eyeballed. Every number below is the rendered result versus the reference:

| Element | Built | Reference |
| --- | --- | --- |
| Masthead accent tick | `x 56`, `y 0→120` | `x 56`, `y 0→120` |
| `MATCHA COCONUT LAB` | `x 120→291` | `x 119→292` |
| Watermark ink | `y 317→695` | `y 320→695` |
| Render frame | `658→1150`, `230→721` (492²) | `658→1152`, `227→722` (495²) |
| Drink title | `y 904→940`, 36px/300 | ink `y 905→931` |
| Rail kanji centre | `x 1259` | `x 1259` |
| Rail span | items `184→841`, pitch 73 | kanji centres `217→802`, pitch 73 |

Files, per `react-composition-structure`: `lab.context.tsx` owns selection and recipe-open state
behind a contract in `lab.types.ts`; `lab.masthead.tsx`, `lab.stage.tsx` (watermark + render
frame) and `lab.footer.tsx` (title + recipe affordance) are colocated leaves; `rail/` is nested
with its own `index.ts`, because it has a real public surface that
[Orientation adaptation](./08-orientation.md) and [Rail interaction](./10-rail-interaction.md)
both consume.

**The rail slot is a fixed pitch**, `--rail-item`, with everything inside absolutely positioned.
This is the single most important detail in the rail: selection makes the glyph bigger and adds a
label, and none of it may move the neighbours. A rail that reflows on tap cannot have an underline
that slides a constant distance, and it feels loose under the finger.

**Two things the reference taught that the tokens did not:**

- The watermark was rendering at weight 400. `text-(length:--watermark-size)` sets size only, so
  the 200 in the type scale never applied — it needs `font-[200]` explicitly. At 450px the
  difference between 200 and 400 is the difference between a watermark and a headline.
- **Measure kanji ink, not the element box.** Noto Sans JP's ink sits ~9% of the font size *below*
  its em box's centre — 40px at this size. Comparing the box against the reference's ink sent the
  first correction the wrong way, and `-translate-y-[43%]` made it worse before
  `canvas.measureText().actualBoundingBox*` gave the real answer: `-translate-y-[52%]`. Both
  lessons are now in `DESIGN-TASTE.md`.

Verified: selecting 深 SHIN from the rail updates the watermark, title, romaji, ingredient line,
gloss, frame caption and rail marker together. No vertical scroll —
`scrollHeight === clientHeight === 1024`.

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
