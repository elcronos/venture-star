# Venture Star — Context and Scope Sections

## 1. Elevator

### 1.1 One-sentence pitch

**Venture Star is an offline-first, single-player space strategy game in which the player directly pilots one upgradeable flagship through a seeded toroidal frontier, mines and trades in real time, wins planets through influence or bombardment, and outmanoeuvres rule-abiding rival factions whose plans remain legible.**

### 1.2 Product promise

Venture Star compresses the decisions of a space 4X campaign into the actions of one ship. The player does not issue fleet orders or manage spreadsheets. They fly, scan, choose routes, hold a precise mining position, trade, refit, research, cultivate influence, attack defences, and assign high-level roles to acquired planets. Their physical position matters: opportunity, intelligence, danger, fuel, and strategic reach all flow through the flagship.

The product is defined by four promises:

1. **One ship, real consequences.** The flagship is the player's only directly controlled unit. Its location, loadout, cargo, fuel, damage, and survival create the campaign's immediate decisions. Its destruction permanently ends the run.
2. **Surprise worth pursuing.** Exploration produces distinctive positive discoveries as well as hazards. A new scan must be capable of changing a route, loadout, economic plan, or conquest plan; unexplored space must never be only concealed attrition.
3. **Fast decisions, not necessarily a short clock.** A `10x10` campaign targets 45–75 minutes of engaged duration, but individual actions must be low-friction: launch immediately, understand the next opportunity, preview route danger and fuel, dock without menu hunting, and perceive an upgrade's effect on the next use.
4. **Rivals that visibly obey the world.** Rival exploration ships consume fuel, carry cargo, use shipyard construction capacity, and can be destroyed and rebuilt. Offscreen tactics may be abstracted for performance, but strategic outcomes must be paid for through visible resources, costs, constraints, and time.

### 1.3 Player fantasy

The player is an independent frontier captain growing a one-ship venture into a network of allied and controlled worlds. The tone is hopeful and exploratory rather than grim or imperial by default. Rival factions are principled competitors with comprehensible interests, not faceless evil species. Peaceful federation and forceful conquest are both systemic paths; the game records which path the player took and makes their costs materially different.

The fantasy is **not** fleet command, twitch dogfighting, colony micromanagement, or dialogue-led role-playing. Moment-to-moment flight should be responsive, but flight exists to make strategic positioning tangible. Planets develop after a role assignment; they do not require building placement or worker queues. Diplomacy is performed through trade, aid, broadcasts, trust, and influence pressure; it does not use authored dialogue trees.

All names, factions, visual motifs, writing, audio, maps, discoveries, equipment, icons, and code shipped in Venture Star must be original or used under an explicitly recorded compatible licence. No third-party game's text, map structure, interface layout, faction identity, asset, sound, or distinctive terminology may be copied.

### 1.4 Core experience contract

Every valid campaign must support the following complete arc:

`launch → scan → travel → hold position and mine → sell → refit → perceive improvement → choose influence or force → acquire planets → respond to rival expansion → remove or integrate all rivals → control every planet → seal victory record`

The campaign may branch and repeat activities, but it must never require control of a player fleet. Formal victory occurs only when the player controls every generated planet. To prevent a solved campaign becoming a commuting exercise, a qualifying rival may capitulate: a rival with no functioning shipyard and control below the specified threshold transfers or federates its remaining planets according to the diplomacy rules. Capitulation accelerates fulfilment of the existing all-planets condition; it does not replace it with a percentage score.

Flagship destruction is an immediate permanent defeat. The active save is sealed through an explicit death transaction and becomes read-only. It remains inspectable as a record containing at minimum the final known galaxy map, timeline, discoveries, outcome, seed, duration, and statistics. The record offers two new-run actions: replay the same seed and generate a new seed. Neither action unseals or continues the defeated run.

### 1.5 First-five-minute contract

The opening is a generated and validated sequence, not a probability. Every accepted seed must provide the opportunity for all of the following without relying on hidden developer actions:

