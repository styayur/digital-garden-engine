'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

import { ArrowUpRightIcon, SearchIcon } from '@/components/Icons';
import { cn } from '@/lib/utils';

export type CommandGroup = 'Page' | 'Essay' | 'Project';

export interface CommandItem {
  id: string;
  group: CommandGroup;
  label: string;
  href: string;
  /** Extra searchable text — never displayed. */
  keywords?: string[];
}

const GROUP_GLYPH: Record<CommandGroup, string> = {
  Page: '→',
  Essay: '¶',
  Project: '◇',
};

interface PaletteContextValue {
  openPalette: () => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used inside CommandProvider');
  return ctx;
}

/**
 * Owns the ⌘K / Ctrl+K shortcut and renders the palette dialog.
 * Items are prepared once in the root layout (server side).
 */
export function CommandProvider({
  items,
  children,
}: {
  items: CommandItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <PaletteContext.Provider value={{ openPalette }}>
      {children}
      <PaletteDialog open={open} onClose={() => setOpen(false)} items={items} />
    </PaletteContext.Provider>
  );
}

function PaletteDialog({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase().includes(q),
    );
  }, [items, query]);

  // Reset state each time the dialog opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keep the highlighted row visible.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        const item = results[active];
        if (item) run(item.href);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, run, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* input */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <SearchIcon className="h-4 w-4 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search essays, projects, pages…"
                className="h-6 flex-1 bg-transparent font-serif text-[15px] text-ink outline-none placeholder:text-faint"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-faint">
                esc
              </kbd>
            </div>

            {/* results */}
            <div ref={listRef} className="max-h-[46vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="px-5 py-10 text-center font-serif text-sm text-faint">
                  Nothing grows here yet.
                </p>
              ) : (
                results.map((item, i) => {
                  const showHeader = i === 0 || results[i - 1].group !== item.group;
                  return (
                    <div key={item.id}>
                      {showHeader && (
                        <p className="px-5 pb-1 pt-3 font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
                          {item.group}
                        </p>
                      )}
                      <button
                        type="button"
                        data-index={i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => run(item.href)}
                        className={cn(
                          'flex w-full items-center justify-between gap-4 px-5 py-2.5 text-left transition-colors',
                          i === active ? 'bg-accent-soft/70' : '',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'w-4 shrink-0 text-center font-mono text-[11px]',
                              i === active ? 'text-accent' : 'text-faint',
                            )}
                          >
                            {GROUP_GLYPH[item.group]}
                          </span>
                          <span
                            className={cn(
                              'truncate font-serif text-[15px]',
                              i === active ? 'text-ink' : 'text-muted',
                            )}
                          >
                            {item.label}
                          </span>
                        </span>
                        {i === active && (
                          <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* footer hints */}
            <div className="flex items-center gap-5 border-t border-line px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}