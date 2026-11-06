'use client';

import { useMemo, useState } from 'react';
import type { Component, Page, Section, SiteProject } from '@/lib/project/schema';
import type { EditorSelection } from '@/lib/project/editor-types';
import type { ThemePatch } from '@/lib/project/editor-state';
import { COMPONENT_BY_TYPE, SECTION_BY_TYPE, componentPropertyString } from '@/lib/project/registry';
import { diffProjects, summarizeDiff } from '@/lib/project/autosave';
import { analyzeHtml } from '@/lib/project/html-policy';
import { cn } from '@/lib/utils';

type Props = {
  project: SiteProject;
  baseline: SiteProject;
  selection: EditorSelection;
  onSelect: (selection: EditorSelection) => void;
  onComponentProperty: (sectionId: string, componentId: string, key: string, value: unknown) => void;
  onComponentSettings: (sectionId: string, componentId: string, patch: Partial<Component>) => void;
  onSection: (sectionId: string, patch: Partial<Section>) => void;
  onPage: (pageId: string, patch: Partial<Page>) => void;
  onNavigation: (id: string, patch: { label?: string; href?: string; status?: 'published' | 'draft' | 'private' }) => void;
  onTheme: (patch: ThemePatch) => void;
  onDeleteComponent: (sectionId: string, componentId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onOpenContent: (target: { kind: 'component'; sectionId: string; componentId: string } | { kind: 'document'; documentId: string }) => void;
};

const input = 'w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/60';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-faint">{label}</span>{children}</label>;
}

