import { describe, expect, it } from 'vitest';
import { analyzeHtml } from '../../lib/project/html-policy';
import { sanitizeServerHtml } from '../../lib/project/html-server';
import { demoProject } from './fixtures';

describe('HTML round-trip preservation', () => {
  it('identifies unknown structures and recommends source mode', () => {
    const analysis = analyzeHtml('<p>Safe</p><rhizome-note data-preserved="yes">Original</rhizome-note>');
    expect(analysis.unknownTags).toContain('rhizome-note');
    expect(analysis.recommendation).toBe('source-only');
  });

  it('preserves safe custom elements and attributes while removing executable HTML', () => {
    const html = '<rhizome-note data-preserved="yes" custom="kept">Original</rhizome-note><script>alert(1)</script><img src="/x.png" onerror="alert(1)">';
    const sanitized = sanitizeServerHtml(html);
    expect(sanitized).toContain('<rhizome-note data-preserved="yes" custom="kept">Original</rhizome-note>');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onerror');
  });

  it('keeps arbitrary HTML source unchanged in the project model', () => {
    const project = demoProject();
    const document = project.contentDocuments.find((candidate) => candidate.id === 'doc-about-profile');
    expect(document?.body).toContain('<rhizome-note data-preserved="true">');
    expect(document?.format).toBe('html');
    expect(document?.sourceFormat).toBe('html');
  });
});