| Deadline from first player control | Required experience | Observable acceptance condition |
|---|---|---|
| 30 seconds | Responsive launch and navigation | The player can steer, vary speed, see the current sector, and identify at least one actionable scan or destination without opening a manual. |
| 90 seconds | First useful interaction | A safe, reachable mining node or equivalent opening objective is identified with an understandable range/interaction cue. |
| 3 minutes | Mine, sell, and improve | The validated route contains enough extractable and marketable value to purchase one consequential upgrade; the upgrade changes a displayed stat and produces a perceivable effect on its next relevant use. |
| 5 minutes | Discovery and strategic context | The player can encounter a rewarding discovery with distinct reveal feedback and observe one understandable rival action or consequence through direct sensors or an intelligence notification. |

The generator must reject and regenerate any seed whose opening envelope cannot meet the resource, distance, danger, fuel, price, and timing constraints used by the automated opening validator. Validation guarantees opportunities, not forced player behaviour. A player may ignore them.

The opening home must be safe, usable for cheap refuelling, and capable of supporting the first sale/refit loop. No required opening route may consume the emergency reserve. No hostile action may make the guaranteed opening loop unwinnable before the player has had a reasonable opportunity to complete it.

### 1.6 Interaction signature

The make-or-break interaction is assisted station-keeping. When the flagship is at low throttle and enters the final 10–15% of a mineable node's interaction range, the assist matches target drift, eases the ship into a subtle orbital arc, and displays a crisp locked-range state. Extraction occurs in visible pulses and visibly moves material into cargo. Manual steering or high throttle cancels the assist immediately. Leaving range, losing the target, hostile interruption, full cargo, or node depletion stops extraction and communicates one specific reason.

This interaction is the minimum quality bar for the wider game: approach is readable, assistance is discoverable, control is never stolen irreversibly, state changes are visible, and upgrades alter cadence, range, efficiency, or cargo flow in a way the player can notice without inspecting hidden numbers.

### 1.7 Platform and session contract

- The shipped application is a static HTML5 game with no runtime server requirement.
- It deploys correctly beneath a GitHub Pages project subpath; no runtime asset assumes `/` as the site root.
- After required assets have loaded once, all core campaign play and local record viewing remain functional offline.
- Desktop and touch layouts expose the same rules and campaign capabilities. Input methods may differ, but touch is not a reduced game mode.
- Management screens and explicit pause stop simulation time. Hidden/background tabs also pause. Returning to the game never simulates catch-up time.
- The application maintains one active-tab lease for a campaign and refuses simultaneous mutation from a second tab.
- Saves are local, atomic, versioned, journalled, and recoverable from corruption without recovering past a confirmed gameplay death.
- v0 supports a polished `10x10` campaign with one rival and 8–12 planets. The approved full target supports rectangular grids from `10x10` through `30x30` and 1–3 rivals.
- A `10x10` campaign targets 45–75 minutes of engaged duration for a player who understands the rules. Engaged duration includes running flight and management/Galaxy time but excludes explicit pause, hidden, lease loss, and recovery. This is a tuning target, not a forced timer and not a marketing claim that every campaign is short.

### 1.8 Pillars and non-pillars

| Pillar | Required proof | Failure signal |
|---|---|---|
| Direct flagship agency | Steering, braking, targeting, station-keeping, route choice, and loadout changes have immediate readable effects. | Most optimal play occurs in menus or while waiting with no meaningful ship input. |
| Reward-led exploration | Positive discoveries are signalled distinctly and can alter a plan. | Exploration mostly reveals hazards, generic currency, or interchangeable flavour text. |
| Low-friction strategy | Route, fuel, danger, price freshness, ownership freshness, and next actions are readable at decision time. | Players must memorise unseen values, repeatedly cross-reference screens, or discover unavoidable costs after committing. |
| Shared-rule rivalry | Rival growth and replacement have inspectable causes when intelligence permits. | A rival spawns ships, resources, or ownership changes without a legal source and elapsed cost. |
| Consequential campaign record | Victory, defeat, seed, discoveries, and major events survive as a sealed record. | Refresh, crash, duplicate tabs, or death can silently erase a run or reopen a confirmed defeat. |

