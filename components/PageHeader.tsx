import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Shared editorial header for inner pages. */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="container-page pb-4 pt-16 sm:pb-6 sm:pt-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-5 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">
        {title}
      </h1>
      {description && (
        <p className="mt-7 max-w-2xl font-serif text-lg leading-relaxed text-muted">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}