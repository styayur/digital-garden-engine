'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

import { ArrowRightIcon } from '@/components/Icons';
import { site } from '@/lib/site';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Hero() {
  const reduce = useReducedMotion();

  /** Small entrance helper; disabled for reduced-motion users. */
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
      {/* faint atmospheric glow — the 10% mystery */}
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
          A quiet digital garden — est. 2026
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

        <motion.div
          {...rise(0.34)}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/writing"
            className="group inline-flex items-center gap-2.5 rounded-full border border-accent/50 bg-accent/10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:bg-accent/20"
          >
            Read Essays
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2.5 rounded-full border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-ink/40 hover:text-ink"
          >
            View Projects
          </Link>
        </motion.div>

        {/* Currently — building / learning / reading */}
        <motion.div {...rise(0.44)} className="mt-20 border-t border-line/70 pt-8 sm:mt-24">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Now</p>
            <Link
              href="/now"
              className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-accent"
            >
              what I’m doing
              <ArrowRightIcon className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <dl className="mt-9 grid gap-x-10 gap-y-9 sm:grid-cols-3">
            {site.now.currently.slice(0, 3).map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                  Currently {item.label}
                </dt>
                <dd className="mt-3 font-display text-[1.6rem] leading-tight text-ink">
                  {item.value}
                </dd>
                <dd className="mt-1.5 font-serif text-sm leading-relaxed text-muted">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
