# User Guide

## Open the editor

Online:

```bash
npm run dev
```

Open `http://localhost:3000/editor/`.

The initial project is the generated Rhizomaybor demo. Use **Import** to open a project JSON or project `.7z` archive.

## Select and edit

Click a title, paragraph, card, image, button or navigation label in the live preview. The inspector opens the registered properties for that component.

The preview does not become the project. Selection attaches model IDs to rendered elements; edits update the `SiteProject` JSON.

## Edit rich content

Use **Content** in the left sidebar to open a content document, or select a rich-text component and choose **Edit rich content**.

Three modes are available:

- **Visual** — direct rendered editing through Muya for Markdown/MDX, or HTML-aware contentEditable for HTML;
- **Source** — original Markdown, MDX or HTML source;
- **Preview** — script-free isolated preview.

Unknown HTML is reported before visual editing. Source mode remains the authoritative fallback for structures that should not be converted.

## Layout editing

Select a section to change its permitted layout and variant. Components offered in the palette are filtered from the registry using the current layout.

Drag components inside a section to reorder them. Drag cards inside a card grid to reorder cards. Cross-section component drops are rejected when the target layout does not support the component.

## Theme editing

The inspector’s **Theme** tab exposes bounded values:

- colors;
- heading and body font families;
- type scale;
- spacing;
- corner radius.

These are model values, not arbitrary CSS overrides.

## Responsive preview

Use the Desktop, Tablet and Mobile controls above the preview. The preview iframe changes width without changing the persistent layout model.

## Undo, redo and save

- `Ctrl/Cmd+Z`: undo
- `Ctrl/Cmd+Shift+Z` or `Ctrl+Y`: redo
- `Ctrl/Cmd+S`: save

Browser save downloads project JSON. Desktop save writes to the selected project directory.

The header shows dirty state and last autosave time. Browser autosave and recovery records are stored locally in the browser.

## Import and export

**Import** accepts:

- a `.json` SiteProject;
- a genuine `.7z` editable project archive containing `rhizomaybor.project.json`.

**Export .7z** offers:

- editable project archive;
- publishable website archive.

Both are validated before creation. The publishable archive omits draft/private pages, sections, documents and assets.

## Keyboard and mouse guidance

- Click: select a supported item.
- Drag: reorder within supported containers.
- Undo/Redo: restore model history.
- Preview: open a standalone browser preview of the current page.
- Build: desktop mode writes generated site files into `dist/` beneath the selected project directory.
