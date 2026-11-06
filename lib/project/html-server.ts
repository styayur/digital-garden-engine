import sanitizeHtml from 'sanitize-html';
import {
  SAFE_ATTRIBUTES,
  SAFE_TAGS,
  safeDynamicAttributes,
  safeDynamicTags,
} from './html-policy';

export function sanitizeServerHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...SAFE_TAGS, ...safeDynamicTags(html)],
    allowedAttributes: {
      '*': [...SAFE_ATTRIBUTES, ...safeDynamicAttributes(html)],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
    transformTags: {
      script: 'script-removed',
    },
    exclusiveFilter(frame) {
      return frame.tag === 'script-removed';
    },
  });
}
