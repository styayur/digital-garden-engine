import { ArrowUpRightIcon } from '@/components/Icons';
import { ProjectStatusBadge } from '@/components/ProjectStatusBadge';
import { TechPill } from '@/components/TechPill';
import type { Project } from '@/lib/projects';

interface FeaturedProjectCardProps {
  project: Project;
}

export function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  const primary = project.github ?? project.live ?? project.release ?? project.links[0]?.url;

  const body = (
    <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl leading-tight text-ink transition-colors duration-300 group-hover:text-accent sm:text-3xl">
          {project.name}
        </h3>
        <ProjectStatusBadge status={project.status} />
      </div>
      <p className="font-serif text-[15px] leading-relaxed text-muted">{project.summary}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex flex-wrap gap-2">
          {project.stack.slice(0, 4).map((tech) => (
            <TechPill key={tech}>{tech}</TechPill>
          ))}
        </div>
        <ArrowUpRightIcon className="h-4 w-4 text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    </div>
  );

  const image = project.image ? (
    <div className="aspect-[16/9] overflow-hidden border-b border-line bg-bg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={project.image}
        alt={`${project.name} screenshot`}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        loading="lazy"
      />
    </div>
  ) : null;

  if (primary) {
    return (
      <a
        href={primary}
        target="_blank"
        rel="noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-300 hover:border-accent/40"
      >
        {image}
        {body}
      </a>
    );
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
      {image}
      {body}
    </div>
  );
}
