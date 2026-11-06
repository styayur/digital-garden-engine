# Project Schema

Rhizomaybor v0.5.0 uses `schemaVersion: "0.5.0"`.

The canonical file is `rhizomaybor.project.json`. The desktop shell also stores a copy at `.rhizomaybor/project.json`.

## Top-level SiteProject

```ts
type SiteProject = {
  schemaVersion: string;
  projectVersion: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  status: 'published' | 'draft' | 'private';
  createdAt: string;
  updatedAt: string;
  config: SiteConfig;
  theme: Theme;
  navigation: Navigation;
  pages: Page[];
  contentDocuments: ContentDocument[];
  assets: Asset[];
  contentRefs: ContentDocumentRef[];
  migrations: string[];
  metadata: Record<string, unknown>;
};
```

Objects use open schemas. Unknown fields survive validation and round-trip operations.

## IDs

Stable IDs:

- start with a lowercase letter;
- contain lowercase letters, numbers, `_` or `-`;
- are 3–96 characters long;
- are unique within their relevant inventory.

Adding or editing items preserves existing IDs. Moving an item never changes its ID.

## ComponentProperty

A property wraps a value explicitly:

```json
{
  "id": "prop-title",
  "key": "title",
  "type": "text",
  "value": "A place for ideas",
  "label": "Title",
  "preserveUnknown": true
}
```

Supported property types:

- `text`
- `rich-text`
- `html`
- `image`
- `link`
- `boolean`
- `number`
- `select`
- `color`
- `card-list`
- `json`

The wrapper prevents an editor from confusing content with layout or theme state and makes unsupported values preservable.

## Publication status

`published`, `draft` and `private` apply to projects, pages, sections, content documents and assets.

Website export emits only published data. Editable project export retains all statuses.

## ContentDocument

```ts
type ContentDocument = {
  id: string;
  kind: 'page' | 'post' | 'project' | 'library' | 'about' | 'custom';
  slug: string;
  title: string;
  description: string;
  date?: string;
  updatedAt?: string;
  tags: string[];
  status: PublicationStatus;
  format: 'markdown' | 'mdx' | 'html';
  body: string;
  sourceFormat?: 'markdown' | 'mdx' | 'html';
  unsupportedHtml: string[];
  metadata: Record<string, unknown>;
};
```

`format` and `sourceFormat` are explicit. HTML is not silently converted to Markdown. `unsupportedHtml` records structures that should remain available in source editing.

## Theme boundaries

Theme editing is intentionally bounded:

- colors must be six-digit hex values;
- heading/body families are `serif`, `sans` or `mono`;
- scale is `compact`, `balanced` or `expressive`;
- spacing is `compact`, `cozy` or `spacious`;
- radius is `none`, `soft` or `round`;
- content width is `narrow`, `regular` or `wide`.

## Validation

Run:

```bash
npm run project:validate -- --project examples/project/rhizomaybor.project.json
```

Validation is shared by import, editor export and the CLI generator. Encoding tests cover unknown-field retention and migration behavior.
