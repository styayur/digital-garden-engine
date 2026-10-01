import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="eyebrow">404 — lost path</p>
      <h1 className="mt-6 font-display text-5xl leading-tight text-ink sm:text-7xl">
        This path leads
        <br />
        to the undergrowth.
      </h1>
      <p className="mt-7 max-w-md font-serif text-lg leading-relaxed text-muted">
        The page you followed has not grown here — or it was pruned. Either
        way, the garden is still open.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        ← Back to the entrance
      </Link>
    </section>
  );
}