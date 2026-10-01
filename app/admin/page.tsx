import type { Metadata } from 'next';

import { AdminGate } from '@/components/admin/AdminGate';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/**
 * The editor is rendered client-side so the page can also be statically
 * exported. On a Node deployment the session check talks to
 * /api/admin/session; on static hosting that endpoint simply does not
 * exist, and the UI explains that the admin needs a Node runtime.
 */
export default function AdminPage() {
  return (
    <section className="container-page pb-16 pt-12 sm:pt-16">
      <p className="eyebrow">Control room</p>
      <h1 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
        Garden Admin
      </h1>
      <p className="mt-4 max-w-2xl font-serif text-[15px] leading-relaxed text-muted">
        Edit the content that grows this site — essays, projects and the
        library shelves. Changes are written straight to{' '}
        <code className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
          content/
        </code>{' '}
        and appear after the next build.
      </p>

      <div className="mt-10 max-w-4xl">
        <AdminGate />
      </div>
    </section>
  );
}