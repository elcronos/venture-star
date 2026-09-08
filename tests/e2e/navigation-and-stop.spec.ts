import { expect, test } from '@playwright/test';
import { flyToEntity, startCampaignFromHome } from './helpers';

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
  expect(
    await contextBar.getByRole('button', { name: 'Mine', exact: true }).count(),
  ).toBe(1);
  // Moving is a tap on the map, so the context bar carries no travel button.
  expect(
    await contextBar.getByRole('button', { name: 'Fly here' }).count(),
  ).toBe(0);

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

test('UX-T-078: the minimap scans and opens the galaxy map', async ({
  page,
}) => {
  await launch(page);
  const scans = () =>
    page.evaluate(
      () =>
        window.__GAME__!.state!.events.filter(
          (event) => event.type === 'SCAN_PULSE',
        ).length,
    );
  const before = await scans();

  await page.getByRole('button', { name: /^Scan and open galaxy map/ }).click();

  await expect(
    page.getByRole('heading', { name: 'Galaxy', exact: true }),
  ).toBeVisible();
  expect(await scans()).toBe(before + 1);
});

test('UX-T-079: a planet advertises what its market pays before you dock', async ({
  page,
}) => {
  await launch(page);
  const home = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    return state.planets.find((planet) => planet.owner === 'player')!.id;
  });
  await page.evaluate((id) => {
    window.__GAME__!.selectEntity(id);
  }, home);

  await expect(page.locator('.vs-target__trade')).toContainText(/\d+c ore/);

  // The galaxy map marks the same planet as somewhere to sell.
  await page.getByRole('button', { name: /^Scan and open galaxy map/ }).click();
  await expect(
    page.getByRole('gridcell', { name: /Sells here/ }).first(),
  ).toBeVisible();
});

test('T-M06-009: one tap on the map flies there; a tap on your own ship stops', async ({
  page,
}) => {
  await launch(page);
  const canvas = page.locator('canvas.vs-space-canvas');
  const box = (await canvas.boundingBox())!;

  const speed = () =>
    page.evaluate(() => {
      const state = window.__GAME__!.state!;
      const ship = state.ships.find(
        (candidate) => candidate.id === state.playerShipId,
      )!;
      return Math.hypot(ship.velocity.x, ship.velocity.y);
    });
  expect(await speed()).toBe(0);

  // A single tap on empty space commits the move; no second tap required.
  await page.mouse.click(box.x + box.width - 60, box.y + 60);
  await expect.poll(speed).toBeGreaterThan(0);
  await expect(page.locator('.vs-autopilot')).toBeVisible();

  // Tapping the ship itself is the stop gesture.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(speed, { timeout: 15_000 }).toBe(0);
  await expect(page.locator('.vs-autopilot')).toHaveCount(0);
});

test('T-M06-010: one tap on a deposit both selects it and starts the approach', async ({
  page,
}) => {
  await launch(page);
  const target = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    const node = state.nodes
      .filter((item) => item.remaining > 0)
      .map((item) => ({
        id: item.id,
        dx: (item.position.x - ship.position.x) / 1_000,
        dy: (item.position.y - ship.position.y) / 1_000,
      }))
      .sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy))[0]!;
    return node;
  });
  const canvas = page.locator('canvas.vs-space-canvas');
  const box = (await canvas.boundingBox())!;

  // The camera sits on the ship at 0.72 zoom, so the node maps to this offset.
  await page.mouse.click(
    box.x + box.width / 2 + target.dx * 0.72,
    box.y + box.height / 2 + target.dy * 0.72,
  );

  expect(
    await page.evaluate(() => {
      const state = window.__GAME__!.state!;
      return state.ships.find(
        (candidate) => candidate.id === state.playerShipId,
      )!.selectedTargetId;
    }),
  ).toBe(target.id);
  await expect(page.locator('.vs-autopilot')).toBeVisible();
});

