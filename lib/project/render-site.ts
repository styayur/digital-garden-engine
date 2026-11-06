import { renderContentDocumentBody, renderRichValue, type HtmlSanitizer } from './content';
import { componentPropertyString, componentPropertyValue } from './registry';
import { normalizePath } from './validation';
import type { Asset, Component, ContentDocument, Page, SiteProject } from './schema';

export type GeneratedFile = {
  path: string;
  content: string | Uint8Array;
  mediaType?: string;
};

export type RenderOptions = {
  sanitize: HtmlSanitizer;
  publicOnly?: boolean;
  editable?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value: unknown) {
  return escapeHtml(typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value));
}

function assetMap(project: SiteProject) {
  return new Map(project.assets.map((asset) => [asset.id, asset]));
}

function assetHref(project: SiteProject, page: Page, asset: Asset | undefined, src: string) {
  if (!asset && !src) return '';
  if (asset?.dataBase64) return `data:${asset.mediaType};base64,${asset.dataBase64}`;
  const path = asset ? `assets/${asset.path}` : src;
  const root = project.config.basePath.replace(/\/$/, '');
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${root}/${path.replace(/^\//, '')}`;
}

function editableAttrs(kind: 'section' | 'component', id: string, extra = '') {
  return ` data-editor-kind="${kind}" data-editor-id="${attr(id)}" draggable="${kind === 'component' ? 'true' : 'false'}"${extra}`;
}

function renderCards(items: unknown, options: RenderOptions) {
  if (!Array.isArray(items)) return '';
  return items
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') return '';
      const card = raw as Record<string, unknown>;
      const href = typeof card.href === 'string' ? card.href : '';
      const title = escapeHtml(String(card.title ?? `Card ${index + 1}`));
      const body = options.sanitize(String(card.body ?? ''));
      return `<article class="card" data-card-index="${index}" draggable="${options.editable ? 'true' : 'false'}">
        <h3>${title}</h3><div class="card-body">${body}</div>
        ${href ? `<a class="text-link" href="${attr(href)}">Open</a>` : ''}
      </article>`;
    })
    .join('');
}

function renderButtons(component: Component) {
  const label = componentPropertyString(component, 'label', 'Read more');
  const href = componentPropertyString(component, 'href', '/');
  const variant = componentPropertyString(component, 'variant', 'primary');
  return `<a class="button button-${attr(variant)}" href="${attr(href)}">${escapeHtml(label)}</a>`;
}

