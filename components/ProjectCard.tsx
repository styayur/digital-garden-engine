import { ProjectStatusBadge } from '@/components/ProjectStatusBadge';
import { TechPill } from '@/components/TechPill';
import type { Project } from '@/lib/projects';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const actions = [
    project.github ? { label: 'GitHub', url: project.github } : null,
    project.live ? { label: 'Live', url: project.live } : null,
    project.release ? { label: 'Release', url: project.release } : null,
    ...project.links,
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  return (
    <div className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent/40 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl leading-tight text-ink">{project.name}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.image && (
        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={`${project.name} screenshot`}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <p className="mt-4 font-serif text-[15px] leading-relaxed text-muted">{project.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.stack.slice(0, 6).map((tech) => (
          <TechPill key={tech}>{tech}</TechPill>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-6">
          {actions.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
