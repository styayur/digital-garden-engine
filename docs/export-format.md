# Export Format

Rhizomaybor provides two genuine 7z archive modes.

## Common requirements

- actual 7z container format;
- `export-manifest.json` at the archive root;
- manifest version `1.0.0`;
- project version;
- schema version;
- archive mode;
- creation timestamp;
- build information;
- file inventory;
- byte sizes;
- SHA-256 checksums;
- excluded publication records where applicable.

## Editable project archive

Root files include:

```text
rhizomaybor.project.json
README.txt
assets/...
export-manifest.json
```

All publication statuses and original source formats remain in the project JSON. This is the archive to import into Rhizomaybor later.

This archive is not intended for direct public deployment.

## Publishable website archive

Root files include:

```text
index.html
404.html
.nojekyll
writing/.../index.html
projects/.../index.html
library/.../index.html
about/index.html
assets/site.css
assets/site.js
assets/... (published embedded assets)
export-manifest.json
```

Only published pages, sections, documents and assets are emitted. Draft and private records appear only as manifest `excluded` entries.

## Verification

The test suite:

1. creates both modes;
2. checks the 7z file signature;
3. extracts with an independently installed 7z-compatible binary;
4. verifies the manifest exists;
5. verifies every manifest inventory path exists;
6. checks that `index.html` exists for website mode;
7. rebuilds a website from an extracted editable project;
8. checks draft/private canaries are absent from website export.

Manual verification:

```bash
npm run export:project
npm run verify:7z -- release-samples/<archive>.7z project
npm run export:website
npm run verify:7z -- release-samples/<archive>.7z website
```

## Why not rename a ZIP?

The archive bytes begin with the 7z signature:

```text
37 7A BC AF 27 1C
```

Tests assert this signature. ZIP output is not accepted as a substitute.