function renderCollection(project: SiteProject, component: Component, options: RenderOptions) {
  const kind = componentPropertyString(component, 'kind', 'post');
  const title = componentPropertyString(component, 'title', 'Collection');
  const limit = Math.max(1, Math.min(24, Number(componentPropertyValue(component, 'limit')) || 6));
  const documents = project.contentDocuments
    .filter((document) => document.status === 'published' || !options.publicOnly)
    .filter((document) => document.kind === kind)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, limit);
  if (documents.length === 0) {
    return `<section class="collection"><h2>${escapeHtml(title)}</h2><p class="empty-state">No published ${escapeHtml(kind)} documents yet.</p></section>`;
  }
  return `<section class="collection"><h2>${escapeHtml(title)}</h2><div class="collection-grid">${documents
    .map((document) => {
      const href = documentHref(project, document);
      return `<article class="collection-item"><p class="eyebrow">${escapeHtml(document.kind)}</p><h3><a href="${attr(href)}">${escapeHtml(document.title)}</a></h3><p>${escapeHtml(document.description)}</p>${document.tags.length ? `<div class="tag-row">${document.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}</article>`;
    })
    .join('')}</div></section>`;
}

export function documentHref(project: SiteProject, document: ContentDocument) {
  const root = project.config.basePath.replace(/\/$/, '');
  if (document.kind === 'post') return `${root}/writing/${document.slug}/`;
  if (document.kind === 'project') return `${root}/projects/${document.slug}/`;
  if (document.kind === 'library') return `${root}/library/${document.slug}/`;
  if (document.kind === 'page') return `${root}/${document.slug}/`;
  return `${root}/documents/${document.slug}/`;
}

function renderComponent(project: SiteProject, page: Page, component: Component, options: RenderOptions): string {
  const assets = assetMap(project);
  const body = (() => {
    switch (component.type) {
      case 'hero': {
        const eyebrow = componentPropertyString(component, 'eyebrow');
        const title = componentPropertyString(component, 'title', 'Untitled garden');
        const description = renderRichValue(componentPropertyValue(component, 'description'), 'html', options.sanitize);
        const ctaLabel = componentPropertyString(component, 'ctaLabel');
        const ctaHref = componentPropertyString(component, 'ctaHref');
        return `${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}<h1>${escapeHtml(title)}</h1><div class="hero-description">${description}</div>${ctaLabel && ctaHref ? `<a class="button button-primary" href="${attr(ctaHref)}">${escapeHtml(ctaLabel)}</a>` : ''}`;
      }
      case 'heading': {
        const title = componentPropertyString(component, 'title', 'Untitled section');
        const level = Math.max(2, Math.min(4, Number(componentPropertyValue(component, 'level')) || 2));
        const description = renderRichValue(componentPropertyValue(component, 'description'), 'html', options.sanitize);
        return `<h${level}>${escapeHtml(title)}</h${level}>${description ? `<div class="heading-description">${description}</div>` : ''}`;
      }
      case 'richText': {
        const linkedId = componentPropertyString(component, 'documentId');
        const linked = project.contentDocuments.find((document) => document.id === linkedId);
        const format = linked?.format ?? componentPropertyString(component, 'format', 'html');
        const source = linked ? linked.body : componentPropertyValue(component, 'body');
        const rendered = linked
          ? renderContentDocumentBody(linked, options.sanitize)
          : renderRichValue(source, format, options.sanitize);
        return `<div class="prose">${rendered}</div>`;
      }
      case 'image': {
        const id = componentPropertyString(component, 'assetId');
        const src = assetHref(project, page, assets.get(id), componentPropertyString(component, 'src'));
        const alt = componentPropertyString(component, 'alt');
        const caption = componentPropertyString(component, 'caption');
        if (!src) return '<div class="empty-image">No image selected</div>';
        return `<figure><img src="${attr(src)}" alt="${attr(alt)}" loading="lazy" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
      }
      case 'button':
        return renderButtons(component);
      case 'cardGrid': {
        const columns = Math.max(2, Math.min(4, Number(componentPropertyString(component, 'columns', '2')) || 2));
        return `<div class="card-grid columns-${columns}" data-card-container="true">${renderCards(componentPropertyValue(component, 'items'), options)}</div>`;
      }
      case 'quote':
        return `<blockquote><div>${renderRichValue(componentPropertyValue(component, 'text'), 'html', options.sanitize)}</div>${componentPropertyString(component, 'attribution') ? `<cite>${escapeHtml(componentPropertyString(component, 'attribution'))}</cite>` : ''}</blockquote>`;
      case 'callout': {
        const tone = componentPropertyString(component, 'tone', 'guide');
        return `<aside class="callout callout-${attr(tone)}"><strong>${escapeHtml(componentPropertyString(component, 'title', 'Note'))}</strong><div>${renderRichValue(componentPropertyValue(component, 'body'), 'html', options.sanitize)}</div></aside>`;
      }
      case 'divider':
        return '<hr />';
      case 'collection':
        return renderCollection(project, component, options);
      case 'html':
        return `<div class="html-block">${renderRichValue(componentPropertyValue(component, 'body'), 'html', options.sanitize)}</div>`;
      default:
        return `<div class="unsupported-component">Unsupported component: ${escapeHtml(component.type)}</div>`;
    }
  })();
  const edit = options.editable
    ? editableAttrs('component', component.id, ` data-component-type="${attr(component.type)}"`)
    : '';
  return `<div class="component component-${attr(component.type)}"${edit}>${body}</div>`;
}

export function renderSections(project: SiteProject, page: Page, options: RenderOptions): string {
  return page.sections
    .filter((section) => section.status === 'published' || !options.publicOnly)
    .map((section) => {
      const edit = options.editable
        ? editableAttrs('section', section.id, ` data-section-index="${page.sections.indexOf(section)}"`)
        : '';
      return `<section class="section section-${attr(section.type)} layout-${attr(section.layout)} variant-${attr(section.variant ?? 'default')} spacing-${attr(project.theme.spacing)}"${edit}><div class="section-inner">${section.components
        .map((component) => renderComponent(project, page, component, options))
        .join('')}</div></section>`;
    })
    .join('');
}

