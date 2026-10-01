import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FadeIn } from '@/components/FadeIn';
import { renderMdx } from '@/lib/mdx';
import {
  getAllPosts,
  getPostBySlug,
  relatedPosts,
  type Post,
  type TocItem,
} from '@/lib/posts';
import { site } from '@/lib/site';
import { cn, formatDate } from '@/lib/utils';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
      url: `${site.url}/writing/${post.slug}`,
    },
  };
}

const STATUS_LABEL: Record<NonNullable<Post['maturity']>, string> = {
  seedling: 'seedling',
  budding: 'budding',
  evergreen: 'evergreen',
};

function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Table of contents">
      <p className="eyebrow">Contents</p>
      <ul className="mt-5 space-y-2.5 border-l border-line pl-5">
        {items
          .filter((item) => item.depth <= 3)
          .map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: item.depth > 2 ? '0.9rem' : undefined }}
            >
              <a
                href={`#${item.id}`}
                className="block font-serif text-[13px] leading-snug text-muted transition-colors hover:text-accent"
              >
                {item.text}
              </a>
            </li>
          ))}
      </ul>
    </nav>
  );
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const content = await renderMdx(post.body);
  const related = relatedPosts(post, 3);

  return (
    <div className="container-page pb-8 pt-12 sm:pt-16">
      <Link
        href="/writing"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-accent"
      >
        <span aria-hidden="true">←</span> All writing
      </Link>

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42.5rem)_minmax(0,1fr)] lg:gap-12">
        {/* left rail — title & filing details */}
        <aside className="hidden xl:col-start-1 xl:block">
          <div className="sticky top-28 space-y-9">
            <div>
              <p className="eyebrow">Filed under</p>
              <ul className="mt-4 space-y-2">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                      #{tag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <dl className="space-y-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              <div>
                <dt className="text-faint/80">Published</dt>
                <dd className="mt-1 text-muted">{formatDate(post.date)}</dd>
              </div>
              <div>
                <dt className="text-faint/80">Reading</dt>
                <dd className="mt-1 text-muted">{post.readingTime}</dd>
              </div>
              {post.maturity && (
                <div>
                  <dt className="text-faint/80">Kind</dt>
                  <dd className="mt-1 text-muted">
                    {STATUS_LABEL[post.maturity]} note
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>

        {/* centre — the essay, held to a 680px measure */}
        <article className="min-w-0 lg:col-start-2">
          <div className="mx-auto w-full max-w-article">
            <header>
              <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span aria-hidden="true">·</span>
                <span>{post.readingTime}</span>
                {post.maturity && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{STATUS_LABEL[post.maturity]}</span>
                  </>
                )}
              </div>
              <h1 className="mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-6 font-serif text-lg italic leading-relaxed text-muted">
                {post.description}
              </p>
            </header>

            <div className="prose mt-12 border-t border-line/70 pt-12">
              {content}
            </div>
          </div>
        </article>

        {/* right rail — table of contents */}
        <aside className="hidden xl:col-start-3 xl:block">
          <div className="sticky top-28">
            <Toc items={post.toc} />
          </div>
        </aside>
      </div>

      {/* related essays */}
      {related.length > 0 && (
        <FadeIn className="mx-auto mt-24 max-w-6xl border-t border-line/70 pt-14 lg:max-w-[42.5rem]">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            Read next
          </h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {related.map((candidate, i) => (
              <Link
                key={candidate.slug}
                href={`/writing/${candidate.slug}`}
                className="group block"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3
                  className={cn(
                    'mt-3 font-display text-xl leading-snug text-ink transition-colors duration-300 group-hover:text-accent',
                  )}
                >
                  {candidate.title}
                </h3>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  {formatDate(candidate.date)}
                </p>
              </Link>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}

