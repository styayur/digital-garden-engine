import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  CONTENT_KINDS,
  REPO_ROOT,
  parseArgs,
  resolveGardenRoot,
  validateContent,
  walkFiles,
} from './lib/content-utils.mjs';

function safeOutputDirectory(directory) {
  const resolved = path.resolve(REPO_ROOT, directory);
  const blocked = new Set([path.parse(resolved).root, REPO_ROOT, process.env.USERPROFILE, process.env.HOME]);
  if (blocked.has(resolved)) throw new Error(`Refusing to clear unsafe output directory: ${resolved}`);
  const allowedRoot = path.join(REPO_ROOT, '.build');
  if (!resolved.startsWith(allowedRoot + path.sep)) {
    throw new Error(`Publication staging output must stay under .build/: ${resolved}`);
  }
  return resolved;
}

export function stageContent({ gardenRoot, outputDirectory = '.build/public-content' }) {
  const output = safeOutputDirectory(outputDirectory);
  const assetsOutput = safeOutputDirectory(path.join(path.dirname(outputDirectory), 'public-assets'));
  const result = validateContent(gardenRoot);
  if (result.errors.length > 0) {
    const error = new Error(`Publication gate rejected ${result.errors.length} content issue(s).`);
    error.details = result.errors;
    throw error;
  }

  fs.rmSync(output, { recursive: true, force: true });
  fs.rmSync(assetsOutput, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(assetsOutput, { recursive: true });

  let stagedEntries = 0;
  for (const kind of CONTENT_KINDS) {
    const sourceKind = path.join(gardenRoot, 'published', kind);
    const targetKind = path.join(output, kind);
    if (!fs.existsSync(sourceKind)) continue;
    fs.mkdirSync(targetKind, { recursive: true });
    for (const file of walkFiles(sourceKind)) {
      if (!/\.(md|mdx)$/i.test(file)) continue;
      fs.copyFileSync(file, path.join(targetKind, path.basename(file)));
      stagedEntries += 1;
    }
  }

  const sourceAssets = path.join(gardenRoot, 'published', 'assets');
  let stagedAssets = 0;
  if (fs.existsSync(sourceAssets)) {
    for (const file of walkFiles(sourceAssets)) {
      const rel = path.relative(sourceAssets, file);
      const target = path.join(assetsOutput, rel);
      if (!target.startsWith(assetsOutput + path.sep)) throw new Error('Unsafe asset path rejected.');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
      stagedAssets += 1;
    }
  }

  return {
    output,
    assetsOutput,
    stagedEntries,
    stagedAssets,
    counts: result.counts,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs();
    const gardenRoot = resolveGardenRoot({ source: args.source });
    const summary = stageContent({
      gardenRoot,
      outputDirectory: args.output || '.build/public-content',
    });
    if (!args.quiet) {
      console.log(`${summary.stagedEntries} published entries staged`);
      console.log(`${summary.counts.draft} drafts excluded`);
      console.log(`${summary.counts.private} private entries excluded`);
      console.log(`${summary.stagedAssets} public assets staged`);
    }
  } catch (error) {
    console.error(error.message);
    for (const detail of error.details ?? []) console.error(`- ${detail}`);
    process.exit(1);
  }
}


