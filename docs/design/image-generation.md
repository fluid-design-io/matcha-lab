# Part 2 — the image generation contract

Nine images must read as one family. This is the part that silently drifts, so everything that
could drift is written down: the literal prompt, the camera, the palette clamp, the vessel per
drink, the exact CLI invocation, the post-processing, and the check that catches a fake.

**The test this file has to pass:** a fresh agent, a month from now, with no memory of this
session, can produce image number ten and it matches. If you change anything here, you have
invalidated the nine — regenerate all of them or change nothing.

The verified target is a real `image_gen` output, measured below. The image itself is a local
working note and is not in this repo, so the measured table is the contract — when it and your
judgement disagree, the table wins.

---

## What the reference actually is

| Property | Measured |
| --- | --- |
| Ground | Flat `#7D8D65`, matte, edge to edge. No horizon, no surface, no vignette. |
| Line | Warm off-white `#F3EBD1`, one even weight, ~2–3px at 1024² (**0.25% of frame width**) |
| Liquid | `#8A976A` translucent wash, soft internal shading, no hard highlight |
| Shade | `#6B7E4F` at the deepest, used sparingly inside the vessel only |
| Subject bbox | `314 × 718` in `1024²` → **70% of frame height**, centred on both axes |
| Camera | Straight-on elevation, ~10° above the rim — the opening reads as a shallow ellipse |
| Shadow | None. No cast shadow, no contact shadow, no reflection |
| Distinct colours | **21,629** |

---

## The prompt skeleton

One variable slot, marked `{{SUBJECT}}`. Everything else is verbatim, every time. Do not
paraphrase, reorder, or "improve" it — the fixed wording is what holds the nine together.

```text
A single {{SUBJECT}}, drawn as flat editorial line art.

STYLE. Fine-line illustration with soft translucent washes. One confident contour line of
even weight, about 0.25% of the image width, in warm off-white #F3EBD1. The drawing is
predominantly LINE: every shape is described by its contour, and fills are pale translucent
washes that never approach the opacity or the presence of the line. Ice, foam and any solid
contents are drawn in outline with only the faintest wash inside them - they must read as
delicate line drawing, not as flat opaque blocks of colour. No hard highlights, no
cross-hatching, no stippling, no halftone, no outline other than the contour, no sketchy or
doubled lines.

BACKGROUND. Completely flat matte #7B8F63, edge to edge. No gradient, no vignette, no horizon,
no table, no surface, no shadow, no reflection, no border, no frame.

CAMERA. Straight-on elevation, eye level about 10 degrees above the rim of the vessel — just
enough that the opening reads as a shallow ellipse. No perspective tilt, no dutch angle, no
top-down view, no three-quarter rotation. The vessel's vertical axis is exactly vertical in
frame.

FRAMING. Square 1:1. The subject is centred on both axes and occupies 70% of the frame height
- no more. Leave a clear empty margin of about 15% of the frame height above the vessel and
15% below it. Nothing is cropped by the frame.

LIGHT. Soft and diffuse from the upper left at a shallow angle. No cast shadow on the
background, no specular highlight, no rim light.

PALETTE. Exactly three colour families and nothing else: the flat #7B8F63 ground, the off-white
#F3EBD1 line, and {{LIQUID}} for the liquid and its wash. Muted and desaturated throughout.

EXCLUDE. No text, no lettering, no numbers, no logo, no signature, no watermark. No straw, no
garnish, no coaster, no napkin, no hands, no second vessel, no background objects.
```

`{{SUBJECT}}` and `{{LIQUID}}` come from the table below and nowhere else.

### Why each clause is load-bearing

- **"about 0.25% of the image width"** — a relative line weight. Absolute pixel values get
  ignored; a percentage survives the model's fixed 1254² output.
- **"predominantly LINE … not flat opaque blocks of colour"** — added after the first live test.
  Without it the model fills ice and foam as solid gouache shapes, which reads as a different
  illustrator from the reference even though everything else matches.
- **"70% of the frame height — no more"**, with the 15%-margin restatement — the single biggest
  family-breaker. The first test, which only said "70%", came back at 79%. Naming the empty
  margin as well as the subject brought it to 72%.
- **"about 10 degrees above the rim"** — the model reads "straight on" as 0° and "three-quarter"
  as 35°. Naming the number is what keeps the ellipses consistent.
- **"No straw"** — the strawberry latte is normally served with one, and the model will add it.
  A straw on one of nine breaks the family. The vessel rule is about vessels; a straw is not one.
