#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
D2_DIR="$SCRIPT_DIR/../d2"
OUT_DIR="$SCRIPT_DIR/../src/assets/diagrams"

mkdir -p "$OUT_DIR"

for file in "$D2_DIR"/*.d2; do
  [ -f "$file" ] || continue
  name="$(basename "$file" .d2)"
  echo "Rendering $name.d2 → $name.svg"
  d2 --layout=dagre --theme=0 "$file" "$OUT_DIR/$name.svg"
done

echo "Done. SVGs written to $OUT_DIR"
