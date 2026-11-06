import type { SevenZipFactory, SevenZipInstance } from '7z-wasm';
import { withBasePath } from '../base-path';
import type { GeneratedFile } from './render-site';

type ArchiveFile = Pick<GeneratedFile, 'path' | 'content'>;

let browserFactoryPromise: Promise<SevenZipFactory> | null = null;

declare global {
  interface Window {
    SevenZip?: SevenZipFactory;
  }
}

async function getSevenZipFactory(): Promise<SevenZipFactory> {
  if (typeof window === 'undefined') {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<{ default: SevenZipFactory }>;
    return (await dynamicImport('7z-wasm')).default;
  }
  if (window.SevenZip) return window.SevenZip;
  if (!browserFactoryPromise) {
    browserFactoryPromise = new Promise<SevenZipFactory>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = withBasePath('/vendor/7z/7zz.umd.js');
      script.async = true;
      script.onload = () => {
        if (window.SevenZip) resolve(window.SevenZip);
        else reject(new Error('The 7z WASM factory did not register.'));
      };
      script.onerror = () => reject(new Error('Could not load the 7z WASM runtime.'));
      document.head.appendChild(script);
    });
  }
  return browserFactoryPromise;
}
function toBytes(content: string | Uint8Array) {
  return typeof content === 'string' ? new TextEncoder().encode(content) : content;
}

function mkdirp(sevenZip: SevenZipInstance, directory: string) {
  const parts = directory.split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += `/${part}`;
    try {
      sevenZip.FS.mkdir(current);
    } catch (error) {
      const stat = sevenZip.FS.stat(current);
      if (!sevenZip.FS.isDir(stat.mode)) throw error;
    }
  }
}

function safeArchivePath(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('\0')) {
    throw new Error(`Unsafe archive path: ${path}`);
  }
  return normalized;
}

export async function create7zArchive(files: ArchiveFile[], _filename = 'archive.7z'): Promise<Uint8Array> {
  const SevenZip = await getSevenZipFactory();
  const sevenZip = await SevenZip({ noInitialRun: true, print: () => {}, printErr: () => {} });
  const root = '/rhizomaybor-project';
  sevenZip.FS.mkdir(root);

  for (const file of files) {
    const path = safeArchivePath(file.path);
    const absolute = `${root}/${path}`;
    const directory = absolute.slice(0, absolute.lastIndexOf('/'));
    if (directory) mkdirp(sevenZip, directory);
    sevenZip.FS.writeFile(absolute, toBytes(file.content));
  }

  sevenZip.FS.chdir(root);
  sevenZip.callMain(['a', '-t7z', '-mx=5', '/rhizomaybor.7z', '.']);
  const archive = sevenZip.FS.readFile('/rhizomaybor.7z');
  return new Uint8Array(archive);
}

export type ExtractedArchiveFile = {
  path: string;
  bytes: Uint8Array;
};

export async function extract7zArchive(archiveBytes: Uint8Array): Promise<ExtractedArchiveFile[]> {
  const SevenZip = await getSevenZipFactory();
  const sevenZip = await SevenZip({ noInitialRun: true, print: () => {}, printErr: () => {} });
  const root = '/rhizomaybor-extract';
  const archivePath = '/rhizomaybor-input.7z';
  sevenZip.FS.mkdir(root);
  sevenZip.FS.writeFile(archivePath, archiveBytes);
  sevenZip.callMain(['x', archivePath, `-o${root}`, '-y']);

  const results: ExtractedArchiveFile[] = [];
  const walk = (directory: string, prefix = '') => {
    for (const name of sevenZip.FS.readdir(directory)) {
      if (name === '.' || name === '..') continue;
      const absolute = `${directory}/${name}`;
      const stat = sevenZip.FS.stat(absolute);
      const relative = prefix ? `${prefix}/${name}` : name;
      if (sevenZip.FS.isDir(stat.mode)) walk(absolute, relative);
      else results.push({ path: relative, bytes: new Uint8Array(sevenZip.FS.readFile(absolute)) });
    }
  };
  walk(root);
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

export function textFromExtracted(files: ExtractedArchiveFile[], path: string): string | undefined {
  const file = files.find((candidate) => candidate.path === path);
  return file ? new TextDecoder().decode(file.bytes) : undefined;
}
