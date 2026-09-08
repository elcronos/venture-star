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
4. **Navigation:** sector coordinates, danger band, route next step, wrap indicator, route fuel forecast.
5. **Economy:** cargo used/capacity, credits, carried material totals.
6. **Strategy:** current objective, planet-count progress, research/production summary, noncritical alerts.

Bars include numeric values when focused, in critical state, or `Show HUD numbers` is enabled; the default always shows `fuel current/max`, `cargo used/max`, and bomb count numerically. Shield/armour/hull use distinct icons and line treatments. Health order remains shield over armour over hull in every layout. Critical hull (`<25%`) uses the word `CRITICAL`, triangular warning icon, and optional pulse; reduced motion replaces pulse with a static double border.

Fuel turns warning at forecasted home margin `<15 FU` and displays `LOW FUEL`; emergency displays `EMERGENCY DRIFT — weapons and mining offline`. Cargo full displays `FULL` and names the blocked activity. Autopilot status is one of `Plotting`, `Travelling`, `Approaching`, `Arrived`, or `Interrupted: <reason>` and is never communicated only by a route-line colour.

The selected target card shows name/type, relation/faction pattern, distance in `wu`, health layers if known, interaction range state, and up to three legal actions. Unknown values display `Unknown`, not zero. Dynamic intel carries `LIVE`, `RECENT`, `STALE`, or `UNKNOWN` text and timestamp/age; static geography is not mislabeled stale.

HUD opacity never drops below `85%` behind text. Text contrast is `≥4.5:1` normal and `≥3:1` at `≥24 px` or `≥19 px bold`; non-text controls/essential graphics are `≥3:1`. Canvas scenery behind HUD receives a stable scrim to preserve contrast.

Acceptance: `UX-T-070` priority collapse matrix; `UX-T-071` health/fuel/cargo numeric semantics; `UX-T-072` critical reduced-motion substitute; `UX-T-073` autopilot reason copy; `UX-T-074` unknown versus zero; `UX-T-075` HUD contrast under brightest/darkest scene.

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
