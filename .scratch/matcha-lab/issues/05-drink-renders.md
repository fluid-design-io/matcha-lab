# Nine generated drink renders

Type: task
Status: resolved
Blocked by: 01, 03

## Answer

All nine generated, verified, normalised and wired. `src/assets/renders/*.webp`, **784 KB total**,
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

Both are now **automated checks in the script**, because finding them by eye was luck:

| Check | Threshold | Catches |
| --- | --- | --- |
| `file` | PNG, 1254² | Wrong output entirely |
| distinct colours | ≥ 2,000 | PIL fakes (a measured fake had 664; real ones run 15k–72k) |
| min alpha | = 255 | Transparent grounds |
| corner colour | within 18 of `123,143,99` | Drifting grounds |

**The change that made the renders actually work: ground normalisation.** Each drink sits
full-bleed on the field with no border, so its own ground has to *be* the field. The model lands
within a few levels — invisible in isolation, glaring in the app, where three levels off turns the
render into a visible square patch. A per-channel offset now maps every ground to exactly
`#7B8F63`; all nine land within one level, and the square disappears.

One trap worth recording: ImageMagick's `-evaluate add` takes **quantum units, not 8-bit levels**.
On a Q16 build `add 6` shifts by 6/65535 and does nothing — silently, with no error. The first
attempt at normalisation "succeeded" and changed nothing. Percent of QuantumRange is the portable
form.

The script gained a `reconvert` target for exactly this: re-run verification and post-processing
over the PNGs already in `.render-work/` when the pipeline changes but the images are fine.

The render frame preloads the two neighbours of the current selection, so a swipe or an arrow key
lands on a decoded image rather than on the empty frame.

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
