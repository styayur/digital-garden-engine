import type { SiteProject } from './schema';
import { projectFingerprint } from './editor-state';

export const RECOVERY_KEY = 'rhizomaybor.recovery.v1';
export const AUTOSAVE_KEY = 'rhizomaybor.autosave.v1';

export type RecoveryRecord = {
  version: 1;
  savedAt: string;
  baselineFingerprint: string;
  project: SiteProject;
};

export interface RecoveryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function writeRecovery(
  storage: RecoveryStorage,
  project: SiteProject,
  baseline: SiteProject,
  now = new Date(),
): RecoveryRecord {
  const record: RecoveryRecord = {
    version: 1,
    savedAt: now.toISOString(),
    baselineFingerprint: projectFingerprint(baseline),
    project: structuredClone(project),
  };
  storage.setItem(RECOVERY_KEY, JSON.stringify(record));
  return record;
}

export function readRecovery(storage: RecoveryStorage): RecoveryRecord | null {
  const raw = storage.getItem(RECOVERY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RecoveryRecord;
    if (parsed.version !== 1 || !parsed.project || typeof parsed.baselineFingerprint !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRecovery(storage: RecoveryStorage) {
  storage.removeItem(RECOVERY_KEY);
}

export function recoveryIsNewer(record: RecoveryRecord, current: SiteProject) {
  return record.savedAt > current.updatedAt || projectFingerprint(record.project) !== projectFingerprint(current);
}

export type DiffEntry = {
  path: string;
  kind: 'added' | 'removed' | 'changed';
  before?: unknown;
  after?: unknown;
};

export function diffProjects(before: unknown, after: unknown, basePath = '', limit = 200): DiffEntry[] {
  const entries: DiffEntry[] = [];
  walkDiff(before, after, basePath, entries, limit);
  return entries;
}

function walkDiff(before: unknown, after: unknown, path: string, entries: DiffEntry[], limit: number) {
  if (entries.length >= limit) return;
  if (Object.is(before, after)) return;
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length && entries.length < limit; index += 1) {
      const childPath = `${path}[${index}]`;
      if (index >= before.length) entries.push({ path: childPath, kind: 'added', after: after[index] });
      else if (index >= after.length) entries.push({ path: childPath, kind: 'removed', before: before[index] });
      else walkDiff(before[index], after[index], childPath, entries, limit);
    }
    return;
  }
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of [...keys].sort()) {
      if (entries.length >= limit) return;
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in before)) entries.push({ path: childPath, kind: 'added', after: after[key] });
      else if (!(key in after)) entries.push({ path: childPath, kind: 'removed', before: before[key] });
      else walkDiff(before[key], after[key], childPath, entries, limit);
    }
    return;
  }
  entries.push({ path: path || 'project', kind: 'changed', before, after });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function summarizeDiff(entries: DiffEntry[]) {
  return {
    added: entries.filter((entry) => entry.kind === 'added').length,
    removed: entries.filter((entry) => entry.kind === 'removed').length,
    changed: entries.filter((entry) => entry.kind === 'changed').length,
  };
}
