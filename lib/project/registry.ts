import type {
  Component,
  ComponentProperty,
  ComponentPropertyType,
  Section,
} from './schema';

export type PropertyDefinition = {
  key: string;
  label: string;
  type: ComponentPropertyType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
};

export type ComponentDefinition = {
  type: string;
  label: string;
  description: string;
  category: 'content' | 'media' | 'structure' | 'collection';
  allowedLayouts: string[];
  properties: PropertyDefinition[];
  defaultProps: Record<string, unknown>;
};

export type SectionDefinition = {
  type: string;
  label: string;
  description: string;
  layouts: string[];
  variants: string[];
  maxComponents: number;
};

export const SECTION_REGISTRY: SectionDefinition[] = [
  {
    type: 'content',
    label: 'Content',
    description: 'A single readable column for prose, headings and calls to action.',
    layouts: ['stack', 'narrow'],
    variants: ['plain', 'soft-panel'],
    maxComponents: 24,
  },
  {
    type: 'feature',
    label: 'Feature',
    description: 'A larger introductory area with a constrained visual hierarchy.',
    layouts: ['split', 'stack'],
    variants: ['editorial', 'compact'],
    maxComponents: 8,
  },
  {
    type: 'grid',
    label: 'Card grid',
    description: 'A responsive grid for projects, notes or short summaries.',
    layouts: ['grid-2', 'grid-3', 'grid-4'],
    variants: ['cards', 'borderless'],
    maxComponents: 4,
  },
  {
    type: 'collection',
    label: 'Collection',
    description: 'Automatically lists approved published documents from the project.',
    layouts: ['list', 'grid-2', 'grid-3'],
    variants: ['writing', 'projects', 'library'],
    maxComponents: 3,
  },
];

const text = (key: string, label: string, placeholder = ''): PropertyDefinition => ({
  key,
  label,
  type: 'text',
  placeholder,
});
const richText = (key: string, label: string): PropertyDefinition => ({
  key,
  label,
  type: 'rich-text',
});
const link = (key: string, label: string): PropertyDefinition => ({ key, label, type: 'link' });

