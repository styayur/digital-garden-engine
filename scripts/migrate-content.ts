import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import {
  PROJECT_VERSION,
  SCHEMA_VERSION,
  siteProjectSchema,
  type Component,
  type ContentDocument,
  type Page,
  type SiteProject,
} from '../lib/project/schema';
import { createComponent, createSection } from '../lib/project/registry';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const argValue = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? path.resolve(ROOT, args[index + 1]) : fallback;
};
const sourceRoot = argValue('source', path.join(ROOT, 'examples', 'content'));
const output = argValue('output', path.join(ROOT, 'examples', 'project', 'rhizomaybor.project.json'));
const includeUnpublished = args.includes('--include-unpublished');

function walk(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : entry.isFile() ? [full] : [];
  });
}

function readDocuments(directory: string, kind: ContentDocument['kind']): ContentDocument[] {
  return walk(directory)
    .filter((file) => /\.(md|mdx)$/i.test(file))
    .map((file) => {
      const parsed = matter(fs.readFileSync(file, 'utf8'));
      const data = parsed.data as Record<string, unknown>;
      const extension = path.extname(file).toLowerCase();
      const fallbackSlug = path.basename(file, extension);
      const status = ['published', 'draft', 'private'].includes(String(data.status))
        ? (data.status as ContentDocument['status'])
        : 'draft';
      return {
        id: `doc-${kind}-${String(data.slug ?? fallbackSlug).replace(/[^a-z0-9-]/g, '-').slice(0, 50)}`,
        kind,
        slug: typeof data.slug === 'string' ? data.slug : fallbackSlug,
        title: typeof data.title === 'string' ? data.title : fallbackSlug,
        description: typeof data.description === 'string' ? data.description : '',
        date: typeof data.date === 'string' ? data.date.slice(0, 10) : undefined,
        updatedAt: typeof data.updated === 'string' ? `${data.updated.slice(0, 10)}T00:00:00.000Z` : undefined,
        tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
        status,
        format: extension === '.mdx' ? 'mdx' as const : 'markdown' as const,
        sourceFormat: extension === '.mdx' ? 'mdx' as const : 'markdown' as const,
        body: parsed.content.trim(),
        unsupportedHtml: [],
        metadata: data,
      };
    });
}

function component(type: string, id: string, values: Record<string, unknown>): Component {
  const created = createComponent(type);
  return {
    ...created,
    id,
    props: Object.fromEntries(
      Object.entries(created.props).map(([key, property]) => [
        key,
        values[key] === undefined ? property : { ...property, value: values[key] },
      ]),
    ),
  };
}

function section(id: string, type: string, layout: string, variant: string, components: Component[]) {
  const created = createSection(type);
  return { ...created, id, layout, variant, status: 'published' as const, components };
}

const aboutBody = `<p>This fictional profile demonstrates direct HTML editing in a supported garden section.</p>
<aside class="about-note" data-preserved="true"><strong>Preserved structure.</strong> Unknown safe elements and data attributes travel with the document.</aside>
<rhizome-note data-preserved="true">This custom element remains in source mode until it is intentionally converted.</rhizome-note>
<h2>How this project is organised</h2>
<p>Content, layout, theme and publication state are separate. The editor changes a stable project model, never the rendered DOM.</p>
<ul><li>Writing and project notes remain portable.</li><li>Drafts and private records are excluded from publishable exports.</li><li>Source mode remains available when a visual block needs special handling.</li></ul>`;

const unpublishedDocuments = includeUnpublished
  ? [
      ...readDocuments(path.join(sourceRoot, 'drafts', 'posts'), 'post'),
      ...readDocuments(path.join(sourceRoot, 'private', 'projects'), 'project'),
      ...readDocuments(path.join(sourceRoot, 'private', 'posts'), 'post'),
    ]
  : [];

const documents: ContentDocument[] = [
  ...readDocuments(path.join(sourceRoot, 'published', 'posts'), 'post'),
  ...readDocuments(path.join(sourceRoot, 'published', 'projects'), 'project'),
  ...readDocuments(path.join(sourceRoot, 'published', 'library'), 'library'),
  ...unpublishedDocuments,
  {
    id: 'doc-about-profile',
    kind: 'about',
    slug: 'about',
    title: 'About this garden',
    description: 'A direct HTML content document.',
    tags: [],
    status: 'published',
    format: 'html',
    sourceFormat: 'html',
    body: aboutBody,
    unsupportedHtml: ['rhizome-note'],
    metadata: {},
  },
];

const leafPath = path.join(sourceRoot, 'published', 'assets', 'leaf.svg');
const assets = fs.existsSync(leafPath)
  ? [{
      id: 'asset-leaf',
      path: 'leaf.svg',
      name: 'leaf.svg',
      mediaType: 'image/svg+xml',
      status: 'published' as const,
      size: fs.statSync(leafPath).size,
      alt: 'A small botanical leaf mark',
      dataBase64: fs.readFileSync(leafPath).toString('base64'),
    }]
  : [];

