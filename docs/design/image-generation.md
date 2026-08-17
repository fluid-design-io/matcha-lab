# Part 2 — the image generation contract

Nine images must read as one family. This is the part that silently drifts, so everything that
could drift is written down: the literal prompt, the camera, the palette clamp, the vessel per
drink, the exact CLI invocation, the post-processing, and the check that catches a fake.

**The test this file has to pass:** a fresh agent, a month from now, with no memory of this
session, can produce image number ten and it matches. If you change anything here, you have
invalidated the nine — regenerate all of them or change nothing.

The verified target is `.scratch/matcha-lab/assets/imgen-reference.png` — a real `image_gen`
output, measured below. When this file and your judgement disagree, open that file and look at it.

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
even weight, about 0.25% of the image width, in warm off-white #F3EBD1. Interiors are filled
with flat translucent wash only. No hard highlights, no cross-hatching, no stippling, no
halftone, no outline other than the contour, no sketchy or doubled lines.

BACKGROUND. Completely flat matte #7B8F63, edge to edge. No gradient, no vignette, no horizon,
no table, no surface, no shadow, no reflection, no border, no frame.

CAMERA. Straight-on elevation, eye level about 10 degrees above the rim of the vessel — just
enough that the opening reads as a shallow ellipse. No perspective tilt, no dutch angle, no
top-down view, no three-quarter rotation. The vessel's vertical axis is exactly vertical in
frame.

FRAMING. Square 1:1. The subject is centred on both axes and occupies 70% of the frame height,
with even margin above and below. Nothing is cropped by the frame.

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
- **"70% of the frame height"** — the single biggest family-breaker. Without it, subject scale
  wanders between 45% and 90% and the nine will not sit in the same square frame.
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

## Verifying — the only reliable tell

A PIL fake looks *plausible* in flat line-art style. It will not look obviously wrong. Two checks,
both mandatory, on **every single output**:

```bash
file out.png                                   # must be: PNG image data, 1254 x 1254
magick out.png -format %k info:-               # distinct colours
```

| Distinct colours | Verdict |
| --- | --- |
| < 2,000 | **Code-drawn fake. Discard and regenerate.** The measured PIL fake had 664. |
| 17,000 – 27,000 | Genuine `image_gen` output. |

Then look at it against `imgen-reference.png`, side by side, at the same size. Check in this
order, because these are the four things that actually drift:

1. **Subject scale** — does it fill the same share of the frame?
2. **Ellipse depth** — is the rim opening the same shallowness?
3. **Line weight** — same visual weight, or has it gone thin and scratchy?
4. **Ground** — still flat, or has a gradient or a table edge crept in?

**Nine that nearly match is worse than eight that do.** Regenerate anything that breaks family.
There is no budget argument here — it is 70 seconds.

## Post-processing

Tell Codex **not** to resize. Do it yourself, so the pipeline is one command and reproducible.

```bash
# 1254 → 2048, then WebP
magick out.png -filter Lanczos -resize 2048x2048 -strip render-2048.png
cwebp -q 82 -m 6 render-2048.png -o ../public/renders/<id>.webp
```

- A 1.25 MB PNG lands at ~52 KB at `q82`. That is the measured number; hold the set near it.
- **Do not use `sips` for WebP.** `sips -s format webp` silently produces no file and exits 0.
- `-strip` before conversion — the generated PNGs carry metadata nobody needs.

Land them at `public/renders/<drink-id>.webp` and wire them to the drink records, so the render
frame resolves one image per drink by id.

## Deferred, in the same family

Not built yet, but when they are, they come out of this same contract — same ground, same line,
same camera — so they read as part of the set:

- **Home-screen icon and iOS splash.** Shape depends on what the nine actually look like at small
  sizes.
- **Reference 2's matcha base sheet** (`ref-2-base-sheet.png`) shows a *bowl + chasen* render that
  is not one of the nine. If that sheet ever ships, it needs a tenth image: `{{SUBJECT}}` =
  `wide low Japanese tea bowl (chawan) with a bamboo whisk (chasen) resting in it, holding
  whisked matcha`.
