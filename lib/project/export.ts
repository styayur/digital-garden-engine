import { PROJECT_VERSION, SCHEMA_VERSION, type ExportManifest, type SiteProject } from './schema';
import { buildStandaloneSite, type GeneratedFile } from './render-site';
import type { HtmlSanitizer } from './content';
import { assertValidProject } from './validation';

export type ArchiveMode = 'project' | 'website';

export type ExportPlan = {
  mode: ArchiveMode;
  files: GeneratedFile[];
  manifest: ExportManifest;
  suggestedFilename: string;
};

export type ArchiveResult = {
  bytes: Uint8Array;
  filename: string;
  manifest: ExportManifest;
};

function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === 'string' ? new TextEncoder().encode(content) : content;
}

export async function sha256Hex(content: string | Uint8Array): Promise<string> {
  const bytes = toBytes(content);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sanitizePath(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('\0')) {
    throw new Error(`Unsafe archive path: ${path}`);
  }
  return normalized;
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function createExportPlan(
  project: SiteProject,
  mode: ArchiveMode,
  sanitize: HtmlSanitizer,
  now = new Date(),
): Promise<ExportPlan> {
  assertValidProject(project, { forExport: mode });

  let files: GeneratedFile[] = [];
  const excluded: ExportManifest['excluded'] = [];

  if (mode === 'project') {
    files.push({
      path: 'rhizomaybor.project.json',
      content: `${JSON.stringify(project, null, 2)}\n`,
      mediaType: 'application/json',
    });
    files.push({
      path: 'README.txt',
      content:
        'Rhizomaybor editable project archive\n\n' +
        'Import rhizomaybor.project.json into the editor to continue editing.\n' +
        'The project JSON is the source of truth. The manifest records file integrity.\n',
      mediaType: 'text/plain',
    });
    for (const asset of project.assets) {
      if (!asset.dataBase64) continue;
      files.push({
        path: sanitizePath(`assets/${asset.path}`),
        content: Uint8Array.from(atob(asset.dataBase64), (character) => character.charCodeAt(0)),
        mediaType: asset.mediaType,
      });
    }
    for (const document of project.contentDocuments) {
      if (document.status === 'published') continue;
      excluded.push({
        path: `contentDocuments/${document.slug}`,
        reason: 'Included inside the editable project JSON with its publication status; not rendered as a public page.',
        status: document.status,
      });
    }
  } else {
    const site = await buildStandaloneSite(project, sanitize);
    files = site.files;
    for (const document of site.excludedDocuments) {
      excluded.push({
        path: `contentDocuments/${document.slug}`,
        reason: 'Draft or private document excluded from the publishable website.',
        status: document.status,
      });
    }
    for (const asset of project.assets) {
      if (asset.status !== 'published') {
        excluded.push({
          path: `assets/${asset.path}`,
          reason: 'Draft or private asset excluded from the publishable website.',
          status: asset.status,
        });
      }
    }
    for (const page of project.pages) {
      if (page.status !== 'published') {
        excluded.push({
          path: `pages/${page.slug}`,
          reason: 'Draft or private page excluded from the publishable website.',
          status: page.status,
        });
      }
      for (const section of page.sections) {
        if (section.status !== 'published') {
          excluded.push({
            path: `pages/${page.slug}/sections/${section.id}`,
            reason: 'Draft or private section excluded from the publishable website.',
            status: section.status,
          });
        }
      }
    }
  }

  files = files.map((file) => ({ ...file, path: sanitizePath(file.path) }));
  const uniquePaths = new Set<string>();
  for (const file of files) {
    if (uniquePaths.has(file.path)) throw new Error(`Duplicate archive path: ${file.path}`);
    uniquePaths.add(file.path);
  }

  const inventory = await Promise.all(
    [...files]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(async (file) => ({
        path: file.path,
        bytes: toBytes(file.content).byteLength,
        sha256: await sha256Hex(file.content),
      })),
  );

  const manifest: ExportManifest = {
    manifestVersion: '1.0.0',
    projectVersion: PROJECT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    archiveMode: mode,
    createdAt: now.toISOString(),
    build: {
      tool: 'rhizomaybor',
      toolVersion: PROJECT_VERSION,
      nodeVersion: typeof process === 'undefined' ? undefined : process.version,
      platform: typeof navigator === 'undefined' ? 'server' : navigator.platform,
    },
    files: inventory,
    excluded,
  };

  const manifestFile: GeneratedFile = {
    path: 'export-manifest.json',
    content: `${JSON.stringify(manifest, null, 2)}\n`,
    mediaType: 'application/json',
  };
  files.push(manifestFile);

  return {
    mode,
    files,
    manifest,
    suggestedFilename: `rhizomaybor-${project.slug}-${mode}-${timestampSlug(now)}.7z`,
  };
}

export async function exportProjectArchive(
  project: SiteProject,
  mode: ArchiveMode,
  sanitize: HtmlSanitizer,
): Promise<ArchiveResult> {
  const plan = await createExportPlan(project, mode, sanitize);
  const { create7zArchive } = await import('./archive');
  const bytes = await create7zArchive(plan.files, plan.suggestedFilename);
  return { bytes, filename: plan.suggestedFilename, manifest: plan.manifest };
}
