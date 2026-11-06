import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { test, expect } from '@playwright/test';

async function waitForServer(url: string) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start: ${url}`);
}

test('GitHub Pages subpath build loads the garden and visual editor', async ({ browser }, testInfo) => {
  const root = path.resolve('out-pages');
  expect(fs.existsSync(path.join(root, 'editor', 'index.html'))).toBe(true);
  const server = spawn(process.execPath, ['scripts/serve-static.mjs', root, '4175', '/rhizomaybor'], { stdio: 'ignore' });
  const page = await browser.newPage();
  try {
    await waitForServer('http://127.0.0.1:4175/rhizomaybor/editor/');
    await page.goto('http://127.0.0.1:4175/rhizomaybor/');
    await expect(page.locator('body')).toContainText('Alex Example');
    await expect(page.locator('a[href="/writing/"]')).toHaveCount(0);

    await page.goto('http://127.0.0.1:4175/rhizomaybor/editor/');
    await expect(page.getByText('Rhizomaybor', { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId('site-preview')).toBeVisible();
    const scriptSources = await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => (script as HTMLScriptElement).getAttribute('src') ?? ''));
    expect(scriptSources.length).toBeGreaterThan(0);
    expect(scriptSources.every((source) => source.startsWith('/rhizomaybor/'))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('pages-editor.png'), fullPage: true });
  } finally {
    await page.close();
    server.kill();
  }
});
