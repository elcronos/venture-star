import { expect, test } from "@playwright/test";
import { TEST_SEED, startCampaignFromHome, tick, waitForGameHook } from "./helpers";

test("T-E2E-V0-001: home setup pins the campaign seed and launches the real dock screen", async ({ page }) => {
  await page.goto("/");
  await waitForGameHook(page);

  await expect(page.getByRole("heading", { name: "New campaign" })).toBeVisible();
  await page.getByLabel("Seed").fill(TEST_SEED);
  await page.getByLabel("Galaxy width").selectOption("10");
  await page.getByLabel("Galaxy height").selectOption("10");
  await page.getByLabel("Rivals").selectOption("1");
  await page.getByLabel("Difficulty").selectOption("Captain");
  await page.getByRole("button", { name: "Launch campaign" }).click();

  await expect(page.getByRole("heading", { name: "Hearthlight" })).toBeVisible();
  await expect(page.getByText("player world · PAUSED")).toBeVisible();
  const state = await page.evaluate(() => window.__GAME__!.state!);
  expect(state.seed).toBe(TEST_SEED);
  expect(state.running).toBe(false);
  expect(state.ships.find((ship) => ship.id === state.playerShipId)!.dockedPlanetId).toBe("planet-000");
});

test("LOOP-PAUSE-001: launch, pause, and resume do not advance simulation while paused", async ({ page }) => {
  await startCampaignFromHome(page);
  await page.getByRole("button", { name: "Launch", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Flight — Venture Star" })).toBeVisible();

  const pauseButton = page.getByRole("button", { name: "Pause", exact: true });
  const pauseBox = await pauseButton.boundingBox();
  const viewport = page.viewportSize();
  expect(pauseBox, "Pause must have a rendered hit target").not.toBeNull();
  expect(pauseBox!.x).toBeGreaterThanOrEqual(0);
  expect(pauseBox!.y).toBeGreaterThanOrEqual(0);
  expect(pauseBox!.x + pauseBox!.width).toBeLessThanOrEqual(viewport!.width);
  expect(pauseBox!.y + pauseBox!.height).toBeLessThanOrEqual(viewport!.height);
  await pauseButton.click();
  await expect(page.getByRole("heading", { name: "Paused" })).toBeVisible();
  const pausedAt = await page.evaluate(() => window.__GAME__!.state!.tick);
  await tick(page, 120);
  expect(await page.evaluate(() => window.__GAME__!.state!.tick)).toBe(pausedAt);

  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.evaluate(() => window.__GAME__!.input({ type: "pause", paused: true }));
  await tick(page, 1);
  expect(await page.evaluate(() => window.__GAME__!.state!.running)).toBe(false);
  await expect(page.getByRole("heading", { name: "Flight — Venture Star" })).toBeVisible();
});

test("Galaxy map navigation is paused, wrap-aware, and starts a route through the UI", async ({ page }) => {
  await startCampaignFromHome(page);
  await page.getByRole("button", { name: "Launch", exact: true }).first().click();
  await page.keyboard.press("g");

  await expect(page.getByRole("heading", { name: "Galaxy" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "Galaxy map, 10 by 10 sectors" })).toBeVisible();
  expect(await page.evaluate(() => window.__GAME__!.state!.running)).toBe(false);

  const firstCell = page.locator('.vs-galaxy-cell[data-x="0"][data-y="0"]');
  await firstCell.click();
  await expect(page.getByRole("heading", { name: "Route forecast" })).toBeVisible();
  await expect(page.getByText("Emergency drift remains available")).toBeVisible();
  await page.getByRole("button", { name: "Start autopilot" }).click();
  await expect(page.getByRole("heading", { name: "Flight — Venture Star" })).toBeVisible();
  // The status line names the autopilot phase, not just the destination.
  await expect(page.getByText(/^(Travelling|Braking): sector 1,1$/)).toBeVisible();
});
