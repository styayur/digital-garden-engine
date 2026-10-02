import type { ProjectStatus } from '@/lib/projects';

const STATUS_STYLE: Record<ProjectStatus, string> = {
  stable: 'text-emerald-400',
  beta: 'text-sky-400',
  research: 'text-indigo-300',
  experimental: 'text-amber-300',
  maintenance: 'text-muted',
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] ${STATUS_STYLE[status]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {status}
    </span>
  );
}
