import type { SiteConfig } from './lib/site-config';

const site: SiteConfig = {
  name: 'Alex Example',
  initials: 'AE',
  role: 'Writer · Engineer · Learner',
  intro: [
    'I make small things,',
    'read widely,',
    'and keep notes in the open.',
  ],
  description:
    'A sample digital garden for essays, projects, reading notes and ideas that grow over time.',
  author: 'Alex Example',
  locale: 'en_US',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com',
  terminal: { user: 'alex', host: 'garden' },
  nav: [
    { label: 'Writing', href: '/writing' },
    { label: 'Projects', href: '/projects' },
    { label: 'Library', href: '/library' },
    { label: 'Garden', href: '/garden' },
    { label: 'Now', href: '/now' },
    { label: 'About', href: '/about' },
  ],
  socials: {
    github: '',
    twitter: '',
    email: '',
  },
  about: {
    identity: [
      { label: 'role', value: 'Writer · Engineer · Learner' },
      { label: 'medium', value: 'software & prose' },
      { label: 'tempo', value: 'slow' },
      { label: 'location', value: 'a quiet desk' },
    ],
    bio: [
      'This is a fictional demo profile. Replace it in site.config.ts with your own identity, writing and links.',
      'A digital garden is a collection of notes and essays that can change over time. It is less like a feed and more like a place.',
      'The engine keeps the presentation separate from the content. That makes the public site easy to rebuild while private drafts remain outside the published artifact.',
    ],
  },
  now: {
    updated: 'October 2026',
    location: 'the workshop',
    currently: [
      {
        label: 'building',
        value: 'A small publishing tool',
        detail: 'A static-first project that keeps ownership of the source text.',
      },
      {
        label: 'learning',
        value: 'Knowledge systems',
        detail: 'How notes become useful when they are connected instead of merely stored.',
      },
      {
        label: 'reading',
        value: 'Essays and field guides',
        detail: 'A mixture of technical writing, literature and design.',
      },
    ],
    notes: [
      'The demo content is intentionally fictional and safe to modify.',
    ],
  },
};

export default site;
