import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Minimal, dependency-free admin authentication.
 *
 * - Password comes from the ADMIN_PASSWORD env var.
 * - On success a stateless HttpOnly cookie is issued, signed with HMAC-SHA256
 *   (secret = ADMIN_SECRET, or derived from the password).
 * - In development, when ADMIN_PASSWORD is unset, the password falls back to
 *   "admin" with a warning, so the editor works out of the box.
 * - In production the editor is disabled until ADMIN_PASSWORD is configured.
 */

export const ADMIN_COOKIE = 'sy_admin_session';
const SESSION_DAYS = 7;

let warned = false;

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (password && password.length > 0) return password;
  if (process.env.NODE_ENV === 'production') return null;
  if (!warned) {
    warned = true;
    console.warn(
      '[admin] ADMIN_PASSWORD is not set — using the dev-only password "admin".',
    );
  }
  return 'admin';
}

function secret(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return process.env.ADMIN_SECRET || `sy-admin:${password}`;
}

function sign(value: string): string {
  const key = secret();
  if (!key) throw new Error('Admin secret is not configured');
  return createHmac('sha256', key).update(value).digest('hex');
}

export function passwordMatches(input: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${sign(`session:${expires}`)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;
  const expiresPart = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expires = Number(expiresPart);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  let expected: string;
  try {
    expected = sign(`session:${expires}`);
  } catch {
    return false;
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Read the session cookie out of a Request. */
export function readSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie') ?? '';
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === ADMIN_COOKIE) {
      return part.slice(eq + 1).trim();
    }
  }
  return undefined;
}

export function sessionCookieHeader(secure = false): string {
  const secureFlag = secure ? '; Secure' : '';
  return `${ADMIN_COOKIE}=${createSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secureFlag}`;
}

export function clearSessionCookieHeader(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}