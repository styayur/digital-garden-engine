export const SAFE_TAGS = [
  'a', 'abbr', 'address', 'article', 'aside', 'b', 'blockquote', 'br', 'caption', 'cite',
  'code', 'col', 'colgroup', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em',
  'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img',
  'ins', 'kbd', 'li', 'main', 'mark', 'ol', 'p', 'picture', 'pre', 'q', 's', 'samp',
  'section', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'table',
  'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'var', 'audio', 'video',
] as const;

export const DANGEROUS_TAGS = new Set([
  'script', 'style', 'link', 'meta', 'base', 'iframe', 'object', 'embed', 'form',
  'input', 'button', 'textarea', 'select', 'option', 'template', 'slot', 'noscript',
]);

export const SAFE_ATTRIBUTES = [
  'abbr', 'alt', 'aria-describedby', 'aria-hidden', 'aria-label', 'aria-labelledby',
  'caption', 'cite', 'class', 'colspan', 'controls', 'datetime', 'decoding', 'dir',
  'height', 'href', 'id', 'itemprop', 'itemscope', 'lang', 'loading', 'open',
  'poster', 'rel', 'role', 'rowspan', 'scope', 'sizes', 'src', 'srcset', 'target',
  'title', 'type', 'width',
] as const;

const DANGEROUS_ATTRIBUTES = new Set([
  'srcdoc', 'formaction', 'action', 'method', 'autofocus', 'contenteditable',
  'style', 'xmlns', 'xlink:href',
]);

export type HtmlAnalysis = {
  unknownTags: string[];
  unknownAttributes: string[];
  containsScripts: boolean;
  recommendation: 'visual-safe' | 'source-only';
};

export function collectTagNames(html: string): string[] {
  const tags = new Set<string>();
  for (const match of html.matchAll(/<\s*\/?\s*([a-z][a-z0-9:-]*)\b/gi)) {
    tags.add(match[1].toLowerCase());
  }
  return [...tags];
}

export function collectAttributeNames(html: string): string[] {
  const attributes = new Set<string>();
  for (const match of html.matchAll(/\s([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*=/g)) {
    attributes.add(match[1].toLowerCase());
  }
  return [...attributes];
}

export function analyzeHtml(html: string): HtmlAnalysis {
  const tags = collectTagNames(html);
  const attributes = collectAttributeNames(html);
  const unknownTags = tags.filter(
    (tag) => !SAFE_TAGS.includes(tag as (typeof SAFE_TAGS)[number]) && !DANGEROUS_TAGS.has(tag),
  );
  const unknownAttributes = attributes.filter(
    (attribute) =>
      !SAFE_ATTRIBUTES.includes(attribute as (typeof SAFE_ATTRIBUTES)[number]) &&
      !attribute.startsWith('data-') &&
      !attribute.startsWith('aria-') &&
      !DANGEROUS_ATTRIBUTES.has(attribute) &&
      !attribute.startsWith('on'),
  );
  const containsScripts = tags.some((tag) => DANGEROUS_TAGS.has(tag));
  return {
    unknownTags,
    unknownAttributes,
    containsScripts,
    recommendation: unknownTags.length > 0 ? 'source-only' : 'visual-safe',
  };
}

export function safeDynamicTags(html: string): string[] {
  return collectTagNames(html).filter(
    (tag) => /^[a-z][a-z0-9-]*$/.test(tag) && !DANGEROUS_TAGS.has(tag),
  );
}

export function safeDynamicAttributes(html: string): string[] {
  return collectAttributeNames(html).filter(
    (attribute) =>
      /^[a-z_:][a-z0-9_.:-]*$/.test(attribute) &&
      !attribute.startsWith('on') &&
      !DANGEROUS_ATTRIBUTES.has(attribute),
  );
}

export function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value, 'https://example.invalid');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) || value.startsWith('/') || value.startsWith('#');
  } catch {
    return false;
  }
}