export function renderNavigation(project: SiteProject, currentPath: string, publicOnly: boolean, editable = false) {
  const items = project.navigation.items
    .filter((item) => item.status === 'published' || !publicOnly)
    .sort((a, b) => a.order - b.order);
  return `<nav aria-label="Primary"><a class="brand" href="${attr(project.config.basePath || '/')}">${escapeHtml(project.config.name)}</a><div class="nav-links">${items
    .map((item) => `<a href="${attr(item.href)}"${normalizePath(item.href) === normalizePath(currentPath) ? ' aria-current="page"' : ''}${editable ? ` data-editor-kind="navigation" data-editor-id="${attr(item.id)}"` : ''}>${escapeHtml(item.label)}</a>`)
    .join('')}</div></nav>`;
}

export function renderSiteCss(project: SiteProject) {
  const theme = project.theme;
  const fonts = {
    serif: '"Source Serif 4", Georgia, serif',
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  };
  const scale = theme.typography.scale === 'compact' ? '0.92' : theme.typography.scale === 'expressive' ? '1.12' : '1';
  const spacing = theme.spacing === 'compact' ? '2.5rem' : theme.spacing === 'spacious' ? '6rem' : '4rem';
  const radius = theme.radius === 'none' ? '0' : theme.radius === 'round' ? '22px' : '10px';
  const width = theme.contentWidth === 'narrow' ? '720px' : theme.contentWidth === 'wide' ? '1180px' : '980px';
  return `:root{--bg:${theme.colors.background};--surface:${theme.colors.surface};--text:${theme.colors.text};--muted:${theme.colors.muted};--accent:${theme.colors.accent};--border:${theme.colors.border};--radius:${radius};--width:${width};--spacing:${spacing};font-size:calc(16px * ${scale});color-scheme:${theme.mode}}
*{box-sizing:border-box}html{background:var(--bg);color:var(--text);font-family:${fonts[theme.typography.body]};line-height:1.7}body{margin:0;background:radial-gradient(circle at 80% 0%, color-mix(in srgb,var(--accent) 12%,transparent), transparent 34rem),var(--bg);min-height:100vh}a{color:inherit}img{max-width:100%;height:auto}nav{max-width:var(--width);margin:0 auto;padding:1.4rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:2rem;border-bottom:1px solid var(--border)}.brand{font-family:${fonts[theme.typography.heading]};font-size:1.25rem;text-decoration:none;letter-spacing:.02em}.nav-links{display:flex;flex-wrap:wrap;gap:1.25rem;font-size:.9rem}.nav-links a{color:var(--muted);text-decoration:none}.nav-links a:hover,.nav-links a[aria-current=page]{color:var(--accent)}main{min-height:70vh}.section{padding:var(--spacing) 1.5rem}.section-inner{max-width:var(--width);margin:0 auto}.section-narrow .section-inner{max-width:720px}.section-grid .section-inner,.section-collection .section-inner{max-width:1180px}.section+.section{border-top:1px solid color-mix(in srgb,var(--border) 55%,transparent)}h1,h2,h3,h4{font-family:${fonts[theme.typography.heading]};line-height:1.12;letter-spacing:-.02em;margin:0 0 1rem}h1{font-size:clamp(2.6rem,7vw,5.6rem);max-width:13ch}h2{font-size:clamp(1.8rem,4vw,3.2rem)}h3{font-size:1.25rem}.eyebrow{font-family:${fonts.mono};font-size:.72rem;text-transform:uppercase;letter-spacing:.18em;color:var(--accent);margin:0 0 1rem}.hero-description,.heading-description{max-width:68ch;color:var(--muted);font-size:1.08rem}.component+.component{margin-top:2rem}.button{display:inline-flex;align-items:center;justify-content:center;min-height:2.8rem;padding:.7rem 1.1rem;border:1px solid var(--accent);border-radius:var(--radius);text-decoration:none;font-weight:600}.button-primary{background:var(--accent);color:var(--bg)}.button-secondary{color:var(--accent);background:transparent}.button + .button{margin-left:.75rem}.prose{max-width:70ch}.prose p,.prose ul,.prose ol,.prose table{margin:0 0 1.2rem}.prose a{color:var(--accent)}.prose blockquote{border-left:3px solid var(--accent);padding-left:1.25rem;color:var(--muted)}.prose pre{overflow:auto;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)}.prose code{font-family:${fonts.mono};font-size:.9em}.prose table{width:100%;border-collapse:collapse}.prose th,.prose td{border:1px solid var(--border);padding:.6rem;text-align:left}.prose img{border-radius:var(--radius)}figure{margin:0}figcaption{color:var(--muted);font-size:.85rem;margin-top:.6rem}.card-grid{display:grid;gap:1rem}.columns-2{grid-template-columns:repeat(2,minmax(0,1fr))}.columns-3{grid-template-columns:repeat(3,minmax(0,1fr))}.columns-4{grid-template-columns:repeat(4,minmax(0,1fr))}.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem}.card h3{margin-top:0}.card-body{color:var(--muted)}.text-link{color:var(--accent);font-size:.9rem}.callout{border:1px solid var(--border);border-left:4px solid var(--accent);background:var(--surface);padding:1rem 1.25rem;border-radius:var(--radius)}.callout-warning{border-left-color:#e59a4a}.collection h2{margin-bottom:1.4rem}.collection-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.collection-item{border-top:1px solid var(--border);padding-top:1rem}.collection-item h3 a{text-decoration:none}.collection-item h3 a:hover{color:var(--accent)}.collection-item>p:not(.eyebrow){color:var(--muted)}.tag-row{display:flex;gap:.4rem;flex-wrap:wrap}.tag-row span{font-family:${fonts.mono};font-size:.7rem;border:1px solid var(--border);border-radius:999px;padding:.15rem .5rem;color:var(--muted)}.article{max-width:760px;margin:0 auto;padding:var(--spacing) 1.5rem}.article-header{max-width:760px;margin:0 auto;padding:var(--spacing) 1.5rem 0}.article-header h1{font-size:clamp(2.4rem,5vw,4.4rem)}.article-meta{color:var(--muted);font-size:.9rem}.article-body{max-width:760px;margin:0 auto;padding:2rem 1.5rem var(--spacing)}footer{max-width:var(--width);margin:0 auto;padding:2rem 1.5rem;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem}.empty-state,.empty-image{color:var(--muted);border:1px dashed var(--border);padding:1rem;border-radius:var(--radius)}.unsupported-component{color:#e59a4a;border:1px solid #e59a4a;padding:1rem;border-radius:var(--radius)}
[data-editor-kind]{cursor:pointer}[data-editor-kind]:hover{outline:1px dashed color-mix(in srgb,var(--accent) 75%,transparent);outline-offset:3px}.rhizomaybor-editor-active{outline:2px solid var(--accent)!important;outline-offset:4px}
@media(max-width:780px){nav{align-items:flex-start;flex-direction:column;gap:.75rem}.nav-links{gap:.75rem}.columns-3,.columns-4,.collection-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.section{padding:3rem 1.1rem}}
@media(max-width:520px){.columns-2,.columns-3,.columns-4,.collection-grid{grid-template-columns:1fr}.nav-links{font-size:.82rem}h1{font-size:2.7rem}}`;
}

