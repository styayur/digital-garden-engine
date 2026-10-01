import type { Metadata } from 'next';

import { FadeIn } from '@/components/FadeIn';
import { PageHeader } from '@/components/PageHeader';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Now',
  description: 'What this demo profile is building, learning and reading right now.',
};

export default function NowPage() {
  return (
    <>
      <PageHeader
        eyebrow="Current state"
        title="Now"
        description="A small snapshot of the present. It changes slowly because the useful work usually does."
      >
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          Last updated {site.now.updated} · {site.now.location}
        </p>
      </PageHeader>

      <section className="container-page pb-10 pt-4 sm:pt-6">
        <div>
          {site.now.currently.map((item, index) => (
            <FadeIn key={item.label}>
              <div className="grid gap-3 border-t border-line/70 py-12 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-10">
                <p className="eyebrow self-start pt-2">
                  {String(index + 1).padStart(2, '0')} — Currently {item.label}
                </p>
                <div>
                  <p className="font-display text-4xl leading-tight text-ink sm:text-5xl">
                    {item.value}
                  </p>
                  {item.detail && (
                    <p className="mt-4 max-w-xl font-serif text-lg leading-relaxed text-muted">
                      {item.detail}
                    </p>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="border-t border-line/70 py-12">
            {site.now.notes.map((note) => (
              <p key={note} className="max-w-2xl font-serif text-lg italic leading-relaxed text-muted">
                {note}
              </p>
            ))}
          </div>
        </FadeIn>
      </section>
    </>
  );
}