The following are explicitly not pillars and must not be allowed to distort production priorities: cinematic narrative, online competition, large fleet spectacle, exhaustive economic simulation, procedural content quantity for its own sake, or photorealistic rendering.

### 1.9 Release proof gates

The product vision is considered demonstrated only when a candidate build passes all gates for its layer:

- **v0 proof:** a complete, saveable and winnable `10x10`/one-rival campaign; the first-five-minute validator; direct flight and wrap crossing; mining/trade/fuel/refit; six equipment types; a standard automatic weapon and one manually activated bombardment consumable; one hazard; two positive discovery types; simplified peaceful and military planet acquisition; fogged geography; permadeath and sealed records; responsive accessible HUD; silent visual/text feedback.
- **v0.1 proof:** rectangular maps through `15x15`; two rivals able to fight each other; compact research; exotic material; planet roles; bounded adaptive markets; sensor-based and stale intelligence; expanded discoveries and hazards; orbital defences and infrastructure damage; optional tutorial; JSON export/import with validation and checksum; richer records; capitulation/federation.
- **Full-target proof:** maps through `30x30`; three independent rivals; deeper shared-rule economy and diplomacy; advanced wrap-aware routing and wormholes; broad discovery pools; richer planetary development; achievement/cosmetic records; timeline comparison; expanded visual effects while remaining silent.

Passing a later gate includes all earlier gates. A feature appearing incidentally before its assigned layer does not move its acceptance obligations forward unless the release scope is deliberately amended.

## 2. Competitive Context

### 2.1 Category position

Venture Star occupies the intersection of lightweight single-player 4X, top-down real-time ship control, and run-based procedural strategy. Its category shorthand is **“one-ship 4X.”** The phrase communicates scope but is not a licence to imitate any existing title's protected expression.

The game competes for players who want the arc of exploration, economic growth, technological leverage, diplomacy, territorial change, and final control, but who do not want to command many units or spend most of a session administering queues. It also serves players attracted to direct ship movement who want their piloting decisions to feed a strategic campaign rather than a sequence of disconnected combat arenas.

### 2.2 Audience and jobs to be done

Primary audience:

- Players comfortable with strategy systems who want a complete solo campaign in one or several sittings.
- Desktop or mobile players who prefer direct control of a single persistent craft over fleet selection and formation control.
- Players who value seeded procedural replay, visible rules, offline ownership of saves, and the ability to pause while planning.

Secondary audience:

- Exploration-led players motivated by rare discoveries and map completion.
- Optimisers who enjoy loadout constraints, route efficiency, market opportunities, and reproducible seeds.
- Accessibility-conscious players who need scalable text, non-colour faction identification, reduced motion, optional shake, large touch targets, and pause-anytime play.

The product must perform these jobs:

1. Let the player make a strategically meaningful choice within the first minute.
2. Deliver the rise from vulnerable captain to galaxy-shaping power without adding fleet command.
3. Make procedural exploration produce memorable “change my plan” moments.
4. Let the player understand why a rival succeeded and how to interfere.
5. Preserve a completed or failed campaign as a trustworthy local record.

### 2.3 Differentiation

