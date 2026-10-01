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

Projects require `name`, `year`, `projectStatus`, `featured`, `stack` and `links`. Valid project states are `Building`, `Live`, `Prototype`, `Paused` and `Archived`.

## Library

Library entries require `kind`: `book`, `note` or `quote`. Books require `readingStatus`: `reading`, `queued` or `read`.
