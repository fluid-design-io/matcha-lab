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
| `recipe.build.tsx` / `recipe.method.tsx` / `recipe.tasting.tsx` | The three groups |
| `recipe.label.tsx` | The `材料 / BUILD` heading, shared by two of the three |
| `recipe.footer.tsx` / `recipe.favourite.tsx` | Gloss, serve, base temperature, `♥ SAVED` |

`recipe.panel.tsx` is split from `recipe.overlay.tsx` so the paper knows nothing about dialogs,
portals or motion. Nothing here is exported past `index.ts` — the panel reads the selected drink
and the open flag off `lab.context`, so there are no props to thread. The render is not in this
folder at all: image, dashed loading frame and caption are one leaf,
`src/screens/lab/lab.render.tsx`, taking a `tone` of `field` or `paper` and shared with the stage.
The panel owns only the `--color-paper-shade` well around it.

### The overlay had no stacking position, and nothing in it could be touched

The first build gave `Dialog.Backdrop` and `Dialog.Popup` no `z-index`, so both resolved to `auto`.
`LabShell` is `relative z-10`. Positive z beats tree order, so **the entire app shell painted and
hit-tested above the whole dialog**: `document.elementFromPoint` at the centre of the close button
returned the rail's `<nav>`, a real click left the panel open, the favourite toggle — ticket 12's
only control — could not be pressed, a scrim press did not dismiss, and a drag over the open panel
reached the stage's swipe surface and changed the drink underneath, because `lab.context` disables
the keyboard while the recipe is open but nothing blocked the pointer.

Both parts are now `z-20`, which is the whole system: **field canvas `z-0`, `LabShell` `z-10`,
overlay `z-20`** — three layers, one order, no fourth value anywhere in `src/`.

Verified by hit test rather than by reasoning, because reasoning is what produced the bug. With the
panel open, `elementFromPoint` was sampled on a grid across the whole viewport — 1271 points at
1366×1024, 1681 at 1024×1366, and the full grid at both compact sizes — and **not one sample
resolves to anything inside `LabShell`**; every point is the popup or the backdrop. Individually:
the close button, the favourite toggle and the paper all hit-test to themselves; a real pointer
click on the close button closes; a real pointer click on the scrim dismisses; a real pointer click
on the favourite flips `aria-pressed`, rewrites `matcha-lab:favourites` and leaves the panel open.

The swipe is proved the same way and deliberately not by gesture: Motion's frameloop does not run in
the in-app pane, so a synthetic drag commits nothing there and a passing drag test would prove
nothing either. What matters is upstream of the gesture — a swipe can only start where a
`pointerdown` lands, and the grid above says no point in the viewport lands on the stage's surface
while the recipe is open.

### Geometry, built versus reference

Read out of the running app at 1366×1024, with the dialog open — not out of a harness:

| Element | Built | Reference |
| --- | --- | --- |
| Hairline frame | `x 56→1310`, `y 56→968` | `x 56→1310`, `y 56→968` |
| Paper panel | `70→1296`, `70→954` | `70→1296`, `70→954` |
| Content box | `126→1240`, `126→898` (1114×772) | 1114×772, `x 126→1240` |
| Render well | `126→524`, `200→598` (398²) | `126→525`, `192→591` (399) |
| Build column | `577→882` (305 wide) | `x 578`, width 302 |
| Method / tasting column | `935→1240` (305 wide) | `x 933→1240` |
| Method step pitch | 44.7 | 45 |
| Rule under the method list | `y 443` | `y≈452` |
| Axis row pitch | 31.8 | 33 |
| Axis scale line | `x 1029→1240` | `x 1040→1240` |
| Extremes line | `y 683` | `y≈684` |
| Footer rule | `y 853` | `y≈841` |

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
  so padding on the popup would silently shrink every `cq` number inside it by twice the padding.
  The padding lives on the paper element inside the container instead.

