import { ProjectCard } from '@/components/ProjectCard';
import type { Project } from '@/lib/projects';

interface ProjectGroupProps {
  label: string;
  projects: Project[];
}

export function ProjectGroup({ label, projects }: ProjectGroupProps) {
  if (projects.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl leading-tight text-ink">{label}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
