import process from 'node:process';

import { parseArgs, resolveGardenRoot, validateContent } from './lib/content-utils.mjs';

const args = parseArgs();
const gardenRoot = resolveGardenRoot({ source: args.source });
const result = validateContent(gardenRoot);

if (result.errors.length > 0) {
  console.error(`Content validation failed (${result.errors.length} issue(s)).`);
  for (const error of result.errors.slice(0, 50)) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content validation passed: ${result.counts.published} published, ${result.counts.draft} draft, ${result.counts.private} private.`);
