import Link from 'next/link';

import { ArrowUpRightIcon } from '@/components/Icons';
import type { Project, ProjectStatus } from '@/lib/projects';

const STATUS_CLASS: Record<ProjectStatus, string> = {
  Building: 'text-accent',
  Live: 'text-emerald-400',
  Prototype: 'text-amber-300',
  Paused: 'text-muted',
  Archived: 'text-faint',
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects#${project.slug}`}
      className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent/40 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl leading-tight text-ink transition-colors duration-300 group-hover:text-accent">
          {project.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] ${STATUS_CLASS[project.status]}`}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          {project.status}
        </span>
      </div>

      <p className="mt-3 font-serif text-[15px] leading-relaxed text-muted">
        {project.summary}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          {project.stack.join('  /  ')}
        </p>
        <ArrowUpRightIcon className="h-4 w-4 -translate-x-1 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
    </Link>
  );
}