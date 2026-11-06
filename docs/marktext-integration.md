# MarkText and Muya integration

## Investigation

MarkText is an Electron application with a Vue 3 desktop interface and a TypeScript/JavaScript editor engine named Muya. Its license is MIT. Muya is distributed as a standalone browser library under `@muyajs/core` and is explicitly designed to be embedded in web hosts.

Rhizomaybor therefore does not embed the MarkText desktop application. It uses Muya as the MarkText-compatible visual Markdown engine, while retaining its own project model, component registry, publication controls and export pipeline.

## Integration

- `@muyajs/core` is loaded dynamically only when visual Markdown/MDX editing starts.
- The project still stores the original Markdown/MDX string.
- Pending edits are flushed before reading `getMarkdown()`.
- Source and isolated preview modes remain available.
- Muya failures show a fallback notice and do not modify the document.

## Why not convert all HTML to Markdown?

Markdown cannot represent every HTML structure or attribute. Converting an arbitrary HTML document would silently discard information.

HTML documents therefore use:

- an HTML-aware visual mode for supported safe structures;
- source mode for exact arbitrary HTML editing;
- an isolated, sanitized preview.

Unknown elements and attributes are analyzed and reported. The document’s `format` and `sourceFormat` remain `html`.

## Security

- Preview iframes use a sandbox with no script permission.
- DOMPurify sanitizes browser preview HTML.
- The Node renderer uses sanitize-html with matching safe tag and attribute policy.
- Scripts and event-handler attributes are removed from rendered output.
- Original source remains available only in the editor’s source mode.

## Limitations

Muya’s own documentation notes that its API may change between minor versions. Rhizomaybor pins a compatible version and covers visual startup, source preservation and preview mode with Playwright. A future Muya upgrade requires rerunning those tests and reviewing release notes.
