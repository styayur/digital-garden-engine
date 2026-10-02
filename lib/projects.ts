import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { getProjectsDirectory } from '@/lib/content-root';

export type ProjectStatus = 'stable' | 'beta' | 'research' | 'experimental' | 'maintenance';

export type ProjectCategory =
  | 'systems'
  | 'knowledge'
  | 'creative'
  | 'education'
  | 'humanities'
  | 'experiments'
  | 'utilities'
  | 'concepts';

export const PROJECT_CATEGORIES: Array<{ value: ProjectCategory; label: string }> = [
  { value: 'systems', label: 'Systems & Developer Tools' },
  { value: 'knowledge', label: 'Knowledge & Science' },
  { value: 'creative', label: 'Creative & Personal Tools' },
  { value: 'education', label: 'Education' },
  { value: 'humanities', label: 'Digital Humanities' },
  { value: 'experiments', label: 'Experiments' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'concepts', label: 'Concepts & Research' },
];

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  summary: string;
  description: string;
  year: string;
  status: ProjectStatus;
  category: ProjectCategory;
  featured: boolean;
  priority: number;
  stack: string[];
  links: ProjectLink[];
  github?: string;
  live?: string;
  release?: string;
  image?: string;
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

function asUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

  const category = asString(meta.category) as ProjectCategory;
  const validCategories = PROJECT_CATEGORIES.map((entry) => entry.value) as string[];

  return {
    slug,
    name: asString(meta.name, slug),
    summary: asString(meta.summary, asString(meta.description)),
    description: asString(meta.description),
    year: asString(meta.year, ''),
    status: (asString(meta.projectStatus) as ProjectStatus) || 'experimental',
    category: validCategories.includes(category) ? category : 'concepts',
    featured: meta.featured === true,
    priority: typeof meta.priority === 'number' ? meta.priority : 0,
    stack: asStringArray(meta.stack),
    links,
    github: asUrl(meta.github),
    live: asUrl(meta.live),
    release: asUrl(meta.release),
    image: asUrl(meta.image),
    body: content,
  };
}

export function getAllProjects(): Project[] {
  return sourceFiles(getProjectsDirectory())
    .map(readProject)
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        b.priority - a.priority ||
        b.year.localeCompare(a.year) ||
        a.name.localeCompare(b.name),
    );
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((project) => project.featured);
}

export function getProjectsByCategory(): Map<ProjectCategory, Project[]> {
  const grouped = new Map<ProjectCategory, Project[]>();
  for (const project of getAllProjects()) {
    const bucket = grouped.get(project.category) ?? [];
    bucket.push(project);
    grouped.set(project.category, bucket);
  }
  return grouped;
}
