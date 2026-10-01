# Cloudflare Pages Deployment

This project uses Cloudflare Pages Direct Upload. The production artifact is the static `out/` directory.

## 1. Create a Cloudflare account

Sign in at https://dash.cloudflare.com/. A free account is sufficient for Pages.

## 2. Find the Account ID

In the Cloudflare dashboard, open **Workers & Pages** and copy the account ID shown in the account/account-details area. Store it as a GitHub Actions secret named `CLOUDFLARE_ACCOUNT_ID`.

## 3. Create a least-privilege API token

In Cloudflare, open **My Profile → API Tokens → Create Token → Custom token**.

Set:

- Permissions: **Account → Cloudflare Pages → Edit**
- Account resources: include only the account that owns the Pages project
- Zone resources: none, unless you later need a separate DNS integration

Store the token as the GitHub Actions secret `CLOUDFLARE_API_TOKEN`. Do not use a Global API Key.

## 4. Create the Pages project

With Wrangler authenticated locally:

```bash
npx wrangler pages project create styayur-digital-garden --production-branch main
```

The private workflow can also create the project when the token has Pages Edit permission.

## 5. Configure GitHub Actions

In the private content repository, open **Settings → Secrets and variables → Actions**.

Add repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Optionally add a repository variable named `CLOUDFLARE_PAGES_PROJECT`. If omitted, the workflow uses `styayur-digital-garden`.

## 6. Deploy

Push to `main` or run the deploy workflow manually. The workflow builds and deploys `engine/out` with the current Wrangler command:

```bash
npx wrangler pages deploy out \
  --project-name=styayur-digital-garden \
  --branch=main
```

## 7. Find the production URL

Open **Cloudflare Dashboard → Workers & Pages → styayur-digital-garden**. The production URL normally looks like:

```text
https://styayur-digital-garden.pages.dev
```

## 8. Custom domain

Add a custom domain only after the `.pages.dev` deployment passes smoke tests. Follow **Workers & Pages → project → Custom domains → Set up a custom domain**.

## 9. Rollback

Cloudflare keeps deployment history. Open the project's **Deployments** tab, select a previous successful production deployment and choose **Rollback**. The previous static artifact becomes live without rebuilding with the current source.
