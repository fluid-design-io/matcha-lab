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
GROUND_HEX='#7B8F63'
GROUND_TOLERANCE=18

# The generator's ground is never actually flat — it carries a faint noise of its own, 30-odd
# distinct colours in a 60x60 corner, and the Lanczos upscale spreads that noise rather than
# removing it. Snapping every near-ground pixel to one exact value is what makes the render sit
# on the field instead of on top of it.
#
# 2% is the smallest fuzz that flattens all four corners on all nine. Measured: at 1% the
# top-left corner goes flat but the other three do not; at 2% every corner on every drink is
# k=1; at 4% and above the flatten starts eating the faintest washes. Cross-checked by counting
# the drawing's pixels before and after — at 2% nothing more than 10 levels off the ground moves
# at all, on any of the nine.
FLATTEN_FUZZ=2

# What the SHIPPED file must decode to — and it is NOT 123,143,99.
#
# Lossy WebP is VP8: RGB is converted to 8-bit YUV, and the decoded colour can only land on the
# lattice that integer YUV maps back to. rgb(123,143,99) is not on that lattice. For the (Y,V)
# pair that decodes red to 123, blue can only be 98 or 100 — B = Y' + 2.018*(U-128) steps by two
# levels per unit of U, so it skips 99. Measured, not assumed: a solid patch swept over the full
# 15x15x15 box of inputs around the target, at q75, q82, q90 and q100, produced 123,143,99 zero
# times out of 3,375 encodes per quality. Quality does not move the lattice; it is a property of
# 8-bit YUV.
#
# rgb(122,143,99) is the closest reachable point — one level low on red, nothing else, dE76 0.41,
# against a field that is itself drifting +/-3 levels under the shader. What actually shows is
# not this offset but *inconsistency*: nine grounds that differ from each other shift the colour
# mid-dissolve as two renders cross-fade. So every one of the nine is driven to exactly this
# value, flat, and the encoded output is checked rather than the intermediate.
SHIP_R=122; SHIP_G=143; SHIP_B=99

WEBP_QUALITY=82
# `-exact` is a no-op here: it only preserves RGB under transparent pixels, and these are opaque.
# Measured — with and without it, byte-identical output.
WEBP_ARGS=(-q "$WEBP_QUALITY" -m 6)

# How far the encoded-ground search may stray from SHIP_* looking for a pre-compensation that
# decodes on target. Radius 0 hits on all nine today; the ladder is there for a future set.
SEARCH_RADIUS=3

# The corner square sampled when judging the encoded ground, and what it has to look like.
#
# NOT "one distinct colour". A lossy VP8 encode always leaves the very first macroblock out,
# because it is the one block in the frame with no neighbour to predict from — measured on kage,
# 252 stray pixels in a 200x200 corner (the block at 0,0 and a sliver of its two neighbours),
# up to 4 levels off, and nothing below q90 removes them. At the largest the app ever draws a
# render, 598 CSS px, that block is under 5 px square in the extreme corner.
#
# What the old pipeline actually shipped, and what these numbers are set to catch, is mottle:
# kage's corners ran 28-49% pure over twelve values spanning 4 levels, in every 16x16 block
# across the whole ground. That is a textured square sitting on a smooth field. Purity is the
# discriminator — the new set measures 99.37% at worst, the old set 69.85% at best.
GROUND_PATCH=200
GROUND_PURITY_PCT=99
GROUND_MAX_DEVIATION=5

# The corner used for the pre-encode checks on the generated PNG, in pixels. Unchanged — the
# thresholds above it were calibrated against this window.
CORNER=60

# Nine renders on a home screen. Today's set lands near 500 KB; 140 KB each and 1.2 MB total is
# the ceiling, not the target.
MAX_FILE_BYTES=140000
MAX_TOTAL_BYTES=1258291

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

# ------------------------------------------------------------------- measuring the ground

