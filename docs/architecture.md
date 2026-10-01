# Architecture

The engine is deliberately split into two boundaries:

```text
content source
    │
    ▼
content:validate
    │
    ▼
content:stage
    │
    ▼
.build/public-content
    │
    ▼
Next.js static export
    │
    ▼
artifact:audit
    │
    ▼
out/
```

The publication gate reads only `published/` when producing the public build. The normal `content/` directory is never passed directly to Next.js for a public deployment.

## Public engine + private content

A private content repository stores `content/`, `site.config.ts` and `engine.lock.json`. CI checks out a pinned public engine revision, copies the private configuration into that checkout, and runs the same commands a local user runs.

The content repository is not a dependency of the engine. The engine remains useful by itself because `examples/content/` contains a complete fictional demo.

## Defense in depth

1. The directory boundary admits only `published/` into staging.
2. Frontmatter must say `status: published` for an entry to pass the gate.
3. The public build temporarily excludes `app/admin` and `app/api`.
4. Artifact auditing scans the generated `out/` directory for forbidden canaries, private fingerprints, secrets, admin routes and source maps.

A failure at any layer stops deployment.
