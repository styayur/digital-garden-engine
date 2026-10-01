import type { Metadata } from 'next';

import { BookCard } from '@/components/BookCard';
import { FadeIn } from '@/components/FadeIn';
import { PageHeader } from '@/components/PageHeader';
import { getBooks, getNotes, getQuotes } from '@/lib/library';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Library',
  description:
    'Books on the shelves, notes from the margins and quotes worth keeping — a small reading life, kept in the open.',
};

export default function LibraryPage() {
  const books = getBooks();
  const notes = getNotes();
  const quotes = getQuotes();

  return (
    <>
      <PageHeader
        eyebrow="The shelves"
        title="Library"
        description="Books, notes and quotes — a small reading life kept in the open. The shelves are honest about what is finished and what is only started."
      />

      {/* Books */}
      <section className="container-page pt-6 sm:pt-8">
        <FadeIn>
          <div className="flex items-baseline justify-between border-t border-line/70 pt-10">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">Books</h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              {books.length} on the shelf
            </p>
          </div>
        </FadeIn>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, i) => (
            <FadeIn key={book.slug} delay={i * 0.05} className="h-full">
              <BookCard entry={book} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="container-page mt-20 sm:mt-24">
        <FadeIn>
          <h2 className="border-t border-line/70 pt-10 font-display text-2xl text-ink sm:text-3xl">
            Notes
          </h2>
        </FadeIn>
        <div className="mt-4 divide-y divide-line/70 border-t border-line/70">
          {notes.map((note, i) => (
            <FadeIn key={note.slug}>
              <article className="py-9">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h3 className="font-display text-xl text-ink sm:text-2xl">
                    {note.title}
                  </h3>
                  <p className="font-mono text-[11px] text-faint">
                    {note.date ? formatDate(note.date) : ''}
                  </p>
                </div>
                <p className="mt-4 max-w-2xl whitespace-pre-line font-serif text-[15px] leading-relaxed text-muted">
                  {note.body}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Quotes */}
      {quotes.length > 0 && (
        <section className="container-page mt-20 sm:mt-24">
          <FadeIn>
            <h2 className="border-t border-line/70 pt-10 font-display text-2xl text-ink sm:text-3xl">
              Kept quotes
            </h2>
          </FadeIn>
          <div className="mt-8 grid gap-x-14 gap-y-12 md:grid-cols-2">
            {quotes.map((quote, i) => (
              <FadeIn key={quote.slug} delay={i * 0.06}>
                <figure className="border-l-2 border-accent/60 pl-6 sm:pl-8">
                  <blockquote className="font-display text-2xl italic leading-snug text-ink">
                    “{quote.body}”
                  </blockquote>
                  <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                    — {quote.author}
                  </figcaption>
                </figure>
              </FadeIn>
            ))}
          </div>
        </section>
      )}
    </>
  );
}