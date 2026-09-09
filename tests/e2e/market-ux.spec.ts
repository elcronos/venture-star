import { expect, test } from '@playwright/test';
import { startCampaignFromHome } from './helpers';

test('market stays readable on desktop and mobile', async ({ page }, testInfo) => {
  await startCampaignFromHome(page);
  await page.getByRole('button', { name: 'Market', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Market' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Market materials' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Buy 1/ }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: `test-results/market-${testInfo.project.name}.png`, fullPage: true });
});
