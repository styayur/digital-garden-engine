import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { migrateProject } from '../lib/project/migrations';
import { createExportPlan, type ArchiveMode } from '../lib/project/export';
import { create7zArchive } from '../lib/project/archive';
import { sanitizeServerHtml } from '../lib/project/html-server';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const value = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? path.resolve(ROOT, args[index + 1]) : fallback;
};
const requestedMode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'website';
if (requestedMode !== 'project' && requestedMode !== 'website') throw new Error('--mode must be project or website');
const mode: ArchiveMode = requestedMode;
const projectPath = value('project', path.join(ROOT, 'examples', 'project', 'rhizomaybor.project.json'));
const outputDirectory = value('output', path.join(ROOT, 'release-samples'));
async function main() {
  const project = migrateProject(JSON.parse(fs.readFileSync(projectPath, 'utf8'))).project;
  const plan = await createExportPlan(project, mode, sanitizeServerHtml);
  const archive = await create7zArchive(plan.files, plan.suggestedFilename);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const archivePath = path.join(outputDirectory, plan.suggestedFilename);
  fs.writeFileSync(archivePath, archive);
  fs.writeFileSync(`${archivePath}.sha256`, `${createHash('sha256').update(archive).digest('hex')}  ${path.basename(archivePath)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDirectory, `rhizomaybor-${mode}-manifest.json`), `${JSON.stringify(plan.manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${archivePath} (${archive.byteLength} bytes) with ${plan.files.length} files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
