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
