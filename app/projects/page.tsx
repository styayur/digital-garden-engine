import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { FadeIn } from '@/components/FadeIn';
import { PageHeader } from '@/components/PageHeader';
import { ProjectGroup } from '@/components/ProjectGroup';
import { renderMdx } from '@/lib/mdx';
import { PROJECT_CATEGORIES, getAllProjects, getProjectsByCategory } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Local-first software, developer tools and knowledge systems — the open source studio of Stya Yur.',
};

export default async function ProjectsPage() {
  const projects = getAllProjects();
  const byCategory = getProjectsByCategory();

  const rendered = new Map<string, ReactNode>();
  for (const project of projects) {
    if (project.body.trim()) {
      rendered.set(project.slug, await renderMdx(project.body));
    }
  }

  const withNotes = projects.filter((project) => project.body.trim());

  return (
    <>
      <PageHeader
        eyebrow="The workshop"
        title="Open Source Studio"
        description="Local-first software, developer tools and knowledge systems — built slowly, kept honest, and explicit about their boundaries."
      />

      <section className="container-page pb-10 pt-6 sm:pt-8">
        {PROJECT_CATEGORIES.map(({ value, label }) => (
          <FadeIn key={value}>
            <ProjectGroup label={label} projects={byCategory.get(value) ?? []} />
          </FadeIn>
        ))}

        {withNotes.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-2xl leading-tight text-ink">Field notes</h2>
            {withNotes.map((project) => (
              <article
                key={project.slug}
                id={project.slug}
                className="scroll-mt-24 border-t border-line/60 py-12 first:border-t-0"
              >
                <h3 className="font-display text-3xl leading-tight text-ink">{project.name}</h3>
                <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-muted">
                  {project.summary}
                </p>
                {rendered.get(project.slug) && (
                  <div className="prose mt-9 max-w-2xl">{rendered.get(project.slug)}</div>
                )}
              </article>
            ))}
          </section>
        )}
      </section>
    </>
  );
}
