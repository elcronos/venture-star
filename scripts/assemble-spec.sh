#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
sections="$project_root/.omc/specs/sections"
target="$project_root/.omc/specs/game-venture-star-spec.md"
staging="$target.assembled"

{
  printf '%s\n\n' '# Game Spec: Venture Star'
  printf '%s\n\n' '> Composed from parallel authoring. This assembled document is the canonical product, mechanics, implementation, asset, and test specification.'
  sed '1,2d' "$sections/game-venture-star-context.md" | sed '/^## 12\. Cut List$/,$d'
  sed -n '/^## 3\. Core Loops$/,$p' "$sections/game-venture-star-loops.md"
  sed -n '/^## 4\. Mechanics Catalog$/,$p' "$sections/game-venture-star-mechanics.md"
  sed -n '/^## 5\. Progression$/,$p' "$sections/game-venture-star-progression-feel.md"
  sed -n '/^## 7\. Technology$/,$p' "$sections/game-venture-star-technology-assets.md"
  sed -n '/^## 9\. UX & Accessibility$/,$p' "$sections/game-venture-star-ux.md"
  sed -n '/^## 10\. Test Plan$/,$p' "$sections/game-venture-star-tests-stories.md"
  sed -n '/^## 12\. Cut List$/,$p' "$sections/game-venture-star-context.md"
  sed -n '/^## 13\. Risks$/,$p' "$sections/game-venture-star-risks-critique.md"
} | sed '/CUT:AUDIO:START/,/CUT:AUDIO:END/d' > "$staging"

mv "$staging" "$target"
printf 'Assembled %s\n' "$target"
