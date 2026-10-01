'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { MoonIcon, SunIcon } from '@/components/Icons';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch: the icon is only drawn after mount.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={
        mounted ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : undefined
      }
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-line/30 hover:text-ink"
    >
      {mounted ? (
        isDark ? (
          <SunIcon className="h-4 w-4" />
        ) : (
          <MoonIcon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}