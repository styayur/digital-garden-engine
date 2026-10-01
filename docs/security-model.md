# Security Model

## Never commit

Do not commit:

- `.env.local`
- API tokens
- passwords
- private keys
- private content
- personal credentials

`NEXT_PUBLIC_*` values are compiled into client-visible output. They are never suitable for secrets.

## Publication gate

The public build accepts only `content/published/`. Frontmatter must also say `status: published`. Unknown statuses fail the build instead of defaulting to public.

## Admin separation

`npm run dev` and `npm run build` may include `/admin` and `/api` for local or private environments. `npm run build:public` temporarily excludes those route directories and creates a static artifact without them.

## Artifact auditing

`npm run artifact:audit` scans `out/` for:

- public/draft/private canaries
- draft and private fingerprints
- common GitHub, OpenAI, AWS and Cloudflare-style secrets
- local absolute paths
- admin and API routes
- `.env` files
- unexpected source maps

A failed audit stops deployment.

## Git history warning

Deleting a file from the latest commit does not remove it from Git history. A repository that ever contained private material should not simply be made public. Create a new public engine repository with a clean history.
