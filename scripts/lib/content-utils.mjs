import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PUBLICATION_STATUSES = ['published', 'draft', 'private'];
export const STATUS_DIRECTORIES = { published: 'published', draft: 'drafts', private: 'private' };
export const CONTENT_KINDS = ['posts', 'projects', 'library'];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const COMMON_FIELDS = ['title', 'slug', 'date', 'status', 'description', 'tags'];
const KNOWN_FIELDS = {
  posts: [...COMMON_FIELDS, 'maturity', 'updated'],
  projects: [
    ...COMMON_FIELDS,
    'name',
    'summary',
    'year',
    'projectStatus',
    'featured',
    'stack',
    'links',
  ],
  library: [...COMMON_FIELDS, 'kind', 'author', 'readingStatus', 'note'],
};

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function resolveGardenRoot({ source, env = process.env } = {}) {
  const requested = source || env.DIGITAL_GARDEN_SOURCE_ROOT;
  const base = requested
    ? path.resolve(REPO_ROOT, requested)
    : fs.existsSync(path.join(REPO_ROOT, 'content'))
      ? path.join(REPO_ROOT, 'content')
      : path.join(REPO_ROOT, 'examples', 'content');
  const nested = path.join(base, 'content');
  return fs.existsSync(nested) && fs.statSync(nested).isDirectory() ? nested : base;
}

