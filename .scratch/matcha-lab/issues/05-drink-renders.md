# Nine generated drink renders

Type: task
Status: resolved
Blocked by: 01, 03

## Answer

All nine generated, verified, normalised and wired. `src/assets/renders/*.webp`, **481 KB total**,
resolved per drink by `src/domain/drinks/drinks.renders.ts` — imported rather than pathed, so Vite
fingerprints them and they cache immutably.

Every vessel is its true one: chawan for 翠 SUI, tall highball for 凪 NAGI, footed bowl and spoon
for 雲 KUMO, three-band glass for 影 KAGE and 苺 ICHIGO, stemmed coupe for 泡 AWA, handled mug for
温 ON, narrow fizz glass for 透 TŌ, short tumbler for 深 SHIN.

**Two regenerations, both caught by looking at the nine together rather than one at a time:**

- **泡 AWA came back teal-blue.** The prompt said "jade", and *jade* carries a blue reading the
  model was happy to take. `warm jade green, never blue or teal` fixed it.
- **透 TŌ came back on a transparent background.** It passed the colour count, looked perfect
  against a green page, and would have composited over whatever sat behind it anywhere else.

Both are now automated checks in the script, because finding them by eye was luck: `file` (PNG,
1254²), distinct colours ≥ 2,000 (a measured PIL fake had 664; real ones run 15k–72k), min alpha
= 255, corner colour within 18 of `123,143,99`.

One trap worth recording: ImageMagick's `-evaluate add` takes **quantum units, not 8-bit levels**.
On a Q16 build `add 6` shifts by 6/65535 and does nothing — silently, with no error. The first
attempt at ground normalisation "succeeded" and changed nothing. Percent of QuantumRange is the
portable form.

The render frame preloads the two neighbours of the current selection, so a swipe or an arrow key
lands on a decoded image rather than on the empty frame.

---

### The defect this ticket first missed: every check ran upstream of the encoder

The first pass at this ticket normalised the ground to exactly `#7B8F63` **in the intermediate
PNG**, verified that, and shipped. `cwebp -q 82` then threw it away. What actually shipped drifted
one to two levels and was not flat, differently per image:

| shipped before | corner mean | corner k |
| --- | --- | --- |
| awa · ichigo · to | 122,143,99 | 2–7 |
| kage · kumo · nagi | 123,143–144,98 | 3–12 |
| on | 123,144,99 | 5 |
| shin · sui | 122,143,97–98 | 5 |

Five different grounds, none flat. Zoomed in on 影 KAGE, the ground was mottle: every 16×16 block
carried two to four values spanning four levels, and the corners were **28–49% pure**. That is a
textured square sitting on a smooth field, and the colour *shifts mid-dissolve* as two renders
cross-fade — which is the thing that actually shows, more than any single image's offset.

**Verifying the intermediate is exactly how this survived a green tick.** The pipeline now checks
the file that ships.

### The fix: flatten before the resize, then pre-compensate the encode

Four steps, in `verify_and_convert`, and the order matters.

1. **Per-channel offset** to bring the ground's mean to `#7B8F63`. Unchanged.
2. **Flatten** — `-fuzz 2% -fill '#7B8F63' -opaque '#7B8F63'`. The offset moves the *mean*; the
   ground was never flat to begin with (the generator leaves ~33 colours in a 60×60 corner).
   **2% is the smallest fuzz that works, and it was measured, not guessed:** at 1% the top-left
   corner goes flat and the other three do not, on all nine; at 2% all four corners on all nine
   are one colour; at 4%+ it starts eating washes. Checked against the drawing by counting pixels
   more than 10 levels off the ground before and after — at 2% that count is *identical* on every
   one of the nine. What does move is 0.05–0.9% of the near-ground pixels, the outermost fringe
   of the faintest wash, and a 2.3× zoom on 雲 KUMO's scoop edges, 凪 NAGI's ice and 透 TŌ's
   bubbles old-versus-new shows nothing lost.
