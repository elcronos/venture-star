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

**Inputs:** validated M01 identity. Target planet count is `P = clamp(round(width × height × 0.10), 8, 90)`; v0 additionally clamps `P` to `8…12`. Planet sectors are unique. Content density per sector is sampled from deterministic streams: mineable node `22%`, asteroid field `10%`, ion storm `6%`, positive discovery `8%`; generation rules prevent mutually exclusive overlaps.

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

**Inputs:** steering vector from keyboard or virtual joystick, throttle `q∈[0,1]`, brake input, current velocity/heading, equipment modifiers, M05 fuel mode.

**Formula:** input dead zone is `0.12`; remap magnitude as `(m-0.12)/0.88`. Turn rate is `ω = lerp(150°,55°,speed/maxSpeed) × turnModifier /s`. Forward acceleration is `a = 92 × q × engineModifier wu/s²`; reverse/brake acceleration is `150 wu/s²`. Drag while unpowered is `8 wu/s²`. Base `maxSpeed=220 wu/s`; normal cruise threshold is `96 wu/s`. Velocity is integrated semi-implicitly at fixed ticks into scaled integer authority.

**Effect:** steering rotates toward desired heading by at most `ω×dt`; thrust accelerates along heading. Brake opposes velocity and snaps to zero below `2 wu/s`. Collision with solid geometry projects the ship to contact, removes inward velocity, deals `ceil(max(0,impactSpeed-70)²/180)` hull-bypassing damage capped at `35 pt`, then grants `0.5 s` collision immunity.

**State transition:** `IDLE ↔ THRUSTING ↔ CRUISING ↔ BRAKING`; M06 may enter `AUTOPILOT`; M07 may enter `STATION_KEEP`; M05 can force `EMERGENCY_DRIFT`; destruction enters M28 transaction.

**Edges/failures:** opposite keyboard directions cancel. Losing window focus clears held inputs next tick. Touch joystick release returns input to zero within `50 ms`. UI/menu input never leaks into flight.

**Tests:** `T-M04-001` acceleration/max speed; `T-M04-002` turn curve; `T-M04-003` brake distance (`≤195 wu` from max speed); `T-M04-004` collision damage; `T-M04-005` focus-loss clears thrust; `T-M04-006` 30/60/120 FPS deterministic position.

### M05 — Fuel, refueling, range forecast, and emergency reserve [v0]

**Inputs:** throttle, speed, elapsed ticks, tank equipment, dock owner/relations, route.

**Formula:** powered-flight burn is `burn = dt × q × (0.018 + 0.0000018 × speed²) FU`; coasting at `q=0` burns zero. Autopilot uses the same formula. Normal tank maximum is `80 + equipmentBonus FU`. Route forecast simulates the route at autopilot cruise plus `5%` margin. Friendly fuel costs `1 cr/FU`; neutral permitted access costs `3 cr/FU`; hostile denies refueling. AI pays identical rates from faction funds.

**Effect:** when normal fuel reaches zero, enter the separate inexhaustible `EMERGENCY_DRIFT` return mode: max speed `55 wu/s`, acceleration capped so it cannot exceed that speed, no fuel burn, weapons/bombs/mining/hostile planet interaction disabled, and shields stop recharging. Docking at any legally usable refuel source exits after obtaining at least `1 FU`. If player lacks credits, a friendly planet supplies `15 FU` once per planet per `600 s` and records a `30 cr` debt deducted from future sales.

**State transition:** `NORMAL → LOW_FUEL` at forecasted home margin `<15 FU`; `LOW_FUEL → EMERGENCY_DRIFT` when normal fuel reaches `0`; refuel returns to `NORMAL` or `LOW_FUEL` according to forecast.

**Edges/failures:** normal fuel never becomes negative. Equipment swap cannot reduce tank below current fuel; excess is sold back at friendly price, or swap is blocked if no market. Forecast labels unknown hazards but does not invent extra burn. Emergency return mode is not a fuel quantity, cannot be sold/upgraded, and remains available until a legal refuel source is reached.

