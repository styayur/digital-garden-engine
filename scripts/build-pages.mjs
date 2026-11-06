import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['scripts/build-public.mjs', '--source', 'examples/content', '--output-dir', 'out-pages'], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '/rhizomaybor', NEXT_PUBLIC_SITE_URL: 'https://styayur.github.io/rhizomaybor' },
});
process.exit(result.status ?? 1);
