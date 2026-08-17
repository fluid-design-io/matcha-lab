# Nine generated drink renders

Type: task
Status: open
Blocked by: 01, 03

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
