const requestedBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim();
const basePath = requestedBasePath && requestedBasePath !== '/'
  ? `/${requestedBasePath.replace(/^\/+|\/+$/g, '')}`
  : '';
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  ...(isStaticExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