- **"EXCLUDE ... no text"** — the model will letter a café glass if given the chance.

## The nine

Each drink gets its **true vessel**. That is the only thing the render says which the type does
not, so it is the one variable worth having. Everything else is clamped.

| # | Drink | `{{SUBJECT}}` | `{{LIQUID}}` |
| --- | --- | --- | --- |
| 01 翠 SUI | Usucha | wide low straight-walled Japanese tea bowl (chawan) with no handle, holding thin whisked matcha with a fine even foam across the whole surface | opaque jade `#6E8A4E` |
| 02 凪 NAGI | Iced Matcha Coconut Water | tall straight-sided highball glass filled with clear liquid and large ice cubes, with a distinct layer of green matcha floating on top | near-clear with a green float `#8A976A` |
| 03 雲 KUMO | Matcha Affogato | small footed dessert bowl with a spoon resting in it, holding two pale scoops of ice cream with hot green matcha poured over them and pooling underneath | white scoops flooded with `#6E8A4E` |
| 04 影 KAGE | Hojicha–Matcha Layered | tall straight-sided glass with ice, holding three distinct horizontal bands — roasted brown at the bottom, milky white in the middle, green on top | brown `#8A6F4E` → white → green `#8A976A` |
| 05 泡 AWA | Matcha Shakerato | stemmed coupe glass holding jade liquid under a thick even foam collar that fills the top third | jade `#7E9459` under pale foam |
| 06 温 ON | Matcha Latte, hot | handled ceramic mug, no ice, holding pale green milk with a soft foam cap and a light dusting on the surface | pale sage `#A3B183` |
| 07 透 TŌ | Matcha Tonic | tall narrow highball glass with large ice cubes and fine rising bubbles in clear liquid, with a green matcha disc suspended in the upper third | clear with a suspended disc `#8A976A` |
| 08 苺 ICHIGO | Ichigo Matcha Latte | tall straight-sided glass with ice, holding three distinct horizontal bands — pink fruit at the bottom, milky white in the middle, green on top | pink `#C99AA0` → white → green `#8A976A` |
| 09 深 SHIN | Black Sesame Matcha Latte | short wide tumbler with ice, holding a dark charcoal layer at the bottom fading upward into a soft grey-green | charcoal `#4A4740` → grey-green `#93A183` |

`{{LIQUID}}` names a colour *family*, not a hex the model must hit. The clamp that matters is
"three families and nothing else" — the ground and the line are the two that are truly fixed.

---

## Generating

### The binary matters

`codex` on `PATH` (0.141.0) **cannot generate images**. It silently draws them with Python PIL
and reports success. Use the one bundled with the ChatGPT app:

```bash
/Applications/ChatGPT.app/Contents/Resources/codex exec \
  --skip-git-repo-check -s workspace-write -C /absolute/output/dir --json \
  "Use the built-in image_gen tool to generate ONE image: <PROMPT>. Copy the RAW generated PNG verbatim from \$CODEX_HOME/generated_images/ to ./out.png. Do NOT resize or convert. Do NOT draw it with PIL, matplotlib, SVG, or any code — it must come from the image_gen tool. If image_gen is unavailable, say exactly 'IMAGE_GEN_TOOL_UNAVAILABLE' and stop." \
  < /dev/null
```

- `< /dev/null` is **required** — without it the process blocks reading stdin.
- `--full-auto` does not exist in this version. `-s workspace-write` is correct and sufficient.
- Auth is the existing ChatGPT login in `~/.codex/auth.json`. The `image_generation` feature flag
  is stable and on.

`scripts/generate-render.sh` wraps this. Use the script; it applies the skeleton, runs the
verification, and refuses to keep an output that fails.

### Measured envelope

| | |
| --- | --- |
| Time | ~70 s per image |
| Batching | One image per invocation. Two in one session gave no speedup. |
| Output size | **1254×1254 PNG, fixed.** The tool exposes no size parameter and silently ignores a 2048² request. Only aspect ratio is steerable. |
| Retries | Regenerating is cheap. Regenerate rather than accept a near-miss. |

### A newer model does not buy a better source

`-m gpt-5.6-terra` was probed on 凪 NAGI against the same prompt, in the same binary
(`codex-cli 0.148.0-alpha.9`). It is genuine `image_gen` output — 24,136 distinct colours — and
it is **not** an argument for regenerating the nine:

