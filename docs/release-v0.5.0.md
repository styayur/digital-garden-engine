# Rhizomaybor v0.5.0 Release Notes

Rhizomaybor turns the former Digital Garden Engine into a reusable visual website-building guide with a shared project model, static online editor, Tauri desktop shell and genuine 7z export.

## Highlights

- Versioned `SiteProject` schema and explicit migrations.
- Static `/editor/` visual editor for GitHub Pages.
- Click-to-edit titles, navigation labels, cards, images, buttons and rich content.
- Registry-constrained component palette and layouts.
- Drag-and-drop ordering for components, sections and cards.
- MarkText-style Markdown/MDX editing through Muya.
- HTML-aware editing with source and isolated preview modes.
- Undo, redo, autosave, recovery, dirty-state tracking and change summaries.
- Shared standalone static website renderer.
- Editable-project and publishable-website 7z archives with SHA-256 manifests.
- Tauri desktop app with local project directory save/load and build output.

## Release artifacts

- Windows installer: `Rhizomaybor_0.5.0_x64-setup.exe`
- Editable project archive: `*-project-*.7z`
- Publishable website archive: `*-website-*.7z`
- Combined checksums: `rhizomaybor-0.5.0-sha256sums.txt`
- Export manifests: `rhizomaybor-project-manifest.json`, `rhizomaybor-website-manifest.json`

## Verification

The implementation was tested with TypeScript, Node test runner, Vitest, Playwright, independent 7-Zip extraction, static artifact audits and Rust filesystem tests. See [test-report.md](test-report.md).

## Known limitations

- No MDX component execution in standalone website export.
- No unrestricted DOM/CSS/HTML editing.
- No direct GitHub repository writes from the static editor.
- No code signing certificate is included.
- GitHub Pages deployment depends on repository Pages settings.
- Unsupported HTML is preserved for source editing rather than guaranteed to render identically.

## Upgrade path

See [migration.md](migration.md). Existing Markdown/MDX content and publication-boundary commands remain supported.
