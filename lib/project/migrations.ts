import {
  PROJECT_VERSION,
  SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  siteProjectSchema,
  type SiteProject,
} from './schema';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}

function idFrom(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const candidate = normalized.length >= 3 ? normalized : fallback;
  return /^[a-z]/.test(candidate) ? candidate : `id-${candidate}`;
}

/** 0.1.0 was an early editor draft. It used loose strings instead of property records. */
function migrate010(input: UnknownRecord): UnknownRecord {
  const pages = Array.isArray(input.pages) ? input.pages : [];
  const migratedPages = pages.map((rawPage, pageIndex) => {
    if (!isRecord(rawPage)) return rawPage;
    const sections = Array.isArray(rawPage.sections) ? rawPage.sections : [];
    return {
      ...rawPage,
      id: typeof rawPage.id === 'string' ? idFrom(rawPage.id, `page-${pageIndex}`) : `page-${pageIndex}`,
      status: rawPage.status ?? 'draft',
      order: typeof rawPage.order === 'number' ? rawPage.order : pageIndex,
      sections: sections.map((rawSection, sectionIndex) => {
        if (!isRecord(rawSection)) return rawSection;
        const components = Array.isArray(rawSection.components) ? rawSection.components : [];
        return {
          ...rawSection,
          id:
            typeof rawSection.id === 'string'
              ? idFrom(rawSection.id, `section-${pageIndex}-${sectionIndex}`)
              : `section-${pageIndex}-${sectionIndex}`,
          type: rawSection.type ?? 'content',
          label: rawSection.label ?? 'Content',
          status: rawSection.status ?? rawPage.status ?? 'draft',
          layout: rawSection.layout ?? 'stack',
          variant: rawSection.variant ?? 'plain',
          components: components.map((rawComponent, componentIndex) => {
            if (!isRecord(rawComponent)) return rawComponent;
            const props: UnknownRecord = isRecord(rawComponent.props) ? rawComponent.props : {};
            const migratedProps = Object.fromEntries(
              Object.entries(props).map(([key, value]) => {
                if (isRecord(value) && 'type' in value && 'value' in value) return [key, value];
                return [
                  key,
                  {
                    id: `prop-${pageIndex}-${sectionIndex}-${componentIndex}-${key}`.slice(0, 96),
                    key,
                    type: Array.isArray(value)
                      ? 'json'
                      : typeof value === 'boolean'
                        ? 'boolean'
                        : typeof value === 'number'
                          ? 'number'
                          : 'text',
                    value,
                    preserveUnknown: true,
                  },
                ];
              }),
            );
            return {
              ...rawComponent,
              id:
                typeof rawComponent.id === 'string'
                  ? idFrom(rawComponent.id, `component-${componentIndex}`)
                  : `component-${componentIndex}`,
              version: rawComponent.version ?? '1.0.0',
              props: migratedProps,
              settings: rawComponent.settings ?? {},
            };
          }),
        };
      }),
    };
  });

  const rawNavigation = isRecord(input.navigation) ? input.navigation : {};
  const navItems = Array.isArray(rawNavigation.items) ? rawNavigation.items : [];
  const theme = isRecord(input.theme) ? input.theme : {};
  const config = isRecord(input.config) ? input.config : {};

  return {
    ...input,
    schemaVersion: SCHEMA_VERSION,
    projectVersion: PROJECT_VERSION,
    id: typeof input.id === 'string' ? idFrom(input.id, 'project-imported') : 'project-imported',
    slug: typeof input.slug === 'string' ? input.slug : 'imported-garden',
    name: typeof input.name === 'string' ? input.name : 'Imported Garden',
    description: typeof input.description === 'string' ? input.description : '',
    status: input.status ?? 'draft',
    createdAt: input.createdAt ?? nowIso(),
    updatedAt: input.updatedAt ?? nowIso(),
    config: {
      name: config.name ?? input.name ?? 'Imported Garden',
      title: config.title ?? config.name ?? input.name ?? 'Imported Garden',
      description: config.description ?? input.description ?? '',
      author: config.author ?? 'Unknown author',
      locale: config.locale ?? 'en_US',
      url: config.url ?? 'https://example.com',
      basePath: config.basePath ?? '',
      socials: config.socials ?? { github: '', email: '', website: '' },
      footer: config.footer ?? '',
      ...config,
    },
    theme: {
      id: theme.id ?? 'theme-imported',
      name: theme.name ?? 'Imported theme',
      mode: theme.mode ?? 'dark',
      colors: {
        background: theme.background ?? '#0b0d10',
        surface: theme.surface ?? '#12161b',
        text: theme.text ?? '#f3efe6',
        muted: theme.muted ?? '#a7a29a',
        accent: theme.accent ?? '#c9a227',
        border: theme.border ?? '#292e35',
        ...(isRecord(theme.colors) ? theme.colors : {}),
      },
      typography: {
        heading: theme.headingFont ?? 'serif',
        body: theme.bodyFont ?? 'sans',
        scale: theme.scale ?? 'balanced',
        ...(isRecord(theme.typography) ? theme.typography : {}),
      },
      spacing: theme.spacing ?? 'cozy',
      radius: theme.radius ?? 'soft',
      contentWidth: theme.contentWidth ?? 'regular',
      ...theme,
    },
    navigation: {
      ...rawNavigation,
      id: rawNavigation.id ?? 'navigation-main',
      items: navItems.map((item, index) => {
        const record = isRecord(item) ? item : {};
        return {
          ...record,
          id: record.id ?? `nav-item-${index}`,
          label: record.label ?? record.href ?? `Item ${index + 1}`,
          href: record.href ?? '/',
          order: record.order ?? index,
          status: record.status ?? 'published',
        };
      }),
    },
    pages: migratedPages,
    contentDocuments: Array.isArray(input.contentDocuments) ? input.contentDocuments : [],
    assets: Array.isArray(input.assets) ? input.assets : [],
    contentRefs: Array.isArray(input.contentRefs) ? input.contentRefs : [],
    migrations: [
      ...(Array.isArray(input.migrations) ? input.migrations.filter((item): item is string => typeof item === 'string') : []),
      '0.1.0 -> 0.5.0',
    ],
    metadata: isRecord(input.metadata) ? input.metadata : {},
  };
}

export type MigrationResult = {
  project: SiteProject;
  migrated: boolean;
  steps: string[];
};

export function migrateProject(input: unknown): MigrationResult {
  if (!isRecord(input)) throw new Error('Project import must be a JSON object.');

  let candidate: UnknownRecord = { ...input };
  let schemaVersion = typeof candidate.schemaVersion === 'string' ? candidate.schemaVersion : '0.1.0';
  const steps: string[] = [];

  if (!SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion as (typeof SUPPORTED_SCHEMA_VERSIONS)[number])) {
    throw new Error(
      `Unsupported project schema ${JSON.stringify(schemaVersion)}. Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
    );
  }

  if (schemaVersion === '0.1.0') {
    candidate = migrate010(candidate);
    steps.push('0.1.0 -> 0.5.0');
    schemaVersion = SCHEMA_VERSION;
  }

  const parsed = siteProjectSchema.safeParse(candidate);
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 12)
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Project migration failed validation: ${details}`);
  }

  return {
    project: parsed.data,
    migrated: steps.length > 0,
    steps,
  };
}

export function projectToJson(project: SiteProject) {
  return `${JSON.stringify(project, null, 2)}\n`;
}
