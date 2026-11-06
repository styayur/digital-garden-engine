import { test, expect } from '@playwright/test';

test('autosave exposes recovery after reload', async ({ page }) => {
  await page.goto('/editor/');
  const frame = page.frameLocator('[data-testid="site-preview"]');
  await expect(frame.locator('h1').first()).toBeVisible();
  await frame.locator('h1').first().click();
  const title = `Recovered title ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await expect(page.getByText(/autosaved/)).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByText(/Recovered unsaved edits/)).toBeVisible();
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(frame.locator('h1').first()).toHaveText(title);
});
