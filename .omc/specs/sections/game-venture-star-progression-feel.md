# Venture Star — Progression and Feel Sections

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

<!-- CUT:AUDIO:START Historical audio mix direction, removed from implementation scope by the player's 2026-09-07 decision.

All volume values are relative dB before user sliders. Master output uses a limiter at `-1 dBFS`; no event may clip. Effects and music have independent sliders from 0–100%, mapped logarithmically, plus one-tap silent mode that stores prior values.

| Bus/event | Level/rule |
|---|---|
| UI ordinary | `-16 dB`; max 4 voices; same event cooldown `60 ms`. |
| Flight engines | `-18 dB` idle to `-10 dB` max acceleration; low-pass while management paused. |
| Mining | `-14 dB`; alternating two pulse samples; max 2 mining voices. |
| Standard weapon | `-11 dB`; 3 variants shuffled without immediate repeat. |
| Impacts | `-10 dB`; 3 variants per shield/armour/hull family. |
| Alerts | `-8 dB`; only one priority alert at a time; critical cooldown `8 s`. |
| Discovery reveal | peak `-6 dB`; unique transient/body/tail layers. |
| Bomb impact/death | peak `-4 dB`; never overlaps another heavy transient at full level within `250 ms`. |
| Ambient loop, when present | `-22 dB` baseline, `-18 dB` frontier, `-24 dB` management. |

Variation: gameplay one-shots randomise pitch deterministically within `±2.5%` and gain within `±1.0 dB`, except alerts, UI confirm/cancel, rare reveal motif, and death, which use fixed pitch. Seeded variation affects presentation only and does not consume gameplay RNG.

Ducking:

- Rare discovery ducks engines, mining, and ambience by `-6 dB`, attack `30 ms`, hold `500 ms`, release `700 ms`.
- Bomb impact or death ducks all non-UI buses by `-8 dB`, attack `20 ms`, hold `250 ms`, release `900 ms`.
- Spoken content does not exist; no voice ducking path is required.
- Pause/management ducks engines and effects `-12 dB` over `120 ms`; existing long tails may finish at the ducked level.

Music layering when an ambient loop is included: calm base is always eligible during flight; frontier texture fades in over `2.0 s` in tiers 2–4; combat percussion fades in over `350 ms` after a hostile has a valid attack solution and fades out `1.5 s` after no hostile solution; discovery harmonic layer plays once and does not retrigger for `8 s`. At most three music layers play. Layer transitions align to the next quarter-note marker if it occurs within `250 ms`, otherwise transition immediately.

Deliberate silence: on confirmed player death, non-death audio reaches `-60 dB` within `120 ms` and remains silent for `400 ms` after the death transient. A rare scan has `60 ms` pre-transient space. Hidden tabs suspend audio immediately; resume requires user gesture only when the browser requires it, with a visible `Tap to resume audio` control. Silent mode produces no Web Audio nodes that emit sound and all information remains visual/textual.
CUT:AUDIO:END -->

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
