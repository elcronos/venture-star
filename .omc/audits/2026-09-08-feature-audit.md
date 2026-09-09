# Venture Star: implementation versus approved specification

Audit date: 2026-09-08. Baseline: `67ae55f`. This audit compares production wiring with the canonical specification, not just whether an interface or a test name exists. Status applies to the approved full target. The repository version label `1.0.0` is not evidence that the full target is complete.

## Findings

The game has a playable single-ship foundation and approved artwork, but its earlier “complete” description was inaccurate. Selecting a 30×30 galaxy and three rivals does not implement the later strategy systems. Most current progression is a simplified subset of v0. The work in this change addresses presentation, opening usability, and concrete gameplay defects; it does not reduce the approved target or certify all release gates.

| Spec area | Baseline implementation | Remaining obligation |
|---|---|---|
| M01 setup | Seed, difficulty, rectangular 10–30 dimensions and 1–3 rivals in core; UI offered only multiples of five | Full difficulty disclosure, saved setup preferences and generation progress/cancellation |
| M02 generation | Deterministic planets, nodes, hazards and two reward types; guaranteed nearby ore | Legal opening bot including mining, sale, reserved upgrade, fuel and rival visibility; 10,000-seed/browser sweep |
| M03 torus/routes | Wrapped motion and distance; strategic grid | Hazard-aware A*, accurate fuel forecasts and continuous paired wrap routes |
| M04 flight | Fixed-step thrust, turning and braking | Solid collisions, complete input/focus matrix and measured input latency |
| M05 fuel | Normal tank and emergency travel | Fractional rate bug, debt rescue, neutral access, exact forecast and full recovery guarantees |
| M06 autopilot | Local point/entity pursuit | Reliable braking/arrival, hazard-aware routes and all interruption conditions |
| M07–M09 mining/cargo | Finite node transfer, holding delay, capacity | Spring assistance, full interruption semantics, cargo jettison/recovery and inventory guard |
| M10–M11 trade/services | Fixed prices, buy/sell, docking, repairs and bombs | Bounded restocking/adaptive market, partial repairs, recovery economy and complete docking protection |
| M12 equipment | Six upgrade stat families and two tiers | Three competing module slots, owned inventory, fit/swap/sale, market stock and research gates |
| M13–M16 combat | Selected-hostile automatic damage, layered health, consumable bomb confirmation/cooldown | Projectile flight/collision/interception, occlusion, target grace, bomb area damage and complete feedback |
| M17 planets | Fixed templates and periodic ore-to-metal conversion | Roles, infrastructure, capacity, meaningful automatic development and production accounting |
| M18 acquisition | Simplified trade/aid/broadcast and shield/resolve capture | Real demand contracts, competing influence/trust and full forceful occupation gates |
| M19–M20 defence | Simplified planetary shield | Infrastructure damage, orbital batteries, construction and occupation |
| M21–M22 rivals | Movement, paid aid and timed reconstruction | Sustainable legal economy, sensor-limited decisions, combat/planet strategy, AI-vs-AI conquest and parity |
| M23 capitulation | Basic core command | Production offer flow, sustained eligibility, research gates, federation and atomic cleanup |
| M24 intelligence | Visited-sector geography | Live/recent/stale observations, shared visibility and fog-safe alerts |
| M25 discoveries | Treasure and cargo rewards | Overflow conservation, scan duration, differentiated materials, broader rewards, artifacts and rescues |
| M26 hazards | Unconditional region damage | Safe slow asteroid traversal, ion storms, gravity shear, wormholes and shared rules |
| M27 persistence | Checksummed primary/recovery snapshots, basic local lease, pause and reload | Atomic database lease, journal chain, complete fault handling, validated import/export and migration |
| M28–M29 endings | Hull-zero defeat, all-planets victory, local records and replay | Durable terminal fence across failed writes/other tabs, full final known map and complete legal victory trace |
| M30 timeline | Events, categories and search | Fog gating, priority/coalescing, bounded protected aggregation and stable focus |
| M31 research | Absent | Ten-node tree, costs, prerequisites, saved project progress and unlocks |
| M32 guidance | Basic objective and tutorial preference | Six contextual lessons, completion persistence and accurate help |
| Full discoveries/topology | Larger map allocation | Wormholes, broad artifacts/discoveries, advanced traversal |
| Full records/progression | Basic record summaries | Comparison, discovery catalog, achievements and purely cosmetic unlocks |
| §6/§8 visuals | 190 approved SVG sources, a subset rendered with Canvas 2D | Complete event feedback, planned Pixi/atlas pipeline and measured mobile budgets |
| §9 accessibility | Semantic forms, settings, touch controls and focus trap | Stable focused controls during updates, complete reflow matrix, map keyboard access and axe/device evidence |
| §7 static delivery | Vite production build and GitHub Pages workflow | Actual remote deployment, release browser/offline/subpath evidence |

## Defects prioritized in this polish pass

1. Powered fuel consumption rounded up every tick, flattening all throttle/speed combinations to the same burn rate.
2. Discovery cargo was marked claimed before capacity was checked, silently discarding the remainder.
3. Refit prices in the interface differed from the simulation; material costs and affordability were unclear. Repeat purchases/downgrades were not guarded.
4. Holding flight controls suppressed visual updates; normal rerenders could replace active pointer/focus targets.
5. Initial camera placement and wrap transitions could obscure the ship; autopilot did not reliably brake into interaction range.
6. Compact HUD panels, objective text and controls competed for the same screen space; mobile navigation hid useful labels.
7. Slow/stationary hazard travel was unsafe despite the specified speed-based asteroid rule.
8. Docked targets and a captured replacement shipyard lacked necessary state guards.
9. Zero-credit refuelling had no specified rescue path; rivals lacked a sustainable resource loop.

## Verification boundary

The baseline had 21 unit tests and a small Chromium desktop/mobile-emulation suite. Those tests prove selected mechanics; they do not prove the hundreds of canonical assertions, every story, a complete legal campaign, cross-browser determinism, the pacing targets, or human engagement. No human playtest or actual Safari/iOS validation is claimed.

## Final verification for this polish pass

- `npm run verify` passed: TypeScript, 33 unit tests, the production Vite/PWA build, and 31 Playwright checks passed across desktop and iPhone emulation (3 intentional desktop-only skips).
- Added UX checks cover 30×30 setup defaults and integer sizing, mobile/desktop layout, first-frame camera centering, live held controls, autopilot braking into mining range, throttle updates, settings cancellation, multi-character timeline search, and focus-safe overlays.
- The core journey completes deterministic flight, mining, discovery claim, docking, trade, and Deepglass Drill fitting. Persistence checks include reload recovery and stale-tab terminal-fence protection.
- Visual checks covered compact portrait, enlarged-text portrait, and landscape layouts. No overlap or horizontal overflow was observed in reviewed screenshots. This is browser emulation, not physical-device or Safari certification.

The full approved target remains incomplete. In particular, research, module inventory/slot swapping, advanced discovery and topology, projectile/area combat, infrastructure and production, full diplomacy/federation, sensor-limited AI parity, stale intelligence, and complete release/deployment evidence remain open. Those systems must not be inferred from the polished opening loop.

## Reference-style visual pass — 2026-09-09

The supplied survey references were used as visual direction for the existing UI without copying their artwork: technical cyan/navy framing, clipped instrument panels, monospace telemetry, dense toroidal grid, left status rail, right route/target sheet, and restrained amber/coral warnings. Existing SVG assets and gameplay dispatch paths remain in use. Screenshots and playtest evidence are generated by `market-ux.spec.ts` and the Galaxy/flight E2E flows.
