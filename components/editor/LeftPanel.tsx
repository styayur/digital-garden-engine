'use client';

import { useMemo, useRef, useState } from 'react';
import type { SiteProject } from '@/lib/project/schema';
import type { EditorSelection } from '@/lib/project/editor-types';
import { COMPONENT_REGISTRY, SECTION_REGISTRY } from '@/lib/project/registry';
import { cn } from '@/lib/utils';

type Props = {
  project: SiteProject;
  pageId: string;
  selection: EditorSelection;
  onPage: (pageId: string) => void;
  onSelect: (selection: EditorSelection) => void;
  onAddComponent: (sectionId: string, type: string) => void;
  onAddSection: (type: string) => void;
  onOpenDocument: (documentId: string) => void;
  onAddDocument: () => void;
  onImportAssets: (files: FileList) => void;
  onMessage: (message: string) => void;
};

function StatusDot({ status }: { status: string }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', status === 'published' ? 'bg-emerald-400' : status === 'private' ? 'bg-red-400' : 'bg-amber-400')} title={status} />;
}

export function LeftPanel({ project, pageId, selection, onPage, onSelect, onAddComponent, onAddSection, onOpenDocument, onAddDocument, onImportAssets, onMessage }: Props) {
  const [tab, setTab] = useState<'pages' | 'content'>('pages');
  const [contentQuery, setContentQuery] = useState('');
  const assetInput = useRef<HTMLInputElement>(null);
  const page = project.pages.find((candidate) => candidate.id === pageId) ?? project.pages[0];
  const selectedSectionId = 'sectionId' in selection ? selection.sectionId : page.sections[0]?.id;
  const selectedSection = page.sections.find((section) => section.id === selectedSectionId);
  const availableComponents = useMemo(
    () => COMPONENT_REGISTRY.filter((definition) => !selectedSection || definition.allowedLayouts.includes(selectedSection.layout)),
    [selectedSection],
  );
  const documents = project.contentDocuments.filter((document) => {
    const query = contentQuery.trim().toLowerCase();
    return !query || document.title.toLowerCase().includes(query) || document.slug.includes(query) || document.kind.includes(query);
  });

  return (
    <aside className="flex h-full w-[286px] shrink-0 flex-col border-r border-line bg-bg/95">
      <div className="grid grid-cols-2 border-b border-line p-1">
        <button type="button" data-testid="left-pages-tab" onClick={() => setTab('pages')} className={cn('rounded px-2 py-2 font-mono text-[9px] uppercase tracking-[0.16em]', tab === 'pages' ? 'bg-accent/15 text-accent' : 'text-muted')}>Pages and layout</button>
        <button type="button" data-testid="left-content-tab" onClick={() => setTab('content')} className={cn('rounded px-2 py-2 font-mono text-[9px] uppercase tracking-[0.16em]', tab === 'content' ? 'bg-accent/15 text-accent' : 'text-muted')}>Content</button>
      </div>

      {tab === 'pages' && <div className="min-h-0 flex-1 overflow-auto">
        <div className="border-b border-line p-3">
          <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Pages</span><span className="font-mono text-[9px] text-faint">{project.pages.length}</span></div>
          <div className="space-y-1">
            {project.pages.map((item) => <button key={item.id} type="button" data-testid={`page-${item.id}`} onClick={() => onPage(item.id)} className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors', item.id === pageId ? 'bg-surface text-ink' : 'text-muted hover:bg-surface/60 hover:text-ink')}><StatusDot status={item.status} /><span className="truncate">{item.title}</span><span className="ml-auto max-w-24 truncate font-mono text-[9px] text-faint">{item.slug}</span></button>)}
          </div>
        </div>

        <div className="border-b border-line p-3">
          <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Sections</span><button type="button" onClick={() => onAddSection('content')} className="text-[10px] text-accent">+ Add</button></div>
          <div className="space-y-1">
            {page.sections.map((section, index) => <button key={section.id} type="button" data-testid={`section-${index}`} onClick={() => onSelect({ kind: 'section', pageId, sectionId: section.id })} className={cn('flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors', selection.kind === 'section' && selection.sectionId === section.id ? 'border-accent/40 bg-accent/10 text-ink' : 'border-transparent text-muted hover:bg-surface/60')}><StatusDot status={section.status} /><span className="truncate">{index + 1}. {section.label ?? section.type}</span><span className="ml-auto font-mono text-[9px] text-faint">{section.components.length}</span></button>)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">{SECTION_REGISTRY.map((definition) => <button key={definition.type} type="button" onClick={() => onAddSection(definition.type)} className="rounded border border-line px-1.5 py-1 text-[9px] text-muted hover:border-accent/40 hover:text-accent">{definition.label}</button>)}</div>
        </div>

        <div className="p-3">
          <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Component palette</span><button type="button" onClick={() => selectedSection && onMessage(`Adding to ${selectedSection.label ?? selectedSection.type} (${selectedSection.layout}).`)} className="text-[9px] text-faint">registry</button></div>
          {!selectedSection ? <p className="text-xs text-muted">Select a section first.</p> : <div className="space-y-1.5">
            {availableComponents.map((definition) => <button key={definition.type} type="button" data-testid={`add-${definition.type}`} onClick={() => onAddComponent(selectedSection.id, definition.type)} className="w-full rounded-md border border-line bg-surface/40 px-2.5 py-2 text-left transition-colors hover:border-accent/40"><span className="block text-xs text-ink">{definition.label}</span><span className="mt-0.5 block text-[10px] leading-relaxed text-faint">{definition.description}</span></button>)}
            {availableComponents.length === 0 && <p className="text-xs text-muted">No registered component supports this layout.</p>}
          </div>}
        </div>
      </div>}

      {tab === 'content' && <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-line p-3">
          <input value={contentQuery} onChange={(event) => setContentQuery(event.target.value)} placeholder="Search content…" className="w-full rounded-md border border-line bg-bg px-3 py-2 text-xs text-ink outline-none placeholder:text-faint focus:border-accent/50" />
          <div className="mt-2 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Documents</span><button type="button" onClick={onAddDocument} className="text-[10px] text-accent">+ New</button></div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {documents.map((document) => <button key={document.id} type="button" data-testid={`document-${document.id}`} onClick={() => onOpenDocument(document.id)} className={cn('mb-1 block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface', selection.kind === 'document' && selection.documentId === document.id ? 'bg-surface' : '')}><div className="flex items-center gap-2"><StatusDot status={document.status} /><span className="truncate text-xs text-ink">{document.title}</span><span className="ml-auto font-mono text-[9px] text-faint">{document.format}</span></div><div className="mt-1 flex items-center gap-2 text-[10px] text-faint"><span>{document.kind}</span><span>{document.slug}</span></div></button>)}
          {documents.length === 0 && <p className="p-3 text-xs text-muted">No matching content documents.</p>}
        </div>
        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Assets</span><button type="button" onClick={() => assetInput.current?.click()} className="text-[10px] text-accent">Import</button></div>
          <input ref={assetInput} type="file" multiple hidden accept="image/*,video/*,audio/*,font/*,.pdf,.svg" onChange={(event) => event.target.files && onImportAssets(event.target.files)} />
          <div className="space-y-1">{project.assets.slice(0, 8).map((asset) => <div key={asset.id} className="flex items-center gap-2 rounded border border-line/60 px-2 py-1.5 text-[10px]"><StatusDot status={asset.status} /><span className="truncate text-muted">{asset.name}</span><span className="ml-auto font-mono text-faint">{(asset.size / 1024).toFixed(1)}k</span></div>)}{project.assets.length === 0 && <p className="text-[11px] text-faint">Import a local image to use it in visual components.</p>}</div>
        </div>
      </div>}
    </aside>
  );
}

