import { expect, test } from '@playwright/test';
import { startCampaignFromHome } from './helpers';

test('UX-T-053: typing setup controls never steers or opens the map', async ({
  page,
}) => {
  await page.goto('/');
  const seed = page.getByLabel('Seed');
  await seed.fill('');
  await seed.pressSequentially('wasdmg');
  await expect(seed).toHaveValue('wasdmg');
  await expect(
    page.getByRole('button', { name: 'Launch campaign' }),
  ).toBeVisible();
  await expect(page.locator('.vs-galaxy')).toHaveCount(0);
});

test('T-F-01: first frame centers the ship and held controls keep the world live', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  await page
    .getByRole('button', { name: 'Launch', exact: true })
    .first()
    .click();
  const canvas = page.locator('.vs-space-canvas');
  await expect.poll(() => canvas.getAttribute('data-camera-x')).not.toBeNull();
  const initial = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    return state.ships.find((ship) => ship.id === state.playerShipId)!.position;
  });
  expect(
    Math.abs(
      Number(await canvas.getAttribute('data-camera-x')) - initial.x / 1000,
    ),
  ).toBeLessThan(2);
  expect(
    Math.abs(
      Number(await canvas.getAttribute('data-camera-y')) - initial.y / 1000,
    ),
  ).toBeLessThan(2);
  await canvas.focus();
  await page.keyboard.down('w');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-render-tick')))
    .toBeGreaterThan(30);
  const first = Number(await canvas.getAttribute('data-render-tick'));
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-render-tick')))
    .toBeGreaterThan(first + 20);
  await page.keyboard.up('w');
  const moved = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    return state.ships.find((ship) => ship.id === state.playerShipId)!.position;
  });
  expect(Math.hypot(moved.x - initial.x, moved.y - initial.y)).toBeGreaterThan(
    100_000,
  );
  await page.screenshot({
    path: `test-results/flight-${test.info().project.name}.png`,
  });
});

test('T-M06-005: displayed autopilot arrives stopped at opening ore and mining works', async ({
  page,
}) => {
  test.setTimeout(40_000);
  await startCampaignFromHome(page);
  await page
    .getByRole('button', { name: 'Launch', exact: true })
    .first()
    .click();
  const ore = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find((item) => item.id === state.playerShipId)!;
    return state.nodes
      .filter((item) => item.material === 'ore')
      .sort(
        (a, b) =>
          Math.hypot(
            a.position.x - ship.position.x,
            a.position.y - ship.position.y,
          ) -
          Math.hypot(
            b.position.x - ship.position.x,
            b.position.y - ship.position.y,
          ),
      )[0]!.id;
  });
  const routeControl = page
    .locator('.vs-sr-contacts li')
    .filter({ hasText: 'ore deposit' })
    .first()
    .getByRole('button', { name: 'Autopilot', exact: true });
  await routeControl.focus();
  await routeControl.press('Enter');
  await expect
    .poll(
      async () =>
        page.evaluate((id) => {
          const state = window.__GAME__!.state!;
          const ship = state.ships.find(
            (item) => item.id === state.playerShipId,
          )!;
          const node = state.nodes.find((item) => item.id === id)!;
          return (
            Math.hypot(
              ship.position.x - node.position.x,
              ship.position.y - node.position.y,
            ) <= 84_000 && Math.hypot(ship.velocity.x, ship.velocity.y) <= 2_000
          );
        }, ore),
      { timeout: 20_000 },
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Mine', exact: true }).click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const state = window.__GAME__!.state!;
          return state.ships.find((item) => item.id === state.playerShipId)!
            .cargo.ore;
        }),
      { timeout: 6_000 },
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    path: `test-results/mining-${test.info().project.name}.png`,
  });
});
