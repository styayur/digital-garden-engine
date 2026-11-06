import {
  siteProjectSchema,
  type ProjectValidationResult,
  type SiteProject,
  type ValidationIssue,
} from './schema';
import { COMPONENT_BY_TYPE, SECTION_BY_TYPE, componentPropertyString } from './registry';

type ValidationOptions = {
  forExport?: 'project' | 'website';
};

const SECRET_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /CLOUDFLARE_API_TOKEN\s*=/i,
];

const SCRIPT_PATTERN = /<\s*script\b/i;

function issue(
  path: string,
  message: string,
  severity: ValidationIssue['severity'] = 'error',
): ValidationIssue {
  return { path, message, severity };
}

export function normalizePath(path: string) {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

function scanForSecrets(value: unknown, path = 'project', found: ValidationIssue[] = []) {
  if (typeof value === 'string') {
    if (SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
      found.push(issue(path, 'Possible credential or private key detected in project data.'));
    }
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForSecrets(item, `${path}[${index}]`, found));
    return found;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (/^\.env|secret|token|password|apiKey|privateKey/i.test(key) && typeof child === 'string' && child.length > 0) {
        // A field name alone is not proof, but it needs an explicit review before export.
        found.push(issue(`${path}.${key}`, 'Sensitive-looking field must be removed before export.', 'warning'));
      }
      scanForSecrets(child, `${path}.${key}`, found);
    }
  }
  return found;
}

