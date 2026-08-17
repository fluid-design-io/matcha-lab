# Deploy

The point of this document is one thing: get the app onto an `https` origin, because iOS only
offers **Add to Home Screen** over `https` or `localhost`. A LAN dev URL like
`http://192.168.1.20:3000` will never give the fullscreen standalone chrome, so every home-screen
behaviour in this app is unverified until this is done.

---

## What this build is

**A pure static site.** There are no server functions, no route loaders, no `beforeLoad`, no API
routes — `grep` for `createServerFn` returns nothing. The two routes (`/` and
`/prototypes/motion`) are client components, and `spa: { enabled: true }` prerenders the HTML
shell once at build time. Everything after first paint is the browser.

So the deployable artefact is exactly one directory:

```
.output/public/
├── index.html                    the prerendered shell — start_url lands here
├── _headers                      cache policy (copied from public/)
├── _redirects                    SPA fallback (copied from public/)
├── manifest.webmanifest
├── icons/                        180 / 192 / 512 / 512-maskable
└── assets/
    ├── index-<hash>.js           entry
    ├── routes-<hash>.js
    ├── styles-<hash>.css
    ├── archivo-subset-<hash>.woff2
    └── noto-sans-jp-subset-<hash>.woff2
```

`.output/server/` is also produced — roughly 1 MB of Nitro node-server bundle. **It is dead
weight here; do not upload it.** Nitro's default preset is `node-server` and it emits a server
whether or not anything needs one. Switching to Nitro's `static` preset would suppress it, but
that changes the whole build pipeline and has not been validated against this version of
TanStack Start, so it is deliberately not done. Ignoring one directory is cheaper than a broken
build.

**The shell is `index.html`, not `_shell.html`.** The default SPA output path is `/_shell`;
`vite.config.ts` sets `spa.prerender.outputPath: '/index'` instead. That one line is what lets
any static host serve `/` correctly with zero configuration, and it means the host config in
this repo is portable rather than Netlify-shaped.

---

## The host: Netlify

**Recommendation: Netlify, free Personal plan.**

Every piece of host configuration this app needs — the SPA fallback and the cache policy — is a
plain file inside the published directory (`_headers`, `_redirects`), so the whole deploy
contract lives in this repo and there is no dashboard state to rediscover in six months.
`https` and a `*.netlify.app` hostname are provisioned automatically, which is the entire
requirement above, and a single command publishes a locally built directory with no CI, no git
integration and no `netlify.toml` at the repo root.

**Runner-up: Cloudflare Pages** — it reads the same `_headers` and `_redirects` files unchanged
and has a more generous free tier, so switching later costs one command; it loses only on a
fiddlier first-run (`wrangler pages project create` before the first deploy).

Not GitHub Pages: it has no rewrite mechanism at all, so client-side deep links need the
`404.html` copy-of-index hack, and the cache headers here would be unenforceable.

---

## Deploy

```sh
bun run build
bunx netlify-cli deploy --prod --dir .output/public --no-build
```

That is the whole loop once the account exists. `--no-build` is explicit rather than necessary
(there is no `netlify.toml`, so nothing would build) — it documents that the host receives a
finished directory and never runs a build.

Drop `--prod` to publish to a throwaway preview URL first:

```sh
bunx netlify-cli deploy --dir .output/public --no-build
```

**URL shape**

| | |
| --- | --- |
| Production | `https://<site-name>.netlify.app` |
| Preview | `https://<deploy-id>--<site-name>.netlify.app` |
| Custom domain | optional, configured in the UI; certificate is automatic |

**Environment configuration: none.** No environment variables, no secrets, no build settings on
the host side. If a future session goes looking for hidden configuration, there isn't any — the
host is a file server.

---

## One-time setup, in an account UI

These four steps need a human. Nothing in the agent workflow can or should do them.