| Common category friction | Venture Star response | Required evidence |
|---|---|---|
| Strategy games front-load menus and nested administration. | The campaign opens in direct ship control; full-screen management pauses; contextual actions surface only when relevant. | First controllable state is flight, and the first mine/sell/refit loop can complete without consulting external documentation. |
| Direct-control space games often separate flight from strategic ownership. | The same flagship performs discovery, logistics, diplomacy support, conquest, and refit. | A route/loadout choice can change both immediate flight risk and planet-level strategy. |
| Procedural maps can generate empty or unfair starts. | A deterministic opening-envelope validator rejects starts that cannot deliver the five-minute contract. | Automated sweeps report zero accepted seeds violating the opening constraints. |
| AI either cheats or becomes too expensive to simulate exactly. | Economy-level rules are shared; offscreen tactics resolve on a fixed cadence; legal causes and intent are exposed when known. | Every rival ship replacement and ownership change can be traced to a valid shipyard/action, cost, prerequisite, and elapsed duration. |
| Edge-wrapped maps are hard to reason about. | Routes, fuel forecasts, shortest wrapped distance, and named danger bands are drawn explicitly. | A route preview crossing an edge displays the wrap and never quotes non-wrapped distance or cost. |
| Passive gathering feels like dead time. | Assisted station-keeping turns mining into an approach/lock/flow interaction with immediate upgrade feedback. | Mining reports approach, lock, pulse, interruption, full-cargo, and depletion states visually and accessibly. |
| Permanent death can resemble browser data loss. | Death is an explicit journalled transaction; crash recovery cannot reverse confirmed death; the result remains inspectable. | Crash/refresh/duplicate-tab tests preserve the correct live or sealed state without cloning progress. |
| Long endgames become travel cleanup. | Capitulation or federation transfers a strategically defeated rival's remainder while preserving all-planets victory. | Once the specified threshold and shipyard condition hold, resolution can complete without visiting every helpless planet individually. |

### 2.4 Experiential signature

Marketing and store language should lead with:

- piloting one evolving flagship across a wraparound procedural frontier;
- discoveries that materially redirect the campaign;
- rivals whose current plans, constraints, and reconstruction are visible through earned intelligence;
- strategic conquest with peaceful and forceful systemic paths;
- offline seeded campaigns with permanent, inspectable outcomes.

“Faster” may describe decisions, interaction flow, and reduction of administrative friction. It must not imply that a 45–75 minute base campaign is shorter than every competitor or promise a fixed completion duration. “Fair AI” may be used only if shipped diagnostics and tests establish shared economic rules; it must not imply that rival tactical simulation is identical on- and offscreen. “Tamper-proof” must never describe client-side saves. The allowed claim is corruption detection and resistance to casual editing through schema validation and a checksum.

### 2.5 Competitive moats to build

These are product capabilities, not legal exclusivity claims:

1. **Validated procedural pacing:** generation is evaluated for playability and dramatic cadence, rather than accepted solely because it is deterministic.
2. **Embodied strategic control:** one directly piloted ship is the interface to a full territorial campaign.
3. **Legible systemic rivals:** intelligence exposes intent, destination, cargo/fuel state, and construction progress only when sensors or recent reports justify it.
4. **Trustworthy browser permadeath:** atomic persistence, leases, journalling, and sealed records make finality feel intentional.
5. **Touch-native parity:** joystick, throttle, tap targeting, contextual interactions, and large special controls support the same campaign rather than a simplified mobile fork.

### 2.6 Rejected positioning alternatives

| Alternative | Decision | Reason |
|---|---|---|
| “A clone/remake of a named older game” | Rejected | It undersells the original product, creates IP risk, and directs implementation toward copied expression rather than the approved one-ship 4X promises. Inspiration may be documented internally; shipped identity and content must be original. |
| “A faster/shorter 4X” as the primary claim | Rejected | The 45–75 minute `10x10` target does not prove category-leading brevity. The defensible promise is faster decisions and lower friction. |
| “A space combat game with a strategy layer” | Rejected | Standard weapons auto-fire at the selected target and planning can pause. Tactical combat supports the strategic loop; it is not the sole or dominant product. |
| “A fleet-command 4X made mobile” | Rejected | The flagship is the only player-controlled ship. Fleet UI and fleet production would destroy the focus and scope boundary. |
| “A hardcore economic simulation” | Rejected | Markets create bounded hauling and supply decisions without spreadsheet-level micromanagement. Economic complexity must remain inspectable and recoverable. |
| “A roguelite with permanent power progression” | Rejected | Every campaign starts on equal mechanical footing. Between-run rewards are records, achievements, statistics, and cosmetic silhouettes only. |
| “An always-online living galaxy” | Rejected | The product is static-hosted, offline-first, account-free, and local-save-only. |
| “Unpausable real-time strategy” | Rejected | Pause during planning is an intentional accessibility and product choice. No catch-up simulation runs after pause or tab hiding. |

