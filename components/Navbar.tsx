'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCommandPalette } from '@/components/CommandPalette';
import { MenuIcon, SearchIcon, XIcon } from '@/components/Icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { site } from '@/lib/site';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const { openPalette } = useCommandPalette();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu after navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,border-color] duration-300',
        scrolled
          ? 'border-line/70 bg-bg/80'
          : 'border-transparent bg-bg/60',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[1.35rem] tracking-wide text-ink transition-colors group-hover:text-accent">
            {site.name}
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-faint md:inline">
            {site.terminal.host}
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {site.nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative text-sm transition-colors',
                  active ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute -bottom-1.5 left-0 h-px w-full origin-left bg-accent transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette"
            className="hidden h-9 items-center gap-2 rounded-md border border-line/80 px-3 font-mono text-xs text-muted transition-colors hover:border-line hover:text-ink sm:inline-flex"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            Search
            <kbd className="rounded border border-line bg-surface px-1 text-[9px] text-faint">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:text-ink sm:hidden"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:text-ink lg:hidden"
          >
            {menuOpen ? (
              <XIcon className="h-4 w-4" />
            ) : (
              <MenuIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {menuOpen && (
        <nav
          className="border-t border-line/60 bg-bg/95 px-6 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {site.nav.map((item, i) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between border-b border-line/50 py-3 font-display text-xl transition-colors last:border-b-0',
                      active ? 'text-accent' : 'text-ink',
                    )}
                  >
                    {item.label}
                    <span className="font-mono text-[10px] text-faint">
                      0{i + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}