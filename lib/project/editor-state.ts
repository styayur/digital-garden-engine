import { createComponent, createProperty, createSection, COMPONENT_BY_TYPE } from './registry';
import type { Component, Page, Section, SiteProject, Theme } from './schema';

export type ThemePatch = Partial<Omit<Theme, 'colors' | 'typography'>> & {
  colors?: Partial<Theme['colors']>;
  typography?: Partial<Theme['typography']>;
};

export type EditorState = {
  project: SiteProject;
  baseline: SiteProject;
  past: SiteProject[];
  future: SiteProject[];
  lastAction: string;
};

export type EditorAction =
  | { type: 'replace'; project: SiteProject; markSaved?: boolean; label?: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'markSaved'; project?: SiteProject }
  | { type: 'update-project'; updater: (project: SiteProject) => SiteProject; label: string };

const HISTORY_LIMIT = 100;

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function projectFingerprint(project: SiteProject) {
  return canonicalJson(project);
}

export function isDirty(state: EditorState) {
  return projectFingerprint(state.project) !== projectFingerprint(state.baseline);
}

export function createEditorState(project: SiteProject): EditorState {
  return {
    project: structuredClone(project),
    baseline: structuredClone(project),
    past: [],
    future: [],
    lastAction: 'opened project',
  };
}

function setProject(project: SiteProject, label: string): SiteProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      ...state,
      project: structuredClone(previous),
      past: state.past.slice(0, -1),
      future: [structuredClone(state.project), ...state.future].slice(0, HISTORY_LIMIT),
      lastAction: 'undo',
    };
  }

  if (action.type === 'redo') {
    const next = state.future[0];
    if (!next) return state;
    return {
      ...state,
      project: structuredClone(next),
      past: [...state.past, structuredClone(state.project)].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
      lastAction: 'redo',
    };
  }

  if (action.type === 'replace') {
    return {
      project: structuredClone(action.project),
      baseline: action.markSaved ? structuredClone(action.project) : state.baseline,
      past: action.markSaved ? [] : [...state.past, structuredClone(state.project)].slice(-HISTORY_LIMIT),
      future: [],
      lastAction: action.label ?? 'replaced project',
    };
  }

  if (action.type === 'markSaved') {
    const saved = structuredClone(action.project ?? state.project);
    return {
      ...state,
      project: saved,
      baseline: structuredClone(saved),
      lastAction: 'saved project',
    };
  }

  const next = action.updater(structuredClone(state.project));
  if (projectFingerprint(next) === projectFingerprint(state.project)) return state;
  return {
    ...state,
    project: setProject(next, action.label),
    past: [...state.past, structuredClone(state.project)].slice(-HISTORY_LIMIT),
    future: [],
    lastAction: action.label,
  };
}

export function findPage(project: SiteProject, pageId: string) {
  return project.pages.find((page) => page.id === pageId);
}

export function findSection(page: Page, sectionId: string) {
  return page.sections.find((section) => section.id === sectionId);
}

export function findComponent(section: Section, componentId: string) {
  return section.components.find((component) => component.id === componentId);
}

function replacePage(project: SiteProject, page: Page): SiteProject {
  return { ...project, pages: project.pages.map((candidate) => (candidate.id === page.id ? page : candidate)) };
}

function replaceSection(page: Page, section: Section): Page {
  return { ...page, sections: page.sections.map((candidate) => (candidate.id === section.id ? section : candidate)) };
}

function replaceComponent(section: Section, component: Component): Section {
  return {
    ...section,
    components: section.components.map((candidate) => (candidate.id === component.id ? component : candidate)),
  };
}

export function updateComponentProperty(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  componentId: string,
  key: string,
  value: unknown,
): SiteProject {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  const component = section && findComponent(section, componentId);
  if (!page || !section || !component) return project;
  const existing = component.props[key];
  const nextProperty = existing
    ? { ...existing, value }
    : {
        ...createProperty(key, { key, label: key, type: inferPropertyType(value) }, value),
      };
  const nextComponent = { ...component, props: { ...component.props, [key]: nextProperty } };
  return replacePage(project, replaceSection(page, replaceComponent(section, nextComponent)));
}

function inferPropertyType(value: unknown): 'text' | 'number' | 'boolean' | 'json' {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'text';
  return 'json';
}

export function updateComponentSettings(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  componentId: string,
  patch: Partial<Component>,
): SiteProject {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  const component = section && findComponent(section, componentId);
  if (!page || !section || !component) return project;
  return replacePage(
    project,
    replaceSection(page, replaceComponent(section, { ...component, ...patch, id: component.id })),
  );
}