### 2.7 Context acceptance criteria

- A reviewer can describe Venture Star without naming another game and still identify the one-ship 4X structure, direct flight, procedural toroidal galaxy, shared-rule rivals, dual acquisition paths, and permadeath record.
- Store copy and in-game text contain no copied third-party names, lore, UI strings, faction concepts, asset derivatives, or promises unsupported by a release gate.
- The v0 onboarding and telemetry-free test harness can demonstrate each first-five-minute beat using local deterministic instrumentation.
- Desktop and mobile acceptance runs reach the same strategic states using their native control schemes.
- At least one victory test uses peaceful acquisition and at least one uses bombardment; neither requires a player fleet.
- A campaign may be paused indefinitely without strategic penalty or simulation catch-up.

## 12. Cut List

### 12.1 Scope vocabulary

- **v0:** required for the first polished vertical slice. A missing v0 item blocks declaring the core concept proven.
- **v0.1:** approved strategy-layer expansion after v0 quality gates pass. These items remain in the target but must not block completion of v0.
- **Later/full target:** approved destination after v0.1. Architecture must avoid making these impossible, but v0 must not build speculative UI or simulation merely to expose them early.
- **Rejected:** outside the product direction. Do not implement without reopening product approval.

Deferral is not cancellation. The full `30x30`, three-rival product target remains approved. When a later feature needs a data hook in v0—for example save schema versioning, seeded content IDs, or support for multiple faction pattern identifiers—implement the smallest hook, not the deferred feature.

### 12.2 v0 committed scope

