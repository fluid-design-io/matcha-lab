# Matcha Lab

Wayfinder map. Effort slug: `matcha-lab`. Tracker: local markdown.

## Destination

A shipped, polished **Matcha Lab** — a single-viewport, art-directed iPad-native SPA presenting nine matcha drinks, one at a time, with a large render, a Japanese identity, a favourite toggle, and a compact recipe overlay. Installable to the iPad home screen and correct at both landscape and portrait.

Reached when the core loop — *select drink → view drink → open recipe → close recipe → select another* — is real, adaptive across the four target viewports, and visually consistent with `DESIGN-TASTE.md`.

**Execution is in scope.** This map does not stop at a spec; its tickets build the thing.

## Notes

**Domain.** A *drink* is one of nine authored records. Each has a **kanji identity** (character + romaji), an English name, a **build** (matcha base volume + ingredients), a **method** (3–5 imperative steps), a **tasting note**, and five **flavour axes** (coconut, cream, energy, fresh, level; 0–10). All nine share one **matcha base**: 3 g sifted matcha, 35–40 ml water at 75–80 °C, whisked. A *favourite* is a persisted drink id.

**Skills every session must consult:**
- `react-composition-structure` — file/folder architecture, compound components, public API boundaries. Non-negotiable for code hygiene.
- `motion` — before writing any animation code. Import from `motion/react`, never `framer-motion`.
- `typegpu` — for anything touching the shader field.
- `frontend-design` — for visual work.

**Standing preferences for this effort:**
- Single viewport, `min-height: 100dvh`, no vertical scroll on the main experience. No stacked sections, card grids, footers, or multi-page nav.
- Motion is **extremely subtle** — only noticeable if you're looking for it. When in doubt, less.
- Design primarily for 12.9" iPad. **Landscape (1366×1024) and portrait (1024×1366) are both primary**; also verify 1194×834 and 1024×768. Mobile works but is nice-to-have polish.
- Layout adapts by **aspect ratio**, not a width breakpoint. Custom Tailwind v4 `--breakpoint-*` combining `min-width` *and* `min-height`. Container queries inside the recipe overlay.
- Palette: muted matcha field `#7B8F63` as the single unifying world; rice-paper surfaces; green-black ink. Noto Sans JP leads; a neutral grotesque carries romanization and English at much smaller sizes.
- NAGI opens.

**Settled during charting** (rounds 1–3, before any ticket existed):

- Collection is nine drinks, re-keyed from research to real homemade-friendly recipes. Eight of the nine original kanji survive; 柔 YAWA → 透 TŌ. Order preserved from the reference mockups, so NAGI sits at 02.
  `01 翠 SUI` Usucha · `02 凪 NAGI` Iced Matcha Coconut Water · `03 雲 KUMO` Matcha Affogato · `04 影 KAGE` Hojicha–Matcha Layered · `05 泡 AWA` Matcha Shakerato · `06 温 ON` Matcha Latte (hot) · `07 透 TŌ` Matcha Tonic · `08 苺 ICHIGO` Ichigo Matcha Latte · `09 深 SHIN` Black Sesame Matcha Latte
- **Provenance honesty:** only usucha is genuinely traditional; matcha+azuki is a traditional pairing in a modern format; everything else is a modern café invention. Copy may evoke, but must not claim heritage. See [drinks research](./research/drinks.md).
- **Imagery is real generated raster art**, one per drink, produced by Codex CLI. True vessel per drink (chawan for usucha, tall glass for the tonic, bowl-and-spoon for the affogato); camera, lighting, line weight, palette and framing locked so the nine read as one family.
- **TypeGPU renders the field** — the `#7B8F63` ground as a living surface (slow value-noise drift + fine paper grain). It does not render the drink.
- **No WebGPU fallback.** Target is iPadOS 26+ and modern browsers only. Body paints flat `#7B8F63` to avoid a white flash before the device resolves — that is first paint, not a fallback path.
- **Data layer is TanStack Store** (`@tanstack/store` + `@tanstack/react-store`, both already installed), with favourites persisted to localStorage by hand — roughly 25 lines. No device sync, offline forever, data lives on one iPad.
  - Chosen over TanStack DB on the evidence in [the data-layer research](./research/tanstack-db.md): ~3 KB gzipped versus ~61 KB, and every DB differentiator is inert without a backend — no optimistic window exists when writes confirm synchronously.
  - That research also records the constraints this choice **avoids**: DB has no IndexedDB collection, and its `useLiveQuery` throws under `renderToString`. Neither applies to Store. Do not reintroduce them by "helpfully" switching back.
  - `spa: { enabled: true }` still goes in `vite.config.ts` — wanted for the home-screen app, not forced by the data layer.
