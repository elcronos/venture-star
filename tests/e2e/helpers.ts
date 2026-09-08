import { expect, type Page } from "@playwright/test";

export const TEST_SEED = "0000000000000000";

export async function waitForGameHook(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean(window.__GAME__));
}

export async function startCampaignFromHome(page: Page, seed = TEST_SEED): Promise<void> {
  await page.goto("/");
  await waitForGameHook(page);
  await page.getByLabel("Seed").fill(seed);
  await page.getByLabel("Galaxy width").selectOption("10");
  await page.getByLabel("Galaxy height").selectOption("10");
  await page.getByLabel("Rivals").selectOption("1");
  await page.getByLabel("Difficulty").selectOption("Captain");
  await page.getByRole("button", { name: "Launch campaign" }).click();
  await expect(page.getByRole("heading", { name: "Hearthlight" })).toBeVisible();
}

export async function tick(page: Page, count: number): Promise<void> {
  await page.evaluate((ticks) => { window.__GAME__!.tick(ticks); }, count);
}

/**
 * Fly the production simulation to a generated entity without mutating state.
 * Steering, thrust and braking all enter through the dev-only command hook and
 * every advance is one fixed 50 ms simulation tick.
 */
export async function flyToEntity(page: Page, entityId: string): Promise<void> {
  await page.evaluate((targetId) => {
    const game = window.__GAME__!;
    const SCALE = 1_000;
    const SECTOR = 1_024 * SCALE;
    const wrapDelta = (from: number, to: number, size: number) => {
      let delta = to - from;
      if (delta > size / 2) delta -= size;
      if (delta < -size / 2) delta += size;
      return delta;
    };
    const signedHeadingDelta = (from: number, to: number) => ((to - from + 98_304) % 65_536) - 32_768;

    for (let attempts = 0; attempts < 4_000; attempts++) {
      const state = game.state!;
      const ship = state.ships.find((candidate) => candidate.id === state.playerShipId)!;
      const target = [...state.planets, ...state.nodes, ...state.discoveries, ...state.ships]
        .find((candidate) => candidate.id === targetId)!;
      const dx = wrapDelta(ship.position.x, target.position.x, state.width * SECTOR);
      const dy = wrapDelta(ship.position.y, target.position.y, state.height * SECTOR);
      const distance = Math.hypot(dx, dy) / SCALE;
      const speed = Math.hypot(ship.velocity.x, ship.velocity.y) / SCALE;
      if (distance <= 70 && speed <= 8) return;

      const desired = ((Math.round(Math.atan2(dy, dx) / (Math.PI * 2) * 65_536) % 65_536) + 65_536) % 65_536;
      const headingError = signedHeadingDelta(ship.heading, desired);
      const stoppingDistance = speed * speed / 300;
      const shouldBrake = distance < stoppingDistance + 48;
      const turn = Math.abs(headingError) <= 350 ? 0 : headingError < 0 ? -1 : 1;
      const throttle = shouldBrake ? 0 : Math.abs(headingError) > 1_400 ? 0 : distance > 240 ? 0.65 : 0.25;
      game.input({ type: "flight", throttle, turn, ...(shouldBrake ? { brake: true } : {}) });
      game.tick(1);
    }
    throw new Error(`Failed to reach ${targetId} within deterministic tick budget`);
  }, entityId);
}
