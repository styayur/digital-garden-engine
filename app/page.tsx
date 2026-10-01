import Link from 'next/link';

import { ArticleCard } from '@/components/ArticleCard';
import { BookCard } from '@/components/BookCard';
import { FadeIn } from '@/components/FadeIn';
import { Hero } from '@/components/Hero';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { ProjectCard } from '@/components/ProjectCard';
import { SectionHeading } from '@/components/SectionHeading';
import { getBooks, getQuotes } from '@/lib/library';
import { getLatestPosts } from '@/lib/posts';
import { getFeaturedProjects } from '@/lib/projects';

export default function HomePage() {
  const [first, ...rest] = getLatestPosts(4);
  const projects = getFeaturedProjects().slice(0, 3);
  const books = getBooks().slice(0, 3);
  const quote = getQuotes()[0];

  return (
    <>
      <Hero />

      {/* 01 — Latest writing */}
      <section className="container-page mt-28 sm:mt-36">
        <FadeIn>
          <SectionHeading
            index="01"
            title="Latest Writing"
            href="/writing"
            linkLabel="All essays"
          />
          <div className="mt-8 divide-y divide-line/70 border-t border-line/70">
            {first && <ArticleCard post={first} index={1} large />}
            {rest.map((post, i) => (
              <ArticleCard key={post.slug} post={post} index={i + 2} />
            ))}
          </div>
        </FadeIn>
      </section>

      {/* 02 — Featured projects */}
      <section className="container-page mt-28 sm:mt-36">
        <FadeIn>
          <SectionHeading
            index="02"
            title="Featured Projects"
            href="/projects"
            linkLabel="The workshop"
          />
        </FadeIn>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <FadeIn key={project.slug} delay={i * 0.08} className="h-full">
              <ProjectCard project={project} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 03 — Digital garden */}
      <section className="container-page mt-28 sm:mt-36">
        <FadeIn>
          <SectionHeading
            index="03"
            title="The Garden"
            href="/garden"
            linkLabel="Wander it"
          />
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <p className="max-w-md font-serif text-lg leading-relaxed text-muted">
              Every essay, project and shelf in this place is a plant in one
              of six provinces — <span className="text-ink">AI</span>,{' '}
              <span className="text-ink">Programming</span>,{' '}
              <span className="text-ink">Literature</span>,{' '}
              <span className="text-ink">Philosophy</span>,{' '}
              <span className="text-ink">Systems</span> and{' '}
              <span className="text-ink">Cognition</span>. The map is drawn
              the way the mind is: by association, not by folder.
            </p>
            <FadeIn delay={0.1}>
              <KnowledgeGraph />
            </FadeIn>
          </div>
        </FadeIn>
      </section>

      {/* 04 — Library */}
      <section className="container-page mt-28 sm:mt-36">
        <FadeIn>
          <SectionHeading
            index="04"
            title="From the Library"
            href="/library"
            linkLabel="Browse shelves"
          />
        </FadeIn>

        {quote && (
          <FadeIn>
            <figure className="mt-10 border-l-2 border-accent/60 pl-6 sm:pl-8">
              <blockquote className="max-w-3xl font-display text-2xl italic leading-snug text-ink sm:text-[1.9rem]">
                {quote.body}
              </blockquote>
              <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                — {quote.author}
              </figcaption>
            </figure>
          </FadeIn>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, i) => (
            <FadeIn key={book.slug} delay={i * 0.08} className="h-full">
              <BookCard entry={book} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="container-page mt-28 sm:mt-36">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="font-serif text-xl italic leading-relaxed text-muted sm:text-2xl">
            “This garden is written by hand — in prose and in code,
            <br className="hidden sm:block" /> and tended slowly, the way
            ideas deserve.”
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/20"
            >
              Read the introduction
            </Link>
            <Link
              href="/terminal"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              ~ hidden terminal
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}