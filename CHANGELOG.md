# Changelog

All notable changes are documented here. The project follows Semantic Versioning while it is pre-1.0.

## [0.5.0] - 2026-11-06

### Added

- Renamed the project and repository identity to Rhizomaybor.
- Added a versioned shared `SiteProject` model with explicit schema migration.
- Added the static `/editor/` visual editing experience.
- Added click-to-edit component and navigation inspection.
- Added constrained drag-and-drop ordering for components, sections and cards.
- Added registry-driven component palettes, layout variants and bounded theme controls.
- Added MarkText-compatible Markdown/MDX visual editing through Muya.
- Added HTML-aware visual editing with source and isolated preview modes.
- Added HTML round-trip preservation checks and unsupported-structure reporting.
- Added autosave, recovery, dirty-state tracking, undo and redo.
- Added project import validation and change summaries.
- Added a standalone static website generator driven by the shared project model.
- Added editable-project and publishable-website 7z archive modes.
- Added manifest generation with SHA-256 inventories.
- Added a Tauri 2 desktop shell with local directory save/load and static build output.
- Added unit, archive round-trip and Playwright browser workflows.
- Added GitHub Pages subpath deployment and testing.

### Changed

- Updated Next.js, React, Framer Motion, PostCSS, Wrangler, Node type definitions and GitHub Actions dependencies.
- Preserved the legacy Markdown/MDX content publication gate.
- Replaced the archived-engine documentation with active product, user, migration and release documentation.

### Security

- Added script-free sandboxed previews for rich content.
- Added browser and Node HTML sanitization policies.
- Added secret-shaped value detection to project export validation.
- Kept draft/private project records outside publishable website archives.

## [0.1.3] - 2026-10-01

### Changed

- Raised the minimum Node.js version to 22 to match the current Wrangler runtime requirement.
- Updated CI and Cloudflare deployment workflows to Node.js 22.
## [0.1.2] - 2026-10-01

### Changed

- Aligned package metadata and the documented private-content engine pin.

## [0.1.1] - 2026-10-01

### Changed

- Updated GitHub Actions runtimes to current major versions.

## [0.1.0] - 2026-10-01

### Added

- Clean public engine with generic demo identity.
- Content contract for published, draft and private entries.
- Publication validation and staging gate.
- Public static build that excludes admin and API routes.
- Artifact leak audit with secret, source-map, admin and private-fingerprint checks.
- Publication-boundary regression fixtures and tests.
- Cloudflare Pages Direct Upload deployment guidance.
- English and Simplified Chinese READMEs.
