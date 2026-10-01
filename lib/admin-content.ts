import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * The admin writes directly into content/published/{posts,projects,library}.
 * Each kind maps to a directory + file extension; a slug becomes a filename.
 */

export const CONTENT_KINDS = {
  posts: {
    label: 'Essays',
    dir: 'posts',
    ext: '.mdx',
    /** Where a saved entry can be viewed on the site. */
    viewPath: (slug: string) => `/writing/${slug}`,
  },
  projects: {
    label: 'Projects',
    dir: 'projects',
    ext: '.mdx',
    viewPath: (slug: string) => `/projects#${slug}`,
  },
  library: {
    label: 'Library',
    dir: 'library',
    ext: '.md',
    viewPath: null,
  },
} as const;

export type ContentKind = keyof typeof CONTENT_KINDS;
export const CONTENT_KIND_KEYS = Object.keys(CONTENT_KINDS) as ContentKind[];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getContentRoot(): string {
  const configured = process.env.DIGITAL_GARDEN_SOURCE_ROOT;
  const gardenRoot = configured
    ? path.resolve(process.cwd(), configured)
    : path.join(process.cwd(), 'content');
  return path.join(gardenRoot, 'published');
}
const MAX_SOURCE_BYTES = 2_000_000;

export function getKindDef(kind: string) {
  if (kind in CONTENT_KINDS) return CONTENT_KINDS[kind as ContentKind];
  return null;
}

export interface AdminListEntry {
  slug: string;
  title: string;
  date?: string;
}

function toDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10);
  return undefined;
}

/** Resolve (and validate) the absolute path for a kind + slug. */
function resolveFilePath(kind: ContentKind, slug: string): string | null {
  if (!SLUG_RE.test(slug)) return null;
  const def = CONTENT_KINDS[kind];
  const dir = path.join(getContentRoot(), def.dir);
  const filePath = path.join(dir, `${slug}${def.ext}`);
  // Defense in depth: the file must sit directly inside the content dir.
  if (path.dirname(filePath) !== dir) return null;
  return filePath;
}

export function listContent(kind: ContentKind): AdminListEntry[] {
  const def = CONTENT_KINDS[kind];
  const dir = path.join(getContentRoot(), def.dir);
  if (!fs.existsSync(dir)) return [];

  const entries: AdminListEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(def.ext)) continue;
    const slug = file.slice(0, -def.ext.length);
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data } = matter(raw);
      entries.push({
        slug,
        title: typeof data.title === 'string' ? data.title : slug,
        date: toDate(data.date),
      });
    } catch {
      entries.push({ slug, title: slug });
    }
  }

  return entries.sort((a, b) => {
    const byDate = String(b.date ?? '').localeCompare(String(a.date ?? ''));
    return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
  });
}

export function readContent(kind: ContentKind, slug: string): string | null {
  const filePath = resolveFilePath(kind, slug);
  if (!filePath || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export interface WriteResult {
  ok: boolean;
  filename: string;
  error?: string;
}

export function writeContent(
  kind: ContentKind,
  slug: string,
  source: string,
): WriteResult {
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      filename: slug,
      error:
        'Invalid slug — use lowercase letters, numbers and single hyphens (e.g. my-first-essay).',
    };
  }
  if (!source || source.trim().length === 0) {
    return { ok: false, filename: slug, error: 'Source cannot be empty.' };
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    return {
      ok: false,
      filename: slug,
      error: 'Source is too large (max 2 MB).',
    };
  }

  // Frontmatter must at least parse; a title is strongly encouraged.
  const parsed = matter(source);
  if (!parsed.data || typeof parsed.data !== 'object') {
    return { ok: false, filename: slug, error: 'Frontmatter could not be parsed.' };
  }

  const filePath = resolveFilePath(kind, slug);
  if (!filePath) {
    return { ok: false, filename: slug, error: 'Could not resolve a safe path.' };
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, source, 'utf8');
  return { ok: true, filename: `${slug}${CONTENT_KINDS[kind].ext}` };
}

export function deleteContent(kind: ContentKind, slug: string): boolean {
  const filePath = resolveFilePath(kind, slug);
  if (!filePath || !fs.existsSync(filePath)) return false;
  fs.rmSync(filePath, { force: true });
  return true;
}
