import { test, expect } from '@playwright/test';

test('MarkText-compatible visual engine mounts for Markdown and preserves source mode', async ({ page }) => {
  await page.goto('/editor/');
  await page.getByTestId('left-content-tab').click();
  await page.getByTestId('document-doc-post-building-a-garden').click();
  await expect(page.locator('.marktext-editor')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.marktext-editor')).not.toBeEmpty();
  await page.getByTestId('content-mode-source').click();
  const source = await page.getByTestId('content-source-editor').inputValue();
  expect(source.length).toBeGreaterThan(20);
  expect(source).toMatch(/[A-Za-z]/);
  await page.getByTestId('content-mode-preview').click();
  await expect(page.getByTestId('content-preview')).toBeVisible();
});
