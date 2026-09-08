# Venture Star Repository Guidance

## Product specification

Before changing gameplay behavior, progression, persistence, scope, UX, assets, or tests, read `.omc/specs/game-venture-star-spec.md`. It is the canonical product specification. Feature changes update the specification and affected tests in the same change.

## Style guide

Before making visual changes, read `style-guide.md`. All colours, line weights, silhouettes, accessibility patterns, and SVG conventions must match it. Do not introduce a new colour or visual language without updating the style guide and asset validation first.

The approved canonical source assets are under `assets/svg/`. Do not replace them with placeholders, copied artwork, runtime-downloaded imagery, emoji, or unrelated icon libraries.

## Runtime constraints

The game must remain a static, offline-capable HTML5 application deployable to a GitHub Pages project subpath. Core gameplay, saves, history, graphics, and audio may not require a runtime server, account, cloud database, or CDN.

## Verification

Every mechanic and build story must retain its specification-linked tests. A passing unit suite is insufficient: browser E2E must boot the real first screen and complete the specified playable loop.
