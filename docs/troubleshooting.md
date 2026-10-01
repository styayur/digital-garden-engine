# Troubleshooting

## `npm` is not recognised

Install Node.js 20.9 or newer and reopen the terminal. Check with `node --version` and `npm --version`.

## Node version is too old

Upgrade to Node.js 20.9 or newer. Node 22 or 24 LTS is also suitable.

## `npm install` fails

Delete `node_modules`, run `npm cache verify`, then run `npm install` again. Use `npm ci` for reproducible installs.

## Port 3000 is already in use

Stop the other process or run `npm run dev -- --port 3001`.

## An article does not appear

Check that its `status` matches its directory, the slug matches the filename, and `npm run content:validate` passes.

## Duplicate slug

Two entries in the same content kind have the same slug. Rename one file and update its frontmatter.

## Invalid frontmatter

Read the validator output and add the missing field. Dates use `YYYY-MM-DD`.

## Broken links

Run `npm run check:links` after `npm run build:public`. Fix the source link in the content file.

## Image missing

Place the file in the matching status's `assets/` directory and reference it as `/garden-assets/...`.

## Cloudflare deployment fails

Confirm `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` exist in the private repository, the token has Pages Edit permission, and the project name matches.

## Wrangler authentication fails

For local use, run `npx wrangler login`. In CI, verify the two Cloudflare secrets rather than using interactive login.

## GitHub Actions secret missing

Add the missing repository secret in the private content repository. Never print its value in logs.

## Site builds locally but CI fails

Check the Node version, commit of the pinned engine, and that the content repository path is passed through `DIGITAL_GARDEN_SOURCE_ROOT`.

## `/admin` appears in a public build

Run through `npm run build:public`, not `npm run build`. Inspect `out/` and run `npm run artifact:audit`.

## A draft accidentally appears

Stop deployment. Run `npm run content:validate`, inspect the draft canary output and fix the directory or status mismatch before retrying.

## 404 after static export

Keep trailing slashes enabled for static hosting or configure the host to resolve extensionless routes.

## CSS or assets are missing

Rebuild with `npm run build:public` and deploy the entire `out/` directory, including `_next/` and `.nojekyll`.

## Custom domain does not work

Wait for DNS propagation, verify the CNAME/A records requested by Cloudflare, and check the custom-domain status inside the Pages project.
