# A04–A05 Production Asset Review

Date: 2026-09-06  
Direction: Horizon Signal  
Rubric: `game-asset-forge/references/critique-rubric.md`  
Result: **PASS — all eight assets exceed the 90% acceptance threshold.**

## Review method

- Rendered every source to a 512 px PNG with the forge `render_svg.py` utility and visually inspected the full set together.
- Rendered every source again at 64 px to check tactical readability and state recognition.
- Checked exact palette use, transparent canvas, silhouette distinction, line weight, state continuity, XML validity, and absence of raster images, scripts, filters, text, or background rectangles.
- The rival is identified redundantly by its closed spear-kite silhouette, split-diamond emblem, and diagonal hatch. Amber is not its only identifier.
- The shipyard states change geometry and signal pattern, not merely colour.

## Reflection log

### Round 1

The rival silhouette and identity system read clearly, while the damaged and destroyed forms retained enough shared geometry to remain attributable. All four shipyard states were distinct at both inspection sizes. The thrust asset scored 88% for readability because its first exhaust plume was mostly occluded by the trailing keel.

Action: shortened only the thrust-state keel, widened the amber exhaust envelope, and enlarged its Lock Light inner plume while preserving viewBox, centre anchor, leading point, wing span, hatch, and emblem.

### Round 2

The revised thrust plume remained visibly attached to the craft and became immediately legible at 64 px. No further iteration was required. Total rounds used: two for `f1-thrust.svg`; one for every other asset.

## Final rubric scores

### Rival scout

Asset: `f1-idle.svg`  
Scores: Style 96% | Color 100% | Craft 95% | Readability 95% | Transparency PASS  
Overall: **96.5%**  
Verdict: **ACCEPT**  
Strengths: compact closed spear-kite silhouette, crisp split diamond, symmetrical faction hatch, and restrained three-plane construction.

Asset: `f1-thrust.svg`  
Scores: Style 96% | Color 100% | Craft 95% | Readability 98% | Transparency PASS  
Overall: **97.25%**  
Verdict: **ACCEPT**  
Strengths: unmistakable shared hull and a broad amber/Lock Light plume that survives small-size rendering.

Asset: `f1-damaged.svg`  
Scores: Style 97% | Color 100% | Craft 94% | Readability 96% | Transparency PASS  
Overall: **96.75%**  
Verdict: **ACCEPT**  
Strengths: chipped starboard silhouette, desaturated armour, coral fracture, and separated sparks communicate damage without obscuring identity.

Asset: `f1-destroyed.svg`  
Scores: Style 95% | Color 100% | Craft 93% | Readability 94% | Transparency PASS  
Overall: **95.5%**  
Verdict: **ACCEPT**  
Strengths: clearly separated mirrored wreck sections preserve the spear, hatch, and split-emblem vocabulary; ruptured core and sparse debris read as terminal state.

### Shipyard

Asset: `shipyard-active.svg`  
Scores: Style 97% | Color 100% | Craft 96% | Readability 96% | Transparency PASS  
Overall: **97.25%**  
Verdict: **ACCEPT**  
Strengths: balanced orbital ring, four service spokes, teal operating core, and amber docking beacons create a clean active silhouette.

Asset: `shipyard-constructing.svg`  
Scores: Style 96% | Color 100% | Craft 95% | Readability 95% | Transparency PASS  
Overall: **96.5%**  
Verdict: **ACCEPT**  
Strengths: open scaffold, three converging fabrication arms, forming hull, weld marks, and teal progress arc clearly communicate construction.

Asset: `shipyard-disabled.svg`  
Scores: Style 96% | Color 100% | Craft 95% | Readability 97% | Transparency PASS  
Overall: **97%**  
Verdict: **ACCEPT**  
Strengths: segmented dormant ring, silver-only beacons, dark core, and persistent crossed lock bars remain readable without relying on muted colour alone.

Asset: `shipyard-destroyed.svg`  
Scores: Style 96% | Color 100% | Craft 94% | Readability 96% | Transparency PASS  
Overall: **96.5%**  
Verdict: **ACCEPT**  
Strengths: broken ring quadrants, displaced structural masses, ruptured coral hub, exposed amber core, and controlled debris field make the terminal state immediate.

## Validation evidence

- XML parsing: PASS for 8/8 sources.
- ViewBoxes: rival 4/4 at `0 0 128 128`; shipyard 4/4 at `0 0 256 256`.
- Palette: PASS; every literal hex colour is an approved token.
- Transparency: PASS; no full-canvas background geometry.
- Pure-vector/source hygiene: PASS; no `image`, `text`, `script`, `filter`, embedded raster, fixed `width`, or fixed `height` elements/attributes.