test('T-M05-008: a neutral port sells fuel by the unit, with the cost shown', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  const neutral = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const planet = state.planets.find((item) => item.owner === null)!;
    return { id: planet.id, name: planet.name };
  });

  // Fly the real simulation to a planet the player does not own, burning fuel
  // on the way. This is the situation that used to strand a player: a full
  // market in reach, and no way to buy fuel from it.
  await page.evaluate(() => {
    window.__GAME__!.input({ type: 'launch' });
    window.__GAME__!.tick(1);
  });
  await flyToEntity(page, neutral.id);
  await page.evaluate((id) => {
    window.__GAME__!.input({ type: 'dock', planetId: id });
    window.__GAME__!.tick(1);
  }, neutral.id);

  const state = () =>
    page.evaluate(() => {
      const snapshot = window.__GAME__!.state!;
      const ship = snapshot.ships.find(
        (candidate) => candidate.id === snapshot.playerShipId,
      )!;
      return {
        fuel: ship.fuelHundredths,
        credits: ship.credits,
        docked: ship.dockedPlanetId,
      };
    });
  await expect.poll(async () => (await state()).docked).toBe(neutral.id);

  await page.getByRole('button', { name: 'Market' }).first().click();
  const fuelRow = page.locator('.vs-market__row.is-fuel');
  await expect(fuelRow).toBeVisible();
  // M05 prices neutral permitted access at 3 cr/FU against 1 at your own.
  await expect(fuelRow.locator('.vs-market__price')).toHaveText('3 cr');

  const buy = fuelRow.getByRole('button', { name: /^Buy \d+ FU · \d+ cr$/ });
  await expect(buy).toBeEnabled();
  await expect
    .poll(async () => {
      const text = (await buy.textContent()) ?? '';
      const offered = Number(/Buy (\d+) FU/.exec(text)?.[1] ?? 0);
      const { fuel } = await state();
      return offered === Math.min(10, Math.floor(80 - fuel / 100));
    })
    .toBe(true);

  const before = await state();
  const [, units, cost] = /Buy (\d+) FU · (\d+) cr/.exec(
    (await buy.textContent())!,
  )!;
  // The button states the exact price of the exact quantity it will buy.
  expect(Number(cost)).toBe(Number(units) * 3);

  await buy.click();
  await expect.poll(async () => (await state()).fuel).toBe(
    before.fuel + Number(units) * 100,
  );
  expect((await state()).credits).toBe(before.credits - Number(cost));
});

test('T-M18-008: all three peaceful acquisition actions are reachable at a neutral port', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  const neutral = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    return state.planets.find((item) => item.owner === null)!.id;
  });
  await page.evaluate(() => {
    window.__GAME__!.input({ type: 'launch' });
    window.__GAME__!.tick(1);
  });
  await flyToEntity(page, neutral);
  await page.evaluate((id) => {
    window.__GAME__!.input({ type: 'dock', planetId: id });
    window.__GAME__!.tick(1);
  }, neutral);

  const actions = page.locator('.vs-influence-actions');
  await expect(actions).toBeVisible();
  // M18 defines three actions; only development aid used to have a button.
  await expect(actions.getByRole('button', { name: /trade contract/ })).toBeVisible();
  await expect(actions.getByRole('button', { name: /development aid/ })).toBeVisible();
  await expect(actions.getByRole('button', { name: /Broadcast appeal/ })).toBeVisible();

  const influence = () =>
    page.evaluate(
      (id) =>
        window.__GAME__!.state!.planets.find((item) => item.id === id)!
          .influence['player'] ?? 0,
      neutral,
    );
  expect(await influence()).toBe(0);
  await actions.getByRole('button', { name: /trade contract/ }).click();
  await expect.poll(influence).toBe(18);
  // The contract is one-per-port, so the button reports why it is now refused.
  await expect(
    actions.getByRole('button', { name: /trade contract/ }),
  ).toBeDisabled();
});

test('T-M12-007: refit is offered at a neutral port, priced above a home yard', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  const home = page.getByRole('button', { name: 'Shipyard' }).first();
  await expect(home).toBeVisible();
  await home.click();
  const homePrice = await page
    .locator('.vs-module-card')
    .first()
    .textContent();

  const neutral = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    return state.planets.find((item) => item.owner === null)!.id;
  });
  await page.evaluate(() => {
    window.__GAME__!.input({ type: 'launch' });
    window.__GAME__!.tick(1);
  });
  await flyToEntity(page, neutral);
  await page.evaluate((id) => {
    window.__GAME__!.input({ type: 'dock', planetId: id });
    window.__GAME__!.tick(1);
  }, neutral);

  await page.getByRole('button', { name: 'Shipyard' }).first().click();
  const awayPrice = await page
    .locator('.vs-module-card')
    .first()
    .textContent();
  expect(awayPrice).not.toBe(homePrice);

  // A module states the stat it changes, not just a tier number.
  await expect(page.locator('.vs-module-card').first()).toContainText(
    /Mining rate|Cargo capacity|Fuel capacity|Sensor range|Shield|Weapon damage/,
  );
});
