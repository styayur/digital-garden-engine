import { describe, expect, it } from 'vitest';
import { migrateProject } from '../../lib/project/migrations';
import { siteProjectSchema } from '../../lib/project/schema';
import { validateProject } from '../../lib/project/validation';
import { demoProject } from './fixtures';

describe('SiteProject schema and migrations', () => {
  it('accepts the generated demo project', () => {
    const project = demoProject();
    expect(project.schemaVersion).toBe('0.5.0');
    expect(validateProject(project, { forExport: 'website' }).valid).toBe(true);
  });

  it('retains unknown project and component properties', () => {
    const project = demoProject();
    const candidate = structuredClone(project) as typeof project & { futureProjectField?: unknown };
    const component = candidate.pages[0].sections[0].components[0];
    candidate.futureProjectField = { retained: true };
    (component as typeof component & { futureComponentField?: unknown }).futureComponentField = 'retain me';
    const parsed = siteProjectSchema.parse(candidate);
    expect((parsed as typeof candidate).futureProjectField).toEqual({ retained: true });
    expect(parsed.pages[0].sections[0].components[0]).toHaveProperty('futureComponentField', 'retain me');
  });

  it('fails closed when two pages share a path', () => {
    const project = demoProject();
    project.pages[1].slug = project.pages[0].slug;
    const result = validateProject(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.message.includes('Duplicate page path'))).toBe(true);
  });

  it('migrates the 0.1 draft shape and records explicit migration steps', () => {
    const legacy = {
      schemaVersion: '0.1.0',
      id: 'Legacy Project',
      name: 'Legacy Project',
      theme: { background: '#ffffff', accent: '#cc3300', headingFont: 'serif', bodyFont: 'sans' },
      navigation: { items: [{ label: 'Home', href: '/' }] },
      pages: [{ id: 'Home Page', slug: '/', title: 'Home', sections: [{ components: [{ type: 'richText', props: { body: '<p>Hello</p>' } }] }] }],
      contentDocuments: [],
      assets: [],
    };
    const migrated = migrateProject(legacy);
    expect(migrated.steps).toEqual(['0.1.0 -> 0.5.0']);
    expect(migrated.project.theme.colors.background).toBe('#ffffff');
    expect(migrated.project.pages[0].sections[0].components[0].props.body).toMatchObject({ type: 'text', value: '<p>Hello</p>' });
  });
});