export function Inspector(props: Props) {
  const { project, baseline, selection, onSelect, onComponentProperty, onComponentSettings, onSection, onPage, onNavigation, onTheme, onDeleteComponent, onDeleteSection, onOpenContent } = props;
  const [tab, setTab] = useState<'content' | 'layout' | 'theme'>('content');
  const page = 'pageId' in selection ? project.pages.find((item) => item.id === selection.pageId) : undefined;
  const section = page && 'sectionId' in selection ? page.sections.find((item) => item.id === selection.sectionId) : undefined;
  const component = section && 'componentId' in selection ? section.components.find((item) => item.id === selection.componentId) : undefined;
  const nav = selection.kind === 'navigation' ? project.navigation.items.find((item) => item.id === selection.navigationItemId) : undefined;
  const definition = component ? COMPONENT_BY_TYPE.get(component.type) : undefined;
  const sectionDefinition = section ? SECTION_BY_TYPE.get(section.type) : undefined;
  const changes = useMemo(() => diffProjects(baseline, project), [baseline, project]);
  const summary = summarizeDiff(changes);
  const updateProp = (key: string, value: unknown) => {
    if (section && component) onComponentProperty(section.id, component.id, key, value);
  };

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-line bg-bg/95">
      <div className="border-b border-line px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Inspector</p>
        <h2 className="mt-1 font-display text-lg text-ink">{component ? definition?.label ?? 'Component' : section ? sectionDefinition?.label ?? 'Section' : nav ? 'Navigation link' : page ? 'Page settings' : 'Project'}</h2>
        <p className="mt-0.5 text-xs text-muted">{component ? definition?.description : section ? sectionDefinition?.description : 'Click content in the preview or choose a setting below.'}</p>
      </div>
      <div className="grid grid-cols-3 border-b border-line bg-surface/50 p-1">
        {(['content', 'layout', 'theme'] as const).map((item) => <button key={item} type="button" data-testid={`inspector-${item}`} onClick={() => setTab(item)} className={cn('rounded px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em]', tab === item ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink')}>{item}</button>)}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === 'content' && <>
          {component && definition && <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2"><span className="font-mono text-[10px] text-faint">{component.type} · v{component.version}</span><button type="button" onClick={() => onDeleteComponent(section!.id, component.id)} className="text-[10px] text-red-300/70">Remove</button></div>
            {definition.properties.map((property) => {
              const value = component.props[property.key]?.value;
              if (property.type === 'card-list') {
                const cards = Array.isArray(value) ? value : [];
                const setCards = (next: unknown[]) => updateProp(property.key, next);
                return <div key={property.key} className="space-y-2">
                  <div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">{property.label}</span><button type="button" onClick={() => setCards([...cards, { id: `card-${Date.now()}`, title: 'New card', body: 'Card description', href: '/' }])} className="rounded border border-line px-2 py-1 text-[10px] text-muted">Add card</button></div>
                  {cards.map((raw, index) => {
                    const card = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
                    const patch = (change: Record<string, unknown>) => setCards(cards.map((item, i) => i === index ? { ...(item as object), ...change } : item));
                    return <div key={String(card.id ?? index)} className="space-y-2 rounded-lg border border-line bg-bg/60 p-2.5">
                      <div className="flex items-center gap-1"><span className="font-mono text-[9px] text-faint">CARD {index + 1}</span><button type="button" className="ml-auto px-1 text-muted" onClick={() => { const next = [...cards]; if (index > 0) [next[index - 1], next[index]] = [next[index], next[index - 1]]; setCards(next); }}>↑</button><button type="button" className="px-1 text-muted" onClick={() => { const next = [...cards]; if (index < next.length - 1) [next[index + 1], next[index]] = [next[index], next[index + 1]]; setCards(next); }}>↓</button><button type="button" className="px-1 text-red-300/70" onClick={() => setCards(cards.filter((_, i) => i !== index))}>×</button></div>
                      <input className={input} value={String(card.title ?? '')} onChange={(event) => patch({ title: event.target.value })} placeholder="Card title" />
                      <textarea className={cn(input, 'min-h-16 resize-y')} value={String(card.body ?? '')} onChange={(event) => patch({ body: event.target.value })} placeholder="Card body HTML" />
                      <input className={input} value={String(card.href ?? '')} onChange={(event) => patch({ href: event.target.value })} placeholder="/link/" />
                    </div>;
                  })}
                </div>;
              }
              if (property.type === 'select') return <Field key={property.key} label={property.label}><select className={input} value={String(value ?? '')} onChange={(event) => updateProp(property.key, event.target.value)}>{property.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>;
              if (property.type === 'number') return <Field key={property.key} label={property.label}><input type="number" className={input} min={property.min} max={property.max} step={property.step} value={Number(value ?? property.min ?? 0)} onChange={(event) => updateProp(property.key, Number(event.target.value))} /></Field>;
              if (property.type === 'image') return <Field key={property.key} label={property.label}><select className={input} value={String(value ?? '')} onChange={(event) => updateProp(property.key, event.target.value)}><option value="">No asset</option>{project.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.status})</option>)}</select></Field>;
              const multiline = property.type === 'rich-text' || property.type === 'html';
              return <Field key={property.key} label={property.label}>{multiline ? <textarea className={cn(input, 'min-h-28 resize-y font-mono text-[12px]')} value={String(value ?? '')} placeholder={property.placeholder} onChange={(event) => updateProp(property.key, event.target.value)} /> : <input className={input} value={String(value ?? '')} placeholder={property.placeholder} onChange={(event) => updateProp(property.key, event.target.value)} />}</Field>;
            })}
            {(component.type === 'richText' || component.type === 'html' || component.type === 'hero' || component.type === 'callout') && <div className="rounded-lg border border-accent/20 bg-accent-soft/20 p-3"><p className="text-xs text-muted">Visual, source and isolated preview modes use the original content format.</p><button type="button" data-testid="open-content-editor" onClick={() => onOpenContent({ kind: 'component', sectionId: section!.id, componentId: component.id })} className="mt-2 w-full rounded border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">Edit rich content</button></div>}
            {component.type === 'richText' && componentPropertyString(component, 'documentId') && <button type="button" onClick={() => onOpenContent({ kind: 'document', documentId: componentPropertyString(component, 'documentId') })} className="w-full rounded border border-line px-3 py-2 text-xs text-muted">Open linked document</button>}
            {component.type === 'html' && <p className="rounded border border-line bg-surface p-2 text-[11px] text-muted">HTML analysis: {analyzeHtml(componentPropertyString(component, 'body')).unknownTags.length} preserved unknown tag(s).</p>}
          </div>}

          {section && !component && <div className="space-y-4"><Field label="Section label"><input className={input} value={section.label ?? ''} onChange={(event) => onSection(section.id, { label: event.target.value })} /></Field><Field label="Publication"><select className={input} value={section.status} onChange={(event) => onSection(section.id, { status: event.target.value as Section['status'] })}><option value="published">Published</option><option value="draft">Draft</option><option value="private">Private</option></select></Field><button type="button" onClick={() => onDeleteSection(section.id)} className="w-full rounded border border-red-400/20 px-3 py-2 text-xs text-red-300/70">Remove section</button></div>}

          {nav && <div className="space-y-4"><Field label="Label"><input className={input} data-testid="nav-label" value={nav.label} onChange={(event) => onNavigation(nav.id, { label: event.target.value })} /></Field><Field label="Link"><input className={input} value={nav.href} onChange={(event) => onNavigation(nav.id, { href: event.target.value })} /></Field><Field label="Publication"><select className={input} value={nav.status} onChange={(event) => onNavigation(nav.id, { status: event.target.value as 'published' | 'draft' | 'private' })}><option value="published">Published</option><option value="draft">Draft</option><option value="private">Private</option></select></Field></div>}

          {page && !section && <div className="space-y-4"><Field label="Page title"><input className={input} value={page.title} onChange={(event) => onPage(page.id, { title: event.target.value })} /></Field><Field label="Page path"><input className={input} value={page.slug} onChange={(event) => onPage(page.id, { slug: event.target.value })} /></Field><Field label="Description"><textarea className={cn(input, 'min-h-24 resize-y')} value={page.description} onChange={(event) => onPage(page.id, { description: event.target.value })} /></Field><Field label="Publication"><select className={input} value={page.status} onChange={(event) => onPage(page.id, { status: event.target.value as Page['status'] })}><option value="published">Published</option><option value="draft">Draft</option><option value="private">Private</option></select></Field></div>}

          {selection.kind === 'none' && <p className="rounded-lg border border-dashed border-line p-4 text-sm leading-relaxed text-muted">Click a title, paragraph, card, image, button or navigation label in the preview.</p>}
        </>}

        {tab === 'layout' && <div className="space-y-4"><button type="button" onClick={() => onSelect({ kind: 'page', pageId: page?.id ?? project.pages[0].id })} className="w-full rounded-lg border border-line bg-surface p-3 text-left"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Page</span><span className="mt-1 block text-sm text-ink">{page?.title ?? project.pages[0].title}</span></button>{section && sectionDefinition && <><Field label="Section layout"><select className={input} data-testid="section-layout" value={section.layout} onChange={(event) => onSection(section.id, { layout: event.target.value })}>{sectionDefinition.layouts.map((layout) => <option key={layout} value={layout}>{layout}</option>)}</select></Field><Field label="Layout variant"><select className={input} value={section.variant ?? sectionDefinition.variants[0]} onChange={(event) => onSection(section.id, { variant: event.target.value })}>{sectionDefinition.variants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}</select></Field><p className="rounded-lg border border-line bg-surface p-3 text-[11px] leading-relaxed text-muted">Drag components within this section to reorder. Cross-section moves are rejected when the target layout does not support the component.</p></>}{component && <Field label="Component label"><input className={input} value={component.label ?? ''} onChange={(event) => onComponentSettings(section!.id, component.id, { label: event.target.value })} /></Field>}</div>}

        {tab === 'theme' && <div className="space-y-4"><Field label="Theme name"><input className={input} value={project.theme.name} onChange={(event) => onTheme({ name: event.target.value })} /></Field><div className="grid grid-cols-2 gap-2">{Object.entries(project.theme.colors).map(([key, value]) => <Field key={key} label={key}><div className="flex gap-2"><input type="color" value={String(value)} onChange={(event) => onTheme({ colors: { [key]: event.target.value } })} className="h-9 w-9 rounded border border-line" /><input className={cn(input, 'min-w-0 font-mono text-[11px]')} value={String(value)} onChange={(event) => /^#[0-9a-fA-F]{6}$/.test(event.target.value) && onTheme({ colors: { [key]: event.target.value } })} /></div></Field>)}</div><div className="grid grid-cols-2 gap-2"><Field label="Heading"><select className={input} value={project.theme.typography.heading} onChange={(event) => onTheme({ typography: { heading: event.target.value as 'serif' | 'sans' | 'mono' } })}><option value="serif">Serif</option><option value="sans">Sans</option><option value="mono">Mono</option></select></Field><Field label="Body"><select className={input} value={project.theme.typography.body} onChange={(event) => onTheme({ typography: { body: event.target.value as 'serif' | 'sans' | 'mono' } })}><option value="serif">Serif</option><option value="sans">Sans</option><option value="mono">Mono</option></select></Field></div><Field label="Type scale"><select className={input} value={project.theme.typography.scale} onChange={(event) => onTheme({ typography: { scale: event.target.value as 'compact' | 'balanced' | 'expressive' } })}><option value="compact">Compact</option><option value="balanced">Balanced</option><option value="expressive">Expressive</option></select></Field><Field label="Spacing"><select className={input} value={project.theme.spacing} onChange={(event) => onTheme({ spacing: event.target.value as 'compact' | 'cozy' | 'spacious' })}><option value="compact">Compact</option><option value="cozy">Cozy</option><option value="spacious">Spacious</option></select></Field><Field label="Corner radius"><select className={input} value={project.theme.radius} onChange={(event) => onTheme({ radius: event.target.value as 'none' | 'soft' | 'round' })}><option value="none">None</option><option value="soft">Soft</option><option value="round">Round</option></select></Field></div>}
      </div>

      <div className="border-t border-line bg-surface/40 p-3"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Pending changes</span><span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[9px] text-accent">{summary.added + summary.removed + summary.changed}</span></div><div className="mt-2 flex gap-3 font-mono text-[9px] text-faint"><span>+{summary.added}</span><span>~{summary.changed}</span><span>-{summary.removed}</span></div>{changes[0] && <p className="mt-2 truncate font-mono text-[9px] text-muted">{changes[0].path}</p>}</div>
    </aside>
  );
}
