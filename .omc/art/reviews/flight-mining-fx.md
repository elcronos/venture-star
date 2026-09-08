# A11 Flight and Mining Effects — Visual Review

Status: **PASS** — 11/11 assets accepted at 90% or higher.

## Review method

- Source of truth: `style-guide.md` (Horizon Signal with Deep Survey radar grammar).
- Rendered engine and lock assets at 64 px; mining strip at 128×64 px; mining pulse at 128 px.
- Inspected together on `space-900` (`#091426`) and in grayscale for silhouette/state separation.
- Confirmed transparent compositing, palette-only colours, no filters/raster/text/scripts, and geometry inside the viewBox.
- Each asset passed on iteration 1; no corrective iteration was required.

## Scores

| Asset | Style | Colour | Craft | Readability | Overall | Transparency | Iteration |
|---|---:|---:|---:|---:|---:|---|---:|
| `engine-player-idle.svg` | 94 | 100 | 94 | 92 | 95.0 | PASS | 1 |
| `engine-player-thrust.svg` | 97 | 100 | 95 | 98 | 97.5 | PASS | 1 |
| `engine-player-brake.svg` | 96 | 100 | 94 | 97 | 96.8 | PASS | 1 |
| `engine-rival-idle.svg` | 95 | 100 | 94 | 93 | 95.5 | PASS | 1 |
| `engine-rival-thrust.svg` | 97 | 100 | 95 | 98 | 97.5 | PASS | 1 |
| `engine-rival-brake.svg` | 96 | 100 | 94 | 97 | 96.8 | PASS | 1 |
| `mining-strip.svg` | 96 | 100 | 96 | 98 | 97.5 | PASS | 1 |
| `mining-pulse.svg` | 97 | 100 | 96 | 97 | 97.5 | PASS | 1 |
| `range-lock-acquiring.svg` | 97 | 100 | 95 | 96 | 97.0 | PASS | 1 |
| `range-lock-locked.svg` | 98 | 100 | 96 | 98 | 98.0 | PASS | 1 |
| `range-lock-broken.svg` | 96 | 100 | 95 | 98 | 97.3 | PASS | 1 |

## Cohesion notes

- Player engine overlays use two separate ports and paired teal/cyan exhaust, matching the flagship's bilateral open-chevron language.
- Rival overlays use a single centered amber plume with a split-diamond construction, keeping faction identity readable without hue alone.
- Idle, thrust, and brake remain distinct by plume length and direction at 64 px. Brake jets reverse toward the bow while thrust extends aft.
- Mining is deliberately broad, rhythmic, and bidirectional: copper extraction chevrons sit between teal survey rails, with no muzzle, projectile, or impact-star silhouette.
- The mining pulse pulls three copper wedges toward an ore shard. It reads as extraction/progress rather than damage.
- Range-lock states use broken survey rings, bearing ticks, and corner station brackets. Acquiring is incomplete, locked resolves to a persistent four-point confirmation, and broken adds a coral cross plus fragmented neutral ring.

## Machine checks

- `xmllint --noout`: PASS for all 11 SVGs.
- Palette/viewBox/convention audit: PASS for all 11 SVGs.
- `git diff --check -- assets/svg/effects`: PASS.
