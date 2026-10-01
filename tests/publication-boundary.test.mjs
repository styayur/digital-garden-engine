import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { REPO_ROOT } from '../scripts/lib/content-utils.mjs';

function run(script, args = []) {
  return spawnSync(process.execPath, [path.join(REPO_ROOT, script), ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

test('public build includes public canary and excludes draft/private canaries', { timeout: 180_000 }, () => {
  const output = '.build/publication-boundary-out';
  const result = run('scripts/build-public.mjs', [
    '--source',
    'fixtures/content',
    '--output-dir',
    output,
    '--canary-config',
    'fixtures/content/canaries.json',
    '--require-public-canary',
  ]);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const artifactRoot = path.join(REPO_ROOT, output);
  const text = fs
    .readdirSync(artifactRoot, { recursive: true })
    .filter((entry) => typeof entry === 'string')
    .map((entry) => path.join(artifactRoot, entry))
    .filter((entry) => fs.existsSync(entry) && fs.statSync(entry).isFile())
    .map((entry) => fs.readFileSync(entry, 'latin1'))
    .join('\n');

  assert.match(text, /PUBLIC_TEST_CANARY/);
  assert.doesNotMatch(text, /DRAFT_MUST_NEVER_PUBLISH_4f7e/);
  assert.doesNotMatch(text, /PRIVATE_MUST_NEVER_PUBLISH_b931/);
  assert.equal(fs.existsSync(path.join(artifactRoot, 'admin')), false);
  assert.equal(fs.existsSync(path.join(artifactRoot, 'api')), false);
});

test('unknown publication status fails closed', { timeout: 30_000 }, () => {
  const fixture = path.join(REPO_ROOT, '.build', 'invalid-status-fixture');
  fs.rmSync(fixture, { recursive: true, force: true });
  fs.mkdirSync(path.join(fixture, 'published', 'posts'), { recursive: true });
  fs.writeFileSync(
    path.join(fixture, 'published', 'posts', 'bad-status.md'),
    '---\ntitle: "Bad status"\nslug: "bad-status"\ndate: "2026-10-01"\nstatus: "publish"\ndescription: "Invalid status."\ntags: [test]\n---\n\nBody.\n',
  );

  const result = run('scripts/validate-content.mjs', ['--source', fixture]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown publication status/);
});
