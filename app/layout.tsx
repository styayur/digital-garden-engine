import type { Metadata, Viewport } from 'next';

// Typefaces (self-hosted via Fontsource — no build-time network needed).
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/600-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

import './globals.css';

import {
  CommandProvider,
  type CommandItem,
} from '@/components/CommandPalette';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getAllPosts } from '@/lib/posts';
import { getAllProjects } from '@/lib/projects';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author }],
  creator: site.author,
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  twitter: {
    card: 'summary',
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0D10',
};

/** Searchable index for the ⌘K command palette, built once at build time. */
function buildCommandItems(): CommandItem[] {
  const pageItems: CommandItem[] = [
    { id: 'page-home', group: 'Page', label: 'Home', href: '/', keywords: ['start', 'index'] },
    ...site.nav.map((item) => ({
      id: `page-${item.href}`,
      group: 'Page' as const,
      label: item.label,
      href: item.href,
    })),
    {
      id: 'page-terminal',
      group: 'Page',
      label: 'Terminal',
      href: '/terminal',
      keywords: ['secret', 'hidden', 'command'],
    },
  ];

  const essayItems: CommandItem[] = getAllPosts().map((post) => ({
    id: `essay-${post.slug}`,
    group: 'Essay',
    label: post.title,
    href: `/writing/${post.slug}`,
    keywords: [...post.tags, post.description],
  }));

  const projectItems: CommandItem[] = getAllProjects().map((project) => ({
    id: `project-${project.slug}`,
    group: 'Project',
    label: project.name,
    href: `/projects#${project.slug}`,
    keywords: [...project.stack, project.summary],
  }));

  return [...pageItems, ...essayItems, ...projectItems];
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const commandItems = buildCommandItems();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg font-sans text-ink antialiased">
        <ThemeProvider>
          <CommandProvider items={commandItems}>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CommandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}