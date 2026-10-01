import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { getProjectsDirectory } from '@/lib/content-root';

export type ProjectStatus = 'Building' | 'Live' | 'Prototype' | 'Paused' | 'Archived';

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  summary: string;
  year: string;
  status: ProjectStatus;
  stack: string[];
  featured: boolean;
  links: ProjectLink[];
  body: string;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function sourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => /\.(md|mdx)$/i.test(file))
    .map((file) => file.replace(/\.(md|mdx)$/i, ''));
}

function readProject(slug: string): Project {
  const directory = getProjectsDirectory();
  const mdPath = path.join(directory, `${slug}.md`);
  const mdxPath = path.join(directory, `${slug}.mdx`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const meta = data as Record<string, unknown>;

  const links = Array.isArray(meta.links)
    ? meta.links.filter(
        (link): link is ProjectLink =>
          typeof link === 'object' &&
          link !== null &&
          typeof (link as ProjectLink).label === 'string' &&
          typeof (link as ProjectLink).url === 'string',
      )
    : [];

  return {
    slug,
    name: asString(meta.name, slug),
    summary: asString(meta.summary, asString(meta.description)),
    year: asString(meta.year, ''),
    status: (asString(meta.projectStatus) as ProjectStatus) || 'Prototype',
    stack: asStringArray(meta.stack),
    featured: meta.featured === true,
    links,
    body: content,
  };
}

export function getAllProjects(): Project[] {
  return sourceFiles(getProjectsDirectory())
    .map(readProject)
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        b.year.localeCompare(a.year) ||
        a.name.localeCompare(b.name),
    );
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((project) => project.featured);
}
