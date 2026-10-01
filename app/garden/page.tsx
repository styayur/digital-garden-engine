import type { Metadata } from 'next';
import Link from 'next/link';

import { FadeIn } from '@/components/FadeIn';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { PageHeader } from '@/components/PageHeader';
import { GARDEN_NODES } from '@/lib/garden';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Garden',
  description:
    'The knowledge network behind this site — six provinces and the paths between them.',
};

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  AI: 'Agents, memory and the machines we are teaching to think — and the machines that are teaching us what thinking is not.',
  Programming: 'The craft itself: code as prose, systems that survive contact with humans, and the discipline of the workshop.',
  Literature: 'The canon and the margin — books that shaped the way this garden reads, and the slow practice of reading well.',
  Philosophy: 'The questions underneath: attention, time, meaning, and what a good life for an engineer looks like.',
  Systems: 'Architecture in the largest sense — from a single function to the invisible infrastructure a civilisation runs on.',
  Cognition: 'The mind — memory, learning and forgetting, whether the mind in question is made of neurons or silicon.',
};

const DOMAIN_TAGS: Record<string, string[]> = {
  AI: ['AI', 'Machine Intelligence'],
  Programming: ['Programming', 'Engineering', 'Software'],
  Literature: ['Literature'],
  Philosophy: ['Philosophy'],
  Systems: ['Systems'],
  Cognition: ['Cognition'],
};

export default function GardenPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageHeader
        eyebrow="The garden"
        title="Knowledge Graph"
        description="This site is not organised by folders but by association — six provinces, and the paths that run between them. Hover the map to trace the connections."
      />

      <section className="container-page pt-6 sm:pt-10">
        <FadeIn>
          <KnowledgeGraph />
        </FadeIn>
      </section>

      <section className="container-page mt-20 sm:mt-28">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {GARDEN_NODES.map((node, i) => {
            const related = posts
              .filter((post) =>
                post.tags.some((tag) => (DOMAIN_TAGS[node.id] ?? []).includes(tag)),
              )
              .slice(0, 3);

            return (
              <FadeIn key={node.id} delay={i * 0.05} className="h-full">
                <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent/40 sm:p-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-2xl text-ink">{node.label}</h2>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                      {node.note}
                    </p>
                  </div>
                  <p className="mt-3 font-serif text-[15px] leading-relaxed text-muted">
                    {DOMAIN_DESCRIPTIONS[node.id]}
                  </p>
                  {related.length > 0 && (
                    <div className="mt-6 border-t border-line/60 pt-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">
                        Paths in
                      </p>
                      <ul className="mt-3 space-y-2">
                        {related.map((post) => (
                          <li key={post.slug}>
                            <Link
                              href={`/writing/${post.slug}`}
                              className="group inline-flex items-baseline gap-2 font-serif text-sm text-muted transition-colors hover:text-accent"
                            >
                              <span className="text-faint">→</span>
                              <span className="underline decoration-line underline-offset-4 transition-colors group-hover:decoration-accent/50">
                                {post.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-20 sm:mt-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="font-serif text-lg italic leading-relaxed text-muted">
            The map is never finished. New plants appear, paths are worn
            deeper, and a few old ones are let go — which is only to say that
            the garden is alive.
          </p>
        </FadeIn>
      </section>
    </>
  );
}