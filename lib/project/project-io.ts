'use client';

import { migrateProject, projectToJson, type MigrationResult } from './migrations';
import type { SiteProject } from './schema';
import { assertValidProject } from './validation';

export type ProjectImportResult = MigrationResult & {
  warnings: string[];
};

export function importProjectJson(text: string): ProjectImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Project JSON is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const migration = migrateProject(parsed);
  const validation = assertValidProject(migration.project);
  return {
    ...migration,
    warnings: validation.warnings.map((warning) => `${warning.path}: ${warning.message}`),
  };
}

export function serializeProject(project: SiteProject) {
  return projectToJson(project);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mediaType = 'application/octet-stream') {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mediaType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadText(text: string, filename: string, mediaType = 'application/json') {
  downloadBytes(new TextEncoder().encode(text), filename, mediaType);
}
