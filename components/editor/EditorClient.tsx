'use client';

import dynamic from 'next/dynamic';

export const EditorClient = dynamic(
  () => import('./EditorShell').then((module) => module.EditorShell),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-screen place-items-center bg-[#07090c] text-center">
        <div>
          <p className="font-display text-2xl text-ink">Opening Rhizomaybor…</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Loading the visual editor</p>
        </div>
      </div>
    ),
  },
);
