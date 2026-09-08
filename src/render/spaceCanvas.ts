import type {
  Discovery,
  GameState,
  Hazard,
  Planet,
  ResourceNode,
  Ship,
} from '../game/types';
import { SECTOR_SIZE, SCALE } from '../game/types';

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

export class SpaceCanvas {
  readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly images = new Map<AssetKey, HTMLImageElement>();
  private camera: Camera = { x: 0, y: 0, zoom: 0.72 };
  private state: GameState | null = null;
  private raf = 0;
  private lastTime = 0;
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
    this.state = state;
    const player = state.ships.find((ship) => ship.id === state.playerShipId);
    if (player) {
      const smoothing = this.options.reducedMotion?.() ? 1 : 0.13;
      this.camera.x += (player.position.x / SCALE - this.camera.x) * smoothing;
      this.camera.y += (player.position.y / SCALE - this.camera.y) * smoothing;
    }
    if (!this.raf) this.raf = requestAnimationFrame((time) => this.frame(time));
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
    this.draw(time);
    if (this.state?.running && this.state.outcome === 'active') {
      this.lastTime = time;
      this.raf = requestAnimationFrame((next) => this.frame(next));
    }
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

    const player = this.state.ships.find(
      (ship) => ship.id === this.state?.playerShipId,
    );
    const sectorX = player
      ? Math.floor(player.position.x / SCALE / SECTOR_SIZE)
      : 0;
    const sectorY = player
      ? Math.floor(player.position.y / SCALE / SECTOR_SIZE)
      : 0;
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
      if (
        Math.floor(ship.position.x / SCALE / SECTOR_SIZE) !== sectorX ||
        Math.floor(ship.position.y / SCALE / SECTOR_SIZE) !== sectorY
      )
        continue;
      this.drawShip(ctx, ship, ship.id === this.state.playerShipId);
    }
    ctx.restore();
  }

  private drawStars(width: number, height: number): void {
    const ctx = this.context;
    for (let index = 0; index < 96; index += 1) {
      const x = (index * 83 + 19) % width;
      const y = (index * 47 + 31) % height;
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
    const image = this.images.get(
      variants[this.hash(planet.id) % variants.length] ?? 'planetRocky',
    );
    const x = planet.position.x / SCALE;
    const y = planet.position.y / SCALE;
    this.image(ctx, image, x, y, 150, 150);
    ctx.strokeStyle =
      planet.owner === 'player'
        ? '#2DB6A3'
        : planet.owner
          ? '#EF6A5B'
          : '#A9B8C6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 82, 0, Math.PI * 2);
    ctx.stroke();
    this.label(ctx, planet.name, x, y + 106);
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
    const x = ship.position.x / SCALE;
    const y = ship.position.y / SCALE;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((ship.heading / 65536) * Math.PI * 2 + Math.PI / 2);
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