3. **Upscale after flattening, never before.** Lanczos over a region that is already one exact
   colour returns that colour, so the flat ground survives the resize intact. Flattening after the
   resize would have to snap the resampling's own ringing and would leave a step where the halo
   meets the ground. (`.render-work/nagi/render-2048.png` under the old order had k=34 in the
   corner — the upscale had *amplified* the generator's noise before the encode ever ran.)
4. **Encode, decode, and pre-compensate.** The ground of the master is one exact colour, so it can
   be recoloured by an exact-match replace that leaves every drawn pixel alone. The script walks
   candidates outward from the ship colour, re-encodes, and keeps the first whose *decoded* ground
   is right. All nine hit on the first candidate.

### The shipped ground is `rgb(122,143,99)`, and `123,143,99` is not reachable

This is the part that cost the most time and is the most worth recording. The brief for this fix
assumed pre-compensation could iterate to exactly `123,143,99`. **It cannot, at any quality.**

Lossy WebP is VP8: RGB goes through 8-bit YUV, and the decoded colour can only land on the lattice
that integer YUV maps back to. For the (Y,V) pair that decodes red to 123, blue can only be 98 or
100 — `B = Y' + 2.018·(U−128)` steps two levels per unit of U and skips 99. The first attempt at
a naive feedback loop oscillated for exactly this reason: `fill 123 → 122`, `fill 124 → 125`,
`fill 122 → 122`. It is a step function, not an offset.

Proven by exhaustion rather than by argument: a solid patch swept over the full 15×15×15 box of
inputs around the target produced `123,143,99` **zero times out of 3,375 encodes**, repeated at
q75, q82, q90 and q100. Quality does not move the lattice.

`122,143,99` is the nearest point that exists — one level low on red, nothing else, ΔE76 **0.41**,
against a field the shader is already drifting **±3 levels** across (`DRIFT_AMPLITUDE` 0.013 plus
grain). The contact sheet is its own evidence: nine tiles at `122,143,99` montaged onto a
background of exactly `123,143,99`, and the tile seams are invisible.

The alternatives were priced and rejected: `-near_lossless 0 -q 100` decodes to `123,143,99`
exactly, at **544 KB per image** — 4.9 MB for the set, on a home-screen app whose whole point is
relaunching from cache. `-lossless` is 656 KB. Dropping to 1024² to afford lossless is 151 KB each
*and* below the 1,196 device pixels the largest render frame needs at 2×.

What matters is not the offset, it is that all nine are **identical and flat**, so the ground does
not move during a dissolve. They are.

### The new guard, and why it is not "k = 1"

A lossy VP8 encode always leaves the very first macroblock out — it is the one block in the frame
with no neighbour to predict from. On 影 KAGE that is **252 stray pixels** in a 200×200 corner, up
to 4 levels off, and nothing below q90 removes them (q90 costs 131 KB for SUI alone). At the
largest size the app ever draws a render, 598 CSS px, that block is under 5 px square in the
extreme corner. Demanding `k = 1` there is chasing the codec, not the defect — the first version
of this guard did exactly that and rejected seven of nine good files.

So the guard is, on each of the four 200×200 corners of the **encoded** file: modal colour exactly
`122,143,99`, purity ≥ 99%, no pixel more than 5 levels off. Purity is the discriminator and it
separates cleanly — the fixed set measures 99.37% at worst, the old set 69.85% at best. Both old
files were run back through the guard as a negative test and are rejected.

Also added: a per-file ceiling of 140 KB and a **1.2 MB ceiling on the set**, checked after `all`
and `reconvert`. `reconvert` still re-runs verification and post-processing over the PNGs already
in `.render-work/` without regenerating, and is byte-reproducible — two consecutive runs produce
identical checksums.

**A bash trap that cost an hour and looked exactly like a bad image.** `patch_stats` is called
through a process substitution, and a process substitution is a fresh subshell: the `set -e`
exemption that `if ! ground_is_flat …` grants does *not* reach inside it. Two things therefore
killed the subshell silently, with no message, leaving the caller reading an empty string and
reporting a perfectly good render as not flat —

- `[ "$v" -gt "$dev" ] && dev=$v` when the test is false;
- `read … < <(magick … -format '…' info:-)` — **`magick -format` writes no trailing newline**, so
  `read` hits EOF mid-line and returns non-zero.

Use `if`, and put `\n` at the end of every `-format` string you read from.

### Shipped, verified

`magick identify -format '%f %m %wx%h %[channels] %[opaque]'`, plus the 60×60 corner mean and its
distinct-colour count, plus the 200×200 corner purity the guard actually enforces:

| file | identify | corner mean | corner k | 200² purity | size |
| --- | --- | --- | --- | --- | --- |
| sui.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 3 | 99.50% | 78.4 KB |
| nagi.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 1 | 100.00% | 37.5 KB |
| kumo.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 3 | 99.50% | 62.0 KB |
| kage.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 4 | 99.37% | 59.3 KB |
| awa.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 3 | 99.50% | 31.3 KB |
| on.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 3 | 99.50% | 63.0 KB |
| to.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 3 | 99.50% | 44.8 KB |
| ichigo.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 1 | 100.00% | 48.8 KB |
| shin.webp | WEBP 2048x2048 srgb 3.0 True | 122,143,99 | 3 | 99.50% | 55.9 KB |

**492,506 bytes — 481 KB for the nine**, down from 529 KB, against a 1.2 MB budget. Every corner
mean is the same value on every file, which is the point.

Looked at as a 3×3 contact sheet: one family. Same line weight, same off-white contour, same
shallow ellipse, same subject share of frame, and a ground that runs seamlessly from tile to tile.
The flattening damaged nothing.

### The regeneration probe: keep the existing sources

`gpt-5.6-terra` was probed on 凪 NAGI through the same bundled binary
(`codex-cli 0.148.0-alpha.9`, `-m gpt-5.6-terra`). It is genuine `image_gen` output — 24,136
distinct colours — and it is **not** better:

| | existing source | `gpt-5.6-terra` |
| --- | --- | --- |
| Native size | 1254² | **1254²** — no gain; the size is fixed at the tool, not the model |
| Mean Sobel gradient | 2.29e-06 | **1.25e-06** — softer, not crisper |
| Subject height | 900/1254 = 72% | 1011/1254 = **81%** — outside the contract's "70%, no more" |
| Ice | Outline with a faint wash | Near-opaque milky blocks |

The last two are the exact drifts `docs/design/image-generation.md` exists to prevent, and the
clauses written to prevent them (`70% - no more`, `not as flat opaque blocks of colour`) did not
hold on that model. It is the same *kind* of art — raster line-art, same palette, no vector or
style swap — so there was nothing here needing a human's call on art direction. It is simply
worse, so all nine sources stay. The upscale from 1254 to 2048 remains soft, and no model fixes
that; only a larger native output from the tool would.

The probe is kept at `.render-work/_probe-terra/` (gitignored) as the evidence.

## Question

Generate the nine drink images with Codex CLI, following Part 2 of `DESIGN-TASTE.md`, and land them as optimised WebP in the app.

**The binary matters.** `codex` on PATH (0.141.0) *cannot* generate images and will silently draw them with Python PIL while reporting success. Use the bundled one:

```
/Applications/ChatGPT.app/Contents/Resources/codex exec \
  --skip-git-repo-check -s workspace-write -C /absolute/output/dir --json \
  "Use the built-in image_gen tool to generate ONE image: <PROMPT>. Copy the RAW generated PNG verbatim from \$CODEX_HOME/generated_images/ to ./out.png. Do NOT resize or convert. Do NOT draw it with PIL, matplotlib, SVG, or any code — it must come from the image_gen tool. If image_gen is unavailable, say exactly 'IMAGE_GEN_TOOL_UNAVAILABLE' and stop." \
  < /dev/null
```

`< /dev/null` is required or it blocks reading stdin. `--full-auto` does not exist in this version; `-s workspace-write` is correct and sufficient.

**Measured envelope:** ~70 s per image, one image per invocation (batching two into one session gave no speedup; parallel processes untested). Output is **1254×1254 PNG, fixed** — the tool exposes no size parameter and silently ignores a 2048² request. Only aspect ratio is steerable. Auth is the existing ChatGPT login in `~/.codex/auth.json`; the `image_generation` feature flag is already stable and on.

**Verify every single output** with `file` *and* a distinct-colour count. A PIL fake had 664 colours; genuine generations had 17k–27k. A fake can look plausible in flat line-art style — this check is the only reliable tell. Reference target: `.scratch/matcha-lab/assets/imgen-reference.png`.

**Post-process yourself** — tell Codex not to resize. Upscale 1254 → 2048 and convert with `cwebp` (a 1.25 MB PNG went to 52 KB at q82) or `magick`. Do **not** use `sips` for WebP; `-s format webp` silently produces no file.

Each drink gets its true vessel — chawan for 翠 SUI, tall glass for 透 TŌ, bowl-and-spoon for 雲 KUMO — with camera, lighting, line weight and palette locked. Regenerate any image that breaks family consistency; nine that nearly match is worse than eight that do.

Wire them to the drink records so the render frame resolves an image per drink.
