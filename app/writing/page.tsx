import type { Metadata } from 'next';

import { ArticleCard } from '@/components/ArticleCard';
import { FadeIn } from '@/components/FadeIn';
import { PageHeader } from '@/components/PageHeader';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Essays and field notes from the garden — engineering, literature, philosophy and the slow work of thinking.',
};

export default function WritingPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageHeader
        eyebrow="The writing"
        title="Essays & Field Notes"
        description="Longer pieces and shorter notes, grown in the open. Newest first; nothing here is ever truly finished."
      >
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          {posts.length} essays · newest first
        </p>
      </PageHeader>

      <section className="container-page pb-10 pt-8 sm:pt-10">
        <FadeIn>
          <div className="divide-y divide-line/70 border-t border-line/70">
            {posts.map((post, i) => (
              <ArticleCard
                key={post.slug}
                post={post}
                index={i + 1}
                large={i === 0}
              />
            ))}
          </div>
        </FadeIn>
      </section>
    </>
  );
}