export const COMPONENT_REGISTRY: ComponentDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Title, introduction and optional call to action.',
    category: 'structure',
    allowedLayouts: ['split', 'stack'],
    properties: [
      text('eyebrow', 'Eyebrow', 'Digital garden'),
      text('title', 'Title', 'A place for ideas that grow'),
      richText('description', 'Description'),
      link('ctaLabel', 'Button label'),
      link('ctaHref', 'Button link'),
    ],
    defaultProps: {
      eyebrow: 'Digital garden',
      title: 'A place for ideas that grow',
      description: '<p>Write, connect and publish at your own pace.</p>',
      ctaLabel: 'Start reading',
      ctaHref: '/writing/',
    },
  },
  {
    type: 'heading',
    label: 'Heading',
    description: 'A section heading with a constrained level.',
    category: 'content',
    allowedLayouts: ['stack', 'narrow', 'split', 'grid-2', 'grid-3', 'grid-4', 'list'],
    properties: [
      text('title', 'Heading'),
      {
        key: 'level',
        label: 'Level',
        type: 'select',
        options: [
          { label: 'H2', value: '2' },
          { label: 'H3', value: '3' },
          { label: 'H4', value: '4' },
        ],
      },
      richText('description', 'Description'),
    ],
    defaultProps: { title: 'Untitled section', level: '2', description: '' },
  },
  {
    type: 'richText',
    label: 'Rich text',
    description: 'Markdown or HTML content with visual, source and preview modes.',
    category: 'content',
    allowedLayouts: ['stack', 'narrow', 'split', 'grid-2', 'grid-3', 'grid-4', 'list'],
    properties: [
      {
        key: 'format',
        label: 'Content format',
        type: 'select',
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
      richText('body', 'Content'),
      {
        key: 'documentId',
        label: 'Linked document',
        type: 'text',
        help: 'Optional ContentDocument ID. When linked, this component follows the document record.',
      },
    ],
    defaultProps: {
      format: 'html',
      body: '<p>Start writing here. Switch to source mode to edit the original HTML.</p>',
      documentId: '',
    },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'A local project image with alt text and an optional caption.',
    category: 'media',
    allowedLayouts: ['stack', 'narrow', 'split', 'grid-2', 'grid-3', 'grid-4', 'list'],
    properties: [
      { key: 'assetId', label: 'Asset', type: 'image' },
      link('src', 'Image path'),
      text('alt', 'Alt text'),
      text('caption', 'Caption'),
    ],
    defaultProps: { assetId: '', src: '', alt: '', caption: '' },
  },
  {
    type: 'button',
    label: 'Button',
    description: 'A single link styled as a button.',
    category: 'structure',
    allowedLayouts: ['stack', 'narrow', 'split', 'grid-2', 'grid-3', 'grid-4', 'list'],
    properties: [text('label', 'Label'), link('href', 'Link'), {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
      ],
    }],
    defaultProps: { label: 'Read more', href: '/', variant: 'primary' },
  },
  {
    type: 'cardGrid',
    label: 'Cards',
    description: 'A constrained grid of editable cards.',
    category: 'structure',
    allowedLayouts: ['grid-2', 'grid-3', 'grid-4'],
    properties: [
      { key: 'items', label: 'Cards', type: 'card-list' },
      {
        key: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { label: '2 columns', value: '2' },
          { label: '3 columns', value: '3' },
          { label: '4 columns', value: '4' },
        ],
      },
    ],
    defaultProps: {
      items: [
        { id: 'card-one', title: 'First card', body: 'A short supporting note.', href: '/' },
        { id: 'card-two', title: 'Second card', body: 'Another short supporting note.', href: '/' },
      ],
      columns: '2',
    },
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'A quotation with an optional attribution.',
    category: 'content',
    allowedLayouts: ['stack', 'narrow', 'split'],
    properties: [richText('text', 'Quote'), text('attribution', 'Attribution')],
    defaultProps: { text: '<p>A small thought worth keeping.</p>', attribution: '' },
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'A constrained note, warning or guide block.',
    category: 'content',
    allowedLayouts: ['stack', 'narrow', 'split', 'grid-2', 'grid-3', 'grid-4', 'list'],
    properties: [
      text('title', 'Title'),
      richText('body', 'Body'),
      {
        key: 'tone',
        label: 'Tone',
        type: 'select',
        options: [
          { label: 'Guide', value: 'guide' },
          { label: 'Note', value: 'note' },
          { label: 'Warning', value: 'warning' },
        ],
      },
    ],
    defaultProps: { title: 'A note from the garden', body: '<p>Keep this space useful and clear.</p>', tone: 'guide' },
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'A visual separator between supported blocks.',
    category: 'structure',
    allowedLayouts: ['stack', 'narrow', 'split', 'grid-2', 'grid-3', 'grid-4', 'list'],
    properties: [],
    defaultProps: {},
  },
  {
    type: 'collection',
    label: 'Document collection',
    description: 'A published collection of writing, projects or library notes.',
    category: 'collection',
    allowedLayouts: ['stack', 'narrow', 'grid-2', 'grid-3', 'list'],
    properties: [
      {
        key: 'kind',
        label: 'Document kind',
        type: 'select',
        options: [
          { label: 'Writing', value: 'post' },
          { label: 'Projects', value: 'project' },
          { label: 'Library', value: 'library' },
        ],
      },
      text('title', 'Heading'),
      {
        key: 'limit',
        label: 'Maximum items',
        type: 'number',
        min: 1,
        max: 24,
        step: 1,
      },
    ],
    defaultProps: { kind: 'post', title: 'Latest writing', limit: 6 },
  },
  {
    type: 'html',
    label: 'Preserved HTML',
    description: 'An advanced safe HTML block. Unknown structures remain available in source mode.',
    category: 'content',
    allowedLayouts: ['stack', 'narrow', 'split'],
    properties: [richText('body', 'HTML')],
    defaultProps: { body: '<div class="custom-block"><p>Preserved HTML block.</p></div>' },
  },
];

export const COMPONENT_BY_TYPE = new Map(COMPONENT_REGISTRY.map((definition) => [definition.type, definition]));
export const SECTION_BY_TYPE = new Map(SECTION_REGISTRY.map((definition) => [definition.type, definition]));

export function generateId(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12)
    ?? Math.random().toString(36).slice(2, 14);
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  return `${/^[a-z]/.test(safePrefix) ? safePrefix : `id-${safePrefix}`}-${random}`.slice(0, 96);
}

export function createProperty(
  key: string,
  definition: PropertyDefinition,
  value: unknown,
): ComponentProperty {
  return {
    id: generateId(`prop-${key}`),
    key,
    type: definition.type,
    value,
    label: definition.label,
    preserveUnknown: true,
  };
}

export function createComponent(type: string): Component {
  const definition = COMPONENT_BY_TYPE.get(type);
  if (!definition) throw new Error(`Unknown component type: ${type}`);
  return {
    id: generateId(type),
    type,
    version: '1.0.0',
    label: definition.label,
    props: Object.fromEntries(
      definition.properties.map((property) => [
        property.key,
        createProperty(property.key, property, definition.defaultProps[property.key] ?? ''),
      ]),
    ),
    settings: {},
  };
}

export function createSection(type = 'content'): Section {
  const definition = SECTION_BY_TYPE.get(type);
  if (!definition) throw new Error(`Unknown section type: ${type}`);
  return {
    id: generateId('section'),
    type,
    label: definition.label,
    status: 'draft',
    layout: definition.layouts[0],
    variant: definition.variants[0],
    components: [],
    settings: {},
  };
}

export function componentPropertyValue(component: Component, key: string): unknown {
  return component.props[key]?.value;
}

export function componentPropertyString(component: Component, key: string, fallback = ''): string {
  const value = componentPropertyValue(component, key);
  return typeof value === 'string' ? value : fallback;
}
