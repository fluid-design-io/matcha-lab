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
# src/, not public/ — Vite fingerprints imported assets, so the renders get immutable caching.
# A home-screen app relaunches from cache far more often than it downloads.
OUT="$ROOT/src/assets/renders"

# The bundled binary. `codex` on PATH (0.141.0) cannot generate images and silently fakes them
# with PIL while reporting success. This is not interchangeable.
CODEX="/Applications/ChatGPT.app/Contents/Resources/codex"

# Genuine image_gen output measures 15k-72k distinct colours. A measured PIL fake had 664.
MIN_COLOURS=2000

# The flat ground, and how far a corner may stray from it per channel. Observed spread across a
# good set is 3-10; 18 catches a drifting ground without failing honest variation.
GROUND_R=123; GROUND_G=143; GROUND_B=99
GROUND_TOLERANCE=18

# ---------------------------------------------------------------------------- the nine

# id|subject|liquid
DRINKS=(
  "sui|wide low straight-walled Japanese tea bowl (chawan) with no handle, holding thin whisked matcha with a fine even foam across the whole surface|opaque jade green"
  "nagi|tall straight-sided highball glass filled with clear liquid and large ice cubes, with a distinct layer of green matcha floating on top|near-clear with a green matcha float"
  "kumo|small footed dessert bowl with a spoon resting in it, holding two pale scoops of ice cream with hot green matcha poured over them and pooling underneath|pale cream scoops flooded with deep green matcha"
  "kage|tall straight-sided glass with ice, holding three distinct horizontal bands - roasted brown at the bottom, milky white in the middle, green on top|roasted brown, then milky white, then green"
  # "jade" alone came back teal-blue on the first pass — the word carries a blue reading the
  # model is happy to take. Naming the green and excluding blue is what fixed it.
  "awa|stemmed coupe glass holding warm green matcha liquid under a thick even foam collar that fills the top third|warm jade green, never blue or teal, under a pale foam collar"
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

STYLE. Fine-line illustration with soft translucent washes. One confident contour line of even weight, about 0.25% of the image width, in warm off-white #F3EBD1. The drawing is predominantly LINE: every shape is described by its contour, and fills are pale translucent washes that never approach the opacity or the presence of the line. Ice, foam and any solid contents are drawn in outline with only the faintest wash inside them - they must read as delicate line drawing, not as flat opaque blocks of colour. No hard highlights, no cross-hatching, no stippling, no halftone, no outline other than the contour, no sketchy or doubled lines.

BACKGROUND. Completely flat matte #7B8F63, edge to edge. No gradient, no vignette, no horizon, no table, no surface, no shadow, no reflection, no border, no frame.

CAMERA. Straight-on elevation, eye level about 10 degrees above the rim of the vessel - just enough that the opening reads as a shallow ellipse. No perspective tilt, no dutch angle, no top-down view, no three-quarter rotation. The vessel's vertical axis is exactly vertical in frame.

FRAMING. Square 1:1. The subject is centred on both axes and occupies 70% of the frame height - no more. Leave a clear empty margin of about 15% of the frame height above the vessel and 15% below it. Nothing is cropped by the frame.

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

  # The ground must be opaque. Asked for a flat background, the model sometimes delivers the
  # vessel on transparency instead — which survives the colour count, looks perfect on a green
  # page, and composites over whatever is behind it everywhere else.
  local min_alpha; min_alpha="$(magick "$dir/out.png" -alpha extract -format '%[fx:round(minima*255)]' info:-)"
  if [ "$min_alpha" -lt 250 ]; then
    printf '  \033[31m✗ transparent background (min alpha %s) — discarding\033[0m\n' "$min_alpha"
    return 1
  fi

  # ...and it must be the right green. A drifting ground is invisible one image at a time and
  # obvious the moment the nine sit together.
  local corner; corner="$(magick "$dir/out.png" -crop 60x60+0+0 +repage \
    -format '%[fx:round(mean.r*255)] %[fx:round(mean.g*255)] %[fx:round(mean.b*255)]' info:-)"
  read -r cr cg cb <<< "$corner"
  local dr=$(( cr > GROUND_R ? cr - GROUND_R : GROUND_R - cr ))
  local dg=$(( cg > GROUND_G ? cg - GROUND_G : GROUND_G - cg ))
  local db=$(( cb > GROUND_B ? cb - GROUND_B : GROUND_B - cb ))
  if [ "$dr" -gt "$GROUND_TOLERANCE" ] || [ "$dg" -gt "$GROUND_TOLERANCE" ] || [ "$db" -gt "$GROUND_TOLERANCE" ]; then
    printf '  \033[31m✗ ground is rgb(%s,%s,%s), off by (%s,%s,%s) — discarding\033[0m\n' \
      "$cr" "$cg" "$cb" "$dr" "$dg" "$db"
    return 1
  fi

  # Normalise the ground to exactly #7B8F63.
  #
  # The model lands within a few levels of the target, which is invisible on its own and glaring
  # in the app: the render sits full-bleed on the field, and a ground three levels off turns the
  # square into a visible patch. A per-channel offset is the gentlest correction that fixes it —
  # deltas are single digits, so nothing clips and the drawing is untouched.
  local nr=$(( GROUND_R - cr )) ng=$(( GROUND_G - cg )) nb=$(( GROUND_B - cb ))
  # -evaluate add takes quantum units, not 8-bit levels — on a Q16 build `add 6` shifts by
  # 6/65535 and does nothing at all. Percent of QuantumRange is the portable way to say "+6/255".
  local pr pg pb
  pr="$(awk -v v="$nr" 'BEGIN { printf "%.4f", v / 255 * 100 }')"
  pg="$(awk -v v="$ng" 'BEGIN { printf "%.4f", v / 255 * 100 }')"
  pb="$(awk -v v="$nb" 'BEGIN { printf "%.4f", v / 255 * 100 }')"
  printf '  ground rgb(%s,%s,%s) → normalised by (%+d,%+d,%+d)\n' "$cr" "$cg" "$cb" "$nr" "$ng" "$nb"

  mkdir -p "$OUT"
  magick "$dir/out.png" \
    -channel R -evaluate add "${pr}%" \
    -channel G -evaluate add "${pg}%" \
    -channel B -evaluate add "${pb}%" +channel \
    -filter Lanczos -resize 2048x2048 -strip "$dir/render-2048.png"
  cwebp -quiet -q 82 -m 6 "$dir/render-2048.png" -o "$OUT/$id.webp"

  printf '  \033[32m✓\033[0m %s  %s colours  →  src/assets/renders/%s.webp (%s)\n' \
    "$(magick identify -format '%wx%h' "$dir/out.png")" "$colours" "$id" \
    "$(du -h "$OUT/$id.webp" | cut -f1)"
}