**Tests:** `T-M05-001` burn curve; `T-M05-002` cruise is negligible only when unpowered; `T-M05-003` reserve restrictions; `T-M05-004` debt rescue; `T-M05-005` AI/player parity; `T-M05-006` forecast margin; `T-M05-007` tank downsizing.

### M06 — Autopilot and interruption [v0]

**Inputs:** tap/click destination in local space, entity interaction, or strategic sector; current intel; fuel forecast; user confirmation if reserve forecast is negative.

**Formula:** desired cruise is `180 wu/s`; braking distance is `dBrake=v²/(2×150)+24 wu`; arrival tolerances are `24 wu` for a point and `84 wu` for an interaction target.

**Effect:** local path uses collision waypoints with `48 wu` clearance; strategic path uses M03. Autopilot rotates, accelerates to `180 wu/s`, begins braking at `v²/(2×150)+24 wu`, and stops at `84 wu` from an interaction target or within `24 wu` of a point. Route and fuel forecast remain visible.

**State transition:** `OFF → PLOTTING → TRAVEL → APPROACH → ARRIVED → OFF`. Transition to `INTERRUPTED` on manual steering magnitude `>0.20`, brake, hostile target entering live sensor range, incoming damage, newly detected severe hazard on route, route invalidation, or predicted usable fuel below zero. User may explicitly resume after any interruption. Opening a pausing screen suspends but does not cancel autopilot.

**Edges/failures:** unreachable targets show a reason and never consume fuel. Destination destruction cancels. A moving target is repathed at `2 Hz`; if its speed exceeds flagship maximum for `3 s`, cancel. Autopilot never automatically enters a known severe hazard. It cannot activate bombs or initiate hostility.

**Tests:** `T-M06-001` point arrival tolerance; `T-M06-002` interaction standoff; `T-M06-003` manual interrupt next tick; `T-M06-004` hostile/damage interrupt; `T-M06-005` braking without overshoot; `T-M06-006` wrap route; `T-M06-007` unreachable/vanished target; `T-M06-008` paused resume without catch-up.

### M07 — Assisted station-keeping and interaction lock [v0]

**Inputs:** selected mineable/collectible/dockable target, separation, relative speed, throttle, manual steering.

**Formula:** eligible when separation `≤INTERACT_RANGE-LOCK_INSET = 84 wu`, relative speed `≤35 wu/s`, throttle `≤0.25`, and target unobstructed. Assist applies spring acceleration `a = clamp(2.4×radialError - 1.8×radialVelocity, -45,45) wu/s²` toward an orbit radius of `92 wu`, plus tangential target matching capped at `30 wu/s²`.

**Effect:** after eligibility holds `0.35 s`, show range lock and enter `LOCKED`; mining/transfer may proceed. A subtle clockwise orbit is capped at `10 wu/s`. Upgrade range changes both interaction range and orbit radius proportionally, while the acquisition inset remains `12.5%` of range.

**State transition:** `OUT_OF_RANGE → ELIGIBLE → LOCKED`. Break immediately to `OUT_OF_RANGE` on steering magnitude `>0.20`, throttle `>0.40`, separation `>interactionRange`, target loss, obstruction, damage causing knockback, or autopilot command. Values between throttle `0.25…0.40` retain an existing lock but cannot acquire one.

**Edges/failures:** assist never spends fuel, cancels velocity rather than teleporting, and cannot pull through obstacles. Reduced motion removes orbital arc/camera ease but preserves lock indicator and physics.

**Tests:** `T-M07-001` acquire at 84 wu/35 wu/s; `T-M07-002` no acquire outside thresholds; `T-M07-003` manual/high-throttle break; `T-M07-004` obstruction break; `T-M07-005` stable 30-second orbit; `T-M07-006` reduced-motion parity.

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
