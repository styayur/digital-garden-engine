import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Tauri embeds frontendDist at compile time. A minimal placeholder lets Rust
// filesystem tests run before the full static frontend build in CI.
const out = path.resolve('out');
fs.mkdirSync(out, { recursive: true });
const index = path.join(out, 'index.html');
if (!fs.existsSync(index)) {
  fs.writeFileSync(index, '<!doctype html><html><body>Rhizomaybor desktop test shell</body></html>\n', 'utf8');
}
const result = spawnSync('cargo', ['test', '--manifest-path', 'src-tauri/Cargo.toml'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
