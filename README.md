# Matcha Lab

Nine matcha drinks, one at a time, on a living field of muted matcha green. An art-directed
single-viewport iPad web app: nothing scrolls, nothing stacks, and the only things that move are
the things you touched.

Built with TanStack Start in SPA mode, TanStack Router, Tailwind v4, Base UI, Motion, Gravity UI
icons, and TypeGPU for the WebGPU field. Both typefaces are subset and self-hosted from
`src/assets/fonts/`, so it launches from a cold cache with no network. It installs to the iPad home
screen and runs standalone.

## Getting started

```bash
bun install
bun --bun run dev          # http://localhost:3000
```

**WebGPU is required** for the animated field. It is on by default in current Safari and Chrome;
without an adapter the field does not draw and the app shows the flat `#7B8F63` body colour behind
it. There is no software fallback, deliberately.

## Scripts

| Script | Does |
| --- | --- |
| `bun --bun run dev` | Vite dev server on port 3000 |
| `bun run build` | Production build into `.output/` |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test` | Unit tests (bun's runner) |
| `bun run generate-routes` | Regenerate `routeTree.gen.ts` after adding a route file |
| `bun run fonts` | Re-subset the two `.woff2` faces — run after adding any Japanese glyph to a string |
| `bun run renders` | Regenerate the nine drink renders |

## Read before changing anything

| Document | For |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | Where files go, comment and commit conventions |
| [`DESIGN-TASTE.md`](./DESIGN-TASTE.md) | The design system. Every colour, size, timing and layout number is a token |
| [`docs/design/layout-geometry.md`](./docs/design/layout-geometry.md) | Every measurement, viewport by viewport |
| [`docs/design/image-generation.md`](./docs/design/image-generation.md) | The contract the nine drink renders were made under |
| [`docs/deploy.md`](./docs/deploy.md) | Hosting, cache policy, and the on-device install checks |

If you are about to hard-code a colour, a type size or an edge margin, it already exists in
`src/styles.css`.

## Layout

```
src/
  assets/           fonts/ and renders/ — imported, so Vite fingerprints them
  components/       shared, multi-part UI
  domain/           content and state, no React components
  screens/lab/      the one route surface
  prototypes/       the motion calibration instrument, behind its own route
  routes/           thin TanStack Router wrappers
  lib/              motion tokens and helpers
  styles.css        the token system
```

## Routing

File-based routing over `src/routes`. There are two routes and both are client components:

- `/` — the lab
- `/prototypes/motion` — the motion calibration prototype

Adding a file to `src/routes` creates a route; `bun run generate-routes` refreshes the generated
tree. There are **no server functions, no route loaders and no API routes**, and adding one would
change what the build produces — see below.

## Deploying

The build is a **pure static site**. `spa.enabled` prerenders the HTML shell once at build time and
`spa.prerender.outputPath: '/index'` emits it as `index.html`, so the deployable artefact is exactly
one directory, `.output/public/`, and any static host serves it with no configuration. Nitro also
emits `.output/server/` — it is dead weight here and is not uploaded.

```bash
bun run build
bunx netlify-cli deploy --prod --dir .output/public --no-build
```

Host choice, the `_headers` cache policy and why it is the fragile part, the one-time account
setup, and the on-device Add-to-Home-Screen verification are all in
**[docs/deploy.md](./docs/deploy.md)**. Read it before the first deploy — iOS only offers
**Add to Home Screen** over `https`, so every home-screen behaviour in this app is unverified
until the app is on a real origin.
