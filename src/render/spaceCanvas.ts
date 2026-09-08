import type {
  Discovery,
  GameState,
  Hazard,
  Planet,
  ResourceNode,
  Ship,
} from '../game/types';
import { SECTOR_SIZE, SCALE, TICK_MS } from '../game/types';
import { wrap, wrappedDelta } from '../game/math';

const ASSETS = {
  player: new URL('../../assets/svg/ships/player/base.svg', import.meta.url)
    .href,
  playerThrust: new URL(
    '../../assets/svg/ships/player/thrust.svg',
    import.meta.url,
  ).href,
  playerCritical: new URL(
    '../../assets/svg/ships/player/critical.svg',
    import.meta.url,
  ).href,
  rival: new URL('../../assets/svg/ships/rival/f1-idle.svg', import.meta.url)
    .href,
  rivalThrust: new URL(
    '../../assets/svg/ships/rival/f1-thrust.svg',
    import.meta.url,
  ).href,
  planetRocky: new URL(
    '../../assets/svg/world/planet-rocky.svg',
    import.meta.url,
  ).href,
  planetOceanic: new URL(
    '../../assets/svg/world/planet-oceanic.svg',
    import.meta.url,
  ).href,
  planetVerdant: new URL(
    '../../assets/svg/world/planet-verdant.svg',
    import.meta.url,
  ).href,
  planetArid: new URL('../../assets/svg/world/planet-arid.svg', import.meta.url)
    .href,
  planetIce: new URL('../../assets/svg/world/planet-ice.svg', import.meta.url)
    .href,
  ore: new URL('../../assets/svg/world/node-ore-full.svg', import.meta.url)
    .href,
  metal: new URL('../../assets/svg/world/node-metal-full.svg', import.meta.url)
    .href,
  crystal: new URL(
    '../../assets/svg/world/node-crystal-full.svg',
    import.meta.url,
  ).href,
  exotic: new URL(
    '../../assets/svg/world/node-crystal-full.svg',
    import.meta.url,
  ).href,
  discoveryCargo: new URL(
    '../../assets/svg/world/discovery-abandoned-cargo-a-revealed.svg',
    import.meta.url,
  ).href,
  discoveryTreasure: new URL(
    '../../assets/svg/world/discovery-treasure-asteroid-a-revealed.svg',
    import.meta.url,
  ).href,
  hazard: new URL(
    '../../assets/svg/world/asteroid-field-01.svg',
    import.meta.url,
  ).href,
  lock: new URL(
    '../../assets/svg/effects/range-lock-locked.svg',
    import.meta.url,
  ).href,
} as const;

type AssetKey = keyof typeof ASSETS;

export interface SpaceCanvasOptions {
  onWorldTap?: (x: number, y: number) => void;
  onEntityTap?: (id: string) => void;
  reducedMotion?: () => boolean;
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

/** World-space transform of a ship at a single simulation tick. */
interface Transform {
  x: number;
  y: number;
  heading: number;
}

const mod = (value: number, size: number): number =>
  size > 0 ? ((value % size) + size) % size : 0;

/** Seconds for the camera to close ~63% of the gap to the ship. */
const CAMERA_TAU_SECONDS = 0.14;

export class SpaceCanvas {
  readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly images = new Map<AssetKey, HTMLImageElement>();
  private camera: Camera = { x: 0, y: 0, zoom: 0.72 };
  private state: GameState | null = null;
  private previous = new Map<string, Transform>();
  private current = new Map<string, Transform>();
  private stateTime = 0;
  private cameraReady = false;
  private raf = 0;
  private lastTime = 0;
  private frames = 0;
  private drawn: Transform | null = null;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly options: SpaceCanvasOptions;

  constructor(host: HTMLElement, options: SpaceCanvasOptions = {}) {
    this.options = options;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vs-space-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute(
      'aria-label',
      'Tactical space view. Tap a location to engage autopilot.',
    );
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable');
    this.context = context;
    host.append(this.canvas);
    this.loadAssets();
    this.resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => this.resize());
    this.resizeObserver?.observe(host);
    if (!this.resizeObserver) window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('pointerup', (event) => this.handleTap(event));
    this.resize();
  }

