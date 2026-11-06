import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { createExportPlan } from '../../lib/project/export';
import { sanitizeServerHtml } from '../../lib/project/html-server';
import { demoProject } from './fixtures';

describe('publication boundary and 7z export', () => {
  it('creates a website plan that contains only approved public content', async () => {
    const project = demoProject();
    project.contentDocuments.push(
      {
        id: 'doc-test-draft', kind: 'post', slug: 'test-draft', title: 'Draft test', description: '',
        tags: [], status: 'draft', format: 'markdown', body: 'EXAMPLE_DRAFT_MUST_NOT_PUBLISH_9f21', unsupportedHtml: [], metadata: {},
      },
      {
        id: 'doc-test-private', kind: 'post', slug: 'test-private', title: 'Private test', description: '',
        tags: [], status: 'private', format: 'html', body: '<p>EXAMPLE_PRIVATE_MUST_NOT_PUBLISH_2d84</p>', unsupportedHtml: [], metadata: {},
      },
    );
    const plan = await createExportPlan(project, 'website', sanitizeServerHtml, new Date('2026-11-06T12:00:00.000Z'));
    expect(plan.manifest.archiveMode).toBe('website');
    expect(plan.manifest.files.length).toBeGreaterThan(0);
    expect(plan.files.some((file) => file.path === 'rhizomaybor.project.json')).toBe(false);
    expect(plan.files.some((file) => file.path === 'index.html')).toBe(true);
    const output = plan.files.map((file) => typeof file.content === 'string' ? file.content : '').join('\n');
    expect(output).not.toContain('EXAMPLE_PRIVATE_MUST_NOT_PUBLISH_2d84');
    expect(output).not.toContain('EXAMPLE_DRAFT_MUST_NOT_PUBLISH_9f21');
    expect(plan.manifest.excluded.some((entry) => entry.status === 'draft')).toBe(true);
    expect(plan.manifest.excluded.some((entry) => entry.status === 'private')).toBe(true);
  });

  it('writes a genuine 7z archive that an independent extractor can read', async () => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'rhizomaybor-test-'));
    execFileSync(process.execPath, [
      'node_modules/tsx/dist/cli.mjs',
      'scripts/export-project.ts',
      '--mode',
      'project',
      '--output',
      temporary,
    ], { stdio: 'pipe' });
    const archivePath = path.join(temporary, fs.readdirSync(temporary).find((file) => file.endsWith('.7z')) ?? '');
    const archiveBytes = fs.readFileSync(archivePath);
    expect([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]).toEqual([...archiveBytes.subarray(0, 6)]);
    const extractionPath = path.join(temporary, 'extracted');
    fs.mkdirSync(extractionPath);
    const sevenZipCandidates = [
      '7z',
      'C:/Program Files/7-Zip/7z.exe',
      'C:/Program Files (x86)/7-Zip/7z.exe',
    ];
    let extracted = false;
    for (const executable of sevenZipCandidates) {
      try {
        execFileSync(executable, ['x', archivePath, `-o${extractionPath}`, '-y'], { stdio: 'pipe' });
        extracted = true;
        break;
      } catch {
        // Try the next independently installed extractor.
      }
    }
    expect(extracted).toBe(true);
    expect(fs.existsSync(path.join(extractionPath, 'rhizomaybor.project.json'))).toBe(true);
    expect(fs.existsSync(path.join(extractionPath, 'export-manifest.json'))).toBe(true);
    expect(fs.readFileSync(path.join(extractionPath, 'export-manifest.json'), 'utf8')).toContain('"archiveMode": "project"');
  });
});
