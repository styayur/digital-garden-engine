import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

import { getPostsDirectory } from '@/lib/content-root';
import { readingTime } from '@/lib/utils';

export type PostMaturity = 'seedling' | 'budding' | 'evergreen';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  maturity?: PostMaturity;
  updated?: string;
}

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

export interface Post extends PostMeta {
  body: string;
  toc: TocItem[];
  readingTime: string;
}

const MATURITIES: PostMaturity[] = ['seedling', 'budding', 'evergreen'];

function toIsoDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return value.slice(0, 10);
  }
  return '';
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string');
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  let inFence = false;

  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const text = match[2].replace(/[*_`]/g, '').trim();
    toc.push({ depth: match[1].length, text, id: slugger.slug(text) });
  }
  return toc;
}

function sourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => /\.(md|mdx)$/i.test(file))
    .map((file) => file.replace(/\.(md|mdx)$/i, ''));
}

function readPost(slug: string): Post {
  const directory = getPostsDirectory();
  const mdPath = path.join(directory, `${slug}.md`);
  const mdxPath = path.join(directory, `${slug}.mdx`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const meta = data as Record<string, unknown>;

  return {
    slug,
    title: typeof meta.title === 'string' ? meta.title : slug.replace(/-/g, ' '),
    date: toIsoDate(meta.date) || '1970-01-01',
    description: typeof meta.description === 'string' ? meta.description : '',
    tags: parseTags(meta.tags),
    maturity: MATURITIES.includes(meta.maturity as PostMaturity)
      ? (meta.maturity as PostMaturity)
      : undefined,
    updated: toIsoDate(meta.updated) || undefined,
    body: content,
    toc: buildToc(content),
    readingTime: readingTime(content),
  };
}

export function getAllPosts(): Post[] {
  return sourceFiles(getPostsDirectory())
    .map(readPost)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): Post | undefined {
  const directory = getPostsDirectory();
  const exists = fs.existsSync(path.join(directory, `${slug}.mdx`)) ||
    fs.existsSync(path.join(directory, `${slug}.md`));
  return exists ? readPost(slug) : undefined;
}

export function getLatestPosts(count = 3): Post[] {
  return getAllPosts().slice(0, count);
}

export function relatedPosts(post: Post, count = 3): PostMeta[] {
  return getAllPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      overlap: candidate.tags.filter((tag) => post.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.candidate.date.localeCompare(a.candidate.date),
    )
    .slice(0, count)
    .map(({ candidate }) => toMeta(candidate));
}

export function toMeta(post: Post): PostMeta {
  const { body: _body, toc: _toc, readingTime: _readingTime, ...meta } = post;
  return meta;
}

