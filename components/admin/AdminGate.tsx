'use client';

import { useEffect, useState } from 'react';

import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminLogin } from '@/components/admin/AdminLogin';

type SessionState = 'checking' | 'authed' | 'guest';

/**
 * Client-side gate for /admin. Asks /api/admin/session whether the current
 * session is valid; falls back to the login form when the endpoint is
 * unreachable (e.g. a static GitHub Pages deployment).
 */
export function AdminGate() {
  const [state, setState] = useState<SessionState>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session')
      .then((res) => res.json())
      .then((data: { authenticated?: boolean }) => {
        if (!cancelled) setState(data.authenticated ? 'authed' : 'guest');
      })
      .catch(() => {
        // No API available (static hosting) — show the login screen.
        if (!cancelled) setState('guest');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'checking') {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
        Checking session…
      </p>
    );
  }

  if (state === 'authed') {
    return <AdminDashboard />;
  }

  return (
    <div className="space-y-6">
      <AdminLogin configured />
      <p className="max-w-md font-mono text-[10px] leading-relaxed text-faint">
        Note: on static hosting (GitHub Pages) there is no server, so the
        editor cannot write files. Run the site with a Node server
        (npm run dev / start) to use it.
      </p>
    </div>
  );
}