| Area | Include in v0 | Explicit v0 boundary / acceptance |
|---|---|---|
| Campaign setup | Reproducible seed, `10x10` galaxy, one rival, 8–12 planets. | No size selector beyond `10x10`; seed replay exists after a sealed run. Same seed plus same ruleset version yields the same generated galaxy. |
| Generation | Toroidal sectors, separated origins, safe home, opening-envelope validation, danger by shortest wrapped distance plus bounded regional variation. | Reject invalid openings before player control. Galaxy map draws wrap-aware route and named danger bands. |
| Space content | Planets, mineable nodes, one hazard type, two rewarding discovery types. | Each included discovery has a mechanical effect and distinct reveal; other interviewed content remains deferred below. |
| Flight | Direct desktop and touch steering, throttle/speed, braking, sector transition, edge wrap, camera, pause. | Keyboard bindings fixed; mobile is feature-parity. Hidden tab pauses and produces no catch-up. |
| Autopilot | Tap/click destination, route preview, fuel/danger preview, arrival within interaction range, hostile interruption. | No wormhole routing. Manual input cancels or overrides according to the mechanics spec. |
| Mining | Automatic extraction in range, assisted station-keeping, lock and pulse feedback, interruption reasons, cargo limit. | No mining minigame and no deployable mining fleet. |
| Economy | Opening trade loop, local buy/sell, fuel purchase, distinct practical material sinks sufficient for v0 acquisition/defence/equipment. | Use deliberately bounded/simple v0 prices; the full adaptive market and exotic material are v0.1. No spreadsheet UI. |
| Flagship equipment | Six equipment types spanning the necessary v0 trade-offs; dock-only buy, sell, fit, and swap; limited slots. | Research-gated inventory and broad catalogue are deferred. No remappable controls or cosmetic stat bonuses. |
| Fuel | Negligible cruise consumption, acceleration cost increasing with speed, cheap friendly refuel, permitted neutral refuel at higher cost, emergency reserve. | Reserve travel is slow and disables combat/mining; no run can soft-lock only because normal fuel reached zero. Rival ship obeys corresponding range constraints. |
| Combat | Selected-target standard auto-weapon, readable shields/armour/hull resolution, one manual bombardment consumable, destruction and disengagement rules. | No player wingmen, weapon skill tree, or large special-weapon suite. Consumable use has the specified confirmation/error feedback. |
| Planet acquisition | Simplified peaceful influence path and simplified military path; ownership affects refuel/refit and victory. | No dialogue trees, infrastructure damage simulation, orbital-defence production, or deep trust model in v0. |
| Planet operation | Automatic baseline contribution after acquisition. | Player-assigned planet roles and deeper development tracks are v0.1. No worker/building placement. |
| Rival | One independent rival explores, mines, trades, influences, conquers, uses fuel, and rebuilds its exploration ship at a valid shipyard using cost and time. | Offscreen tactics resolve at fixed cadence; v0 need not simulate rival-vs-rival war because only one rival exists. No hidden free resources. |
| Intelligence | Geography fog and discovery persistence; enough direct/current visibility to understand the one rival's required opening action. | Full sensor networks, stale ownership, stale prices, and recent-intelligence ageing are v0.1. |
| Victory/defeat | Control every planet to win; flagship destruction to permanent defeat; both seal campaign record. | Capitulation is v0.1, so v0 balance and planet count must keep cleanup tolerable. |
| Persistence | Atomic versioned local autosave/resume, recovery journal, active-tab lease, explicit death transaction, sealed read-only records. | Repair snapshot may recover corruption but never undo a confirmed death. No cloud/account dependency. |
| Records | Outcome, seed, ruleset version, final known map, timeline of major v0 events, discoveries, duration, and core statistics; replay/new-seed actions. | Detailed comparisons, achievements, and cosmetic unlocks are later. JSON export/import is v0.1. |
| UX/accessibility | Responsive HUD, scalable text, faction pattern plus colour, reduced motion, optional screen shake, pause-anytime, documented fixed controls, touch-sized actions. | Optional contextual tutorial is v0.1; v0 still needs concise embedded prompts sufficient for first use. |
| Visuals | Original minimal vector science-fiction source assets rendered through the selected performant scene layer; DOM reserved for menus/HUD. | Restrained effects and phone-readable silhouettes. No animated DOM-SVG swarm and no third-party game-derived art. |
| Audio | No audio ships. The game is intentionally silent in every release layer. | Do not add audio files, a mixer, sound settings, browser audio unlock, audio preload, or audio-specific tests. All feedback is visual/textual, with optional haptics where supported. |
| Delivery | Static build, GitHub Pages subpath support, offline core after load, supported desktop/mobile browser floor, deterministic test hooks. | No runtime server, analytics, login, or cloud database. |

### 12.3 v0.1 deferred strategy layer

The following are required for v0.1 and excluded from the v0 critical path:

