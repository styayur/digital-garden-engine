# Content Schema

Every Markdown or MDX entry must have frontmatter. Unknown publication states fail closed.

## Common fields

```yaml
title: "Example Essay"
slug: "example-essay"
date: "2026-10-01"
status: "published"
description: "A short description."
tags:
  - engineering
```

Allowed `status` values:

```text
published
draft
private
```

`published` entries must be in `published/`. A `status: published` entry inside `drafts/` is rejected. A draft status inside `published/` is also rejected.

## Directory structure

```text
content/
├── published/
│   ├── posts/
│   ├── projects/
│   ├── library/
│   └── assets/
├── drafts/
└── private/
```

Assets referenced as `/garden-assets/file.svg` must exist in the matching status's `assets/` directory. Only published assets are copied into a public artifact.

## Posts

Optional `maturity` values are `seedling`, `budding` and `evergreen`. The publication `status` is separate from maturity.

## Projects

Projects require `name`, `year`, `projectStatus`, `category`, `featured`, `priority`, `stack` and `links`.

- Publication `status` (`published` | `draft` | `private`) controls the publication gate and is separate from lifecycle.
- `projectStatus` (lifecycle) must be one of: `stable`, `beta`, `research`, `experimental`, `maintenance`.
- `category` must be one of: `systems`, `knowledge`, `creative`, `education`, `humanities`, `experiments`, `utilities`, `concepts`.
- `featured` must be a boolean; `priority` must be an integer.
- Optional `github`, `live`, `release` must be valid `https://` URLs.
- Optional `image` must be a `/garden-assets/...` path that exists under `published/assets/`.

## Library

Library entries require `kind`: `book`, `note` or `quote`. Books require `readingStatus`: `reading`, `queued` or `read`.