export function renderDocumentPage(project: SiteProject, document: ContentDocument, options: RenderOptions) {
  const rendered = renderContentDocumentBody(document, options.sanitize);
  return `${renderNavigation(project, documentHref(project, document), Boolean(options.publicOnly), Boolean(options.editable))}
<header class="article-header"><p class="eyebrow">${escapeHtml(document.kind)}</p><h1>${escapeHtml(document.title)}</h1><p class="article-meta">${escapeHtml(document.description)}${document.date ? ` · ${escapeHtml(document.date)}` : ''}</p></header>
<main class="article"><div class="article-body prose">${rendered}</div></main>${renderFooter(project)}`;
}

export function renderFooter(project: SiteProject) {
  return `<footer>${escapeHtml(project.config.footer || `Built with ${project.config.name}`)}</footer>`;
}

export function renderPage(project: SiteProject, page: Page, options: RenderOptions) {
  return `${renderNavigation(project, page.slug, Boolean(options.publicOnly), Boolean(options.editable))}<main>${renderSections(project, page, options)}</main>${renderFooter(project)}`;
}

export function renderHtmlShell(project: SiteProject, page: Page, body: string) {
  const title = page.seo.title || page.title || project.config.title;
  const description = page.seo.description || page.description || project.config.description;
  const basePath = project.config.basePath.replace(/\/$/, '');
  return `<!doctype html><html lang="${attr(project.config.locale.split('_')[0] || 'en')}" data-theme="${attr(project.theme.mode)}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: https:; media-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" /><title>${escapeHtml(title)}</title><meta name="description" content="${attr(description)}" />${page.seo.noIndex ? '<meta name="robots" content="noindex,nofollow" />' : ''}<style>${renderSiteCss(project)}</style><script src="${attr(`${basePath}/assets/site.js`)}" defer></script></head><body>${body}</body></html>`;
}

