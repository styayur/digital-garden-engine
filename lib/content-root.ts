import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PUBLIC_CONTENT = path.join('examples', 'content', 'published');

/** Resolve the directory that contains posts/, projects/ and library/. */
export function getContentRoot(): string {
  const configured = process.env.DIGITAL_GARDEN_CONTENT_ROOT;
  if (configured) return path.resolve(process.cwd(), configured);

  const staged = path.join(process.cwd(), '.build', 'public-content');
  if (fs.existsSync(staged)) return staged;

  const rootContent = path.join(process.cwd(), 'content');
  if (fs.existsSync(rootContent)) return path.join(rootContent, 'published');

  return path.join(process.cwd(), DEFAULT_PUBLIC_CONTENT);
}

export function getPostsDirectory(): string {
  return path.join(getContentRoot(), 'posts');
}

export function getProjectsDirectory(): string {
  return path.join(getContentRoot(), 'projects');
}

export function getLibraryDirectory(): string {
  return path.join(getContentRoot(), 'library');
}
