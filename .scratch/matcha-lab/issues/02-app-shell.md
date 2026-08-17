# App shell and SPA foundation

Type: task
Status: resolved
Blocked by: 01

## Answer

Ground laid, no feature work. Verified at all four target viewports plus a phone in both
orientations — empty shell, no scroll, no flash, no console output.

**SPA.** `spa: { enabled: true }` on `tanstackStart()`. The build emits `_shell.html`; the host
needs a rewrite to it, which is [Pick a host](./14-pick-a-host.md)'s to wire.

**Fonts.** Noto Sans JP + Archivo, self-hosted and subset by `scripts/build-fonts.sh` into
`src/assets/fonts/` — `src/`, not `public/`, so Vite fingerprints them and they cache immutably.
**28 KB for both.** Enumerating the exact glyph set rather than taking whole unicode ranges is
what makes that possible: the JP subset is 14 KB as authored and **96 KB** if hiragana and
katakana are included wholesale, because variable CJK carries heavy per-glyph `gvar` data and 200
unused kana cost 6.8× the rest of the file. `font-display: block` with both files preloaded — a
swap would flash the system CJK face at 450px, which is far worse than 40 ms of nothing on a
surface already painting flat `#7B8F63`.

**Tokens.** All of Part 1 is in `src/styles.css`. Type sizes are `calc(base * var(--type-display))`
or `* var(--type-micro)` — two density multipliers set on `:root` per media query. Custom property
substitution is lazy, so redefining a multiplier re-resolves the whole scale without restating a
single size. Display type gives up 16% at the smaller viewports; micro-labels give up 8%, and
`--text-micro` does not scale at all, because 9px letterspaced caps stop being legible before they
stop fitting.

**Breakpoints are `@custom-variant`, not `--breakpoint-*`.** The `--breakpoint-*` namespace can
only generate width queries; the compound guard the brief asks for needs a custom variant. Three
of them — `land`, `port`, `roomy` — with base styles *being* the compact treatment. Verified:

| viewport | land | port | roomy | edge | rail item |
| --- | :---: | :---: | :---: | --- | --- |
| 1366×1024 | ✅ | — | ✅ | 56 | 73 |
| 1194×834 | ✅ | — | — | 44 | 60 |
| 1024×768 | ✅ | — | — | 44 | 60 |
| 1024×1366 | — | ✅ | ✅ | 56 | 108 |
| 768×1024 | — | ✅ | — | 44 | 88 |
| 852×393 (phone, rotated) | — | — | — | 24 | 52 |

That last row is the one that matters. A phone in landscape has an aspect ratio of 2.17 — further
from square than any iPad — and it correctly stays compact, because `land` also demands
`height >= 620px`.

**Home-screen install.** `manifest.webmanifest` (`standalone`, `#7B8F63` for both theme and
background), `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style:
black-translucent` so the field runs under the status bar, `viewport-fit=cover`, and
`user-scalable=no` — a pinch zoom can only break a fixed single-viewport composition. Safe-area
insets are absorbed once, at the shell, via `max(var(--edge), env(safe-area-inset-*))`, so nothing
further in has to know about the home indicator.

Icon art was deferred by the ticket, but the wiring is only testable with *some* icon, so the
manifest ships an obvious placeholder — 抹 in paper on the flat field, at 180/192/512 plus a
maskable 512. Replaceable in one command when the real art exists.

**Shell.** `src/screens/lab/lab.shell.tsx` — one grid, four named slots, one DOM order, two
arrangements. Landscape gives the rail its own right-hand column spanning the full height;
portrait drops it to a fourth row. Nothing is swapped, which is what lets selection state survive
a rotation. `h-svh`, not `dvh` — `svh` is the smallest viewport height, so content fits even while
Safari's toolbars are animating, and in standalone the two are identical.

**Scaffold removed.** Devtools panel and its four packages, `lucide-react`,
`@tailwindcss/typography`, `tw-animate-css`, the Fraunces/Manrope import, and the placeholder home
route. Folder structure is documented in `AGENTS.md`.

## Question

Turn the TanStack Start scaffold into the shell this app needs. No feature work — just the ground everything else stands on.

- Enable `spa: { enabled: true }` in `vite.config.ts` — wanted for the home-screen app, so it behaves as a standalone shell rather than round-tripping a server.
- Replace the Fraunces/Manrope import in `src/styles.css` with Noto Sans JP + the chosen neutral grotesque. Self-host or preload — a home-screen app should not depend on a Google Fonts round-trip at launch.
- Encode the Part 1 tokens from [Design taste contract](./01-design-taste.md) as Tailwind v4 `@theme` values: colours, type scale, spacing, motion timings.
- Define the aspect-ratio breakpoints. Custom `--breakpoint-*` combining `min-width` **and** `min-height`, so a short-but-wide window does not get the tall treatment. Cover 1366×1024, 1194×834, 1024×1366, 1024×768.
- Home-screen install: web manifest (`display: standalone`, theme and background colour `#7B8F63`), `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `viewport-fit=cover`, and safe-area inset handling. Icon art itself is deferred — leave the wiring ready.
- Body paints flat `#7B8F63` so there is no white flash before the GPU device resolves.
- Remove the scaffold: devtools panel, placeholder home route content, and `lucide-react` — icons come from `@gravity-ui/icons`, deep-imported per icon (`@gravity-ui/icons/Heart`), and two icon families in one app is exactly the kind of drift this project should not have.
- Establish the folder structure per the `react-composition-structure` skill before any component lands, so later tickets have somewhere obvious to put things.

Verify the four viewports render an empty shell with no scroll and no flash.
