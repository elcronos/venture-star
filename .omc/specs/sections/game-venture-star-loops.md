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
