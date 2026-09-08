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

test('T-M04-007: Full stop cancels autopilot and brings a cruising ship to rest', async ({
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

  await page.getByRole('button', { name: 'Full stop' }).click();

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

test('T-M04-007b: thrust after a full stop returns control to the pilot', async ({
  page,
}) => {
  await launch(page);
  await page.keyboard.down('w');
  await expect.poll(() => shipSpeed(page)).toBeGreaterThan(0);
  await page.keyboard.up('w');

  await page.getByRole('button', { name: 'Full stop' }).click();
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

test('T-M06-002: autopilot brakes to an interaction standoff so docking is legal', async ({
  page,
}) => {
  await launch(page);
  const home = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const planet = state.planets.find((item) => item.owner === 'player')!;
    return { id: planet.id, name: planet.name };
  });

  const approach = () =>
    page.evaluate(() => {
      const state = window.__GAME__!.state!;
      const ship = state.ships.find(
        (candidate) => candidate.id === state.playerShipId,
      )!;
      const planet = state.planets.find((item) => item.owner === 'player')!;
      return {
        distance:
          Math.hypot(
            ship.position.x - planet.position.x,
            ship.position.y - planet.position.y,
          ) / 1_000,
        speed: Math.hypot(ship.velocity.x, ship.velocity.y) / 1_000,
      };
    });

  // The ship launches outside docking range, so an approach is required.
  expect((await approach()).distance).toBeGreaterThan(96);

  await page.evaluate((id) => {
    window.__GAME__!.autopilotTo(id);
  }, home.id);
  await expect(page.locator('.vs-autopilot')).toBeVisible();

  // Autopilot must end the approach itself: dock refuses beyond 96 wu
  // separation or above 20 wu/s, and coasting alone sheds only 8 wu/s².
  await expect
    .poll(
      async () => {
        const { distance, speed } = await approach();
        return distance <= 96 && speed <= 20;
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  await expect(page.locator('.vs-autopilot')).toHaveCount(0);

  // And the dock actually succeeds from where autopilot left the ship.
  await page.evaluate((id) => {
    window.__GAME__!.input({ type: 'dock', planetId: id });
    window.__GAME__!.tick(1);
  }, home.id);
  expect(
    await page.evaluate(() => {
      const state = window.__GAME__!.state!;
      return state.ships.find(
        (candidate) => candidate.id === state.playerShipId,
      )!.dockedPlanetId;
    }),
  ).toBe(home.id);
});

test('T-M08-001: autopilot to a resource node leaves the ship able to mine', async ({
  page,
}) => {
  await launch(page);
  const node = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    // The opening loop guarantees a node in the home sector.
    const nearest = state.nodes
      .filter((item) => item.remaining > 0)
      .map((item) => ({
        id: item.id,
        distance: Math.hypot(
          item.position.x - ship.position.x,
          item.position.y - ship.position.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0]!;
    return nearest.id;
  });

  await page.evaluate((id) => {
    window.__GAME__!.autopilotTo(id);
  }, node);

  // A mining lock is the tightest gate in the game: 96 wu and 8 wu/s.
  await expect
    .poll(
      () =>
        page.evaluate((id) => {
          const state = window.__GAME__!.state!;
          const ship = state.ships.find(
            (candidate) => candidate.id === state.playerShipId,
          )!;
          const target = state.nodes.find((item) => item.id === id)!;
          const distance =
            Math.hypot(
              ship.position.x - target.position.x,
              ship.position.y - target.position.y,
            ) / 1_000;
          const speed =
            Math.hypot(ship.velocity.x, ship.velocity.y) / 1_000;
          return distance <= 96 && speed <= 8;
        }, node),
      { timeout: 20_000 },
    )
    .toBe(true);

  // The Mine action is offered without a blocking reason, and it works.
  const mine = page
    .getByRole('navigation', { name: 'Context actions' })
    .getByRole('button', { name: 'Mine', exact: true });
  await expect(mine).toBeEnabled();
  await mine.click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = window.__GAME__!.state!;
        return state.ships.find(
          (candidate) => candidate.id === state.playerShipId,
        )!.miningNodeId;
      }),
    )
    .toBe(node);
});

test('UX-T-077: a mined deposit reports how much yield is left, and actions appear once', async ({
  page,
}) => {
  await launch(page);
  const node = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return state.nodes
      .filter((item) => item.remaining > 0)
      .map((item) => ({
        id: item.id,
        distance: Math.hypot(
          item.position.x - ship.position.x,
          item.position.y - ship.position.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0]!.id;
  });
  await page.evaluate((id) => {
    window.__GAME__!.autopilotTo(id);
  }, node);

  // Wait for autopilot to stop the ship, so a mining lock is legal.
  await expect
    .poll(
      () =>
        page.evaluate((id) => {
          const state = window.__GAME__!.state!;
          const ship = state.ships.find(
            (candidate) => candidate.id === state.playerShipId,
          )!;
          const target = state.nodes.find((item) => item.id === id)!;
          const distance =
            Math.hypot(
              ship.position.x - target.position.x,
              ship.position.y - target.position.y,
            ) / 1_000;
          return distance <= 96 && Math.hypot(ship.velocity.x, ship.velocity.y) === 0;
        }, node),
      { timeout: 20_000 },
    )
    .toBe(true);

  const deposit = page.getByRole('meter', { name: /remaining$/ });
  await expect(deposit).toBeVisible();
  const capacity = await page.evaluate(
    (id) => window.__GAME__!.state!.nodes.find((n) => n.id === id)!.capacity,
    node,
  );
  expect(capacity).toBeGreaterThan(0);
  await expect(deposit).toHaveAttribute('aria-valuemax', String(capacity));
  await expect(deposit).toHaveAttribute('aria-valuenow', String(capacity));

  // The target card used to repeat the same Dock/Autopilot/Bomb row the
  // context bar already shows. The card now carries no action buttons, and the
  // context bar offers each action exactly once. (The contacts list keeps its
  // own per-contact buttons; those are not duplicates.)
  expect(
    await page.locator('.vs-target').getByRole('button').count(),
  ).toBe(0);
  const contextBar = page.getByRole('navigation', { name: 'Context actions' });
  for (const label of ['Mine', 'Autopilot']) {
    expect(
      await contextBar.getByRole('button', { name: label, exact: true }).count(),
    ).toBe(1);
  }

  // The bar tracks depletion as the deposit is mined out.
  await page.evaluate((id) => {
    const state = window.__GAME__!.state!;
    const target = state.nodes.find((n) => n.id === id)!;
    window.__GAME__!.input({ type: 'startMining', nodeId: target.id });
    window.__GAME__!.tick(400);
  }, node);
  await expect
    .poll(() => deposit.getAttribute('aria-valuenow'))
    .not.toBe(String(capacity));
});

test('UX-T-078: the minimap opens the galaxy map', async ({ page }) => {
  await launch(page);
  await page
    .getByRole('button', { name: /^Open galaxy map/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Galaxy', exact: true }),
  ).toBeVisible();
});
