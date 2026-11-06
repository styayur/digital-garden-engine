import fs from 'node:fs';
import path from 'node:path';
import { migrateProject } from '../../lib/project/migrations';
import type { SiteProject } from '../../lib/project/schema';

export function demoProject(): SiteProject {
  const source = path.resolve('examples', 'project', 'rhizomaybor.project.json');
  return migrateProject(JSON.parse(fs.readFileSync(source, 'utf8'))).project;
}
