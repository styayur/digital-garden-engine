'use client';

import { useCallback, useEffect, useState } from 'react';

import { ArrowUpRightIcon } from '@/components/Icons';
import { cn } from '@/lib/utils';

type KindKey = 'posts' | 'projects' | 'library';

interface KindOption {
  key: KindKey;
  label: string;
  singular: string;
  ext: string;
  hint: string;
}

const KIND_OPTIONS: KindOption[] = [
  {
    key: 'posts',
    label: 'Essays',
    singular: 'Essay',
    ext: '.mdx',
    hint: 'frontmatter: title, date, description, tags[], status (seedling|budding|evergreen)',
  },
  {
    key: 'projects',
    label: 'Projects',
    singular: 'Project',
    ext: '.mdx',
    hint: 'frontmatter: name, summary, year, status, featured, stack[]',
  },
  {
    key: 'library',
    label: 'Library',
    singular: 'Library entry',
    ext: '.md',
    hint: 'frontmatter: kind (book|note|quote), title, author?, status?, date?, note?, tags[]',
  },
];

interface Entry {
  slug: string;
  title: string;
  date?: string;
}

interface EditDraft {
  kind: KindKey;
  slug: string;
  originalSlug: string | null;
  source: string;
}

interface Notice {
  text: string;
  tone: 'ok' | 'err';
}

const VIEW: Record<KindKey, ((slug: string) => string) | null> = {
  posts: (slug) => `/writing/${slug}`,
  projects: (slug) => `/projects#${slug}`,
  library: null,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function starterSource(kind: KindKey): string {
  const date = today();
  if (kind === 'posts') {
    return [
      '---',
      'title: Untitled',
      `date: ${date}`,
      'description: A sentence about what this essay holds.',
      'tags: [Notes]',
      'status: seedling',
      '---',
      '',
      'Write here. It can be a seedling — the garden allows it.',
      '',
    ].join('\n');
  }
  if (kind === 'projects') {
    return [
      '---',
      'name: Untitled Project',
      'summary: One sentence about what it is and why it exists.',
      'year: 2026',
      'status: Prototype',
      'featured: false',
      'stack: [TypeScript]',
      'links: []',
      '---',
      '',
      'Field notes on the project, if any.',
      '',
    ].join('\n');
  }
  return [
    '---',
    'kind: note',
    'title: Untitled note',
    `date: ${date}`,
    'tags: [Notes]',
    '---',
    '',
    'The note itself.',
    '',
  ].join('\n');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      data.error ?? `Request failed (${res.status}) — refresh to re-authenticate.`,
    );
  }
  return data;
}

