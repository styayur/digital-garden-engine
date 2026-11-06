'use client';

import type { SiteProject } from './project/schema';

type DesktopFile = { path: string; dataBase64: string };

export function isDesktopRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function chooseDesktopDirectory() {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({ directory: true, multiple: false, title: 'Choose a Rhizomaybor project directory' });
  return typeof selected === 'string' ? selected : null;
}

export async function loadDesktopProject(root: string): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<string>('load_project', { root });
}

export async function saveDesktopProject(root: string, project: SiteProject) {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<string>('save_project', { root, projectJson: JSON.stringify(project, null, 2) });
}

export async function writeDesktopFiles(root: string, files: Array<{ path: string; content: string | Uint8Array }>) {
  const { invoke } = await import('@tauri-apps/api/core');
  const payload: DesktopFile[] = files.map((file) => ({
    path: file.path,
    dataBase64: bytesToBase64(typeof file.content === 'string' ? new TextEncoder().encode(file.content) : file.content),
  }));
  return invoke<string[]>('write_project_files', { root, files: payload });
}

export async function saveDesktopArchive(root: string, filename: string, bytes: Uint8Array) {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<string>('save_binary_file', { root, filename, dataBase64: bytesToBase64(bytes) });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}