export function validateProject(input: unknown, options: ValidationOptions = {}): ProjectValidationResult {
  const parsed = siteProjectSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((entry) =>
      issue(entry.path.join('.') || 'project', entry.message),
    );
    return { valid: false, errors, warnings: [] };
  }

  const project = parsed.data;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const pagePaths = new Set<string>();
  const pageIds = new Set<string>();
  const documentIds = new Set<string>();
  const assetIds = new Set<string>();
  const assetPaths = new Set<string>();
  const objectIds = new Set<string>();
  const seenObjectIds = (id: string, path: string) => {
    if (objectIds.has(id)) errors.push(issue(path, `Duplicate stable ID "${id}".`));
    objectIds.add(id);
  };

  project.pages.forEach((page, pageIndex) => {
    const path = `pages[${pageIndex}]`;
    seenObjectIds(page.id, `${path}.id`);
    if (pageIds.has(page.id)) errors.push(issue(`${path}.id`, 'Duplicate page ID.'));
    pageIds.add(page.id);

    const normalized = normalizePath(page.slug);
    if (pagePaths.has(normalized)) errors.push(issue(`${path}.slug`, `Duplicate page path ${normalized}.`));
    pagePaths.add(normalized);

    page.sections.forEach((section, sectionIndex) => {
      const sectionPath = `${path}.sections[${sectionIndex}]`;
      seenObjectIds(section.id, `${sectionPath}.id`);
      const definition = SECTION_BY_TYPE.get(section.type);
      if (!definition) errors.push(issue(`${sectionPath}.type`, `Unknown section type "${section.type}".`));
      else {
        if (!definition.layouts.includes(section.layout)) {
          errors.push(issue(`${sectionPath}.layout`, `Layout "${section.layout}" is not supported by ${section.type}.`));
        }
        if (section.components.length > definition.maxComponents) {
          errors.push(issue(`${sectionPath}.components`, `Section exceeds the ${definition.maxComponents}-component limit.`));
        }
      }

      section.components.forEach((component, componentIndex) => {
        const componentPath = `${sectionPath}.components[${componentIndex}]`;
        seenObjectIds(component.id, `${componentPath}.id`);
        const componentDefinition = COMPONENT_BY_TYPE.get(component.type);
        if (!componentDefinition) {
          errors.push(issue(`${componentPath}.type`, `Unknown component type "${component.type}".`));
          return;
        }
        if (!componentDefinition.allowedLayouts.includes(section.layout)) {
          errors.push(issue(`${componentPath}.type`, `Component "${component.type}" is not allowed in layout "${section.layout}".`));
        }
        for (const property of componentDefinition.properties) {
          const stored = component.props[property.key];
          if (!stored) {
            errors.push(issue(`${componentPath}.props.${property.key}`, `Missing component property "${property.key}".`));
            continue;
          }
          if (stored.type !== property.type) {
            errors.push(issue(`${componentPath}.props.${property.key}.type`, `Expected property type ${property.type}.`));
          }
          if (property.required && (stored.value === '' || stored.value === null || stored.value === undefined)) {
            errors.push(issue(`${componentPath}.props.${property.key}.value`, 'Required property is empty.'));
          }
          if (property.type === 'number' && typeof stored.value === 'number') {
            if (property.min !== undefined && stored.value < property.min) {
              errors.push(issue(`${componentPath}.props.${property.key}.value`, `Value must be at least ${property.min}.`));
            }
            if (property.max !== undefined && stored.value > property.max) {
              errors.push(issue(`${componentPath}.props.${property.key}.value`, `Value must be at most ${property.max}.`));
            }
          }
        }
        const assetId = componentPropertyString(component, 'assetId');
        if (component.type === 'image' && assetId && !project.assets.some((asset) => asset.id === assetId)) {
          errors.push(issue(`${componentPath}.props.assetId`, `Asset "${assetId}" does not exist.`));
        }
        const documentId = componentPropertyString(component, 'documentId');
        if (component.type === 'richText' && documentId && !project.contentDocuments.some((document) => document.id === documentId)) {
          errors.push(issue(`${componentPath}.props.documentId`, `Content document "${documentId}" does not exist.`));
        }
      });
    });
  });

  project.contentDocuments.forEach((document, index) => {
    const path = `contentDocuments[${index}]`;
    seenObjectIds(document.id, `${path}.id`);
    if (documentIds.has(document.id)) errors.push(issue(`${path}.id`, 'Duplicate content document ID.'));
    documentIds.add(document.id);
    if (document.format !== document.sourceFormat && document.sourceFormat) {
      warnings.push(issue(`${path}.sourceFormat`, 'Content format differs from its source format; review before publishing.', 'warning'));
    }
    if (document.format === 'html' && SCRIPT_PATTERN.test(document.body)) {
      warnings.push(issue(`${path}.body`, 'Scripts are preserved in source but will not execute in editor previews or exports.', 'warning'));
    }
    if (document.format === 'mdx' && /<[A-Z][A-Za-z0-9]*\b/.test(document.body)) {
      warnings.push(issue(`${path}.body`, 'MDX components are preserved for source editing but are not executed by the standalone website builder.', 'warning'));
    }
  });

  project.assets.forEach((asset, index) => {
    const path = `assets[${index}]`;
    seenObjectIds(asset.id, `${path}.id`);
    if (assetIds.has(asset.id)) errors.push(issue(`${path}.id`, 'Duplicate asset ID.'));
    assetIds.add(asset.id);
    if (assetPaths.has(asset.path)) errors.push(issue(`${path}.path`, `Duplicate asset path ${asset.path}.`));
    assetPaths.add(asset.path);
    if (asset.path.includes('..') || asset.path.startsWith('/') || asset.path.includes('\\')) {
      errors.push(issue(`${path}.path`, 'Asset path must be relative, portable and must not contain traversal segments.'));
    }
  });

  project.navigation.items.forEach((item, index) => {
    const path = `navigation.items[${index}]`;
    seenObjectIds(item.id, `${path}.id`);
    if (item.pageId && !pageIds.has(item.pageId)) {
      errors.push(issue(`${path}.pageId`, `Navigation item references missing page "${item.pageId}".`));
    }
  });

  const knownInternalPaths = new Set(pagePaths);
  for (const page of project.pages) {
    knownInternalPaths.add(normalizePath(page.slug));
  }
  for (const document of project.contentDocuments) {
    if (document.kind === 'post') knownInternalPaths.add(normalizePath(`/writing/${document.slug}`));
    if (document.kind === 'project') knownInternalPaths.add(normalizePath(`/projects/${document.slug}`));
    if (document.kind === 'library') knownInternalPaths.add(normalizePath(`/library/${document.slug}`));
  }

  const inspectInternalLink = (href: string, path: string) => {
    if (!href || !href.startsWith('/') || href.startsWith('//') || href.startsWith('/garden-assets/')) return;
    const withoutHash = href.split('#')[0].split('?')[0];
    const normalized = normalizePath(withoutHash);
    if (normalized !== '/' && !knownInternalPaths.has(normalized) && !knownInternalPaths.has(`${normalized}/`)) {
      warnings.push(issue(path, `Internal link target ${href} has no matching page or document.`, 'warning'));
    }
  };

  project.navigation.items.forEach((item, index) => inspectInternalLink(item.href, `navigation.items[${index}].href`));
  for (const page of project.pages) {
    for (const section of page.sections) {
      for (const component of section.components) {
        inspectInternalLink(componentPropertyString(component, 'href'), `component:${component.id}.href`);
        inspectInternalLink(componentPropertyString(component, 'ctaHref'), `component:${component.id}.ctaHref`);
      }
    }
  }

  warnings.push(...scanForSecrets(project));

  if (options.forExport === 'website') {
    const publishedPages = project.pages.filter((page) => page.status === 'published');
    if (publishedPages.length === 0) {
      errors.push(issue('pages', 'At least one published page is required before website export.'));
    }
    {
      for (const document of project.contentDocuments) {
        if (document.status !== 'published' && document.kind !== 'page') {
          // This is expected. It is listed in the manifest's excluded inventory rather than emitted.
          continue;
        }
      }
      for (const page of publishedPages) {
        const pageSectionIds = new Set(page.sections.map((section) => section.id));
        if (pageSectionIds.size === 0) warnings.push(issue(`page:${page.id}`, 'Published page has no sections.', 'warning'));
        for (const section of page.sections) {
          if (section.status !== 'published') {
            warnings.push(issue(`page:${page.id}.section:${section.id}`, 'Draft/private section will be excluded from the public website.', 'warning'));
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function assertValidProject(input: unknown, options: ValidationOptions = {}) {
  const result = validateProject(input, options);
  if (!result.valid) {
    const error = new Error(`Project validation failed with ${result.errors.length} error(s).`);
    Object.assign(error, { details: result });
    throw error;
  }
  return result;
}

export function projectHasBlockingErrors(result: ProjectValidationResult) {
  return result.errors.length > 0;
}