  setState(state: GameState): void {
    const sameTick = this.state?.tick === state.tick;
    this.state = state;
    const next = new Map<string, Transform>();
    for (const ship of state.ships)
      next.set(ship.id, {
        x: ship.position.x,
        y: ship.position.y,
        heading: ship.heading,
      });
    // A repeated tick is a re-render of the same instant, not a new one, so it
    // must not consume the interpolation window.
    if (!sameTick) {
      this.previous = this.current;
      this.stateTime = performance.now();
    }
    this.current = next;
    if (!this.previous.size) this.previous = next;
    if (!this.raf) this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  /** Presentation counters: what was actually painted, for smoothness tests. */
  get presentation(): { frames: number; x: number; y: number } {
    return {
      frames: this.frames,
      x: this.drawn?.x ?? 0,
      y: this.drawn?.y ?? 0,
    };
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.resize);
    this.canvas.remove();
  }

  private loadAssets(): void {
    for (const [key, source] of Object.entries(ASSETS) as Array<
      [AssetKey, string]
    >) {
      const image = new Image();
      image.decoding = 'async';
      image.src = source;
      image.addEventListener('load', () => this.draw(performance.now()));
      this.images.set(key, image);
    }
  }

  private readonly resize = (): void => {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw(performance.now());
  };

  private frame(time: number): void {
    this.raf = 0;
    const delta = this.lastTime ? Math.min(time - this.lastTime, 250) : 0;
    this.lastTime = time;
    this.updateCamera(delta / 1000, this.alphaAt(time));
    this.draw(time);
    if (this.state?.running && this.state.outcome === 'active')
      this.raf = requestAnimationFrame((next) => this.frame(next));
    else this.lastTime = 0;
  }

  /** Fraction of the way from the previous simulation tick to the current one. */
  private alphaAt(time: number): number {
    if (!this.previous.size || this.options.reducedMotion?.()) return 1;
    return Math.max(0, Math.min(1, (time - this.stateTime) / TICK_MS));
  }

  private transformAt(id: string, alpha: number): Transform | undefined {
    const to = this.current.get(id);
    if (!to) return undefined;
    const from = this.previous.get(id);
    if (!from || alpha >= 1 || !this.state) return to;
    const worldWidth = this.state.width * SECTOR_SIZE * SCALE;
    const worldHeight = this.state.height * SECTOR_SIZE * SCALE;
    return {
      x: wrap(
        from.x + wrappedDelta(from.x, to.x, worldWidth) * alpha,
        worldWidth,
      ),
      y: wrap(
        from.y + wrappedDelta(from.y, to.y, worldHeight) * alpha,
        worldHeight,
      ),
      heading: wrap(
        from.heading + wrappedDelta(from.heading, to.heading, 65_536) * alpha,
        65_536,
      ),
    };
  }

  private updateCamera(deltaSeconds: number, alpha: number): void {
    if (!this.state) return;
    const player = this.transformAt(this.state.playerShipId, alpha);
    if (!player) return;
    const targetX = player.x / SCALE;
    const targetY = player.y / SCALE;
    // Snapping avoids a long pan across the map on the first frame and on wrap.
    const worldWidth = this.state.width * SECTOR_SIZE;
    const worldHeight = this.state.height * SECTOR_SIZE;
    const dx = wrappedDelta(this.camera.x, targetX, worldWidth);
    const dy = wrappedDelta(this.camera.y, targetY, worldHeight);
    const snap =
      !this.cameraReady ||
      this.options.reducedMotion?.() ||
      deltaSeconds <= 0 ||
      Math.hypot(dx, dy) > SECTOR_SIZE / 2;
    this.cameraReady = true;
    if (snap) {
      this.camera.x = targetX;
      this.camera.y = targetY;
      return;
    }
    const factor = 1 - Math.exp(-deltaSeconds / CAMERA_TAU_SECONDS);
    this.camera.x = wrap(this.camera.x + dx * factor, worldWidth);
    this.camera.y = wrap(this.camera.y + dy * factor, worldHeight);
  }

