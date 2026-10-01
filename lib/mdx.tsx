import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

/**
 * Shared MDX compiler for all garden content.
 * It runs once, at build time, for statically generated pages.
 *
 * remark-gfm     → tables, strikethrough, task lists
 * rehype-slug    → stable heading ids (used by the table of contents)
 * rehype-highlight → syntax highlighting (styles live in globals.css)
 */
export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeHighlight, { ignoreMissing: true }]],
      },
    },
  });
  return content;
}