Tailwind's `@[…]` sugar only generates width queries (`@[aspect-ratio>=1]:` compiles to the nonsense
`@container (width >= aspect-ratio>=1)`), so the four queries are **named**, in `src/styles.css`,
next to `land` / `port` / `roomy`:

```css
@custom-variant recipe-tight      (@container recipe ((width < 600px) or (height < 600px)));
@custom-variant recipe-wide-roomy (@container recipe ((aspect-ratio >= 1) and (height >= 600px)));
@custom-variant recipe-wide-tight (@container recipe ((aspect-ratio >= 1) and (height < 600px)));
@custom-variant recipe-tall-tight (@container recipe ((aspect-ratio < 1) and (width < 600px)));
```

They were written out as arbitrary variants — `[@container_recipe_(aspect-ratio>=1)_and_(height>=600px)]:…`
— 23 times in `recipe.panel.tsx` and 5 more in `recipe.build.tsx` before this, which put one design
constant in two files with no shared definition. `@custom-variant` takes an `@container` at-rule
just as it takes `@media`: compiled, each emits the same at-rule the arbitrary variant did, all four
**after** every unprefixed utility, in declaration order. That ordering is the file's one cascade
assumption and it was checked against the compiler rather than assumed.

#### Four arrangements, on two questions about the panel's own box

The panel's **long axis** says which way the groups run; its **short axis** says whether all four
groups fit at all.

| | short axis ≥ 600px | short axis < 600px |
| --- | --- | --- |
| **wide** (`aspect-ratio ≥ 1`) | render │ build │ notes-stacked | build │ method │ rule │ tasting |
| **tall** (`aspect-ratio < 1`) | render + build, notes-side-by-side beneath | build / method / rule / tasting |

Neither threshold is a coincidence. Aspect ratio was already the right question for landscape versus
portrait: the portrait panel at 1024×1366 is 884px wide and the *landscape* one at 1024×768 is
908px, twenty-four pixels apart, so any width threshold separating those two would be an accident.
The 600px short-axis line sits in a 335px void — every tablet panel measures 652–1226px on its short
axis, every phone panel 317px — and it is where it is because of measurement, not roundness: see
*The short axis is a floor, not a fence* below.

The four are mutually exclusive as conditions, so the three prefixed ones cannot fight each other
and only their order against the unprefixed set matters — and Tailwind always emits variants after
those. That is the only cascade assumption in the file.

The notes wrapper is the piece that makes the tight cases cheap: it is a grid in both roomy
arrangements and **`display: contents`** in both tight ones, so `RecipeMethod`, the rule and
`RecipeTasting` become peers of the build column and the outer grid places all four in one track.
Same children, same divider element, no second component — the rule stretches into whichever 1px
track it lands in.

### The rhythm, the padding, and why nothing scrolls

Five container-relative variables on the paper. The centre of each clamp is the measurement at the
master; the bounds stop portrait going loose and 1024×768 going tight.

```
--recipe-gap:  clamp(24px, 4.3cqw, 56px)   /* 53px at the master — the measured column gap */
--recipe-lead: clamp(20px, 3.4cqh, 32px)   /* section label → content, and the footer band */
--recipe-band: clamp(16px, 2.7cqh, 26px)   /* between build rows, and above the extremes line */
--recipe-step: clamp(10px, 1.9cqh, 18px)   /* between method steps */
--recipe-row:  clamp(22px, 3.6cqh, 34px)   /* axis row pitch */
```

The spacing compacts *with the panel* instead of holding still while the content grows. It is why
1024×768 fits without a special case.

**The padding is now part of that system, and was not.** It used to be `--panel-pad`, a `:root`
token switched by a *viewport* media query — 28px below `roomy`, 56px at it — which made the
panel's single largest spacing value the one thing in it that did not respond to the panel. The
1024×1366 panel is 884px wide and the 1024×768 panel is 908px: 24px apart in width, 80px apart in
content box, decided by the viewport. That is exactly the coincidence the aspect-ratio argument
above rejects. It is replaced by `--recipe-pad`, set on the paper, tracking the panel's **short**
axis with `cqmin` so a wide short panel does not spend the axis it is short of on margin:

