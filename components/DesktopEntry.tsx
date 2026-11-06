'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isDesktopRuntime } from '@/lib/desktop';

export function DesktopEntry() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname === '/' && isDesktopRuntime()) router.replace('/editor/');
  }, [pathname, router]);
  return null;
}
