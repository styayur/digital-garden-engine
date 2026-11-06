'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import demoRaw from '@/examples/project/rhizomaybor.project.json';
import { siteProjectSchema, type SiteProject } from '@/lib/project/schema';
import { createEditorState, editorReducer, isDirty, projectFingerprint, moveComponent, moveSection, moveCard, updateComponentProperty, updateComponentSettings, updateSection, updatePage, updateTheme, updateContentDocument, removeComponent, removeSection, addComponent, addContentDocument, type ThemePatch } from '@/lib/project/editor-state';
import { generateId, COMPONENT_BY_TYPE, createSection } from '@/lib/project/registry';
import { importProjectJson, serializeProject, downloadText } from '@/lib/project/project-io';
import { readRecovery, writeRecovery, clearRecovery, type RecoveryRecord } from '@/lib/project/autosave';
import { sanitizeBrowserHtml } from '@/lib/project/html-browser';
import { renderHtmlShell, renderPage } from '@/lib/project/render-site';
import { analyzeHtml } from '@/lib/project/html-policy';
import { createExportPlan } from '@/lib/project/export';
import type { EditorSelection, PreviewDevice } from '@/lib/project/editor-types';
import { chooseDesktopDirectory, isDesktopRuntime, loadDesktopProject, saveDesktopProject, writeDesktopFiles } from '@/lib/desktop';
import { LeftPanel } from './LeftPanel';
import { Inspector } from './Inspector';
import { PreviewFrame } from './PreviewFrame';
import { ContentEditor } from './ContentEditor';
import { ExportDialog } from './ExportDialog';
import { cn } from '@/lib/utils';

const DEMO_PROJECT = siteProjectSchema.parse(demoRaw);
const DESKTOP_ROOT_KEY = 'rhizomaybor.desktopRoot';

type ContentTarget =
  | { kind: 'document'; documentId: string; title: string; format: 'markdown' | 'mdx' | 'html'; initialValue: string }
  | { kind: 'component'; pageId: string; sectionId: string; componentId: string; propertyKey: string; title: string; format: 'markdown' | 'mdx' | 'html'; initialValue: string };

