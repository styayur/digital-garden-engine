import { describe, expect, it } from 'vitest';
import type { RecoveryStorage } from '../../lib/project/autosave';
import { clearRecovery, diffProjects, readRecovery, summarizeDiff, writeRecovery } from '../../lib/project/autosave';
import { demoProject } from './fixtures';

class MemoryStorage implements RecoveryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('autosave, recovery and change preview', () => {
  it('round-trips a recovery record', () => {
    const storage = new MemoryStorage();
    const project = demoProject();
    const record = writeRecovery(storage, project, project, new Date('2026-11-06T12:00:00.000Z'));
    expect(readRecovery(storage)).toMatchObject({ version: 1, savedAt: record.savedAt });
    clearRecovery(storage);
    expect(readRecovery(storage)).toBeNull();
  });

  it('summarizes structural changes', () => {
    const before = demoProject();
    const after = structuredClone(before);
    after.pages[0].title = 'Changed page';
    after.contentDocuments = after.contentDocuments.slice(0, -1);
    const diff = diffProjects(before, after);
    expect(diff.length).toBeGreaterThan(0);
    const summary = summarizeDiff(diff);
    expect(summary.changed).toBeGreaterThan(0);
    expect(summary.removed).toBeGreaterThan(0);
  });
});