1. **Create a Netlify account** at [netlify.com](https://netlify.com) — GitHub sign-in or email.
   Choose the free **Personal** plan. No card is requested. Expect to land on an empty
   "Sites" dashboard.
2. **Authorise the CLI**: run `bunx netlify-cli login`. A browser tab opens on a Netlify
   authorisation page; click **Authorize**. The tab confirms, and the terminal prints
   `You are now logged in`. The token is written to `~/.netlify/config.json`, once, per machine.
3. **Create the site**: run `bunx netlify-cli sites:create --name matcha-lab`. If the terminal
   prompts for a team, pick the personal one. **The name is globally unique across
   `netlify.app`** — if `matcha-lab` is taken the command fails outright, so pick something like
   `matcha-lab-op` and use that everywhere below. Expect the command to print the site URL and
   site ID; note the URL, that is the app's address from now on.
4. **Link this checkout to that site**: run `bunx netlify-cli link --name <site-name>` from the
   repo root. It writes `.netlify/state.json`, which is how the deploy command in the previous
   section knows where to publish without asking. Do this once per machine.

Optional, later: a custom domain, under **Site configuration → Domain management → Add a
domain**. Netlify issues the Let's Encrypt certificate itself; the only external step is
pointing DNS at Netlify, which is registrar work and out of scope here. `*.netlify.app` is
already `https` and is enough for everything in this document.

---

## Cache policy, and why it is the fragile part

`public/_headers` sets two classes and nothing in between:

| Path | `Cache-Control` |
| --- | --- |
| `/assets/*` | `public, max-age=31536000, immutable` |
| `/`, `/index.html`, `/manifest.webmanifest`, `/icons/*` | `public, max-age=0, must-revalidate` |

Everything under `assets/` carries a content hash in its filename, so its URL changes whenever
its bytes do and it can be cached for a year. The shell is what *names* those hashed files — if
the shell is cached, the new assets are never discovered, and an installed home-screen app
happily runs a build from three deploys ago with no visible way out. That is the failure this
table exists to prevent, and it is invisible until someone notices the app never updates.

`icons/` and the manifest come out of `public/` under fixed names, so they get the shell's
treatment for the same reason.

No header name is set from two blocks in that file, on purpose. Hosts disagree about whether
the more specific block or the later block wins when both set `Cache-Control`, and this file
sidesteps the question rather than betting on it.

There is **no service worker**, deliberately. The app therefore needs network at launch. A bad
service worker can pin a stale build permanently — a worse failure than a cold launch — and the
immutable asset caching already makes a warm launch mostly local. If one is ever added, these
headers matter more, not less.

---

## Verifying on the iPad

Do this on the device. None of it is checkable in a desktop browser, and none of it is checkable
in the agent's in-app browser pane.

### 1. It loads over https

Open the production URL in Safari on the iPad. Expect the flat `#7B8F63` ground with the drink,
the masthead and the rail over it. The ground is a plain `background-color`, so there is nothing
here that can fail to initialise — if the page is white, the stylesheet did not arrive.

Check a deep link too: `https://<site>/prototypes/motion` typed directly into the address bar
must render the motion prototype, not a 404. That is `_redirects` doing its job; a 404 here
means the file did not reach the published root.

### 2. Add to Home Screen

Share button → **Add to Home Screen**. Expect:

- the name prefilled as **Matcha Lab** (from `apple-mobile-web-app-title`)
- the placeholder 抹 icon on the flat field, square with no transparent corners

Tap **Add**.

### 3. A correct standalone launch

Launch from the home screen icon. **Correct** looks like:

- **no Safari chrome at all** — no address bar across the top, no share/tabs toolbar across the
  bottom, no tab strip
- the status bar (time, Wi‑Fi, battery) in **white glyphs drawn directly over the green field**,
  with the field running underneath it and no white or grey band separating them — that is
  `apple-mobile-web-app-status-bar-style: black-translucent` plus `viewport-fit=cover`
- the very first frame is **flat `#7B8F63`**, never white. Both the manifest `background_color`
  and the inline `<body>` background exist for this. A white flash means one of them is not
  arriving.
- swiping down from the top edge gives Notification Centre, not a URL bar

**Wrong** — a Safari-chrome launch — looks like a grey address bar showing the hostname pinned
to the top with the app starting below it, and a toolbar at the bottom. If that happens, the
launch is a plain Safari tab: check the origin really is `https` (not the LAN dev URL) and that
`display: "standalone"` survived into the deployed `manifest.webmanifest`.

### 4. The precise checks, over Web Inspector

Cable the iPad to a Mac, then **Safari → Develop → \<iPad\> → Matcha Lab** to attach an inspector
to the *installed app* (it appears as its own entry, separate from Safari tabs). In the console:

```js
window.matchMedia('(display-mode: standalone)').matches   // → true
navigator.standalone                                       // → true
```

Both false means it is running as a browser tab, whatever it looks like.

Safe-area insets — zero on all four means `viewport-fit=cover` did not apply:

```js
const p = document.createElement('div')
p.style.cssText = 'position:fixed;top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom)'
document.body.append(p)
getComputedStyle(p).top   // expect a non-zero px value
```

Note that the shell absorbs insets with `max(var(--edge), env(safe-area-inset-*))` and `--edge`
is 44–56px, so an inset smaller than that changes nothing visible. This checks that the meta tag
applied, not that the layout moved.

### 5. It can update itself

The one that catches a cache mistake. Change something visible, `bun run build`, deploy again,
swipe the app away from the app switcher, relaunch from the home screen. The change must be
there. If it is not, the shell or the manifest is being served with a long `max-age` — check the
response headers for `/` in the Network tab, not the ones in `public/_headers`.
