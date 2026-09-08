# A01–A02 visual review — Brand and Shell

Reviewed against `style-guide.md` and the Game Asset Forge critique rubric after rendering each source with `render_svg.py`. Full-size renders were inspected at 512 px; the logo, mark, loader, and compatibility illustration were also checked at compact runtime sizes. Transparency is assessed by intended role: the far starfield is an opaque backdrop; the mid and near fields are transparent parallax overlays.

| Asset | Iteration | Style | Color | Craft | Readability | Overall | Transparency | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|---|
| `brand/logo-horizontal.svg` | 2 | 96 | 100 | 94 | 94 | 96.0 | PASS | ACCEPT |
| `brand/mark.svg` | 1 | 97 | 100 | 96 | 97 | 97.5 | PASS | ACCEPT |
| `shell/starfield-far.svg` | 1 | 95 | 100 | 94 | 94 | 95.8 | PASS | ACCEPT |
| `shell/starfield-mid.svg` | 1 | 96 | 100 | 95 | 94 | 96.3 | PASS | ACCEPT |
| `shell/starfield-near.svg` | 1 | 96 | 100 | 96 | 96 | 97.0 | PASS | ACCEPT |
| `shell/loading-orbit.svg` | 1 | 98 | 100 | 96 | 97 | 97.8 | PASS | ACCEPT |
| `shell/compatibility.svg` | 1 | 97 | 100 | 96 | 96 | 97.3 | PASS | ACCEPT |

## Critique notes

### `brand/logo-horizontal.svg`

- Strengths: the open chevron, compass star, broken orbit, and amber core establish a distinctive Horizon Signal identity; the custom outlined lettering is crisp and monochrome-safe in silhouette.
- Iteration: the first render placed the final `E` too close to the right edge. Iteration two condensed the upper wordmark to restore breathing room without changing the 512×192 viewBox.

### `brand/mark.svg`

- Strengths: the bilateral open-chevron silhouette reads clearly at 64 px, while the four-point star and cardinal ticks provide redundant navigation meaning. Cream, teal, amber, and navy remain well separated in grayscale value.

### `shell/starfield-far.svg`

- Strengths: the opaque `space-950` base and restrained two-scale star distribution form a quiet backdrop with sufficient negative space for play. All stars are inset, preventing clipped geometry at tile edges.

### `shell/starfield-mid.svg`

- Strengths: sparse mist-text stars and four blue glints add depth without competing with ships or HUD. The transparent canvas composites cleanly over the far layer.

### `shell/starfield-near.svg`

- Strengths: larger four-point stars and three instrument-like blue signals create legible parallax landmarks while remaining sparse. The transparent silhouette remains clean at tile boundaries.

### `shell/loading-orbit.svg`

- Strengths: the broken teal/blue arc, amber orbital body, and central compass star retain meaning at 64 px. Geometry supports runtime transform animation without embedded animation or filters.

### `shell/compatibility.svg`

- Strengths: the interrupted coral route communicates a blocked capability; the amber warning beacon and cream archive capsule communicate warning plus safe record preservation without relying on text or hue alone. It remains legible at 128 px.

## Constraint checks

- Exact viewBoxes: logo `0 0 512 192`; mark `0 0 512 512`; starfields `0 0 1024 1024`; loader `0 0 64 64`; compatibility `0 0 256 256`.
- Pure vector: no raster images, external references, scripts, filters, fonts, CSS animation, or ordinary `<text>` elements.
- Palette: all authored colour values are approved style-guide tokens; opacity is used only as an allowed token alpha variant.
- Backgrounds: only the far starfield has a full-viewBox background. Brand, loader, compatibility, mid-starfield, and near-starfield sources remain transparent.
