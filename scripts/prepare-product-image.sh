#!/usr/bin/env bash
# Turns a product photo into the BunDeals image treatment (dev-time only, needs ImageMagick):
# background → #FFF1EC (flood-filled from the corners), product trimmed, centred with a margin
# on a square canvas, then two WebP files: public/products/<id>.webp (800px) and <id>-thumb.webp (160px).
# Usage: scripts/prepare-product-image.sh <photo.(jpg|png|webp|avif)> <product-id> [background fuzz %, default 10 | keep]
# "keep": for photos with a scene background (not a plain one): centre-cropped to a square, background kept.
# The product is scaled to fit 680px (cards show it at ~190–300px, so small sources are fine).
set -euo pipefail
src="$1"; id="$2"; fuzz="${3:-10}"
[[ "$id" =~ ^[a-z0-9-]+$ ]] || { echo "product id must be lowercase letters, digits and dashes" >&2; exit 1; }
out="$(dirname "$0")/../public/products"
bg="#FFF1EC"
tmp="$(mktemp --suffix=.png)"; trap 'rm -f "$tmp"' EXIT

if [[ "$fuzz" == "keep" ]]; then
  side=$(identify -format '%[fx:min(w,h)]' "$src")
  convert "$src" -alpha off -gravity center -crop "${side}x${side}+0+0" +repage -resize 800x800 "$tmp"
else
w=$(identify -format %w "$src"); h=$(identify -format %h "$src")
convert "$src" -alpha off -fuzz "${fuzz}%" -fill "$bg" \
  -draw "color 0,0 floodfill" -draw "color $((w-1)),0 floodfill" \
  -draw "color 0,$((h-1)) floodfill" -draw "color $((w-1)),$((h-1)) floodfill" \
  -bordercolor "$bg" -border 1 -fuzz 3% -trim +repage \
  -resize 680x680 -background "$bg" -gravity center -extent 800x800 "$tmp"
fi
convert "$tmp" -strip -define webp:use-sharp-yuv=1 -quality 82 "$out/$id.webp"
convert "$tmp" -strip -define webp:use-sharp-yuv=1 -resize 160x160 -quality 80 "$out/$id-thumb.webp"
echo "$out/$id.webp ($(du -h "$out/$id.webp" | cut -f1)), $out/$id-thumb.webp"