- **Icons come from `@gravity-ui/icons`**, deep-imported per icon (`@gravity-ui/icons/Heart`) so they tree-shake. Verified present: `Heart`, `HeartFill`, `Xmark`, `ArrowRight`, `Picture`, plus `Flask`, `Cup`, `Mug`, `Snowflake`, `Flame` if serve-temperature or vessel marks are wanted. `lucide-react` is a scaffold leftover — remove it rather than mixing two icon families.
- **Codex image generation gotcha:** the `codex` on PATH (0.141.0) *cannot* generate images and silently fakes them with Python PIL while reporting success. Use `/Applications/ChatGPT.app/Contents/Resources/codex`. Every generation needs an anti-PIL guard and a colour-count verification. Details in [Nine generated drink renders](./issues/05-drink-renders.md).
- Scaffold leftovers to remove: Fraunces/Manrope font import in `src/styles.css`, the TanStack devtools panel, the placeholder home route.

## Decisions so far

<!-- one line per resolved ticket: gist + link -->

- The four reference mockups were recovered from `~/Downloads` and preserved as
  `assets/ref-{1-portrait,2-base-sheet,3-recipe,4-landscape}.png`. Every token in the design
  system is measured off them. — [Design taste contract](./issues/01-design-taste.md)
- Design system is `DESIGN-TASTE.md` + `docs/design/layout-geometry.md` +
  `docs/design/image-generation.md`. Accent `#A8C4D6`; ink `#1F271C`; paper `#F1ECDF`; scrim is a
  darkened field, never black. Type is Noto Sans JP + Archivo, self-hosted and subset. Four icons.
  Aspect-ratio breakpoints are `@custom-variant`, since `--breakpoint-*` cannot combine
  `min-width` and `min-height`. — [Design taste contract](./issues/01-design-taste.md)
- Content lives at `src/domain/drinks/`. Axis extremes are derived two ways from one dataset:
  `leadsCollection` (ties included) fills the diamonds, `collectionExtremes` (sole-or-shared-by-two,
  tiebreak on distance from the collection mean) writes the sentence. With the final nine that
  sentence belongs to TŌ, not NAGI as the mockup shows — the derivation catches it.
  — [The nine drinks as content](./issues/03-drink-content.md)
- Favourites are a TanStack Store persisted by hand to `matcha-lab:favourites`, hydrated in an effect
  and read-before-subscribe so hydration cannot write back what it just read. Stored ids are
  validated against the collection, so a stored `yawa` from before 柔 became 透 does not keep
  counting. — [Data layer on TanStack Store](./issues/04-data-layer.md)
- Shell is SPA mode + `src/screens/lab/lab.shell.tsx`: one grid, four slots, two arrangements.
  Aspect variants are `land` / `port` / `roomy`, with base styles *being* the compact treatment;
  a phone in landscape correctly stays compact because `land` also demands `height >= 620px`.
  Fonts are subset to 28 KB total by enumerating the exact glyph set — taking whole unicode ranges
  costs 6.8× on variable CJK. — [App shell and SPA foundation](./issues/02-app-shell.md)
- The field is TypeGPU at `src/components/matcha-field/`. Drift animates; grain is a function of
  the pixel and nothing else, because animated grain reads as television static at any amplitude.
  Verified by offscreen readback, not screenshot: mean lands on 123/143/99, spread ±3/255, 0.39/255
  of movement per minute. Canvas must be `z-0`, never negative — `body` carries the flat colour and
  a negative-z-index child is painted behind it. — [The living matcha field](./issues/06-matcha-field.md)
- Landscape master is built and measured against ref-4 element by element. The rail slot is a
  fixed `--rail-item` pitch with contents absolutely positioned, so selection never moves the
  neighbours. Two traps recorded in `DESIGN-TASTE.md`: `text-(length:...)` sets size but not
  weight, and kanji ink sits ~9% below its em box centre — measure ink with `TextMetrics`, never
  the element box. — [Landscape master layout](./issues/07-landscape-layout.md)
- Nine renders generated, verified and normalised. The render sits full-bleed on the field with no
  border, so its ground must *be* the field: every image is offset to exactly `#7B8F63`, which is
  what makes the square disappear. Verification now also rejects transparent grounds and drifting
  ones — both were real defects. — [Nine generated drink renders](./issues/05-drink-renders.md)
