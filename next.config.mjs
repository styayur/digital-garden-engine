/**
 * Production builds use the public publication gate through
 * `npm run build:public`. That command stages only published content,
 * temporarily excludes /admin and /api, and emits a static `out/` directory.
 *
 * `npm run build` keeps the full private development surface, including
 * /admin and route handlers. It is not the deployment target for Cloudflare.
 */

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