| | Existing source | `gpt-5.6-terra` |
| --- | --- | --- |
| Native size | 1254² | **1254²** — no gain; the size is fixed at the tool, not the model |
| Mean Sobel gradient | 2.29e-06 | **1.25e-06** — softer, not crisper |
| Subject height | 900 / 1254 = **72%** | 1011 / 1254 = **81%** — outside the contract's "70%, no more" |
| Ice | Outline with a faint wash | Near-opaque milky blocks |

The last two are the exact drifts this file exists to prevent, and the prompt clauses written to
prevent them (`70% - no more`, `not as flat opaque blocks of colour`) did not hold on that model.
The upscale from 1254 to 2048 is soft, and a newer model does not fix it — nothing here changes
until the tool exposes a larger native size.

## Verifying

Five checks, all mandatory. Four on the generated PNG and — this is the one that was missing —
**one on the file that actually ships**. `scripts/generate-render.sh` runs them all and refuses to
keep anything that fails. Each one exists because it caught a real defect.

### 1. It is a PNG at the expected size

```bash
file out.png                                   # must be: PNG image data, 1254 x 1254
```

### 2. Distinct colour count — the fake detector

A PIL fake looks *plausible* in flat line-art style. It will not look obviously wrong.

```bash
magick out.png -format %k info:-
```

| Distinct colours | Verdict |
| --- | --- |
| < 2,000 | **Code-drawn fake. Discard and regenerate.** The measured PIL fake had 664. |
| 15,000 – 72,000 | Genuine `image_gen` output. |

### 3. The ground is opaque

```bash
magick out.png -alpha extract -format '%[fx:round(minima*255)]' info:-   # must be 255
```

Asked for a flat background, the model sometimes delivers **the vessel on transparency instead**.
This survives the colour count, looks perfect on a green page, and composites over whatever is
behind it everywhere else. 透 TŌ came back this way on the first pass.

### 4. The ground is the right green

```bash
magick out.png -crop 60x60+0+0 +repage \
  -format '%[fx:round(mean.r*255)] %[fx:round(mean.g*255)] %[fx:round(mean.b*255)]' info:-
```

Each channel must be within **18** of `123, 143, 99`. Observed spread across a good set is 3–10,
so 18 catches a drifting ground without failing honest variation.

Then look at it against `imgen-reference.png`, side by side, at the same size. Check in this
order, because these are the four things that actually drift:

1. **Subject scale** — does it fill the same share of the frame?
2. **Ellipse depth** — is the rim opening the same shallowness?
3. **Line weight** — same visual weight, or has it gone thin and scratchy?
4. **Ground** — still flat, or has a gradient or a table edge crept in?

**Nine that nearly match is worse than eight that do.** Regenerate anything that breaks family.
There is no budget argument here — it is 70 seconds.

### 5. The *shipped* WebP has a flat ground — check the output, not the input

The four checks above all pass on a PNG whose ground the encoder is about to ruin, which is how
ticket 05 shipped nine defective files under a green tick: every check it ran sat upstream of
`cwebp`. Measure what decodes. Post-processing, below, is what produces this.

In each of the four 200×200 corners of the shipped file: the modal colour must be exactly
`122,143,99`, it must own **≥ 99%** of the square, and nothing in the square may stray more than
**5 levels** on any channel.

```bash
magick <id>.webp -crop 200x200+0+0 +repage -format %c histogram:info:- | sort -rn | head -1
```

Not "one distinct colour". A lossy VP8 encode always leaves the very first macroblock out — it is
the one block in the frame with no neighbour to predict from. Measured on 影 KAGE: 252 stray
pixels in a 200×200 corner, up to 4 levels off, and nothing below q90 removes them. At the largest
size the app ever draws a render, 598 CSS px, that block is under 5 px square in the extreme
corner.

Purity is the discriminator, and it separates cleanly: the fixed set measures 99.37% at worst, the
broken set 69.85% at best.

## Post-processing

Tell Codex **not** to resize. Do it yourself, so the pipeline is one command and reproducible.

Each drink sits full-bleed on the field with no border, so its own ground has to *be* the field.
Everything below is in service of one sentence: **the ground of the file that ships must be one
exact colour, and the same exact colour on all nine.** Four steps, in this order.

### 1. Offset the ground to `#7B8F63`

The model lands within a few levels of the target. A per-channel offset is the gentlest correction,
and at single-digit deltas nothing clips.

```bash
magick out.png \
  -channel R -evaluate add "${dr}%" -channel G -evaluate add "${dg}%" \
  -channel B -evaluate add "${db}%" +channel  ...
```