```
--recipe-pad: clamp(16px, calc(11.2cqmin - 43px), 56px)
```

A straight line through two measurements — 56px where the short axis is the masters' 884px, 30px
where it is the tightest tablet's 652px. A plain `6.3cqmin` also reproduces the master exactly but
hands 1024×768 41px of padding, which measured out at **8px** of remaining slack on 深 SHIN; the
ramp restores it to 41px. Tight panels take a flat 16px instead.

`--panel-pad` had **no consumer anywhere in `src/`** after that, and is now deleted from
`src/styles.css` — both declarations, the `:root` 28px and the `roomy` 56px.
`docs/design/layout-geometry.md` still names it in two places and needs the same edit.

### Compact: a fourth arrangement, not a suppressed control

At 852×393 and 393×852 the panel used to overflow its own `overflow-hidden` paper with no
scrollbar and no visible symptom — every drink at 852×393 (深 SHIN `458/317`, 透 TŌ `492/317`), the
build list running through the footer rule and the whole 味 TASTING NOTE stack vanishing under a
dangling heading; at 393×852, 透 TŌ `795/776`, 苺 ICHIGO `785/776`, 深 SHIN `827/776`.

Phones are nice-to-have polish and neither size is a target viewport, but a control that opens a
panel which silently eats its own content is a defect at any size, and `DESIGN-TASTE.md` forbids
the scroller that would hide it. The alternative — suppressing the `RECIPE →` affordance below the
tablet sizes — was rejected: it lives in `lab.footer.tsx`, and a collection where a third of the
authored content is unreachable on a phone is a worse answer than a panel that reflows. The layout
is the thing that was wrong, so the layout is what changed. Three moves, each one an existing house
pattern applied at a new size:

- **The panel fills the viewport.** The 14px hairline frame and the `--edge` margin exist so the
  overlay registers with the composition it covers; when it covers everything there is nothing to
  register against, and at 393px of short axis those two spend 20% of the axis on registration
  marks. The frame is `hidden` and the popup insets to the safe area alone. This is a viewport
  switch (`land` / `port`), correctly — the popup's *position* is a viewport fact, unlike anything
  inside it.
- **The render drops.** It is the largest group and the only one that repeats something the stage
  was showing a tap ago. Build, method and tasting exist nowhere else in the app.
- **The build rows turn onto one line.** Label and quantity share a baseline instead of stacking,
  the quantities right-aligning into a column — the same two pieces re-grouped, exactly the way the
  notes group re-groups. Measured on 深 SHIN's five rows at 852×393: **168px turned, 254px
  stacked**, against a body 258px tall. Stacked does not fit and turned has room to spare.

Measured at 852×393: panel 852×393, padding 16, header 44, body 820×258 in four columns of
224 │ 324 │ 1 │ 199, footer 31. At 393×852: panel 393×852, one 361px column, rows 248 / 198 / 1 /
213, the rule running the full width between method and tasting.

### The short axis is a floor, not a fence

The threshold started at 480px, which is anywhere in the phone-to-tablet void and looked
unimpeachable. Probing the boundary of the `land` variant — 900×620, the smallest viewport that
qualifies for the landscape treatment at all — showed it was not:

| Viewport | Panel | Roomy-wide slack |
| --- | --- | --- |
| 900×620 | 784×504 | **−61px** |
| 900×680 | 784×564 | **−22px** |
| 900×720 | 784×604 | 3px |
| 1024×720 | 908×604 | 26px |
| 1280×720 | 1164×604 | 26px |
| 900×760 | 784×644 | 16px |
| 1024×768 | 908×652 | 41px |

Two things fall out. First, the paper's `scrollHeight` **did not report those overflows** — the
content escapes the body grid and is clipped without ever growing the paper's scroll box, so
`scrollHeight === clientHeight` is a necessary check and not a sufficient one. Every measurement
here is the deepest text box against the body's bottom edge, and that is the check that matters.

