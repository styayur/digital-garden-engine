export interface SiteNavItem {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  initials: string;
  role: string;
  intro: string[];
  description: string;
  author: string;
  locale: string;
  url: string;
  terminal: {
    user: string;
    host: string;
  };
  nav: SiteNavItem[];
  socials: {
    github?: string;
    twitter?: string;
    email?: string;
  };
  about: {
    identity: Array<{ label: string; value: string }>;
    bio: string[];
  };
  now: {
    updated: string;
    location: string;
    currently: Array<{ label: string; value: string; detail?: string }>;
    notes: string[];
  };
}
