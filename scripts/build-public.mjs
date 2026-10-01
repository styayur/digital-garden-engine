import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  copyExport,
  excludePublicRoutes,
  installStagedAssets,
  removeStagedAssets,
  runNext,
  runScript,
} from './lib/build-utils.mjs';
import { parseArgs, resolveGardenRoot, validateContent } from './lib/content-utils.mjs';
import { stageContent } from './stage-content.mjs';

const args = parseArgs();
const outputDirectory = path.resolve(
  process.env.DIGITAL_GARDEN_OUTPUT_DIR || args['output-dir'] || 'out',
);
const gardenRoot = resolveGardenRoot({ source: args.source });
const validation = validateContent(gardenRoot);

if (validation.errors.length > 0) {
  console.error(`Publication gate rejected ${validation.errors.length} content issue(s).`);
  for (const issue of validation.errors.slice(0, 50)) console.error(`- ${issue}`);
  process.exit(1);
}

const summary = stageContent({ gardenRoot, outputDirectory: '.build/public-content' });
let restoreRoutes = () => {};
let assetsInstalled = false;
let failed = false;

try {
  assetsInstalled = installStagedAssets(summary.assetsOutput);
  restoreRoutes = excludePublicRoutes();

  console.log(`Publication gate passed: ${summary.stagedEntries} published entries staged.`);
  console.log(`Excluded private material: ${summary.counts.draft} draft and ${summary.counts.private} private entries.`);

  runNext(['build'], {
    NEXT_STATIC_EXPORT: 'true',
    DIGITAL_GARDEN_CONTENT_ROOT: summary.output,
    DIGITAL_GARDEN_SOURCE_ROOT: gardenRoot,
    DIGITAL_GARDEN_OUTPUT_DIR: path.join('.', 'out'),
  });

  fs.writeFileSync(path.join('out', '.nojekyll'), '');
  runScript('scripts/check-links.mjs', [], { DIGITAL_GARDEN_OUTPUT_DIR: 'out' });
  runScript(
    'scripts/artifact-audit.mjs',
    args['canary-config'] ? ['--canary-config', args['canary-config']] : [],
    {
      DIGITAL_GARDEN_SOURCE_ROOT: gardenRoot,
      DIGITAL_GARDEN_OUTPUT_DIR: 'out',
      ...(args['require-public-canary']
        ? { DIGITAL_GARDEN_REQUIRE_PUBLIC_CANARY: 'true' }
        : {}),
    },
  );

  if (args['require-public-canary']) {
    runScript('scripts/artifact-audit.mjs', [
      '--require-public-canary',
      ...(args['canary-config'] ? ['--canary-config', args['canary-config']] : []),
    ], {
      DIGITAL_GARDEN_SOURCE_ROOT: gardenRoot,
      DIGITAL_GARDEN_OUTPUT_DIR: 'out',
    });
  }

  if (outputDirectory !== path.resolve('out')) {
    copyExport('out', outputDirectory);
  }
} catch (error) {
  failed = true;
  console.error(error.message);
} finally {
  restoreRoutes();
  if (assetsInstalled) removeStagedAssets();
  fs.rmSync('.build/public-content', { recursive: true, force: true });
  fs.rmSync('.build/public-assets', { recursive: true, force: true });
}

if (failed) process.exitCode = 1;
else console.log('Public artifact is ready at ' + (path.relative(process.cwd(), outputDirectory) || '.') + '.');
