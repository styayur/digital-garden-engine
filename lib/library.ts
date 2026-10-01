import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { getLibraryDirectory } from '@/lib/content-root';

export type LibraryKind = 'book' | 'note' | 'quote';
export type ReadingStatus = 'reading' | 'queued' | 'read';

export interface LibraryEntry {
  slug: string;
  kind: LibraryKind;
  title: string;
  author?: string;
  readingStatus?: ReadingStatus;
  date?: string;
  description: string;
  note?: string;
  tags: string[];
  body: string;
}

function sourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => /\.(md|mdx)$/i.test(file))
    .map((file) => file.replace(/\.(md|mdx)$/i, ''));
}

function readEntry(slug: string): LibraryEntry {
  const directory = getLibraryDirectory();
  const mdPath = path.join(directory, `${slug}.md`);
  const mdxPath = path.join(directory, `${slug}.mdx`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const meta = data as Record<string, unknown>;
  const str = (key: string) =>
    typeof meta[key] === 'string' ? (meta[key] as string) : undefined;

  return {
    slug,
    kind: (str('kind') as LibraryKind) || 'note',
    title: str('title') ?? slug,
    author: str('author'),
    readingStatus: str('readingStatus') as ReadingStatus | undefined,
    date: str('date'),
    description: str('description') ?? '',
    note: str('note'),
    tags: Array.isArray(meta.tags)
      ? meta.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    body: content.trim(),
  };
}

export function getAllLibrary(): LibraryEntry[] {
  return sourceFiles(getLibraryDirectory()).map(readEntry);
}

const STATUS_ORDER: Record<ReadingStatus, number> = {
  reading: 0,
  queued: 1,
  read: 2,
};

export function getBooks(): LibraryEntry[] {
  return getAllLibrary()
    .filter((entry) => entry.kind === 'book')
    .sort((a, b) => {
      const order =
        (STATUS_ORDER[a.readingStatus ?? 'read'] ?? 2) -
        (STATUS_ORDER[b.readingStatus ?? 'read'] ?? 2);
      return order !== 0 ? order : a.title.localeCompare(b.title);
    });
}

export function getNotes(): LibraryEntry[] {
  return getAllLibrary()
    .filter((entry) => entry.kind === 'note')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function getQuotes(): LibraryEntry[] {
  return getAllLibrary().filter((entry) => entry.kind === 'quote');
}
