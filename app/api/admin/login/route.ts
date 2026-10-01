import { NextResponse } from 'next/server';

import {
  passwordMatches,
  sessionCookieHeader,
} from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let password = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === 'string') password = body.password;
  } catch {
    // fall through to the generic failure below
  }

  if (!passwordMatches(password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const proto = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol;
  const secure = proto.includes('https');

  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': sessionCookieHeader(secure) } },
  );
}