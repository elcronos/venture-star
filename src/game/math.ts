import { SCALE, SECTOR_SIZE, type Vec2 } from './types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const wrap = (value: number, size: number): number =>
  ((value % size) + size) % size;

export function wrappedDelta(from: number, to: number, size: number): number {
  const half = size / 2;
  const delta = wrap(to - from + half, size) - half;
  return delta === half ? -half : delta;
}

export function wrappedDistanceSquared(
  a: Vec2,
  b: Vec2,
  width: number,
  height: number,
): number {
  const worldWidth = width * SECTOR_SIZE * SCALE;
  const worldHeight = height * SECTOR_SIZE * SCALE;
  const dx = wrappedDelta(a.x, b.x, worldWidth);
  const dy = wrappedDelta(a.y, b.y, worldHeight);
  return dx * dx + dy * dy;
}

export function wrappedDistance(
  a: Vec2,
  b: Vec2,
  width: number,
  height: number,
): number {
  return Math.sqrt(wrappedDistanceSquared(a, b, width, height));
}

export function frontierTier(
  x: number,
  y: number,
  originX: number,
  originY: number,
  width: number,
  height: number,
): number {
  const dx = Math.abs(wrappedDelta(originX, x, width));
  const dy = Math.abs(wrappedDelta(originY, y, height));
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maximum = Math.sqrt(
    Math.floor(width / 2) ** 2 + Math.floor(height / 2) ** 2,
  );
  return Math.min(4, Math.floor((distance / maximum) * 5));
}

export function sectorCenter(x: number, y: number): Vec2 {
  return {
    x: (x * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
    y: (y * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
  };
}

export const cargoUsed = (cargo: Record<string, number>): number =>
  Object.values(cargo).reduce((sum, quantity) => sum + quantity, 0);
