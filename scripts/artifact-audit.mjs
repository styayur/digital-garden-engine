import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  REPO_ROOT,
  collectPrivateFingerprints,
  parseArgs,
  resolveGardenRoot,
  walkFiles,
} from './lib/content-utils.mjs';

const args = parseArgs();
const outputDirectory = path.resolve(REPO_ROOT, args.output || process.env.DIGITAL_GARDEN_OUTPUT_DIR || 'out');
const gardenRoot = resolveGardenRoot({ source: args.source });
const canaryFile = path.resolve(
  REPO_ROOT,
  args['canary-config'] || 'fixtures/content/canaries.json',
);

if (!fs.existsSync(outputDirectory)) {
  console.error(`Artifact directory does not exist: ${outputDirectory}`);
  process.exit(1);
}

const failures = [];
const files = walkFiles(outputDirectory);
for (const file of files) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
  if (/\.map$/i.test(relative)) failures.push(`unexpected source map: ${relative}`);
  if (/(^|\/)\.env(?:\.|$)/i.test(relative)) failures.push(`environment file: ${relative}`);
  if (/(^|\/)(?:admin|api\/admin)(?:\/|$)/i.test(relative)) failures.push(`admin/API output: ${relative}`);
}

const text = files
  .map((file) => {
    try {
      return fs.readFileSync(file, 'latin1');
    } catch {
      return '';
    }
  })
  .join('\n');

const secretPatterns = [
  ['GitHub token', /gh[pousr]_[A-Za-z0-9_]{20,}/g],
  ['GitHub fine-grained token', /github_pat_[A-Za-z0-9_]{20,}/g],
  ['OpenAI-style key', /sk-[A-Za-z0-9_-]{20,}/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['admin password assignment', /ADMIN_PASSWORD\s*=\s*(?!change-me|replace-)[^\s"'`]+/g],
  ['admin secret assignment', /ADMIN_SECRET\s*=\s*(?!replace-)[^\s"'`]+/g],
  ['local absolute path', /(?:[A-Za-z]:\\Users\\|\/Users\/[^/\s]+\/|\/home\/runner\/work\/)/g],
  ['private content path', /content\/(?:drafts|private)(?:\/|\\)/g],
  ['admin route', /\/api\/admin(?:\/|\b)|\/admin(?:\/|\b)/g],
];

for (const [label, pattern] of secretPatterns) {
  if (pattern.test(text)) failures.push(`${label} found in artifact text`);
  pattern.lastIndex = 0;
}

if (fs.existsSync(canaryFile)) {
  const canaries = JSON.parse(fs.readFileSync(canaryFile, 'utf8'));
  for (const canary of canaries.forbidden ?? []) {
    if (text.includes(canary)) failures.push(`forbidden canary detected: ${canaryFile}`);
  }
  if (args['require-public-canary'] && canaries.public && !text.includes(canaries.public)) {
    failures.push(`public canary missing from artifact: ${canaryFile}`);
  }
}

for (const fingerprint of collectPrivateFingerprints(gardenRoot)) {
  if (text.includes(fingerprint.value)) {
    failures.push(`draft/private fingerprint detected: ${fingerprint.status}/${fingerprint.kind}/${fingerprint.type}`);
  }
}

if (failures.length > 0) {
  console.error(`Artifact audit failed (${failures.length} issue(s)).`);
  for (const failure of [...new Set(failures)].slice(0, 50)) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Artifact audit passed: ${files.length} file(s) checked; no forbidden canaries, secrets, admin output, private fingerprints or source maps found.`);
