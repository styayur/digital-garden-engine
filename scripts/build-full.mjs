import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { installStagedAssets, removeStagedAssets, runNext } from './lib/build-utils.mjs';
import { parseArgs, resolveGardenRoot } from './lib/content-utils.mjs';
import { stageContent } from './stage-content.mjs';

const args = parseArgs();
const gardenRoot = resolveGardenRoot({ source: args.source });
let summary;
try {
  summary = stageContent({ gardenRoot, outputDirectory: '.build/full-content' });
} catch (error) {
  console.error(error.message);
  for (const detail of error.details ?? []) console.error(`- ${detail}`);
  process.exit(1);
}

const assetsInstalled = installStagedAssets(summary.assetsOutput);
try {
  if (args.watch === 'true' || args.command === 'dev') {
    const result = spawnSync(process.execPath, [path.join('node_modules', 'next', 'dist', 'bin', 'next'), 'dev', ...process.argv.slice(2).filter((item) => item === '--port' || /^\d+$/.test(item))], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DIGITAL_GARDEN_CONTENT_ROOT: summary.output,
        DIGITAL_GARDEN_SOURCE_ROOT: gardenRoot,
      },
      stdio: 'inherit',
    });
    process.exitCode = result.status ?? 1;
  } else {
    runNext(['build'], {
      NEXT_STATIC_EXPORT: 'false',
      DIGITAL_GARDEN_CONTENT_ROOT: summary.output,
      DIGITAL_GARDEN_SOURCE_ROOT: gardenRoot,
    });
  }
} finally {
  if (assetsInstalled) removeStagedAssets();
  fs.rmSync('.build/full-content', { recursive: true, force: true });
  fs.rmSync('.build/public-assets', { recursive: true, force: true });
}
