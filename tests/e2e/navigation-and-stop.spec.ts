import { expect, test } from '@playwright/test';
import { startCampaignFromHome } from './helpers';

async function launch(page: import('@playwright/test').Page): Promise<void> {
  await startCampaignFromHome(page);
  await page
    .getByRole('button', { name: 'Launch', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible();
}

function shipSpeed(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return Math.hypot(ship.velocity.x, ship.velocity.y);
  });
}

test('T-M04-007: All stop cancels autopilot and brings a cruising ship to rest', async ({
  page,
}) => {
  await launch(page);

  // Autopilot to a distant point, so the ship is both moving and self-steering.
  await page.evaluate(() => {
    document
      .querySelector<HTMLCanvasElement>('canvas.vs-space-canvas')!
      .dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          clientX: window.innerWidth / 2 + 140,
          clientY: window.innerHeight / 2 + 140,
        }),
      );
  });
  await expect.poll(() => shipSpeed(page)).toBeGreaterThan(0);
  await expect(page.locator('.vs-autopilot')).toBeVisible();

  await page.getByRole('button', { name: 'All stop' }).click();

  await expect.poll(() => shipSpeed(page), { timeout: 15_000 }).toBe(0);
  expect(
    await page.evaluate(() => {
      const state = window.__GAME__!.state!;
      const ship = state.ships.find(
        (candidate) => candidate.id === state.playerShipId,
      )!;
      return ship.throttleBasisPoints;
    }),
  ).toBeLessThanOrEqual(0);
});

test('T-M04-007b: thrust after an all stop returns control to the pilot', async ({
  page,
}) => {
  await launch(page);
  await page.keyboard.down('w');
  await expect.poll(() => shipSpeed(page)).toBeGreaterThan(0);
  await page.keyboard.up('w');

  await page.getByRole('button', { name: 'All stop' }).click();
  await expect.poll(() => shipSpeed(page), { timeout: 15_000 }).toBe(0);

  await page.keyboard.down('w');
  await expect.poll(() => shipSpeed(page)).toBeGreaterThan(0);
  await page.keyboard.up('w');
});

test('UX-T-076: the minimap reports the ship sector, charted fog, and live position', async ({
  page,
}) => {
  await launch(page);
  const minimap = page.getByLabel('Sector minimap');
  await expect(minimap).toBeVisible();

  // Hold the simulation still so the static assertions cannot race the ship
  // across a sector boundary; motion is exercised at the end of the test.
  await page.evaluate(() => window.__GAME__!.setPaused(true));
  const sector = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return {
      x: Math.floor(ship.position.x / 1_000 / 1_024),
      y: Math.floor(ship.position.y / 1_000 / 1_024),
      width: state.width,
      height: state.height,
    };
  });

  // One cell per sector, with the occupied one marked, and a text equivalent.
  expect(await minimap.locator('.vs-minimap__cell').count()).toBe(
    sector.width * sector.height,
  );
  const outline = minimap.locator('.vs-minimap__sector');
  expect(await outline.count()).toBe(1);
  // Read the outline and the ship in one evaluation: sampling them separately
  // would race the ship crossing a sector boundary between the two reads.
  expect(
    await page.evaluate(() => {
      const state = window.__GAME__!.state!;
      const ship = state.ships.find(
        (candidate) => candidate.id === state.playerShipId,
      )!;
      const node = document.querySelector<HTMLElement>('.vs-minimap__sector')!;
      const painted = getComputedStyle(node)
        .getPropertyValue('--minimap-sector-x')
        .trim();
      const expected = (
        Math.floor(ship.position.x / 1_000 / 1_024) / state.width
      ).toFixed(5);
      return painted === expected;
    }),
  ).toBe(true);
  await expect(minimap.locator('.vs-minimap__readout')).toContainText(
    `Sector ${sector.x + 1}.${sector.y + 1} of ${sector.width} by ${sector.height}`,
  );
  expect(
    await minimap.locator('.vs-minimap__cell.is-unknown').count(),
  ).toBeGreaterThan(0);

  const markerAt = () =>
    page.evaluate(() => {
      const node = document.querySelector<HTMLElement>('.vs-minimap')!;
      return [
        node.style.getPropertyValue('--minimap-x'),
        node.style.getPropertyValue('--minimap-y'),
      ].join(',');
    });
  const before = await markerAt();
  await page.evaluate(() => window.__GAME__!.setPaused(false));
  await page.keyboard.down('w');
  await expect.poll(markerAt, { timeout: 10_000 }).not.toBe(before);
  await page.keyboard.up('w');
});

test('T-M04-006b: the canvas paints interpolated positions between simulation ticks', async ({
  page,
}) => {
  await launch(page);
  await page.keyboard.down('w');

  // Sample every animation frame for a window that spans several 50 ms ticks.
  const sample = await page.evaluate(
    () =>
      new Promise<{ frames: number; positions: number; ticks: number }>(
        (resolve) => {
          const startTick = window.__GAME__!.state!.tick;
          const start = window.__GAME__!.presentation().frames;
          const positions = new Set<string>();
          const deadline = performance.now() + 600;
          const step = () => {
            const painted = window.__GAME__!.presentation();
            positions.add(`${painted.x},${painted.y}`);
            if (performance.now() < deadline) {
              requestAnimationFrame(step);
              return;
            }
            resolve({
              frames: painted.frames - start,
              positions: positions.size,
              ticks: window.__GAME__!.state!.tick - startTick,
            });
          };
          requestAnimationFrame(step);
        },
      ),
  );
  await page.keyboard.up('w');

  // 600 ms is ~12 ticks at 20 Hz. Painting more distinct positions than there
  // were ticks is only possible if frames interpolate between them.
  expect(sample.ticks).toBeGreaterThan(4);
  expect(sample.frames).toBeGreaterThan(sample.ticks);
  expect(sample.positions).toBeGreaterThan(sample.ticks);
});
