# Venture Star — Design Interview Record

Status: Interview complete. Awaiting adversarial critique.

## Product goal

Create an original, offline-first HTML5 spiritual successor to Synthetic Reality's *Warpath: 21st Century*. It must run without a server, be deployable to GitHub Pages, support desktop and mobile screens, and use clean minimal 2D SVG science-fiction graphics.

Competitive delta: a streamlined single-player space 4X with faster sessions, smarter rule-abiding AI, touch-first controls, local saves, and a procedural galaxy designed around one directly piloted ship.

Working title: **Venture Star**.

## Core fantasy and loop

The player pilots one flagship in real time. They explore an unknown procedural galaxy, discover planets and opportunities, hold position near resource nodes to mine automatically, sell cargo at local markets, research technology, buy and fit equipment, influence or conquer planets, and expand farther from their origin for greater danger and rewards.

Standard weapons automatically attack a selected hostile target. The player manually activates bombs and other special weapons. Special weapons are purchased consumables with limited ammunition.

The player never commands a fleet. Friendly shipyards repair and refit the flagship and produce equipment, consumables, and orbital defences, but no player patrol ships.

## Galaxy and exploration

- Procedurally generated toroidal grid; crossing one edge wraps to the opposite edge.
- User-selectable rectangular dimensions from `10x10` through `30x30`.
- Each grid coordinate is a real-time sector in which the flagship flies freely.
- Crossing a sector boundary enters the adjacent wrapped sector.
- Strategic galaxy map shows discovered cells and supports tap-to-autopilot routing.
- Danger and rewards primarily scale with shortest wrapped distance from the origin, with smaller procedural regional modifiers.
- Danger tiers are communicated before sector entry when sensor intelligence permits.
- Unexplored cells remain hidden.
- Once discovered, terrain and planet locations remain mapped.
- Mobile ships and current ownership require live sensor coverage or recent intelligence; friendly planets extend coverage.
- Content includes planets, mineable nodes, asteroid fields, ion storms, derelicts, wormholes, anomalies, treasure asteroids, abandoned cargo, ancient technology, rich resource veins, rescue opportunities, hidden markets, and unique artifacts.
- Rare positive discoveries receive distinctive scan signals and reveal feedback. Procedural generation must offer exciting rewards, not merely hazards.
- Seeds are reproducible. After a run ends, the player may replay its seed or generate a new galaxy.

## Movement, controls, and interaction

- Desktop uses fixed keyboard steering (`WASD` and arrows), target-selection controls, and special-weapon hotkeys. Controls are documented but not remappable.
- Mobile uses a left virtual joystick, throttle/speed control, tap target selection, large special-weapon buttons, and tap-driven contextual interactions.
- Tapping a destination engages autopilot. Autopilot navigates and stops within interaction range; hostile contact may interrupt it.
- Trading, upgrades, planet management, strategic overview, and other full-screen interfaces pause the simulation.
- Pause is available at any time.
- Normal cruising consumes negligible fuel. Acceleration consumes fuel at a rate that increases with speed.
- Friendly planets refuel cheaply; neutral access is more expensive when permitted.
- Fuel tank equipment changes range. Rare fuel deposits can occur in dangerous regions.
- An emergency reserve prevents soft-locks by permitting slow return travel while disabling combat and mining.
- AI exploration ships obey the same fuel model.

## Economy, mining, and equipment

Four material categories provide distinct uses: common trade ore, structural metal for defence, energy crystals for weapons and shields, and rare exotic material for advanced technology. Fuel is a separate operational consumable.

Mining occurs automatically while the ship remains within range of a resource node. Progression can improve extraction speed, cargo capacity, efficiency, and access to rare deposits.

Planetary market prices adapt gradually to supply, demand, danger, faction control, relations, and player trading. Known prices can become stale without sensor coverage. The economy should create useful hauling decisions without requiring spreadsheet-level micromanagement.

Ship progression is hybrid:

- Empire-wide research levels unlock new equipment and abilities.
- Limited equipment slots create loadout trade-offs among mining, cargo, diplomacy, defence, weapons, sensors, and fuel range.
- Core capabilities may receive smaller permanent within-run improvements.
- Equipment can be bought, sold, and swapped only while docked at a friendly or conquered planet.
- Research unlocks possibilities; markets, wealth, and slots determine what is currently fitted.

