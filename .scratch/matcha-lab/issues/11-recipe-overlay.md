# Recipe overlay

Type: task
Status: resolved
Blocked by: 04, 07

## Answer

Built against `ref-3-recipe.png` and measured element by element rather than eyeballed. The module
is `src/screens/lab/recipe/`, one public export (`RecipeOverlay`), mounted from `lab.screen.tsx`
outside `LabShell` — it portals to `<body>` and covers the viewport, so a cell in the one-viewport
grid would only be a cell it ignores.

| File | Owns |
| --- | --- |
| `recipe.overlay.tsx` | Base UI dialog, scrim, hairline frame, the way the panel arrives |
| `recipe.panel.tsx` | The paper: the rhythm variables, and the arrangement that turns |
| `recipe.header.tsx` | 凪 · NAGI — name, and `Xmark` |
| `recipe.render.tsx` | The render, reused at smaller scale, in a `--color-paper-shade` well |
| `recipe.build.tsx` / `recipe.method.tsx` / `recipe.tasting.tsx` | The three groups |
| `recipe.label.tsx` | The `材料 / BUILD` heading, shared by two of the three |
| `recipe.footer.tsx` / `recipe.favourite.tsx` | Gloss, serve, base temperature, `♥ SAVED` |

`recipe.panel.tsx` is split from `recipe.overlay.tsx` for a reason beyond tidiness: it makes the
panel renderable without a dialog, which is what let the layout be measured at every viewport (see
*Verification*). Nothing here is exported past `index.ts` — the panel reads the selected drink and
the open flag off `lab.context`, so there are no props to thread.

### Geometry, built versus reference

Rendered at 1366×1024 and read back out of the DOM:

| Element | Built | Reference |
| --- | --- | --- |
| Hairline frame | inset 56 all sides | `x 56→1310`, `y 56→968` |
| Paper panel | `70→1296`, `70→954` | `70→1296`, `70→954` |
| Content box | `126→1240`, `126→898` (1114×772) | 1114×772, `x 126→1240` |
| Render well | `126→524` (398²) | `126→525`, `192→591` (399) |
| Build column | `577→882` (305 wide) | `x 578`, width 302 |
| Method / tasting column | `935→1240` (305 wide) | `x 933→1240` |
| Method step pitch | 44.5 | 45 |
| Rule under the method list | `y 439` | `y≈452` |
| Axis row pitch | 32 | 33 |
| Axis scale line | `x 1029→1240` | `x 1040→1240` |
| Extremes line | `y 679` | `y≈684` |
| Footer rule | `y 849` | `y≈841` |

Diamonds land exactly at `value/10` and fill with the accent precisely where `leadsCollection`
says so — 8/10 and 9/10 filled for NAGI's 椰 and 涼, the other three hollow. Both derivations come
straight from `drinks.utils.ts`; neither is recomputed here, which is what keeps the extremes
sentence honest when an axis value changes. It also handles the one-sided cases the reference never
shows: 深 SHIN prints only `涼 lowest in the collection`, 翠 SUI only `力 highest in the collection`.

### Container queries — the one component that gets them

The container is the **popup**, and two details are easy to get wrong and expensive to debug:

- **`container-type: size`, not `inline-size`.** `--recipe-render` and the whole vertical rhythm
  are `cqh` expressions and `inline-size` does not answer `cqh` at all.
- **The container carries no padding.** `cqw`/`cqh` resolve against the container's *content box*,
  so padding on the popup would silently shrink every `cq` number inside it by twice
  `--panel-pad`. The padding lives on the paper element inside the container instead.

**The arrangement switches on the panel's own aspect ratio, not its width.** Portrait at 1024×1366
gives an 884px panel; landscape at 1024×768 gives a 908px one. Twenty-four pixels apart — any width
threshold separating those two would be a coincidence, not a rule. Tailwind's `@[…]` sugar only
generates width queries (`@[aspect-ratio>=1]:` compiles to the nonsense
`@container (width >= aspect-ratio>=1)`), so these are written as arbitrary variants:
`[@container_recipe_(aspect-ratio>=1)]:…`, which emits `@container recipe (aspect-ratio>=1)`
correctly and sorts after the unprefixed utilities.

### The rhythm, and why nothing scrolls

Five container-relative variables on the paper. The centre of each clamp is the measurement at the
master; the bounds stop portrait going loose and 1024×768 going tight.

```
--recipe-gap:  clamp(24px, 4.3cqw, 56px)   /* 53px at the master — the measured column gap */
--recipe-lead: clamp(20px, 3.4cqh, 32px)   /* section label → content, and the footer band */
--recipe-band: clamp(16px, 2.7cqh, 26px)   /* between build rows, and above the extremes line */
--recipe-step: clamp(10px, 1.9cqh, 18px)   /* between method steps */
--recipe-row:  clamp(22px, 3.6cqh, 34px)   /* axis row pitch */
```

This is the whole mechanism: the spacing compacts *with the panel* instead of holding still while
the content grows. It is why 1024×768 fits without a special case.

`手順 / METHOD` and `味 TASTING NOTE` are one group that turns — stacked with a horizontal rule
between them in landscape, side by side with a vertical one in portrait. Same three children and
the same divider element; the rule simply stretches into whichever 1px track it lands in. Portrait
is a re-grouping, never a squeeze.

