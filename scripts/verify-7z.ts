import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const archivePath = path.resolve(args[0] ?? '');
if (!fs.existsSync(archivePath)) throw new Error(`Archive not found: ${archivePath}`);
const expectedMode = args[1] ?? 'website';
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'rhizomaybor-7z-'));
execFileSync('7z', ['x', archivePath, `-o${output}`, '-y'], { stdio: 'inherit' });
const manifestPath = path.join(output, 'export-manifest.json');
if (!fs.existsSync(manifestPath)) throw new Error('Extraction did not contain export-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { archiveMode: string; files: Array<{ path: string }> };
if (manifest.archiveMode !== expectedMode) throw new Error(`Expected ${expectedMode} archive, got ${manifest.archiveMode}`);
for (const file of manifest.files) {
  if (!fs.existsSync(path.join(output, file.path))) throw new Error(`Manifest file missing after extraction: ${file.path}`);
}
const forbidden = ['content/drafts', 'content/private', '.env', '.env.local'];
for (const relative of forbidden) {
  if (fs.existsSync(path.join(output, relative))) throw new Error(`Forbidden path extracted: ${relative}`);
}
const home = path.join(output, 'index.html');
if (expectedMode === 'website' && !fs.existsSync(home)) throw new Error('Website archive has no index.html');
console.log(`7z round-trip passed: ${path.basename(archivePath)} -> ${output}`);
