'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { SiteProject } from '@/lib/project/schema';
import { renderHtmlShell, renderPage } from '@/lib/project/render-site';
import { sanitizeBrowserHtml } from '@/lib/project/html-browser';
import type { EditorSelection, PreviewDevice } from '@/lib/project/editor-types';
import { cn } from '@/lib/utils';

type PreviewFrameProps = {
  project: SiteProject;
  pageId: string;
  device: PreviewDevice;
  selection: EditorSelection;
  onSelect: (selection: EditorSelection) => void;
  onReorderComponent: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onReorderSection: (fromIndex: number, toIndex: number) => void;
  onReorderCard: (sectionId: string, componentId: string, fromIndex: number, toIndex: number) => void;
  onMessage: (message: string, tone?: 'info' | 'error') => void;
};

const DEVICE_WIDTH: Record<PreviewDevice, string> = {
  desktop: '100%',
  tablet: '820px',
  mobile: '390px',
};

export function PreviewFrame({
  project,
  pageId,
  device,
  selection,
  onSelect,
  onReorderComponent,
  onReorderSection,
  onReorderCard,
  onMessage,
}: PreviewFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const dragRef = useRef<
    | { kind: 'component'; sectionId: string; fromIndex: number }
    | { kind: 'section'; fromIndex: number }
    | { kind: 'card'; sectionId: string; componentId: string; fromIndex: number }
    | null
  >(null);
  const page = project.pages.find((candidate) => candidate.id === pageId) ?? project.pages[0];

  const html = useMemo(
    () =>
      renderHtmlShell(
        project,
        page,
        renderPage(project, page, {
          sanitize: sanitizeBrowserHtml,
          publicOnly: false,
          editable: true,
        }),
      ),
    [page, project],
  );

  const markSelection = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    doc.querySelectorAll('.rhizomaybor-editor-active').forEach((element) => {
      element.classList.remove('rhizomaybor-editor-active');
    });
    if (selection.kind === 'none') return;
    const id =
      selection.kind === 'component'
        ? selection.componentId
        : selection.kind === 'section'
          ? selection.sectionId
          : selection.kind === 'navigation'
            ? selection.navigationItemId
            : '';
    if (!id) return;
    doc.querySelector(`[data-editor-id="${id.replace(/"/g, '\\"')}"]`)?.classList.add('rhizomaybor-editor-active');
  }, [selection]);

  useEffect(() => {
    markSelection();
  }, [markSelection]);

  const attachInteractions = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;

    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) event.preventDefault();
      const component = target.closest<HTMLElement>('[data-editor-kind="component"]');
      if (component) {
        const section = component.closest<HTMLElement>('[data-editor-kind="section"]');
        if (component.dataset.editorId && section?.dataset.editorId) {
          onSelect({
            kind: 'component',
            pageId,
            sectionId: section.dataset.editorId,
            componentId: component.dataset.editorId,
          });
          return;
        }
      }
      const section = target.closest<HTMLElement>('[data-editor-kind="section"]');
      if (section?.dataset.editorId) {
        onSelect({ kind: 'section', pageId, sectionId: section.dataset.editorId });
        return;
      }
      const navigation = target.closest<HTMLElement>('[data-editor-kind="navigation"]');
      if (navigation?.dataset.editorId) {
        onSelect({ kind: 'navigation', navigationItemId: navigation.dataset.editorId });
      }
    };

    const dragstart = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      const card = target.closest<HTMLElement>('.card[data-card-index]');
      if (card) {
        const component = card.closest<HTMLElement>('[data-editor-kind="component"]');
        const section = card.closest<HTMLElement>('[data-editor-kind="section"]');
        if (component?.dataset.editorId && section?.dataset.editorId) {
          dragRef.current = {
            kind: 'card',
            sectionId: section.dataset.editorId,
            componentId: component.dataset.editorId,
            fromIndex: Number(card.dataset.cardIndex),
          };
          event.dataTransfer?.setData('text/plain', 'rhizomaybor-card');
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
          return;
        }
      }
      const component = target.closest<HTMLElement>('[data-editor-kind="component"]');
      if (component) {
        const section = component.closest<HTMLElement>('[data-editor-kind="section"]');
        const sectionInner = component.parentElement;
        if (component.dataset.editorId && section?.dataset.editorId && sectionInner) {
          dragRef.current = {
            kind: 'component',
            sectionId: section.dataset.editorId,
            fromIndex: Array.from(sectionInner.children).indexOf(component),
          };
          event.dataTransfer?.setData('text/plain', 'rhizomaybor-component');
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
          return;
        }
      }
      const section = target.closest<HTMLElement>('[data-editor-kind="section"]');
      if (section?.dataset.editorId) {
        const parent = section.parentElement;
        if (parent) {
          dragRef.current = { kind: 'section', fromIndex: Array.from(parent.children).indexOf(section) };
          event.dataTransfer?.setData('text/plain', 'rhizomaybor-section');
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        }
      }
    };

    const dragover = (event: DragEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    };

    const drop = (event: DragEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      event.preventDefault();
      const target = event.target as HTMLElement;

      if (drag.kind === 'card') {
        const card = target.closest<HTMLElement>('.card[data-card-index]');
        const section = target.closest<HTMLElement>('[data-editor-kind="section"]');
        const component = target.closest<HTMLElement>('[data-editor-kind="component"]');
        if (card && section?.dataset.editorId && component?.dataset.editorId === drag.componentId) {
          onReorderCard(drag.sectionId, drag.componentId, drag.fromIndex, Number(card.dataset.cardIndex));
        }
      } else if (drag.kind === 'component') {
        const targetComponent = target.closest<HTMLElement>('[data-editor-kind="component"]');
        const targetSection = target.closest<HTMLElement>('[data-editor-kind="section"]');
        if (targetComponent && targetSection?.dataset.editorId) {
          if (targetSection.dataset.editorId !== drag.sectionId) {
            onMessage('Components can only be reordered inside their permitted section.', 'error');
          } else {
            const sectionInner = targetComponent.parentElement;
            const toIndex = sectionInner ? Array.from(sectionInner.children).indexOf(targetComponent) : -1;
            if (toIndex >= 0) onReorderComponent(drag.sectionId, drag.fromIndex, toIndex);
          }
        }
      } else {
        const targetSection = target.closest<HTMLElement>('[data-editor-kind="section"]');
        if (targetSection?.parentElement) {
          const toIndex = Array.from(targetSection.parentElement.children).indexOf(targetSection);
          if (toIndex >= 0) onReorderSection(drag.fromIndex, toIndex);
        }
      }
      dragRef.current = null;
    };

    const dragend = () => {
      dragRef.current = null;
    };

    doc.addEventListener('click', click);
    doc.addEventListener('dragstart', dragstart);
    doc.addEventListener('dragover', dragover);
    doc.addEventListener('drop', drop);
    doc.addEventListener('dragend', dragend);
    markSelection();
  }, [markSelection, onMessage, onReorderCard, onReorderComponent, onReorderSection, onSelect, pageId]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#07090c]">
      <div className="flex items-center gap-2 border-b border-line/80 px-3 py-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/80" />
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Live project preview</span>
        <span className="ml-auto font-mono text-[9px] text-faint">{DEVICE_WIDTH[device]}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5">
        <div
          data-testid="preview-shell"
          data-device={device}
          className={cn(
            'mx-auto h-full min-h-[680px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_28px_100px_rgba(0,0,0,0.45)] transition-[width] duration-300',
            device === 'desktop' ? 'w-full' : 'w-full',
          )}
          style={{ maxWidth: DEVICE_WIDTH[device] }}
        >
          <iframe
            ref={frameRef}
            title="Rhizomaybor visual website preview"
            data-testid="site-preview"
            sandbox="allow-same-origin"
            srcDoc={html}
            onLoad={attachInteractions}
            className="h-full min-h-[680px] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
