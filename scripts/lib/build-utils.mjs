import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { REPO_ROOT } from './content-utils.mjs';

export const NEXT_BIN = path.join(REPO_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

export function runNext(args, env) {
  const result = spawnSync(process.execPath, [NEXT_BIN, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new BuildCommandError(args.join(' '), result.status ?? 1);
}

export function runScript(script, args = [], env = {}) {
  const result = spawnSync(process.execPath, [path.join(REPO_ROOT, script), ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new BuildCommandError(args.join(' '), result.status ?? 1);
}

export function installStagedAssets(assetsOutput) {
  const target = path.join(REPO_ROOT, 'public', 'garden-assets');
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  if (!fs.existsSync(assetsOutput)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(assetsOutput, target, { recursive: true });
  return true;
}

export function removeStagedAssets() {
  fs.rmSync(path.join(REPO_ROOT, 'public', 'garden-assets'), { recursive: true, force: true });
}

export function excludePublicRoutes() {
  const moves = [
    ['app/admin', '.build/excluded-admin'],
    ['app/api', '.build/excluded-api'],
  ];
  const completed = [];
  for (const [source, destination] of moves) {
    const sourcePath = path.join(REPO_ROOT, source);
    const destinationPath = path.join(REPO_ROOT, destination);
    fs.rmSync(destinationPath, { recursive: true, force: true });
    if (fs.existsSync(sourcePath)) {
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.renameSync(sourcePath, destinationPath);
      completed.push([sourcePath, destinationPath]);
    }
  }
  return () => {
    for (const [sourcePath, destinationPath] of completed.reverse()) {
      fs.rmSync(sourcePath, { recursive: true, force: true });
      if (fs.existsSync(destinationPath)) fs.renameSync(destinationPath, sourcePath);
    }
  };
}

export function copyExport(source, destination) {
  const resolvedSource = path.resolve(REPO_ROOT, source);
  const resolvedDestination = path.resolve(REPO_ROOT, destination);
  if (resolvedSource === resolvedDestination) return;
  fs.rmSync(resolvedDestination, { recursive: true, force: true });
  fs.cpSync(resolvedSource, resolvedDestination, { recursive: true });
}

export class BuildCommandError extends Error {
  constructor(command, status) {
    super(`${command} failed with exit code ${status}`);
    this.name = 'BuildCommandError';
    this.status = status;
  }
}