### Verification

The in-app browser pane cannot run the app, so the panel was rendered on its own instead:
`renderToStaticMarkup(<RecipePanel/>)` into a standalone page carrying the real compiled Tailwind
CSS, the real subset fonts and the real renders — all inlined as `data:` URIs — then loaded from a
`file://` path inside the repo at each viewport and read back with `getBoundingClientRect`. That is
what produced the table above. Two conditions were asserted at every size: **no element's box
passes the panel's content box**, and **`scrollHeight === clientHeight` on the paper**.

| Viewport | Panel | Columns | Slack below the tallest column | Scroll |
| --- | --- | --- | --- | --- |
| 1366×1024 | 1226×884 | 398 / 305 / 305 | 122px (凪 NAGI) | none |
| 1194×834 | 1078×718 | 323 / 303 / 303 | 116px (苺 ICHIGO) | none |
| 1024×1366 | 884×1226 | 367 / 367 | 275px (深 SHIN) | none |
| 1024×768 | 908×652 | 293 / 240 / 240 | 44px (透 TŌ), 57px (深 SHIN) | none |
| 768×1024 | 652×908 | 284 / 284 | 168px (雲 KUMO) | none |

Checked with the drinks that stress each axis rather than with NAGI: 透 TŌ has five method steps,
深 SHIN has five build rows *and* the two longest steps, 雲 KUMO has the longest footer
(`雲 — cloud, drifting white · HOT ON FROZEN · matcha base 75–80 °C`, one line at 768px), 翠 SUI has
only two build rows and does not read as stranded. Exactly one line of copy wraps anywhere in the
collection: 深 SHIN's `loosen the sesame with kuromitsu`, at 1024×768, by five pixels.

Text widths were not estimated. Both subset `.woff2` files load in PIL, so every quantity, label,
step and footer line was measured at its real size and weight — including the letterspacing, which
adds `0.30em × (n−1)` to a ten-pixel label and is most of its width.

### Three things the reference and the docs disagreed about

- **The hairline frame is on the scrim, not on the paper.** `DESIGN-TASTE.md` § Components calls it
  a `--color-hairline` frame "inset 14px from the panel edge", which reads as *inside*. It is
  outside: sampled at `x=56` the pixel is `(185,186,169)`, and against the scrim `(72,85,58)` that
  is **paper at 67%**, not ink at 20% — an ink hairline there would be invisible. Built with
  `--color-on-field-muted` (62%), the nearest role token, three units off a value that has none.
- **The mockup's axis geometry predates the axis data.** Its middle tick sits at 25% of the scale,
  not the midpoint, and its markers do not correspond to the shipped values at all — 力 ENERGY 5
  draws at 32%, 濃 LEVEL 3 at 48%. `docs/design/layout-geometry.md` says midpoint and `value/10`,
  and the doc is the contract. Built to the doc.
- **味 is not the same kind of heading as 材料 and 手順.** It has no slash and it sets at full ink
  rather than muted, because it is the first row of the axis stack — 味 椰 乳 力 涼 濃 share one
  column down the left. Measured: 味 reads `(27,35,24)`, 材料 reads `(144,145,133)`. Worth knowing
  before "unifying" the three headings into one component.

### Traps that cost real time

- **A regex over string literals is not a Tailwind scanner.** The verification harness first
  extracted candidate classes with a quoted-string regex; every apostrophe in a doc comment
  ("Base UI's", "the panel's") opened a phantom string that swallowed the real `className` after
  it. The result was a page missing exactly the classes with parentheses in them, which looked like
  a Tailwind arbitrary-value bug and was not. `Scanner` from `@tailwindcss/oxide` is right there.
- **`untrack` on a full-width block does nothing but push the box out.** Trailing-space
  compensation is for runs that align to a right edge or sit beside an icon. On the left-aligned
  build labels it pushed each `<p>` three pixels past its column — invisible, but it was the only
  overflow the checker reported in portrait and it cost a round of investigation. It stays on the
  `SAVED` label, which is the case the rule was written for.
- **Base UI's exit needs all four halves.** Open state hoisted, `keepMounted` on the `Portal`,
  `AnimatePresence` around the conditional, `motion` passed through `render` rather than spread.
  Base UI holds the portal mounted only while `element.getAnimations()` reports work, which is why
  both exits animate `opacity` — Motion runs that through WAAPI, where Base UI can see it.

### Deviations worth flagging

- **The footer carries the serve temperature.** `SERVE_LABEL` had no consumer anywhere in the app,
  and `DESIGN-TASTE.md` § Icons rules out `Snowflake`/`Flame` on the grounds that serve temperature
  "sets as a `--text-label` word". This footer is the only place that can be true, so it sets there
  between the gloss and the base temperature. Not in the reference, which predates the field.
- **`drink.tastingNote` renders nowhere visible.** The reference has no room for a sentence and the
  five axes say it better, so it is the `Dialog.Description` — a screen reader gets the flavour of
  the drink on open and the layout gets nothing to fit.
- **A value of 10 hangs 5px past the content margin.** The diamond centres on the end tick, and
  half of a rotated 7px square is 5px. Only 雲 KUMO's 乳 CREAM reaches it. Insetting the track would
  stop the marker sitting on the tick it is reporting, which is worse; left as is.

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
