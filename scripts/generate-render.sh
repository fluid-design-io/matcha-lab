#!/usr/bin/env bash
#
# Generate one drink render per the contract in docs/design/image-generation.md.
#
#   ./scripts/generate-render.sh sui            # one drink
#   ./scripts/generate-render.sh all            # all nine, sequentially (~11 min)
#
# The prompt skeleton, the vessel table and the verification thresholds all live here so that
# the pipeline is one command. If you change any of them, change docs/design/image-generation.md
# in the same commit — and regenerate all nine, because the family is only as consistent as its
# least consistent member.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$ROOT/.render-work"
OUT="$ROOT/public/renders"

# The bundled binary. `codex` on PATH (0.141.0) cannot generate images and silently fakes them
# with PIL while reporting success. This is not interchangeable.
CODEX="/Applications/ChatGPT.app/Contents/Resources/codex"

# Genuine image_gen output measures 17k-27k distinct colours. A measured PIL fake had 664.
MIN_COLOURS=2000

# ---------------------------------------------------------------------------- the nine

# id|subject|liquid
DRINKS=(
  "sui|wide low straight-walled Japanese tea bowl (chawan) with no handle, holding thin whisked matcha with a fine even foam across the whole surface|opaque jade green"
  "nagi|tall straight-sided highball glass filled with clear liquid and large ice cubes, with a distinct layer of green matcha floating on top|near-clear with a green matcha float"
  "kumo|small footed dessert bowl with a spoon resting in it, holding two pale scoops of ice cream with hot green matcha poured over them and pooling underneath|pale cream scoops flooded with deep green matcha"
  "kage|tall straight-sided glass with ice, holding three distinct horizontal bands - roasted brown at the bottom, milky white in the middle, green on top|roasted brown, then milky white, then green"
  "awa|stemmed coupe glass holding jade liquid under a thick even foam collar that fills the top third|jade green under a pale foam collar"
  "on|handled ceramic mug, no ice, holding pale green milk with a soft foam cap and a light dusting on the surface|pale sage green"
  "to|tall narrow highball glass with large ice cubes and fine rising bubbles in clear liquid, with a green matcha disc suspended in the upper third|clear with a suspended green disc"
  "ichigo|tall straight-sided glass with ice, holding three distinct horizontal bands - pink fruit at the bottom, milky white in the middle, green on top|pink, then milky white, then green"
  "shin|short wide tumbler with ice, holding a dark charcoal layer at the bottom fading upward into a soft grey-green|dark charcoal fading to grey-green"
)

# ---------------------------------------------------------------------- the prompt skeleton

build_prompt() {
  local subject="$1" liquid="$2"
  cat <<PROMPT
A single ${subject}, drawn as flat editorial line art.

STYLE. Fine-line illustration with soft translucent washes. One confident contour line of even weight, about 0.25% of the image width, in warm off-white #F3EBD1. Interiors are filled with flat translucent wash only. No hard highlights, no cross-hatching, no stippling, no halftone, no outline other than the contour, no sketchy or doubled lines.

BACKGROUND. Completely flat matte #7B8F63, edge to edge. No gradient, no vignette, no horizon, no table, no surface, no shadow, no reflection, no border, no frame.

CAMERA. Straight-on elevation, eye level about 10 degrees above the rim of the vessel - just enough that the opening reads as a shallow ellipse. No perspective tilt, no dutch angle, no top-down view, no three-quarter rotation. The vessel's vertical axis is exactly vertical in frame.

FRAMING. Square 1:1. The subject is centred on both axes and occupies 70% of the frame height, with even margin above and below. Nothing is cropped by the frame.

LIGHT. Soft and diffuse from the upper left at a shallow angle. No cast shadow on the background, no specular highlight, no rim light.

PALETTE. Exactly three colour families and nothing else: the flat #7B8F63 ground, the off-white #F3EBD1 line, and ${liquid} for the liquid and its wash. Muted and desaturated throughout.

EXCLUDE. No text, no lettering, no numbers, no logo, no signature, no watermark. No straw, no garnish, no coaster, no napkin, no hands, no second vessel, no background objects.
PROMPT
}

# ------------------------------------------------------------------------------- pipeline

generate_one() {
  local id="$1" subject="$2" liquid="$3"
  local dir="$WORK/$id"

  rm -rf "$dir" && mkdir -p "$dir"
  printf '\n\033[1m→ %s\033[0m\n' "$id"

  local prompt; prompt="$(build_prompt "$subject" "$liquid")"

  "$CODEX" exec \
    --skip-git-repo-check -s workspace-write -C "$dir" --json \
    "Use the built-in image_gen tool to generate ONE image: ${prompt}
Copy the RAW generated PNG verbatim from \$CODEX_HOME/generated_images/ to ./out.png. Do NOT resize or convert. Do NOT draw it with PIL, matplotlib, SVG, or any code - it must come from the image_gen tool. If image_gen is unavailable, say exactly 'IMAGE_GEN_TOOL_UNAVAILABLE' and stop." \
    < /dev/null > "$dir/codex.jsonl" 2>&1 || true

  if ! [ -f "$dir/out.png" ]; then
    printf '  \033[31m✗ no out.png\033[0m — see %s\n' "$dir/codex.jsonl"
    return 1
  fi

  verify_and_convert "$id" "$dir"
}

verify_and_convert() {
  local id="$1" dir="$2"

  local kind; kind="$(file -b "$dir/out.png")"
  case "$kind" in
    PNG*) ;;
    *) printf '  \033[31m✗ not a PNG:\033[0m %s\n' "$kind"; return 1 ;;
  esac

  local colours; colours="$(magick "$dir/out.png" -format %k info:-)"
  if [ "$colours" -lt "$MIN_COLOURS" ]; then
    printf '  \033[31m✗ %s distinct colours — code-drawn fake, discarding\033[0m\n' "$colours"
    return 1
  fi

  mkdir -p "$OUT"
  magick "$dir/out.png" -filter Lanczos -resize 2048x2048 -strip "$dir/render-2048.png"
  cwebp -quiet -q 82 -m 6 "$dir/render-2048.png" -o "$OUT/$id.webp"

  printf '  \033[32m✓\033[0m %s  %s colours  →  public/renders/%s.webp (%s)\n' \
    "$(magick identify -format '%wx%h' "$dir/out.png")" "$colours" "$id" \
    "$(du -h "$OUT/$id.webp" | cut -f1)"
}

# ----------------------------------------------------------------------------------- main

[ -x "$CODEX" ] || { echo "missing $CODEX — install the ChatGPT app" >&2; exit 1; }
command -v magick >/dev/null || { echo "missing imagemagick: brew install imagemagick" >&2; exit 1; }
command -v cwebp  >/dev/null || { echo "missing cwebp: brew install webp" >&2; exit 1; }

target="${1:-}"
[ -n "$target" ] || { echo "usage: $0 <drink-id|all>" >&2; exit 1; }

failed=()
for row in "${DRINKS[@]}"; do
  IFS='|' read -r id subject liquid <<< "$row"
  [ "$target" = "all" ] || [ "$target" = "$id" ] || continue
  generate_one "$id" "$subject" "$liquid" || failed+=("$id")
done

if [ ${#failed[@]} -gt 0 ]; then
  printf '\n\033[31mfailed: %s\033[0m — rerun those ids individually\n' "${failed[*]}"
  exit 1
fi
printf '\n\033[32mdone\033[0m\n'
