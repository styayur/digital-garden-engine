import fs from 'node:fs';
import path from 'node:path';

import { migrateProject } from '../lib/project/migrations';
import { createExportPlan } from '../lib/project/export';
import { sanitizeServerHtml } from '../lib/project/html-server';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const value = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? path.resolve(ROOT, args[index + 1]) : fallback;
};
const projectPath = value('project', path.join(ROOT, 'examples', 'project', 'rhizomaybor.project.json'));
const outputDirectory = value('output', path.join(ROOT, 'out-project'));

async function main() {
  const parsed = migrateProject(JSON.parse(fs.readFileSync(projectPath, 'utf8')));
  const plan = await createExportPlan(parsed.project, 'website', sanitizeServerHtml);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const file of plan.files) {
    const target = path.resolve(outputDirectory, file.path);
    if (!target.startsWith(outputDirectory + path.sep) && target !== path.join(outputDirectory, 'index.html')) {
      throw new Error(`Unsafe output path: ${file.path}`);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content);
  }
  process.stdout.write(`Built ${plan.files.length} files for ${parsed.project.name}.\n`);
  process.stdout.write(`Output: ${path.relative(ROOT, outputDirectory)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

