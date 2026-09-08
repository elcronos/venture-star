# Combat and Explosion Asset Review

Scope: A13 combat effects and A14 explosion frames. Review date: 2026-09-07.

## Production notes

- All 23 sprites use transparent backgrounds, exact Horizon Signal palette tokens, centered transform-safe geometry, and pure editable SVG.
- Pulse effects use Survey Teal, Lock Light, Mist Blue, Starlight, and Deep Space. Bombs and explosions use Solar Amber and Beacon Coral with Starlight cores and Deep Space structure.
- Small explosions use `viewBox="0 0 64 64"`; large explosions use `viewBox="0 0 256 256"`. Pulse and bomb assets use the manifest's 32–64 unit range.
- Animation progression is ignition → flare → burst → maximum → expansion → dissipation → embers → afterglow. Each sequence retains a centered energy event while moving mass outward, so atlas swaps do not visually jump.
- Iteration 1 passed. No corrective redraw was required after game-size contact-sheet inspection.

## Rubric scores

Transparency passed for every asset. Overall is the mean of Style, Color, Craft, and Readability.

| Asset | Style | Color | Craft | Readability | Overall | Verdict |
|---|---:|---:|---:|---:|---:|---|
| `pulse-projectile.svg` | 96 | 100 | 95 | 96 | 96.8 | ACCEPT |
| `pulse-muzzle.svg` | 96 | 100 | 94 | 95 | 96.3 | ACCEPT |
| `pulse-impact.svg` | 96 | 100 | 94 | 95 | 96.3 | ACCEPT |
| `bomb-projectile.svg` | 96 | 100 | 95 | 96 | 96.8 | ACCEPT |
| `bomb-armed.svg` | 96 | 100 | 94 | 95 | 96.3 | ACCEPT |
| `bomb-shield-impact.svg` | 96 | 100 | 94 | 94 | 96.0 | ACCEPT |
| `bomb-defence-impact.svg` | 95 | 100 | 94 | 95 | 96.0 | ACCEPT |
| `explosion-small-01.svg` | 94 | 100 | 94 | 91 | 94.8 | ACCEPT |
| `explosion-small-02.svg` | 95 | 100 | 94 | 94 | 95.8 | ACCEPT |
| `explosion-small-03.svg` | 96 | 100 | 95 | 96 | 96.8 | ACCEPT |
| `explosion-small-04.svg` | 96 | 100 | 95 | 96 | 96.8 | ACCEPT |
| `explosion-small-05.svg` | 96 | 100 | 94 | 95 | 96.3 | ACCEPT |
| `explosion-small-06.svg` | 95 | 100 | 94 | 94 | 95.8 | ACCEPT |
| `explosion-small-07.svg` | 95 | 100 | 94 | 93 | 95.5 | ACCEPT |
| `explosion-small-08.svg` | 94 | 100 | 94 | 91 | 94.8 | ACCEPT |
| `explosion-large-01.svg` | 95 | 100 | 95 | 94 | 96.0 | ACCEPT |
| `explosion-large-02.svg` | 96 | 100 | 95 | 96 | 96.8 | ACCEPT |
| `explosion-large-03.svg` | 96 | 100 | 95 | 97 | 97.0 | ACCEPT |
| `explosion-large-04.svg` | 96 | 100 | 95 | 97 | 97.0 | ACCEPT |
| `explosion-large-05.svg` | 96 | 100 | 95 | 96 | 96.8 | ACCEPT |
| `explosion-large-06.svg` | 95 | 100 | 94 | 95 | 96.0 | ACCEPT |
| `explosion-large-07.svg` | 95 | 100 | 94 | 94 | 95.8 | ACCEPT |
| `explosion-large-08.svg` | 94 | 100 | 94 | 92 | 95.0 | ACCEPT |

## Visual inspection

Rendered with the forge `render_svg.py` script at actual game sizes: combat sprites at 64 px, small explosion frames at 64 px, and large explosion frames at 256 px. Contact sheets were composited over Night Field (`#091426`) to confirm silhouette, sequencing, contrast, edge clearance, and absence of unintended background rectangles.

Strengths preserved:

- Pulse and bomb weapons remain unmistakable through silhouette as well as hue.
- Shield impact uses a protective arch distinct from the sharp defence hit.
- The two explosion scales share the same asymmetrical starburst, segmented ring, and ember vocabulary without making the 64-unit sequence too detailed.
- The afterglow frames retain a small persistent core and sparse outward debris, providing a readable final state for normal playback and a useful reduced-motion endpoint.

## Validation

- `xmllint --noout`: PASS, 23/23.
- Forbidden SVG features (`filter`, embedded raster, script, text, CSS animation): none.
- Opaque background rectangles: none.
- Palette scan: exact documented tokens only.
- Required counts: A13 7/7; A14 small 8/8; A14 large 8/8.
