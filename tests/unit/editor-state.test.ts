import { describe, expect, it } from 'vitest';
import { createEditorState, editorReducer, isDirty, moveArrayItem, moveCard, updateComponentProperty } from '../../lib/project/editor-state';
import { demoProject } from './fixtures';

describe('shared editor model', () => {
  it('updates a component property without dropping unrelated fields', () => {
    const project = demoProject();
    const page = project.pages[0];
    const section = page.sections[0];
    const component = section.components[0];
    (component as typeof component & { futureField?: string }).futureField = 'preserve';
    const next = updateComponentProperty(project, page.id, section.id, component.id, 'title', 'Changed title');
    const changed = next.pages[0].sections[0].components[0];
    expect(changed.props.title.value).toBe('Changed title');
    expect(changed).toHaveProperty('futureField', 'preserve');
  });

  it('supports undo, redo and dirty tracking', () => {
    const project = demoProject();
    let state = createEditorState(project);
    const page = project.pages[0];
    const section = page.sections[0];
    const component = section.components[0];
    state = editorReducer(state, {
      type: 'update-project',
      label: 'change title',
      updater: (current) => updateComponentProperty(current, page.id, section.id, component.id, 'title', 'Edited'),
    });
    expect(isDirty(state)).toBe(true);
    state = editorReducer(state, { type: 'undo' });
    expect(state.project.pages[0].sections[0].components[0].props.title.value).toBe(component.props.title.value);
    state = editorReducer(state, { type: 'redo' });
    expect(state.project.pages[0].sections[0].components[0].props.title.value).toBe('Edited');
    state = editorReducer(state, { type: 'markSaved' });
    expect(isDirty(state)).toBe(false);
  });

  it('moves items within a supported container', () => {
    expect(moveArrayItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveArrayItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });

  it('moves cards only inside their owning card grid', () => {
    const project = demoProject();
    const page = project.pages[0];
    const section = page.sections[0];
    const cardComponent = {
      id: 'card-grid-test',
      type: 'cardGrid',
      version: '1.0.0',
      props: {
        items: {
          id: 'prop-items', key: 'items', type: 'card-list' as const,
          value: [{ id: 'one', title: 'One' }, { id: 'two', title: 'Two' }],
          preserveUnknown: true,
        },
        columns: {
          id: 'prop-columns', key: 'columns', type: 'select' as const,
          value: '2', preserveUnknown: true,
        },
      },
      settings: {},
    };
    project.pages[0].sections[0].components.push(cardComponent);
    const moved = moveCard(project, page.id, section.id, cardComponent.id, 0, 1);
    expect(moved.pages[0].sections[0].components.at(-1)?.props.items.value).toEqual([
      { id: 'two', title: 'Two' },
      { id: 'one', title: 'One' },
    ]);
  });
});
