import type { Metadata } from 'next';

import { PageHeader } from '@/components/PageHeader';
import { Terminal } from '@/components/Terminal';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terminal',
  description: 'A small command prompt for exploring the garden.',
};

export default function TerminalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hidden mode"
        title="Terminal"
        description="A small door at the back of the garden. No real shell lives here — just a prompt that knows where things are."
      >
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          {site.terminal.user}@{site.terminal.host} · type help
        </p>
      </PageHeader>

      <section className="container-page pb-10 pt-4 sm:pt-8">
        <div className="mx-auto max-w-3xl">
          <Terminal
            user={site.terminal.user}
            host={site.terminal.host}
            about={`${site.name} — ${site.role}.`}
            role={site.role}
          />
          <p className="mt-5 font-serif text-sm italic leading-relaxed text-faint">
            Try <span className="font-mono not-italic text-muted">help</span>,{' '}
            <span className="font-mono not-italic text-muted">about</span>,{' '}
            <span className="font-mono not-italic text-muted">projects</span>{' '}
            or <span className="font-mono not-italic text-muted">now</span> —
            arrow keys recall history.
          </p>
        </div>
      </section>
    </>
  );
}
