import Link from 'next/link';

import { ArrowRightIcon } from '@/components/Icons';

interface SectionHeadingProps {
  index: string;
  title: string;
  href?: string;
  linkLabel?: string;
}

/** Indexed section heading, e.g. "01 — Latest Writing". */
export function SectionHeading({
  index,
  title,
  href,
  linkLabel = 'View all',
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex items-baseline gap-4">
        <span className="eyebrow">{index}</span>
        <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          {linkLabel}
          <ArrowRightIcon className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}