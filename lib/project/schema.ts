import { z } from 'zod';

export const PROJECT_VERSION = '0.5.0';
export const SCHEMA_VERSION = '0.5.0';
export const SUPPORTED_SCHEMA_VERSIONS = ['0.1.0', '0.5.0'] as const;

export const publicationStatusSchema = z.enum(['published', 'draft', 'private']);
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;

export const componentPropertyTypeSchema = z.enum([
  'text',
  'rich-text',
  'html',
  'image',
  'link',
  'boolean',
  'number',
  'select',
  'color',
  'card-list',
  'json',
]);
export type ComponentPropertyType = z.infer<typeof componentPropertyTypeSchema>;

const idSchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z][a-z0-9_-]*$/, 'IDs must start with a letter and contain only lowercase letters, numbers, _ or -');

const isoDateSchema = z.string().datetime({ offset: true }).or(z.string().date());

/** A property is intentionally open so a newer editor can retain fields it does not understand. */
export const componentPropertySchema = z
  .object({
    id: idSchema,
    key: z.string().min(1).max(80),
    type: componentPropertyTypeSchema,
    value: z.unknown(),
    label: z.string().max(120).optional(),
    description: z.string().max(500).optional(),
    preserveUnknown: z.boolean().default(true),
  })
  .passthrough();
export type ComponentProperty = z.infer<typeof componentPropertySchema>;

export const componentSchema = z
  .object({
    id: idSchema,
    type: z.string().min(1).max(80),
    version: z.string().min(1).max(32).default('1.0.0'),
    label: z.string().max(160).optional(),
    props: z.record(z.string(), componentPropertySchema).default({}),
    settings: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();
export type Component = z.infer<typeof componentSchema>;

export const sectionSchema = z
  .object({
    id: idSchema,
    type: z.string().min(1).max(80),
    label: z.string().max(160).optional(),
    status: publicationStatusSchema,
    layout: z.string().min(1).max(64),
    variant: z.string().min(1).max(64).optional(),
    components: z.array(componentSchema),
    settings: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();
export type Section = z.infer<typeof sectionSchema>;

export const pageSchema = z
  .object({
    id: idSchema,
    slug: z.string().min(1).max(160).regex(/^\/?(?:[a-z0-9-]+\/?)*$/),
    title: z.string().min(1).max(200),
    description: z.string().max(500).default(''),
    status: publicationStatusSchema,
    navigationLabel: z.string().max(80).optional(),
    order: z.number().int().min(0).default(0),
    sections: z.array(sectionSchema),
    seo: z
      .object({
        title: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
        imageAssetId: idSchema.optional(),
        noIndex: z.boolean().default(false),
      })
      .passthrough()
      .default({ noIndex: false }),
  })
  .passthrough();
export type Page = z.infer<typeof pageSchema>;

export const contentFormatSchema = z.enum(['markdown', 'mdx', 'html']);
export type ContentFormat = z.infer<typeof contentFormatSchema>;

export const contentDocumentSchema = z
  .object({
    id: idSchema,
    kind: z.enum(['page', 'post', 'project', 'library', 'about', 'custom']),
    slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1).max(200),
    description: z.string().max(500).default(''),
    date: z.string().date().optional(),
    updatedAt: isoDateSchema.optional(),
    tags: z.array(z.string().max(80)).default([]),
    status: publicationStatusSchema,
    format: contentFormatSchema,
    body: z.string(),
    /** Keep the original serialized format so an HTML document is never silently converted to Markdown. */
    sourceFormat: contentFormatSchema.optional(),
    unsupportedHtml: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();
export type ContentDocument = z.infer<typeof contentDocumentSchema>;

export const assetSchema = z
  .object({
    id: idSchema,
    path: z.string().min(1).max(300).regex(/^[a-zA-Z0-9._/-]+$/),
    name: z.string().min(1).max(200),
    mediaType: z.string().min(1).max(120),
    status: publicationStatusSchema,
    size: z.number().int().min(0).default(0),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: z.string().max(500).optional(),
    checksum: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    dataBase64: z.string().optional(),
  })
  .passthrough();
export type Asset = z.infer<typeof assetSchema>;

export const siteConfigSchema = z
  .object({
    name: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    description: z.string().max(500),
    author: z.string().min(1).max(160),
    locale: z.string().min(2).max(32).default('en_US'),
    url: z.string().url(),
    basePath: z.string().max(120).default(''),
    socials: z
      .object({
        github: z.string().url().or(z.literal('')).default(''),
        email: z.string().email().or(z.literal('')).default(''),
        website: z.string().url().or(z.literal('')).default(''),
      })
      .passthrough()
      .default({ github: '', email: '', website: '' }),
    footer: z.string().max(500).default(''),
  })
  .passthrough();
export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const themeSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).max(120),
    mode: z.enum(['light', 'dark']).default('dark'),
    colors: z
      .object({
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        muted: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        border: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      })
      .passthrough(),
    typography: z
      .object({
        heading: z.enum(['serif', 'sans', 'mono']),
        body: z.enum(['serif', 'sans', 'mono']),
        scale: z.enum(['compact', 'balanced', 'expressive']),
      })
      .passthrough(),
    spacing: z.enum(['compact', 'cozy', 'spacious']),
    radius: z.enum(['none', 'soft', 'round']),
    contentWidth: z.enum(['narrow', 'regular', 'wide']),
  })
  .passthrough();
export type Theme = z.infer<typeof themeSchema>;

export const navigationItemSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1).max(80),
    href: z.string().min(1).max(300),
    pageId: idSchema.optional(),
    order: z.number().int().min(0),
    status: publicationStatusSchema,
  })
  .passthrough();
