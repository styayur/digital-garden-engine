# Private Content Repository

The recommended setup separates the public engine from private source material.

## Required files

```text
content/
├── published/
│   ├── posts/
│   ├── projects/
│   ├── library/
│   └── assets/
├── drafts/
└── private/
site.config.ts
engine.lock.json
.github/workflows/deploy.yml
```

`published/` is the only directory that can enter a public build. `drafts/` and `private/` remain available to local tooling and validation but never become Next.js build input.

## Engine pinning

Example `engine.lock.json`:

```json
{
  "repository": "styayur/digital-garden-engine",
  "ref": "v0.1.0"
}
```

Do not use `main` as the production pin. Select an exact tag or commit SHA, build locally, commit the lock change, and then deploy.

## CI flow

1. Check out the private content repository.
2. Read `engine.lock.json`.
3. Check out the public engine at the pinned ref into `engine/`.
4. Run `npm ci` inside the engine checkout.
5. Copy `site.config.ts` into the engine checkout.
6. Set `DIGITAL_GARDEN_SOURCE_ROOT` to the private repository root.
7. Run `npm run build:public`.
8. Deploy `engine/out` to Cloudflare Pages.

The workflow belongs to the private repository. Cloudflare receives only `out/`; it does not receive the private repository.
