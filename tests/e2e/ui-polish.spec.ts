import { expect, test } from '@playwright/test';
import { startCampaignFromHome } from './helpers';

test('UX-T-023 setup explains the campaign and offers the full preferred galaxy', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Galaxy width')).toHaveValue('30');
  await expect(page.getByLabel('Galaxy height')).toHaveValue('30');
  await expect(page.getByLabel('Rivals')).toHaveValue('3');
  await expect(page.getByText(/destruction ends the campaign permanently/)).toBeVisible();
  await page.getByLabel('Galaxy width').selectOption('11');
  await expect(page.getByLabel('Galaxy width')).toHaveValue('11');
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const launch = await page.getByRole('button', { name: 'Launch campaign' }).boundingBox();
    expect(launch!.y + launch!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
});

test('UX-T-060 live HUD updates preserve captured flight controls', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Touch pointer lifetime');
  await startCampaignFromHome(page);
  await page.getByRole('button', { name: 'Launch', exact: true }).first().click();
  const stick = page.getByRole('application', { name: 'Analog flight joystick' });
  const original = await stick.elementHandle();
  const bounds = await stick.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * .85, bounds!.y + bounds!.height * .5);
  await page.mouse.down();
  await page.waitForTimeout(800);
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Galaxy', exact: true })).toBeVisible();
  const objective = await page.getByRole('region', { name: 'Current objective' }).boundingBox();
  expect(objective!.y + objective!.height).toBeLessThan(bounds!.y);
  await expect(page.getByText('Credits', { exact: true })).toBeVisible();
  const throttle = page.getByRole('slider', { name: 'Throttle percent' });
  await throttle.focus();
  await throttle.press('Home');
  await expect(throttle).toHaveValue('0');
  await page.getByRole('button', { name: 'Increase throttle' }).click();
  await page.getByRole('button', { name: 'Increase throttle' }).click();
  await expect(throttle).toHaveValue('50');
  await page.getByRole('button', { name: 'Decrease throttle' }).click();
  await expect(throttle).toHaveValue('25');
});

test('UX-T-103 overlay updates retain typing focus and settings can be cancelled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const scale = page.getByLabel('Text scale');
  await scale.focus();
  await scale.selectOption('150');
  await expect(scale).toBeFocused();
  await page.getByLabel('High contrast', { exact: true }).check();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Text scale')).toHaveValue('100');
  await expect(page.getByLabel('High contrast', { exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await startCampaignFromHome(page);
  await page.getByRole('button', { name: 'Launch', exact: true }).first().click();
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  const search = page.getByRole('searchbox');
  await search.pressSequentially('campaign');
  await expect(search).toHaveValue('campaign');
  await expect(search).toBeFocused();
});