Second, no single short-axis number can be right: 784×564 fails while 1164×604 passes, so the
requirement depends on **both** axes — the notes column stacks method over tasting at a third of the
panel's width, and a narrower panel wraps more steps and needs more height. 600px is the highest
line that leaves every measured passing case alone and catches every measured failing one, and it
is a *floor under the arrangement*, not a fence between two designs.

One residual, recorded rather than papered over: **900×720 (panel 784×604) fits with 3px to spare.**
Nothing between it and the smallest declared target has less. Closing that band properly means a
two-variable rule, which container queries cannot express without a second container, and which
would put the four target viewports at risk to serve a window size nobody asked for. Left as is,
with the numbers above so the next person does not have to rediscover them.

### One render leaf, after the same thing was solved twice

`recipe.render.tsx` gated its image on `onLoad` alone plus `transition-opacity duration-300`.
`RecipePanel` mounts fresh on every open, so `loadedSrc` started `null` and `onLoad` — a task —
could not fire before first paint. Opening the recipe on a drink whose render is already decoded,
which it always is (the stage has painted it and `neighbourRenders` warms the pair), showed the
dashed placeholder and then a 300ms crossfade into an image that had been ready the whole time: a
second, uncalibrated fade, and a mount animation where `DESIGN-TASTE.md` § Motion says nothing
animates on mount.

It now reads `node.complete` in a ref callback, which runs in the commit before the browser paints
— the approach `lab.stage.tsx` already used and already documented. It still tracks the loaded
*source* rather than a boolean, because the selection can change under a mounted panel during the
closing animation and a boolean would read `true` for an image that has not arrived. Verified on a
genuine first open after a reload, with a `MutationObserver` on `documentElement` across the click
that opens the panel: **six element insertions, zero of them the placeholder** — it is never put
into the document at all. The image reads `complete: true`, `opacity: 1`,
`transition-duration: 0s`, zero running animations.

The dashed frame had also been written twice — `RenderFramePlaceholder` in `lab.stage.tsx` and an
inline block in `recipe.render.tsx` — same dashed border, same `gap-3`, same 20×20 `Picture`, same
`<romaji> · render` caption, already drifting (`size-full` versus `absolute inset-0`).
`DESIGN-TASTE.md` calls it "the **only** surviving trace" of the mockups' drop-zone, singular, so it
was pulled out to one leaf taking `tone="field"` or `tone="paper"`. The tone sets the colour once on
the wrapper and the `Picture` inherits it through `currentColor`, which the design contract asks for
and neither copy did. Both call sites measure the same box: `absolute inset-0` inside the stage's
layer resolves to 369×369 at 1024×768, identical to the `size-full` it replaced.

**That left the load rule itself written twice, which was the same mistake one level up.**
`RenderImage` in `lab.stage.tsx` and `RecipeRender` in `recipe/recipe.render.tsx` each carried a
`measure` ref callback reading `node.complete`, a near-identical comment about why `onLoad` is too
late, the same `absolute inset-0 size-full object-contain` image, the same `opacity` swap and the
same `` `${drink.romaji} · render` `` caption — over two different state models, the stage's
`useState(false)` boolean and the panel's `useState<string | null>`. The panel's own comment said
why the boolean was wrong, and the stage was the boolean.

