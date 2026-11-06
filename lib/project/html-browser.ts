import DOMPurify from 'dompurify';
import {
  SAFE_ATTRIBUTES,
  SAFE_TAGS,
  safeDynamicAttributes,
  safeDynamicTags,
} from './html-policy';

export function sanitizeBrowserHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...SAFE_TAGS, ...safeDynamicTags(html)],
    ALLOWED_ATTR: [...SAFE_ATTRIBUTES, ...safeDynamicAttributes(html)],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['style', 'srcdoc', 'formaction', 'onerror', 'onclick', 'onload'],
    USE_PROFILES: { html: true },
  });
}
