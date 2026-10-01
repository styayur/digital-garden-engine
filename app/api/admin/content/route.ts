import { NextResponse } from 'next/server';

import {
  readSessionToken,
  verifySessionToken,
} from '@/lib/admin';
import {
  deleteContent,
  getKindDef,
  listContent,
  readContent,
  type ContentKind,
  writeContent,
} from '@/lib/admin-content';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
}

function isAuthed(request: Request): boolean {
  return verifySessionToken(readSessionToken(request));
}

/**
 * GET /api/admin/content?kind=posts          → list
 * GET /api/admin/content?kind=posts&slug=x   → raw source of one file
 */
export function GET(request: Request) {
  if (!isAuthed(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind') ?? '';
  const slug = searchParams.get('slug') ?? '';
  const def = getKindDef(kind);

  if (!def) {
    return NextResponse.json({ error: 'Unknown content kind.' }, { status: 400 });
  }

  if (slug) {
    const source = readContent(kind as ContentKind, slug);
    if (source === null) {
      return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({
      kind,
      slug,
      filename: `${slug}${def.ext}`,
      source,
    });
  }

  return NextResponse.json({ kind, entries: listContent(kind as ContentKind) });
}

/** Create or overwrite one entry (rename = create new + delete old). */
export async function POST(request: Request) {
  if (!isAuthed(request)) return unauthorized();

  let body: { kind?: unknown; slug?: unknown; source?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const kind = typeof body.kind === 'string' ? body.kind : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' ? body.source : '';
  const def = getKindDef(kind);

  if (!def) {
    return NextResponse.json({ error: 'Unknown content kind.' }, { status: 400 });
  }

  const result = writeContent(kind as ContentKind, slug, source);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    slug,
    filename: result.filename,
    viewPath: def.viewPath ? def.viewPath(slug) : null,
  });
}

export async function DELETE(request: Request) {
  if (!isAuthed(request)) return unauthorized();

  let body: { kind?: unknown; slug?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const kind = typeof body.kind === 'string' ? body.kind : '';
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const def = getKindDef(kind);

  if (!def || !slug) {
    return NextResponse.json({ error: 'Unknown content kind or slug.' }, { status: 400 });
  }

  const removed = deleteContent(kind as ContentKind, slug);
  if (!removed) {
    return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, slug });
}