| Feature | v0.1 minimum | Reason deferred from v0 |
|---|---|---|
| Map expansion | Rectangular dimensions from `10x10` through `15x15`; setup recommends rival count by area. | Requires pacing/performance evidence from the fixed v0 map. |
| Second rival | Two rivals with separated origins, independent goals, AI-vs-AI influence/conquest, and attributable ownership changes. | Multilateral outcomes multiply simulation and readability cases. |
| Research | Compact empire-wide research with explicit prerequisites, costs, durations, and equipment/ability unlocks. | v0 can prove refit trade-offs without a tree. |
| Exotic material | Rare fourth material with distinct advanced-research/equipment sinks and guaranteed recovery safeguards. | Avoids four-material-plus-fuel tuning before the base economy is stable. |
| Planet roles | Mining world, fortress, research hub, and shipyard role assignment over capacity-limited development tracks. | Role balance depends on tested campaign pacing. |
| Adaptive markets | Bounded price response to stock, supply/demand, danger, control, relations, and player transaction pressure. | Needs automated economy sweeps to rule out runaway arbitrage and dead economies. |
| Sensors/intelligence | Friendly coverage, current mobile contacts/ownership, stale price and ownership reports, visible report age. | Geography fog alone is enough to prove v0 exploration; ageing introduces more UI states. |
| Content expansion | Additional hazards and positive discovery types, including rare high-impact finds with distinctive reveals. | Content breadth follows validation of the core content pipeline. |
| Defences/damage | Orbital defences, shield-breaking bombardment, infrastructure damage and repair. | v0 needs only a simplified proof of forceful acquisition. |
| Tutorial | Disable-anytime, non-blocking contextual sequence for flight, mining, trade, upgrades, diplomacy, and conquest. | Build after final v0 interactions stop moving. |
| Portable saves | JSON export/import, schema validation, migration rules, checksum, and honest anti-tamper wording. | Local persistence integrity is the earlier blocker; portability expands hostile-input handling. |
| Capitulation | Surrender when no functioning shipyard and below the specified control threshold; federation path for sufficient peaceful influence. | Needed as map/rival count grows; not necessary for 8–12 planets if v0 is tuned correctly. |
| Richer records | Expanded statistics and timeline events covering research, roles, market shifts, rival wars, damage, and capitulation. | Depends on v0.1 systems. |
| Audio of any kind | Music, ambience, UI sounds, and gameplay effects are excluded by the player's 2026-09-07 scope decision. | No audio architecture is reserved; reconsider only through a new explicit product decision. |

### 12.4 Later/full-target deferrals

| Feature | Full-target boundary | Guardrail now |
|---|---|---|
| Galaxy scale | Rectangular selections through `30x30`, up to 900 sectors. | IDs, coordinates, path APIs, save fields, and render culling must not assume `10x10`; do not simulate 900 sectors in v0 merely to prove this. |
| Third rival | Up to three independent rivals with deeper personalities, economy, diplomacy, negotiation, war, and reconstruction. | Faction data must be keyed, patterned, and serialisable rather than hard-coded as “enemy.” |
| Deeper shared-rule simulation | Broader faction economy and diplomacy while retaining fixed-cadence offscreen tactical abstraction. | Strategic actions always declare legal prerequisites, cost, duration, and outcome. |
| Advanced topology | Wormholes, wormhole-aware routing, and additional route decisions. | Pathfinding interface accepts future edge types; v0 route UI exposes ordinary wrap edges clearly. |
| Broad discovery pool | Asteroid fields, ion storms, derelicts, anomalies, treasure asteroids, abandoned cargo, ancient technology, rich veins, rescue opportunities, hidden markets, unique artifacts, and other original content. | Content uses stable typed definitions and seeded IDs. Do not ship placeholder copies of genre-famous artefacts. |
| Rich planetary development | Deeper economy, mining, defence, research, and shipyard capacity interactions with meaningful specialisation. | v0.1 role model must be data-driven and capacity-limited. No city-builder conversion. |
| Expanded progression | Larger research/equipment/artifact space and minor within-run core improvements. | No cross-run mechanical power. Slots must continue to force loadout trade-offs. |
| Metagame records | Achievements, discovery compendium, statistics, cosmetic ship silhouettes, detailed timeline and seed/run comparison. | Record format should retain ruleset version and stable event/content IDs. Cosmetics confer zero mechanical benefit. |
| Expanded presentation | Larger original SVG inventory and additional restrained effects. | Maintain reduced-motion equivalents, offline packaging, and mobile budgets; remain silent. |

### 12.5 Permanently rejected scope