  private draw(time: number): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    const ctx = this.context;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#091426');
    background.addColorStop(1, '#10233a');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    this.drawStars(width, height);
    if (!this.state) {
      ctx.restore();
      return;
    }

    const alpha = this.alphaAt(time);
    const player = this.transformAt(this.state.playerShipId, alpha);
    this.frames += 1;
    this.drawn = player ?? null;
    const sectorX = player ? Math.floor(player.x / SCALE / SECTOR_SIZE) : 0;
    const sectorY = player ? Math.floor(player.y / SCALE / SECTOR_SIZE) : 0;
    const bodies = this.state.planets.filter(
      (body) => body.sectorX === sectorX && body.sectorY === sectorY,
    );
    const nodes = this.state.nodes.filter(
      (body) => body.sectorX === sectorX && body.sectorY === sectorY,
    );
    const discoveries = this.state.discoveries.filter(
      (body) =>
        body.sectorX === sectorX && body.sectorY === sectorY && !body.claimed,
    );
    const hazards = this.state.hazards.filter(
      (body) => body.sectorX === sectorX && body.sectorY === sectorY,
    );

    ctx.translate(width / 2, height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);
    this.drawGrid(ctx, sectorX, sectorY);
    for (const hazard of hazards) this.drawHazard(ctx, hazard);
    for (const planet of bodies) this.drawPlanet(ctx, planet);
    for (const node of nodes) this.drawNode(ctx, node);
    for (const discovery of discoveries)
      this.drawDiscovery(ctx, discovery, time);
    for (const ship of this.state.ships) {
      if (ship.destroyed) continue;
      const transform = this.transformAt(ship.id, alpha);
      if (!transform) continue;
      if (
        Math.floor(transform.x / SCALE / SECTOR_SIZE) !== sectorX ||
        Math.floor(transform.y / SCALE / SECTOR_SIZE) !== sectorY
      )
        continue;
      this.drawShip(ctx, ship, transform, ship.id === this.state.playerShipId);
    }
    ctx.restore();
  }

  private drawStars(width: number, height: number): void {
    const ctx = this.context;
    for (let index = 0; index < 96; index += 1) {
      // Two depths of parallax turn the starfield into the motion cue that a
      // camera locked to the ship cannot provide on its own.
      const depth = index % 3 === 0 ? 0.06 : 0.16;
      const offsetX = this.camera.x * this.camera.zoom * depth;
      const offsetY = this.camera.y * this.camera.zoom * depth;
      const x = mod(index * 83 + 19 - offsetX, width);
      const y = mod(index * 47 + 31 - offsetY, height);
      const alpha = 0.18 + ((index * 17) % 50) / 100;
      ctx.fillStyle = `rgba(216,234,242,${alpha})`;
      ctx.fillRect(x, y, index % 9 === 0 ? 2 : 1, index % 9 === 0 ? 2 : 1);
    }
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    sectorX: number,
    sectorY: number,
  ): void {
    const originX = sectorX * SECTOR_SIZE;
    const originY = sectorY * SECTOR_SIZE;
    ctx.strokeStyle = 'rgba(45,182,163,0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(originX, originY, SECTOR_SIZE, SECTOR_SIZE);
    ctx.fillStyle = 'rgba(216,234,242,0.38)';
    ctx.font = '600 14px system-ui';
    ctx.fillText(
      `SECTOR ${sectorX + 1}.${sectorY + 1}`,
      originX + 24,
      originY + 32,
    );
  }

  private drawPlanet(ctx: CanvasRenderingContext2D, planet: Planet): void {
    const variants: AssetKey[] = [
      'planetRocky',
      'planetOceanic',
      'planetVerdant',
      'planetArid',
      'planetIce',
    ];
    const hash = this.hash(planet.id);
    const image = this.images.get(
      variants[hash % variants.length] ?? 'planetRocky',
    );
    // Worlds are not all the same size. The scale is derived from the id, so it
    // is stable across frames and sessions, and it never changes hit testing.
    const scale = 0.72 + ((hash >>> 3) % 80) / 100;
    const size = 150 * scale;
    const x = planet.position.x / SCALE;
    const y = planet.position.y / SCALE;
    this.image(ctx, image, x, y, size, size);
    ctx.strokeStyle =
      planet.owner === 'player'
        ? '#2DB6A3'
        : planet.owner
          ? '#EF6A5B'
          : '#A9B8C6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 82 * scale, 0, Math.PI * 2);
    ctx.stroke();
    this.label(ctx, planet.name, x, y + 24 + size / 2);
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: ResourceNode): void {
    const key = node.material as AssetKey;
    this.image(
      ctx,
      this.images.get(key),
      node.position.x / SCALE,
      node.position.y / SCALE,
      76,
      76,
    );
  }

  private drawDiscovery(
    ctx: CanvasRenderingContext2D,
    item: Discovery,
    time: number,
  ): void {
    const size = this.options.reducedMotion?.()
      ? 78
      : 76 + Math.sin(time / 280) * 5;
    const key =
      item.kind === 'abandoned-cargo' ? 'discoveryCargo' : 'discoveryTreasure';
    this.image(
      ctx,
      this.images.get(key),
      item.position.x / SCALE,
      item.position.y / SCALE,
      size,
      size,
    );
  }

  private drawHazard(ctx: CanvasRenderingContext2D, hazard: Hazard): void {
    this.image(
      ctx,
      this.images.get('hazard'),
      hazard.position.x / SCALE,
      hazard.position.y / SCALE,
      190,
      190,
      0.72,
    );
  }

  private drawShip(
    ctx: CanvasRenderingContext2D,
    ship: Ship,
    transform: Transform,
    player: boolean,
  ): void {
    const moving = Math.abs(ship.velocity.x) + Math.abs(ship.velocity.y) > 1000;
    const key: AssetKey = player
      ? ship.hull < 25
        ? 'playerCritical'
        : moving
          ? 'playerThrust'
          : 'player'
      : moving
        ? 'rivalThrust'
        : 'rival';
    const x = transform.x / SCALE;
    const y = transform.y / SCALE;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((transform.heading / 65536) * Math.PI * 2 + Math.PI / 2);
    this.image(
      ctx,
      this.images.get(key),
      0,
      0,
      player ? 82 : 72,
      player ? 82 : 72,
    );
    ctx.restore();
    if (ship.selectedTargetId)
      this.image(ctx, this.images.get('lock'), x, y, 110, 110);
  }

  private image(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha = 1,
  ): void {
    if (!image?.complete || !image.naturalWidth) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
    ctx.restore();
  }

  private label(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
  ): void {
    ctx.font = '700 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D8EAF2';
    ctx.strokeStyle = '#091426';
    ctx.lineWidth = 5;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  private handleTap(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x =
      this.camera.x +
      (event.clientX - rect.left - rect.width / 2) / this.camera.zoom;
    const y =
      this.camera.y +
      (event.clientY - rect.top - rect.height / 2) / this.camera.zoom;
    if (this.state) {
      const entities = [
        ...this.state.planets,
        ...this.state.nodes.filter((item) => item.remaining > 0),
        ...this.state.discoveries.filter((item) => !item.claimed),
        ...this.state.ships.filter(
          (item) => !item.destroyed && item.id !== this.state?.playerShipId,
        ),
      ];
      const nearest = entities
        .map((entity) => ({
          entity,
          distance: Math.hypot(
            entity.position.x / SCALE - x,
            entity.position.y / SCALE - y,
          ),
        }))
        .filter((candidate) => candidate.distance <= 72 / this.camera.zoom)
        .sort(
          (a, b) =>
            a.distance - b.distance || a.entity.id.localeCompare(b.entity.id),
        )[0];
      if (nearest) {
        this.options.onEntityTap?.(nearest.entity.id);
        return;
      }
    }
    this.options.onWorldTap?.(Math.round(x * SCALE), Math.round(y * SCALE));
  }

  private hash(value: string): number {
    let hash = 0;
    for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return hash;
  }
}