- Motion is **candidate B, "a whisper of travel", plus a slight defocus** — 40 ms stagger, a
  0.38 s / bounce-0 layer spring, 4 px of drift and 2 px of blur, with the watermark on its own
  1 s spring at 9 px and 4 px. Picked by the human at 1366×1024 from `/prototypes/motion`, four
  intensities driven by one trigger. A multi-step jump is deliberately identical to a single step.
  Components read `useMotionTokens()`, never `MOTION` — that is what honours
  `prefers-reduced-motion`. Environment note that cost real time: the in-app browser
  pane reports `document.hidden` permanently and delivers zero rAF frames, so Motion's frameloop
  never runs and outgoing layers pile up in the DOM. That looks exactly like an AnimatePresence
  bug and is not one — anything frame-driven must be checked in a real browser window.
  — [Motion calibration](./issues/09-motion-calibration.md)
- The rail is one component that reflows, and the portrait bug was that nothing gave it a
  cross-axis size — nine slots measured zero and every glyph piled into a 28 px strip. `--rail-band`
  and `--rail-row` are `:root` tokens rather than utilities because `roomy:` is registered after
  `land:`, so a `roomy:pt-*` would beat `land:pt-0`.
  — [Orientation adaptation](./issues/08-orientation.md)
- Selection has three inputs — tap, swipe, arrow keys — all through `step`/`select` on
  `LabProvider`. The underline is one `layoutId` element, and Motion skips a layout animation only
  when `MotionConfig` says so: `useMotionTokens()` cannot reach it, so without
  `<MotionConfig reducedMotion="user">` reduced motion made the underline travel 864 px in 120 ms,
  *faster* than with motion on. The drag surface must not translate with the drag — pass `_dragX`,
  or it covers the rail during snap-back and eats taps.
  — [Rail interaction](./issues/10-rail-interaction.md)
- The recipe overlay is a Base UI dialog whose **panel is its own size container**, so its
  arrangement switches on the panel's aspect ratio, never the viewport — the landscape and portrait
  panels are 24 px apart in width and any threshold between them would be a coincidence. A portal
  needs an explicit z-index: `fixed` alone resolves to `auto` and the `z-10` shell hit-tests above
  the whole dialog. Layering is field `z-0` / shell `z-10` / overlay `z-20`.
  — [Recipe overlay](./issues/11-recipe-overlay.md)
- **`cn()` was deleting every font-size utility this app defines.** tailwind-merge only knows the
  stock `text-xs…text-9xl` scale, so it read `text-kanji-lg` as a colour and dropped it whenever a
  `text-<role>` colour followed in the same call. The rail kanji, the rail romaji and the recipe
  quantities all rendered at the inherited 16 px for three phases. `extendTailwindMerge` with the
  app's own `font-size` group fixes it — **add a `--text-*` token, add it to that list.**
  — [Viewport verification pass](./issues/13-viewport-pass.md)
- **Every change to what ships goes through `scripts/generate-render.sh`.** All nine renders were
  once replaced by hand to make them transparent for the recipe panel's paper well — 4-channel,
  8× the weight, and the pipeline that guarantees the ground would have discarded every one of
  them. The panel's `bg-paper-shade` is the *empty state's* fill, which is what `ref-3-recipe.png`
  actually shows; the render sits on it as an opaque plate.
  — [Nine generated drink renders](./issues/05-drink-renders.md)
- Static host, and `.output/public/` is the whole artefact — no server functions, no loaders.
  `spa.prerender.outputPath: '/index'` emits the shell as `index.html`, so `/` resolves anywhere
  with no rule. Netlify, configured by files in the repo rather than dashboard state.
  — [Pick a host](./issues/14-pick-a-host.md)

## Not yet specified

- **Matcha base sheet** (reference 2) — a side sheet for the shared base, 3 g / 35–40 ml / 75–80 °C, "used in all nine drinks". Explicitly uncommitted. Revisit once the core loop is real and it is clear whether the app needs it.
- **Home screen icon and splash** — needs generated art in the same family as the drink renders, plus the iOS splash-screen link set. Shape depends on what the render pipeline actually produces.
- **Empty, loading and first-run states** — what shows before images decode, and whether there is an intro/attract state. Depends on how heavy the final WebP set is.
- **Mobile polish** — nice-to-have. Cannot be specified until the aspect-ratio system is real and it is visible where it breaks down.
- **Sound and haptics** — "tactile, slightly playful" may or may not want audio. Unexamined; deliberately deferred until the visual language is settled.

## Out of scope

- **User-supplied drink images.** The reference mockups show a dashed drop-zone with "or browse files". With no server and an offline single-device app, image upload has no home — the nine renders ship with the app. The dashed frame survives only as an empty/loading state.
- **Any backend, account, or multi-device sync.** Confirmed during charting: offline, one iPad, data local forever. This is also what makes TanStack DB's optimistic-mutation engine inert here.
- **Recipe editing / CMS.** Content is authored in the repo as typed records.
- **Multi-page navigation, blog, FAQ, marketing sections.** Ruled out by the brief.
