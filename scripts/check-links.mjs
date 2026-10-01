import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { REPO_ROOT, parseArgs, walkFiles } from './lib/content-utils.mjs';

const args = parseArgs();
const out = path.resolve(REPO_ROOT, args.output || process.env.DIGITAL_GARDEN_OUTPUT_DIR || 'out');
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

if (!fs.existsSync(out)) {
  console.error(`out directory does not exist: ${out}`);
  process.exit(1);
}

function internalTarget(rawHref, fromFile) {
  const href = rawHref.replaceAll('&amp;', '&').trim();
  if (!href || href.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(href)) return null;
  let pathname;
  try {
    const url = new URL(href, siteUrl);
    const site = new URL(siteUrl);
    if (/^https?:/i.test(href) && url.hostname !== site.hostname) return null;
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new Error(`Invalid URL ${href} in ${path.relative(out, fromFile)}`);
  }

  pathname = pathname.replace(/^\/+/, '');
  const candidates = [];
  if (!pathname) candidates.push('index.html');
  else if (pathname.endsWith('/')) candidates.push(path.join(pathname, 'index.html'));
  else {
    candidates.push(pathname);
    if (!path.extname(pathname)) {
      candidates.push(`${pathname}.html`);
      candidates.push(path.join(pathname, 'index.html'));
    }
  }
  return candidates.map((candidate) => path.join(out, candidate));
}

let checked = 0;
const broken = [];
for (const file of walkFiles(out).filter((candidate) => candidate.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)) {
    const targets = internalTarget(match[1], file);
    if (!targets) continue;
    checked += 1;
    if (!targets.some((target) => fs.existsSync(target))) {
      broken.push(`${path.relative(out, file)} -> ${match[1]}`);
    }
  }
}

if (broken.length > 0) {
  console.error(`Broken internal links (${broken.length}):`);
  for (const item of broken.slice(0, 50)) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Internal link check passed: ${checked} link(s) across the static export.`);
