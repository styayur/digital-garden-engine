'use client';

import { useMemo, useState } from 'react';
import type { SiteProject } from '@/lib/project/schema';
import type { ArchiveMode } from '@/lib/project/export';
import { exportProjectArchive } from '@/lib/project/export';
import { sanitizeBrowserHtml } from '@/lib/project/html-browser';
import { validateProject } from '@/lib/project/validation';
import { downloadBytes } from '@/lib/project/project-io';
import { chooseDesktopDirectory, isDesktopRuntime, saveDesktopArchive } from '@/lib/desktop';
import { cn } from '@/lib/utils';

export function ExportDialog({ project, onClose, onExported }: { project: SiteProject; onClose: () => void; onExported: (message: string) => void }) {
  const [busy, setBusy] = useState<ArchiveMode | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const websiteValidation = useMemo(() => validateProject(project, { forExport: 'website' }), [project]);
  const projectValidation = useMemo(() => validateProject(project, { forExport: 'project' }), [project]);

  const run = async (mode: ArchiveMode) => {
    const validation = mode === 'website' ? websiteValidation : projectValidation;
    if (!validation.valid) {
      setError(validation.errors.map((entry) => `${entry.path}: ${entry.message}`).join('\n'));
      return;
    }
    setBusy(mode);
    setError('');
    setMessage('');
    try {
      const result = await exportProjectArchive(project, mode, sanitizeBrowserHtml);
      if (isDesktopRuntime()) {
        const root = await chooseDesktopDirectory();
        if (!root) return;
        const saved = await saveDesktopArchive(root, result.filename, result.bytes);
        setMessage(`Saved ${result.filename} to ${saved}`);
      } else {
        downloadBytes(result.bytes, result.filename, 'application/x-7z-compressed');
        setMessage(`Downloaded ${result.filename} (${(result.bytes.byteLength / 1024).toFixed(1)} KiB)`);
      }
      onExported(`Exported ${mode} archive: ${result.filename}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Export project">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl">
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Export</p><h2 className="font-display text-2xl text-ink">Two archives, real 7z format</h2></div>
          <button type="button" onClick={onClose} className="ml-auto rounded border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">Close</button>
        </header>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <section className="rounded-xl border border-line bg-surface/40 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Editable project</p>
            <h3 className="mt-2 font-display text-xl text-ink">Continue editing later</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">Includes the complete project JSON, all publication states, embedded project assets, a file inventory and SHA-256 checksums.</p>
            <ul className="mt-3 space-y-1 text-[11px] text-faint"><li>• Draft and private records stay in the editable archive</li><li>• Original HTML and source formats are preserved</li><li>• Import validated before archive creation</li></ul>
            <button type="button" data-testid="export-project-7z" disabled={Boolean(busy)} onClick={() => void run('project')} className="mt-4 w-full rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/20 disabled:opacity-40">{busy === 'project' ? 'Creating 7z…' : 'Export project .7z'}</button>
            {projectValidation.errors.length > 0 && <p className="mt-2 text-[11px] text-red-300">{projectValidation.errors.length} blocking issue(s)</p>}
          </section>
          <section className="rounded-xl border border-line bg-surface/40 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300">Publishable website</p>
            <h3 className="mt-2 font-display text-xl text-ink">Deploy without Rhizomaybor</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">Includes only published pages, sections, documents and assets, plus standalone HTML, CSS, JavaScript and an integrity manifest.</p>
            <ul className="mt-3 space-y-1 text-[11px] text-faint"><li>• Draft and private content is excluded</li><li>• Scripts in content are sanitized</li><li>• Archive can be extracted independently</li></ul>
            <button type="button" data-testid="export-website-7z" disabled={Boolean(busy)} onClick={() => void run('website')} className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg hover:bg-accent/90 disabled:opacity-40">{busy === 'website' ? 'Creating 7z…' : 'Export website .7z'}</button>
            {websiteValidation.errors.length > 0 && <p className="mt-2 text-[11px] text-red-300">{websiteValidation.errors.length} blocking issue(s)</p>}
          </section>
        </div>
        {(error || message) && <div className={cn('mx-5 mb-4 rounded-lg border px-3 py-2 text-xs whitespace-pre-wrap', error ? 'border-red-400/25 bg-red-500/5 text-red-200' : 'border-emerald-400/25 bg-emerald-500/5 text-emerald-200')}>{error || message}</div>}
        <footer className="border-t border-line px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">7-Zip 24.09 WASM · manifest v1.0.0 · schema {project.schemaVersion}</footer>
      </div>
    </div>
  );
}
