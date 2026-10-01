import type { ReadingStatus, LibraryEntry } from '@/lib/library';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<ReadingStatus, string> = {
  reading: 'Reading',
  queued: 'Queued',
  read: 'Read',
};

const STATUS_CLASS: Record<ReadingStatus, string> = {
  reading: 'text-accent',
  queued: 'text-muted',
  read: 'text-faint',
};

interface BookCardProps {
  entry: LibraryEntry;
}

export function BookCard({ entry }: BookCardProps) {
  const initial = (entry.title || '?').charAt(0).toUpperCase();
  const status = entry.readingStatus ?? 'read';

  return (
    <article className="flex h-full gap-5 rounded-xl border border-line bg-surface p-5 transition-colors duration-300 hover:border-accent/40">
      {/* spine-like tile */}
      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-bg font-display text-2xl text-accent">
        {initial}
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            'font-mono text-[9px] uppercase tracking-[0.2em]',
            STATUS_CLASS[status],
          )}
        >
          {STATUS_LABEL[status]}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-snug text-ink">
          {entry.title}
        </h3>
        {entry.author && (
          <p className="mt-0.5 text-xs text-muted">{entry.author}</p>
        )}
        {entry.note && (
          <p className="mt-2.5 font-serif text-[13px] leading-relaxed text-faint">
            {entry.note}
          </p>
        )}
      </div>
    </article>
  );
}