They are now **one leaf, `src/screens/lab/lab.render.tsx`, exporting `LabRender`**, with the
placeholder as an internal component in the same file — neither is ever used without the other, and
the caption string and the load rule now have one home. The src-keyed state is the one that
survived. `lab.placeholder.tsx` and `recipe/recipe.render.tsx` are both gone; the stage passes
`tone="field"` inside its dissolving layer, the panel passes `tone="paper"` inside the
`bg-paper-shade` well it still owns. Everything else is preserved: the stage's `LabLayer` keying,
the `neighbourRenders` warming in `lab.stage.tsx`, the empty `alt` on both, `draggable={false}`
(which the panel's copy lacked and now has — the only attribute that got wider).

Re-verified live: the incoming image reads `complete: true` at `opacity: 1` on both surfaces, the
panel well measures 367px at 1024×1366 with the image in it, and **no placeholder element enters the
document at all** — on first open, on a rail tap, or on a drink change mid-dissolve.

### Verification — and the blind spot in the technique that came before it

**What the first pass did, and why it missed a blocker.** The panel is renderable without a dialog,
so it was checked by `renderToStaticMarkup(<RecipePanel/>)` into a standalone page carrying the real
compiled Tailwind CSS, the real subset fonts and the real renders inlined as `data:` URIs, loaded
from a `file://` path at each viewport and read back with `getBoundingClientRect`. That is a good
technique and it produced a correct geometry table. **Its blind spot is the entire reason a blocker
shipped**: a page containing only the panel has no `LabShell` to lose a stacking contest to, no
`Dialog.Backdrop`, no portal and no outside-press, so the one defect that made every control in the
panel unusable was structurally invisible to it. A harness that renders a component out of its
composition can only ever verify the component, never its place in the composition. Reach for it
again for pure layout, and never for anything that has to be *reachable*.

**What this pass does.** The app runs in the in-app browser pane — it hydrates, the rail responds,
the dialog opens and closes — so the whole loop is driven live at each viewport: click each of the
nine rail slots, open the recipe, read the DOM, close. Everything below is measured on the shipped
app with the real dialog, the real portal and the real shell underneath it. Three conditions at
every size: **`scrollHeight === clientHeight` and `scrollWidth === clientWidth` on the paper**, **the
deepest text box in the body sits above the body's bottom edge**, and **no `elementFromPoint` sample
resolves inside `LabShell`**. The second is not implied by the first — see *The short axis is a
floor, not a fence*.

The pane's one real limitation is unchanged and worth restating: it delivers zero
`requestAnimationFrame` frames, so Motion never runs, the page never repaints after load, and
screenshots taken after the first paint are stale. Layout and hit-testing are exact; anything
frame-driven has to be checked in a real window.

**All nine drinks × nine viewports, after the change — zero overflow, in either axis, everywhere.**

| Viewport | Panel | Pad | Arrangement | Tightest slack |
| --- | --- | --- | --- | --- |
| 1366×1024 | 1226×884 | 56 | wide, roomy — 398 / 305 / 305 | 80px (透 TŌ) |
| 1194×834 | 1078×718 | 37 | wide, roomy | 60px (透 TŌ) |
| 1024×768 | 908×652 | 30 | wide, roomy | 41px (透 TŌ), 54px (深 SHIN) |
| 1440×900 | 1324×784 | 45 | wide, roomy | 79px (透 TŌ) |
| 1024×1366 | 884×1226 | 56 | tall, roomy — 367 / 367 | 296px (透 TŌ) |
| 834×1194 | 718×1078 | 37 | tall, roomy | 222px (深 SHIN) |
| 768×1024 | 652×908 | 30 | tall, roomy | 86px (深 SHIN) |
| 900×680 | 784×564 | 16 | wide, tight | 232px (深 SHIN) |
| 852×393 | 852×393 | 16 | wide, tight — 224 / 324 / 199 | 61px (深 SHIN) |
| 393×852 | 393×852 | 16 | tall, tight — one 361 column | 52px (深 SHIN) |

Slack is the distance from the deepest text box in the body to the body's own bottom edge. The
stress cases are the drinks that own an axis rather than NAGI: 透 TŌ has five method steps, 深 SHIN
has five build rows *and* the two longest steps, 雲 KUMO has the longest footer, 翠 SUI has only two
build rows and does not read as stranded.

Both masters were re-measured element by element after the restructure. Every structural number is
identical — the hairline frame at `x 56→1310`, the paper at `70→1296`, the 1114×772 content box,
the 398² render well, the 305px landscape columns, the 367px portrait ones. Moving from
`grid-template-areas` to source-order auto-placement, which is what lets the tight cases use
`display: contents`, cost nothing.

Four numbers moved by 4px or less, and the table above now carries the live values rather than the
harness's: the rule under the method list `439 → 443` (reference 452), the extremes line
`679 → 683` (684), method step pitch `44.5 → 44.7` (45) — all three closer to the reference — and
the footer rule `849 → 853` (841), 4px further. The differences are the harness's, not a
regression: it rendered the paper without a dialog around it, and it is now retired.

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

- **Tailwind cannot generate a class it never sees written out.** While these were arbitrary
  variants, composing them (`WIDE + 'grid-cols-…'`, or a small `v(variant, classes)` helper) was the
  obvious tidy-up and it silently produced nothing: the scanner matches complete literals in the
  source, so the variant string and the utility string are found separately and the combined
  candidate never exists. Naming the query in `@custom-variant` is the move that actually works —
  the literal in the source is then just `recipe-tight:hidden`.
- **`cn()` eats every `text-*` size utility that shares a call with a `text-*` colour.** `twMerge`
  runs with the stock config, which knows nothing of `--text-quantity` or `--color-on-paper`, so it
  classifies both as text-colour and keeps only the last: `cn('text-quantity … text-on-paper')`
  ships as `text-on-paper` alone and the quantity sets at the inherited 16px, not 30px. That is a
  live defect in `src/lib/utils.ts`, it is **not** fixed here, and the `cn()` wrapper on the
  quantity `<p>` in `recipe.build.tsx` is load-bearing until it is — dropping it restores the real
  size and the panel's measured no-overflow guarantee has never been checked at that size. Full
  write-up in [Rail interaction](./10-rail-interaction.md), where it is most visible.
- **A regex over string literals is not a Tailwind scanner.** The earlier static harness extracted
  candidate classes with a quoted-string regex; every apostrophe in a doc comment ("Base UI's",
  "the panel's") opened a phantom string that swallowed the real `className` after it. The result
  was a page missing exactly the classes with parentheses in them, which looked like a Tailwind
  arbitrary-value bug and was not. `Scanner` from `@tailwindcss/oxide` is right there.
- **A `display: none` element's rect is all zeros at the viewport origin**, which reads as a box
  escaping the top-left of anything you are checking against. The tight arrangements hide the
  render, and the overflow checker reported a phantom 16px breach until it skipped zero-size boxes.
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
- **The compact panel has no scrim and no frame.** It fills the viewport, so the darkened field
  behind it is never visible and the hairline frame has nothing to register against. That is the
  price of fitting the content, and on a phone a recipe that takes the screen is the right shape
  anyway — but it does mean the overlay reads as a sheet rather than as a print at those sizes.
- **The 14px inset is one value now.** It was written twice in two syntaxes in the same file — `+
  14px` inside four `calc()`s and `-inset-3.5` on the hairline frame — which had to stay equal and
  would not have been changed together. Both read `--recipe-frame`, set once on the popup, which is
  also what lets compact take it to `0px`.
- **`RecipeFavourite`'s target reads `--tap` instead of arriving at 44 by hand.** It was `-my-4 …
  py-4` around a 12px glyph — 16 + 12 + 16 — with a comment explaining the arithmetic, in the same
  folder where `RecipeHeader`'s close control already used `size-(--tap)`. It is now
  `h-(--tap)` with `my-[calc((0.75rem - var(--tap))/2)]` cancelling the growth, so the token names
  the target and the offset derives from it. The button's border box, position, size and margin are
  unchanged at every viewport; only the `padding` shorthand moved, and `elementFromPoint` still
  resolves to the button from −21px to +21px of its centre and to the footer beyond.
- **`RecipePanel`'s docblock was three paragraphs.** It restated the container-box requirement, then
  the 600px measurement history, then Tailwind's variant emission order — all of which live in this
  file, above. It is one sentence and a constraint now. The measurements were already recorded here
  and are unchanged; the emission-order note moved up into the container-query section.

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
