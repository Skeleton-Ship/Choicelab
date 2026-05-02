#!/bin/bash
DIST="src/player/dist/choicelab.js"
if [ ! -f "$DIST" ] || find src/player -not -path "*/dist/*" -newer "$DIST" 2>/dev/null | grep -q .; then
  echo "[player] source changed, building..."
  bun run player:build
else
  echo "[player] up to date, skipping build"
fi