export function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${fullPath}`);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}

function relative(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function asDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateCommon(data, context, errors) {
  for (const field of COMMON_FIELDS) {
    if (!(field in data)) errors.push(`${context}: missing frontmatter field "${field}"`);
  }

  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push(`${context}: "title" must be a non-empty string`);
  }
  if (typeof data.slug !== 'string' || !SLUG_RE.test(data.slug)) {
    errors.push(`${context}: "slug" must use lowercase letters, numbers and single hyphens`);
  }
  if (!asDate(data.date)) {
    errors.push(`${context}: "date" must use YYYY-MM-DD`);
  }
  if (!PUBLICATION_STATUSES.includes(data.status)) {
    errors.push(`${context}: unknown publication status; expected published, draft or private`);
  }
  if (typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push(`${context}: "description" must be a non-empty string`);
  }
  if (
    !Array.isArray(data.tags) ||
    data.tags.some((tag) => typeof tag !== 'string' || tag.trim().length === 0)
  ) {
    errors.push(`${context}: "tags" must be an array of non-empty strings`);
  }
}

function validateKind(data, kind, context, errors) {
  const known = new Set(KNOWN_FIELDS[kind]);
  for (const field of Object.keys(data)) {
    if (!known.has(field)) errors.push(`${context}: unsupported frontmatter field "${field}"`);
  }

  if (kind === 'posts') {
    if (data.maturity !== undefined && !['seedling', 'budding', 'evergreen'].includes(data.maturity)) {
      errors.push(`${context}: "maturity" must be seedling, budding or evergreen`);
    }
  }

  if (kind === 'projects') {
    for (const field of ['name', 'projectStatus']) {
      if (typeof data[field] !== 'string' || data[field].trim().length === 0) {
        errors.push(`${context}: "${field}" must be a non-empty string`);
      }
    }
    if (!['string', 'number'].includes(typeof data.year) || String(data.year).trim().length === 0) {
      errors.push(`${context}: "year" must be a non-empty string or number`);
    }
    if (!['Building', 'Live', 'Prototype', 'Paused', 'Archived'].includes(data.projectStatus)) {
      errors.push(`${context}: unknown projectStatus`);
    }
    if (typeof data.featured !== 'boolean') errors.push(`${context}: "featured" must be boolean`);
    if (!Array.isArray(data.stack)) errors.push(`${context}: "stack" must be an array`);
    if (!Array.isArray(data.links)) errors.push(`${context}: "links" must be an array`);
  }

  if (kind === 'library') {
    if (!['book', 'note', 'quote'].includes(data.kind)) {
      errors.push(`${context}: "kind" must be book, note or quote`);
    }
    if (data.kind === 'book' && !['reading', 'queued', 'read'].includes(data.readingStatus)) {
      errors.push(`${context}: books require readingStatus of reading, queued or read`);
    }
  }
}

function validateAssetReferences(content, status, kind, context, gardenRoot, errors) {
  const assetRoot = path.join(gardenRoot, STATUS_DIRECTORIES[status], 'assets');
  for (const match of content.matchAll(/!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const raw = match[1];
    if (!raw.startsWith('/garden-assets/')) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/, 1)[0]).replace(/^\/garden-assets\//, '');
    const segments = clean.split('/');
    if (segments.some((segment) => !segment || segment === '..' || segment === '.')) {
      errors.push(`${context}: unsafe asset reference`);
      continue;
    }
    const target = path.join(assetRoot, ...segments);
    if (!target.startsWith(assetRoot + path.sep) || !fs.existsSync(target)) {
      errors.push(`${context}: referenced asset is missing`);
    }
  }

  if (kind === 'posts') {
    for (const match of content.matchAll(/\]\(\/writing\/([a-z0-9-]+)\/?\)/g)) {
      const targetKind = 'posts';
      const candidates = [
        path.join(gardenRoot, 'published', targetKind, `${match[1]}.mdx`),
        path.join(gardenRoot, 'published', targetKind, `${match[1]}.md`),
      ];
      if (!candidates.some((candidate) => fs.existsSync(candidate))) {
        errors.push(`${context}: internal link points to an unpublished or missing essay`);
      }
    }
  }
}

export function validateContent(gardenRoot) {
  const errors = [];
  const counts = { published: 0, draft: 0, private: 0 };
  const seen = new Set();

  for (const status of PUBLICATION_STATUSES) {
    const statusRoot = path.join(gardenRoot, STATUS_DIRECTORIES[status]);
    for (const kind of CONTENT_KINDS) {
      const kindRoot = path.join(statusRoot, kind);
      if (!fs.existsSync(kindRoot)) continue;

      for (const file of walkFiles(kindRoot)) {
        if (!/\.(md|mdx)$/i.test(file)) continue;
        const rel = relative(gardenRoot, file);
        const context = status === 'published' ? rel : `${status}/<redacted>`;
        const basename = path.basename(file);
        if (path.dirname(file) !== kindRoot) {
          errors.push(`${context}: content must sit directly inside ${kind}/`);
          continue;
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.(md|mdx)$/i.test(basename)) {
          errors.push(`${context}: dangerous or unsupported filename`);
          continue;
        }

        let parsed;
        try {
          parsed = matter(fs.readFileSync(file, 'utf8'));
        } catch {
          errors.push(`${context}: frontmatter could not be parsed`);
          continue;
        }

        const data = parsed.data;
        if (!isPlainObject(data)) {
          errors.push(`${context}: frontmatter is required`);
          continue;
        }

        validateCommon(data, context, errors);
        validateKind(data, kind, context, errors);

        const fileSlug = basename.replace(/\.(md|mdx)$/i, '');
        if (data.slug !== fileSlug) errors.push(`${context}: slug must match filename`);
        if (data.status !== status) errors.push(`${context}: status must match its directory`);
        if (data.status === 'published' && status !== 'published') {
          errors.push(`${context}: only published/ may contain status published`);
        }

        const duplicateKey = `${kind}:${data.slug}`;
        if (typeof data.slug === 'string') {
          if (seen.has(duplicateKey)) errors.push(`${context}: duplicate slug within ${kind}`);
          seen.add(duplicateKey);
        }

        validateAssetReferences(parsed.content, status, kind, context, gardenRoot, errors);
        counts[status] += 1;
      }
    }
  }

  return { errors, counts };
}

export function collectPrivateFingerprints(gardenRoot) {
  const fingerprints = [];
  for (const status of ['draft', 'private']) {
    for (const kind of CONTENT_KINDS) {
      for (const file of walkFiles(path.join(gardenRoot, STATUS_DIRECTORIES[status], kind))) {
        if (!/\.(md|mdx)$/i.test(file)) continue;
        try {
          const parsed = matter(fs.readFileSync(file, 'utf8'));
          const data = parsed.data ?? {};
          for (const value of [data.title, data.slug, data.description, ...(Array.isArray(data.tags) ? data.tags : [])]) {
            if (typeof value === 'string' && value.trim().length >= 8) {
              fingerprints.push({ status, kind, type: 'frontmatter', value: value.trim() });
            }
          }
          for (const line of parsed.content.split(/\r?\n/)) {
            const value = line.replace(/[#>*_`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
            if (value.length >= 32) fingerprints.push({ status, kind, type: 'body', value });
          }
        } catch {
          fingerprints.push({ status, kind, type: 'unparseable', value: '' });
        }
      }
    }
  }
  return fingerprints.filter((item) => item.value);
}

export function countStatuses(gardenRoot) {
  return validateContent(gardenRoot).counts;
}




