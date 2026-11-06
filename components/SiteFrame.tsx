'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { DesktopEntry } from '@/components/DesktopEntry';

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/editor')) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <DesktopEntry />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
