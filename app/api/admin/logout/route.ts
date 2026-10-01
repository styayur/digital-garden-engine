import { NextResponse } from 'next/server';

import { clearSessionCookieHeader } from '@/lib/admin';

export const runtime = 'nodejs';

export function POST() {
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearSessionCookieHeader() } },
  );
}