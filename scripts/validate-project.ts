import fs from 'node:fs';
import path from 'node:path';

import { migrateProject } from '../lib/project/migrations';
import { validateProject } from '../lib/project/validation';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const index = args.indexOf('--project');
const projectPath = path.resolve(ROOT, index >= 0 && args[index + 1] ? args[index + 1] : path.join('examples', 'project', 'rhizomaybor.project.json'));
const parsed = migrateProject(JSON.parse(fs.readFileSync(projectPath, 'utf8')));
const result = validateProject(parsed.project, { forExport: 'website' });
for (const warning of result.warnings) console.warn(`warning ${warning.path}: ${warning.message}`);
for (const error of result.errors) console.error(`error ${error.path}: ${error.message}`);
if (!result.valid) process.exit(1);
process.stdout.write(`Project valid: ${parsed.project.pages.length} pages, ${parsed.project.contentDocuments.length} documents, ${parsed.project.assets.length} assets.\n`);

