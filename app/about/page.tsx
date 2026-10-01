import type { Metadata } from 'next';

import { FadeIn } from '@/components/FadeIn';
import { PageHeader } from '@/components/PageHeader';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: 'About this garden, its principles and the demo profile.',
};

const PRINCIPLES = [
  {
    title: 'Publish half-formed, revise forever.',
    text: 'An idea can be useful before it is finished. Treat pages as plants that may grow, split or be pruned.',
  },
  {
    title: 'Let the shelf show the reading.',
    text: 'A library becomes honest when it records what is being read, queued and finished rather than performing taste.',
  },
  {
    title: 'Plain text over platforms.',
    text: 'Ordinary files are durable, portable and easy to audit. The web is a visitor, not a landlord.',
  },
  {
    title: 'Slow over new.',
    text: 'A garden can be updated often, but it does not need to chase every cycle of attention.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title={site.name} description={site.description} />

      <section className="container-page pb-10 pt-6 sm:pt-8">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <FadeIn>
            <div className="space-y-8">
              <div className="rounded-2xl border border-line bg-surface p-8">
                <p className="eyebrow">Identity</p>
                <ul className="mt-6 space-y-3 font-mono text-sm text-muted">
                  {site.about.identity.map((item) => (
                    <li key={item.label}>
                      <span className="text-faint">{item.label}</span>
                      <span className="float-right text-ink">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-8">
                <p className="eyebrow">Colophon</p>
                <p className="mt-6 font-serif text-[15px] leading-relaxed text-muted">
                  This garden is set in Cormorant Garamond, Source Serif, Inter and
                  JetBrains Mono. It is compiled from Markdown and MDX by Next.js,
                  styled with Tailwind CSS, and exported as static files.
                </p>
                <div className="mt-8 space-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                  <p>next.js · typescript · mdx · tailwind</p>
                  <p>local-first · static-first · privacy-aware</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="font-serif text-[1.05rem] leading-[1.9] text-muted">
              {site.about.bio.map((paragraph, index) => (
                <p key={paragraph} className={index > 0 ? 'mt-6' : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => (
                <div key={principle.title}>
                  <h2 className="font-display text-xl text-ink">{principle.title}</h2>
                  <p className="mt-3 font-serif text-[15px] leading-relaxed text-muted">
                    {principle.text}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
