import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { FadeIn } from '@/components/FadeIn';
import { PageHeader } from '@/components/PageHeader';
import { renderMdx } from '@/lib/mdx';
import { getAllProjects } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Things being built in the workshop — AI systems, reading software and the quiet engine of this garden itself.',
};

export default async function ProjectsPage() {
  const projects = getAllProjects();

  // Field notes are optional; render them once, at build time.
  const rendered = new Map<string, ReactNode>();
  for (const project of projects) {
    if (project.body.trim()) {
      rendered.set(project.slug, await renderMdx(project.body));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="The workshop"
        title="Projects"
        description="A handful of things built slowly and kept alive — some growing, some in the field, one that is this very garden."
      />

      <section className="container-page pb-10 pt-6 sm:pt-8">
        <div>
          {projects.map((project, i) => (
            <FadeIn key={project.slug}>
              <article
                id={project.slug}
                className="scroll-mt-24 border-t border-line/60 py-14 first:border-t-0"
              >
                <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
                  {/* meta rail */}
                  <aside className="font-mono text-[11px] uppercase leading-loose tracking-[0.16em] text-faint">
                    <p>{project.year}</p>
                    <p className="text-accent">{project.status}</p>
                    <p className="mt-3 normal-case tracking-normal text-muted">
                      {project.stack.map((tech) => (
                        <span key={tech} className="block">
                          {tech}
                        </span>
                      ))}
                    </p>
                    {project.links.length > 0 && (
                      <ul className="mt-3 space-y-1 normal-case tracking-normal">
                        {project.links.map((link) => (
                          <li key={link.url}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
                            >
                              {link.label} ↗
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-6 text-faint/80">
                      {String(i + 1).padStart(2, '0')} /{' '}
                      {String(projects.length).padStart(2, '0')}
                    </p>
                  </aside>

                  {/* body */}
                  <div className="min-w-0">
                    <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                      {project.name}
                    </h2>
                    <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-muted">
                      {project.summary}
                    </p>
                    {rendered.get(project.slug) && (
                      <div className="prose mt-9 max-w-2xl">
                        {rendered.get(project.slug)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}