# Pick a host

Type: task
Status: resolved
Blocked by: —

## Answer

**Netlify, free Personal plan.** `https://<site-name>.netlify.app`. Deploy is two commands from
this repo with no CI:

```sh
bun run build
bunx netlify-cli deploy --prod --dir .output/public --no-build
```

Full walkthrough, including the four account steps only a human can do and the on-device
verification, is in [docs/deploy.md](../../../docs/deploy.md). **Environment configuration:
none** — no variables, no secrets, no build settings on the host side. If a future session goes
looking for hidden configuration, there isn't any.

### This is a pure static site, and now it builds like one

Settled first, because a static host and a server host are different recommendations. There are
no server functions, no route loaders, no `beforeLoad` — `grep` for `createServerFn` across
`src/` returns nothing. Both routes (`/` and `/prototypes/motion`) are client components, and
`spa: { enabled: true }` prerenders the shell once. **`.output/public/` is the entire site,
480 KB of it.**

`.output/server/` is also emitted — 1 MB of Nitro node-server bundle that nothing here calls,
because Nitro's default preset is `node-server` and it builds a server whether or not one is
wanted. **Do not upload it.** Nitro does ship a `static` preset that would suppress it; it was
read and rejected, because `static: true` makes Nitro skip the server build entirely
(`_build/rolldown.mjs`, `if (!nitro.options.static)`) and TanStack Start's prerenderer needs a
request handler to fetch `/` from. Whether the two compose is a build-run question, and this
ticket was explicitly not allowed to build. Ignoring a directory is cheaper than a broken
pipeline.

### One config change: the shell is now `index.html`

`spa.prerender.outputPath` defaults to `/_shell`, which is why the last build produced
`.output/public/_shell.html` and ticket 02 promised this ticket would wire a rewrite to it.
`vite.config.ts` now sets `outputPath: '/index'`, and the shell lands at `index.html` instead.

Traced through the source rather than guessed at — `start-plugin-core/dist/esm/prerender.js`:

```js
const cleanPagePath = (prerenderOptions.outputPath || page.path).split(/[?#]/)[0]
const isSpaShell = startConfig.spa?.prerender.outputPath === cleanPagePath
if (isSpaShell) htmlPath = cleanPagePath + '.html'
```

`outputPath` only names the output file; the prerenderer still fetches `maskPath` (`/`). So
`/index` takes the `isSpaShell` branch and writes `index.html`.

Worth the one line because it removes host lock-in: `/` then resolves on *any* static host —
Netlify, Cloudflare Pages, S3, `python -m http.server` — with no rule at all, and the
`_redirects` file is left covering only deep links. Cloudflare Pages in particular serves its
own 404 page at `/` when there is no root `index.html`, so the default name would have made the
runner-up host a rewrite of this work rather than a one-command switch.

**Honest status: unverified by a build.** The house rules for this run forbade `bun run build`
(three agents mid-edit in `src/`). `bun run typecheck` and `bun test` are clean and the option is
accepted by the plugin's types, but nobody has watched this build. **First thing to check on the
next real build: `.output/public/index.html` exists and `_shell.html` is gone.** If it somehow
is not, the fix is one line — change the target in `public/_redirects` back to `/_shell.html`
and everything else in this ticket still holds.

### Why Netlify

Every piece of host configuration this app needs is a plain file *inside the published
directory* — `public/_headers` and `public/_redirects`, which Vite copies verbatim into
`.output/public/` the same way it already copies `manifest.webmanifest` and `icons/`. So the
whole deploy contract is in the repo, reviewable in a diff, with no dashboard state to
rediscover later and no `netlify.toml` at the root. `https` and a `*.netlify.app` hostname are
automatic, which is the entire point of the ticket, and one command publishes a locally built
directory.

**Runner-up: Cloudflare Pages** — reads the same two files unchanged and has a more generous
free tier, so switching costs one command plus a `wrangler pages project create`.

Not GitHub Pages: no rewrite mechanism at all, so client-side deep links need the
`404.html`-copy-of-index hack and these cache headers would be unenforceable.

### Cache policy, which is the fragile half

| Path | `Cache-Control` |
| --- | --- |
| `/assets/*` | `public, max-age=31536000, immutable` |
| `/`, `/index.html`, `/manifest.webmanifest`, `/icons/*` | `public, max-age=0, must-revalidate` |

