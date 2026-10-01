import Link from 'next/link';

import { ArrowUpRightIcon } from '@/components/Icons';
import type { PostMeta } from '@/lib/posts';
import { cn, formatDate } from '@/lib/utils';

interface ArticleCardProps {
  post: PostMeta;
  /** Optional 1-based position shown in the margin. */
  index?: number;
  /** First essay in a list gets more presence. */
  large?: boolean;
}

/**
 * A literary-journal row: title, date, summary, tags.
 * The parent decides separators (e.g. divide-y).
 */
export function ArticleCard({ post, index, large = false }: ArticleCardProps) {
  const href = `/writing/${post.slug}`;

  return (
    <Link href={href} className="group block">
      <article className={cn('py-8', large && 'py-10 sm:py-12')}>
        <div className="flex items-baseline justify-between gap-6">
          <h3
            className={cn(
              'font-display text-ink transition-colors duration-300 group-hover:text-accent',
              large
                ? 'text-3xl leading-tight sm:text-[2.6rem]'
                : 'text-2xl leading-snug sm:text-[1.7rem]',
            )}
          >
            {post.title}
          </h3>
          <span className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-faint">
            {typeof index === 'number' && (
              <span className="hidden text-accent/70 sm:inline">
                {String(index).padStart(2, '0')}
              </span>
            )}
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </span>
        </div>

        <p className="mt-3 max-w-2xl font-serif text-[15px] leading-relaxed text-muted">
          {post.description}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {post.tags.map((tag) => (
              <li key={tag}>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  #{tag}
                </span>
              </li>
            ))}
          </ul>
          <ArrowUpRightIcon className="h-3.5 w-3.5 -translate-x-1 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      </article>
    </Link>
  );
}