# ----------------------------------------------------------------------------------- main

[ -x "$CODEX" ] || { echo "missing $CODEX — install the ChatGPT app" >&2; exit 1; }
command -v magick >/dev/null || { echo "missing imagemagick: brew install imagemagick" >&2; exit 1; }
command -v cwebp  >/dev/null || { echo "missing cwebp: brew install webp" >&2; exit 1; }

target="${1:-}"
[ -n "$target" ] || { echo "usage: $0 <drink-id|all|reconvert>" >&2; exit 1; }

failed=()
for row in "${DRINKS[@]}"; do
  IFS='|' read -r id subject liquid <<< "$row"

  # `reconvert` re-runs verification and post-processing over the PNGs already in .render-work,
  # for when the pipeline changes but the images are fine. Nothing is regenerated.
  if [ "$target" = "reconvert" ]; then
    printf '\n\033[1m→ %s\033[0m\n' "$id"
    verify_and_convert "$id" "$WORK/$id" || failed+=("$id")
    continue
  fi

  [ "$target" = "all" ] || [ "$target" = "$id" ] || continue
  generate_one "$id" "$subject" "$liquid" || failed+=("$id")
done

if [ ${#failed[@]} -gt 0 ]; then
  printf '\n\033[31mfailed: %s\033[0m — rerun those ids individually\n' "${failed[*]}"
  exit 1
fi
printf '\n\033[32mdone\033[0m\n'
