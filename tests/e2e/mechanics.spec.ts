import { expect, test } from '@playwright/test';
import { flyToEntity, startCampaignFromHome, tick } from './helpers';

test('M04/M05: fixed-step flight is deterministic and burns deterministic fuel', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  await page.evaluate(() => {
    window.__GAME__!.input({ type: 'launch' });
    window.__GAME__!.tick(1);
    window.__GAME__!.input({ type: 'flight', throttle: 1, turn: 0 });
    window.__GAME__!.tick(80);
  });
  const first = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return {
      position: ship.position,
      velocity: ship.velocity,
      fuel: ship.fuelHundredths,
      consumed: state.stats.fuelConsumedHundredths,
      tick: state.tick,
    };
  });

  await page.evaluate(() => {
    window.__GAME__!.create({
      seed: '0000000000000000',
      width: 10,
      height: 10,
      rivals: 1,
      difficulty: 'Captain',
      campaignId: 'determinism-replay',
    });
    window.__GAME__!.input({ type: 'launch' });
    window.__GAME__!.tick(1);
    window.__GAME__!.input({ type: 'flight', throttle: 1, turn: 0 });
    window.__GAME__!.tick(80);
  });
  const second = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return {
      position: ship.position,
      velocity: ship.velocity,
      fuel: ship.fuelHundredths,
      consumed: state.stats.fuelConsumedHundredths,
      tick: state.tick,
    };
  });

  expect(second).toEqual(first);
  expect(first.tick).toBe(81);
  expect(first.consumed).toBeGreaterThan(0);
  expect(first.fuel).toBe(8_000 - first.consumed);
  expect(Math.hypot(first.velocity.x, first.velocity.y)).toBeLessThanOrEqual(
    220_000,
  );
});

test('T-E2E-V0-002: deterministic flight reaches mining, discovery, trade, and refit', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  await page.evaluate(() => {
    window.__GAME__!.input({ type: 'launch' });
    window.__GAME__!.tick(1);
  });

  const opening = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    return {
      nodeId: state.nodes.find((node) => node.material === 'ore')!.id,
      discoveryId: state.discoveries.find((item) => !item.claimed)!.id,
      homeId: state.planets.find((planet) => planet.owner === 'player')!.id,
    };
  });

  await flyToEntity(page, opening.nodeId);
  await page.evaluate(
    (nodeId) => window.__GAME__!.input({ type: 'startMining', nodeId }),
    opening.nodeId,
  );
  await tick(page, 72);
  expect(
    await page.evaluate(() => {
      const state = window.__GAME__!.state!;
      return state.ships.find((ship) => ship.id === state.playerShipId)!.cargo
        .ore;
    }),
  ).toBeGreaterThanOrEqual(4);

  await flyToEntity(page, opening.discoveryId);
  await tick(page, 1);
  expect(
    await page.evaluate(() => window.__GAME__!.state!.stats.discoveries),
  ).toBe(1);

  await flyToEntity(page, opening.homeId);
  await page.evaluate((planetId) => {
    window.__GAME__!.input({ type: 'dock', planetId });
    window.__GAME__!.tick(1);
  }, opening.homeId);
  const beforeTrade = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return { credits: ship.credits, ore: ship.cargo.ore };
  });
  expect(beforeTrade.ore).toBeGreaterThanOrEqual(12);

  await page.getByRole('button', { name: 'Market' }).click();
  const oreQuantity = page.getByLabel('Ore quantity');
  await oreQuantity.fill(String(beforeTrade.ore - 4));
  await oreQuantity.press('Tab');
  await page
    .getByRole('button', { name: `Sell ${beforeTrade.ore - 4}` })
    .click();
  await page.getByRole('button', { name: 'Shipyard' }).click();
  const drillCard = page
    .locator('article.vs-module-card')
    .filter({ has: page.getByRole('heading', { name: 'Helix Drill T1' }) });
  await drillCard.getByRole('button', { name: 'Buy and fit' }).click();

  const final = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return {
      credits: ship.credits,
      ore: ship.cargo.ore,
      drill: ship.upgrades.drill,
      mining: ship.stats.miningMilliPerSecond,
      events: state.events.map((event) => event.type),
    };
  });
  expect(final.drill).toBe(1);
  expect(final.ore).toBe(0);
  expect(final.mining).toBeGreaterThan(4_000);
  expect(final.events).toEqual(
    expect.arrayContaining([
      'CARGO_GAIN',
      'DISCOVERY',
      'TRADE',
      'EQUIPMENT_FITTED',
    ]),
  );
});
