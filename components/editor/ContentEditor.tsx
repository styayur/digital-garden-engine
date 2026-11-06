'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContentFormat } from '@/lib/project/schema';
import { analyzeHtml } from '@/lib/project/html-policy';
import { sanitizeBrowserHtml } from '@/lib/project/html-browser';
import { markdownToHtml } from '@/lib/project/content';
import { cn } from '@/lib/utils';

type MuyaInstance = {
  init(): void;
  getMarkdown(): string;
  flush(): void;
  destroy(): void;
  eventCenter: { on(event: string, listener: () => void): void };
};

type MuyaModule = {
  Muya: {
    new (element: HTMLElement, options: Record<string, unknown>): MuyaInstance;
    use(plugin: unknown): void;
  };
  InlineFormatToolbar: unknown;
  ParagraphFrontButton: unknown;
  ParagraphFrontMenu: unknown;
  LinkTools: unknown;
};

let muyaRegistered = false;

function MarkdownVisualEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const initialValue = useRef(value);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let instance: MuyaInstance | undefined;
    (async () => {
      try {
        const module = (await import('@muyajs/core')) as unknown as MuyaModule;
        if (cancelled || !containerRef.current) return;
        if (!muyaRegistered) {
          module.Muya.use(module.InlineFormatToolbar);
          module.Muya.use(module.ParagraphFrontButton);
          module.Muya.use(module.ParagraphFrontMenu);
          module.Muya.use(module.LinkTools);
          muyaRegistered = true;
        }
        instance = new module.Muya(containerRef.current, {
          markdown: initialValue.current,
          footnote: true,
          codeBlockLineNumbers: true,
        });
        instance.eventCenter.on('json-change', () => {
          instance?.flush();
          onChangeRef.current(instance?.getMarkdown() ?? '');
        });
        instance.init();
        setStatus('ready');
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : String(caught));
        setStatus('fallback');
      }
    })();
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  if (status === 'fallback') {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">Visual engine fallback</p>
        <p className="mt-2 text-sm text-muted">
          Muya could not start in this browser. Source mode remains available and the document has not been changed.
        </p>
        <p className="mt-1 font-mono text-[10px] text-amber-300/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[28rem] overflow-hidden rounded-xl border border-line bg-[#11151a]">
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/80 font-mono text-xs text-muted">
          Loading MarkText visual engine…
        </div>
      )}
      <div ref={containerRef} className="marktext-editor min-h-[28rem]" />
    </div>
  );
}

function HtmlVisualEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastExternal = useRef(value);

  useEffect(() => {
    if (!editorRef.current || editorRef.current.contains(document.activeElement)) return;
    if (lastExternal.current !== value) {
      editorRef.current.innerHTML = sanitizeBrowserHtml(value);
      lastExternal.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = sanitizeBrowserHtml(value);
    }
  }, [value]);

  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editorRef.current?.innerHTML ?? value);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#11151a]">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-1.5">
        {[
          ['bold', 'B', 'Bold'],
          ['italic', 'I', 'Italic'],
          ['formatBlock', 'H2', 'Heading 2', 'h2'],
          ['formatBlock', 'P', 'Paragraph', 'p'],
          ['insertUnorderedList', '• List', 'Bullet list'],
          ['insertOrderedList', '1. List', 'Ordered list'],
        ].map(([commandName, label, title, argument]) => (
          <button
            key={`${commandName}-${label}`}
            type="button"
            title={title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command(commandName, argument)}
            className="rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-line/30 hover:text-ink"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const href = window.prompt('Link URL');
            if (href) command('createLink', href);
          }}
          className="rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-line/30 hover:text-ink"
        >
          Link
        </button>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-faint">HTML-aware visual mode</span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-testid="html-visual-editor"
        onInput={(event) => {
          const next = event.currentTarget.innerHTML;
          lastExternal.current = next;
          onChange(next);
        }}
        className="prose prose-invert min-h-[24rem] max-w-none px-5 py-4 outline-none"
      />
    </div>
  );
}

export function ContentEditor({
  title,
  format,
  initialValue,
  onApply,
  onClose,
}: {
  title: string;
  format: ContentFormat;
  initialValue: string;
  onApply: (value: string) => void;
  onClose: () => void;
}) {
  const analysis = useMemo(() => analyzeHtml(format === 'html' ? initialValue : markdownToHtml(initialValue)), [format, initialValue]);
  const [mode, setMode] = useState<'visual' | 'source' | 'preview'>(
    format === 'html' && analysis.recommendation === 'source-only' ? 'source' : 'visual',
  );
  const [value, setValue] = useState(initialValue);
  const previewHtml = useMemo(
    () => format === 'markdown' || format === 'mdx' ? sanitizeBrowserHtml(markdownToHtml(value)) : sanitizeBrowserHtml(value),
    [format, value],
  );
  const changed = value !== initialValue;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Edit ${title}`}>
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Content document · {format}</p>
            <h2 className="truncate font-display text-xl text-ink">{title}</h2>
          </div>
          <div className="ml-auto flex rounded-lg border border-line bg-surface p-1" role="tablist" aria-label="Editor mode">
            {(['visual', 'source', 'preview'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                data-testid={`content-mode-${candidate}`}
                aria-selected={mode === candidate}
                onClick={() => setMode(candidate)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                  mode === candidate ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink',
                )}
              >
                {candidate}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {(analysis.unknownTags.length > 0 || analysis.unknownAttributes.length > 0) && (
            <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
              Preserved HTML structures detected: {[...analysis.unknownTags, ...analysis.unknownAttributes].slice(0, 8).join(', ')}. Source mode is the safest place to change them.
            </div>
          )}

          {mode === 'visual' && (format === 'markdown' || format === 'mdx') && (
            <MarkdownVisualEditor value={value} onChange={setValue} />
          )}
          {mode === 'visual' && format === 'html' && <HtmlVisualEditor value={value} onChange={setValue} />}
          {mode === 'source' && (
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              spellCheck={false}
              data-testid="content-source-editor"
              className="min-h-[28rem] w-full resize-y rounded-xl border border-line bg-[#0b0e12] p-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-accent/50"
            />
          )}
          {mode === 'preview' && (
            <iframe
              title={`${title} preview`}
              data-testid="content-preview"
              sandbox=""
              srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#0b0d10;color:#f3efe6;font:16px/1.7 Inter,system-ui,sans-serif;padding:2rem}main{max-width:760px;margin:auto}a{color:#c9a227}img{max-width:100%;height:auto}pre{overflow:auto;background:#12161b;padding:1rem;border-radius:10px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #292e35;padding:.5rem}blockquote{border-left:3px solid #c9a227;padding-left:1rem;color:#a7a29a}</style></head><body><main>${previewHtml}</main></body></html>`}
              className="min-h-[32rem] w-full rounded-xl border border-line bg-bg"
            />
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {value.length.toLocaleString()} characters · original format preserved
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2 text-xs text-muted hover:text-ink">
              Cancel
            </button>
            <button
              type="button"
              data-testid="apply-content"
              onClick={() => onApply(value)}
              disabled={!changed}
              className="rounded-md bg-accent px-5 py-2 text-xs font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply changes
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
