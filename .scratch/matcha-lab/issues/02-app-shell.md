# App shell and SPA foundation

Type: task
Status: open
Blocked by: 01

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
