#!/usr/bin/env bash
#
# Subset the two typefaces into src/assets/fonts/.
#
#   ./scripts/build-fonts.sh
#
# A home-screen app must launch from a cold cache with no network, so both faces are self-hosted
# rather than fetched from Google Fonts. Full Noto Sans JP is 9.6 MB; this app sets about thirty
# distinct Japanese glyphs. Subsetting is the difference between a 9.6 MB launch and a 28 KB one.
#
# src/, not public/, so Vite fingerprints them and they cache immutably.
#
# The generated .woff2 files are committed. Re-run this and commit the result whenever a new glyph
# enters the app — see JP_TEXT below. A missing glyph falls back to the system CJK face and is
# immediately, obviously wrong: different skeleton, different weight, different width.
#
# Requires fonttools and brotli. They are build-time only and deliberately not project deps:
#
#   python3 -m venv .fontenv && ./.fontenv/bin/pip install fonttools brotli
#   FONTTOOLS_PY=./.fontenv/bin/python3 ./scripts/build-fonts.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/src/assets/fonts"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PY="${FONTTOOLS_PY:-python3}"

# Upstream variable sources, straight from google/fonts. The @fontsource-variable packages in
# devDependencies pin the same versions but ship pre-split into 124 unicode-range chunks, which
# is the opposite of what subsetting needs.
ARCHIVO_URL='https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf'
NOTO_JP_URL='https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf'

# ------------------------------------------------------------------------------ glyph sets

# Latin. Basic ASCII, plus exactly the non-ASCII the app sets:
#   Ō ō  romaji for 透 TŌ
#   – —  en dash in ranges (30–35 ml), em dash in the gloss row
#   ·    the middle dot separating ingredients
#   →    RECIPE → — the arrow is typographic, not an icon, so the face has to carry it
#   °    75–80 °C
#   é    purée
LATIN_TEXT=' !"#$%&'"'"'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~ŌōéÉ–—·→°'

# Japanese. Enumerated glyph by glyph, not by unicode range.
#
# Measured: this exact set is 14 KB. Adding all hiragana and katakana wholesale — so that future
# copy would never need a font rebuild — takes it to 96 KB. Variable CJK carries heavy per-glyph
# `gvar` data, so 200 unused kana cost 6.8x the whole rest of the file. Not worth it on a cold
# launch; rebuilding is one command.
#
#   抹茶            masthead and the shared base
#   翠凪雲影泡温透苺深  the nine
#   椰乳力涼濃        the tasting axes
#   味材料手順作方     section heads: 味 / 材料 BUILD / 手順 METHOD / 作り方 RECIPE
#   り              the only kana the app sets, in 作り方
#   度湯基本・ー      small reserve: temperature copy, and the two punctuation marks any future
#                   Japanese line is most likely to need
JP_TEXT='抹茶翠凪雲影泡温透苺深椰乳力涼濃味材料手順作方り度湯基本・ー'

# ------------------------------------------------------------------------------- subsetting

"$PY" -c 'import fontTools, brotli' 2>/dev/null || {
  echo "fonttools and brotli are required — see the header of this script" >&2
  exit 1
}
command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }

mkdir -p "$OUT"

echo "→ fetching sources"
curl -sSL --fail --max-time 180 -o "$WORK/Archivo.ttf" "$ARCHIVO_URL"
curl -sSL --fail --max-time 180 -o "$WORK/NotoSansJP.ttf" "$NOTO_JP_URL"

echo "→ Archivo"
# Pin the width axis to 100 and keep only wght. The design never varies width, and dropping the
# axis takes a meaningful bite out of the file for nothing given up.
"$PY" -m fontTools.varLib.instancer "$WORK/Archivo.ttf" wdth=100 \
  -o "$WORK/archivo-wght.ttf" >/dev/null
"$PY" -m fontTools.subset "$WORK/archivo-wght.ttf" \
  --text="$LATIN_TEXT" \
  --layout-features='kern,liga,calt,tnum,ccmp,locl,mark,mkmk' \
  --flavor=woff2 --output-file="$OUT/archivo-subset.woff2"

echo "→ Noto Sans JP"
# vert/vrt2 are kept because the rail sets romaji and kanji in writing-mode: vertical-rl.
"$PY" -m fontTools.subset "$WORK/NotoSansJP.ttf" \
  --text="$JP_TEXT" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk,vert,vrt2' \
  --flavor=woff2 --output-file="$OUT/noto-sans-jp-subset.woff2"

echo
ls -la "$OUT"
