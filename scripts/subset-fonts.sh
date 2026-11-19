#!/usr/bin/env bash
# Rebuilds tight font subsets into public/fonts (output is committed).
# Requires: npm install, then `pip install fonttools brotli`.
#   Body + display: Basic Latin, Latin-1, smart quotes, dashes, ellipsis, bullet, euro, TM.
#   Caveat Brush (sticker captions only): ASCII + smart quotes/dash/ellipsis.
set -euo pipefail
node scripts/copy-fonts.mjs
FULL="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2032-2033,U+20AC,U+2122"
HAND="U+0020-007E,U+2014,U+2018-201D,U+2026"
sub() { pyftsubset "$1" --unicodes="$2" --flavor=woff2 --layout-features="$3" --no-hinting --desubroutinize --output-file="$1.tmp" 2>/dev/null && mv "$1.tmp" "$1"; }
sub public/fonts/alfa-slab-one-latin.woff2 "$FULL" 'kern,liga'
sub public/fonts/figtree-latin-var.woff2 "$FULL" 'kern,liga,calt'
sub public/fonts/figtree-latin-var-italic.woff2 "$FULL" 'kern,liga,calt'
sub public/fonts/caveat-brush-latin.woff2 "$HAND" ''
ls -la public/fonts