export type NavigationItem = z.infer<typeof navigationItemSchema>;

export const navigationSchema = z
  .object({
    id: idSchema,
    items: z.array(navigationItemSchema),
  })
  .passthrough();
export type Navigation = z.infer<typeof navigationSchema>;

export const exportManifestSchema = z
  .object({
    manifestVersion: z.literal('1.0.0'),
    projectVersion: z.string(),
    schemaVersion: z.literal(SCHEMA_VERSION),
    archiveMode: z.enum(['project', 'website']),
    createdAt: z.string().datetime({ offset: true }),
    build: z
      .object({
        tool: z.literal('rhizomaybor'),
        toolVersion: z.string(),
        nodeVersion: z.string().optional(),
        platform: z.string().optional(),
      })
      .passthrough(),
    files: z.array(
      z
        .object({
          path: z.string(),
          bytes: z.number().int().min(0),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
        })
        .passthrough(),
    ),
    excluded: z
      .array(
        z
          .object({
            path: z.string(),
            reason: z.string(),
            status: publicationStatusSchema.optional(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();
export type ExportManifest = z.infer<typeof exportManifestSchema>;

const contentDocumentRefSchema = z
  .object({
    id: idSchema,
    documentId: idSchema,
    label: z.string().max(160).optional(),
    format: contentFormatSchema.optional(),
  })
  .passthrough();

export const siteProjectSchema = z
  .object({
    schemaVersion: z.string().min(1),
    projectVersion: z.string().min(1),
    id: idSchema,
    slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).default(''),
    status: publicationStatusSchema.default('draft'),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    config: siteConfigSchema,
    theme: themeSchema,
    navigation: navigationSchema,
    pages: z.array(pageSchema).min(1),
    contentDocuments: z.array(contentDocumentSchema).default([]),
    assets: z.array(assetSchema).default([]),
    contentRefs: z.array(contentDocumentRefSchema).default([]),
    migrations: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();
export type SiteProject = z.infer<typeof siteProjectSchema>;

export type ValidationIssue = {
  path: string;
  message: string;
  severity: 'error' | 'warning';
};

export type ProjectValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export function cloneProject(project: SiteProject): SiteProject {
  return structuredClone(project);
}