| Rejected item | Mechanical exclusion | Rationale |
|---|---|---|
| Online multiplayer | No matchmaking, network authority, PvP sync, co-op sync, or remote session service. | Conflicts with offline-first static deployment and multiplies determinism, persistence, and balance scope. |
| Player-controlled fleets | No selection groups, formations, fleet orders, player patrol ships, or fleet tactical screen. | Violates the defining one-flagship fantasy. |
| Dialogue-tree diplomacy | No branching authored conversations as the acquisition mechanism. | Diplomacy is systemic and action-driven. |
| Permanent mechanical upgrades between runs | No inherited stats, research, equipment, currency, planet bonuses, or easier starts. | Every seed begins on equal footing; only cosmetics and records persist. |
| Server accounts and cloud saves | No login, cloud profile, cloud database, or required backend. | Conflicts with local ownership and static/offline operation. |
| Remappable keyboard bindings | v0/full target documents fixed `WASD`, arrows, targeting, and special hotkeys. | Interview explicitly chose fixed bindings; reopening this requires a product/accessibility decision and new settings scope. |
| Unbounded market simulation | No unlimited price movement, infinite stock, lossless instant arbitrage, or requirement to track spreadsheet-scale data. | Markets should create route choices without destabilising the campaign. |
| Cryptographic save-security claim | No claim that public client code makes local saves tamper-proof. | Schema validation and checksums detect corruption/casual modification but cannot guarantee authenticity. |
| Always-running simulation | No simulation progress during pause, hidden-tab time, closed-app time, or management screens. | Planning-friendly pause is intentional and prevents browser lifecycle surprises. |
| Photorealistic/3D production target | No dependency on high-detail 3D models, cinematic rendering, or photoreal assets. | The approved style is clean, minimal, original 2D vector science fiction. |
| Third-party-derived identity | No copied names, factions, story, interface composition, sprites, sound, text, or distinctive terminology. | Venture Star must stand on original IP and independently specified mechanics. |

### 12.6 Tempting features explicitly held out of scope

These ideas are neither approved full-target commitments nor permission to prototype in the shipping branch: ship crews and character relationships, narrative campaign chapters, user-authored maps, mod/plugin APIs, daily challenges, leaderboards, achievements with gameplay bonuses, base-building placement, commodity futures, manual factory queues, boarding, ground combat, controllable drones, real-time co-op, synchronous PvP, voice acting, procedural dialogue generated at runtime, and monetised cosmetics.

If proposed later, each requires a separate product decision. Their absence must not be represented as an incomplete implementation of the current spec.

### 12.7 Scope-change protocol

A feature may move between layers only when the spec change records:

1. the player problem it solves;
2. the release gate it changes;
3. new mechanics, UI, content, save, performance, and test obligations;
4. which existing feature or budget is removed or relaxed in exchange;
5. whether deterministic seeds or save compatibility change;
6. whether the move weakens the first-five-minute contract, one-ship identity, offline-first constraint, accessibility parity, or shared-rule AI promise.

A rejected feature cannot enter implementation through “future-proofing.” Only interfaces or schema fields directly required by an approved later feature may be added early, and they must have no unfinished player-facing surface.

### 12.8 Cut enforcement gates

- v0 planning contains no implementation story whose sole player value belongs to v0.1 or later.
- Every v0 story maps to at least one v0 proof gate and has an automated or manual acceptance test.
- Content counts are tested as exact layer bounds: v0 has one hazard type and two rewarding discovery types, not placeholders for the full pool.
- The setup screen cannot select a configuration unsupported by the release layer.
- Save files record a ruleset/schema version so a later expanded generator cannot silently reinterpret an old seed.
- Deferred UI controls are absent, not disabled “coming soon” clutter.
- Rejected systems have no dormant production code, save fields, menus, or tutorial copy unless a separately approved change reopens them.
- Before v0.1 work begins, the v0 campaign must pass its completion, first-five-minute, persistence, touch/desktop parity, accessibility, deterministic-generation, and performance gates.
- Before expanding past `15x15` or two rivals, automated simulation must demonstrate that economy, AI cadence, route planning, save size, and rendering remain inside the budgets defined elsewhere in this specification.
