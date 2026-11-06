# Migration Guide

## From Digital Garden Engine content

The legacy content contract remains supported. To convert example content into the shared project model:

```bash
npm run project:migrate -- --source examples/content --output examples/project/rhizomaybor.project.json
```

By default the generated example project includes published records only. To include drafts and private records in a local editable project:

```bash
npm run project:migrate -- --include-unpublished
```

The generated project contains:

- pages derived from the existing site structure;
- content documents from Markdown and MDX files;
- format metadata;
- an HTML About document that demonstrates round-trip preservation;
- the current theme and navigation as editable model records;
- embedded public assets.

## Legacy directory contract

Published content remains under:

```text
content/
├── published/
├── drafts/
└── private/
```

Only `published/` enters the public build, and frontmatter status must agree with the directory.

The existing content contract is documented in [content-schema.md](content-schema.md).

## Schema migration

Projects declare `schemaVersion`. The current migration path is:

```text
0.1.0 → 0.5.0
```

Unsupported newer schema versions fail closed. Migration preserves unknown fields through open objects and records applied steps in `migrations`.

## Moving from `digital-garden-engine`

The repository is now `rhizomaybor`.

- package name: `rhizomaybor`
- version line: `0.5.0`
- editor route: `/editor/`
- project file: `rhizomaybor.project.json`
- desktop project copy: `.rhizomaybor/project.json`
- legacy content commands: unchanged where documented

Update old clone URLs:

```bash
git remote set-url origin https://github.com/styayur/rhizomaybor.git
```

## Preserve user changes

When migrating an existing site:

1. work on a branch;
2. back up content and configuration;
3. run the legacy content validation and publication tests;
4. run migration into a separate output file;
5. inspect generated page and document IDs;
6. validate the project;
7. export an editable project archive;
8. extract it with an independent 7z tool;
9. rebuild the static site;
10. compare navigation, assets and publication boundaries.