export function AdminDashboard() {
  const [kind, setKind] = useState<KindKey>('posts');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const activeKind = KIND_OPTIONS.find((option) => option.key === kind)!;

  const load = useCallback(async (target: KindKey) => {
    try {
      const data = await request<{ entries: Entry[] }>(
        `/api/admin/content?kind=${target}`,
      );
      setEntries(data.entries);
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : 'Failed to load entries.',
        tone: 'err',
      });
    }
  }, []);

  useEffect(() => {
    void load(kind);
  }, [kind, load]);

  const switchKind = (next: KindKey) => {
    setKind(next);
    setDraft(null);
    setNotice(null);
  };

  const beginNew = () => {
    setDraft({
      kind,
      slug: '',
      originalSlug: null,
      source: starterSource(kind),
    });
    setNotice(null);
  };

  const beginEdit = async (entry: Entry) => {
    try {
      const data = await request<{ source: string }>(
        `/api/admin/content?kind=${kind}&slug=${entry.slug}`,
      );
      setDraft({
        kind,
        slug: entry.slug,
        originalSlug: entry.slug,
        source: data.source,
      });
      setNotice(null);
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : 'Failed to load entry.',
        tone: 'err',
      });
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setNotice(null);
    try {
      const slug = draft.slug.trim().toLowerCase();
      const data = await request<{ ok: boolean }>('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify({ kind: draft.kind, slug, source: draft.source }),
      });
      if (!data.ok) throw new Error('Save failed.');

      // A changed slug means a rename → remove the old file.
      if (draft.originalSlug && draft.originalSlug !== slug) {
        await request('/api/admin/content', {
          method: 'DELETE',
          body: JSON.stringify({ kind: draft.kind, slug: draft.originalSlug }),
        }).catch(() => undefined);
      }

      setNotice({ text: `Saved ${slug}${activeKind.ext}`, tone: 'ok' });
      setDraft(null);
      await load(kind);
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : 'Save failed.',
        tone: 'err',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: Entry) => {
    const filename = `${entry.slug}${activeKind.ext}`;
    if (!window.confirm(`Delete ${filename}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await request('/api/admin/content', {
        method: 'DELETE',
        body: JSON.stringify({ kind, slug: entry.slug }),
      });
      setNotice({ text: `Deleted ${filename}`, tone: 'ok' });
      await load(kind);
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : 'Delete failed.',
        tone: 'err',
      });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await request('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* kind tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => switchKind(option.key)}
              className={cn(
                'rounded-md px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                option.key === kind
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={beginNew}
            className="rounded-md border border-accent/50 bg-accent/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent/20"
          >
            + New {activeKind.singular}
          </button>
          <button
            type="button"
            onClick={logout}
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-muted"
          >
            Sign out
          </button>
        </div>
      </div>

      {notice && (
        <p
          className={cn(
            'rounded-lg border px-4 py-2.5 font-mono text-xs',
            notice.tone === 'ok'
              ? 'border-accent/30 bg-accent-soft/50 text-accent'
              : 'border-red-500/30 bg-red-500/10 text-red-400',
          )}
        >
          {notice.text}
        </p>
      )}

      {draft ? (
        <Editor
          draft={draft}
          busy={busy}
          ext={activeKind.ext}
          hint={activeKind.hint}
          onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
          onSave={save}
          onCancel={() => {
            setDraft(null);
            setNotice(null);
          }}
        />
      ) : (
        /* entry list */
        <ul className="overflow-hidden rounded-xl border border-line bg-surface">
          {entries.length === 0 ? (
            <li className="px-6 py-12 text-center font-serif text-sm text-faint">
              Nothing here yet — plant the first one.
            </li>
          ) : (
            entries.map((entry) => {
              const viewPath = VIEW[kind]?.(entry.slug) ?? null;
              return (
                <li
                  key={entry.slug}
                  className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[15px] text-ink">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                      {entry.slug}
                      {entry.date ? ` · ${entry.date}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {viewPath && (
                      <a
                        href={viewPath}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${entry.slug}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-line/30 hover:text-accent"
                      >
                        <ArrowUpRightIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void beginEdit(entry)}
                      disabled={busy}
                      className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:bg-line/30 hover:text-ink disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(entry)}
                      disabled={busy}
                      className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface EditorProps {
  draft: EditDraft;
  busy: boolean;
  ext: string;
  hint: string;
  onChange: (patch: Partial<EditDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}

function Editor({ draft, busy, ext, hint, onChange, onSave, onCancel }: EditorProps) {
  const isRename = draft.originalSlug !== null && draft.originalSlug !== draft.slug;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            File
          </label>
          <input
            value={draft.slug}
            onChange={(e) =>
              onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
            }
            placeholder="slug-name"
            spellCheck={false}
            className="w-56 rounded-md border border-line bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60"
          />
          <span className="font-mono text-sm text-faint">{ext}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy || draft.slug.length === 0}
            className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {isRename && (
        <p className="border-b border-line bg-accent-soft/40 px-5 py-2 font-mono text-[11px] text-accent">
          Renaming — the old file {draft.originalSlug}
          {ext} will be deleted after saving.
        </p>
      )}

      <textarea
        value={draft.source}
        onChange={(e) => onChange({ source: e.target.value })}
        spellCheck={false}
        rows={26}
        className="block w-full resize-y bg-bg px-5 py-4 font-mono text-[13px] leading-relaxed text-ink outline-none"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {hint}
        </p>
        <p className="font-mono text-[10px] text-faint">
          {draft.source.length.toLocaleString()} chars
        </p>
      </div>
    </div>
  );
}