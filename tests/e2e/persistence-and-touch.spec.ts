import { expect, test } from '@playwright/test';
import { startCampaignFromHome } from './helpers';

test('M27: a paused campaign restores from IndexedDB and Continue resumes the real flight screen', async ({
  page,
}) => {
  await startCampaignFromHome(page);
  await page
    .getByRole('button', { name: 'Launch', exact: true })
    .first()
    .click();
  await page.evaluate(() => {
    window.__GAME__!.input({ type: 'flight', throttle: 0.5, turn: 0 });
    window.__GAME__!.tick(40);
  });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.vs-pause-menu .vs-save-state')).toHaveText(
    'Saved',
  );
  const beforeReload = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return {
      campaignId: state.campaignId,
      seed: state.seed,
      tick: state.tick,
      position: ship.position,
      fuel: ship.fuelHundredths,
    };
  });

  await page.reload();
  await page.waitForFunction(() => Boolean(window.__GAME__?.state));
  const restored = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    return {
      campaignId: state.campaignId,
      seed: state.seed,
      tick: state.tick,
      position: ship.position,
      fuel: ship.fuelHundredths,
    };
  });
  expect(restored).toEqual(beforeReload);

  await page.getByRole('button', { name: 'Continue — Venture Star' }).click();
  await expect(
    page.getByRole('heading', { name: 'Flight — Venture Star' }),
  ).toBeVisible();
});

test('a passive tab cannot revive a campaign after its active save is sealed', async ({
  page,
  context,
}) => {
  await startCampaignFromHome(page);
  const campaignId = await page.evaluate(
    () => window.__GAME__!.state!.campaignId,
  );
  await expect
    .poll(() =>
      page.evaluate(async (id) => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('venture-star');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const row = await new Promise((resolve, reject) => {
          const request = database
            .transaction('campaigns')
            .objectStore('campaigns')
            .get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        database.close();
        return Boolean(row);
      }, campaignId),
    )
    .toBe(true);

  const passive = await context.newPage();
  await passive.goto('/');
  await passive.waitForFunction(() => Boolean(window.__GAME__?.state));
  await page.evaluate(
    async ({ id }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('venture-star');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          ['campaigns', 'records'],
          'readwrite',
        );
        transaction.objectStore('campaigns').delete(id);
        transaction.objectStore('campaigns').delete(`${id}:journal`);
        transaction
          .objectStore('records')
          .put({
            id,
            sealedAt: Date.now(),
            outcome: 'defeat',
            state: {
              record: {
                id,
                title: 'Venture Star',
                outcome: 'Defeat',
                seed: '0000000000000000',
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                simulationDuration: '0:00',
                engagedDuration: '0:00',
                wallSpan: '0:00',
                dimensions: '10×10',
                difficulty: 'Captain',
                planetsControlled: '1/10',
                discoveries: 0,
                rulesVersion: '1.0.0',
              },
              serialized: '',
            },
          });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    },
    { id: campaignId },
  );
  await page.close();

  await passive
    .getByRole('button', { name: 'Continue — Venture Star' })
    .click();
  await expect(
    passive.getByRole('heading', { name: 'Venture Star', exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => passive.evaluate(() => window.__GAME__?.state ?? null))
    .toBeNull();
});

test('touching a rendered entity selects it through the production canvas hit path', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'Touch entity selection is exercised by the mobile project.',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startCampaignFromHome(page);
  await page
    .getByRole('button', { name: 'Launch', exact: true })
    .first()
    .click();

  const target = await page.evaluate(() => {
    const state = window.__GAME__!.state!;
    const ship = state.ships.find(
      (candidate) => candidate.id === state.playerShipId,
    )!;
    const home = state.planets.find((planet) => planet.owner === 'player')!;
    return {
      id: home.id,
      name: home.name,
      dx: (home.position.x - ship.position.x) / 1_000,
      dy: (home.position.y - ship.position.y) / 1_000,
    };
  });
  const canvas = page.locator('canvas.vs-space-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(
    box!.x + box!.width / 2 + target.dx * 0.72,
    box!.y + box!.height / 2 + target.dy * 0.72,
  );

  await expect(page.getByRole('heading', { name: target.name })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.__GAME__!.state!.ships.find(
          (ship) => ship.id === window.__GAME__!.state!.playerShipId,
        )!.selectedTargetId,
    ),
  ).toBe(target.id);
});

test('holding the mobile joystick continuously accelerates without losing pointer capture', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'The analog joystick is enabled by the mobile profile.',
  );
  await startCampaignFromHome(page);
  await page
    .getByRole('button', { name: 'Launch', exact: true })
    .first()
    .click();
  const joystick = page.getByRole('application', {
    name: 'Analog flight joystick',
  });
  await expect(joystick).toBeVisible();
  const box = await page.evaluate(() => {
    const rect = document
      .querySelector<HTMLElement>('.vs-joystick')!
      .getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.mouse.move(box.x + box.width / 2, box.y + 8);
  await page.mouse.down();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = window.__GAME__!.state!;
        const ship = state.ships.find(
          (candidate) => candidate.id === state.playerShipId,
        )!;
        return Math.hypot(ship.velocity.x, ship.velocity.y);
      }),
    )
    .toBeGreaterThan(0);
  await page.mouse.up();
});
