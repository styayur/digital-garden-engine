# Customisation

Most users only need to change:

- `site.config.ts`
- content files
- files in the content repository's published assets directory

Everything under `app/`, `components/`, `lib/` and `scripts/` is engine code. Change it only when you want to alter the engine itself.

## Site identity

Set the name, initials, role, description, author, locale, URL, navigation, social links, about profile and Now page in `site.config.ts`.

## Theme and fonts

Global colour tokens live in `app/globals.css`. Font families are configured in `tailwind.config.ts`, while the actual font packages are imported in `app/layout.tsx`.

## Homepage and sections

The homepage composition lives in `app/page.tsx`. Section headings live in `components/SectionHeading.tsx`. Cards live in `components/ArticleCard.tsx`, `components/ProjectCard.tsx` and `components/BookCard.tsx`.

## Command palette

The searchable index is assembled in `app/layout.tsx`. It includes pages, posts and projects automatically.

## Knowledge graph

The demo graph is defined in `lib/garden.ts`. Replace the nodes and edges to match your own themes.

## Favicon and metadata

The favicon is `app/icon.svg`. SEO and Open Graph metadata are generated in `app/layout.tsx`, post pages, `app/sitemap.ts` and `app/robots.ts`.

## Navigation

Add or remove items in `site.nav`. The footer, navbar and command palette read from the same list.
