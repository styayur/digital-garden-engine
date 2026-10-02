interface TechPillProps {
  children: string;
}

export function TechPill({ children }: TechPillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
      {children}
    </span>
  );
}
