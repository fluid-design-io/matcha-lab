# Render resolution

Type: task
Status: open
Blocked by: —

Split out of [Viewport verification pass](./13-viewport-pass.md), which found the numbers but had
no licence to regenerate nine images.

**The numbers this ticket was opened on were wrong, and the correction changes the argument.** It
was written against a 3.9 MB set with a 1.47 MB cold launch — but that set was nine assets that had
been replaced by hand outside the pipeline, transparent-ground and roughly eight times the weight
the pipeline produces. `./scripts/generate-render.sh reconvert` restored the pipeline's own output,
byte for byte. See [Nine generated drink renders](./05-drink-renders.md) for how that regression
happened and how it was caught.

So the bandwidth case is now weak and the decode case is what is left.

## Question

The nine renders are **2048×2048 webp, 481 KB on disk**, and a cold launch on the opening drink
fetches three of them — `nagi` + `sui` + `kumo` = **182 KB**.

| File | Bytes | | File | Bytes |
| --- | ---: | --- | --- | ---: |
| `sui.webp` | 80,310 | | `ichigo.webp` | 49,934 |
| `on.webp` | 64,492 | | `to.webp` | 45,844 |
| `kumo.webp` | 63,464 | | `nagi.webp` | 38,376 |
| `kage.webp` | 60,754 | | `awa.webp` | 32,094 |
| `shin.webp` | 57,238 | | **total** | **492,506** |

At 481 KB for the set and 182 KB before the first tap, **the download is no longer worth
optimising.** The fonts are 28 KB and the JS bundle dwarfs both.

What remains is resolution. **The frame never exceeds 594 px CSS.** `--frame-size` is
`min(48svh, 38svw)` in landscape and `min(58svw, 44svh)` in portrait; the largest it reaches at any
target viewport is 594 px at the 1024×1366 portrait master, 492 px at the 1366×1024 landscape
master, 369 px at 1024×768. At a 2× device pixel ratio that is 1188 device px at the very largest —
**2048 is 1.7× more than the biggest case needs and 2.8× more than 1024×768 needs.** The recipe
panel's well is smaller again: 398 px at the landscape master, 272 px at 768×1024.

Decoded, each image is 2048² × 4 ≈ **16.8 MB of RAM**, and `neighbourRenders` keeps three live at
once — roughly 50 MB of decoded bitmap for one 492 px square. That is the real cost, and it is a
cost an iPad pays in memory pressure and decode time rather than in network.

Decide and do:

- Whether 1200 px is the right single ceiling. It covers every frame at 2× with headroom and cuts
  decoded RAM by 66%, at a file size that barely matters either way now.
- Whether the recipe panel should share that asset or take a smaller one — its well is a third of
  the stage frame's area at some viewports.
- Whether `neighbourRenders` should still warm both neighbours eagerly, or wait for an idle
  callback. Three live decodes is the memory number, not the byte number.

**Do not regenerate the art, and do not hand-edit the assets.** The
[image generation contract](../../../docs/design/image-generation.md) governs how these were made
and they are in family. This is a resize inside `scripts/generate-render.sh` — every change to what
ships goes through that script, or the ground guarantees it exists to enforce are worthless.

**Why it matters:** the frame is square and the render is the only real colour in the app, so any
softness shows. Cutting resolution is safe only as long as the ceiling is above the largest frame
at 2×; below that, this is the one image in the app anyone actually looks at.