Everything under `assets/` is content-hashed, so its URL changes when its bytes do. The shell is
what *names* those hashed files: cache the shell and the new assets are never discovered, and an
installed home-screen app runs a build from three deploys ago with no visible way out. `icons/`
and the manifest come out of `public/` under fixed names, so they get the shell's treatment.

`_headers` deliberately never sets one header name from two blocks — hosts disagree about
whether the more specific or the later block wins for a duplicated `Cache-Control`, so `/*`
carries only `X-Content-Type-Options` and `Referrer-Policy`. The manifest also gets an explicit
`Content-Type: application/manifest+json`; a manifest served as `text/plain` is silently
ignored, and that failure looks like a manifest bug rather than a header one.

**No service worker, deliberately.** The app needs network at launch. A bad service worker can
pin a stale build permanently, which is worse than a cold launch, and immutable asset caching
already makes a warm launch mostly local.

### PWA audit against iPadOS

Checked, and mostly already right from ticket 02 — recording it so the next session does not
re-audit. Correct as found: `display: standalone`, `start_url` and `scope` both `/` (and the
shell prerenders at `maskPath: '/'`, so `start_url` lands on a real file), `background_color` and
`theme_color` both `#7B8F63`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`,
`apple-mobile-web-app-status-bar-style: black-translucent`, `theme-color`, and
`viewport-fit=cover` in the viewport meta — without which `env(safe-area-inset-*)` in the shell
resolves to zero on all four sides.

Icons verified on disk, not just in the manifest: 180 / 192 / 512 all present at their declared
pixel sizes, `icon-180.png` opaque RGB with no alpha (iOS applies its own mask and a
transparent apple-touch-icon shows black corners), and the maskable 512 opaque throughout —
its alpha channel is a uniform 255 — with the 抹 glyph inside the central ~30%, comfortably
within the 80% safe zone. Still the deliberate placeholder ticket 02 shipped.

Added to `manifest.webmanifest`: `id: "/"`, `lang: "en"`, `dir: "ltr"`. Identity and metadata
completeness rather than fixes — iOS reads none of them, but `id` is what keeps app identity
stable elsewhere when `start_url` ever changes.

No `apple-touch-startup-image`, and none needed: current iOS composes the launch screen from the
manifest `background_color` and icon, which is the second reason `background_color` is `#7B8F63`
rather than a default. Confirm on device that the first frame is green, not white — it is on the
iPad checklist in the deploy doc.

### For a human, and only a human

Account creation, CLI authorisation, site creation and linking — steps 1–4 of
[docs/deploy.md](../../../docs/deploy.md#one-time-setup-in-an-account-ui). The site name is
globally unique across `netlify.app`, so `matcha-lab` may be taken and the command fails
outright rather than picking something else; whatever name is used becomes the app's address.

Then the iPad pass, which is what this ticket was blocking: Add to Home Screen, and confirm a
standalone launch (no address bar, no bottom toolbar, white status-bar glyphs over the green
field, no white first frame) rather than a Safari-chrome one. `docs/deploy.md` has the visual
description of both and the two Web Inspector one-liners that settle it —
`matchMedia('(display-mode: standalone)').matches` and `navigator.standalone`. Worth doing
before [Viewport verification pass](./13-viewport-pass.md) so that pass gets a real installed app.

### Two stale things found, in files this ticket did not own

- **`README.md` lines 34–45** still carry the scaffold's deploy section: "Deploy with Nitro",
  a self-contained Node server, and pushing `dist/`. All three are wrong for this app now.
- **`.gitignore` has no `.netlify`** entry. `netlify link` writes `.netlify/state.json` on the
  first setup; it is repo noise rather than a secret, but it will show up in `git status`.

## Question

Decide where this deploys and wire it up, so the iPad home-screen install can actually be tested.

**Why it matters:** iOS only offers Add to Home Screen over `https` or `localhost`. A LAN dev URL like `http://192.168.x.x:3000` will not give the fullscreen standalone chrome, so until this is done, home-screen behaviour is unverified no matter how correct the manifest is.

This is human-in-the-loop — account creation and DNS are not the agent's to do. The agent's side is: recommend a host for a static SPA build, produce the build configuration, and hand over a precise checklist for the parts requiring an account.

Not blocked by anything — takeable at any point. Worth doing **before** [Viewport verification pass](./13-viewport-pass.md) so that pass can include a real installed-app check on the iPad rather than a simulated one in a desktop browser.

Resolution should record: the host, the deploy command, the URL, and any environment configuration a future session would otherwise have to rediscover.
