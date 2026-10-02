'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

import { ArrowRightIcon } from '@/components/Icons';
import { site } from '@/lib/site';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PortfolioHero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(52rem 36rem at 82% -12%, rgb(var(--accent) / 0.09), transparent 62%)',
        }}
      />

      <div className="container-page relative pb-20 pt-24 sm:pb-24 sm:pt-32">
        <motion.p className="eyebrow" {...rise(0)}>
          Open Source Studio
        </motion.p>

        <motion.h1
          {...rise(0.08)}
          className="mt-7 font-display text-[clamp(3.2rem,9vw,6.25rem)] leading-[0.98] tracking-tight text-ink"
        >
          {site.name}
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted sm:text-xs"
        >
          {site.role}
        </motion.p>

        <motion.div
          {...rise(0.24)}
          className="mt-12 max-w-3xl font-serif text-[1.6rem] leading-[1.5] text-ink/90 sm:text-4xl sm:leading-[1.4]"
        >
          {site.intro.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </motion.div>

        <motion.p {...rise(0.3)} className="mt-5 font-serif text-lg italic text-muted">
          {site.description}
        </motion.p>

        <motion.div {...rise(0.38)} className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2.5 rounded-full border border-accent/50 bg-accent/10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:bg-accent/20"
          >
            Explore Projects
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          {site.socials.github && (
            <a
              href={site.socials.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-ink/40 hover:text-ink"
            >
              GitHub
            </a>
          )}
          <Link
            href="/writing"
            className="inline-flex items-center gap-2.5 rounded-full border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-accent/40 hover:text-accent"
          >
            Writing
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