export function generatedPathForPage(page: Page) {
  const normalized = normalizePath(page.slug);
  return normalized === '/' ? 'index.html' : `${normalized.slice(1)}index.html`;
}

export function generatedPathForDocument(document: ContentDocument) {
  if (document.kind === 'post') return `writing/${document.slug}/index.html`;
  if (document.kind === 'project') return `projects/${document.slug}/index.html`;
  if (document.kind === 'library') return `library/${document.slug}/index.html`;
  if (document.kind === 'page') return `${document.slug}/index.html`;
  return `documents/${document.slug}/index.html`;
}

export type SiteBuildResult = {
  files: GeneratedFile[];
  includedDocuments: ContentDocument[];
  excludedDocuments: ContentDocument[];
};

export async function buildStandaloneSite(
  project: SiteProject,
  sanitize: HtmlSanitizer,
): Promise<SiteBuildResult> {
  const files: GeneratedFile[] = [];
  const options: RenderOptions = { sanitize, publicOnly: true };
  const publishedPages = project.pages.filter((page) => page.status === 'published');
  for (const page of publishedPages) {
    files.push({
      path: generatedPathForPage(page),
      content: renderHtmlShell(project, page, renderPage(project, page, options)),
      mediaType: 'text/html',
    });
  }

  const includedDocuments: ContentDocument[] = [];
  const excludedDocuments: ContentDocument[] = [];
  for (const document of project.contentDocuments) {
    if (document.status !== 'published') {
      excludedDocuments.push(document);
      continue;
    }
    includedDocuments.push(document);
    files.push({
      path: generatedPathForDocument(document),
      content: renderHtmlShell(
        project,
        {
          ...publishedPages[0],
          id: document.id,
          slug: documentHref(project, document),
          title: document.title,
          description: document.description,
          seo: { noIndex: false },
          sections: [],
          navigationLabel: document.title,
          order: 0,
          status: 'published',
        },
        renderDocumentPage(project, document, options),
      ),
      mediaType: 'text/html',
    });
  }

  files.push({ path: 'assets/site.css', content: renderSiteCss(project), mediaType: 'text/css' });
  files.push({
    path: 'assets/site.js',
    content: `document.documentElement.dataset.rhizomaybor='static';`,
    mediaType: 'text/javascript',
  });

  for (const asset of project.assets) {
    if (asset.status !== 'published') continue;
    if (!asset.dataBase64) continue;
    const binary = Uint8Array.from(atob(asset.dataBase64), (character) => character.charCodeAt(0));
    files.push({ path: `assets/${asset.path.replace(/^\//, '')}`, content: binary, mediaType: asset.mediaType });
  }

  files.push({
    path: '404.html',
    content: renderHtmlShell(
      project,
      { ...publishedPages[0], title: 'Page not found', description: 'The requested page could not be found.' },
      `<main class="article"><h1>Page not found</h1><p>The requested page could not be found.</p><p><a class="text-link" href="${escapeHtml(project.config.basePath || '/')}">Return home</a></p></main>`,
    ),
    mediaType: 'text/html',
  });
  files.push({
    path: '.nojekyll',
    content: '',
    mediaType: 'text/plain',
  });

  return { files, includedDocuments, excludedDocuments };
}