`-evaluate add` takes **quantum units, not 8-bit levels** — on a Q16 build `add 6` shifts by
6/65535 and does nothing at all, silently. Percent of QuantumRange is the portable way to say
"+6/255": `dr = (123 - corner.r) / 255 * 100`.

### 2. Flatten it — the offset alone is not enough

The offset moves the ground's *mean*. The ground is not flat to begin with: the generator leaves
about 33 distinct colours in a 60×60 corner, and the Lanczos upscale spreads that noise rather
than removing it. Snap it:

```bash
  ... -fuzz 2% -fill '#7B8F63' -opaque '#7B8F63' ...
```

**2% is the smallest fuzz that works and it was chosen by measurement.** At 1% the top-left corner
goes flat and the other three do not, on every one of the nine. At 2% all four corners on all nine
are a single colour. At 4% and above the flatten starts eating the faintest washes. Verified by
counting the drawing before and after: at 2%, nothing more than 10 levels off the ground moves at
all, and what does move is 0.05–0.9% of the near-ground pixels — the outermost fringe of the
faintest wash.

### 3. Upscale — flatten *before* the resize, never after

Lanczos over a region that is already one exact colour returns that same colour, so a flat ground
survives the resize intact. Flattening afterwards would have to snap the resampling's own ringing
around the line, and would leave a step where the halo meets the ground.

```bash
  ... -filter Lanczos -resize 2048x2048 -strip render-2048.png
```

### 4. Encode, then measure the *decoded* file and pre-compensate

This is the step that was missing, and it is the one that matters. `cwebp -q 82` is lossy: it
throws away the flat ground the first three steps built. The nine that shipped before this was
fixed decoded to five different ground colours, none of them flat — corners 28–70% pure, mottled
by ±2 levels in every 16×16 block.

**The shipped ground is `rgb(122,143,99)`, not `rgb(123,143,99)`, and that is not a compromise —
it is the nearest colour that exists.** Lossy WebP is VP8: RGB goes through 8-bit YUV, so the
decoded colour can only land on the lattice that integer YUV maps back to, and `123,143,99` is not
on it. For the (Y,V) pair that decodes red to 123, blue can only be 98 or 100 — `B = Y' +
2.018·(U−128)` steps two levels per unit of U and skips 99. Measured, not assumed: a solid patch
swept over the full 15×15×15 box of inputs around the target produced `123,143,99` **zero times
out of 3,375 encodes**, at q75, q82, q90 and q100 alike. Quality does not move the lattice.

So the script walks candidate ground colours outward from `122,143,99`, re-encodes, and keeps the
first whose *decoded* ground is exactly `122,143,99` and flat in all four corners. All nine hit on
the first candidate. One level low on red is ΔE76 0.41, on a field the shader is already drifting
±3 levels — and what actually shows is not the offset but *inconsistency*, nine grounds that
differ from each other and shift the colour mid-dissolve as two renders cross-fade.

- The nine total **481 KB** at `q82 -m 6`, 31–78 KB each. Hold the set near that.
- Exactness is available only at lossless prices: `-near_lossless 0 -q 100` decodes to
  `123,143,99` exactly — at **544 KB per image**, 4.9 MB for the set. Not for a home-screen app.
- `-exact` is a **no-op** here. It preserves RGB under transparent pixels only; these are opaque,
  and output is byte-identical with and without it.
- `-sharp_yuv` is *worse* for this: it lands the ground on `123,144,100`, two channels off.
- **Do not use `sips` for WebP.** `sips -s format webp` silently produces no file and exits 0.
- `-strip` before conversion — the generated PNGs carry metadata nobody needs.

Land them at **`src/assets/renders/<drink-id>.webp`**, not `public/` — Vite fingerprints imported
assets, so they get immutable caching, and a home-screen app relaunches from cache far more often
than it downloads. `src/domain/drinks/drinks.renders.ts` maps id → imported URL, which is how the
render frame resolves one image per drink.

## Deferred, in the same family

Not built yet, but when they are, they come out of this same contract — same ground, same line,
same camera — so they read as part of the set:

- **Home-screen icon and iOS splash.** Shape depends on what the nine actually look like at small
  sizes.
- **Reference 2's matcha base sheet** (`ref-2-base-sheet.png`) shows a *bowl + chasen* render that
  is not one of the nine. If that sheet ever ships, it needs a tenth image: `{{SUBJECT}}` =
  `wide low Japanese tea bowl (chawan) with a bamboo whisk (chasen) resting in it, holding
  whisked matcha`.
