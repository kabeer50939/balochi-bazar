/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // All /api/* requests are handled by apps/web/src/app/api/[...path]/route.ts
  // which proxies them server-side to balochi-bazar-backend.vercel.app — no CORS needed.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'balochi-bazar-backend.vercel.app',
      },
    ],
  },
};

export default nextConfig;
