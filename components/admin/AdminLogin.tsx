'use client';

import { useState, type FormEvent } from 'react';

export function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8">
        <p className="font-serif text-lg text-ink">Admin is disabled.</p>
        <p className="mt-3 max-w-xl font-serif text-[15px] leading-relaxed text-muted">
          Set the <code className="text-accent">ADMIN_PASSWORD</code>{' '}
          environment variable (and optionally{' '}
          <code className="text-accent">ADMIN_SECRET</code>) and restart the
          server to enable the editor.
        </p>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Login failed.');
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm rounded-xl border border-line bg-surface p-8">
      <p className="eyebrow">Restricted</p>
      <h2 className="mt-4 font-display text-2xl text-ink">Sign in</h2>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          className="w-full rounded-md border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60"
        />
        {error && (
          <p className="font-mono text-xs text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="w-full rounded-md border border-accent/50 bg-accent/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Enter the garden'}
        </button>
      </form>
      <p className="mt-5 font-mono text-[10px] leading-relaxed text-faint">
        Dev default password: <span className="text-muted">admin</span> — set{' '}
        <span className="text-muted">ADMIN_PASSWORD</span> to change it.
      </p>
    </div>
  );
}