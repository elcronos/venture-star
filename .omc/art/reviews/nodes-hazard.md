# A08–A09 Visual QA — Resource Nodes and Asteroid Hazard

Reviewed against `style-guide.md` and the Game Asset Forge `references/critique-rubric.md`.

## Verification

- Rendered all nine resource nodes at their intended 64 px size and all five hazard assets at their intended 256 px size with `render_svg.py`; inspected every PNG directly on a dark field.
- All 14 SVGs pass `xmllint --noout`, use exact approved palette tokens, contain no background rectangle, text, raster image, script, or filter, and preserve transparent canvases.
- Resource identity is shape-redundant: ore uses low rounded copper clusters and irregular wedge cuts; metal uses compact steel polyhedra with radial plate seams; crystal uses tall blue prisms and longitudinal facets.
- Depletion is shape-redundant: full nodes have the tallest/largest silhouettes, half nodes collapse into lower asymmetric clusters, and depleted nodes are dark fractured beds with only narrow material seams remaining.
- The four hazard tiles share exact left/right boundary anchors at y=62 and y=194. Edge asteroids use identical geometry offset by 256 units, so neighboring variants join without clipped mismatches. Interior rock placement varies to suppress obvious repetition.
- The warning overlay adds a persistent translucent coral band, twin dashed bounds, diagonal hatch marks, and three outlined warning triangles; its meaning survives grayscale and does not depend on coral alone.

## Final rubric scores

| Asset | Style | Color | Craft | Readability | Transparency | Overall | Verdict |
|---|---:|---:|---:|---:|---|---:|---|
| `node-ore-full.svg` | 96% | 100% | 95% | 96% | PASS | 96.8% | ACCEPT |
| `node-ore-half.svg` | 96% | 100% | 94% | 95% | PASS | 96.3% | ACCEPT |
| `node-ore-depleted.svg` | 95% | 100% | 94% | 95% | PASS | 96.0% | ACCEPT |
| `node-metal-full.svg` | 97% | 100% | 96% | 96% | PASS | 97.3% | ACCEPT |
| `node-metal-half.svg` | 96% | 100% | 95% | 95% | PASS | 96.5% | ACCEPT |
| `node-metal-depleted.svg` | 95% | 100% | 94% | 95% | PASS | 96.0% | ACCEPT |
| `node-crystal-full.svg` | 97% | 100% | 96% | 98% | PASS | 97.8% | ACCEPT |
| `node-crystal-half.svg` | 96% | 100% | 95% | 97% | PASS | 97.0% | ACCEPT |
| `node-crystal-depleted.svg` | 96% | 100% | 95% | 96% | PASS | 96.8% | ACCEPT |
| `asteroid-field-01.svg` | 96% | 100% | 95% | 97% | PASS | 97.0% | ACCEPT |
| `asteroid-field-02.svg` | 96% | 100% | 95% | 97% | PASS | 97.0% | ACCEPT |
| `asteroid-field-03.svg` | 96% | 100% | 95% | 97% | PASS | 97.0% | ACCEPT |
| `asteroid-field-04.svg` | 96% | 100% | 95% | 97% | PASS | 97.0% | ACCEPT |
| `asteroid-warning.svg` | 97% | 100% | 96% | 99% | PASS | 98.0% | ACCEPT |

## Critique notes

Strengths:

- The three resource families remain unmistakable at 64 px without relying on hue.
- Full, half, and depleted silhouettes form a clear height-and-mass progression in every family.
- Hazard tiles use the restrained Horizon Signal outline weight and Deep Survey boundary grammar, with enough variation to avoid a stamped look.
- The warning overlay reads immediately while leaving the underlying playfield visible.

Iteration history:

1. Initial pass established the material cuts, depletion beds, four seam-compatible hazard fields, and warning band. Full/depleted nodes and all hazard assets passed at 90%+.
2. The initial half nodes retained too much of the full-node mass and used small detached state marks. Their silhouettes were lowered and simplified, and the detached marks were removed. The second intended-size render passed at 90%+.