# The modal colour of one GROUND_PATCH square, its share of that square, and the widest per-channel
# excursion anywhere inside it. Prints "r g b purity_pct deviation", purity to one decimal.
patch_stats() {
  local f="$1" crop="${GROUND_PATCH}x${GROUND_PATCH}+${2}+${3}"
  local count mr mg mb lo_r hi_r lo_g hi_g lo_b hi_b dev=0 v

  read -r count mr mg mb < <(magick "$f" -crop "$crop" +repage -format %c histogram:info:- \
    | sort -rn | awk 'NR == 1 { gsub(/[():,]/, " "); print $1, $2, $3, $4 }')

  # The trailing \n is load-bearing. `magick -format ... info:-` writes no newline of its own, so
  # `read` hits EOF mid-line and returns non-zero — which, inside this process substitution, is a
  # silent errexit death and an empty result upstream.
  read -r lo_r hi_r lo_g hi_g lo_b hi_b < <(magick "$f" -crop "$crop" +repage -format \
    '%[fx:round(minima.r*255)] %[fx:round(maxima.r*255)] %[fx:round(minima.g*255)] %[fx:round(maxima.g*255)] %[fx:round(minima.b*255)] %[fx:round(maxima.b*255)]\n' info:-)

  # `if`, not `[ ... ] && dev=$v`. This function is called through a process substitution, and a
  # process substitution is a fresh subshell: the errexit exemption that `if ! ground_is_flat`
  # grants does not reach inside it, so a false `&&` there kills the subshell silently and the
  # caller reads an empty string. It cost an hour, and it fails looking exactly like a bad image.
  for v in $(( lo_r - mr )) $(( hi_r - mr )) $(( lo_g - mg )) $(( hi_g - mg )) \
           $(( lo_b - mb )) $(( hi_b - mb )); do
    v=${v#-}
    if [ "$v" -gt "$dev" ]; then dev="$v"; fi
  done

  printf '%s %s %s %s %s\n' "$mr" "$mg" "$mb" \
    "$(awk -v c="$count" -v p="$GROUND_PATCH" 'BEGIN { printf "%.1f", c * 100 / (p * p) }')" "$dev"
}

# True when the ground of $1 is rgb($2,$3,$4) and effectively flat in all four corners. Silent —
# it runs inside the pre-compensation search, where a failure is just the next candidate.
#
# Four corners, not one. The defect this replaces was measured on the top-left corner alone, and
# the top-left corner is the one the old normalisation happened to fix.
ground_is_flat() {
  local f="$1" want_r="$2" want_g="$3" want_b="$4"
  local far; far=$(( $(magick identify -format '%w' "$f") - GROUND_PATCH ))
  local xy x y mr mg mb purity dev
  # Top-left first: it is the corner that fails, so the search rejects a candidate in one pass.
  for xy in "0 0" "$far 0" "0 $far" "$far $far"; do
    read -r x y <<< "$xy"
    read -r mr mg mb purity dev < <(patch_stats "$f" "$x" "$y")
    [ "$mr" = "$want_r" ] && [ "$mg" = "$want_g" ] && [ "$mb" = "$want_b" ] || return 1
    [ "$dev" -le "$GROUND_MAX_DEVIATION" ] || return 1
    awk -v p="$purity" -v m="$GROUND_PURITY_PCT" 'BEGIN { exit !(p >= m) }' || return 1
  done
}

# The same four corners, said out loud. For the failure path and the ticket's table.
ground_report() {
  local f="$1" indent="${2:-  }"
  local far; far=$(( $(magick identify -format '%w' "$f") - GROUND_PATCH ))
  local xy x y label
  for xy in "0 0 top-left" "$far 0 top-right" "0 $far bottom-left" "$far $far bottom-right"; do
    read -r x y label <<< "$xy"
    printf '%s%-13s rgb(%s,%s,%s) %s%% pure, max excursion %s\n' \
      "$indent" "$label" $(patch_stats "$f" "$x" "$y")
  done
}

# Fraction of the image that is exactly rgb($2,$3,$4). The corners prove the ground is flat where
# it is sampled; this proves the flat part is the whole ground and not four lucky squares.
ground_fraction() {
  magick "$1" -fuzz 0 -fill white -opaque "rgb($2,$3,$4)" \
    -fuzz 0 -fill black +opaque white -colorspace Gray -format '%[fx:mean]' info:-
}

# Encode $1 to $2 so that the DECODED ground is exactly SHIP_*, flat in all four corners.
#
# The ground of $1 is exactly GROUND_HEX, so it can be recoloured by an exact-match replace that
# leaves every drawn pixel alone. Candidates are walked outward from SHIP_* by L1 distance and
# the first that survives decoding wins — pre-compensation for the encoder's round trip, verified
# on the file that ships rather than on the PNG that goes into it.
encode_flat_ground() {
  local src="$1" out="$2"
  local cand="${src%.png}-candidate.png"
  local radius dr dg db fr fg fb tried=0

  for radius in $(seq 0 "$SEARCH_RADIUS"); do
    for dr in $(seq -"$SEARCH_RADIUS" "$SEARCH_RADIUS"); do
      for dg in $(seq -"$SEARCH_RADIUS" "$SEARCH_RADIUS"); do
        for db in $(seq -"$SEARCH_RADIUS" "$SEARCH_RADIUS"); do
          [ $(( ${dr#-} + ${dg#-} + ${db#-} )) -eq "$radius" ] || continue
          fr=$(( SHIP_R + dr )); fg=$(( SHIP_G + dg )); fb=$(( SHIP_B + db ))
          tried=$(( tried + 1 ))

          magick "$src" -fuzz 0 -fill "rgb($fr,$fg,$fb)" -opaque "$GROUND_HEX" "$cand"
          cwebp -quiet "${WEBP_ARGS[@]}" "$cand" -o "$out"

          if ground_is_flat "$out" "$SHIP_R" "$SHIP_G" "$SHIP_B"; then
            rm -f "$cand"
            printf '  encoded ground rgb(%s,%s,%s) → decodes rgb(%s,%s,%s) flat (%s candidate%s)\n' \
              "$fr" "$fg" "$fb" "$SHIP_R" "$SHIP_G" "$SHIP_B" "$tried" \
              "$([ "$tried" -eq 1 ] || echo s)"
            return 0
          fi
        done
      done
    done
  done

  rm -f "$cand"
  return 1
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
  local corner; corner="$(magick "$dir/out.png" -crop "${CORNER}x${CORNER}+0+0" +repage \
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

  # Offset, then flatten, then upscale — in that order.
  #
  # Flattening at native size and upscaling afterwards, rather than the reverse: Lanczos over a
  # region that is already one exact colour returns that same colour (the kernel sums to one), so
  # the flat ground survives the resize intact, while flattening after the resize would have to
  # snap the resampling's own ringing and would leave a step where the halo meets the ground.
  mkdir -p "$OUT"
  magick "$dir/out.png" \
    -channel R -evaluate add "${pr}%" \
    -channel G -evaluate add "${pg}%" \
    -channel B -evaluate add "${pb}%" +channel \
    -fuzz "${FLATTEN_FUZZ}%" -fill "$GROUND_HEX" -opaque "$GROUND_HEX" \
    -filter Lanczos -resize 2048x2048 -strip "$dir/render-2048.png"

  if ! ground_is_flat "$dir/render-2048.png" "$GROUND_R" "$GROUND_G" "$GROUND_B"; then
    printf '  \033[31m✗ master is not flat at rgb(%s,%s,%s) after a %s%% flatten\033[0m\n' \
      "$GROUND_R" "$GROUND_G" "$GROUND_B" "$FLATTEN_FUZZ"
    ground_report "$dir/render-2048.png" '    '
    return 1
  fi

  if ! encode_flat_ground "$dir/render-2048.png" "$OUT/$id.webp"; then
    printf '  \033[31m✗ no pre-compensation within %s levels decodes to a flat rgb(%s,%s,%s)\033[0m\n' \
      "$SEARCH_RADIUS" "$SHIP_R" "$SHIP_G" "$SHIP_B"
    ground_report "$OUT/$id.webp" '    '
    rm -f "$OUT/$id.webp"
    return 1
  fi

  # Guards on the file that actually ships. Verifying the intermediate is exactly how a ground
  # that was flat in the PNG and neither flat nor on-target in the WebP survived a whole ticket.
  local bytes; bytes="$(stat -f%z "$OUT/$id.webp")"
  if [ "$bytes" -gt "$MAX_FILE_BYTES" ]; then
    printf '  \033[31m✗ %s bytes, over the %s ceiling\033[0m\n' "$bytes" "$MAX_FILE_BYTES"
    return 1
  fi

  local fraction; fraction="$(ground_fraction "$OUT/$id.webp" "$SHIP_R" "$SHIP_G" "$SHIP_B")"
  if awk -v f="$fraction" 'BEGIN { exit !(f < 0.35) }'; then
    printf '  \033[31m✗ only %.1f%% of the shipped file is exactly the ground — it is not flat\033[0m\n' \
      "$(awk -v f="$fraction" 'BEGIN { print f * 100 }')"
    return 1
  fi

  printf '  \033[32m✓\033[0m %s  %s colours  →  src/assets/renders/%s.webp (%s KB, ground %.0f%%)\n' \
    "$(magick identify -format '%wx%h' "$dir/out.png")" "$colours" "$id" \
    "$(( (bytes + 512) / 1024 ))" "$(awk -v f="$fraction" 'BEGIN { print f * 100 }')"
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

# The set budget, checked whenever the whole set was touched. Per-file ceilings do not add up to
# a set ceiling on their own, and the set is what the device downloads.
if [ "$target" = "all" ] || [ "$target" = "reconvert" ]; then
  total=0
  for row in "${DRINKS[@]}"; do
    IFS='|' read -r id _ _ <<< "$row"
    total=$(( total + $(stat -f%z "$OUT/$id.webp") ))
  done
  printf '\nnine renders: %s bytes (%s KB) of %s\n' \
    "$total" "$(( (total + 512) / 1024 ))" "$MAX_TOTAL_BYTES"
  if [ "$total" -gt "$MAX_TOTAL_BYTES" ]; then
    printf '\033[31m✗ over the set budget\033[0m\n'
    exit 1
  fi
fi

printf '\n\033[32mdone\033[0m\n'
