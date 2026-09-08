# Venture Star — Phase 2 Critique Synthesis

Status: All proposed resolutions approved by the user on 2026-09-06.

## Sources

Three independent reviews were run against `deep-interview-game-venture-star.md`: first-30-seconds/5-minutes/30-minutes playtest simulation, scope and feasibility review, and competitive/feel review against Synthetic Reality's *Warpath*.

## Proposed triage

| ID | Issue | Severity | Proposed resolution |
|---|---|---|---|
| C1 | The procedural opening may be empty, unfair, or confusing. | Ship blocker | Address now: every seed must pass an opening-envelope validator that guarantees a safe home, profitable first mine-and-sale loop, consequential first upgrade within about three minutes, nearby rewarding discovery, and readable rival action within five minutes. |
| C2 | Passive mining risks feeling like waiting and imprecise touch control. | Ship blocker | Address now: add assisted station-keeping, a visible range lock, extraction pulses, interruption rules, and upgrades that visibly change beam cadence/range/cargo flow. |
| C3 | Flight, autopilot, combat, bombardment, touch targeting, and death feedback lack numeric/readability rules. | Ship blocker | Address now in the heavy spec: define movement curves, braking, camera, path previews, fuel forecasts, target priority, disengagement, shields/armour/hull, consumable confirmation, damage feedback, and reduced-motion equivalents before implementation. |
| C4 | One flagship controlling every planet can become late-game commuting and cleanup. | Ship blocker | Address now: preserve formal all-planets control victory, but add rule-abiding faction capitulation. A rival without a functioning shipyard and below a control threshold surrenders its remaining planets; high peaceful influence may instead integrate them as a federation. |
| C5 | A full 4X simulation, 900-sector maps, adaptive economy, deep diplomacy, and rule-equivalent AI are too broad for a first playable release. | Major | Stage delivery. v0 proves a polished `10x10`, one-rival, 8–12-planet loop. v0.1 adds rectangular `10–15`, two rivals, research, roles, adaptive markets, sensors, more discoveries, and capitulation. Later releases expand toward `30x30`, three rivals, and deeper simulation. The final product target remains intact. |
| C6 | Exact player-equivalent offscreen AI is costly and potentially unreadable. | Major | Address with visible rule equivalence at the economy level—costs, cooldowns, fuel-range constraints, shipyard replacement—but abstract offscreen tactics on a fixed simulation cadence. Expose AI intent, cargo/fuel state, destination, and construction progress when intelligence permits. |
| C7 | Toroidal distance and danger can confuse players. | Major | Address now: show wrap-aware routes and named frontier bands on the galaxy map. Danger rises toward the toroidal antipode, with local modifiers; route preview shows danger and fuel cost. |
| C8 | Permadeath in a browser can be mistaken for data loss after crashes, tab eviction, refreshes, or duplicate tabs. | Ship blocker | Address now: atomic/versioned saves, pause while hidden, single-active-tab lease, recovery journal, explicit death transaction, backup snapshot that can repair corruption but never undo a confirmed gameplay death. |
| C9 | The differentiator repeats many original Warpath features; “faster sessions” is not supported by the 45–75 minute target. | Major | Reframe the promise as faster decisions and lower friction. Make the experiential signature responsive one-ship flight, materially surprising discoveries, and readable AI whose plans visibly follow shared economic rules. |
| C10 | Dynamic markets and four materials plus fuel may become coloured currencies or exploitable arbitrage. | Major | Address in balance spec: distinct sources/sinks, bounded prices, stock limits, stale price intelligence, transaction pressure, guaranteed recovery sources, and automated seed/economy sweeps. |
| C11 | Audio and animated DOM SVGs introduce mobile performance/licensing risks. | Major | Use original SVG source assets rendered through a performant Canvas/WebGL scene, DOM for menus only. Begin with modular effects and a compact licensed/offline ambient loop; preserve full mute and audio-unlock behavior. |
| C12 | Pausing every management view gives unlimited planning time. | Acceptable risk | Accept intentionally: Venture Star is a planning-friendly single-player game. Communicate pause state consistently and prevent simulation catch-up after a paused/hidden interval. |

## Recommended release layers

### v0 vertical slice

`10x10`, one rival, 8–12 planets, seeded generation and validation, one hazard and two rewarding discovery types, flagship flight/autopilot/mining/trade/fuel, six equipment types, standard auto-weapon plus one bomb, simplified military and peaceful acquisition, geography fog, permadeath with sealed record, autosave/resume, responsive accessible HUD, and effects-first audio.

### v0.1 strategy layer

Rectangular maps through `15x15`, two rivals and AI-vs-AI conquest, exotic resource and compact research, planet roles, bounded adaptive markets, sensor/stale ownership intelligence, more hazards and positive discoveries, orbital defences, infrastructure damage, optional tutorial, export/import, richer statistics, and faction capitulation.

### Later full target

Maps through `30x30`, three independent rivals, deeper shared-rule AI economy and diplomacy, wormholes and advanced routing, broad discovery pools, richer planetary development, cosmetics/achievements, detailed timeline comparisons, and expanded audio.

## Feel signature

The first five minutes must show: responsive launch and sector crossing, an intriguing scan, a satisfying mine/sell/refit cycle, one immediately perceptible upgrade, an understandable rival action, and a visible strategic consequence.

The make-or-break interaction is assisted station-keeping: at low throttle within the final 10–15% of interaction range, the flagship matches target drift, eases into a subtle orbital arc, and displays a crisp range lock; manual steering or high throttle breaks the assist immediately.