export function addComponent(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  type: string,
  index?: number,
): { project: SiteProject; componentId?: string } {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  if (!page || !section) return { project };
  const component = createComponent(type);
  const definition = COMPONENT_BY_TYPE.get(type);
  if (!definition?.allowedLayouts.includes(section.layout)) return { project };
  const at = index === null || index === undefined ? section.components.length : Math.max(0, Math.min(index, section.components.length));
  const components = [...section.components];
  components.splice(at, 0, component);
  return {
    project: replacePage(project, replaceSection(page, { ...section, components })),
    componentId: component.id,
  };
}

export function removeComponent(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  componentId: string,
): SiteProject {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  if (!page || !section) return project;
  return replacePage(
    project,
    replaceSection(page, {
      ...section,
      components: section.components.filter((component) => component.id !== componentId),
    }),
  );
}

export function moveComponent(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  fromIndex: number,
  toIndex: number,
): SiteProject {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  if (!page || !section) return project;
  const components = moveArrayItem(section.components, fromIndex, toIndex);
  if (components === section.components) return project;
  return replacePage(project, replaceSection(page, { ...section, components }));
}

export function moveSection(
  project: SiteProject,
  pageId: string,
  fromIndex: number,
  toIndex: number,
): SiteProject {
  const page = findPage(project, pageId);
  if (!page) return project;
  const sections = moveArrayItem(page.sections, fromIndex, toIndex);
  return sections === page.sections ? project : replacePage(project, { ...page, sections });
}

export function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function moveCard(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  componentId: string,
  fromIndex: number,
  toIndex: number,
): SiteProject {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  const component = section && findComponent(section, componentId);
  if (!page || !section || !component) return project;
  const cards = component.props.items?.value;
  if (!Array.isArray(cards)) return project;
  const nextCards = moveArrayItem(cards, fromIndex, toIndex);
  if (nextCards === cards) return project;
  return updateComponentProperty(project, pageId, sectionId, componentId, 'items', nextCards);
}

export function updateSection(
  project: SiteProject,
  pageId: string,
  sectionId: string,
  patch: Partial<Section>,
): SiteProject {
  const page = findPage(project, pageId);
  const section = page && findSection(page, sectionId);
  if (!page || !section) return project;
  return replacePage(project, replaceSection(page, { ...section, ...patch, id: section.id }));
}

export function addSection(project: SiteProject, pageId: string, type = 'content'): SiteProject {
  const page = findPage(project, pageId);
  if (!page) return project;
  const section = createSection(type);
  return replacePage(project, { ...page, sections: [...page.sections, section] });
}

export function removeSection(project: SiteProject, pageId: string, sectionId: string): SiteProject {
  const page = findPage(project, pageId);
  if (!page) return project;
  return replacePage(project, {
    ...page,
    sections: page.sections.filter((section) => section.id !== sectionId),
  });
}

export function updateTheme(project: SiteProject, patch: ThemePatch): SiteProject {
  return {
    ...project,
    theme: {
      ...project.theme,
      ...patch,
      colors: { ...project.theme.colors, ...(patch.colors ?? {}) },
      typography: { ...project.theme.typography, ...(patch.typography ?? {}) },
    },
  };
}

export function updatePage(project: SiteProject, pageId: string, patch: Partial<Page>): SiteProject {
  const page = findPage(project, pageId);
  return page ? replacePage(project, { ...page, ...patch, id: page.id, sections: patch.sections ?? page.sections }) : project;
}

export function updateContentDocument(
  project: SiteProject,
  documentId: string,
  patch: Partial<SiteProject['contentDocuments'][number]>,
): SiteProject {
  return {
    ...project,
    contentDocuments: project.contentDocuments.map((document) =>
      document.id === documentId ? { ...document, ...patch, id: document.id } : document,
    ),
  };
}

export function addContentDocument(project: SiteProject, title = 'Untitled document') {
  const id = `doc-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  return {
    project: {
      ...project,
      contentDocuments: [
        ...project.contentDocuments,
        {
          id,
          kind: 'custom' as const,
          slug: `untitled-${id.slice(-6)}`,
          title,
          description: '',
          tags: [],
          status: 'draft' as const,
          format: 'html' as const,
          sourceFormat: 'html' as const,
          body: '<p>Start writing here.</p>',
          unsupportedHtml: [],
          metadata: {},
        },
      ],
    },
    documentId: id,
  };
}

