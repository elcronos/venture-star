# Venture Star Style Guide — Horizon Signal

Status: approved visual source of truth. Deep Survey contributes radar grammar only.

## Creative direction

Venture Star is hopeful frontier exploration rendered with optimistic precision: bold geometric spacecraft, deep navy space, cream hull planes, teal navigation surfaces, amber energy and value cues, coral danger cues, and sparse blue instrument highlights. Shapes communicate purpose before decoration. The finish is smooth vector—not pixel art—and remains readable on phone screens.

The supplied spacecraft reference informs compact silhouettes and balanced warm/cool colour only. Do not reproduce its specific ships, proportions, pixel geometry, arrangement, or decorative motifs.

## Core palette

| Token | Name | Hex | Usage |
|---|---|---|---|
| `space-950` | Outer Space | `#050914` | deepest background |
| `space-900` | Night Field | `#091426` | sector field, dark icon preview |
| `space-800` | Panel Night | `#10233B` | panels and deep shadow |
| `outline-navy` | Deep Space | `#17324A` | primary outline and structural shadow |
| `grid-navy` | Horizon Grid | `#1B3852` | inactive borders and map grid |
| `hull-cream` | Starlight | `#F4F1E8` | flagship hulls and bright surfaces |
| `text-secondary` | Mist Text | `#B9C9DA` | secondary copy |
| `text-muted` | Quiet Signal | `#7E94AA` | disabled/stale labels when contrast permits |
| `survey-teal` | Survey Teal | `#2DB6A3` | navigation, friendly state, scanners |
| `player-light` | Lock Light | `#BDFBFF` | player core and confirmed lock |
| `beacon-coral` | Beacon Coral | `#F26B52` | damage, destructive action, urgent risk |
| `solar-amber` | Solar Amber | `#F5A623` | energy, value, progress, rival 1 |
| `mist-blue` | Mist Blue | `#91C9E8` | instruments, trails, secondary scan data |
| `discovery-magenta` | Rare Signal | `#F07BD7` | rare positive discovery only |
| `rival-violet` | Rival Two | `#C889FF` | v0.1 faction 2 |
| `rival-lime` | Rival Three | `#9EDB6B` | full-target faction 3 |
| `neutral-silver` | Neutral Orbit | `#A9B3C2` | neutral ownership |
| `ore-copper` | Common Ore | `#C98A63` | trade ore |
| `metal-steel` | Structural Metal | `#8FA6B8` | metal |
| `crystal-blue` | Energy Crystal | `#60AFFF` | crystal |
| `exotic-pink` | Exotic Matter | `#FF78C8` | v0.1 exotic resource |
| `fuel-green` | Reserve Fuel | `#6FE7A6` | fuel only |

No undocumented colour is allowed. Alpha variants of these tokens are permitted. Two-stop gradients are restricted to planet discs, energy cores, shields, and large panels; both stops must be named tokens.

## Semantic colour rules

- Teal: navigation, scanning, friendly systems, valid ordinary interactions.
- Amber: resources, commerce, energy, progress, and rival faction 1 when paired with its hatch/emblem.
- Coral: damage, hostility, invalid destructive state, and critical warnings.
- Magenta: rare positive discoveries; never ordinary danger.
- Cream: player hull and highest-value readable foreground.
- Meaning is never carried by hue alone. Add silhouette, pattern, icon, label, or motion.

## Shape language

- Player flagship: forward open chevron surrounding a circular amber core; bilateral symmetry; cream central hull; teal side planes.
- Rival scout: closed kite or spearhead with a split-diamond emblem and diagonal hatch; never a recoloured player silhouette.
- Planets: simple circular body, two or three large land/atmosphere planes, and a separate patterned ownership ring.
- Resources: low-vertex clustered shards with unique internal cuts per material.
- Rewards: radial asymmetry and outward signals; never hostile red triangles.
- Hazards: broad translucent regions, hatching, and explicit warning boundary before particles.
- Radar/navigation: thin broken rings, bearing ticks, route chevrons, and paired wrap markers used only when information is being communicated.
- UI: clipped-corner panels and buttons with restrained eight-unit corner treatment; no ornamental sci-fi clutter.
- Halt controls: an octagonal cream plate carrying a hollow `beacon-coral` square. It must stay distinct in silhouette from the two-bar `pause` glyph, because both appear together in the flight bar and collapse to icon-only on small screens.
- Flight minimap: renderer geometry only — one square cell per sector on `grid-navy` lines, charted sectors tinted `survey-teal` at low alpha, uncharted left on `space-900`, the occupied sector outlined in `hull-cream`, and the ship marker a `player-light` dot. Ownership uses the planet ring colours, never hue alone, and every value is duplicated in a text readout.

## Line and detail standards

- Default outline: `outline-navy`.
- At viewBox 32: outer stroke `1.5`, inner instrument stroke `1.0`.
- At viewBox 64: outer stroke `3`, inner stroke `2`.
- At viewBox 128: outer stroke `5–6`, inner stroke `3`.
- At viewBox 256: outer stroke `8–10`, inner stroke `4–6`.
- Use round joins for instruments and energy, bevel/round joins for hulls, never uncontrolled sharp mitres.
- Use two or three value planes and at most three small panel marks on any 128-unit ship.
- Tactical sprites use no drop shadows. Depth comes from value separation and a one-unit atlas-safe rim.
- All key silhouettes must read at 24 CSS pixels and in grayscale.

## SVG conventions

- Canonical sources live under `assets/svg/`.
- Use `viewBox="0 0 W H"` with integer dimensions; omit fixed pixel width/height.
- Icons, sprites, effects, and overlays have transparent backgrounds.
- Only starfield backgrounds and explicitly opaque panels may include a full-viewBox rectangle.
- Pure vector only: no embedded raster, external reference, script, font text, CSS animation, or SVG filter.
- No `<text>` except converted outline paths in the final logo.
- Keep geometry two source units inside bounds at 32 scale, proportionally inset at larger scales.
- Name meaningful groups and keep markup editable.
- Runtime animation uses Pixi transforms, alpha, and atlas frames; source SVGs do not animate.

## Texture and effects

Flat colour is the default. Sparse two-tone gradients may support energy cores, shields, or planets. Deep Survey-style dashed rings and signal ticks provide instrument texture. Bloom is a shared runtime layer rather than per-asset filters. Particles remain minimal and never obscure silhouettes or touch targets.

## Typography

UI uses locally vendored Atkinson Hyperlegible Next Variable: weight 400 body, 600 controls, 700 headings, tabular numerals for data. Logo lettering is custom vector geometry. Interface typography must never be baked into ordinary icon SVGs.

## Accessibility and motion

- Critical graphics meet 3:1 contrast; body text meets 4.5:1.
- Player: solid ring and four-point star.
- Rival 1: diagonal hatch and split diamond.
- Neutral: sparse horizontal marks and open circle.
- Danger adds triangle, `!` label in semantic HTML, and patterned boundary.
- Reduced motion replaces orbit drift, scan sweeps, radial bursts, and large wipes with static state changes or opacity transitions no longer than 200 ms.
- Every informative animation has a persistent final state and semantic text equivalent.

## Must avoid

Copied Warpath or reference-image assets; pixel stair-steps; photorealism; grime; camouflage; gothic machinery; neon overload; faux military insignia; busy greebling; generic black outlines; background rectangles behind icons; colour-only faction identity; text inside non-logo assets.
