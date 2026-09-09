import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { startCampaignFromHome } from './helpers';

const AUDIO_EXTENSIONS = new Set([
  '.aac',
  '.flac',
  '.m4a',
  '.mp3',
  '.ogg',
  '.opus',
  '.wav',
  '.weba',
]);

async function audioFiles(root: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (
      ['node_modules', '.git', 'playwright-report', 'test-results'].includes(
        entry.name,
      )
    )
      continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...(await audioFiles(path)));
    else if (
      AUDIO_EXTENSIONS.has(
        entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase(),
      )
    )
      found.push(path);
  }
  return found;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const constructions: string[] = [];
    (window as any).__AUDIO_CONSTRUCTIONS__ = constructions;
    for (const key of [
      'Audio',
      'AudioContext',
      'webkitAudioContext',
      'OfflineAudioContext',
      'webkitOfflineAudioContext',
    ] as const) {
      const original = (window as any)[key];
      if (typeof original !== 'function') continue;
      (window as any)[key] = new Proxy(original, {
        construct(target, args, newTarget) {
          constructions.push(key);
          return Reflect.construct(target, args, newTarget);
        },
      });
    }
  });
});

test('T-F-10: the app ships and runs without audio files, elements, requests, or runtime construction', async ({
  page,
}) => {
  const requestedAudio: string[] = [];
  page.on('request', (request) => {
    if (/\.(aac|flac|m4a|mp3|ogg|opus|wav|weba)(?:$|\?)/i.test(request.url()))
      requestedAudio.push(request.url());
  });
  await page.goto('/');

  expect(await audioFiles(process.cwd())).toEqual([]);
  expect(await page.locator("audio, source[type^='audio/']").count()).toBe(0);
  expect(
    await page.evaluate(() => (window as any).__AUDIO_CONSTRUCTIONS__),
  ).toEqual([]);
  expect(requestedAudio).toEqual([]);
});

test('desktop and mobile render the same campaign actions without viewport overflow', async ({
  page,
}, testInfo) => {
  await startCampaignFromHome(page);
  const primaryLaunch = page
    .getByRole('button', { name: 'Launch', exact: true })
    .first();
  await expect(primaryLaunch).toBeVisible();
  const launchBox = await primaryLaunch.boundingBox();
  expect(launchBox?.height).toBeGreaterThanOrEqual(48);
  expect(launchBox?.width).toBeGreaterThanOrEqual(48);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await primaryLaunch.click();
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('meter', { name: 'Fuel' })).toBeVisible();
  await expect(page.getByRole('meter', { name: 'Cargo' })).toBeVisible();

  const touchControls = page.getByRole('application', {
    name: 'Analog flight joystick',
  });
  if (testInfo.project.name === 'mobile') {
    await expect(touchControls).toBeVisible();
    const controls = page
      .getByRole('group', { name: 'Discrete flight controls' })
      .getByRole('button');
    expect(await controls.count()).toBe(4);
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(48);
      expect(box?.width).toBeGreaterThanOrEqual(48);
    }
  } else {
    await expect(touchControls).toBeHidden();
  }
});
