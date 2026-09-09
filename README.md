# Venture Star

Venture Star is an original, offline-first real-time space exploration and strategy game. Pilot one flagship across a procedurally generated toroidal galaxy, mine and trade resources, upgrade your vessel, discover frontier anomalies, acquire planets peacefully or by force, and defeat every rival faction without losing your irreplaceable ship.

The current build contains the playable core, with maps through 30×30. The approved full specification is not yet complete: research, planet roles/development, advanced diplomacy, wormholes, the broader discovery pool, and full release verification remain outstanding. See the [feature audit](.omc/audits/2026-09-08-feature-audit.md) for the implemented/partial/missing comparison and the [canonical specification](.omc/specs/game-venture-star-spec.md) for the target.

## Play locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. The game supports keyboard, pointer, and touch controls and scales from phone portrait layouts to desktop screens.

## Controls

- `W` / `↑`: thrust
- `A` / `D` or `←` / `→`: turn
- `S` / `↓`: brake
- Tap/click space or a map cell: set an autopilot destination
- Tap a contact: select it; use the contextual action buttons to mine, dock, trade, influence, attack, or use a bomb
- `Space`: pause or resume
- `M`: galaxy map
- `Escape`: close the current panel or pause

Normal cruising consumes little fuel; sustained acceleration at high speed consumes progressively more. Running out of standard fuel activates an emergency reserve that preserves slow travel but disables combat and mining.

## Build and test

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The production build is emitted to `dist/` and contains no runtime server dependency, analytics, account system, or audio.

## GitHub Pages

The included Pages workflow builds with the repository name as Vite's base path and deploys `dist/`. Enable GitHub Pages with **GitHub Actions** as its source, then push the project to `main`.

## Original work

Venture Star is not affiliated with or endorsed by Synthetic Reality or Warpath: 21st Century. Its name, setting, interface, code, balance, and visual assets are original.
