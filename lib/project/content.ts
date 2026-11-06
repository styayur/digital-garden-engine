import { marked } from 'marked';
import type { ContentDocument } from './schema';

marked.use({
  gfm: true,
  breaks: false,
});

export type HtmlSanitizer = (html: string) => string;

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export function renderContentDocumentBody(
  document: Pick<ContentDocument, 'format' | 'body'>,
  sanitize: HtmlSanitizer,
) {
  if (document.format === 'html') return sanitize(document.body);
  return sanitize(markdownToHtml(document.body));
}

export function renderRichValue(value: unknown, format: string, sanitize: HtmlSanitizer) {
  const source = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
  return format === 'markdown' ? sanitize(markdownToHtml(source)) : sanitize(source);
}

export function contentToPlainText(document: Pick<ContentDocument, 'format' | 'body'>) {
  if (document.format !== 'html') return document.body.replace(/[`*_>#\[\]()]/g, '').trim();
  return document.body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function contentWordCount(document: Pick<ContentDocument, 'format' | 'body'>) {
  const text = contentToPlainText(document);
  return text ? text.split(/\s+/u).filter(Boolean).length : 0;
}

export function contentReadingMinutes(document: Pick<ContentDocument, 'format' | 'body'>) {
  return Math.max(1, Math.ceil(contentWordCount(document) / 220));
}

export function hasMdxComponents(body: string) {
  return /<[A-Z][A-Za-z0-9]*(?:\s|>|\/)/.test(body);
}

