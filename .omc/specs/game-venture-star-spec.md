# Game Spec: Venture Star

> Composed from parallel authoring. This assembled document is the canonical product, mechanics, implementation, asset, and test specification.

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

## 3. Core Loops

This section is normative. Time values use **active simulation time** unless explicitly labelled wall-clock time. Active simulation time advances only while the simulation state is `RUNNING`; it does not advance while paused, while a blocking interface is open, while the document is hidden, or while another tab owns the campaign lease. All thresholds are inclusive unless stated otherwise.

### 3.1 Loop invariants

The following invariants apply to every release layer and every difficulty:

1. The player controls exactly one flagship. A destroyed flagship ends the campaign immediately and permanently.
2. The shortest satisfying loop is `scan -> approach -> interact -> receive feedback -> choose next destination`. A competent player must complete this loop within 30 seconds of launch.
3. The first economic loop is `mine -> carry -> dock -> sell -> fit an upgrade -> perceive the upgrade`. Every generated campaign must make this achievable by 180 seconds and must expose and preserve every required opening opportunity through 300 seconds without granting free ownership, free combat victory, or a hidden resource subsidy.
4. The standard five-minute loop is `observe opportunity -> travel -> extract/trade/influence/fight -> improve flagship or territory -> reveal a strategic consequence`.
5. The macro loop is `expand sensor reach -> acquire specialized planets -> deny rival capacity -> trigger capitulation or federation -> control every planet`.
6. Every player-facing decision is made with the simulation paused when a blocking management screen is open. No elapsed real time during a pause creates production, movement, fuel consumption, research, combat, market drift, construction, or AI decisions.
7. AI factions pay the same listed material and time costs for strategic actions. Offscreen resolution may be abstracted, but it advances only on the simulation cadence and exposes the same economically relevant state when intelligence permits.
8. No state transition may depend on frame rate. The authoritative simulation uses fixed ticks; rendering interpolates and is non-authoritative.
9. A campaign can be won only when all existing planets are under player control, including planets transferred through surrender or federation. A surrendered or federated faction has zero independent planet ownership after the transfer transaction.
10. A sealed run is immutable. Replay creates a new campaign identifier even when it reuses the same generation seed.

### 3.2 Time domains and pacing clock

| Clock | Advances when | Rate | Uses |
|---|---|---:|---|
| `wallClockMs` | Always, from a monotonic browser clock | Real time | lease expiry, debounce, UI animation; never simulation outcomes |
| `simTick` | `RUNNING` and active tab owns lease | 20 Hz, fixed 50 ms | flight, weapons, mining, sensors, fuel, collision |
| `strategyTick` | Every 20 simulation ticks | 1 Hz | production, market pressure, influence, AI high-level orders |
| `campaignSecond` | Every 20 simulation ticks | 1 active second | opening and pacing milestone measurement |
| `simulationDuration` | Exactly while authoritative simulation ticks execute | 1 second per 20 ticks | deterministic state, replay, records; excludes every pause reason |
| `engagedDuration` | Running flight or a visible management/Galaxy view; not explicit pause, hidden, lease loss, or recovery | Real engaged time | 45–75-minute pacing target and records |
| `wallSpan` | Campaign start through terminal seal | Real elapsed time | record context only; never simulation outcomes |
| `renderFrame` | Browser requests a frame and document is visible | target 60 Hz, minimum supported 30 Hz | interpolation and presentation only |

On a delayed frame, the engine may process at most five 50 ms simulation ticks before rendering. Any additional accumulated time is discarded and logged as `CLOCK_CLAMP`; it is never caught up. This prevents tab throttling or device stalls from producing bursts of combat or economic simulation.

### 3.3 Moment-to-moment loop: launch through 30 seconds

#### 3.3.1 Guaranteed initial presentation

At campaign creation the flagship is docked at the player's home planet with full hull, full armour, full shields, 80% fuel, empty cargo, the starter mining beam, starter pulse cannon, starter scanner, and one open equipment choice described by the opening market offer. The camera begins centered on the flagship at tactical zoom `1.0`. The home planet, first resource node, sector-exit direction, fuel meter, cargo meter, and current objective are visible without opening another screen.

Generation places the flagship's launch point so that:

- clear space extends at least `3.0 ship lengths` forward;
- the first mineable node is `6–9 active-flight seconds` away at 70% throttle;
- the nearest sector boundary is `10–14 active-flight seconds` away at 100% throttle;
- neither route intersects a damaging hazard;
- no hostile can enter weapon range before campaign second 90;
- the starter scan has at least one unknown contact in its outer pulse.

#### 3.3.2 Exact 0–30 second choreography

The pre-launch row uses visible wall-clock time because the simulation is paused. The authoritative 30-second gameplay measurement begins when `LAUNCHING` ends and `FREE_FLIGHT` starts; all later `campaignSecond` values refer to that clock. Launch animation time is presentation-only and cannot advance simulation outcomes.

| Time | Required system state | Player action | Immediate feedback | Timeout behavior |
|---:|---|---|---|---|
| `0.000–1.000 s` | `DOCKED_INTRO`; simulation paused | Observe; press/tap `Launch` | Home name, role, fuel forecast and “Launch — no fuel cost” CTA; one 700 ms scan sweep | At 1 s, launch CTA gently pulses once; no auto-launch |
| Launch input | transition to `LAUNCHING` | Confirm launch | CTA depresses within 50 ms; launch chevrons appear; ship clears dock along fixed 1.5 s spline | Input is accepted once; duplicate input ignored |
| `launch+1.500 s` | transition to `FREE_FLIGHT`; clock begins | Steer or set destination | Control hint shows both direct steering and tap-to-autopilot; throttle starts at 35% | If no movement input for 4 s, first node gets a route chevron |
| first movement input | `MANUAL_FLIGHT` or `AUTOPILOT` | Hold steering / tap node | Thrust appears within one rendered frame; projected stopping arc and fuel delta appear | None |
| `campaignSecond 6–12` | flagship enters node assist shell | Reduce throttle below 25% or allow autopilot arrival | Range ring snaps from dashed to solid; ship eases into assisted orbit | Autopilot always stops inside lock band; manual player receives “Ease throttle to lock” hint after 2 s in shell |
| lock maintained `0.350 s` | `STATION_KEEPING` | Release steering | Mining beam connects and first extraction pulse begins | If player steers or raises throttle above 35%, lock breaks immediately |
| lock maintained `2.000 s` | `MINING` | Continue holding position | First cargo unit arrives; node flashes; cargo counter increments; value-at-home appears | Tutorial objective advances only after authoritative cargo increment |
| first cargo unit | `MINING` | Choose to continue or depart | Home route displays travel time and expected sale value; scan contact remains marked | If cargo reaches starter capacity, mining stops and “Cargo full” route CTA appears |
| by `campaignSecond 24` | at least one cargo unit acquired | Tap home route or steer elsewhere | Autopilot path, fuel forecast, wrapped route icon if applicable | If player has not mined, objective remains non-modal and no resources are granted |
| by `campaignSecond 30` | `RETURNING`, `MINING`, or freely exploring | Continue chosen action | HUD shows one completed verb, one current goal, and one optional scan lead | Opening monitor records pass/fail telemetry locally; it never changes outcomes |

The 30-second acceptance condition is satisfied when the run history contains `LAUNCH`, `FLIGHT_INPUT`, `RANGE_LOCK`, and `CARGO_GAIN` events by campaign second 30. Automated input following the displayed hints must satisfy it by second 22 on all accepted seeds. A first-time human playtest passes when at least 8 of 10 participants satisfy it by second 30 without verbal coaching.

#### 3.3.3 Tactical interaction state machine

```text
DOCKED_INTRO
  --Launch--> LAUNCHING
LAUNCHING
  --1.5 active s--> FREE_FLIGHT
FREE_FLIGHT
  --manual thrust/turn--> MANUAL_FLIGHT
  --destination selected + route valid--> AUTOPILOT
MANUAL_FLIGHT
  --inside assist shell + throttle <=25% + no steering for 0.35 s--> STATION_KEEPING
AUTOPILOT
  --arrival within lock band--> STATION_KEEPING
AUTOPILOT
  --hostile target enters alert range OR route invalid OR manual input--> FREE_FLIGHT
STATION_KEEPING
  --lock held 2.0 s + node extractable + cargo space--> MINING
STATION_KEEPING
  --steering magnitude >0.15 OR throttle >35% OR impulse damage--> FREE_FLIGHT
MINING
  --cargo full OR node depleted--> STATION_KEEPING
MINING
  --hostile enters weapon range--> COMBAT_LOCKED
MINING
  --lock broken--> FREE_FLIGHT
FREE_FLIGHT|MANUAL_FLIGHT|AUTOPILOT|STATION_KEEPING|MINING
  --hostile selected and in weapon range--> COMBAT_LOCKED
COMBAT_LOCKED
  --no hostile in alert range for 5.0 s--> FREE_FLIGHT
ANY LIVE FLIGHT STATE
  --hull <=0--> DEATH_PENDING
ANY NONTERMINAL STATE
  --pause request, management screen, hidden document, or lease loss--> PAUSED
PAUSED
  --all pause reasons cleared and player confirms Resume--> prior state
```

State entry and exit are event-sourced. A state transition is committed once per simulation tick; contradictory transitions in the same tick resolve in this priority order: `DEATH_PENDING`, `PAUSED`, `COMBAT_LOCKED`, interaction state, movement state.

### 3.4 Opening envelope: guaranteed first five minutes

#### 3.4.1 Generator acceptance contract

A seed is playable only after a deterministic opening-envelope validator proves all conditions below. Validation uses an optimal but rules-legal reference agent, includes acceleration, braking, docking, mining pulse timing, cargo capacity, market stock, fuel burn, and mandatory UI dwell times, and assumes no optional combat. It may not teleport, reveal hidden information, ignore collision, or use unreleased equipment.

For every accepted galaxy:

1. **Safe home:** the home planet has a shipyard, market, fuel stock of at least `4 starter-tank equivalents`, and buy liquidity equal to at least `3 full starter cargo holds` of common ore. No damaging hazard intersects the home planet, first node, or their shortest route.
2. **Profitable first loop:** one common-ore node is within `12 active-flight seconds` of launch, contains at least `16 units`, and permits mining `13 units` within the opening time budget. The player can retain the required ore component, sell the remainder at the guaranteed home quote, and buy the offered module with at least `10 credits` remaining after round-trip fuel.
3. **Consequential upgrade:** the home market reserves exactly one highlighted starter module until campaign second 300 or purchase: Deepglass Drill T1 at `320 credits + 4 ore` or Folded Hold T1 at `300 credits + 6 ore`. Its exact visible effect is §5.5 extraction `4.0→5.2 units/s` or cargo `24→36`.
4. **Positive discovery:** a rewarding discovery lies within a route of at most `25 active-flight seconds` from home after the first upgrade and requires no combat. In v0 it is either abandoned cargo containing `6–16` generated units weighted to local demand or a treasure asteroid yielding `20–60 credits + 4–12 common ore`, per M25.
5. **Intriguing scan:** the positive discovery generates an unidentified scan bearing no later than campaign second 45 when the player follows the reference route. The signal names a category (“structured echo” or “dense crystalline return”), not its reward.
6. **Readable rival action:** the rival owns a known origin planet and completes one visible, non-hostile strategic action between campaign seconds 210 and 285. Valid actions are launching an explorer, beginning a mine delivery, starting influence on a neutral planet, or starting shipyard reconstruction. The alert states actor, action, destination, listed cost category, and expected completion window. It reveals no information outside opening-level intelligence.
7. **Strategic consequence:** by campaign second 300 the player can see at least one ownership/influence change, rival construction progress, or newly viable player route caused by their upgrade/discovery. A purely cosmetic timeline entry does not qualify.
8. **Fuel safety:** the reference route `home -> first node -> home -> positive discovery -> home` ends with at least 35% normal fuel. Emergency reserve is not counted.
9. **No forced hostility:** no AI attack order, hostile mobile spawn, or damaging storm occupies the reference route before second 300. The player may voluntarily provoke combat, which voids only the timing guarantee for that run, not seed validity.
10. **No hidden dependency:** the envelope remains achievable on Explorer, Captain, and Strategist. Difficulty may change later opposition but not the opening node amount, first upgrade price, opening reward value, or protected-hostility window.

The generator makes 256 deterministic procedural attempts from the SHA-256 `opening-attempt:<index>` substreams. If all fail, attempt 257 applies the deterministic repair pass in M02, records repair metadata, and revalidates. Campaign creation never exposes a rejected or partially validated galaxy.

#### 3.4.2 First-five-minute target timeline

| Campaign time | Mandatory opportunity or outcome | Success evidence |
|---:|---|---|
| `0–30 s` | Launch, responsive flight, assisted station-keeping, first cargo | Required event quartet in §3.3.2 |
| `30–75 s` | Mine 13 opening ore and return home | `CARGO_GAIN` reaches 13 and `DOCK_BEGIN` |
| `75–105 s` | Retain the module material component, sell the remainder, and expose upgrade comparison | Post-sale credits/materials satisfy the reserved module cost plus 10-credit remainder; before/after metric is shown numerically |
| `105–180 s` | Buy and fit highlighted upgrade, then perform affected verb once | `EQUIPMENT_FITTED`; measured affected metric improves at least 20% |
| `120–210 s` | Receive intriguing scan and begin optional discovery route | unknown contact appears with bearing, distance band, and risk `Haven` |
| `180–240 s` | Claim positive discovery | reward transaction and distinctive reveal complete |
| `210–285 s` | Observe readable rival action | structured timeline alert with actor/action/destination/cost/progress |
| `285–300 s` | Open galaxy map or receive map inset showing consequence and two next choices | one consequence marker plus exactly two recommended objectives: economic and strategic |

These are opportunity guarantees, not forced inputs. If the player idles or pursues an unrelated route, the campaign clock does not fabricate progress. The contextual tutorial escalates only presentation:

- after `8 s` without launch: pulse Launch CTA;
- after `12 s` of flight without approaching a target: show one route chevron;
- after `10 s` inside an interaction shell without locking: animate throttle-to-lock gesture;
- after cargo is full for `8 s`: highlight home route once;
- after docking with saleable cargo for `10 s`: highlight `Sell all common ore`;
- after sale with affordable opening upgrade for `12 s`: pin the comparison card;
- after second 210 with unread rival alert for `15 s`: expand its one-line summary once.

Hints never seize controls, execute trades, purchase equipment, or clear alerts. They disappear immediately after the corresponding action and can be disabled from the pause menu.

#### 3.4.3 Opening validator acceptance tests

- `LOOP-OPEN-001`: sweep `10,000` v0 seeds; 100% pass the validator or use the fallback template; zero campaigns start from an unvalidated topology.
- `LOOP-OPEN-002`: reference agent completes first cargo by 22 s, first profitable sale by 100 s, upgrade fit by 170 s, discovery claim by 235 s, and rival-action visibility by 285 s on every accepted seed.
- `LOOP-OPEN-003`: the reference route ends with at least 35% fuel and never invokes emergency reserve.
- `LOOP-OPEN-004`: Explorer, Captain, and Strategist produce identical opening-envelope resource quantities, opening upgrade affordability, and hostility protection for the same seed.
- `LOOP-OPEN-005`: intentionally fail all 256 procedural attempts; attempt-257 deterministic repair loads and satisfies all ten contract conditions.

### 3.5 Standard mid-loop: five-minute decision cycle

After the opening, play is organized into overlapping five-minute cycles. A cycle begins when the player commits to a tracked objective and ends on success, abandonment, supersession, or flagship death. The UI may track one primary and up to two optional objectives. An objective has an explicit expected duration, fuel estimate, known risk, required cargo/consumables, and reward category.

#### 3.5.1 Canonical cycle

```text
OBSERVE (10–25 s, usually paused)
  -> COMMIT (one objective and route)
  -> TRAVEL (30–90 s)
  -> ENGAGE (45–150 s: mine, trade, scan, aid, influence, or fight)
  -> CONVERT (20–60 s: sell, repair, refit, develop, or claim)
  -> CONSEQUENCE (5–15 s: map/timeline/state change)
  -> OBSERVE
```

Target active duration is `180–360 s`; median target is `270 s`. No required cycle on a 10x10 map may exceed `420 s` under reference-agent traversal unless it is explicitly labelled a multi-cycle objective. Management time does not count because the simulation is paused, but usability tests track it separately: median paused planning per cycle must remain below 60 wall-clock seconds after the tutorial.

#### 3.5.2 Objective families

| Family | Commit cost | Engagement | Conversion | Observable consequence |
|---|---|---|---|---|
| Prospect | route fuel | scan and hold range at node | cargo enters hold | price/value and next deposit revealed |
| Haul | cargo stock plus route fuel | travel through known risk | sell up to market demand | local price pressure and credit increase |
| Discover | route fuel and uncertainty | scan, approach, resolve one interaction | artifact/resource/intelligence reward | new map fact or capability |
| Aid/influence | credits or listed materials | deliver aid or maintain broadcast range | influence transaction | neutral alignment meter moves visibly |
| Assault | bombs, repair risk, route fuel | break shield/defences, survive return fire | occupy and repair | ownership changes; infrastructure may be damaged |
| Develop | planet capacity and materials | choose role/project while paused | wait listed production time | output, sensor reach, or defence changes |
| Deny rival | intelligence and intercept fuel | disrupt haul, outbid influence, or attack capacity | rival plan fails/delays | rival intent and recovery response update |

Every consequence produces three synchronized outputs within one strategy tick: tactical feedback, a concise timeline event, and an updated strategic-map marker. If intelligence is stale, the map shows “last confirmed” time rather than presenting hidden current state.

#### 3.5.3 Engagement pacing controls

- At least one actionable opportunity is available within `60 active-flight seconds` of every player-controlled planet on a validated 10x10 map.
- The objective recommender ranks known opportunities by `rewardUtility / (travelTime + engagementTime + recoveryTime)` and shows only the top economic and top strategic option; it never chooses automatically.
- Standard mining nodes pay their first unit after `2.0 s` locked and subsequent units at the fitted beam cadence. No node used for progression requires more than `40 s` of uninterrupted station-keeping.
- A peaceful influence action provides visible progress at least every `5 strategy ticks` and completes a meaningful stage in `30–90 active seconds` once prerequisites are met.
- Standard combat encounters target `20–55 s`; a planetary assault targets `45–120 s`. If neither side deals hull or defence damage for `20 s`, both receive a disengagement route cue; combat does not auto-resolve.
- Docking, selling a full homogeneous cargo stack, refuelling, repairing, and fitting one owned item can each be completed in no more than three player inputs from the dock overview.
- No more than three high-priority alerts may be presented at once. Further alerts queue by severity and are summarized; death threats, planet loss, and capitulation offers pre-empt lower-priority alerts.

#### 3.5.4 Mid-loop state machine

```text
AVAILABLE
  --player pins objective--> COMMITTED
COMMITTED
  --route confirmed--> IN_PROGRESS.TRAVEL
IN_PROGRESS.TRAVEL
  --interaction range reached--> IN_PROGRESS.ENGAGE
IN_PROGRESS.TRAVEL
  --fuel forecast becomes unsafe OR route invalid--> BLOCKED
IN_PROGRESS.ENGAGE
  --interaction requirements satisfied--> IN_PROGRESS.CONVERT
IN_PROGRESS.ENGAGE
  --player leaves range / target destroyed by other actor--> ABANDONED or SUPERSEDED
IN_PROGRESS.CONVERT
  --reward and costs atomically committed--> RESOLVED
RESOLVED
  --timeline/map feedback acknowledged or 15 s elapse--> AVAILABLE
BLOCKED
  --new safe route or required resource obtained--> COMMITTED
COMMITTED|IN_PROGRESS|BLOCKED
  --player selects Abandon--> ABANDONED
ANY NONTERMINAL OBJECTIVE STATE
  --flagship death--> FAILED_TERMINAL
```

Abandoning has no generic penalty; already spent fuel, ammunition, market pressure, infrastructure damage, and elapsed production remain. An objective whose target no longer exists becomes `SUPERSEDED`, records the causal event, and never silently retargets.

### 3.6 Session pacing and campaign phases

The campaign director is a presentation and validation system, not a rubber-band opponent. It may select recommendations and schedule already-budgeted neutral opportunities, but it may not change combat rolls, grant AI resources, modify prices outside published formulas, or spawn counterforces for pacing.

#### 3.6.1 Campaign phase thresholds

| Phase | Entry condition | 10x10 target time | Expected player control | Required strategic pressure |
|---|---|---:|---:|---|
| Opening | campaign starts | `0–5 min` | 1 home | rival action shown, no forced hostility |
| Foothold | opening upgrade fitted or second sector discovered | `5–15 min` | 1–2 of 8–12 planets | first neutral competition or safe skirmish opportunity |
| Contest | player owns at least 25% of planets or first direct conflict occurs | `15–35 min` | 25–50% | rival has at least one visible expansion/denial plan |
| Dominance | player owns at least 50% or any rival loses half its peak planets | `35–55 min` | 50–80% | assaults, defence, and surrender prerequisites become central |
| Resolution | only one independent rival remains or player owns at least 80% | `55–75 min` | 80–100% | capitulation/federation prevents rote cleanup |

These engaged-duration times are tuning targets on validated 10x10 one-rival maps, not automatic transitions. The phase is calculated from state first, with time used only for QA and local records. Explorer target completion is `40–65 min`; Captain is `45–75 min`; Strategist is `55–90 min`. A run outside its band remains valid, but automated balance sweeps fail if the median of 200 reference-agent runs or the human-playtest median lies outside the band.

#### 3.6.2 Planet-acquisition pacing

- A 10x10 v0 galaxy contains `8–12` planets including origins.
- The player must be able to begin a peaceful or military acquisition attempt by minute 8.
- Under reference play, first additional planet ownership occurs by minute 15, 50% ownership by minute 42, and the final resolution trigger by minute 70.
- No two required acquisitions may demand identical preparation in succession. The objective recommender suppresses a same-family recommendation after two completed cycles of that family unless it is the only safe route to victory.
- The maximum shortest wrapped flight time between any unresolved planet and the nearest player shipyard is `95 s` at baseline maximum cruise on 10x10. Generation or later ownership transfers that violate this constraint must provide a forward refuel site, wormhole in releases that support it, or a nearer acquisition order.

### 3.7 Macro-loop: campaign, save, and return

#### 3.7.1 Full-run loop

```text
NEW_CAMPAIGN
  -> VALIDATE_SEED
  -> ACTIVE.OPENING
  -> ACTIVE.FOOTHOLD
  -> ACTIVE.CONTEST
  -> ACTIVE.DOMINANCE
  -> ACTIVE.RESOLUTION
  -> VICTORY_PENDING or DEATH_PENDING
  -> SEALED_RECORD
  -> REPLAY_SAME_SEED or NEW_SEED or RECORD_BROWSER
```

During active play, the player repeats four linked growth loops:

1. **Knowledge loop:** enter sector -> scan -> preserve geography -> extend sensor coverage -> choose safer/more profitable routes.
2. **Flagship loop:** earn credits/materials -> research unlock -> buy/fabricate equipment -> fit limited slots -> perform a verb faster or survive greater danger.
3. **Territory loop:** aid/influence or assault -> acquire planet -> assign role -> receive production/sensors/repair -> project farther.
4. **Rival-pressure loop:** observe shared-rule intent -> contest its resource/planet/capacity -> force recovery spending -> remove shipyard capability -> offer or receive political resolution.

The four loops must remain coupled. Knowledge reveals opportunities; flagship capability makes them reachable; territory sustains range and production; pressure converts strength into victory. No loop alone may satisfy victory.

#### 3.7.2 Save/resume loop

- Autosave journal entries are appended after every authoritative economic transaction, ownership change, equipment change, objective resolution, sector transition, pause transition, and every `10 active seconds`, whichever occurs first.
- A compact snapshot is written every `60 active seconds` and when the player explicitly chooses Save & Quit.
- Resuming restores the latest snapshot plus valid later journal entries, then starts in `PAUSED.RESUME_REVIEW`. The simulation does not start until the player presses Resume.
- Resume Review displays campaign seed, active playtime, current sector, last five timeline events, current objective, fuel state, and whether recovery was required.
- There is no offline production, travel, research, market drift, healing, AI action, or danger while the app is closed.
- If a journal tail is corrupt, recovery truncates only invalid uncommitted entries. It may recover a live run from the last valid state but may never cross a committed `DEATH_CONFIRMED` or `VICTORY_CONFIRMED` record.

#### 3.7.3 Return motivation without meta-power

Completed and defeated campaigns contribute only to records: discovered object catalog, achievement flags, statistics, seed history, and cosmetic silhouette eligibility. They never alter starting credits, stats, equipment, generation odds, faction strength, or opening-envelope contents. The campaign-select screen presents `Resume`, `Replay seed`, and `New galaxy`; `Resume` is absent for sealed records.

### 3.8 Rival defeat resolution: capitulation and federation

Capitulation is part of the formal all-planets-control victory path and first ships in v0.1. It removes travel-only cleanup without bypassing a rival that can still recover meaningfully.

#### 3.8.1 Definitions

- `totalPlanets`: all extant planets in the galaxy.
- `factionPlanets`: planets independently owned by the evaluated rival.
- `controlShare = factionPlanets / totalPlanets`.
- `functioningShipyard`: rival planet with shipyard capacity at least 1, hull above 0, construction not disabled, and a legal fuel-range route to at least one rival-controlled or neutral sector.
- `militaryCapacity`: sum of living exploration ships plus queued replacement ships whose materials are already escrowed.
- `peacefulInfluenceShare`: population-weighted fraction of the rival's current planets where player peaceful influence is at least 70%.
- `warAtrocity`: player bombardment that destroyed civilian/economic infrastructure on a rival planet within the last `600 active seconds`.
- `strategicIsolation`: every rival planet is either inside player sensor coverage or has no legal fuel-range route to a neutral planet not blocked by player-controlled territory.

#### 3.8.2 Capitulation eligibility

A rival becomes `CAPITULATION_ELIGIBLE` only when all of the following remain true for `30 consecutive strategy ticks`:

1. it has no functioning shipyard;
2. `controlShare <= 0.20`;
3. `militaryCapacity == 0`;
4. it has no shipyard reconstruction project with at least 50% materials escrowed;
5. it has no mutual-defence partner able to reach one of its planets within `120 active seconds`;
6. either `strategicIsolation == true` or player control share is at least 70%;
7. at least `300 active seconds` have elapsed since campaign start.

When eligibility begins, the UI exposes a 30-second “command structure failing” countdown if current intelligence is sufficient. If any condition becomes false, the countdown resets to 30; partial time is not retained.

At eligibility completion, the rival pauses its aggression planner, continues local defence, and sends a capitulation offer. Opening the offer pauses the simulation. The player may `Accept`, `Demand federation` when federation conditions are met, or `Reject`.

- **Accept capitulation:** all rival planets, stockpiles, queued projects, sensor sites, and surviving defences transfer atomically to player control. Each transferred planet enters `Occupied` for `120 active seconds`, produces at 50%, cannot start a new project, and retains its current role. The faction ceases independent operation.
- **Reject:** the rival returns to normal planning after a `60 s` ceasefire. It cannot offer again for `300 active seconds` and only if it re-enters eligibility for a fresh 30 ticks.
- Capitulation cannot occur while an unresolved damage event could destroy the player's flagship in the same simulation tick; death priority applies.

#### 3.8.3 Federation eligibility and result

`Demand federation` is enabled only if all conditions below hold when an offer opens:

1. `peacefulInfluenceShare >= 0.60`;
2. no `warAtrocity` exists in the prior 600 active seconds;
3. player relation with the rival is at least `+60` on the `-100..+100` scale;
4. at least one trade, aid, or diplomatic-broadcast transaction with that rival completed in the prior `300 active seconds`;
5. the player has peacefully acquired at least one planet during the campaign.

Federation transfers all remaining rival planets and assets atomically to player control exactly as capitulation does, except:

- planets enter `Federated` rather than `Occupied`;
- Federated planets produce at 100% immediately;
- infrastructure takes no transition damage;
- their current projects continue without reset;
- the timeline labels the resolution `Federation`, and campaign statistics distinguish peaceful integration from surrender.

Federation does not create a subordinate AI, shared-control state, allied victory exception, or autonomous fleet. The rival political entity becomes inactive; formal ownership is player ownership, preserving the all-planets victory rule.

#### 3.8.4 Multi-rival ordering

Each rival is evaluated independently in ascending stable faction ID order on every strategy tick. Multiple offers that mature on the same tick are queued; the simulation pauses for one offer at a time. Transfers from the first offer recalculate eligibility for all remaining rivals before the next offer opens. Victory is evaluated only after the final accepted transfer transaction completes.

#### 3.8.5 Resolution tests

- `LOOP-END-001`: a rival at 20% control with zero shipyards and zero military triggers an offer after exactly 30 uninterrupted eligible strategy ticks.
- `LOOP-END-002`: restoring any functioning shipyard on tick 29 resets the countdown and prevents the offer.
- `LOOP-END-003`: accepting surrender transfers every rival-owned planet and asset in one transaction and applies Occupied for exactly 120 active seconds.
- `LOOP-END-004`: federation is unavailable at relation +59, peaceful influence 59.99%, or with an atrocity at age 599 s; it becomes available at the inclusive thresholds.
- `LOOP-END-005`: federation transfer gives immediate 100% production and retains project progress.
- `LOOP-END-006`: with two simultaneous eligible rivals, stable order, recalculation, and victory evaluation are deterministic for the same event log.

### 3.9 Win, loss, sealing, and retry

#### 3.9.1 Victory state machine

```text
ACTIVE
  --ownership transaction completes--> CHECK_VICTORY
CHECK_VICTORY
  --playerOwnedPlanets == totalPlanets AND flagship hull >0--> VICTORY_PENDING
CHECK_VICTORY
  --condition false--> ACTIVE
VICTORY_PENDING
  --append VICTORY_CONFIRMED + flush journal/snapshot--> SEALED_VICTORY
SEALED_VICTORY
  --presentation complete or skipped--> RECORD_SUMMARY
```

Victory checking occurs after all ownership transfers and damage for the current simulation tick. If the same tick produces all-planets ownership and flagship hull `<=0`, defeat wins the priority tie and the campaign seals as defeat. `VICTORY_PENDING` immediately pauses the simulation, rejects further gameplay input, and begins the seal transaction.

Victory requires `playerOwnedPlanets == totalPlanets`. Neutral, abandoned, hostile, allied, federated-but-not-transferred, or undiscovered planets prevent victory. The galaxy generator records total planet count in the immutable campaign header, so hidden planets cannot disappear from the condition.

#### 3.9.2 Death and permadeath state machine

```text
ACTIVE
  --flagship hull <=0 after damage resolution--> DEATH_PENDING
DEATH_PENDING
  --freeze simulation + reject input--> DEATH_COMMITTING
DEATH_COMMITTING
  --append DEATH_CONFIRMED and durable sealed snapshot--> SEALED_DEFEAT
DEATH_COMMITTING
  --storage write fails--> DEATH_COMMIT_RETRY
DEATH_COMMIT_RETRY
  --write succeeds--> SEALED_DEFEAT
DEATH_COMMIT_RETRY
  --three writes fail--> MEMORY_SEALED_DEFEAT + export prompt
SEALED_DEFEAT|MEMORY_SEALED_DEFEAT
  --presentation complete or skipped--> RECORD_SUMMARY
```

On entry to `DEATH_PENDING`, authoritative simulation stops on that exact tick. Controls, pause toggles, navigation, save import, and tab handoff cannot restore a live state. The client immediately marks the in-memory campaign sealed, then persists `DEATH_CONFIRMED` with tick, cause, attacker, location, and pre-damage checksum. The sealed-record panel appears at `1.2 s` normally or after a `500 ms` static wreck in reduced-motion mode; both reveal the same cause and final values. Skipping presentation never skips sealing.

The previous backup snapshot is retained for corruption repair but contains a seal fence referencing the confirmed death. Loading it reapplies the death record; it cannot become a live resume point. If durable storage fails three times at `0 ms`, `250 ms`, and `1000 ms`, the UI remains in memory-sealed defeat and offers immediate record export. It never resumes gameplay in that page lifetime.

#### 3.9.3 End summary and retry choices

The record summary includes outcome, active duration, wall-clock span, seed, difficulty, map size, planets acquired peacefully/by force/by surrender/by federation, discoveries, flagship loadout at end, cause of death if applicable, timeline, and final known galaxy map.

Exactly three primary actions are available:

1. `Replay same seed`: creates a new campaign ID and attempt number with identical galaxy topology/content and setup options. AI behavior remains deterministic given identical player actions. No map knowledge, resources, research, or equipment carries into the new run.
2. `Generate new galaxy`: retains only setup UI preferences and cosmetics; creates a new random seed and campaign ID.
3. `Return to records`: leaves the sealed record unchanged.

There is no Continue, Undo, Restore backup, rewind, checkpoint reload, or confirmation loophole after `DEATH_CONFIRMED`. Before starting either retry, the UI states “New attempt — previous record remains sealed.” Creating a retry never overwrites or mutates the prior record.

#### 3.9.4 Terminal-state tests

- `LOOP-TERM-001`: simultaneous final ownership and fatal damage resolves to sealed defeat.
- `LOOP-TERM-002`: refresh, crash recovery, import, and duplicate-tab takeover after `DEATH_CONFIRMED` all reopen the sealed record, never a playable snapshot.
- `LOOP-TERM-003`: same-seed replay matches immutable generation hashes for sectors, planets, nodes, discoveries, hazards, and faction origins but has a distinct campaign ID.
- `LOOP-TERM-004`: new-seed retry retains no mechanical advantage from the prior record.
- `LOOP-TERM-005`: undiscovered neutral planet prevents victory until acquired.

### 3.10 Pause, management screens, hidden documents, and duplicate tabs

#### 3.10.1 Pause reason model

Pause is a set of reasons, not a toggle boolean. The authoritative state is paused while the set is non-empty.

| Reason | Added when | Cleared when | Resume confirmation required |
|---|---|---|---|
| `USER` | player presses pause or `Escape` from flight | player presses Resume | Yes |
| `MANAGEMENT` | dock, market, research, equipment, planet management, diplomacy, galaxy planning, records overlay opens | final blocking management screen closes | No if it was the only reason and document remained visible |
| `HIDDEN` | `document.visibilityState !== 'visible'` or page enters freeze/pagehide | document visible and page active | Yes |
| `LEASE_LOST` | another tab owns campaign lease or local lease cannot be renewed | this tab acquires lease through explicit Take control | Yes |
| `RESUME_REVIEW` | campaign loaded/recovered | player presses Resume | Yes |
| `TERMINAL` | victory/death pending or record sealed | never | Not applicable |

Opening a blocking management screen must pause before its contents become interactive. The pause badge and dimmed tactical backdrop appear within one render frame. Nested management screens add only one `MANAGEMENT` reason; it clears after the final blocking screen closes.

If only `MANAGEMENT` was active and visibility never changed, closing the final screen resumes immediately to the prior live state after a visible `3, 2, 1` countdown of `300 ms` per numeral (`900 ms` wall-clock total). The simulation remains paused during the countdown. Any steering, fire, or special-weapon input during the countdown cancels auto-resume and adds `USER` pause, preventing accidental action.

#### 3.10.2 Hidden-tab behavior

On `visibilitychange` to hidden, `pagehide`, or browser freeze notification:

1. add `HIDDEN` synchronously before the next simulation tick;
2. stop scheduling authoritative simulation and AI work;
3. append a pause journal entry containing the last completed tick;
4. flush a compact snapshot when platform lifecycle budget permits;
5. release presentation-only particle pools without changing presentation settings.

On visibility return:

1. discard all accumulated wall-clock delta;
2. do not process catch-up ticks;
3. reacquire or verify the campaign lease;
4. render the exact last committed simulation state;
5. show `Paused while tab was hidden` and require explicit Resume.

No resource, position, cooldown, weapon, influence, construction, price, research, sensor-age, or AI state changes because of hidden duration. Sensor intelligence ages in active simulation seconds only. An automated test that hides the page for 10 wall-clock minutes must produce an authoritative-state hash identical to hiding it for 100 ms, excluding permitted wall-clock metadata and lease tokens.

#### 3.10.3 Single-active-tab lease

- Lease identity is `(campaignId, tabId, randomNonce)` and is stored in the campaign persistence layer.
- The active tab renews every `2 wall-clock seconds` while visible and every `4 seconds` while paused but visible.
- A lease is stale after `6 wall-clock seconds` without renewal.
- A second tab opening the same live campaign starts in `PAUSED.LEASE_LOST`, read-only, with `Return to campaigns` and `Take control` actions.
- `Take control` is enabled when the lease is stale or after the owning tab acknowledges a handoff. Forced takeover of a non-stale lease requires a confirmation naming the other active tab and invalidates its nonce atomically.
- The losing tab receives the lease change through `BroadcastChannel` or storage notification, adds `LEASE_LOST` before another simulation tick, flushes no state after invalidation, and becomes read-only.
- If simultaneous writes occur despite notification delay, only the current nonce may advance the journal sequence. Invalid-nonce writes are rejected and preserved only in diagnostics, never merged.

Lease time controls ownership arbitration only. It cannot advance simulation, invalidate a confirmed terminal transaction, or create offline progress.

#### 3.10.4 Pause acceptance tests

- `LOOP-PAUSE-001`: pause during flight for 60 wall-clock seconds; position, velocity, fuel, cooldowns, AI state, and campaign second remain bit-identical.
- `LOOP-PAUSE-002`: open each blocking management screen during combat; no projectile, damage, or AI decision advances while open.
- `LOOP-PAUSE-003`: hide for 10 minutes and return; zero catch-up ticks execute and Resume is required.
- `LOOP-PAUSE-004`: close a management-only screen; countdown lasts 900 ms and simulation advances zero ticks during it.
- `LOOP-PAUSE-005`: movement or weapon input during the resume countdown cancels resumption and causes no action.
- `LOOP-PAUSE-006`: two tabs attempt control; exactly one valid nonce can append the next journal sequence.
- `LOOP-PAUSE-007`: active owner loses lease during a frame stall; it becomes paused before executing another authoritative tick after receiving invalidation.

### 3.11 Core-loop completion gates

The implementation does not pass the Core Loops gate until all of the following are true:

- all `LOOP-OPEN-*`, `LOOP-END-*`, `LOOP-TERM-*`, and `LOOP-PAUSE-*` automated tests pass deterministically at 30, 60, and 120 rendered frames per second;
- a bot can complete the canonical v0 campaign loop from launch through all-planets control on 200 independently generated 10x10 seeds with zero soft-locks;
- no bot victory uses emergency reserve more than once, and no seed requires emergency reserve for its opening envelope;
- Captain reference-agent median completion over those seeds is within 45–75 active minutes and the 10th–90th percentile lies within 35–95 minutes;
- ten first-time human participants produce at least eight successful 30-second loops, at least eight upgrade fits by active minute 3, and at least eight correct explanations of the observed rival action by active minute 5;
- every terminal run reopens only as a sealed read-only record after refresh, crash recovery, import, tab takeover, and same-seed retry creation;
- a 10-minute hidden-tab test and a 10-minute user-pause test produce no authoritative state drift;
- capitulation reduces the maximum number of manual planet acquisitions after a rival irreversibly loses shipyard and military capacity to at most one; federation produces formal player ownership rather than allied ownership.
## 4. Mechanics Catalog

This catalog is normative. Implementations may tune presentation but must not change a formula, threshold, state transition, or release assignment without updating this section and every referenced test. All simulation quantities use SI-like game units: distance in world units (`wu`), time in simulation seconds (`s`), velocity in `wu/s`, acceleration in `wu/s²`, fuel in fuel units (`FU`), cargo in cargo units (`CU`), damage/health in points (`pt`), credits in credits (`cr`), influence in influence points (`IP`), and simulation time in ticks. The fixed authoritative simulation rate is `20 ticks/s`; rendering interpolates and never changes outcomes. A paused or hidden application executes zero simulation ticks and performs no catch-up.

Release tags are cumulative:

- **v0:** polished vertical slice: `10×10`, one rival, 8–12 planets.
- **v0.1:** strategy layer: dimensions `10–15`, up to two rivals.
- **Full:** dimensions `10–30`, up to three rivals and the complete content pool.

### 4.0 Shared constants and deterministic conventions

| Constant | Value | Meaning |
|---|---:|---|
| `SECTOR_SIZE` | `1,024 wu` square | Physical size of every sector |
| `TICK_DT` | `0.05 s` | Authoritative fixed tick |
| `INTERACT_RANGE` | `96 wu` | Base mining/docking/collection range |
| `LOCK_INSET` | `12 wu` | Station-keeping acquisition inset; 12.5% of base interaction range |
| `BASE_CARGO` | `24 CU` | Empty flagship cargo capacity |
| `BASE_TANK` | `80 FU` | Normal flagship fuel capacity; emergency return mode is separate |
| `BASE_SENSOR` | `320 wu` | Live tactical sensor radius |
| `BASE_HULL` | `120 pt` | Flagship hull maximum |
| `BASE_ARMOUR` | `60 pt` | Flagship armour maximum |
| `BASE_SHIELD` | `50 pt` | Flagship shield maximum |
| `CREDIT_START` | `240 cr` | Campaign starting credits |
| `INTEL_FRESH` | `90 s` | Live-contact data remains current after contact ends |
| `INTEL_STALE` | `600 s` | Current data becomes stale; static geography never expires |

Deterministic random values come only from SHA-256 domain substreams derived from canonical length-prefixed `(campaignSeed,generatorVersion,mechanicId,entityStableId)` parts. Each stream uses `xoshiro128**`; iteration is always by ascending stable entity ID. Authoritative state uses scaled integers: milli-wu, milli-wu/s, hundredths of FU/CU, ticks, basis points, and whole credits/health/influence. UI/render floats never feed back into simulation. A tie is resolved by lowest stable entity ID unless a mechanic states another rule. Canonical state hashes serialize `{schemaVersion,campaignId,tick,state}` with sorted keys as specified in §7.4.

### M01 — Campaign setup and seed identity [v0]

**Inputs:** user-entered or generated 80-bit seed represented by 16 canonical Crockford Base32 characters; width; height; rival count; difficulty (`Explorer`, `Captain`, `Strategist`); tutorial toggle. In v0, width and height are locked to `10`, rival count to `1`. v0.1 permits each dimension `10…15` and `1…2` rivals. Full permits `10…30` and `1…3` rivals.

**Formula:** recommended rivals `R = clamp(round(width×height/100),1,releaseMaximum)`; campaign identity hash is the canonical §7.4 SHA-256 object hash over schema version, rules version, seed, dimensions, rival count, and difficulty.

**Effect:** creates an immutable campaign identity and invokes M02. Generated seeds use ten bytes of browser cryptographic randomness; imported/replayed seeds use §7.4 Crockford Base32 normalization. Recommended rival count is `clamp(round(width × height / 100), 1, releaseMaximum)`; setup warns but does not block other legal counts.

**State transition:** `NO_CAMPAIGN → GENERATING → ACTIVE`. Generation failure returns to `NO_CAMPAIGN` without creating a resumable save. The identity tuple is `(schemaVersion, rulesVersion, seed, width, height, rivals, difficulty)`; replay copies the tuple except it creates a new campaign UUID and start timestamp.

**Edges/failures:** reject dimensions, rival counts, enum values, noncanonicalizable Base32 seeds, and unknown rules versions before allocation. The all-zero 80-bit seed is legal. Same identity tuple must generate the same authoritative world irrespective of device, frame rate, locale, or UI language. Replay clones the stored immutable `GalaxyDefinition`, so generator upgrades cannot change an old seed replay.

**Tests:** `T-M01-001` boundary validation; `T-M01-002` golden-seed cross-browser hash; `T-M01-003` replay UUID differs while world hash matches; `T-M01-004` recommended rival count clamps correctly.

### M02 — Toroidal galaxy generation and opening-envelope validator [v0; expanded v0.1/Full]

**Inputs:** validated M01 identity. Target planet count is `P = clamp(round(width × height × 0.10), 8, 90)`; v0 additionally clamps `P` to `8…12`. Planet sectors are unique. Content density per sector is sampled from deterministic streams: mineable deposits `65%`, asteroid field `10%`, ion storm `6%`, positive discovery `8%`; generation rules prevent mutually exclusive overlaps. A sector that carries deposits carries one, plus a second at frontier tier `>=2` with `40%` chance and a third at tier `>=3` with `25%`, so the deep frontier is worth the fuel. Mining is the loop the whole economy rests on, so most of the map must have something to mine; `generatorVersion` `2` marks this density, and `1` saves still load.

Every deposit records the yield it held when generated, so remaining yield can be shown as a proportion rather than a bare number. Planets vary in drawn size by a stable function of their id; size is presentation only and never changes interaction range or hit testing.

**Formula:** `P` and the content probabilities above are authoritative; each validation retry uses the SHA-256 `opening-attempt:<index>` substream for integer index `0…255`.

**Effect:** places origin, rival origins, planets, nodes, hazards, and discoveries. Origins maximize wrapped Manhattan separation subject to at least `floor((width + height)/3)` sectors between any pair. The player's home planet is friendly, has a shipyard, market, fuel, one common-ore demand contract, and no hostile/hazard within one wrapped sector.

Opening validation must prove all of the following by deterministic graph search using the starter ship:

1. A common-ore node exists within `≤1` sector crossing and contains `≥16 CU`.
2. Mining `13 CU`, returning, retaining the required ore component, selling the remainder, and buying a guaranteed Deepglass Drill T1 or Folded Hold T1 at its §5.5 cost is possible in `≤180 s` of modeled competent play and leaves `≥10 cr`.
3. A positive discovery exists within wrapped path length `≤2` sectors and is not behind a forced hazard.
4. The rival has a legal visible action—scout contact, claimed planet, or broadcast intent—scheduled by `300 s`.
5. At least two non-home planets are reachable without emergency reserve using the base tank.
6. Every planet is reachable in the final connectivity graph; in Full, wormholes are optional shortcuts and never required for connectivity.

If invalid, increment a generation `salt` and regenerate, up to 256 attempts. Attempt 257 uses a deterministic repair pass: inject the missing opening node/discovery, remove blocking hazards, and relocate the nearest non-home planet; record repair flags in metadata.

**State transition:** `GENERATING → VALIDATING → ACTIVE`; each retry returns to `GENERATING`. Generated entities receive stable IDs from sorted `(type, sectorY, sectorX, localIndex)` tuples after repair.

**Edges/failures:** no planet may spawn within `160 wu` of a sector edge; no ship spawn may overlap a solid body; local content rejection sampling stops at 64 tries then skips optional content. Generator cannot hang. Rectangles and odd dimensions use the same wrap formulas as M03.

**Tests:** `T-M02-001` 10,000-seed opening sweep; `T-M02-002` planet-count bounds; `T-M02-003` origin separation; `T-M02-004` connectivity; `T-M02-005` forced repair at attempt 257; `T-M02-006` no overlap/edge violation; `T-M02-007` first-five-minute scripted play.

### M03 — Toroidal coordinates, distance, boundaries, and routes [v0]

**Inputs:** sector coordinate `(x,y)`, local position `(lx,ly)`, destination, galaxy dimensions.

**Formula:** sector indices normalize as `wrap(i,n) = ((i % n) + n) % n`. Axis delta is `wrappedDelta(a,b,n) = ((b-a+n/2) mod n)-n/2`; for an exact even-size half-map tie, use the negative direction. Strategic distance is `D1 = |dx|+|dy|`; Euclidean sector distance is `D2 = sqrt(dx²+dy²)`. Crossing local `x<0`, `x≥1024`, `y<0`, or `y≥1024` transfers the overflow to the wrapped neighbor without changing velocity.

**Effect:** every route preview and AI route uses A* over four-neighbor sectors with edge cost `1 + hazardCost + hostilityCost`; `hazardCost ∈ {0,2,6}` for clear, known moderate, known severe; `hostilityCost ∈ {0,1,3}` for friendly/neutral/hostile. Unknown costs `1`. Tie order is shortest total cost, then fewer crossings, then north/east/south/west. Full wormhole edges cost `0.5` sectors plus endpoint hazard cost.

**State transition:** local boundary crossing performs `CURRENT_SECTOR → TRANSFER_PENDING → ADJACENT_WRAPPED_SECTOR` within one tick; routes move `UNPLOTTED → PLOTTED → INVALIDATED/COMPLETED`.

**Danger:** route length remains wrapped Manhattan/A*, but danger uses Euclidean wrapped displacement. Let `D=sqrt(dx²+dy²)`, `Dmax=sqrt(floor(width/2)²+floor(height/2)²)`, and `u=clamp(D/Dmax,0,1)`; base tier is `min(4,floor(u×5))`. Names and `(threat,node yield,positive-discovery weight)` multipliers are Haven `(0.80,0.85,0.75)`, Near Reach `(1.00,1.00,1.00)`, Far Reach `(1.25,1.25,1.30)`, Verge `(1.55,1.60,1.70)`, and Antipode `(1.90,2.10,2.25)`. A seeded regional modifier `[-0.10,+0.10]` changes strength but not band name and cannot modify the home/opening route above Haven.

**Edges/failures:** path previews explicitly draw wrap-edge portals and show sector count, predicted fuel, maximum danger, and stale/unknown segments. Replanning occurs after an unexpected blockage or material intel update, never more than once per second.

**Tests:** `T-M03-001` wrap all four edges; `T-M03-002` even/odd rectangular distance; `T-M03-003` deterministic half-map tie; `T-M03-004` A* hazard avoidance; `T-M03-005` wrap route visualization; `T-M03-006` danger/reward band boundaries.

### M04 — Flagship manual flight [v0]

**Inputs:** steering vector from keyboard or virtual joystick, throttle `q∈[0,1]`, brake input, all-stop input, current velocity/heading, equipment modifiers, M05 fuel mode.

**Formula:** input dead zone is `0.12`; remap magnitude as `(m-0.12)/0.88`. Turn rate is `ω = lerp(150°,55°,speed/maxSpeed) × turnModifier /s`. Forward acceleration is `a = 92 × q × engineModifier wu/s²`; reverse/brake acceleration is `150 wu/s²`. Drag while unpowered is `8 wu/s²`. Base `maxSpeed=220 wu/s`; normal cruise threshold is `96 wu/s`. Velocity is integrated semi-implicitly at fixed ticks into scaled integer authority.

**Effect:** steering rotates toward desired heading by at most `ω×dt`; thrust accelerates along heading. Brake opposes velocity and snaps to zero below `2 wu/s`. Collision with solid geometry projects the ship to contact, removes inward velocity, deals `ceil(max(0,impactSpeed-70)²/180)` hull-bypassing damage capped at `35 pt`, then grants `0.5 s` collision immunity.

**State transition:** `IDLE ↔ THRUSTING ↔ CRUISING ↔ BRAKING`; M06 may enter `AUTOPILOT`; M07 may enter `STATION_KEEP`; M05 can force `EMERGENCY_DRIFT`; destruction enters M28 transaction.

**Full stop:** an explicit `Full stop` control (HUD button, or `X` on keyboard) is always available during flight. It cancels autopilot, zeroes throttle, releases held steering, and holds brake every tick until velocity is exactly zero, then releases itself. It is a request, not a mode: any thrust, steering, joystick, or non-zero throttle input cancels it immediately. It never spends fuel beyond normal braking and never overrides pause, sealing, or emergency drift.

**Edges/failures:** opposite keyboard directions cancel. Losing window focus clears held inputs next tick. Touch joystick release returns input to zero within `50 ms`. UI/menu input never leaks into flight. All stop issued while paused takes effect on the first tick after resume.

**Tests:** `T-M04-001` acceleration/max speed; `T-M04-002` turn curve; `T-M04-003` brake distance (`≤195 wu` from max speed); `T-M04-004` collision damage; `T-M04-005` focus-loss clears thrust; `T-M04-006` 30/60/120 FPS deterministic position; `T-M04-007` all stop halts a cruising ship and cancels autopilot.

### M05 — Fuel, refueling, range forecast, and emergency reserve [v0]

**Inputs:** throttle, speed, elapsed ticks, tank equipment, dock owner/relations, route.

**Formula:** powered-flight burn is `burn = dt × q × (0.018 + 0.0000018 × speed²) FU`; coasting at `q=0` burns zero. Autopilot uses the same formula. Normal tank maximum is `80 + equipmentBonus FU`. Route forecast simulates the route at autopilot cruise plus `5%` margin. Friendly fuel costs `1 cr/FU`; neutral permitted access costs `3 cr/FU`; hostile denies refueling. AI pays identical rates from faction funds.

**Effect:** when normal fuel reaches zero, enter the separate inexhaustible `EMERGENCY_DRIFT` return mode: max speed `55 wu/s`, acceleration capped so it cannot exceed that speed, no fuel burn, weapons/bombs/mining/hostile planet interaction disabled, and shields stop recharging. Docking at any legally usable refuel source exits after obtaining at least `1 FU`. If player lacks credits, a friendly planet supplies `15 FU` once per planet per `600 s` and records a `30 cr` debt deducted from future sales.

**State transition:** `NORMAL → LOW_FUEL` at forecasted home margin `<15 FU`; `LOW_FUEL → EMERGENCY_DRIFT` when normal fuel reaches `0`; refuel returns to `NORMAL` or `LOW_FUEL` according to forecast.

**Edges/failures:** normal fuel never becomes negative. Equipment swap cannot reduce tank below current fuel; excess is sold back at friendly price, or swap is blocked if no market. Forecast labels unknown hazards but does not invent extra burn. Emergency return mode is not a fuel quantity, cannot be sold/upgraded, and remains available until a legal refuel source is reached.

**Fuel is a market commodity, not a service button.** It is quoted per unit alongside materials, bought in a chosen quantity, and priced by the same ownership rule as any other access: `1 cr/FU` at a planet the player controls, `3 cr/FU` at a neutral port, refused at a hostile one. Gating refuelling on player ownership strands a player who runs dry anywhere else, which the emergency-drift rule already assumes cannot happen. Repairs and bomb construction remain services of a planet the player controls, and say so rather than disappearing.

**Tests:** `T-M05-001` burn curve; `T-M05-002` cruise is negligible only when unpowered; `T-M05-003` reserve restrictions; `T-M05-008` both rates charge correctly and a neutral port sells through the market UI; `T-M05-004` debt rescue; `T-M05-005` AI/player parity; `T-M05-006` forecast margin; `T-M05-007` tank downsizing.

### M06 — Autopilot and interruption [v0]

**Inputs:** tap/click destination in local space, entity interaction, or strategic sector; current intel; fuel forecast; user confirmation if reserve forecast is negative.

**Gesture contract:** movement is expressed by tapping, not by naming a mode. One tap on empty space commits a move to that point. One tap on a planet, deposit or ship both selects it and starts the approach — never two taps to go somewhere. One tap on your own ship is the stop gesture and is equivalent to `Full stop`. The player-facing vocabulary is the phase readout, not "autopilot". The context bar carries no travel button at all, because a button that duplicates the primary gesture reads as a second, different thing; the contacts list keeps a per-contact `Fly here` as the keyboard and assistive-technology route.

**Formula:** desired cruise is `180 wu/s`; braking distance is `dBrake=v²/(2×150)+24 wu`; arrival tolerances are `24 wu` for a point and `84 wu` for an interaction target.

**Effect:** local path uses collision waypoints with `48 wu` clearance; strategic path uses M03. Autopilot rotates, accelerates to `180 wu/s`, begins braking under power once remaining distance falls to `v²/(2×150)`, and comes to a **full stop** at `84 wu` from an interaction target or `24 wu` from a bare coordinate. Arrival at rest is required, not optional: docking refuses above `20 wu/s`, a mining lock above `8 wu/s`, and unpowered drag sheds only `8 wu/s²`, so an autopilot that merely cut throttle would coast out of range every time. Autopilot never thrusts while heading error exceeds `8000/65536` of a turn. Route and fuel forecast remain visible.

**State transition:** `OFF → PLOTTING → TRAVEL → APPROACH → ARRIVED → OFF`. Transition to `INTERRUPTED` on manual steering magnitude `>0.20`, brake, all stop, hostile target entering live sensor range, incoming damage, newly detected severe hazard on route, route invalidation, or predicted usable fuel below zero. User may explicitly resume after any interruption. Opening a pausing screen suspends but does not cancel autopilot.

**Edges/failures:** unreachable targets show a reason and never consume fuel. Destination destruction cancels. A moving target is repathed at `2 Hz`; if its speed exceeds flagship maximum for `3 s`, cancel. Autopilot never automatically enters a known severe hazard. It cannot activate bombs or initiate hostility.

**Tests:** `T-M06-001` point arrival tolerance; `T-M06-002` interaction standoff, arrival at rest, and a dock that succeeds from where autopilot stopped; `T-M06-009` one tap moves and a tap on own ship stops; `T-M06-010` one tap on a deposit selects and approaches; `T-M06-003` manual interrupt next tick; `T-M06-004` hostile/damage interrupt; `T-M06-005` braking without overshoot; `T-M06-006` wrap route; `T-M06-007` unreachable/vanished target; `T-M06-008` paused resume without catch-up.

### M07 — Assisted station-keeping and interaction lock [v0]

**Inputs:** selected mineable/collectible/dockable target, separation, relative speed, throttle, manual steering.

**Formula:** eligible when separation `≤INTERACT_RANGE-LOCK_INSET = 84 wu`, relative speed `≤35 wu/s`, throttle `≤0.25`, and target unobstructed. Assist applies spring acceleration `a = clamp(2.4×radialError - 1.8×radialVelocity, -45,45) wu/s²` toward an orbit radius of `92 wu`, plus tangential target matching capped at `30 wu/s²`.

**Effect:** after eligibility holds `0.35 s`, show range lock and enter `LOCKED`; mining/transfer may proceed. A subtle clockwise orbit is capped at `10 wu/s`. Upgrade range changes both interaction range and orbit radius proportionally, while the acquisition inset remains `12.5%` of range.

**State transition:** `OUT_OF_RANGE → ELIGIBLE → LOCKED`. Break immediately to `OUT_OF_RANGE` on steering magnitude `>0.20`, throttle `>0.40`, separation `>interactionRange`, target loss, obstruction, damage causing knockback, or autopilot command. Values between throttle `0.25…0.40` retain an existing lock but cannot acquire one.

**Edges/failures:** assist never spends fuel, cancels velocity rather than teleporting, and cannot pull through obstacles. Reduced motion removes orbital arc/camera ease but preserves lock indicator and physics.

**Tests:** `T-M08-001` autopilot to a node leaves the ship inside a legal mining lock; `T-M07-001` acquire at 84 wu/35 wu/s; `T-M07-002` no acquire outside thresholds; `T-M07-003` manual/high-throttle break; `T-M07-004` obstruction break; `T-M07-005` stable 30-second orbit; `T-M07-006` reduced-motion parity.

### M08 — Resource nodes and mining [v0; exotic in v0.1]

**Inputs:** locked target from M07, mining equipment, node material and remaining yield, cargo free space, emergency/combat state.

**Materials:** common ore (`1 CU/unit`, trade and upkeep); structural metal (`1 CU/unit`, defence/repair); energy crystal (`1 CU/unit`, shields/weapons); exotic matter (`1 CU/unit`, advanced research; v0.1). v0 includes the first three. Base node yields by band are `common 20–60`, `metal 12–40`, `crystal 8–24`, `exotic 2–8`, multiplied by M03 node-yield multiplier and rounded down.

**Formula:** extraction rate `R = baseRate × laserMultiplier × efficiencyMultiplier`; base rates are common `4.0`, metal `2.6`, crystal `1.6`, exotic `0.6 units/s`, preserving ratios `1.0/0.65/0.40/0.15`. Mining accumulates progress in thousandths; each whole unit transfers if cargo has room. Base visible pulse period is `0.50 s` and module cadence follows §5.5; node quantity decreases only when cargo receives the unit.

**Effect:** every completed unit is atomically removed from the finite node and added to the flagship manifest, with a material-specific beam pulse and floating cargo increment.

**State transition:** `AVAILABLE → MINING → DEPLETED`; `MINING → PAUSED` on lock loss, cargo full, emergency drift, or combat damage in last `3 s`; it resumes when conditions clear and retains fractional progress. Depleted nodes do not respawn during a campaign.

**Edges/failures:** when remaining cargo space is smaller than a unit's CU size, mining pauses before consuming it. Multiple miners serialize by stable ID per tick. A destroyed ship drops M10 cargo but restores no node yield.

**Tests:** `T-M08-001` rate/material curve; `T-M08-002` pulse cadence visibly changes with upgrade; `T-M08-003` fractional interruption/resume; `T-M08-004` cargo-full conservation; `T-M08-005` depletion persistence; `T-M08-006` combat/emergency block.

### M09 — Cargo capacity, manifest, and jettison [v0]

**Inputs:** pickups, purchases, mined units, cargo equipment, jettison command.

**Formula:** capacity `Cmax = 24 + ΣcargoRackBonus CU`; used space is exact sum of material CU weights and cargo-item sizes. Fit requires `used + incoming ≤ Cmax` after `0.01 CU` quantization.

**Effect:** manifest stacks identical commodities; every material unit consumes `1 CU`; stored equipment consumes `4 CU/item`. Bombs use their capped special-ammunition magazine and never consume cargo in v0. Jettison spawns a recoverable crate for `300 s`; hostile contact requires a two-step confirmation, peaceful space a single confirmation.

**State transition:** incoming cargo moves `OFFERED → VALIDATED → STORED/PARTIAL/REJECTED`; jettisoned cargo moves `STORED → CRATE → RECOVERED/EXPIRED`.

**Edges/failures:** capacity-reducing refit is blocked while used space exceeds new capacity. Partial pickups transfer the largest whole quantity that fits. Crates placed over solids shift along the surface normal; if no legal point within `64 wu`, remain attached and retry next tick.

**Tests:** `T-M09-001` mixed CU arithmetic; `T-M09-002` partial pickup; `T-M09-003` refit capacity guard; `T-M09-004` jettison expiry/recovery; `T-M09-005` confirmation mode.

### M10 — Markets, prices, stock, trade, and intelligence [v0 baseline; adaptive v0.1]

**Inputs:** planet stock/demand, material base price, danger band, owner relation, recent net player trade, market age. Base prices: common `10`, metal `18`, crystal `26`, exotic `65 cr/unit`.

**Formula:** v0 fixed local modifier is generated in `[0.85,1.15]`. v0.1 price is
`price = round(base × clamp(1 + 0.50×scarcity + 0.08×band + control + relation + pressure, 0.55, 1.85))`,
where `scarcity=clamp((targetStock-stock)/max(1,targetStock),-0.6,1)`, `control∈[-0.08,0.12]`, `relation∈[-0.10,0.20]`, and player transaction pressure changes a quote by at most `8%` per committed transaction and `30%` total. Sell price is `floor(displayedBuyPrice×0.82)`. After each `30 s` economy tick, stock moves 10% toward locally produced/consumed equilibrium and pressure decays by `0.75`. Stock bounds are `0…3×targetStock`; a market cannot sell absent stock. Player sale capacity per material is free stock capacity. Automated circuit validation caps repeatable zero-risk profit at `18%` per five active minutes after fuel and pressure.

**Effect:** a trade transaction validates dock status, current stock, credits, cargo, and price atomically, then transfers both sides. Known price shows timestamp: `LIVE` under sensor/contact, `RECENT` through `90 s`, `STALE` through `600 s`, then `UNKNOWN`. Static known market existence remains mapped.

**State transition:** transaction `QUOTED → VALIDATING → COMMITTED` or `REJECTED`; no partial debit. Price pressure makes immediate buy/sell arbitrage unprofitable. Each material has required sinks: common—trade/contracts/planet upkeep; metal—repair/defence; crystal—shield/weapon/bombs; exotic—research/advanced gear.

**Edges/failures:** max-quantity control computes affordability, cargo, and stock minimum. If price changes while trade UI is paused it cannot change because simulation is paused; after unpause a quote expires immediately. Integer arithmetic prevents fractional-credit drift.

**Tests:** `T-M10-001` formula boundary/golden cases; `T-M10-002` no profitable round trip; `T-M10-003` stock bounds; `T-M10-004` atomic insufficient-funds/cargo rejection; `T-M10-005` intel aging; `T-M10-006` 100,000-transaction conservation; `T-M10-007` economy seed sweep recovery sources.

### M11 — Docking, repair, refit, and undocking [v0]

**Inputs:** selected planet, M07 lock, ownership/access, hostile state, requested service.

**Effect:** docking is permitted within interaction range at relative speed `≤20 wu/s`, if access is friendly/conquered or neutral permission exists, and no damage was received for `5 s`. Hold interact `0.5 s`; ship becomes invulnerable/non-colliding and the management UI pauses simulation. Undock places ship `112 wu` from planet along the safest free radial, velocity zero, with `2 s` weapon lockout and invulnerability.

**Formula:** repairs cost `1 metal + 2 cr` per `10 armour/hull pt` or fraction; shields refill free while docked. Repair order is hull then armour. Equipment may be buy/sell/swap only at friendly or conquered planets with shipyard capacity `≥1`. Sale returns `60%` of current base equipment price, rounded down.

**State transition:** `FREE → DOCK_REQUEST → DOCKED → UNDOCKING → FREE`; invalid access/damage/speed returns to `FREE` with reason. Hostile ownership change while docked ejects the ship using undock protection.

**Edges/failures:** simultaneous destruction/accepted dock resolves damage first. If no safe radial exists, choose least-overlapped radial and displace obstacles, never the ship. Closing the UI does not undock; explicit launch does.

**Tests:** `T-M11-001` speed/range/access gate; `T-M11-002` damage-before-dock race; `T-M11-003` repair price/order; `T-M11-004` service ownership gate; `T-M11-005` safe undock; `T-M11-006` capture eject.

### M12 — Equipment slots and six v0 equipment families [v0; expanded v0.1/Full]

**Inputs:** owned inventory, market stock, research unlocks, dock services, loadout.

**Effect:** the flagship has three generic module slots in v0. All six v0 families compete for those slots; there are no typed slot restrictions. Starting tier-0 Survey Pin, Cargo Sling, and Drill Coupler occupy all three slots and establish sensor, cargo, and mining capability without bonuses. The six upgrade families and exact effects/costs are Deepglass Drill, Folded Hold, Longwake Cell, Prism Surveyor, Aegis Loom, and Helix Director from §5.5. The base cannon and three-cap bomb magazine are integral, not module slots. R-02 may unlock a purchased fourth generic slot in v0.1; Full has a hard maximum of five.

**Formula:** one module occupies one generic slot; only the highest installed tier in a family is legal. Final stat is `(base + flat bonuses) × (1 + sum(percent bonuses))`, with percent sum capped `+100%`; cooldown reduction capped `40%`; interaction range capped `160 wu`; sensor radius capped `900 wu`. Equipment durability is not modeled.

**State transition:** stored `LOCKED_BY_RESEARCH → AVAILABLE → OWNED → FITTED`; selling returns `AVAILABLE` stock. A swap is one paused atomic transaction.

**Edges/failures:** reject a full slot set, duplicate family, unavailable stock, unmet research, duplicate unique artifacts, removal that leaves zero sensor or cargo capability, capacity-breaking hold removal, or tank-breaking cell removal under M05. Acquired planets never confiscate fitted gear.

**Tests:** `T-M12-001` slot compatibility; `T-M12-002` stat order/caps; `T-M12-003` six v0 bonuses; `T-M12-004` atomic failed swap; `T-M12-005` research/stock gate; `T-M12-006` no durability decay.

### M13 — Tactical targeting and hostility [v0]

**Inputs:** tap/click entity, cycle-target command, hostile actions, faction relations, sensor contacts.

**Formula:** touch candidate distance is measured in CSS pixels and must be `≤44 px`; cycle ordering key is `(threateningPlayer?0:1,distanceWU,hullFraction,stableId)`.

**Effect:** explicit selection wins. Cycle selects sensor-visible hostile ships by `(threateningPlayer first, distance, lowest hull%, stableId)`. Auto-acquire, if enabled, selects only a hostile that damaged the player or is actively targeting them; it never initiates war. Target lock is lost after `2 s` continuously outside live sensors or immediately on destruction/cloak. Neutral attack requires hold/second-confirm; confirmation declares hostility before projectile spawn.

**State transition:** relation `PEACE → HOSTILE` on confirmed attack, bomb launch, or conquest action; `HOSTILE → PEACE` only via v0.1 ceasefire system. Target `NONE ↔ SELECTED ↔ LOST`.

**Edges/failures:** taps choose the nearest entity within a `44 CSS-px` radius, with hostile > interactable > scenery priority. UI scale does not change world range. Occluded contacts may be targeted if sensors resolve them. Docked/undocking targets are invalid.

**Tests:** `T-M13-001` touch hit radius/priority; `T-M13-002` deterministic cycle; `T-M13-003` no accidental neutral fire; `T-M13-004` lock loss grace; `T-M13-005` auto-acquire restriction.

### M14 — Ship shields, armour, hull, damage, and destruction [v0]

**Inputs:** damage packet `(amount,type,source)`, current layers, recharge timers. Types: kinetic, energy, explosive, collision.

**Formula:** kinetic multipliers `(shield .75, armour 1.25, hull 1)`; energy `(shield 1.25, armour .75, hull 1)`; explosive `(shield 1, armour 1, hull 1.25)`; collision bypasses shield/armour. Damage applies shield→armour→hull, recalculating overflow in raw damage units between layers. Round up each layer loss. Shield recharge begins after `4 s` without damage at `6 pt/s`; armour/hull never self-repair.

**Effect:** at `hull≤0`, destruction is authoritative in the same tick. Player invokes M28; AI ship creates a cargo drop containing `25%` of commodities, rounded down, and M22 replacement eligibility. Hit feedback may not delay simulation.

**State transition:** `HEALTHY → SHIELD_DOWN → ARMOUR_DOWN → CRITICAL (<25% hull) → DESTROYED`; repair can reverse all but destroyed.

**Edges/failures:** simultaneous packets sort by source stable ID; all packets in the fatal tick are logged, but no post-destruction attacks spawn. Damage cannot heal via negative values. Invulnerability rejects packet before hostility side effects.

**Tests:** `T-M14-001` multiplier/overflow golden cases; `T-M14-002` recharge delay/rate; `T-M14-003` simultaneous fatal ordering; `T-M14-004` collision bypass; `T-M14-005` AI drop conservation; `T-M14-006` no negative damage.

### M15 — Standard automatic weapon combat [v0]

**Inputs:** valid M13 target, range, line of sight, weapon stats, emergency/dock states.

**Formula:** base cannon range `300 wu`, cooldown `0.8 s` (`1.25 shots/s`), projectile speed `520 wu/s`, damage `12 kinetic`, aim lead from constant-velocity intercept. AI aim-solution error is Explorer `±12°`, Captain `±6°`, Strategist `±2°`; player auto-weapon cone is `±2°`. If no intercept exists within range, aim at current position. Projectile lives `0.8 s` and collides first with solid/ship excluding source.

**Effect:** while a valid hostile target is selected, cannon fires whenever ready, in range, unobstructed, and target lock quality has held `0.15 s`. Firing does not consume ammunition; each shot resets cooldown. Player can toggle hold-fire.

**State transition:** `SAFE/HOLD → TRACKING → FIRING → COOLDOWN`; invalid conditions return to `TRACKING` or `SAFE`. Emergency, docked, pause, undock lockout, and destroyed states prevent firing.

**Edges/failures:** target crossing neutral entities blocks firing rather than causing friendly fire; already-fired projectiles can hit any non-allied collidable and trigger hostility. Projectiles crossing sector edges wrap under M03.

**Tests:** `T-M15-001` cadence/range; `T-M15-002` lead solution; `T-M15-003` obstruction hold; `T-M15-004` hold-fire; `T-M15-005` emergency/dock block; `T-M15-006` wrapped projectile.

### M16 — Bombs and manually activated special weapons [v0]

**Inputs:** special button/hotkey, fitted bomb rack, ammo, selected hostile planet/target, range, confirmation.

**Formula:** v0 siege bomb costs `110 cr + 1 metal + 1 crystal`, ammo cap `3`, starting ammo `1`, range `260 wu`, arming delay `0.8 s`, and speed `300 wu/s`. Against ships it deals `50 explosive` in a `70 wu` radius. Against planets, shield/defence interception resolves first; after v0 shields are down, impact removes exactly `34` resolve. Launch cooldown is `5 s`.

**Effect:** special activation opens an aim/impact preview and predicted planet damage. First use against neutral requires a second press within `2 s`; hostile targets launch immediately. Ammo decrements only when projectile successfully spawns. Bombs are interceptable with `30 hull pt`. Planet impact invokes M19.

**State transition:** `UNREADY → AIMING → CONFIRMING(optional) → LAUNCHED → COOLDOWN`; cancel or invalid target returns to `UNREADY/READY` without ammo loss.

**Edges/failures:** no launch in emergency, docked, paused, during undock lockout, through blocking terrain, or without hostile/confirmed target. Holding the hotkey does not repeat. Touch control is at least `56 CSS px` and displays ammo.

**Tests:** `T-M16-001` ammo atomicity; `T-M16-002` neutral confirmation; `T-M16-003` damage/radius; `T-M16-004` interception; `T-M16-005` hold-no-repeat; `T-M16-006` preview matches result.

### M17 — Planet model, production, capacity, and roles [v0 baseline; roles v0.1]

**Inputs:** planet quality `Q∈[0.8,1.2]`, owner, infrastructure tracks, assigned role, stock.

**Formula:** total infrastructure `L=economy+mining+defence+research+shipyard≤10`; 30-second production is `round(Q×(2+miningLevel)×roleMultiplier)` material units and research is `round(Q×researchLevel×roleMultiplier) RP`.

**Effect:** planet tracks are economy, mining, defence, research, shipyard, each level `0…5`; capacity is `10` total levels in v0.1 and Full. v0 uses fixed home/rival/neutral templates and shipyard yes/no. Every `30 s` economy tick, owned planets produce `round(Q×(2+miningLevel)×roleMultiplier)` common/metal units according to resource profile, consume `1 common` upkeep, and add `round(Q×researchLevel×roleMultiplier)` research points in v0.1. Construction spends visible faction stock.

Roles in v0.1 cost `150 cr + 4 metal`, take `45 s` active simulation to establish, and are limited to one role per planet. Mining world gives one local material stream `+60%` and market restock interval `-20%`, sacrificing research/defence `-20%`; Fortress gives orbital shield/defence `+60%` and repair `+25%`, sacrificing trade stock/research `-25%`; Research hub gives `1.2 RP/s` and relay radius `+1 sector`, sacrificing material/shipyard speed `-30%`; Shipyard gives construction/repair time `-30%` and enables defence production, sacrificing research/market restock `-25%`. Role penalties never remove cheap refuel or the only recovery source.

**State transition:** `NEUTRAL/OWNED → DEVELOPING → SPECIALIZED`; conquest may set `DAMAGED`, repaired when infrastructure reaches prior level. Development queues one project at a time.

**Edges/failures:** no production when required upkeep is absent; defence remains. Capacity prevents illegal upgrade. Ownership transfer preserves stock and surviving levels. Economy ticks process production, upkeep, then queued construction in stable planet order.

**Tests:** `T-M17-001` capacity; `T-M17-002` role multipliers; `T-M17-003` upkeep halt; `T-M17-004` deterministic tick order; `T-M17-005` transfer preservation; `T-M17-006` role-change timing.

### M18 — Planet acquisition [v0 simplified; full influence/federation v0.1]

**Inputs:** trade value, aid, broadcast action, diplomacy equipment, competing influence, relation. Each planet tracks influence by faction `0…100 IP` and trust `-100…100`.

**Formula:** in v0 each non-home planet has resistance `R = 100 + 15×frontierTier + 10×specialisation`, with specialisation `0` ordinary or `1` strategic. Peaceful influence starts at `0` and reaches control at `R`: trade contract `+18`; development aid costs `80 cr + 2 common` for `+22`; broadcast costs `25 cr` for `+8` with `45 s` per-planet cooldown. Rival legal actions may subtract progress; no one player action completes a planet from zero. Military resolve starts at `R` and reaches control at `0`; each legal post-shield bomb removes `34`. v0.1 activates the full influence/trust rules, competing factions, infrastructure strategy, and federation actions unlocked by the §5.7 research tree.

**Effect:** v0 peaceful control preserves stock and `100%` baseline output. v0 forceful control applies a `15 s` service lock and starts at `60%` output, repairing linearly to `100%` over `120 s` while supplied; it does not destroy infrastructure levels. v0.1 peaceful conversion preserves infrastructure/stock, and federation integration follows M23 and §3.8.

**State transition:** peaceful `UNALIGNED → INFLUENCED → OWNED`; forceful `DEFENDED → SHIELDS_DOWN → RESOLVE_BROKEN → OWNED_REPAIRING → OWNED`. v0.1 adds `CONTESTED → ALIGNED → CONVERTING` and federation states.

**Edges/failures:** repetitive buy/sell cannot farm influence: one contract counts per distinct demand and the atomic market spread remains. A forceful capture cannot use services during the 15-second lock. AI uses identical action costs/cooldowns. No v0 path invokes v0.1 infrastructure-level destruction, orbital defence, trust, or federation.

**Tests:** `T-M18-001` v0 conversion; `T-M18-002` trade anti-farm cap; `T-M18-003` contested threshold/hold; `T-M18-004` hostility reset; `T-M18-005` preserved infrastructure; `T-M18-006` AI cost parity; `T-M18-007` federation eligibility.

### M19 — Planetary shields, bombardment, and infrastructure damage [v0.1]

**Inputs:** bomb impact, planetary shield/defence, attacker, occupation action.

**Formula:** beginning in v0.1, planet shield `Smax=100+60×defenceLevel`; defence `Dmax=80+50×defenceLevel`. Shields recharge after `10 s` at `4+defenceLevel pt/s`; defence does not self-repair. Bomb damage applies shield then defence. Once both are zero, each further siege bomb may destroy one randomly selected nonzero infrastructure level using the planet substream, weighted economy `25%`, mining `25%`, research `20%`, shipyard `20%`, defence `10%`; shield/defence track loss is not selected again. v0 uses M18's simplified shield/resolve and fixed 34-resolve bomb result instead.

**Effect:** in v0.1 occupation requires flagship within `96 wu`, no hostile defending ship within sensors, shields and defence zero, and a `10 s` uninterrupted channel. Conquest transfers ownership, sets trust to `-60`, attacker influence to `0`, and retains surviving infrastructure/stock under v0.1 damage rules. v0 forceful acquisition uses M18's 15-second service lock and 120-second output repair, not this infrastructure model.

**State transition:** `DEFENDED → SHIELDS_DOWN → EXPOSED → OCCUPYING → CONQUERED`; recharge can reverse to `DEFENDED`; channel interruption returns to `EXPOSED` with no progress retained.

**Edges/failures:** bomb launched before shield recharge still resolves against impact-time values. Simultaneous occupation attempts resolve lowest stable faction ID after validating presence. Last infrastructure level may be destroyed, but planet entity cannot be destroyed.

**Tests:** `T-M19-001` shield/defence overflow; `T-M19-002` recharge; `T-M19-003` infrastructure deterministic damage; `T-M19-004` occupation gates/interruption; `T-M19-005` transfer downtime; `T-M19-006` planet indestructibility.

### M20 — Orbital defence [v0.1]

**Inputs:** owner stock, defence level, hostile within range, construction queue.

**Formula:** one battery per defence level, maximum `5`; construction costs `30 metal + 20 crystal + 100 cr`, time `60 s / shipyardBuildMultiplier`. Battery stats: `100 hull`, `450 wu` range, `15 energy damage`, `1.2 s` cooldown, accuracy cone `±3°`.

**Effect:** batteries select hostiles targeting the planet, then bomb projectiles, then nearest hostile. Destroyed batteries must be rebuilt; ownership transfer preserves surviving batteries but imposes M19 downtime.

**State transition:** slot `EMPTY → BUILDING → ACTIVE → DESTROYED → EMPTY`; capture moves an active battery through `DISABLED` for M19's `30 s`, then `ACTIVE` under the new owner.

**Edges/failures:** batteries do not fire through planet geometry, at neutral ships, while planet disabled, or without sensor contact. Simultaneous targets use M13 tie rules.

**Tests:** `T-M20-001` capacity/cost/time; `T-M20-002` priority; `T-M20-003` occlusion/neutral safety; `T-M20-004` capture preservation.

### M21 — AI strategic economy and decision cadence [v0; expanded v0.1/Full]

**Inputs:** faction beliefs from M24, owned assets/stocks/credits, personality weights, difficulty, goals.

**Formula:** `utility = personalityWeight×goalValue - normalizedCost - risk - travelTime`; only the greatest positive score may commit, with action ID as final tie-break.

**Effect:** AI pays all listed fuel, trade, influence, bombs, equipment, repairs, development, and reconstruction costs. Strategic planning interval is Explorer `6.0 s`, Captain `4.0 s`, Strategist `2.5 s`. Candidate actions are scored `utility = personalityWeight×goalValue - normalizedCost - risk - travelTime`; highest positive utility is committed, tie by action ID. Committed intent, destination, cargo/fuel, required resources, and build progress are exposed when intelligence allows.

Difficulty modifiers are bounded and public:

| Preset | Production efficiency | Aim | Route candidates | Aggression |
|---|---:|---:|---:|---:|
| Explorer | `1.00×` | M15 `±12°` | `3` | `0.70×` |
| Captain | `1.00×` | `±6°` | `6` | `1.00×` |
| Strategist | `1.00×` | `±2°` | `10` | `1.30×` |

Production efficiency is exactly `1.00×` for all presets; no difficulty grants free stock or output. The remaining disclosed policy, fill, reserve, retreat, reevaluation, neutral-threat, and reward modifiers are exactly the §5.9 table. AI personalities only change weights: Explorer/trader favors profit/discovery, Builder favors development/influence, Vanguard favors conquest/denial. v0 rival uses Builder-balanced weights; v0.1 assigns deterministic personalities.

**State transition:** `ASSESS → COMMIT → EXECUTE → COMPLETE/ABORT`; abort only if target invalid, survival fuel forecast fails, required resources disappear before atomic spend, or new risk exceeds twice committed risk. Abort incurs a `5 s` replanning delay.

**Edges/failures:** AI has no access to undiscovered truth, player inventory, hidden map entities, or future random values. CPU budget is `≤2 ms` average and `≤6 ms` p99 per strategic tick on reference hardware; over-budget work resumes next planning cadence without changing order.

**Tests:** `T-M21-001` shared-cost ledger audit; `T-M21-002` hidden-information prohibition; `T-M21-003` deterministic scoring; `T-M21-004` disclosed difficulty modifiers; `T-M21-005` CPU budget with 3 rivals/900 sectors; `T-M21-006` intent visibility/intel aging.

### M22 — AI ships, offscreen travel, fuel, and reconstruction [v0]

**Inputs:** AI strategic order, ship stats, route, fuel, sensor relevance, shipyard queue.

**Formula:** offscreen travel distance per quantum is `min(remainingDistance,cruiseSpeed×1 s)` and fuel burn is the M05 integral for that second; reconstruction completion is `progress += 1/120` per simulation second while its shipyard functions.

**Effect:** each faction operates one exploration ship in v0/v0.1 and up to two in Full if it owns `≥3` shipyards. Within the player sector or live sensor coverage, ships use M04–M16 exactly. Offscreen, travel advances on `1 s` quanta along the same M03 route using distance, cruise speed, and M05 burn; combat resolves every `1 s` using expected hit rolls from the named deterministic stream and the same damage/cooldown totals. On entering live relevance, position, health, cooldowns, cargo, and fuel are reconstructed from the latest quantum—never rerolled.

Destroyed ship reconstruction requires a functioning shipyard, `300 cr + 20 metal + 10 crystal`, and `120 s`; one queue per faction. Resources are spent at queue start. If the shipyard changes owner, progress pauses; after `60 s` without recapture, the build is canceled and `50%` materials, no credits, remain in planet stock.

**State transition:** `ACTIVE → DESTROYED → ELIGIBLE → BUILDING → ACTIVE`; faction with no functioning shipyard remains `STRANDED` and becomes eligible for M23.

**Edges/failures:** AI obeys its disclosed §5.9 normal-fuel target; if stranded but alive, it uses the same separate emergency return mode and friendly debt logic. Offscreen combat may not include entities lacking mutual sensors. Transitioning onscreen cannot add/remove health or ammo beyond the quantum already resolved.

**Tests:** `T-M22-001` onscreen/offscreen aggregate parity; `T-M22-002` fuel/range parity; `T-M22-003` reconstruction ledger/time; `T-M22-004` captured shipyard cancellation; `T-M22-005` relevance transition continuity; `T-M22-006` no combat without sensors.

### M23 — Rival capitulation and federation cleanup [v0.1]

**Inputs:** rival functioning shipyards, rival planet share, surviving ship/build progress, player influence/trust, active hostilities.

**Formula:** capitulation requires all §3.8 conditions continuously for 30 strategy ticks: no functioning shipyard; control share `≤20%`; zero active or escrowed replacement ships; no reconstruction with at least 50% materials escrowed; no mutual-defence relief within 120 s; strategic isolation or player control `≥70%`; campaign age `≥300 s`. Federation additionally requires population-weighted peaceful influence share `≥60%`, relation `≥+60`, a player trade/aid/broadcast transaction in the prior 300 s, one prior peaceful player acquisition, and no player infrastructure-destroying bombardment against that faction in the prior 600 s.

**Effect:** opening the offer pauses simulation. Accepting surrender atomically transfers all assets and applies `Occupied` for 120 active seconds at 50% production with no new projects. Federation atomically transfers all assets as `Federated`, preserves projects/infrastructure, and produces at 100% immediately. Decline grants a 60-second ceasefire and suppresses a new offer for 300 active seconds, after which a fresh uninterrupted eligibility hold is required. Evaluation order is stable faction ID and victory evaluates after all accepted transfers.

**State transition:** `VIABLE → COLLAPSING → OFFERED → CAPITULATED`; regaining a shipyard or starting valid reconstruction during the hold returns to `VIABLE`.

**Edges/failures:** player's faction never auto-capitulates. Any eligibility condition becoming false resets the 30-tick hold. Damage/death resolution has priority over transfer and victory. Federation creates formal player ownership, never a subordinate AI or allied-victory exception.

**Tests:** `T-M23-001` military thresholds/hold; `T-M23-002` recovery cancels; `T-M23-003` federation criteria; `T-M23-004` decline cooldown; `T-M23-005` atomic transfer then victory; `T-M23-006` AI claimant tie.

### M24 — Sensors, fog of war, and stale intelligence [v0 geography; v0.1 live intelligence]

**Inputs:** sensor sources, range, occlusion, sector presence, prior observations.

**Formula:** flagship live radius is `320 + equipmentBonus wu`; planet live radius is `500+100×sensorLevel wu`; freshness age is `simulationNow-lastObservedTick/20`, with thresholds `90 s` and `600 s`.

**Effect:** entering a sector permanently reveals terrain, sector hazard landmarks, planet positions, and discovered static entities. Live tactical contacts require distance within sensor radius; asteroid/planet bodies occlude a target only when their angular span fully covers it. Friendly planets provide sector-wide ownership/ship detection plus exact contacts within `500+100×sensorLevel wu` in v0.1. Scan update rate is `10 Hz`.

Dynamic records store last-known position, owner, heading, hull band, cargo/fuel bands, intent, and timestamp. Display `LIVE` while covered, `RECENT` for `≤90 s`, `STALE` through `600 s`, then hide mobile contacts and label ownership/market state `UNKNOWN`. Static terrain and planet location never re-hide. Direct planet ownership changes create a campaign alert only if any friendly sensor witnessed it; otherwise discovered on next observation.

**State transition:** cell `UNKNOWN → DISCOVERED`; contact `UNKNOWN → LIVE → RECENT → STALE → UNKNOWN`; re-observation returns any state to `LIVE`.

**Edges/failures:** sensor radius crossing sector boundaries observes adjacent local space through wrap. Paused time does not age intel. Save/load preserves timestamps relative to simulation time, not wall clock. AI uses the identical visibility graph.

**Tests:** `T-M24-001` permanent geography; `T-M24-002` contact aging boundaries; `T-M24-003` occlusion; `T-M24-004` friendly planet coverage; `T-M24-005` wrap sensing; `T-M24-006` pause/save aging; `T-M24-007` AI/player visibility parity.

### M25 — Discoveries, scans, pickups, rescues, and artifacts [v0; expanded v0.1/Full]

**Inputs:** discovery entity, ship distance, sensor strength, cargo, prior discovery record.

**Formula:** signal radius is `1.25×sensorRadius`; scan duration is `max(1,3/sensorMultiplier) s`; reward quantities are generated once using `Hash64(campaignSeed,"M25",entityStableId)`.

**Effect:** unresolved discoveries emit a distinctive signal inside `sensorRadius×1.25`; direction is shown but identity remains hidden. Scan requires line of sight within sensor range for `3 s` v0 (`3/sensorMultiplier`, minimum `1 s` later). Damage or leaving range resets progress after a `1 s` grace. Reveal pauses no simulation, records discovery, and shows a reduced-motion-safe visual/text cue.

v0 positive pool: treasure asteroid (`20–60 cr` plus `4–12` common) and abandoned cargo (`6–16` units weighted to local demand). v0 hazard reward: storm cache after surviving M26. v0.1 adds derelict (repair/material choice), rescue (`80 cr` or `15 IP`), ancient technology (`40 research`), rich vein (`2×` normal yield), hidden market (unique prices), and one artifact per `100` sectors. Full adds wormhole charts and a broad artifact pool.

Artifact effects are unique, explicit, and capped: `Helios Lens +120 sensor`, `Vector Core +15% max speed`, `Quiet Crucible +20% mining`, `Pact Seal +15% influence`, `Aegis Shard +25 shield`. Only one of each exists; equippable artifacts occupy one generic module slot unless marked as campaign-record cosmetic after the run.

**State transition:** `HIDDEN_SIGNAL → SCANNING → REVEALED → CLAIMED/RESOLVED`; rewards are rolled at generation, not scan time. Claimed unique content cannot respawn.

**Edges/failures:** full cargo leaves a revealed persistent pickup. Rescue expiration is `300 s` only after first scan. Duplicate artifact imports are rejected by M27 validation. Signal effects obey reduced motion.

**Tests:** `T-M25-001` scan range/time/grace; `T-M25-002` generated-not-scan RNG; `T-M25-003` reward bounds; `T-M25-004` cargo-full persistence; `T-M25-005` unique artifact; `T-M25-006` rescue expiry; `T-M25-007` reveal accessibility modes.

### M26 — Hazards: asteroid fields, ion storms, and later traversal [v0 one active hazard; expanded v0.1/Full]

**Inputs:** ship position/speed, hazard volume, protection equipment, simulation tick.

**Formula:** v0 active hazard is asteroid field: while inside at speed `>120 wu/s`, every second collision-risk probability is `p=clamp((speed-120)/240,0,0.5)`; on hit, deal `8 collision` and apply a deterministic lateral impulse `30 wu/s`. At `≤120`, no abstract hit; visible asteroid collisions still use M04. v0.1 ion storms suppress shield recharge, reduce sensors `40%`, and deal `3 energy/s` while throttle `>0.5`; at low throttle no damage. Full adds gravity shear (`+25% fuel burn`, route cost severe) and unstable wormhole misroute chance `10%` until scanned, `0%` after scan.

**Effect:** hazards apply their formula each authoritative tick/quantum, add map route cost and warnings, and may interrupt autopilot; they never silently alter unrelated stats.

**State transition:** `OUTSIDE → WARNING` within `160 wu` → `INSIDE → EXITED`; autopilot interrupts on newly discovered severe hazards. Warnings include type, known effect, danger, and route detour.

**Edges/failures:** hazard ticks use simulation time and stop under pause/hidden. Emergency drift is immune to throttle-dependent storm damage but not physical collisions. AI obeys identical effects and path costs.

**Tests:** `T-M26-001` asteroid speed threshold/probability stream; `T-M26-002` ion effects; `T-M26-003` warning/autopilot interrupt; `T-M26-004` pause immunity; `T-M26-005` AI parity; `T-M26-006` scanned wormhole certainty.

### M27 — Pause, autosave, import/export, and single-tab ownership [v0; import/export v0.1]

**Inputs:** pause command, management UI, document visibility, save events, storage availability, tab lease, JSON import.

**Formula:** recurring persistence interval is `200 ticks=10 active s`; compact snapshot interval is `1,200 ticks=60 active s`; lease heartbeat is `2 s` visible (`4 s` paused-visible), expiry `6 s`; canonical checksum hashes the canonical §7.4 object; maximum import is `10,485,760 bytes`.

**Effect:** explicit pause, any full-screen management view, `visibilitychange→hidden`, or lost active-tab lease stops simulation before the next tick with no catch-up. Persistence runs after every authoritative transaction, sector transition, ownership/equipment/objective/pause change, and every 10 active seconds; snapshots run every 60 active seconds and Save & Quit. Each save is one atomic multi-store IndexedDB transaction that verifies lease/sequence/hash, appends journal events, optionally writes a snapshot, updates the campaign pointer, and commits or aborts as a unit. Retained previous snapshots are the conceptual two recovery slots; there is no separate pending-slot promotion protocol.

Single-active-tab lease uses `BroadcastChannel` plus local storage record `(campaignUUID,tabUUID,heartbeat)` every `2 s`; lease expires after `6 s`. A second tab opens read-only and may take over only after expiry or explicit confirmation that pauses the prior tab. Save state is `CLEAN → DIRTY → WRITING → VERIFIED → CLEAN`; failure returns to `DIRTY`, keeps prior snapshot, displays persistent warning, and retries after `5 s`.

**State transition:** simulation `RUNNING → PAUSED_EXPLICIT/PAUSED_UI/PAUSED_HIDDEN/PAUSED_LEASE → RUNNING`; it may resume only when every active pause reason has cleared. Persistence follows the save-state transitions above.

v0.1 export contains schema/rules version, state, journal summary, and checksum. Import parses in a worker, caps file at `10 MB`, rejects unknown keys in security-sensitive records, nonfinite numbers, invalid enums/IDs/references, checksum mismatch, or rules newer than client. Older supported schemas migrate on a copy and never overwrite until validation succeeds.

**Edges/failures:** storage quota/private-mode failure keeps play paused until player acknowledges unsaved risk or exports in v0.1. Crash recovery loads newest valid committed snapshot then replays only idempotent journal transactions. A confirmed death transaction (M28) is monotonic and cannot be undone by backup recovery. The UI says “checksum verified,” never “tamper-proof.”

**Tests:** `T-M27-001` all pause sources/no catch-up; `T-M27-002` atomic slot promotion; `T-M27-003` corrupt newest fallback; `T-M27-004` quota flow; `T-M27-005` duplicate-tab lease/takeover; `T-M27-006` export/import round trip; `T-M27-007` hostile JSON suite; `T-M27-008` idempotent journal replay; `T-M27-009` confirmed-death monotonicity.

### M28 — Permadeath, sealed records, and recovery transaction [v0]

**Inputs:** authoritative player hull reaching zero, fatal-tick event list, current campaign snapshot.

**Formula:** defeat predicate is `playerHull≤0` after all damage packets for the authoritative tick; the sealed record hash is SHA-256 over the canonical §7.4 object `{schemaVersion,campaignId,tick,previousStateHash,deathEvent}` with no concatenation ambiguity.

**Effect:** death executes the §7.5 terminal protocol: synchronously stop simulation and attempt the deny-resume localStorage tombstone, then atomically verify lease, append `DEATH_CONFIRMED`, write sealed snapshot/fence, set `SEALED_DEFEAT`, write the immutable record, and invalidate the lease in IndexedDB. If persistence fails, retain stopped state in memory, keep the tombstone, and retry; resuming gameplay is never offered.

**State transition:** `ACTIVE → DEATH_PENDING → SEALED_DEFEAT`. Reload seeing `DEATH_CONFIRMED` at or after the loaded snapshot reapplies defeat. Records can be viewed/exported/deleted but never continued. Replay seed invokes M01 with a new UUID; new galaxy generates a new seed.

**Edges/failures:** closing the tab between marker and sealed snapshot still seals on recovery. Duplicate tabs observing the death marker immediately become sealed/read-only. Import of a record with death marker and active status is normalized to sealed; removing marker breaks checksum and rejects import. Browser crash without a death marker restores the newest valid active save and is not treated as defeat.

**Tests:** `T-M28-001` fatal hit seals immediately; `T-M28-002` crash at each transaction step; `T-M28-003` backup cannot resurrect; `T-M28-004` duplicate-tab propagation; `T-M28-005` record read-only; `T-M28-006` replay/new-seed paths.

### M29 — Victory, post-run record, and continuation boundary [v0]

**Inputs:** ownership changes after conquest, influence conversion, capitulation/federation.

**Formula:** victory iff `count(planets owned by player) = count(all planets)` and count is nonzero. Evaluate after all ownership transfers and death resolution in a tick; death has priority, so simultaneous fatal damage and final capture is defeat.

**Effect:** stop simulation, commit `VICTORY_CONFIRMED` using M28 durability, seal as `SEALED_VICTORY`, and create a record with `simulationDuration` (excludes every pause reason), `engagedDuration` (running flight plus management/Galaxy; excludes explicit pause, hidden, lease loss, recovery), `wallSpan` (start to end), planets by acquisition method, ships destroyed/lost, trade profit, discoveries, distance flown, fuel consumed, damage, research, timeline, final galaxy map, seed, difficulty, and rules version. The 45–75-minute target uses engaged duration. The campaign cannot continue after victory.

**State transition:** `ACTIVE → VICTORY_PENDING → SEALED_VICTORY`. Sealed status is monotonic. If zero planets exist because of invalid imported state, import is rejected rather than awarding victory.

**Edges/failures:** chained capitulation transfers complete atomically before evaluation. An ownership transfer rolled back by failed validation cannot trigger victory. Records never expose currently hidden dynamic intel as omniscient data; the final map shows discovered geography and last-known information as it existed at sealing.

**Tests:** `T-M29-001` exact all-planets condition; `T-M29-002` death-over-victory priority; `T-M29-003` capitulation atomic victory; `T-M29-004` sealed recovery; `T-M29-005` statistic accuracy; `T-M29-006` fog-respecting final map.

### M30 — Campaign timeline and actionable alerts [v0]

**Inputs:** mechanic events, player intel, severity, simulation timestamp.

**Formula:** toast throttle is one noncritical toast per `40 ticks=2 s`; duplicate window is `200 ticks=10 s`; timeline cap is `2,000` entries and old info buckets span `12,000 ticks=600 s`.

**Effect:** events are normalized as `(eventId,tick,type,actors,sector,summary,intelState)`. v0 records discovery, trade milestone, equipment purchase, hostility, planet acquisition/loss, ship destruction/rebuild, and run end. v0.1 adds role completion, research, AI-vs-AI conquest, market shock, and capitulation. Alerts display immediately only if observed under M24 or directly affects player-owned assets; hidden events enter timeline when learned, stamped with “occurred at unknown time” unless later evidence supplies a tick.

Alert priority is `critical` (flagship/friendly planet attack, fuel emergency), `major` (planet ownership/rebuild/capitulation), `info` (production/discovery). At most one toast per `2 s`; critical bypasses queue, duplicates coalesce by type/entity over `10 s`. Timeline is capped at `2,000` entries; when full, aggregate oldest info events by type/month-equivalent `600 s`, never removing critical, ownership, discovery, or run-end records.

**State transition:** event `CREATED → VISIBLE/HELD_BY_FOG → ACKNOWLEDGED`; learning releases held events. Pause freezes toast durations.

**Edges/failures:** no hidden AI activity leaks through alerts. Coalescing preserves counts and earliest/latest ticks. Stable event IDs prevent duplicates after journal replay.

**Tests:** `T-M30-001` fog gating; `T-M30-002` priority/coalescing; `T-M30-003` cap aggregation preservation; `T-M30-004` replay deduplication; `T-M30-005` pause toast duration.

### M31 — Research and within-run progression [v0.1]

**Inputs:** faction research points (`RP`), chosen node, prerequisites, research hubs.

**Formula:** one active research project per faction; switching preserves accumulated progress. The v0.1 tree is exactly §5.7: R-01 Coherent Extraction `45 RP`, R-02 Expanded Frames `45`, R-03 Efficient Wake `50`, R-04 Signal Memory `50`, R-05 Layered Fields `55`, R-06 Predictive Fire `55`, R-07 Concord Relay `90` after any two depth-0 projects, R-08 Exotic Handling `95` after R-01 or R-03, R-09 Planetary Doctrine `100` after any two depth-0 projects, and R-10 Capitulation Protocols `165` after R-07 and R-09. Home produces `0.5 RP/s`, research hub `1.2 RP/s`, other roles `0.25 RP/s`.

**Effect:** projects unlock the exact §5.7 stock eligibility, fourth-slot purchase, equipment, exotic, role, and capitulation options; they never grant an item or effect without its listed follow-on cost. RP accrues into the selected project rather than being spent upfront; switching preserves progress, so there is no cancellation refund. AI obeys the same tree, costs, production, and visibility. No research or power carries between campaigns.

**State transition:** node `LOCKED → AVAILABLE → RESEARCHING → COMPLETE`; queue `IDLE ↔ RESEARCHING`. Loss of all research production pauses progress but does not cancel.

**Edges/failures:** prerequisite cycles are forbidden by static validation. A captured research hub contributes to new owner only after M19 downtime. Cosmetic achievements may persist but never alter formula inputs.

**Tests:** `T-M31-001` ten-node costs/prerequisites; `T-M31-002` output/progress; `T-M31-003` switch preserves progress; `T-M31-004` AI parity; `T-M31-005` no cross-run power; `T-M31-006` fourth-slot/role/capitulation unlock gates.

### M32 — Tutorial and contextual safety prompts [v0.1]

**Inputs:** tutorial setting, first-time mechanic flags, current state, user dismiss/disable.

**Formula:** each lesson trigger is a Boolean edge (`false→true`) persisted by lesson ID; display count is capped at one per lesson per profile unless the user explicitly reopens it.

**Effect:** six non-blocking prompts trigger once per profile and may be reopened: flight after launch; mining on first node signal; trade on first dock with cargo; equipment after first profitable sale; influence on first neutral planet; conquest on first hostile planet. Prompts highlight controls without taking input focus; simulation continues unless the associated screen normally pauses. Any prompt can be dismissed immediately; disabling tutorial suppresses all future prompts.

Safety prompts independent of tutorial remain enabled: neutral attack/bomb confirmation, reserve route warning, cargo jettison under hostility, destructive record deletion, and duplicate-tab takeover. These use explicit confirm/cancel and never rely on colour alone.

**State transition:** lesson `UNSEEN → SHOWN → DISMISSED/COMPLETE`; disable maps all unshown lessons to `SUPPRESSED`, reversible from settings without re-showing completed lessons.

**Edges/failures:** tutorial state is profile-local, not authoritative campaign state, and corruption defaults to unseen without affecting saves. Keyboard, touch, and screen-reader instructions select the active input modality.

**Tests:** `T-M32-001` six triggers; `T-M32-002` disable/re-enable; `T-M32-003` prompts do not steal flight input; `T-M32-004` safety prompts cannot be disabled; `T-M32-005` modality/accessibility copy.

### 4.33 Release compliance matrix

| System | v0 | v0.1 | Full |
|---|---|---|---|
| Generation | M01–M03; `10×10`, one rival, 8–12 planets; opening validator | Rectangles `10–15`, two rivals | Up to `30×30`, three rivals, wormholes |
| Flagship | M04–M07 complete | Equipment/research modifiers | Tier III and artifact routing |
| Economy | M08–M12; 3 materials, fixed bounded local prices, six equipment families | Exotic, adaptive stock/prices, roles, research gear | Deeper development and artifact gear |
| Combat/conquest | M13–M18; cannon, siege bomb, simplified resistance/influence/resolve with fixed repair | M19–M20 orbital defence, full influence, infrastructure strategy | Broader diplomacy/specials |
| AI | M21–M22; one rule-paying rival, abstract offscreen tactics | Two rivals, AI-vs-AI conquest, personalities, M23 | Three rivals, up to two ships/faction, deeper goals |
| Information/content | Permanent geography fog, two positive discoveries, asteroid field, M30 baseline | Dynamic intel, expanded discoveries, ion storms | Broad pool, wormholes, comparisons |
| Persistence/end | M27–M29; autosave/resume, lease, sealed permadeath/victory | Import/export | Rich cross-run comparisons, achievements/cosmetics |
| Optional guidance | Core control legend and safety prompts | M32 contextual tutorial | Additional content-specific lessons |

No later-release mechanic may be required to complete an earlier release. All earlier-release tests remain mandatory regression tests in subsequent releases.
## 5. Progression

### 5.1 Progression contract

Progression exists only inside a campaign. Every new campaign starts with the same flagship base statistics, starting modules, funds, home-planet capability, and rules for the selected difficulty. A seed may change geography and opportunities but not grant account-level power. Between-run persistence is limited to sealed records, statistics, discovery entries, achievements, and cosmetic silhouettes with zero mechanical modifiers.

The player advances along five linked axes:

1. **Liquidity:** credits and cargo enable refuelling, repair, consumables, aid, and module purchases.
2. **Loadout:** a fixed slot cap forces trade-offs among extraction, cargo, fuel range, sensors, diplomacy, defence, and combat.
3. **Knowledge:** v0.1 research unlocks options; it never equips them for free.
4. **Territory:** acquired planets extend safe refuel/refit, income, intelligence, research, production, and final control.
5. **Reach:** better range, sensing, survival, and damage allow travel into more dangerous frontier bands.

No axis may become a mandatory grind disconnected from the flagship loop. Every repeatable progression action must advance a route, loadout, acquisition, research, or survival decision.

### 5.2 Baseline campaign state

All numeric quantities below are deterministic simulation values. UI rounds credits and whole material units to integers; internal fractional extraction is retained to three decimal places.

| State | Starting value | Rule |
|---|---:|---|
| Credits | `240 cr` | Enough for recovery decisions, but not a tier-1 module. |
| Common ore | `0` | Primary trade cargo; base home buy price `10 cr/unit`. |
| Structural metal | `0` | Defence, repair, and planetary force-path sink; base value `18 cr/unit`. |
| Energy crystal | `0` | Weapons, shields, and advanced refit sink; base value `26 cr/unit`. |
| Exotic matter | `0` | Disabled in v0; introduced in v0.1 at base value `65 cr/unit`. |
| Fuel | `80/80` | Emergency reserve is separate and cannot be sold or upgraded. |
| Cargo | `0/24 units` | All materials consume one cargo unit per unit. Bomb consumables do not use cargo. |
| Hull | `120/120` | Destruction at `0`. |
| Armour | `60/60` | Repaired while docked; no passive regeneration. |
| Shield | `50/50` | Regenerates after combat delay per combat rules. |
| Standard weapon | `12 base damage/shot`, `1.25 shots/s` | Always installed; automatically fires only at valid selected hostile. |
| Bombs | `1/3` | One starting bombardment charge; cap three before module/research changes. |
| Module slots | `3` | Start with three installed tier-0 modules below; swapping requires eligible dock. |
| Research level | none | Research system absent from v0 and starts empty in v0.1. |
| Controlled planets | `1` home | Home is safe, player-controlled, cheap-refuel, repair/refit capable. |

Starting tier-0 modules occupy all three slots: **Survey Pin**, **Cargo Sling**, and **Drill Coupler**. They establish the sensing, cargo, and mining loop without stat bonuses. Removing one is allowed only after the player owns or buys another compatible module; the ship may never launch with zero sensor capability or zero cargo capacity.

### 5.3 Campaign phase pacing

The pacing clock is `engagedDuration`: it includes running flight plus management/Galaxy time and excludes explicit pause, hidden, lease loss, and recovery. `simulationDuration` excludes every pause reason; `wallSpan` runs from campaign start to end. Checkpoints and the 45–75-minute target use engaged duration. Automated bot sweeps use legal inputs and pass if at least 80% of valid seeds place a competent Captain-policy bot inside each range; 100% must still pass the opening-envelope guarantees.

| Phase | `10x10` target | Expected player state | Required decision |
|---|---:|---|---|
| Orientation | `0:00–1:30` | Home, first scan, first route, first station-keeping lock. | Mine now or inspect the nearby positive signal. |
| First refit | `1:30–3:30` | First sale and enough wealth for one tier-1 module. | Choose an immediate economic, range, sensor, defence, or weapon advantage. |
| First consequence | `3:30–8:00` | Positive discovery revealed; rival intent/action visible; 1–2 non-home planets known. | Contest, avoid, trade around, or prepare for acquisition. |
| Local foothold | `8:00–20:00` | 2–4 planets controlled, one specialised loadout pivot, frontier band 1–2 reachable. | Commit resources to peaceful or forceful acquisition. |
| Strategic contest | `20:00–45:00` | 40–75% of planets discovered; rival economy and shipyard pressure readable. | Remove rival mobility/production or out-influence it while protecting the flagship. |
| Resolution | `45:00–75:00` | Remaining planets known, rival broken/integrated, final danger routes survivable. | Complete all-planets control without rote travel in layers that support capitulation. |

If median Captain completion is below 45 minutes, increase acquisition investment and frontier resistance before adding travel time. If above 75 minutes, reduce late acquisition/repair costs or bring capitulation earlier before increasing player stats. Empty transit is never the balancing lever.

### 5.4 Danger and reward curve

For a galaxy of width `W` and height `H`, wrapped displacement from origin is:

```text
dx = min(abs(x - originX), W - abs(x - originX))
dy = min(abs(y - originY), H - abs(y - originY))
D  = sqrt(dx² + dy²)
Dmax = sqrt(floor(W/2)² + floor(H/2)²)
u = clamp(D / Dmax, 0, 1)
```

The base frontier tier is `min(4, floor(u * 5))`, producing tiers `0..4`. A seeded regional modifier in `[-0.10,+0.10]` applies to reward and threat strength but cannot change the home sector or opening-envelope route above tier 0. Named bands are Haven, Near Reach, Far Reach, Verge, and Antipode.

| Tier | Threat multiplier | Node yield multiplier | Positive-discovery weight | UI forecast |
|---:|---:|---:|---:|---|
| 0 Haven | `0.80` | `0.85` | `0.75` | Minimal |
| 1 Near Reach | `1.00` | `1.00` | `1.00` | Guarded |
| 2 Far Reach | `1.25` | `1.25` | `1.30` | Risky |
| 3 Verge | `1.55` | `1.60` | `1.70` | Severe |
| 4 Antipode | `1.90` | `2.10` | `2.25` | Extreme |

Threat multipliers apply to neutral hostile hull, armour, shield, and damage—not to faction costs, fuel, cooldowns, or construction. Reward multipliers apply before node capacity/discovery caps. The route preview displays the highest tier crossed, expected normal fuel, reserve risk, and wrap transitions.

### 5.5 v0 module progression

The v0 catalogue has exactly six upgrade families. Tier 0 establishes capability and is worth `0 cr`; tier 1 and tier 2 are purchasable when stocked. A planet stocks two deterministic tier-1 families and one tier-2 family after its reveal; the home opening validator guarantees at least one tier-1 choice affordable after the first mine/sale loop. Selling returns 60% of current bounded list price, rounded down. One module occupies one slot; there are always three slots in v0.

| Family | T1 effect | T1 cost | T2 effect | T2 cost | Opportunity cost |
|---|---|---:|---|---:|---|
| **Deepglass Drill** | Extraction `4.0→5.2 units/s`; pulse interval `0.50→0.385 s`. | `320 cr + 4 ore` | Extraction `6.8 units/s`; lock acquisition `0.35→0.25 s`. | `760 cr + 8 metal + 4 crystal` | Uses a slot that could extend survivability, reach, or cargo; higher flow fills a small hold sooner. |
| **Folded Hold** | Cargo `24→36`. | `300 cr + 6 ore` | Cargo `24→52`; sale unload cadence doubles. | `720 cr + 10 metal` | No direct extraction, survival, information, or damage benefit. |
| **Longwake Cell** | Fuel `80→112`; normal refuel cost scales with capacity actually filled. | `340 cr + 4 metal` | Fuel `80→150`; acceleration fuel efficiency `+12%`. | `820 cr + 10 metal + 3 crystal` | Ties a slot to range; does not improve emergency reserve. |
| **Prism Surveyor** | Scan radius `320→430 world units`; map contact freshness `+20 s` where supported. | `360 cr + 3 crystal` | Scan radius `560`; hidden positive signal reveal threshold `-20%`. | `860 cr + 7 crystal + 4 metal` | Does not identify content through fog or override sensor/intelligence rules. |
| **Aegis Loom** | Shield `50→78`; regen `6→7.5/s`. | `390 cr + 5 metal + 2 crystal` | Shield `112`; regen `9/s`; regen delay `4.0→3.5 s`. | `920 cr + 10 metal + 6 crystal` | No hull/armour increase and no economic output. |
| **Helix Director** | Weapon damage `12→15`; aim solution time `0.20→0.15 s`. | `400 cr + 4 crystal + 2 metal` | Weapon damage `19`; fire rate `1.25→1.40/s`. | `950 cr + 9 crystal + 5 metal` | No bombardment bonus, defence, range, or income. |

Module bonuses in one family do not stack because only the highest installed tier in that family is valid. A lower tier may be sold when buying a higher tier in the same dock transaction. Stat deltas are shown before confirm. On installation, the changed HUD value pulses once for `700 ms`; the next relevant use emits the upgrade accent feedback specified in §6. No module may reduce a base statistic.

### 5.6 v0 acquisition progression

Each non-home planet has resistance `R = 100 + 15*tier + 10*specialisation`, where `tier` is frontier tier and `specialisation` is `0` for ordinary or `1` for strategically valuable. v0 uses simplified parallel acquisition meters:

- Peaceful influence starts at `0` and reaches control at `R`. Valid trade contract adds `18`; development aid costs `80 cr + 2 ore` and adds `22`; broadcast costs `25 cr` and adds `8`, with a `45 s` per-planet cooldown. Rival influence subtracts through legal rival actions. No single action may complete a planet from zero.
- Military resolve starts at `R` and reaches control at `0`. A bomb that lands after shields are down removes `34` resolve. Standard weapons remove orbital shield/defence only and cannot reduce planetary resolve. Bomb base purchase price is `110 cr + 1 metal + 1 crystal`.
- v0 peaceful control preserves 100% baseline planet output. v0 military control begins at 60% output and repairs linearly to 100% over `120 s` while supplied; this is the simplified precursor to v0.1 infrastructure damage.

Ownership immediately adds the planet as a refuel/repair/refit point after any force-path capture repair lock of `15 s`. Victory checks after each ownership transaction and after campaign load reconciliation.

### 5.7 v0.1 research and role progression

v0.1 introduces research points (`RP`) generated only by controlled planets. Home produces `0.5 RP/s`; a research-hub role produces `1.2 RP/s`; other roles produce `0.25 RP/s`. Research continues during active simulation and pauses everywhere the simulation pauses. Only one project may be active; switching projects preserves accumulated progress. Unlocks reveal purchasable options and never grant the item or effect without its stated follow-on cost.

Research cost formula for depth `d` is `baseCost * 1.65^d`, rounded to nearest whole RP. The compact v0.1 tree is:

| ID | Project | Depth | RP | Prerequisite | Unlock |
|---|---|---:|---:|---|---|
| R-01 | Coherent Extraction | 0 | `45` | none | Deepglass T2 stocking; rare-vein extraction. |
| R-02 | Expanded Frames | 0 | `45` | none | Folded Hold T2 and fourth module slot purchase. |
| R-03 | Efficient Wake | 0 | `50` | none | Longwake T2 and acceleration efficiency. |
| R-04 | Signal Memory | 0 | `50` | none | Prism T2 and `+30 s` intelligence freshness. |
| R-05 | Layered Fields | 0 | `55` | none | Aegis T2 and orbital-defence construction. |
| R-06 | Predictive Fire | 0 | `55` | none | Helix T2 and improved target selection display. |
| R-07 | Concord Relay | 1 | `90` | any two depth-0 projects | Diplomacy module family; federation actions. |
| R-08 | Exotic Handling | 1 | `95` | R-01 or R-03 | Exotic matter cargo, market, and advanced sinks. |
| R-09 | Planetary Doctrine | 1 | `100` | any two depth-0 projects | Planet roles and one role reassignment per planet per `300 s`. |
| R-10 | Capitulation Protocols | 2 | `165` | R-07 and R-09 | Capitulation/federation resolution when world-state conditions are met. |

The fourth module slot unlocked by R-02 costs `1,200 cr + 12 metal + 6 crystal`; it is a one-time within-run flagship upgrade. No fifth slot exists in v0.1. The diplomacy family occupies a normal slot: **Concord Relay T1** gives peaceful actions `+15%` influence and costs `520 cr + 4 ore + 4 crystal`; T2 gives `+25%` and a `-20%` broadcast cooldown and costs `1,050 cr + 6 crystal + 3 exotic`.

Planet roles take `45 s` active simulation to establish, cost `150 cr + 4 metal`, and are capacity-limited to one role. Role outputs at full integrity:

| Role | Primary output | Strategic sacrifice |
|---|---|---|
| Mining world | One local material production stream `+60%`; market restock interval `-20%`. | Research and defence output `-20%`. |
| Fortress | Orbital shield/defence capacity `+60%`; repair rate `+25%`. | Trade stock and research `-25%`. |
| Research hub | `1.2 RP/s`; scan-intelligence relay radius `+1 sector`. | Material production and shipyard speed `-30%`. |
| Shipyard | Rival/player-available construction and repair time `-30%`; defence production enabled. | Research and market restock `-25%`. |

Role penalties never reduce cheap refuel availability or eliminate the only recovery source in a region.

### 5.8 Full-target progression expansion

Later releases may add broader research, equipment, artifacts, planet development, achievements, and cosmetics under these hard constraints:

- Maximum flagship module slots is `5`; every endgame build still omits at least three useful module families.
- Research depth is capped at `4`; total RP cost to complete all research on a standard `10x10` seed must exceed the median campaign duration, preventing universal completion before victory.
- Permanent core-stat improvements are within-run only, each capped at `+15%` of base and collectively capped at three purchases per campaign.
- Unique artifacts use one normal module slot unless explicitly consumable. No artifact may be required for victory or guaranteed in every seed.
- Cosmetic silhouettes alter no collision radius, targeting profile, stats, slots, sensor origin, or animation timing.
- A newly controlled planet never becomes best-in-class at every output; one role and capacity trade-offs persist.

### 5.9 Difficulty presets

Difficulty is selected at campaign creation and stored in the sealed record. Presets do not grant rivals free resources, ignore fuel, shorten construction below displayed time, reveal hidden player state, change market prices only for AI, or alter player input physics. Difficulty changes policy competence, aggression, neutral danger, and disclosed decision cadence.

| Knob | Explorer | Captain | Strategist |
|---|---:|---:|---:|
| AI strategic decision interval | `6.0 s` | `4.0 s` | `2.5 s` |
| AI route candidates evaluated | `3` | `6` | `10` |
| AI acceptable cargo departure fill | `65%` | `80%` | `90%`, unless threatened |
| AI reserve-fuel target | `30%` tank | `22%` | `15%` with legal recovery route |
| AI aggression score multiplier | `0.70` | `1.00` | `1.30` |
| AI retreat hull threshold | `45%` | `32%` | context-weighted `20–40%` |
| AI aim-solution error | `±12°` | `±6°` | `±2°` |
| AI target reevaluation | `1.0 s` | `0.60 s` | `0.30 s` |
| Neutral threat stats | `0.85×` | `1.00×` | `1.15×` |
| Danger reward multiplier | `1.00×` | `1.00×` | `1.08×` |
| Player death rules | permanent | permanent | permanent |

Aim error is a visible steering/selection imperfection, not hidden damage reduction. Strategist's reward increase applies to the same dangerous nodes/discoveries available to all factions. Explorer is recommended for first play, Captain is the balance baseline, and Strategist is labelled “faster-planning rivals; stronger frontier threats.”

Map size and rival count are separate setup parameters, not difficulty bonuses. The recommended count is one rival for `10x10`, two for maps of area `101–225`, and three above `225`; v0/v0.1 layer caps override these recommendations.

### 5.10 Recovery, anti-grind, and economy limits

- Emergency reserve speed is `55 world units/s`, cannot accelerate above that speed, and disables weapons, bombs, mining, and hostile planet interaction. It remains available until the ship reaches any legally usable refuel source.
- Every generated region containing a required traversal path has at least one legal refuel source or a normal-fuel return cost no greater than 85% of the base tank under the opening validator.
- Market price stays within `0.55×–1.85×` base value in v0.1. A player's repeated net sale pressure can reduce quoted price by at most 8% per transaction and 30% total before recovery.
- Stock cannot be negative. Purchases and sales apply atomically; insufficient credits, cargo, materials, stock, or capacity produce no partial transaction.
- No repeatable zero-risk trade circuit may return more than 18% profit per five minutes after fuel and transaction pressure in automated sweeps.
- A depleted required resource receives a deterministic recovery contract within `90 s` active time at the nearest reachable friendly planet.
- Repairs never consume the last available unit needed to refuel out of a planet unless the player explicitly confirms the risk.
- Waiting in a menu, paused state, hidden tab, or closed app yields zero resources, research, repair, market recovery, AI progress, or threat movement.

### 5.11 Progression feedback and acceptance

Every progression transaction shows `before → after`, total cost, unavailable reason, and whether it is reversible. Purchases require one confirm; sales require one confirm only for installed, rare, or unique items. Research completion, planet acquisition, role completion, new frontier-band entry, and first use of an upgraded system create timeline events.

Acceptance gates:

- `P-01`: Every fresh campaign has identical base stats and no inherited mechanical modifier.
- `P-02`: Every accepted seed offers one affordable consequential tier-1 module after the guaranteed opening loop.
- `P-03`: With three v0 slots, no loadout can simultaneously equip all six families.
- `P-04`: Module preview and post-install HUD match formulas exactly; selling returns floor(60% of bounded price).
- `P-05`: Explorer/Captain/Strategist AI pays identical world costs and obeys identical fuel/cooldown/construction rules.
- `P-06`: Paused or hidden time changes no progression counter.
- `P-07`: Normal-fuel exhaustion always allows reserve return and prevents combat/mining during reserve use.
- `P-08`: v0.1 research unlocks stock eligibility only; credits/materials are still charged when buying.
- `P-09`: A role improves its primary output and applies its sacrifice at the listed values.
- `P-10`: Victory still requires all planets; v0.1 capitulation/federation only transfers control through specified legal conditions.
- `P-11`: Same seed, ruleset, difficulty, and legal input trace produce identical unlock, price, research, and ownership outcomes.
- `P-12`: A `10x10` Captain bot sweep places at least 80% of completed campaigns within 45–75 minutes without adding idle transit.

### 5.12 Progression alternatives rejected

| Alternative | Reason rejected |
|---|---|
| XP levels earned by combat kills | Would privilege violence, encourage farming, and duplicate equipment/research progression. |
| Permanent account research or stat upgrades | Breaks equal starts and weakens seeded comparison. |
| Unlimited module slots | Removes loadout identity and the central opportunity-cost decision. |
| Random module stat rolls | Obscures comparisons, complicates saves/tests, and encourages inventory churn. |
| Fleet size as the primary power curve | Contradicts the one-flagship product definition. |
| Full research tree in v0 | Adds balance surface before flight, mining, trade, acquisition, and persistence are proven. |
| Universal linear stat escalation | Makes early content irrelevant and reduces route/loadout choice to a gear check. |
| Difficulty through free AI income or omniscience | Violates readable shared-rule rivalry. |
| Offline/idle gains | Conflicts with pause semantics and makes browser lifecycle affect balance. |
| Unbounded dynamic pricing | Enables runaway arbitrage or unrecoverable local economies. |

## 6. Feel Spec

### 6.1 Feel goals and measurement conditions

Venture Star must feel precise at the ship, calm at the strategy layer, and celebratory at discoveries. Responsiveness is prioritised over physical realism. Feedback may briefly exaggerate direction, impact, and value, but it must never obscure danger, steal steering, or make reduced-motion players infer state from missing motion.

All pixel values are CSS pixels at UI scale `1.0`; world values use a `1024×1024` world-unit sector. Timing is wall-clock time while rendering, except simulation timers, which stop on pause/hidden state. Frame examples assume 60 Hz but implementation uses elapsed time and must remain within tolerance at 30, 60, 120, and 144 Hz.

### 6.2 Input contract

| Property | Exact rule |
|---|---|
| Input-to-first-visible-change | p95 `≤50 ms` at 60 Hz and p95 `≤85 ms` at 30 Hz from browser input event timestamp to first changed rendered frame. Steering/throttle must update on the next simulation tick. |
| Simulation tick | Fixed `20 Hz` (`50 ms`); render interpolates between ticks. At most five accumulated ticks execute before a render; additional wall time is discarded and never caught up. |
| Buffered discrete input | Target-next/previous, interact, bomb, pause, and map inputs buffer for `120 ms` if received during a single non-interactive transition. Steering and throttle are sampled continuously and are never buffered. |
| Key repeat | Steering/throttle use held state. Discrete commands ignore OS repeat; target cycling permits deliberate hold after `350 ms`, then repeats every `180 ms`. Bomb never repeats while held. |
| Pointer/touch tap | Movement threshold `≤10 px`, duration `≤350 ms`; beyond threshold becomes drag/joystick motion. Double-tap has no gameplay command. |
| Long press | `500 ms`; opens contextual details only. It never fires a bomb or confirms a destructive action. |
| Remapping | No. Fixed bindings are shown in settings/help and first-use prompts. Browser-reserved shortcuts are not used as sole access to an action. |
| Gamepad | Not supported in the approved target. Gamepad events are ignored; therefore inner/outer deadzones and rumble are not applicable and no controller glyphs are shown. |
| Haptics | Optional mobile vibration only where `navigator.vibrate` is supported and user setting is on. Never required for information. |
| Rapid-input accessibility | No core action requires repeated tapping faster than `3 taps/s`. Target-cycle hold-repeat is built in; mining is automatic; purchase quantity controls support hold-repeat after `400 ms` at `5 increments/s`. |

Desktop bindings:

| Action | Binding |
|---|---|
| Turn left/right | `A`/`D` or `←`/`→` |
| Increase/decrease commanded speed | `W`/`S` or `↑`/`↓`; changes command by `180 world units/s²` while held |
| Full stop | `X`; sets commanded speed to `0` immediately, physical braking still applies |
| Select nearest hostile | `Q` |
| Cycle target forward/back | `Tab` / `Shift+Tab`; prevent browser focus traversal only while flight surface owns focus |
| Context interact/dock | `E` |
| Activate selected special/bomb | `Space`; opens hold-to-confirm ring only for irreversible planetary bombardment |
| Galaxy map | `M` |
| Pause/back | `Escape`; `P` also toggles pause from flight |
| Silent mode | `V` |

Mobile controls:

- Left joystick base is `112 px` diameter, knob `52 px`, active region leftmost 45% of flight view, centre anchors to first touch at least `20 px` from a safe-area edge. Direction controls angular steering; magnitude below `0.18` is zero, `0.18–1.0` scales turn command linearly.
- Right vertical throttle rail is `48×180 px`, minimum hit area `56×196 px`; value snaps to `0`, `0.5`, and `1.0` within `0.06`, otherwise continuous. A separate `64×48 px` stop button sets command to zero.
- Target selection is tap on a visible contact; tap within overlapping contacts chooses highest priority and opens a stack selector if the top two hit areas overlap by more than 40%.
- Bomb/special button is minimum `72×72 px`, placed outside joystick and throttle regions. Planetary bombardment requires hold `450 ms`; ring fills clockwise and cancels on slide-out beyond `24 px` or target invalidation.
- Context interaction button is minimum `64×64 px`, appears only when an action is possible, and labels the verb (`Dock`, `Scan`, `Aid`, `Lock`) rather than a generic icon alone.

### 6.3 Ship movement

The flagship uses assisted inertial movement, not Newtonian drift.

| Parameter | Value |
|---|---:|
| Sector size | `1024×1024 world units` |
| Ship collision radius | `18 units` |
| Normal top speed | `220 units/s` |
| Base acceleration | `180 units/s²` |
| Braking/deceleration | `280 units/s²` |
| Lateral velocity alignment | half-life `240 ms` while steering; converts velocity toward facing without increasing magnitude |
| Turn rate at `0–55 units/s` | `180°/s` |
| Turn rate at `220 units/s` | `105°/s`, linearly interpolated by speed |
| Reverse travel | none; negative throttle command floors at zero |
| Boundary crossing inset | ship appears `20 units` inside opposite edge with velocity/facing preserved |
| Interaction collision | planets/nodes use soft avoidance; hazards/ships use mechanics-defined collision |
| Fuel acceleration cost | `0.0035 × abs(deltaSpeed) × (0.65 + speed/220)` fuel, charged per speed change; steady normal cruise costs `0.002 fuel/s` |

Steering changes facing immediately at the listed angular rate; thrust accelerates velocity along facing. When no steering input is present, the alignment assist reduces sideslip with `240 ms` half-life. Full-stop braking acts opposite velocity and does not rotate the ship. Autopilot uses the same acceleration, braking, speed, fuel, and boundary rules.

There is no jumping, coyote time, jump buffering, air control, variable jump height, landing, or landing squash/stretch because play is top-down continuous spaceflight. These mechanics must not be emulated through vertical bob that changes collision or aim.

Ship engine presentation:

- Engine plume length is `10–34 px` mapped to current acceleration; steady cruise plume is `12 px`.
- Facing rotation visual is continuous; no banking beyond `±8°` pseudo-roll, reached over `120 ms` and returned over `180 ms`.
- Speed lines appear above `176 units/s` at opacity up to `0.18`; reduced motion replaces them with a static speed-edge vignette at opacity `0.08`.
- Boundary wrap uses a `140 ms` edge compression and `180 ms` opposite-edge expansion while control and velocity remain continuous. Reduced motion uses an instantaneous cut plus labelled edge flash for `300 ms`.

### 6.4 Camera

| State | Zoom | Follow/look rule |
|---|---:|---|
| Cruise | `1.00×` | `48×32 px` central deadzone; follow position exponential half-life `100 ms`; velocity lookahead max `80 px`, half-life `180 ms`. |
| High speed | `0.92×` above `190 units/s` | Zoom over `240 ms`; lookahead max `96 px`. |
| Combat | `0.92×` when hostile target within `480 units` or player damaged in last `4 s` | Camera midpoint blends 35% toward selected hostile, capped `100 px` from ship. |
| Station lock | `1.08×` | Blend midpoint 25% toward node over `280 ms`; never hides outbound threat indicator. |
| Rare discovery reveal | `1.12×` for `650 ms`, then `1.00×` over `450 ms` | Input remains live except the `180 ms` scan-resolve hold. |
| Management/map | orthographic UI | World camera freezes; simulation paused. |

Zoom easing is cubic-out. User cannot manually zoom in v0. Camera position never crosses a sector boundary before the ship. On wrap, the camera cuts to the paired coordinate in the same render frame and carries interpolation state without traversing the galaxy.

Screenshake uses trauma `t∈[0,1]`; per frame amplitude is `maxAmplitude × t² × seededNoise`, trauma decays by `1.8/s`. Maximum translation is `7 px`, rotation `1.2°`. Events add trauma: standard shot fired `0.04`, standard hit received `0.16`, armour break `0.28`, shield break `0.32`, bomb launch `0.24`, bomb impact `0.70`, ship destruction `1.00`, rare discovery `0.10`. Trauma additions clamp at 1. Player optional-shake setting multiplies amplitude by 0.5; off/reduced-motion sets translation and rotation to zero.

### 6.5 Assisted station-keeping and mining feel

Mineable-node interaction radius is `120 world units`, measured centre-to-centre minus ship collision radius. The assist state machine is:

```text
OUTSIDE
  -> CANDIDATE when distance <=120, commanded speed <=66 (30% top speed),
     current speed <=77 (35%), node selected, no hostile damage in last 1.5s
CANDIDATE
  -> ACQUIRE after 350ms continuously valid
  -> OUTSIDE on invalid condition
ACQUIRE
  -> LOCKED after easing toward 92-unit orbit and relative speed <=8 for 120ms
  -> BROKEN on manual steer >0.22, throttle >0.35, damage, target loss, or range >126
LOCKED
  -> BROKEN on the same break inputs/events
  -> COMPLETE on cargo full or node depleted
BROKEN
  -> CANDIDATE after 300ms continuously valid
COMPLETE
  -> CANDIDATE after capacity/node condition clears
```

The outer `12%` acquisition band (`105.6–120 units`) displays the first lock affordance. Once the ship becomes eligible anywhere at or inside `120 units`, CANDIDATE begins; overshooting the affordance band does not prevent lock if speed and other conditions remain valid. The assist applies at most `120 units/s²` positional correction and `90°/s` turn correction, never exceeds normal movement limits, and eases cubic-out into a clockwise or counter-clockwise orbit chosen from the lower angular correction. It does not spend acceleration fuel while applying only drift-match correction; player-commanded acceleration still spends fuel. The HUD shows an arc bracket growing from 0–100% during ACQUIRE, cyan double brackets plus `LOCKED` text when locked, and one explicit break reason for `900 ms`.

Mining begins only in LOCKED. Base extraction is `4.0 units/s`; material is credited continuously, with a visible pulse every `500 ms` moving a `6 px` packet from node to cargo indicator. Cargo count interpolates numerically no faster than `10 updates/s` while the authoritative value remains continuous. Beam thickness is `2 px` at base, `3 px` at T1, `4 px` at T2; cadence follows actual extraction tier.

Interruption mappings:

| Cause | Visual | Haptic | Rule |
|---|---|---|---|
| Manual steering/high throttle | Brackets open in `90 ms`; label `MANUAL RELEASE`. | soft release tick; no vibration | Control returns on the same tick. |
| Hostile damage | Beam snaps, brackets red for `120 ms`; threat edge marker. | alert chirp; `0.25` vibration for `50 ms` | Lock cannot reacquire for `1.5 s`. |
| Range loss | Dashed tether for `300 ms`; label `OUT OF RANGE`. | descending two-note tick | No material after first out-of-range tick. |
| Cargo full | Last packet lands gold; cargo meter pulses twice over `500 ms`; label `HOLD FULL`. | full chime; `0.18` vibration for `40 ms` | Assist may remain orbital; extraction stops. |
| Node depleted | Node collapses to outline over `320 ms`; label `DEPLETED`. | low crystalline tail `420 ms` | Content state persists deterministically. |
| Target lost | Brackets dissolve over `100 ms`; label `SIGNAL LOST`. | none | No automatic target substitution. |

Reduced motion removes orbital camera blend, packet travel, bracket growth, and node collapse. It uses static acquire percentage, immediate locked brackets, a `120 ms` beam luminance step below flash thresholds, direct cargo-number updates, and persistent text reason.

### 6.6 Targeting and combat feedback

Target priority for nearest-hostile and overlap selection is: hostile currently attacking player, hostile with valid weapon solution, hostile targeting a controlled asset, lowest distance, lowest stable entity ID. A selected target has four corner brackets, name, range, relation, and shield/armour/hull bars. Invalid/out-of-range targets retain a dashed selection for `500 ms`, then clear unless still visible for inspection.

Standard weapon fires automatically when target is hostile, in range, line/solution valid, and cooldown complete. Aim-solution progress appears around brackets for `200 ms` base (`150 ms` with Helix T1). There is no manual rapid-fire input. Bombardment requires a planet target, available charge, valid range, broken planetary shield, and hold confirmation as defined in §6.2.

Impact presentation does not freeze the deterministic simulation. “Hitpause” below is a render-only animation hold on the struck sprite and local effect; projectiles, timers, AI, and inputs continue:

| Severity | Render hold | Flash | Visual recoil only | Damage number |
|---|---:|---|---|---|
| Shield hit | `20 ms` | cyan-white, `50 ms`, max luminance step 0.20 | `2 px` over `70 ms` | cyan, `16 px` rise |
| Armour hit | `32 ms` | amber-white, `67 ms`, max 0.24 | `4 px` over `90 ms` | amber, `20 px` rise |
| Hull hit | `45 ms` | red-white, `83 ms`, max 0.28 | `6 px` over `110 ms` | off-white/red outline, `22 px` rise |
| Heavy/bomb hit | `70 ms` | white-to-amber, `100 ms`, max 0.32 | `12 px` over `160 ms` | amber, `28 px` rise, larger font |

Visual recoil is a sprite offset eased cubic-out; it does not alter physics, range, facing, or route. Damage numbers spawn `8 px` above impact, rise the listed distance over `550 ms`, and fade during the final `180 ms`. Font is the UI numeric font at `14 px` (`20 px` heavy), semibold, with `2 px` dark outline. Simultaneous hits within `100 ms` on one entity combine into one number unless damage types differ. Damage numbers can be disabled; bars and flashes remain.

Break and kill feedback:

- Shield break: radial six-segment ring expands `18→38 px` over `220 ms`, trauma `+0.32`, distinct glassy snap, target shield bar becomes striped empty state.
- Armour break: three plate fragments travel at most `20 px` over `280 ms`, trauma `+0.28`, low metallic crack. Reduced motion shows a static broken-plate icon for `500 ms`.
- Enemy ship destruction: control silhouette flashes once for `83 ms`, expands into at most 12 fragments over `420 ms`, kill marker and resource consequence appear, trauma `1.0`, mobile vibration `0.45` for `90 ms`. Reduced motion replaces expansion with a `180 ms` opacity dissolve and persistent `DESTROYED` label for `650 ms`.
- Player critical hull at `≤25%`: hull bar remains visible and gains a non-flashing striped background; warning tone repeats no faster than once per `8 s` and stops while paused.
- Player death: inputs lock on the authoritative death tick; `220 ms` colour drain, `350 ms` silhouette breakup, `400 ms` silence except death transient, then sealed-record panel at `1.2 s`. Reduced motion uses immediate control lock, static wreck silhouette for `500 ms`, then panel. Save death transaction starts before presentation and cannot be cancelled.

No flash exceeds three changes per second; no full-screen white flash is used. Critical information always has icon/text/form feedback in addition to colour, motion, or vibration.

### 6.7 Discovery and scan feedback

Signals communicate category before exact identity:

| Signal | Shape/pattern | Colour role | Cadence | Meaning |
|---|---|---|---|---|
| Ordinary resource | concentric square pips | resource teal | `1.2 s` breathe | Known economic opportunity. |
| Hazard | inward chevrons + stripe | warning amber | static with `600 ms` edge tick | Threat; never colour-only. |
| Rare positive | asymmetric eight-point star + dotted halo | discovery violet/white | three pulses at `0, 180, 420 ms`, then slow `1.6 s` breathe | Potential route-changing reward. |
| Hostile contact | four broken triangles | hostile red + crosshatch | `500 ms` positional update | Mobile threat under current/recent intelligence. |

Resolving an ordinary scan takes `350 ms` and reveals name/category with a `180 ms` label rise. A rare positive discovery takes `650 ms`: input remains steerable, but scan resolution holds for the first `180 ms`; camera uses §6.4 reveal zoom; surrounding mix ducks `-6 dB` for `500 ms`; a three-layer original reveal plays (attack `30 ms`, tonal body `420 ms`, tail `900 ms`); the discovery card appears for `1.8 s` and can be dismissed immediately after `250 ms`. The timeline entry is committed on authoritative reveal, not card dismissal.

The first reveal of a discovery uses full feedback. Re-viewing it uses a `160 ms` panel without replaying the full reveal. Reduced motion uses no zoom or pulsing halo; it displays a high-contrast star, `RARE SIGNAL` label, and static `4 px` outline for `900 ms`.

### 6.8 Planet acquisition, upgrade, and strategic feedback

- Peaceful action: influence meter fills over `300 ms` cubic-out from old to new authoritative value; preserved-output icon remains visible. A control completion uses a `600 ms` pattern sweep confined to the planet silhouette and a warm two-note cadence.
- Bomb launch: `120 ms` launcher recoil visual, trauma `0.24`, bass transient, trajectory and impact ETA visible. Bomb impact uses heavy-hit values plus a defence/resolve delta card. Hold confirmation prevents accidental use; invalid state produces one exact reason and spends nothing.
- Forceful capture: ownership pattern wipes over `700 ms`; output meter lands at 60% and repair time appears immediately. Its visual damage treatment must remain distinct from peaceful completion.
- Rival ownership change outside live view: concise alert shows actor, planet, method if known, report age, and map location. Unknown method is labelled `METHOD UNKNOWN`, not guessed.
- Upgrade purchase: preview shows old/new values. Confirm causes installed slot to compress to 92% for `80 ms`, rebound to 103% for `100 ms`, settle by `260 ms`; changed HUD stat gets `700 ms` outline. Reduced motion uses an immediate outline and `UPGRADED` text for `700 ms`.
- First relevant use after upgrade: Deepglass adds one bright extraction pulse; Folded Hold ticks past old capacity marker; Longwake draws a ghost old-range ring for `900 ms`; Prism expands from old scan boundary once; Aegis shows old-cap notch when crossed; Helix shows old aim-time notch and a sharper first-shot transient. Each happens once per installation and is recorded in local tutorial-state only, not campaign mechanics.
- Research completion: simulation-safe banner below primary HUD for `2.5 s`, no modal interruption, project icon plus explicit unlocked items. While in management UI, completion appears immediately with no animated delay.

### 6.9 HUD and menu feel

| Element | Behavior |
|---|---|
| Button hover | Desktop only: background luminance `+8%` over `80 ms`; cursor changes on same frame. |
| Button press | Scale `1.00→0.96` over `50 ms`, release to `1.00` over `90 ms`; reduced motion uses border thickness `2→3 px` for `100 ms`. |
| Keyboard focus | Persistent `3 px` high-contrast outline, `2 px` offset; never removed on dark backgrounds. |
| Disabled action | 55% opacity plus reason on focus/tap; pressing produces `70 ms` border emphasis and quiet error tick, not shake. |
| Tooltip | Appears after `350 ms` hover or immediately on keyboard focus/long press; disappears after `100 ms` leave delay. |
| HUD appear | Context action fades/slides `8 px` over `140 ms`; threat HUD appears immediately then settles over `100 ms`. |
| HUD disappear | `100 ms` fade; critical warnings persist until condition clears. |
| Full-screen menu open | World pauses on input tick; panel opacity `0→1` and scale `0.985→1` over `180 ms` cubic-out. |
| Full-screen menu close | `120 ms` cubic-in; simulation resumes only after panel is non-interactive and close transition completes. |
| Tab/panel switch | Crossfade `100 ms`; selected tab indicator moves `120 ms`. |
| Confirmation | Primary confirm is right/bottom, cancel left/bottom; `Enter` confirms focused safe action, `Escape` cancels/back. Destructive/irreversible actions require hold or explicit second confirmation. |
| Toast | One active noncritical toast; info `5 s`, major `8 s`, critical persistent. Noncritical admission is limited to one per `2 s`; queued count is visible and duplicates coalesce per M30. |

Management views display a fixed `PAUSED` label and dim the frozen flight background by 35%. Closing them never simulates elapsed menu time. Mobile back follows: close subpanel → close management view → open pause menu; it never exits or abandons a campaign without confirmation.

### 6.10 Silent presentation

Venture Star intentionally ships without sound. No music, ambience, UI sounds, gameplay effects, audio settings, or Web Audio runtime are implemented. The visual and text feedback timing elsewhere in §6 is normative; optional haptic patterns below may remain available where supported.


Mobile vibration patterns use normalised strength only conceptually; Web vibration duration is authoritative: lock `15 ms`, cargo full `40 ms`, hostile damage `50 ms`, kill `90 ms`, bomb impact `120 ms`. No vibration repeats more than once per `250 ms`; reduced motion does not disable haptics, but the separate haptics toggle does.

### 6.11 Accessibility feel mapping

| Standard feedback | Reduced-motion equivalent |
|---|---|
| Camera follow/lookahead | Follow half-life `60 ms`, no velocity lookahead. |
| Zoom transitions/reveal zoom | Fixed `1.00×` cruise and combat zoom; menus use fixed scale. |
| Screenshake/pseudo-roll | Zero translation, zero rotation, zero roll. |
| Speed lines | Static low-opacity edge vignette. |
| Wrap compression/expansion | Instant cut plus labelled edge indicator for `300 ms`. |
| Orbit easing and mining packets | Static lock percentage/brackets and direct cargo update. |
| Hit recoil/fragments | Static impact glyph or dissolve; physics unchanged in both modes. |
| Pattern sweep/wipe | Immediate pattern change with `3 px` outline for `600 ms`. |
| Pulsing rare signal | Static high-contrast symbol and text label. |
| Menu slides/scales | `100 ms` opacity crossfade only; user may set UI transitions to Instant (`0 ms`). |
| Screen flashes | Luminance change capped at 0.12 with persistent icon/text. |

Reduced motion is available before campaign start, applies immediately, and never changes timing, hit boxes, AI, fuel, economy, difficulty, or save determinism. Optional screen shake is a separate setting with Full, Half, and Off; reduced motion forces effective Off without overwriting the stored preference.

Faction and state identification uses colour plus pattern and icon: player uses solid/forward chevron, rival 1 diagonal hatch/diamond, rival 2 dots/hexagon, rival 3 crosshatch/triangle, neutral horizontal stripe/circle, unknown broken outline/question mark. Hazard, positive discovery, selected target, friendly, and hostile signals may not share shape even if colours differ.

Text scale presets multiply a 16-px root by 100%, 115%, 130%, and 150%, producing `16/18.4/20.8/24 px`; there is no 14-px preset. At 150%, no essential HUD value truncates; secondary labels may wrap to two lines. DOM touch targets remain at least `48×48 CSS px`, primary controls use the larger §6.2 values, and 44 px applies only to direct map/canvas selection tolerance. UI layouts reflow rather than scale beyond the viewport.

No critical feedback is audio-only, colour-only, vibration-only, or motion-only. Subtitles/text labels exist for all semantic alerts. Rapid-input hold-repeat can be disabled, in which case each tap changes quantity by 1 and a `MAX` action remains available.

### 6.12 Performance and consistency feel budgets

- At supported desktop widths, p95 render frame time is `≤16.7 ms` during ordinary flight and `≤25 ms` during the heaviest included v0 effect on reference hardware.
- At supported mobile widths, p95 render frame time is `≤33.3 ms`; input event handling completes in `≤4 ms` p95.
- A feedback effect may allocate no more than 1 ms average scripting time per frame and must use pooled particles/objects.
- Maximum simultaneous cosmetic particles: desktop `180`, mobile `90`, reduced motion `24`. Excess spawns replace oldest low-priority particles; critical icons/text never drop.
- Visual RNG, camera noise, and UI animation must never consume or modify deterministic gameplay RNG.
- Pausing freezes simulation immediately but allows the menu transition and non-gameplay UI animation. Background visibility freezes both simulation and cosmetic emitters.

### 6.13 Feel acceptance checklist

- `F-01 Input`: p95 key/touch-to-pixel latency meets `50/85 ms` budgets; discrete buffering is exactly `120 ms`; bomb cannot key-repeat.
- `F-02 Movement`: from rest, unobstructed full command reaches `220 units/s` in `1.23±0.03 s`; full stop from top speed takes `0.786±0.03 s`.
- `F-03 Wrap`: crossing preserves velocity/facing and places the ship 20 units inside the paired edge; camera never sweeps across the map.
- `F-04 Camera`: deadzone, half-lives, lookahead caps, zooms, shake trauma additions, and decay match §6.4 at 30–144 Hz.
- `F-05 Station keeping`: lock eligibility, `350 ms` acquisition, 92-unit orbit, break thresholds, and same-tick manual release pass automated traces.
- `F-06 Mining`: authoritative extraction equals installed module rate; visual pulse cadence and all six interruption reasons map correctly.
- `F-07 Combat`: render holds never pause simulation; flash frequency/luminance stays inside limits; visual recoil never changes physics.
- `F-08 Discovery`: first rare reveal creates one timeline event and full feedback; repeat views do not replay the full reveal.
- `F-09 UI`: menus pause before becoming interactive, resume only after close, and use consistent confirm/cancel semantics.
- `F-10 Silent build`: the production bundle, settings, precache, and test API contain no audio implementation or asset.
- `F-11 Accessibility`: reduced motion produces every listed equivalent without changing authoritative state; 150% text and all touch-target minima pass viewport tests.
- `F-12 Difficulty`: changing preset modifies only disclosed knobs and neutral danger/reward values; all shared costs and rules remain identical.
- `F-13 Performance`: particle degradation drops cosmetic low-priority work before any semantic cue.
- `F-14 Determinism`: identical gameplay inputs yield identical state hashes with full motion, reduced motion, 30 Hz render, and 144 Hz render.

### 6.14 Feel alternatives rejected

| Alternative | Reason rejected |
|---|---|
| Full Newtonian drift | Makes touch station-keeping and low-friction routing harder without strengthening the strategic fantasy. |
| Instant direction changes | Removes mass and makes route/fuel forecasting visually incoherent. |
| Large gameplay hitstop | Would alter simultaneous combat outcomes and undermine deterministic real-time simulation. |
| Physics knockback on every hit | Steals course control and can force accidental hazard/sector transitions. Visual recoil carries the impact instead. |
| Manual standard-weapon firing | Adds rapid-input load and shifts the game toward a shooter; target selection is the intended combat verb. |
| Mining minigame | Interrupts travel/economy rhythm and adds a second control grammar. Precision comes from approach and station lock. |
| Automatic lock that ignores manual input | Feels like control theft. Manual steer/high throttle must break assist on the same tick. |
| Full-screen white flashes | Accessibility risk and poor phone readability. Local flashes plus persistent icons/text communicate impact. |
| Continuous decorative effects | Reduces contrast for discoveries, bombs, and death. Brief, ranked visual effects preserve hierarchy. |
| Motion removal with no replacement | Hides state from reduced-motion players. Every removed motion has a static/text/pattern equivalent. |
| Gamepad support without full QA | Creates an implied supported input mode. The current target explicitly ignores gamepad input. |
| Cosmetic effects consuming gameplay RNG | Breaks cross-device/reduced-motion determinism. Presentation uses an isolated seeded stream. |
## 7. Technology

This section is normative for the first implementation. Versions were resolved from the public npm registry on 2026-09-06. Production dependencies are pinned exactly in `package-lock.json`; automated dependency updates require the full deterministic replay, persistence, offline, and visual regression suites before merge.

### 7.1 Selected platform and compatibility floor

Venture Star is a client-only TypeScript application built by Vite and rendered by PixiJS. The distributable is the contents of `dist/`: static HTML, JavaScript, CSS, rasterized texture atlases, a web manifest, and a service worker. No gameplay feature, save operation, seed validation, record view, or asset lookup requires a runtime server.

| Concern | Decision |
|---|---|
| Language | TypeScript 7.0.2 with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `useUnknownInCatchVariables` enabled |
| Build/dev server | Vite 8.2.2 |
| Tactical renderer | PixiJS 8.20.1, one canvas, WebGL renderer selected explicitly |
| Menus and accessibility | semantic HTML/CSS overlay, not canvas text for blocking management screens |
| Package manager | npm 12.0.2 using committed lockfile and `npm ci` |
| Build runtime | Node.js 22.20.x; `.nvmrc` contains `22.20`; CI uses `22.20.0` |
| Unit/integration tests | Vitest 5.0.0 and `@vitest/coverage-v8` 5.0.0 |
| Browser/e2e tests | `@playwright/test` 1.63.0 |
| PWA integration | `vite-plugin-pwa` 1.3.0 in `injectManifest` mode |
| IndexedDB wrapper | `idb` 8.0.3; no ORM and no synchronous storage abstraction |
| Runtime schema validation | Zod 4.5.4 |
| Deterministic/property tests | fast-check 4.9.0 |
| IndexedDB tests | fake-indexeddb 6.2.5 |
| SVG raster/atlas build | Sharp 0.35.4, development-only |
| Lint | Oxlint 1.81.0; TypeScript semantic correctness is enforced separately by `tsc --noEmit` |
| Formatting | Prettier 3.9.6 |

Supported browsers are the latest two major stable releases at ship time of desktop Chrome, Edge, Firefox, and Safari, plus iOS Safari 17.4+ and Android Chrome 120+. Required APIs are ES2022 modules, WebGL 2, IndexedDB, Cache Storage, Service Worker, Pointer Events, Page Visibility, BroadcastChannel, ResizeObserver, and `crypto.subtle`. A browser missing WebGL 2 or IndexedDB receives a non-destructive compatibility screen with record-export instructions; it does not start a campaign in a degraded persistence mode. BroadcastChannel alone may fall back to `storage` events for lease notifications because IndexedDB remains the lease authority.

Target display and input envelope:

- CSS viewport: `360x640` minimum portrait; `640x360` minimum landscape; no maximum. `320x568` and `568x320` are graceful-reflow stress sizes, not supported gameplay minima.
- Device pixel ratio is clamped to `min(devicePixelRatio, 2)` for the Pixi canvas.
- Tactical simulation remains authoritative at 20 Hz regardless of a 30, 60, 90, or 120 Hz render rate.
- The renderer targets 60 rendered frames/s on a 2020-class mid-range phone and 120 frames/s on capable desktop displays, but never changes simulation outcomes to meet the target.
- Canvas backing dimensions are capped at `4096x4096`; oversized windows letterbox or reduce effective resolution rather than allocating beyond the cap.

### 7.2 Dependency policy and exact manifests

The initial `package.json` uses exact versions, not caret or tilde ranges:

```json
{
  "engines": { "node": ">=22.20.0 <23", "npm": ">=12.0.2 <13" },
  "dependencies": {
    "idb": "8.0.3",
    "pixi.js": "8.20.1",
    "zod": "4.5.4"
  },
  "devDependencies": {
    "@playwright/test": "1.63.0",
    "@types/node": "22.20.1",
    "@vitest/coverage-v8": "5.0.0",
    "fake-indexeddb": "6.2.5",
    "fast-check": "4.9.0",
    "oxlint": "1.81.0",
    "prettier": "3.9.6",
    "sharp": "0.35.4",
    "typescript": "7.0.2",
    "vite": "8.2.2",
    "vite-plugin-pwa": "1.3.0",
    "vitest": "5.0.0"
  }
}
```

PixiJS, Zod, and idb are the only runtime packages. Game rules, pathfinding, PRNG, checksums, state machines, market simulation, and input normalization are owned source modules. A new runtime dependency needs a written decision entry, bundle-size delta, licence check, offline verification, and deterministic-state review.

### 7.3 Runtime architecture

```text
HTML shell / semantic menus
        |
Input adapters ---- Accessibility/preferences
        |                    |
Command queue <------ UI presenters
        |
Fixed-step simulation (pure authoritative state)
        |---- sector physics at 20 Hz
        |---- strategy systems at 1 Hz
        |---- deterministic event journal
        |
Read-only render snapshot
        |---- Pixi tactical scene + galaxy map
        |---- DOM HUD and management screens
        |
Persistence coordinator ---- single-tab lease
        |---- IndexedDB snapshots/journal/records
        |---- JSON import/export
        |---- service-worker version gate
```

The architecture enforces command-query separation:

- Input adapters emit serializable commands such as `SetThrottle`, `SelectTarget`, `ActivateSpecial`, `ConfirmTrade`, and `AssignPlanetRole`.
- Commands enter a FIFO queue tagged with the next eligible simulation tick and a monotonically increasing sequence number.
- The simulation reducer is the only code allowed to mutate authoritative campaign state.
- Rendering receives immutable view snapshots and interpolation data. Renderer objects, DOM nodes, wall-clock timestamps, promises, and GPU resources never enter campaign state.
- UI presenters may derive forecasts from a cloned state, but only queued commands can commit outcomes.
- Persistence consumes committed events after reducer completion; persistence callbacks cannot mutate simulation state.
- AI planners emit the same typed command envelopes used by the player. They cannot invoke reducers directly.

The tactical screen uses one Pixi application and a stable scene graph: `background`, `sectorTerrain`, `staticBodies`, `ships`, `projectiles`, `effects`, `selection`, and `tacticalLabels`. Blocking menus, forms, tables, text-heavy records, pause affordances, and the tutorial are DOM overlays so browser zoom, screen readers, focus management, and selectable text remain available. The galaxy map may render its cells and routes through Pixi, with its controls and route details in DOM.

### 7.4 Deterministic simulation

#### 7.4.1 Fixed-step rules

- Authoritative tactical step: exactly `50 ms`, 20 Hz.
- Strategy step: exactly every 20 tactical ticks, 1 Hz.
- Frame accumulator processes at most five tactical ticks before a render. Excess accumulated wall time is discarded and emits `CLOCK_CLAMP`; it never advances later.
- Paused, hidden, lease-lost, resume-review, and terminal states schedule zero simulation ticks.
- Authoritative numeric values use signed scaled integers: position in milli-wu, velocity in milli-wu/s, fuel and cargo in hundredths, angle in unsigned 16-bit turns (`0..65535`), durations in ticks, percentages in basis points, and currency/health/influence in whole units. Formula helpers multiply before dividing, specify truncation direction, and reject overflow; floating-point values exist only in rendering and UI forecasts and never feed back into state.
- Multiplication and division use explicit integer helpers with truncation direction named in the function. No authoritative reducer uses `Math.random`, trigonometric functions, locale-sensitive formatting, system time, or floating-point epsilon comparisons.
- Collision, range, and route comparisons use squared integer distances. Render interpolation converts authoritative integers to floats only after state capture.
- Ordered collections that influence outcomes are arrays sorted by stable numeric entity ID. Object property enumeration, map insertion order from external data, and unstable sort tie-breaking are forbidden in reducers.

#### 7.4.2 Seed derivation and PRNG

Campaign seeds are displayed and accepted as exactly 16 uppercase Crockford Base32 characters encoding 80 bits. `Randomize` fills ten bytes with `crypto.getRandomValues`. Input is NFKC-normalized, trimmed, uppercased, maps `I`/`L` to `1` and `O` to `0`, rejects `U` and non-alphabet characters, then emits the canonical 16-character form.

Seed expansion is exact:

1. UTF-8 encode `venture-star|generatorVersion|canonicalSeed`.
2. Compute SHA-256 with `crypto.subtle.digest`.
3. Read four little-endian unsigned 32-bit words.
4. If all four words are zero, set word 3 to `0x9E3779B9`.
5. Initialize xoshiro128** with those four words. Rotation, multiplication, and masking are modulo `2^32` exactly.

Generation never consumes one global stream opportunistically. Each subsystem derives its xoshiro128** state from SHA-256 of canonical length-prefixed UTF-8 parts `(canonicalSeed,generatorVersion,domain,stableId)`: `topology`, `planets`, `nodes`, `discoveries`, `hazards`, `markets`, `faction:<id>`, and `opening-attempt:<index>`. Adding a discovery roll therefore cannot move planet locations or rival origins.

Runtime stochastic decisions use persistent faction or entity streams. Every random draw is represented by a committed event containing stream ID and pre/post draw counter. Replaying the command and event log from the same snapshot must produce the same state hash on every supported browser.

`generatorVersion` is an integer stored with the generated immutable `GalaxyDefinition`. Same-seed replay clones that stored definition rather than regenerating it with newer code. New campaigns use the current generator version. Migrations must preserve old galaxy definitions and state hashes; the app keeps reader/migration support for every released schema.

#### 7.4.3 Canonical state hashing

Canonical serialization recursively sorts object keys, preserves array order, rejects non-finite numbers, and emits UTF-8 JSON without insignificant whitespace. The authoritative hash is SHA-256 over the canonical UTF-8 JSON object `{schemaVersion,campaignId,tick,state}`; using an object avoids ambiguous byte concatenation. Hashes are used for replay validation, corruption detection, debug comparison, and casual-edit detection. They are not described as tamper-proof, authenticated, or cryptographically binding because all verification code and export material are client-side.

Determinism gates:

- 10,000 opening seeds produce identical generation hashes in Chromium, Firefox, and WebKit.
- A 30-minute recorded command stream produces an identical state hash at every 1,200-tick checkpoint across those browsers and at 30/60/120 render Hz.
- Save/reload at every strategy tick in a 10-minute scenario produces the same final hash as uninterrupted execution.
- Property tests cover wrapped coordinates, integer overflow boundaries, stable tie-breaking, PRNG substream independence, and migration idempotence.

### 7.5 Persistence, recovery, and permadeath integrity

#### 7.5.1 IndexedDB schema

Database name is `venture-star`; schema version starts at `1`. Object stores are:

| Store | Key | Value/indices |
|---|---|---|
| `campaigns` | `campaignId` | header, status, current tick, current sequence, snapshot pointer, lease nonce, schema/generator versions; indices `status`, `updatedAtWallMs` |
| `snapshots` | `[campaignId, snapshotSeq]` | uncompressed canonical state bytes, state hash, last journal sequence, seal fence |
| `journal` | `[campaignId, eventSeq]` | tick, command/event payload, previous hash, event hash, lease nonce |
| `records` | `campaignId` | immutable sealed summary, final map/timeline, terminal event/hash, export metadata |
| `leases` | `campaignId` | tab ID, random nonce, wall expiry, last acknowledged journal sequence |
| `settings` | `key` | accessibility, haptics, layout, tutorial, last setup; no campaign outcomes |
| `catalog` | `key` | achievements, discovery records, statistics, cosmetic eligibility |
| `quarantine` | `[campaignId, itemId]` | invalid import or corrupt tail plus reason; never loaded into live state |

Snapshots are canonical JSON encoded as UTF-8 bytes. v0 does not compress them: the maximum 10x10 snapshot budget is `512 KiB`, and avoiding compression reduces recovery risk. The full 30x30 budget is `2 MiB`; compression may be added only as a schema-versioned, checksummed storage codec with uncompressed fallback.

#### 7.5.2 Atomic writes

Every authoritative save uses one IndexedDB `readwrite` transaction spanning `campaigns`, `journal`, `snapshots` when needed, `records` for terminal events, and `leases`. The transaction:

1. reads and verifies current campaign sequence, valid lease nonce, status, and prior hash;
2. appends all committed events with consecutive sequences and hash links;
3. writes a snapshot when due;
4. updates the campaign pointer/status last within the same transaction;
5. commits as one unit or aborts with no visible partial outcome.

The reducer retains an in-memory copy of unpersisted committed events until transaction success. A failed write retries after `0`, `250`, and `1000 ms`, then every `5 s`. Gameplay adds `PERSISTENCE_BLOCKED` and pauses after the first failure. For nonterminal active play only, the player may explicitly choose `Continue at risk`; this holds events in memory for at most `120 active seconds` or `1 MiB`, whichever occurs first, then forces pause again. Export is available at v0.1. Terminal sealing never offers Continue at risk.

Persistence triggers match §3: every authoritative transaction, ownership/equipment/objective/sector/pause change and every 10 active seconds. Compact snapshots run every 60 active seconds and on Save & Quit. Recovery loads the newest valid snapshot, verifies its hash, follows the consecutive journal chain, discards only an invalid uncommitted tail into quarantine, and opens in Resume Review. Retained previous snapshots are the conceptual two recovery slots; there is no separate pending-pointer promotion protocol.

#### 7.5.3 Terminal transaction

Death and victory use a single high-priority transaction. For death it verifies the live lease, appends `DEATH_CONFIRMED`, writes a sealed snapshot with a seal fence, changes campaign status to `SEALED_DEFEAT`, writes the immutable record, and invalidates the lease. Victory performs the analogous `VICTORY_CONFIRMED`/`SEALED_VICTORY` transaction. UI and simulation enter an in-memory terminal state before the first storage await.

Before awaiting that transaction, the client also attempts a synchronous emergency tombstone in `localStorage` at `venture-star-terminal-fence:<campaignId>`, containing only terminal kind, terminal tick, campaign ID, pre-terminal state hash, and checksum. This is not a save or recovery source. It exists solely so a newly opened tab encountering an older live IndexedDB snapshot while the terminal transaction is retrying must enter `TERMINAL_RECOVERY` rather than resume. The tombstone remains after durable sealing and is removed only when the user explicitly deletes the sealed record. A malformed or mismatched tombstone quarantines the campaign and offers record export; it never authorizes live play.

Every older snapshot is interpreted in the context of the campaign header and terminal record. If either contains a valid terminal fence later than that snapshot, recovery reapplies the terminal state; no backup is a Continue point. Import refuses a payload that contains a live campaign state with a valid later terminal event or inconsistent fence.

If all three terminal writes fail, the page remains `MEMORY_SEALED_*`, creates a downloadable canonical record payload, blocks gameplay and campaign takeover for that ID in the current page lifetime, and retries when storage becomes available. No code path catches the error by returning to `ACTIVE`.

#### 7.5.4 Import/export

Export format is UTF-8 JSON with top-level `format: "venture-star-save"`, `formatVersion`, `exportedAt`, payload, canonical SHA-256 checksum, and the explicit warning `checksumDetectsCorruptionNotTampering: true`. Live exports include the current validated snapshot and journal suffix; sealed exports include the immutable record. Imports parse into `unknown`, enforce a `10 MiB` byte limit and Zod schema, reject duplicate keys through the streaming pre-parser, validate integer ranges and referential integrity, verify checksum/hash chain, migrate in a cloned transaction, and show a dry-run summary before commit.

An imported live campaign always receives a new campaign ID and starts paused. An imported sealed record retains its original lineage ID but uses a local storage key namespace to avoid collision. A valid imported defeat remains sealed. Unsupported future schema versions remain downloadable and are never partially imported.

### 7.6 Single-active-tab coordination

The lease protocol implements the exact 2 s visible renewal, 4 s paused renewal, and 6 s stale threshold in §3. Lease acquisition and journal append share IndexedDB authority; BroadcastChannel named `venture-star:<campaignId>` is notification only.

- Every tab creates a 128-bit random `tabId` and 128-bit random lease nonce with `crypto.getRandomValues`.
- Acquiring/taking control performs a read-modify-write IndexedDB transaction that compares status, expiry, nonce, and last journal sequence.
- Each successful renewal mirrors `(campaignId, tabId, nonce, heartbeatWallMs)` to `localStorage` for M27-compatible storage-event notification. The mirror cannot grant authority; a tab must still win the IndexedDB compare-and-swap.
- Every command batch carries the nonce observed at queue time. A nonce invalidated before commit causes the batch to abort and the tab to enter `LEASE_LOST` without applying another tick.
- `visibilitychange`, `pagehide`, `freeze`, explicit Save & Quit, and terminal transactions synchronously stop tick scheduling; best-effort flush follows.
- Forced takeover of a fresh lease requires the specified confirmation and a compare-and-swap update. The old tab cannot append after the nonce changes.
- Wall time is used only to arbitrate staleness. A clock jump may make a lease stale but cannot advance the campaign. Expiry compares `Date.now()` plus the stored issuance duration and is backed by notification; tests inject forward and backward jumps.

### 7.7 Offline/PWA and lifecycle behavior

The PWA uses `vite-plugin-pwa` `injectManifest` with a hand-authored `src/sw.ts`. The service worker precaches, with content hashes, `index.html`, application chunks, CSS, web manifest, fonts, raster atlases, and UI SVG fallbacks. Core assets must total no more than `18 MiB` compressed for v0, `28 MiB` for v0.1, and `45 MiB` at full target.

Caching rules:

- hashed build assets: cache-first, immutable;
- navigation: network-first with a 2-second timeout, then cached `index.html` scoped to the configured base path;
- no cross-origin runtime requests in production;
- no analytics, ad, telemetry, cloud-save, font-CDN, or licence-check call;
- imported files stay in IndexedDB and are never placed in Cache Storage;
- campaign saves stay in IndexedDB and are never controlled or deleted by the service worker.

The application calls `navigator.storage.persist()` after the player creates the first campaign, explains the request without claiming a guarantee, and displays current persistence status in Settings. A denied request does not disable play; it displays export guidance and performs a storage estimate before campaign creation. Creation is blocked when estimated free quota is below `25 MiB` for v0 or when a test write fails.

Service-worker updates download in the background but do not call `skipWaiting` while any live campaign tab exists. The UI offers `Update ready — save and reload`; accepting pauses, flushes, releases the lease, activates the worker, and reloads into Resume Review. An update may auto-activate only from the title/record screen when no live lease exists. Mid-run code/schema swapping is forbidden.

Offline gates:

1. load the deployed game online once and create a campaign;
2. disable network and hard reload under its GitHub Pages subpath;
3. resume, play 10 active minutes, save, close, reopen, and resume again;
4. finish victory or death and inspect the record;
5. verify zero failed runtime network dependencies and no state difference from the online command replay.

### 7.8 GitHub Pages and subpath deployment

Vite `base` is read from `VITE_BASE_PATH`, normalized to leading and trailing slash. Production default is `/venture-star/`; local development uses `/`. All static references use ESM imports, `new URL(path, import.meta.url)`, or `import.meta.env.BASE_URL`. Source code may not concatenate a root-relative `"/assets"`, `"/audio"`, worker, manifest, or navigation URL.

The GitHub Actions workflow performs `npm ci`, `npm run verify`, `VITE_BASE_PATH=/${{ github.event.repository.name }}/ npm run build`, and uploads only `dist/` through the official Pages artifact/deploy actions. The workflow creates no server rewrite. SPA navigation uses query/hash state or history paths confined to the single `index.html`; direct server routes are not used.

`npm run preview -- --base=/venture-star/` is not sufficient by itself because it can conceal path mistakes. The deployment test serves `dist` with a static no-fallback server mounted at `/venture-star/`, loads that exact URL in Playwright, verifies the service-worker scope, then rejects any request to an origin-root asset path.

### 7.9 Silent presentation runtime

No audio ships in v0, v0.1, or the full target. Production contains no audio files, audio manifest, `AudioContext`, mixer, audio controls, audio preload, service-worker audio entries, or audio-specific test hook. Gameplay events use the visual/text rules in §6 and optional haptics only. This 2026-09-07 product decision supersedes earlier audio direction.

### 7.10 Debug and automated-test API

The sole mutation-capable test surface is the exact `window.__ventureTest: VentureTestApi` interface in §10.3. It exists only when `import.meta.env.MODE === "test"`; ordinary development and every production build omit the property, its `TEST BUILD` watermark, and mutation-hook implementation chunks. Production may expose a version string and read-only render timing through its visible diagnostics screen, but no global mutation API.

The §10.3 API is deep-frozen, returns copies, and may advance ticks only after `clock.pauseScheduler()`. Tick stepping caps one call at 100,000 tactical ticks. Input methods use production adapters; fixtures load only before the first production simulation tick or through validated import. Storage/crash/lease/visibility fault methods act at named transaction boundaries and cannot directly set live health, ownership, credits, research, discovery, or terminal state. Every mechanic and loop test locates rendered UI through accessible roles/test IDs and uses the hook only for deterministic setup, clock control, fault injection, event/render logs, and authoritative assertions.

### 7.11 Project structure

```text
venture-star/
├── index.html
├── package.json
├── package-lock.json
├── .nvmrc
├── tsconfig.json
├── .oxlintrc.json
├── vite.config.ts
├── playwright.config.ts
├── public/
│   ├── manifest.webmanifest
│   └── icons/                    # installed-app icons only
├── src/
│   ├── main.ts                   # bootstrap, compatibility gate, lifecycle wiring
│   ├── app/App.ts                # screen router and service composition
│   ├── simulation/
│   │   ├── clock.ts
│   │   ├── state.ts
│   │   ├── commands.ts
│   │   ├── events.ts
│   │   ├── reducer.ts
│   │   ├── integerMath.ts
│   │   ├── prng.ts
│   │   ├── stateHash.ts
│   │   └── systems/              # flight, combat, mining, economy, AI, planets
│   ├── generation/               # topology, content, opening validator, versions
│   ├── persistence/              # IDB schema, transactions, recovery, import/export
│   │   └── importWorker.ts       # bounded parse/validate/migrate off main thread
│   ├── coordination/             # lease authority and tab notifications
│   ├── rendering/
│   │   ├── pixiApp.ts
│   │   ├── tactical/
│   │   ├── galaxy/
│   │   ├── effects/
│   │   └── atlases.ts
│   ├── ui/                       # semantic screens, HUD presenters, focus handling
│   ├── input/                    # keyboard, pointer, virtual joystick, commands
│   ├── accessibility/
│   ├── assets/generated/         # generated typed atlas manifests
│   ├── debug/
│   └── sw.ts
├── assets/
│   ├── svg/                      # canonical original vector sources
│   ├── atlases/                  # generated PNG/WebP sheets + JSON
│   ├── fonts/
│   ├── asset-manifest.json
│   └── CREDITS.md
├── scripts/
│   ├── build-atlases.mjs
│   ├── validate-assets.mjs
│   ├── check-determinism.mjs
│   └── serve-subpath.mjs
├── tests/
│   ├── unit/
│   ├── property/
│   ├── integration/
│   ├── e2e/
│   ├── visual/
│   └── fixtures/
└── docs/
    ├── architecture-decisions.md
    ├── asset-provenance.md
    └── save-schema.md
```

No generated atlas, manifest, or fixture may be edited by hand. `assets/svg`, source manifests, and provenance are source-controlled. Build output `dist`, Playwright output, coverage, and local databases are ignored.

### 7.12 Commands and continuous verification

| Command | Exact purpose |
|---|---|
| `npm ci` | install lockfile exactly |
| `npm run dev` | Vite development server on localhost |
| `npm run assets:build` | validate SVG sources and build 1x/2x atlases plus typed manifests |
| `npm run assets:check` | fail on invalid dimensions, IDs, colours, licences, overflow, or stale generated output |
| `npm run lint` | Oxlint with type-aware rules delegated to the mandatory TypeScript compiler pass; zero warnings |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit, property, and integration suites |
| `npm run test:e2e` | Playwright Chromium/Firefox/WebKit gameplay and lifecycle suites |
| `npm run test:determinism` | cross-browser seed and replay hashes |
| `npm run test:visual` | stable screenshot comparisons for required viewports/modes |
| `npm run build` | asset checks then Vite production build |
| `npm run test:subpath` | serve built output at `/venture-star/` with no root fallback and run offline/path checks |
| `npm run verify` | assets, lint, typecheck, unit/integration, build, subpath, and e2e gates |

CI fails on a dirty diff after asset generation, a bundle chunk over `500 KiB` compressed without a recorded exception, initial application JavaScript over `300 KiB` compressed, core precache over the release budget, any console error, any unhandled rejection, or any root-relative production request.

### 7.13 Performance budgets

| Budget | v0 requirement |
|---|---:|
| authoritative tactical tick p95 | `<=4 ms` desktop, `<=8 ms` target mobile |
| strategy tick p95, one rival | `<=6 ms` desktop, `<=12 ms` target mobile |
| render frame p95 at 60 Hz | `<=16.7 ms` target device |
| draw calls in ordinary sector | `<=80` |
| live display objects ordinary / stress sector | `<=500 / 1,200` |
| total decoded texture memory | `<=96 MiB` desktop, `<=64 MiB` mobile |
| initial interactive load from warm cache | `<=2.0 s` target phone |
| first online load on 10 Mbps | `<=5.0 s` to title |
| IndexedDB normal transaction p95 | `<=40 ms` |
| snapshot serialization p95 | `<=25 ms` and `<=512 KiB` |
| memory after 30 active minutes | `<=220 MiB` desktop, `<=160 MiB` mobile |

The `20 Hz` authoritative tick is decoupled from presentation. The tactical canvas receives every tick and redraws on `requestAnimationFrame`, interpolating each ship's wrapped position and heading between the previous and current tick by the fraction of `TICK_MS` elapsed, so motion is smooth at any display refresh rate without altering simulation authority. The camera follows the interpolated player position with a frame-rate-independent ease (`1 - e^(-dt/0.14s)`) and snaps rather than pans across a toroidal wrap. Reduced motion disables interpolation, camera easing, and parallax; it never changes ship physics. The HUD document rebuild stays throttled and is suppressed while a flight control is held, so it can never cost pointer capture or frames; canvas motion does not depend on it.

Offscreen AI operates on the 1 Hz strategy cadence. Tactical paths outside the current sector are represented as deterministic route legs and arrival ticks, not integrated at 20 Hz. Production, construction, influence, and markets use integer accumulators. Sensor-visible ships entering the active sector instantiate tactical entities from their strategic state without changing fuel, cargo, damage, intent, or arrival outcome.

### 7.14 Security and privacy boundaries

- There are no accounts, servers, analytics, ads, trackers, cookies, remote fonts, or cloud saves.
- Player-authored seed names, campaign names, and import metadata render via text nodes; they are never inserted as HTML.
- Imported JSON is untrusted and validated with size, depth `<=32`, collection-size, integer-range, schema, checksum, hash-chain, and referential-integrity limits before any database transaction.
- Service worker caches only same-origin allowlisted manifest assets.
- Content Security Policy is compatible with GitHub Pages and permits only self-hosted scripts, workers, fonts, media, styles, images, and blob URLs required for export; no `unsafe-eval` appears in production.
- Debug API, source maps, dev server client, and test fixtures are excluded from release builds. Production source maps are stored only as CI artifacts and are not deployed.
- Checksums detect corruption and casual modification; UI and documentation explicitly reject the claim that client-only data is tamper-proof.

### 7.15 Rejected technology alternatives

| Alternative | Decision and reason |
|---|---|
| Phaser | Rejected: its scene/physics conventions add a broader game framework than required; Venture Star needs a custom deterministic reducer and a thin high-performance renderer. |
| React for the whole application | Rejected: it adds runtime and reconciliation around a canvas-driven simulation. Semantic DOM screens use small owned presenters and web-platform primitives. |
| DOM/SVG tactical animation | Rejected: hundreds of animated SVG nodes and filters create mobile layout/paint overhead. SVG remains the canonical art source and is rasterized into Pixi atlases. |
| Canvas 2D immediate-mode renderer | Rejected: adequate for a prototype but less scalable for batched sprites, particle effects, filters, and 900-cell strategic views than Pixi/WebGL. |
| WebGPU-only renderer | Rejected: browser/device coverage and recovery behavior are narrower than WebGL 2. WebGPU may be evaluated later without changing authoritative systems. |
| Godot/Unity Web export | Rejected: larger payload, slower web bootstrap, more difficult DOM accessibility, and less direct GitHub Pages/PWA integration for this scope. |
| Server database or cloud save | Rejected: conflicts with offline-first, account-free, static deployment. |
| localStorage saves | Rejected: synchronous, small, non-transactional, and unsuitable for journals, snapshots, leases, or atomic death transactions. The emergency terminal tombstone is a deny-resume fence, never a save or state source. |
| One global `Math.random` stream | Rejected: non-replayable behavior and cross-system coupling make seeds fragile. |
| Variable-delta simulation | Rejected: outcomes vary with device/frame rate and hidden-tab throttling. |
| Web Worker simulation in v0 | Rejected initially: a worker complicates lifecycle, lease, debugging, and transaction authority before measured main-thread budgets justify it. The pure reducer boundary preserves later migration. |
| Automatic service-worker takeover | Rejected: updating executable/schema code during a live campaign risks split-version persistence. |
| Any audio library or wrapper | Rejected: the approved product is silent and requires no audio runtime. |

## 8. Assets

All shipped art is original Venture Star work or has explicit compatible provenance. SVG files in `assets/svg` are the canonical visual source. The build rasterizes gameplay assets to premultiplied-alpha atlas textures; production gameplay does not animate DOM SVG. Menus may display a static SVG logo or icon only when the element count and accessibility label are bounded.

The user approved the **Horizon Signal** direction on 2026-09-06. [`style-guide.md`](../../../style-guide.md) is the binding palette, line-weight, shape-language, SVG-convention, and accessibility source for asset production. The semantic roles below remain authoritative; where a draft palette token or hex differs, the approved style guide value supersedes it and asset validation reads the style guide.

The completed v0 set contains 190 approved canonical SVG sources under [`assets/svg/`](../../../assets/svg), with the review gallery at [`assets/venture-star-asset-gallery.html`](../../../assets/venture-star-asset-gallery.html) and per-batch/cohesion evidence under [`.omc/art/reviews/`](../../art/reviews). The user approved the complete set on 2026-09-07; implementation must consume these assets rather than replace them with temporary primitives or placeholders.

### 8.1 Art direction

The visual identity is **optimistic precision frontier**: crisp geometric spacecraft and instruments, deep navy space, luminous navigational marks, restrained energy effects, and warm inhabited-world signals. Shapes communicate purpose before decoration. Surfaces use two or three value planes, a single highlight edge, and sparse panel lines. No grime texture, photoreal stars, military camouflage, gothic machinery, neon overload, or species caricature.

Silhouette language:

- Player flagship: forward-pointing open chevron around a bright circular core; bilateral symmetry; cyan-white engine trail.
- Rival exploration ships: closed kite or spearhead; faction-specific notch pattern and flank markings; never a recoloured player silhouette.
- Planets: circular body plus orbital role glyph; ownership uses a patterned ring, not surface recolouring alone.
- Resource nodes: irregular but low-vertex clustered shards; each material has a unique internal cut pattern.
- Positive discoveries: radial asymmetry plus a slow outward signal motif; never share the red hostile triangle language.
- Hazards: broad translucent field shapes and boundary hatching, readable before particles.
- Weapons: narrow, directional, short-lived marks; mining beams are segmented and rhythmic, visually distinct from continuous weapon fire.

Every tactical silhouette remains identifiable when rendered as a single solid shape at `24x24 CSS px`, when desaturated, and under deuteranopia/protanopia/tritanopia simulation. Faction identity always combines colour, a two-bit border pattern, and silhouette/accent geometry.

### 8.2 Palette and usage rules

| Token | Hex | Required use |
|---|---|---|
| `space-950` | `#050914` | outer background |
| `space-900` | `#091426` | sector field and modal scrim |
| `space-800` | `#10233B` | panels and asteroid shadow |
| `space-700` | `#1B3852` | inactive borders and grid |
| `text-100` | `#F3F8FF` | primary text, maximum highlights |
| `text-300` | `#B9C9DA` | secondary text |
| `text-500` | `#7E94AA` | stale/disabled labels, never body text below contrast threshold |
| `player-cyan` | `#39D9E6` | player ownership, route, engine accent |
| `player-light` | `#BDFBFF` | player core and lock highlight |
| `rival-amber` | `#FFB547` | rival 1 |
| `rival-magenta` | `#C889FF` | rival 2 |
| `rival-lime` | `#9EDB6B` | rival 3 |
| `neutral-silver` | `#A9B3C2` | neutral ownership |
| `safe-teal` | `#4ED6A7` | safe status and recovery |
| `warning-gold` | `#FFD166` | caution, stale intel, medium danger |
| `danger-coral` | `#FF665E` | hostile/damage/critical |
| `discovery-magenta` | `#F07BD7` | rare positive scan/reveal |
| `ore-copper` | `#C98A63` | common trade ore |
| `metal-steel` | `#8FA6B8` | structural metal |
| `crystal-blue` | `#60AFFF` | energy crystal |
| `exotic-pink` | `#FF78C8` | exotic material |
| `fuel-green` | `#6FE7A6` | fuel only |

No gameplay meaning is encoded by colour alone. Player uses a solid ring and four-point-star emblem; rival 1 uses 45-degree diagonal hatch and split diamond; rival 2 uses dots and triple orbit; rival 3 uses crosshatch and chevron crown; neutral uses sparse horizontal marks and open circle; unknown uses dense crosshatch and question mark. Danger states pair colour with `!`, triangular geometry, boundary pattern, and text label. Contrast targets are 4.5:1 for body text, 3:1 for large text and meaningful UI graphics, measured against the actual composited background.

Gradients are limited to two stops and may appear on planet discs, energy cores, shields, and large panels. Blur radii may not exceed 12 source pixels. Tactical sprites use no drop shadow; depth comes from value separation and a one-pixel atlas-safe rim. Bloom is a batched effect layer, never an SVG filter per entity.

### 8.3 SVG source specification

Every source asset:

- uses a `viewBox` beginning at `0 0` with integer square dimensions;
- contains no script, external reference, embedded raster image, font text, filter, mask with unbounded region, CSS animation, or runtime variable;
- converts text to paths only for the logo; ordinary interface icons contain no text;
- uses palette tokens substituted by the atlas build, not undocumented colours;
- uses strokes of at least 1 source unit at 32-unit viewBox scale and aligns thin strokes to the pixel grid;
- expands strokes before atlas generation where renderer scaling could alter weight;
- includes `data-asset-id`, `data-state`, source author, creation date, and licence metadata in the source manifest rather than visible `<metadata>` payload;
- keeps geometry inside a 2-source-unit safe boundary and reserves an 8-pixel atlas extrusion at 2x output;
- passes SVGO-equivalent structural validation implemented by `validate-assets.mjs` without altering silhouette paths.

Canonical source sizes are `32`, `64`, `128`, `256`, or `512` square viewBox units. Non-square panel/background SVGs use dimensions divisible by 8. The atlas builder uses Sharp to rasterize losslessly at 1x and 2x, packs by sampling mode, extrudes edges by 2 output pixels, and emits PNG plus Pixi JSON. v0 and v0.1 use PNG for every atlas and backdrop. Full-target may introduce lossy WebP only through an approved asset-schema revision with pixel-difference and browser-decode gates; icons, sprites, glyphs, and effects remain PNG in every layer.

### 8.4 Scale, atlas, and animation conventions

| Class | Source viewBox | Nominal CSS size | Atlas variants | Sampling |
|---|---:|---:|---|---|
| HUD/UI icon | 32 | 24–32 px | 1x, 2x | linear; pixel-snapped placement |
| resource/node | 64 | 32–64 px | 1x, 2x | linear |
| small ship/projectile | 64 | 24–56 px | 1x, 2x | linear |
| flagship/rival ship | 128 | 48–96 px | 1x, 2x | linear |
| planet/large station | 256 | 96–220 px | 1x, 2x | linear |
| discovery centerpiece | 256 | 80–180 px | 1x, 2x | linear |
| logo/title mark | 512 | responsive, max 480 px | standalone SVG + 2x PNG fallback | browser/Pixi |
| nine-slice panel | divisible by 8 | variable | 1x, 2x with 8 px corners | linear |

Animation is transform/alpha/frame based in Pixi. Continuous ambient cycles use `2.0`, `3.0`, `4.0`, or `6.0 s` periods so effects can share phase buckets. Gameplay event animation reads committed events but never gates the event. Reduced motion replaces travel zooms, orbit drift, large scan sweeps, shake, and radial bursts with opacity or static-state changes of `<=200 ms`; it preserves lock, hit, warning, reward, and ownership information.

Sprite-sheet frame animation is reserved for shapes that cannot be expressed with transform/alpha. v0 budgets at most 64 unique frame sprites and 12 simultaneous particle emitters. Particles use pooled Pixi sprites, no runtime SVG parsing, and deterministic presentation seeds when screenshot tests require stability. The simultaneous cap is 180 desktop, 90 mobile, and 24 reduced-motion; oldest low-priority particles are reclaimed first.

### 8.5 Asset inventory and release ownership

Every listed v0 asset is required. Later assets remain excluded from v0 precache until their release layer ships.

#### 8.5.1 Brand, shell, and installed app

| ID/pattern | Count | Size/state requirement | Layer |
|---|---:|---|---|
| `brand.logo.horizontal` | 1 | 512x192 SVG, wordmark plus star/chevron symbol; monochrome-safe | v0 |
| `brand.mark` | 1 | 512 square SVG | v0 |
| `app.icon` | 4 | PNG 192, 512, maskable 192, maskable 512; 12.5% safe zone | v0 |
| `app.apple-touch-icon` | 1 | PNG 180 | v0 |
| `shell.starfield` | 3 | seamless 1024-square sparse layers; far/mid/near | v0 |
| `shell.loading-orbit` | 1 | 64 square, transform-animated | v0 |
| `shell.compatibility` | 1 | 256 square static illustration | v0 |

#### 8.5.2 Ships, planets, and world objects

| ID/pattern | Count | Source size and states | Layer |
|---|---:|---|---|
| `ship.player.flagship` | 1 base | 128; base, thrust, braking, damaged, critical, destroyed silhouette | v0 |
| `ship.player.cosmetic.*` | 3 | 128; same hit bounds and hardpoint anchors | full |
| `ship.rival.scout.f1` | 1 | 128; idle, thrust, damaged, destroyed | v0 |
| `ship.rival.scout.f2-f3` | 2 | 128 each; distinct silhouette | v0.1/full |
| `shipyard.orbital` | 4 ownership variants | 256; active, constructing, disabled, destroyed | v0 |
| `planet.base.*` | 8 | 256; rocky, oceanic, verdant, arid, ice, volcanic, gas, artificial | v0 has first 5; v0.1 adds all |
| `planet.ring.pattern.*` | 5 | 256 overlay; player, neutral, three rivals | corresponding rival layer |
| `planet.role.*` | 4 | 32 glyphs; mining, fortress, research, shipyard | v0.1 |
| `node.ore.*` | 3 | 64 shape variants; full, half, depleted | v0 |
| `node.metal.*` | 3 | 64 variants; full, half, depleted | v0 |
| `node.crystal.*` | 3 | 64 variants; full, half, depleted | v0 |
| `node.exotic.*` | 3 | 64 variants; full, half, depleted | v0.1 |
| `hazard.asteroid-field` | 4 tiles | 256 seamless edge-compatible tiles plus warning boundary | v0 |
| `hazard.ion-storm` | 3 tiles | 256 field/boundary/lightning layers | v0.1 |
| `discovery.abandoned-cargo` | 2 | 128; hidden-signal, revealed, claimed | v0 |
| `discovery.treasure-asteroid` | 2 | 128; dormant, revealed, cracked, claimed | v0 |
| `discovery.derelict` | 3 | 256; signal, intact, searched | v0.1 |
| `discovery.ancient-tech` | 1 | 256; signal, revealed, claimed | v0.1 |
| `discovery.artifact.*` | 6 | 256 unique silhouettes and reveal cores | full |
| `wormhole` | 1 | 256; dormant, linked, transit | full |

Destroyed ship art is a presentation state; the entity's authoritative destroyed state is committed before animation. Cosmetic player silhouettes may not alter bounds, anchors, exhaust positions used by mechanics, or target visibility.

#### 8.5.3 Tactical effects

| ID | Visual contract | Layer |
|---|---|---|
| `fx.engine.player` / `fx.engine.rival` | 64 tapered plume, idle/thrust/brake colour variants | v0 |
| `fx.mining-beam` | segmented 64 strip with pulse marker; never resembles weapon beam | v0 |
| `fx.range-lock` | 128 ring: acquiring dashed, locked double-line, broken outward ticks | v0 |
| `fx.scan` | 256 ring plus bearing ticks; rare scan uses magenta asymmetry | v0 |
| `fx.shield-hit` | 128 arc, 4 directional variants | v0 |
| `fx.armour-hit` | 64 sparks and plate chevron | v0 |
| `fx.hull-hit` | 64 coral core flash and debris | v0 |
| `fx.pulse-shot` | 32 projectile, muzzle, impact | v0 |
| `fx.bomb` | 64 projectile, armed marker, shield impact, defence impact | v0 |
| `fx.explosion.small/large` | 64/256, 8 frames each, alpha-premultiplied | v0 |
| `fx.discovery-reveal` | 256 radial motif plus static reduced-motion replacement | v0 |
| `fx.ownership-transfer` | 256 ring wipe; 150 ms static crossfade reduced-motion form | v0 |
| `fx.influence-broadcast` | 128 ordered wavelets and faction pattern | v0 |
| `fx.fuel-reserve` | 64 low-output green trail with crossed-weapon badge | v0 |
| `fx.ion-lightning` | 128, 6 deterministic shapes | v0.1 |

Effects use normal/additive blend only. Maximum screenshake, hit-pause, camera, and timing values are owned by §6; assets include required anchors and reduced-motion replacements but do not redefine those values.

#### 8.5.4 Galaxy map and HUD icon inventory

Required v0 icon set, each at 32 source units: `ship`, `home`, `planet`, `shipyard`, `market`, `fuel`, `cargo`, `credits`, `ore`, `metal`, `crystal`, `exotic`, `research`, `repair`, `shield`, `armour`, `hull`, `weapon`, `bomb`, `scanner`, `mining`, `influence`, `defence`, `objective`, `timeline`, `pause`, `all-stop`, `play`, `settings`, `zoom-in`, `zoom-out`, `center`, `route`, `wrapped-route`, `danger`, `stale-intel`, `unknown`, `discovery`, `filter`, `close`, `back`, `confirm`, `cancel`, `export`, `import`, `record`, and `tutorial`. Existing unused audio-control icons may remain in the approved source-art archive but are not included in runtime atlases or UI.

Map primitives:

- flight minimap: renderer geometry, not an asset — one cell per sector, an occupied-sector outline, and a ship marker positioned by fraction of sector;
- sector cell background: renderer geometry, not an asset;
- grid line: renderer geometry at 1 CSS px minimum;
- ownership pattern overlays: one 32 tile per player/neutral/rival pattern;
- danger bands: five 64 hatch tiles named `Haven`, `Near Reach`, `Far Reach`, `Verge`, `Antipode`;
- route line: renderer geometry with arrow texture and explicit edge-wrap portal glyph;
- fog: two 256 dither tiles, unknown and discovered/stale;
- sensor range: renderer geometry plus `sensor-edge` 64 repeating dash texture;
- objective pins: 32 base plus economic/strategic/discovery glyph overlays.

Each icon has a human-readable accessible label in the UI dictionary. Decorative canvas instances are `aria-hidden`; the semantic HUD exposes their value in text. Icon-only DOM buttons always receive an accessible name and 48x48 CSS px minimum hit target. A 44-px tolerance applies only to direct map/canvas selection where no DOM control is available.

#### 8.5.5 Panels and data presentation

UI chrome consists of one 32-corner nine-slice panel, one selected panel, one warning panel, buttons in default/hover/focus/pressed/disabled/destructive states, segmented meters for fuel/shield/armour/hull/cargo/influence, tooltip pointer, toast frame, modal scrim, and focus ring. Most components are CSS using palette tokens and border patterns; SVG is reserved for irregular corners, glyphs, and ownership patterns.

The interface font is **Atkinson Hyperlegible Next Variable**, vendored from `@fontsource-variable/atkinson-hyperlegible-next` package version `5.3.0` under OFL-1.1. The build ships its Latin WOFF2 variable file locally, uses weight 400 for body, 600 for controls, 700 for headings, enables tabular numerals in data columns, and falls back to `ui-sans-serif, system-ui, sans-serif`. The exact package tarball hash, upstream attribution, OFL text, and shipped file hash are recorded in provenance. No font CDN or runtime package import is used. Logo lettering is custom vector geometry and is not reused for body text.

### 8.6 Asset state contracts

| Gameplay state | Required visual outputs |
|---|---|
| target available | stable silhouette, range ring at 25% opacity, semantic action label |
| target selected | 2 px bracket, entity pattern, distance, current action |
| station assist acquiring | dashed ring closes over 350 ms; throttle lock cue |
| station locked | solid double ring, segmented beam, pulse progress, cargo destination flash |
| mining interrupted | ring breaks outward; one reason label: steering, throttle, damage, hostile, full, depleted |
| autopilot | path preview, stopping arc, destination pin, fuel forecast |
| wrapped route | visible boundary portal pair and matching letter marker on both edges |
| shield damage | directional cyan/owner-colour arc and shield meter loss |
| armour damage | steel sparks/chevron and armour meter loss |
| hull damage | coral core hit, silhouette damage state, hull meter loss |
| special armed | button/radial outline, ammo count, target validity; never colour only |
| rare scan | asymmetric magenta bearing, unique three-pulse rhythm, text category |
| stale intelligence | timestamp, broken outline, `stale-intel` glyph |
| emergency reserve | green low-thrust trail, crossed weapon/mining icons, explicit speed state |
| pause/hidden | `PAUSED` badge and desaturated frozen scene; no looping tactical motion |
| ownership transfer | old pattern retracts, new pattern resolves, role/state text updates |
| death | authoritative meters freeze at zero; sealed-record panel appears at 1.2 s normal or after a 500 ms static wreck in reduced motion; sealed badge persists |

Asset validation screenshots cover every row at desktop 1440x900, supported minimum portrait 360x640, representative portrait 390x844, supported minimum landscape 640x360, representative landscape 844x390, graceful-reflow stress sizes 320x568 and 568x320, 200% text scale, reduced motion, shake disabled, and three simulated colour-vision deficiencies.

### 8.7 Silent release decision

No audio ships in any approved release layer. There is no audio manifest, codec set, provenance track, audio directory, mixer, sound control, unlock flow, or audio precache. All cues use the visual/text language defined in §6, with optional haptics where supported. This binding 2026-09-07 decision supersedes all earlier audio proposals.


### 8.10 Asset manifest, provenance, and validation

`assets/asset-manifest.json` contains stable asset ID, release layer, source SVG path, source SHA-256, logical size, pivot, hit/display bounds, atlas group, sampling, states, palette tokens, animation metadata, reduced-motion substitute, author, and licence ID. The atlas builder emits generated file hashes and frame coordinates into `src/assets/generated/atlas-manifest.ts`.

Validation fails for:

- duplicate/missing IDs or states;
- colours outside named palette tokens;
- external SVG references, scripts, embedded bitmaps, text, filters, unbounded masks, or malformed paths;
- geometry outside viewBox/safe area, missing pivot/anchors, or asset/display-bound mismatch;
- missing 1x/2x atlas frame, edge extrusion, or stale generated output;
- a sprite that exceeds its declared texture-memory or CSS-size class;
- absent author/licence/provenance or incompatible licence;
- missing reduced-motion replacement for scan, discovery, ownership, death, wormhole, or other large-motion asset;
- faction/alert/resource recognition below 95% in automated contrast/silhouette checks or below 18/20 correct in a human identification test.

### 8.11 Asset acceptance gates

- All v0 inventory entries exist, validate, and are reachable through the typed manifest; no production code references raw asset filenames.
- Ordinary tactical scenes remain within 80 draw calls and 64 MiB decoded mobile texture memory with all v0 effects active at their declared cap.
- The player, neutral, and every enabled rival remain distinguishable at 24 CSS px in grayscale and all three colour-vision simulations without labels.
- Mining, hostile weapon, influence broadcast, rare discovery, fuel reserve, wrapped route, stale intelligence, and each damage layer are distinguishable in a 200 ms still/clip recognition test at phone scale.
- The production bundle contains no audio asset, audio manifest, sound control, Web Audio runtime, or audio cache entry; automated e2e play completes the first five minutes and terminal flow using visual/text feedback.
- A production build performs no runtime SVG parsing for tactical entities, requests no cross-origin asset, contains no missing atlas frame, and remains fully playable after offline reload.
- The exact title logo, faction marks, ship silhouettes, and discovery motifs are original or documented under approved licences and are not derived from the referenced inspiration game.
## 9. UX & Accessibility

This section is normative for every shipped screen. “Visible” means perceivable visually at 200% browser zoom and exposed to assistive technology where applicable. All dimensions are CSS pixels (`px`), not rendering-buffer pixels. All durations are wall-clock milliseconds (`ms`) for interface animation unless explicitly identified as simulation time. UI animation never advances or changes the deterministic simulation described in §4.

### 9.1 UX principles and measurable budgets

1. **Flight remains the home state.** New campaigns enter direct control before presenting strategy or administration. Closing a modal or management screen returns to the exact prior flight/map state and focus target.
2. **One action, one result.** A control changes one authoritative state or opens one clearly named layer. No icon changes meaning by screen without a visible label or accessible name.
3. **Forecast before commitment.** Routes show sector count, wrap crossings, fuel use, reserve risk, and maximum known danger. Purchases show resulting credits/cargo/loadout. Bombs and neutral attacks show target and consequence before confirmation.
4. **Status has redundant encoding.** Colour is never the only carrier of faction, danger, freshness, damage, target, selection, or validation state. Every such status combines at least two of text, icon, line pattern, silhouette, border shape, or position.
5. **Failure is recoverable and specific.** An error says what failed, whether campaign data is safe, and the next valid action. Generic “Something went wrong” text may appear only with a specific error code and recovery action beneath it.
6. **No hidden time.** Explicit pause, management UI, hidden document, and lost-tab lease visibly stop simulation. The game never catches up time after resume.

Input-to-visible-feedback budget is `≤50 ms` p95 for keyboard/pointer/touch down, `≤100 ms` p95 for screen transition start, and `≤250 ms` p95 for local data list population with 2,000 timeline entries on reference hardware. A blocking operation lasting `>500 ms` displays progress or a busy state. A busy state lasting `>10 s` exposes Cancel when cancellation is safe; save/death sealing cannot be canceled and instead says why.

Acceptance: `UX-T-001` input latency; `UX-T-002` transition latency; `UX-T-003` 200% zoom audit; `UX-T-004` redundant-status audit; `UX-T-005` slow-operation feedback.

### 9.2 Information architecture

The application contains five top-level destinations. Only one is active at a time:

| Destination | Purpose | Simulation | Entry |
|---|---|---|---|
| Home | Continue, new campaign, history, settings, credits | No campaign ticks | Boot; exit campaign |
| Flight | Direct ship control and tactical HUD | Running unless a pause reason exists | Continue/new campaign; close management |
| Galaxy | Discovered strategic map, routes, ownership, danger, intel | Paused | `G`; map button |
| Management | Docked market/refit/planet/research screens | Paused | Contextual dock actions |
| History | Sealed campaign records and comparison | No campaign ticks | Home; run-end summary |

Global settings and help are modal layers reachable from Home or Pause. They never replace or discard the underlying destination. During an active campaign the application shell exposes exactly these global actions: Resume/Continue, Pause, Galaxy, Timeline, Settings, Help, and Return to Home. “Return to Home” requests save, waits for success or displays the save failure decision, then releases the active-tab lease.

Management has a persistent local tab order:

`Overview → Market → Shipyard → Planet → Research`

Unavailable tabs remain visible but disabled with a reason. v0 ships Overview, Market, and Shipyard. Planet and Research appear at v0.1; before that release they are omitted rather than shown as “coming soon.” Contextual actions such as Mine, Scan, Collect, Dock, Occupy, Aid, and Bomb are tactical actions, not top-level navigation.

Every screen provides a visible title, a single primary action, an accessible landmark structure (`header`, `nav`, `main`), and a deterministic Back destination. Back never exits or overwrites a campaign without confirmation.

Acceptance: `UX-T-010` destination reachability; `UX-T-011` unavailable-tab reason; `UX-T-012` deterministic Back graph; `UX-T-013` landmark/name audit; `UX-T-014` return-home save/lease flow.

### 9.3 Boot, first campaign, continuation, and history flows

#### 9.3.1 Boot state machine

Boot proceeds through:

`SHELL → LOCAL_DATA_CHECK → ASSET_CHECK → HOME | RECOVERY | FATAL_COMPATIBILITY`

- `SHELL` renders the logo, version, an indeterminate progress label, and an accessible live message within `500 ms` of first paint.
- `LOCAL_DATA_CHECK` validates profile, campaign index, committed snapshots, journal chains, terminal fences, and sealed records before enabling Continue.
- `ASSET_CHECK` loads the minimum flight/UI bundle. Later content may load after Home becomes interactive; no audio is requested.
- `HOME` appears when core data and assets are usable.
- `RECOVERY` appears if a newer slot is corrupt, a journal is pending, a death/victory marker needs sealing, a lease exists, or storage is unavailable.
- `FATAL_COMPATIBILITY` appears only when required browser capabilities are missing; it lists the missing capability and supported-browser floor, and offers record export if storage is readable.

Offline boot uses cached core assets. If uncached and offline, show “Venture Star needs one online load on this device” with Retry; do not show New Campaign. Asset failure identifies the failed bundle, offers Retry, and preserves accessible Settings and stored History where possible.

#### 9.3.2 Home

Home orders actions by current data:

1. `Continue — <campaign name>` only for an active resumable campaign.
2. `New Campaign`.
3. `History (<record count>)` if at least one sealed record exists; otherwise `History` disabled with “No completed campaigns yet.”
4. `Import` at v0.1.
5. `Settings`, `Help`, `Credits`.

Continue includes seed abbreviation, galaxy dimensions, difficulty, simulation time, last safe save age, and status. It never appears for sealed victory/defeat. If an active campaign exists, New Campaign opens a confirmation: “Starting a new campaign archives the current active campaign as Abandoned. It cannot be resumed.” Buttons are `Keep current campaign` (default) and `Archive and start new`. Abandoned records are read-only and distinct from defeat.

#### 9.3.3 New-campaign setup

The setup is one responsive page, not a wizard. Field order is Seed, Galaxy Size, Rivals, Difficulty, Tutorial, then `Launch Campaign`. v0 locks `10×10` and one rival and displays them as plain values. v0.1/full use steppers and selects constrained by M01. A blank seed means random; entered seeds use the exact 16-character Crockford Base32 normalization in §7.4. A `Randomize` button creates and immediately displays a canonical 80-bit seed. Recommended rivals are marked “Recommended,” never silently forced.

Difficulty cards list every public modifier from M21. Tutorial defaults on for profiles with no campaign launched; otherwise it preserves the profile setting. Launch validates inline, disables repeat activation, shows `Generating galaxy — attempt N of 256`, then `Validating opening`, and enters Flight only after a valid save has been committed. Generation may be canceled before save commit; cancellation returns to setup with values intact. Deterministic repair after attempt 256 says “Opening repaired for playability” in campaign details, not as an alarming error.

#### 9.3.4 First control and opening guidance

On first Flight frame, the ship is centered, home planet is visible, simulation is paused behind a two-line launch card only if tutorial is enabled. The card states the active input modality and has `Launch` plus `Disable tutorial`. Launch restores simulation and focus/capture to flight. With tutorial disabled, control begins immediately and a non-modal control legend appears for `6 s` or until first input. The opening objective strip shows one actionable goal at a time: `Scan nearby signal → Approach ore → Hold position to mine 8 ore → Return home → Sell ore → Fit upgrade → Investigate discovery`. It may be collapsed; the opening opportunity remains available and no arrow reveals information outside earned sensor rules.

#### 9.3.5 Continue and recovery

Continue acquires the M27 lease, validates the newest committed snapshot, applies journal recovery, then displays a resume card with location, elapsed simulation time, last objective, save status, and `Resume`. Simulation remains paused until Resume. If the newest save is corrupt and a prior snapshot is valid, recovery states the exact rollback in simulation seconds and names the missing last transaction if known. Confirmed death/victory markers bypass Continue and open the sealed summary.

#### 9.3.6 Run end and History

Victory, defeat, and abandoned records use distinct headings and icons. The summary order is Outcome, Seed, Duration, Final known map, Acquisition breakdown, Key statistics, Discoveries, Timeline. Primary action is `New galaxy`; secondary is `Replay seed`; tertiary is `View record`. No Continue control exists. Death copy states “Flagship destroyed — this campaign is permanently sealed” and identifies the fatal source.

History sorts by ended timestamp descending and filters by outcome, seed, difficulty, dimensions, and rules version. Each row exposes outcome, started/ended dates, `simulationDuration`, `engagedDuration`, `wallSpan`, dimensions, difficulty, planets controlled, discoveries, and seed. The 45–75-minute campaign target is labelled against engaged duration. Opening a record is read-only; all controls that would mutate campaign state are absent, not merely disabled. Full release adds comparison of 2–4 selected records; values are aligned by metric, missing version-specific metrics say “Not recorded in rules vN,” and lower/higher-is-better is not inferred for morally neutral statistics.

Record deletion requires the record title/seed to be shown, with default `Cancel`, destructive `Delete record`, and a second confirmation only when it is the last copy of an exported-never record. Deletion is local and irreversible; deleting a record never deletes achievements/cosmetics earned from it.

Acceptance: `UX-T-020` cold online/offline boot; `UX-T-021` Home action conditions; `UX-T-022` active-campaign replacement warning; `UX-T-023` setup validation/generation cancellation; `UX-T-024` tutorial/no-tutorial launch; `UX-T-025` recovery rollback disclosure; `UX-T-026` death marker bypasses Continue; `UX-T-027` sealed History has no mutation actions; `UX-T-028` replay/new-seed distinction; `UX-T-029` record filters/comparison; `UX-T-030` record deletion confirmations.

### 9.4 Responsive layout, breakpoints, orientation, and safe areas

Layout is selected from viewport CSS width, height, pointer precision, and safe-area insets. User-agent strings do not select layouts.

| Class | Condition | Tactical layout | Management layout |
|---|---|---|---|
| Compact | width `<600` | Edge HUD; touch controls if coarse pointer | Single column; bottom tabs |
| Medium | width `600–1023` | Edge HUD; controls by modality | One/two column; bottom or side tabs by height |
| Wide | width `≥1024` | Left status, right target, bottom action bar | Persistent left nav; content max width `1,280` |
| Short | height `<480` | Condensed bars; noncritical labels collapse | Full-height scroll; sticky title/actions |

Landscape and portrait gameplay are supported at minimum `360×640` and `640×360`. `320×568` and `568×320` are graceful-reflow stress sizes: essential status, pause, save/exit, and compatibility guidance remain operable, but full tactical touch-layout support is not claimed. No gameplay instruction requires device rotation. On compact portrait, ship status occupies the top-left, target card top-right, objective beneath top bar, joystick bottom-left, throttle adjacent, and actions bottom-right. On compact landscape, objective collapses to one line, joystick/throttle remain left, actions right, and alerts occupy top center. On wide screens, playable scene fills the viewport; HUD columns are each `≤320 px`, leaving at least `50%` width unobstructed at `1,024 px`.

Root UI padding is `max(12px, env(safe-area-inset-*)))` on each relevant edge. Touch controls add their own `8 px` clearance beyond the safe inset. No interactive target, toast dismissal, vital status, or primary action intersects a cutout/home indicator. Viewport resize/orientation change preserves selection, route, scroll position per panel, pause reasons, and joystick neutrality; any active pointer gesture is canceled before relayout.

At `200%` browser zoom, content reflows without two-dimensional page scrolling; tactical controls may overlap the canvas but not one another. Management body scrolls vertically; headers and primary action bars remain sticky. At text scale `200%`, compact cards expand vertically and truncate only nonessential proper-name subtitles after two lines. Essential amounts, warnings, and button labels never ellipsize.

Acceptance: `UX-T-040` breakpoint boundary snapshots at 599/600/1023/1024; `UX-T-041` supported portrait/landscape parity; `UX-T-042` 360×640 and 640×360 gameplay plus 320×568 and 568×320 graceful-reflow stress; `UX-T-043` safe-area synthetic insets; `UX-T-044` resize cancels gesture/preserves state; `UX-T-045` 200% zoom/reflow; `UX-T-046` 200% text no essential truncation.

### 9.5 Fixed desktop controls

Keyboard bindings are intentionally fixed and documented in Help and Pause. Browser-reserved shortcuts are not intercepted except Space while the canvas owns focus. Key activation ignores auto-repeat unless marked continuous.

| Input | Action | Repeat | Context/guard |
|---|---|---|---|
| `W` or `ArrowUp` | Forward thrust | Continuous | Flight only |
| `S` or `ArrowDown` | Brake; reverse thrust once speed `<2 wu/s` | Continuous | Flight only |
| `A` or `ArrowLeft` | Turn left | Continuous | Flight only |
| `D` or `ArrowRight` | Turn right | Continuous | Flight only |
| `Tab` / `Shift+Tab` | Cycle hostile target forward/back | Edge | Flight; prevents browser focus traversal only while canvas owns focus |
| `E` | Primary contextual action | Edge | Visible context action exists |
| `R` | Plot/cancel autopilot to pointer/map selection | Edge | Destination selected |
| `1` | Activate/confirm fitted bomb | Edge | M16 guards apply |
| `H` | Toggle cannon hold-fire | Edge | Flight |
| `G` | Open/close Galaxy | Edge | Active campaign |
| `T` | Open/close Timeline | Edge | Active campaign |
| `I` | Open/close cargo/loadout inspector | Edge | Active campaign; pauses |
| `Space` | Toggle explicit pause | Edge | Canvas owns focus; not while typing |
| `Escape` | Close top dismissible layer; otherwise open Pause | Edge | Never confirms/destructs |
| `Enter` | Activate focused UI control | Edge | Menus only |

Pointer primary click selects; double-click is never required. Secondary click on canvas opens the contextual menu; the same menu is reachable with `E`/keyboard focus. Mouse wheel zooms Galaxy only when pointer is over it; browser page zoom shortcuts remain native. Controls are not remappable in shipped scope. Help explicitly says they are fixed.

On `blur`, `visibilitychange`, modal open, or focus entering a text field, every held flight key is cleared next simulation tick. Returning focus never resumes thrust until a fresh keydown. Keyboard layout uses `KeyboardEvent.code` for physical WASD while displaying localized labels for arrow alternatives. Focus-visible outline is `3 px` with `2 px` offset and contrast `≥3:1` against adjacent colours.

Acceptance: `UX-T-050` binding matrix; `UX-T-051` no repeat on edge actions; `UX-T-052` held-key clear; `UX-T-053` Space/input-field isolation; `UX-T-054` Escape never commits; `UX-T-055` fixed-controls Help accuracy; `UX-T-056` focus-visible contrast.

### 9.6 Mobile and coarse-pointer flight controls

Touch mode activates when the primary pointer is coarse or the user explicitly selects Touch Controls. Hybrid devices retain last-used modality for `10 s`; touching the canvas reveals touch controls, while keyboard/mouse use dims them to `35%` after `3 s` but does not remove them if Touch Controls is forced.

#### 9.6.1 Touch target and gesture contract

Every interactive touch target is at least `48×48 px`, separated from another destructive/incompatible target by `8 px`. Primary special actions are at least `56×56 px`. Icon-only controls have a visible tooltip on focus/long-press and an accessible name. Tap activates on pointer-up within target; moving `>12 px` cancels a tap and becomes a drag. Long-press threshold is `500 ms`; no essential action requires long-press. Double-tap and multi-touch gestures are never essential.

#### 9.6.2 Virtual joystick

Joystick zone is `152×152 px` compact and `176×176 px` medium, anchored bottom-left above safe area. Its visual base is `112 px`; the initial touch inside the zone sets the temporary center, clamped so the knob remains within the zone. Dead zone is `12%`; output remaps linearly to `0…1` per M04. Radial direction controls turn target, magnitude controls forward thrust. A second touch does not steal the joystick. Pointer-up/cancel, orientation change, pause, layer open, or document hide zeros output within `50 ms`. A `Fixed joystick center` accessibility setting pins the center without changing output rules.

Haptic feedback, where supported and enabled, uses the §6.10 durations: lock `15 ms`, cargo full `40 ms`, hostile damage `50 ms`, kill `90 ms`, and bomb impact `120 ms`, with no vibration admitted more than once per `250 ms`. Reduced motion forces shake off but does not disable haptics; haptics has its own toggle.

#### 9.6.3 Throttle and brake

Throttle is a vertical `56×176 px` control immediately right of joystick in landscape and horizontal `176×56 px` above it in portrait when width is insufficient. It is a persistent setpoint `0%, 25%, 50%, 75%, 100%`; drag is continuous but snaps within `6%` of a notch. A centered Brake button `56×56 px` applies M04 brake only while held. Throttle setpoint remains after joystick release; opening a modal, hidden document, or emergency drift sets throttle to `0%` and requires deliberate restoration. Screen-reader mode replaces drag throttle with decrement/value/increment controls and announces the percent.

#### 9.6.4 Tap selection and contextual actions

Tap candidates use M13's `44 px` radius and priority. Selection displays a target ring plus target card; tapping selected empty space clears it unless a route-preview placement is active. A context bar above the bottom safe area contains at most three actions ordered: immediate interaction (`Dock/Mine/Scan/Collect/Occupy`), `Autopilot`, special action (`Aid/Bomb`). Overflow appears as labeled `More`, never icon-only.

Tap-and-hold on empty tactical space for `500 ms` previews a local autopilot destination; releasing shows `Go`/`Cancel`, so long-press is a shortcut, not the only path. Galaxy single-tap selects a sector and opens its route sheet; `Start autopilot` is explicit. Pinch zoom is optional convenience; `+` and `−` buttons at `48×48 px` always exist.

#### 9.6.5 Special weapon safety

Bomb control is `64×64 px` where space permits, never smaller than `56×56`, visually separated `12 px` from routine actions, and displays ammo as text. First use against neutral opens the target-named confirmation sheet. Holding cannot repeat. During cooldown it remains visible with numeric seconds and radial/non-motion fill; unavailable reasons are textual.

Acceptance: `UX-T-060` touch target geometry; `UX-T-061` joystick dead zone/remap/cancel; `UX-T-062` multi-touch ownership; `UX-T-063` throttle persistence/reset/screen-reader controls; `UX-T-064` target candidate priority; `UX-T-065` context action order/overflow; `UX-T-066` autopilot preview/confirmation; `UX-T-067` zoom button parity; `UX-T-068` bomb spacing/confirmation/no-repeat; `UX-T-069` optional haptics patterns.

### 9.7 Tactical HUD hierarchy

HUD elements are ordered by urgency and may collapse only from the bottom of this list:

1. **Critical survival:** hull, armour, shield, fuel/reserve state, active severe hazard, pause/lease/save-failure state.
2. **Immediate control:** speed, throttle, heading, station lock, autopilot state/interrupt reason, selected target, weapon state/ammo.
3. **Interaction:** contextual action, mining progress/rate/full-cargo reason, scan progress, docking/occupation channel.
4. **Navigation:** sector coordinates, danger band, minimap position, route next step, wrap indicator, route fuel forecast. The minimap is itself the control that opens the galaxy map, and it fires a scan pulse on the live sector before the galaxy pauses the simulation.
5. **Economy:** cargo used/capacity, credits, carried material totals.
6. **Strategy:** planet-count progress, research/production summary, noncritical alerts. The current objective is not shown on the flight HUD — it competes with the context bar for the same screen edge — and appears in the pause menu instead.

Market rows quote buy and sell prices in separate labelled columns, never a combined `buy / sell` pair, and every trade control states the total it will move: `Buy 5 · 45 cr`, `Sell 5 · +35 cr`. `Max buy` and `Max sell` are distinct, because the largest legal buy and the whole held stack are different numbers. A button whose label is its own glyph keeps that label visible; the icon-button treatment that hides labels is only for buttons carrying an icon.

Bars include numeric values when focused, in critical state, or `Show HUD numbers` is enabled; the default always shows `fuel current/max`, `cargo used/max`, and bomb count numerically. Shield/armour/hull use distinct icons and line treatments. Health order remains shield over armour over hull in every layout. Critical hull (`<25%`) uses the word `CRITICAL`, triangular warning icon, and optional pulse; reduced motion replaces pulse with a static double border.

Fuel turns warning at forecasted home margin `<15 FU` and displays `LOW FUEL`; emergency displays `EMERGENCY DRIFT — weapons and mining offline`. Cargo full displays `FULL` and names the blocked activity. Autopilot status is one of `Plotting`, `Travelling`, `Approaching`, `Arrived`, or `Interrupted: <reason>` and is never communicated only by a route-line colour.

Every contextual action mirrors the simulation's own preconditions exactly: an offered action always succeeds, and a blocked one names the specific reason it is blocked (range in `wu`, closing speed, throttle, magazine, reload, emergency drift, cargo, service lock, or ownership). A control that silently does nothing is a defect, not a hint.

The selected target card shows name/type, relation/faction pattern, distance in `wu`, health layers if known, interaction range state, and — for a resource deposit — remaining yield against the yield it held when generated. It carries no action buttons: actions are rendered once, in the context bar, because showing the same `Dock`/`Autopilot`/`Bomb` row in both places reads as two different controls. For a planet it also names what the market pays, led by whatever the hold is carrying, so the player can judge where to sell before spending fuel to get there. The galaxy map marks the same planets with a market glyph under the `Trade intel` filter, which is on by default. Unknown values display `Unknown`, not zero. Dynamic intel carries `LIVE`, `RECENT`, `STALE`, or `UNKNOWN` text and timestamp/age; static geography is not mislabeled stale.

The flight screen carries a persistent minimap: one square cell per galaxy sector at the campaign's `width×height`, the occupied sector outlined, charted sectors filled and uncharted sectors left dim, known planets marked with their ownership colour, known hazards hatched, and a marker showing the ship's fractional position inside its sector. It is decorative to assistive technology; the same information is exposed as a text readout naming the sector, the percentage across and down the sector, and the charted-sector count. The marker tracks the ship every simulation tick even on ticks where the HUD document is not rebuilt.

HUD opacity never drops below `85%` behind text. Text contrast is `≥4.5:1` normal and `≥3:1` at `≥24 px` or `≥19 px bold`; non-text controls/essential graphics are `≥3:1`. Canvas scenery behind HUD receives a stable scrim to preserve contrast.

Acceptance: `UX-T-070` priority collapse matrix; `UX-T-071` health/fuel/cargo numeric semantics; `UX-T-072` critical reduced-motion substitute; `UX-T-073` autopilot reason copy; `UX-T-074` unknown versus zero; `UX-T-075` HUD contrast under brightest/darkest scene; `UX-T-076` minimap reflects sector, charted fog, and live ship position.

### 9.8 Galaxy map, route sheet, fog, and strategic legibility

Galaxy uses a square-cell grid fitted to viewport with zoom `0.5×…3×`. Cell minimum selectable size is `44 px`; when zoomed smaller, tapping selects the nearest cell in a `44 px` hit box while highlighting only the actual cell. Coordinates are `X,Y` with origin marked. Opposite edges display paired wrap glyphs and coordinate continuations. A route crossing an edge is a continuous dashed path to a labeled edge portal and resumes at its paired portal; it must never look like a teleport caused by a broken line.

Each discovered cell shows terrain glyphs, known planet, ownership pattern, and named danger band. Undiscovered cells show one neutral crosshatch and no inferred ownership/hazard. Danger bands combine name, 0–4 chevrons, and texture density: Haven `○`, Near Reach `›`, Far Reach `»`, Verge `▲`, Antipode `◆`. The seeded regional strength modifier does not rename the Euclidean-distance band. Faction encoding follows §9.13.

Selecting a cell opens a route sheet with Destination, Wrapped distance, Crossings, Estimated fuel plus `5%` margin, Remaining fuel, Reserve impact, Highest known danger, Known hazards, Intel freshness, and `Start autopilot`. Unknown route segments say “Unknown conditions” and use a dotted line. A route forecast entering reserve requires explicit `Use emergency reserve` confirmation; a negative usable-fuel forecast is blocked unless emergency drift can physically reach a known accessible planet, otherwise no route starts.

Filters are Planets, Resources, Hazards, Discoveries, Factions, and Trade Intel. Filter buttons are toggles with selected text/state, persist per profile, and never reveal undiscovered data. `Center on ship`, zoom buttons, and legend are always available. Escape/Back returns to Flight with route preview retained but not started.

Acceptance: `UX-T-080` wrap-route continuity; `UX-T-081` 44 px cell selection; `UX-T-082` fog non-leak; `UX-T-083` danger redundant encoding; `UX-T-084` route sheet exact fields; `UX-T-085` reserve route gates; `UX-T-086` filter persistence/no information leak; `UX-T-087` map keyboard navigation.

### 9.9 Docked management, trade, refit, planets, and research

Docked screens display planet name/owner pattern, paused badge, ship vital summary, credits, cargo, and a persistent `Launch` action. Closing a subpanel returns to Overview; only Launch undocks. Ownership loss replaces all management content with `Planet captured — emergency launch` and performs M11 ejection.

Market rows show material name/icon, player quantity, cargo weight, planet stock, buy price, sell price, intelligence state, and quantity stepper. Quantity defaults `1`; `Max` calculates stock, affordability, and capacity. Purchase summary displays credits and cargo before→after. Confirm commits once and announces result. Disabled confirm states the limiting resource. v0.1 adaptive price pressure is explained in a details disclosure with recent direction (`Rising/Stable/Falling`), not a future guaranteed price.

Shipyard shows three generic module slot cards in v0, four after the paid R-02 unlock in v0.1, and never more than five in Full. All six v0 families compete for the same generic slots. Inventory items show price/value, before→after stat deltas with units, research/stock requirements, and rejection reason. Selecting a legal item previews all resulting stats before `Buy and fit`, `Fit`, `Swap`, or `Sell`. Capacity/tank violations identify excess cargo/fuel and provide legal actions; no inventory is silently discarded.

Planet screen at v0.1 shows the five tracks, capacity `used/10`, production rate, upkeep, current role modifiers, queue, and the canonical `150 cr + 4 metal`/`45 s` role cost and time. Role comparison displays lost as well as gained output. Research shows the ten-project §5.7 directed acyclic tree, current RP, income rate, costs, prerequisites, exact unlock, and preserved per-project progress before switching; there is no cancellation refund.

All management tables support logical keyboard row navigation, sort controls with announced direction, and a card alternative on compact screens. Horizontal scrolling is not required at `320 px`; columns collapse into labeled key/value rows.

Acceptance: `UX-T-090` dock tab availability; `UX-T-091` trade before/after and atomic announcement; `UX-T-092` Max limiter; `UX-T-093` refit delta/guard; `UX-T-094` planet capacity/role loss display; `UX-T-095` research prerequisite/progress-preserving switch; `UX-T-096` 320 px graceful table reflow; `UX-T-097` capture ejection UI.

### 9.10 Overlays, pause reasons, modal stack, and focus

The interface tracks pause reasons as a set: `EXPLICIT`, `MANAGEMENT`, `GALAXY`, `HIDDEN`, `LEASE_LOST`, `RECOVERY`, `RUN_END`. Clearing one reason never resumes while another remains. A visible `PAUSED` badge appears within `100 ms` and, on activation, lists every current reason. Management and Galaxy always add/remove their reason. Timeline is a non-pausing drawer during Flight by default; selecting an event’s Galaxy location opens Galaxy and pauses.

Layers have this strict z-order:

1. Canvas world.
2. Tactical HUD and touch controls.
3. Non-modal objective/toasts.
4. Drawer/context menu.
5. Full-screen management/Galaxy.
6. Modal confirmation/settings/help/pause.
7. Critical recovery, lease, death, victory.

Only one layer at levels 4–7 accepts input. Opening a higher layer suspends lower-layer pointer capture, clears held flight inputs, and stores the invoking focus element. Escape closes only the top dismissible layer. Critical run-end/death transaction layers are not dismissible. Modal focus is trapped; initial focus goes to heading for informative dialogs, safest action for confirmation dialogs, or first invalid field for validation. Closing restores the invoker if it still exists, otherwise the containing screen heading. Background is `inert` and excluded from the accessibility tree.

Explicit Pause offers Resume, Galaxy, Timeline, Settings, Help/Controls, Save status, Return Home. Pause animations stop after `200 ms`; simulation was already stopped before animation. Opening browser permission/file pickers adds `HIDDEN`/system pause as appropriate. On return, a Resume card prevents accidental thrust or bomb activation.

Acceptance: `UX-T-100` compound pause reasons; `UX-T-101` layer input exclusivity; `UX-T-102` Escape stack; `UX-T-103` modal focus trap/restore/inert; `UX-T-104` held input clear; `UX-T-105` run-end non-dismissible; `UX-T-106` system-dialog resume guard.

### 9.11 Alerts, toasts, and campaign timeline

Alert presentation follows M30. Critical alerts occupy a persistent banner beneath the top safe area until acknowledged or resolved. Major alerts produce an `8 s` toast; info alerts `5 s`. Hover, keyboard focus, touch hold, explicit pause, and hidden documents freeze dismissal time. Auto-dismissed alerts remain unread in Timeline; dismissal is not acknowledgment.

Toast anatomy is severity icon/text, concise message `≤90` characters, simulation timestamp, optional one action, and a `48×48 px` dismiss control. A location action opens Galaxy centered on the last-known sector and labels intelligence age. Critical bypasses the 2-second throttle; noncritical queue count appears as `+N alerts`. Coalesced alerts state count and first/last time.

Timeline opens as a `min(420 px,100vw)` drawer on wide/medium or full-screen sheet on compact. It supports filters `All, Critical, Planets, Rivals, Economy, Discoveries, Combat`, text search, newest/oldest ordering, and jump-to-location where known. Events held by fog do not appear until learned. “Occurred at unknown time” is distinct from a precise timestamp. Up to 2,000 events render through virtualization while preserving DOM focus and screen-reader position.

Screen-reader announcements use `role=status` polite for info/major and `role=alert` assertive for critical, except repeated combat damage is summarized at most once per `5 s`. Toast text is also available in a persistent notification log so transient timing never blocks access.

Acceptance: `UX-T-110` durations/freeze; `UX-T-111` critical persistence; `UX-T-112` throttle/queue/coalescing; `UX-T-113` fog-held event; `UX-T-114` timeline filter/location/intel age; `UX-T-115` 2,000-event focus virtualization; `UX-T-116` live-region rate limiting.

### 9.12 Tutorial, objective guidance, and help

v0 provides a permanent Controls/How to Play reference and the opening objective strip. v0.1 enables M32’s optional six-lesson tutorial. Lesson triggers and exact completion conditions are:

| Lesson | Trigger | Prompt | Completion |
|---|---|---|---|
| Flight | First launch | Steering, throttle, brake, pause | Travel `100 wu` and stop below `2 wu/s` |
| Mining | First mineable signal scanned | Approach, range lock, cancellation, cargo | Receive one material unit |
| Trade | First dock with sellable cargo | Select quantity, sell, price freshness | Complete one sale |
| Equipment | First sale leaving an affordable upgrade | Slot, preview delta, buy/fit | Fit one upgrade |
| Influence | First neutral planet in interaction range | Trade/aid/broadcast and thresholds | Gain influence by one legal action |
| Conquest | First hostile planet selected while bombs available | Shields, defence, infrastructure risk, occupation | Damage shield or dismiss lesson |

Only one lesson may be visible. Later triggers queue in the order above but are dropped if their context ceases to exist; they trigger again on the next valid context. Tutorial cards do not trap focus or intercept steering. Each includes `Got it`, `Open full help`, and `Turn off tutorial`. Disabling is immediate and reversible in Settings; completed lessons never auto-repeat. Safety confirmations listed in M32 are independent and cannot be disabled.

Help is searchable and organized as Controls, Flight/Fuel, Mining/Cargo, Trade/Equipment, Planets, Combat, Galaxy/Intel, Saving/Permadeath, Accessibility. It displays desktop and touch instructions side by side when both modalities exist, with the most recently used first. Every icon in Help matches the live UI. A `Reset tutorial progress` setting requires one confirmation and affects only profile lesson flags.

Acceptance: `UX-T-120` trigger/completion matrix; `UX-T-121` single lesson queue/retrigger; `UX-T-122` steering not intercepted; `UX-T-123` disable/re-enable/reset; `UX-T-124` safety prompts persist; `UX-T-125` Help search/modality/icon parity.

### 9.13 Colour, patterns, text, and scalable presentation

#### 9.13.1 Faction and state encoding

Faction assignment always combines palette, fill pattern, and emblem:

| Slot | Colour | Pattern | Emblem |
|---|---|---|---|
| Player | cyan | solid | four-point star |
| Rival 1 | amber | 45° diagonal | split diamond |
| Rival 2 | magenta | dots | triple orbit |
| Rival 3 | lime | crosshatch | chevron crown |
| Neutral | neutral grey | sparse horizontal | open circle |
| Unknown | desaturated slate | dense crosshatch | question mark |

Patterns are anchored in world/screen space consistently and remain distinguishable at `16 px`. Ownership borders are at least `2 px`; selected adds an independent white `2 px` outer keyline. Hostile uses a blade-shaped relation icon and `HOSTILE`; friendly uses shield icon and `FRIENDLY`. Danger, positive discovery, warnings, success, and errors each have different silhouettes as well as colours.

The palette must pass simulated protanopia, deuteranopia, and tritanopia screenshots without losing identity when colour is removed entirely. A high-contrast setting strengthens borders to `3 px`, removes translucent-only distinctions, and sets all panel surfaces to `≥95%` opacity.

#### 9.13.2 Text scaling and language resilience

Default root text is `16 px`. User presets are 100%, 115%, 130%, and 150%, producing roots `16`, `18.4`, `20.8`, and `24 px`; there is no 14-px user preset. User scale applies independently of browser zoom and is stored in profile. Minimum gameplay text at 100% is `14 px` for subordinate canvas labels and `16 px` for DOM controls/body; scaled presets multiply those bases. Line height is `≥1.4`; paragraph width is `≤72 characters`; all-caps is limited to labels of `≤20` characters.

Containers support at least `40%` string expansion and unbroken seed/entity IDs. Values align with tabular numerals but remain correctly read in source order. Dates use locale formatting; authoritative units and formula symbols are not localized into ambiguous forms. UI copy uses plain terms on first occurrence: “fuel units,” “cargo units,” “simulation time.”

Acceptance: `UX-T-130` faction greyscale/pattern test; `UX-T-131` three colour-vision simulations; `UX-T-132` contrast and high-contrast mode; `UX-T-133` four text scales plus 200% zoom; `UX-T-134` 40% expansion/long IDs; `UX-T-135` reading/tab order independent of visual alignment.

### 9.14 Motion, screen shake, flashes, and haptics

Default UI transitions use opacity plus translation of at most `12 px` over `120–180 ms`. No essential state is conveyed solely during animation. Camera ease is `150 ms`; routine hits may shake `2 px` for `80 ms`, shield break `4 px` for `120 ms`, explosive impact `6 px` for `160 ms`; amplitude never exceeds `8 px`, frequency `≤18 Hz`, and shakes do not accumulate beyond the strongest active event. Screen shake defaults on, has Off/50%/100%, and is automatically Off when `prefers-reduced-motion: reduce` is first detected unless profile has an explicit choice.

Reduced Motion performs these replacements:

- all screen transitions become `≤80 ms` crossfades with no translation;
- station-keeping orbit/camera ease becomes a static range ring and locked badge;
- discovery reveal zoom/radial burst becomes a static illustrated card with `NEW DISCOVERY` border;
- damage shake becomes directional edge highlight for `200 ms` plus persistent layer delta;
- critical pulses become static double borders;
- route dashes stop moving and show arrowheads;
- parallax, idle drift, particle trails, and decorative star motion stop;
- gameplay projectile position still updates because it is simulation information, but trails/flashes are removed.

No full-screen flash exceeds a luminance change of 20%; repeated flashes are capped below three per second. Optional haptics follow §9.6 and have a separate toggle. Disabling shake/motion/haptics never changes aim, collisions, timing, RNG, or other mechanics.

Acceptance: `UX-T-140` animation duration/amplitude caps; `UX-T-141` shake non-stacking; `UX-T-142` OS reduced-motion default; `UX-T-143` replacement matrix; `UX-T-144` flash-frequency/luminance check; `UX-T-145` mechanics determinism across settings.

### 9.15 Silent presentation and semantic equivalents

The game ships without music or sound effects. Settings expose Haptics separately but contain no music, effects, mute, volume, or browser audio-unlock controls. No screen reserves space for an audio state icon.

Every informative event has a durable visual/text equivalent: sensor contacts use a directional marker and contact text; station lock uses a ring and badge; extraction uses beam pulses and cargo increments; shield break uses a broken-shield icon and static edge highlight; low fuel uses a persistent banner and gauge icon; autopilot interruption stops the route and names its reason; discoveries show a card and record badge; critical alerts use a persistent banner and Timeline unread count. Effects never mask a screen-reader announcement by requiring timing.

Acceptance: `UX-T-150` no audio runtime or download; `UX-T-151` no audio controls; `UX-T-152` visual feedback survives tab interruption; `UX-T-153` semantic-equivalence matrix; `UX-T-154` optional haptics toggle; `UX-T-155` complete silent gameplay parity.

### 9.16 Screen-reader, keyboard-only, and focus semantics

Menus, setup, management, map controls, timeline, settings, history, and confirmations must meet WCAG 2.2 AA semantics. Direct real-time steering is represented to screen readers as named press-and-hold buttons and discrete throttle controls; the game does not claim that high-speed tactical flight is fully playable with browse-mode-only commands. Pause-anytime and autopilot provide an operable keyboard/screen-reader route for navigation and interaction.

The tactical canvas has an adjacent structured “Nearby contacts” list updated at most `2 Hz`, ordered selected target, threats, interactables, then distance. Each row exposes name/type, relation, direction as clock-face plus distance, health/intel if known, and Select/Autopilot/Context actions. Updates do not move focus or reannounce the full list. Newly critical contact changes use the alert limits in §9.11.

Galaxy has a semantic grid with arrow-key cell movement, Home to player cell, Enter to open route sheet, and visible coordinates. Toroidal arrow navigation wraps and announces “wrapped west/east/north/south.” Page Up/Down moves five cells. Fogged cells announce “Undiscovered, X,Y” only.

Tab order follows visual reading order and includes no inert canvas decorations. Skip links are `Skip to flight controls`, `Skip to status`, and `Skip to main content` as applicable. Disabled controls use native disabled semantics plus persistent explanatory text; tooltips are supplemental. Validation summary links to invalid fields. Dynamic values use polite live regions only when user-initiated or materially critical; rapidly changing speed/mining values are readable on demand, not announced every tick.

Acceptance: `UX-T-160` automated axe scan; `UX-T-161` keyboard-only setup-to-first-sale; `UX-T-162` nearby-list order/update stability; `UX-T-163` semantic toroidal map grid; `UX-T-164` skip links/tab order; `UX-T-165` disabled reason availability; `UX-T-166` live-region noise audit.

### 9.17 Errors, saving, storage recovery, leases, and import/export UX

#### 9.17.1 Error anatomy

All actionable errors contain: title, plain-language cause, campaign safety statement, error code, primary recovery action, and secondary safe exit if available. Inline field errors appear beside and are programmatically associated with the field. Toasts are used only for nonblocking failures; save, storage, lease, compatibility, death-sealing, and import-integrity problems use persistent modal/banner presentation.

#### 9.17.2 Save state

The shell exposes save state as `Saved`, `Saving…`, `Unsaved changes`, or `Save failed`. Normal successful autosaves do not toast. `Save failed` is persistent, pauses simulation, and offers `Retry`, `Export current state` at v0.1 when memory serialization succeeds, and `Continue at risk` only for nonterminal active play. That option states that closing/reloading may lose progress. It is absent during death/victory sealing; terminal sealing retries and offers diagnostic download without resuming play.

If newest snapshot is corrupt but prior is valid, show `Recovered previous save`, rollback amount, recovered timestamp, and events omitted if known. Actions are `Continue recovered campaign` and, at v0.1, `Export diagnostics`. The corrupt slot is quarantined until export/acknowledgment, then never silently promoted.

#### 9.17.3 Duplicate tabs and lease loss

A second tab shows campaign details read-only and `Active in another tab`. Actions: `Open History`, `Return Home`, and `Take over` only after the 6-second expiry or explicit override. Override confirmation says it will pause the other tab. The losing tab immediately zeros input, pauses, and shows `Campaign moved to another tab` with `View read-only` or `Take back`; takeover ping-pong is rate-limited to one explicit override per tab per `10 s`.

#### 9.17.4 Import/export at v0.1

Export offers `Campaign save` for active campaigns and `Campaign record` for sealed campaigns, shows filename before download, and confirms checksum generation. Filename format is `venture-star_<seed8>_<status>_<YYYY-MM-DD>.json`. Export failure retains data and offers Retry/Copy diagnostics.

Import uses file picker plus keyboard-accessible drop zone, accepts `.json`, and displays `Reading → Validating checksum → Validating schema → Migrating (if needed) → Ready`. It never overwrites on selection. Ready summary shows type/status, seed, dimensions, difficulty, rules/schema versions, duration, record count conflict, and checksum result. Importing an active campaign while one exists offers `Keep current`, `Archive current and import`, or `Cancel`; default is Cancel. Identical campaign UUID/hash is reported as Already present. Same UUID/different hash is rejected as a conflict, not merged.

Failures use distinct copy and codes: file over 10 MB (`IMP_SIZE`), invalid JSON (`IMP_PARSE`), checksum mismatch (`IMP_CHECKSUM`), unsupported newer rules (`IMP_RULES_NEWER`), unsupported older schema (`IMP_SCHEMA_OLD`), invalid references/values (`IMP_SCHEMA_INVALID`), active-with-death-marker normalized to sealed with warning (`IMP_DEATH_SEALED`). The UI says “Checksum verified” or “Checksum mismatch,” never “tamper-proof.”

#### 9.17.5 Offline and service-worker update

Offline state is a quiet shell indicator; core play continues. Any unavailable optional network action says `Unavailable offline` without retry spam. A newer app version downloads in background but applies only from Home with no active dirty campaign, or after a successful save and explicit `Restart to update`. Rules-version changes never migrate an active campaign without validated migration and user-visible release note.

Acceptance: `UX-T-170` error anatomy; `UX-T-171` save-failure active versus terminal actions; `UX-T-172` corrupt-slot recovery disclosure; `UX-T-173` lease loss/takeover/rate limit; `UX-T-174` export filename/checksum; `UX-T-175` import progress/summary/no overwrite; `UX-T-176` import error-code matrix; `UX-T-177` death normalization language; `UX-T-178` offline core play; `UX-T-179` update safe-application flow.

### 9.18 Confirmation and destructive-action matrix

| Action | Confirmation | Default focus | Can undo |
|---|---|---|---|
| Fire/bomb neutral | Target-named second activation within `2 s` | Cancel | No |
| Start route requiring emergency return mode | Shows forecast and emergency restrictions | Cancel | Cancel autopilot; normal fuel already spent remains spent |
| Jettison cargo while hostile present | Quantity/material and risk | Cancel | Recover crate within 300 simulation seconds |
| Switch research | Preserved old/new project progress and unlock timing | Keep current research | Switch back later; progress is preserved |
| Replace active campaign | States it becomes Abandoned | Keep current | No continuation afterward |
| Override active-tab lease | States other tab will pause | Cancel | Other tab may later take over |
| Delete sealed record | Outcome/seed/name | Cancel | No |
| Reset tutorial | Scope: lesson flags only | Cancel | No |
| Reset presentation settings | Immediate preview | Apply/close | Settings can be changed again |

Confirm labels name the action (`Bomb <planet>`, `Delete record`, `Archive and start`) and never use ambiguous `Yes/No`. A disabled destructive control cannot be the default. Holding Enter/Space cannot repeat a confirmation. Pointer double activation is debounced `500 ms` and authoritative transactions also reject duplicate IDs.

Acceptance: `UX-T-180` confirmation copy/defaults; `UX-T-181` keyboard hold/double-click debounce; `UX-T-182` transaction ID duplicate rejection; `UX-T-183` safety prompts unaffected by tutorial.

### 9.19 Settings persistence and reset boundaries

Profile settings are Haptics, Screen Shake, Reduced Motion, High Contrast, Text Scale, HUD Numbers, Fixed Joystick Center, Touch Controls mode, tutorial enabled/completed flags, map filters, and last input modality. Accessibility and presentation changes preview immediately; Cancel restores entry values, Apply persists. Settings opened from a campaign pause do not clear the pause reason until Settings and Pause are both closed.

`Reset presentation settings` resets only visual/haptic/input presentation. `Reset tutorial` resets lesson completion after confirmation. `Delete all local data` is separated under Danger Zone, enumerates active campaign, sealed records, cosmetics/achievements, and settings, requires typing `DELETE`, and is disabled while terminal sealing is incomplete. It releases leases and reloads to cold Home after verified deletion. No routine error flow recommends deleting all local data.

Corrupt profile settings fall back per-setting to defaults and report one dismissible `Some settings were reset`; campaign saves remain untouched. OS preferences are consulted only when no explicit profile choice exists.

Acceptance: `UX-T-190` settings preview/cancel/apply; `UX-T-191` pause reason retention; `UX-T-192` scoped resets; `UX-T-193` delete-all typed confirmation/sealing guard; `UX-T-194` per-setting corruption fallback; `UX-T-195` OS preference precedence.

### 9.20 Release UX compliance matrix

| UX area | v0 | v0.1 | Full target |
|---|---|---|---|
| Boot/Home | Offline boot, Continue/New/History, recovery, one active campaign | Import/export | Record comparison and achievement/cosmetic browsing |
| Flight | Desktop and touch parity, HUD, station lock, route/fuel, combat/bomb controls | Expanded status/research/roles | Advanced routing/wormhole states |
| Galaxy/intel | Permanent geography fog, wrap routes, danger bands | Live/recent/stale intel and filters | Expanded trade/AI comparison layers |
| Management | Overview, fixed-price Market, three-generic-slot Shipyard | Adaptive market, Planet, Research, optional fourth slot | Richer development/equipment categories; five-slot maximum |
| Guidance | Control legend, opening objective strip, Help, mandatory safety prompts | Optional six-lesson tutorial | Content-specific Help additions |
| Accessibility | Keyboard, coarse touch, text scaling, patterns, contrast, reduced motion, shake/haptic controls | Screen-reader semantics for added screens | Same guarantees for every added system |
| Persistence | Atomic save UX, leases, corruption recovery, sealed victory/defeat records | Validated JSON import/export | Multi-record comparison/export refinements |

A release fails UX acceptance if any included mechanic lacks an operable keyboard path through menus, an equivalent coarse-pointer path, non-colour status encoding, reduced-motion behavior, error/recovery copy, or an acceptance test. Later releases inherit all prior `UX-T-*` tests.
## 10. Test Plan

### 10.1 Quality contract

No mechanic, release-layer feature, or build story is complete until its referenced tests exist and pass. The authoritative state is tested below the renderer; the player experience is tested through the built browser application. Unit success without a bootable, navigable, playable application is failure.

All tests are deterministic unless explicitly labelled human/manual. A failed assertion prints campaign seed, rules version, simulation tick, relevant stable entity IDs, state hash before/after, and the shortest captured event log needed to reproduce it. Tests must never depend on wall-clock waiting when the deterministic clock can be advanced.

Test categories:

| Code | Category | Execution rule |
|---|---|---|
| `U` | Unit/state-machine | Headless deterministic TypeScript tests; no DOM; fixed ruleset and named RNG streams. |
| `C` | Component/browser | Playwright mounts one real UI surface with production renderer and input adapters. |
| `E` | End-to-end browser | Playwright boots the production entry point and uses only exposed player inputs except fixture setup before boot. |
| `S` | Seed/economy simulation sweep | Headless worker simulation across recorded seed ranges and legal bot policies. |
| `P` | Performance | Browser trace plus headless AI/simulation budgets on reference desktop/mobile profiles. |
| `A` | Accessibility | Automated axe, keyboard/touch geometry, contrast/pattern assertions, reduced-motion state parity, and screen-reader labels. |
| `M` | Manual feel/playtest | Scripted human observation; supplements but never replaces deterministic assertions. |

### 10.2 Commands and release gates

The implementation must expose these non-interactive commands from the game package:

```text
npm run test:unit        # all U tests; single process repeatable with --seed
npm run test:component   # Playwright C tests, desktop + mobile projects
npm run test:e2e         # Playwright E tests against production build
npm run test:a11y        # axe + keyboard/touch/reduced-motion A tests
npm run test:seed        # standard S sweep; 10,000 generation seeds
npm run test:perf        # P budgets, production build only
npm run test:release     # build + U + C + E + A + S + P
```

Gates:

- **Every commit:** affected U tests and static test-reference validator; maximum 5 minutes.
- **Pull request:** all U/C/A tests, Chromium E smoke, 500-seed smoke sweep; maximum 15 minutes.
- **Nightly:** full browser matrix, 10,000-seed generation/opening sweep, 200-campaign balance sweep, 100,000-transaction economy conservation, three-rival/900-sector performance scenario.
- **Release candidate:** `npm run test:release`, offline/subpath install check, storage/crash fault suite, manual feel checklist, and a sealed win plus sealed defeat on desktop and mobile.
- **Regression:** later releases run all earlier-layer tests unchanged unless a versioned ruleset migration deliberately updates a golden fixture.

No flaky retry turns a failure green. CI may repeat a failed deterministic test once only to label it `NONDETERMINISTIC`; the job still fails.

### 10.3 Test-mode hooks

The production build may expose read-only diagnostics, but mutation hooks exist only when `import.meta.env.MODE === "test"`. A release build must assert that `window.__ventureTest` is absent.

```ts
interface VentureTestApi {
  rules(): Readonly<Ruleset>;
  clock: {
    pauseScheduler(): void;
    stepTicks(count: number): Promise<void>;
    stepStrategyTicks(count: number): Promise<void>;
    tick(): number;
  };
  state: {
    snapshot(): CanonicalState;
    hash(): string;
    events(sinceTick?: number): readonly CanonicalEvent[];
    entity(id: string): Readonly<EntityState> | null;
  };
  input: {
    key(code: string, phase: "down" | "up"): void;
    pointer(action: TestPointerAction): void;
    touch(action: TestTouchAction): void;
  };
  seed: {
    generate(identity: CampaignIdentity): GeneratedGalaxy;
    validate(identity: CampaignIdentity): OpeningValidationReport;
    runBot(identity: CampaignIdentity, policy: BotPolicy): BotRunReport;
  };
  faults: {
    storage(point: StorageFaultPoint, mode: "throw" | "truncate" | "stale"): void;
    crashAfter(transactionStep: number): void;
    clear(): void;
  };
  lease: {
    current(): LeaseRecord | null;
    expire(): void;
  };
  visibility: { set(value: "visible" | "hidden"): void };
  render: { metrics(): FrameMetrics; particleCount(): number };
}
```

Rules for hooks:

1. `snapshot()` is a deep-frozen copy and cannot mutate gameplay.
2. `stepTicks` is rejected while the real scheduler is running.
3. Fixture mutation occurs only before the first production simulation tick or through a serialized save import; tests do not set live health/ownership directly.
4. Clock, RNG, state hash, storage, and render logs use independent channels so observation cannot consume gameplay RNG.
5. Playwright E tests may call `clock.stepTicks` to avoid waiting, but all player actions travel through production input/UI handlers.
6. Fault injection labels the exact persistence transaction boundary and clears on page reload unless encoded in test launch options.
7. Test builds display a `TEST BUILD` watermark; production build check fails if hook or watermark exists.

### 10.4 Fixtures

| Fixture ID | Contents | Purpose |
|---|---|---|
| `FX-GOLDEN-000` | seed `0000000000000000`, `10×10`, one rival, Captain, rules version pinned | All-zero 80-bit seed parsing and cross-browser authoritative hash. |
| `FX-OPEN-001` | accepted v0 opening with common node, highlighted module, treasure, visible rival mine route | Canonical first-five-minute path. |
| `FX-OPEN-REPAIR` | generator forced to fail attempts `0–255` | Deterministic attempt-257 repair and no hang. |
| `FX-WRAP-EVEN` | `10×10`, entities on exact half-map ties and all four edges | Wrap, A*, sensing, projectile, camera tests. |
| `FX-WRAP-ODD` | `15×11`, paired edge routes | v0.1 rectangular/odd distance. |
| `FX-COMBAT-001` | shielded hostile, neutral occluder, armour/hull break thresholds | Targeting, damage, auto-fire, friendly-fire prevention. |
| `FX-PLANET-001` | neutral planet at influence boundary and hostile planet with shield/defence | Peaceful and forceful acquisition. |
| `FX-AI-LEDGER` | rival with exact credits/materials/fuel and one functioning shipyard | Shared-cost, reconstruction, intent, offscreen parity. |
| `FX-COLLAPSE-001` | rival one strategy tick short of surrender threshold | Capitulation/federation boundary ordering. |
| `FX-INTEL-001` | live, recent, stale, unknown contacts across wrap and occluder | Fog/intelligence/alert gating. |
| `FX-SAVE-LIVE` | valid active snapshot plus three idempotent journal entries | Autosave recovery and migration. |
| `FX-SAVE-DEATH` | prior active snapshot plus durable `DEATH_CONFIRMED` fence | No-resurrection tests. |
| `FX-SAVE-HOSTILE` | corpus of oversized, cyclic-reference-equivalent, nonfinite, bad enum/ID/hash JSON | Import rejection; never overwrites current save. |
| `FX-TIMELINE-CAP` | 1,999 events with protected critical/discovery/ownership entries | Aggregation and replay deduplication. |
| `FX-PERF-900` | `30×30`, three rivals, maximum supported contacts/projects/content | Full-target CPU, memory, render, save-size stress. |

Golden fixtures contain canonical JSON and expected SHA-256 hashes. Updating a golden requires a rules-version increment, generated before/after diff, migration decision, and review; snapshots are not blindly regenerated.

### 10.5 Browser, viewport, and environment matrix

| Project | Engine/profile | Viewport/input | Required suites |
|---|---|---|---|
| `desktop-chromium` | current stable Chromium | `1440×900`, keyboard/mouse | C/E/A/P |
| `desktop-firefox` | current stable Firefox | `1366×768`, keyboard/mouse | C/E/A |
| `desktop-webkit` | current stable WebKit | `1280×800`, keyboard/mouse | C/E/A |
| `mobile-small` | Chromium mobile emulation | `360×640`, touch, DPR 2 | C/E/A/P |
| `mobile-large` | WebKit mobile emulation | `430×932`, touch, DPR 3, safe areas | C/E/A |
| `desktop-reduced` | Chromium | `1280×720`, reduced motion, silent | E/A/determinism |

Each E run also executes at render caps 30, 60, and 120 Hz where the browser project permits. Authoritative hashes must match. Locale variants `en-AU` and `de-DE` verify decimal/formatting does not enter simulation; timezone variants UTC and Australia/Perth verify wall time does not affect generation or progression.

Deployment E tests serve the production build at both `/` and `/venture-star/`, block network after first load, reload, resume a local campaign, and complete one interaction. Requests outside the configured base path fail the test.

### 10.6 Mechanic coverage matrix

Every `T-Mxx-*` identifier below is canonical and must correspond to one named test case in source. “Supplement” names cross-system tests defined in §10.7–10.9.

| Mechanic | Canonical tests and primary harness | Supplemental coverage |
|---|---|---|
| M01 setup/seed | U: `T-M01-001`, `T-M01-003`, `T-M01-004`; cross-browser E: `T-M01-002` | `T-DEPLOY-001`, `T-E2E-V0-001` |
| M02 generation/opening | S: `T-M02-001`, `T-M02-002`, `T-M02-003`, `T-M02-004`, `T-M02-005`, `T-M02-006`; E/bot: `T-M02-007` | `LOOP-OPEN-001`–`LOOP-OPEN-005`, `T-BAL-001` |
| M03 torus/routes | U: `T-M03-001`, `T-M03-002`, `T-M03-003`, `T-M03-004`, `T-M03-006`; C: `T-M03-005` | `T-F-03`, `T-A11Y-004` |
| M04 flight | U: `T-M04-001`, `T-M04-002`, `T-M04-003`, `T-M04-004`, `T-M04-005`, `T-M04-006`; C input trace | `T-F-01`, `T-F-02`, `T-PERF-001`, `T-MANUAL-001` |
| M05 fuel/reserve | U: `T-M05-001`, `T-M05-002`, `T-M05-003`, `T-M05-004`, `T-M05-005`, `T-M05-006`, `T-M05-007` | `T-E2E-V0-002`, `T-BAL-002` |
| M06 autopilot | U/C: `T-M06-001`, `T-M06-002`, `T-M06-003`, `T-M06-004`, `T-M06-005`, `T-M06-006`, `T-M06-007`, `T-M06-008` | `LOOP-PAUSE-004`, `T-MANUAL-002` |
| M07 station-keeping | U/C: `T-M07-001`, `T-M07-002`, `T-M07-003`, `T-M07-004`, `T-M07-005`, `T-M07-006` | `T-F-05`, `T-A11Y-003`, `T-MANUAL-003` |
| M08 mining | U: `T-M08-001`, `T-M08-003`, `T-M08-004`, `T-M08-005`, `T-M08-006`; C: `T-M08-002` | `T-F-06`, `LOOP-OPEN-002` |
| M09 cargo | U/C: `T-M09-001`, `T-M09-002`, `T-M09-003`, `T-M09-004`, `T-M09-005` | `T-E2E-V0-002`, `T-A11Y-002` |
| M10 markets | U: `T-M10-001`, `T-M10-002`, `T-M10-003`, `T-M10-004`, `T-M10-005`, `T-M10-006`; S: `T-M10-007` | `T-BAL-003`, `T-E2E-V01-001` |
| M11 dock/services | U/C: `T-M11-001`, `T-M11-002`, `T-M11-003`, `T-M11-004`, `T-M11-005`, `T-M11-006` | `T-E2E-V0-002`, `T-A11Y-002` |
| M12 equipment | U/C: `T-M12-001`, `T-M12-002`, `T-M12-003`, `T-M12-004`, `T-M12-005`, `T-M12-006` | `T-F-08`, `LOOP-OPEN-002` |
| M13 targeting | U/C: `T-M13-001`, `T-M13-002`, `T-M13-003`, `T-M13-004`, `T-M13-005` | `T-F-07`, `T-A11Y-005`, `T-MANUAL-004` |
| M14 damage/death trigger | U: `T-M14-001`, `T-M14-002`, `T-M14-003`, `T-M14-004`, `T-M14-005`, `T-M14-006`; C feedback | `T-F-07`, `T-E2E-V0-004` |
| M15 automatic weapon | U/C: `T-M15-001`, `T-M15-002`, `T-M15-003`, `T-M15-004`, `T-M15-005`, `T-M15-006` | `T-F-07`, `T-MANUAL-004` |
| M16 bombs/specials | U/C: `T-M16-001`, `T-M16-002`, `T-M16-003`, `T-M16-004`, `T-M16-005`, `T-M16-006` | `T-A11Y-006`, `T-E2E-V0-003` |
| M17 planets/roles | U: `T-M17-001`, `T-M17-002`, `T-M17-003`, `T-M17-004`, `T-M17-005`, `T-M17-006`; C role UI | `T-E2E-V01-001`, `T-BAL-004` |
| M18 influence/federation | U/C: `T-M18-001`, `T-M18-002`, `T-M18-003`, `T-M18-004`, `T-M18-005`, `T-M18-006`, `T-M18-007` | `T-E2E-V0-003`, `T-E2E-V01-002` |
| M19 conquest | U/C: `T-M19-001`, `T-M19-002`, `T-M19-003`, `T-M19-004`, `T-M19-005`, `T-M19-006` | `T-E2E-V0-003`, `T-F-08` |
| M20 orbital defence | U/C: `T-M20-001`, `T-M20-002`, `T-M20-003`, `T-M20-004` | `T-E2E-V01-001`, `T-A11Y-005` |
| M21 AI strategy | U/S: `T-M21-001`, `T-M21-002`, `T-M21-003`, `T-M21-004`, `T-M21-005`, `T-M21-006` | `T-PERF-003`, `T-BAL-005`, `T-E2E-FULL-001` |
| M22 AI ships/offscreen | U/S: `T-M22-001`, `T-M22-002`, `T-M22-003`, `T-M22-004`, `T-M22-005`, `T-M22-006` | `T-PERF-003`, `T-BAL-005` |
| M23 capitulation | U/C: `T-M23-001`, `T-M23-002`, `T-M23-003`, `T-M23-004`, `T-M23-005`, `T-M23-006` | `LOOP-END-001`–`LOOP-END-006`, `T-E2E-V01-002` |
| M24 sensors/fog | U/C: `T-M24-001`, `T-M24-002`, `T-M24-003`, `T-M24-004`, `T-M24-005`, `T-M24-006`, `T-M24-007` | `T-A11Y-004`, `T-E2E-V01-001` |
| M25 discoveries | U: `T-M25-001`, `T-M25-002`, `T-M25-003`, `T-M25-004`, `T-M25-005`, `T-M25-006`; C/A: `T-M25-007` | `T-F-08`, `T-A11Y-003`, `T-E2E-V0-002` |
| M26 hazards | U/C: `T-M26-001`, `T-M26-002`, `T-M26-003`, `T-M26-004`, `T-M26-005`, `T-M26-006` | `T-E2E-V01-001`, `T-F-04` |
| M27 pause/save/lease | U/E: `T-M27-001`, `T-M27-002`, `T-M27-003`, `T-M27-004`, `T-M27-005`, `T-M27-006`, `T-M27-007`, `T-M27-008`, `T-M27-009` | `LOOP-PAUSE-001`–`LOOP-PAUSE-007`, `T-DEPLOY-002` |
| M28 permadeath | U/E: `T-M28-001`, `T-M28-002`, `T-M28-003`, `T-M28-004`, `T-M28-005`, `T-M28-006` | `LOOP-TERM-001`–`LOOP-TERM-004`, `T-E2E-V0-004` |
| M29 victory/record | U/E: `T-M29-001`, `T-M29-002`, `T-M29-003`, `T-M29-004`, `T-M29-005`, `T-M29-006` | `LOOP-TERM-001`, `LOOP-TERM-003`, `LOOP-TERM-005`, `T-E2E-V0-005` |
| M30 timeline/alerts | U/C: `T-M30-001`, `T-M30-002`, `T-M30-003`, `T-M30-004`, `T-M30-005` | `T-F-09`, `T-A11Y-001`, `T-E2E-V0-005` |
| M31 research | U/C: `T-M31-001`, `T-M31-002`, `T-M31-003`, `T-M31-004`, `T-M31-005`, `T-M31-006` | `T-E2E-V01-001`, `T-BAL-004` |
| M32 tutorial/safety | U/C/A: `T-M32-001`, `T-M32-002`, `T-M32-003`, `T-M32-004`, `T-M32-005` | `T-A11Y-002`, `T-E2E-V01-003` |

The en-dash ranges above are catalog shorthand only; source tests retain every exact ID. In particular, `LOOP-OPEN-001` through `LOOP-OPEN-005`, `LOOP-END-001` through `LOOP-END-006`, `LOOP-TERM-001` through `LOOP-TERM-005`, and `LOOP-PAUSE-001` through `LOOP-PAUSE-007` are individually implemented cases defined in §3.

### 10.7 Cross-system automated tests

| Test ID | Type | Exact assertion |
|---|---|---|
| `T-F-01` | C/P | p95 physical key/touch event to first changed pixel meets the §6 input budget; bomb ignores repeat. |
| `T-F-02` | U/C | acceleration, max speed, turn, brake, held/released input, joystick release, and render-rate traces match normative mechanics constants. |
| `T-F-03` | C | camera preserves wrap continuity, never traverses galaxy, and renders the paired-edge label in reduced motion. |
| `T-F-04` | C/A | shake/zoom/particles and every listed reduced-motion substitute activate for identical state events without changing state hash. |
| `T-F-05` | U/C | station lock acquisition, orbit stability, break-on-manual-input, reason label, and reduced-motion parity match M07/§6. |
| `T-F-06` | U/C | mining rate, fractional carry, pulse cadence, cargo-full/depletion, and six interruption presentations remain synchronized. |
| `T-F-07` | U/C/A | target priority, hit render-hold, damage layers, break/kill cues, flash limits, and physics-state independence pass. |
| `T-F-08` | C/A | first rare reveal, upgrade first-use cue, influence/conquest distinction, and repeat-view suppression match §6. |
| `T-F-09` | C/A | menus pause before interaction, confirm/cancel is consistent, toast caps apply, and 150% text reflows. |
| `T-F-10` | C | production build contains no audio files, audio manifest, audio controls, Web Audio construction, or audio precache entries. |
| `T-F-11` | A/U | Full versus reduced/silent runs with identical inputs have identical authoritative hash and equivalent semantic cues. |
| `T-PERF-001` | P | desktop p95 ordinary frame `≤16.7 ms`, mobile `≤33.3 ms`, input handler p95 `≤4 ms`. |
| `T-PERF-002` | P | heavy v0 effect respects particle caps and drops low-priority cosmetics before semantic cues. |
| `T-PERF-003` | P/S | `FX-PERF-900` maintains AI budget, no task exceeds one strategy interval, heap stabilizes after 20 active minutes, save completes within `250 ms` p95. |
| `T-A11Y-001` | A | all reachable screens have zero serious/critical axe violations; alerts expose role, name, severity, and text. |
| `T-A11Y-002` | A/E | keyboard-only desktop and touch-only mobile complete dock/trade/refit; focus order, `48×48 px` general DOM minima, `56×56 px` primary minima, and 44-px canvas/map selection tolerance pass. |
| `T-A11Y-003` | A | reduced-motion signal/lock/discovery/death substitutes exist; no semantic state uses motion/audio/colour alone. |
| `T-A11Y-004` | A/C | faction, route danger, fog age, wrap edge, and signals remain distinguishable in simulated colour-vision modes. |
| `T-A11Y-005` | A/C | target and defence states expose text/icon/pattern; overlapping touch targets resolve deterministically. |
| `T-A11Y-006` | A/C | irreversible bomb/jettison/delete/takeover controls require documented confirmation and cannot repeat on hold. |
| `T-DEPLOY-001` | E | production build boots real campaign screen at `/` and `/venture-star/`; all assets resolve beneath configured base. |
| `T-DEPLOY-002` | E | after first load and network block, reload/resume, one sector transition, mine, trade, save, and record view work offline. |
| `T-SEC-001` | U/E | production bundle exposes no mutation hook, source secret, external analytics request, account dependency, or runtime server requirement. |
| `T-REF-001` | U | parses §10/§11 source: every M01–M32 appears, every story `test_ref` resolves to a declared/canonical ID, and every story has 1–9 acceptance criteria. |

### 10.8 Seed, economy, AI, and pacing sweeps

| Test ID | Population | Pass condition |
|---|---:|---|
| `T-BAL-001` | 10,000 sequential canonical 16-character Crockford Base32 seeds plus all-zero/all-maximum/normalization boundaries | Every campaign validates or deterministically repairs; zero hang, overlap, unreachable planet, unsafe home, or broken opening promise. |
| `T-BAL-002` | 10,000 openings × 3 difficulties | Reference route never uses reserve, ends at/above required margin, and all reachable regions retain a legal recovery source. |
| `T-BAL-003` | 100,000 legal transactions across 1,000 economies | Credits/stock/cargo conserve, price bounds hold, no negative stock, no zero-risk five-minute circuit exceeds the specified profit cap. |
| `T-BAL-004` | 200 Captain campaigns per supported map size | Role/research/module choices remain non-dominant: no one opening module chosen above 55% and no one role exceeds 50% of assignments absent map-specific need. |
| `T-BAL-005` | 200 campaigns per difficulty/rival count | AI ledger balances; no hidden knowledge; reconstruction has legal shipyard escrow/time; deterministic state hash repeats. |
| `T-BAL-006` | 200 completed `10×10` campaigns per difficulty | Engaged-duration medians: Explorer 40–65 min, Captain 45–75 min, Strategist 55–90 min; zero soft-locks; 10th–90th Captain percentile 35–95 min. Records separately validate simulation duration and wall span. |
| `T-BAL-007` | 100 v0.1 collapse scenarios | Capitulation reduces manual post-collapse acquisitions to at most one; federation results in formal player ownership and preserved output. |

Sweep reports are committed as machine-readable JSON artifacts with rules version, code revision, seed interval, bot policy hash, percentile summary, failure seeds, and replay command. A balance test may use accelerated ticks but never simplified mechanic formulas.

### 10.9 End-to-end browser scenarios

| Test ID | Release | Browser flow and pass condition |
|---|---|---|
| `T-E2E-V0-001` | v0 | Boot production app → campaign setup → seed `FX-OPEN-001` → Start → actual docked first screen renders → Launch → steer on keyboard and touch variants. No stub/status-only surface is accepted. |
| `T-E2E-V0-002` | v0 | From launch, scan/approach → acquire station lock → mine → return/dock → sell → fit highlighted module → perform improved verb → claim positive discovery, all through UI. |
| `T-E2E-V0-003` | v0 | Acquire one planet peacefully; in a separate fresh trace break the simplified shield gate, confirm/use 34-resolve bombs, acquire one planet; verify 100% peaceful output versus 60%→100% force-path repair, 15-second service lock, and timeline. |
| `T-E2E-V0-004` | v0 | Take fatal damage → confirm simulation lock and death journal → crash/reload at each transaction fixture → open only sealed defeat → replay same seed with new UUID. |
| `T-E2E-V0-005` | v0 | Accelerated legal bot/input route controls all planets → victory seals → summary statistics/fog-respecting map/timeline render → no Continue action → new-seed action preserves old record. |
| `T-E2E-V0-006` | v0 | Complete the full happy path in one browser context: boot real first screen, opening mine/sell/refit/discovery, observe rival, acquire planets by both paths, defeat rival capacity, control every planet, seal victory. |
| `T-E2E-V01-001` | v0.1 | Start `15×11` two-rival campaign → receive stale/live intel → trade exotic material → finish research → assign role → construct orbital defence → survive ion storm. |
| `T-E2E-V01-002` | v0.1 | Create qualifying collapse → reject once and verify cooldown → requalify → accept surrender; second trace satisfies federation boundaries and wins through atomic transfer. |
| `T-E2E-V01-003` | v0.1 | Trigger six tutorial lessons without focus theft, disable/re-enable, verify safety prompts remain; export, delete working copy, import, checksum-verify, resume identical hash. |
| `T-E2E-V01-004` | v0.1 | Full `15×15` two-rival happy path includes AI-vs-AI conquest, research/role decision, capitulation/federation, sealed victory, offline reload. |
| `T-E2E-FULL-001` | Full | Boot `30×30` three-rival campaign, route through wrap/wormhole, claim unique artifact, observe three legal AI plans, load/save without budget violation. |
| `T-E2E-FULL-002` | Full | Complete accelerated full-target campaign and open two sealed records in comparison view; cosmetics/achievement state changes no fresh-campaign mechanic hash. |

E2E acceleration may advance empty travel/production ticks but may not set ownership, credits, health, research, discovery, or terminal state directly. The final victory must arise from production mechanic transactions.

### 10.10 Manual feel and human playtest cases

| Test ID | Participants/device | Protocol and threshold |
|---|---|---|
| `T-MANUAL-001` | 10 first-time players; 5 desktop/5 touch | No coaching after Start. At least 8 launch, steer, lock, and gain cargo within 30 active seconds; all can identify speed/fuel/cargo. |
| `T-MANUAL-002` | 8 players split input | Plot local and wrapped strategic routes, interrupt autopilot, resume. At least 7 correctly predict arrival side, fuel safety, and interruption cause. |
| `T-MANUAL-003` | 10 players | Approach/mine three nodes, once manually and once autopilot. At least 8 describe lock acquisition and intentionally break it first try; median idle wait perception rating ≤2/5. |
| `T-MANUAL-004` | 10 players | Select clustered hostile, survive combat, use bomb with neutral safety case. At least 8 identify selected target, shield/armour/hull transition, kill, and rejected bomb reason. |
| `T-MANUAL-005` | 10 first-time players | Complete opening loop. At least 8 fit an upgrade by minute 3, claim discovery and correctly explain rival action by minute 5. |
| `T-MANUAL-006` | 6 reduced-motion/assistive-tech users | Complete flight, mining, trade, combat warning, discovery, pause/resume. Zero critical state requires removed motion, colour, or audio. |
| `T-MANUAL-007` | 8 returning players after ≥48 hours | Resume Review only; at least 7 correctly state location, goal, fuel risk, and last major rival event before resuming. |
| `T-MANUAL-008` | 10 strategy players | Complete or play ≥45 active min on Captain. Median completion lies in 45–75 min; ≥8 rate decisions clear and late cleanup no worse than 2/5. |

Manual reports record build, seed, device, settings, anonymized result timings, failures, and exact observation—not inferred sentiment. A threshold miss blocks release or produces an approved spec/balance change followed by rerun.

### 10.11 Persistence and failure matrix

Persistence tests inject a fault after every numbered transaction boundary for autosave, trade, refit, ownership transfer, death, and victory:

| Failure | Required result |
|---|---|
| atomic transaction aborts before commit | no partial journal/snapshot/header update is visible; prior committed snapshot remains resumable and UI pauses with persistent warning. |
| snapshot bytes truncate before transaction commit | the transaction aborts; prior snapshot and journal remain authoritative. |
| pointer promotion lost | newest verified slot is selected by journal sequence without duplicating transactions. |
| crash after economic journal append | replay applies transaction exactly once. |
| crash after `DEATH_CONFIRMED` | recovery seals defeat; backup cannot resume. |
| crash after `VICTORY_CONFIRMED` | recovery seals victory; no further simulation. |
| duplicate-tab simultaneous trade | exactly one lease nonce appends next sequence; loser becomes read-only. |
| storage quota/private mode | simulation remains paused until acknowledged path; no false “saved” indicator. |
| hostile/newer import | rejected on a copy; current campaign and records remain byte-identical. |

Required IDs are `T-M27-002` through `T-M27-009`, `T-M28-002` through `T-M28-005`, `T-M29-004`, `LOOP-TERM-002`, and `LOOP-PAUSE-006`/`007`.

### 10.12 Coverage and completion rules

- Statement coverage for deterministic domain modules: `≥90%`; branch coverage: `≥85%`; persistence, terminal transactions, and validation branches: `100%`.
- UI coverage is scenario-based, not percentage-based: every actionable control and every unavailable/error state has at least one C/E assertion.
- Every M01–M32 mechanic has at least one U/C/E/S test and appears in §10.6.
- Every §6 acceptance item maps to `T-F-*`, `T-A11Y-*`, `T-PERF-*`, or a canonical mechanic test.
- Every story below has 1–9 acceptance criteria and references only IDs declared in §3, §4, or §10.
- Test source includes a generated manifest `{testId, mechanicIds, storyIds, release}`. CI rejects duplicate IDs, unresolved references, skipped required tests, and later-only tests marked required for an earlier gate.
- Visual snapshots assert bounded regions and semantic overlays; whole-screen snapshots supplement rather than replace state assertions.
- Manual tests are release gates for feel only; no manual result can waive a deterministic failure.

## 11. Build Stories

### 11.1 Story format and sequencing

Stories are ordered by dependency. Priority `P0` blocks the named release, `P1` is required before that release candidate, and `P2` belongs to the approved full target after earlier gates. Complexity is relative: `S` ≤1 focused day, `M` 1–3 days, `L` 3–5 days. Any story estimated beyond `L` must be split before implementation.

Each story includes production wiring and tests. A subsystem is not done if it is available only through a unit-test constructor or debug route.

### 11.2 v0 stories

#### VS-V0-001 — Bootstrap production app and deterministic core

- **Priority:** P0
- **Complexity:** M
- **Dependencies:** none
- **Acceptance criteria:**
  1. Production build boots a real campaign home/setup screen, not placeholder/status text.
  2. Fixed simulation clock, quantization, stable IDs, named RNG streams, and canonical hashing are implemented.
  3. Test mode exposes §10.3 hooks; production mode exposes none.
  4. Rendering rate and locale/timezone cannot change authoritative state.
  5. Static hosting works at root and configured project subpath.
- **test_ref:** `T-M01-002`, `T-M04-006`, `T-DEPLOY-001`, `T-SEC-001`, `T-REF-001`

#### VS-V0-002 — Campaign setup, toroidal generator, and opening validation

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-001
- **Acceptance criteria:**
  1. v0 accepts a canonicalizable 16-character Crockford Base32 seed and locks setup to `10×10`, one rival, 8–12 planets.
  2. Same identity yields identical world; replay creates a new campaign UUID.
  3. Generator creates legal toroidal topology, origins, planets, nodes, one hazard type, and two positive types.
  4. Opening validator proves all required opportunities before campaign activation.
  5. Failed procedural candidates deterministically repair without hang.
  6. Strategic routes use wrapped distance, hazard/hostility cost, deterministic ties, and visible wrap edges.
- **test_ref:** `T-M01-001`, `T-M01-003`, `T-M02-001`, `T-M02-005`, `T-M03-002`, `T-M03-004`, `LOOP-OPEN-001`, `T-BAL-001`

#### VS-V0-003 — Wire renderer, camera, desktop and touch flight

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-001, VS-V0-002
- **Acceptance criteria:**
  1. Production flight surface renders flagship, home, contacts, HUD, and sector boundaries.
  2. Fixed keyboard and touch joystick/throttle controls drive the same M04 input model.
  3. Acceleration, turn, brake, collision, focus loss, and edge wrap use normative values.
  4. Camera follow/lookahead/combat/lock/wrap behavior matches §6 without affecting state.
  5. Input-to-pixel and frame budgets pass desktop and mobile profiles.
  6. Reduced motion supplies static wrap/speed/camera equivalents.
- **test_ref:** `T-M03-001`, `T-M04-001`, `T-M04-004`, `T-M04-005`, `T-F-01`, `T-F-02`, `T-F-03`, `T-PERF-001`

#### VS-V0-004 — Fuel, forecast, emergency reserve, and autopilot

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-003
- **Acceptance criteria:**
  1. Manual and autopilot flight consume identical formula-based fuel.
  2. Route preview shows fuel margin, danger, stale/unknown segments, and wrap transitions.
  3. Autopilot stops within point/interaction tolerance without overshoot.
  4. Manual input, hostility, damage, severe hazard, invalid route, and unsafe fuel interrupt with a reason.
  5. Emergency drift disables specified systems and guarantees legal recovery/debt rescue.
  6. Pause/resume suspends rather than cancels autopilot and runs no catch-up.
- **test_ref:** `T-M05-001`, `T-M05-003`, `T-M05-004`, `T-M05-006`, `T-M06-003`, `T-M06-005`, `T-M06-008`, `T-BAL-002`

#### VS-V0-005 — Assisted station-keeping, mining, and cargo

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-003, VS-V0-004
- **Acceptance criteria:**
  1. Eligible approach acquires lock after the normative hold and stabilizes without teleporting or fuel.
  2. Manual steering/high throttle, obstruction, target loss, range loss, and damage break immediately with exact reason.
  3. Mining transfers whole material units atomically while retaining fractional progress.
  4. Beam/pulse/cargo presentation follows actual rate and equipment changes.
  5. Cargo CU arithmetic, partial pickup, full state, jettison, expiry, and refit guard conserve contents.
  6. Reduced-motion lock/mining has identical physics and semantic feedback.
- **test_ref:** `T-M07-001`, `T-M07-003`, `T-M07-005`, `T-M07-006`, `T-M08-001`, `T-M08-004`, `T-M09-001`, `T-F-06`

#### VS-V0-006 — Markets, docking, repair, and six-family refit

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-005
- **Acceptance criteria:**
  1. v0 fixed bounded prices, stock, buy/sell, insufficient-state rejection, and conservation are atomic.
  2. Dock range/speed/access, damage race, safe undock, and ownership loss are enforced.
  3. Repair order and price are shown before confirm and applied exactly once.
  4. Exactly six v0 equipment families compete for three generic module slots using normative modifier order/caps.
  5. Failed swap changes neither inventory nor fitted stats; capacity/tank-breaking removals are blocked.
  6. Before/after and first-use upgrade feedback appear in production UI.
- **test_ref:** `T-M10-001`, `T-M10-004`, `T-M10-006`, `T-M11-001`, `T-M11-002`, `T-M11-005`, `T-M12-003`, `T-M12-004`, `T-F-08`

#### VS-V0-007 — Tactical targeting, layered damage, auto-weapon, and bomb

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-003, VS-V0-006
- **Acceptance criteria:**
  1. Keyboard/touch targeting uses deterministic hostility and priority without accidental neutral fire.
  2. Shields, armour, hull, recharge, overflow, collision bypass, and fatal ordering match M14.
  3. Standard weapon auto-fires only with valid solution/range/line and never while blocked.
  4. Bomb preview matches result, neutral use confirms, hold cannot repeat, and ammo decrements only on spawn.
  5. Hit/break/kill/death presentation never delays simulation or changes physics.
  6. Every critical combat state has non-colour, silent, and reduced-motion cues.
- **test_ref:** `T-M13-001`, `T-M13-003`, `T-M14-001`, `T-M14-003`, `T-M15-003`, `T-M15-005`, `T-M16-001`, `T-M16-002`, `T-F-07`

#### VS-V0-008 — Planet model and dual acquisition paths

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-006, VS-V0-007
- **Acceptance criteria:**
  1. Planets have finite capacity, stock, integrity, production, services, ownership, and deterministic tick order.
  2. Simplified trade/aid/broadcast influence converts a planet only at legal threshold.
  3. Peaceful transfer preserves stock and 100% output.
  4. Bombardment removes exactly 34 resolve only after the simplified v0 shield gate and never destroys infrastructure or planet.
  5. Forceful acquisition enforces range, defender, shield, resolve, and uninterrupted interaction gates.
  6. Transfer changes services/ownership/timeline, applies a 15-second service lock, and repairs output from 60% to 100% over 120 active seconds.
- **test_ref:** `T-M17-001`, `T-M17-004`, `T-M18-001`, `T-M18-005`, `T-M16-003`, `T-M16-006`, `T-E2E-V0-003`

#### VS-V0-009 — Geography fog, discoveries, asteroid hazard, and strategic map

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-002, VS-V0-003, VS-V0-005
- **Acceptance criteria:**
  1. Sector entry permanently reveals legal static geography without leaking dynamic hidden state.
  2. v0 exposes exactly treasure asteroid and abandoned cargo positive pools with generated-once rewards.
  3. Scan range/time/grace, cargo-full persistence, reveal record, and repeat-view behavior match M25.
  4. Asteroid risk threshold, deterministic hit stream, warning, route cost, and AI parity match M26.
  5. Strategic map renders discovered cells, wrap routes, danger bands, fuel, and unknown segments.
  6. Rare/hazard/resource signals remain distinct in reduced motion and colour-vision simulations.
- **test_ref:** `T-M24-001`, `T-M25-001`, `T-M25-002`, `T-M25-004`, `T-M25-007`, `T-M26-001`, `T-M26-003`, `T-A11Y-004`, `T-F-08`

#### VS-V0-010 — Rule-paying rival and offscreen simulation

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-002, VS-V0-006, VS-V0-007, VS-V0-008
- **Acceptance criteria:**
  1. One rival explores, mines, trades, influences, conquers, and responds through legal goals.
  2. Rival spends identical costs and sees only its own valid sensor beliefs.
  3. Difficulty changes only disclosed policy/aim/danger knobs.
  4. Offscreen travel, fuel, combat, cargo, cooldown, and health reconcile continuously on relevance entry.
  5. Destroyed rival ship rebuilds only from functioning shipyard escrow over listed time.
  6. Visible intelligence exposes legal intent/progress without leaking unknown plans.
- **test_ref:** `T-M21-001`, `T-M21-002`, `T-M21-004`, `T-M21-006`, `T-M22-001`, `T-M22-003`, `T-M22-005`, `T-BAL-005`

#### VS-V0-011 — Timeline, alerts, objectives, and pause wiring

- **Priority:** P0
- **Complexity:** M
- **Dependencies:** VS-V0-006, VS-V0-008, VS-V0-009, VS-V0-010
- **Acceptance criteria:**
  1. Production events create tactical consequence, timeline entry, and strategic marker when intelligence permits.
  2. Alert priority, throttling, coalescing, cap aggregation, and replay deduplication preserve required events.
  3. Full-screen management adds pause before interaction and displays pause state.
  4. Nested/user/hidden/lease/resume/terminal pause reasons compose without early resume.
  5. Management close countdown advances zero ticks and input cancels auto-resume without leaking action.
  6. Hidden return requires Resume and authoritative state does not drift.
- **test_ref:** `T-M30-001`, `T-M30-002`, `T-M30-003`, `T-M30-004`, `LOOP-PAUSE-001`, `LOOP-PAUSE-003`, `LOOP-PAUSE-004`, `LOOP-PAUSE-005`, `T-F-09`

#### VS-V0-012 — Atomic local persistence and single-tab lease

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-001, VS-V0-011
- **Acceptance criteria:**
  1. Atomic persistence triggers every 10 active seconds and at required events; snapshots run every 60 active seconds with no separate pending-pointer promotion.
  2. Recovery loads newest valid snapshot and replays idempotent journal entries once.
  3. Corrupt newest slot falls back without silently discarding a confirmed terminal fence.
  4. Storage failure pauses with honest unsaved warning and retry behavior.
  5. Exactly one tab lease nonce can mutate; takeover pauses and invalidates prior owner atomically.
  6. Closed/hidden duration produces no simulation catch-up or offline progress.
- **test_ref:** `T-M27-001`, `T-M27-002`, `T-M27-003`, `T-M27-004`, `T-M27-005`, `T-M27-008`, `LOOP-PAUSE-006`, `LOOP-PAUSE-007`

#### VS-V0-013 — Permadeath, victory, sealed records, and retry

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-008, VS-V0-012
- **Acceptance criteria:**
  1. Fatal hull tick stops input/simulation and durably appends monotonic death transaction before presentation.
  2. Crash, refresh, backup, import, and duplicate tab cannot resurrect confirmed death.
  3. Exact all-planets ownership seals victory; same-tick fatal damage wins as defeat.
  4. Records contain accurate required statistics and only final known map intelligence.
  5. Sealed records are read-only and expose no Continue/restore path.
  6. Same-seed and new-seed retry create new campaign IDs while preserving the old record.
- **test_ref:** `T-M28-001`, `T-M28-002`, `T-M28-003`, `T-M28-005`, `T-M29-001`, `T-M29-002`, `T-M29-005`, `LOOP-TERM-002`, `T-E2E-V0-004`

#### VS-V0-014 — Responsive accessible HUD and effects integration

- **Priority:** P1
- **Complexity:** L
- **Dependencies:** VS-V0-003, VS-V0-005, VS-V0-007, VS-V0-009, VS-V0-011
- **Acceptance criteria:**
  1. Desktop and mobile expose identical campaign actions with specified touch target minima.
  2. Text scales through 150% without essential truncation or viewport loss.
  3. Faction/state colour is paired with pattern/icon and critical feedback is multimodal.
  4. Reduced motion maps every removed camera/effect/UI motion to specified static/text equivalent.
  5. Effects use isolated presentation RNG and degrade below budgets without dropping semantic cues.
  6. Production contains no audio assets, audio controls, Web Audio runtime, or audio cache entries; every event remains legible through visual/text feedback.
  7. Automated accessibility scan has zero serious/critical violations.
- **test_ref:** `T-F-04`, `T-F-10`, `T-F-11`, `T-PERF-002`, `T-A11Y-001`, `T-A11Y-002`, `T-A11Y-003`, `T-A11Y-005`

#### VS-V0-015 — Wire validated opening into production onboarding

- **Priority:** P0
- **Complexity:** M
- **Dependencies:** VS-V0-005, VS-V0-006, VS-V0-009, VS-V0-010, VS-V0-014
- **Acceptance criteria:**
  1. Start renders actual docked launch state with actionable home/node/contact information.
  2. Legal displayed-hint trace produces launch, flight, lock, and cargo events by required deadline.
  3. Mine/sell/refit completes by minute 3 and changed metric is perceived on next use.
  4. Positive discovery and readable rival action/consequence are available by minute 5.
  5. Opening protection, fuel margin, offer reservation, and difficulty parity hold for every accepted seed.
  6. Hints never seize input, execute an action, or fabricate progress.
- **test_ref:** `T-M02-007`, `LOOP-OPEN-002`, `LOOP-OPEN-003`, `LOOP-OPEN-004`, `T-E2E-V0-001`, `T-E2E-V0-002`, `T-MANUAL-001`, `T-MANUAL-005`

#### VS-V0-016 — Final playable-loop integration and complete campaign

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-002, VS-V0-003, VS-V0-004, VS-V0-005, VS-V0-006, VS-V0-007, VS-V0-008, VS-V0-009, VS-V0-010, VS-V0-011, VS-V0-012, VS-V0-013, VS-V0-014, VS-V0-015
- **Acceptance criteria:**
  1. Production entry initializes renderer and actual first screen on every required browser/viewport.
  2. Every major subsystem is reachable from documented production navigation with no debug route.
  3. One browser trace completes opening mine/sell/refit/discovery and observes rival action.
  4. The trace acquires planets through both peaceful and forceful paths.
  5. Legal simulation reaches exact all-planets control and sealed victory with accurate record.
  6. Offline subpath reload resumes the same campaign; terminal reload remains sealed.
  7. 200-seed bot campaign sweep has zero soft-locks and meets Captain pacing distribution.
- **test_ref:** `T-E2E-V0-006`, `T-DEPLOY-001`, `T-DEPLOY-002`, `T-BAL-006`, `LOOP-TERM-001`, `LOOP-TERM-005`, `T-MANUAL-008`

### 11.3 v0.1 stories

#### VS-V01-101 — Rectangular setup, second rival, and live intelligence

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V0-016
- **Acceptance criteria:**
  1. Setup permits each dimension `10–15` and one/two rivals with recommendation and separation rules.
  2. Odd/even rectangular wrap, routing, danger, sensing, and save identity remain deterministic.
  3. Friendly planets extend legal live coverage.
  4. Contacts transition LIVE/RECENT/STALE/UNKNOWN at exact active-time boundaries.
  5. Ownership/price/contact UI labels age and never leaks hidden current state.
  6. AI and player use identical visibility graph.
- **test_ref:** `T-M01-004`, `T-M03-002`, `T-M24-002`, `T-M24-004`, `T-M24-005`, `T-M24-006`, `T-M24-007`, `T-A11Y-004`

#### VS-V01-102 — Exotic material and bounded adaptive markets

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V01-101
- **Acceptance criteria:**
  1. Exotic nodes/cargo/stock/prices/sinks use exact CU and bounds.
  2. Scarcity, danger, control, relation, pressure, and decay reproduce golden prices.
  3. Market intelligence ages under M24 and never ages while paused.
  4. Transactions remain atomic and conserve credits, stock, cargo, debt, and pressure.
  5. Seed/economy sweeps retain recovery sources and arbitrage cap.
- **test_ref:** `T-M08-001`, `T-M10-001`, `T-M10-003`, `T-M10-005`, `T-M10-006`, `T-M10-007`, `T-BAL-003`

#### VS-V01-103 — Research, fourth slot, and planet roles

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V01-102
- **Acceptance criteria:**
  1. Data validation rejects prerequisite cycles and invalid role/module definitions.
  2. One active research uses legal RP output, cost, progress, cancellation refund, and prerequisites.
  3. Research unlocks eligibility or listed modifier and never creates unpaid equipment.
  4. Fourth slot and expanded modules respect compatibility and caps.
  5. One planet role applies establishment time, capacity, primary output, sacrifice, upkeep, and reassignment rule.
  6. Captured hubs/roles obey downtime and ownership transfer.
- **test_ref:** `T-M12-002`, `T-M12-005`, `T-M17-002`, `T-M17-003`, `T-M17-006`, `T-M31-001`, `T-M31-003`, `T-M31-006`, `T-BAL-004`

#### VS-V01-104 — Orbital defence and full infrastructure consequences

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V01-103, VS-V0-007
- **Acceptance criteria:**
  1. Defence build requires capacity, stock, cost, and time.
  2. Active batteries prioritize legal threats and never shoot neutral/occluded targets.
  3. Bombardment applies deterministic component damage with preview parity.
  4. Capture preserves surviving batteries/infrastructure and applies exact disabled period.
  5. Peaceful conversion avoids damage and force downtime.
- **test_ref:** `T-M19-001`, `T-M19-002`, `T-M19-003`, `T-M20-001`, `T-M20-002`, `T-M20-003`, `T-M20-004`, `T-M18-005`

#### VS-V01-105 — Two-rival independent strategy and AI-vs-AI conquest

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V01-101, VS-V01-103, VS-V01-104
- **Acceptance criteria:**
  1. Both rivals independently select legal goals and can trade, influence, fight, conquer, and rebuild without player involvement.
  2. Ownership changes preserve attributable actor, ledger, sensor gating, and timeline result.
  3. Simultaneous decisions and conflicts resolve by stable ordering.
  4. Difficulty policy differences remain disclosed and resource-neutral.
  5. Offscreen/onscreen transitions conserve fuel, cargo, cooldown, health, and construction.
  6. CPU stays within the v0.1 budget under maximum `15×15` state.
- **test_ref:** `T-M21-001`, `T-M21-003`, `T-M21-004`, `T-M22-001`, `T-M22-002`, `T-M22-005`, `T-BAL-005`, `T-PERF-003`

#### VS-V01-106 — Expanded discoveries and ion storms

- **Priority:** P1
- **Complexity:** L
- **Dependencies:** VS-V01-101, VS-V01-102, VS-V01-103
- **Acceptance criteria:**
  1. Derelict, rescue, ancient technology, rich vein, hidden market, and artifact definitions use seeded stable rewards.
  2. Full cargo and rescue expiry preserve correct unresolved/resolved states.
  3. Unique artifact cannot duplicate through generation or import.
  4. Ion storm applies sensor/shield/damage rules and low-throttle exemption.
  5. Hazard warning interrupts autopilot and pauses with simulation.
  6. Every new signal/reveal has reduced-motion, silent, and non-colour equivalents.
- **test_ref:** `T-M25-003`, `T-M25-004`, `T-M25-005`, `T-M25-006`, `T-M25-007`, `T-M26-002`, `T-M26-003`, `T-M26-004`, `T-A11Y-003`

#### VS-V01-107 — Capitulation and federation cleanup

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V01-103, VS-V01-105
- **Acceptance criteria:**
  1. Military eligibility checks exact control, shipyard, military, recovery, and hold conditions.
  2. Any qualifying recovery resets the hold; decline enforces cooldown.
  3. Federation requires every peaceful threshold and rejects recent bombardment.
  4. Transfer is atomic, formal player ownership, and applies correct production/trust/downtime.
  5. Multiple rival claims/order resolve deterministically.
  6. Death resolves before transfer/victory and chained transfer checks after transaction.
- **test_ref:** `T-M23-001`, `T-M23-002`, `T-M23-003`, `T-M23-004`, `T-M23-005`, `T-M23-006`, `LOOP-END-006`, `T-BAL-007`, `T-E2E-V01-002`

#### VS-V01-108 — Tutorial and portable save validation

- **Priority:** P1
- **Complexity:** L
- **Dependencies:** VS-V01-101, VS-V0-012, VS-V0-014
- **Acceptance criteria:**
  1. Six contextual lessons trigger once, select current modality, dismiss immediately, and never steal flight input.
  2. Disable/re-enable preserves completed/suppressed state while mandatory safety prompts remain.
  3. Export uses canonical schema/rules/state/journal/checksum format.
  4. Import parses in worker, enforces size/schema/hash/reference rules, and migrates only supported copies.
  5. Invalid import leaves current campaign/records byte-identical and uses honest checksum wording.
  6. Export/import round trip resumes identical authoritative hash.
- **test_ref:** `T-M27-006`, `T-M27-007`, `T-M32-001`, `T-M32-002`, `T-M32-003`, `T-M32-004`, `T-M32-005`, `T-E2E-V01-003`

#### VS-V01-109 — v0.1 complete campaign integration

- **Priority:** P0
- **Complexity:** L
- **Dependencies:** VS-V01-101, VS-V01-102, VS-V01-103, VS-V01-104, VS-V01-105, VS-V01-106, VS-V01-107, VS-V01-108
- **Acceptance criteria:**
  1. Production app boots and completes a `15×15`, two-rival campaign without debug navigation.
  2. Happy path includes live/stale intelligence, adaptive trade, exotic material, research, role, defence, and ion storm.
  3. At least one AI-vs-AI ownership change is legal and visible only through earned intelligence.
  4. Capitulation or federation completes all-planets ownership and seals victory.
  5. Export/import and offline reload preserve state and terminal record.
  6. All v0 tests remain green.
- **test_ref:** `T-E2E-V01-004`, `T-E2E-V01-001`, `T-E2E-V01-002`, `T-E2E-V01-003`, `T-BAL-005`, `T-BAL-007`, `T-DEPLOY-002`

### 11.4 Later/full-target stories

#### VS-FULL-201 — Scale generation, routing, saves, and rendering to `30×30`

- **Priority:** P2
- **Complexity:** L
- **Dependencies:** VS-V01-109
- **Acceptance criteria:**
  1. Setup supports each dimension `10–30`, up to 900 sectors and three rivals.
  2. Planet/content counts, origin separation, wrap routes, culling, and map interaction remain deterministic.
  3. Opening validator and connectivity pass at minimum/maximum/odd/even dimensions.
  4. Save/load, route preview, strategic simulation, and rendering meet full stress budgets.
  5. Earlier map-size saves preserve their rules identity and behavior.
- **test_ref:** `T-M01-001`, `T-M02-002`, `T-M02-003`, `T-M02-004`, `T-M03-002`, `T-M21-005`, `T-PERF-003`, `T-E2E-FULL-001`

#### VS-FULL-202 — Three-rival deep shared-rule simulation

- **Priority:** P2
- **Complexity:** L
- **Dependencies:** VS-FULL-201
- **Acceptance criteria:**
  1. Three rivals use distinct data-driven strategy weights without bespoke free actions.
  2. Eligible factions operate up to two ships only after legal shipyard threshold/cost.
  3. Diplomacy, negotiation, war, reconstruction, and capitulation use shared ledgers and beliefs.
  4. Simultaneous multilateral actions resolve deterministically and timeline respects fog.
  5. Maximum simulation remains within CPU/memory/save budgets.
- **test_ref:** `T-M21-001`, `T-M21-002`, `T-M21-003`, `T-M21-005`, `T-M22-003`, `T-M22-006`, `T-M23-006`, `T-BAL-005`, `T-PERF-003`

#### VS-FULL-203 — Wormholes, advanced hazards, and broad discovery pool

- **Priority:** P2
- **Complexity:** L
- **Dependencies:** VS-FULL-201, VS-V01-106
- **Acceptance criteria:**
  1. Wormhole edges participate in A*, fuel, hazard, wrap, and route visualization without becoming required connectivity.
  2. Unscanned instability uses deterministic misroute chance; scanned route is certain.
  3. Gravity shear applies disclosed fuel cost and AI parity.
  4. Broad original discovery definitions generate stable unique rewards and legal content IDs.
  5. Artifact uniqueness survives save/import/replay and occupies legal slots.
  6. Every new hazard/discovery has accessible signal, reveal, and timeline behavior.
- **test_ref:** `T-M03-004`, `T-M03-005`, `T-M25-002`, `T-M25-005`, `T-M25-007`, `T-M26-005`, `T-M26-006`, `T-A11Y-003`, `T-A11Y-004`

#### VS-FULL-204 — Deep progression, records, achievements, and cosmetics

- **Priority:** P2
- **Complexity:** L
- **Dependencies:** VS-FULL-202, VS-FULL-203
- **Acceptance criteria:**
  1. Tier II/III research and broader equipment obey prerequisites, RP, slots, modifier caps, and no mandatory universal completion.
  2. Planet development remains role/capacity constrained and cannot maximize every output.
  3. Achievements, compendium, statistics, and cosmetic silhouettes persist as record/profile data only.
  4. Fresh-campaign mechanic hash is identical with zero/all cosmetic unlocks.
  5. Record comparison uses sealed data and never reveals information unknown at run end.
  6. Rules migration preserves old sealed records read-only.
- **test_ref:** `T-M12-002`, `T-M12-005`, `T-M17-001`, `T-M17-002`, `T-M29-005`, `T-M29-006`, `T-M31-001`, `T-M31-005`, `T-E2E-FULL-002`

#### VS-FULL-205 — Full-target final integration and regression

- **Priority:** P2
- **Complexity:** L
- **Dependencies:** VS-FULL-201, VS-FULL-202, VS-FULL-203, VS-FULL-204
- **Acceptance criteria:**
  1. Production app boots a real `30×30`, three-rival campaign on all required browsers/viewports.
  2. One legal browser trace uses wrap and wormhole routing, deep discovery, research, role, diplomacy, combat, and rival resolution.
  3. Full campaign seals victory and comparison view opens two immutable records.
  4. Reduced-motion/silent/offline/subpath variants preserve authoritative state and full playability.
  5. Full stress and balance reports pass with reproducible artifacts.
  6. Every v0 and v0.1 regression remains green.
- **test_ref:** `T-E2E-FULL-001`, `T-E2E-FULL-002`, `T-PERF-003`, `T-F-11`, `T-DEPLOY-001`, `T-DEPLOY-002`, `T-BAL-005`, `T-REF-001`

### 11.5 Story completion audit

Before marking a release complete, CI parses this section and asserts:

1. Every listed dependency names an earlier story in the same or prior release layer.
2. Every `test_ref` resolves to an exact test defined in §3, §4, or §10; ranges are forbidden in story references.
3. Every story has between one and nine numbered acceptance criteria.
4. Every M01–M32 mechanic is owned by at least one story and tested in §10.6.
5. v0 has subsystem wiring stories plus `VS-V0-016`; v0.1 has `VS-V01-109`; Full has `VS-FULL-205`.
6. Final E2E tests boot the production entry and complete the actual browser happy path; module-registration text, blank canvas, debug-only controls, or direct terminal-state mutation fail.
7. Later-layer stories do not become dependencies of earlier-layer stories.
8. No release is declared complete with a skipped, quarantined, flaky, or manually waived P0/P1 test.
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
## 13. Risks

This register is normative. Probability and impact use `Low`, `Medium`, or `High` and describe the likelihood/severity before the listed prevention. A release gate is binary: the feature layer cannot ship while its gate is unmet. “Owner” names the accountable production discipline, not a person. The risk owner must attach evidence—automated report, trace, screenshot set, licence record, or signed manual checklist—to the release candidate.

### 13.1 Risk scoring and escalation

- **Critical:** High impact with Medium/High probability, or any threat to deterministic saves, permadeath integrity, campaign completion, accessibility of a core action, or legal redistribution. Critical risks block the relevant release.
- **Major:** Medium/High impact whose prevention has not yet passed its quantitative gate. Major risks block promotion from internal build to release candidate.
- **Managed:** prevention has passed, monitoring remains active, and the contingency has been exercised at least once.
- A detected breach creates a named defect linked to the risk ID. Reclassifying a risk requires evidence and a spec revision; silence is not acceptance.

### 13.2 Product, simulation, and balance risks

| ID | Risk | Probability | Impact | Detection signal | Prevention | Contingency | Owner / release gate |
|---|---|---|---|---|---|---|---|
| R-01 | Accepted procedural seed has an empty, unfair, fuel-trapped, or unaffordable opening. | Medium | High | Any accepted seed fails one M02 invariant; first mine/sale/refit exceeds 180 simulation seconds for the validator bot; hostile/hazard blocks the guaranteed route. | Deterministic 256-attempt generator plus repair pass; validate safe home, 12-CU node, two reachable planets, positive discovery, and rival signal; run cross-browser 10,000-seed sweep. | Reject affected generator version; force deterministic repair for every failing seed; preserve old generated definitions rather than regenerating existing campaigns. | Generation owner. **v0 gate:** `T-M02-001…007`, §3.4 tests, and §7.4 10,000-seed hashes all pass with zero invariant failures. |
| R-02 | First five minutes are legal but confusing or fail to demonstrate the signature. | Medium | High | More than 2/10 first-time moderated players miss the scan, lock, sale, upgrade, or rival consequence; objective strip points outside earned intel. | §3.3–3.4 choreography, §9.3.4 objective strip, contextual labels, immediate before→after upgrade feedback. | Adjust signposting and generated opening placement without changing systemic rules; do not add forced autopilot or omniscient arrows. | UX/design owner. **v0 gate:** 8/10 first-time players complete mine/sell/refit without external help and all `UX-T-024`, `F-05`, `F-06` pass. |
| R-03 | Assisted station-keeping feels like waiting or control theft, especially on touch. | Medium | High | Lock acquisition exceeds 350 ms, ship oscillates outside lock ring, user steering fails to break on same tick, or 3/10 touch testers abandon mining. | M07 spring/threshold state machine; visible acquiring/locked/broken states; extraction pulses; same-tick manual release; upgrade-specific first-use feedback. | Tune presentation and spring coefficients inside a versioned balance change; if oscillation persists, reduce orbit tangent to zero while preserving manual break and mining rate. | Flight/feel owner. **v0 gate:** `T-M07-001…006`, `F-05`, `F-06`, 30-second stability trace, and phone-scale recognition test pass. |
| R-04 | Flight is sluggish, twitchy, nondeterministic, or inconsistent across control methods/frame rates. | Medium | High | Key/touch latency misses budget; 30/60/120/144 Hz replay hashes or endpoint traces differ; keyboard and touch reach different authoritative values. | Fixed 20-Hz command queue, integer authoritative units, one normalized steering/throttle command grammar, renderer interpolation only. | Disable cosmetic interpolation that causes perceived mismatch; retain fixed simulation; ship 60-FPS presentation cap on affected devices rather than changing physics. | Simulation/input owner. **v0 gate:** `T-M04-001…006`, `F-01…04`, §7.4 replay hash suite pass on supported browsers. |
| R-05 | Fuel creates a soft lock or becomes irrelevant. | Medium | High | Legal route consumes recovery ability; player reaches zero with no accessible friendly/neutral source; fewer than 5% or more than 40% of test routes engage a fuel decision. | Exact route forecast plus 5% margin; visible reserve warning; safe opening reachability; emergency return mode disables combat/mining; deterministic recovery contract. | Spawn only the already-specified legal recovery contract at the nearest reachable friendly planet; retune normal burn or regional refuel placement, never remove fuel costs mid-campaign. | Balance/generation owner. **v0 gate:** `T-M05-001…007`, `P-07`, route property tests, and 10,000-seed recovery reachability pass. |
| R-06 | Economy collapses into coloured currencies, exploitative arbitrage, or unrecoverable shortages. | High | High | A repeatable zero-risk circuit earns >18% net/5 active minutes; stock goes negative; one material lacks a distinct source/sink; recovery resource absent for >90 s. | Distinct material sinks, atomic stock ledger, bounded spread/pressure, stale intelligence, stock caps, seed/economy sweeps, deterministic recovery contracts. | Freeze adaptive pressure at last valid bounded values; inject recovery contract; disable only the exploit route/transaction pair through rules-version patch while retaining saves. | Economy owner. **v0 fixed-market gate / v0.1 adaptive gate:** `T-M10-001…007`, `P-04`, `P-10` and 100,000-transaction conservation pass. |
| R-07 | Loadout has no meaningful opportunity cost or an obvious dominant module. | Medium | Medium | One family appears in >80% of winning Captain runs; a three-slot build covers all core advantages; first upgrade has no perceptible use. | Three generic slots in v0, six families, mutually exclusive benefits, market stock variation, before→after and first-use feedback. | Cost/effect rebalance by rules version; never add slots as a balance patch. If a module is mandatory for seed completion, repair generation instead. | Progression owner. **v0 gate:** `P-02…04`, 1,000-run loadout distribution, and each family’s first-use feedback test pass. |
| R-08 | Combat/bombardment is unreadable, accidental, or produces unavoidable permadeath. | Medium | High | Neutral attack without confirmation; shot/bomb preview differs from result; damage layer/source cannot be identified in a 200-ms test; unavoidable fatality during opening envelope. | M13–M16 numeric targeting/damage rules, hold-fire, obstruction checks, target-named bomb confirmation, redundant hit feedback, protected opening. | Pause on critical tutorial/safety prompt only where specified; reduce neutral threat placement/stat multiplier rather than grant invulnerability after legitimate combat begins. | Combat/UX owner. **v0 gate:** `T-M13…M16`, `F-07`, `UX-T-068`, and 18/20 damage-recognition test pass. |
| R-09 | Peaceful acquisition is repetitive or force is strictly optimal. | Medium | Medium | Median action/time/cost to peaceful control exceeds force by >50% without infrastructure benefit compensating; >85% of bot wins use one path. | Parallel systemic paths; peace preserves full output/infrastructure; force spends bombs and causes repair/damage; multiple influence sources with anti-farm cap. | Tune influence gain, bomb cost, and capture downtime within declared formulas; add no dialogue tree or fleet mechanic. | Systems/balance owner. **v0 gate:** both paths complete under scripted tests; **v0.1 gate:** `T-M18`, `T-M19` and 1,000-seed acquisition-path analysis stay inside the 50% band. |
| R-10 | All-planets victory becomes late-game commuting/cleanup. | High in v0; Medium after v0.1 | Medium | More than 20% of median campaign time occurs after a rival has no shipyard/ship; player performs three or more uncontested planet visits solely to finish. | v0 keeps small 8–12-planet scope; v0.1 M23 capitulation/federation transfers strategically defeated remnants while preserving formal all-planets victory. | For v0, reduce late repair/acquisition costs or planet count within 8–12; do not silently ship v0.1 capitulation in v0. For v0.1, shorten eligibility hold only through spec revision backed by pacing data. | Campaign design owner. **v0 gate:** median Captain 45–75 minutes; **v0.1 gate:** `T-M23-001…006`, §3.8 tests, and cleanup share ≤20%. |
| R-11 | Difficulty breaks the shared-rule promise through hidden/free AI value. | Medium | High | Ledger cannot trace AI ship, fuel, bomb, repair, influence, or construction; AI reads fogged player/world state; difficulty modifier is absent from setup copy. | Same command envelopes and costs; named deterministic beliefs; disclosed policy cadence/aim/aggression/threat knobs; resource ledger audit. | Remove the untraceable AI action and replay from prior valid strategy tick; reduce policy search rather than mint resources when AI stalls. | AI owner. **v0 gate:** `T-M21-001…006`, `T-M22-001…006`, `P-05`, `F-12`, and adversarial fog tests pass. |
| R-12 | Offscreen abstraction diverges visibly from onscreen combat/travel. | Medium | High | Entering sensor relevance changes health, ammo, cargo, fuel, position, or cooldown beyond one quantum; equivalent aggregate scenarios differ outside declared stochastic tolerance. | One-second offscreen quanta, same costs/rates/sensor eligibility, committed stream counters, continuous state reconstruction. | Increase offscreen cadence for contested relevant sectors; never reroll transition state. If parity remains unstable, resolve that encounter tactically headless at 20 Hz. | AI/simulation owner. **v0 gate:** `T-M22-001`, `T-M22-005…006` across 10,000 relevance transitions. |
| R-13 | Toroidal topology and antipode danger are misunderstood. | Medium | Medium | More than 2/10 usability participants choose the long route when shown a shorter wrap; route quote differs from actual sectors/fuel; danger band identity is lost without colour. | Continuous paired wrap portals, named five-band system, redundant symbols/patterns, exact route sheet and forecast. | Add a one-time contextual wrap annotation and persistent legend; do not remove wrapping or add invisible route shortcuts. | Map/UX owner. **v0 gate:** `T-M03-001…006`, `UX-T-080…087`, and 8/10 shortest-route comprehension. |
| R-14 | Procedural rewards become generic, too rare, or dominated by hazards. | Medium | Medium | A legal 10-minute exploration sample finds no positive signal; discovery does not change route/loadout/economy choice in >50% of moderated sessions; duplicate unique artifact. | Guaranteed opening discovery, generated-at-creation rewards, distinct signals/reveal, bounded pools, one artifact per stable ID. | Increase positive-discovery weight within generator version or repair isolated empty regions; preserve already-generated definitions. | Content/balance owner. **v0 gate:** `T-M25-001…007` and opening guarantee; **v0.1/full gate:** pool coverage and uniqueness tests. |
| R-15 | Pause-anytime removes pressure and trivializes tactical decisions. | High | Medium, intentionally accepted | Players pause before every target update; combat outcomes improve materially from menu cycling; campaign pacing reports excessive management time. | Treat pause as an explicit planning-friendly promise; combat state is frozen consistently; menus expose no future/hidden information; track simulation and engaged play durations separately. | Retune encounter information/decision clarity, not pause availability. Do not add catch-up, pause cooldown, or always-online timers. | Product owner. **All releases:** acceptance of C12 is binding; `T-M27-001`, §3.10, `UX-T-100` must pass. |

### 13.3 Persistence, platform, performance, and delivery risks

| ID | Risk | Probability | Impact | Detection signal | Prevention | Contingency | Owner / release gate |
|---|---|---|---|---|---|---|---|
| R-16 | Browser crash, refresh, eviction, quota failure, or duplicate tab loses progress or resurrects confirmed death. | Medium | High | Recovery state hash diverges; two tabs commit; terminal fence exists beside an active Continue; newest corruption prevents loading valid prior snapshot. | IndexedDB atomic transaction, snapshot+journal chain, terminal fence/tombstone, in-memory terminal state, lease nonce/CAS, hidden pause, corruption quarantine. | Remain paused/read-only; recover newest valid chain; terminal marker always wins; offer validated export/diagnostics; never resume a terminal campaign. | Persistence owner. **v0 gate:** `T-M27…M29`, §7.5–7.6 crash injection at every transaction boundary and two-tab race suite pass. |
| R-17 | Client-only checksum is marketed or understood as cheat-proof security. | Medium | Medium | UI/store/help contains “tamper-proof,” “secure against editing,” or equivalent; import accepts malformed/reference-invalid payload. | Approved phrase “checksum detects corruption and casual modification”; Zod, byte cap, duplicate-key rejection, referential checks, hash-chain validation. | Correct copy before release; quarantine questionable imports; never punish or accuse the user of cheating. | Product/security owner. **v0.1 gate:** repository copy scan plus `T-M27-006…009`, `UX-T-175…177`. |
| R-18 | Determinism breaks across browsers, frame rates, dependency updates, or save/load. | Medium | High | Golden state hash mismatch, PRNG counter divergence, unstable entity order, replay differs at 30/60/120 Hz. | Integer authoritative model, fixed 20 Hz, named substreams, stable IDs/sorts, canonical JSON, exact dependencies, replay checkpoints. | Block upgrade/release; retain previous lockfile/rules version; preserve generated galaxy definitions and migration readers. | Simulation/release owner. **v0 gate:** §7.4 determinism gates, `T-M01-002`, `T-M04-006`, `P-11`, `F-14` all pass Chromium/Firefox/WebKit. |
| R-19 | 900 sectors, three rivals, particles, and AI exceed mobile CPU/GPU/memory budgets. | High at Full | High | Mobile p95 frame >33.3 ms, AI p99 >6 ms/strategic tick, decoded textures >64 MiB, snapshot >2 MiB, draw calls >80, thermal degradation. | Staged map limits; offscreen 1-Hz abstraction; fixed AI work budget; pooled particles; DPR≤2; atlases; asset and snapshot budgets; DOM only for semantic UI. | Drop cosmetic particles/voices first; defer planner work deterministically; lower render resolution; never skip authoritative ticks or semantic warnings. Full release shrinks content density before rule fidelity. | Performance owner. **v0/v0.1/full gates:** §6.12, §7.13, §8.11 and M21 CPU budgets pass on reference devices at each maximum scope. |
| R-20 | Required offline/PWA assets fail beneath GitHub Pages subpath or after update. | Medium | High | Root-relative request, network request during offline play, stale worker activates mid-run, cached shell references a missing chunk or atlas. | Vite base-path discipline, hashed precache, no cross-origin runtime request, update waits for safe Home/save+reload, subpath CI deployment test. | Keep previous worker/cache active; show non-destructive asset recovery; do not start campaign if core bundle incomplete. Roll back deployment artifact. | Platform owner. **v0 gate:** §7.7–7.8 five-step offline test and production `/venture-star/` smoke pass. |
| R-21 | Storage pressure silently evicts saves. | Medium on mobile | High | Persistence request denied, estimate below 25 MiB, test write fails, browser reports quota/eviction, autosave fails. | Request persistent storage after first campaign, pre-creation estimate/test write, compact bounded snapshots, export guidance, persistent save-failure pause. | Block new campaign below threshold; keep current campaign paused; export at v0.1; offer storage instructions, never recommend deleting records as first response. | Persistence/UX owner. **v0 gate:** quota/private-mode/device-eviction scenarios pass `T-M27-004`, `UX-T-171…172`. |
| R-22 | Required browser/API floor excludes users without a clear safe path. | Medium | Medium | WebGL2/IndexedDB/Service Worker/BroadcastChannel capability missing; compatibility screen cannot access records. | Capability check before campaign, semantic compatibility screen, storage-event notification fallback for BroadcastChannel only, published browser floor. | Do not run degraded live campaign; permit record export/history where readable; explain precise unsupported capability. | Platform/UX owner. **v0 gate:** supported-browser matrix plus missing-capability injection passes §7.1 and `UX-T-020`. |
| R-23 | Dependency/API versions drift or declared versions do not exist/support the selected Node/browser floor. | Medium | High | `npm ci`, typecheck, build, or browser launch fails from clean checkout; lockfile differs; advisories/licence scan fails. | Exact versions/lockfile, clean CI, official release-document verification before first implementation and every major upgrade, only three runtime packages. | Pin last verified compatible version and revise §7.1–7.2 plus lockfile together; no unreviewed caret-range fallback. | Technical lead. **Pre-build and every release:** clean `npm ci && npm run verify` on Node 22.20.0. |
| R-24 | Imported or migrated data corrupts live storage or creates duplicate/conflicting campaigns. | Medium at v0.1 | High | Import writes before dry run; same UUID/different hash merged; future schema partially loaded; active death marker normalized to playable. | 10-MiB cap, parse to unknown, cloned migration, dry-run summary, checksum/hash/reference validation, collision rules, quarantine. | Abort transaction; preserve existing campaign; retain invalid payload in quarantine only with consent; export diagnostic error code. | Persistence/security owner. **v0.1 gate:** §7.5.4 and `UX-T-174…177` hostile corpus passes with zero mutation on rejection. |

### 13.4 UX, accessibility, content, and legal risks

| ID | Risk | Probability | Impact | Detection signal | Prevention | Contingency | Owner / release gate |
|---|---|---|---|---|---|---|---|
| R-25 | Touch controls obstruct play, drift after interruption, or make bombs easy to trigger. | Medium | High | Joystick remains nonzero after cancel/hide; hit target <48 px; bomb activation repeats or lacks neutral confirmation; HUD overlaps safe area. | Pointer ownership/cancel rules, 48/56-px targets, safe-area padding, separated bomb control, explicit target-named confirmation, orientation gesture cancellation. | Force throttle zero and pause on uncertain pointer state; switch to fixed-center joystick option; never shrink critical controls below minimum. | Input/UX owner. **v0 gate:** `UX-T-040…069` on portrait/landscape reference phones and `F-01`. |
| R-26 | Core state is inaccessible through colour, motion, sound, fine pointer, or transient timing. | Medium | High | Greyscale/CVD recognition below threshold; muted/reduced-motion play misses state; toast disappears before read; keyboard path cannot complete first sale. | Pattern+emblem+text redundancy, static motion substitutes, visual audio equivalents, persistent timeline, keyboard/semantic DOM alternatives, pause-anytime. | Block release and replace the failing cue with persistent text/icon; do not waive because another modality works. | Accessibility owner. **Every release gate:** axe has zero serious/critical findings; `UX-T-130…166`, `F-11`, muted/reduced-motion first-five-minute play pass. |
| R-27 | Text scaling, zoom, localization expansion, or device cutouts hide essential controls. | Medium | High | Two-dimensional page scroll at 200%; essential amount ellipsized; control under safe inset; 40% expansion overlaps; focus order diverges. | Responsive reflow, sticky actions, safe-area max padding, essential no-ellipsis rule, 40% expansion harness, DOM menus. | Collapse only lower-priority HUD content; convert tables to cards; preserve critical survival/action controls and labels. | UX/accessibility owner. **v0 gate:** `UX-T-040…046`, `UX-T-133…135` at minimum supported viewport. |
| R-28 | Art is unlicensed, derivative, too large, or fails offline. | Medium | High | Missing provenance/hash/licence; source resembles reference title; asset manifest validation fails. | Original SVG direction, provenance manifest, exact budgets, and human originality review independent of creator. | Remove or replace the asset before release; never ship attribution-unclear material. | Art/legal owner. **v0 gate:** §8.10–8.11 validation, provenance review, offline cache test, originality sign-off. |
| R-29 | Canvas/WebGL visuals undermine semantic UI or mobile performance. | Medium | High | Tactical text exists only in canvas; DOM SVG animates per frame; draw calls/texture budget exceeded; screen reader cannot inspect contacts/map. | Pixi for world, DOM for blocking menus/HUD semantics, rasterized atlases, semantic nearby-contact list/map grid, strict draw/texture caps. | Reduce decorative layers and particle count; keep semantic DOM intact; use static atlas fallback, not DOM animation. | Rendering/accessibility owner. **v0 gate:** §7.3, §8.3/8.11, `UX-T-160…166`, mobile performance pass. |
| R-30 | First release expands toward the full 4X before the vertical slice proves fun and robust. | High | High | v0 branch contains v0.1/full mechanics, assets, dependencies, or UI; v0 proof gate incomplete while later stories are active. | Binding §12 cut list and release matrices; v0 fixed to 10×10, one rival, 8–12 planets; excluded code/assets not in production/precache. | Stop later work, remove or feature-exclude leaked scope, return to failed v0 gate. Incidental code does not change acceptance scope. | Product/release owner. **v0 gate:** §12.8 cut audit and §1.9 proof gate pass before v0.1 starts. |
| R-31 | Campaign duration target is met by empty travel or grind rather than fast decisions. | Medium | Medium | Median Captain outside 45–75 minutes; >25% engaged time is travel without a decision/contact; menu wait/commodity grind dominates. | Phase pacing checkpoints, objective families, local opportunities, bounded acquisition costs, no paused production, capitulation at v0.1. | Adjust acquisition/repair costs and encounter spacing before ship speed; never add idle transit or passive menu income as padding. | Balance owner. **v0 gate:** `P-12`, §3.6 and 1,000-seed bot/human pacing review. |
| R-32 | No analytics/account/server means field failures cannot be observed automatically. | High | Medium | User report lacks version, state hash, last events, platform, or reproduction; issue cannot be replayed. | Local privacy-preserving diagnostics export with rules/schema/generator versions, error codes, hashes, last bounded event headers, settings excluding personal paths/content; no automatic transmission. | Provide manual issue template and user-controlled diagnostic download; reproduce via seed/input trace. Do not add telemetry without new consent/spec. | QA/privacy owner. **v0 gate:** offline diagnostic bundle generation and redaction test pass. |

### 13.5 Cross-section contradiction and integration decision register

Parallel authoring exposed the conflicts below. These are not open choices: the **binding integration decision** is the required value for assembly and implementation. The spec integrator must harmonize the named source sections before declaring the final document verified. Until harmonized, the associated release gate is failed.

| ID | Conflict detected | Binding integration decision | Sections requiring harmonization | Gate/owner |
|---|---|---|---|---|
| X-01 | Base campaign values differ: §4 uses `250 cr`, `100 FU` with final 10-FU reserve, `100/60/80` hull/armour/shield; §5 uses `240 cr`, `80 FU` plus separate reserve, `120/60/50`. | Use §5: `240 cr`, normal tank `80 FU`, emergency reserve is a separate inexhaustible return mode capped `55 wu/s`, hull `120`, armour `60`, shield `50`. Remove the spendable/protected 10-FU partition. | §4.0, M05, M14; §5.2/5.10; §9 fuel copy. | Simulation/progression owners; v0 compile-time constant test blocks ship. |
| X-02 | Flight/combat baselines differ: M04 max `240 wu/s`; §6 acceptance uses `220`; M15 cannon `10` damage/`0.75 s`; §5 uses `12` damage/`1.25 shots/s`; base sensors are `430` in §4 but `320` in §5. | Use §5–§6 progression/feel baselines: max `220 wu/s`, cannon `12` damage at `1.25 shots/s` (`0.8 s` cooldown), base sensor `320 wu`. Preserve M04 deterministic integration, M15 targeting, and upgrade deltas relative to these values. | M04, M15, M24; §5.2/5.5; §6.3/6.6. | Simulation/feel owners; golden stat snapshot and `F-02/F-07`. |
| X-03 | Station-keeping orbit is `72 wu` in M07 but `92 wu` in `F-05`; mining base is material-specific `1.0/0.65/0.40` units/s in M08 but Deepglass baseline is `4.0 units/s` in §5/§6. | Use `92 wu` orbit and §5 module-visible aggregate extraction: common baseline `4.0 units/s`; metal `2.6`; crystal `1.6`; exotic `0.6`, retaining M08 ratios and fractional conservation. Interaction/acquisition range remains M07 `96/84 wu`. | M07–M08; §5.5; §6.5 and `F-05/F-06`; asset lock timing. | Feel/balance owners; 30-second extraction trace. |
| X-04 | M12 defines six typed slots and six simultaneously fittable families; §5 defines three generic slots occupied by tier-0 capability modules. | Use three generic module slots in v0; all six families compete for them. Tier-0 Survey Pin/Cargo Sling/Drill Coupler establish capability and may be replaced under §5 rules. v0.1 may unlock a fourth; Full maximum five. | M12; §5.2/5.5/5.7/5.8; §9.9 slot UI; §8 panel inventory. | Progression/UX owners; `P-03` and loadout matrix. |
| X-05 | Material CU sizes/prices differ: M08 weights crystal/exotic below 1 CU and M10 bases `10/24/55/180`; §5 says all materials 1 CU and bases `10/18/26/65`. | Use §5 values: every material unit consumes `1 CU`; bases common `10`, metal `18`, crystal `26`, exotic `65 cr`. Equipment stored as cargo remains `4 CU`; bombs remain outside cargo in v0. | M08–M10; §5.2/5.10; market/cargo UI. | Economy owner; ledger golden tests. |
| X-06 | Adaptive market upper bound is `2.40×` in M10 but `1.85×` in §5; pressure caps also differ. | Use global quote clamp `0.55×…1.85×`; player transaction pressure changes quote by at most `8%` per transaction and `30%` total. Retain M10 stock/scarcity formula but clamp final result to this range and preserve the 18%/5-min circuit gate. | M10; §5.10; §9.9. | Economy owner; economy sweep before v0.1. |
| X-07 | Danger uses Manhattan distance and `Safe/Frontier/Contested/Perilous/Apex` in M03/§9, but Euclidean distance and `Haven/Near Reach/Far Reach/Verge/Antipode` in §5; §8 assets list only four bands. | Use §5 Euclidean normalized distance and five names `Haven`, `Near Reach`, `Far Reach`, `Verge`, `Antipode`, with §5 threat/yield/discovery multipliers. Route length remains wrapped Manhattan/A*. Produce five hatch assets and update UX symbols/copy to these names. | M03/M02 reward; §5.4; §8.5.4; §9.8. | Map/balance/art owners; route/danger golden matrix. |
| X-08 | v0 acquisition differs: M18 converts at 60 IP with `20/25` actions and M19 models infrastructure damage; §5 uses resistance `R`, `18/22/8` influence actions, resolve `34`, and simplified 60% repair path. | v0 uses §5.6 simplified resistance/influence/resolve and `15 s` service lock/`120 s` output repair. M18–M20 full influence, infrastructure damage, and orbital defence activate in v0.1, not v0. | M18–M20 release tags/formulas; §5.6–5.7; §4.33; §12.2–12.3. | Systems owner; v0 scope and acquisition tests. |
| X-09 | Siege bomb cost is `90 cr +2 crystal` and planet damage `120` in M16; §5 uses `110 cr +1 metal+1 crystal`, `34` resolve after shields. | Use §5 v0 price `110 cr +1 metal+1 crystal`, ammo cap 3/start 1. Projectile ship splash remains M16; planet impact removes `34` resolve only after v0 shields are down. v0.1 siege engineering may alter planetary damage through research. | M16/M19/M31; §5.2/5.6/5.7; §9 bomb preview. | Combat/progression owners; preview-result golden test. |
| X-10 | Research differs completely: M31 has eight 80/180/360-RP nodes; §5 has ten named R-01…R-10 projects costing 45–165 RP. Roles differ in cost/time/output. | Use §5.7’s ten-node v0.1 tree, fourth-slot unlock, RP production, and role rules: `150 cr+4 metal`, `45 s`, one role, listed benefits/sacrifices. Remove M31’s alternate eight-node tree and M17’s `120 cr/120 s` role change. | M17, M31; §5.7; §9.9; §8 role assets. | Progression owner; v0.1 research DAG/role golden suite. |
| X-11 | AI difficulty differs: M21 grants production multipliers and `5/3 s` planning; §5 uses no free resources, `6/4/2.5 s`, different aim/aggression/policy values. | Use §5.9 disclosed table in full. AI production efficiency is exactly `1.00×` on every difficulty; difficulty changes policy competence, aim, aggression, neutral threat/reward only. Preserve M21 shared ledgers and CPU budget. | M15, M21; §5.9; setup copy in §9.3.3. | AI/product owners; `P-05`, `F-12`, ledger audit. |
| X-12 | PRNG/seed/state formats differ: §4 says 64-bit hex, xoshiro256**, quantized float authority; §7 says 80-bit Crockford Base32, SHA-256 substreams, xoshiro128**, integer authority. | §7.4 is authoritative: canonical 16-character Crockford Base32 input/display, SHA-256 domain substreams, xoshiro128**, integer milli-units/ticks/basis points, canonical JSON object hashing. Generated galaxy definition is stored and replayed. | §4.0/M01/M02; §7.4; §9.3.3 seed UI. | Simulation/persistence owners; cross-browser golden hashes block v0. |
| X-13 | Autosave cadence is 15 active seconds in M27 but 10 active seconds and transaction-triggered in §3/§7; M27 describes two-slot promotion while §7 uses one atomic multi-store IndexedDB transaction. | Use §7.5: persist after every authoritative transaction/sector/ownership/equipment/objective/pause change and every 10 active seconds; snapshot every 60 active seconds; atomic multi-store transaction plus journal and previous snapshots. “Two slots” is conceptual recovery history, not separate pointer promotion. | M27; §3.7/3.10; §7.5; §9.17.2. | Persistence owner; crash matrix. |
| X-14 | Terminal hash in M28 concatenates values; §7 hashes canonical objects and uses an emergency localStorage tombstone plus IndexedDB seal fence. | Use §7.4/7.5 canonical object hashing and terminal protocol exactly; no ambiguous byte concatenation. M28’s monotonic state machine remains behaviorally authoritative. | M28–M29; §3.9; §7.4–7.5; §9.17.2. | Persistence/security owners; terminal crash injection. |
| X-15 | Supported viewport floor is `360×640`/`640×360` in §7 but §9 claims support at `320×568`/`568×320`; touch targets are 44 px in §6/§8 and 48 px in §9. | Supported floor is §7’s `360×640` portrait and `640×360` landscape. `320×568` is a graceful-reflow stress test, not a supported gameplay claim. Interactive targets use §9 minima: 48 px general, 56 px primary; 44 px applies only to map/canvas selection tolerance where a 48-px DOM control is unavailable. | §6.2/6.11; §7.1; §8.5.4; §9.4/9.6/9.8. | UX/accessibility owners; viewport matrix. |
| X-16 | Text presets are absolute `14/16/20/24 px` in §9 but percentages `100/115/130/150%` in §6. Haptic patterns differ between §6 and §9. | Use a 16-px root multiplied by `100/115/130/150%` (`16/18.4/20.8/24 px`); no 14-px user preset. Use §6.10 vibration durations: lock 15, cargo full 40, hostile damage 50, kill 90, bomb 120 ms, globally rate-limited to 250 ms. Reduced motion forces shake off but does not disable haptics; haptics has its own toggle. | §6.10–6.11; §9.6/9.13/9.19. | Accessibility/feel owners; settings golden test. |
| X-17 | Toast behavior differs: §6 allows three visible and ordinary 3.5 s; §9/M30 throttle to one per 2 s with major 8 s/info 5 s. | Use §9.11/M30: one active noncritical toast, queued count, info 5 s, major 8 s, critical persistent, one noncritical admission per 2 s. §6’s “max three/3.5 s” is superseded. | §6.9; M30; §9.11. | UX owner; alert queue timing test. |
| X-18 | Campaign pacing metric says active management time is included in §5 but M29 “wall play excluding pause” would exclude management because management pauses simulation. | Store three metrics: `simulationDuration` excludes all pause reasons; `engagedDuration` includes management/Galaxy and running flight but excludes explicit pause, hidden, lease loss, and recovery; `wallSpan` is start-to-end. The 45–75-minute target uses engaged duration. | §3.2/3.6; M29; §5.3; History UI §9.3.6. | Analytics-free QA/statistics owner; duration clock tests. |

All `X-*` decisions must be applied before the final cross-section consistency pass. They do not authorize scope expansion; they select among already-authored conflicting values.

### 13.6 Known unknowns converted to execution gates

These matters cannot be known empirically before implementation, but none is left as an undefined design decision. Each has a fixed experiment, threshold, and fallback.

| ID | Unknown | Required experiment and threshold | Binding response if threshold fails | Owner / gate |
|---|---|---|---|---|
| K-01 | Whether station-keeping is satisfying on real touch devices. | 10 participants on phones; ≥8 acquire, hold 10 s, intentionally break, and reacquire without instruction after one demonstration; median perceived control ≥4/5. | Set tangential orbit to `0 wu/s`, retain 92-wu spring lock and pulse cadence; retest. No mining minigame. | Feel owner; v0 vertical-slice gate. |
| K-02 | Whether 45–75 engaged minutes is achievable without grind. | 1,000 Captain bot seeds plus 10 human completions; bot median and ≥80% completed runs in range; human median in range; empty transit <25%. | Tune acquisition/repair cost and encounter spacing in that order; do not change flagship speed solely to pad/cut duration. | Balance owner; v0 content lock. |
| K-03 | Whether all six v0 module families produce real choice. | ≥200 successful Captain bot runs plus 10 human debriefs; no family >80% inclusion and every family chosen in ≥10% of wins. | Adjust price/effect by rules version while preserving three-slot cap; if a family remains <10%, remove it from v0 and update six-family gate rather than ship false choice. | Progression owner; v0 balance gate. |
| K-04 | Whether offscreen 1-Hz resolution is perceptually fair. | 10,000 paired encounters resolved headless 20-Hz vs 1-Hz abstraction; median outcome resource delta ≤5%, 95th percentile ≤15%; zero relevance discontinuities. | Resolve contested ship combat headless at 20 Hz; retain 1-Hz travel/economy. | AI/simulation owner; v0 AI gate. |
| K-05 | Whether Pixi/WebGL budget holds on 2020-class phones. | Worst-case v0 scene for 10 minutes: p95 ≤33.3 ms, no >100-ms input stall, texture ≤64 MiB, draw calls ≤80, peak JS heap within browser-safe test baseline. | Reduce particles to mobile 90 then 45, atlas resolution for non-UI scenery, and DPR toward 1; semantic cues and simulation unchanged. | Rendering owner; v0 performance gate. |
| K-06 | Whether browser storage persists reliably enough for permadeath trust. | Crash/kill/refresh/quota/eviction tests on supported desktop browsers plus iOS Safari/Android Chrome; 100% terminal markers seal; 100% nonterminal cases recover newest valid chain or explicitly report rollback. | Block live campaign on affected platform/version and allow History/export until the persistence implementation is fixed; no best-effort permadeath mode. | Persistence owner; v0 platform gate. |
| K-07 | Closed: audio was removed from all release layers by explicit player decision on 2026-09-07. | Production and precache contain zero audio assets, manifests, controls, or runtime construction. | Fail `T-F-10` if any audio path reappears. | Product/platform owner; every release. |
| K-08 | Whether faction patterns and tactical cues survive phone-scale CVD conditions. | Automated contrast plus 20-person/20-item recognition: ≥18/20 correct per required cue at 24 px in grayscale and each CVD simulation. | Redesign silhouette/pattern/emblem; do not solve only by changing hue or adding tooltip text. | Art/accessibility owner; v0 visual gate. |
| K-09 | Whether no-telemetry support can reproduce field defects. | Three seeded bug drills from exported diagnostics; QA must reproduce all three without personal data or network logs. | Add bounded command headers and environment capabilities to user-controlled diagnostic export after privacy review; no automatic telemetry. | QA/privacy owner; v0 support gate. |
| K-10 | Whether TypeScript/Vite/Pixi/PWA versions in §7 remain installable and compatible at implementation start. | Clean checkout `npm ci`, typecheck, unit, build, Chromium/Firefox/WebKit smoke, and official release-note compatibility review. | Pin the latest mutually compatible exact versions available then revise §7 version table/lockfile as one reviewed change before source implementation. | Technical lead; pre-build gate. |

## 14. Critique Log

The user approved all Phase 2 recommendations on 2026-09-06. `Address` means required in the named release; `Stage` means deliberately excluded from v0 and required at the later gate; `Accept` means the product intentionally retains the trade-off. §10 and §11 are present and bind each critique to executable coverage. The concise traceability index is:

| Critique | Primary stories | Primary test evidence |
|---|---|---|
| C1 opening envelope | VS-V0-002, VS-V0-015 | `LOOP-OPEN-001…005`, `T-M02-001`, `T-M02-007`, `T-BAL-001`, `T-E2E-V0-001` |
| C2 station-keeping feel | VS-V0-005 | `T-M07-001…006`, `T-M08-001…004`, `T-F-05`, `T-F-06` |
| C3 flight/combat readability | VS-V0-003, VS-V0-004, VS-V0-007 | `T-F-01…04`, `T-F-07`, `T-M04-*`, `T-M06-*`, `T-M13-*…T-M16-*` |
| C4 late cleanup | VS-V01-107 | `LOOP-END-001…006`, `T-M23-001…006`, `T-BAL-007` |
| C5 staged scope | VS-V0-016, VS-V01-109, VS-FULL-205 | `T-E2E-V0-005`, `T-E2E-V01-001`, `T-E2E-FULL-001`, `T-REF-001` |
| C6 shared-rule AI | VS-V0-010, VS-V01-105, VS-FULL-202 | `T-M21-001…006`, `T-M22-001…006`, `T-BAL-005`, `T-PERF-002` |
| C7 toroidal/danger clarity | VS-V0-002, VS-V0-009 | `T-M03-001…006`, `T-F-03`, `UX-T-080…085` |
| C8 browser permadeath integrity | VS-V0-012, VS-V0-013 | `T-M27-001…009`, `T-M28-001…006`, `LOOP-TERM-001…005`, `T-E2E-V0-004` |
| C9 competitive delta | VS-V0-015, VS-V0-016 | `T-E2E-V0-001`, `T-E2E-V0-005`, `T-BAL-006`, `T-REF-001` |
| C10 bounded economy | VS-V0-006, VS-V01-102 | `T-M10-001…007`, `T-BAL-003`, `T-BAL-004` |
| C11 presentation performance | VS-V0-014 | `T-F-04`, `T-F-10`, `T-PERF-001`, `T-PERF-002`, `T-DEPLOY-002` |
| C12 planning-friendly pause | VS-V0-011, VS-V0-012 | `LOOP-PAUSE-001…007`, `T-M27-001`, `T-F-09`, `UX-T-100…107` |

Ranges in this critique index are explanatory shorthand; individual §11 `test_ref` fields continue to use exact IDs only. Missing or renamed IDs fail `T-REF-001` and R-30.

### C1 — Procedural opening can be empty, unfair, or confusing

- **Original severity:** Ship blocker.
- **Approved decision:** `Address in v0`.
- **Resolution:** Every seed enters M02 generation/validation. It guarantees safe home, a ≥12-CU common node within one crossing, an eight-unit mine/sale route that funds a consequential upgrade by 180 simulation seconds, a positive discovery within two sectors, visible rival action by 300 seconds, normal-fuel reachability, and global planet connectivity. Failed candidates retry to 256 then receive a deterministic repair pass. §3.4 defines the opening envelope and validator; §1.5/§1.9 make it a product/release promise; §9.3 provides the legible player flow.
- **Verification:** `T-M02-001…007`, §3.4.3, `P-02`, `UX-T-023…025`, §7.4 10,000-seed cross-browser hash sweep.
- **Residual risk/response:** Legal pacing may still feel confusing; R-02/K-02 require human first-five-minute observation and signposting fallback.
- **Release/story binding:** v0 generation, opening, first trade, and first refit stories must cite C1 and M02; R-01/R-02 block v0.

### C2 — Passive mining and imprecise touch control

- **Original severity:** Ship blocker.
- **Approved decision:** `Address in v0`.
- **Resolution:** M07 provides a 350-ms assisted lock with range inset, spring hold, manual/high-throttle break, and reduced-motion parity. M08 provides fractional conserved extraction, reasoned interruptions, visible pulses, cargo transfer, and module-dependent cadence. §6.5 owns tactile feedback; §9.6 specifies joystick/throttle cancellation and touch geometry; §1.6 makes station-keeping the interaction signature.
- **Verification:** `T-M07-001…006`, `T-M08-001…006`, `F-05/F-06`, `UX-T-060…069`, K-01 moderated touch threshold.
- **Residual risk/response:** Orbit can still feel automated or oscillatory; K-01’s binding fallback removes tangential orbit while retaining range lock and player break control.
- **Release/story binding:** v0 flight/mining/module-feedback stories; R-03 blocks vertical-slice acceptance.

### C3 — Flight, autopilot, combat, bombs, touch targeting, and death feedback lack numbers/readability

- **Original severity:** Ship blocker.
- **Approved decision:** `Address in v0 before implementation`.
- **Resolution:** M04–M07 define movement/fuel/autopilot/station states; M13–M16 define targeting, health layers, cannon and bomb; M28 defines death. §6.2–6.8 defines input, camera, shake, hit and reveal timing; §9.5–9.7 defines fixed controls, touch controls, selection and HUD hierarchy; §9.14 defines reduced-motion equivalents. X-01–X-03/X-09 select canonical numeric values where parallel drafts collided.
- **Verification:** `T-M04…M07`, `T-M13…M16`, `T-M28`, `F-01…F-08`, `UX-T-050…075`, deterministic replay/hash gates.
- **Residual risk/response:** Feel remains empirical; R-04/R-08 and K-01 enforce device traces and recognition tests, with presentation-only tuning rather than rule ambiguity.
- **Release/story binding:** v0 flight, autopilot, fuel, combat, bomb, feedback, accessibility, and permadeath stories.

### C4 — One flagship makes late-game cleanup tedious

- **Original severity:** Ship blocker.
- **Approved decision:** `Address structurally; stage capitulation/federation to v0.1`.
- **Resolution:** Formal victory remains all-planets control in M29/§3.9. v0 stays at 8–12 planets. M23/§3.8 add v0.1 military surrender after no functioning shipyard/ship and ≤20% planet share, or federation with influence/trust/no recent bomb conditions. Transfer completes before victory evaluation.
- **Verification:** `T-M23-001…006`, `T-M29-001…006`, §3.8.5/3.9.4, `P-10`, cleanup-share pacing measurement.
- **Residual risk/response:** v0 may still have cleanup; R-10 caps cleanup share and permits cost/planet-count tuning, not early scope leakage.
- **Release/story binding:** v0 victory story; v0.1 capitulation/federation and multi-rival ordering stories.

### C5 — Full 4X/900-sector scope is too broad for first playable

- **Original severity:** Major.
- **Approved decision:** `Stage`.
- **Resolution:** §1.9, §4.33, §9.20, and §12 define cumulative layers. v0: 10×10, one rival, 8–12 planets, fixed bounded market, three materials, six module families, one hazard, two discoveries, simplified acquisition, geography fog, and complete run/persistence. v0.1: dimensions through 15, two rivals, adaptive market, exotic, research/roles, stale intel, expanded content/defence, capitulation, import/export/tutorial. Full: through 30×30, three rivals, wormholes, broader simulation/content/records.
- **Verification:** §12.8 cut audit, release matrices, production asset/precache scan, §1.9 proof gates.
- **Residual risk/response:** “Helpful” later systems may leak into v0; R-30 requires removal/feature exclusion and return to failed vertical-slice gate.
- **Release/story binding:** Every §11 story must carry exactly one earliest release tag and may not make a later story prerequisite of an earlier release.

### C6 — Exact offscreen AI is costly and unreadable

- **Original severity:** Major.
- **Approved decision:** `Address with shared strategic rules and abstract tactics`.
- **Resolution:** M21 requires identical economic costs, command envelopes, fuel constraints, beliefs, and visible intent when intelligence permits. M22 uses exact onscreen mechanics and one-second offscreen travel/combat quanta with persistent state; §7.3 routes AI through normal commands; §7.4 commits PRNG counters. M24/§9.7 expose intent/cargo/fuel/destination/build progress only when earned.
- **Verification:** `T-M21-001…006`, `T-M22-001…006`, §7.4 replay tests, K-04 paired-resolution threshold, M21 CPU budget.
- **Residual risk/response:** Aggregate outcomes may drift; K-04 escalates contested combat to headless 20-Hz while preserving 1-Hz travel/economy.
- **Release/story binding:** v0 rival planning, offscreen travel/combat, reconstruction, intelligence, and diagnostics stories.

### C7 — Toroidal routes and danger are confusing

- **Original severity:** Major.
- **Approved decision:** `Address in v0`.
- **Resolution:** M03 defines wrapped normalization, A*, tie rules, route cost, and edge crossing. §9.8 draws paired portals, continuous wrap routes, coordinates, known/unknown segments, fuel and reserve effects. X-07 selects one five-band Euclidean antipode curve and names, harmonizing §5/§8/§9.
- **Verification:** `T-M03-001…006`, `UX-T-080…087`, route forecast-versus-execution property test, 8/10 wrap comprehension threshold.
- **Residual risk/response:** Players may still interpret paired portals as discontinuity; R-13 adds one-time annotation and persistent legend without changing topology.
- **Release/story binding:** v0 Galaxy, route preview, autopilot, fuel forecast, danger legend, and wrap transition stories.

### C8 — Browser permadeath can resemble data loss or be bypassed by crash/duplicate tabs

- **Original severity:** Ship blocker.
- **Approved decision:** `Address in v0`.
- **Resolution:** M27–M29 and §3.7/3.9/3.10 define pause/save/lease/terminal states. §7.5 provides one atomic multi-store transaction, journal chain, snapshots, terminal seal fence and emergency tombstone; §7.6 provides nonce/CAS lease. §9.3/9.17 explicitly distinguishes recovery, rollback, sealed defeat, lease loss, and storage failure. X-13/X-14 select the exact persistence implementation.
- **Verification:** `T-M27-001…009`, `T-M28-001…006`, `T-M29-001…006`, §3.9.4/3.10.4, crash injection at every await/transaction boundary, two-tab race suite, K-06 device matrix.
- **Residual risk/response:** Browser storage may be unavailable despite correct code; R-16/R-21/K-06 require pause/export or platform blocking, never a best-effort unsealed mode.
- **Release/story binding:** v0 autosave, recovery, lease, death, victory, sealed history, and storage-failure stories.

### C9 — Differentiator too derivative; “faster sessions” unsupported

- **Original severity:** Major.
- **Approved decision:** `Address positioning now`.
- **Resolution:** §1.1–1.4 position “one-ship 4X,” rewarding discovery, fast decisions/low friction, and visible shared-rule rivals. §2.3–2.6 expressly rejects clone/remake and universal shorter-session claims. Session target is transparently 45–75 engaged minutes; X-18 defines the clock. §8.1/8.9 require original/licensed expression.
- **Verification:** §2.7 copy/originality criteria, repository/store-copy scan, independent visual-asset provenance review, duration statistics.
- **Residual risk/response:** Inspiration may remain too visually/verbally close; R-28 blocks assets/copy lacking originality evidence and requires replacement.
- **Release/story binding:** brand/store copy, original art, first-five-minute signature, readable-AI stories in v0.

### C10 — Markets/materials create coloured currencies or exploitable arbitrage

- **Original severity:** Major.
- **Approved decision:** `Address in balance; stage dynamic market to v0.1`.
- **Resolution:** M08–M10 define separate sources/sinks, finite stock, atomic ledgers, spread, intel aging and pressure. §5.10 adds quote bounds, recovery contracts, per-transaction pressure cap, and ≤18%/5-min zero-risk circuit criterion. v0 uses fixed bounded local prices; v0.1 activates adaptive formula. X-05/X-06 select canonical weights/base prices/caps.
- **Verification:** `T-M08…M10`, `P-04/P-06/P-11`, 100,000-transaction conservation, automated circuit search and recovery sweep.
- **Residual risk/response:** A legal but boring dominant route may remain; R-06 freezes bad pressure values and retunes economy rather than adding currency complexity.
- **Release/story binding:** v0 mining/cargo/fixed trade and recovery; v0.1 adaptive stock/price/intel stories.

### C11 — Presentation assets create mobile performance/licensing risk

- **Original severity:** Major.
- **Approved decision:** `Address architecture and asset pipeline in v0`.
- **Resolution:** §7.1/7.3 select Pixi WebGL tactical rendering with semantic DOM menus/HUD; §8.3 rasterizes validated original SVG into atlases with no runtime SVG parsing. By explicit player decision on 2026-09-07, all audio was cut: no audio assets, runtime, controls, cache entries, or audio tests ship.
- **Verification:** §7.13 performance, §8.11 visual-asset gates, `UX-T-150…155`, offline precache test, K-05, provenance/originality review, and `T-F-10` silent-build assertion.
- **Residual risk/response:** Worst-case phone or licensing failure may invalidate ambient content; R-19/R-28 reduce decorative load or ship affected ambience silent with semantic visual equivalents.
- **Release/story binding:** v0 renderer/atlas, semantic overlay, visual/text feedback, offline packaging, and provenance stories.

### C12 — Paused management gives unlimited planning time

- **Original severity:** Acceptable risk.
- **Approved decision:** `Accept intentionally in every release`.
- **Resolution:** §1.2/1.7 and §2.6 define planning-friendly pause as product identity. §3.10/M27 use a reason set; hidden tabs and management schedule zero ticks and no catch-up. §9.10 communicates every pause reason and manages stack/focus. X-18 separates engaged, simulation, and wall-span statistics so planning cost remains visible without making it dangerous.
- **Verification:** `T-M27-001`, §3.10.4, `P-06`, `F-09`, `UX-T-100…106`, hidden/management/save/load clock tests.
- **Residual risk/response:** Pause may lower tactical pressure; R-15 explicitly forbids cooldowns, catch-up, or future-information leaks as a “fix.” Encounter clarity and balance are tuned instead.
- **Release/story binding:** v0 pause, management, hidden-tab, resume-review, statistics stories; inherited unchanged by later layers.

### 14.13 Critique closure gate

The Phase 2 critique is closed for specification only when all conditions below are true:

1. Every C1–C12 entry remains represented in §10 tests and §11 stories by its stable mechanic/acceptance IDs.
2. Every X-01–X-18 binding integration decision has been applied across the assembled document; a literal-value and terminology scan finds no superseded value presented as current.
3. Every v0 blocker (`C1`, `C2`, `C3`, `C8`) has a build story, automated failure path, and human/device acceptance where specified.
4. Staged items (`C4` capitulation portion, `C5`, `C10` adaptive portion) are absent from v0 production bundles and present in the correct later backlog.
5. Accepted risk C12 remains documented in product copy, pause tests, and statistics semantics rather than being silently “fixed.”
6. R-01 through R-32 each has an accountable owner and evidence attached at its stated release gate.
7. K-01 through K-10 experiments are executed at their gates and their binding fallback is used on failure; no release note substitutes for a failed threshold.

Failure of any condition reopens the relevant critique ID and blocks the affected release. User approval of the design decisions does not waive verification evidence.