Every new campaign starts on equal footing. Persistent rewards are limited to achievements, discovery records, statistics, and cosmetic ship silhouettes.

## Planets, diplomacy, and conquest

The player can acquire planets through either strategic influence or military conquest.

Peaceful conversion uses system-driven actions rather than dialogue trees: trade contracts, development aid, diplomatic broadcasts, trust, and competing faction influence.

Military conquest uses consumable bombardment weapons to break planetary shields and defences. Bombardment can damage valuable infrastructure. Force is faster but yields a weaker, repair-dependent planet; peaceful conversion preserves its economy.

Acquired planets develop automatically after the player assigns a role such as mining world, fortress, research hub, or shipyard. Underlying development tracks are economy, mining, defence, research, and shipyard capacity. Planets have limited capacity and specialize rather than becoming perfect at everything.

The full galaxy simulation continues while the player travels: planets produce resources, conduct research, construct ships, defend themselves, and fight. Major events generate concise alerts and appear in a campaign timeline.

## AI factions

- Setup allows 1–3 AI factions, with a recommended count based on map area and well-separated origins.
- AI factions own planets and operate exploration ships.
- AI factions explore, mine, trade, influence, research, conquer, negotiate, and fight one another independently.
- Borders and ownership may change without player involvement.
- Destroyed AI exploration ships can be reconstructed by shipyard planets using visible resources, costs, and build time.
- AI follows the same economic, construction, fuel, sensor, and combat rules as the player.
- Three difficulty presets: Explorer, Captain, and Strategist.
- Presets adjust aggression, economic efficiency, targeting competence, strategic planning, and danger scaling without hidden rule-breaking advantages.

## Win, loss, duration, and records

Victory requires the player to control every planet in the galaxy.

Flagship destruction causes immediate permanent defeat. The campaign save becomes sealed and cannot continue, but remains available as a read-only record containing its final galaxy map, timeline, discoveries, and statistics.

A `10x10` campaign targets approximately 45–75 minutes. Larger maps scale upward. Campaigns automatically save locally and can be resumed across sessions.

Save files can be exported and imported as JSON. Schema validation and a checksum detect corruption and casual modification, but the UI must not claim cryptographic tamper-proofing in a public client-only application.

## Art, setting, audio, and feedback

- Setting tone: hopeful frontier exploration with principled rivalry.
- Visual style: clean minimal vector science fiction.
- Graphics: original 2D SVG assets with crisp silhouettes, restrained effects, high contrast, and phone-readable detail.
- Audio: subtle ambient music and concise electronic effects.
- Separate music and effects volume controls plus one-tap silent mode.
- Rare discoveries need memorable audiovisual reveals.
- Exact palette, animation timings, camera behavior, hit feedback, audio sources, and asset inventory remain to be locked in the heavy specification.

## UX and accessibility

- Responsive desktop and mobile layouts.
- Scalable interface text.
- Colourblind-safe faction patterns in addition to colour.
- Reduced-motion mode.
- Optional screen shake.
- Pause-anytime behavior.
- Touch-first interaction targets and contextual menus.
- Fixed, non-remappable keyboard controls.
- Optional non-blocking contextual tutorial covering flight, mining, trade, upgrades, diplomacy, and conquest; it can be disabled immediately.

## Technology constraints

- Static HTML5 application with no runtime server dependency.
- Must deploy under a GitHub Pages project subpath.
- All core play remains functional offline after assets are loaded.
- Local persistence only; no accounts, multiplayer server, analytics requirement, or cloud database.
- Technology stack, rendering architecture, deterministic simulation approach, browser support floor, and build commands will be selected in the heavy specification.

## Explicit exclusions and unresolved specification work

Explicitly excluded so far: online multiplayer, dialogue-tree diplomacy, player-controlled fleets, permanent power upgrades between campaigns, server accounts, cloud saves, and remappable keyboard bindings.

The critique and heavy-spec phases must resolve numeric balance, precise combat formulas, faction personalities, sector population rules, planet counts, autopilot pathfinding and interruption cases, AI update budgets, economic formulas, research tree contents, equipment inventory, artifact effects, discovery frequency, UI screen flow, tutorial triggers, browser performance budgets, SVG asset list, audio sourcing/licensing, test hooks, and GitHub Pages deployment details.
