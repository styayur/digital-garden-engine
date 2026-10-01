import Link from 'next/link';

import { RssIcon } from '@/components/Icons';
import { site } from '@/lib/site';

const EXTRA_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Terminal', href: '/terminal' },
  { label: 'RSS', href: '/feed.xml' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 border-t border-line/70">
      <div className="container-page py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-2xl text-ink">{site.name}</p>
            <p className="mt-3 font-serif text-[15px] italic leading-relaxed text-muted">
              A garden is not a faster way to broadcast.
              <br />
              It is a slower way to mean something.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-16 gap-y-2.5"
            aria-label="Footer"
          >
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            {EXTRA_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
              >
                {item.label === 'RSS' && <RssIcon className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line/60 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name} — tended slowly
          </p>
          <p>
            Cormorant Garamond · Source Serif · Inter · JetBrains Mono
          </p>
        </div>
      </div>
    </footer>
  );
}