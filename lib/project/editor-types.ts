export type EditorSelection =
  | { kind: 'page'; pageId: string }
  | { kind: 'section'; pageId: string; sectionId: string }
  | { kind: 'component'; pageId: string; sectionId: string; componentId: string }
  | { kind: 'navigation'; navigationItemId: string }
  | { kind: 'document'; documentId: string }
  | { kind: 'theme' }
  | { kind: 'none' };

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
