import { NextResponse } from 'next/server';

import {
  getAdminPassword,
  readSessionToken,
  verifySessionToken,
} from '@/lib/admin';

export const runtime = 'nodejs';

/** Used by the admin UI to learn whether the current session is valid. */
export function GET(request: Request) {
  const authenticated = verifySessionToken(readSessionToken(request));
  return NextResponse.json({
    authenticated,
    configured: getAdminPassword() !== null,
  });
}