function buttonClass(active = false) {
  return cn('inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-35', active ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-surface/50 text-muted hover:text-ink');
}

export function EditorShell() {
  const [state, dispatch] = useReducer(editorReducer, DEMO_PROJECT, createEditorState);
  const [pageId, setPageId] = useState(DEMO_PROJECT.pages[0].id);
  const [selection, setSelection] = useState<EditorSelection>({ kind: 'component', pageId: DEMO_PROJECT.pages[0].id, sectionId: DEMO_PROJECT.pages[0].sections[0].id, componentId: DEMO_PROJECT.pages[0].sections[0].components[0].id });
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [toast, setToast] = useState<{ message: string; tone: 'info' | 'error' } | null>(null);
  const [contentTarget, setContentTarget] = useState<ContentTarget | null>(null);
  const [recovery, setRecovery] = useState<RecoveryRecord | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [desktopRoot, setDesktopRoot] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const dirty = isDirty(state);

  useEffect(() => {
    try {
      const record = readRecovery(localStorage);
      if (record && projectFingerprint(record.project) !== projectFingerprint(DEMO_PROJECT)) setRecovery(record);
      setDesktopRoot(localStorage.getItem(DESKTOP_ROOT_KEY));
    } catch {
      // Browser storage can be disabled. Editing still works without recovery.
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        writeRecovery(localStorage, state.project, state.baseline);
        setAutosavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        // Autosave failure is surfaced by the save button continuing to work.
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [state.baseline, state.project]);

  const notify = useCallback((message: string, tone: 'info' | 'error' = 'info') => setToast({ message, tone }), []);
  const replaceWithHistory = useCallback((project: SiteProject, label: string) => dispatch({ type: 'replace', project, label }), []);

  const save = useCallback(async () => {
    try {
      if (isDesktopRuntime()) {
        let root = desktopRoot;
        if (!root) {
          root = await chooseDesktopDirectory();
          if (!root) return;
          localStorage.setItem(DESKTOP_ROOT_KEY, root);
          setDesktopRoot(root);
        }
        const saved = await saveDesktopProject(root, state.project);
        dispatch({ type: 'markSaved', project: state.project });
        notify(`Saved project to ${saved}`);
      } else {
        downloadText(serializeProject(state.project), `${state.project.slug}.rhizomaybor.json`);
        dispatch({ type: 'markSaved', project: state.project });
        notify('Project JSON downloaded');
      }
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : String(caught), 'error');
    }
  }, [desktopRoot, notify, state.project]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'redo' });
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [save]);

  const importFile = async (file: File) => {
    try {
      let text: string;
      if (/\.7z$/i.test(file.name)) {
        const { extract7zArchive, textFromExtracted } = await import('@/lib/project/archive');
        const extracted = await extract7zArchive(new Uint8Array(await file.arrayBuffer()));
        text = textFromExtracted(extracted, 'rhizomaybor.project.json') ?? '';
        if (!text) throw new Error('The 7z archive does not contain rhizomaybor.project.json.');
      } else {
        text = await file.text();
      }
      const imported = importProjectJson(text);
      const firstPage = imported.project.pages[0];
      dispatch({ type: 'replace', project: imported.project, markSaved: true, label: 'imported project' });
      setPageId(firstPage.id);
      setSelection(firstPage.sections[0] ? { kind: 'section', pageId: firstPage.id, sectionId: firstPage.sections[0].id } : { kind: 'page', pageId: firstPage.id });
      notify(`Imported ${imported.project.name}${imported.warnings.length ? ` with ${imported.warnings.length} review warning(s)` : ''}`);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : String(caught), 'error');
    }
  };

  const openDesktop = async () => {
    try {
      const root = await chooseDesktopDirectory();
      if (!root) return;
      const text = await loadDesktopProject(root);
      localStorage.setItem(DESKTOP_ROOT_KEY, root);
      setDesktopRoot(root);
      const imported = importProjectJson(text);
      const firstPage = imported.project.pages[0];
      dispatch({ type: 'replace', project: imported.project, markSaved: true, label: 'opened desktop project' });
      setPageId(firstPage.id);
      setSelection(firstPage.sections[0] ? { kind: 'section', pageId: firstPage.id, sectionId: firstPage.sections[0].id } : { kind: 'page', pageId: firstPage.id });
      notify(`Opened ${imported.project.name}`);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : String(caught), 'error');
    }
  };

  const addComponentToSection = (sectionId: string, type: string) => {
    const page = state.project.pages.find((item) => item.id === pageId);
    const section = page?.sections.find((item) => item.id === sectionId);
    const definition = COMPONENT_BY_TYPE.get(type);
    if (!section || !definition?.allowedLayouts.includes(section.layout)) {
      notify('That component is not allowed in the current layout.', 'error');
      return;
    }
    const result = addComponent(state.project, pageId, sectionId, type);
    if (!result.componentId) return;
    replaceWithHistory(result.project, `added ${type}`);
    setSelection({ kind: 'component', pageId, sectionId, componentId: result.componentId });
  };

  const addSectionToPage = (type: string) => {
    const page = state.project.pages.find((item) => item.id === pageId);
    if (!page) return;
    const section = createSection(type);
    replaceWithHistory({ ...state.project, pages: state.project.pages.map((item) => item.id === pageId ? { ...item, sections: [...item.sections, section] } : item) }, `added ${type} section`);
    setSelection({ kind: 'section', pageId, sectionId: section.id });
  };

  const importAssets = async (files: FileList) => {
    try {
      const newAssets = await Promise.all(Array.from(files).map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = '';
        for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
        return {
          id: generateId('asset'),
          path: safeName,
          name: file.name,
          mediaType: file.type || 'application/octet-stream',
          status: 'draft' as const,
          size: file.size,
          dataBase64: btoa(binary),
        };
      }));
      replaceWithHistory({ ...state.project, assets: [...state.project.assets, ...newAssets] }, `imported ${newAssets.length} asset(s)`);
      notify(`Imported ${newAssets.length} local asset(s) as drafts`);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : String(caught), 'error');
    }
  };

  const openDocument = (documentId: string) => {
    const document = state.project.contentDocuments.find((item) => item.id === documentId);
    if (!document) return;
    setSelection({ kind: 'document', documentId });
    setContentTarget({ kind: 'document', documentId, title: document.title, format: document.format, initialValue: document.body });
  };

  const addDocument = () => {
    const result = addContentDocument(state.project, 'Untitled document');
    replaceWithHistory(result.project, 'added content document');
    openDocument(result.documentId);
  };

  const openComponentContent = (target: { kind: 'component'; sectionId: string; componentId: string } | { kind: 'document'; documentId: string }) => {
    if (target.kind === 'document') {
      openDocument(target.documentId);
      return;
    }
    const page = state.project.pages.find((item) => item.id === pageId);
    const section = page?.sections.find((item) => item.id === target.sectionId);
    const component = section?.components.find((item) => item.id === target.componentId);
    if (!component) return;
    const linkedId = component.props.documentId?.value;
    if (typeof linkedId === 'string' && linkedId) {
      openDocument(linkedId);
      return;
    }
    const propertyKey = component.type === 'hero' ? 'description' : 'body';
    const format = component.type === 'richText' ? String(component.props.format?.value ?? 'html') as 'markdown' | 'mdx' | 'html' : 'html';
    setContentTarget({
      kind: 'component',
      pageId,
      sectionId: target.sectionId,
      componentId: component.id,
      propertyKey,
      title: component.label ?? COMPONENT_BY_TYPE.get(component.type)?.label ?? 'Content',
      format,
      initialValue: String(component.props[propertyKey]?.value ?? ''),
    });
  };

  const applyContent = (value: string) => {
    if (!contentTarget) return;
    if (contentTarget.kind === 'document') {
      dispatch({ type: 'update-project', label: 'edited content document', updater: (project) => updateContentDocument(project, contentTarget.documentId, { body: value, unsupportedHtml: analyzeHtml(value).unknownTags }) });
    } else {
      dispatch({ type: 'update-project', label: 'edited rich content', updater: (project) => updateComponentProperty(project, contentTarget.pageId, contentTarget.sectionId, contentTarget.componentId, contentTarget.propertyKey, value) });
    }
    setContentTarget(null);
    notify('Content changes applied');
  };

  const openPage = (nextPageId: string) => {
    setPageId(nextPageId);
    const page = state.project.pages.find((item) => item.id === nextPageId);
    if (page?.sections[0]) setSelection({ kind: 'section', pageId: nextPageId, sectionId: page.sections[0].id });
  };

  const buildSite = async () => {
    if (!isDesktopRuntime()) {
      setShowExport(true);
      return;
    }
    try {
      const root = desktopRoot ?? await chooseDesktopDirectory();
      if (!root) return;
      localStorage.setItem(DESKTOP_ROOT_KEY, root);
      setDesktopRoot(root);
      await saveDesktopProject(root, state.project);
      const plan = await createExportPlan(state.project, 'website', sanitizeBrowserHtml);
      const written = await writeDesktopFiles(root, plan.files.map((file) => ({ ...file, path: `dist/${file.path}` })));
      notify(`Built ${written.length} website files in the selected project directory`);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : String(caught), 'error');
    }
  };

  const openStandalonePreview = () => {
    const page = state.project.pages.find((item) => item.id === pageId) ?? state.project.pages[0];
    const html = renderHtmlShell(state.project, page, renderPage(state.project, page, { sanitize: sanitizeBrowserHtml, publicOnly: false, editable: false }));
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-screen min-h-[720px] flex-col overflow-hidden bg-[#07090c] text-ink">
      <header className="flex min-h-14 items-center gap-2 border-b border-line bg-bg px-3">
        <div className="mr-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg border border-accent/30 bg-accent/10 font-display text-lg text-accent">R</span><div><p className="font-display text-base leading-tight text-ink">Rhizomaybor</p><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-faint">visual garden editor</p></div></div>
        <div className="min-w-0 border-l border-line pl-3"><p className="truncate text-xs text-muted">{state.project.name}</p><div className="mt-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-faint"><span className={cn('h-1.5 w-1.5 rounded-full', dirty ? 'bg-amber-400' : 'bg-emerald-400')} />{dirty ? 'Unsaved changes' : 'Saved'}{autosavedAt ? ` · autosaved ${autosavedAt}` : ''}</div></div>
        <div className="ml-auto hidden items-center gap-1 md:flex">
          <button type="button" className={buttonClass()} onClick={() => dispatch({ type: 'undo' })} disabled={state.past.length === 0} aria-label="Undo">Undo</button>
          <button type="button" className={buttonClass()} onClick={() => dispatch({ type: 'redo' })} disabled={state.future.length === 0} aria-label="Redo">Redo</button>
          <span className="mx-1 h-5 w-px bg-line" />
          <div className="flex rounded-md border border-line bg-surface/50 p-0.5">{(['desktop', 'tablet', 'mobile'] as const).map((item) => <button key={item} type="button" data-testid={`device-${item}`} onClick={() => setDevice(item)} className={cn('rounded px-2 py-1 font-mono text-[8px] uppercase', device === item ? 'bg-accent/15 text-accent' : 'text-faint')}>{item.slice(0, 3)}</button>)}</div>
          <span className="mx-1 h-5 w-px bg-line" />
        </div>
        <button type="button" className={buttonClass()} onClick={() => isDesktopRuntime() ? void openDesktop() : importInput.current?.click()}>{isDesktopRuntime() ? 'Open folder' : 'Import'}</button>
        <button type="button" data-testid="save-project" className={buttonClass(!!dirty)} onClick={() => void save()}>Save</button>
        <button type="button" className={buttonClass()} onClick={openStandalonePreview}>Preview</button>
        <button type="button" className={buttonClass()} onClick={() => void buildSite()}>Build</button>
        <button type="button" data-testid="open-export" className="inline-flex h-8 items-center rounded-md bg-accent px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-bg" onClick={() => setShowExport(true)}>Export .7z</button>
        <input ref={importInput} type="file" data-testid="project-file-input" hidden accept=".json,.7z,application/json,application/x-7z-compressed" onChange={(event) => event.target.files?.[0] && void importFile(event.target.files[0])} />
      </header>

      <div className="flex min-h-0 flex-1">
        <LeftPanel project={state.project} pageId={pageId} selection={selection} onPage={openPage} onSelect={setSelection} onAddComponent={addComponentToSection} onAddSection={addSectionToPage} onOpenDocument={openDocument} onAddDocument={addDocument} onImportAssets={(files) => void importAssets(files)} onMessage={notify} />
        <main className="min-w-0 flex-1"><PreviewFrame project={state.project} pageId={pageId} device={device} selection={selection} onSelect={setSelection} onReorderComponent={(sectionId, fromIndex, toIndex) => replaceWithHistory(moveComponent(state.project, pageId, sectionId, fromIndex, toIndex), 'reordered components')} onReorderSection={(fromIndex, toIndex) => replaceWithHistory(moveSection(state.project, pageId, fromIndex, toIndex), 'reordered sections')} onReorderCard={(sectionId, componentId, fromIndex, toIndex) => replaceWithHistory(moveCard(state.project, pageId, sectionId, componentId, fromIndex, toIndex), 'reordered cards')} onMessage={notify} /></main>
        <Inspector project={state.project} baseline={state.baseline} selection={selection} onSelect={setSelection} onComponentProperty={(sectionId, componentId, key, value) => dispatch({ type: 'update-project', label: `updated ${key}`, updater: (project) => updateComponentProperty(project, pageId, sectionId, componentId, key, value) })} onComponentSettings={(sectionId, componentId, patch) => dispatch({ type: 'update-project', label: 'updated component settings', updater: (project) => updateComponentSettings(project, pageId, sectionId, componentId, patch) })} onSection={(sectionId, patch) => dispatch({ type: 'update-project', label: 'updated section', updater: (project) => updateSection(project, pageId, sectionId, patch) })} onPage={(id, patch) => dispatch({ type: 'update-project', label: 'updated page', updater: (project) => updatePage(project, id, patch) })} onNavigation={(id, patch) => dispatch({ type: 'update-project', label: 'updated navigation', updater: (project) => ({ ...project, navigation: { ...project.navigation, items: project.navigation.items.map((item) => item.id === id ? { ...item, ...patch } : item) } }) })} onTheme={(patch: ThemePatch) => dispatch({ type: 'update-project', label: 'updated theme', updater: (project) => updateTheme(project, patch) })} onDeleteComponent={(sectionId, componentId) => { replaceWithHistory(removeComponent(state.project, pageId, sectionId, componentId), 'removed component'); setSelection({ kind: 'section', pageId, sectionId }); }} onDeleteSection={(sectionId) => { replaceWithHistory(removeSection(state.project, pageId, sectionId), 'removed section'); setSelection({ kind: 'page', pageId }); }} onOpenContent={openComponentContent} />
      </div>

      {contentTarget && <ContentEditor title={contentTarget.title} format={contentTarget.format} initialValue={contentTarget.initialValue} onApply={applyContent} onClose={() => setContentTarget(null)} />}
      {showExport && <ExportDialog project={state.project} onClose={() => setShowExport(false)} onExported={notify} />}
      {recovery && <div className="fixed inset-x-0 top-16 z-[80] mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-amber-400/30 bg-[#1a1710] px-4 py-3 shadow-xl"><div><p className="text-sm text-amber-100">Recovered unsaved edits from {new Date(recovery.savedAt).toLocaleString()}</p><p className="mt-0.5 text-[11px] text-amber-200/70">The recovery record differs from the built-in demo project.</p></div><button type="button" className="ml-auto rounded border border-amber-400/30 px-3 py-1.5 text-xs text-amber-200" onClick={() => { dispatch({ type: 'replace', project: recovery.project, label: 'recovered autosave' }); setPageId(recovery.project.pages[0].id); setRecovery(null); }}>Restore</button><button type="button" className="rounded border border-line px-3 py-1.5 text-xs text-muted" onClick={() => { clearRecovery(localStorage); setRecovery(null); }}>Discard</button></div>}
      {toast && <div className={cn('fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-lg border px-4 py-2 text-xs shadow-xl', toast.tone === 'error' ? 'border-red-400/30 bg-[#1d1012] text-red-200' : 'border-accent/30 bg-[#17150e] text-amber-100')}>{toast.message}</div>}
    </div>
  );
}