const pages: Page[] = [
  {
    id: 'page-home',
    slug: '/',
    title: 'Home',
    description: 'A demo digital garden built with Rhizomaybor.',
    status: 'published',
    navigationLabel: 'Home',
    order: 0,
    seo: { noIndex: false },
    sections: [
      section('section-home-hero', 'feature', 'split', 'editorial', [
        component('hero', 'component-home-hero', {
          eyebrow: 'Rhizomaybor demo',
          title: 'A digital garden that stays yours',
          description: '<p>Edit content and supported layout in place, then export a portable website with genuine 7z archives.</p>',
          ctaLabel: 'Browse writing',
          ctaHref: '/writing/',
        }),
      ]),
      section('section-home-writing', 'collection', 'grid-3', 'writing', [
        component('collection', 'component-home-writing', { title: 'Latest writing', kind: 'post', limit: 3 }),
      ]),
      section('section-home-note', 'content', 'narrow', 'soft-panel', [
        component('callout', 'component-home-guide', {
          title: 'Constrained by design',
          body: '<p>Components and layouts come from a supported registry. Unknown HTML stays in source mode rather than being silently discarded.</p>',
          tone: 'guide',
        }),
      ]),
    ],
  },
  {
    id: 'page-writing',
    slug: '/writing/',
    title: 'Writing',
    description: 'Essays and notes from the garden.',
    status: 'published',
    navigationLabel: 'Writing',
    order: 1,
    seo: { noIndex: false },
    sections: [
      section('section-writing-intro', 'content', 'narrow', 'plain', [
        component('heading', 'component-writing-heading', {
          title: 'Writing',
          level: '2',
          description: '<p>Notes in progress and essays that have settled.</p>',
        }),
      ]),
      section('section-writing-list', 'collection', 'list', 'writing', [
        component('collection', 'component-writing-list', { title: 'All writing', kind: 'post', limit: 24 }),
      ]),
    ],
  },
  {
    id: 'page-projects',
    slug: '/projects/',
    title: 'Projects',
    description: 'Selected projects and experiments.',
    status: 'published',
    navigationLabel: 'Projects',
    order: 2,
    seo: { noIndex: false },
    sections: [
      section('section-projects-intro', 'content', 'narrow', 'plain', [
        component('heading', 'component-projects-heading', { title: 'Projects', level: '2', description: '<p>Small systems, tools and field notes.</p>' }),
      ]),
      section('section-projects-list', 'collection', 'grid-2', 'projects', [
        component('collection', 'component-projects-list', { title: 'Project index', kind: 'project', limit: 12 }),
      ]),
    ],
  },
  {
    id: 'page-library',
    slug: '/library/',
    title: 'Library',
    description: 'Reading notes and quotations.',
    status: 'published',
    navigationLabel: 'Library',
    order: 3,
    seo: { noIndex: false },
    sections: [
      section('section-library-intro', 'content', 'narrow', 'plain', [
        component('heading', 'component-library-heading', { title: 'Library', level: '2', description: '<p>Books, notes and passages worth returning to.</p>' }),
      ]),
      section('section-library-list', 'collection', 'grid-3', 'library', [
        component('collection', 'component-library-list', { title: 'Reading shelf', kind: 'library', limit: 24 }),
      ]),
    ],
  },
  {
    id: 'page-about',
    slug: '/about/',
    title: 'About',
    description: 'About this fictional garden.',
    status: 'published',
    navigationLabel: 'About',
    order: 4,
    seo: { noIndex: false },
    sections: [
      section('section-about-content', 'content', 'narrow', 'plain', [
        component('richText', 'component-about-content', {
          format: 'html',
          documentId: 'doc-about-profile',
          body: aboutBody,
        }),
      ]),
    ],
  },
];

const project: SiteProject = siteProjectSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  projectVersion: PROJECT_VERSION,
  id: 'project-rhizomaybor-demo',
  slug: 'rhizomaybor-demo',
  name: 'Rhizomaybor Demo Garden',
  description: 'A reusable demonstration project generated from the example content.',
  status: 'published',
  createdAt: '2026-11-06T00:00:00.000Z',
  updatedAt: '2026-11-06T00:00:00.000Z',
  config: {
    name: 'Rhizomaybor',
    title: 'Rhizomaybor Demo Garden',
    description: 'A sample digital garden for essays, projects and reading notes.',
    author: 'Alex Example',
    locale: 'en_GB',
    url: 'https://example.com',
    basePath: '',
    socials: { github: '', email: '', website: '' },
    footer: 'A fictional demonstration project. Built with Rhizomaybor.',
  },
  theme: {
    id: 'theme-garden',
    name: 'Garden dusk',
    mode: 'dark',
    colors: {
      background: '#0b0d10',
      surface: '#12161b',
      text: '#f3efe6',
      muted: '#a7a29a',
      accent: '#c9a227',
      border: '#292e35',
    },
    typography: { heading: 'serif', body: 'sans', scale: 'balanced' },
    spacing: 'cozy',
    radius: 'soft',
    contentWidth: 'regular',
  },
  navigation: {
    id: 'navigation-main',
    items: [
      { id: 'nav-home', label: 'Home', href: '/', pageId: 'page-home', order: 0, status: 'published' },
      { id: 'nav-writing', label: 'Writing', href: '/writing/', pageId: 'page-writing', order: 1, status: 'published' },
      { id: 'nav-projects', label: 'Projects', href: '/projects/', pageId: 'page-projects', order: 2, status: 'published' },
      { id: 'nav-library', label: 'Library', href: '/library/', pageId: 'page-library', order: 3, status: 'published' },
      { id: 'nav-about', label: 'About', href: '/about/', pageId: 'page-about', order: 4, status: 'published' },
    ],
  },
  pages,
  contentDocuments: documents,
  assets,
  contentRefs: [{ id: 'ref-about', documentId: 'doc-about-profile', label: 'About content', format: 'html' }],
  migrations: [],
  metadata: { generatedFrom: 'examples/content', legacySourcePreserved: true },
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(ROOT, output)} with ${documents.length} documents and ${pages.length} pages.`);
