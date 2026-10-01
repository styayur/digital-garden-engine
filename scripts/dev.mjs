import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

import { installStagedAssets, removeStagedAssets } from './lib/build-utils.mjs';
import { parseArgs, resolveGardenRoot } from './lib/content-utils.mjs';
import { stageContent } from './stage-content.mjs';

const args = parseArgs();
const gardenRoot = resolveGardenRoot({ source: args.source });
let summary;
try {
  summary = stageContent({ gardenRoot, outputDirectory: '.build/dev-content' });
} catch (error) {
  console.error(error.message);
  for (const detail of error.details ?? []) console.error(`- ${detail}`);
  process.exit(1);
}

const assetsInstalled = installStagedAssets(summary.assetsOutput);
const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DIGITAL_GARDEN_CONTENT_ROOT: summary.output,
    DIGITAL_GARDEN_SOURCE_ROOT: gardenRoot,
  },
  stdio: 'inherit',
});

function cleanup() {
  if (assetsInstalled) removeStagedAssets();
  fs.rmSync('.build/dev-content', { recursive: true, force: true });
  fs.rmSync('.build/public-assets', { recursive: true, force: true });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 1);
});
