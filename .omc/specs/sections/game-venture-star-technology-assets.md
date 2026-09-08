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

Required v0 icon set, each at 32 source units: `ship`, `home`, `planet`, `shipyard`, `market`, `fuel`, `cargo`, `credits`, `ore`, `metal`, `crystal`, `exotic`, `research`, `repair`, `shield`, `armour`, `hull`, `weapon`, `bomb`, `scanner`, `mining`, `influence`, `defence`, `objective`, `timeline`, `pause`, `play`, `settings`, `zoom-in`, `zoom-out`, `center`, `route`, `wrapped-route`, `danger`, `stale-intel`, `unknown`, `discovery`, `filter`, `close`, `back`, `confirm`, `cancel`, `export`, `import`, `record`, and `tutorial`. Existing unused audio-control icons may remain in the approved source-art archive but are not included in runtime atlases or UI.

Map primitives:

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

<!-- CUT:AUDIO:START Archived audio proposal; intentionally excluded from implementation.

### 8.7-A Former audio direction

Audio is restrained, legible, and effects-first. The palette is short electronic pulses, filtered noise, glassy resonances, compact mechanical ticks, and a low-pressure ambient musical bed. It avoids orchestral heroism, harsh constant alarms, retro arcade imitation, voiced dialogue, and sounds recognizably sampled from another game.

Mix targets are measured after decode:

- master integrated output target: `-16 LUFS`, true peak `<=-1 dBTP`;
- ambient music: `-24 to -20 LUFS`, seamless loops `60–120 s`;
- routine effects: `-22 to -16 LUFS`, true peak `<=-3 dBTP`;
- critical UI/death/victory cues: `-18 to -14 LUFS`, true peak `<=-2 dBTP`;
- routine one-shots `<=1.2 s`; reveal/ownership `<=3.0 s`; death/victory `<=4.0 s`;
- no effect contains more than 100 ms of leading silence or 250 ms trailing silence unless declared as a loop tail.

Every informative sound has a simultaneous visual/text equivalent. Silent mode is fully playable. No sound is used as the sole cue for incoming damage, depleted cargo/node, invalid target, rare discovery, low fuel, death, rival action, or successful transaction.

### 8.8 Audio manifest

`assets/audio-manifest.json` is the source of truth. Gameplay refers to stable IDs, never filenames. Its schema is fixed as follows:

| Field | Type and constraint |
|---|---|
| `schemaVersion` | top-level integer, exactly `1` for the first release |
| `entries` | array sorted by unique ASCII `id` |
| `id` | dot-separated lowercase identifier, maximum 64 characters |
| `category` | one of `music`, `ambient`, `effects`, `ui` |
| `sources` | exactly one Ogg Vorbis source and one AAC-LC/M4A source, each with MIME type and subpath-relative path |
| `durationMs` | measured decoded duration, positive integer; paired sources differ by no more than 20 ms |
| `loop` | boolean; true only for declared music/ambient/engine/mining beds |
| `loopStartMs`, `loopEndMs` | required integer sample-aligned bounds when `loop` is true; absent otherwise |
| `gainDb` | integer `-24..6` |
| `maxVoices` | integer `1..24` |
| `cooldownMs` | integer `0..10,000` |
| `priority` | integer `0..100` |
| `usedIn` | non-empty sorted array of mechanic or committed-event IDs |
| `licenseId` | required provenance identifier |
| `sha256` | map containing `ogg` and `m4a`, each exactly 64 lowercase hexadecimal characters computed from the shipped file |

Production validation rejects a missing, extra, malformed, or non-hashed source. Because audio is not generated during specification, hashes are created by the asset integration command from acquired files and then committed with the manifest; this is an execution step, not an unresolved design choice.

Required v0 cue IDs:

| Bucket | IDs | Variants |
|---|---|---:|
| UI | `ui.focus`, `ui.confirm`, `ui.cancel`, `ui.invalid`, `ui.pause`, `ui.resume`, `ui.alert` | 1 each |
| Flight | `sfx.launch`, `sfx.engine.loop`, `sfx.brake`, `sfx.autopilot.engage`, `sfx.autopilot.break`, `sfx.sector.wrap` | engine loop + 1 each |
| Mining/cargo | `sfx.lock.acquire`, `sfx.lock.confirm`, `sfx.lock.break`, `sfx.mining.loop`, `sfx.mining.pulse`, `sfx.cargo.full`, `sfx.node.depleted` | pulse 2 alternating variants; others 1 |
| Trade/refit | `sfx.trade.sell`, `sfx.trade.buy`, `sfx.refuel`, `sfx.repair`, `sfx.equipment.fit` | 1 each |
| Scan/discovery | `sfx.scan.pulse`, `sfx.scan.unknown`, `sfx.discovery.rare`, `sfx.discovery.claim` | scan 2; rare 2; others 1 |
| Combat | `sfx.weapon.pulse`, `sfx.hit.shield`, `sfx.hit.armour`, `sfx.hit.hull`, `sfx.bomb.arm`, `sfx.bomb.launch`, `sfx.bomb.impact`, `sfx.explosion.small`, `sfx.explosion.large`, `sfx.warning.hull` | pulse/hits/small explosion 3; others 1 |
| Strategy | `sfx.influence.tick`, `sfx.planet.acquire`, `sfx.rival.action`, `sfx.objective.complete` | 1 each |
| Terminal | `sfx.death`, `sfx.victory`, `sfx.record.seal` | 1 each, priority 100 |
| Music/ambience | `music.frontier.loop`, `ambience.sector.loop`, `ambience.hazard.asteroids` | 1 loop each |

v0.1 adds `music.contest.loop`, ion-storm ambience, research, role assignment, ship construction, capitulation, federation, and three additional discovery cues. Full target adds `music.resolution.loop`, wormhole transit, artifact family cues, and two regional ambience loops. Total encoded v0 audio budget is `<=6 MiB`; v0.1 `<=10 MiB`; full `<=16 MiB` across both browser source formats.

### 8.9 Audio sourcing and licensing

No audio is generated during specification. Before implementation, each cue is sourced by one of these approved routes:

1. original recording/synthesis owned by the project;
2. commissioned work with written perpetual redistribution rights for source and transformed game assets;
3. CC0 library material;
4. CC BY 4.0 material with creator/title/source URL/licence and modification statement recorded and displayed in `CREDITS.md`.

CC BY-SA, CC BY-NC, CC BY-ND, editorial-only, attribution-unclear, stream-only, AI-service output without documented commercial game redistribution rights, and assets ripped from games or videos are rejected. Purchased libraries require archived invoice/licence text and confirmation that raw standalone redistribution is prevented by packaging where required.

Each provenance entry in `docs/asset-provenance.md` includes stable `licenseId`, asset IDs, original filename, creator, source URL or contract path, acquisition date, original licence text hash, transformations, shipped filenames, and reviewer. `audio:check` fails when an audio ID lacks provenance, attribution, real file hashes, two supported codecs, duration match within 20 ms, or allowed licence.

Production delivery is Ogg Vorbis plus AAC-LC in M4A at 44.1 kHz, stereo music/ambience and mono routine effects unless spatial width is essential. Music uses 128 kbps per format; effects use 80–112 kbps. Source masters are lossless WAV, 24-bit/48 kHz, stored outside the web precache but retained in the project asset archive when licensing permits.
CUT:AUDIO:END -->

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
