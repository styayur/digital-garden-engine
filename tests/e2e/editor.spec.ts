import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { test, expect } from '@playwright/test';

function find7z() {
  const candidates = ['7z', 'C:/Program Files/7-Zip/7z.exe', 'C:/Program Files (x86)/7-Zip/7z.exe'];
  for (const candidate of candidates) {
    try { execFileSync(candidate, ['i'], { stdio: 'pipe' }); return candidate; } catch { /* next */ }
  }
  throw new Error('An independent 7z-compatible extractor is required.');
}

async function waitForServer(url: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start: ${url}`);
}

test('create, edit HTML, change layout, drag, undo, save, export 7z, rebuild and preview', async ({ page, context }, testInfo) => {
  await page.goto('/editor/');
  await expect(page.getByText('Rhizomaybor', { exact: true }).first()).toBeVisible();
  const frame = page.frameLocator('[data-testid="site-preview"]');
  await expect(frame.locator('h1').first()).toBeVisible();

  await frame.locator('h1').first().click();
  const editedTitle = `Garden title ${Date.now()}`;
  await page.getByLabel('Title').fill(editedTitle);
  await expect(frame.locator('h1').first()).toHaveText(editedTitle);

  await page.getByTestId('left-content-tab').click();
  await page.getByTestId('document-doc-about-profile').click();
  await page.getByTestId('content-mode-source').click();
  const sourceEditor = page.getByTestId('content-source-editor');
  const originalSource = await sourceEditor.inputValue();
  const editedSource = originalSource.replace('until it is intentionally converted', 'with a deliberately edited sentence');
  await sourceEditor.fill(editedSource);
  await page.getByTestId('apply-content').click();
  await expect(page.getByTestId('content-source-editor')).toHaveCount(0);

  await page.getByTestId('left-pages-tab').click();
  await page.getByTestId('page-page-home').click();
  await frame.locator('h1').first().click();
  await page.getByTestId('inspector-layout').click();
  await page.getByTestId('section-layout').selectOption('stack');

  await page.getByTestId('add-callout').click();
  const firstSection = frame.locator('[data-editor-kind="section"]').first();
  await expect(firstSection.locator('.component')).toHaveCount(2);
  await firstSection.locator('.component-callout').evaluate((source) => {
    const target = source.closest('[data-editor-kind="section"]')?.querySelector('.component-hero');
    if (!target) throw new Error('Drag target not found');
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  });
  await expect(frame.locator('[data-editor-kind="section"]').first().locator('.component').first()).toHaveClass(/component-callout/);
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+y');
  await page.getByTestId('device-mobile').click();
  await expect(page.getByTestId('preview-shell')).toHaveAttribute('data-device', 'mobile');

  const projectDownloadPromise = page.waitForEvent('download');
  await page.getByTestId('save-project').click();
  const projectDownload = await projectDownloadPromise;
  const savedProjectPath = testInfo.outputPath('saved-project.json');
  await projectDownload.saveAs(savedProjectPath);
  const savedProject = JSON.parse(fs.readFileSync(savedProjectPath, 'utf8'));
  expect(savedProject.pages[0].sections[0].layout).toBe('stack');
  expect(JSON.stringify(savedProject)).toContain('deliberately edited sentence');

  await page.getByTestId('open-export').click();
  const archiveDownloadPromise = page.waitForEvent('download', { timeout: 90_000 });
  await page.getByTestId('export-project-7z').click();
  const archiveDownload = await archiveDownloadPromise;
  const archivePath = testInfo.outputPath(archiveDownload.suggestedFilename());
  await archiveDownload.saveAs(archivePath);
  expect([...fs.readFileSync(archivePath).subarray(0, 6)]).toEqual([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);

  const extractedDirectory = testInfo.outputPath('extracted-project');
  fs.mkdirSync(extractedDirectory, { recursive: true });
  execFileSync(find7z(), ['x', archivePath, `-o${extractedDirectory}`, '-y'], { stdio: 'pipe' });
  expect(fs.existsSync(path.join(extractedDirectory, 'rhizomaybor.project.json'))).toBe(true);
  expect(fs.existsSync(path.join(extractedDirectory, 'export-manifest.json'))).toBe(true);

  await page.reload();
  await page.getByTestId('project-file-input').setInputFiles(archivePath);
  await expect(page.getByText(/Imported Rhizomaybor Demo Garden/)).toBeVisible({ timeout: 30_000 });
  await expect(page.frameLocator('[data-testid="site-preview"]').locator('h1').first()).toContainText(editedTitle);

  const rebuiltDirectory = testInfo.outputPath('rebuilt-site');
  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/build-project.ts', '--project', path.join(extractedDirectory, 'rhizomaybor.project.json'), '--output', rebuiltDirectory], { stdio: 'pipe' });
  expect(fs.readFileSync(path.join(rebuiltDirectory, 'index.html'), 'utf8')).toContain(editedTitle);

  const server = spawn(process.execPath, ['scripts/serve-static.mjs', rebuiltDirectory, '4174'], { stdio: 'ignore' });
  try {
    await waitForServer('http://127.0.0.1:4174/');
    const rebuiltPage = await context.newPage();
    await rebuiltPage.goto('http://127.0.0.1:4174/');
    await expect(rebuiltPage.getByRole('heading', { level: 1 })).toContainText(editedTitle);
  } finally {
    server.kill();
  }

  await page.getByTestId('open-export').click();
  const websiteDownloadPromise = page.waitForEvent('download', { timeout: 90_000 });
  await page.getByTestId('export-website-7z').click();
  const websiteDownload = await websiteDownloadPromise;
  const websiteArchivePath = testInfo.outputPath(websiteDownload.suggestedFilename());
  await websiteDownload.saveAs(websiteArchivePath);
  const websiteExtraction = testInfo.outputPath('website-extracted');
  fs.mkdirSync(websiteExtraction, { recursive: true });
  execFileSync(find7z(), ['x', websiteArchivePath, `-o${websiteExtraction}`, '-y'], { stdio: 'pipe' });
  expect(fs.existsSync(path.join(websiteExtraction, 'index.html'))).toBe(true);
  const websiteText = fs.readFileSync(path.join(websiteExtraction, 'index.html'), 'utf8');
  expect(websiteText).not.toContain('EXAMPLE_DRAFT_MUST_NOT_PUBLISH_9f21');
  expect(websiteText).not.toContain('EXAMPLE_PRIVATE_MUST_NOT_PUBLISH_2d84');
});
